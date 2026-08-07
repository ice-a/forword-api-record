<script setup>
import { ref } from 'vue'

// 工具卡：仅展示安装方式与官网地址，点击卡片弹出详情
const tools = [
  {
    name: 'Claude Code',
    desc: 'Anthropic 官方 CLI 编码助手',
    tags: ['CLI', '终端'],
    install: 'npm install -g @anthropic-ai/claude-code',
    home: 'https://claude.com/claude-code',
    detail: [
      '安装：npm install -g @anthropic-ai/claude-code',
      '设置环境变量（使用中转站 baseURL 与 key）：',
      '  export ANTHROPIC_BASE_URL=<baseURL>',
      '  export ANTHROPIC_API_KEY=<key>',
      '启动：claude'
    ]
  },
  {
    name: 'Codex (OpenAI)',
    desc: 'OpenAI Codex 命令行编码助手',
    tags: ['CLI', 'OpenAI'],
    install: 'npm install -g @openai/codex',
    home: 'https://github.com/openai/codex',
    detail: [
      '安装：npm install -g @openai/codex',
      '配置环境变量：',
      '  export OPENAI_BASE_URL=<baseURL>',
      '  export OPENAI_API_KEY=<key>',
      '运行：codex "你的需求"'
    ]
  },
  {
    name: 'OpenCode',
    desc: '开源终端 AI 编码助手',
    tags: ['CLI', '开源'],
    install: 'npm install -g opencode-ai',
    home: 'https://opencode.ai',
    detail: [
      '安装：npm install -g opencode-ai',
      '配置文件 ~/.config/opencode/opencode.json：',
      '  "provider": { "baseUrl": "<baseURL>", "apiKey": "<key>", "model": "<model>" }',
      '或设置环境变量 OPENCODE_BASE_URL / OPENCODE_API_KEY'
    ]
  },
  {
    name: 'Gemini CLI',
    desc: 'Google Gemini 命令行编码助手',
    tags: ['CLI', 'Google'],
    install: 'npm install -g @google/gemini-cli',
    home: 'https://github.com/google-gemini/gemini-cli',
    detail: [
      '安装：npm install -g @google/gemini-cli',
      '配置环境变量（兼容 OpenAI 格式中转站）：',
      '  export GEMINI_API_KEY=<key>',
      '  export GEMINI_BASE_URL=<baseURL>',
      '运行：gemini'
    ]
  },
  {
    name: 'Grok',
    desc: 'xAI Grok 模型（OpenAI 兼容接入）',
    tags: ['API', 'xAI'],
    install: 'npm i -g @xai-official/grok@latest',
    home: 'https://x.ai/api',
    detail: [
      'Grok 提供 OpenAI 兼容接口，可直接复用时中转站：',
      'Base URL：<baseURL>',
      'API Key：<key>',
      '模型名：<model>（如 grok-2 等）',
      '示例（Python）：',
      '  from openai import OpenAI',
      '  client = OpenAI(base_url="<baseURL>", api_key="<key>")',
      '  client.chat.completions.create(model="<model>", messages=[...])'
    ]
  },
  {
    name: 'CCSwitch',
    desc: 'Claude Code 多账号 / 配置切换工具',
    tags: ['CLI', '切换'],
    install: 'npm install -g ccswitch',
    home: 'https://github.com/farion1231/cc-switch',
    detail: [
      '安装：npm install -g ccswitch',
      '在配置中填入中转站 baseURL 与 key：',
      '  Base URL：<baseURL>',
      '  API Key：<key>',
      '通过 ccswitch 在多个账号 / 配置间快速切换'
    ]
  }
]

const active = ref(null)
function open(t) { active.value = t }
function close() { active.value = null }

const toast = ref('')
let toastTimer
function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 1800)
}
async function copy(text) {
  try {
    await navigator.clipboard.writeText(text)
    showToast('已复制安装命令')
  } catch {
    showToast('复制失败，请手动复制')
  }
}
</script>

