import { FC, useEffect, useState } from "react";
import { useStateMachine } from "little-state-machine";
import { updateIsLoading, updateShowError } from "../common/UpdateActions";
import { get } from 'idb-keyval';
import { IVectorsValues } from "../@types/global";
import "../styles/SaveData.css";
import ButtonsBar from "../bars/FormNavigateBar";
import { IButtonConfig } from "../@types/props";

const SaveData: FC<ISaveProps> = () => {
    const { state, actions } = useStateMachine({
        updateIsLoading,
        updateShowError,
    });

    let vectorsValues: IVectorsValues = {} as IVectorsValues;

   useEffect(() => {
        // getData();
   }, []);

    const getData = () => {
        get(state.fileName).then((val) => {
            const headers = val['headers'];
            vectorsValues = val['vectorsValues'];

            console.log("vectors values: ", vectorsValues);
        })
    }

    const renderButtonBar = () => {
        const reset: IButtonConfig = {
          label: "Reset",
          type: "button",
          className: "btn btn--outline btn--medium",
          onClick: () => {
            console.log("Reset");
          },
        };

        const replaceAll: IButtonConfig = {
          label: "Replace All",
          type: "button",
          className: "btn btn--outline btn--medium",
          onClick: () => {
            console.log("mark all");
          },
        };
        
        return <ButtonsBar buttons={[reset, replaceAll]} formId="saveDataForm" />;
    }

    return (
        <div className="saveData">
            <div className="SectionWrapper">
                <div className="SectionTitle">
                    <label>replace Alternative Names</label>
                </div>
                <div className="SectionContent">

                </div>
                <div className="SectionFooter">
                    {renderButtonBar()}
                </div>
            </div>
            <div className="SectionWrapper">
                <div className="SectionTitle">
                    <label>replace Manual Names</label>
                </div>
                <div className="SectionContent">

                </div>
                <div className="SectionFooter">
                    {renderButtonBar()}
                </div>
            </div>
        </div>
    )
}

export default SaveData;