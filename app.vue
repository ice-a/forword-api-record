<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  fetchStations, verifyPassword, createStation, updateStation,
  deleteStation, refreshModels, probeModels, healthCheck, setStatus, exportData, importData
} from '~/composables/useApi'

// ============ 数据 ============
const stations = ref([])
const loading = ref(false)
const toast = ref('')
const isAdmin = ref(!!sessionStorage.getItem('admin_pwd'))
const tab = ref('stations') // stations | platforms

// ===== 主题配色 =====
const THEME_KEY = 'relay_theme_accent'
const presets = [
  { name: '科技蓝', accent: '#4fd1ff', accent2: '#7c5cff' },
  { name: '晚霞橙', accent: '#ff9a4d', accent2: '#ff5b7a' },
  { name: '薄荷绿', accent: '#36e0a4', accent2: '#4fd1ff' },
  { name: '樱花粉', accent: '#ff7eb6', accent2: '#a855f7' },
  { name: '暗夜紫', accent: '#a855f7', accent2: '#6366f1' },
  { name: '落日金', accent: '#ffd24d', accent2: '#ff7a45' }
]
const themeOpen = ref(false)
const bgOpen = ref(false)
const customColor = ref('#4fd1ff')

function applyAccent(accent, accent2) {
  const root = document.documentElement
  root.style.setProperty('--accent', accent)
  root.style.setProperty('--accent-2', accent2)
  root.style.setProperty('--glow', `0 0 24px ${hexA(accent, 0.25)}`)
  root.style.setProperty('--glass-brd', `${hexA(accent, 0.22)}`)
}
function hexA(hex, a) {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}
function pickPreset(p) {
  customColor.value = p.accent
  applyAccent(p.accent, p.accent2)
  localStorage.setItem(THEME_KEY, JSON.stringify({ accent: p.accent, accent2: p.accent2 }))
  showToast('主题已切换')
}
function applyCustom() {
  const c = customColor.value
  const accent2 = shiftHue(c, 40)
  applyAccent(c, accent2)
  localStorage.setItem(THEME_KEY, JSON.stringify({ accent: c, accent2 }))
  showToast('主题已应用')
}
function shiftHue(hex, deg) {
  const h = hex.replace('#', '')
  let r = parseInt(h.substring(0, 2), 16) / 255
  let g = parseInt(h.substring(2, 4), 16) / 255
  let b = parseInt(h.substring(4, 6), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let hue, sat, lig = (max + min) / 2
  const d = max - min
  if (d === 0) { hue = sat = 0 }
  else {
    sat = lig > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: hue = (g - b) / d + (g < b ? 6 : 0); break
      case g: hue = (b - r) / d + 2; break
      default: hue = (r - g) / d + 4
    }
    hue *= 60
  }
  hue = (hue + deg) % 360
  const c2 = (x) => {
    const k = (n) => (n + hue / 30) % 12
    const a = sat * Math.min(lig, 1 - lig)
    const f = (n) => lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
    return Math.round(255 * f(x))
  }
  const to2 = (v) => v.toString(16).padStart(2, '0')
  return '#' + to2(c2(0)) + to2(c2(8)) + to2(c2(4))
}
function resetTheme() {
  localStorage.removeItem(THEME_KEY)
  customColor.value = '#4fd1ff'
  applyAccent('#4fd1ff', '#7c5cff')
  showToast('已恢复默认主题')
}

// ===== 背景图（图片 API）=====
const BG_KEY = 'relay_bg_url'
const bgApis = [
  { name: 'Picsum 随机', url: () => 'https://picsum.photos/1920/1080?random=' + Date.now(), random: true },
  { name: 'Picsum 风景', url: () => 'https://picsum.photos/seed/scene' + Math.floor(Math.random()*999) + '/1920/1080', random: true },
  { name: '动漫风', url: () => 'https://pic.re/', random: false }
]
const bgUrl = ref('')
const customBg = ref('')

function applyBg(url) {
  document.body.style.backgroundImage = url
    ? `linear-gradient(rgba(4,7,16,0.55), rgba(4,7,16,0.75)), url("${url}")`
    : ''
  document.body.style.backgroundSize = 'cover'
  document.body.style.backgroundPosition = 'center'
  document.body.style.backgroundAttachment = 'fixed'
}
function pickBgApi(api) {
  const url = api.random ? api.url() : api.url
  bgUrl.value = url
  applyBg(url)
  localStorage.setItem(BG_KEY, url)
  showToast('背景已更新')
}
function applyCustomBg() {
  const u = customBg.value.trim()
  if (!u) return
  bgUrl.value = u
  applyBg(u)
  localStorage.setItem(BG_KEY, u)
  showToast('背景已应用')
}
function clearBg() {
  localStorage.removeItem(BG_KEY)
  bgUrl.value = ''
  customBg.value = ''
  applyBg('')
  showToast('已恢复纯色背景')
}

