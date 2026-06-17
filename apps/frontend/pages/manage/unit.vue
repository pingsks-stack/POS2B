<template>
  <unit :unit="unit" :products="products" @refresh="refresh" />
</template>

<script>
import unit from "@/components/manage/unit.vue";
export default {
  middleware: ["auth", "check"],
  async asyncData(context) {
    const [unit, products] = await Promise.all([
      context.$axios.$get("/unit"),
      context.$axios.$get("/product")
    ]);
    return { unit, products };
  },
  components: {
    unit
  },
  methods: {
    async refresh() {
      const [unit, products] = await Promise.all([
        this.$axios.$get("/unit"),
        this.$axios.$get("/product")
      ]);
      this.unit = unit;
      this.products = products;
    }
  },
  data: () => ({
    unit: [],
    products: []
  })
};
</script>
