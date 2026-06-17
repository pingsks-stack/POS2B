// Apply the saved dark/light preference on boot + expose a global toggle.
export default ({ app, store }) => {
  if (!process.client) return
  const apply = dark => {
    try {
      if (app.vuetify && app.vuetify.framework && app.vuetify.framework.theme) {
        app.vuetify.framework.theme.dark = dark
      }
    } catch (e) {}
  }
  let saved = false
  try { saved = window.localStorage.getItem('darkMode') === '1' } catch (e) {}
  apply(saved)

  // global helper used by the navbar toggle (works from any component)
  window.__toggleDark = () => {
    let dark = false
    try { dark = !(app.vuetify.framework.theme.dark) } catch (e) {}
    apply(dark)
    try { window.localStorage.setItem('darkMode', dark ? '1' : '0') } catch (e) {}
    return dark
  }
}
