<template>
  <div class="pa-5">
    <div class="d-flex align-center mb-4 flex-wrap">
      <div>
        <h1 class="rp-title"><v-icon left large color="primary">mdi-chart-box-outline</v-icon> รายงานยอดขาย</h1>
        <div class="grey--text">สรุปยอดขาย กำไร และส่งออกข้อมูล</div>
      </div>
      <v-spacer></v-spacer>
      <v-text-field type="date" outlined dense label="จากวันที่" v-model="from" hide-details class="mr-2" style="max-width:170px"></v-text-field>
      <v-text-field type="date" outlined dense label="ถึงวันที่" v-model="to" hide-details class="mr-2" style="max-width:170px"></v-text-field>
      <v-btn color="success" outlined @click="exportCsv"><v-icon left>mdi-file-delimited-outline</v-icon>Export CSV</v-btn>
    </div>

    <v-row>
      <v-col cols="6" md="3"><v-card class="rounded-xl pa-4 fill-height"><div class="grey--text text-caption">ยอดขาย (ชำระแล้ว)</div><div class="text-h4 font-weight-bold primary--text">{{ money(revenue) }}</div></v-card></v-col>
      <v-col cols="6" md="3"><v-card class="rounded-xl pa-4 fill-height"><div class="grey--text text-caption">กำไรขั้นต้น</div><div class="text-h4 font-weight-bold green--text">{{ money(profit) }}</div><div class="text-caption grey--text">ทุน {{ money(cost) }}</div></v-card></v-col>
      <v-col cols="6" md="3"><v-card class="rounded-xl pa-4 fill-height"><div class="grey--text text-caption">จำนวนบิล</div><div class="text-h4 font-weight-bold">{{ paid.length }}</div></v-card></v-col>
      <v-col cols="6" md="3"><v-card class="rounded-xl pa-4 fill-height"><div class="grey--text text-caption">เฉลี่ย/บิล</div><div class="text-h4 font-weight-bold">{{ money(avg) }}</div></v-card></v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="4">
        <v-card class="rounded-xl"><v-card-title>ตามวิธีชำระเงิน</v-card-title><v-divider></v-divider>
          <v-list dense>
            <v-list-item v-for="b in byPayment" :key="b.key">
              <v-list-item-content>{{ b.label }}</v-list-item-content>
              <v-list-item-action class="font-weight-bold">{{ money(b.amount) }} ฿</v-list-item-action>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="rounded-xl"><v-card-title>ตามหมวดหมู่</v-card-title><v-divider></v-divider>
          <v-list dense>
            <v-list-item v-for="c in byCategory" :key="c.name">
              <v-list-item-content>{{ c.name }}</v-list-item-content>
              <v-list-item-action class="font-weight-bold">{{ money(c.amount) }} ฿</v-list-item-action>
            </v-list-item>
            <v-list-item v-if="!byCategory.length"><span class="grey--text">ไม่มีข้อมูล</span></v-list-item>
          </v-list>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="rounded-xl"><v-card-title>ตามพนักงาน</v-card-title><v-divider></v-divider>
          <v-list dense>
            <v-list-item v-for="e in byEmployee" :key="e.name">
              <v-list-item-content>{{ e.name }}</v-list-item-content>
              <v-list-item-action class="font-weight-bold">{{ money(e.amount) }} ฿ · {{ e.bills }} บิล</v-list-item-action>
            </v-list-item>
            <v-list-item v-if="!byEmployee.length"><span class="grey--text">ไม่มีข้อมูล</span></v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="7">
        <v-card class="rounded-xl"><v-card-title>สินค้าขายดี</v-card-title><v-divider></v-divider>
          <v-data-table :headers="prodHeaders" :items="topProducts" :items-per-page="8" dense></v-data-table>
        </v-card>
      </v-col>
      <v-col cols="12" md="5">
        <v-card class="rounded-xl"><v-card-title>ยอดขายตามช่วงเวลา</v-card-title><v-divider></v-divider>
          <div class="pa-4">
            <div v-for="h in byHour" :key="h.hour" class="mb-2">
              <div class="d-flex justify-space-between text-caption"><span>{{ h.hour }}:00</span><span>{{ money(h.amount) }} ฿</span></div>
              <v-progress-linear :value="maxHour ? (h.amount / maxHour) * 100 : 0" color="primary" height="6" rounded></v-progress-linear>
            </div>
            <div v-if="!byHour.length" class="grey--text">ไม่มีข้อมูล</div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar" :timeout="2500" color="success" top>{{ snackText }}</v-snackbar>
  </div>
</template>

