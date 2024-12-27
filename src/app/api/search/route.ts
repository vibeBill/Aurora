import { NextResponse } from "next/server";
import { preprocessQuery, getAnalysisPrompt } from "@/utils/queryAnalyzer";
import {
  isUsingClash,
  searchGoogle,
  searchBing,
} from "@/services/searchService";
import { getWeather } from "@/services/weatherService";
import { Message, QueryAnalysis, SearchResult } from "@/types";

export async function POST(req: Request) {
  try {
    const { query, useInternet, chatHistory, mode } = await req.json();
    const conversationHistory = chatHistory;
    let searchResults: SearchResult[] = [];
    let searchContext = "";
    let additionalContext = "";

    // 初步查询分析
    let queryAnalysis: QueryAnalysis = preprocessQuery(query);

    // 根据分析结果准备上下文
    if (queryAnalysis.type === "weather" && queryAnalysis.params?.location) {
      const weatherInfo = await getWeather(
        queryAnalysis.params.location.lat,
        queryAnalysis.params.location.lon
      );
      additionalContext = `当前 ${
        queryAnalysis.params.location.name
      }的天气信息为: ${JSON.stringify(weatherInfo)}`;
    } else if (
      queryAnalysis.type === "time" &&
      queryAnalysis.params?.timezone
    ) {
      const timeZone =
        queryAnalysis.params.timezone ||
        Intl.DateTimeFormat().resolvedOptions().timeZone;
      const currentTime = new Date().toLocaleString("en-US", { timeZone });
      additionalContext = `当前 ${timeZone}时间为: ${currentTime}`;
    }

    const messages = [
      {
        role: "system",
        content:
          "你是个非常有用的会讲中文的助手，你的名字是Aurora，你将根据用户的指示提供帮助。",
      },
      ...conversationHistory,
      {
        role: "user",
        content: query,
      },
    ];

    if (additionalContext) {
      messages.push({
        role: "user",
        content: `你可以根据${additionalContext}回答用户的问题`,
      });
    }

    // 准备 ollama API 请求
    const endpoint = mode === "chat" ? "chat" : "generate";
    const requestBody =
      mode === "chat"
        ? {
            model: "llama3.2",
            messages: messages,
            stream: true,
          }
        : {
            model: "llama3.2",
            prompt: `${additionalContext}\n\nUser: ${query}\nAssistant:`,
            stream: true,
          };

    // 返回流式响应
    return new Response(
      new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(
            encoder.encode(JSON.stringify({ type: "start" }) + "\n")
          );

          try {
            const aiResponse = await fetch(
              `http://127.0.0.1:11434/api/${endpoint}`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
              }
            );

            if (!aiResponse.ok) {
              throw new Error(
                `AI API responded with status: ${aiResponse.status}`
              );
            }

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
                  // 检查是否是有效的JSON响应
                  if (endpoint === "chat") {
                    const parsed = JSON.parse(line);
                    // 针对chat模式的响应格式进行处理
                    if (parsed.message?.content) {
                      controller.enqueue(
                        encoder.encode(
                          JSON.stringify({
                            type: "token",
                            data: parsed.message.content,
                          }) + "\n"
                        )
                      );
                    }
                  } else {
                    const parsed = JSON.parse(line) as { response: string };
                    controller.enqueue(
                      encoder.encode(
                        JSON.stringify({
                          type: "token",
                          data: parsed.response,
                        }) + "\n"
                      )
                    );
                  }
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
