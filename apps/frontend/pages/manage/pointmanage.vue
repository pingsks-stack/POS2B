<template>
  <pointmanage :customers="customers" @refresh="refresh" />
</template>

<script>
import pointmanage from "@/components/manage/pointmanage.vue";
export default {
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
