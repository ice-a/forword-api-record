<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchTools, createTool, updateTool, deleteTool, generateTool, checkAiAvailable } from '~/composables/useApi'

const isAdmin = ref(!!sessionStorage.getItem('admin_pwd'))
const tools = ref([])
const loading = ref(false)
const toast = ref('')
let toastTimer
function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 1800)
}

async function load() {
  loading.value = true
  try {
    tools.value = await fetchTools()
  } catch (e) {
    showToast('加载失败：' + (e?.data?.message || e.message))
  } finally {
    loading.value = false
  }
}

// ===== 搜索 =====
const search = ref('')
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return tools.value
  return tools.value.filter((t) => {
    return (
      t.name?.toLowerCase().includes(q) ||
      t.desc?.toLowerCase().includes(q) ||
      (t.tags || []).some((tag) => tag.toLowerCase().includes(q))
    )
  })
})
const activeCount = computed(() => tools.value.filter((t) => t.status !== 'inactive').length)
const inactiveCount = computed(() => tools.value.filter((t) => t.status === 'inactive').length)

// ===== 复制 =====
async function copy(text) {
  try {
    await navigator.clipboard.writeText(text)
    showToast('已复制')
  } catch {
    showToast('复制失败，请手动复制')
  }
}

// ===== 详情 =====
const active = ref(null)
function open(t) { active.value = t }
function close() { active.value = null }

// ===== 增删改 =====
const showForm = ref(false)
const editingId = ref(null)
const form = ref({ name: '', desc: '', tagsText: '', install: '', home: '', detailText: '', sort: 0, status: 'active', remark: '' })

function openCreate() {
  editingId.value = null
  form.value = { name: '', desc: '', tagsText: '', install: '', home: '', detailText: '', sort: 0, status: 'active', remark: '' }
  showForm.value = true
  checkAi()
}
function openEdit(t) {
  editingId.value = t._id
  form.value = {
    name: t.name, desc: t.desc || '', tagsText: (t.tags || []).join(', '),
    install: t.install || '', home: t.home || '',
    detailText: (t.detail || []).join('\n'), sort: t.sort ?? 0,
    status: t.status || 'active', remark: t.remark || ''
  }
  showForm.value = true
  checkAi()
}
async function save() {
  const payload = {
    name: form.value.name,
    desc: form.value.desc,
    tags: form.value.tagsText.split(',').map((x) => x.trim()).filter(Boolean),
    install: form.value.install,
    home: form.value.home,
    detail: form.value.detailText.split('\n').map((x) => x.trim()).filter(Boolean),
    sort: Number(form.value.sort) || 0,
    status: form.value.status,
    remark: form.value.remark
  }
  if (editingId.value) await updateTool(editingId.value, payload)
  else await createTool(payload)
  showForm.value = false
  load()
}
async function remove(t) {
  if (!confirm(`确认删除「${t.name}」？`)) return
  await deleteTool(t._id)
  load()
}

