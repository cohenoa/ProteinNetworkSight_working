import React from 'react';
import { useForm } from "react-hook-form";
// import {useState} from 'react'
import "../styles/FileDetails.css";
import "../styles/ThresholdModal.css";
import { threshMap } from '../@types/global';

interface ThresholdsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (thresholds: Array<Array<number>>) => void;
  length: number;
  headers: Array<String>;
  defaultValues: threshMap;
}

const ThresholdsModal: React.FC<ThresholdsModalProps> = ({ isOpen, onClose, onConfirm, length , headers, defaultValues}) => {
  const [thresholds, setThresholds] = React.useState<Array<Array<number>>>( Array.from({ length }, () => [defaultValues.pos, defaultValues.neg]));
  const modalStyle: React.CSSProperties = {
    display: isOpen ? 'block' : 'none',
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#fff',
    height: '80%',
    width: '40%',
    padding: '20px', // Increase padding for a larger modal
    borderRadius: '8px', // Add rounded corners if desired
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)', // Add a subtle shadow
    zIndex: 1000,
  };
  
  console.log(defaultValues);
  console.log("thresholds: ", thresholds);

  const handleInputChange = (rowIndex: number, colIndex: number, value: String) => {
    thresholds[rowIndex][colIndex] = Number(value);
  };
  
  const renderInputFields = () => {

    return thresholds.map((row, rowIndex) => (
      <div key={rowIndex} className="vectorWrapper">

        <label className="vectorHeader">Thresholds for {headers[rowIndex]}</label>

        <div className="ThresholdsWrapper">
          <div className="Threshfield">
          <label htmlFor={"positiveThreshold".concat(String(headers[rowIndex]))}>Positive Threshold:</label>
            <input
              id={"positiveThreshold".concat(String(headers[rowIndex]))}
              type="number"
              step="0.0001"
              className="text-input"
              min={0}
              max={1}
              defaultValue={defaultValues.pos}
              onChange={(e) => handleInputChange(rowIndex, 0, e.target.value)}

            />
          </div>

          <div className="Threshfield">
            <label htmlFor={"negativeThreshold".concat(String(headers[rowIndex]))}>Negative Threshold:</label>
            <input
              id={"negativeThreshold".concat(String(headers[rowIndex]))}
              type="number"
              step="0.0001"
              className="text-input"
              min={-1}
              max={0}
              defaultValue={defaultValues.neg}
              key={0}
              onChange={(e) => handleInputChange(rowIndex, 1, e.target.value)}
            />
          </div>
        </div>
      </div>
    ));
  };
  
  return (
    <div style={modalStyle}>
      <div style={{height: '100%', width: '100%'}}>
        <div className="formWrapper">
          {renderInputFields()}
        </div>

        {/* Buttons at the bottom */}
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
              <button type="button" className="btn btn--outline btn--wide" onClick={onClose}>CANCEL</button>
              <button type="button" className="btn btn--primary btn--wide" onClick={() => onConfirm(thresholds)}>CONFIRM</button>
          </div>
      </div>
    </div>
  );
};

export default ThresholdsModal;