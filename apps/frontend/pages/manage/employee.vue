<template>
  <employee :employee="employee" :roles="roles" @refresh="refresh" />
</template>

<script>
import employee from "@/components/manage/employee.vue";
export default {
  async asyncData(context) {
    const [employee, roles] = await Promise.all([
      context.$axios.$get("/employee"),
      context.$axios.$get("/role")
    ]);
    return { employee, roles };
  },
  components: {
    employee
  },
  methods: {
    async refresh() {
      this.employee = await this.$axios.$get("/employee");
    }
  },
  data: () => ({
    employee: [],
    roles: []
  })
};
</script>

<style></style>
