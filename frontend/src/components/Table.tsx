import { FC, useEffect, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { SortChangedEvent ,GridReadyEvent, ColDef } from 'ag-grid-community';

import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-alpine.css";
import "../styles/Table.css";
import { ICustomGraphData, ICustomNode } from "../@types/graphs";
import { useStateMachine } from "little-state-machine";
import { updateSortTable } from "../common/UpdateActions";

interface ColumnConfig {
  value: (node: ICustomNode) => string | number;
  type: "string" | "number";
  explanation: string;
  flex: number;
  tooltipField?: string;
  cellRenderer?: string;
}

const columns: { [key: string]: ColumnConfig } = {
  "Original Name": {
    value: (node: ICustomNode) => String(node.id),
    type: "string",
    explanation: "The original name from the file you uploaded",
    flex: 1
  },

  "STRING Name": {
    value: (node: ICustomNode) => node.string_name ?? "",
    type: "string",
    explanation: "The matched name on STRING-db",
    flex: 1
  },

  "Node Value": {
    value: (node: ICustomNode) => node.size ?? 0,
    type: "number",
    explanation: "The value from the file you uploaded",
    flex: 1
  },

  "Node Degree": {
    value: (node: ICustomNode) => node.links?.length ?? 0,
    type: "number",
    explanation: "The number of links to other nodes",
    flex: 1
  },

  "Weighted Node Degree": {
    value: (node: ICustomNode) => node.linksWeights ? Number(node.linksWeights.toFixed(3)) : 0,
    type: "number",
    explanation: "The sum of the probability of the node connections",
    flex: 1
  },

  "Drugs": {
    value: (node: ICustomNode) => node.drug.length !== 0 ? node.drug.map((d) => d.drugName).join(", ") : "drug not found",
    type: "string",
    explanation: "Drug targeting this node (see more in top bar)",
    flex: 3,
    tooltipField: "Drugs",
    cellRenderer: "expandableCell",
  },

  "Final Score": {
    value: (node: ICustomNode) => node.linksWeights && node.size ? Number(((node.linksWeights + Math.abs(node.size)) / 2).toFixed(3)) : 0,
    type: "number",
    explanation: "Final score-is calculated equally between the sum of the probability of the node connections and the nodes weight.",
    flex: 1
  }
} as const;

type columnsKey = keyof typeof columns;
type row = {
  [K in columnsKey]: typeof columns[K]["type"] extends "number" ? number : string;
};

const TableComponent: FC<{data: ICustomGraphData}> = ({ data }) => {
  const { state, actions } = useStateMachine({updateSortTable});
  const [rowData, setRowData] = useState<row[]>([]);
  const initialExplanation = "click on a cell to read information about it"
  const [explanation, setExplanation] = useState(initialExplanation)
  const gridRef = useRef<AgGridReact>(null);
  const [columnDefs] = useState<ColDef[]>(
    Object.entries(columns).map(([key, col]) => ({
      field: key,
      flex: col.flex,
      tooltipField: col.tooltipField,
      cellRenderer: col.cellRenderer,
    }))
  );

  const updateExplanationText = (cellColumn?:string)=>{
    const cellColumnKey = cellColumn as columnsKey;
    if (cellColumnKey && columns[cellColumnKey]) {
      setExplanation(columns[cellColumnKey].explanation);
    } else {
      setExplanation(initialExplanation);
    }
  }

  function buildRow(node: any): row {
    return Object.fromEntries(
      Object.entries(columns).map(([key, col]) => [
        key,
        col.value(node),
      ])
    ) as row;
}

  useEffect(() => {
    console.log(data.nodes);
    data.nodes.forEach((node) => {
      const row = buildRow(node);
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
    // e.api.sizeColumnsToFit();
  };

  const downloadTable = () => {
    const columns_names: string[] = Object.keys(columns);
    const csv = columns_names.join(",") + "\n" + rowData.map((row) => {
      row["Drugs"] = "\"" + row["Drugs"] + "\"";
      return Object.values(row).join(",")
    }).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "table.csv";
    link.click();
  };

  return (
    <div className="ag-theme-alpine table-container">
      <div className="Top-Table-Components">
        <div className="DownloadBtnContainer">
          <button 
            className="btn btn--outline" 
            onClick={() => downloadTable()}>
              Download
          </button>
        </div>
        <div className="cell-explanation">
          {explanation}
        </div>
      </div>
      <AgGridReact
        ref={gridRef}
        defaultColDef={defaultColDef}
        rowData={rowData}
        columnDefs={columnDefs}
        onSortChanged={onSortChanged}
        onGridReady={onGridReady}
        onCellClicked={(event) => updateExplanationText(event.colDef.field)}
        enableBrowserTooltips={true}
        components={{
          expandableCell: ExpandableCell,
        }}
      />
    </div>
  );
};

const ExpandableCell = (props: any) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div
      // onClick={() => setExpanded((e) => !e)}
      style={{
        whiteSpace: expanded ? "normal" : "nowrap",
        overflow: "hidden",
        textOverflow: expanded ? "clip" : "ellipsis",
        cursor: "pointer",
        lineHeight: "1.4",
        userSelect: "text",
      }}
      title={!expanded ? props.value : undefined}
    >
      {props.value}
    </div>
  );
};

export default TableComponent;
