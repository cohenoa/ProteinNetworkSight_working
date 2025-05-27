import { FC } from "react";
import { NavLink } from "react-router-dom";
import logo from '../assets/logo.png'; // Tell webpack this 
import "../styles/Topbar.css";
type navProps = { isActive: boolean; isPending: boolean };

const TopbarComponent: FC = () => {
  const getNavClassName = (navInfo: navProps) => {
    let className = "nav-links";
    if (navInfo.isActive) {
      className += " active-nav";
    }
    return className;
  };

  return (
    <header className="topbar">
      <div className="logo-container">
        <NavLink end to="/" className="logo">
        <img src={logo} style={{ width: "100%", height: "50%"}}  />
        </NavLink>
      </div>
      <div className="menu-container">
        <ul className="nav-menu">
          <li className="nav-item">
            <NavLink end to="/" className={getNavClassName}>
              Home
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink end to="/create-network" className={getNavClassName}>
              Create Network
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink end to="/tutorial" className={getNavClassName}>
              Tutorial
            </NavLink>
          </li>
        </ul>
      </div>
    </header>
  );
};

export default TopbarComponent;
