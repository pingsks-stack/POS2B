<template>
  <v-app>
    <Navbar />
    <v-main :class="$vuetify.theme.dark ? '' : 'secondary'">
      <div class="content-wrap">
        <nuxt />
      </div>
    </v-main>
    <Footer />
  </v-app>
</template>
<script>
import Navbar from "@/components/layout/Navbar.vue";
import Footer from "@/components/layout/Footer.vue";
export default {
  components: {
    Navbar,
    Footer
  }
};
</script>
<style>
html {
  font-family: "Sarabun", sans-serif;
}
#app {
  font-family: "Sarabun", sans-serif;
}
</style>
