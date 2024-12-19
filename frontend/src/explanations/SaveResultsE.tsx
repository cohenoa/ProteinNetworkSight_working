import { FC } from "react";

const SaveResultsExplanations: FC = () => {
  return (
    <div className="explanation">
      <p className="welcome">
        Saving your results!
      </p>
      <p className="please">
        This is where you can download a new data file with STRING mappings and all of your graphs.
      </p>
      <ul>
        <span>Saving data file:</span>
        <li className="must-item">
          {/* <i className="fa fa-info" /> */}
          <i className="fa">{String.fromCharCode(8594)}</i>
           replace your name with the STRING match in the new data file
        </li>

        <li className="must-item">
        <i className="fa">{String.fromCharCode(0x274C)}</i>
          delete names without STRING match from the new data file
        </li>

        <li className="must-item">
          <i className="fa fa-info" />
          use the buttons at the bottom to apply a change to the whole list
        </li>

        <li className="must-item">
          <i className="fa fa-info" />
          click the save button to download your new data file!
        </li>
      </ul>

      <ul>
        <span>Saving Graphs:</span>
        <li className="must-item">
          <i className="fa fa-info" />
          apply your desired layout, node size, edge opcaity, file type
        </li>

        <li className="must-item">
          <i className="fa fa-info" />
          use the top menu to apply changes to the whole list
        </li>

        <li className="must-item">
          <i className="fa fa-info" />
          the list is initialized with your preset settings(or default).
        </li>

        <li className="must-item">
          <i className="fa fa-info" />
          use the save button to download all the graphs
        </li>

      </ul>

    </div>
  );
};

export default SaveResultsExplanations;