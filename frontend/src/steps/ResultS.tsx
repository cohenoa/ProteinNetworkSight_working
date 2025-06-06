import { FC, useEffect, useState } from "react";
import { ICustomGraphData } from "../@types/graphs";
import { makePostRequest } from "../common/PostRequest";
import VectorsButtons from "../bars/VectorsButtons";
import LoadingComponent from "../components/Loading";
import GraphBar from "../bars/GraphBar";
import TableComponent from "../components/Table";
import { useStateMachine } from "little-state-machine";
import { updateIsLoading, updateShowError } from "../common/UpdateActions";
import { Font, FontLoader } from "three/examples/jsm/loaders/FontLoader";
import "../styles/Result.css";
import ErrorScreen from "../components/ErrorScreen";
import CytoscapejsComponentself from "../components/Cytoscapejs";
import { get } from 'idb-keyval';
import {
  IVectorsValues,
} from "../@types/global";
import { threshMap } from "../@types/global";
import { IStepProps } from "../@types/props";

const Result: FC<IStepProps> = ({ step, goNextStep }) => {
  const { state, actions } = useStateMachine({
    updateIsLoading,
    updateShowError,
  });

  const [clickedVector, setClickedVector] = useState<string>(state.vectorsHeaders[0]);
  const [graphData, setGraphData] = useState<ICustomGraphData>({
    nodes: [],
    links: [],
  });
  const [openTable, setOpenTable] = useState<boolean>(false);
  const [thresholds, setThresholds] = useState<threshMap>({
    pos: state.thresholds[clickedVector].pos,
    neg: state.thresholds[clickedVector].neg,
  });
  let vectorsValues: IVectorsValues = {} as IVectorsValues;

  // console.log("uuid results: ", state.fileName);

  useEffect(() => {
    const fetchData = async () => {
      try {
          // Retrieve vectorsValues here
          // vectorsValues = val['vectorsValues'];
          // console.log("vectors headers in place 0",state.vectorsHeaders[0])
          setClickedVector(state.vectorsHeaders[0]);
          let loader = new FontLoader();
          loader.load(
            "https://threejs.org/examples/fonts/optimer_regular.typeface.json",
            (loaded_font) => {
              console.log("loaded font");
              setFont(loaded_font);
            }
          );
          // console.log(vectorsValues);
      } catch (err) {
        console.log('It failed!', err);
        return;
      }
    };

    fetchData();
    // console.log("state vector headers: ", state.vectorsHeaders);
  }, [state.fileName, state.vectorsHeaders]);

  const [font, setFont] = useState<Font | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!clickedVector) return;
    console.log("before",thresholds)
    setThresholds({ pos: state.thresholds[clickedVector].pos, neg: state.thresholds[clickedVector].neg });
    console.log("after", thresholds)
    getGraphData(clickedVector);
  }, [clickedVector, state.thresholds]);

  useEffect(() => {
    if (
      thresholds.pos !== state.thresholds[clickedVector].pos ||
      thresholds.neg !== state.thresholds[clickedVector].neg
    ) {
      setThresholds({ pos: state.thresholds[clickedVector].pos, neg: state.thresholds[clickedVector].neg });
      state.thresholds[clickedVector].pos = thresholds.pos;
      state.thresholds[clickedVector].neg = thresholds.neg;
      
      getGraphData(clickedVector);
    }
  }, [thresholds]);

  const handleError = (err: string) => {
    console.log("error in makePostRequest", err);
    setError(true);
    actions.updateIsLoading({ isLoading: false });
  };

  const getGraphData = (vectorName: string) => {
    setError(false);
    get(state.fileName)
      .then((val) => {
        vectorsValues = val['vectorsValues'];
        const values_arr = vectorsValues[vectorName] || [];
        const ids_arr = state.proteinsNames || [];
        let values_map: { [key: string]: number } = {};
        for (let i = 0; i < values_arr.length; i++) {
          values_map[ids_arr[i]] = values_arr[i];
        }
        const body = {
          user_id: state.uuid,
          values_map: values_map,
          thresh_pos: state.thresholds[clickedVector].pos,
          thresh_neg: state.thresholds[clickedVector].neg,
          score_thresh: state.scoreThreshold,
        };
        console.log("body", body);
        actions.updateIsLoading({isLoading: true});
        makePostRequest(JSON.stringify(body), "graphs", handleJsonGraphData, handleError);
      
  })};

  const handleJsonGraphData = (jsonString: string) => {
    const tempGraphData: ICustomGraphData = JSON.parse(jsonString);
    setGraphData(tempGraphData);
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
              clickedVector={clickedVector}
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
                thresholds={thresholds}
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
