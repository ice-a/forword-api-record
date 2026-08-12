# 中转站管理 (Relay Station Manager)

Nuxt 3 一体化应用：Vue 3 前端 + Nitro 服务端（MongoDB 代理）+ Serverless 部署到 Vercel。

## 技术栈

- 前端：Nuxt 3 / Vue 3（卡片展示，默认只读）
- 服务端：Nuxt Nitro 引擎（`server/api` 路由，构建为 Vercel Serverless Functions）
- 数据库：MongoDB（Mongoose，连接在服务端复用）
- 部署：Vercel（`nitro.preset: 'vercel'`，无需单独维护 Node 服务）

> 浏览器无法直连 MongoDB，因此所有数据库操作都在 Nitro 服务端完成；前端只通过 `/api/*` 相对路径访问。

## 目录结构

```
.
├── .env                      # 环境变量（MONGODB_URI / ADMIN_PASSWORD）
├── nuxt.config.ts            # Nuxt 配置（全局样式 / runtimeConfig / vercel preset / favicon）
├── app.vue                   # 前端根组件（卡片 + 后台 + 主题 + 背景 + tabs）
├── assets/css/main.css       # 全局样式（科技感 UI）
├── components/
│   ├── Platforms.vue         # 工具配置组件（数据库驱动 + 后台管理）
│   ├── Skills.vue            # Skills 推荐组件（含 AI 生成简介）
│   └── Vpns.vue              # VPN 推荐组件
├── composables/useApi.ts     # 前端 API 调用封装（$fetch）
└── server/
    ├── models/
    │   ├── station.ts         # Mongoose Schema（中转站）
    │   ├── tool.ts            # 工具配置
    │   ├── skill.ts           # Skills 推荐
    │   └── vpn.ts             # VPN 推荐
    ├── utils/
    │   ├── db.ts              # MongoDB 连接复用
    │   ├── config.ts          # 服务端配置（密码）
    │   ├── stations.ts        # 鉴权 / 脱敏 / 拉模型
    │   └── crud.ts            # 通用 CRUD 工厂（tools/skills/vpns）
    └── api/                  # Nitro 路由（GET/POST/PUT/DELETE）
        ├── stations/
        │   ├── index.get.ts / index.post.ts
        │   ├── [id].put.ts / [id].delete.ts
        │   ├── [id]/refresh-models.post.ts
        │   ├── [id]/health.post.ts        # 公开探活
        │   └── [id]/status.post.ts        # 公开更新状态
        ├── tools/            # 工具配置（公开读 + 后台增删改）
        ├── skills/           # Skills 推荐（公开读 + 后台增删改）
        ├── vpns/             # VPN 推荐（公开读 + 后台增删改）
        ├── ai/generate-intro.post.ts  # 调用已配置中转站生成 skill 简介
        ├── auth/verify.post.ts
        └── export.get.ts / import.post.ts
```

## 快速开始（本地）

1. 安装依赖

   ```bash
   npm install
   ```

2. 配置环境变量（`.env`）

   ```bash
   MONGODB_URI=mongodb://localhost:27017/relay_station
   ADMIN_PASSWORD=你的强密码
   ```

3. 本地开发

   ```bash
   npm run dev
   ```

   访问 http://localhost:3000 （前端与服务端同源，API 走 `/api`）。

4. 生产构建

   ```bash
   npm run build      # 生成 .output / .vercel/output
   npm run start      # 本地运行构建产物（需 Node）
   ```

## 部署到 Vercel（api.020417.xyz）

1. 推送代码到 Git 仓库并导入 Vercel。
2. 在 Vercel 项目 **Settings → Environment Variables** 配置：

   | 变量 | 说明 |
   |------|------|
   | `MONGODB_URI` | MongoDB 连接地址（必填） |
   | `ADMIN_PASSWORD` | 后台管理密码（必填） |

3. 构建命令（默认）：`nuxt build`；输出目录由 Nitro 自动处理（`nitro.preset: 'vercel'`）。
4. 域名：在 Vercel 绑定 `api.020417.xyz`，并将该域名的 DNS 指向 Vercel（CNAME → `cname.vercel-dns.com`）。
5. 部署完成后：`npx vercel deploy --prebuilt` 或连接 Git 自动部署。

> MongoDB 连接在服务端每次冷启动复用全局连接；Vercel 函数超时默认 10s，列表/健康接口已设 15s abort。如需更长超时，可在 Vercel 函数为对应接口配置 `maxDuration`。

## 功能说明

