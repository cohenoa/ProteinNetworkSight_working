import React, { useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { useStateMachine } from "little-state-machine";
import { updateIsLoading, updateShowError } from "../common/UpdateActions";
import { get } from 'idb-keyval';
import WindowedSelect from "react-windowed-select";
import "../styles/SaveGraphs.css";

interface optionItem {
    label: string;
    value: string | number,
}

interface SettingItem {
    title: string;
    default: optionItem;
    current: optionItem | null;
    options: optionItem[];
}

interface GraphSettings {
    Layout: SettingItem,
    NodeSize: SettingItem,
    Opacity: SettingItem,
    fileType: SettingItem,
}

interface GraphsStatus {
    [key: string]: GraphSettings;
}

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
        default: {label: "svg", value: "svg"},
        current: null,
        options: [
            { label: "svg", value: "svg" }, 
            { label: "png", value: "png" }, 
            { label: "jpeg", value: "jpeg" }
        ]
    }
}

const presetOption: optionItem = {label: "preset", value: "preset"}



const SaveGraphs = forwardRef((props, ref) => {
    const { state, actions } = useStateMachine({
        updateIsLoading,
        updateShowError,
    });


    const [applyAllStatus, setApplyAllStatus] = useState<GraphSettings>(copySettings(baseGraphSetting, false));
    const [graphsStatus, setGraphsStatus] = useState<GraphsStatus>({});
    const [usePresetWhenPossible, setUsePresetWhenPossible] = useState<boolean>(false);
    // TODO: add usePreset state + button for other settings
    

    const getData = async () => {
        const val = await get(state.fileName);
        const clickedVectors = val['clicked_vectors'] || {};

        let newGraphStatus: GraphsStatus = {};

        state.vectorsHeaders.forEach((header: string) => {
            
            if (header in clickedVectors) {    
                newGraphStatus[header] = copySettings(baseGraphSetting, true);

                newGraphStatus[header].Layout.options.push(presetOption);
                newGraphStatus[header].Layout.current = presetOption;

                newGraphStatus[header].NodeSize.current = {label: String(clickedVectors[header].nodeSize), value: Number(clickedVectors[header].node_size)};
                newGraphStatus[header].Opacity.current = {label: String(clickedVectors[header].opacity), value: Number(clickedVectors[header].opacity)};
            }
            else {
                newGraphStatus[header] = copySettings(baseGraphSetting, false);
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
        console.log(applyAllStatus);
    }, [applyAllStatus]);

    useImperativeHandle(ref, () => ({
        getFormData: async () => {
            console.log("getFormData called");
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

        console.log("header: " + header);
        console.log("key: " + key);
        console.log(newGraphStatus[header]);
        console.log(newGraphStatus[header][key]);
        console.log(newGraphStatus[header][key].current)

        newGraphStatus[header][key].current = option;
        setGraphsStatus(newGraphStatus);
    }

    const handleApplyAllSubmit = (key: keyof GraphSettings) => {
        const newGraphStatus: GraphsStatus = {};

        Object.entries(graphsStatus).forEach(([header, item]) => {
            newGraphStatus[header] = copySettings(applyAllStatus, true);
            if (key === "Layout" && usePresetWhenPossible && graphsStatus[header][key].options.includes(presetOption)){
                newGraphStatus[header][key].current = presetOption;
                // TODO: account for NodeSize and Opacity
            }
            else{
                newGraphStatus[header][key].current = applyAllStatus[key].current;
            }
        })

        console.log("in handleApplyAllSubmit");

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
                            // value={item.options}
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

                            {index === 0 &&
                            <div className="usePresetCheckboxWrapper">
                                <input
                                    type="checkbox"
                                    checked={usePresetWhenPossible}
                                    onChange={() => setUsePresetWhenPossible(!usePresetWhenPossible)}
                                    className="usePresetCheckbox"
                                />
                                <label className="usePresetLabel">{" Use Preset when available"}</label>
                            </div>
                            }
                        </div>
                    </div>
                ))}
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

    return (
        <div className="SaveGraphWrapper">
            {renderApplyAllMenu()}
            {renderGraphsSettings()}
        </div>
    )
});

export default SaveGraphs;