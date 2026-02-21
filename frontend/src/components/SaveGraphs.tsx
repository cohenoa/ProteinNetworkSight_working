import React, { useEffect, useState, useImperativeHandle, forwardRef, useRef, useCallback, useMemo } from "react";
import { useStateMachine } from "little-state-machine";
import { updateIsLoading, updateShowError } from "../common/UpdateActions";
import { get, getMany, setMany } from 'idb-keyval';
import { makePostRequest } from "../common/PostRequest";
import WindowedSelect from "react-windowed-select";
import { ICustomAllGraphData, ICustomGraphData } from "../@types/graphs";
import CytoscapejsComponentself from "../components/Cytoscapejs";
import "../styles/SaveGraphs.css";
import { graphRef } from "../@types/props";
import { GraphSettings, GraphsStatus, SupportedLayout, getWindowSelectItem } from "../common/GraphSettings";
import LoadingComponent from "./Loading";
import { copySettings, baseDownloadAllGraphSetting, supportedSettings, getWindowSelectItemByValue } from "../common/GraphSettings";
import {
  INamesStringMap,
  threshMap,
} from "../@types/global";
import JSZip from "jszip";
import { time } from "console";
import { use } from "cytoscape";
import LoadingBarComponent from "./LoadingBar";

type FileEntry = {
  filename: string;
  blob: Blob;
};


enum BuildPhase {
  IDLE,
  APPLY_SETTINGS,
  APPLY_POS_COLOR,
  APPLY_NEG_COLOR,
  APPLY_OPACITY,
  APPLY_NODE_SIZE,
  APPLY_POSITIONS,
  WAIT_FOR_LAYOUT,
  SAVE
}

const presetOption = getWindowSelectItem('layouts', 'PRESET');

