<script setup>
import { ref, onMounted } from 'vue'
import { generateImage, refreshModels, fetchStations } from '~/composables/useApi'

const emit = defineEmits(['toast'])
function showToast(msg) { emit('toast', msg) }

const props = defineProps({ stations: { type: Array, default: () => [] } })

const form = ref({
  stationId: '',
  apiKey: '',          // 可修改的 key，默认带入已存 key
  model: '',           // 需获取模型后选择
  prompt: '',
  size: '1024x1024',
  quality: 'standard',
  n: 1,
  upload: true
})
const stationList = ref([])
const loading = ref(false)
const result = ref(null)

// 生图历史
const HKEY = 'relay_img_history'
const showHistory = ref(false)
const history = ref([])
function loadHistory() { try { history.value = JSON.parse(localStorage.getItem(HKEY) || '[]') } catch { history.value = [] } }
function saveHistory(item) {
  history.value.unshift(item)
  history.value = history.value.slice(0, 50)
  localStorage.setItem(HKEY, JSON.stringify(history.value))
}
function removeHistory(i) { history.value.splice(i, 1); localStorage.setItem(HKEY, JSON.stringify(history.value)) }
function clearHistory() { history.value = []; localStorage.setItem(HKEY, '') }

// 供父组件调用：选择某个中转站
function pickStation(s) {
  form.value.stationId = s._id
  form.value.apiKey = ''   // 留空表示使用已存 key
  loadModels()
}
defineExpose({ pickStation })

async function loadModels() {
  if (!form.value.stationId) return
  try {
    const st = await refreshModels(form.value.stationId)
    const models = st.models && st.models.length ? st.models : []
    if (!form.value.model || !models.includes(form.value.model)) {
      form.value.model = models[0] || ''
    }
    showToast('已获取模型列表')
  } catch (e) {
    showToast('获取模型失败：' + (e?.data?.message || e.message))
  }
}

function maskKey(k) {
  if (!k) return '（使用已保存 key）'
  return k.slice(0, 4) + '…' + k.slice(-4)
}

async function gen() {
  if (!form.value.stationId) { showToast('请选择中转站'); return }
  if (!form.value.prompt.trim()) { showToast('请输入提示词'); return }
  loading.value = true
  result.value = null
  try {
    const data = await generateImage({
      stationId: form.value.stationId,
      apiKey: form.value.apiKey,
      model: form.value.model,
      prompt: form.value.prompt,
      size: form.value.size,
      quality: form.value.quality,
      n: form.value.n,
      upload: form.value.upload
    })
    result.value = data
    for (const img of (data.images || [])) {
      saveHistory({
        time: new Date().toLocaleString(),
        model: data.model,
        prompt: form.value.prompt,
        b64: img.b64,
        imgbedUrl: img.imgbedUrl || ''
      })
    }
    showToast('生图完成')
  } catch (e) {
    showToast('生图失败：' + (e?.data?.message || e.message))
  } finally {
    loading.value = false
  }
}

async function copy(text) {
  try { await navigator.clipboard.writeText(text); showToast('已复制链接') }
  catch { showToast('复制失败') }
}

onMounted(async () => {
  loadHistory()
  if (props.stations && props.stations.length) {
    stationList.value = props.stations
  } else {
    try { stationList.value = await fetchStations() } catch {}
  }
})
</script>