// ===== AI 生成内容 =====
const genLoading = ref(false)
const aiAvailable = ref(false)
function checkAi() {
  aiAvailable.value = false
  checkAiAvailable().then(() => { aiAvailable.value = true }).catch(() => { aiAvailable.value = false })
}
async function doGenerate() {
  if (!form.value.name.trim()) return showToast('请先填写工具名称')
  genLoading.value = true
  try {
    const r = await generateTool({ name: form.value.name, home: form.value.home })
    const filled = []
    if (r.desc) { form.value.desc = r.desc; filled.push('描述') }
    if (r.tags?.length) { form.value.tagsText = r.tags.join(', '); filled.push('标签') }
    if (r.detail?.length) { form.value.detailText = r.detail.join('\n'); filled.push('详细步骤') }
    if (!filled.length) return showToast('AI 未返回有效内容，请重试或手动填写')
    showToast('已填入：' + filled.join(' / ') + '（生成内容可修改后保存）')
  } catch (e) {
    showToast('生成失败：' + (e?.data?.message || e.message))
  } finally {
    genLoading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <h2 style="font-size:19px;margin:0 0 6px;">工具配置</h2>
    <p class="ph">以下为各 AI 编码工具的安装方式与官网地址，点击卡片查看详细配置步骤。</p>

    <div class="toolbar" v-if="isAdmin">
      <input class="search" v-model="search" placeholder="🔍 搜索工具名称 / 描述 / 标签" />
      <button class="btn-primary" @click="openCreate">+ 新增工具</button>
    </div>
    <div class="toolbar" v-else>
      <input class="search" v-model="search" placeholder="🔍 搜索工具名称 / 描述 / 标签" />
    </div>

    <div class="stat-bar">
      <span class="stat-item">总数 <b>{{ tools.length }}</b></span>
      <span class="stat-item ok">可用 <b>{{ activeCount }}</b></span>
      <span class="stat-item off">停用 <b>{{ inactiveCount }}</b></span>
    </div>

    <div v-if="loading" class="empty"><span class="spin"></span> 加载中…</div>
    <div v-else-if="!filtered.length" class="empty">暂无工具，{{ isAdmin ? '点击右上角「新增工具」' : '敬请期待' }}</div>

    <div class="plat-grid">
      <div class="plat-card" v-for="t in filtered" :key="t._id" @click="open(t)" tabindex="0"
           @keyup.enter="open(t)">
        <div class="plat-head">
          <span class="plat-name">{{ t.name }}</span>
          <span class="arrow">›</span>
        </div>
        <div class="plat-desc">{{ t.desc }}</div>
        <div class="plat-tags">
          <span class="tag" v-for="tag in (t.tags || [])" :key="tag">{{ tag }}</span>
        </div>
        <div class="plat-install" v-if="t.install">
          <span class="k">安装</span>
          <code @click.stop="copy(t.install)" :title="'点击复制：' + t.install">{{ t.install }}</code>
          <button class="copy-btn" @click.stop="copy(t.install)">复制</button>
        </div>
        <a class="plat-home" :href="t.home" target="_blank" @click.stop v-if="t.home">官网 ↗</a>
        <div class="card-actions" v-if="isAdmin" @click.stop>
          <button class="btn-ghost" @click="openEdit(t)">编辑</button>
          <button class="btn-danger" @click="remove(t)">删除</button>
        </div>
        <div class="card-tip" v-if="t.desc || (t.tags && t.tags.length) || t.detail">
          <div class="tip-row" v-if="t.desc"><b>描述：</b>{{ t.desc }}</div>
          <div class="tip-row" v-if="t.tags && t.tags.length"><b>标签：</b>{{ t.tags.join('、') }}</div>
          <div class="tip-row" v-if="t.detail"><b>详细步骤：</b>{{ t.detail }}</div>
        </div>
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
        <a class="home-link" :href="active.home" target="_blank" v-if="active.home">{{ active.home }} ↗</a>
        <span class="muted" v-else>—</span>

        <label>详细配置步骤</label>
        <pre class="detail">{{ (active.detail || []).join('\n') }}</pre>
      </div>
    </div>

    <div class="modal-mask" v-if="showForm" @click.self="showForm = false">
      <div class="modal">
        <h2>{{ editingId ? '编辑工具' : '新增工具' }}</h2>
        <label>名称</label>
        <input v-model="form.name" placeholder="如：Claude Code" />
        <label class="label-row">描述
          <button class="btn-mini" @click="doGenerate" :disabled="genLoading || !aiAvailable"
            :title="aiAvailable ? '调用已配置 AI 生成内容' : '请先在「全局AI」配置可用 AI'">
            {{ genLoading ? '生成中…' : 'AI 生成内容' }}
          </button>
        </label>
        <p v-if="!aiAvailable" class="ai-hint">⚠ 请先在右上角「全局AI」配置一个可用且已填写 API Key 的 AI，才能使用 AI 生成内容。</p>
        <textarea v-model="form.desc" rows="2" placeholder="一句话简介" />
        <label>标签（逗号分隔）</label>
        <input v-model="form.tagsText" placeholder="CLI, 终端" />
        <label>安装命令</label>
        <input v-model="form.install" placeholder="npm install -g xxx" />
        <label>官网地址</label>
        <input v-model="form.home" placeholder="https://..." />
        <label>详细配置步骤（每行一条）</label>
        <textarea v-model="form.detailText" rows="4" placeholder="安装：xxx&#10;配置：xxx" />
        <label>排序（数值越小越靠前）</label>
        <input v-model.number="form.sort" type="number" placeholder="0" />
        <label>状态</label>
        <select v-model="form.status">
          <option value="active">可用</option>
          <option value="inactive">停用</option>
        </select>
        <label>备注</label>
        <textarea v-model="form.remark" rows="2" placeholder="可选" />
        <div class="modal-actions">
          <button class="btn-ghost" @click="showForm = false">取消</button>
          <button class="btn-primary" @click="save">保存</button>
        </div>
      </div>
    </div>

    <div class="toast" v-if="toast">{{ toast }}</div>
  </div>
</template>

<style scoped>
.ph { color: var(--muted); font-size: 13px; }
.toolbar { display: flex; gap: 10px; margin: 14px 0 18px; flex-wrap: wrap; }
.search { flex: 1; min-width: 220px; }
.plat-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}
.plat-card {
  background: var(--glass); border: 1px solid var(--glass-brd);
  border-radius: 14px; padding: 16px; backdrop-filter: blur(12px);
  cursor: pointer; transition: all .2s ease; outline: none; position: relative;
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
.card-actions { display: flex; gap: 8px; margin-top: 12px; }

.card-tip {
  position: absolute; left: 8px; right: 8px; bottom: calc(100% + 8px);
  background: #0f1620; border: 1px solid rgba(79,209,255,0.35);
  border-radius: 10px; padding: 10px 12px; z-index: 20;
  font-size: 12px; line-height: 1.6; color: var(--text);
  box-shadow: 0 10px 30px rgba(0,0,0,0.45);
  opacity: 0; transform: translateY(6px); pointer-events: none;
  transition: opacity .18s ease, transform .18s ease;
  white-space: pre-wrap; text-align: left;
}
.card-tip .tip-row b { color: var(--accent); font-weight: 600; }
.plat-card:hover .card-tip { opacity: 1; transform: translateY(0); }
.plat-card:hover { z-index: 10; }
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

.empty { color: var(--muted); text-align: center; padding: 40px 0; }
.stat-bar { display: flex; gap: 18px; margin: 4px 0 16px; font-size: 13px; color: var(--muted); }
.stat-bar .stat-item b { color: var(--text); font-size: 15px; margin-left: 4px; }
.stat-bar .stat-item.ok b { color: #36d399; }
.stat-bar .stat-item.off b { color: #f59e0b; }
.spin { display: inline-block; width: 14px; height: 14px; border: 2px solid var(--muted); border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; margin-right: 6px; vertical-align: -2px; }
@keyframes spin { to { transform: rotate(360deg); } }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
