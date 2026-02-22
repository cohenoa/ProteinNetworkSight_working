import { FC, useState} from "react";
import SaveData from "../components/SaveData";
import SaveGraphs from "../components/SaveGraphs";
import "../styles/SaveResults.css";
import "../styles/StringSuggestions.css";
import Switch, { Item } from "react-switchable-next";
import "react-switchable-next/dist/index.esm.css";
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
                return <SaveData ref={formRef} />
            case SaveMode.graphs:
                console.log("Save Graphs");
                return <SaveGraphs ref={formRef} />
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
                    <Item key={1} value={SaveMode.data.toString()}>Save Data</Item>
                    <Item key={2} value={SaveMode.graphs.toString()}>Save Graphs</Item>
                </Switch>
            </div>
        )
    }

    return (
        <div className="saveResultsWrapper">
            {renderModeMenu()}
            <div className="saveResultsContent">
                {renderSaveModel()}
            </div>
        </div>
    )
};

export default SaveResults;