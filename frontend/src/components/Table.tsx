import { FC, useEffect, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { SortChangedEvent ,GridReadyEvent} from 'ag-grid-community';

import "ag-grid-enterprise";
import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-alpine.css";
import "../styles/Table.css";
import { ICustomGraphData } from "../@types/graphs";
import { useStateMachine } from "little-state-machine";
import { updateSortTable } from "../common/UpdateActions";

type row = {
  "Original Name": string;
  "string name": string;
  "node value": number;
  "node degree": number;
  "weighted node degree": number;
  "drug": string;
  "final score": number;
};
const TableComponent: FC<{
  data: ICustomGraphData;
}> = ({ data }) => {
  const { state, actions } = useStateMachine({updateSortTable});
  const [rowData, setRowData] = useState<row[]>([]);
  const initialExplanation = "click on a cell to read information about it"
  const [explanation, setExplanation] = useState(initialExplanation)
  const gridRef = useRef<AgGridReact>(null);
  const [columnDefs] = useState([
    { field: "Original Name" },
    { field: "string name" },
    { field: "node value" },
    { field: "node degree" },
    { field: "weighted node degree" },
    { field: "drug" },
    { field: "final score" },
  ]);
const updateExplanationText = (cellColumn?:string)=>{
  switch (cellColumn){
    case "Original Name":
      setExplanation("The original name from the file you uploaded")
      break
    case "string name":
      setExplanation("The name we found on String-db")
      break
    case "node value":
      setExplanation("The original value from the file you uploaded")
      break
    case "node degree":
      setExplanation("The amount of connection we found for the node")
      break
    case "weighted node degree":
      setExplanation("The sum of the probability of the node connections")
      break
    case "drug":
      setExplanation("Drug we found at the drug database(see more in top bar)")
      break
    case "final score":
      setExplanation("Final score-is calculated equally between the sum of the probability of the node connections and the nodes weight.")
      break
    default:
      setExplanation(initialExplanation)
  }

}
  useEffect(() => {
    data.nodes.forEach((node) => {
      let row: row = {
        "Original Name": String(node.id),
        "string name": node.string_name ? node.string_name : "",
        //@ts-ignore
        "node value": node.size ? node.size : 0,
        "node degree": node.links?.length ? node.links.length : 0,
        //@ts-ignore
        "weighted node degree": node.linksWeights
          ? node.linksWeights.toFixed(3)
          : 0,
        drug: node.drug ? node.drug : "drug not found",
        //@ts-ignore
        "final score":
          node.linksWeights && node.size
            ? ((node.linksWeights + Math.abs(node.size)) / 2).toFixed(3)
            : 0,
      };

      setRowData((prev) => [...prev, row]);
    });
  }, [data.nodes]);

  // enable sorting on all columns by default
  const defaultColDef = {
    sortable: true,
  };


  const onSortChanged = (e: SortChangedEvent) => {
    if(e.columnApi){

      const sortState = e.columnApi
        .getColumnState()
      console.log(sortState);
      // updateSortTable(state, { sortTable: sortState[0] });
      if(sortState !== undefined)
        actions.updateSortTable({ sortTable: sortState });
    }
    // console.log("after Save", state.sortTable);
  }
  const onGridReady = (e: GridReadyEvent) => {
    console.log("onGridReady\n");
    e.columnApi.applyColumnState({state : state.sortTable});
    console.log("after applay", e.columnApi.getColumnState());
  };

  return (
    <div className="ag-theme-alpine table-container">
      <div className="cell-explanation">
        {explanation}</div>
      <AgGridReact
        ref={gridRef}
        defaultColDef={defaultColDef}
        rowData={rowData}
        columnDefs={columnDefs}
        onSortChanged={onSortChanged}
        onGridReady={onGridReady}
        onCellClicked={(event) => {
          updateExplanationText(event.colDef.field);
        }}
      />
    </div>
  );
};

export default TableComponent;
