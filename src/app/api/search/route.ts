import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: Request) {
  try {
    const { query, useInternet } = await req.json();

    let searchResults: { title: string; link: string; snippet: string }[] = [];
    let searchContext = "";

    async function isUsingClash() {
      try {
        // 使用代理请求来检测是否通过 Clash
        const response = await axios.get("http://google.com", {
          proxy: {
            host: "127.0.0.1",
            port: 7890,
          },
        });
        console.log(response.status); // 如果请求成功，Clash 应该在工作
        return true; // 说明通过 Clash 代理
      } catch (error) {
        console.error("未能通过 Clash 代理：", error);
      }
      return false; // 未通过代理
    }

    if (useInternet) {
      const useBrowser = async () => {
        const isClash = await isUsingClash();
        console.log(isClash ? "使用Clash代理" : "未使用Clash代理");

        if (isClash) {
          try {
            const searchResponse = await axios.post(
              "https://google.serper.dev/search",
              { q: query, num: 5 },
              {
                headers: {
                  "X-API-KEY": process.env.SERPER_API_KEY,
                  "Content-Type": "application/json",
                },
              }
            );
            searchResults = searchResponse.data.organic.map((item: any) => ({
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
            const searchResponse = await axios.get(
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
            searchResults = searchResponse.data.webPages.value.map(
              (item: any) => ({
                title: item.name,
                link: item.url,
                snippet: item.snippet,
              })
            );
          } catch (err) {
            console.error("Bing search error:", err);
            searchResults = [];
          }
        }
      };

      await useBrowser();

      searchContext = searchResults
        .map(
          (result) =>
            `${result.title}\n${result.snippet}\nSource: ${result.link}`
        )
        .join("\n\n");
    }

    // Return stream response
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
                    ? `Based on these search results:\n\n${searchContext}\n\nQuestion: ${query}\nPlease provide a comprehensive answer.`
                    : query,
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
                  const parsed = JSON.parse(line);
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
  } catch (error: any) {
    console.error("General Error:", error);
    return NextResponse.json(
      { error: "An error occurred", details: error.message },
      { status: 500 }
    );
  }
}
