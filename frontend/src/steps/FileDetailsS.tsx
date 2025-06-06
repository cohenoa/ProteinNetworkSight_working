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
import { threshMap } from "../@types/global";

type formValues = {
  idHeader: string;
  vectorsPrefix: string;
  scoreThreshold: number;
  positiveThreshold: number;
  negativeThreshold: number;
  organism: string;
  thresholds: Array<Array<number>>;
};

type vectorsValues = {
  [key: string]: number[];
};

const FileDetailsStep: FC<IStepProps> = ({ step, goNextStep }) => {
  const { state, actions } = useStateMachine({ updateFileDetails, updateIsLoading ,updateThresholds});
  const [selectedOption, setSelectedOption] = useState<OptionType>({...state.organism});
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [proteinsJson, setProteinsJson] = useState([]);
  const defaultThresholds: threshMap = { pos: 0.08, neg: -0.08 };
  
  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const getThreshObject = (thresholds: Array<Array<number>>) => {
    return thresholds.reduce((acc, item, index) => {
        acc[state.headers[index + 1]] = { pos: item[0], neg: item[1] };
        return acc;
      }, {} as { [key: string]: threshMap });
  }

  const collectThresholds = async (thresholds: Array<Array<number>>) => {
    var results = get(state.fileName).then((val) => {
      console.log(val['headers']);

      const ThreshObj = getThreshObject(thresholds);

      actions.updateThresholds({ thresholds: ThreshObj });
      return ThreshObj
    });
    closeModal();
    return results;
  }

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<formValues>();

  useEffect(() => {
    let isMounted = true;
    if (isMounted) {
      get(state.fileName).then((val) => {
        setProteinsJson(val['json']);
      })
    }
    return () => { isMounted = false };
  }, [])

  // get(state.fileName).then((val) => {
  //   const headers = val['headers'];
  //   proteins = val['json'];
  // }).catch((err) => {
  //   console.log('It failed!', err);
  //   return;
  // });

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
    console.log(state);
    get(state.fileName).then((val) => {
      const headers = val['headers'];
      let proteins = val['json'];
      proteins.forEach((protein:string[]) => {
        if (protein[0].includes(';')){
          var otherNames = protein[0].split(';');
          protein[0] = otherNames[0];
          
          if(protein[0].includes("_")){
            var firstPart = protein[0].split("_")[0]
            var newProtein = protein;

            newProtein[0] = firstPart + "_" + otherNames[1];
            if(newProtein !== undefined){
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
      
      const vectorsHeaders: string[] = [];
      const vectorsValues: vectorsValues = {};
  
      headers.forEach((header:string, index:number) => {
        if (header.includes(data.vectorsPrefix)) {
          vectorsHeaders.push(header);
          const values = proteins.map((row: any) => row[index]);
          vectorsValues[header] = values;
        }
      });
      console.log("setting headers: ", headers);
      console.log(vectorsHeaders);
      set(state.fileName,{json: proteins, headers: headers, vectorsHeaders: vectorsHeaders, vectorsValues: vectorsValues})
      if(Object.entries(state.thresholds).length === 0){
        console.log("inside new object")
        collectThresholds(Array.from({ length: headers.length - 1}, () => [Number(data.positiveThreshold), Number(data.negativeThreshold)])).then((result:{})=>{
          console.log(result)
          actions.updateFileDetails({
            proteinsNames: proteinsNames,
            scoreThreshold: data.scoreThreshold,
            organism: selectedOption,
            vectorsHeaders: vectorsHeaders,
            thresholds: result,
          });
          goNextStep();
        })
      }
      else{
        actions.updateFileDetails({
          proteinsNames: proteinsNames,
          scoreThreshold: data.scoreThreshold,
          organism: selectedOption,
          vectorsHeaders: vectorsHeaders,
          thresholds: state.thresholds,
        });
        goNextStep();
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
              defaultValue={0.08}
              required
            {...register("positiveThreshold", {
              validate: {
                json: (v) => proteinsJson.some((res: any) => res.some((cell: number) => cell > 0 && cell > v)),
              },
              onChange: (e) => {
                let value = Number(e.target.value);
                const allValues = getValues();
                const allPositiveValues = allValues.thresholds.reduce((acc, item) => {
                  return acc.concat(item[1]);
                }, []);
                const ThreshObj = getThreshObject(allPositiveValues.map((item, index) => [value, item]));
                actions.updateThresholds({ thresholds: ThreshObj });
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
              defaultValue={-0.08}
              required
              {...register("negativeThreshold", {
                validate: {
                  json: (v) =>
                    proteinsJson.some((res: any) => res.some((cell: number) => cell < 0 && cell < v)) || v == 0,
                },
                onChange: (e) => {
                  let value = Number(e.target.value);
                  const allValues = getValues();
                  const allPositiveValues = allValues.thresholds.reduce((acc, item) => {
                    return acc.concat(item[0]);
                  }, []);
                  const ThreshObj = getThreshObject(allPositiveValues.map((item, index) => [item, value]));
                  actions.updateThresholds({ thresholds: ThreshObj });
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
          defaultValues={[defaultThresholds.pos, defaultThresholds.neg]}
        />
      </form>
  );

};
export default FileDetailsStep;