<script>
export default {
  middleware: ["auth", "check"],
  async asyncData(context) {
    const [orders, products, categories, employees, settings] = await Promise.all([
      context.$axios.$get("/order"),
      context.$axios.$get("/product"),
      context.$axios.$get("/category"),
      context.$axios.$get("/employee"),
      context.$axios.$get("/settings")
    ]);
    return { orders, products, categories, employees, settings };
  },
  data() {
    const t = new Date();
    const first = new Date(t.getFullYear(), t.getMonth(), 1);
    // use LOCAL date parts (not toISOString/UTC) so "today" matches local orders
    const iso = d => {
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${d.getFullYear()}-${m}-${day}`;
    };
    return {
      orders: [], products: [], categories: [], employees: [], settings: {},
      from: iso(first), to: iso(t),
      snackbar: false, snackText: "",
      prodHeaders: [
        { text: "สินค้า", value: "name" },
        { text: "จำนวน", value: "qty" },
        { text: "ยอดขาย", value: "amount" }
      ]
    };
  },
  computed: {
    paid() {
      const f = new Date(this.from + "T00:00:00").getTime();
      const t = new Date(this.to + "T23:59:59").getTime();
      return (this.orders || []).filter(o => {
        if (String(o.status) !== "1") return false;
        const d = new Date(o.datetime).getTime();
        return d >= f && d <= t;
      });
    },
    revenue() {
      return this.paid.reduce((s, o) => s + (Number(o.total_price) || 0), 0);
    },
    cost() {
      let c = 0;
      this.paid.forEach(o => (o.list_product || []).forEach(l => {
        const p = this.products.find(x => x._id === l.ref_pro_id);
        if (p) c += (Number(p.price_cost) || 0) * (l.qty || 0);
      }));
      return c;
    },
    profit() { return this.revenue - this.cost; },
    avg() { return this.paid.length ? this.revenue / this.paid.length : 0; },
    payLabels() {
      const map = {};
      ((this.settings && this.settings.payment_methods) || []).forEach(m => { map[m.key] = m.label; });
      return map;
    },
    byPayment() {
      const totals = {};
      this.paid.forEach(o => {
        if (Array.isArray(o.payments) && o.payments.length) {
          o.payments.forEach(p => { totals[p.method] = (totals[p.method] || 0) + (Number(p.amount) || 0); });
        } else {
          const m = o.payment_method || "cash";
          totals[m] = (totals[m] || 0) + (Number(o.total_price) || 0);
        }
      });
      if (totals.cash === undefined) totals.cash = 0;
      return Object.keys(totals)
        .map(k => ({ key: k, label: this.payLabels[k] || k, amount: totals[k] }))
        .filter(x => x.amount > 0 || x.key === "cash")
        .sort((a, b) => b.amount - a.amount);
    },
    byCategory() {
      const map = {};
      this.paid.forEach(o => (o.list_product || []).forEach(l => {
        const p = this.products.find(x => x._id === l.ref_pro_id);
        const cat = p && p.ref_cate_id && p.ref_cate_id.cate_name ? p.ref_cate_id.cate_name : "อื่นๆ";
        map[cat] = (map[cat] || 0) + (Number(l.price) || 0);
      }));
      return Object.keys(map).map(k => ({ name: k, amount: map[k] })).sort((a, b) => b.amount - a.amount);
    },
    byEmployee() {
      const map = {};
      this.paid.forEach(o => {
        const e = this.employees.find(x => x._id === o.ref_emp_id);
        const name = e ? ((e.fname || "") + " " + (e.lname || "")).trim() : "ไม่ระบุ";
        if (!map[name]) map[name] = { amount: 0, bills: 0 };
        map[name].amount += Number(o.total_price) || 0;
        map[name].bills++;
      });
      return Object.keys(map).map(k => ({ name: k, amount: map[k].amount, bills: map[k].bills })).sort((a, b) => b.amount - a.amount);
    },
    topProducts() {
      const map = {};
      this.paid.forEach(o => (o.list_product || []).forEach(l => {
        if (!map[l.name]) map[l.name] = { name: l.name, qty: 0, amount: 0 };
        map[l.name].qty += Number(l.qty) || 0;
        map[l.name].amount += Number(l.price) || 0;
      }));
      return Object.values(map).map(x => ({ ...x, amount: this.money(x.amount) })).sort((a, b) => b.qty - a.qty);
    },
    byHour() {
      const map = {};
      this.paid.forEach(o => {
        const h = new Date(o.datetime).getHours();
        map[h] = (map[h] || 0) + (Number(o.total_price) || 0);
      });
      return Object.keys(map).map(h => ({ hour: ("0" + h).slice(-2), amount: map[h] })).sort((a, b) => a.hour.localeCompare(b.hour));
    },
    maxHour() { return Math.max(0, ...this.byHour.map(h => h.amount)); }
  },
  methods: {
    money(v) { return (Number(v) || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","); },
    exportCsv() {
      const rows = [["เลขที่บิล", "วันที่", "จำนวนรายการ", "วิธีชำระ", "ยอดสุทธิ"]];
      this.paid.forEach(o => rows.push([
        o.bill_name || o._id,
        new Date(o.datetime).toLocaleString("th-TH"),
        (o.list_product || []).length,
        o.payment_method || "cash",
        Number(o.total_price) || 0
      ]));
      rows.push([]);
      rows.push(["ยอดขายรวม", "", "", "", this.revenue.toFixed(2)]);
      rows.push(["กำไรขั้นต้น", "", "", "", this.profit.toFixed(2)]);
      const csv = "﻿" + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sales_${this.from}_${this.to}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      this.snackText = "ส่งออก CSV แล้ว";
      this.snackbar = true;
    }
  }
};
</script>

<style scoped>
.rp-title { font-family: "Mitr", sans-serif; font-weight: 600; color: #1d1d1d; }
</style>
