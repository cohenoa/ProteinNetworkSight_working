// Import necessary modules and types
import { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ISuggestionsJson } from "../@types/json";
import { IStepProps } from "../@types/props";
import { makePostRequest } from "../common/PostRequest";
import { get, set } from "idb-keyval"
import LoadingComponent from "../components/Loading";
import { useStateMachine } from "little-state-machine";
import {
  updateSuggestionsObj,
  updateNamesMap,
  updateUuid,
  updateIsLoading,
} from "../common/UpdateActions";
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
    updateUuid,
    updateIsLoading,
  });

  // Define state variables and initialize them with empty values
  const [suggestionsObj, setSuggestionsObj] = useState<ISuggestionsJson>();
  const [namesStringMap, setNamesStringMap] = useState<INamesStringMap>();
  const { handleSubmit } = useForm<namesFormValues>({});

  // Effect hook to fetch suggestions data and update state when component mounts or when dependencies change
  useEffect(() => {
    if (!state.isSetSuggestions) {
      // Callback function to handle JSON data from the server
      const handleSuggestionsJson = (jsonString: string) => {
        const suggestionsJson: ISuggestionsJson = JSON.parse(jsonString);
        setSuggestionsObj(suggestionsJson);
        actions.updateSuggestionsObj({ suggestionsObj: suggestionsJson });
        actions.updateIsLoading({ isLoading: false });
      };

      // Prepare the request body
      const body = JSON.stringify({
        org_names: get(state.proteinsNames),
        organism: state.organism.value,
      });

      // Update loading state and make a POST request
      actions.updateIsLoading({ isLoading: true });
      makePostRequest(body, "names", handleSuggestionsJson);
    } else {
      actions.updateIsLoading({ isLoading: false });
      setSuggestionsObj(state.suggestionsObj);
    }
  }, [actions, state.isSetSuggestions, state.organism.value, state.proteinsNames, state.suggestionsObj]);

  // Effect hook to compute and update the namesStringMap
  useEffect(() => {
    if (suggestionsObj) {
      let namesStringMap: INamesStringMap = {};

      if (state.isSetNamesMap) {
        namesStringMap = state.namesStringMap;
      } else {
        state.proteinsNames.forEach((orgName) => {
          // console.log(orgName);
          if (Object.keys(suggestionsObj.perfect_match).includes(orgName)) {
            namesStringMap[orgName] = {
              stringName: orgName,
              stringId: suggestionsObj.perfect_match[orgName],
            };
          } else if (
            Object.keys(suggestionsObj.alternative_match).includes(orgName)
          ) {
            const suggestions = suggestionsObj.alternative_match[orgName];
            const sugFirstKey = Object.keys(suggestions)[0];
            namesStringMap[orgName] = {
              stringName: sugFirstKey,
              stringId: suggestions[sugFirstKey],
            };
          } else {
            namesStringMap[orgName] = {
              stringName: "other",
              stringId: "0",
            };
          }
        });
      }

      // Set the updated namesStringMap in the component's state
      setNamesStringMap(namesStringMap);
    }
  }, [suggestionsObj, state.isSetNamesMap, state.namesStringMap, state.proteinsNames]);

  // Handle form submission
  const onSubmit = () => {
    if (namesStringMap)
      actions.updateNamesMap({ namesStringMap: namesStringMap });

    // Proceed to the next step
    goNextStep();
  };

  return state.isLoading ? (
    // Display loading component while data is being fetched
    <LoadingComponent />
  ) : (
    // Render the form with Switchable components based on suggestions
    <div className="suggestions-scroll">
      <form id={"form" + step} onSubmit={handleSubmit(onSubmit)}>
        {suggestionsObj &&
          Object.keys(suggestionsObj.alternative_match).map((orgName) => {
            const suggestions = suggestionsObj.alternative_match[orgName];
            return (
              <Switchable
                key={orgName}
                setNamesStringMap={setNamesStringMap}
                orgName={orgName}
                suggestions={suggestions}
              />
            );
          })}
      </form>
    </div>
  );
};

// Export the SuggestionsS component as the default export
export default SuggestionsS;
