// Global $img(path) helper — turns a stored image reference into a usable src.
// - empty            -> ''
// - data:/http/blob  -> returned as-is (standalone APK stores uploads as data URLs)
// - "uploads/xxx"    -> prefixed with the backend host (normal web/server mode)
import Vue from 'vue'

export default function ({ $axios }) {
  if (Vue.prototype.$img) return
  Vue.prototype.$img = function (p) {
    if (!p) return ''
    if (/^(data:|https?:|blob:)/i.test(p)) return p
    const base = ($axios && $axios.defaults && $axios.defaults.baseURL
      ? $axios.defaults.baseURL
      : '/api').replace(/\/api\/?$/, '/')
    return base + p
  }
}
