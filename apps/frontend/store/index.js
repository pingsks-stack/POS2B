export const state = () => ({
  settings: {}
})

export const mutations = {
  setSettings (state, s) {
    state.settings = s || {}
  }
}

export const actions = {
  // fetch shop settings once on server-side init so name/logo are available app-wide
  async nuxtServerInit ({ commit }, { $axios }) {
    try {
      const s = await $axios.$get('/settings')
      commit('setSettings', s)
    } catch (e) {}
  }
}

export const getters = {
  displayName (state) {
    const u = state.auth && state.auth.user
    return u ? ((u.fname || '') + ' ' + (u.lname || '')).trim() : ''
  },
  position (state) {
    const u = state.auth && state.auth.user
    return u && u.ref_id_role ? u.ref_id_role.position : ''
  },
  shopName (state) {
    return (state.settings && state.settings.shop_name) || 'SHIFT CAFÉ'
  }
}
