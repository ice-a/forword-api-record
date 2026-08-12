<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchSkills, createSkill, updateSkill, deleteSkill, generateIntro, checkAiAvailable } from '~/composables/useApi'

const isAdmin = ref(!!sessionStorage.getItem('admin_pwd'))
const skills = ref([])
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
    skills.value = await fetchSkills()
  } catch (e) {
    showToast('加载失败：' + (e?.data?.message || e.message))
  } finally {
    loading.value = false
  }
}

const search = ref('')
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return skills.value
  return skills.value.filter((s) => {
    return (
      s.name?.toLowerCase().includes(q) ||
      s.intro?.toLowerCase().includes(q) ||
      s.desc?.toLowerCase().includes(q)
    )
  })
})
const activeCount = computed(() => skills.value.filter((s) => s.status !== 'inactive').length)
const inactiveCount = computed(() => skills.value.filter((s) => s.status === 'inactive').length)

const active = ref(null)
function open(s) { active.value = s }
function close() { active.value = null }

// ===== 增删改 =====
const showForm = ref(false)
const editingId = ref(null)
const generating = ref(false)
const aiAvailable = ref(false)
const form = ref({ name: '', web: '', intro: '', sort: 0, status: 'active', desc: '', remark: '' })

function openCreate() {
  editingId.value = null
  form.value = { name: '', web: '', intro: '', sort: 0, status: 'active', desc: '', remark: '' }
  showForm.value = true
  checkAi()
}
function openEdit(s) {
  editingId.value = s._id
  form.value = {
    name: s.name, web: s.web || '', intro: s.intro || '',
    sort: s.sort ?? 0, status: s.status || 'active', desc: s.desc || '', remark: s.remark || ''
  }
  showForm.value = true
  checkAi()
}
// 检测是否已配置可用中转站（AI 生成简介前置条件）
async function checkAi() {
  aiAvailable.value = false
  try {
    await checkAiAvailable()
    aiAvailable.value = true
  } catch (e) {
    aiAvailable.value = false
  }
}

// 调用已配置 AI 生成简介与说明
async function doGenerate() {
  if (!form.value.name.trim()) return showToast('请先填写名称')
  generating.value = true
  try {
    const r = await generateIntro({ name: form.value.name, web: form.value.web })
    const filled = []
    if (r.intro) { form.value.intro = r.intro; filled.push('简介') }
    if (r.desc) { form.value.desc = r.desc; filled.push('说明') }
    if (!filled.length) return showToast('AI 未返回有效内容，请重试或手动填写')
    showToast('已填入：' + filled.join(' / ') + '（生成内容可修改后保存）')
  } catch (e) {
    showToast('生成失败：' + (e?.data?.message || e.message))
  } finally {
    generating.value = false
  }
}

async function save() {
  const payload = {
    name: form.value.name, web: form.value.web, intro: form.value.intro,
    sort: Number(form.value.sort) || 0, status: form.value.status,
    desc: form.value.desc, remark: form.value.remark
  }
  if (editingId.value) await updateSkill(editingId.value, payload)
  else await createSkill(payload)
  showForm.value = false
  load()
}
async function remove(s) {
  if (!confirm(`确认删除「${s.name}」？`)) return
  await deleteSkill(s._id)
  load()
}

onMounted(load)
</script>