// ===== 通用 =====
let toastTimer
function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 1800)
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); showToast('已复制') }
  catch { showToast('复制失败') }
}

// ===== 登录 =====
const showLogin = ref(false)
const pwd = ref('')
const loginErr = ref('')
async function login() {
  try { await verifyPassword(pwd.value); isAdmin.value = true; sessionStorage.setItem('admin_pwd', pwd.value); showLogin.value = false; loginErr.value = ''; load() }
  catch (e) { loginErr.value = e?.data?.message || e.message || '密码错误' }
}
function logout() { isAdmin.value = false; sessionStorage.removeItem('admin_pwd'); showLogin.value = false; load() }

// ===== 加载 + 自动测活 =====
async function load() {
  loading.value = true
  try {
    stations.value = await fetchStations()
    pingAll()
  } catch (e) {
    showToast('加载失败：' + (e?.data?.message || e.message))
  } finally {
    loading.value = false
  }
}

const healthMap = ref({})
const importFile = ref(null)

// 加载后逐一测活：探测「直达地址」（未填则回退 Base URL）是否连通；不通 -> 停用，恢复 -> 启用
async function pingAll() {
  const list = stations.value
  await Promise.all(list.map(async (s) => {
    healthMap.value[s._id] = 'checking'
    let ok = false
    try {
      const r = await healthCheck(s._id)
      ok = !!r.ok
    } catch {
      ok = false
    }
    healthMap.value[s._id] = ok ? 'ok' : 'bad'
    if (ok && s.status === 'inactive') {
      try {
        await setStatus(s._id, 'active')
        const idx = stations.value.findIndex((x) => x._id === s._id)
        if (idx >= 0) stations.value[idx].status = 'active'
      } catch {}
    } else if (!ok && s.status === 'active') {
      try {
        await setStatus(s._id, 'inactive')
        const idx = stations.value.findIndex((x) => x._id === s._id)
        if (idx >= 0) stations.value[idx].status = 'inactive'
      } catch {}
    }
  }))
}
async function pingOne(id) {
  healthMap.value[id] = 'checking'
  let ok = false
  try { const r = await healthCheck(id); ok = !!r.ok } catch { ok = false }
  healthMap.value[id] = ok ? 'ok' : 'bad'
  const st = stations.value.find((x) => x._id === id)
  const want = ok ? 'active' : 'inactive'
  if (st && st.status !== want) {
    try { await setStatus(id, want); st.status = want } catch {}
  }
  showToast(ok ? '连接正常' : '连接失败，已标记不可用')
}
async function pingAllManual() {
  showToast('开始测活...')
  await pingAll()
  showToast('测活完成')
}

// ===== 搜索 / 筛选 / 统计 =====
const search = ref('')
const filterStatus = ref('all')
const stats = computed(() => {
  const s = stations.value
  return {
    total: s.length,
    active: s.filter((x) => x.status === 'active').length,
    inactive: s.filter((x) => x.status === 'inactive').length,
    models: s.reduce((a, x) => a + (x.models?.length || 0), 0)
  }
})
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return stations.value.filter((s) => {
    if (filterStatus.value !== 'all' && s.status !== filterStatus.value) return false
    if (!q) return true
    return (
      s.name?.toLowerCase().includes(q) ||
      s.baseURL?.toLowerCase().includes(q) ||
      s.siteURL?.toLowerCase().includes(q) ||
      (s.models || []).some((m) => m.toLowerCase().includes(q)) ||
      s.desc?.toLowerCase().includes(q) ||
      s.remark?.toLowerCase().includes(q)
    )
  })
})

// ===== 增删改 =====
const showForm = ref(false)
const editingId = ref(null)
const form = ref({ name: '', baseURL: '', siteURL: '', apiKey: '', keyId: '', modelsText: '', balance: '', status: 'active', sort: 0, desc: '', remark: '' })

