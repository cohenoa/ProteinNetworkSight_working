import { FC, useEffect, useState, useImperativeHandle, useRef, forwardRef } from "react";
import { useStateMachine } from "little-state-machine";
import { updateIsLoading, updateShowError } from "../common/UpdateActions";
import { get } from 'idb-keyval';
import { IVectorsValues } from "../@types/global";
import "../styles/SaveData.css";
import ButtonsBar from "../bars/FormNavigateBar";
import { IButtonConfig } from "../@types/props";
// import { IFormRefProps, formRef } from "../@types/props";

const SaveData = forwardRef((props, ref) => {
    const formRef = useRef<HTMLFormElement>(null);

    const { state, actions } = useStateMachine({
        updateIsLoading,
        updateShowError,
    });

    const [altmap, setAltmap] = useState({});
    const [manmap, setManmap] = useState({});

   useEffect(() => {
        getData();
   }, []);

    const getData = async() => {
        console.log(state.suggestionsObj);
        console.log(state.namesStringMap);

        let altmap: any = {};
        let manmap: any = {};

        for (const [name, match] of Object.entries(state.namesStringMap)) {
            if (match === undefined) continue;
            if (name in state.suggestionsObj.alternative_match) {
                altmap[name] = match?.stringName;
            } else if (state.suggestionsObj.no_match.includes(name) && match.stringId != "0") {
                manmap[name] = match?.stringName;
            }
            else{
                console.log("not found");
            }
        }

        console.log(altmap);
        console.log(manmap);

        setAltmap(altmap);
        setManmap(manmap);

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

    useImperativeHandle(ref, () => ({
        getFormData: () => {
          console.log("inside getFormData");
          console.log("actual formRef: " + formRef.current);
          return "getFormData return value";
        }
      }));

    return (
        <div className="saveData">
            <div className="SectionWrapper">
                <div className="SectionTitle">
                    <label>replace Alternative Names</label>
                </div>
                <div className="SectionContent">
                    <form ref={formRef} id="saveDataForm">
                        
                    </form>
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
});

export default SaveData;