<template>
  <div>
    <h2 style="font-size:19px;margin:0 0 6px;">AI 生图</h2>
    <p class="ph">选择一个已保存的中转站，可修改 key（留空使用已存），模型需点击「获取模型」后选择。</p>

    <div class="ig-card">
      <label>中转站</label>
      <select v-model="form.stationId" @change="form.apiKey = ''; form.model = ''">
        <option value="">-- 请选择 --</option>
        <option v-for="s in stationList" :key="s._id" :value="s._id">{{ s.name }}（{{ s.baseURL }}）</option>
      </select>

      <label>API Key（可选，留空使用已保存）</label>
      <input v-model="form.apiKey" :placeholder="form.stationId ? '留空 = 使用已保存 key' : '请先选择中转站'"
             :type="form.apiKey ? 'text' : 'password'" />

      <label>模型 <button class="mini" @click="loadModels" :disabled="!form.stationId">获取模型</button></label>
      <input v-model="form.model" :placeholder="form.model ? '' : '点击「获取模型」拉取'" />

      <label>提示词</label>
      <textarea v-model="form.prompt" rows="3" placeholder="描述你想生成的画面…"></textarea>

      <div class="row2">
        <div>
          <label>尺寸</label>
          <select v-model="form.size">
            <option>1024x1024</option>
            <option>1024x1792</option>
            <option>1792x1024</option>
            <option>512x512</option>
          </select>
        </div>
        <div>
          <label>画质</label>
          <select v-model="form.quality">
            <option>standard</option>
            <option>hd</option>
          </select>
        </div>
        <div>
          <label>数量</label>
          <select v-model="form.n">
            <option :value="1">1</option>
            <option :value="2">2</option>
            <option :value="3">3</option>
            <option :value="4">4</option>
          </select>
        </div>
      </div>

      <label class="chk"><input type="checkbox" v-model="form.upload" style="width:auto" /> 生图后自动上传图床</label>

      <button class="btn-primary gen-btn" @click="gen" :disabled="loading">
        <span v-if="loading" class="spin"></span>{{ loading ? '生成中…' : '开始生图' }}
      </button>
    </div>

    <div class="result" v-if="result">
      <h3>结果（模型：{{ result.model }}）</h3>
      <div class="imgs">
        <div class="img-box" v-for="(img, i) in result.images" :key="i">
          <img :src="'data:image/png;base64,' + img.b64" alt="generated" />
          <div class="img-actions">
            <a v-if="img.imgbedUrl" :href="img.imgbedUrl" target="_blank" class="btn-ghost">图床链接 ↗</a>
            <button class="btn-ghost" v-if="img.imgbedUrl" @click="copy(img.imgbedUrl)">复制链接</button>
          </div>
        </div>
      </div>
    </div>

    <div class="hist-head">
      <h3 style="margin:0;">生图历史</h3>
      <div>
        <button class="btn-ghost" @click="showHistory = !showHistory">{{ showHistory ? '隐藏' : '查看' }}</button>
        <button class="btn-ghost" v-if="showHistory && history.length" @click="clearHistory">清空</button>
      </div>
    </div>
    <div class="history" v-if="showHistory">
      <div v-if="!history.length" class="empty">暂无历史记录</div>
      <div class="hist-item" v-for="(h, i) in history" :key="i">
        <img :src="h.imgbedUrl || ('data:image/png;base64,' + h.b64)" alt="hist" />
        <div class="hist-info">
          <div class="hist-meta">{{ h.time }} · {{ h.model }}</div>
          <div class="hist-prompt">{{ h.prompt }}</div>
          <div class="hist-acts">
            <a v-if="h.imgbedUrl" :href="h.imgbedUrl" target="_blank" class="btn-ghost">图床 ↗</a>
            <button class="btn-ghost" v-if="h.imgbedUrl" @click="copy(h.imgbedUrl)">复制</button>
            <button class="btn-danger" @click="removeHistory(i)">删除</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ph { color: var(--muted); font-size: 13px; }
.ig-card { background: var(--glass); border: 1px solid var(--glass-brd); border-radius: 16px; padding: 22px; max-width: 640px; margin-top: 16px; }
.row2 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
.chk { display: flex; align-items: center; gap: 8px; color: var(--text); font-size: 13px; margin-top: 14px; }
.gen-btn { width: 100%; margin-top: 18px; }
.result { margin-top: 26px; }
.result h3 { font-size: 15px; }
.imgs { display: flex; flex-wrap: wrap; gap: 14px; }
.img-box { background: var(--glass); border: 1px solid var(--glass-brd); border-radius: 12px; padding: 10px; }
.img-box img { max-width: 280px; border-radius: 8px; display: block; }
.img-actions { display: flex; gap: 8px; margin-top: 8px; }
.mini { padding: 3px 9px; font-size: 11px; background: rgba(79,209,255,0.12); color: var(--accent); border: 1px solid rgba(79,209,255,0.3); margin-left: 8px; }
.mini:hover { background: rgba(79,209,255,0.2); }

.hist-head { display: flex; align-items: center; justify-content: space-between; margin-top: 30px; }
.history { margin-top: 14px; display: flex; flex-direction: column; gap: 12px; }
.hist-item { display: flex; gap: 14px; background: var(--glass); border: 1px solid var(--glass-brd); border-radius: 12px; padding: 12px; }
.hist-item img { width: 110px; height: 110px; object-fit: cover; border-radius: 8px; flex: 0 0 auto; }
.hist-info { flex: 1; }
.hist-meta { font-size: 12px; color: var(--muted); }
.hist-prompt { font-size: 13px; margin: 6px 0 10px; word-break: break-all; }
.hist-acts { display: flex; gap: 8px; }
</style>
