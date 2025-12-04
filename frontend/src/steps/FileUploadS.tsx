import { useStateMachine } from "little-state-machine";
import { FC, FormEvent, useEffect, useState } from "react";
import { read, utils } from "xlsx";
import { IStepProps } from "../@types/props";
import { updateFileUpload, updateFileName, updateIsLoading, updatestringNames, updateNamesMap } from "../common/UpdateActions";
import { clearAction } from "../common/ClearAction";
import "../styles/FileUpload.css";
import { getExampleFile } from "../common/ExampleFileAction";
import { set } from "idb-keyval";
import { INamesStringMap } from "../@types/global";

const MAX_ROWS = 2000;

const FileUploadStep: FC<IStepProps> = ({ step, goNextStep }) => {
  const { state, actions } = useStateMachine({
    updateFileName,
    updateFileUpload,
    clearAction,
    updateIsLoading,
    updatestringNames,
    updateNamesMap,
  });

  const [file, setFile] = useState<File | null>(null);
  const [hasError, setHasError] = useState<string | null>(null);
  const [isExampleFile, setIsExampleFile] = useState(false);

  useEffect(() => {
    actions.clearAction();
  }, []);

  useEffect(() => {
    if (state.fileName.length === 0){
      setFile(null);
      setIsExampleFile(false);
    };
  }, [state.fileName]);

  const onFileDrop = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    const uploadedFile = event.target.files[0];

    setFile(uploadedFile);
    actions.updateFileName({ fileName: uploadedFile.name });
    setHasError(null);
    setIsExampleFile(false);
  };

  const useExampleFile = () => {
    actions.clearAction();
    actions.updateFileName({ fileName: "example_data.xlsx" });
    setIsExampleFile(true);
    setHasError(null);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isExampleFile) {
      console.log("using example file");
      actions.updateFileUpload(getExampleFile());
      set(state.fileName, getExampleFile());
      goNextStep();
      return;
    }

    if (!file) {
      setHasError("No file selected.");
      return;
    }

    const fileType = file.name.split(".").pop()?.toLowerCase();
    if (!fileType || !["xlsx", "csv"].includes(fileType)) {
      setHasError("Invalid file format. Please upload an XLSX or CSV file.");
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => setHasError("Error reading file.");

    reader.onload = (e) => {
      if (!e.target?.result) {
        setHasError("Failed to load file.");
        return;
      }

      if (fileType === "xlsx") {
        processXLSXFile(e.target.result as ArrayBuffer);
      } else if (fileType === "csv") {
        processCSVFile(e.target.result as string);
      }
    };

    if (fileType === "xlsx") {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const processXLSXFile = (data: ArrayBuffer) => {
    const workbook = read(new Uint8Array(data), { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const fileData = utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    processParsedData(fileData);
  };

  const processCSVFile = (data: string) => {
    const fileData = data.split("\n").map(row => row.split(","));
    processParsedData(fileData);
  };

  const processParsedData = (fileData: any[][]) => {
    fileData = filterByFirstColumnUnique(fileData);
    
    if (fileData.length > MAX_ROWS) {
      setHasError(`File exceeds ${MAX_ROWS} rows. Please split it.`);
      return;
    }

    const headers = fileData.shift() as string[];
    if (!headers || headers.length < 2) {
      setHasError("Invalid file structure: must have at least two columns.");
      return;
    }

    if (headers.includes("STRING Name")) {
      processStringNameFile(fileData, headers);
    } else {
      uploadFileData(fileData, headers);
    }
  };

  function filterByFirstColumnUnique(data: any[][]): any[][] {
    const seen = new Set<any>();

    return data.filter(row => {
      const key = row[0];
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  const processStringNameFile = (fileData: any[][], headers: string[]) => {
    console.log("loading saved file");
    const namesStringMap: INamesStringMap = {};
    
    fileData.forEach(row => {
      if (row[1]) {
        namesStringMap[row[0]] = { stringId: row[2], stringName: row[1] };
      } else {
        namesStringMap[row[0]] = { stringId: "0", stringName: "" };
      }
      row.splice(1, 2);
    });

    headers = headers.filter(h => h !== "STRING id" && h !== "STRING Name");
    actions.updateFileUpload({ json: fileData, headers });
    actions.updateNamesMap({ namesStringMap });
    goNextStep();
  };

  const uploadFileData = (fileData: any[][], headers: string[]) => {
    if (!fileData.length) {
      setHasError("File is empty or invalid.");
      return;
    }
    actions.updateFileUpload({ json: fileData, headers });
    set(state.fileName, {json: fileData, headers: headers});
    goNextStep();
  };

  return (
    <form className="upload-form" id={"form" + step} onSubmit={onSubmit}>
      <div className="upload-wrap">
        {state.fileName.length !== 0 ? (
          <h1 className="checked-prompt">
            <i className="fa fa-check" aria-hidden="true"></i>
            {state.fileName}
          </h1>
        ) : (
          <div className="drop-prompt">
            <i className="fa fa-plus" />
            <h1>
              Drop your file here <br /> or <span>browse</span>
            </h1>
            <button
              onClick={useExampleFile}
              className="use-example example-button"
            >
              use example file
            </button>
          </div>
        )}
        <input className="upload-container" type="file" onChange={onFileDrop} />
        {hasError  && (
          <p className="detail-error">{hasError}</p>
        )}
      </div>
    </form>
  );
};

export default FileUploadStep;