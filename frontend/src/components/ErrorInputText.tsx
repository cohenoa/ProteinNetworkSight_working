import { useStateMachine } from "little-state-machine";
import { FC, useEffect, useState } from "react";
import { IStringIdJson } from "../@types/json";
import { IErrorInputTextProps } from "../@types/props";
import { makePostRequest } from "../common/PostRequest";
import { updateNamesMap, updateIsLoading } from "../common/UpdateActions";
import "react-toggle/style.css";
import "../styles/ErrorInputText.css";
import Toggle from "react-toggle";
import { ClipLoader } from "react-spinners";

enum validOption {
  noValue,
  disabled,
  notValid,
  valid,
}

const ErrorInputText: FC<IErrorInputTextProps> = ({ orgName }) => {
  const { state, actions } = useStateMachine({ updateNamesMap, updateIsLoading });
  const [enteredName, setEnteredName] = useState<string>(state.namesStringMap[orgName]?.stringId !== "0" ? state.namesStringMap[orgName].stringName : "");
  const [smallLoad, setSmallLoad] = useState<boolean>(false);
  const [isValid, setIsValid] = useState<validOption>(state.namesStringMap[orgName]?.stringId !== "0" ? validOption.valid : validOption.noValue);
  const [isChecked, setIsChecked] = useState<boolean>(state.namesStringMap[orgName]?.stringId !== "0" ? true : false);

  useEffect(() => {
    if (!isChecked) {
      setIsValid(validOption.disabled);
      setEnteredName("");
    }

  }, [isChecked]);
  const getStringId = (name: string) => {
    const body = JSON.stringify({
      name: name,
      organism: state.organism.value,
    });

    actions.updateIsLoading({isLoading: true});
    setSmallLoad(true)
    makePostRequest(body, "validate", handleJsonStringId);
  };

  const handleJsonStringId = (jsonString: string) => {
    const stringObj: IStringIdJson = JSON.parse(jsonString);
    const stringId = stringObj.match_id;

    if (stringId === "id not found") setIsValid(validOption.notValid);
    else {
      setIsValid(validOption.valid);

      const newNamesMap = {
        ...state.namesStringMap,
        [orgName]: {
          stringName: enteredName,
          stringId: stringId,
        },
      };
      actions.updateNamesMap({ namesStringMap: newNamesMap });
    }
    setSmallLoad(false)
    actions.updateIsLoading({isLoading: false});
  };

  const blurHandler = (event: React.FocusEvent<HTMLInputElement>) => {
    if (!event.target.value) {
      setIsValid(validOption.noValue);
      return;
    }
    getStringId(event.target.value);
  };

  const changeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEnteredName(event.target.value.toUpperCase());
  };

  const onToggleChange = () => {
    setIsChecked((prev) => !prev);
  };

  return (
    <div className="other-field" key={orgName}>
      <div className="other-label-row">
        <Toggle checked={isChecked} onChange={onToggleChange} />
        <label
          className={isChecked ? "protein-label" : "lable-disabled"}
          htmlFor={orgName}
        >
          {orgName}:
        </label>
      </div>
      <div className="other-input-div">
        {smallLoad ? (
          <ClipLoader size={40} color="#217BF4" />
        ) : (
          <input
            disabled={!isChecked}
            id={orgName}
            type="string"
            className="text-input other-input"
            onBlur={blurHandler}
            value={enteredName}
            onChange={changeHandler}
          />
        )}

        {isValid === validOption.valid && (
          <span>Protein exists in STRING-db</span>
        )}
        {isValid === validOption.notValid && (
          <p className="detail-error">
            Protein\gene name does not exist in STRING.
          </p>
        )}
      </div>
    </div>
  );
};

export default ErrorInputText;
