import { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ISuggestionsJson } from "../@types/json";
import { IStepProps } from "../@types/props";
import { makePostRequest } from "../common/PostRequest";
import LoadingComponent from "../components/Loading";
import { useStateMachine } from "little-state-machine";
import {
  updateSuggestionsObj,
  updateNamesMap,
  updateIsLoading,
} from "../common/UpdateActions";
import { set, get, getMany } from "idb-keyval";
import "../styles/StringSuggestions.css";
import Switchable from "../components/Switchable";
import { INamesStringMap } from "../@types/global";

// Define a type for form values
type namesFormValues = {
  [key: string]: string;
};

// Create a functional component called 'SuggestionsS' that takes 'step' and 'goNextStep' as props
const SuggestionsS: FC<IStepProps> = ({ step, goNextStep }) => {
  // Retrieve state and actions from the state machine
  const { state, actions } = useStateMachine({
    updateSuggestionsObj,
    updateNamesMap,
    updateIsLoading,
  });

  // Define state variables and initialize them with empty values
  const [suggestionsObj, setSuggestionsObj] = useState<ISuggestionsJson>();
  const [namesStringMap, setNamesStringMap] = useState<INamesStringMap>();
  const [proteinsNames, setProteinsNames] = useState<string[]>([]);
  const { handleSubmit } = useForm<namesFormValues>({});

  // Effect hook to fetch suggestions data and update state when component mounts or when dependencies change
  useEffect(() => {
    actions.updateIsLoading({ isLoading: true });
    setupSuggestions();
  }, []);

  const setupSuggestions = async () => {
    let proteinsNames = await get("proteinsNames")
    console.log("names: ", proteinsNames);
    setProteinsNames(proteinsNames);
    console.log("state: ", state);
    if (!state.isSetSuggestions) {
      const body = JSON.stringify({
        org_names: proteinsNames,
        organism: state.organism.value,
      });

      console.log("names body: ", body);

      makePostRequest(body, "names", handleSuggestionsJson);
    } else {
      const [suggestionsObjMem, namesStringMapMem] = await getMany(["suggestionsObj", "namesStringMap"]);
      console.log("suggestionsObj: ", suggestionsObjMem);
      console.log("namesStringMap: ", namesStringMapMem);
      setSuggestionsObj(suggestionsObjMem);
      setNamesStringMap(namesStringMapMem);
      actions.updateIsLoading({ isLoading: false });
    }
  }

  const handleSuggestionsJson = (jsonString: string) => {
    const suggestionsJson: ISuggestionsJson = JSON.parse(jsonString);
    console.log("suggestionsJson: ", suggestionsJson);
    set("suggestionsObj", suggestionsJson);
    setSuggestionsObj(suggestionsJson);
    actions.updateSuggestionsObj({ suggestionsObj: suggestionsJson });
    actions.updateIsLoading({ isLoading: false });
  };

  useEffect(() => {
    if (suggestionsObj && !namesStringMap) {
      const namesStringMap_build: INamesStringMap = {};
      proteinsNames.forEach((orgName) => {
        if (Object.keys(suggestionsObj.perfect_match).includes(orgName)) {
          namesStringMap_build[orgName] = {
            stringName: orgName,
            stringId: suggestionsObj.perfect_match[orgName],
          };
        } 
        else if ( Object.keys(suggestionsObj.alternative_match).includes(orgName)) {
          const suggestions = suggestionsObj.alternative_match[orgName];
          const sugFirstKey = Object.keys(suggestions)[0];
          if (orgName == "ACC1"){
            console.log("for acc1 2: ", suggestions);
            let a = suggestions[sugFirstKey];
            console.log(suggestions[sugFirstKey]);
          }
          namesStringMap_build[orgName] = {
            stringName: sugFirstKey,
            stringId: suggestions[sugFirstKey],
          };
        }
        else {
          namesStringMap_build[orgName] = {
            stringName: "other",
            stringId: 0,
          };
        }
      })
      console.log("namesStringMap_build: ", namesStringMap_build);
      set("namesStringMap", namesStringMap_build);
      setNamesStringMap(namesStringMap_build);
    }
  }, [suggestionsObj]);

  // Handle form submission
  const onSubmit = () => {
    set("namesStringMap", namesStringMap);
    console.log(namesStringMap);
    goNextStep();
  };

  return state.isLoading ? (
    <LoadingComponent />
  ) : (
      <div className="suggestions-scroll">
        <div className="suggestions-stats">
          {suggestionsObj && 
            <h4 style={{fontWeight: "bold"}}>
              {Object.keys(suggestionsObj.perfect_match).length} Perfect matches, {"\t"}
              {Object.keys(suggestionsObj.alternative_match).length} Alternative names, {"\t"}
              {suggestionsObj.no_match.length} No matches
            </h4>
          }
        </div>
        <form className="suggestions-form" id={"form" + step} onSubmit={handleSubmit(onSubmit)}>
          {suggestionsObj &&
            Object.keys(suggestionsObj.alternative_match).map((orgName) => {
              const suggestions = suggestionsObj.alternative_match[orgName];
              let selectedName = Object.keys(suggestions)[0];
              if (orgName == "ACC1"){
                console.log("for acc1: ", namesStringMap);
              }
              if (namesStringMap !== undefined && namesStringMap[orgName] !== undefined) {
                selectedName = namesStringMap[orgName].stringName;
              }
              return (
                <Switchable
                  key={orgName}
                  setNamesStringMap={setNamesStringMap}
                  orgName={orgName}
                  suggestions={suggestions}
                  selected={selectedName}
                />
              );
            })}
            <div className="suggestions-buffer"></div>
        </form>
      </div>
  );
};

export default SuggestionsS;
