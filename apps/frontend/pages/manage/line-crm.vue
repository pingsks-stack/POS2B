<template>
  <div class="pa-5">
    <h1 class="crm-title mb-1"><v-icon left large color="green darken-1">mdi-chat</v-icon> LINE CRM</h1>
    <div class="grey--text mb-4">เชื่อมลูกค้าผ่าน LINE · แจ้งแต้ม/ใบเสร็จ · ส่งโปรโมชั่น</div>

    <v-alert v-if="!settings.line_enabled" type="warning" text dense class="rounded-lg">
      LINE CRM ยังปิดอยู่ — ไปที่ <b>ตั้งค่า → LINE CRM</b> เพื่อเปิดใช้งาน
    </v-alert>
    <v-alert v-else-if="!settings.line_channel_token" type="info" text dense class="rounded-lg">
      โหมดจำลอง (ยังไม่ใส่ Channel Access Token) — ข้อความจะถูกบันทึกไว้แต่ไม่ส่งจริง
    </v-alert>

    <v-row>
      <v-col cols="6" md="3">
        <v-card class="rounded-xl pa-4 fill-height"><div class="grey--text text-caption">สมาชิกที่เชื่อม LINE</div>
          <div class="text-h4 font-weight-bold green--text">{{ linkedCount }}</div>
          <div class="text-caption grey--text">จาก {{ customers.length }} คน</div></v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card class="rounded-xl pa-4 fill-height"><div class="grey--text text-caption">ข้อความทั้งหมด</div>
          <div class="text-h4 font-weight-bold">{{ messages.length }}</div></v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card class="rounded-xl pa-4 fill-height"><div class="grey--text text-caption">ส่งสำเร็จ</div>
          <div class="text-h4 font-weight-bold info--text">{{ countStatus('sent') }}</div></v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card class="rounded-xl pa-4 fill-height"><div class="grey--text text-caption">จำลอง</div>
          <div class="text-h4 font-weight-bold grey--text">{{ countStatus('simulated') }}</div></v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="5">
        <v-card class="rounded-xl">
          <v-card-title><v-icon left>mdi-bullhorn-outline</v-icon> ส่งโปรโมชั่น (Broadcast)</v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <div class="grey--text text-caption mb-2">ส่งหาสมาชิกที่เชื่อม LINE ทั้งหมด {{ linkedCount }} คน</div>
            <v-textarea outlined rows="4" label="ข้อความ" v-model="broadcastText"
              placeholder="เช่น โปรพิเศษวันนี้ ซื้อ 1 แถม 1 🎉"></v-textarea>
          </v-card-text>
          <v-card-actions class="px-4 pb-4">
            <v-spacer></v-spacer>
            <v-btn color="green darken-1" dark :loading="sending" :disabled="!broadcastText || !linkedCount" @click="broadcast">
              <v-icon left>mdi-send</v-icon> ส่งบรอดแคสต์
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="7">
        <v-card class="rounded-xl">
          <v-card-title>ประวัติข้อความ
            <v-spacer></v-spacer>
            <v-btn small color="primary" @click="load"><v-icon left small>mdi-refresh</v-icon>รีเฟรช</v-btn>
          </v-card-title>
          <v-divider></v-divider>
          <v-data-table :headers="headers" :items="rows" :items-per-page="8">
            <template v-slot:[`item.datetime`]="{ item }">{{ fmt(item.datetime) }}</template>
            <template v-slot:[`item.type`]="{ item }">{{ typeName(item.type) }}</template>
            <template v-slot:[`item.status`]="{ item }">
              <v-chip x-small dark :color="item.status === 'sent' ? 'success' : item.status === 'failed' ? 'error' : 'grey'">
                {{ item.status === 'sent' ? 'ส่งแล้ว' : item.status === 'failed' ? 'ล้มเหลว' : 'จำลอง' }}
              </v-chip>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar" :timeout="2500" :color="snackColor" top>{{ snackText }}</v-snackbar>
  </div>
</template>

<script>
export default {
  middleware: ["auth", "check"],
  async asyncData(context) {
    const [customers, messages, settings] = await Promise.all([
      context.$axios.$get("/customer"),
      context.$axios.$get("/crm/messages"),
      context.$axios.$get("/settings")
    ]);
    return { customers, messages, settings };
  },
  data: () => ({
    customers: [],
    messages: [],
    settings: {},
    broadcastText: "",
    sending: false,
    snackbar: false,
    snackText: "",
    snackColor: "success",
    headers: [
      { text: "เวลา", value: "datetime" },
      { text: "ลูกค้า", value: "name" },
      { text: "ประเภท", value: "type" },
      { text: "ข้อความ", value: "text" },
      { text: "สถานะ", value: "status" }
    ]
  }),
  computed: {
    linkedCount() {
      return (this.customers || []).filter(c => c.line_user_id).length;
    },
    rows() {
      return (this.messages || []).map(m => {
        const c = this.customers.find(x => x._id === m.customer_ref);
        return { ...m, name: c ? (c.fname || "") + " " + (c.lname || "") : "-" };
      });
    }
  },
  methods: {
    countStatus(s) {
      return (this.messages || []).filter(m => m.status === s).length;
    },
    typeName(t) {
      return { purchase: "ซื้อสินค้า", broadcast: "โปรโมชั่น", manual: "ส่งเอง", welcome: "ต้อนรับ" }[t] || t;
    },
    fmt(d) {
      return d ? new Date(d).toLocaleString("th-TH") : "";
    },
    async load() {
      const [customers, messages] = await Promise.all([
        this.$axios.$get("/customer"),
        this.$axios.$get("/crm/messages")
      ]);
      this.customers = customers;
      this.messages = messages;
    },
    async broadcast() {
      this.sending = true;
      try {
        const res = await this.$axios.$post("/crm/broadcast", { text: this.broadcastText });
        this.snackText =
          "ส่งถึง " + res.sent + " คน" + (res.simulated ? " (โหมดจำลอง)" : "");
        this.snackbar = true;
        this.broadcastText = "";
        await this.load();
      } catch (e) {
        this.snackText = "ส่งไม่สำเร็จ";
        this.snackColor = "error";
        this.snackbar = true;
      } finally {
        this.sending = false;
      }
    }
  }
};
</script>

<style scoped>
.crm-title { font-family: "Mitr", sans-serif; font-weight: 600; color: #1d1d1d; }
</style>
