import { FC } from "react";
import "../styles/Explanation.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDiagramProject, faDownload, faFloppyDisk, faArrowPointer, faPencil, faComputerMouse, faBrush, faUpRightAndDownLeftFromCenter } from '@fortawesome/free-solid-svg-icons';

const GraphExplanation: FC = () => {
  return (
    <div className="explanation">
      <p className="welcome">
        We use your data combined with STRING-db data to create graph that shows
        current interactions
      </p>
      <p className="please">
        The obtained network includes the input values represented by nodes. 
        The edges are adapted from STRING-db.
      </p>
      <p className="please">
        in this page you can interact with individual graphs. 
        if you wish to download your data or all the graphs at once click the "save" button below
      </p>
      <ul>
        <span>Nodes:</span>
        <li className="must-item">
          <i className="fa fa-question-circle-o" style={{ color: "black" }} />
          Network nodes represent proteins \ genes.
        </li>
        <li className="must-item">
          <i className="fa fa-question-circle-o" style={{ color: "black" }} />
          Missing nodes passed the thresholds but have no STRING match. Find them a match in the previous step to see them on the graph.
        </li>
        <li className="must-item">
          <i className="fa fa-circle" style={{ color: "blue" }} />
          Blue node - positive value.
        </li>
        <li className="must-item">
          <i className="fa fa-circle" style={{ color: "red" }} />
          Red node - negative value.
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
          edge width - strength of protein-protein interaction
        </li>
        <span>Options:</span>
        <li className="must-item">
          <FontAwesomeIcon className="icon" icon={faArrowPointer} fixedWidth={true} style={{ fontSize: "20px" }}/>
          move any node by dragging it with the mouse
        </li>
        <li className="must-item">
          <FontAwesomeIcon className="icon" icon={faComputerMouse} fixedWidth={true} style={{ fontSize: "20px" }}/>
          zoom in or out by scrolling to focus on a specific part of the graph
        </li>
        <li className="must-item">
          <FontAwesomeIcon className="icon" icon={faComputerMouse} fixedWidth={true} style={{ fontSize: "20px" }}/>
          use the right click menu to cutomize your graph!
        </li>
        <li className="must-item">
          <FontAwesomeIcon className="icon" icon={faDiagramProject} fixedWidth={true} style={{ fontSize: "20px" }}/>
          change the Layout of the nodes to gain valuable insight
        </li>
        <li className="must-item">
          <FontAwesomeIcon className="icon" icon={faUpRightAndDownLeftFromCenter} fixedWidth={true} style={{ fontSize: "20px" }}/>
          change the size of the nodes to your liking
        </li>
        <li className="must-item">
          <FontAwesomeIcon className="icon" icon={faBrush} fixedWidth={true} style={{ fontSize: "20px" }}/>
          change the color of the nodes to your liking
        </li>
        <li className="must-item">
          <FontAwesomeIcon className="icon" icon={faPencil} fixedWidth={true} style={{ fontSize: "20px" }}/>
          change the opacity of the edges to your liking
        </li>
        <li className="must-item">
          <FontAwesomeIcon className="icon" icon={faFloppyDisk} fixedWidth={true} style={{ fontSize: "20px" }}/>
          like the layout? Save it so you can come back to it later!
        </li>
        <li className="must-item">
          <FontAwesomeIcon className="icon" icon={faFloppyDisk} fixedWidth={true} style={{ fontSize: "20px" }}/>
          reload your saved graph from the right click menu
        </li>
        <li className="must-item">
          <FontAwesomeIcon className="icon" icon={faDownload} fixedWidth={true} style={{ fontSize: "20px" }}/>
          download the graph in a varaiaty of formats - SVG, PNG or JSON
        </li>
        <span>Table:</span>
        <li className="must-item">
          <i className="fa fa-sort-amount-desc" style={{ color: "black" }} />
          Table can help you see the actual data represented by the graph
        </li>
      </ul>
    
      {/* <p className="please">
        Table includes several calculated parameters (you can sort by any column
        by hovering over the column name) Here goes a list of all column names
        in the output table with a short description:
      </p> */}
      
    </div>
  );
};

export default GraphExplanation;
