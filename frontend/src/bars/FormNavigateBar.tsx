import { FC, useEffect, useState } from "react";
import { IButtonsProps, IButtonConfig } from "../@types/props";
import { useStateMachine } from "little-state-machine";
import { clearAction } from "../common/ClearAction";
import "../styles/Button.css";

const ButtonsBar: FC<IButtonsProps> = ( {formId, buttons} ): any => {
  const { state, actions } = useStateMachine({ clearAction });

  // console.log(props.buttons);

  return (
    <div className="row-buttons">
      {buttons.map((button: IButtonConfig, index: number) => {
        return(
          <button
          key={index}
          className={`${button.className}`}
          type={button.type}
          disabled={state.isLoading}
          form={button.type === "submit" ? formId : undefined}
          onClick={() => button.onClick()}
        >
          {button.label}
        </button>
        )})}
    </div>
  );
};

export default ButtonsBar;
