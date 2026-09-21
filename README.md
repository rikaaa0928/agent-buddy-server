# agent-buddy-server

**agent-buddy-server** 是专为 **agent-buddy** (ESP32 订阅配额监控挂件) 打造的专用轻量服务端，设计用于极简部署在 **Cloudflare Workers** 边缘网络上。

它完全解耦并替代原先庞大的 `CLIProxyAPI` 服务，对外提供与原接口 100% 兼容的 API (`/v0/management/auth-files` 和 `/v0/management/api-call`)。**agent-buddy 硬件端无需改动任何核心逻辑代码**。

---

## 🌟 特性

- **轻量专注**：剥离所有无用功能，只专注为 agent-buddy 提供凭据维护、实时配额反向代理与自动 Token 刷新。
- **开箱即用、零配置生成**：部署时无需手动配置密钥；服务首次启动时自动生成高强度安全管理密钥并存入数据库，首次访问网页控制台自动完成鉴权登录！
- **一键 Cloudflare Workers 部署**：利用 Cloudflare 边缘计算与全球 CDN，全球节点超低延迟，高可用、免自建运维服务器。
- **持久化存储**：无缝对接 Cloudflare KV (`AUTH_KV`) 保存凭据；本地开发时自动回退至内存存储。
- **开箱即用 Web 管理后台**：
  - 访问 `/` 即可打开现代化控制面板。
  - 支持查看与管理自动生成或自定义的密钥。
  - 直观预览各账号的实时配额进度条（5小时额度、周额度、Kimi余量等）。
- **主流 AI OAuth 账号一键接入**：
  - **OpenAI Codex (ChatGPT Plus / Pro)**：支持官方 OAuth 授权，自动提取订阅等级与邮箱。
  - **Anthropic Claude (Claude Code / Pro)**：官方 OAuth 授权，提取 5h / 7d 周期配额。
  - **Google CloudCode (Antigravity)**：Google OAuth 登录，**全自动检测并绑定 GCP Project ID**。
  - **Moonshot Kimi (Kimi Coding)**：支持 RFC 8628 设备授权模式（Device Authorization Code），免重定向，网页自动轮询完成绑定。
  - **JSON 凭据直接导入**：支持粘贴从 CLIProxyAPI 或官方客户端生成的现有凭据 JSON。
- **全自动 Token 刷新机制**：
  - 代理调用时若检测到 Access Token 在 5 分钟内即将过期，会自动调用对应 Provider 的 Refresh Token 接口静默刷新并存入 KV。
  - 若上游接口返回 401 Unauthorized，自动尝试刷新一次并重试请求。

---

## 🚀 部署指南 (Cloudflare Workers)

提供两种部署方式：**网页控制台通过 GitHub 自动部署（推荐，支持代码更新自动上线）** 和 **本地命令行快速部署**。

---

### 方式一：通过 Cloudflare 网页控制台从 GitHub 部署（推荐）

该方式完全无需在本地安装 Node.js/Wrangler，且后续提交代码至 GitHub 会自动触发构建与持续部署。

