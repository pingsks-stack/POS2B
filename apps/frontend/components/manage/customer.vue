<template>
  <div class="ma-3">
    <v-card class="mx-auto mt-6 rounded-xl" elevation="5">
      <v-card-title class="pb-2">
        <v-icon left color="primary">mdi-account-group-outline</v-icon>
        <span class="font-weight-bold">สมาชิก</span>
        <v-chip small class="ml-3" color="primary" outlined>{{ customer.length }} คน</v-chip>
        <v-chip small class="ml-2" color="amber darken-2" dark>แต้มรวม {{ totalPoints }}</v-chip>
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search" append-icon="mdi-magnify" label="ค้นหา"
          single-line hide-details dense outlined style="max-width: 240px" class="mr-3"
        ></v-text-field>
        <v-btn color="primary" depressed @click="addItem">
          <v-icon left> mdi-plus </v-icon> เพิ่มสมาชิก
        </v-btn>
      </v-card-title>
      <v-divider></v-divider>

      <v-data-table :headers="headers" :items="customer" :search="search" :items-per-page="15">
        <template v-slot:[`item.fname`]="{ item }">
          <div class="d-flex align-center py-2">
            <v-avatar size="36" color="amber darken-1" class="mr-3"><v-icon dark small>mdi-account-star</v-icon></v-avatar>
            <span class="font-weight-medium">{{ item.fname }}</span>
          </div>
        </template>
        <template v-slot:[`item.ref_level_id`]="{ item }">
          <v-chip x-small color="indigo" dark>{{ item.ref_level_id && item.ref_level_id.level_name ? item.ref_level_id.level_name : "ทั่วไป" }}</v-chip>
        </template>
        <template v-slot:[`item.point`]="{ item }">
          <v-chip x-small color="amber darken-2" dark>{{ item.point || 0 }} แต้ม</v-chip>
        </template>
        <template v-slot:[`item.line`]="{ item }">
          <v-chip v-if="item.line_user_id" small color="green" dark><v-icon left small>mdi-chat</v-icon>เชื่อมแล้ว</v-chip>
          <span v-else class="grey--text">—</span>
        </template>
        <template v-slot:top>
          <v-dialog v-model="dialog" max-width="700px">
            <v-card>
              <v-card-title>
                <span class="text-h5"
                  ><v-icon left> mdi-account </v-icon> {{ formTitle }}</span
                >
              </v-card-title>
              <v-card-text>
                <v-container>
                  <v-row>
                    <v-col cols="12" md="3" class="mt-2">
                      <v-select
                        outlined label="คำนำหน้า"
                        :items="pnames" v-model="item.pname"
                      ></v-select>
                    </v-col>
                    <v-col cols="12" md="4" class="mt-2">
                      <v-text-field
                        outlined label="ชื่อ" v-model="item.fname"
                        :error-messages="errors.fname"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="5" class="mt-2">
                      <v-text-field outlined label="นามสกุล" v-model="item.lname"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6" class="mt-n7">
                      <v-text-field outlined label="เบอร์โทร" v-model="item.tel"
                        :error-messages="errors.tel"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6" class="mt-n7">
                      <v-text-field outlined label="อีเมล" v-model="item.email"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6" class="mt-n7">
                      <v-text-field outlined label="วันเกิด" type="date" v-model="item.birthday"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6" class="mt-n7">
                      <v-select
                        outlined label="ระดับสมาชิก"
                        item-text="level_name" item-value="_id"
                        :items="levels" v-model="item.ref_level_id"
                      ></v-select>
                    </v-col>
                    <v-col cols="12" md="8" class="mt-n7">
                      <v-text-field outlined label="ที่อยู่" v-model="item.address"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="4" class="mt-n7">
                      <v-text-field outlined label="แต้มสะสม" type="number" v-model="item.point"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="7" class="mt-n7">
                      <v-text-field outlined label="LINE User ID" v-model="item.line_user_id"
                        prepend-inner-icon="mdi-chat" hint="ได้จากการเชื่อม LINE OA (LIFF/Webhook)" persistent-hint></v-text-field>
                    </v-col>
                    <v-col cols="12" md="5" class="mt-n7">
                      <v-text-field outlined label="ชื่อใน LINE" v-model="item.line_name"></v-text-field>
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
                  <v-icon dark class="mx-2"> mdi-delete </v-icon>ลบ</v-btn
                >
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
            <v-icon size="48" color="grey lighten-1">mdi-account-off-outline</v-icon>
            <div class="mt-2">ยังไม่มีสมาชิก</div>
          </div>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script>
export default {
  props: ["customer", "levels"],
  data: () => ({
    dialog: false,
    dialogDelete: false,
    loading: false,
    search: "",
    pnames: ["นาย", "นาง", "น.ส.", "ด.ช.", "ด.ญ."],
    headers: [
      { text: "คำนำหน้า", value: "pname" },
      { text: "ชื่อ", value: "fname" },
      { text: "นามสกุล", value: "lname" },
      { text: "เบอร์โทร", value: "tel" },
      { text: "อีเมล", value: "email" },
      { text: "ระดับ", value: "ref_level_id" },
      { text: "แต้ม", value: "point" },
      { text: "LINE", value: "line", sortable: false },
      { text: "Actions", value: "actions", sortable: false }
    ],
    errors: {},
    item: {},
    type: null,
    deleteId: null
  }),
  computed: {
    formTitle() {
      return this.type === "edit" ? "แก้ไขสมาชิก" : "เพิ่มสมาชิก";
    },
    totalPoints() {
      return (this.customer || []).reduce((s, c) => s + (Number(c.point) || 0), 0);
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
    blank() {
      return {
        pname: "นาย", fname: "", lname: "", tel: "", email: "",
        birthday: "", address: "", point: 0, ref_level_id: null,
        line_user_id: "", line_name: ""
      };
    },
    editItem(item) {
      this.type = "edit";
      this.item = {
        _id: item._id,
        pname: item.pname || "นาย",
        fname: item.fname,
        lname: item.lname,
        tel: item.tel,
        email: item.email,
        birthday: item.birthday,
        address: item.address,
        point: item.point,
        ref_level_id:
          item.ref_level_id && item.ref_level_id._id ? item.ref_level_id._id : item.ref_level_id,
        line_user_id: item.line_user_id || "",
        line_name: item.line_name || ""
      };
      this.errors = {};
      this.dialog = true;
    },
    addItem() {
      this.type = "add";
      this.item = this.blank();
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
        await this.$axios.$delete("/customer/" + this.deleteId);
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
      if (!this.item.fname) e.fname = "กรุณากรอกชื่อ";
      if (!this.item.tel) e.tel = "กรุณากรอกเบอร์โทร";
      this.errors = e;
      return Object.keys(e).length === 0;
    },
    async save() {
      if (!this.validate()) return;
      const payload = { ...this.item, point: Number(this.item.point) || 0 };
      this.loading = true;
      try {
        if (this.type === "add") {
          await this.$axios.$post("/customer", payload);
        } else {
          await this.$axios.$put("/customer/" + this.item._id, payload);
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
