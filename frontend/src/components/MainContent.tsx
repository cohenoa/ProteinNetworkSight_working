import { useState, useRef } from "react";
import { IStepProps, IButtonConfig, formRef } from "../@types/props";
import FileDetailsExplanation from "../explanations/FileDetailsE";
import FileUploadExplanation from "../explanations/FileUploadE";
import StringSuggestionsExplanation from "../explanations/StringSuggestionsE";
import SaveResultsExplanations from "../explanations/SaveResultsE";
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


const MainContent = () => {
  const [step, setStep] = useState<number>(1);
  const saveFormRef = useRef<formRef>(null);
  const { actions } = useStateMachine({ clearAction })

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
        return <SaveResults formRef={saveFormRef}/>;
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
        return <SaveResultsExplanations/>;
      default:
        return <></>;
    }
  };

  const renderButtonBar = () => {
    let bar = [];

    const backButton: IButtonConfig = {
      label: "back",
      type: "button",
      className: "btn btn--outline btn--wide",
      onClick: () => {
        goBackStep();
      },
    };

    const nextNoOpButton: IButtonConfig = {
      label: "next",
      type: "submit",
      className: "btn btn--primary btn--wide",
      onClick: () => {},
    };

    if (step !== 1){
      bar.push(backButton);
    }
    else{
      const clearButton: IButtonConfig = {
        label: "clear file",
        type: "button",
        className: "btn btn--outline btn--wide",
        onClick: () => {
          actions.clearAction();
        },
      }
      bar.push(clearButton);
    }

    if (step < 5){
      bar.push(nextNoOpButton)
    }
    else if (step === 5){
      const goSave: IButtonConfig = {
        label: "Save",
        type: "button",
        className: "btn btn--primary btn--wide",
        onClick: () => {
          goNextStep();
        },
      }
      bar.push(goSave);
    }
    else if (step === 6){
      const saveButton: IButtonConfig = {
        label: "Save",
        type: "button",
        className: "btn btn--primary btn--wide",
        onClick: () => {
          if (saveFormRef.current) {
            const formData = saveFormRef.current.getFormData();
            console.log('Data from Son:', formData);
          }
          else{
            console.log("formRef is null: " + saveFormRef);
          }
          console.log('clicked button');
          
        },
      }
      bar.push(saveButton);
    }

    return <ButtonsBar formId={"form" + step} buttons={bar}></ButtonsBar>;
  }

  return (
    <div className="action-page">
      <div className="explanation-wrapper">{renderStepExplanation()}</div>
      <div className="main-wrapper">
        {step > 4 ? (
          <div className="step-content full">{renderStepComponent()}</div>
          ):(
          <div className="steps">
            <div className="step-bar"><StepsBar step={step}/></div>  
            <div className="step-content">{renderStepComponent()}</div>
          </div>
        )}
        <div className="buttons-bar">{renderButtonBar()}</div>
      </div>
    </div>
  )
}

export default MainContent;