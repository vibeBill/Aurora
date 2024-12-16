// types.ts
export interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
}

export interface GoogleSerperResponse {
  organic: GoogleSearchResult[];
}

export interface BingWebPage {
  name: string;
  url: string;
  snippet: string;
}

export interface BingSearchResponse {
  webPages: {
    value: BingWebPage[];
  };
}

export interface WeatherResponse {
  main: {
    temp: number;
    humidity: number;
  };
  weather: {
    description: string;
  }[];
}

export interface QueryAnalysis {
  type: "time" | "weather" | "general";
  params?: {
    timezone?: string;
    location?: {
      name: string;
      lat: number;
      lon: number;
    };
  };
}

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}
