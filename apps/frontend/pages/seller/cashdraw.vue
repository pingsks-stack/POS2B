<template>
  <CashSummary />
</template>

<script>
import CashSummary from "@/components/CashSummary.vue";
export default {
  layout(context) {
    const u = context.store.state.auth && context.store.state.auth.user;
    const pos = u && u.ref_id_role ? u.ref_id_role.position : "";
    return pos === "cashier" || pos === "staff" ? "layoutCashier" : "default";
  },
  components: { CashSummary }
};
</script>

<style></style>
