# 💖 长辈健康血压心率记录仪 (Family Health Vital Logger PWA)

专为长辈打造的极简语音血压（高压/低压）与心率（脉搏）记录 Progressive Web App (PWA)。

采用 **Google Gemini 2.5 Flash** 智能解析普通话口述内容，支持本地 IndexedDB 离线存储，并可自动无缝同步至 **Google Drive 中的 Google Sheet**。

---

## 🌟 核心特性 (Key Features)

1. **老年人关怀界面 (Senior-Friendly UI)**
   - 极简、超大触控按键、高对比度黑夜模式。
   - 140mmHg/90mmHg 临床血压标准自动评级，绿/黄/橙/红四色直观警示。
2. **AI 语音识别与结构化提取 (Voice AI Parsing)**
   - 集成浏览器 Web Speech API (`lang = 'zh-CN'`) 实时听取普通话。
   - 通过 **Google Gemini 2.5 Flash** 结构化提取 `systolic` (收缩压), `diastolic` (舒张压), `heart_rate` (心率), `notes` (服药/备注)。
   - 提供确认与微调弹窗，方便长辈微调数值。
3. **离线优先与 Google Drive 自动同步 (Offline-First & Google Sheets Sync)**
   - 无网络时自动保存在浏览器 IndexedDB。
   - 恢复网络或授权 Google 账号后，自动写入目标 Google Sheet。
4. **PWA 支持 (Installable PWA)**
   - 可在 iOS / Android / 桌面端一键“添加到主屏幕”，当作原生 App 使用。

---

## 🚀 部署到 Vercel (Vercel Deployment)

### 1. 部署项目
将代码推送到 GitHub 后，在 Vercel 导入该 Repo。

### 2. 配置环境变量 (Environment Variables)
在 Vercel 项目设置中添加：
- `GEMINI_API_KEY`: 您的 Google Gemini API Key

Vercel 会自动托管主界面以及 API 接口 `/api/parse.js`。

---

## 🛠️ 本地开发运行 (Local Development)

```bash
# 安装依赖
npm install

# 启动本地开发服务
npm run dev

# 构建打包生产版本
npm run build
```

---

## 📋 软件架构 (Tech Stack)

- **Frontend**: React + Vite + Tailwind CSS + Lucide Icons + `vite-plugin-pwa`
- **Voice Speech**: Web Speech API (`zh-CN`)
- **AI Processing**: Google Gemini API (`gemini-2.5-flash`)
- **Database**: IndexedDB (`idb`) + Google Sheets API v4 (Google Identity Services GIS)
- **Backend/API**: Vercel Serverless Function (`/api/parse.js`)
