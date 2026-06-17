<template>
  <div class="ma-3">
    <v-card class="mx-auto mt-6 rounded-xl" elevation="5">
      <v-card-title class="pb-2">
        <v-icon left color="primary">mdi-ticket-percent-outline</v-icon>
        <span class="font-weight-bold">คูปองส่วนลด</span>
        <v-chip small class="ml-3" color="primary" outlined>{{ coupon.length }} ใบ</v-chip>
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search" append-icon="mdi-magnify" label="ค้นหา"
          single-line hide-details dense outlined style="max-width: 240px" class="mr-3"
        ></v-text-field>
        <v-btn color="primary" depressed @click="addItem">
          <v-icon left> mdi-plus </v-icon> เพิ่มคูปอง
        </v-btn>
      </v-card-title>
      <v-divider></v-divider>

      <v-data-table :headers="headers" :items="coupon" :search="search" :items-per-page="15">
        <template v-slot:[`item.codename`]="{ item }">
          <div class="d-flex align-center py-2">
            <v-avatar size="36" color="pink darken-1" class="mr-3"><v-icon dark small>mdi-ticket-percent</v-icon></v-avatar>
            <span class="font-weight-medium">{{ item.codename }}</span>
          </div>
        </template>
        <template v-slot:[`item.num_use`]="{ item }">
          <v-chip x-small :color="Number(item.num_use) > 0 ? 'primary' : 'grey'" dark>เหลือ {{ item.num_use }}</v-chip>
        </template>
        <template v-slot:[`item.exp`]="{ item }">{{ item.exp || "—" }}</template>
        <template v-slot:[`item.cstatus`]="{ item }">
          <v-chip x-small dark :color="couponStatus(item).color">{{ couponStatus(item).text }}</v-chip>
        </template>
        <template v-slot:[`item.ref_emp_id_by`]="{ item }">{{ empName(item.ref_emp_id_by) }}</template>
        <template v-slot:top>
          <v-dialog v-model="dialog" max-width="640px">
            <v-card>
              <v-card-title>
                <span class="text-h5"><v-icon left> mdi-ticket-percent-outline </v-icon> {{ formTitle }}</span>
              </v-card-title>
              <v-card-text>
                <v-container>
                  <v-row>
                    <v-col cols="12" md="6" class="mt-2">
                      <v-text-field outlined label="ชื่อคูปอง (โค้ด)" v-model="coupone.codename"
                        :error-messages="errors.codename" color="#1D1D1D"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6" class="mt-2">
                      <v-text-field outlined type="date" label="วันหมดอายุ" v-model="coupone.exp"
                        color="#1D1D1D"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6" class="mt-n7">
                      <v-text-field outlined type="number" label="ส่วนลด (%)" v-model="coupone.discount"
                        :error-messages="errors.discount" color="#1D1D1D"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6" class="mt-n7">
                      <v-text-field outlined type="number" label="จำนวนที่ใช้ได้" v-model="coupone.num_use"
                        color="#1D1D1D"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6" class="mt-n7">
                      <v-select outlined label="ผู้อนุมัติ" item-text="name" item-value="_id"
                        :items="empOptions" v-model="coupone.ref_emp_id_by" color="#1D1D1D"></v-select>
                    </v-col>
                    <v-col cols="12" md="6" class="mt-n7">
                      <v-select outlined label="พนักงานที่ออก" item-text="name" item-value="_id"
                        :items="empOptions" v-model="coupone.ref_emp_id" color="#1D1D1D"></v-select>
                    </v-col>
                  </v-row>
                </v-container>
              </v-card-text>
              <v-card-actions>
                <v-btn class="ma-1" color="primary" dark @click="close">ยกเลิก</v-btn>
                <v-spacer></v-spacer>
                <v-btn class="ma-1" color="info" :loading="loading" @click="save">
                  <v-icon class="mx-2"> mdi-content-save </v-icon>
                  {{ type === "edit" ? "บันทึก" : "เพิ่มข้อมูล" }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
          <v-dialog v-model="dialogDelete" max-width="320px">
            <v-card>
              <v-card-title class="text-h6 white--text primary">แน่ใจหรือไม่ที่จะลบ?</v-card-title>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="info" class="ma-2" @click="closeDelete">ยกเลิก</v-btn>
                <v-btn color="error" class="ma-2" :loading="loading" @click="deleteItemConfirm">
                  <v-icon dark class="mx-2"> mdi-delete </v-icon>ลบ</v-btn>
                <v-spacer></v-spacer>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </template>
        <template v-slot:[`item.actions`]="{ item }">
          <v-btn small text color="primary" @click="editItem(item)">
            <v-icon small class="mr-1"> mdi-pencil </v-icon>แก้ไข
          </v-btn>
          <v-btn small text color="error" @click="deleteItem(item)">
            <v-icon small class="mr-1"> mdi-delete </v-icon>ลบ
          </v-btn>
        </template>
        <template v-slot:no-data>
          <div class="pa-8 text-center grey--text">
            <v-icon size="48" color="grey lighten-1">mdi-ticket-percent-outline</v-icon>
            <div class="mt-2">ยังไม่มีคูปอง — กด “เพิ่มคูปอง”</div>
          </div>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script>
export default {
  props: ["coupon", "employee", "user"],
  data: () => ({
    dialog: false,
    dialogDelete: false,
    loading: false,
    search: "",
    headers: [
      { text: "โค้ดคูปอง", align: "start", value: "codename" },
      { text: "ส่วนลด %", align: "start", value: "discount" },
      { text: "คงเหลือ", align: "start", value: "num_use" },
      { text: "วันหมดอายุ", align: "start", value: "exp" },
      { text: "สถานะ", align: "start", value: "cstatus", sortable: false },
      { text: "ออกโดย", align: "start", value: "ref_emp_id_by" },
      { text: "", value: "actions", sortable: false, align: "end" }
    ],
    coupone: {},
    errors: {},
    type: null,
    deleteId: null
  }),
  computed: {
    empOptions() {
      return (this.employee || []).map(e => ({
        _id: e._id,
        name: (e.fname || "") + " " + (e.lname || "")
      }));
    },
    formTitle() {
      return this.type === "edit" ? "แก้ไขคูปอง" : "เพิ่มคูปอง";
    }
  },
  watch: {
    dialog(val) {
      val || this.close();
    },
    dialogDelete(val) {
      val || this.closeDelete();
    }
  },
  methods: {
    couponStatus(c) {
      if (Number(c.num_use) <= 0) return { text: "ใช้ครบแล้ว", color: "grey" };
      if (c.exp && new Date(c.exp) < new Date(new Date().toDateString())) return { text: "หมดอายุ", color: "red" };
      return { text: "ใช้งานได้", color: "success" };
    },
    empName(id) {
      const e = (this.employee || []).find(x => x._id === id);
      return e ? (e.fname || "") + " " + (e.lname || "") : "-";
    },
    blank() {
      const me = this.user && this.user._id ? this.user._id : null;
      return {
        codename: "", discount: 0, num_use: 1, exp: "",
        ref_emp_id_by: me, ref_emp_id: me
      };
    },
    editItem(item) {
      this.type = "edit";
      this.coupone = Object.assign({}, item);
      this.errors = {};
      this.dialog = true;
    },
    addItem() {
      this.type = "add";
      this.coupone = this.blank();
      this.errors = {};
      this.dialog = true;
    },
    deleteItem(item) {
      this.deleteId = item._id;
      this.dialogDelete = true;
    },
    async deleteItemConfirm() {
      this.loading = true;
      try {
        await this.$axios.$delete("/coupon/" + this.deleteId);
        this.$emit("refresh");
        this.closeDelete();
      } catch (e) {
        console.log(e);
      } finally {
        this.loading = false;
      }
    },
    close() {
      this.dialog = false;
    },
    closeDelete() {
      this.dialogDelete = false;
    },
    validate() {
      const e = {};
      if (!this.coupone.codename) e.codename = "กรุณากรอกโค้ดคูปอง";
      if (this.coupone.discount === "" || this.coupone.discount === null)
        e.discount = "กรุณากรอกส่วนลด";
      this.errors = e;
      return Object.keys(e).length === 0;
    },
    async save() {
      if (!this.validate()) return;
      const payload = {
        codename: this.coupone.codename,
        discount: Number(this.coupone.discount) || 0,
        num_use: Number(this.coupone.num_use) || 0,
        exp: this.coupone.exp,
        ref_emp_id_by: this.coupone.ref_emp_id_by,
        ref_emp_id: this.coupone.ref_emp_id
      };
      this.loading = true;
      try {
        if (this.type === "add") {
          await this.$axios.$post("/coupon", payload);
        } else {
          await this.$axios.$put("/coupon/" + this.coupone._id, payload);
        }
        this.$emit("refresh");
        this.close();
      } catch (e) {
        console.log(e);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