<template>
  <div>
    <h2 style="font-size:19px;margin:0 0 6px;">工具配置</h2>
    <p class="ph">以下为各 AI 编码工具的安装方式与官网地址，点击卡片查看详细配置步骤。</p>

    <div class="plat-grid">
      <div class="plat-card" v-for="t in tools" :key="t.name" @click="open(t)" tabindex="0"
           @keyup.enter="open(t)">
        <div class="plat-head">
          <span class="plat-name">{{ t.name }}</span>
          <span class="arrow">›</span>
        </div>
        <div class="plat-desc">{{ t.desc }}</div>
        <div class="plat-tags">
          <span class="tag" v-for="tag in t.tags" :key="tag">{{ tag }}</span>
        </div>
        <div class="plat-install">
          <span class="k">安装</span>
          <code @click.stop="copy(t.install)" :title="'点击复制：' + t.install">{{ t.install }}</code>
          <button class="copy-btn" @click.stop="copy(t.install)">复制</button>
        </div>
        <a class="plat-home" :href="t.home" target="_blank" @click.stop>官网 ↗</a>
      </div>
    </div>

    <div class="modal-mask" v-if="active" @click.self="close">
      <div class="modal">
        <div class="modal-head">
          <h2>{{ active.name }}</h2>
          <button class="x" @click="close">✕</button>
        </div>
        <p class="hint">{{ active.desc }}</p>

        <label>安装方式</label>
        <div class="code-row">
          <pre class="code">{{ active.install }}</pre>
          <button class="copy-btn" @click="copy(active.install)">复制</button>
        </div>

        <label>官网地址</label>
        <a class="home-link" :href="active.home" target="_blank">{{ active.home }} ↗</a>

        <label>详细配置步骤</label>
        <pre class="detail">{{ active.detail.join('\n') }}</pre>
      </div>
    </div>

    <div class="toast" v-if="toast">{{ toast }}</div>
  </div>
</template>

<style scoped>
.ph { color: var(--muted); font-size: 13px; }
.plat-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px; margin-top: 18px;
}
.plat-card {
  background: var(--glass); border: 1px solid var(--glass-brd);
  border-radius: 14px; padding: 16px; backdrop-filter: blur(12px);
  cursor: pointer; transition: all .2s ease; outline: none;
  animation: fadeUp .4s ease both;
}
.plat-card:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(79,209,255,0.12); border-color: rgba(79,209,255,0.4); }
.plat-head { display: flex; align-items: center; justify-content: space-between; }
.plat-name { font-weight: 700; font-size: 15px; }
.arrow { color: var(--accent); font-size: 22px; transition: transform .2s; }
.plat-card:hover .arrow { transform: translateX(4px); }
.plat-desc { color: var(--muted); font-size: 12px; margin: 4px 0 10px; }
.plat-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
.tag { font-size: 11px; padding: 2px 9px; border-radius: 20px; background: rgba(124,92,255,0.12); border: 1px solid rgba(124,92,255,0.3); color: #b9aaff; }
.plat-install { display: flex; flex-direction: column; gap: 4px; }
.plat-install .k { font-size: 11px; color: var(--muted); }
.plat-install code, .code {
  background: rgba(6,11,25,0.7); border: 1px solid var(--glass-brd);
  border-radius: 8px; padding: 8px 10px; font-size: 12px; color: var(--accent);
  white-space: pre-wrap; word-break: break-all; margin: 0;
}
.plat-install code { cursor: pointer; }
.plat-install code:hover { border-color: var(--accent); }
.copy-btn {
  align-self: flex-start; margin-top: 2px; padding: 4px 12px; font-size: 12px;
  background: rgba(79,209,255,0.12); color: var(--accent);
  border: 1px solid rgba(79,209,255,0.3);
}
.copy-btn:hover { background: rgba(79,209,255,0.2); }
.code-row { display: flex; gap: 8px; align-items: stretch; }
.code-row .code { flex: 1; }
.code-row .copy-btn { align-self: flex-start; }
.plat-home { display: inline-block; margin-top: 10px; font-size: 12px; color: var(--accent); text-decoration: none; }
.plat-home:hover { text-decoration: underline; }

.modal-head { display: flex; align-items: center; justify-content: space-between; }
.modal-head .x { background: transparent; color: var(--muted); font-size: 18px; padding: 4px 10px; }
.modal-head .x:hover { color: var(--text); }
.home-link { color: var(--accent); font-size: 13px; text-decoration: none; word-break: break-all; }
.home-link:hover { text-decoration: underline; }
.detail {
  background: rgba(6,11,25,0.7); border: 1px solid var(--glass-brd);
  border-radius: 10px; padding: 12px; font-size: 12.5px; line-height: 1.7;
  color: var(--text); white-space: pre-wrap; word-break: break-all; margin: 0;
}
.hint { color: var(--muted); font-size: 12.5px; margin: 0 0 4px; }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
