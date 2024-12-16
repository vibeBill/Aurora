// app/api/chat/route.ts
import { NextResponse } from "next/server";
import { preprocessQuery, getAnalysisPrompt } from "@/utils/queryAnalyzer";
import {
  isUsingClash,
  searchGoogle,
  searchBing,
} from "@/services/searchService";
import { getWeather } from "@/services/weatherService";
import { QueryAnalysis, SearchResult } from "@/types";

export async function POST(req: Request) {
  try {
    const { query, useInternet } = await req.json();

    let searchResults: SearchResult[] = [];
    let searchContext = "";
    let additionalContext = "";

    // 查询分析
    let queryAnalysis: QueryAnalysis = preprocessQuery(query);

    if (queryAnalysis.type === "general") {
      try {
        const analysisResponse = await fetch(
          "http://127.0.0.1:11434/api/generate",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "llama3.2",
              prompt: getAnalysisPrompt(query),
              stream: false,
            }),
          }
        );

        const analysisResult = await analysisResponse.json();
        queryAnalysis = JSON.parse(analysisResult.response);
      } catch (e) {
        console.error("Parse analysis error:", e);
      }
    }

    // 处理时间查询
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
    }

    // 处理天气查询
    if (queryAnalysis.type === "weather" && queryAnalysis.params?.location) {
      try {
        const location = queryAnalysis.params.location;
        const weatherInfo = await getWeather(location.lat, location.lon);
        additionalContext = `当前${location.name}天气情况:\n温度: ${weatherInfo.temperature}°C\n湿度: ${weatherInfo.humidity}%\n天气状况: ${weatherInfo.description}\n，为用户提供一些暖心提醒\n\n`;
      } catch (error) {
        console.error("Weather error:", error);
      }
    }

    // 处理网络搜索
    if (useInternet) {
      const isClash = await isUsingClash();
      searchResults = isClash
        ? await searchGoogle(query)
        : await searchBing(query);

      searchContext = searchResults
        .map(
          (result) =>
            `${result.title}\n${result.snippet}\nSource: ${result.link}`
        )
        .join("\n\n");
    }

    // 返回流式响应
    return new Response(
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
