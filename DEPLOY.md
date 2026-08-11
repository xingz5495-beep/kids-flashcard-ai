# 部署指南 🚀

本项目包含前后端两部分：

- `backend/`：Node.js + Express，提供 `/api/generate-images` 等接口，调用 AI 做图模型
- `frontend/`：React + Vite，提供 9 宫格单词输入、宫格排版与整图导出

## 一、后端部署到 Vercel（推荐）

1. 打开 Vercel Dashboard → New Project → Import Git Repository
2. 选择仓库 `xingz5495-beep/kids-flashcard-ai`
3. Configure Project：
   - Root Directory: `backend`
   - Framework Preset: `Other`
   - Build Command: 留空
   - Output Directory: 留空
4. 在 Environment Variables 中添加：

   ```text
   OPENAI_API_KEY  = 你的 NayutoAI Key
   OPENAI_BASE_URL = https://api.nayutoai.xyz/v1
   OPENAI_MODEL    = gpt-image-2
   NODE_ENV        = production
   ```

   如需使用 Claude 文本生成，再按需添加：

   ```text
   ANTHROPIC_API_KEY  = （可选）
   ANTHROPIC_BASE_URL = https://api.nayutoai.xyz/v1  或官方地址
   ANTHROPIC_MODEL    = claude-3-5-sonnet-20241022
   ```

5. 点击 Deploy，等待部署完成后，记录后端 URL（例如 `https://kids-flashcard-backend-xxx.vercel.app`）

## 二、前端部署到 Vercel

1. 再次 New Project → Import 同一个仓库
2. Configure Project：
   - Root Directory: `frontend`
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. 不需要配置环境变量
4. Deploy 后得到前端 URL（例如 `https://kids-flashcard-frontend-xxx.vercel.app`）

前端默认会请求相对路径 `/api/generate-images`，本地开发时通过 `vite.config.js` 代理到 `http://localhost:3000`，线上部署时建议：

- 直接在前端项目的 Vercel 项目中添加环境变量 `VITE_API_BASE` 指向后端 URL；
- 或在 `NineGridPage.jsx` 中将 fetch 地址改为完整后端地址。

## 三、本地开发

```bash
# 后端
cd backend
npm install
npm run dev   # 默认端口 3000

# 前端
cd ../frontend
npm install
npm run dev   # 默认端口 5173
```

浏览器访问 `http://localhost:5173` 即可看到 9 宫格页面。

## 四、注意事项

- AI 做图成本较高，建议先用少量单词测试，再用于批量生成
- 如果使用中转站（如 NayutoAI），请遵守对方服务条款
- 如需自定义卡片样式，可以直接修改 `NineGridPage.jsx` 与 Tailwind 样式
