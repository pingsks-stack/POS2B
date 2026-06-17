<template>
  <div class="pa-5">
    <h1 class="r-title mb-1"><v-icon left large color="primary">mdi-receipt-text-outline</v-icon> ดูสลิปย้อนหลัง</h1>
    <div class="grey--text mb-4">เรียกดูบิลเก่า · พิมพ์ซ้ำได้ทั้ง 58mm / 80mm / A4</div>

    <v-row class="mb-1">
      <v-col cols="6" md="3"><v-card class="rounded-xl pa-4 fill-height"><div class="grey--text text-caption">ยอดขาย (ชำระแล้ว)</div><div class="text-h5 font-weight-bold primary--text">{{ money(sumPaid) }} ฿</div></v-card></v-col>
      <v-col cols="6" md="3"><v-card class="rounded-xl pa-4 fill-height"><div class="grey--text text-caption">บิลทั้งหมด</div><div class="text-h5 font-weight-bold">{{ orders.length }}</div></v-card></v-col>
      <v-col cols="6" md="3"><v-card class="rounded-xl pa-4 fill-height"><div class="grey--text text-caption">เงินเชื่อค้างชำระ</div><div class="text-h5 font-weight-bold deep-orange--text">{{ countStatus('3') }}</div></v-card></v-col>
      <v-col cols="6" md="3"><v-card class="rounded-xl pa-4 fill-height"><div class="grey--text text-caption">ยกเลิกแล้ว</div><div class="text-h5 font-weight-bold red--text">{{ countStatus('2') }}</div></v-card></v-col>
    </v-row>

    <v-card class="rounded-xl">
      <v-card-title>
        <v-text-field v-model="search" append-icon="mdi-magnify" label="ค้นหา (ชื่อบิล/คิว)"
          single-line hide-details></v-text-field>
      </v-card-title>
      <v-divider></v-divider>
      <div class="d-flex px-4 pt-3">
        <v-spacer></v-spacer>
        <v-select v-model="statusFilter" :items="statusOptions" label="กรองสถานะ" dense outlined hide-details
          prepend-inner-icon="mdi-filter-variant" style="max-width: 200px"></v-select>
      </div>
      <v-data-table :headers="headers" :items="filteredRows" :search="search" :items-per-page="12"
        :sort-by="['datetime']" :sort-desc="[true]">
        <template v-slot:[`item.datetime`]="{ item }">{{ fmt(item.datetime) }}</template>
        <template v-slot:[`item.payment_method`]="{ item }">{{ payName(item.payment_method) }}</template>
        <template v-slot:[`item.total_price`]="{ item }">{{ money(item.total_price) }} ฿</template>
        <template v-slot:[`item.status`]="{ item }">
          <v-chip x-small dark :color="statusColor(item.status)">{{ statusName(item.status) }}</v-chip>
        </template>
        <template v-slot:[`item.action`]="{ item }">
          <v-btn small color="primary" @click="openSlip(item)"><v-icon left small>mdi-eye</v-icon>ดูสลิป</v-btn>
          <v-btn v-if="String(item.status) === '3'" small color="success" class="ml-2" @click="settle(item)">
            <v-icon left small>mdi-cash-check</v-icon>ชำระเงิน
          </v-btn>
          <v-btn v-if="String(item.status) === '1'" small color="error" outlined class="ml-2" @click="askVoid(item)">
            <v-icon left small>mdi-cancel</v-icon>ยกเลิก
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- void confirm -->
    <v-dialog v-model="voidDl" max-width="420">
      <v-card v-if="voidTarget">
        <v-card-title class="error white--text">ยกเลิก/คืนเงินบิล</v-card-title>
        <v-card-text class="pt-4">
          <div>บิล: <b>{{ voidTarget.bill_name }}</b> · ยอด {{ money(voidTarget.total_price) }} ฿</div>
          <div class="grey--text text-caption mb-2">ระบบจะคืนสต็อก, หักแต้มที่ได้รับ, คืนสิทธิ์คูปอง</div>
          <v-text-field outlined dense label="เหตุผล (ไม่บังคับ)" v-model="voidReason"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-btn text @click="voidDl = false">ปิด</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="error" :loading="voiding" @click="confirmVoid">
            <v-icon left>mdi-cancel</v-icon>ยืนยันยกเลิกบิล
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- slip viewer -->
    <v-dialog v-model="dialog" max-width="760">
      <v-card v-if="selected">
        <v-card-title>
          สลิปบิล: {{ selected.bill_name }}
          <v-spacer></v-spacer>
          <v-btn-toggle v-model="paper" mandatory dense color="primary" @change="renderPreview">
            <v-btn value="58">58mm</v-btn>
            <v-btn value="80">80mm</v-btn>
            <v-btn value="A4">A4</v-btn>
          </v-btn-toggle>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="text-center" style="background:#eceef1; max-height:65vh; overflow:auto">
          <iframe ref="frame" class="slip-frame" :class="paper === 'A4' ? 'a4' : 'slip'"></iframe>
        </v-card-text>
        <v-card-actions>
          <v-btn text @click="dialog = false">ปิด</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="printNow">
            <v-icon left>mdi-printer</v-icon>พิมพ์ {{ paper === 'A4' ? 'A4' : paper + 'mm' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :timeout="2500" color="success" top>{{ snackText }}</v-snackbar>
  </div>
</template>

<script>
export default {
  middleware: ["auth", "check"],
  async asyncData(context) {
    const [orders, customers, settings] = await Promise.all([
      context.$axios.$get("/order"),
      context.$axios.$get("/customer"),
      context.$axios.$get("/settings")
    ]);
    return { orders, customers, settings };
  },
  data: () => ({
    orders: [],
    customers: [],
    settings: {},
    search: "",
    statusFilter: "all",
    statusOptions: [
      { text: "ทั้งหมด", value: "all" },
      { text: "ชำระแล้ว", value: "1" },
      { text: "เงินเชื่อ", value: "3" },
      { text: "พักบิล", value: "0" },
      { text: "ยกเลิกแล้ว", value: "2" }
    ],
    dialog: false,
    paper: "80",
    selected: null,
    voidDl: false,
    voidTarget: null,
    voidReason: "",
    voiding: false,
    snackbar: false,
    snackText: "",
    headers: [
      { text: "ชื่อบิล", value: "bill_name" },
      { text: "คิว", value: "queue_no" },
      { text: "เวลา", value: "datetime" },
      { text: "รายการ", value: "count" },
      { text: "ยอดสุทธิ", value: "total_price" },
      { text: "ชำระ", value: "payment_method" },
      { text: "สถานะ", value: "status" },
      { text: "", value: "action", sortable: false }
    ]
  }),
  computed: {
    imgBase() {
      return this.$axios.defaults.baseURL.replace("/api", "/");
    },
    rows() {
      return (this.orders || []).map(o => ({ ...o, count: (o.list_product || []).length }));
    },
    filteredRows() {
      if (this.statusFilter === "all") return this.rows;
      return this.rows.filter(o => String(o.status) === this.statusFilter);
    },
    sumPaid() {
      return (this.orders || [])
        .filter(o => String(o.status) === "1")
        .reduce((s, o) => s + (Number(o.total_price) || 0), 0);
    }
  },
  methods: {
    money(v) {
      return (Number(v) || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    countStatus(s) {
      return (this.orders || []).filter(o => String(o.status) === s).length;
    },
    statusName(s) {
      s = String(s);
      return s === "1" ? "ชำระแล้ว" : s === "2" ? "ยกเลิกแล้ว" : s === "3" ? "เงินเชื่อ" : "พักบิล";
    },
    statusColor(s) {
      s = String(s);
      return s === "1" ? "success" : s === "2" ? "error" : s === "3" ? "deep-orange" : "grey";
    },
    async settle(item) {
      try {
        await this.$axios.$post("/order/" + item._id + "/settle", { payment_method: "cash" });
        this.orders = await this.$axios.$get("/order");
        this.snackText = "ชำระบิลเงินเชื่อแล้ว";
        this.snackbar = true;
      } catch (e) {
        this.snackText = (e.response && e.response.data && e.response.data.message) || "ชำระไม่สำเร็จ";
        this.snackbar = true;
      }
    },
    askVoid(item) {
      this.voidTarget = item;
      this.voidReason = "";
      this.voidDl = true;
    },
    async confirmVoid() {
      this.voiding = true;
      try {
        await this.$axios.$post("/order/" + this.voidTarget._id + "/void", { reason: this.voidReason });
        this.orders = await this.$axios.$get("/order");
        this.voidDl = false;
        this.snackText = "ยกเลิกบิลแล้ว (คืนสต็อก/แต้ม/คูปอง)";
        this.snackbar = true;
      } catch (e) {
        this.snackText = (e.response && e.response.data && e.response.data.message) || "ยกเลิกไม่สำเร็จ";
        this.snackbar = true;
      } finally {
        this.voiding = false;
      }
    },
    fmt(d) {
      return d ? new Date(d).toLocaleString("th-TH") : "";
    },
    payName(m) {
      return m === "qr" ? "QR" : m === "transfer" ? "โอน" : "เงินสด";
    },
    printSettings() {
      return { ...this.settings, logoUrl: this.$img(this.settings.logo) };
    },
    async buildReceipt(order) {
      const c = this.customers.find(x => x._id === order.customer_ref);
      const discount = Number(order.discount) || 0;
      const pointsUsed = Number(order.points_used) || 0;
      const total = Number(order.total_price) || 0;
      const r = {
        bill_name: order.bill_name,
        datetime: order.datetime,
        queue_no: order.queue_no,
        memberName: c ? ((c.fname || "") + " " + (c.lname || "")).trim() : "",
        list_product: order.list_product || [],
        subTotal: total + discount + pointsUsed,
        discount,
        pointsUsed,
        total_price: total,
        paymentMethod: order.payment_method || "cash",
        cash: Number(order.cash_received) || 0,
        change: Number(order.change) || 0,
        earnedPoints: order.earnedPoints || 0,
        qrImage: ""
      };
      if (this.$pp && this.settings.promptpay_id) {
        try {
          r.qrImage = await this.$pp.qr(this.settings.promptpay_id, total);
        } catch (e) {}
      }
      return r;
    },
    async openSlip(order) {
      this.selected = await this.buildReceipt(order);
      this.paper = "80";
      this.dialog = true;
      this.$nextTick(() => this.renderPreview());
    },
    renderPreview() {
      const f = this.$refs.frame;
      if (!f || !this.selected || !this.$printer) return;
      f.srcdoc = this.$printer.buildHtml(this.selected, this.printSettings(), { paper: this.paper });
    },
    async printNow() {
      try {
        await this.$printer.print(this.selected, this.printSettings(), {
          paper: this.paper,
          forceBrowser: true
        });
      } catch (e) {
        console.log(e);
      }
    }
  }
};
</script>

<style scoped>
.r-title { font-family: "Mitr", sans-serif; font-weight: 600; color: #1d1d1d; }
.theme--dark .r-title { color: #f1f3f5; }
.slip-frame { border: 0; background: #fff; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12); }
.slip-frame.slip { width: 320px; height: 60vh; }
.slip-frame.a4 { width: 100%; height: 60vh; }
</style>
