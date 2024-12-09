import { FC, useEffect, useState, forwardRef, useImperativeHandle} from "react";
import SaveData from "../components/SaveData";
import SaveGraphs from "../components/SaveGraphs";
import "../styles/SaveResults.css";
import "../styles/StringSuggestions.css";
import Switch, { Item } from "react-switchable";
import { formRefProps } from "../@types/props";

enum SaveMode {
    data,
    graphs
}

const SaveResults: FC<formRefProps> = ({ formRef }) => {

    const [mode, setMode] = useState(SaveMode.data);

    console.log("save results ref: ", formRef);


    const renderSaveModel = () => {
        switch (mode) {
            case SaveMode.data:
                console.log("Save Data");
                // return <Son ref={formRef}/>;
                return <SaveData ref={formRef} />
            case SaveMode.graphs:
                console.log("Save Graphs");
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