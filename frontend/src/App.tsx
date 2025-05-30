import { FC } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./pages/Home";
import "./styles/App.css";
import TopbarComponent from "./bars/Topbar";
import FooterComponent from "./bars/Footer";
import ActionPage from "./pages/Action";
import Tutorial from "./pages/Tutorial";

const App: FC = () => {
  return (
    <BrowserRouter>
      <TopbarComponent />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create-network" element={<ActionPage />} />
        <Route path="/tutorial" element={<Tutorial />} />
      </Routes>
      <FooterComponent />
    </BrowserRouter>
  );
};

export default App;
