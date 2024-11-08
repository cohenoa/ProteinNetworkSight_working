import { FC, useState } from "react";
import { IButtonsProps } from "../@types/props";
import { useStateMachine } from "little-state-machine";
import { clearAction } from "../common/ClearAction";

import "../styles/Button.css";

const ButtonsBar: FC<IButtonsProps> = ({ formId, step, goBackStep }) => {
  const { state, actions } = useStateMachine({ clearAction });

  return (
    <div className="row-buttons">
      {step !== 1 && (
        <button
          className="btn btn--outline btn--wide"
          type="button"
          disabled={state.isLoading}
          onClick={() => {
            goBackStep();
          }}
        >
          back
        </button>
      )}
      {step === 1 && (
        <button
          className="btn btn--outline btn--wide"
          type="button"
          disabled={state.isLoading}
          onClick={() => {
            actions.clearAction();
          }}
        >
          clear file
        </button>
      )}
      {step !== 5 && (
        <button
        className="btn  btn--primary btn--wide"
        type="submit"
        disabled={state.isLoading}
        form={formId}
        >
        next
      </button>
      )}
    </div>
  );
};

export default ButtonsBar;
