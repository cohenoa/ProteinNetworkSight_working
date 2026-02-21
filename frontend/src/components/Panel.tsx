import { FC } from "react";
import { IPanelProps } from "../@types/props";
import { useState } from "react";
import "../styles/Panel.css";

const Panel: FC<IPanelProps> = ({ node, organism, onClickClose }) => {

  const [isLoadingUniprot, setIsLoadingUniprot] = useState(false);

  function getDrugComponent() {
    if (node == undefined || node.drug == undefined || node.drug.length == 0) {
      return "drug not found";
    }
    return node.drug.map((drug, index) => {
      const key = drug.drugBankID ?? `${drug.drugName}-${index}`;
      const ending = index == node.drug.length - 1 ? "" : ", ";

      if (drug.drugBankID == undefined || drug.drugBankID == null || drug.drugBankID == "None"){
        return (
          <span className="paragraph-style" key={key} style={{color: "black"}}>
            {drug.drugName}{ending}
          </span>
        );
      }
      const link = "https://go.drugbank.com/drugs/" + drug.drugBankID;
      return (
        <span key={key}>
          <a href={link} target="_blank" rel="noopener noreferrer">{drug.drugName}</a>{ending}
        </span>
      );
    });
  }

  async function handleUniprotLinkClick() {
    setIsLoadingUniprot(true);
    try {
      const uniprotQueryUrl = `https://rest.uniprot.org/uniprotkb/search?query=(reviewed:true)%20AND%20(organism_id:${organism.value})%20AND%20(gene:${node?.string_name})`;
      
      const response = await fetch(uniprotQueryUrl);
      if (!response.ok) {
        throw new Error(`Uniprot API call failed with status ${response.status}`);
      }

      const apiData = await response.json();

      // Safely extract the primary accession ID from the first result
      const primaryAccession: string | undefined = apiData.results?.[0]?.primaryAccession;

      if (!primaryAccession) {
        if (apiData.results?.length === 0) {
          throw new Error("No results found in UniProt response.");
        }
        else{
          throw new Error("No primaryAccession found in UniProt response.");
        }
      }

      // Build the final UniProt entry URL
      const entryUrl = `https://www.uniprot.org/uniprotkb/${primaryAccession}/entry`;
      console.log(entryUrl);
      window.open(entryUrl, "_blank");
    } catch (err) {
      // console.error("Error fetching organism info:", err);
      alert("Error fetching Uniprot link: " + err);
    }
    setIsLoadingUniprot(false);
  }

  return (
    <div className="panel-container">
      <div>
        <button onClick={onClickClose} className = "close-button">X</button>
      </div>
      <div>
        <p className="paragraph-style">
          <span className="panel-container-span">Name:</span>
          {node?.id}
        </p>
        <p className="paragraph-style">
          <span className="panel-container-span">STRING Name:</span>
          {node?.string_name}
        </p>
        <p>
          <span className="panel-container-span">Organism:</span>
          {organism.label}
        </p>
        <p>
          <span 
            className="panel-container-span clickable-link"
            onClick={handleUniprotLinkClick}>
              Link to UniProt
          </span>
          {isLoadingUniprot && <span>Loading...</span>}
        </p>
        <p className="paragraph-style">
          <span className="panel-container-span">Weighted Node Degree:</span>
          {node?.linksWeights}
        </p>
        <p className="paragraph-style">
          <span className="panel-container-span">Node Value:</span>
          {node?.size}
        </p>
        <p className="paragraph-style">
          <span className="panel-container-span">Final Score:</span>
          {node && node.size / 2 + node.linksWeights / 2}
        </p>
        <p className="paragraph-style">
          <span className="panel-container-span">Info:</span> {node?.info}
        </p>
        <p className="paragraph-style">
          <span className="panel-container-span">Drugs:</span>
          {getDrugComponent()}
        </p>
        <p className="paragraph-style">
          <span className="panel-container-span">Links:</span>
          {node?.links.join(', ')}
        </p>
       
      </div>
    </div>
  );
};

export default Panel;
