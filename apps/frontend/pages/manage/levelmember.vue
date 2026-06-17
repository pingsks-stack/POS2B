<template>
  <levelmember :levels="levels" :customers="customers" @refresh="refresh" />
</template>

<script>
import levelmember from "@/components/manage/levelmember.vue";
export default {
  middleware: ["auth", "check"],
  async asyncData(context) {
    const [levels, customers] = await Promise.all([
      context.$axios.$get("/level"),
      context.$axios.$get("/customer")
    ]);
    return { levels, customers };
  },
  components: {
    levelmember
  },
  methods: {
    async refresh() {
      const [levels, customers] = await Promise.all([
        this.$axios.$get("/level"),
        this.$axios.$get("/customer")
      ]);
      this.levels = levels;
      this.customers = customers;
    }
  },
  data: () => ({
    levels: [],
    customers: []
  })
};
</script>
