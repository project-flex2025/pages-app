export interface City {
  name: string;
}

export interface State {
  name: string;
  state_code?: string;
  cities?: City[];
}

export interface Country {
  id: string;
  name: string;
  iso2?: string;
  iso3?: string;
  states?: State[];
}
