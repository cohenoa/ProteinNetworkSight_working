import { FC, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { IStepProps } from "../@types/props";
import { useStateMachine } from "little-state-machine";
import { updateFileDetails, updateIsLoading, updateThresholds } from "../common/UpdateActions";
import { OptionType } from "../@types/json";
import WindowedSelect from "react-windowed-select";
import ClipLoader from "react-spinners/ClipLoader";
import {organism } from "../assets/OrganismFile";
import "../styles/FileDetails.css";
import { get, set } from 'idb-keyval';
import { headers } from "../assets/DefualtFile";
import Modal from '../components/thresholdModal';

type formValues = {
  idHeader: string;
  vectorsPrefix: string;
  scoreThreshold: number;
  positiveThreshold: number;
  negativeThreshold: number;
  organism: string;
  thresholds:{};
};

type vectorsValues = {
  [key: string]: number[];
};

const FileDetailsStep: FC<IStepProps> = ({ step, goNextStep }) => {
  const { state, actions } = useStateMachine({ updateFileDetails, updateIsLoading ,updateThresholds});
  const [selectedOption, setSelectedOption] = useState<OptionType>({
    ...state.organism,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const collectThresholds = async (thresholds: Array<Array<number>>) => {
    var results =  get(state.fileName).then((val) => {
      console.log(val['headers']);
      const mappedThresholds = thresholds.map((item, index) => ({[`${state.headers[index + 1]}`]: item}));
      console.log("mappedThresholds: ", thresholds)
      const resultObject = mappedThresholds.reduce((acc, item) => {
        const key = Object.keys(item)[0]; // Extracting the key from the current object
        acc[key] = item[key]; // Assigning the key-value pair to the accumulator object
        return acc;
      }, {} as { [key: string]: number[] });
      console.log('modified thresholds: ', resultObject);
      state.thresholds = resultObject
      console.log( state.thresholds["G1"])
      // updateThresholds(state, {thresholds:resultObject})
      actions.updateThresholds({ thresholds: resultObject });
      return resultObject
    });
    closeModal();
    return results;
  }

  let proteins: any[];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<formValues>();

  get(state.fileName).then((val) => {
    const headers = val['headers'];
    proteins = val['json'];
  }).catch((err) => {
    console.log('It failed!', err);
    return;
  });

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       collectThresholds( Array.from({ length: headers.length - 1}, () => [Number(state.positiveThreshold), Number(state.negativeThreshold)]))
  //     } catch (err) {
  //       console.log('It failed!', err);
  //       return;
  //     }
  //   };

  //   fetchData();
  //   // console.log("state vector headers: ", state.vectorsHeaders);
  // }, [state.positiveThreshold, state.negativeThreshold]);      // Move the code that depends on headers and proteins here


  const onSubmit =  async (data: formValues) => {
  
    get(state.fileName).then((val) => {
    const headers = val['headers'];
    proteins = val['json'];
    proteins.forEach((protein:string[]) =>{
      if (protein[0].includes(';')){
        var otherNames = protein[0].split(';');
        protein[0] = otherNames[0];
        
        if(protein[0].includes("_")){
          var firstPart = protein[0].split("_")[0]
          var newProtein = protein;

          newProtein[0] = firstPart + "_" + otherNames[1];
          // newProtein = newProtein + otherNames[1]
          if(newProtein != undefined){
            // proteins = [...proteins,newProtein];
            proteins.push(newProtein)
          } 
      }}
      // dividing the "," and adding a new row with the same values and a new name. 
      if(protein[0].includes(",")){
        var otherNames = protein[0].split(',');
        protein[0] = otherNames[0];      
      }
    })
      const idIndex = headers.indexOf(data.idHeader);
      const proteinsNames = proteins.map((row: any) => row[idIndex]);
      
      //  !!!OPTION - if we want to accept every _S and _T option. (it changes the value to be of _pY kind).!!!

        // proteinsNames.forEach((protein:string) =>{
        //   // console.log(protein[0])
        //   if(protein.includes("_S") || protein.includes("_T")){
        //     proteinsNames[proteinsNames.indexOf(protein)] = protein.replace("_S","_pY");
        //     proteinsNames[proteinsNames.indexOf(protein)] = protein.replace("_T","_pY");
        //     // console.log(protein);
        //   }})
      
      const vectorsHeaders: string[] = [];
      const vectorsValues: vectorsValues = {};
  
      headers.forEach((header:string, index:number) => {
        if (header.includes(data.vectorsPrefix)) {
          
          vectorsHeaders.push(header);

          const values = proteins.map((row: any) => row[index]);
          // console.log(values);
          vectorsValues[header] = values;
          // console.log(header)
        }
        else{
          // console.log(header)
          // state.vectorsValues
        } 
      });
      console.log(vectorsHeaders)
      // console.log("vectorsValues in File Deatiles: ",vectorsValues);
      set(state.fileName,{json: proteins, headers: headers, vectorsHeaders: vectorsHeaders, vectorsValues: vectorsValues})
      if(Object.entries(state.thresholds).length === 0){
        console.log("inside new object")
        collectThresholds(Array.from({ length: headers.length - 1}, () => [Number(data.positiveThreshold), Number(data.negativeThreshold)])).then((result:{})=>{
          console.log(result)
          actions.updateFileDetails({
            proteinsNames: proteinsNames,
            scoreThreshold: data.scoreThreshold,
            positiveThreshold: data.positiveThreshold,
            negativeThreshold: data.negativeThreshold,
            organism: selectedOption,
            vectorsHeaders: vectorsHeaders,
            thresholds:result,
            // vectorsValues: vectorsValues,
          });
          goNextStep();
        })
      }
      else{
        actions.updateFileDetails({
          proteinsNames: proteinsNames,
          scoreThreshold: data.scoreThreshold,
          positiveThreshold: data.positiveThreshold,
          negativeThreshold: data.negativeThreshold,
          organism: selectedOption,
          vectorsHeaders: vectorsHeaders,
          thresholds:state.thresholds,
          // vectorsValues: vectorsValues,
        });
        goNextStep();
      // console.log(Object.keys(state.thresholds).length === 0);
    }})
    .catch((err) => {
      console.log('It failed!', err);
      return;
    });
        
  }
  
  return (
    <form
        id={"form" + step}
        className="file-details-form"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="field">
          <label htmlFor="idHeader">
            Name of the 1st column (which represents protein\gene names):
          </label>

          <input
            id="idHeader"
            type="string"
            className="text-input"
            defaultValue={state.idHeader}
            required
            {...register("idHeader", {
              validate: { header: (v) => headers.includes(v) },
            })}
          />

          {errors.idHeader && errors.idHeader.type === "header" && (
            <p className="detail-error">Header don't exist in file!</p>
          )}
        </div>

        <div className="field">
          <label htmlFor="vectorsPrefix">Prefix of numerical columns:</label>

          <input
            id="vectorsPrefix"
            type="string"
            defaultValue={state.vectorsPrefix}
            className="text-input"
            required
            {...register("vectorsPrefix", {
              validate: {
                header: (v) =>
                  headers.some((res: string) => res.includes(v)),
              },
            })}
          />

          {errors.vectorsPrefix && errors.vectorsPrefix.type === "header" && (
            <p className="detail-error">Header don't exist in file!</p>
          )}
        </div>

        {/* can't validate here */}
        <div className="field">
          <label htmlFor="scoreThreshold">
            INTERACTION “STRING“ SCORE THRESHOLD:
          </label>

          <input
            id="scoreThreshold"
            type="number"
            step="any"
            className="text-input"
            min={0}
            max={1}
            defaultValue={state.scoreThreshold}
            required
            {...register("scoreThreshold")}
          />
        </div>

        <div className="row-fields">
          <div className="field">
            <label htmlFor="positiveThreshold">Positive Threshold:</label>

            <input
              id="positiveThreshold"
              type="number"
              step="any"
              className="text-input"
              min={0}
              max={1}
              defaultValue={state.positiveThreshold}
              required
            {...register("positiveThreshold", {
              validate: {
                json: (v) => proteins.some((res: any) => res.some((cell: number) => cell > 0 && cell > v))||v==0,
              },
            })}
          />

          {errors.positiveThreshold && errors.positiveThreshold.type === "json" && (
            <p className="detail-error">Minimum one positive node</p>
          )}
          </div>

          <div className="field">
            <label htmlFor="negativeThreshold">Negative Threshold:</label>

            <input
              id="negativeThreshold"
              type="number"
              step="any"
              className="text-input"
              min={-1}
              max={0}
              defaultValue={state.negativeThreshold}
              required
              {...register("negativeThreshold", {
                validate: {
                  json: (v) =>
                    proteins.some((res: any) => res.some((cell: number) =>cell < 0 && cell <  v))||v==0,
                },
              })}
            />
    
            {errors.negativeThreshold && errors.negativeThreshold.type === "json" && (
              <p className="detail-error">Minimum one negative node</p>
            )}
          </div>

          {/* button for setting manual thresholds */}

          
          <div className="button-container">
            <button className="btn btn--primary btn--medium" onClick={() => openModal()}>Manual Thresholds</button>
          </div>
        </div>

        {/* no need to validate here */}
        <div className="field">
          <label htmlFor="organism-select">Organism:</label>
          {state.isLoading ? (
            <ClipLoader size={40} color="#217BF4" />
          ) : (
            <WindowedSelect
              className="select"
              value={selectedOption}
              onChange={(option) => {
                setSelectedOption(option as OptionType);
              }}
              windowThreshold={20}
              maxMenuHeight={140}
              options={organism.organisms}
              styles={{
                option: (base) => ({
                  ...base,
                  fontSize: "15px",
                }),
                control: (base) => ({
                  ...base,
                  fontSize: "15px",
                  hight: "50px",
                }),
              }}
              id="organism-select"
            />
          )}
        </div>

        <Modal 
          isOpen={isModalOpen}
          onClose={closeModal}
          onConfirm={collectThresholds}
          length={state.headers.length - 1}
          headers={state.headers.slice(1)}
          defaultValues={[state.positiveThreshold, state.negativeThreshold]}
        />
      </form>
  );

};
export default FileDetailsStep;