<template>
  <pointmanage :customers="customers" @refresh="refresh" />
</template>

<script>
import pointmanage from "@/components/manage/pointmanage.vue";
export default {
  layout(context) {
    const u = context.store.state.auth && context.store.state.auth.user;
    const pos = u && u.ref_id_role ? u.ref_id_role.position : "";
    return pos === "cashier" || pos === "staff" ? "layoutCashier" : "default";
  },
  async asyncData(context) {
    const customers = await context.$axios.$get("/customer");
    return { customers };
  },
  components: {
    pointmanage
  },
  methods: {
    async refresh() {
      this.customers = await this.$axios.$get("/customer");
    }
  },
  data: () => ({
    customers: []
  })
};
</script>

<style></style>
