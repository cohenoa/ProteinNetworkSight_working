import { FC } from "react";
import { Link } from "react-router-dom";
import "../styles/Home.css";
import "../styles/Button.css";
import { openLink } from "../common/GeneralCommon";
import homeImageLight from "../assets/HomeImageSCWhite.png";
const gitLink = "https://github.com/cohenoa/ProteinNetworkSight_working";

export const HomePage: FC = () => {
  return (
    <div className="prompt" style={{ backgroundImage: `url(${homeImageLight})`, backgroundRepeat: "no-repeat", backgroundSize: "cover" }}>
      <h1>
        Simultaneous building
        <br /> of multiple molecular
        <br /> sub-networks
        <br /> from patients’ data
        <br /> and assigning drugs
      </h1>

      <div className="prompt-btns">
        <Link to="/tutorial" className="btn-mobile">
          <button className="btn btn--outline btn--wide">
            Read tutorial <i className="fa fa-indent" />
          </button>
        </Link>
        <Link to="/create-network" className="btn-mobile">
          <button className="btn btn--primary btn--wide">
            Create Network <i className="fa fa-upload"></i>
          </button>
        </Link>
      </div>

      <h5>Cite us: [Article]</h5>
      <h5>
        An open-source of the tool is available&nbsp;
         <button
          className="btn--here"
          onClick={() => {openLink(gitLink)}}
        >
          here
        </button>
        .
      </h5>
      <h5>This web-based research tool is provided free of charge and may be used</h5>
      <h5>by any user, including commercial entities, for any purpose without restrictions</h5>
      {/* <h5>
        We provide free and open access to all users, including commercial users. 
      </h5> */}
      <h5>Support contact details:</h5>
      <div className="detailsContainer">
        <div className="info first-info">
          <h5 className="about-h5">Noa Cohen</h5>
          <h5 className="inlineText"><i className="fa fa-envelope"/>noace@jce.ac.il</h5>
        </div>
        <div className="info">
          <h5 className="about-h5">Nataly Kravchenko-Balasha</h5>
          <h5 className="inlineText"><i className="fa fa-envelope"/>natalyk@ekmd.huji.ac.il</h5>
        </div>
      </div>

      <div className="detailsContainer">
        <div className="info">
          <h5 className="about-h5">Omri Nahor</h5>
          <h5 className="inlineText"><i className="fa fa-envelope"/>omrinahor@gmail.com</h5>
        </div>
      </div>

      <div className="creditsContainer">
        <div className="credits">
          <h5>The website has been<br/> 
            continuously developed<br/> 
            since 2022, by:</h5>
        </div>
        <div className="credits-list">
          <h5 className="creditRow">Tohar Tsivtman and Ayelet Gibli (2022)</h5>
          <h5 className="creditRow">Aviv Eldad (2023)</h5>
          <h5 className="creditRow">Nitzan Migdal (2023-2024)</h5>
          <h5 className="creditRow">Omri Nahor (2023-2026)</h5>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
