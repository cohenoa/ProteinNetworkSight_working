import { useState, FC } from "react";
import { StateMachineProvider, createStore } from "little-state-machine";
import { emptyState } from "../common/EmptyState";
import { IStepProps } from "../@types/props";
import FileDetailsExplanation from "../explanations/FileDetailsE";
import FileUploadExplanation from "../explanations/FileUploadE";
import StringSuggestionsExplanation from "../explanations/StringSuggestionsE";
import GraphExplanation from "../explanations/GraphE";
import FileUploadStep from "../steps/FileUploadS";
import FileDetailsStep from "../steps/FileDetailsS";
import SuggestionsS from "../steps/SuggestionsS";
import Result from "../steps/ResultS";
import ButtonsBar from "../bars/FormNavigateBar";
import StepsBar from "../bars/StepsBar";
import "../styles/Action.css";
import OthersS from "../steps/OthersS";
import OthersE from "../explanations/OthersE";

createStore({ ...emptyState });

export const ActionPage: FC = () => {
  const [step, setStep] = useState<number>(1);

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
        return <FileUploadStep {...stepProps} />;
      case 2:
        return <FileDetailsStep {...stepProps} />;
      case 3:
        return <SuggestionsS {...stepProps} />;
      case 4:
        return <OthersS {...stepProps} />;
      case 5:
        return <Result />;
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
      default:
        return <></>;
    }
  };

  return (
    <StateMachineProvider>
      <div className="action-page">
        <div className="explanation-wrapper">{renderStepExplanation()}</div>

        {step === 5 ? (


            <div className="result">
              <Result />
              <div className="buttons-bar">
              <ButtonsBar
                formId={"form" + step}
                step={step}
                goBackStep={goBackStep}
                goNextStep={goNextStep}
              />
          </div>
            </div>):(
              <div className="steps">
                {step !== 5 && (
                    <div className="step-bar">
                      <StepsBar step={step} />
                    </div>  
                )}
                <div className="step-content">{renderStepComponent()}</div>

                <div className="buttons-bar">
                  <ButtonsBar
                    formId={"form" + step}
                    step={step}
                    goNextStep={goNextStep}
                    goBackStep={goBackStep}
                  />
                </div>
              </div>
            )}

        
          
        
      </div>
    </StateMachineProvider>
  );
};

export default ActionPage;
