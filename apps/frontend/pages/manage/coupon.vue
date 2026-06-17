<template>
  <coupon :coupon="coupon" :employee="employee" :user="user" @refresh="refresh" />
</template>

<script>
import coupon from "@/components/manage/coupon.vue";
export default {
  middleware: ["auth", "check"],
  async asyncData(context) {
    const [coupon, employee, user] = await Promise.all([
      context.$axios.$get("/coupon"),
      context.$axios.$get("/employee"),
      context.$axios.$get("/authen/user")
    ]);
    return { coupon, employee, user };
  },
  components: {
    coupon
  },
  methods: {
    async refresh() {
      this.coupon = await this.$axios.$get("/coupon");
    }
  },
  data: () => ({
    coupon: [],
    employee: [],
    user: {}
  })
};
</script>

<style></style>