<template>
  <div>
    <h2 style="font-size:19px;margin:0 0 6px;">Skills 推荐</h2>
    <p class="ph">精选 AI 工具与技能，点击卡片查看简介与官网链接{{ isAdmin ? '；后台可新增并通过 AI 生成简介' : '' }}。</p>

    <div class="toolbar" v-if="isAdmin">
      <input class="search" v-model="search" placeholder="🔍 搜索名称 / 简介" />
      <button class="btn-primary" @click="openCreate">+ 新增 Skill</button>
    </div>
    <div class="toolbar" v-else>
      <input class="search" v-model="search" placeholder="🔍 搜索名称 / 简介" />
    </div>

    <div class="stat-bar">
      <span class="stat-item">总数 <b>{{ skills.length }}</b></span>
      <span class="stat-item ok">可用 <b>{{ activeCount }}</b></span>
      <span class="stat-item off">停用 <b>{{ inactiveCount }}</b></span>
    </div>

    <div v-if="loading" class="empty"><span class="spin"></span> 加载中…</div>
    <div v-else-if="!filtered.length" class="empty">暂无推荐，{{ isAdmin ? '点击右上角「新增 Skill」' : '敬请期待' }}</div>

    <div class="sk-grid">
      <div class="sk-card" v-for="s in filtered" :key="s._id" @click="open(s)" tabindex="0"
           @keyup.enter="open(s)">
        <div class="sk-head">
          <span class="sk-name">{{ s.name }}</span>
          <span class="arrow">›</span>
        </div>
        <div class="sk-intro">{{ s.intro || s.desc }}</div>
        <a class="sk-link" :href="s.web" target="_blank" @click.stop v-if="s.web">官网 ↗</a>
        <div class="card-actions" v-if="isAdmin" @click.stop>
          <button class="btn-ghost" @click="openEdit(s)">编辑</button>
          <button class="btn-danger" @click="remove(s)">删除</button>
        </div>
        <div class="card-tip" v-if="s.desc || s.web">
          <div class="tip-row" v-if="s.desc"><b>说明：</b>{{ s.desc }}</div>
          <div class="tip-row" v-if="s.web"><b>官网：</b>{{ s.web }}</div>
        </div>
      </div>
    </div>

    <div class="modal-mask" v-if="active" @click.self="close">
      <div class="modal">
        <div class="modal-head">
          <h2>{{ active.name }}</h2>
          <button class="x" @click="close">✕</button>
        </div>
        <p class="hint">{{ active.intro || active.desc }}</p>
        <label>官网链接</label>
        <a class="home-link" :href="active.web" target="_blank" v-if="active.web">{{ active.web }} ↗</a>
        <span class="muted" v-else>—</span>
      </div>
    </div>

    <div class="modal-mask" v-if="showForm" @click.self="showForm = false">
      <div class="modal">
        <h2>{{ editingId ? '编辑 Skill' : '新增 Skill' }}</h2>
        <label>名称</label>
        <input v-model="form.name" placeholder="Skill 名称" />
        <label>官网链接 (web)</label>
        <input v-model="form.web" placeholder="https://..." />
        <label class="label-row">简介
          <button class="btn-mini" @click="doGenerate"
            :disabled="generating || !aiAvailable"
            :title="aiAvailable ? '调用已配置 AI 生成简介' : '请先在「中转站」配置可用的 AI 中转站'">
            {{ generating ? '生成中…' : 'AI 生成简介' }}
          </button>
        </label>
        <p v-if="!aiAvailable" class="ai-hint">⚠ 请先在「中转站」中将某个可用且已填写 API Key 的站点「设为全局 AI」（或至少配置一个可用中转站），才能使用 AI 生成简介。</p>
        <textarea v-model="form.intro" rows="3" placeholder="可由 AI 生成，或手动填写" />
        <label>描述</label>
        <textarea v-model="form.desc" rows="2" placeholder="可选" />
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
.sk-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}
.sk-card {
  background: var(--glass); border: 1px solid var(--glass-brd);
  border-radius: 14px; padding: 16px; backdrop-filter: blur(12px);
  cursor: pointer; transition: all .2s ease; outline: none; position: relative;
  animation: fadeUp .4s ease both;
}
.sk-card:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(79,209,255,0.12); border-color: rgba(79,209,255,0.4); }
.sk-head { display: flex; align-items: center; justify-content: space-between; }
.sk-name { font-weight: 700; font-size: 15px; }
.arrow { color: var(--accent); font-size: 22px; transition: transform .2s; }
.sk-card:hover .arrow { transform: translateX(4px); }
.sk-intro { color: var(--muted); font-size: 12.5px; margin: 6px 0 12px; line-height: 1.6; }
.sk-link { display: inline-block; font-size: 12px; color: var(--accent); text-decoration: none; }
.sk-link:hover { text-decoration: underline; }
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
.sk-card:hover .card-tip { opacity: 1; transform: translateY(0); }
.sk-card:hover { z-index: 10; }

.modal-head { display: flex; align-items: center; justify-content: space-between; }
.modal-head .x { background: transparent; color: var(--muted); font-size: 18px; padding: 4px 10px; }
.modal-head .x:hover { color: var(--text); }
.home-link { color: var(--accent); font-size: 13px; text-decoration: none; word-break: break-all; }
.home-link:hover { text-decoration: underline; }
.hint { color: var(--muted); font-size: 12.5px; margin: 0 0 4px; }
.label-row { display: flex; align-items: center; justify-content: space-between; }
.btn-mini {
  padding: 3px 10px; font-size: 12px;
  background: rgba(124,92,255,0.12); color: #b9aaff;
  border: 1px solid rgba(124,92,255,0.3);
}
.btn-mini:hover:not(:disabled) { background: rgba(124,92,255,0.22); }
.btn-mini:disabled { opacity: .6; cursor: default; }
.ai-hint { color: #f59e0b; font-size: 12px; margin: 0 0 8px; line-height: 1.5; }

.empty { color: var(--muted); text-align: center; padding: 40px 0; }
.spin { display: inline-block; width: 14px; height: 14px; border: 2px solid var(--muted); border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; margin-right: 6px; vertical-align: -2px; }
@keyframes spin { to { transform: rotate(360deg); } }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
