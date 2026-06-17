<template>
  <category :category="category" :products="products" @refresh="refresh" />
</template>

<script>
import category from "@/components/manage/category.vue";
export default {
  middleware: ["auth", "check"],
  async asyncData(context) {
    const [category, products] = await Promise.all([
      context.$axios.$get("/category"),
      context.$axios.$get("/product")
    ]);
    return { category, products };
  },
  components: {
    category
  },
  methods: {
    async refresh() {
      const [category, products] = await Promise.all([
        this.$axios.$get("/category"),
        this.$axios.$get("/product")
      ]);
      this.category = category;
      this.products = products;
    }
  },
  data: () => ({
    category: [],
    products: []
  })
};
</script>