// 表单内点击获取模型列表
const probing = ref(false)
async function doProbeModels() {
  if (!form.value.baseURL.trim()) return showToast('请先填写 Base URL')
  probing.value = true
  try {
    const { models } = await probeModels({
      baseURL: form.value.baseURL,
      apiKey: form.value.apiKey,
      id: editingId.value || undefined
    })
    form.value.modelsText = models.join('\n')
    showToast(`已获取 ${models.length} 个模型`)
  } catch (e) {
    showToast('获取失败：' + (e?.data?.message || e.message))
  } finally {
    probing.value = false
  }
}

// 直达地址：后台未填写则回退使用 baseURL
function siteLink(s) {
  const u = (s?.siteURL || '').trim() || (s?.baseURL || '').trim()
  if (!u) return ''
  return /^https?:\/\//i.test(u) ? u : `https://${u}`
}

function openCreate() {
  editingId.value = null
  form.value = { name: '', baseURL: '', siteURL: '', apiKey: '', keyId: '', modelsText: '', balance: '', status: 'active', sort: 0, desc: '', remark: '' }
  showForm.value = true
}
function openEdit(s) {
  editingId.value = s._id
  form.value = {
    name: s.name, baseURL: s.baseURL, siteURL: s.siteURL || '', apiKey: '', keyId: s.keyId,
    modelsText: (s.models || []).join('\n'), balance: s.balance || '',
    status: s.status, sort: s.sort ?? 0, desc: s.desc || '', remark: s.remark || ''
  }
  showForm.value = true
}
async function save() {
  const payload = {
    name: form.value.name, baseURL: form.value.baseURL, siteURL: form.value.siteURL,
    apiKey: form.value.apiKey,
    keyId: form.value.keyId || undefined, status: form.value.status,
    sort: Number(form.value.sort) || 0, desc: form.value.desc, remark: form.value.remark,
    balance: form.value.balance,
    models: form.value.modelsText.split('\n').map((x) => x.trim()).filter(Boolean)
  }
  if (editingId.value) {
    await updateStation(editingId.value, payload)
  } else {
    await createStation(payload)
  }
  showForm.value = false
  load()
}
async function remove(s) {
  if (!confirm(`确认删除「${s.name}」？`)) return
  await deleteStation(s._id)
  load()
}
async function doRefresh(s) {
  try {
    await refreshModels(s._id)
    showToast('模型已刷新')
    load()
  } catch (e) { showToast('刷新失败：' + (e?.data?.message || e.message)) }
}

// ===== 详情弹框 =====
const detail = ref(null)
function openDetail(s) { detail.value = s }

// ===== 导入导出 =====
async function exportDataFile() {
  try {
    const list = await exportData()
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'relay-stations.json'
    a.click()
    URL.revokeObjectURL(a.href)
  } catch (e) { showToast('导出失败：' + (e?.data?.message || e.message)) }
}
async function importDataFile(e) {
  const file = e.target.files[0]
  if (!file) return
  try {
    const text = await file.text()
    const list = JSON.parse(text)
    await importData(list)
    showToast('导入成功')
    load()
  } catch (err) { showToast('导入失败：格式错误') }
  finally { e.target.value = '' }
}

onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(THEME_KEY) || 'null')
    if (saved?.accent) { customColor.value = saved.accent; applyAccent(saved.accent, saved.accent2) }
  } catch {}
  try {
    const savedBg = localStorage.getItem(BG_KEY)
    if (savedBg) { bgUrl.value = savedBg; applyBg(savedBg) }
  } catch {}
  load()
})
</script>

