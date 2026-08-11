# AI Kids Flashcard Generator 🎨

一个使用 AI 生成儿童学习卡片的 Web 应用，支持 9 宫格单词卡片，一键导出整张图片用于打印。

## 功能概览

- 9 个单词输入框，支持 1–9 个英文单词/短语
- 后端调用 AI 做图模型（如 NayutoAI 的 `gpt-image-2`）为每个单词生成一张图片
- 前端自动按数量排版 2×2 / 3×3 宫格
- 一键将整张宫格导出为 PNG 图片

## 目录结构

```bash
kids-flashcard-ai/
├── backend/    # Node.js + Express 后端，负责调用 AI 接口
└── frontend/   # React + Vite 前端，9 宫格排版与下载
```

详细使用与部署说明见 `DEPLOY.md`。
