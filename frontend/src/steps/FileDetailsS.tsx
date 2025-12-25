import { FC, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { IStepProps } from "../@types/props";
import { useStateMachine } from "little-state-machine";
import { updateFileDetails, updateIsLoading, updateThresholds, updateShowError } from "../common/UpdateActions";
import { OptionType } from "../@types/json";
import WindowedSelect from "react-windowed-select";
import ClipLoader from "react-spinners/ClipLoader";
import {organism } from "../assets/OrganismFile";
import "../styles/FileDetails.css";
import { get, getMany, set, setMany } from 'idb-keyval';
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
  thresholds:{};
};

const defaultThresholds: threshMap = {pos: 0.08, neg: -0.08};

type vectorsValues = {
  [key: string]: number[];
};

const FileDetailsStep: FC<IStepProps> = ({ step, goNextStep }) => {
  const { state, actions } = useStateMachine({ updateFileDetails, updateIsLoading ,updateThresholds, updateShowError});
  const [selectedOption, setSelectedOption] = useState<OptionType>({...state.organism});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [proteins, setProteins] = useState([]);
  const [thresholds, setThresholds] = useState(defaultThresholds);

  console.log(state);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const collectThresholds = async (thresholds: Array<Array<number>>) => {
    const mappedThresholds = thresholds.map((item, index) => ({[`${state.headers[index + 1]}`]: item}));
    console.log("mappedThresholds: ", mappedThresholds);
    const resultObject = mappedThresholds.reduce((acc, item) => {
      const key = Object.keys(item)[0];
      acc[key] = {pos: item[key][0], neg: item[key][1]};
      return acc;
    }, {} as { [key: string]: threshMap });
    console.log("thresholds resultObject: ", resultObject);
    closeModal();
    return resultObject
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<formValues>();

  const onSubmit = async (data: formValues) => {
    try {
      actions.updateIsLoading({isLoading: true});
      const [headers, rawProteins] = await getMany(["headers", "json"])

      const idIndex = headers.indexOf(data.idHeader);

      // Normalize protein names
      console.log("rawProteins: ", rawProteins);
      const proteins = normalizeProteins(rawProteins, idIndex);
      console.log("normalized proteins: ", proteins);

      // Extract protein names
      const proteinsNames = new Array(proteins.length);
      for (let i = 0; i < proteins.length; i++) {
        proteinsNames[i] = proteins[i][idIndex];
      }
      console.log("proteinsNames: ", proteinsNames);

      // Extract vectors (single header scan)
      const vectorsHeaders: string[] = [];
      const vectorsValues: vectorsValues = {};

      for (let h = 0; h < headers.length; h++) {
        const header = headers[h];
        if (!header.includes(data.vectorsPrefix)) continue;

        vectorsHeaders.push(header);
        const col = new Array(proteins.length);

        for (let i = 0; i < proteins.length; i++) {
          col[i] = proteins[i][h];
        }
        vectorsValues[header] = col;
      }

      console.log("vectorsHeaders: ", vectorsHeaders);
      console.log("vectorsValues: ", vectorsValues);
      console.log("proteinsNames: ", proteinsNames);

      await setMany([
        ["proteinsNames", proteinsNames],
        ["vectorsValues", vectorsValues]
      ]);

      const thresholds = Object.keys(state.thresholds).length === 0 ?
        await collectThresholds(
          Array.from({ length: headers.length - 1}, () => ([Number(data.positiveThreshold), Number(data.negativeThreshold)]))
        )
        : state.thresholds;

      console.log("thresholds: ", thresholds);

      actions.updateFileDetails({
        scoreThreshold: data.scoreThreshold,
        organism: selectedOption,
        vectorsHeaders: vectorsHeaders,
        thresholds: thresholds,
      });

      actions.updateIsLoading({ isLoading: false });
      goNextStep();
    } catch (err) {
      actions.updateIsLoading({ isLoading: false });
      actions.updateShowError({ showError: true });
      console.error("Upload processing failed", err);
    }
  };

  function normalizeProteins(proteins_raw: any[], nameIndex: number): any[] {
    const normalized: any[] = [];

    for (let i = 0; i < proteins_raw.length; i++) {
      const expanded = expandProteinRow(proteins_raw[i], nameIndex);
      for (let j = 0; j < expanded.length; j++) {
        normalized.push(expanded[j]);
      }
    }

    return normalized;
  }

  function expandProteinRow(row: any[], nameIndex: number): any[][] {
    const nameCell = row[nameIndex];
    if (typeof nameCell !== "string") return [row];

    // Split aliases (; or ,)
    const aliases = nameCell.split(/[;,]/);
    if (aliases.length === 1) return [row];

    // Detect modification suffix from the first alias
    let base = aliases[0];
    let mod = "";

    const underscoreIndex = base.indexOf("_");
    if (underscoreIndex !== -1) {
      mod = base.slice(underscoreIndex);
      base = base.slice(0, underscoreIndex);
    }

    // Generate new rows
    const result: any[][] = new Array(aliases.length);

    for (let i = 0; i < aliases.length; i++) {
      const alias = aliases[i].trim();
      const aliasBase = alias.split("_")[0];
      const finalName = mod ? aliasBase + mod : aliasBase;

      const newRow = row.slice(); // shallow copy, fast
      newRow[nameIndex] = finalName;
      result[i] = newRow;
    }

    return result;
  }

  // const onSubmit = async (data: formValues) => {
  //   console.log(state);
  //   get(state.fileName).then((val) => {
  //     console.log(val);
  //     const headers = val['headers'];
  //     let proteins = val['json'];
  //     proteins.forEach((protein:string[]) => {
  //       if (protein[0].includes(';')){
  //         var otherNames = protein[0].split(';');
  //         protein[0] = otherNames[0];
          
  //         if(protein[0].includes("_")){
  //           var firstPart = protein[0].split("_")[0]
  //           var newProtein = protein;

  //           newProtein[0] = firstPart + "_" + otherNames[1];
  //           // newProtein = newProtein + otherNames[1]
  //           if(newProtein !== undefined){
  //             // proteins = [...proteins,newProtein];
  //             proteins.push(newProtein)
  //           } 
  //       }}
  //       // dividing the "," and adding a new row with the same values and a new name. 
  //       if(protein[0].includes(",")){
  //         var otherNames = protein[0].split(',');
  //         protein[0] = otherNames[0];      
  //       }
  //     })
  //     const idIndex = headers.indexOf(data.idHeader);
  //     const proteinsNames = proteins.map((row: any) => row[idIndex]);
      
  //     //  !!!OPTION - if we want to accept every _S and _T option. (it changes the value to be of _pY kind).!!!
      
  //     const vectorsHeaders: string[] = [];
  //     const vectorsValues: vectorsValues = {};
  
  //     headers.forEach((header:string, index:number) => {
  //       if (header.includes(data.vectorsPrefix)) {
  //         vectorsHeaders.push(header);
  //         const values = proteins.map((row: any) => row[index]);
  //         vectorsValues[header] = values;
  //       }
  //     });


  //     console.log("setting headers: ", headers);
  //     console.log(vectorsHeaders);

  //     set(state.fileName, {json: proteins, headers: headers, vectorsHeaders: vectorsHeaders, vectorsValues: vectorsValues})

  //     if(Object.entries(state.thresholds).length === 0){
  //       console.log("inside new object")
  //       collectThresholds(Array.from({ length: headers.length - 1}, () => [Number(data.positiveThreshold), Number(data.negativeThreshold)])).then((result:{})=>{
  //         console.log(result)
  //         actions.updateFileDetails({
  //           proteinsNames: proteinsNames,
  //           scoreThreshold: data.scoreThreshold,
  //           positiveThreshold: data.positiveThreshold,
  //           negativeThreshold: data.negativeThreshold,
  //           organism: selectedOption,
  //           vectorsHeaders: vectorsHeaders,
  //           thresholds:result,
  //           // vectorsValues: vectorsValues,
  //         });
  //         goNextStep();
  //       })
  //     }
  //     else{
  //       actions.updateFileDetails({
  //         proteinsNames: proteinsNames,
  //         scoreThreshold: data.scoreThreshold,
  //         positiveThreshold: data.positiveThreshold,
  //         negativeThreshold: data.negativeThreshold,
  //         organism: selectedOption,
  //         vectorsHeaders: vectorsHeaders,
  //         thresholds:state.thresholds,
  //         // vectorsValues: vectorsValues,
  //       });
  //       goNextStep();
  //     // console.log(Object.keys(state.thresholds).length === 0);
  //   }})
  //   .catch((err) => {
  //     console.log('It failed!', err);
  //     return;
  //   });
        
  // }

  useEffect(() => {
    get("json").then((val) => {
      setProteins(val);
    });
  }, []);
  
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
              defaultValue={thresholds.pos}
              required
            {...register("positiveThreshold", {
              validate: {
                json: (v) => proteins.some((res: any) => res.some((cell: number) => cell > 0 && cell > v)) || v==0,
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
              defaultValue={thresholds.neg}
              required
              {...register("negativeThreshold")}
            />
    
            {errors.negativeThreshold && errors.negativeThreshold.type === "json" && (
              <p className="detail-error">Minimum one negative node</p>
            )}
          </div>

          {/* button for setting manual thresholds */}

          
          <div className="button-container">
            {/* <button className="btn btn--primary btn--medium" onClick={() => openModal()}>Manual Thresholds</button> */}
            <button type="button" className="btn btn--primary btn--medium" onClick={() => openModal()}>Manual Thresholds</button>
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