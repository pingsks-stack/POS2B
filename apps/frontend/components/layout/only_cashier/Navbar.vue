<template>
  <div>
    <v-navigation-drawer
      v-model="drawer" app :color="navColor" width="260"
      :permanent="$vuetify.breakpoint.lgAndUp"
      :mini-variant="mini && $vuetify.breakpoint.lgAndUp" mini-variant-width="72"
    >
      <div class="d-flex align-center pa-4" :class="{ 'justify-center px-0': isMini }">
        <v-avatar color="primary" size="42" :class="{ 'mr-3': !isMini }">
          <v-img v-if="shopLogo" :src="shopLogo"></v-img>
          <v-icon v-else dark>mdi-coffee</v-icon>
        </v-avatar>
        <div v-if="!isMini">
          <div class="brand-name">{{ shopName }}</div>
          <div class="brand-sub">หน้าร้าน (แคชเชียร์)</div>
        </div>
      </div>
      <v-divider></v-divider>

      <v-list nav dense class="px-2 mt-2">
        <v-list-item
          v-for="(item, i) in items" :key="i"
          :to="item.to" router exact color="primary" class="mb-1 rounded-lg"
        >
          <v-list-item-icon class="mr-3"><v-icon>{{ item.icon }}</v-icon></v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar app flat :color="navColor" class="app-bar-border" height="64">
      <v-app-bar-nav-icon @click.stop="toggleNav" />
      <v-toolbar-title class="d-lg-none font-weight-bold">{{ shopName }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="toggleDark" :title="$vuetify.theme.dark ? 'โหมดสว่าง' : 'โหมดมืด'" class="mr-1">
        <v-icon>{{ $vuetify.theme.dark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>
      <v-menu offset-y left>
        <template v-slot:activator="{ on, attrs }">
          <v-btn text class="text-none" v-bind="attrs" v-on="on">
            <v-avatar size="34" class="mr-2">
              <img alt="Avatar" src="https://avatars0.githubusercontent.com/u/9064066?v=4&s=460" />
            </v-avatar>
            <div class="text-left d-none d-sm-block">
              <div class="user-name">{{ displayName }}</div>
              <div class="user-role">{{ position }}</div>
            </div>
            <v-icon small class="ml-1">mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        <v-list dense>
          <v-list-item @click="logout">
            <v-list-item-icon class="mr-2"><v-icon color="error">mdi-logout</v-icon></v-list-item-icon>
            <v-list-item-title>ออกจากระบบ</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>
  </div>
</template>

<script>
export default {
  data() {
    return {
      drawer: false,
      mini: false,
      items: [
        { icon: "mdi-storefront-outline", title: "ขายหน้าร้าน", to: "/seller" },
        { icon: "mdi-cash-register", title: "เงินทอน / รอบขาย", to: "/seller/cashdraw" },
        { icon: "mdi-account-plus-outline", title: "ลงทะเบียนสมาชิก", to: "/seller/register" },
        { icon: "mdi-gift-outline", title: "แลก Point", to: "/seller/point" },
        { icon: "mdi-warehouse", title: "จัดการสต็อก", to: "/seller/stock" }
      ]
    };
  },
  computed: {
    isMini() {
      return this.mini && this.$vuetify.breakpoint.lgAndUp;
    },
    shopName() {
      const s = this.$store.state.settings || {};
      return s.shop_name || "SHIFT CAFÉ";
    },
    shopLogo() {
      const s = this.$store.state.settings || {};
      return this.$img(s.logo);
    },
    displayName() {
      const u = this.$store.state.auth && this.$store.state.auth.user;
      return u ? ((u.fname || "") + " " + (u.lname || "")).trim() : "ผู้ใช้";
    },
    position() {
      const u = this.$store.state.auth && this.$store.state.auth.user;
      return u && u.ref_id_role ? u.ref_id_role.position : "";
    },
    navColor() {
      return this.$vuetify.theme.dark ? "#16181c" : "white";
    }
  },
  methods: {
    toggleNav() {
      if (this.$vuetify.breakpoint.lgAndUp) this.mini = !this.mini;
      else this.drawer = !this.drawer;
    },
    toggleDark() {
      if (typeof window !== "undefined" && window.__toggleDark) window.__toggleDark();
      else this.$vuetify.theme.dark = !this.$vuetify.theme.dark;
    },
    async logout() {
      await this.$auth.logout();
      this.$router.push("/login");
    }
  }
};
</script>

<style scoped>
.brand-name { font-family: "Mitr", sans-serif; font-weight: 600; font-size: 1.1rem; color: #1d1d1d; line-height: 1.1; }
.brand-sub { font-size: 0.72rem; color: #9aa0a6; }
.app-bar-border { border-bottom: 1px solid #eceef1 !important; }
.user-name { font-size: 0.85rem; font-weight: 600; line-height: 1.1; color: #2b2f33; }
.user-role { font-size: 0.7rem; color: #9aa0a6; line-height: 1.1; }
.v-list-item--active { background: rgba(46, 156, 63, 0.1); }
/* dark theme */
.theme--dark .brand-name { color: #f1f3f5; }
.theme--dark .user-name { color: #e6e8eb; }
.theme--dark .app-bar-border { border-bottom-color: #2a2e35 !important; }
.theme--dark .v-list-item--active { background: rgba(63, 191, 82, 0.18); }
</style>
