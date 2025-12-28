import React, { useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { useStateMachine } from "little-state-machine";
import { updateIsLoading, updateShowError } from "../common/UpdateActions";
import { get, getMany, keys, set } from 'idb-keyval';
import { makePostRequest } from "../common/PostRequest";
import WindowedSelect from "react-windowed-select";
import { ICustomAllGraphData, ICustomGraphData } from "../@types/graphs";
import CytoscapejsComponentself from "../components/Cytoscapejs";
import "../styles/SaveGraphs.css";
import { graphRef } from "../@types/props";
import { GraphSettings, GraphsStatus, getWindowSelectItem } from "../common/GraphSettings";
import LoadingComponent from "./Loading";
import { copySettings, baseDownloadAllGraphSetting, supportedSettings, getWindowSelectItemByValue } from "../common/GraphSettings";
import {
  INamesStringMap,
  threshMap,
} from "../@types/global";

const presetOption = getWindowSelectItem('layouts', 'PRESET');

const SaveGraphs = forwardRef((props, ref) => {
    const { state, actions } = useStateMachine({
        updateIsLoading,
        updateShowError,
    });

    const [graphRefs, setGraphRefs] = useState<graphRef[]>([]);

    const [applyAllStatus, setApplyAllStatus] = useState<GraphSettings>(copySettings(baseDownloadAllGraphSetting, false));
    const [graphsStatus, setGraphsStatus] = useState<GraphsStatus>({});
    const [usePresetWhenPossible, setUsePresetWhenPossible] = useState<boolean>(false);
    const [allGraphData, setAllGraphData] = useState<ICustomAllGraphData>({});


    const [reset, setReset] = useState<boolean>(false);
    const [completedLayouts, setCompletedLayouts] = useState(0);
    const [isBuildingGraphs, setIsBuildingGraphs] = useState(false);
    const [error, setError] = useState<boolean>(false);

    const getData = async () => {
        const val = await get(state.fileName);
        const clickedVectors = val['clicked_vectors'] || {};

        let newGraphStatus: GraphsStatus = {};

        state.vectorsHeaders.forEach(async (header: string) => {
            
            const graphLayout = await get(header + "_layout");
            if (graphLayout) {
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
                newGraphStatus[header] = copySettings(baseDownloadAllGraphSetting, false);
                newGraphStatus[header].Layout.current = newGraphStatus[header].Layout.default;
                newGraphStatus[header].NodeSize.current = newGraphStatus[header].NodeSize.default;
                newGraphStatus[header].Opacity.current = newGraphStatus[header].Opacity.default;
                newGraphStatus[header].PosNodeColor.current = newGraphStatus[header].PosNodeColor.default;
                newGraphStatus[header].NegNodeColor.current = newGraphStatus[header].NegNodeColor.default;
            }
            newGraphStatus[header].fileType.current = newGraphStatus[header].fileType.default;
            // if (header in clickedVectors) {
            //     newGraphStatus[header] = copySettings(baseDownloadAllGraphSetting, true);

            //     if (clickedVectors[header].layout === supportedSettings.layouts.PRESET) {
            //         newGraphStatus[header].Layout.options.push(presetOption);
            //     }

            //     const layoutOption = getWindowSelectItemByValue('layouts', clickedVectors[header].layout);
            //     const nodeSizeOption = getWindowSelectItemByValue('nodeSizes', clickedVectors[header].nodeSize);
            //     const opacityOption = getWindowSelectItemByValue('opacities', clickedVectors[header].opacity);
            //     const posNodeColorOption = getWindowSelectItemByValue('nodeColors', clickedVectors[header].color.pos);
            //     const negNodeColorOption = getWindowSelectItemByValue('nodeColors', clickedVectors[header].color.neg);

            //     newGraphStatus[header].Layout.current = layoutOption || newGraphStatus[header].Layout.default;
            //     newGraphStatus[header].NodeSize.current = nodeSizeOption || newGraphStatus[header].NodeSize.default;
            //     newGraphStatus[header].Opacity.current = opacityOption || newGraphStatus[header].Opacity.default;
            //     newGraphStatus[header].PosNodeColor.current = posNodeColorOption || newGraphStatus[header].PosNodeColor.default;
            //     newGraphStatus[header].NegNodeColor.current = negNodeColorOption || newGraphStatus[header].NegNodeColor.default;
            // }
            // else {
            //     newGraphStatus[header] = copySettings(baseDownloadAllGraphSetting, false);
            //     newGraphStatus[header].Layout.current = newGraphStatus[header].Layout.default;
            //     newGraphStatus[header].NodeSize.current = newGraphStatus[header].NodeSize.default;
            //     newGraphStatus[header].Opacity.current = newGraphStatus[header].Opacity.default;
            //     newGraphStatus[header].PosNodeColor.current = newGraphStatus[header].PosNodeColor.default;
            //     newGraphStatus[header].NegNodeColor.current = newGraphStatus[header].NegNodeColor.default;
            // }
            // newGraphStatus[header].fileType.current = newGraphStatus[header].fileType.default;
        });

        console.log(newGraphStatus);
        console.log(applyAllStatus);

        setGraphsStatus(newGraphStatus);
    }

    useEffect(() => {
        getData();
    }, [])

    useEffect(() => {
        console.log(graphsStatus);
    }, [graphsStatus]);

    useEffect(() => {
        console.log("reseting parameters");
        setAllGraphData({});
        setIsBuildingGraphs(false);
        setCompletedLayouts(0);
        setGraphRefs([]);
        actions.updateIsLoading({ isLoading: false });
    }, [reset])

    useEffect(() => {
        if (!isBuildingGraphs && graphRefs.length > 0) {
            console.log("in downloading phase");

            for (let i = 0; i < graphRefs.length; i += 10) {

                setTimeout((batchNum: number) => {
                    for (let i = 0; i + batchNum < graphRefs.length && i < 10; i++) {
                        let graphIdx = i + batchNum;
                        console.log("downloading graph ", graphIdx);
                        const thisGraph = graphsStatus[state.vectorsHeaders[graphIdx] as keyof GraphsStatus];
                        const thisGraphRef = (graphRefs[graphIdx] as graphRef).current;

                        if (thisGraphRef === null || !thisGraph.fileType.current) return;
            
                        thisGraphRef.downloadGraph(thisGraph.fileType.current.value);
                    }

                    if (batchNum + 10 >= graphRefs.length){
                        setReset(!reset);
                    }

                }, i * 100, i);
            }
        }
        else {
            console.log("still building graphs");
        }
    }, [isBuildingGraphs]);

    const buildGraph = (key: string, index: number) => {
        console.log("building graph " + key);
        if (graphRefs[index] && graphRefs[index].current) {
            const thisGraph = graphsStatus[key as keyof GraphsStatus];
            const thisGraphRef = (graphRefs[index] as graphRef).current;

            if (thisGraphRef === null){
                return;
            }
            else if (thisGraph.Layout.current === null || thisGraph.NodeSize.current === null || thisGraph.Opacity.current === null || thisGraph.fileType.current === null || thisGraph.PosNodeColor.current === null || thisGraph.NegNodeColor.current === null){
                console.log("graph not ready");
                console.log(thisGraph);
                return;
            }

            thisGraphRef.applyLayout(thisGraph.Layout.current.value, false);
            thisGraphRef.applyOpacity(thisGraph.Opacity.current.value);
            thisGraphRef.applyNodeSize(thisGraph.NodeSize.current.value);
            thisGraphRef.applyNodeColor('pos', thisGraph.PosNodeColor.current.value);
            thisGraphRef.applyNodeColor('neg', thisGraph.NegNodeColor.current.value);

            setCompletedLayouts((prev: number) => {
                if (prev + 1 === graphRefs.length) {
                  setIsBuildingGraphs(false);
                }
                return prev + 1;
            });
        }
        else{
            // console.log(graphRefs);
        }
    }


    const handleError = (err: string) => {
        console.log("error in makePostRequest", err);
        // setError(true);
        actions.updateIsLoading({ isLoading: false });
        actions.updateShowError({ showError: true });
    };

    const handleJsonGraphData = (jsonString: string) => {
        const tempGraphData: ICustomAllGraphData = JSON.parse(jsonString);
        // setAllGraphData(tempGraphData);
        setAllGraphData({
            ...allGraphData,
            ...tempGraphData
        })
        setIsBuildingGraphs(true);
    };

    useImperativeHandle(ref, () => ({
        getFormData: async () => {
            actions.updateIsLoading({ isLoading: true });
            setGraphRefs(Array.from({ length: Object.keys(state.vectorsHeaders).length }, (): graphRef => React.createRef<graphRef>() as graphRef));
            
            const [ids_arr, namesStringMap] = await getMany(["proteinsNames", "namesStringMap"]);
            const idsList: number[] = [];
            const stringNames: string[] = [];


            Object.entries(namesStringMap as INamesStringMap).forEach(([orgName, { stringName, stringId }]) => {
                idsList.push(stringId);
                stringNames.push(stringName);
            });

            let body = {
                headers_data: {},
                ids: idsList,
                string_names: stringNames,
                score_thresh: state.scoreThreshold,
            };

            // const calculatedGraphs = new Set((await keys()).filter((key) => String(key).endsWith("_graph")).map((key) => String(key).replace("_graph", "")));
            // console.log("calculatedGraphs", calculatedGraphs);
            // const unCalculatedGraphs = Array.from(calculatedGraphs.difference(new Set(state.vectorsHeaders))).map((key) => key + "_data");

            // // const headersData: { [key: string]: any } = {};
            // getMany(unCalculatedGraphs).then((values) => {
            //     values.forEach((values_arr, index) => {
            //         const key = unCalculatedGraphs[index].replace("_data", "");
            //         const values_map: { [key: string]: number } = {};
            //         for (let i = 0; i < values_arr.length; i++) {
            //             values_map[ids_arr[i]] = values_arr[i];
            //         }
            //         uncalculatedHeadersData[key] = {
            //             values_map: values_map,
            //             thresh_pos: state.thresholds[key].pos,
            //             thresh_neg: state.thresholds[key].neg,
            //         };
            //     })
            // })

            // Object.entries(vectorsValues).forEach(([key, value]) => {
            //     const values_arr = vectorsValues[key] || [];
            //     const ids_arr = state.proteinsNames || [];
            //     let values_map: { [key: string]: number } = {};
            //     for (let i = 0; i < values_arr.length; i++) {
            //         values_map[ids_arr[i]] = values_arr[i];
            //     }
            //     (body.headers_data as { [key: string]: any })[key] = {
            //         values_map: values_map,
            //         thresh_pos: state.thresholds[key][0],
            //         thresh_neg: state.thresholds[key][1],
            //         score_thresh: state.scoreThreshold,
            //     }
            // });

            // makePostRequest(JSON.stringify(body), "saveGraphs", handleJsonGraphData, handleError);

            const calculatedGraphData: { [key: string]: ICustomGraphData } = {};
            const uncalculatedHeadersData: { [key: string]: { values_map: { [key: string]: number }; thresh_pos: number; thresh_neg: number; } } = {};
            
            const memValues = await getMany(state.vectorsHeaders.map((key) => key + "_graph"))
            memValues.forEach((val, index) => {
                const key = state.vectorsHeaders[index];

                if (val && val.graphData && (val.thresholds as threshMap).pos === state.thresholds[key].pos && (val.thresholds as threshMap).neg === state.thresholds[key].neg) {
                    calculatedGraphData[key] = val.graphData as ICustomGraphData;
                }
                else{
                    uncalculatedHeadersData[key] = {
                        values_map: {},
                        thresh_pos: state.thresholds[key].pos,
                        thresh_neg: state.thresholds[key].neg,
                    };
                }
            });

            body.headers_data = uncalculatedHeadersData;
            console.log(calculatedGraphData);
            setAllGraphData(calculatedGraphData);

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
                {Object.entries(allGraphData).map(([key, value], index) => {
                    return (
                        <CytoscapejsComponentself 
                            key={key}
                            graphData={value as ICustomGraphData} 
                            clickedVector={key}
                            alertLoading={() => {buildGraph(key, index)}} 
                            ref={graphRefs[index]}
                        />
                    )
            })}
            </div>
        )
    }

    return state.isLoading ? (
        <div className="SaveGraphWrapper">
            <LoadingComponent />
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