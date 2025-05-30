import { FC } from "react";
import { StateMachineProvider, createStore } from "little-state-machine";
import { emptyState } from "../common/EmptyState";
import MainContent from "../components/MainContent";
import "../styles/Action.css";

createStore({ ...emptyState });

export const ActionPage: FC = () => {
  return (
    <StateMachineProvider>
      <MainContent />
    </StateMachineProvider>
  );
};

export default ActionPage;
