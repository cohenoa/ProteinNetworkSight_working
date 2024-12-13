import React, { useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { useStateMachine } from "little-state-machine";
import { updateIsLoading, updateShowError } from "../common/UpdateActions";
import { get } from 'idb-keyval';
import "../styles/SaveGraphs.css";

interface GraphStatus {
    [key: string]: {
        layout: string, 
        nodeSize: number,
        opacity: number,
    };
}

const SaveGraphs = forwardRef((props, ref) => {
    const { state, actions } = useStateMachine({
        updateIsLoading,
        updateShowError,
    });

    const [graphStatus, setGraphStatus] = useState<GraphStatus>({});

    const getData = async () => {
        const val = await get(state.fileName);
        const clickedVectors = val['clicked_vectors'];
        var elementsVector = clickedVectors.elements

        let newGraphStatus: GraphStatus = {};
        console.log(state.vectorsHeaders);
        console.log(clickedVectors);

        state.vectorsHeaders.forEach((header: string) => {
            if (header in clickedVectors) {
                newGraphStatus[header] = {
                    layout: "circle",
                    nodeSize: 10,
                    opacity: 0.5,
                }
            }
            else {

            }
        });
        

        

        // for (const header in state.vectorsHeaders){
        //     newGraphStatus[header]
        // }

        // console.log(clickedVectors);

    }

    useEffect(() => {
        getData();
    }, [])

    useImperativeHandle(ref, () => ({
        getFormData: async () => {
            console.log("getFormData called");
            return "downloaded graphs";
        }
    }));

    return (
        <div className="SaveGraphWrapper">
            <div className="ApplyAllMenu">
                
            </div>
            <div className="IndividualMenu">

            </div>
        </div>
    )
});

export default SaveGraphs;