<template>
  <div class="login-box" v-if="!isAdmin && showLogin">
    <h2>后台登录</h2>
    <p>请输入管理密码以进入后台</p>
    <input v-model="pwd" type="password" placeholder="管理密码" @keyup.enter="login" />
    <button class="btn-primary" style="width:100%;margin-top:16px" @click="login">登录</button>
    <div class="err" v-if="loginErr">{{ loginErr }}</div>
    <button class="btn-ghost" style="width:100%;margin-top:10px" @click="showLogin = false">取消</button>
  </div>

  <div class="container" v-else>
    <header class="topbar">
      <div class="brand">
        <div class="logo"></div>
        <div>
          <h1>中转站管理</h1>
          <div class="sub">Relay Station Manager · OpenAI 兼容</div>
        </div>
      </div>

      <div style="display:flex; gap:10px; align-items:center;">
        <button class="btn-ghost theme-btn" @click="themeOpen = !themeOpen" title="切换主题配色">
          <span class="theme-dot" :style="{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }"></span>
          主题
        </button>
        <button class="btn-ghost" @click="bgOpen = !bgOpen" title="切换背景图">
          <span class="theme-dot" style="background:linear-gradient(135deg,#888,#333)"></span>
          背景
        </button>
        <template v-if="isAdmin">
          <button class="btn-ghost" @click="exportDataFile" title="导出为 JSON">导出</button>
          <button class="btn-ghost" @click="importFile.click()" title="从 JSON 导入">导入</button>
          <input ref="importFile" type="file" accept="application/json" style="display:none" @change="importDataFile" />
          <button class="btn-primary" @click="openCreate" v-if="tab === 'stations'">+ 新增中转站</button>
          <button class="btn-ghost" @click="logout">退出后台</button>
        </template>
        <button v-else class="btn-ghost" @click="showLogin = true">后台登录</button>
        <button class="btn-ghost" @click="pingAllManual" title="重新测活所有中转站">⟳ 测活</button>
      </div>
    </header>

    <nav class="tabs">
      <button :class="['tab', tab === 'stations' && 'on']" @click="tab = 'stations'">中转站</button>
      <button :class="['tab', tab === 'platforms' && 'on']" @click="tab = 'platforms'">工具配置</button>
    </nav>

    <!-- 中转站 -->
    <div v-if="tab === 'stations'">
      <div class="stats-bar" v-if="stations.length">
        <div class="stat"><span class="num">{{ stats.total }}</span><span class="lab">总数</span></div>
        <div class="stat"><span class="num ok">{{ stats.active }}</span><span class="lab">可用</span></div>
        <div class="stat"><span class="num muted">{{ stats.inactive }}</span><span class="lab">停用</span></div>
        <div class="stat"><span class="num">{{ stats.models }}</span><span class="lab">模型数</span></div>
      </div>

      <div class="toolbar">
        <input class="search" v-model="search" placeholder="🔍 搜索名称 / 地址 / 模型 / 描述 / 备注" />
        <select v-model="filterStatus" class="filter">
          <option value="all">全部状态</option>
          <option value="active">仅可用</option>
          <option value="inactive">仅停用</option>
        </select>
      </div>

      <div v-if="loading" class="empty"><span class="spin"></span> 加载中…</div>
      <div v-else-if="!filtered.length" class="empty">暂无中转站，点击右上角「新增中转站」</div>

      <transition-group name="card" tag="div" class="grid">
        <div class="card" v-for="s in filtered" :key="s._id" @click="openDetail(s)">
          <div class="card-head">
            <span class="name">{{ s.name }}</span>
            <span :class="['badge', s.status]">
              <span class="dot" :class="healthMap[s._id]"></span>
              {{ s.status === 'active' ? '可用' : '停用' }}
            </span>
          </div>
          <div class="field"><span class="k">地址</span>
            <span class="v mono" :title="s.baseURL" @click.stop="copyText(s.baseURL)">{{ s.baseURL }}</span>
          </div>
          <div class="field"><span class="k">标识</span>
            <span class="keyid-chip" :title="s.keyId">{{ s.keyId }}</span>
          </div>
          <p class="card-desc" v-if="s.desc" :title="s.desc">{{ s.desc }}</p>
          <div class="field" v-if="s.balance"><span class="k">余额</span><span class="v">{{ s.balance }}</span></div>
          <div class="models">
            <span class="model-tag" v-for="(m, i) in (s.models || []).slice(0, 5)" :key="m"
                  :title="(s.models || []).join(', ')">{{ m }}</span>
            <span class="model-tag more" v-if="(s.models || []).length > 5" :title="(s.models || []).join(', ')">+{{ (s.models || []).length - 5 }}</span>
          </div>
          <div class="card-actions" v-if="isAdmin" @click.stop>
            <a class="btn-ghost" :href="siteLink(s)" target="_blank" rel="noopener noreferrer">直达 ↗</a>
            <button class="btn-ghost" @click="openEdit(s)">编辑</button>
            <button class="btn-ghost" @click="doRefresh(s)">刷新模型</button>
            <button class="btn-ghost" @click="pingOne(s._id)" :disabled="healthMap[s._id] === 'checking'">测活</button>
            <button class="btn-danger" @click="remove(s)">删除</button>
          </div>
          <div class="card-actions" v-else @click.stop>
            <a class="btn-ghost" :href="siteLink(s)" target="_blank" rel="noopener noreferrer">直达 ↗</a>
            <button class="btn-ghost" @click="pingOne(s._id)" :disabled="healthMap[s._id] === 'checking'">测活</button>
            <button class="btn-ghost" @click="openDetail(s)">查看详情</button>
          </div>
        </div>
      </transition-group>
    </div>

    <!-- 工具配置 -->
    <Platforms v-else-if="tab === 'platforms'" />

    <!-- 新增/编辑弹框 -->
    <div class="modal-mask" v-if="showForm" @click.self="showForm = false">
      <div class="modal">
        <h2>{{ editingId ? '编辑中转站' : '新增中转站' }}</h2>
        <p class="hint">保存后会自动拉取可用模型列表（失败回退默认）</p>
        <label>名称</label>
        <input v-model="form.name" placeholder="如：我的中转站A" />
        <label>Base URL</label>
        <input v-model="form.baseURL" placeholder="https://xxx/v1" />
        <label>直达地址（留空则默认使用 Base URL）</label>
        <input v-model="form.siteURL" placeholder="https://xxx.com" />
        <label>API Key</label>
        <input v-model="form.apiKey" placeholder="sk-..." :type="form.apiKey ? 'text' : 'password'" />
        <label>标识 (Key ID，留空自动生成 UUID)</label>
        <input v-model="form.keyId" placeholder="留空自动生成" />
        <div class="label-row">
          <label>模型列表（每行一个）</label>
          <button class="btn-mini" @click="doProbeModels" :disabled="probing">
            {{ probing ? '获取中…' : '获取模型列表' }}
          </button>
        </div>
        <textarea v-model="form.modelsText" rows="3" placeholder="gpt-4&#10;gpt-3.5-turbo"></textarea>
        <label>余额</label>
        <input v-model="form.balance" placeholder="可选" />
        <label>排序（数值越小越靠前）</label>
        <input v-model.number="form.sort" type="number" placeholder="0" />
        <label>状态</label>
        <select v-model="form.status">
          <option value="active">可用</option>
          <option value="inactive">停用</option>
        </select>
        <label>描述</label>
        <textarea v-model="form.desc" rows="2" placeholder="展示在卡片上的简介，可选"></textarea>
        <label>备注</label>
        <textarea v-model="form.remark" rows="2" placeholder="可选"></textarea>
        <div class="modal-actions">
          <button class="btn-ghost" @click="showForm = false">取消</button>
          <button class="btn-primary" @click="save">保存</button>
        </div>
      </div>
    </div>

    <!-- 详情弹框 -->
    <div class="modal-mask" v-if="detail" @click.self="detail = null">
      <div class="modal">
        <div class="modal-head">
          <h2>{{ detail.name }}</h2>
          <button class="x" @click="detail = null">✕</button>
        </div>
        <p class="hint"><span :class="['badge', detail.status]">{{ detail.status === 'active' ? '可用' : '停用' }}</span></p>
        <template v-if="detail.desc">
          <label>描述</label>
          <p class="hint">{{ detail.desc }}</p>
        </template>
        <label>接口地址</label>
        <div class="field"><span class="v mono" @click="copyText(detail.baseURL)" style="cursor:pointer">{{ detail.baseURL }}</span></div>
        <label>直达地址{{ detail.siteURL ? '' : '（未填写，默认用接口地址）' }}</label>
        <div class="field">
          <a class="v mono" :href="siteLink(detail)" target="_blank" rel="noopener noreferrer">{{ siteLink(detail) }}</a>
        </div>
        <label>标识 (Key ID)</label>
        <div class="keyid-chip">{{ detail.keyId }}</div>
        <label>余额</label>
        <div class="field"><span class="v">{{ detail.balance || '—' }}</span></div>
        <label>可用模型</label>
        <div class="models">
          <span class="model-tag" v-for="m in (detail.models || [])" :key="m" :title="m">{{ m }}</span>
          <span v-if="!(detail.models || []).length" class="muted">无</span>
        </div>
        <label>备注</label>
        <p class="hint">{{ detail.remark || '—' }}</p>
        <div class="modal-actions">
          <button class="btn-ghost" @click="detail = null">关闭</button>
        </div>
      </div>
    </div>

    <!-- 主题配色面板 -->
    <transition name="theme-fade">
      <div class="theme-panel" v-if="themeOpen" @click.self="themeOpen = false">
        <div class="theme-pop">
          <div class="theme-pop-head">
            <span>主题配色</span>
            <button class="x" @click="themeOpen = false">✕</button>
          </div>
          <label>预设配色</label>
          <div class="swatches">
            <button v-for="p in presets" :key="p.name" class="swatch"
                    :title="p.name" @click="pickPreset(p)"
                    :style="{ background: `linear-gradient(135deg, ${p.accent}, ${p.accent2})` }">
              <span class="swatch-name">{{ p.name }}</span>
            </button>
          </div>
          <label>自定义主色</label>
          <div class="custom-row">
            <input type="color" v-model="customColor" class="color-input" @input="applyCustom" />
            <input class="color-hex" :value="customColor" @change="customColor = $event.target.value; applyCustom()" />
            <button class="btn-ghost" @click="applyCustom">应用</button>
          </div>
          <button class="btn-ghost reset-theme" @click="resetTheme">恢复默认</button>
        </div>
      </div>
    </transition>

    <!-- 背景图面板 -->
    <transition name="theme-fade">
      <div class="theme-panel" v-if="bgOpen" @click.self="bgOpen = false">
        <div class="theme-pop">
          <div class="theme-pop-head">
            <span>背景图（图片 API）</span>
            <button class="x" @click="bgOpen = false">✕</button>
          </div>
          <p class="hint" style="margin:0 0 8px;">选择一个图片 API，点击随机获取一张作为背景。</p>
          <div class="bg-list">
            <button v-for="api in bgApis" :key="api.name" class="bg-item" @click="pickBgApi(api)">
              <span>{{ api.name }}</span>
              <span class="bg-go">换一张 ›</span>
            </button>
          </div>
          <label>自定义图片地址</label>
          <div class="custom-row">
            <input class="color-hex" v-model="customBg" placeholder="https://.../image.jpg" />
            <button class="btn-ghost" @click="applyCustomBg">应用</button>
          </div>
          <div class="bg-preview" v-if="bgUrl">
            <img :src="bgUrl" alt="背景预览" @error="bgUrl = ''" />
            <button class="btn-ghost reset-theme" @click="clearBg">清除背景</button>
          </div>
        </div>
      </div>
    </transition>

    <div class="toast" v-if="toast">{{ toast }}</div>
  </div>
