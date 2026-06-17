<template>
  <product :product="product" :unit="unit" :category="category" :optiongroup="optiongroup" @refresh="refresh" />
</template>

<script>
import product from "@/components/manage/product.vue";
export default {
  middleware: ["auth", "check"],
  async asyncData(context) {
    const [product, unit, category, optiongroup] = await Promise.all([
      context.$axios.$get("/product"),
      context.$axios.$get("/unit"),
      context.$axios.$get("/category"),
      context.$axios.$get("/optiongroup")
    ]);
    return { product, unit, category, optiongroup };
  },
  components: {
    product
  },
  methods: {
    async refresh() {
      this.product = await this.$axios.$get("/product");
    }
  },
  data: () => ({
    product: [],
    unit: [],
    category: [],
    optiongroup: []
  })
};
</script>

<style></style>
