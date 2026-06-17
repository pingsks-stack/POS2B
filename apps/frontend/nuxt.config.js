const pkg = require('./package')

module.exports = {
  // SSR for web; set NUXT_APP=1 to build a static SPA for the Capacitor APK
  target: 'static',
  ssr: process.env.NUXT_APP !== '1',

  /*
   ** Headers of the page
   */
  head: {
    titleTemplate: 'BREW POS  | %s',
    title: 'BREW POS',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description',
        name: 'description',
        content: 'BREW POS powered by Dev Fong Co.,Ltd.'
      }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/logo2.ico' },
      {
        rel: 'stylesheet',
        href:
          'https://fonts.googleapis.com/css2?family=Mitr&family=Sarabun&display=swap'
      }
    ]
  },

  /*
   ** Customize the progress-bar color
   */
  loading: { color: '#FFFFFF' },

  /*
   ** Global CSS
   */
  css: ['@/assets/css/main.css'],

  /*
   ** Plugins to load before mounting the App
   */
  plugins: [
    // local-api MUST load first: in standalone mode it installs the axios
    // adapter that serves /api locally, before anything makes a request.
    { src: '~/plugins/local-api.js', mode: 'client' },
    { src: '~/plugins/img.js' },
    { src: '~/plugins/theme.js', mode: 'client' },
    { src: '~/plugins/toast.js', mode: 'client' },
    { src: '~/plugins/printer.js', mode: 'client' },
    { src: '~/plugins/promptpay.js', mode: 'client' },
    { src: '~/plugins/branding.js', mode: 'client' }
  ],

  // expose STANDALONE to the client bundle (set by the `build:app` script so the
  // APK runs offline against the in-app backend)
  env: {
    STANDALONE: process.env.STANDALONE || ''
  },

  /*
   ** Nuxt.js modules
   */
  modules: [
    '@nuxtjs/vuetify',
    '@nuxtjs/axios',
    '@nuxtjs/auth',
    '@nuxtjs/moment'
  ],

  axios: {
    // Old (offline) backend: 'https://api.brewpos.local/api'
    // Points at the rebuilt local backend (backend-api). Override with API_BASE env var.
    baseURL: process.env.API_BASE || 'http://localhost:5000/api'
  },

  auth: {
    // log the user out automatically if the token is invalid/expired
    // (e.g. a stale token after the DB was reseeded) -> bounce to /login
    resetOnError: true,
    strategies: {
      local: {
        endpoints: {
          login: {
            method: 'post',
            url: 'authen/login',
            propertyName: 'token'
          },
          user: {
            method: 'get',
            url: 'authen/user',
            propertyName: 'user'
          },
          logout: false
        }
      }
    },
    redirect: {
      login: '/login'
    }
  },
  vuetify: {
    defaultAssets: {
      font: { family: 'Sarabun' }
    },
    theme: {
      dark: false,
      options: { customProperties: true },
      themes: {
        light: {
          primary: '#2e9c3f',
          secondary: '#f4f6f8',
          accent: '#39b54a',
          info: '#39b54a',
          success: '#2e9c3f',
          warning: '#f0a020',
          error: '#e5484d',
          anchor: '#2e9c3f'
        },
        dark: {
          primary: '#3fbf52',
          secondary: '#16181c',
          accent: '#3fbf52',
          info: '#3fbf52',
          success: '#2e9c3f',
          warning: '#f0a020',
          error: '#ef5350',
          anchor: '#5ec46b'
        }
      }
    }
  },

  /*
   ** Build configuration
   */
  build: {
    /*
     ** You can extend webpack config here
     */
    extend (config, ctx) {}
  },
  server: {
    port: process.env.PORT || 3000,
    host: '0.0.0.0'
  }
}
