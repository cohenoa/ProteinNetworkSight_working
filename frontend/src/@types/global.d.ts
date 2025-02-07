import { IVectorsValues } from './global.d';
import "little-state-machine";
import { ISuggestionsJson, OptionType } from "./json";

declare module 'cytoscape' {
  interface Core {
      svg(options?: any): string;
  }
}

export interface INamesStringMap {
  [key: string]:
    {
      stringName: string;
      stringId: string;
    };
}

export interface IVectorsValues {
  [key: string]: number[];
}

// declare module 'cytoscape-svg' {
//   import cytoscape from 'cytoscape';

//   const svg: cytoscape.Ext;
//   export default svg;
// }

// declare module 'cytoscape' {
//   interface Core {
//     svg(options?: any): string; // Modify `options` type if needed
//   }
// }

declare module "little-state-machine" {
  interface GlobalState {
    fileName: string;
    json: any[];
    idHeader: string;
    vectorsPrefix: string;
    headers: string[];
    proteinsNames: string[];
    organism: OptionType;
    scoreThreshold: number;
    positiveThreshold: number;
    negativeThreshold: number;
    vectorsHeaders: string[];
    isLoading: boolean;
    isSetSuggestions: boolean;
    suggestionsObj: ISuggestionsJson;
    isSetNamesMap: boolean;
    namesStringMap: INamesStringMap;
    vectorsValues: IVectorsValues;
    uuid: string;
    showError:boolean
    thresholds:{[x: string]: number[];}
    sortTable:Array<ColumnState>;
    stringNames:Array<string>;
  }
};

type threshMap = {
  pos: number;
  neg: number;
};