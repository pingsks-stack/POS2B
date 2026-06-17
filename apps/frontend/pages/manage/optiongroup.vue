<template>
  <optiongroup :optiongroup="optiongroup" @refresh="refresh" />
</template>

<script>
import optiongroup from "@/components/manage/optiongroup.vue";
export default {
  middleware: ["auth", "check"],
  async asyncData(context) {
    const optiongroup = await context.$axios.$get("/optiongroup");
    return { optiongroup };
  },
  components: { optiongroup },
  methods: {
    async refresh() {
      this.optiongroup = await this.$axios.$get("/optiongroup");
    }
  },
  data: () => ({
    optiongroup: []
  })
};
</script>
