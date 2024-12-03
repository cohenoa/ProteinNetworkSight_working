import { FC, useEffect, useState } from "react";
import { useStateMachine } from "little-state-machine";
import { updateIsLoading, updateShowError } from "../common/UpdateActions";
import { get } from 'idb-keyval';
import { IVectorsValues } from "../@types/global";

const SaveData: FC = () => {
    const { state, actions } = useStateMachine({
        updateIsLoading,
        updateShowError,
    });
    let vectorsValues: IVectorsValues = {} as IVectorsValues;

   useEffect(() => {
        getData();
   }, []);

    const getData = () => {
        get(state.fileName).then((val) => {
            const headers = val['headers'];
            vectorsValues = val['vectorsValues'];

            console.log("vectors values: ",vectorsValues);
        })
    }

    return (
        <div className="saveData">
            <h1>Save Data</h1>
        </div>
    )
}

export default SaveData;