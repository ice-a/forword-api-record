<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchVpns, createVpn, updateVpn, deleteVpn } from '~/composables/useApi'

const isAdmin = ref(!!sessionStorage.getItem('admin_pwd'))
const vpns = ref([])
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
    vpns.value = await fetchVpns()
  } catch (e) {
    showToast('加载失败：' + (e?.data?.message || e.message))
  } finally {
    loading.value = false
  }
}

const search = ref('')
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return vpns.value
  return vpns.value.filter((v) => {
    return (
      v.name?.toLowerCase().includes(q) ||
      v.desc?.toLowerCase().includes(q)
    )
  })
})
const activeCount = computed(() => vpns.value.filter((v) => v.status !== 'inactive').length)
const inactiveCount = computed(() => vpns.value.filter((v) => v.status === 'inactive').length)

const active = ref(null)
function open(v) { active.value = v }
function close() { active.value = null }

const showForm = ref(false)
const editingId = ref(null)
const form = ref({ name: '', url: '', desc: '', sort: 0, status: 'active', remark: '' })

function openCreate() {
  editingId.value = null
  form.value = { name: '', url: '', desc: '', sort: 0, status: 'active', remark: '' }
  showForm.value = true
}
function openEdit(v) {
  editingId.value = v._id
  form.value = {
    name: v.name, url: v.url || '', desc: v.desc || '',
    sort: v.sort ?? 0, status: v.status || 'active', remark: v.remark || ''
  }
  showForm.value = true
}
async function save() {
  const payload = {
    name: form.value.name, url: form.value.url, desc: form.value.desc,
    sort: Number(form.value.sort) || 0, status: form.value.status, remark: form.value.remark
  }
  if (editingId.value) await updateVpn(editingId.value, payload)
  else await createVpn(payload)
  showForm.value = false
  load()
}
async function remove(v) {
  if (!confirm(`确认删除「${v.name}」？`)) return
  await deleteVpn(v._id)
  load()
}

onMounted(load)
</script>

<template>
  <div>
    <h2 style="font-size:19px;margin:0 0 6px;">VPN 推荐</h2>
    <p class="ph">精选 VPN / 代理推荐，点击卡片查看介绍与链接{{ isAdmin ? '；后台可新增' : '' }}。</p>

    <div class="toolbar" v-if="isAdmin">
      <input class="search" v-model="search" placeholder="🔍 搜索名称 / 描述" />
      <button class="btn-primary" @click="openCreate">+ 新增推荐</button>
    </div>
    <div class="toolbar" v-else>
      <input class="search" v-model="search" placeholder="🔍 搜索名称 / 描述" />
    </div>

    <div class="stat-bar">
      <span class="stat-item">总数 <b>{{ vpns.length }}</b></span>
      <span class="stat-item ok">可用 <b>{{ activeCount }}</b></span>
      <span class="stat-item off">停用 <b>{{ inactiveCount }}</b></span>
    </div>

    <div v-if="loading" class="empty"><span class="spin"></span> 加载中…</div>
    <div v-else-if="!filtered.length" class="empty">暂无推荐，{{ isAdmin ? '点击右上角「新增推荐」' : '敬请期待' }}</div>

    <div class="vpn-grid">
      <div class="vpn-card" v-for="v in filtered" :key="v._id" @click="open(v)" tabindex="0"
           @keyup.enter="open(v)">
        <div class="vpn-head">
          <span class="vpn-name">{{ v.name }}</span>
          <span class="arrow">›</span>
        </div>
        <div class="vpn-desc">{{ v.desc }}</div>
        <a class="vpn-link" :href="v.url" target="_blank" @click.stop v-if="v.url">访问 ↗</a>
        <div class="card-actions" v-if="isAdmin" @click.stop>
          <button class="btn-ghost" @click="openEdit(v)">编辑</button>
          <button class="btn-danger" @click="remove(v)">删除</button>
        </div>
        <div class="card-tip" v-if="v.desc || v.remark">
          <div class="tip-row" v-if="v.desc"><b>描述：</b>{{ v.desc }}</div>
          <div class="tip-row" v-if="v.remark"><b>备注：</b>{{ v.remark }}</div>
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
        <label>推荐链接</label>
        <a class="home-link" :href="active.url" target="_blank" v-if="active.url">{{ active.url }} ↗</a>
        <span class="muted" v-else>—</span>
      </div>
    </div>

    <div class="modal-mask" v-if="showForm" @click.self="showForm = false">
      <div class="modal">
        <h2>{{ editingId ? '编辑推荐' : '新增推荐' }}</h2>
        <label>名称</label>
        <input v-model="form.name" placeholder="如：Example VPN" />
        <label>推荐链接</label>
        <input v-model="form.url" placeholder="https://..." />
        <label>描述</label>
        <textarea v-model="form.desc" rows="3" placeholder="一句话介绍" />
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
.vpn-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}
.vpn-card {
  background: var(--glass); border: 1px solid var(--glass-brd);
  border-radius: 14px; padding: 16px; backdrop-filter: blur(12px);
  cursor: pointer; transition: all .2s ease; outline: none; position: relative;
  animation: fadeUp .4s ease both;
}
.vpn-card:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(79,209,255,0.12); border-color: rgba(79,209,255,0.4); }
.vpn-head { display: flex; align-items: center; justify-content: space-between; }
.vpn-name { font-weight: 700; font-size: 15px; }
.arrow { color: var(--accent); font-size: 22px; transition: transform .2s; }
.vpn-card:hover .arrow { transform: translateX(4px); }
.vpn-desc { color: var(--muted); font-size: 12.5px; margin: 6px 0 12px; line-height: 1.6; white-space: pre-wrap; }
.vpn-link { display: inline-block; font-size: 12px; color: var(--accent); text-decoration: none; }
.vpn-link:hover { text-decoration: underline; }
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
.vpn-card:hover .card-tip { opacity: 1; transform: translateY(0); }
.vpn-card:hover { z-index: 10; }

.modal-head { display: flex; align-items: center; justify-content: space-between; }
.modal-head .x { background: transparent; color: var(--muted); font-size: 18px; padding: 4px 10px; }
.modal-head .x:hover { color: var(--text); }
.home-link { color: var(--accent); font-size: 13px; text-decoration: none; word-break: break-all; }
.home-link:hover { text-decoration: underline; }
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
