/*
  This file defines the json objects -
  how a json object will look for a specific response from the server.
*/
export interface OptionType {
  value: string | Number;
  label: string;
}

export interface IOrganismJson {
  organisms: OptionType[];
}

type suggestion = {
  string_name: string;
  id: string;
};

export interface ISuggestionsJson {
  perfect_match: {
    [key: string]: number;
  };

  alternative_match: {
    [key: string]: { [key: string]: number };
  };

  no_match: string[];
}

export interface IUidJson {
  uuid: string;
}
export interface IPairsScoreJson {
  pairs: string[][];
}
export interface IStringIdJson {
  match_id: string;
}