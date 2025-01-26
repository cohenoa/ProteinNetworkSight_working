import { utils, writeFile } from "xlsx";
import {
  headers as example_headers,
  json as example_json,
} from "../assets/DefualtFile";

export function downloadExampleFile(): void {
  let download_json: any[] = [];
  example_json.forEach((row, row_index) => {
    let new_row: any = {};
    row.forEach((cell, cell_index) => {
      new_row[example_headers[cell_index]] = cell;
    });
    download_json[row_index] = new_row;
  });

  let ws = utils.json_to_sheet(download_json);
  let wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "example");
  writeFile(wb, `example.xlsx`);
}

export function getExampleFile(): {
  json: (string | number)[][];
  headers: string[];
} {
  return { json: example_json, headers: example_headers };
}
