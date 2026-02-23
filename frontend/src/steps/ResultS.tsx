import { FC, useEffect, useState } from "react";
import { ICustomGraphData } from "../@types/graphs";
import { makePostRequest } from "../common/PostRequest";
import VectorsButtons from "../bars/VectorsButtons";
import LoadingComponent from "../components/Loading";
import GraphBar from "../bars/GraphBar";
import TableComponent from "../components/Table";
import { useStateMachine } from "little-state-machine";
import { updateIsLoading, updateShowError, updateThresholds } from "../common/UpdateActions";
import { Font, FontLoader } from "three/examples/jsm/loaders/FontLoader";
import "../styles/Result.css";
import ErrorScreen from "../components/ErrorScreen";
import CytoscapejsComponentself from "../components/Cytoscapejs";
import { set, get, getMany, update } from 'idb-keyval';
import {
  INamesStringMap,
  IVectorsValues,
} from "../@types/global";
import { threshMap } from "../@types/global";
import { IStepProps } from "../@types/props";

const Result: FC<IStepProps> = ({ step, goNextStep }) => {
  const { state, actions } = useStateMachine({
    updateIsLoading,
    updateShowError,
    updateThresholds,
  });

  const [clickedVector, setClickedVector] = useState<string>(state.vectorsHeaders[0]);
  const [graphData, setGraphData] = useState<ICustomGraphData>({
    nodes: [],
    links: [],
  });

  // const missingNodes = useRef<{orgName: string, value: number}[]>([]);
  const [missingNodes, setMissingNodes] = useState<{orgName: string, value: number}[]>([]);
  const [openTable, setOpenTable] = useState<boolean>(false);
  const [thresholds, setThresholds] = useState<threshMap>({
    pos: state.thresholds[clickedVector].pos,
    neg: state.thresholds[clickedVector].neg,
  });
  let vectorsValues: IVectorsValues = {} as IVectorsValues;

  useEffect(() => {
    const fetchData = async () => {
      try {
          setClickedVector(state.vectorsHeaders[0]);
          let loader = new FontLoader();
          loader.load(
            "https://threejs.org/examples/fonts/optimer_regular.typeface.json",
            (loaded_font) => {
              console.log("loaded font");
              setFont(loaded_font);
            }
          );
      } catch (err) {
        console.log('It failed!', err);
        return;
      }
    };

    fetchData();
  }, [state.fileName, state.vectorsHeaders]);

  const [font, setFont] = useState<Font | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!clickedVector) return;
    setThresholds({
      pos: state.thresholds[clickedVector].pos,
      neg:  state.thresholds[clickedVector].neg,
    });
    getGraphData(clickedVector);
  }, [clickedVector, state.thresholds]);

  useEffect(() => {
    if ( thresholds.pos !== state.thresholds[clickedVector].pos || thresholds.neg !== state.thresholds[clickedVector].neg) {
      actions.updateThresholds({ 
        thresholds: {
          ...state.thresholds,
          [clickedVector]: {
            pos: thresholds.pos,
            neg: thresholds.neg
          }
        }
      });
      
      console.log("changed thresholds");
    }
  }, [thresholds]);

  const handleError = (err: string) => {
    console.log("error in makePostRequest", err);
    setError(true);
    actions.updateIsLoading({ isLoading: false });
  };

  const getGraphData = (vectorName: string) => {
    console.log("getting graph data");
    setError(false);
    console.log(clickedVector);
    actions.updateIsLoading({ isLoading: true });

    get(vectorName + "_graph").then((val) => {
      if (val && val.graphData && (val.thresholds as threshMap).pos === state.thresholds[clickedVector].pos && (val.thresholds as threshMap).neg === state.thresholds[clickedVector].neg) {
        console.log("graph data from mem: ", val.graphData);
        console.log("thresholds from mem: ", val.thresholds);
        console.log("missing nodes from mem: ", val.missingNodes);
        setGraphData(val.graphData as ICustomGraphData);
        // missingNodes.current = val.missingNodes as {orgName: string, value: number}[];
        setMissingNodes(val.missingNodes as {orgName: string, value: number}[]);
        actions.updateIsLoading({ isLoading: false });
      }
      else {
        console.log("getting graph data from server");
        getMany([vectorName + "_data", "proteinsNames", "namesStringMap"]).then(([values_arr, ids_arr, namesStringMap]) => {
          const idsList: number[] = [];
          const stringNames: string[] = [];
          const proteins: string[] = [];
          const missing: {orgName: string, value: number}[] = [];

          let values_map: { [key: string]: number } = {};
          for (let i = 0; i < values_arr.length; i++) {
            values_map[ids_arr[i]] = values_arr[i];
          }

          Object.entries(namesStringMap as INamesStringMap).forEach(([orgName, { stringName, stringId }]) => {
            // idsList.push(stringId);
            // stringNames.push(stringName);
            // proteins.push(orgName);
            const val = values_map[orgName];
            if (val > state.thresholds[clickedVector].pos || val < state.thresholds[clickedVector].neg) {
              if (stringName === "other"){
                missing.push({orgName: orgName, value: val});
              }
              else{
                idsList.push(stringId);
                stringNames.push(stringName);
                proteins.push(orgName);
              }
            }
          });

          setMissingNodes(missing);

          set(clickedVector + "_graph", {
            graphData: null,
            thresholds: {...state.thresholds[clickedVector]} as threshMap,
            missingNodes: missing
          });

          const body = {
            values_map: values_map,
            thresh_pos: state.thresholds[clickedVector].pos,
            thresh_neg: state.thresholds[clickedVector].neg,
            score_thresh: state.scoreThreshold,
            proteins: proteins,
            ids: idsList,
            string_names: stringNames,
          };
          console.log("body", body);

          makePostRequest(JSON.stringify(body), "graphs", handleJsonGraphData, handleError);
        });
      }
    });
  };

  const handleJsonGraphData = (jsonString: string) => {
    const tempGraphData: ICustomGraphData = JSON.parse(jsonString);
    setGraphData(tempGraphData);
    update(clickedVector + "_graph", (oldValue) => {
      return {
        ...oldValue,
        graphData: tempGraphData,
      };
    });
    // set(clickedVector + "_graph", {
    //   graphData: tempGraphData,
    //   thresholds: {...state.thresholds[clickedVector]} as threshMap,
    //   missingNodes: missingNodes
    // });
    console.log("graph data: ", tempGraphData);
    actions.updateIsLoading({ isLoading: false });
  };

  return (
    <div className="result-container">
      <div className="vector-bar">
        <VectorsButtons
          vectorsValues={state.vectorsHeaders}
          setClickedVector={setClickedVector}
          clickedVector={clickedVector}
        />
      </div>
      {state.isLoading ? (
        <LoadingComponent />
      ) : (
        <div className="graph-wrapper">
          <div className="graph-buttons">
            <GraphBar
              openTable={openTable}
              setOpenTable={setOpenTable}
              nodesNum={graphData.nodes.length}
              linksNum={graphData.links.length}
              missingNodes={missingNodes}
              thresholds={thresholds}
              setThresholds={setThresholds}
            />
          </div>
          <div className="graph-canvas">
            {error && <ErrorScreen />}
            {!error && openTable && <TableComponent data={graphData} />}
            {!error && !openTable && font && (
              <CytoscapejsComponentself
                graphData={graphData}
                clickedVector={clickedVector}
                alertLoading={() => {}}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Result;
