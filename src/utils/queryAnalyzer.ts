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
) => `系统: 你是一个专门用于分析查询类型的助手。你需要将用户的查询分类为时间查询、天气查询或一般性查询。
规则:
1. 必须返回完整的、合法的JSON字符串
2. JSON必须包含完整的开始和结束大括号
3. 所有字符串必须使用双引号
4. 数字不需要引号

关键词识别规则:
时间查询关键词: 几点, 时间, 日期, 星期, 现在, 当前时间, 报时
天气查询关键词: 天气, 气温, 温度, 下雨, 下雪, 晴天, 阴天, 湿度, 今天天气, 明天天气

示例查询和对应JSON:
"现在几点了" -> {"type": "time", "params": {"timezone": "Asia/Shanghai"}}
"北京时间" -> {"type": "time", "params": {"timezone": "Asia/Shanghai"}}
"纽约现在是几点" -> {"type": "time", "params": {"timezone": "America/New_York"}}

"北京天气怎么样" -> {"type": "weather", "params": {"location": {"name": "北京", "lat": 39.9042, "lon": 116.4074}}}
"上海下雨了吗" -> {"type": "weather", "params": {"location": {"name": "上海", "lat": 31.2304, "lon": 121.4737}}}
"东京温度多少度" -> {"type": "weather", "params": {"location": {"name": "东京", "lat": 35.6762, "lon": 139.6503}}}

"如何学习编程" -> {"type": "general"}
"最近的新闻" -> {"type": "general"}

用户查询: ${query}

请严格按照以上规则和示例格式返回一个完整的JSON。记住:如果包含时间相关词汇就返回time类型,如果包含天气相关词汇就返回weather类型,否则返回general类型。`;
