export function renderHTML(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agent Buddy Server - Quota Management Hub</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: {
              50: '#eef2ff',
              500: '#6366f1',
              600: '#4f46e5',
              700: '#4338ca',
            },
            darkBg: '#0f172a',
            darkCard: '#1e293b',
            darkBorder: '#334155'
          }
        }
      }
    }
  </script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
    }
    code, pre {
      font-family: 'JetBrains Mono', monospace;
    }
    .modal-enter {
      animation: modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }
  </style>
</head>
<body class="bg-[#0b0f19] text-slate-200 min-h-screen flex flex-col antialiased selection:bg-indigo-500 selection:text-white">

  <!-- Header -->
  <header class="border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
          </svg>
        </div>
        <div>
          <h1 class="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            Agent Buddy <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Server</span>
          </h1>
          <p class="text-xs text-slate-400">专用额度监测与 OAuth 代理服务</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div id="authStatusBadge" class="hidden items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border">
          <span class="w-2 h-2 rounded-full"></span>
          <span id="authStatusText">未认证</span>
        </div>

        <button onclick="openKeyModal()" class="flex items-center gap-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition">
          <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
          </svg>
          <span id="keyBtnLabel">管理密钥设置</span>
        </button>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

    <!-- Agent Buddy Device Configuration Banner -->
    <div class="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden shadow-xl">
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Agent Buddy 硬件配置</span>
            <span class="text-xs text-slate-400">填入 agent-buddy/cfg.toml 即可无缝连接本服务</span>
          </div>
          <div class="flex flex-wrap items-center gap-2 text-xs text-slate-300 pt-1 font-mono">
            <span class="text-slate-500">BASE_URL:</span>
            <span id="dispBaseUrl" class="text-indigo-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">https://.../</span>
            <span class="text-slate-500 ml-2">MANAGEMENT_KEY:</span>
            <span id="dispKey" class="text-indigo-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">********</span>
          </div>
        </div>
        <button onclick="copyAgentBuddyConfig()" class="inline-flex items-center gap-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
          复制 cfg.toml 配置
        </button>
      </div>
    </div>

    <!-- Connected Accounts Section -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-white flex items-center gap-2">
            已连接的账号与额度
            <span id="accountCountBadge" class="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">0</span>
          </h2>
          <p class="text-xs text-slate-400">Agent Buddy 将轮询并监控以下账号的实时配额</p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="refreshAllQuotas()" class="inline-flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition">
            <svg id="refreshSpinIcon" class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            刷新配额
          </button>
        </div>
      </div>

      <!-- Credential List Container -->
      <div id="credentialList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Rendered dynamically -->
        <div class="col-span-full py-12 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
          <svg class="w-10 h-10 mx-auto text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
          </svg>
          <p class="text-sm font-medium">尚未添加任何 AI 账号凭据</p>
          <p class="text-xs text-slate-600 mt-1">请在下方快速添加 OpenAI、Claude、Google Antigravity 或 Kimi 账号</p>
        </div>
      </div>
    </div>

    <!-- Add Account Section -->
    <div class="space-y-4 pt-4 border-t border-slate-800/80">
      <div>
        <h2 class="text-lg font-bold text-white">快速接入 AI 服务账号</h2>
        <p class="text-xs text-slate-400">点击对应服务，通过 OAuth 一键授权或导入凭据</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <!-- OpenAI Codex Card -->
        <div class="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 flex flex-col justify-between transition group shadow-sm">
          <div class="space-y-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1683a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4947zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1683a.0757.0757 0 0 1-.071 0l-4.8303-2.7866A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.6667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.6617zM13.626 12l-2.829-1.632 2.829-1.632 2.829 1.632z"/>
              </svg>
            </div>
            <div>
              <h3 class="font-bold text-white group-hover:text-emerald-400 transition">OpenAI Codex</h3>
              <p class="text-xs text-slate-400 mt-0.5">ChatGPT Plus / Pro 订阅配额监控</p>
            </div>
          </div>
          <button onclick="startOAuth('codex')" class="mt-5 w-full py-2 px-3 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl transition">
            连接 Codex 账号
          </button>
        </div>

        <!-- Anthropic Claude Card -->
        <div class="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 flex flex-col justify-between transition group shadow-sm">
          <div class="space-y-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-base">
              ✦
            </div>
            <div>
              <h3 class="font-bold text-white group-hover:text-amber-400 transition">Anthropic Claude</h3>
              <p class="text-xs text-slate-400 mt-0.5">Claude Code / Pro 5小时与周配额</p>
            </div>
          </div>
          <button onclick="startOAuth('claude')" class="mt-5 w-full py-2 px-3 text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl transition">
            连接 Claude 账号
          </button>
        </div>

        <!-- Google CloudCode / Antigravity Card -->
        <div class="bg-slate-900 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-5 flex flex-col justify-between transition group shadow-sm">
          <div class="space-y-3">
            <div class="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold text-base">
              G
            </div>
            <div>
              <h3 class="font-bold text-white group-hover:text-blue-400 transition">Google Antigravity</h3>
              <p class="text-xs text-slate-400 mt-0.5">Gemini Code Assist & Claude 免费配额</p>
            </div>
          </div>
          <button onclick="startOAuth('antigravity')" class="mt-5 w-full py-2 px-3 text-xs font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl transition">
            连接 Google 账号
          </button>
        </div>

        <!-- Moonshot Kimi Card -->
        <div class="bg-slate-900 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-5 flex flex-col justify-between transition group shadow-sm">
          <div class="space-y-3">
            <div class="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold text-base">
              K
            </div>
            <div>
              <h3 class="font-bold text-white group-hover:text-purple-400 transition">Moonshot Kimi</h3>
              <p class="text-xs text-slate-400 mt-0.5">Kimi Coding 设备码快速授权</p>
            </div>
          </div>
          <button onclick="startOAuth('kimi')" class="mt-5 w-full py-2 px-3 text-xs font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl transition">
            连接 Kimi 设备码
          </button>
        </div>

      </div>

      <!-- JSON / Manual Import Bar -->
      <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <div>
            <h4 class="text-xs font-bold text-slate-200">已有凭据文件？直接导入 JSON 凭据</h4>
            <p class="text-xs text-slate-500">支持 CLIProxyAPI 导出的 JSON、OpenAI 或 Claude 现有凭据</p>
          </div>
        </div>
        <button onclick="openImportModal()" class="text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl border border-slate-700 transition">
          粘贴 / 上传 JSON
        </button>
      </div>

    </div>

  </main>

  <!-- Footer -->
  <footer class="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
    Agent Buddy dedicated proxy &bull; Runs seamlessly on Cloudflare Workers edge network
  </footer>

  <!-- ======================= MODALS ======================= -->

  <!-- Key Configuration Modal -->
  <div id="keyModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 modal-enter shadow-2xl">
      <div class="flex items-center justify-between">
        <h3 class="text-base font-bold text-white flex items-center gap-2">
          <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
          </svg>
          设置管理密钥 (Management Key)
        </h3>
        <button onclick="closeModal('keyModal')" class="text-slate-400 hover:text-white">&times;</button>
      </div>
      <p class="text-xs text-slate-400 leading-relaxed">
        请输入部署本 Worker 时配置的 <code class="text-indigo-300">MANAGEMENT_KEY</code>。此密钥仅保存在您的浏览器本地，用于与服务端接口鉴权。
      </p>
      <div>
        <label class="block text-xs font-medium text-slate-300 mb-1">管理密钥</label>
        <input id="inputKey" type="password" placeholder="输入环境变量中配置的 MANAGEMENT_KEY" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono">
      </div>
      <div id="keyErrorMsg" class="hidden text-xs text-rose-400 p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20"></div>
      <div class="flex items-center justify-end gap-2 pt-2">
        <button onclick="closeModal('keyModal')" class="px-3 py-1.5 text-xs text-slate-400 hover:text-white">取消</button>
        <button id="saveKeyBtn" onclick="saveKey()" class="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 transition">验证并保存</button>
      </div>
    </div>
  </div>

  <!-- OAuth Login Modal (Codex / Claude / Antigravity) -->
  <div id="oauthModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 modal-enter shadow-2xl">
      <div class="flex items-center justify-between">
        <h3 id="oauthModalTitle" class="text-base font-bold text-white">OAuth 账号授权</h3>
        <button onclick="closeModal('oauthModal')" class="text-slate-400 hover:text-white">&times;</button>
      </div>

      <div class="space-y-4 text-xs text-slate-300">
        <div class="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
          <p class="font-semibold text-indigo-300">第一步：点击按钮在官方页面登录并授权</p>
          <p class="text-slate-400 leading-relaxed">
            点击下方按钮将打开官方授权页面。登录成功后，浏览器会跳转至本地回调地址（例如 localhost:1455 等），提示<strong>“无法访问此网站”</strong>是完全正常的！
          </p>
          <a id="oauthExternalLink" href="#" target="_blank" class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-md transition">
            前往官方页面登录授权 &rarr;
          </a>
        </div>

        <div class="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <p class="font-semibold text-slate-200">第二步：复制浏览器地址栏地址并粘贴在下方</p>
          <p class="text-slate-400 leading-relaxed">
            将授权完成后跳转的<strong>整个网址</strong>（例如 <code class="text-indigo-400">http://localhost:1455/auth/callback?code=...&state=...</code>）或授权码粘贴到下方输入框：
          </p>
          <textarea id="oauthRedirectInput" rows="3" placeholder="粘贴跳转后的完整网址或 code..." class="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"></textarea>
        </div>
      </div>

      <div id="oauthErrorMsg" class="hidden text-xs text-rose-400 p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20"></div>

      <div class="flex items-center justify-end gap-2 pt-2">
        <button onclick="closeModal('oauthModal')" class="px-3 py-1.5 text-xs text-slate-400 hover:text-white">取消</button>
        <button id="oauthSubmitBtn" onclick="submitOAuthCallback()" class="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5">
          <span>完成授权</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Kimi Device Flow Modal -->
  <div id="kimiModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 modal-enter shadow-2xl">
      <div class="flex items-center justify-between">
        <h3 class="text-base font-bold text-white">Kimi 设备码授权</h3>
        <button onclick="closeModal('kimiModal')" class="text-slate-400 hover:text-white">&times;</button>
      </div>
      <div class="space-y-4 text-xs text-slate-300">
        <p class="text-slate-400 leading-relaxed">
          Kimi 使用 RFC 8628 设备授权模式。请在打开的 Kimi 页面中确认您的授权码：
        </p>
        <div class="text-center p-6 bg-slate-950 border border-purple-500/30 rounded-2xl space-y-2">
          <p class="text-xs text-slate-500 uppercase tracking-widest font-semibold">您的用户授权码</p>
          <div id="kimiUserCode" class="text-3xl font-mono font-bold text-purple-400 tracking-wider">----</div>
          <p id="kimiPollStatus" class="text-xs text-slate-400 pt-2 flex items-center justify-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            等待您在浏览器中授权确认...
          </p>
        </div>
        <div class="text-center">
          <a id="kimiAuthLink" href="#" target="_blank" class="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-purple-600/30 transition">
            打开 Kimi 授权确认页面 &rarr;
          </a>
        </div>
      </div>
    </div>
  </div>

  <!-- Direct Import Modal -->
  <div id="importModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 modal-enter shadow-2xl">
      <div class="flex items-center justify-between">
        <h3 class="text-base font-bold text-white">导入凭据 JSON</h3>
        <button onclick="closeModal('importModal')" class="text-slate-400 hover:text-white">&times;</button>
      </div>
      <p class="text-xs text-slate-400">
        直接粘贴从 CLIProxyAPI 或官方客户端生成的凭据 JSON 数据：
      </p>
      <div>
        <textarea id="importJsonInput" rows="10" placeholder='{"type": "antigravity", "access_token": "...", "refresh_token": "...", "project_id": "..."}' class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"></textarea>
      </div>
      <div id="importErrorMsg" class="hidden text-xs text-rose-400 p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20"></div>
      <div class="flex items-center justify-end gap-2">
        <button onclick="closeModal('importModal')" class="px-3 py-1.5 text-xs text-slate-400 hover:text-white">取消</button>
        <button onclick="submitImportJson()" class="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 transition">确认导入</button>
      </div>
    </div>
  </div>

  <!-- Toast Notification -->
  <div id="toast" class="hidden fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2">
    <span id="toastIcon"></span>
    <span id="toastMsg"></span>
  </div>

  <script>
    // Global State
    let currentKey = localStorage.getItem('agent_buddy_key') || localStorage.getItem('code_buddy_key') || '';
    let currentOAuthState = '';
    let currentOAuthProvider = '';
    let kimiPollTimer = null;

    document.addEventListener('DOMContentLoaded', () => {
      // Support reading key from URL hash or query: #key=... or ?key=...
      const urlParams = new URLSearchParams(window.location.search);
      const queryKey = urlParams.get('key');
      const hashMatch = window.location.hash.match(/[#&]key=([^&]+)/);
      const hashKey = hashMatch ? decodeURIComponent(hashMatch[1]) : null;
      const autoKey = queryKey || hashKey;

      if (autoKey) {
        currentKey = autoKey.trim();
        localStorage.setItem('agent_buddy_key', currentKey);
        // Clean URL
        history.replaceState(null, '', window.location.pathname);
      }

      initApp();
    });

    async function initApp() {
      // If no key in localStorage, check if server has an initial auto-generated key
      if (!currentKey) {
        try {
          const res = await fetch('/v0/system/init-info');
          if (res.ok) {
            const info = await res.json();
            if (info.key) {
              currentKey = info.key;
              localStorage.setItem('agent_buddy_key', currentKey);
              showToast('🎉 已自动为您生成并配置管理密钥！', 'success');
            }
          }
        } catch (e) {
          // ignore
        }
      }

      updateKeyUI();
      loadCredentials();

      // If still empty after check, prompt user to configure key
      if (!currentKey) {
        openKeyModal();
      }
    }

    function updateKeyUI() {
      const dispBaseUrl = document.getElementById('dispBaseUrl');
      const dispKey = document.getElementById('dispKey');
      const badge = document.getElementById('authStatusBadge');
      const badgeText = document.getElementById('authStatusText');
      const keyBtnLabel = document.getElementById('keyBtnLabel');

      const origin = window.location.origin + '/';
      dispBaseUrl.textContent = origin;

      if (currentKey) {
        dispKey.textContent = currentKey;
        badge.className = 'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        badgeText.textContent = '已配置密钥';
        badge.firstElementChild.className = 'w-2 h-2 rounded-full bg-emerald-400';
        keyBtnLabel.textContent = '管理密钥: ' + (currentKey.length > 12 ? currentKey.substring(0, 10) + '...' : currentKey);
      } else {
        dispKey.textContent = '未配置';
        badge.className = 'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-amber-500/10 text-amber-400 border-amber-500/20';
        badgeText.textContent = '未输入密钥';
        badge.firstElementChild.className = 'w-2 h-2 rounded-full bg-amber-400';
        keyBtnLabel.textContent = '设置管理密钥';
      }
    }

    function openKeyModal() {
      document.getElementById('inputKey').value = currentKey;
      document.getElementById('keyErrorMsg').classList.add('hidden');
      openModal('keyModal');
    }

    async function saveKey() {
      const val = document.getElementById('inputKey').value.trim();
      const errBox = document.getElementById('keyErrorMsg');
      const btn = document.getElementById('saveKeyBtn');

      if (!val) {
        errBox.textContent = '请输入密钥后再保存！';
        errBox.classList.remove('hidden');
        return;
      }

      errBox.classList.add('hidden');
      btn.disabled = true;
      btn.textContent = '验证中...';

      try {
        const testRes = await fetch('/v0/management/verify', {
          headers: { 'Authorization': 'Bearer ' + val }
        });

        if (testRes.status === 401) {
          errBox.textContent = '密钥错误！与服务端配置的 MANAGEMENT_KEY 不一致。';
          errBox.classList.remove('hidden');
          return;
        }

        if (testRes.status === 500) {
          const errData = await testRes.json();
          errBox.textContent = errData.error || '服务端尚未在环境变量中配置 MANAGEMENT_KEY！';
          errBox.classList.remove('hidden');
          return;
        }

        currentKey = val;
        localStorage.setItem('agent_buddy_key', val);
        closeModal('keyModal');
        updateKeyUI();
        loadCredentials();
        showToast('密钥验证成功并已保存！', 'success');
      } catch (e) {
        errBox.textContent = '请求异常: ' + e.message;
        errBox.classList.remove('hidden');
      } finally {
        btn.disabled = false;
        btn.textContent = '验证并保存';
      }
    }

    function copyAgentBuddyConfig() {
      const origin = window.location.origin + '/';
      const key = currentKey || 'your-management-key';
      const snippet = '# 在 agent-buddy/cfg.toml 中填入以下两行:\\n' +
        'base_url = "' + origin + '"\\n' +
        'management_key = "' + key + '"';
      navigator.clipboard.writeText(snippet).then(() => {
        showToast('cfg.toml 配置已复制到剪贴板！', 'success');
      });
    }

    // Modal Helpers
    function openModal(id) {
      document.getElementById(id).classList.remove('hidden');
    }

    function closeModal(id) {
      document.getElementById(id).classList.add('hidden');
      if (id === 'kimiModal' && kimiPollTimer) {
        clearInterval(kimiPollTimer);
        kimiPollTimer = null;
      }
    }

    // API Helper with Management Key
    async function apiFetch(endpoint, options = {}) {
      options.headers = options.headers || {};
      if (currentKey) {
        options.headers['Authorization'] = 'Bearer ' + currentKey;
        options.headers['X-Management-Key'] = currentKey;
      }
      return fetch(endpoint, options);
    }

    // Load Credentials
    async function loadCredentials() {
      try {
        const res = await apiFetch('/v0/management/auth-files');
        if (res.status === 401) {
          showToast('管理密钥错误或未设置，请先配置密钥', 'error');
          return;
        }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        renderCredentials(data.files || []);
      } catch (err) {
        console.error('Failed to load credentials:', err);
      }
    }

    function renderCredentials(files) {
      const container = document.getElementById('credentialList');
      const countBadge = document.getElementById('accountCountBadge');
      countBadge.textContent = files.length;

      if (!files.length) {
        container.innerHTML = \`
          <div class="col-span-full py-12 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
            <svg class="w-10 h-10 mx-auto text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
            <p class="text-sm font-medium">尚未添加任何 AI 账号凭据</p>
            <p class="text-xs text-slate-600 mt-1">请在下方快速添加 OpenAI、Claude、Google Antigravity 或 Kimi 账号</p>
          </div>\`;
        return;
      }

      let html = '';
      for (const f of files) {
        const p = (f.provider || f.type || '').toLowerCase();
        let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
        let providerName = p;
        if (p.includes('codex')) {
          badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
          providerName = 'OpenAI Codex';
        } else if (p.includes('claude')) {
          badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
          providerName = 'Claude';
        } else if (p.includes('antigravity')) {
          badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
          providerName = 'Antigravity (Google)';
        } else if (p.includes('kimi')) {
          badgeColor = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
          providerName = 'Moonshot Kimi';
        }

        html += \`
          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm hover:border-slate-700 transition" id="card-\${f.id}">
            <div class="flex items-start justify-between gap-2">
              <div class="space-y-1">
                <span class="inline-block px-2 py-0.5 text-xs font-semibold rounded-full border \${badgeColor}">\${providerName}</span>
                <h4 class="text-sm font-bold text-white truncate max-w-[200px]" title="\${f.name}">\${f.email || f.name}</h4>
                <p class="text-xs text-slate-400 font-mono">auth_index: \${f.auth_index}</p>
                \${f.project_id ? \`<p class="text-xs text-slate-500 font-mono truncate max-w-[220px]" title="\${f.project_id}">GCP: \${f.project_id}</p>\` : ''}
              </div>
              <button onclick="deleteAccount('\${f.name}')" class="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition" title="删除此凭据">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>

            <!-- Live Quota Status Preview -->
            <div id="quota-box-\${f.id}" class="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
              <div class="flex items-center justify-between text-slate-400">
                <span>配额状态</span>
                <span id="quota-status-\${f.id}" class="text-slate-500">点击查询实时配额</span>
              </div>
              <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div id="quota-bar-\${f.id}" class="bg-indigo-500 h-full w-0 transition-all duration-500"></div>
              </div>
            </div>

            <div class="flex items-center justify-between pt-1 text-xs">
              <span class="text-emerald-400 flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> 状态正常
              </span>
              <button onclick="testQuota('\${f.auth_index}', '\${f.id}', '\${p}', '\${f.project_id || ''}')" class="text-indigo-400 hover:text-indigo-300 font-medium">
                查询配额 &rarr;
              </button>
            </div>
          </div>\`;
      }
      container.innerHTML = html;

      // Automatically trigger quota queries
      for (const f of files) {
        const p = (f.provider || f.type || '').toLowerCase();
        testQuota(f.auth_index, f.id, p, f.project_id || '');
      }
    }

    // Live Quota Query via /v0/management/api-call
    async function testQuota(authIndex, cardId, provider, projectId) {
      const statusSpan = document.getElementById('quota-status-' + cardId);
      const progressBar = document.getElementById('quota-bar-' + cardId);
      if (!statusSpan) return;

      statusSpan.textContent = '查询中...';

      let reqPayload = null;
      if (provider.includes('claude')) {
        reqPayload = {
          auth_index: authIndex,
          method: 'GET',
          url: 'https://api.anthropic.com/api/oauth/usage',
          header: {
            'Authorization': 'Bearer $TOKEN$',
            'Content-Type': 'application/json',
            'anthropic-beta': 'oauth-2025-04-20'
          }
        };
      } else if (provider.includes('codex')) {
        reqPayload = {
          auth_index: authIndex,
          method: 'GET',
          url: 'https://chatgpt.com/backend-api/wham/usage',
          header: {
            'Authorization': 'Bearer $TOKEN$',
            'Content-Type': 'application/json',
            'User-Agent': 'codex-tui/0.149.1 (Mac OS 26.5.2; arm64)'
          }
        };
      } else if (provider.includes('kimi')) {
        reqPayload = {
          auth_index: authIndex,
          method: 'GET',
          url: 'https://api.kimi.com/coding/v1/usages',
          header: {
            'Authorization': 'Bearer $TOKEN$'
          }
        };
      } else if (provider.includes('antigravity') && projectId) {
        reqPayload = {
          auth_index: authIndex,
          method: 'POST',
          url: 'https://daily-cloudcode-pa.googleapis.com/v1internal:retrieveUserQuotaSummary',
          header: {
            'Authorization': 'Bearer $TOKEN$',
            'Content-Type': 'application/json',
            'User-Agent': 'antigravity/cli/1.0.13 (aidev_client; os_type=darwin; arch=arm64)'
          },
          data: JSON.stringify({ project: projectId })
        };
      }

      if (!reqPayload) {
        statusSpan.textContent = '无需外部查询';
        return;
      }

      try {
        const res = await apiFetch('/v0/management/api-call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reqPayload)
        });
        const data = await res.json();
        if (data.status_code === 200 && data.body) {
          const parsed = JSON.parse(data.body);
          parseAndDisplayQuota(parsed, provider, statusSpan, progressBar);
        } else {
          statusSpan.textContent = '上游返回 ' + data.status_code;
        }
      } catch (err) {
        statusSpan.textContent = '查询出错';
      }
    }

    function parseAndDisplayQuota(body, provider, statusSpan, progressBar) {
      if (provider.includes('claude')) {
        if (body.five_hour) {
          const util = body.five_hour.utilization || 0;
          const pct = Math.max(0, Math.min(100, Math.round(util <= 1 ? (1 - util) * 100 : (100 - util))));
          statusSpan.textContent = '剩余 ' + pct + '% (5h)';
          progressBar.style.width = pct + '%';
          progressBar.className = pct > 20 ? 'bg-amber-500 h-full' : 'bg-rose-500 h-full';
        }
      } else if (provider.includes('codex')) {
        if (body.rate_limit && body.rate_limit.primary_window) {
          const used = body.rate_limit.primary_window.used_percent || 0;
          const rem = Math.max(0, Math.min(100, Math.round(100 - used)));
          statusSpan.textContent = '剩余 ' + rem + '%';
          progressBar.style.width = rem + '%';
          progressBar.className = rem > 20 ? 'bg-emerald-500 h-full' : 'bg-rose-500 h-full';
        }
      } else if (provider.includes('kimi')) {
        if (body.limits && body.limits.length > 0) {
          const item = body.limits[0];
          const rem = item.remaining !== undefined ? item.remaining : 0;
          statusSpan.textContent = '剩余 ' + rem + ' 次';
          progressBar.style.width = '100%';
        }
      } else if (provider.includes('antigravity')) {
        if (body.groups && body.groups.length > 0) {
          statusSpan.textContent = '已获取 ' + body.groups.length + ' 组模型配额';
          progressBar.style.width = '100%';
          progressBar.className = 'bg-blue-500 h-full';
        }
      }
    }

    function refreshAllQuotas() {
      const spin = document.getElementById('refreshSpinIcon');
      spin.classList.add('animate-spin');
      loadCredentials().finally(() => {
        setTimeout(() => spin.classList.remove('animate-spin'), 600);
      });
    }

    async function deleteAccount(name) {
      if (!confirm('确定要删除凭据 ' + name + ' 吗？')) return;
      try {
        const res = await apiFetch('/v0/management/auth-files?name=' + encodeURIComponent(name), {
          method: 'DELETE'
        });
        if (res.ok) {
          showToast('已删除凭据 ' + name, 'success');
          loadCredentials();
        } else {
          showToast('删除失败', 'error');
        }
      } catch (err) {
        showToast('请求异常', 'error');
      }
    }

    // Start OAuth Flow
    async function startOAuth(provider) {
      currentOAuthProvider = provider;
      const modalTitle = document.getElementById('oauthModalTitle');
      const externalLink = document.getElementById('oauthExternalLink');
      const errBox = document.getElementById('oauthErrorMsg');
      const input = document.getElementById('oauthRedirectInput');
      input.value = '';
      errBox.classList.add('hidden');

      if (provider === 'kimi') {
        openModal('kimiModal');
        document.getElementById('kimiUserCode').textContent = '获取中...';
        try {
          const res = await apiFetch('/v0/management/kimi-auth-url');
          const data = await res.json();
          if (data.status === 'ok') {
            document.getElementById('kimiUserCode').textContent = data.user_code;
            document.getElementById('kimiAuthLink').href = data.verification_uri_complete || data.verification_uri;
            startKimiPolling(data.state);
          } else {
            showToast('获取 Kimi 设备码失败: ' + (data.error || ''), 'error');
            closeModal('kimiModal');
          }
        } catch (e) {
          showToast('请求异常', 'error');
          closeModal('kimiModal');
        }
        return;
      }

      let endpoint = '';
      if (provider === 'codex') {
        endpoint = '/v0/management/codex-auth-url';
        modalTitle.textContent = '连接 OpenAI Codex (ChatGPT)';
      } else if (provider === 'claude') {
        endpoint = '/v0/management/anthropic-auth-url';
        modalTitle.textContent = '连接 Anthropic Claude';
      } else if (provider === 'antigravity') {
        endpoint = '/v0/management/antigravity-auth-url';
        modalTitle.textContent = '连接 Google CloudCode (Antigravity)';
      }

      try {
        const res = await apiFetch(endpoint);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        currentOAuthState = data.state;
        externalLink.href = data.url;
        openModal('oauthModal');
      } catch (err) {
        showToast('获取授权链接失败，请检查管理密钥', 'error');
      }
    }

    async function submitOAuthCallback() {
      const input = document.getElementById('oauthRedirectInput').value.trim();
      const errBox = document.getElementById('oauthErrorMsg');
      const submitBtn = document.getElementById('oauthSubmitBtn');

      if (!input) {
        errBox.textContent = '请先粘贴浏览器跳转后的完整地址或授权码！';
        errBox.classList.remove('hidden');
        return;
      }

      errBox.classList.add('hidden');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>处理中...</span>';

      try {
        const res = await apiFetch('/v0/management/oauth-callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: currentOAuthProvider,
            redirect_url: input,
            state: currentOAuthState
          })
        });

        const data = await res.json();
        if (res.ok && data.status === 'ok') {
          closeModal('oauthModal');
          showToast('成功连接账号！', 'success');
          loadCredentials();
        } else {
          errBox.textContent = data.error || '授权处理失败，请重试';
          errBox.classList.remove('hidden');
        }
      } catch (err) {
        errBox.textContent = '网络错误: ' + err.message;
        errBox.classList.remove('hidden');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>完成授权</span>';
      }
    }

    function startKimiPolling(state) {
      if (kimiPollTimer) clearInterval(kimiPollTimer);
      kimiPollTimer = setInterval(async () => {
        try {
          const res = await apiFetch('/v0/management/kimi-poll?state=' + encodeURIComponent(state));
          const data = await res.json();
          if (data.status === 'success' || data.completed) {
            clearInterval(kimiPollTimer);
            kimiPollTimer = null;
            closeModal('kimiModal');
            showToast('Kimi 授权成功！', 'success');
            loadCredentials();
          } else if (data.status === 'error') {
            clearInterval(kimiPollTimer);
            kimiPollTimer = null;
            showToast('Kimi 授权失败: ' + (data.message || ''), 'error');
          }
        } catch {
          // keep polling
        }
      }, 3000);
    }

    function openImportModal() {
      document.getElementById('importJsonInput').value = '';
      document.getElementById('importErrorMsg').classList.add('hidden');
      openModal('importModal');
    }

    async function submitImportJson() {
      const raw = document.getElementById('importJsonInput').value.trim();
      const errBox = document.getElementById('importErrorMsg');
      if (!raw) return;

      try {
        const parsed = JSON.parse(raw);
        const res = await apiFetch('/v0/management/auth-files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed)
        });
        const data = await res.json();
        if (res.ok && (data.status === 'ok' || data.name)) {
          closeModal('importModal');
          showToast('凭据导入成功！', 'success');
          loadCredentials();
        } else {
          errBox.textContent = data.error || '导入失败';
          errBox.classList.remove('hidden');
        }
      } catch (e) {
        errBox.textContent = 'JSON 格式解析失败: ' + e.message;
        errBox.classList.remove('hidden');
      }
    }

    function showToast(msg, type = 'info') {
      const t = document.getElementById('toast');
      const text = document.getElementById('toastMsg');
      const icon = document.getElementById('toastIcon');
      text.textContent = msg;
      icon.innerHTML = type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ');
      t.className = 'fixed bottom-6 right-6 z-50 text-white text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border ' +
        (type === 'success' ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200' :
         type === 'error' ? 'bg-rose-950/90 border-rose-500/40 text-rose-200' :
         'bg-slate-900 border-slate-700');
      t.classList.remove('hidden');
      setTimeout(() => t.classList.add('hidden'), 3500);
    }
  </script>
</body>
</html>
`;
}
