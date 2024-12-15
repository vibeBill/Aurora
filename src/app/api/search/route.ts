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

    // 首先让llama分析查询类型
    const analysisResponse = await fetch(
      "http://127.0.0.1:11434/api/generate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3.2",
          prompt: `系统: 你是一个专门用于分析查询类型的助手。你需要将用户的查询分类为时间查询、天气查询或一般性查询。你的回答必须是一个完整的JSON字符串，不要有任何其他文字。

          规则:
          1. 必须返回完整的、合法的JSON字符串
          2. JSON必须包含完整的开始和结束大括号
          3. 所有字符串必须使用双引号
          4. 数字不需要引号
          
          JSON格式示例:
          时间查询: {"type": "time", "params": {"timezone": "Asia/Shanghai"}}
          天气查询: {"type": "weather", "params": {"location": {"name": "北京", "lat": 39.9042, "lon": 116.4074}}}，一定要包含经纬度信息！！
          一般查询: {"type": "general"}
          
          用户查询: ${query}
          
          请严格按照以上格式返回一个完整的JSON。`,
          stream: false,
        }),
      }
    );

    const analysisResult = await analysisResponse.json();
    console.log(analysisResult);

    let queryAnalysis: QueryAnalysis;

    try {
      queryAnalysis = JSON.parse(analysisResult.response) as QueryAnalysis;
    } catch (e) {
      console.error("Parse analysis error:", e);
      queryAnalysis = { type: "general" };
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
