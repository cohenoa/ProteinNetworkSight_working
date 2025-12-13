import { FC } from "react";
import "../styles/Footer.css";

const STRING_version = "V12.0"

const FooterComponent: FC = () => {
  return (
    <div className="footer-container">
      <div className="footer-section">
          <div className="version">
            <p className="version">Using STRING version: {STRING_version}</p>
          </div>
      </div>
    </div>
  )
}

// const FooterComponent: FC = () => {
//   return (
//     <div className="footer-container">

//       <div className="leftFooter">
//         <div className="name">
//           <p style={{marginLeft:"10px"}}> Developed and maintained by</p>
//           <p className="names">Omri Nahor(2023-2025)</p>
//           <p className="names">Nitzan Migdal(2023-2024)</p>
//           <p className="names">Aviv Eldad (2023)</p>
//           <p className="names">Tohar Tsivtman and Ayelet Gibli(2022)</p>
//         </div>
//         <div className="update">
//           <p className="update">Using STRING version: {STRING_version}</p>
//         </div>
//     </div>
//   </div>
//   );
// };

export default FooterComponent;
