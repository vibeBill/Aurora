import { NextResponse } from "next/server";
import axios from "axios";

// 接口定义
interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
}

interface GoogleSerperResponse {
  organic: GoogleSearchResult[];
}

interface BingWebPage {
  name: string;
  url: string;
  snippet: string;
}

interface BingSearchResponse {
  webPages: {
    value: BingWebPage[];
  };
}

interface WeatherResponse {
  main: {
    temp: number;
    humidity: number;
  };
  weather: {
    description: string;
  }[];
}

interface QueryAnalysis {
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

export async function POST(req: Request) {
  try {
    const { query, useInternet } = await req.json();

    let searchResults: { title: string; link: string; snippet: string }[] = [];
    let searchContext = "";
    let additionalContext = "";

    const analysisPrompt = `系统: 你是一个专门用于分析查询类型的助手。你需要将用户的查询分类为时间查询、天气查询或一般性查询。
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

    const cityCoordinates: Record<string, { lat: number; lon: number }> = {
      // 直辖市
      北京: { lat: 39.9042, lon: 116.4074 },
      上海: { lat: 31.2304, lon: 121.4737 },
      天津: { lat: 39.0842, lon: 117.2009 },
      重庆: { lat: 29.5633, lon: 106.5516 },

      // 华北地区
      石家庄: { lat: 38.0428, lon: 114.5149 },
      太原: { lat: 37.8706, lon: 112.5489 },
      呼和浩特: { lat: 40.8428, lon: 111.7498 },

      // 东北地区
      沈阳: { lat: 41.8057, lon: 123.4315 },
      长春: { lat: 43.8171, lon: 125.3235 },
      哈尔滨: { lat: 45.8038, lon: 126.534 },
      大连: { lat: 38.914, lon: 121.6147 },

      // 华东地区
      南京: { lat: 32.0603, lon: 118.7969 },
      杭州: { lat: 30.2741, lon: 120.1551 },
      合肥: { lat: 31.8206, lon: 117.2272 },
      福州: { lat: 26.0745, lon: 119.2965 },
      南昌: { lat: 28.682, lon: 115.8579 },
      济南: { lat: 36.6512, lon: 117.1201 },
      青岛: { lat: 36.0671, lon: 120.3826 },
      厦门: { lat: 24.4798, lon: 118.0894 },
      苏州: { lat: 31.2989, lon: 120.5853 },
      宁波: { lat: 29.8683, lon: 121.544 },
      无锡: { lat: 31.4906, lon: 120.3119 },

      // 中南地区
      广州: { lat: 23.1291, lon: 113.2644 },
      深圳: { lat: 22.5431, lon: 114.0579 },
      武汉: { lat: 30.5928, lon: 114.3055 },
      长沙: { lat: 28.2278, lon: 112.9388 },
      南宁: { lat: 22.817, lon: 108.3665 },
      海口: { lat: 20.0444, lon: 110.192 },
      珠海: { lat: 22.271, lon: 113.5767 },
      佛山: { lat: 23.0218, lon: 113.122 },
      东莞: { lat: 23.043, lon: 113.7633 },
      郑州: { lat: 34.7466, lon: 113.6253 },

      // 西南地区
      成都: { lat: 30.5728, lon: 104.0668 },
      贵阳: { lat: 26.647, lon: 106.6302 },
      昆明: { lat: 24.8801, lon: 102.8329 },
      拉萨: { lat: 29.65, lon: 91.1 },
      西安: { lat: 34.3416, lon: 108.9398 },
      兰州: { lat: 36.0611, lon: 103.8343 },
      西宁: { lat: 36.6232, lon: 101.7804 },

      // 西北地区
      乌鲁木齐: { lat: 43.8256, lon: 87.6168 },
      银川: { lat: 38.4872, lon: 106.2309 },

      // 其他重要城市
      大同: { lat: 40.0766, lon: 113.2982 },
      包头: { lat: 40.6571, lon: 109.8405 },
      鞍山: { lat: 41.1087, lon: 122.9956 },
      抚顺: { lat: 41.8708, lon: 123.9574 },
      吉林: { lat: 43.8378, lon: 126.5501 },
      齐齐哈尔: { lat: 47.3542, lon: 123.918 },
      徐州: { lat: 34.2044, lon: 117.2859 },
      温州: { lat: 27.9939, lon: 120.6997 },
      淄博: { lat: 36.8131, lon: 118.0548 },
      洛阳: { lat: 34.6196, lon: 112.454 },
      襄阳: { lat: 32.009, lon: 112.1226 },
      株洲: { lat: 27.8273, lon: 113.1339 },
      柳州: { lat: 24.3264, lon: 109.4281 },
      三亚: { lat: 18.2528, lon: 109.512 },
      遵义: { lat: 27.7256, lon: 106.9271 },
      大理: { lat: 25.5916, lon: 100.2251 },
      延安: { lat: 36.5853, lon: 109.4894 },
      喀什: { lat: 39.4707, lon: 75.9897 },

      // 特别行政区
      香港: { lat: 22.3193, lon: 114.1694 },
      澳门: { lat: 22.1987, lon: 113.5439 },

      // 台湾主要城市
      台北: { lat: 25.033, lon: 121.5654 },
      高雄: { lat: 22.6273, lon: 120.3014 },
      台中: { lat: 24.1477, lon: 120.6736 },
      台南: { lat: 22.9908, lon: 120.2133 },
    };

    const timezoneMapping: Record<string, string> = {
      北京: "Asia/Shanghai",
      上海: "Asia/Shanghai",
      东京: "Asia/Tokyo",
      纽约: "America/New_York",
      伦敦: "Europe/London",
      // 添加更多城市...
    };

    function preprocessQuery(query: string): QueryAnalysis {
      // 移除空格并转换为小写
      const normalizedQuery = query.replace(/\s+/g, "").toLowerCase();

      // 检查时间关键词
      const timeKeywords = ["几点", "时间", "日期", "星期", "现在", "报时"];
      if (timeKeywords.some((keyword) => normalizedQuery.includes(keyword))) {
        // 尝试识别城市/时区
        for (const [city, timezone] of Object.entries(timezoneMapping)) {
          if (normalizedQuery.includes(city.toLowerCase())) {
            return {
              type: "time",
              params: { timezone },
            };
          }
        }
        // 默认返回北京时间
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
      if (
        weatherKeywords.some((keyword) => normalizedQuery.includes(keyword))
      ) {
        // 尝试识别城市
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

    // 在主函数中
    let queryAnalysis: QueryAnalysis;

    // 首先使用规则进行识别
    const rulesAnalysis = preprocessQuery(query);

    if (rulesAnalysis.type !== "general") {
      // 如果规则识别出特定类型，直接使用规则结果
      queryAnalysis = rulesAnalysis;
    } else {
      // 否则再用 LLM 进行分析
      try {
        const analysisResponse = await fetch(
          "http://127.0.0.1:11434/api/generate",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "llama3.2",
              prompt: analysisPrompt,
              stream: false,
            }),
          }
        );

        const analysisResult = await analysisResponse.json();
        queryAnalysis = JSON.parse(analysisResult.response) as QueryAnalysis;
      } catch (e) {
        console.error("Parse analysis error:", e);
        queryAnalysis = rulesAnalysis; // fallback to rules analysis
      }
    }

    // 根据分析结果获取相应信息
    if (queryAnalysis.type === "time" && queryAnalysis.params?.timezone) {
      const now = new Date();
      const timeString = now.toLocaleString("zh-CN", {
        timeZone: queryAnalysis.params.timezone,
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        weekday: "long",
      });
      additionalContext = `当前${queryAnalysis.params.timezone}时区的时间是: ${timeString}\n\n`;
      console.log(additionalContext);
    }

    if (queryAnalysis.type === "weather" && queryAnalysis.params?.location) {
      try {
        const location = queryAnalysis.params.location;
        const weatherResponse = await axios.get<WeatherResponse>(
          `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&units=metric&appid=${process.env.OPENWEATHER_API_KEY}&lang=zh_cn`
        );
        console.log(weatherResponse.data);

        const weatherInfo = {
          temperature: weatherResponse.data.main.temp,
          humidity: weatherResponse.data.main.humidity,
          description: weatherResponse.data.weather[0].description,
        };

        additionalContext = `当前${location.name}天气情况:\n温度: ${weatherInfo.temperature}°C\n湿度: ${weatherInfo.humidity}%\n天气状况: ${weatherInfo.description}\n，为用户提供一些暖心提醒\n\n`;
        console.log(additionalContext);
      } catch (error) {
        console.error("Weather API error:", error);
      }
    }

    async function isUsingClash() {
      try {
        const response = await axios.get("http://google.com", {
          proxy: {
            host: "127.0.0.1",
            port: 7890,
          },
        });
        console.log(response.status);
        return true;
      } catch (error) {
        console.error("未能通过 Clash 代理：", error);
      }
      return false;
    }

    if (useInternet) {
      const applyBrowser = async () => {
        const isClash = await isUsingClash();
        console.log(isClash ? "使用Clash代理" : "未使用Clash代理");

        if (isClash) {
          try {
            const searchResponse = await axios.post<GoogleSerperResponse>(
              "https://google.serper.dev/search",
              { q: query, num: 5 },
              {
                headers: {
                  "X-API-KEY": process.env.SERPER_API_KEY,
                  "Content-Type": "application/json",
                },
              }
            );
            searchResults = searchResponse.data.organic.map((item) => ({
              title: item.title,
              link: item.link,
              snippet: item.snippet,
            }));
          } catch (err) {
            console.error("Google search error:", err);
            searchResults = [];
          }
        } else {
          try {
            const searchResponse = await axios.get<BingSearchResponse>(
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
            searchResults = searchResponse.data.webPages.value.map((item) => ({
              title: item.name,
              link: item.url,
              snippet: item.snippet,
            }));
          } catch (err) {
            console.error("Bing search error:", err);
            searchResults = [];
          }
        }
      };

      await applyBrowser();

      searchContext = searchResults
        .map(
          (result) =>
            `${result.title}\n${result.snippet}\nSource: ${result.link}`
        )
        .join("\n\n");
    }

    const response = new Response(
      new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();

          if (useInternet) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({ type: "searchResults", data: searchResults }) +
                  "\n"
              )
            );
          }

          try {
            const aiResponse = await fetch(
              "http://127.0.0.1:11434/api/generate",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  model: "llama3.2",
                  prompt: useInternet
                    ? `通过查询到的信息:\n\n${additionalContext}以及${searchContext}\n\n回答用户的问题: ${query}\n请提供一个专业的回答。`
                    : `通过查询到的信息:\n\n${additionalContext}\n\n回答用户的问题:${query}\n请提供一个专业的回答。`,
                  stream: true,
                }),
              }
            );

            const reader = aiResponse.body?.getReader();
            if (!reader) throw new Error("No reader available");

            const textDecoder = new TextDecoder();

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const text = textDecoder.decode(value);
              const lines = text.split("\n").filter((line) => line.trim());

              for (const line of lines) {
                try {
                  const parsed = JSON.parse(line) as { response: string };
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({ type: "token", data: parsed.response }) +
                        "\n"
                    )
                  );
                } catch (e) {
                  console.error("Parse error:", e);
                }
              }
            }
          } catch (err) {
            console.error("AI Error:", err);
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "error",
                  data: "AI model error",
                }) + "\n"
              )
            );
          }

          controller.close();
        },
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      }
    );

    return response;
  } catch (error) {
    console.error("General Error:", error);
    return NextResponse.json(
      {
        error: "An error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
