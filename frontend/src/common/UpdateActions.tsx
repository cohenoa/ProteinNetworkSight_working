import { GlobalState } from "little-state-machine";
import {
  INamesStringMap,
  IVectorsValues,
  threshMap,
} from "../@types/global";
import {ColumnState} from "ag-grid-community";
import { ISuggestionsJson, OptionType } from "../@types/json";



export function updateIsLoading(
  state: GlobalState,
  payload: { isLoading: boolean }
): GlobalState {
  console.log(payload);
  return {
    ...state,
    ...payload,
  };
}
export function updateShowError(
  state: GlobalState,
  payload: { showError: boolean }
): GlobalState {
  console.log(payload);
  return {
    ...state,
    ...payload,
  };
}

export function updateFileName(
  state: GlobalState,
  payload: { fileName: string }
): GlobalState {
  console.log(payload);
  return {
    ...state,
    ...payload,
  };
}

export function updateFileUpload(
  state: GlobalState,
  payload: { headers: string[] }
): GlobalState {
  console.log(payload);
  return {
    ...state,
    ...payload,
  };
}

export function updateFileDetails(
  state: GlobalState,
  payload: {
    // proteinsNames: string[];
    scoreThreshold: number;
    // positiveThreshold: number;
    // negativeThreshold: number;
    organism: OptionType;
    vectorsHeaders: string[];
    thresholds: {[x: string]: threshMap;}
    // vectorsValues: IVectorsValues;
  }
): GlobalState {
  console.log(payload);
  return {
    ...state,
    ...payload,
  };
}

export function updateSuggestionsObj(
  state: GlobalState,
  payload: { suggestionsObj: ISuggestionsJson }
): GlobalState {
  console.log(payload);
  return {
    ...state,
    ...payload,
    isSetSuggestions: true,
  };
}


export function updateNamesMap(
  state: GlobalState,
  payload: { namesStringMap: INamesStringMap }
): GlobalState {
  console.log(payload);
  return {
    ...state,
    ...payload,
    isSetNamesMap: true,

  };
}

export function updateUuid(
  state: GlobalState,
  payload: { uuid: string }
): GlobalState {
  console.log(payload);
  return {
    ...state,
    ...payload,
  };
}


/**
 * Updates the global state with the thresholds as an object with protein names as keys
 * and threshold values as an array of length 3 with the values for negative, score and positive thresholds
 * @param state The current global state
 * @param payload An object with a single property `thresholds` with the thresholds as an object with the same structure as above
 * @returns The new global state
 */

export function updateThresholds(
  state: GlobalState,
  payload: { thresholds: { [x: string]: threshMap; }}
): GlobalState {
  console.log(payload);
  return {
    ...state,
    ...payload,
  };
};


export function updatestringNames(
  state: GlobalState,
  payload: { stringNames: string[] }
): GlobalState {
  console.log(payload);
  return {
    ...state,
    ...payload,
  };
};


// Update the payload type to accept an array of ColumnState
export function updateSortTable(
  state: GlobalState,
  payload: { sortTable: ColumnState[] } // Change here
): GlobalState {
  console.log(payload);
  return {
    ...state,
    ...payload,
  };
}