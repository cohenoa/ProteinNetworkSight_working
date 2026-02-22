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
      stringId: number;
    };
}

export interface IVectorsValues {
  [key: string]: number[];
}

declare module "little-state-machine" {
  interface GlobalState {
    fileName: string;
    idHeader: string;
    vectorsPrefix: string;
    headers: string[];
    organism: OptionType;
    scoreThreshold: number;
    vectorsHeaders: string[];
    vectorsLastLayout: string[];
    isLoading: boolean;
    isSetSuggestions: boolean;
    isSetNamesMap: boolean;
    showError:boolean
    thresholds:{[x: string]: threshMap;}
    sortTable:Array<ColumnState>;
  }
};

type threshMap = {
  pos: number;
  neg: number;
};