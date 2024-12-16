## 这是一个 AI 网页，您可以通过此项目部署一个属于自己的 AI 网页———欧罗拉。

## 如何开始？

首先，您需要在本地部署一个 ollama 服务器。您可以参考[ollama](https://github.com/ollama/ollama)的文档来部署 ollama 服务器。

当您部署好 ollama 服务器后，您需要安装依赖（取决于您使用的包管理工具）：

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

安装完依赖后，您可以通过以下命令来启动您的 AI 网页：

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

通过您的浏览器打开[http://localhost:3000](http://localhost:3000)。

## 如果需要联网搜索功能

- 您可能需要
  - 在 env.local 文件中添加 SERPER_API_KEY=您的 serper api key，serper api key 可以在这里申请：https://serper.dev/
  - 或者在.env.local 文件中添加 BING_API_KEY=您的 bing api key 以及 BING_Custom_Configuration_ID=您的 bing custom configuration id，都可以在这里申请：https://www.customsearch.ai/

## 如果需要获取实时天气

- 您可能需要
  - 在.env.local 文件中添加 OPENWEATHER_API_KEY=您的 openweather api key，weather api key 可以在这里申请：https://openweathermap.org/api
