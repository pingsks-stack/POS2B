<template>
  <stock :stock="stock" :products="products" @refresh="refresh" />
</template>
<script>
import stock from "@/components/manage/stock.vue";

export default {
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
  middleware: ["auth", "check"],
  methods: {
    async refresh() {
      const [stock, products] = await Promise.all([
        this.$axios.$get("/stock"),
        this.$axios.$get("/product")
      ]);
      this.stock = stock;
      this.products = products;
    }
  },
  data: () => ({
    stock: [],
    products: []
  })
};
</script>
