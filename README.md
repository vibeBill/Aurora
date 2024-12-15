这是一个 AI 网页，你可以通过此网页部署一个属于自己的 AI 网页。

## Getting Started

首先，你需要在本地部署一个 ollama 服务器。你可以参考[ollama](https://github.com/ollama/ollama)的文档来部署 ollama 服务器。

当你部署好 ollama 服务器后，你可以通过以下命令来启动你的 AI 网页：

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

通过你的浏览器打开[http://localhost:3000](http://localhost:3000)。

## 如果需要联网搜索功能

- 您可能需要
  - 在 env.local 文件中添加 SERPER_API_KEY=你的 serper api key，serper api key 可以在这里申请：https://serper.dev/
  - 或者在.env.local 文件中添加 BING_API_KEY=你的 bing api key 以及 BING_Custom_Configuration_ID=你的 bing custom configuration id，都可以在这里申请：https://www.customsearch.ai/

## 如果需要获取实时天气

- 您可能需要
  - 在.env.local 文件中添加 OPENWEATHER_API_KEY=你的 openweather api key，weather api key 可以在这里申请：https://openweathermap.org/api
