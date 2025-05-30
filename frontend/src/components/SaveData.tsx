import React, { useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { useStateMachine } from "little-state-machine";
import { updateIsLoading, updateShowError } from "../common/UpdateActions";
import { get } from 'idb-keyval';
import "../styles/SaveData.css";
import ButtonsBar from "../bars/FormNavigateBar";
import { IButtonConfig, nameStatus, replaceNameStatus } from "../@types/props";
import { write, utils } from "xlsx";

const SaveData = forwardRef((props, ref) => {

    const { state, actions } = useStateMachine({
        updateIsLoading,
        updateShowError,
    });

    const [replacementMap, setReplacementMap] = useState<{ [key: string]: replaceNameStatus }>({});
    const [unMatchedMap, setUnMatchedMap] = useState<{ [key: string]: nameStatus }>({});

    useImperativeHandle(ref, () => ({
        getFormData: async () => {

            const val = await get(state.fileName);

            let xlsxContent = [['UID', 'STRING Name', 'STRING id'].concat(Object.keys(val['vectorsValues']))];

            Object.entries(state.namesStringMap).forEach(([name, match], index) => {
                if (match === null || typeof match !== "object" || !("stringId" in match) || !("stringName" in match)) return;
                if (name in unMatchedMap && unMatchedMap[name].accepted) return;

                let orgName = name;
                let orgSTRINGname = match.stringName;
                let orgSTRINGId = match.stringId;

                if (orgSTRINGId == "0"){
                    orgSTRINGname = "";
                    orgSTRINGId = "";
                };

                if (name in replacementMap && replacementMap[name].accepted) {
                    orgName = replacementMap[name].string_name;
                }

                const row: string[] = [orgName, String(orgSTRINGname), String(orgSTRINGId)];

                Object.keys(val['vectorsValues']).forEach((vectorName) => {
                    row.push(val['vectorsValues'][vectorName][index]);
                });

                xlsxContent.push(row);
            })
      
            const worksheet = utils.aoa_to_sheet(xlsxContent);
            const workbook = utils.book_new();
            utils.book_append_sheet(workbook, worksheet, "Sheet1");
        
            // Create a Blob from the workbook
            const file = write(workbook, { bookType: "xlsx", type: "array" });
            const blob = new Blob([file], { type: "application/octet-stream" });
        
            // Create a download link and click it programmatically
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${state.fileName.split('.')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            return "downloaded XLSX data file";
        }
      }));

    useEffect(() => {
        actions.updateIsLoading({ isLoading: true });
        getData();
        actions.updateIsLoading({ isLoading: false });
    }, []);

    const getData = async() => {

        let altmap: { [key: string]: replaceNameStatus } = {};
        let manmap: { [key: string]: replaceNameStatus } = {};
        let unMatched: { [key: string]: nameStatus } = {};

        for (const [name, match] of Object.entries(state.namesStringMap)) {
            if (match === undefined || match === null || typeof match !== "object" || !("stringName" in match) || !("stringId" in match)) continue;

            if (name in state.suggestionsObj.alternative_match) {
                altmap[name] = {string_name: match.stringName, string_id: match.stringId, accepted: false} as replaceNameStatus;
            } else if (state.suggestionsObj.no_match.includes(name) && match.stringId !== "0") {
                manmap[name] = {string_name: match.stringName, string_id: match.stringId, accepted: false} as replaceNameStatus;
            }
            else if (match.stringId === "0") {
                unMatched[name] = {accepted: false} as nameStatus;
            }
        }

        let replacementMap: { [key: string]: replaceNameStatus } = {...manmap, ...altmap};

        console.log(replacementMap);
        console.log(unMatched);

        setReplacementMap(replacementMap);
        setUnMatchedMap(unMatched);

    }

    const handleformAllAction = (setFunc: React.Dispatch<React.SetStateAction<{ [key: string]: any }>>, map: { [key: string]: any}, status: boolean) => {
        setFunc(applyAll(map, status));
    }

    const applyAll = (map: { [key: string]: any}, status: boolean) => {
        const newMap: { [key: string]: any } = {};
        for (const [key, value] of Object.entries(map)) {
            newMap[key] = {...value, accepted: status};
        }
        return newMap;
    }

    // formbool helps distinguish between the form for replacement names and the form for unMatched names
    const renderButtonBar = (replaceForm: boolean) => {
        const reset: IButtonConfig = {
          label: "Reset",
          type: "button",
          className: "btn btn--outline btn--medium",
          onClick: () => {
            console.log("Reset " + replaceForm? "replace form":"unused form");
            handleformAllAction(replaceForm? setReplacementMap: setUnMatchedMap, replaceForm? replacementMap: unMatchedMap, false);
          },
        };

        const replaceAll: IButtonConfig = {
          label: replaceForm? "Replace All" : "Remove All",
          type: "button",
          className: "btn btn--outline btn--medium",
          onClick: () => {
            console.log("mark all " + replaceForm? "replace form":"unused form");
            handleformAllAction(replaceForm? setReplacementMap: setUnMatchedMap, replaceForm? replacementMap: unMatchedMap, true);
          },
        };
        
        return <ButtonsBar buttons={[reset, replaceAll]} formId="saveDataForm"/>;
    }

    const changeStatus = (name: string, match: nameStatus, map: { [key: string]: nameStatus }, setMap: React.Dispatch<React.SetStateAction<any>>) => {
        const updatedMap = {
            ...map,
            [name]: {
                ...match,
                accepted: !match.accepted
            }
        };
        setMap(updatedMap);
    }

    const renderAltMap = (name: string, match: replaceNameStatus | nameStatus, index: number) => {

        const isReplace = "string_name" in match;

        const nameClass = isReplace ? "replaceName" : "unMatchedName";
        const orgNameStatusClass = match.accepted ? " cancledOriginalName" : " originalName";
        const StringNameStatusClass = match.accepted ? " chosenSTRINGName" : " STRINGName";

        const map = isReplace ? replacementMap : unMatchedMap;
        const setMap = isReplace ? setReplacementMap : setUnMatchedMap;

        const att = {
            orgNameClass: nameClass.concat(orgNameStatusClass),
            StringNameClass: nameClass.concat(StringNameStatusClass),
            btnClass: isReplace? "ItemBtn" : "ItemBtn removeBtn",
            acceptedBtnSymbol: String.fromCharCode(8635),
            notAcceptedBtnSymbol: isReplace? String.fromCharCode(8594): String.fromCharCode(0x274C),
        }

        

        return (
            <div key={index} className="ItemContainer">
                <div className={att.orgNameClass}>{name}</div>
                <button type="button" className={att.btnClass} onClick={() => changeStatus(name, match, map, setMap)}>{match.accepted? att.acceptedBtnSymbol : att.notAcceptedBtnSymbol}</button>
                {isReplace && <div className={att.StringNameClass}>{match.string_name}</div>}
            </div>
        )
    }

    return (
        <div className="saveData">
            <div className="SectionWrapper">
                <div className="SectionTitle">
                    <label>Replace Matched Names</label>
                </div>
                <div className="SectionContent">
                    <form id="saveDataForm1">
                        {Object.entries(replacementMap).map(([name, match], index) => renderAltMap(name, match, index))}
                    </form>
                </div>
                <div className="SectionFooter">
                    {renderButtonBar(true)}
                </div>
            </div>
            <div className="SectionWrapper">
                <div className="SectionTitle">
                    <label>Remove Unmatched Names</label>
                </div>
                <div className="SectionContent">
                    <form id="saveDataForm2">
                        {Object.entries(unMatchedMap).map(([name, match], index) => renderAltMap(name, match, index))}
                    </form>
                </div>
                <div className="SectionFooter">
                    {renderButtonBar(false)}
                </div>
            </div>
        </div>
    )
});

export default SaveData;