- **中转站页**：卡片展示，公开可读。后台登录后增删改查，保存后自动拉取模型列表（失败回退 `gpt-3.5-turbo` / `gpt-4`）。
- **直达地址**：每个中转站可在后台填写 `直达地址`（站点主页/控制台）。留空时自动回退使用 `Base URL`。卡片与详情弹窗均提供「直达 ↗」新标签页打开。
- **获取模型列表**：后台表单填入 Base URL 与 API Key 后，点击「获取模型列表」即时拉取并回填，无需先保存。编辑时若不重填 Key 则复用库中已存的 Key。
- **排序**：`排序` 字段数值越小越靠前，相同权重按创建时间倒序。
- **描述**：`描述` 字段展示在卡片（最多两行）与详情弹窗中，并纳入搜索范围。
- **自动测活**：每次加载并发 ping 所有 baseURL（探活 `/v1/models`）。失败自动置为「停用」并落库；原本停用但已恢复则自动恢复为「可用」。顶部「⟳ 测活」可手动触发；每张卡片也有独立「测活」按钮。探活结果通过公开接口 `/api/stations/:id/status` 持久化，访客也能触发。
- **主题配色**：顶栏「主题」可切换 6 套预设或自定义主色，实时生效并持久化到 localStorage。
- **背景图**：顶栏「背景」可选图片 API 随机获取，或粘贴自定义图片 URL，持久化到 localStorage。
- **工具配置页**：展示 Claude Code / Codex / OpenCode / Gemini / Grok / CCSwitch 等工具的安装方式与官网，数据来自数据库。后台登录后可新增 / 编辑 / 删除工具（名称、描述、标签、安装命令、官网、详细步骤、排序、备注）。
- **Skills 推荐页**：数据库驱动的技能/工具推荐列表。后台新增时可填写名称与官网，点击「AI 生成简介」调用已配置的可用中转站（OpenAI 兼容接口）生成一段中文简介，无需手动撰写。
- **VPN 推荐页**：数据库驱动的 VPN/代理推荐列表，后台可新增名称、链接、描述等。
- **搜索 / 筛选 / 统计**：按名称、地址、模型、备注搜索；按状态筛选；顶部统计总数 / 可用 / 停用 / 模型数。
- **导入导出**：后台可导出 JSON（脱敏）或导入。
- **后台管理**：右上角「后台登录」，输入 `ADMIN_PASSWORD` 后增删改查。

## 安全说明

- 前端永不接触原始 API Key；写操作均经服务端 `x-admin-password` 鉴权。
- 列表接口经服务端 `sanitize()` 剔除 `apiKey`，仅返回 `keyId` 标识。
- 探活与状态更新接口为公开，但仅做连通性探测与状态位切换，不返回任何密钥。

## API 一览

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | `/api/stations` | 否 | 获取全部中转站（脱敏） |
| POST | `/api/stations` | 是 | 新增 |
| PUT | `/api/stations/:id` | 是 | 更新 |
| DELETE | `/api/stations/:id` | 是 | 删除 |
| POST | `/api/auth/verify` | 否 | 校验管理密码 |
| POST | `/api/stations/:id/refresh-models` | 是 | 重新获取模型列表 |
| POST | `/api/stations/:id/health` | 否 | 探活（连通性） |
| POST | `/api/stations/:id/status` | 否 | 根据探活结果更新状态 |
| GET | `/api/tools` | 否 | 获取全部工具配置 |
| POST | `/api/tools` | 是 | 新增工具 |
| PUT | `/api/tools/:id` | 是 | 更新工具 |
| DELETE | `/api/tools/:id` | 是 | 删除工具 |
| GET | `/api/skills` | 否 | 获取全部 Skills 推荐 |
| POST | `/api/skills` | 是 | 新增 Skill |
| PUT | `/api/skills/:id` | 是 | 更新 Skill |
| DELETE | `/api/skills/:id` | 是 | 删除 Skill |
| POST | `/api/ai/generate-intro` | 是 | 调用已配置中转站生成 Skill 简介 |
| GET | `/api/vpns` | 否 | 获取全部 VPN 推荐 |
| POST | `/api/vpns` | 是 | 新增 VPN 推荐 |
| PUT | `/api/vpns/:id` | 是 | 更新 VPN 推荐 |
| DELETE | `/api/vpns/:id` | 是 | 删除 VPN 推荐 |
| GET | `/api/export` | 是 | 导出（脱敏） |
| POST | `/api/import` | 是 | 导入 JSON |
