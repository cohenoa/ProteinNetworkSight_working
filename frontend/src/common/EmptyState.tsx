import { json } from "../assets/DefualtFile";
import { ColumnState} from "ag-grid-community";

export const emptyState = {
  fileName: "",
  json: [],
  idHeader: "UID",
  vectorsPrefix: "G",
  headers: [],
  proteinsNames: [],
  organism: { label: "Homo sapiens", value: "9606" },
  scoreThreshold: 0.4,
  positiveThreshold: 0.08,
  negativeThreshold: -0.08,
  isSetSuggestions: false,
  suggestionsObj: { perfect_match: {}, alternative_match: {}, no_match: [] },
  namesStringMap: {},
  vectorsHeaders: [],
  vectorsValues: {},
  uuid: "",
  isLoading: false,
  isSetNamesMap: false,
  showError: false,
  thresholds:{},
  sortTable: Array<ColumnState>(),
  stringNames: [],
};
