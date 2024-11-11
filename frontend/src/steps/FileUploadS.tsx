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
import * as fs from 'fs';
import { ReadableStream } from "stream/web";
import { userInfo } from "os";
import { get, set } from 'idb-keyval';
import { json } from "stream/consumers";
import { headers } from "../assets/DefualtFile";
import { INamesStringMap } from "../@types/global";

const FileUploadStep: FC<IStepProps> = ({ step, goNextStep }) => {
  const { state, actions } = useStateMachine({
    updateFileName,
    updateFileUpload,
    clearAction,
    updateIsLoading,
    updatestringNames,
    updateNamesMap,
  });
  const [isDefualt, setIsDefualt] = useState<boolean>(false);
  const [file, setFile] = useState<File>();
  const [hasError, setHasError] = useState<boolean>(false);
  useEffect(() => {
    // code to run on every refresh
    actions.clearAction();
  }, []);

  const onFileDrop = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    
    actions.clearAction();
    
    if (event.target.files) {
      setFile(event.target.files[0]);
      actions.updateFileName({ fileName: event.target.files[0].name });
      console.log(event.target.files[0]);
      setHasError(false);
    }
    
    setIsDefualt(false);
  };

  const useExampleFile = () => {
    actions.clearAction();
    actions.updateFileName({ fileName: "example_data.xlsx" });
    setHasError(false);
    setIsDefualt(true);
    
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    /*
      On clicking the "next" button,
      starting to load the file from the browser using FileReader.
    */
    event?.preventDefault();
    console.log("file:", file);

    // case of using the example file
    if (isDefualt) {
      console.log("is defualt!");
      actions.updateFileUpload(getExampleFile());
      set(state.fileName,getExampleFile());
      goNextStep();
      return;
    }

    // case of entering by pressing back
    if (state.json.length > 0) {
      goNextStep();
    }

    // case of a problem
    if (!file) {
      console.log("empty file!");
      setHasError(true);
      return;
    }

    // handle by different files
    const filetype = state.fileName.split(".")[1];
    console.log("filetype:", filetype);

    // after finishing parsing must call validateFile(dataParse, headers)
    switch (filetype) {
      case "xlsx":
      case "csv":
        case "txt":
        const reader = new FileReader();
        // add on error check if to do with promise?
        reader.onerror = () => { throw reader.error }
        reader.onload = onXLSXReadFile;
        reader.readAsBinaryString(file); 
        break;

      default:
        setHasError(true);
        break;
    }
  };

  const validateFile = (fileJson: any[][], headersJson: string[]) => {
    if (
      fileJson.length === 0 ||
      (fileJson[0].length === 0 && fileJson[1].length === 0) ||
      !headersJson ||
      headersJson.length < 2
    ) {
      setHasError(true);
      console.log("error");
      return;
    }
    state.headers = headersJson
    // all ok - continue
    set(state.fileName,{json: fileJson, headers: headersJson});
    // actions.updateFileUpload({
    //   json: fileJson,
    //   headers: headersJson,
    // });
    // get(state.fileName)
    //   .then((val) => {
    //     console.log(val['headers']);
    //     let headers = val['headers']
    //     headers = 
    //     console.log(JSON.stringify(val['headers'],null,2));
        
    //     console.log(fileJson)
    //   })
    goNextStep();
  };

  const onXLSXReadFile = (e: ProgressEvent<FileReader>) => {
    /*
      This functions get called by fileReader when he finish loading the file from the browser.
      It reads the first sheet and updates the fileInfo global state.
      First row goes into "headers" and the rest goes into "json".
    */
   if (!e.target) return;
   var data = e.target.result;
  //  console.log(data)
    if (!data) return;
    let readData = read(data, { type: "binary" });
    const workingSheetName = readData.SheetNames[0];
    const workingSheet = readData.Sheets[workingSheetName];
    
    const dataParse = utils.sheet_to_json(workingSheet, {
      header: 1,
    }) as any[][];

    console.log("file json:", dataParse);

    const headers = dataParse.shift() as string[];
    if(dataParse.length > 2000){
      setHasError(true);
      return;
    }
    console.log(dataParse.length);
    console.log("file headers:", headers);

    if( headers.includes('STRING Name')){
      console.log("loading saved file");
      const namesStringMap: INamesStringMap = {};

      for (let i = 0 ; i < dataParse.length; i++){

        // console.log(typeof dataParse[i][1]);
        if (dataParse[i][1] != ""){
          namesStringMap[dataParse[i][0]] = {
            stringId: dataParse[i][2],
            stringName: dataParse[i][1],
          };
        }
        else{
          // console.log("hello from the other side");
          namesStringMap[dataParse[i][0]] = {
            stringId: "0",
            stringName: "",
          };
        }

        dataParse[i].splice(1, 2);
      }

      headers.splice(headers.indexOf('STRING id'), 1);
      headers.splice(headers.indexOf('STRING Name'), 1);
      set(state.fileName,{json: dataParse, headers: headers, namesStringMap: namesStringMap});
      actions.updateFileUpload({
          json: dataParse,
          headers: headers,
        });      
      console.log(headers);
      state.headers = headers;
      console.log(state.headers)
      actions.updateNamesMap({ namesStringMap: namesStringMap });
      goNextStep();
    }
    else{
      validateFile(dataParse, headers); 
    }
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
          <p className="detail-error">check if the file has more then 2000 genes in it if there is split the file, make sure it has less then 2000 genes and more then two columns.</p>

        )}
      </div>
    </form>
  );
};

export default FileUploadStep;