import { FC, useEffect, useState } from "react";
import SaveData from "../components/SaveData";
import SaveGraphs from "../components/SaveGraphs";
import "../styles/SaveResults.css";
import "../styles/StringSuggestions.css";
import Switch, { Item } from "react-switchable";

enum SaveMode {
    data,
    graphs
}

const SaveResults: FC = () => {
    const [mode, setMode] = useState(SaveMode.data);

    const renderSaveModel = () => {
        switch (mode) {
            case SaveMode.data:
                return <SaveData />
            case SaveMode.graphs:
                return <SaveGraphs />
            default:
                return <></>
        }
    }

    const renderModeMenu = () => {
        return (
            <div className="saveResultsMenu">
                {/* @ts-ignore */}
                <Switch name="mode" onItemChanged={() => {}}>
                    <Item value={"0"}>Save Data</Item>
                    <Item value={"1"}>Save Graphs</Item>
                </Switch>
            </div>
        )
    }

    return (
        <div className="saveResultsWrapper">
            {renderModeMenu()}
        </div>
    )
};

export default SaveResults;