#### 步骤 1：创建 KV 存储命名空间
1. 登录 [Cloudflare 控制台 (Dashboard)](https://dash.cloudflare.com/)。
2. 在左侧导航栏点击 **Storage & Databases** -> **KV**。
3. 点击右上角 **Create a namespace (创建命名空间)**。
4. 输入命名空间名称：`AUTH_KV`，点击 **Add (添加)**。

#### 步骤 2：连接 GitHub 仓库创建 Worker
1. 在左侧导航栏点击 **Compute (Workers & Pages)**。
2. 点击右上角 **Create (创建)** -> 点击 **Workers** 选项卡下方的 **Connect to Git (连接到 Git)**。
3. 授权并选择你的 GitHub 账号，选中 **`agent-buddy-server`** 仓库。
4. 部署配置保持默认即可（项目根目录下已有 `wrangler.toml` 与 `package.json`）。
5. 点击 **Save and Deploy (保存并部署)**。

#### 步骤 3：绑定 KV 命名空间（重要）
1. 首次部署完成后，进入该 Worker 页面，切换到 **Settings (设置)** 选项卡。
2. 在左侧子菜单点击 **Bindings (绑定)**。
3. 点击 **Add (添加绑定)** -> 选择 **KV Namespace (KV 命名空间)**：
   - **Variable name (变量名称，必须完全一致)**：填入 `AUTH_KV`
   - **KV namespace (选择命名空间)**：下拉选中步骤 1 中创建的 `AUTH_KV`
4. 点击 **Save and deploy (保存并部署)**。

#### 步骤 4：开始使用
- 点击 Overview 页面中分配的公网地址（如 `https://agent-buddy-server.<你的用户名>.workers.dev`）即可打开 Web 管理后台！
- 首次访问时，系统会自动生成管理密钥并完成登录展示。

---

### 方式二：通过本地终端命令行部署 (Wrangler CLI)

适合习惯本地命令行的开发者：

#### 1. 安装依赖

进入 `agent-buddy-server` 目录：

```bash
cd agent-buddy-server
npm install
```

#### 2. 登录 Cloudflare

```bash
npx wrangler login
```

#### 3. 创建 Cloudflare KV 命名空间

```bash
npx wrangler kv namespace create AUTH_KV
```

终端会输出类似如下内容：

```toml
[[kv_namespaces]]
binding = "AUTH_KV"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

复制输出的 `id`，替换 `wrangler.toml` 中的 `auth_kv_placeholder`：

```toml
[[kv_namespaces]]
binding = "AUTH_KV"
id = "替换为你的实际_kv_id"
```

#### 4. 一键部署到 Cloudflare

```bash
npm run deploy
```

部署完成后，终端会输出你的 Worker 服务公网地址，例如：
`https://agent-buddy-server.<你的二级域名>.workers.dev`

---

> **关于 MANAGEMENT_KEY（管理密钥）：**
> - **默认方式（零配置自生成）**：首次部署完成后直接在浏览器中打开服务网址，系统会自动生成高强度密钥并完成登录，页面上可一键复制。
> - **自定义方式（可选）**：若你希望使用固定密码，可在 Cloudflare 网页后台：
>   *Workers & Pages -> agent-buddy-server -> Settings -> Variables and Secrets -> 添加环境变量 `MANAGEMENT_KEY`* 即可，无需改动任何代码文件。

---

## 💻 使用与配置 agent-buddy

### 1. 登录 Web 后台绑定账号

1. 在浏览器中打开你的服务地址：`https://agent-buddy-server.<你的二级域名>.workers.dev/`。
2. 页面会自动识别生成的密钥并完成初始化（若你手动配置了环境变量，则在弹窗中输入该密钥）。
3. 在页面下方点击对应服务（Codex / Claude / Google Antigravity / Kimi）完成登录：
   - **Codex / Claude / Google**：点击跳转至官方授权页面，登录授权后，复制浏览器地址栏跳转到的地址（如 `http://localhost:1455/...`），粘贴回弹窗中的输入框即可。
   - **Kimi**：点击连接后，直接点击弹出的链接确认设备授权码，页面将在数秒内自动轮询完成。
   - **JSON 导入**：若已有其他机器上的凭据 JSON，可直接点击“粘贴 / 上传 JSON”。
4. 绑定成功后，账号将立即显示在仪表盘中，并实时拉取展示当前配额。

### 2. 配置 agent-buddy 硬件端

`agent-buddy` 现已将所有配置从源码中剥离，移至 **`cfg.toml`** 文件（已加入 `.gitignore`，防止密码泄露）：

打开 `agent-buddy/cfg.toml`，修改你的服务端地址与密钥：

```toml
[agent-buddy]
wifi_ssid = "你的Wi-Fi名称"
wifi_password = "你的Wi-Fi密码"

# 填入刚部署好的 Worker 地址
base_url = "https://agent-buddy-server.<你的二级域名>.workers.dev/"

# 填入网页后台显示的 MANAGEMENT_KEY
management_key = "网页后台展示的密钥"
```

重新编译并刷录 ESP32 固件：

```bash
cd agent-buddy
# 激活 esp-idf 工具链后:
cargo run --release
```

*(也支持编译时通过环境变量覆盖：`BASE_URL="https://..." MANAGEMENT_KEY="..." cargo run --release`)*

---

## 🛠 本地开发与测试

### 本地启动

```bash
npm run dev
```

本地服务默认启动在 `http://127.0.0.1:8787`，未绑定 KV 时会自动启用内存存储模拟。

### 运行自动化测试套件

内置全覆盖单元与集成测试（鉴权、API 反向代理、$TOKEN$ 替换、凭据导入与删除、状态流）：

```bash
npm test
```

### 静态类型检查

```bash
npm run build
```

---

## 📡 对外 API 规范 (CLIProxyAPI 兼容)

### 1. `GET /v0/management/auth-files`

- **Header**:
  - `Authorization: Bearer <MANAGEMENT_KEY>` 或 `X-Management-Key: <MANAGEMENT_KEY>`
- **Response**:
  ```json
  {
    "files": [
      {
        "id": "codex-1726839201",
        "auth_index": "codex-0",
        "name": "codex-user@example.com.json",
        "provider": "codex",
        "type": "codex",
        "status": "active",
        "disabled": false,
        "project_id": null,
        "email": "user@example.com",
        "account_type": "Plus"
      },
      {
        "id": "antigravity-1726839300",
        "auth_index": "antigravity-1",
        "name": "antigravity-user@gmail.com.json",
        "provider": "antigravity",
        "type": "antigravity",
        "status": "active",
        "disabled": false,
        "project_id": "gen-lang-client-xxxxxxx",
        "email": "user@gmail.com",
        "account_type": "Subscription"
      }
    ]
  }
  ```

### 2. `POST /v0/management/api-call`

- **Header**:
  - `Authorization: Bearer <MANAGEMENT_KEY>` 或 `X-Management-Key: <MANAGEMENT_KEY>`
  - `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "auth_index": "codex-0",
    "method": "GET",
    "url": "https://chatgpt.com/backend-api/wham/usage",
    "header": {
      "Authorization": "Bearer $TOKEN$",
      "Content-Type": "application/json",
      "User-Agent": "codex-tui/0.149.1 (Mac OS 26.5.2; arm64)"
    },
    "data": null
  }
  ```
- **Response**:
  ```json
  {
    "status_code": 200,
    "header": { ... },
    "body": "{\"plan_type\":\"plus\",\"rate_limit\":{...}}"
  }
  ```
