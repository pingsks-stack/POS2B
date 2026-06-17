<template>
  <div class="" style="height: 100%">
    <v-card class="py-5 px-5" style="height: 100%;" color="secondary">
      <v-row>
        <v-col cols="12" xs="12" sm="12" md="3">
          <MenuProfile />
        </v-col>
        <v-col cols="12" xs="12" sm="12" md="9">
          <v-card class="px-6 py-5">
            <div class="text-center">
              <h2>ข้อมูลส่วนตัว</h2>
              <v-divider class="mt-3 mb-2"></v-divider>
            </div>
            <v-row no-gutters style="flex-wrap: nowrap" v-for="row in info" :key="row.label">
              <v-col cols="6" class="flex-grow-0 flex-shrink-0 text-right">
                <h4 class="pa-2" outlined tile>
                  <v-icon color="red_fix" dense>{{ row.icon }}</v-icon>
                  {{ row.label }}
                </h4>
              </v-col>
              <v-col cols="6" style="min-width: 100px; max-width: 100%" class="flex-grow-1 flex-shrink-0">
                <h4 class="pa-2 text-truncate" outlined tile>{{ row.value || "-" }}</h4>
              </v-col>
            </v-row>
            <v-divider class="mt-3 mb-5"></v-divider>
          </v-card>
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>

<script>
import MenuProfile from "~/components/memberLayout/MenuProfile";
export default {
  layout: "layoutMember",
  components: {
    MenuProfile
  },
  computed: {
    user() {
      return (this.$store.state.auth && this.$store.state.auth.user) || {};
    },
    info() {
      const u = this.user;
      return [
        { icon: "mdi-barcode", label: "รหัสลูกค้า", value: u._id },
        { icon: "mdi-account", label: "ชื่อ - นามสกุล", value: ((u.fname || "") + " " + (u.lname || "")).trim() },
        { icon: "mdi-gift", label: "วันเกิด", value: u.birthday },
        { icon: "mdi-phone-outline", label: "เบอร์โทร", value: u.tel },
        { icon: "mdi-email", label: "อีเมล", value: u.email },
        { icon: "mdi-star", label: "แต้มสะสม", value: u.point != null ? u.point + " แต้ม" : "-" }
      ];
    }
  }
};
</script>

<style>
.modal {
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  background-color: rgba(255, 255, 255, 0.4);
}
</style>
