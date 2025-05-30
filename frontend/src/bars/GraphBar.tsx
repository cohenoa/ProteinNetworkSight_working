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
  clickedVector,
  thresholds,
  setThresholds,
}) => {
  const [tempThreashold, setTempThresholds] = useState<threshMap>({
    pos: thresholds.pos,
    neg: thresholds.neg,
  });

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
        </div>
        <div className="threashold-row">
        <label htmlFor="positiveThreshold">P. Threshold: </label>
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
        <label htmlFor="negativeThreshold">N. Threshold: </label>

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

     
      <p className="graph-notice">
        Once the graph has loaded, you can move any individual node (this may take a few seconds). To move a node, left-click and drag.
        {/* It is possible to move any individual node,&nbsp;
        <span className="bold">once the graph has loaded (may take a few seconds).</span> To move
        a node, left-click and drag it */}
      </p>
    </div>
  );
};

export default GraphBar;
