import { useStateMachine } from "little-state-machine";
import { FC, FormEvent, useEffect, useState } from "react";
import { read, utils } from "xlsx";
import { IStepProps } from "../@types/props";
import {
  updateFileUpload,
  updateFileName,
  updateIsLoading,
  updatestringNames,
  updateNamesMap,
} from "../common/UpdateActions";
import { clearAction } from "../common/ClearAction";
import "../styles/FileUpload.css";
import { getExampleFile } from "../common/ExampleFileAction";
import { set } from "idb-keyval";
import { INamesStringMap } from "../@types/global";
import { headers } from "../assets/DefualtFile";
import { error } from "console";

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


  // const [isDefualt, setIsDefualt] = useState<boolean>(false);
  // const [file, setFile] = useState<File>();
  // const [hasError, setHasError] = useState<boolean>(false);
  // useEffect(() => {
  //   // code to run on every refresh
  //   console.log(file)
  //   actions.clearAction();
  // }, []);

  // const onFileDrop = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   console.log("on onFileDrop");
  //   if (!event.target.files) return;
    
  //   actions.clearAction();
    
  //   if (event.target.files) {
  //     setFile(event.target.files[0]);
  //     actions.updateFileName({ fileName: event.target.files[0].name });
  //     console.log(event.target.files[0]);
  //     setHasError(false);
  //   }
    
  //   setIsDefualt(false);
  // };

  // const useExampleFile = () => {
  //   actions.clearAction();
  //   actions.updateFileName({ fileName: "example_data.xlsx" });
  //   setHasError(false);
  //   setIsDefualt(true);
  // };

  // const onSubmit = (event: FormEvent<HTMLFormElement>) => {
  //   /*
  //     On clicking the "next" button,
  //     starting to load the file from the browser using FileReader.
  //   */
  //   event?.preventDefault();
  //   console.log("file:", file);

  //   // case of using the example file
  //   if (isDefualt) {
  //     console.log("is defualt!");
  //     actions.updateFileUpload(getExampleFile());
  //     set(state.fileName, getExampleFile());
  //     goNextStep();
  //     return;
  //   }

  //   // case of entering by pressing back
  //   if (state.json.length > 0) {
  //     goNextStep();
  //     return;
  //   }

  //   // case of a problem
  //   if (!file) {
  //     console.log("empty file!");
  //     setHasError(true);
  //     return;
  //   }

  //   // handle by different files
  //   const filetype = state.fileName.split(".")[1];
  //   console.log("filetype:", filetype);

  //   // after finishing parsing must call validateFile(dataParse, headers)
  //   const reader = new FileReader();
  //   try{
  //     reader.onerror = () => { throw reader.error }
  //     switch (filetype) {
  //       case "xlsx":
  //         console.log("file type is xlsx");
  //         reader.onload = onXLSXReadFile;
  //         break;
  //       case "csv":
  //         console.log("file type is csv");
  //         // reader.onload = onCSVReadFile;
  //         break;
  //       default:
  //         setHasError(true);
  //         break;
  //     }
  //   }
  //   catch (error) {
  //     console.log(error);
  //     setHasError(true);
  //   }
  // };

  // const validateFile = (fileJson: any[][], headersJson: string[]) => {
  //   console.log("validateFile");
  //   console.log(headersJson);
  //   if ( fileJson.length === 0 || (fileJson[0].length === 0 && fileJson[1].length === 0) || !headersJson || headersJson.length < 2) {
  //     setHasError(true);
  //     console.log("error");
  //     return;
  //   }
  //   state.headers = headersJson
  //   // all ok - continue
  //   set(state.fileName,{json: fileJson, headers: headersJson});
  //   goNextStep();
  // };

  // const onXLSXReadFile = (e: ProgressEvent<FileReader>) => {
  //   console.log("onXLSXReadFile");
  //   if (!e.target) return;
  //   var data = e.target.result;
  //   //  console.log(data)
  //   if (!data) return;
  //   let readData = read(data, { type: "binary" });
  //   const workingSheetName = readData.SheetNames[0];
  //   const workingSheet = readData.Sheets[workingSheetName];
    
  //   const dataParse = utils.sheet_to_json(workingSheet, {
  //     header: 1,
  //   }) as any[][];

  //   console.log("file json:", dataParse);

  //   const headers = dataParse.shift() as string[];
  //   if(dataParse.length > 2000){
  //     setHasError(true);
  //     return;
  //   }
  //   console.log(dataParse.length);
  //   console.log("file headers:", headers);

  //   if( headers.includes('STRING Name')){
  //     console.log("loading saved file");
  //     const namesStringMap: INamesStringMap = {};

  //     for (let i = 0 ; i < dataParse.length; i++){
  //       if (dataParse[i][1] !== ""){
  //         namesStringMap[dataParse[i][0]] = {
  //           stringId: dataParse[i][2],
  //           stringName: dataParse[i][1],
  //         };
  //       }
  //       else{
  //         namesStringMap[dataParse[i][0]] = {
  //           stringId: "0",
  //           stringName: "",
  //         };
  //       }

  //       dataParse[i].splice(1, 2);
  //     }

  //     headers.splice(headers.indexOf('STRING id'), 1);
  //     headers.splice(headers.indexOf('STRING Name'), 1);
  //     set(state.fileName,{json: dataParse, headers: headers, namesStringMap: namesStringMap});
  //     actions.updateFileUpload({
  //         json: dataParse,
  //         headers: headers,
  //       });      
  //     console.log(headers);
  //     state.headers = headers;
  //     console.log(state.headers)
  //     actions.updateNamesMap({ namesStringMap: namesStringMap });
  //     goNextStep();
  //   }
  //   else{
  //     validateFile(dataParse, headers); 
  //   }
  // };

  // return (
  //   <form className="upload-form" id={"form" + step} onSubmit={onSubmit}>
  //     <div className="upload-wrap">
  //       {state.fileName.length !== 0 ? (
  //         <h1 className="checked-prompt">
  //           <i className="fa fa-check" aria-hidden="true"></i>
  //           {state.fileName}
  //         </h1>
  //       ) : (
  //         <div className="drop-prompt">
  //           <i className="fa fa-plus" />
  //           <h1>
  //             Drop your file here <br /> or <span>browse</span>
  //           </h1>
  //           <button
  //             onClick={useExampleFile}
  //             className="use-example example-button"
  //           >
  //             use example file
  //           </button>
  //         </div>
  //       )}
  //       <input className="upload-container" type="file" onChange={onFileDrop} />
  //       {hasError  && (
  //         <p className="detail-error">check if the file has more then 2000 genes in it if there is split the file, make sure it has less then 2000 genes and more then two columns.</p>

  //       )}
  //     </div>
  //   </form>
  // );

  const [file, setFile] = useState<File | null>(null);
  const [hasError, setHasError] = useState<string | null>(null);
  const [isExampleFile, setIsExampleFile] = useState(false);

  useEffect(() => {
    actions.clearAction();
  }, []);

  const onFileDrop = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("onFileDrop");
    if (!event.target.files?.length) return;
    const uploadedFile = event.target.files[0];

    setFile(uploadedFile);
    actions.updateFileName({ fileName: uploadedFile.name });
    setHasError(null);
    setIsExampleFile(false);
  };

  const useExampleFile = () => {
    console.log("clicked use example file");
    actions.clearAction();
    actions.updateFileName({ fileName: "example_data.xlsx" });
    setIsExampleFile(true);
    setHasError(null);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    console.log("onSubmit");
    event.preventDefault();

    if (isExampleFile) {
      console.log("using example file");
      actions.updateFileUpload(getExampleFile());
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

      if (fileType === "xlsx") processXLSXFile(e.target.result);
      // Future: Implement CSV parsing here.
    };

    reader.readAsBinaryString(file);
  };

  const processXLSXFile = (data: string | ArrayBuffer) => {
    console.log("Processing XLSX file...");
    const workbook = read(data, { type: "binary" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const fileData = utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    console.log(fileData);

    if (fileData.length > MAX_ROWS) {
      setHasError(`File exceeds ${MAX_ROWS} rows. Please split it.`);
      return;
    }

    const headers = fileData.shift() as string[];
    if (!headers || headers.length < 2) {
      setHasError("Invalid file structure: must have at least two columns.");
      return;
    }

    if (headers.includes("STRING Name") && headers.includes("STRING id")) {
      processStringNameFile(fileData, headers);
    } else {
      validateAndUpload(fileData, headers);
    }
  };

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

  const validateAndUpload = (fileData: any[][], headers: string[]) => {
    console.log("in validateAndUpload");
    if (!fileData.length) {
      setHasError("File is empty or invalid.");
      return;
    }
    console.log(headers);
    actions.updateFileUpload({ json: fileData, headers });
    console.log(state);
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