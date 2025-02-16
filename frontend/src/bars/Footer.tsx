import { FC } from "react";
import "../styles/Footer.css";

const lastUpdate = "25 February, 2023"

const FooterComponent: FC = () => {
  return (
    <div className="footer-container">

      <div className="leftFooter">
        <div className="name">
          {/* <p>This website was developed by Tohar Tsivtman & Ayelet Gibli (2022), Aviv Eldad (2023), Nitzan Migdal (2023-2024), Omri Nahor (2023-2025).</p> */}
          <p>This website was developed by</p>
          <p className="names">Tohar Tsivtman and Ayelet Gibli(2022)</p>
          <p className="names">Aviv Eldad (2023)</p>
          <p className="names">Nitzan Migdal(2023-2024)</p>
          <p className="names">Omri Nahor(2023-2025)</p>
          {/* <p className="names">Tohar Tsivtman and Ayelet Gibli</p>
          <p className="names">Nitzan Migdal and Omri Nahor</p>

          <p className="names">Aviv Eldad</p>   */}
        </div>
        <div className="update">
          <p className="update">Last database update: {lastUpdate}</p>
          {/* <p className="update">{lastUpdate}</p> */}
        </div>
    </div>
    
    <div className="years">
    <p className="year">2022</p>
    <p className="year">2023</p>
    <p className="year">2024</p>
    <p className="year">2025</p>
  </div>
  </div>
  );
};

export default FooterComponent;