const SaveGraphs = forwardRef((props, ref) => {
    const { state, actions } = useStateMachine({
        updateIsLoading,
        updateShowError,
    });

    const [applyAllStatus, setApplyAllStatus] = useState<GraphSettings>(copySettings(baseDownloadAllGraphSetting, false));
    const [graphsStatus, setGraphsStatus] = useState<GraphsStatus>({});
    const [usePresetWhenPossible, setUsePresetWhenPossible] = useState<boolean>(false);

    const [currGraphBuildIdx, setCurrGraphBuildIdx] = useState<number | null>(null);
    const [currGraphData, setCurrGraphData] = useState<ICustomGraphData | null>(null);
    const [currGraphRef, setCurrGraphRef] = useState<graphRef>();
    const [lastCalled, setLastCalled] = useState<{time: number, phase: BuildPhase}>({time: 0, phase: BuildPhase.IDLE});

    const graphIdxRef = useRef<number>(0);
    const phaseRef = useRef<BuildPhase>(BuildPhase.IDLE);
    const numApplyedRef = useRef<number>(0);

    // const [blobs, setBlobs] = useState<(Blob | null)[]>([]);
    const blobsRef = useRef<(Blob | null)[]>([]);

    const getData = async () => {
        let newGraphStatus: GraphsStatus = {};

        for (const header of state.vectorsHeaders) {
            let graphLayout = await get(header + "_layout");
            if (graphLayout) {
                console.log("found layout for " + header + " in memory");
                newGraphStatus[header] = copySettings(baseDownloadAllGraphSetting, true);
                if (graphLayout.layout === supportedSettings.layouts.PRESET) {
                    newGraphStatus[header].Layout.options.push(presetOption);
                }

                const layoutOption = getWindowSelectItemByValue('layouts', graphLayout.layout);
                const nodeSizeOption = getWindowSelectItemByValue('nodeSizes', graphLayout.nodeSize);
                const opacityOption = getWindowSelectItemByValue('opacities', graphLayout.opacity);
                const posNodeColorOption = getWindowSelectItemByValue('nodeColors', graphLayout.color.pos);
                const negNodeColorOption = getWindowSelectItemByValue('nodeColors', graphLayout.color.neg);

                newGraphStatus[header].Layout.current = layoutOption || newGraphStatus[header].Layout.default;
                newGraphStatus[header].NodeSize.current = nodeSizeOption || newGraphStatus[header].NodeSize.default;
                newGraphStatus[header].Opacity.current = opacityOption || newGraphStatus[header].Opacity.default;
                newGraphStatus[header].PosNodeColor.current = posNodeColorOption || newGraphStatus[header].PosNodeColor.default;
                newGraphStatus[header].NegNodeColor.current = negNodeColorOption || newGraphStatus[header].NegNodeColor.default;
            }
            else{
                console.log("no layout for " + header + " in memory");
                newGraphStatus[header] = copySettings(baseDownloadAllGraphSetting, false);
                newGraphStatus[header].Layout.current = newGraphStatus[header].Layout.default;
                newGraphStatus[header].NodeSize.current = newGraphStatus[header].NodeSize.default;
                newGraphStatus[header].Opacity.current = newGraphStatus[header].Opacity.default;
                newGraphStatus[header].PosNodeColor.current = newGraphStatus[header].PosNodeColor.default;
                newGraphStatus[header].NegNodeColor.current = newGraphStatus[header].NegNodeColor.default;
            }
            newGraphStatus[header].fileType.current = newGraphStatus[header].fileType.default;
        }

        console.log(newGraphStatus);
        console.log(applyAllStatus);

        setGraphsStatus(newGraphStatus);
    }

    useImperativeHandle(ref, () => ({
        getFormData: async () => {
            actions.updateIsLoading({ isLoading: true });
            
            const [ids_arr, namesStringMap] = await getMany(["proteinsNames", "namesStringMap"]);
            const idsList: number[] = [];
            const stringNames: string[] = [];
            const orgNames: string[] = [];


            Object.entries(namesStringMap as INamesStringMap).forEach(([orgName, { stringName, stringId }]) => {
                idsList.push(stringId);
                stringNames.push(stringName);
                orgNames.push(orgName);
            });

            let body = {
                headers_data: {},
                ids: idsList,
                proteins: orgNames,
                string_names: stringNames,
                score_thresh: state.scoreThreshold,
            };

            const uncalculatedHeadersData: { [key: string]: { values_map: { [key: string]: number }; thresh_pos: number; thresh_neg: number; } } = {};
            
            const memValues = await getMany(state.vectorsHeaders.map((key) => key + "_graph"));
            memValues.forEach((val: {graphData: ICustomGraphData, thresholds: threshMap}, index) => {
                const key = state.vectorsHeaders[index];

                if (!val || !val.graphData || (val.thresholds as threshMap).pos !== state.thresholds[key].pos || (val.thresholds as threshMap).neg !== state.thresholds[key].neg) {
                    uncalculatedHeadersData[key] = {
                        values_map: {},
                        thresh_pos: state.thresholds[key].pos,
                        thresh_neg: state.thresholds[key].neg,
                    };
                }
            });

            body.headers_data = uncalculatedHeadersData;

            const uncalculatedHeaders: string[] = Object.keys(uncalculatedHeadersData);

            await getMany(uncalculatedHeaders.map((key) => key + "_data")).then((values) => {
                values.forEach((values_arr, index) => {
                    const key = uncalculatedHeaders[index].replace("_data", "");
                    const values_map: { [key: string]: number } = {};
                    for (let i = 0; i < values_arr.length; i++) {
                        values_map[ids_arr[i]] = values_arr[i];
                    }
                    uncalculatedHeadersData[key].values_map = values_map;
                })
                console.log(body);
                makePostRequest(JSON.stringify(body), "saveGraphs", handleJsonGraphData, handleError);
            })

            return "downloaded graphs";
        }
    }));

    useEffect(() => {
        getData();
    }, [])

    const finishAllGraphs = () => {
        zipBlobs(
            blobsRef.current.map((blob, i) => ({
                filename: state.vectorsHeaders[i] + "." + graphsStatus[state.vectorsHeaders[i] as keyof GraphsStatus].fileType.current?.value,
                blob: blob as Blob
            }))
        ).then((zipBlob) => {
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement("a");
            a.href = url;
            a.download = state.fileName.split(".")[0] + "_graphs.zip";
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    const buildGraph = async () => {
        const idx = graphIdxRef.current;
        const ref = currGraphRef?.current;

        console.log("layout stop", {
            refidx: idx,
            stateIdx: currGraphBuildIdx,
            ref: ref,
            time: performance.now()
        });

        if (!ref) {
            setTimeout(() => {
                console.log("what about now?", {
                    refidx: graphIdxRef.current,
                    stateIdx: currGraphBuildIdx,
                    ref: currGraphRef?.current,
                    time: performance.now()
                })
                if (!currGraphRef?.current) return;
                currGraphRef.current.layoutRender();
            }, 1000)
            return;
        };

        if (currGraphBuildIdx !== idx){
            return;
        }

        const thisGraph = graphsStatus[state.vectorsHeaders[idx] as keyof GraphsStatus];
        console.log("header", state.vectorsHeaders[idx])
        console.log("thisGraph", thisGraph);
        switch (phaseRef.current) {

            case BuildPhase.APPLY_SETTINGS: {
                console.log("APPLY_SETTINGS", idx);
                numApplyedRef.current = 0;
                phaseRef.current = BuildPhase.APPLY_POS_COLOR;
                ref.layoutRender();
                return;
            }

            case BuildPhase.APPLY_POS_COLOR: {
                console.log("APPLY_POS_COLOR", idx);
                ref.applyNodeColor('pos', thisGraph.PosNodeColor.current?.value);
                phaseRef.current = BuildPhase.APPLY_NEG_COLOR;
                ref.layoutRender();
                return;
            }

            case BuildPhase.APPLY_NEG_COLOR: {
                console.log("APPLY_NEG_COLOR", idx);
                ref.applyNodeColor('neg', thisGraph.NegNodeColor.current?.value);
                phaseRef.current = BuildPhase.APPLY_OPACITY;
                ref.layoutRender();
                return;
            }

            case BuildPhase.APPLY_OPACITY: {
                console.log("APPLY_OPACITY", idx);
                ref.applyOpacity(thisGraph.Opacity.current?.value);
                phaseRef.current = BuildPhase.APPLY_NODE_SIZE;
                ref.layoutRender();
                return;
            }

            case BuildPhase.APPLY_NODE_SIZE: {
                console.log("APPLY_NODE_SIZE", idx);
                const forceRender = thisGraph.NodeSize.current?.value === thisGraph.NodeSize.default?.value;
                console.log("forceRender", forceRender);
                ref.applyNodeSize(thisGraph.NodeSize.current?.value);
                phaseRef.current = BuildPhase.APPLY_POSITIONS;
                if (forceRender) {
                    console.log("force render");
                    ref.layoutRender();
                }
                return;
            }

            case BuildPhase.APPLY_POSITIONS: {
                console.log("APPLY_POSITIONS", idx);
                ref.applyLayout(thisGraph.Layout.current?.value, false);
                phaseRef.current = BuildPhase.WAIT_FOR_LAYOUT;
                return;
            }

            case BuildPhase.WAIT_FOR_LAYOUT: {
                console.log("WAIT_FOR_LAYOUT", idx);
                console.log("WAIT_FOR_LAYOUT", {
                    refidx: idx,
                    numApplyWait: numApplyedRef.current,
                });
                
                if (numApplyedRef.current > 0) {
                    numApplyedRef.current -= 1;
                }
                else{
                    console.log("Next step: save");
                    phaseRef.current = BuildPhase.SAVE;
                    ref.layoutRender();
                }
                return;
            }

            case BuildPhase.SAVE: {
                console.log("SAVE", {
                    refidx: idx,
                    stateIdx: currGraphBuildIdx,
                    ref: ref,
                    time: performance.now()
                });

                blobsRef.current[idx] = ref.getGraphBlob(thisGraph.fileType.current?.value);

                // Move forward
                if (idx + 1 === state.vectorsHeaders.length) {
                    finishAllGraphs();
                    phaseRef.current = BuildPhase.IDLE;
                    setCurrGraphBuildIdx(null);
                    actions.updateIsLoading({ isLoading: false });
                    return;
                }

                phaseRef.current = BuildPhase.APPLY_SETTINGS;
                graphIdxRef.current += 1;
                get(state.vectorsHeaders[graphIdxRef.current] + "_graph").then((nextData) => {
                    console.log("SET NEXT GRAPH", {
                        refidx: graphIdxRef.current,
                        stateIdx: currGraphBuildIdx,
                        ref: ref,
                        time: performance.now()
                    })
                    setCurrGraphData(nextData.graphData);
                    console.log("next graph index: ", graphIdxRef.current);
                    setCurrGraphBuildIdx(graphIdxRef.current);
                });
                return;
            }

            default:
            return;
        }
    }

    async function zipBlobs(files: FileEntry[]): Promise<Blob> {
        const zip = new JSZip();

        for (const { filename, blob } of files) {
            zip.file(filename, blob);
        }

        return zip.generateAsync({ type: "blob" });
    }


    const handleError = (err: string) => {
        console.log("error in makePostRequest", err);
        actions.updateIsLoading({ isLoading: false });
        actions.updateShowError({ showError: true });
    };

    const handleJsonGraphData = async (jsonString: string) => {
        const tempGraphData: ICustomAllGraphData = JSON.parse(jsonString);
        const setManyArray = Object.entries(tempGraphData).map(([key, value]) => [key + "_graph", {
            graphData: value as ICustomGraphData,
            thresholds: {...state.thresholds[key]} as threshMap,
        }]) as [IDBValidKey, {graphData: ICustomGraphData, thresholds: threshMap}][];
        await setMany(setManyArray);
        setCurrGraphData((await get(state.vectorsHeaders[0] + "_graph") as {graphData: ICustomGraphData, thresholds: threshMap}).graphData);
        blobsRef.current = new Array(state.vectorsHeaders.length).fill(null);
        // setBlobs(new Array(state.vectorsHeaders.length).fill(null));
        setCurrGraphRef(React.createRef<graphRef>() as graphRef);
        graphIdxRef.current = 0;
        phaseRef.current = BuildPhase.APPLY_SETTINGS;
        setCurrGraphBuildIdx(0);
    };

    const handleChangeApplyAll = (option: any, key: keyof GraphSettings) => {
        const newApplyAllStatus = copySettings(applyAllStatus, true);
        newApplyAllStatus[key].current = option;
        setApplyAllStatus(newApplyAllStatus);
    }

    const handleIndividualChange = (option: any, key: keyof GraphSettings, header: keyof GraphsStatus) => {
        console.log("inside handleIndividualChange");
        const newGraphStatus = {...graphsStatus}

        newGraphStatus[header][key].current = option;
        setGraphsStatus(newGraphStatus);
    }

    const handleApplyAllSubmit = (key: keyof GraphSettings) => {
        const newGraphStatus: GraphsStatus = {};

        Object.entries(graphsStatus).forEach(([header, item]) => {
            newGraphStatus[header] = copySettings(graphsStatus[header], false);
            if (usePresetWhenPossible && graphsStatus[header].Layout.options.includes(presetOption)){
                newGraphStatus[header].Layout.current = presetOption;

                newGraphStatus[header].NodeSize.current = graphsStatus[header].NodeSize.default;
                newGraphStatus[header].Opacity.current = graphsStatus[header].Opacity.default;
            }
            else{
                newGraphStatus[header][key].current = applyAllStatus[key].current;
            }
        })

        setGraphsStatus(newGraphStatus);
    }

    const renderApplyAllMenu = () => {
        return (
            <div className="ApplyAllMenu">
                {Object.entries(baseDownloadAllGraphSetting).map(([key, item], index) => (
                    <div className="ApplyAllMenuOption" key={"ApplyAllMenuOption-" + key}>
                        <div className="ApplyAllMenuOptiontitle">{"Apply " + item.title + " to all graphs"}</div>
                        <WindowedSelect
                            className="select"
                            onChange={(option) => {handleChangeApplyAll(option, key as keyof GraphSettings)}}
                            windowThreshold={20}
                            options={item.options}
                            styles={{
                            option: (base) => ({
                                ...base,
                                fontSize: "15px",
                            }),
                            control: (base) => ({
                                ...base,
                                fontSize: "15px",
                                hight: "50px",
                            }),
                            }}
                            id={"select-" + key}
                        />
                        <div className="ApplyAllButtonsWrapper">
                            <button className="btn btn--outline btn--medium" onClick={() => {handleApplyAllSubmit(key as keyof GraphSettings)}}>Apply</button>
                        </div>
                    </div>
                ))}
                <div className="usePresetCheckboxWrapper">
                    <input
                        type="checkbox"
                        checked={usePresetWhenPossible}
                        onChange={() => setUsePresetWhenPossible(!usePresetWhenPossible)}
                        className="usePresetCheckbox"
                    />
                    <label className="usePresetLabel">{"Use Saved when possible"}</label>
                </div>
            </div>
        )
    }

    const renderGraphsSettings = () => {
        return (
            <div className="IndividualMenu">
                {Object.entries(graphsStatus).map(([header, settings], index) => (
                    <div className="IndividualMenuOption" key={"IndividualMenuOption-" + header}>
                        <div className="IndividualMenuOptionTitle">{header + ": "}</div>
                        {Object.entries(settings as GraphSettings).map(([key, item], index) => (
                            <div className="IndividualMenuOptionItem" key={"IndividualMenuOptionItem-" + key}>
                                <div className="IndividualMenuOptionItemTitle">{item.title}</div>
                                <WindowedSelect
                                    className="select"
                                    value={item.current || item.default}
                                    onChange={(option) => handleIndividualChange(option, key as keyof GraphSettings, header as keyof GraphsStatus)}
                                    windowThreshold={20}
                                    options={item.options}
                                    defaultValue={item.current || item.default}
                                    styles={{
                                    option: (base) => ({
                                        ...base,
                                        fontSize: "15px",
                                    }),
                                    control: (base) => ({
                                        ...base,
                                        fontSize: "15px",
                                        hight: "50px",
                                    }),
                                    }}
                                    id={"select-" + key}
                                />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        )
    }

    const renderInvisibleGraph = () => {
        return (
            <div className="InvisibleComponent">
                {currGraphBuildIdx !== null && (
                    <CytoscapejsComponentself 
                        key={state.vectorsHeaders[currGraphBuildIdx]}
                        graphData={currGraphData as ICustomGraphData} 
                        clickedVector={state.vectorsHeaders[currGraphBuildIdx]}
                        alertLoading={async () => {buildGraph()}} 
                        ref={currGraphRef}
                    />
                )}
            </div>
        )
    }

    const getPercentage = () => {
        const fullBar = state.vectorsHeaders.length + 1
        if (currGraphBuildIdx === null) return 0
        return Math.round(((1 + currGraphBuildIdx) / fullBar) * 100)
    }

    const getLabel = () => {
        if (currGraphBuildIdx === null) return "getting graphs's data"
        return "Building graph " + state.vectorsHeaders[currGraphBuildIdx]
    }

    return state.isLoading ? (
        <div className="SaveGraphWrapper">
            {/* <LoadingComponent /> */}
            <LoadingBarComponent
                percent={getPercentage()} 
                label={getLabel()}
            />
            {renderInvisibleGraph()}
        </div>
    ) : (
        <div className="SaveGraphWrapper">
            {renderApplyAllMenu()}
            {renderGraphsSettings()}
        </div>
    )
});

export default SaveGraphs;