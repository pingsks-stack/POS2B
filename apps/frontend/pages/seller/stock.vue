<template>
  <stock :stock="stock" :products="products" @refresh="refresh" />
</template>
<script>
import stock from "@/components/manage/stock.vue";

export default {
  layout(context) {
    const u = context.store.state.auth && context.store.state.auth.user;
    const pos = u && u.ref_id_role ? u.ref_id_role.position : "";
    return pos === "cashier" || pos === "staff" ? "layoutCashier" : "default";
  },
  async asyncData(context) {
    const [stock, products] = await Promise.all([
      context.$axios.$get("/stock"),
      context.$axios.$get("/product")
    ]);
    return { stock, products };
  },
  components: {
    stock
  },
  methods: {
    async refresh() {
      this.stock = await this.$axios.$get("/stock");
    }
  },
  data: () => ({
    stock: [],
    products: []
  })
};
</script>
