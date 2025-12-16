import { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { IUidJson } from "../@types/json";
import { IStepProps } from "../@types/props";
import { makePostRequest } from "../common/PostRequest";
import LoadingComponent from "../components/Loading";
import { useStateMachine } from "little-state-machine";
import { updateUuid, updateIsLoading } from "../common/UpdateActions";
import "../styles/Others.css";
import ErrorInputText from "../components/ErrorInputText";

type namesFormValues = {
  [key: string]: string;
};

const OthersS: FC<IStepProps> = ({ step, goNextStep }) => {
  const { state, actions } = useStateMachine({ updateUuid, updateIsLoading });
  const [othersNames, setOthersNames] = useState<string[]>([]);

  const { handleSubmit } = useForm<namesFormValues>({});

  useEffect(() => {
    const others = Object.entries(state.namesStringMap).filter(([orgName, {stringName, stringId}]) => stringId == "0").map(([orgName, {stringName, stringId}]) => orgName);

    // Object.keys(state.namesStringMap).forEach((orgName) => {
    //   const match = state.namesStringMap[orgName]?.stringId;
    //   if (match === "0") others.push(orgName);
    // });

    others.sort();
    setOthersNames(others);
  }, []);

  const onSubmit = () => {
    console.log(state.namesStringMap);

    const idsList: string[] = [];
    const stringNames: string[] = [];

    Object.keys(state.namesStringMap).forEach((orgName) => {
      const map = state.namesStringMap[orgName];
      if (map) {
        idsList.push(map.stringId);
        stringNames.push(map.stringName);
      }
    });

    const body = JSON.stringify({
      proteins: state.proteinsNames,
      ids: idsList,
      string_names: stringNames,
    });

    console.log("body of users request: ");
    console.log({
      proteins: state.proteinsNames,
      ids: idsList,
      string_names: stringNames,
    });

    actions.updateIsLoading({ isLoading: true });
    // makePostRequest(body, "user", handleJsonResponse);
    handleJsonResponse("");
  };

  const handleJsonResponse = (jsonString: string) => {
    // const uidJson: IUidJson = JSON.parse(jsonString);
    // actions.updateUuid({ uuid: uidJson.uuid });
    goNextStep();
  };

  return (
    <div className="suggestions-scroll">
      <form id={"form" + step} onSubmit={handleSubmit(onSubmit)}>
        {othersNames.map((orgName) => {
          return <ErrorInputText key={orgName} orgName={orgName} />;
        })}
      </form>
    </div>
  );
};

export default OthersS;
