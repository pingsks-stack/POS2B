<template>
  <div>
    <v-navigation-drawer
      v-model="drawer" app :color="navColor" width="260"
      :permanent="$vuetify.breakpoint.lgAndUp"
      :mini-variant="mini && $vuetify.breakpoint.lgAndUp" mini-variant-width="72"
    >
      <!-- brand -->
      <div class="d-flex align-center pa-4" :class="{ 'justify-center px-0': isMini }">
        <v-avatar color="primary" size="42" :class="{ 'mr-3': !isMini }">
          <v-img v-if="shopLogo" :src="shopLogo"></v-img>
          <v-icon v-else dark>mdi-coffee</v-icon>
        </v-avatar>
        <div v-if="!isMini">
          <div class="brand-name">{{ shopName }}</div>
          <div class="brand-sub">ระบบจัดการร้าน</div>
        </div>
      </div>
      <v-divider></v-divider>

      <v-list nav dense class="px-2">
        <template v-for="(group, gi) in groups">
          <v-subheader v-if="!isMini" :key="'h' + gi" class="nav-subheader">{{ group.header }}</v-subheader>
          <v-divider v-else :key="'d' + gi" class="my-1"></v-divider>
          <v-list-item
            v-for="(item, i) in group.items" :key="gi + '-' + i"
            :to="item.to" router exact color="primary" class="mb-1 rounded-lg"
          >
            <v-list-item-icon class="mr-3">
              <v-icon>{{ item.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </template>
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
      groups: [
        {
          header: "ขายหน้าร้าน",
          items: [
            { icon: "mdi-storefront-outline", title: "ขาย", to: "/seller" },
            { icon: "mdi-cash-register", title: "เงินทอน / รอบขาย", to: "/manage/cash" }
          ]
        },
        {
          header: "สินค้า & เมนู",
          items: [
            { icon: "mdi-coffee-outline", title: "จัดการสินค้า", to: "/manage/product" },
            { icon: "mdi-tune-variant", title: "ชุดตัวเลือก", to: "/manage/optiongroup" },
            { icon: "mdi-shape-outline", title: "หมวดหมู่", to: "/manage/category" },
            { icon: "mdi-scale-balance", title: "หน่วยนับ", to: "/manage/unit" },
            { icon: "mdi-warehouse", title: "คลัง / สต็อก", to: "/manage/stock" }
          ]
        },
        {
          header: "สมาชิก & แต้ม",
          items: [
            { icon: "mdi-account-group-outline", title: "ข้อมูลสมาชิก", to: "/manage/customer" },
            { icon: "mdi-medal-outline", title: "ระดับสมาชิก", to: "/manage/levelmember" },
            { icon: "mdi-star-circle-outline", title: "จัดการแต้ม", to: "/manage/pointmanage" },
            { icon: "mdi-ticket-percent-outline", title: "คูปองส่วนลด", to: "/manage/coupon" },
            { icon: "mdi-chat-outline", title: "LINE CRM", to: "/manage/line-crm" }
          ]
        },
        {
          header: "รายงาน & การเงิน",
          items: [
            { icon: "mdi-view-dashboard-outline", title: "แดชบอร์ด", to: "/manage" },
            { icon: "mdi-chart-box-outline", title: "รายงานยอดขาย", to: "/manage/reports" },
            { icon: "mdi-receipt-text-outline", title: "ดูสลิปย้อนหลัง", to: "/manage/receipts" }
          ]
        },
        {
          header: "ตั้งค่าระบบ",
          items: [
            { icon: "mdi-card-account-details-outline", title: "จัดการพนักงาน", to: "/manage/employee" },
            { icon: "mdi-cog-outline", title: "ตั้งค่า", to: "/manage/settings" }
          ]
        }
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
.nav-subheader { font-size: 0.72rem; font-weight: 600; color: #aab0b6; letter-spacing: 0.5px; text-transform: uppercase; height: 30px; }
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
