import { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ISuggestionsJson, IUidJson } from "../@types/json";
import { IStepProps } from "../@types/props";
import { makePostRequest } from "../common/PostRequest";
import LoadingComponent from "../components/Loading";
import { useStateMachine } from "little-state-machine";
import { updateUuid, updateIsLoading } from "../common/UpdateActions";
import "../styles/Others.css";
import ErrorInputText from "../components/ErrorInputText";
import { getMany } from "idb-keyval";
import { INamesStringMap } from "../@types/global";

type namesFormValues = {
  [key: string]: string;
};

const OthersS: FC<IStepProps> = ({ step, goNextStep }) => {
  const { state, actions } = useStateMachine({ updateUuid, updateIsLoading });
  const [othersNames, setOthersNames] = useState<{ orgName: string; stringName: string }[]>([]);

  const { handleSubmit } = useForm<namesFormValues>({});

  useEffect(() => {
    getMany(["suggestionsObj", "namesStringMap"]).then(([suggestionsObj, namesStringMap]) => {
      console.log("no match: ", (suggestionsObj as ISuggestionsJson).no_match);

      const other_unset = new Set(Object.entries(namesStringMap as INamesStringMap).filter(([orgName, {stringName, stringId}]) => stringId === 0).map(([orgName]) => orgName));
      console.log("other_unset: ", other_unset);
      const other_set = new Set((suggestionsObj as ISuggestionsJson).no_match.filter((orgName) => (!other_unset.has(orgName))));
      console.log("other_set: ", other_set);


      const othersList = Array.from(other_set).map((orgName) => ({ orgName: orgName, stringName: namesStringMap[orgName].stringName })).concat(Array.from(other_unset).map((orgName) => ({orgName: orgName, stringName: ""})));
      othersList.sort(({orgName: orgName1, stringName: stringName1}, {orgName: orgName2, stringName: stringName2}) => orgName1.localeCompare(orgName2));
      console.log("othersList: ", othersList);
      setOthersNames(othersList);
    });
  }, []);

  const onSubmit = () => {
    goNextStep();
  };

  return (
    <div className="suggestions-scroll">
      <form id={"form" + step} onSubmit={handleSubmit(onSubmit)}>
        {othersNames.map(({orgName, stringName}) => {
          return <ErrorInputText key={orgName} orgName={orgName} stringName={stringName !== "other" ? stringName : ""} />;
        })}
      </form>
    </div>
  );
};

export default OthersS;
