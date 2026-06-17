// Apply shop name + logo from settings to the browser tab (title + favicon).
export default async ctx => {
  if (!process.client) return
  // SPA / Capacitor app build has no nuxtServerInit -> load settings here
  if (ctx.store && !(ctx.store.state.settings && ctx.store.state.settings.shop_name)) {
    try {
      const s = await ctx.$axios.$get('/settings')
      ctx.store.commit('setSettings', s)
    } catch (e) {}
  }
  const apply = () => {
    const s = (ctx.store && ctx.store.state.settings) || {}
    const name = s.shop_name || 'SHIFT CAFÉ'
    document.title = name
    if (s.logo) {
      const href = /^(data:|https?:|blob:)/i.test(s.logo)
        ? s.logo
        : (ctx.$axios.defaults.baseURL.replace('/api', '/') + s.logo)
      let link = document.querySelector("link[rel~='icon']")
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
      }
      link.href = href
    }
  }
  apply()
  // re-apply after each route change (overrides nuxt's static titleTemplate)
  if (ctx.app && ctx.app.router) ctx.app.router.afterEach(() => setTimeout(apply, 60))
  // allow live update after saving settings
  if (typeof window !== 'undefined') window.__applyBranding = apply
}
