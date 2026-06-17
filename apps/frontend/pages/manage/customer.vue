<template>
  <customer :customer="customer" :levels="levels" @refresh="refresh" />
</template>

<script>
import customer from "@/components/manage/customer.vue";
export default {
  async asyncData(context) {
    const [customer, levels] = await Promise.all([
      context.$axios.$get("/customer"),
      context.$axios.$get("/level")
    ]);
    return { customer, levels };
  },
  components: {
    customer
  },
  methods: {
    async refresh() {
      this.customer = await this.$axios.$get("/customer");
    }
  },
  data: () => ({
    customer: [],
    levels: []
  })
};
</script>

<style></style>
