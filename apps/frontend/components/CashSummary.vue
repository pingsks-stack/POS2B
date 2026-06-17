<template>
  <div class="ma-3">
    <div class="d-flex align-center mb-4 flex-wrap">
      <h2><v-icon left>mdi-cash-register</v-icon> เงินสด / รอบขาย</h2>
      <v-spacer></v-spacer>
      <v-btn small outlined color="primary" @click="load"><v-icon left small>mdi-refresh</v-icon>รีเฟรช</v-btn>
    </div>

    <!-- SHIFT CONTROL -->
    <v-card class="rounded-xl mb-5 pa-4" :color="shift ? (darkUi ? 'green darken-4' : 'green lighten-5') : (darkUi ? 'grey darken-3' : 'grey lighten-4')" elevation="1">
      <div v-if="!shift" class="d-flex align-center flex-wrap">
        <v-icon large color="grey" class="mr-3">mdi-cash-lock</v-icon>
        <div class="flex-grow-1">
          <div class="text-h6">ยังไม่ได้เปิดรอบขาย</div>
          <div class="grey--text">เปิดรอบขายเพื่อเริ่มบันทึกเงินสดในลิ้นชัก</div>
        </div>
        <v-btn color="primary" large @click="openDl = true">
          <v-icon left>mdi-cash-plus</v-icon>เปิดรอบขาย
        </v-btn>
      </div>
      <div v-else>
        <div class="d-flex align-center flex-wrap">
          <v-icon large color="green darken-1" class="mr-3">mdi-cash-clock</v-icon>
          <div class="flex-grow-1">
            <div class="text-h6 green--text text--darken-2">รอบขายเปิดอยู่</div>
            <div class="grey--text text--darken-1">
              เปิดเมื่อ {{ formatDate(shift.open_time) }} · เงินตั้งต้น {{ formatPrice(shift.opening_cash) }} ฿
            </div>
          </div>
          <v-btn color="success" outlined class="mr-2 mb-1" @click="openMove('in')"><v-icon left>mdi-cash-plus</v-icon>เงินเข้า</v-btn>
          <v-btn color="orange" outlined class="mr-2 mb-1" @click="openMove('out')"><v-icon left>mdi-cash-minus</v-icon>เงินออก</v-btn>
          <v-btn color="error" large class="mb-1" @click="openCloseDialog">
            <v-icon left>mdi-cash-lock-open</v-icon>ปิดรอบขาย
          </v-btn>
        </div>
        <v-row class="mt-2">
          <v-col cols="6" md="2"><div class="grey--text">ยอดขายในรอบ</div><div class="text-h6">{{ formatPrice(shift.report.sales_total) }} ฿</div></v-col>
          <v-col cols="6" md="2"><div class="grey--text">บิล</div><div class="text-h6">{{ shift.report.bill_count }}</div></v-col>
          <v-col cols="6" md="2"><div class="grey--text">เงินสดในรอบ</div><div class="text-h6">{{ formatPrice(shift.report.sales_cash) }} ฿</div></v-col>
          <v-col cols="6" md="2"><div class="grey--text">เงินเข้า/ออก</div><div class="text-h6 text-body-1">+{{ formatPrice(shift.report.cash_in) }} / -{{ formatPrice(shift.report.cash_out) }}</div></v-col>
          <v-col cols="6" md="2"><div class="grey--text">เงินในลิ้นชัก(คาดหวัง)</div><div class="text-h6">{{ formatPrice(shift.report.expected_cash) }} ฿</div></v-col>
          <v-col cols="6" md="2"><div class="grey--text">ระยะเวลา</div><div class="text-h6 text-body-1">{{ shiftDuration }}</div></v-col>
        </v-row>
      </div>
    </v-card>

    <!-- DAILY TOTALS -->
    <v-row>
      <v-col cols="6" md="3">
        <v-card color="success" dark class="rounded-xl pa-4 fill-height">
          <div class="text-subtitle-2">ยอดขายรวม (ชำระแล้ว)</div>
          <div class="text-h4 font-weight-bold">{{ formatPrice(totalRevenue) }} ฿</div>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card color="primary" dark class="rounded-xl pa-4 fill-height">
          <div class="text-subtitle-2">จำนวนบิลที่ขาย</div>
          <div class="text-h4 font-weight-bold">{{ paidOrders.length }}</div>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card color="info" dark class="rounded-xl pa-4 fill-height">
          <div class="text-subtitle-2">ทานที่ร้าน</div>
          <div class="text-h4 font-weight-bold">{{ countType('1') }}</div>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card color="warning" dark class="rounded-xl pa-4 fill-height">
          <div class="text-subtitle-2">กลับบ้าน</div>
          <div class="text-h4 font-weight-bold">{{ countType('2') }}</div>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <!-- payment breakdown -->
      <v-col cols="12" md="5">
        <v-card class="rounded-xl fill-height">
          <v-card-title>แยกตามวิธีชำระเงิน</v-card-title>
          <v-divider></v-divider>
          <div class="pa-4">
            <div v-for="m in paymentRows" :key="m.key" class="mb-3">
              <div class="d-flex justify-space-between mb-1">
                <span><v-icon small left :color="m.color">{{ m.icon }}</v-icon>{{ m.label }}</span>
                <span class="font-weight-bold">{{ formatPrice(m.amount) }} ฿</span>
              </div>
              <v-progress-linear :value="totalRevenue ? (m.amount / totalRevenue) * 100 : 0" :color="m.color" height="8" rounded></v-progress-linear>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- cash movements (this shift) -->
      <v-col cols="12" md="7">
        <v-card class="rounded-xl fill-height">
          <v-card-title>
            เงินเข้า-ออก{{ shift ? ' (รอบนี้)' : '' }}
            <v-spacer></v-spacer>
            <span class="text-body-2 grey--text">รวมสุทธิ {{ formatPrice(movesNet) }} ฿</span>
          </v-card-title>
          <v-divider></v-divider>
          <v-data-table
            :headers="moveHeaders" :items="shiftMoves" :items-per-page="5" dense
            no-data-text="ยังไม่มีรายการเงินเข้า-ออก"
          >
            <template v-slot:[`item.type`]="{ item }">
              <v-chip x-small :color="item.type === 'in' ? 'success' : 'orange'" dark>
                {{ item.type === 'in' ? 'เข้า' : 'ออก' }}
              </v-chip>
            </template>
            <template v-slot:[`item.amount`]="{ item }">
              <span :class="item.type === 'in' ? 'success--text' : 'orange--text'">
                {{ item.type === 'in' ? '+' : '-' }}{{ formatPrice(item.amount) }} ฿
              </span>
            </template>
            <template v-slot:[`item.datetime`]="{ item }">{{ formatDate(item.datetime) }}</template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="mt-5 rounded-xl">
      <v-card-title>บิลล่าสุด</v-card-title>
      <v-divider></v-divider>
      <v-data-table :headers="headers" :items="paidRows" :items-per-page="10">
        <template v-slot:[`item.payment_method`]="{ item }">{{ payName(item.payment_method) }}</template>
        <template v-slot:[`item.type_order`]="{ item }">{{ typeName(item.type_order) }}</template>
        <template v-slot:[`item.datetime`]="{ item }">{{ formatDate(item.datetime) }}</template>
        <template v-slot:[`item.total_price`]="{ item }">{{ formatPrice(item.total_price) }} ฿</template>
      </v-data-table>
    </v-card>

    <!-- shift history -->
    <v-card class="mt-5 rounded-xl">
      <v-card-title><v-icon left>mdi-history</v-icon>ประวัติรอบขาย</v-card-title>
      <v-divider></v-divider>
      <v-data-table
        :headers="shiftHeaders" :items="closedShifts" :items-per-page="5" dense
        no-data-text="ยังไม่มีรอบขายที่ปิดแล้ว"
      >
        <template v-slot:[`item.open_time`]="{ item }">{{ formatDate(item.open_time) }}</template>
        <template v-slot:[`item.close_time`]="{ item }">{{ formatDate(item.close_time) }}</template>
        <template v-slot:[`item.sales`]="{ item }">{{ formatPrice(item.report.sales_total) }} ฿</template>
        <template v-slot:[`item.diff`]="{ item }">
          <v-chip x-small dark :color="item.report.diff === 0 ? 'success' : (item.report.diff > 0 ? 'blue' : 'red')">
            {{ item.report.diff > 0 ? '+' : '' }}{{ formatPrice(item.report.diff) }}
          </v-chip>
        </template>
        <template v-slot:[`item.actions`]="{ item }">
          <v-btn x-small text color="primary" @click="viewReport(item.report)"><v-icon x-small left>mdi-eye</v-icon>ดู</v-btn>
          <v-btn x-small text @click="printZ(item.report, item)"><v-icon x-small left>mdi-printer</v-icon>พิมพ์</v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- open shift dialog -->
    <v-dialog v-model="openDl" max-width="380px">
      <v-card class="rounded-xl">
        <v-card-title>เปิดรอบขาย</v-card-title>
        <v-card-text>
          <v-text-field outlined type="number" label="เงินตั้งต้นในลิ้นชัก (บาท)"
            v-model="openingCash" prepend-inner-icon="mdi-cash" autofocus></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-btn text @click="openDl = false">ยกเลิก</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="primary" :loading="loading" @click="openShift">เปิดรอบ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- close shift dialog -->
    <v-dialog v-model="closeDl" max-width="460px">
      <v-card v-if="shift" class="rounded-xl">
        <v-card-title>ปิดรอบขาย</v-card-title>
        <v-card-text>
          <div class="d-flex justify-space-between"><span>เงินตั้งต้น</span><span>{{ formatPrice(shift.opening_cash) }} ฿</span></div>
          <div class="d-flex justify-space-between"><span>ขายเงินสด</span><span>{{ formatPrice(shift.report.sales_cash) }} ฿</span></div>
          <div class="d-flex justify-space-between"><span>เงินเข้า - ออก</span><span>+{{ formatPrice(shift.report.cash_in) }} / -{{ formatPrice(shift.report.cash_out) }} ฿</span></div>
          <div class="d-flex justify-space-between font-weight-bold mb-3"><span>ควรมีเงินสด</span><span>{{ formatPrice(shift.report.expected_cash) }} ฿</span></div>

          <v-expansion-panels flat class="mb-3">
            <v-expansion-panel>
              <v-expansion-panel-header class="px-3">
                <span><v-icon left small>mdi-calculator-variant-outline</v-icon>นับธนบัตร/เหรียญ (ช่วยนับ)</span>
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <div v-for="d in denoms" :key="d" class="d-flex align-center mb-1">
                  <span style="width:70px">{{ formatPrice(d) }} ฿</span>
                  <v-text-field type="number" dense hide-details outlined v-model.number="denomQty[d]"
                    style="max-width:90px" class="mx-2" placeholder="0"></v-text-field>
                  <span class="grey--text">= {{ formatPrice((denomQty[d] || 0) * d) }} ฿</span>
                </div>
                <v-divider class="my-2"></v-divider>
                <div class="d-flex align-center">
                  <span class="font-weight-bold">รวมที่นับ {{ formatPrice(denomTotal) }} ฿</span>
                  <v-spacer></v-spacer>
                  <v-btn small color="primary" outlined @click="applyDenom">ใช้ยอดนี้</v-btn>
                </div>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>

          <v-text-field outlined type="number" label="นับเงินสดจริงในลิ้นชัก (บาท)"
            v-model="closingCash" prepend-inner-icon="mdi-cash-multiple"></v-text-field>
          <div class="d-flex justify-space-between" :class="closeDiff === 0 ? 'success--text' : 'red--text'">
            <span>ส่วนต่าง (นับ - ควรมี)</span>
            <span class="font-weight-bold">{{ closeDiff > 0 ? '+' : '' }}{{ formatPrice(closeDiff) }} ฿</span>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn text @click="closeDl = false">ยกเลิก</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="error" :loading="loading" @click="closeShift">ปิดรอบ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- cash in/out dialog -->
    <v-dialog v-model="moveDl" max-width="380px">
      <v-card class="rounded-xl">
        <v-card-title>{{ moveType === 'in' ? 'บันทึกเงินเข้า' : 'บันทึกเงินออก' }}</v-card-title>
        <v-card-text>
          <v-text-field outlined type="number" label="จำนวนเงิน (บาท)" v-model="moveAmount"
            prepend-inner-icon="mdi-cash" autofocus></v-text-field>
          <v-text-field outlined class="mt-n2" label="หมายเหตุ" v-model="moveNote"
            :placeholder="moveType === 'in' ? 'เช่น เติมเงินทอน' : 'เช่น ซื้อของเข้าร้าน'"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-btn text @click="moveDl = false">ยกเลิก</v-btn>
          <v-spacer></v-spacer>
          <v-btn :color="moveType === 'in' ? 'success' : 'orange'" :loading="loading" @click="saveMove">บันทึก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Z-report dialog -->
    <v-dialog v-model="reportDl" max-width="400px">
      <v-card v-if="zreport" class="rounded-xl">
        <v-card-title class="primary white--text">สรุปปิดรอบ (Z-Report)</v-card-title>
        <v-card-text class="pt-4">
          <div class="d-flex justify-space-between"><span>จำนวนบิล</span><span>{{ zreport.bill_count }}</span></div>
          <div class="d-flex justify-space-between"><span>ยอดขายรวม</span><span>{{ formatPrice(zreport.sales_total) }} ฿</span></div>
          <v-divider class="my-2"></v-divider>
          <div class="d-flex justify-space-between"><span>เงินสด</span><span>{{ formatPrice(zreport.sales_cash) }} ฿</span></div>
          <div class="d-flex justify-space-between"><span>QR พร้อมเพย์</span><span>{{ formatPrice(zreport.sales_qr) }} ฿</span></div>
          <div class="d-flex justify-space-between"><span>โอนเงิน</span><span>{{ formatPrice(zreport.sales_transfer) }} ฿</span></div>
          <v-divider class="my-2"></v-divider>
          <div class="d-flex justify-space-between green--text"><span>เงินเข้าเพิ่ม</span><span>+{{ formatPrice(zreport.cash_in) }} ฿</span></div>
          <div class="d-flex justify-space-between orange--text"><span>เงินออก</span><span>-{{ formatPrice(zreport.cash_out) }} ฿</span></div>
          <v-divider class="my-2"></v-divider>
          <div class="d-flex justify-space-between"><span>ควรมีเงินสด</span><span>{{ formatPrice(zreport.expected_cash) }} ฿</span></div>
          <div class="d-flex justify-space-between"><span>นับได้จริง</span><span>{{ formatPrice(zreport.counted_cash) }} ฿</span></div>
          <div class="d-flex justify-space-between text-h6"
            :class="zreport.diff === 0 ? 'success--text' : 'red--text'">
            <span>ส่วนต่าง</span><span>{{ zreport.diff > 0 ? "+" : "" }}{{ formatPrice(zreport.diff) }} ฿</span>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn text @click="printZ(zreport)"><v-icon left>mdi-printer</v-icon>พิมพ์</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="reportDl = false">ปิด</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      orders: [],
      shifts: [],
      cashMoves: [],
      shift: null,
      openDl: false,
      closeDl: false,
      reportDl: false,
      moveDl: false,
      moveType: "in",
      moveAmount: 0,
      moveNote: "",
      openingCash: 0,
      closingCash: 0,
      zreport: null,
      loading: false,
      denoms: [1000, 500, 100, 50, 20, 10, 5, 1],
      denomQty: {},
      headers: [
        { text: "ชื่อบิล", value: "bill_name" },
        { text: "เวลา", value: "datetime" },
        { text: "ประเภท", value: "type_order" },
        { text: "ชำระโดย", value: "payment_method" },
        { text: "รายการ", value: "count" },
        { text: "ยอดรวม", value: "total_price" }
      ],
      moveHeaders: [
        { text: "ประเภท", value: "type" },
        { text: "จำนวน", value: "amount" },
        { text: "หมายเหตุ", value: "note" },
        { text: "เวลา", value: "datetime" }
      ],
      shiftHeaders: [
        { text: "เปิด", value: "open_time" },
        { text: "ปิด", value: "close_time" },
        { text: "ยอดขาย", value: "sales" },
        { text: "ส่วนต่าง", value: "diff" },
        { text: "", value: "actions", sortable: false, align: "end" }
      ]
    };
  },
  async mounted() {
    await this.load();
  },
  computed: {
    darkUi() {
      return this.$vuetify.theme.dark;
    },
    paidOrders() {
      return (this.orders || []).filter(o => String(o.status) === "1");
    },
    paidRows() {
      return this.paidOrders.map(o => ({ ...o, count: (o.list_product || []).length }));
    },
    totalRevenue() {
      return this.paidOrders.reduce((s, o) => s + (Number(o.total_price) || 0), 0);
    },
    paymentRows() {
      const acc = { cash: 0, qr: 0, transfer: 0, card: 0 };
      this.paidOrders.forEach(o => {
        if (Array.isArray(o.payments) && o.payments.length) {
          o.payments.forEach(p => { acc[p.method] = (acc[p.method] || 0) + (Number(p.amount) || 0); });
        } else {
          const m = o.payment_method || "cash";
          acc[m] = (acc[m] || 0) + (Number(o.total_price) || 0);
        }
      });
      return [
        { key: "cash", label: "เงินสด", icon: "mdi-cash", color: "green", amount: acc.cash || 0 },
        { key: "qr", label: "QR พร้อมเพย์", icon: "mdi-qrcode", color: "blue", amount: acc.qr || 0 },
        { key: "transfer", label: "โอนเงิน", icon: "mdi-bank", color: "purple", amount: acc.transfer || 0 },
        { key: "card", label: "บัตร", icon: "mdi-credit-card-outline", color: "teal", amount: acc.card || 0 }
      ];
    },
    shiftMoves() {
      if (!this.shift) return (this.cashMoves || []).slice(0, 20);
      const from = new Date(this.shift.open_time).getTime();
      return (this.cashMoves || []).filter(m => new Date(m.datetime).getTime() >= from);
    },
    movesNet() {
      return this.shiftMoves.reduce((s, m) => s + (m.type === "in" ? 1 : -1) * (Number(m.amount) || 0), 0);
    },
    closedShifts() {
      return (this.shifts || []).filter(s => s.status === "closed");
    },
    denomTotal() {
      return this.denoms.reduce((s, d) => s + (Number(this.denomQty[d]) || 0) * d, 0);
    },
    closeDiff() {
      if (!this.shift) return 0;
      return (Number(this.closingCash) || 0) - (Number(this.shift.report.expected_cash) || 0);
    },
    shiftDuration() {
      if (!this.shift) return "-";
      const ms = Date.now() - new Date(this.shift.open_time).getTime();
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      return (h ? h + " ชม. " : "") + m + " นาที";
    }
  },
  methods: {
    async load() {
      try {
        const [orders, cur, shifts, moves] = await Promise.all([
          this.$axios.$get("/order"),
          this.$axios.$get("/shift/current"),
          this.$axios.$get("/shift"),
          this.$axios.$get("/cashmove")
        ]);
        this.orders = orders;
        this.shift = cur.shift;
        this.shifts = shifts;
        this.cashMoves = moves;
      } catch (e) {
        console.log(e);
      }
    },
    openCloseDialog() {
      this.closingCash = 0;
      this.denomQty = {};
      this.closeDl = true;
    },
    applyDenom() {
      this.closingCash = this.denomTotal;
    },
    async openShift() {
      this.loading = true;
      try {
        const uid = this.$store.state.auth && this.$store.state.auth.user
          ? this.$store.state.auth.user._id : null;
        await this.$axios.$post("/shift/open", {
          opening_cash: Number(this.openingCash) || 0,
          ref_emp_id: uid
        });
        this.openDl = false;
        this.openingCash = 0;
        await this.load();
      } catch (e) {
        console.log(e);
      } finally {
        this.loading = false;
      }
    },
    async closeShift() {
      this.loading = true;
      try {
        const res = await this.$axios.$post("/shift/close", {
          shift_id: this.shift._id,
          closing_cash: Number(this.closingCash) || 0
        });
        this.zreport = res.data.report;
        this.closeDl = false;
        this.reportDl = true;
        this.closingCash = 0;
        this.denomQty = {};
        await this.load();
      } catch (e) {
        console.log(e);
      } finally {
        this.loading = false;
      }
    },
    openMove(type) {
      this.moveType = type;
      this.moveAmount = 0;
      this.moveNote = "";
      this.moveDl = true;
    },
    async saveMove() {
      const amt = Number(this.moveAmount) || 0;
      if (amt <= 0) return;
      this.loading = true;
      try {
        const uid = this.$store.state.auth && this.$store.state.auth.user
          ? this.$store.state.auth.user._id : null;
        await this.$axios.$post("/cashmove", {
          type: this.moveType, amount: amt, note: this.moveNote, ref_emp_id: uid
        });
        this.moveDl = false;
        await this.load();
      } catch (e) {
        console.log(e);
      } finally {
        this.loading = false;
      }
    },
    viewReport(report) {
      this.zreport = report;
      this.reportDl = true;
    },
    printZ(report, shiftItem) {
      if (!this.$printer || !this.$printer.printHtml) return;
      const s = this.$store.state.settings || {};
      const money = v => this.formatPrice(v);
      const when = shiftItem
        ? this.formatDate(shiftItem.open_time) + " - " + this.formatDate(shiftItem.close_time)
        : (this.shift ? this.formatDate(this.shift.open_time) + " - ตอนนี้" : "");
      const row = (l, r) => `<div class="r"><span>${l}</span><span>${r}</span></div>`;
      const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@page{size:58mm auto;margin:0}body{font-family:'Sarabun',sans-serif;width:58mm;margin:0;padding:8px;color:#000;font-size:12px}
.c{text-align:center}.b{font-weight:700}.big{font-size:15px;font-weight:700}
.r{display:flex;justify-content:space-between}hr{border:none;border-top:1px dashed #000;margin:5px 0}
</style></head><body>
<div class="c"><div class="big">${(s.shop_name || "SHIFT CAFE")}</div>${s.branch ? `<div>${s.branch}</div>` : ""}
<div class="b">สรุปปิดรอบ (Z-Report)</div><div style="font-size:11px">${when}</div></div><hr>
${row("จำนวนบิล", report.bill_count)}
${row("ยอดขายรวม", money(report.sales_total) + " ฿")}<hr>
${row("เงินสด", money(report.sales_cash) + " ฿")}
${row("QR พร้อมเพย์", money(report.sales_qr) + " ฿")}
${row("โอนเงิน", money(report.sales_transfer) + " ฿")}<hr>
${row("เงินเข้าเพิ่ม", "+" + money(report.cash_in) + " ฿")}
${row("เงินออก", "-" + money(report.cash_out) + " ฿")}<hr>
${row("ควรมีเงินสด", money(report.expected_cash) + " ฿")}
${row("นับได้จริง", money(report.counted_cash) + " ฿")}
<div class="r b">${"<span>ส่วนต่าง</span>"}<span>${report.diff > 0 ? "+" : ""}${money(report.diff)} ฿</span></div>
<hr><div class="c" style="font-size:11px">พิมพ์ ${this.formatDate(new Date().toISOString())}</div>
</body></html>`;
      this.$printer.printHtml(html);
    },
    countType(t) {
      return this.paidOrders.filter(o => String(o.type_order) === t).length;
    },
    payName(m) {
      return m === "qr" ? "QR" : m === "transfer" ? "โอน" : m === "card" ? "บัตร" : "เงินสด";
    },
    typeName(t) {
      return t === "2" ? "กลับบ้าน" : t === "3" ? "เดลิเวอรี" : "ทานที่ร้าน";
    },
    formatPrice(v) {
      return (Number(v) || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    formatDate(d) {
      return d ? new Date(d).toLocaleString("th-TH") : "";
    }
  }
};
</script>
