import React, { useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { useStateMachine } from "little-state-machine";
import { updateIsLoading, updateShowError } from "../common/UpdateActions";
import { get } from 'idb-keyval';
import WindowedSelect from "react-windowed-select";
import "../styles/SaveGraphs.css";

interface GraphStatus {
    [key: string]: {
        layout: string, 
        nodeSize: number,
        opacity: number,
    };
}

const Items = [
    { id: 1, title: "Apply layout to all", paramName: "layout", options: [{ label: "random", value: "random" }, { label: "grid", value: "grid" }, { label: "circle", value: "circle" }, { label: "fcose", value: "fcose" }, { label: "elk", value: "elk" }, { label: "cise", value: "cise" }] },
    { id: 2, title: "Apply Node Size to all", paramName: "nodeSize", options: [{ label: "0.1", value: 0.1 }, { label: "0.25", value: 0.25 }, { label: "0.5", value: 0.5 }, { label: "1", value: 1 }, { label: "1.5", value: 1.5 }, { label: "3", value: 3 }, { label: "5", value: 5 }, { label: "10", value: 10 }] },
    { id: 3, title: "Apply Opacity to all", paramName: "opacity", options: [{ label: "0.05", value: 0.05 }, { label: "0.2", value: 0.2 }, { label: "0.35", value: 0.35 }, { label: "0.5", value: 0.5 }, { label: "0.75", value: 0.75 }, { label: "0.9", value: 0.9 }] },
    { id: 4, title: "choose file type", options: [{ label: "svg", value: "svg" }, { label: "png", value: "png" }, { label: "jpeg", value: "jpeg" }] },
]


const SaveGraphs = forwardRef((props, ref) => {
    const { state, actions } = useStateMachine({
        updateIsLoading,
        updateShowError,
    });

    const [graphStatus, setGraphStatus] = useState<GraphStatus>({});
    const [fileType, setFileType] = useState<string>("svg");

    const getData = async () => {
        // const val = await get(state.fileName);
        // const clickedVectors = val['clicked_vectors'];
        // var elementsVector = clickedVectors.elements

        // let newGraphStatus: GraphStatus = {};
        // console.log(state.vectorsHeaders);
        // console.log(clickedVectors);

        // state.vectorsHeaders.forEach((header: string) => {
        //     if (header in clickedVectors) {
        //         newGraphStatus[header] = {
        //             layout: "circle",
        //             nodeSize: 1,
        //             opacity: 0.5,
        //         }
        //     }
        //     else {

        //     }
        // });
        

        

        // for (const header in state.vectorsHeaders){
        //     newGraphStatus[header]
        // }

        // console.log(clickedVectors);

    }

    useEffect(() => {
        // getData();
    }, [])

    useImperativeHandle(ref, () => ({
        getFormData: async () => {
            console.log("getFormData called");
            return "downloaded graphs";
        }
    }));

    const handleChange = (option: any, index: number) => {
        // TODO: test this

        console.log(option);
        console.log(index);

        if (index === 3) {
            console.log("setting file type to ", option.label);
            setFileType(option.value);
        }
        else {
            console.log("setting option " + Items[index].paramName + " to ", option.label);
            setGraphStatus({...graphStatus, [String(Items[index].paramName)]: option.value});
        }

        console.log(graphStatus);
    }

    const handleSubmit = (index: any) => {
        console.log(graphStatus);
        // console.log(graphStatus);
        // console.log(fileType);
        // TODO: download the graphs
    }

    const renderApplyAllMenu = () => {

        return (
            <div className="ApplyAllMenu">
                {Items.map((item, index) => (
                    <div className="ApplyAllMenuOption" key={"ApplyAllMenuOption-" + item.id}>
                        <div className="ApplyAllMenuOptiontitle">{item.title}</div>
                        <WindowedSelect
                            className="select"
                            // value={item.options}
                            onChange={(option) => {handleChange(option, index)}}
                            windowThreshold={20}
                            options={item.options}
                            // maxMenuHeight={220}
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
                            id="layout-select"
                        />
                        <button className="btn btn--outline btn--medium" onClick={() => {handleSubmit(index)}}>Apply</button>
                    </div>
                ))}  
            </div>
        )
    }

    return (
        <div className="SaveGraphWrapper">
            {renderApplyAllMenu()}
            <div className="IndividualMenu">

            </div>
        </div>
    )
});

export default SaveGraphs;