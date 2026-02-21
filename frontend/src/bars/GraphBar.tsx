import { FC, useState } from "react";
import { IGraphBarProps } from "../@types/props";
import "../styles/GraphBar.css";
import "../styles/FileDetails.css";
import { threshMap } from "../@types/global";

const GraphBar: FC<IGraphBarProps> = ({
  openTable,
  setOpenTable,
  nodesNum,
  linksNum,
  filteredNodes,
  thresholds,
  setThresholds,
}) => {
  const [tempThreashold, setTempThresholds] = useState<threshMap>({
    pos: thresholds.pos,
    neg: thresholds.neg,
  });
  console.log("filteredNodes: ", filteredNodes)

  const setPos = (posValue: number) => {
    setTempThresholds((curr: threshMap) => {
      return { ...curr, pos: posValue };
    });
  };

  const setNeg = (negValue: number) => {
    setTempThresholds((curr: threshMap) => {
      return { ...curr, neg: negValue };
    });
  };

  const btnSubmitThresholds = () => {
    setThresholds(tempThreashold);
  };

  return (
    <div className="graphbar-container">
      <div className="btns-row">
        <div className="btns-container">
          <button
            className="btn btn--outline btn--wide"
            onClick={() => setOpenTable((prev) => !prev)}
          >
            {openTable ? "Show as graph" : "Show as Table"}
          </button>
        </div>
        {/* <h1 className="title">{clickedVector}</h1> */}
        <div className="graph-info">
          Nodes: {nodesNum}, Links: {linksNum}
          {CollapseSection({
            label: "Filtered Nodes",
            children: filteredNodes.map((node) => (
              <div key={node.orgName + node.stringName}>
                {`${node.orgName}(${node.stringName})`}
              </div>
            )),
          })
          }
        </div>
        <div className="threashold-row">
          <label className="thresholdTitle" htmlFor="positiveThreshold">P. Threshold: </label>
          <input
            id="positiveThreshold"
            type="number"
            step="0.01"
            className="text-input"
            min={0}
            max={1}
            value={tempThreashold.pos}
            required
            onChange={(e) => setPos(Number(e.target.value))}
          />
          <label className="thresholdTitle" htmlFor="negativeThreshold">N. Threshold: </label>

          <input
            id="negativeThreshold"
            type="number"
            step="0.01"
            className="text-input"
            min={-1}
            max={0}
            value={tempThreashold.neg}
            required
            onChange={(e) => setNeg(Number(e.target.value))}
          />
          <button
            className="btn btn--gray btn--small"
            onClick={btnSubmitThresholds}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

type CollapseSectionProps = {
  label: string;
  children: React.ReactNode;
};

function CollapseSection({ label, children }: CollapseSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {open ? "▼" : "▶"} {label}
      </button>

      {/* Floating panel */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            width: "fit-content",
            maxHeight: "calc(100vh - 100px)",
            overflowY: "scroll",
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: 6,
            padding: 10,
            marginTop: 4,
            zIndex: 1000, // ensures it sits above the graph
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default GraphBar;
