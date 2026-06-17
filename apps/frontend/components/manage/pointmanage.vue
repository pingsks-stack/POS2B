<template>
  <div class="ma-3">
    <v-card class="mx-auto mt-6 rounded-xl" elevation="5">
      <v-card-title class="pb-2">
        <v-icon left color="primary">mdi-star-circle</v-icon>
        <span class="font-weight-bold">จัดการแต้มสมาชิก</span>
        <v-chip small class="ml-3" color="amber darken-2" dark>แต้มรวม {{ totalPoints }}</v-chip>
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search" append-icon="mdi-magnify" label="ค้นหา"
          single-line hide-details dense outlined style="max-width: 240px"
        ></v-text-field>
      </v-card-title>
      <v-divider></v-divider>

      <v-data-table :headers="headers" :items="rows" :search="search" :items-per-page="15">
        <template v-slot:[`item.name`]="{ item }">
          <div class="d-flex align-center py-2">
            <v-avatar size="36" color="amber darken-1" class="mr-3"><v-icon dark small>mdi-account-star</v-icon></v-avatar>
            <span class="font-weight-medium">{{ item.name }}</span>
          </div>
        </template>
        <template v-slot:[`item.point`]="{ item }">
          <v-chip color="amber darken-2" dark> {{ item.point || 0 }} แต้ม </v-chip>
        </template>
        <template v-slot:[`item.level`]="{ item }">
          <v-chip x-small color="indigo" dark>{{ item.ref_level_id && item.ref_level_id.level_name ? item.ref_level_id.level_name : "ทั่วไป" }}</v-chip>
        </template>
        <template v-slot:no-data>
          <div class="pa-8 text-center grey--text">
            <v-icon size="48" color="grey lighten-1">mdi-account-off-outline</v-icon>
            <div class="mt-2">ยังไม่มีสมาชิก</div>
          </div>
        </template>
        <template v-slot:top>
          <v-dialog v-model="dialog" max-width="480px">
            <v-card>
              <v-card-title>
                <span class="text-h6"
                  ><v-icon left> mdi-star-circle </v-icon> ปรับแต้ม: {{ name }}</span
                >
              </v-card-title>
              <v-card-text>
                <p class="mb-2">แต้มปัจจุบัน: <b>{{ current }}</b></p>
                <v-btn-toggle v-model="mode" mandatory class="mb-4">
                  <v-btn value="add" color="success">เพิ่มแต้ม</v-btn>
                  <v-btn value="redeem" color="error">ใช้/หักแต้ม</v-btn>
                </v-btn-toggle>
                <v-text-field
                  outlined type="number" label="จำนวนแต้ม"
                  v-model="amount" :error-messages="errorMsg"
                ></v-text-field>
                <p>
                  แต้มใหม่:
                  <b :class="newPoint < 0 ? 'red--text' : 'green--text'">{{ newPoint }}</b>
                </p>
              </v-card-text>
              <v-card-actions>
                <v-btn class="ma-1" color="primary" dark @click="close">ยกเลิก</v-btn>
                <v-spacer></v-spacer>
                <v-btn class="ma-1" color="info" :loading="loading" @click="save">
                  <v-icon class="mx-2"> mdi-content-save </v-icon>บันทึก
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </template>
        <template v-slot:[`item.actions`]="{ item }">
          <v-btn small color="primary" @click="adjust(item)">
            <v-icon small class="mr-1"> mdi-star-plus </v-icon>ปรับแต้ม
          </v-btn>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script>
export default {
  props: ["customers"],
  data: () => ({
    dialog: false,
    loading: false,
    search: "",
    errorMsg: "",
    headers: [
      { text: "ชื่อสมาชิก", value: "name", sortable: false },
      { text: "เบอร์โทร", value: "tel" },
      { text: "ระดับ", value: "level", sortable: false },
      { text: "แต้มสะสม", value: "point" },
      { text: "Actions", value: "actions", sortable: false }
    ],
    selected: null,
    mode: "add",
    amount: 0
  }),
  computed: {
    totalPoints() {
      return (this.customers || []).reduce((s, c) => s + (Number(c.point) || 0), 0);
    },
    rows() {
      return (this.customers || []).map(c => ({
        ...c,
        name: (c.fname || "") + " " + (c.lname || "")
      }));
    },
    name() {
      return this.selected ? (this.selected.fname || "") + " " + (this.selected.lname || "") : "";
    },
    current() {
      return this.selected ? Number(this.selected.point) || 0 : 0;
    },
    newPoint() {
      const a = Number(this.amount) || 0;
      return this.mode === "add" ? this.current + a : this.current - a;
    }
  },
  watch: {
    dialog(val) {
      val || this.close();
    }
  },
  methods: {
    adjust(item) {
      this.selected = item;
      this.mode = "add";
      this.amount = 0;
      this.errorMsg = "";
      this.dialog = true;
    },
    close() {
      this.dialog = false;
    },
    async save() {
      const a = Number(this.amount) || 0;
      if (a <= 0) {
        this.errorMsg = "กรุณากรอกจำนวนแต้มที่มากกว่า 0";
        return;
      }
      if (this.newPoint < 0) {
        this.errorMsg = "แต้มไม่เพียงพอ";
        return;
      }
      this.loading = true;
      try {
        await this.$axios.$put("/customer/" + this.selected._id, {
          point: this.newPoint,
          auto_level: true
        });
        this.$emit("refresh");
        this.close();
      } catch (e) {
        console.log(e);
        this.errorMsg = "บันทึกไม่สำเร็จ";
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