</template>

<style scoped>
.tabs { display: flex; gap: 8px; margin-bottom: 20px; }
.tab {
  background: transparent; color: var(--muted);
  border: 1px solid var(--glass-brd); padding: 8px 18px; font-size: 14px;
}
.tab.on { color: #04111f; background: linear-gradient(135deg, var(--accent), var(--accent-2)); border-color: transparent; box-shadow: var(--glow); }

.stats-bar { display: flex; gap: 14px; margin-bottom: 18px; flex-wrap: wrap; }
.stat { background: var(--glass); border: 1px solid var(--glass-brd); border-radius: 12px; padding: 10px 18px; display: flex; flex-direction: column; min-width: 76px; }
.stat .num { font-size: 22px; font-weight: 700; }
.stat .num.ok { color: var(--ok); }
.stat .num.muted { color: var(--muted); }
.stat .lab { font-size: 12px; color: var(--muted); }

.toolbar { display: flex; gap: 10px; margin-bottom: 18px; flex-wrap: wrap; }
.search { flex: 1; min-width: 220px; }
.filter { width: 140px; flex: 0 0 auto; }

.models { display: flex; flex-wrap: wrap; margin-top: 12px; }
.model-tag.more { background: rgba(126,139,181,0.12); border-color: rgba(126,139,181,0.3); color: var(--muted); }

.dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 5px; background: var(--muted); vertical-align: 1px; }
.dot.ok { background: var(--ok); box-shadow: 0 0 8px var(--ok); }
.dot.bad { background: var(--danger); box-shadow: 0 0 8px var(--danger); }
.dot.checking { background: var(--accent); animation: pulse 1s infinite; }

.card { cursor: pointer; }
.card .card-actions .btn-ghost, .card .card-actions .btn-danger, .card .card-actions .btn-primary { cursor: pointer; }

.card-enter-active, .card-leave-active { transition: all .35s ease; }
.card-enter-from { opacity: 0; transform: translateY(14px) scale(.98); }
.card-leave-to { opacity: 0; transform: scale(.95); }
.card-move { transition: transform .35s ease; }

@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .3; } }

.muted { color: var(--muted); }
</style>
