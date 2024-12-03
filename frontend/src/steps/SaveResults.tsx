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

    function tester(): void {
        console.log("tester")
    }

    const renderSaveModel = () => {
        switch (mode) {
            case SaveMode.data:
                console.log("Save Data")
                return <SaveData />
            case SaveMode.graphs:
                console.log("Save Graphs")
                return <SaveGraphs />
            default:
                console.log("Error")
                return <></>
        }
    }

    const renderModeMenu = () => {
        return (
            <div className="saveResultsMenu">
                {/* @ts-ignore */}
                <Switch name="mode" onItemChanged={(value: String) => {
                    setMode(Number(value) as SaveMode);
                }}>
                    <Item value={SaveMode.data.toString()}>Save Data</Item>
                    <Item value={SaveMode.graphs.toString()}>Save Graphs</Item>
                </Switch>
            </div>
        )
    }

    return (
        <div className="saveResultsWrapper">
            {renderModeMenu()}
            {renderSaveModel()}
        </div>
    )
};

export default SaveResults;