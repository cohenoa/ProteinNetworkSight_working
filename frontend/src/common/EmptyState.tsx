import { ColumnState} from "ag-grid-community";
import { GlobalState } from "little-state-machine";

export const emptyState: GlobalState = {
  fileName: "",
  idHeader: "UID",
  vectorsPrefix: "G",
  headers: [],
  organism: { label: "Homo sapiens", value: "9606" },
  scoreThreshold: 0.4,
  isSetSuggestions: false,
  vectorsHeaders: [],
  vectorsLastLayout: [],
  isLoading: false,
  isSetNamesMap: false,
  showError: false,
  thresholds:{},
  sortTable: Array<ColumnState>(),
};
