import { useState, FC } from "react";
import { StateMachineProvider, createStore } from "little-state-machine";
import { emptyState } from "../common/EmptyState";
import { IStepProps, IButtonConfig } from "../@types/props";
import FileDetailsExplanation from "../explanations/FileDetailsE";
import FileUploadExplanation from "../explanations/FileUploadE";
import StringSuggestionsExplanation from "../explanations/StringSuggestionsE";
import GraphExplanation from "../explanations/GraphE";
import FileUploadStep from "../steps/FileUploadS";
import FileDetailsStep from "../steps/FileDetailsS";
import SuggestionsS from "../steps/SuggestionsS";
import Result from "../steps/ResultS";
import SaveResults from "../steps/SaveResults";
import ButtonsBar from "../bars/FormNavigateBar";
import StepsBar from "../bars/StepsBar";
import "../styles/Action.css";
import OthersS from "../steps/OthersS";
import OthersE from "../explanations/OthersE";
import { clearAction } from "../common/ClearAction";
import { useStateMachine } from "little-state-machine";

createStore({ ...emptyState });

export const ActionPage: FC = () => {
  const [step, setStep] = useState<number>(6);
  // const { state, actions } = useStateMachine({ clearAction });

  const goNextStep = () => {
    setStep((prev: number) => prev + 1);
  };

  const goBackStep = () => {
    setStep((prev: number) => prev - 1);
  };

  const renderStepComponent = () => {
    const stepProps: IStepProps = { step: step, goNextStep: goNextStep };
    switch (step) {
      case 1:
        console.log("step 1");
        return <FileUploadStep {...stepProps} />;
      case 2:
        console.log("step 2");
        return <FileDetailsStep {...stepProps} />;
      case 3:
        console.log("step 3");
        return <SuggestionsS {...stepProps} />;
      case 4:
        console.log("step 4");
        return <OthersS {...stepProps} />;
      case 5:
        console.log("step 5");
        return <Result {...stepProps}/>;
      case 6:
        console.log("step 6");
        return <SaveResults />;
      default:
        return <></>;
    }
  };

  const renderStepExplanation = () => {
    switch (step) {
      case 1:
        return <FileUploadExplanation />;
      case 2:
        return <FileDetailsExplanation />;
      case 3:
        return <StringSuggestionsExplanation />;
      case 4:
        return <OthersE />;
      case 5:
        return <GraphExplanation />;
      case 6:
        return <></>;
      default:
        return <></>;
    }
  };

  const renderButtonBar = () => {
    const backButton: IButtonConfig = {
      label: "back",
      type: "button",
      className: "btn btn--outline btn--wide",
      onClick: () => {
        goBackStep();
      },
    };

    const nextButton: IButtonConfig = {
      label: "next",
      type: "submit",
      className: "btn btn--primary btn--wide",
      onClick: () => {
        goNextStep();
      },
    };

    const nextNoOpButton: IButtonConfig = {
      label: "next",
      type: "submit",
      className: "btn btn--primary btn--wide",
      onClick: () => {},
    };

    let bar = [];

    if (step !== 1){
      bar.push(backButton);
    }
    else{
      const clearButton: IButtonConfig = {
        label: "clear file",
        type: "button",
        className: "btn btn--outline btn--wide",
        onClick: () => {
          // actions.clearAction();
        },
      }
      bar.push(clearButton);
    }

    if (step !== 5){
      if (step > 1){
        bar.push(nextNoOpButton);
      }
      else{
        bar.push(nextNoOpButton);
      }
    }
    else{
      let saveButton: IButtonConfig = {
        label: "Save",
        type: "button",
        className: "btn btn--primary btn--wide",
        onClick: () => {
          goNextStep();
        },
      }
      bar.push(saveButton);
    }

    console.log(bar);

    let formID = "form" + step;

    console.log(formID);

    // if (step === 3){
    //   return <></>
    // }
    return <ButtonsBar formId={formID} buttons={bar}></ButtonsBar>;

    // return <ButtonsBar step={step} goNextStep={goNextStep} formId={formID} buttons={bar}></ButtonsBar>;
  }

  return (
    <StateMachineProvider>
      <div className="action-page">
        <div className="explanation-wrapper">{renderStepExplanation()}</div>

        <div className="main-wrapper">
          {step > 4 ? (
            <div className="step-content">{renderStepComponent()}</div>
            ):(
            <div className="steps">
              <div className="step-bar"><StepsBar step={step}/></div>  
              <div className="step-content">{renderStepComponent()}</div>
            </div>
          )}
          <div className="button-bar">{renderButtonBar()}</div>
        </div>
      </div>
    </StateMachineProvider>
  );
};

export default ActionPage;
