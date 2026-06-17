<template>
  <div class="ma-3">
    <v-card class="mx-auto mt-6 rounded-xl" max-width="820" elevation="5">
      <v-card-title class="pb-2">
        <v-icon left color="primary">mdi-account-plus</v-icon>
        <span class="font-weight-bold">ลงทะเบียนสมาชิกใหม่</span>
        <v-spacer></v-spacer>
        <v-chip small color="primary" outlined>สมาชิกทั้งหมด {{ customers.length }}</v-chip>
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text class="pt-5">
        <div class="section-label mb-2"><v-icon small left color="primary">mdi-account</v-icon>ข้อมูลส่วนตัว</div>
        <v-row>
          <v-col cols="12" md="3">
            <v-select outlined dense label="คำนำหน้า" :items="pnames" v-model="form.pname"></v-select>
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field outlined dense label="ชื่อ" v-model="form.fname" :error-messages="errors.fname"></v-text-field>
          </v-col>
          <v-col cols="12" md="5">
            <v-text-field outlined dense label="นามสกุล" v-model="form.lname"></v-text-field>
          </v-col>
          <v-col cols="12" md="6" class="mt-n3">
            <v-text-field outlined dense label="เบอร์โทร" v-model="form.tel" type="tel"
              :error-messages="errors.tel" prepend-inner-icon="mdi-phone" @blur="checkDup"></v-text-field>
          </v-col>
          <v-col cols="12" md="6" class="mt-n3">
            <v-text-field outlined dense label="อีเมล" v-model="form.email" prepend-inner-icon="mdi-email-outline"></v-text-field>
          </v-col>
          <v-col cols="12" md="6" class="mt-n3">
            <v-text-field outlined dense type="date" label="วันเกิด" v-model="form.birthday"></v-text-field>
          </v-col>
          <v-col cols="12" md="6" class="mt-n3">
            <v-textarea outlined dense label="ที่อยู่" rows="1" auto-grow v-model="form.address"></v-textarea>
          </v-col>
        </v-row>

        <div class="section-label mb-2 mt-2"><v-icon small left color="amber darken-2">mdi-star</v-icon>สิทธิ์สมาชิก</div>
        <v-row>
          <v-col cols="12" md="6" class="mt-n2">
            <v-select outlined dense label="ระดับสมาชิก" item-text="level_name" item-value="_id"
              :items="levels" v-model="form.ref_level_id" prepend-inner-icon="mdi-medal"></v-select>
          </v-col>
          <v-col cols="12" md="6" class="mt-n2">
            <v-text-field outlined dense type="number" label="แต้มเริ่มต้น" v-model="form.point"
              prepend-inner-icon="mdi-star-circle" hint="โปรโมชั่นสมัครรับแต้มฟรี (ถ้ามี)" persistent-hint></v-text-field>
          </v-col>
        </v-row>

        <v-alert v-if="dupWarn" dense text type="warning" class="mt-3 mb-0 text-caption rounded-lg">
          <v-icon small left color="warning">mdi-alert</v-icon>เบอร์นี้มีสมาชิกชื่อ “{{ dupWarn }}” อยู่แล้ว
        </v-alert>
      </v-card-text>
      <v-card-actions class="px-4 pb-4">
        <v-btn color="grey" text @click="reset">ล้างฟอร์ม</v-btn>
        <v-spacer></v-spacer>
        <v-btn color="primary" depressed large :loading="loading" @click="save">
          <v-icon left>mdi-content-save</v-icon> ลงทะเบียน
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- recently registered -->
    <v-card v-if="recent.length" class="mx-auto mt-4 rounded-xl" max-width="820" elevation="2">
      <v-card-title class="text-subtitle-1"><v-icon left small>mdi-history</v-icon>เพิ่งลงทะเบียน</v-card-title>
      <v-divider></v-divider>
      <v-list dense>
        <v-list-item v-for="c in recent" :key="c._id">
          <v-list-item-icon><v-icon color="amber">mdi-account-star</v-icon></v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{ (c.fname || '') + ' ' + (c.lname || '') }}</v-list-item-title>
            <v-list-item-subtitle>{{ c.tel || '—' }} · {{ c.point || 0 }} แต้ม</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-card>

    <v-snackbar v-model="snackbar" :timeout="2500" :color="snackColor" top>{{ snackText }}</v-snackbar>
  </div>
</template>

<script>
export default {
  data() {
    return {
      levels: [],
      customers: [],
      recent: [],
      pnames: ["นาย", "นาง", "น.ส.", "ด.ช.", "ด.ญ."],
      loading: false,
      snackbar: false,
      snackText: "",
      snackColor: "success",
      dupWarn: "",
      errors: {},
      form: this.blankForm()
    };
  },
  async mounted() {
    try {
      const [levels, customers] = await Promise.all([
        this.$axios.$get("/level"),
        this.$axios.$get("/customer")
      ]);
      this.levels = levels;
      this.customers = customers;
    } catch (e) {
      console.log(e);
    }
  },
  methods: {
    blankForm() {
      return {
        pname: "นาย", fname: "", lname: "", tel: "", email: "",
        birthday: "", address: "", point: 0, ref_level_id: null
      };
    },
    reset() {
      this.form = this.blankForm();
      this.errors = {};
      this.dupWarn = "";
    },
    checkDup() {
      const tel = (this.form.tel || "").trim();
      if (!tel) { this.dupWarn = ""; return; }
      const c = this.customers.find(x => (x.tel || "") === tel);
      this.dupWarn = c ? ((c.fname || "") + " " + (c.lname || "")).trim() : "";
    },
    validate() {
      const e = {};
      if (!this.form.fname) e.fname = "กรุณากรอกชื่อ";
      if (!this.form.tel) e.tel = "กรุณากรอกเบอร์โทร";
      this.errors = e;
      return Object.keys(e).length === 0;
    },
    async save() {
      if (!this.validate()) return;
      const tel = (this.form.tel || "").trim();
      if (tel && this.customers.some(x => (x.tel || "") === tel)) {
        this.snackColor = "error";
        this.snackText = "เบอร์นี้เป็นสมาชิกอยู่แล้ว";
        this.snackbar = true;
        return;
      }
      this.loading = true;
      try {
        const res = await this.$axios.$post("/customer", {
          ...this.form,
          point: Number(this.form.point) || 0,
          ref_level_id: this.form.ref_level_id || "60e439b7c7d6ae35548c7b62"
        });
        const created = res && res.data ? res.data : res;
        if (created && created._id) {
          this.customers.push(created);
          this.recent.unshift(created);
          this.recent = this.recent.slice(0, 5);
        }
        this.snackColor = "success";
        this.snackText = "ลงทะเบียนสมาชิกสำเร็จ 🎉";
        this.snackbar = true;
        this.reset();
      } catch (e) {
        console.log(e);
        this.snackColor = "error";
        this.snackText = "เกิดข้อผิดพลาด";
        this.snackbar = true;
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.section-label { font-weight: 600; font-size: 0.9rem; color: #2e9c3f; }
.theme--dark .section-label { color: #5ec46b; }
</style>
