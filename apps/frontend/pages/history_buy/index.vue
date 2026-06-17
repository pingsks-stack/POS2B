<template>
  <div class="" style="height: 100%">
    <v-card class="py-5 px-5" style="height: 100%;" color="secondary">
      <v-row>
        <v-col cols="12" xs="12" sm="12" md="3">
          <MenuProfile />
        </v-col>

        <v-col xs="12" sm="12" md="9" class="">
          <v-card class="px-6 py-5 mb-5">
            <div class="text-center">
              <h2 class="">รายการประวัติการสั่งซื้อ</h2>
              <v-divider class="mt-3 mb-2"></v-divider>
            </div>
            <v-data-table :headers="headers" :items="rows" :items-per-page="10" class="mb-n5">
              <template v-slot:[`item.typeOrder`]="{ item }">{{ typeName(item.typeOrder) }}</template>
              <template v-slot:[`item.datetime`]="{ item }">{{ formatDate(item.datetime) }}</template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>

<script>
import MenuProfile from "~/components/memberLayout/MenuProfile";
export default {
  layout: "layoutMember",
  async asyncData(context) {
    const orders = await context.$axios.$get("/order");
    return { orders };
  },
  data() {
    return {
      orders: [],
      headers: [
        { text: "หมายเลขบิล", align: "start", sortable: false, value: "orderid" },
        { text: "วันที่", value: "datetime" },
        { text: "ประเภทรายการ", value: "typeOrder" },
        { text: "ส่วนลด", value: "discount" },
        { text: "ยอดสุทธิ", value: "total_amout" }
      ]
    };
  },
  computed: {
    rows() {
      return (this.orders || []).map(o => ({
        orderid: o.bill_name || o._id,
        datetime: o.datetime,
        typeOrder: o.type_order,
        discount: o.discount || 0,
        total_amout: o.total_price
      }));
    }
  },
  methods: {
    typeName(t) {
      return t === "2" ? "กลับบ้าน" : t === "3" ? "เดลิเวอรี" : "ทานที่ร้าน";
    },
    formatDate(d) {
      return d ? new Date(d).toLocaleString("th-TH") : "";
    }
  },
  components: {
    MenuProfile
  }
};
</script>

<style>
.text-plus { color: green; font-size: 14px; }
.text-minus { color: red; font-size: 14px; }
</style>
