<template>
  <div>
    <v-card class="rounded-xl overflow-hidden mb-4" elevation="2">
      <div class="profile-head text-center pa-5">
        <v-avatar size="92" class="elevation-4 mb-2">
          <img src="https://cdn.vuetifyjs.com/images/john.jpg" alt="avatar" />
        </v-avatar>
        <div class="white--text text-h6 font-weight-bold">{{ fullName }}</div>
        <div class="white--text text-caption" style="opacity:.85">สมาชิก SHIFT CAFÉ</div>
      </div>
      <div class="pa-4 text-center">
        <div class="grey--text text-caption">แต้มสะสม</div>
        <div class="text-h4 font-weight-bold primary--text">
          {{ user.point != null ? user.point : 0 }}
        </div>
      </div>

      <v-divider></v-divider>
      <v-list nav dense class="px-2">
        <v-list-item
          v-for="(item, i) in items" :key="i" :to="item.to" color="primary" class="rounded-lg mb-1"
        >
          <v-list-item-icon class="mr-3"><v-icon>{{ item.icon }}</v-icon></v-list-item-icon>
          <v-list-item-content><v-list-item-title>{{ item.text }}</v-list-item-title></v-list-item-content>
        </v-list-item>
        <v-list-item class="rounded-lg" @click="logout">
          <v-list-item-icon class="mr-3"><v-icon color="error">mdi-logout</v-icon></v-list-item-icon>
          <v-list-item-content><v-list-item-title class="error--text">ออกจากระบบ</v-list-item-title></v-list-item-content>
        </v-list-item>
      </v-list>
    </v-card>
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: [
        { text: "ข้อมูลส่วนตัว", icon: "mdi-account-outline", to: "/member" },
        { text: "พอยท์ของฉัน", icon: "mdi-star-outline", to: "/point" },
        { text: "คูปอง", icon: "mdi-ticket-percent-outline", to: "/coupon" },
        { text: "ประวัติการสั่งซื้อ", icon: "mdi-history", to: "/history_buy" }
      ]
    };
  },
  computed: {
    user() {
      return (this.$store.state.auth && this.$store.state.auth.user) || {};
    },
    firstName() {
      return this.user.fname || "สมาชิก";
    },
    fullName() {
      return ((this.user.fname || "") + " " + (this.user.lname || "")).trim() || "สมาชิก";
    }
  },
  methods: {
    async logout() {
      await this.$auth.logout();
      this.$router.push("/login");
    }
  }
};
</script>

<style scoped>
.profile-head {
  background: linear-gradient(135deg, #2e9c3f, #1d6f2c);
}
</style>
