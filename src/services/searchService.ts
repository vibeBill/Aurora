// services/searchService.ts
import axios from "axios";
import {
  SearchResult,
  GoogleSerperResponse,
  BingSearchResponse,
} from "@/types";

export async function isUsingClash() {
  try {
    const response = await axios.get("http://google.com", {
      proxy: {
        host: "127.0.0.1",
        port: 7890,
      },
    });
    return true;
  } catch (error) {
    console.error("未能通过 Clash 代理：", error);
    return false;
  }
}

export async function searchGoogle(query: string): Promise<SearchResult[]> {
  try {
    const response = await axios.post<GoogleSerperResponse>(
      "https://google.serper.dev/search",
      { q: query, num: 5 },
      {
        headers: {
          "X-API-KEY": process.env.SERPER_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.organic.map((item) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
    }));
  } catch (err) {
    console.error("Google search error:", err);
    return [];
  }
}

export async function searchBing(query: string): Promise<SearchResult[]> {
  try {
    const response = await axios.get<BingSearchResponse>(
      "https://api.bing.microsoft.com/v7.0/custom/search",
      {
        headers: {
          "Ocp-Apim-Subscription-Key": process.env.BING_API_KEY,
        },
        params: {
          q: query,
          customconfig: process.env.BING_Custom_Configuration_ID,
          count: 5,
        },
      }
    );
    return response.data.webPages.value.map((item) => ({
      title: item.name,
      link: item.url,
      snippet: item.snippet,
    }));
  } catch (err) {
    console.error("Bing search error:", err);
    return [];
  }
}
