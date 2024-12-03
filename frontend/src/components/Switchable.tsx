import { FC } from "react";
import { ISwitchableProps } from "../@types/props";
import Switch, { Item } from "react-switchable";
import { INamesStringMap } from "../@types/global";
import { useStateMachine } from "little-state-machine";
import "../styles/Switchable.css";

const Switchable: FC<ISwitchableProps> = ({
  setNamesStringMap,
  orgName,
  suggestions,
}) => {
  const { state } = useStateMachine();
  const valDelim = ":";

  const createValue = (strName: string, strId: string) => {
    return orgName + valDelim + strName + valDelim + strId;
  };

  const splitValue = (value: string) => {
    const splited = value.split(valDelim);
    return {
      orgName: splited[0],
      strName: splited[1],
      strID: splited[2],
    };
  };

  const onItemChanged = (value: string) => {
    const { orgName, strName, strID } = splitValue(value);
    setNamesStringMap((prev: INamesStringMap): INamesStringMap => {
      return {
        ...prev,
        [orgName]: {
          stringName: strName,
          stringId: strID,
        },
      };
    });
  };

  const createItems = () => {
    const items = Object.keys(suggestions).map((strName) => {
      const value = createValue(strName, suggestions[strName]);
      return (
        <Item
          key={strName}
          default={strName === state.namesStringMap[orgName]?.stringName}
          value={value}
        >
          {strName}
        </Item>
      );
    });

    const otherKey = "other";
    const otherValue = createValue("other", "0");
    items.push(
      <Item
        key={otherKey}
        default={otherKey === state.namesStringMap[orgName]?.stringName}
        value={otherValue}
      >
        {otherKey}
      </Item>
    );
    return items;
  };

  return (
    <div className="fieldset-container suggestionsSwitch">
      <label className="protein-label">{orgName}:</label>
      {/* @ts-ignore */}
      <Switch name={orgName} onItemChanged={onItemChanged}>
        {createItems()}
      </Switch>
    </div>
  );
};

export default Switchable;
