<template>
  <div class="" style="height: 100%">
    <v-card class="py-5 px-5" style="height: 100%;" color="secondary">
      <v-row>
        <v-col cols="12" xs="12" sm="12" md="3">
          <MenuProfile />
        </v-col>
        <v-col xs="12" sm="12" md="9" class="">
          <h2 class="text-left mb-2">คูปอง</h2>

          <v-text-field dense placeholder="ค้นหาโค้ดคูปอง" solo v-model="search"></v-text-field>
          <v-row>
            <v-col v-for="c in visible" :key="c._id" sm="12" md="4" cols="12" class="mt-n2">
              <v-card class="rounded-xl" color="primary" dark>
                <v-card-text class="text-center">
                  <v-icon size="48" color="amber">mdi-ticket-percent</v-icon>
                  <h2 class="white--text mt-2">{{ c.codename }}</h2>
                  <h1 class="info--text my-2">ลด {{ c.discount }}%</h1>
                  <div class="grey--text">หมดอายุ: {{ c.exp || "-" }}</div>
                  <div class="grey--text">ใช้ได้: {{ c.num_use }} ครั้ง</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col v-if="visible.length === 0" cols="12" class="text-center grey--text">
              ไม่มีคูปอง
            </v-col>
          </v-row>
          <div class="text-center">
            <v-pagination
              color="error"
              v-model="currentPage"
              :length="Math.max(1, Math.ceil(filtered.length / perPage))"
              circle
              class="mt-5"
            ></v-pagination>
          </div>
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>

<script>
import MenuProfile from "~/components/memberLayout/MenuProfile";
export default {
  layout: "layoutMember",
  async asyncData(context) {
    const coupons = await context.$axios.$get("/coupon");
    return { coupons };
  },
  data() {
    return {
      coupons: [],
      search: "",
      currentPage: 1,
      perPage: 6
    };
  },
  computed: {
    filtered() {
      const kw = this.search.toLowerCase();
      return (this.coupons || []).filter(c =>
        (c.codename || "").toLowerCase().includes(kw)
      );
    },
    visible() {
      return this.filtered.slice(
        (this.currentPage - 1) * this.perPage,
        this.currentPage * this.perPage
      );
    }
  },
  components: {
    MenuProfile
  }
};
</script>

<style>
.text-online { color: green; font-size: 14px; }
</style>
