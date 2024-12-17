// utils/queryAnalyzer.ts
import { QueryAnalysis } from "@/types";
import { cityCoordinates, timezoneMapping } from "@/data/coordinates";

export function preprocessQuery(query: string): QueryAnalysis {
  const normalizedQuery = query.replace(/\s+/g, "").toLowerCase();

  // 检查时间关键词
  const timeKeywords = ["几点", "时间", "日期", "星期", "现在", "报时"];
  if (timeKeywords.some((keyword) => normalizedQuery.includes(keyword))) {
    for (const [city, timezone] of Object.entries(timezoneMapping)) {
      if (normalizedQuery.includes(city.toLowerCase())) {
        return {
          type: "time",
          params: { timezone },
        };
      }
    }
    return {
      type: "time",
      params: { timezone: "Asia/Shanghai" },
    };
  }

  // 检查天气关键词
  const weatherKeywords = [
    "天气",
    "气温",
    "温度",
    "下雨",
    "下雪",
    "晴天",
    "阴天",
    "湿度",
  ];
  if (weatherKeywords.some((keyword) => normalizedQuery.includes(keyword))) {
    for (const [city, coords] of Object.entries(cityCoordinates)) {
      if (normalizedQuery.includes(city.toLowerCase())) {
        return {
          type: "weather",
          params: {
            location: {
              name: city,
              ...coords,
            },
          },
        };
      }
    }
  }

  return { type: "general" };
}

export const getAnalysisPrompt = (
  query: string
) => `WARNING: ANY OUTPUT OTHER THAN THE EXACT JSON FORMAT WILL BE REJECTED.
DO NOT ADD ANY EXPLANATION OR ADDITIONAL TEXT.

ONLY RETURN ONE OF THESE THREE JSON FORMATS WITHOUT ANY OTHER TEXT:

1. {"type": "general"}
2. {"type": "weather", "params": {"location": {"name": "xxx", "lat": 23, "lon": 123}}}
3. {"type": "time", "params": {"timezone": "xxx"}}

TIME KEYWORDS: 几点, 时间, 日期, 星期, 现在, 当前时间, 报时
WEATHER KEYWORDS: 天气, 气温, 温度, 下雨, 下雪, 晴天, 阴天, 湿度

检测用户的查询: ${query}并返回相应的JSON数据`;
