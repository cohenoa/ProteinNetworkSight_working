import { FC } from "react";
import { IPanelProps } from "../@types/props";
import "../styles/Panel.css";
import { makePostRequest } from "../common/PostRequest";

const Panel: FC<IPanelProps> = ({ node, organism, onClickClose }) => {
  console.log(node);

  async function handleOrganismClick() {
    // try {
    //   const uniprotQueryUrl = `https://www.uniprot.org/uniprotkb?query=%28gene%3A${node.string_name}%29+AND+%28organism_id%3A${organism.value}%29+AND+%28reviewed%3Atrue%29`;
    //   console.log(uniprotQueryUrl);
    //   const body = JSON.stringify({ url: uniprotQueryUrl });
    //   makePostRequest(body, "uniprot", handleUniprotResponse);
    // } catch (err) {
    //   console.error("Error fetching organism info:", err);
    // }
  }

  function handleUniprotResponse(data: any) {
    // console.log(data);
    // const primaryAccession: string | undefined = data.results?.[0]?.primaryAccession;

    // if (!primaryAccession) {
    //   throw new Error("No primaryAccession found in UniProt response.");
    // }

    // const entryUrl = `https://www.uniprot.org/uniprotkb/${primaryAccession}/entry`;

    // window.open(entryUrl, "_blank");
  }

  return (
    <div className="panel-container">
      <div>
        <button onClick={onClickClose} className = "close-button">X</button>
      </div>
      <div>
        <p className="paragraph-style">
          <span className="panel-container-span">ID:</span>
          {node.id}
        </p>
        <p>
          <span className="panel-container-span">Organism:</span>
          {organism.label}
        </p>
        <p>
          <span 
            className="panel-container-span clickable-link"
            onClick={handleOrganismClick}>
              Link to UniProt
          </span>
        </p>
        <p className="paragraph-style">
          <span className="panel-container-span">Weighted Node Degree:</span>
          {node.linksWeights}
        </p>
        <p className="paragraph-style">
          <span className="panel-container-span">Node Value:</span>
          {node.size}
        </p>
        <p className="paragraph-style">
          <span className="panel-container-span">Final Score:</span>
          {node.size / 2 + node.linksWeights / 2}
        </p>
        <p className="paragraph-style">
          <span className="panel-container-span">Info:</span> {node.info}
        </p>
        <p className="paragraph-style">
          <span className="panel-container-span">Drug:</span>
          {node.drug}
        </p>
        <p className="paragraph-style">
          <span className="panel-container-span">Links:</span>
          {node.links.join(', ')}
        </p>
       
      </div>
    </div>
  );
};

export default Panel;
