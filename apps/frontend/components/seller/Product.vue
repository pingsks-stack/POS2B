<template>
  <v-col cols="6" sm="4" md="4" lg="3" class="pa-2">
    <v-card
      class="prod-card rounded-xl overflow-hidden"
      :class="{ 'prod-out': soldOut }"
      elevation="2"
      :disabled="soldOut"
      @click="addOrder"
    >
      <div class="prod-img-wrap">
        <v-img height="120px" :src="imgSrc" gradient="to top, rgba(0,0,0,.25), rgba(0,0,0,0)">
          <template v-slot:placeholder>
            <v-row class="fill-height ma-0" align="center" justify="center"
              style="background: linear-gradient(135deg,#f3f4f6,#e5e7eb)">
              <v-icon size="46" color="grey lighten-1">mdi-coffee</v-icon>
            </v-row>
          </template>
        </v-img>
        <v-chip
          x-small label dark class="prod-stock"
          :color="soldOut ? 'red' : stock <= 5 ? 'orange darken-1' : 'green'"
        >
          {{ soldOut ? "หมด" : "เหลือ " + stock }}
        </v-chip>
        <div class="prod-add" v-if="!soldOut"><v-icon small color="white">mdi-plus</v-icon></div>
      </div>
      <v-card-text class="pa-2 text-center">
        <div class="prod-name text-truncate font-weight-medium">{{ product.product_name }}</div>
        <div class="prod-price font-weight-bold">{{ product.price }} ฿</div>
      </v-card-text>
    </v-card>
  </v-col>
</template>

<script>
export default {
  props: ["product"],
  computed: {
    stock() {
      return Number(this.product.stock) || 0;
    },
    soldOut() {
      return this.stock <= 0;
    },
    imgSrc() {
      return this.$img(this.product.img);
    }
  },
  methods: {
    addOrder() {
      if (this.soldOut) return;
      this.$emit("addOrder", this.product);
    }
  }
};
</script>

<style scoped>
.prod-card {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  background: #fff;
}
.prod-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.16) !important;
}
.prod-out {
  filter: grayscale(0.9);
  opacity: 0.7;
}
.prod-img-wrap {
  position: relative;
}
.prod-stock {
  position: absolute;
  top: 8px;
  left: 8px;
  font-weight: 600;
}
.prod-add {
  position: absolute;
  bottom: -14px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #39b54a;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 8px rgba(57, 181, 74, 0.5);
}
.prod-name {
  font-size: 0.95rem;
  color: #1d1d1d;
  margin-top: 6px;
}
.prod-price {
  color: #39b54a;
  font-size: 1.15rem;
}
</style>
