import { FC, useEffect, useState } from "react";
import { IButtonsProps, IButtonConfig } from "../@types/props";
import { useStateMachine } from "little-state-machine";
import { clearAction } from "../common/ClearAction";
import "../styles/Button.css";

const ButtonsBar: FC<IButtonsProps> = ( props: IButtonsProps): any => {
  const { state, actions } = useStateMachine({ clearAction });

  console.log(props.buttons);

  return (
    <div className="buttons-bar">
      <div className="row-buttons">
        {props.buttons.map((button: IButtonConfig, index: number) => {
          console.log(button);
          console.log(index);
          return(
            <button
            key={index}
            className={`${button.className}`}
            type={button.type}
            disabled={state.isLoading}
            form={button.type === "submit" ? props.formId : undefined}
            onClick={button.onClick ? () => button.onClick() : undefined}
          >
            {button.label}
          </button>
          )})}
      </div>
    </div>
  );
};

export default ButtonsBar;
