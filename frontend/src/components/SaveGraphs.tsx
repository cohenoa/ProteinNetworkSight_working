import React, { useEffect, useState, useImperativeHandle, forwardRef, LegacyRef } from "react";
import { useStateMachine } from "little-state-machine";
import { updateIsLoading, updateShowError } from "../common/UpdateActions";
import { get } from 'idb-keyval';
import { makePostRequest } from "../common/PostRequest";
import WindowedSelect from "react-windowed-select";
import { ICustomAllGraphData, ICustomGraphData } from "../@types/graphs";
import CytoscapejsComponentself from "../components/Cytoscapejs";
import "../styles/SaveGraphs.css";
import { graphRef, optionItem, GraphSettings, GraphsStatus } from "../@types/props";
import LoadingComponent from "./Loading";

const copySettings = (settings: GraphSettings, fullCopy: boolean = false): GraphSettings => {
    const layoutOptions = fullCopy? [...settings.Layout.options]: settings.Layout.options;
    return {
        ...baseGraphSetting,
        Layout: {
            ...settings.Layout,
            options: layoutOptions,
        },
        NodeSize: {...settings.NodeSize},
        Opacity: {...settings.Opacity},
        fileType: {...settings.fileType},
    };
}

const baseGraphSetting: GraphSettings = {
    Layout: {
        title: "Layout",
        default: {label: "circle", value: "circle"},
        current: null,
        options: [
            { label: "random", value: "random" },
            { label: "grid", value: "grid" },
            { label: "circle", value: "circle" },
            { label: "fcose", value: "fcose" },
            { label: "elk", value: "elk" },
            { label: "cise", value: "cise" },
        ]
    },
    NodeSize: {
        title: "Node Size",
        default: {label: "1", value: 1},
        current: null,
        options: [
            { label: "0.1", value: 0.1 }, 
            { label: "0.25", value: 0.25 }, 
            { label: "0.5", value: 0.5 }, 
            { label: "1", value: 1 }, 
            { label: "1.5", value: 1.5 }, 
            { label: "3", value: 3 }, 
            { label: "5", value: 5 }, 
            { label: "10", value: 10 }
        ]
    },
    Opacity: {
        title: "Opacity",
        default: {label: "0.35", value: 0.35},
        current: null,
        options: [
            { label: "0.05", value: 0.05 }, 
            { label: "0.2", value: 0.2 }, 
            { label: "0.35", value: 0.35 }, 
            { label: "0.5", value: 0.5 }, 
            { label: "0.75", value: 0.75 }, 
            { label: "0.9", value: 0.9 }
        ]
    },
    fileType: {
        title: "File Type",
        default: { label: "png", value: "png" },
        current: null,
        options: [
            { label: "svg", value: "svg" }, 
            { label: "png", value: "png" }, 
            { label: "json", value: "json" }
        ]
    }
}

const presetOption: optionItem = {label: "preset", value: "preset"}



const SaveGraphs = forwardRef((props, ref) => {
    const { state, actions } = useStateMachine({
        updateIsLoading,
        updateShowError,
    });

    const [graphRefs, setGraphRefs] = useState<graphRef[]>([]);

    const [applyAllStatus, setApplyAllStatus] = useState<GraphSettings>(copySettings(baseGraphSetting, false));
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

        state.vectorsHeaders.forEach((header: string) => {
            
            if (header in clickedVectors) {    
                newGraphStatus[header] = copySettings(baseGraphSetting, true);

                newGraphStatus[header].Layout.options.push(presetOption);
                newGraphStatus[header].Layout.current = presetOption;
                newGraphStatus[header].Layout.default = presetOption;

                const nodeSizeOption = {label: String(clickedVectors[header].nodeSize), value: Number(clickedVectors[header].nodeSize)};
                const opacityOption = {label: String(clickedVectors[header].opacity), value: Number(clickedVectors[header].opacity)};

                newGraphStatus[header].NodeSize.current = nodeSizeOption;
                newGraphStatus[header].NodeSize.default = nodeSizeOption;

                newGraphStatus[header].Opacity.current = opacityOption;
                newGraphStatus[header].Opacity.default = opacityOption;

                newGraphStatus[header].fileType.current = newGraphStatus[header].fileType.default
            }
            else {
                newGraphStatus[header] = copySettings(baseGraphSetting, false);
                newGraphStatus[header].Layout.current = newGraphStatus[header].Layout.default;
                newGraphStatus[header].NodeSize.current = newGraphStatus[header].NodeSize.default;
                newGraphStatus[header].Opacity.current = newGraphStatus[header].Opacity.default;
                newGraphStatus[header].fileType.current = newGraphStatus[header].fileType.default;
            }
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
            
                        if (thisGraph.fileType.current.value === "svg") {
                            thisGraphRef.btnSVGExportClick();
                        }
                        else if (thisGraph.fileType.current.value === "png") {
                            thisGraphRef.btnPngClick();
                        }
                        else if (thisGraph.fileType.current.value === "json") {
                            thisGraphRef.btnJsonClick();
                        }
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
            else if (thisGraph.Layout.current === null || thisGraph.NodeSize.current === null || thisGraph.Opacity.current === null || thisGraph.fileType.current === null){
                console.log("graph not ready");
                console.log(thisGraph);
                return;
            }
            

            thisGraphRef.applyLayout(String(thisGraph.Layout.current.value), false);
            thisGraphRef.setOpacity(Number(thisGraph.Opacity.current.value));
            thisGraphRef.setNodeSize(Number(thisGraph.NodeSize.current.value));

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
        setAllGraphData(tempGraphData);
        setIsBuildingGraphs(true);
    };

    useImperativeHandle(ref, () => ({
        getFormData: async () => {
            // setIsLoading(true);
            actions.updateIsLoading({ isLoading: true });
            setGraphRefs(Array.from({ length: Object.keys(state.vectorsHeaders).length }, (): graphRef => React.createRef<graphRef>() as graphRef));
            const val = await get(state.fileName);

            const headers = val['headers'];
            const vectorsValues = val['vectorsValues'];

            let body = {
                user_id: state.uuid,
                headers_data: {},
            };

            Object.entries(vectorsValues).forEach(([key, value]) => {
                const values_arr = vectorsValues[key] || [];
                const ids_arr = state.proteinsNames || [];
                let values_map: { [key: string]: number } = {};
                for (let i = 0; i < values_arr.length; i++) {
                    values_map[ids_arr[i]] = values_arr[i];
                }
                (body.headers_data as { [key: string]: any })[key] = {
                    values_map: values_map,
                    thresh_pos: state.thresholds[key][0],
                    thresh_neg: state.thresholds[key][1],
                    score_thresh: state.scoreThreshold,
                }
            });

            makePostRequest(JSON.stringify(body), "saveGraphs", handleJsonGraphData, handleError);

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
                {Object.entries(baseGraphSetting).map(([key, item], index) => (
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
                    <label className="usePresetLabel">{" Use Preset when available"}</label>
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
                            thresholds={{ 
                                pos: state.thresholds[key][0], 
                                neg: state.thresholds[key][1]
                            }}
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
            {/* {renderInvisibleGraph()} */}
        </div>
        
        // <div className="SaveGraphWrapper">
        //     {state.isLoading ? (
        //         <LoadingComponent />
        //     ) :
        //             {renderApplyAllMenu()}
        //             {renderGraphsSettings()}
        //             {renderInvisibleGraph()}
        //     }
        // </div>
    )
});

export default SaveGraphs;