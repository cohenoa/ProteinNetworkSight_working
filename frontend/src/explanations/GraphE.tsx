import { FC } from "react";
import "../styles/Explanation.css";

const GraphExplanation: FC = () => {
  return (
    <div className="explanation">
      <p className="welcome">
        We use your data combined with STRING-db data to create graph that shows
        current interactions
      </p>
      <p className="please">
        The obtained network includes the input values represented by nodes
        (node radius corresponds to the input value). The edges are adapted from
        STRING-db. Edge width represents the probability of protein-protein
        interaction.
      </p>
      <p className="please">
        The information can be download as either a table or a network
      </p>
      <p className="please">
        The network can be either visualized online or downloaded as a SVG file
        (editable).
      </p>
      <p className="please">
        Online presentation is interactive: the networks can be changed,
        zoomed-in, zoomed-out or rotated.
      </p>
      <p className="please">
        The information can be download as a json file for further analysis in Cytoscape
      </p>
      <p className="please">
        To save the current layout of the network right click -{">"} Layout -{">"} preset -{">"} save current.
      </p>
      <p className="please">
        To load the saved layout right click -{">"} Layout -{">"} preset -{">"} load preset.
      </p>
      <p className="please">
        You can change the layout of the network by selecting one of the layout options inside of the right click menu under layouts.
        To go back to the layout set before right click on the network and select the preset layout option.
      </p>
      <p className="please">
        Change the opacity of the line by right click and then selecting the opacity option the default opacity is 0.15.
      </p>
    
      {/* <p className="please">
        Table includes several calculated parameters (you can sort by any column
        by hovering over the column name) Here goes a list of all column names
        in the output table with a short description:
      </p> */}
      <ul>
        <span>Nodes:</span>
        <li className="must-item">
          <i className="fa fa-question-circle-o" style={{ color: "black" }} />
          Network nodes represent proteins\ genes.
        </li>
        <li className="must-item">
          <i className="fa fa-circle" style={{ color: "red" }} />
          Red node- positive value.
        </li>
        <li className="must-item">
          <i className="fa fa-circle" style={{ color: "blue" }} />
          Blue node- negative value.
        </li>
        <li className="must-item">
          <i className="fa fa-circle-thin" style={{ fontSize: "25px" }} />
          Node size proportional to input value.
        </li>
        <span>Edges:</span>
        <li className="must-item">
          <i className="fa fa-question-circle-o" style={{ color: "black" }} />
          Edges represent protein-protein interactions.
        </li>
        <li className="must-item">
          <i
            className="fa fa-minus"
            style={{ color: "lightgray", fontSize: "25px" }}
          />
          edge width - probability of protein-protein interaction
        </li>
        <span>Table:</span>
        <li className="must-item">
          <i className="fa fa-sort-amount-desc" style={{ color: "black" }} />
          Table can help you sort the nodes by calculated scores.
        </li>
      </ul>
    </div>
  );
};

export default GraphExplanation;
