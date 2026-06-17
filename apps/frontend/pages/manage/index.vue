<template>
  <div class="pa-5">
    <div class="d-flex align-center mb-4 flex-wrap">
      <div>
        <h1 class="dash-title">แดชบอร์ดผู้ดูแล</h1>
        <div class="grey--text">ภาพรวมร้าน · {{ today }}</div>
      </div>
      <v-spacer></v-spacer>
      <v-btn color="primary" outlined @click="reload" :loading="loading">
        <v-icon left>mdi-refresh</v-icon>รีเฟรช
      </v-btn>
    </div>

    <!-- KPI cards -->
    <v-row>
      <v-col cols="12" sm="6" md="3">
        <v-card class="kpi rounded-xl pa-4">
          <div class="d-flex justify-space-between align-start">
            <div>
              <div class="grey--text text-caption">ยอดขายรวม (ชำระแล้ว)</div>
              <div class="text-h4 font-weight-bold primary--text">{{ money(totalRevenue) }}</div>
            </div>
            <v-avatar color="green lighten-5" size="44"><v-icon color="primary">mdi-cash-multiple</v-icon></v-avatar>
          </div>
          <div class="text-caption grey--text mt-1">วันนี้ {{ money(todayRevenue) }} ฿</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="kpi rounded-xl pa-4">
          <div class="d-flex justify-space-between align-start">
            <div>
              <div class="grey--text text-caption">จำนวนบิล</div>
              <div class="text-h4 font-weight-bold">{{ billCount }}</div>
            </div>
            <v-avatar color="blue lighten-5" size="44"><v-icon color="blue darken-1">mdi-receipt-text-outline</v-icon></v-avatar>
          </div>
          <div class="text-caption grey--text mt-1">เฉลี่ย {{ money(avgPerBill) }} ฿/บิล</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="kpi rounded-xl pa-4">
          <div class="d-flex justify-space-between align-start">
            <div>
              <div class="grey--text text-caption">สมาชิก</div>
              <div class="text-h4 font-weight-bold">{{ customers.length }}</div>
            </div>
            <v-avatar color="amber lighten-5" size="44"><v-icon color="amber darken-2">mdi-account-group</v-icon></v-avatar>
          </div>
          <div class="text-caption grey--text mt-1">แต้มสะสมรวม {{ totalPoints }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="kpi rounded-xl pa-4">
          <div class="d-flex justify-space-between align-start">
            <div>
              <div class="grey--text text-caption">สินค้า</div>
              <div class="text-h4 font-weight-bold">{{ products.length }}</div>
            </div>
            <v-avatar color="red lighten-5" size="44"><v-icon color="red">mdi-coffee</v-icon></v-avatar>
          </div>
          <div class="text-caption mt-1" :class="lowStock.length ? 'red--text' : 'grey--text'">
            สต็อกใกล้หมด {{ lowStock.length }} รายการ
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <!-- top products -->
      <v-col cols="12" md="7">
        <v-card class="rounded-xl fill-height">
          <v-card-title>🔥 สินค้าขายดี</v-card-title>
          <v-divider></v-divider>
          <v-list v-if="topProducts.length">
            <v-list-item v-for="(p, i) in topProducts" :key="i">
              <v-avatar size="30" :color="rankColor(i)" class="mr-3 white--text font-weight-bold" style="font-size:.8rem">
                {{ i + 1 }}
              </v-avatar>
              <v-list-item-content>
                <v-list-item-title>{{ p.name }}</v-list-item-title>
                <v-progress-linear :value="(p.qty / topProducts[0].qty) * 100" color="primary" height="6" rounded class="mt-1"></v-progress-linear>
              </v-list-item-content>
              <v-list-item-action class="text-right">
                <div class="font-weight-bold">{{ p.qty }} แก้ว/ชิ้น</div>
                <div class="text-caption grey--text">{{ money(p.revenue) }} ฿</div>
              </v-list-item-action>
            </v-list-item>
          </v-list>
          <div v-else class="pa-8 text-center grey--text">ยังไม่มียอดขาย</div>
        </v-card>
      </v-col>

      <!-- payment methods -->
      <v-col cols="12" md="5">
        <v-card class="rounded-xl fill-height">
          <v-card-title>วิธีการชำระเงิน</v-card-title>
          <v-divider></v-divider>
          <div class="pa-4">
            <div v-for="m in paymentBreakdown" :key="m.key" class="mb-3">
              <div class="d-flex justify-space-between mb-1">
                <span><v-icon small left :color="m.color">{{ m.icon }}</v-icon>{{ m.label }}</span>
                <span class="font-weight-bold">{{ money(m.amount) }} ฿</span>
              </div>
              <v-progress-linear :value="totalRevenue ? (m.amount / totalRevenue) * 100 : 0" :color="m.color" height="8" rounded></v-progress-linear>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- system info: full-width symmetric strip -->
    <v-row>
      <v-col cols="12">
        <v-card class="rounded-xl">
          <v-card-title>ข้อมูลระบบ</v-card-title>
          <v-divider></v-divider>
          <v-row class="pa-4" dense>
            <v-col cols="6" sm="3" v-for="c in systemCounts" :key="c.label">
              <div class="d-flex align-center">
                <v-avatar size="40" :color="$vuetify.theme.dark ? 'grey darken-3' : 'grey lighten-4'" class="mr-3">
                  <v-icon color="grey darken-1">{{ c.icon }}</v-icon>
                </v-avatar>
                <div>
                  <div class="text-h6 font-weight-bold">{{ c.value }}</div>
                  <div class="text-caption grey--text">{{ c.label }}</div>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <!-- low stock -->
      <v-col cols="12" md="5">
        <v-card class="rounded-xl fill-height">
          <v-card-title>
            <v-icon left color="warning">mdi-alert-outline</v-icon>สต็อกใกล้หมด
          </v-card-title>
          <v-divider></v-divider>
          <v-list v-if="lowStock.length" dense>
            <v-list-item v-for="p in lowStock" :key="p._id" :to="'/manage/stock'">
              <v-list-item-content><v-list-item-title>{{ p.product_name }}</v-list-item-title></v-list-item-content>
              <v-list-item-action>
                <v-chip small :color="p.stock === 0 ? 'red' : 'orange'" dark>เหลือ {{ p.stock }}</v-chip>
              </v-list-item-action>
            </v-list-item>
          </v-list>
          <div v-else class="pa-8 text-center grey--text">สต็อกปกติทุกรายการ ✅</div>
        </v-card>
      </v-col>

      <!-- recent orders -->
      <v-col cols="12" md="7">
        <v-card class="rounded-xl fill-height">
          <v-card-title>ออเดอร์ล่าสุด</v-card-title>
          <v-divider></v-divider>
          <v-data-table
            :headers="orderHeaders" :items="recentOrders" :items-per-page="6"
            :footer-props="{ 'items-per-page-options': [6, 10, 20] }"
          >
            <template v-slot:[`item.datetime`]="{ item }">{{ shortDate(item.datetime) }}</template>
            <template v-slot:[`item.payment_method`]="{ item }">{{ payName(item.payment_method) }}</template>
            <template v-slot:[`item.total_price`]="{ item }">{{ money(item.total_price) }} ฿</template>
            <template v-slot:[`item.status`]="{ item }">
              <v-chip x-small :color="String(item.status) === '1' ? 'success' : 'grey'" dark>
                {{ String(item.status) === '1' ? 'ชำระแล้ว' : 'พักบิล' }}
              </v-chip>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
export default {
  middleware: ["auth", "check"],
  async asyncData(context) {
    const [orders, products, customers, employees, coupons] = await Promise.all([
      context.$axios.$get("/order"),
      context.$axios.$get("/product"),
      context.$axios.$get("/customer"),
      context.$axios.$get("/employee"),
      context.$axios.$get("/coupon")
    ]);
    return { orders, products, customers, employees, coupons };
  },
  data: () => ({
    orders: [],
    products: [],
    customers: [],
    employees: [],
    coupons: [],
    loading: false,
    orderHeaders: [
      { text: "บิล", value: "bill_name" },
      { text: "เวลา", value: "datetime" },
      { text: "ชำระ", value: "payment_method" },
      { text: "ยอด", value: "total_price" },
      { text: "สถานะ", value: "status" }
    ]
  }),
  computed: {
    today() {
      return new Date().toLocaleDateString("th-TH", { dateStyle: "long" });
    },
    paidOrders() {
      return (this.orders || []).filter(o => String(o.status) === "1");
    },
    totalRevenue() {
      return this.paidOrders.reduce((s, o) => s + (Number(o.total_price) || 0), 0);
    },
    todayRevenue() {
      const d = new Date().toDateString();
      return this.paidOrders
        .filter(o => new Date(o.datetime).toDateString() === d)
        .reduce((s, o) => s + (Number(o.total_price) || 0), 0);
    },
    billCount() {
      return this.paidOrders.length;
    },
    avgPerBill() {
      return this.billCount ? Math.round(this.totalRevenue / this.billCount) : 0;
    },
    totalPoints() {
      return (this.customers || []).reduce((s, c) => s + (Number(c.point) || 0), 0);
    },
    lowStock() {
      return (this.products || [])
        .filter(p => (Number(p.stock) || 0) <= 10)
        .sort((a, b) => (a.stock || 0) - (b.stock || 0));
    },
    topProducts() {
      const map = {};
      this.paidOrders.forEach(o => {
        (o.list_product || []).forEach(l => {
          if (!map[l.name]) map[l.name] = { name: l.name, qty: 0, revenue: 0 };
          map[l.name].qty += Number(l.qty) || 0;
          map[l.name].revenue += Number(l.price) || 0;
        });
      });
      return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 5);
    },
    paymentBreakdown() {
      const sum = m => this.paidOrders
        .filter(o => (o.payment_method || "cash") === m)
        .reduce((s, o) => s + (Number(o.total_price) || 0), 0);
      return [
        { key: "cash", label: "เงินสด", icon: "mdi-cash", color: "green", amount: sum("cash") },
        { key: "qr", label: "QR พร้อมเพย์", icon: "mdi-qrcode", color: "blue", amount: sum("qr") },
        { key: "transfer", label: "โอนเงิน", icon: "mdi-bank", color: "purple", amount: sum("transfer") }
      ];
    },
    systemCounts() {
      return [
        { label: "สินค้า", value: this.products.length, icon: "mdi-coffee" },
        { label: "สมาชิก", value: this.customers.length, icon: "mdi-account-group" },
        { label: "พนักงาน", value: this.employees.length, icon: "mdi-badge-account" },
        { label: "คูปอง", value: this.coupons.length, icon: "mdi-ticket-percent" }
      ];
    },
    recentOrders() {
      return [...(this.orders || [])]
        .sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
    }
  },
  methods: {
    async reload() {
      this.loading = true;
      try {
        const [orders, products, customers, employees, coupons] = await Promise.all([
          this.$axios.$get("/order"),
          this.$axios.$get("/product"),
          this.$axios.$get("/customer"),
          this.$axios.$get("/employee"),
          this.$axios.$get("/coupon")
        ]);
        this.orders = orders;
        this.products = products;
        this.customers = customers;
        this.employees = employees;
        this.coupons = coupons;
      } catch (e) {
        console.log(e);
      } finally {
        this.loading = false;
      }
    },
    money(v) {
      return (Number(v) || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    shortDate(d) {
      return d ? new Date(d).toLocaleString("th-TH", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
    },
    payName(m) {
      return m === "qr" ? "QR" : m === "transfer" ? "โอน" : "เงินสด";
    },
    rankColor(i) {
      return ["amber darken-2", "blue-grey", "brown lighten-1", "grey", "grey"][i] || "grey";
    }
  }
};
</script>

<style scoped>
.dash-title { font-family: "Mitr", sans-serif; font-weight: 600; font-size: 1.6rem; color: #1d1d1d; }
.kpi { border: 1px solid #eef0f2; height: 100%; }
.theme--dark .dash-title { color: #f1f3f5; }
.theme--dark .kpi { border-color: #2a2e35; }
</style>
