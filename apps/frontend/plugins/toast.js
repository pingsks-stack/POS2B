// Global animated success/error feedback ($toast) + automatic toast on every
// successful save/add/delete (POST/PUT/DELETE) across the whole app — no need
// to wire it into each page. Container is pointer-events:none so it never
// blocks clicks.
import Vue from 'vue'

function container() {
  let el = document.getElementById('app-toast')
  if (!el) {
    el = document.createElement('div')
    el.id = 'app-toast'
    document.body.appendChild(el)
  }
  return el
}

function show(message, type) {
  if (typeof document === 'undefined' || !message) return
  const c = container()
  const t = document.createElement('div')
  t.className = 'app-toast-item ' + (type === 'error' ? 'is-error' : 'is-ok')
  const icon = type === 'error' ? '✕' : '✓'
  t.innerHTML = '<span class="app-toast-icon">' + icon + '</span><span>' + message + '</span>'
  c.appendChild(t)
  // next frame -> trigger the enter animation
  window.requestAnimationFrame(() => t.classList.add('show'))
  window.setTimeout(() => {
    t.classList.remove('show')
    window.setTimeout(() => { if (t.parentNode) t.parentNode.removeChild(t) }, 320)
  }, 1700)
}

// endpoints that have their own UX or aren't "saves" -> no auto toast
const SKIP = /authen|\/upload|\/order|\/crm|\/settings|\/shift|\/cashmove/i

export default function ({ $axios }) {
  if (process.client && $axios && $axios.onResponse) {
    $axios.onResponse(res => {
      try {
        const cfg = res.config || {}
        const m = (cfg.method || '').toLowerCase()
        const url = cfg.url || ''
        const isForm = typeof FormData !== 'undefined' && cfg.data instanceof FormData
        if (!isForm && !SKIP.test(url) && (m === 'post' || m === 'put' || m === 'delete')) {
          show(m === 'delete' ? 'ลบแล้ว' : 'บันทึกสำเร็จ', 'ok')
        }
      } catch (e) {}
      return res
    })
  }
  // manual use: this.$toast('ข้อความ') or this.$toast('ผิดพลาด','error')
  Vue.prototype.$toast = (msg, type) => show(msg, type)
}
