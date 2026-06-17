<template>
  <div class="ma-3">
    <v-card class="mx-auto mt-6 rounded-xl" elevation="5">
      <v-card-title class="pb-2">
        <v-icon left color="primary">mdi-card-account-details-outline</v-icon>
        <span class="font-weight-bold">พนักงาน</span>
        <v-chip small class="ml-3" color="primary" outlined>{{ employee.length }} คน</v-chip>
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search" append-icon="mdi-magnify" label="ค้นหา"
          single-line hide-details dense outlined style="max-width: 240px" class="mr-3"
        ></v-text-field>
        <v-btn color="primary" depressed @click="addItem">
          <v-icon left> mdi-plus </v-icon> เพิ่มพนักงาน
        </v-btn>
      </v-card-title>
      <v-divider></v-divider>

      <v-data-table :headers="headers" :items="employee" :search="search" :items-per-page="15">
        <template v-slot:[`item.fname`]="{ item }">
          <div class="d-flex align-center py-2">
            <v-avatar size="36" :color="roleColor(item)" class="mr-3"><v-icon dark small>mdi-account</v-icon></v-avatar>
            <span class="font-weight-medium">{{ item.fname }}</span>
          </div>
        </template>
        <template v-slot:[`item.ref_id_role`]="{ item }">
          <v-chip x-small dark :color="roleColor(item)">{{ roleName(item) }}</v-chip>
        </template>
        <template v-slot:top>
          <v-dialog v-model="dialog" max-width="800px">
            <v-card>
              <v-card-title>
                <span class="text-h5"><v-icon left> mdi-account-box </v-icon> {{ formTitle }}</span>
              </v-card-title>
              <v-card-text>
                <v-container>
                  <v-row>
                    <v-col cols="12" md="3" class="mt-2">
                      <v-select outlined label="คำนำหน้า" :items="pnames" v-model="emp.pname"></v-select>
                    </v-col>
                    <v-col cols="12" md="4" class="mt-2">
                      <v-text-field outlined label="ชื่อ" v-model="emp.fname"
                        :error-messages="errors.fname"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="5" class="mt-2">
                      <v-text-field outlined label="นามสกุล" v-model="emp.lname"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6" class="mt-n7">
                      <v-text-field outlined label="ชื่อผู้ใช้ (username)" v-model="emp.username"
                        :error-messages="errors.username"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6" class="mt-n7">
                      <v-text-field outlined label="รหัสผ่าน" type="password" v-model="emp.password"
                        :hint="type === 'edit' ? 'เว้นว่างไว้หากไม่เปลี่ยน' : ''" persistent-hint
                        :error-messages="errors.password"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6" class="mt-n3">
                      <v-text-field outlined label="PIN (4-6 หลัก สำหรับล็อกอินเร็ว)" type="number"
                        v-model="emp.pin" prepend-inner-icon="mdi-dialpad"
                        hint="ใช้กดเข้าระบบแบบเร็วหน้าล็อกอิน" persistent-hint></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6" class="mt-n3">
                      <v-text-field outlined label="เลขบัตรประชาชน" v-model="emp.idcard"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6" class="mt-n3">
                      <v-text-field outlined label="วันเกิด" type="date" v-model="emp.birthday"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6" class="mt-n7">
                      <v-text-field outlined label="เบอร์โทร" v-model="emp.tel"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6" class="mt-n7">
                      <v-text-field outlined label="อีเมล" v-model="emp.email"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="8" class="mt-n7">
                      <v-text-field outlined label="ที่อยู่" v-model="emp.address"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="4" class="mt-n7">
                      <v-select outlined label="ตำแหน่ง" item-text="position" item-value="_id"
                        :items="roles" v-model="emp.ref_id_role"></v-select>
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
            <v-icon size="48" color="grey lighten-1">mdi-account-off-outline</v-icon>
            <div class="mt-2">ยังไม่มีพนักงาน</div>
          </div>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script>
export default {
  props: ["employee", "roles"],
  data: () => ({
    dialog: false,
    dialogDelete: false,
    loading: false,
    search: "",
    pnames: ["นาย", "นาง", "นางสาว"],
    headers: [
      { text: "คำนำหน้า", sortable: false, value: "pname" },
      { text: "ชื่อจริง", value: "fname" },
      { text: "นามสกุล", value: "lname" },
      { text: "เลขบัตรประชาชน", sortable: false, value: "idcard" },
      { text: "เบอร์โทร", sortable: false, value: "tel" },
      { text: "อีเมล", sortable: false, value: "email" },
      { text: "ตำแหน่ง", sortable: false, value: "ref_id_role" },
      { text: "ชื่อผู้ใช้", value: "username" },
      { text: "ดำเนินการ", value: "actions", sortable: false }
    ],
    emp: {},
    errors: {},
    type: null,
    deleteId: null
  }),
  computed: {
    formTitle() {
      return this.type === "edit" ? "แก้ไขพนักงาน" : "เพิ่มพนักงาน";
    }
  },
  created() {
    // role helpers
    this.roleName = item => {
      const pos = item.ref_id_role && item.ref_id_role.position ? item.ref_id_role.position : "-";
      return { admin: "ผู้ดูแล", cashier: "แคชเชียร์", staff: "พนักงาน", member: "สมาชิก" }[pos] || pos;
    };
    this.roleColor = item => {
      const pos = item.ref_id_role && item.ref_id_role.position ? item.ref_id_role.position : "";
      return { admin: "deep-purple", cashier: "primary", staff: "teal", member: "blue-grey" }[pos] || "grey";
    };
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
        pname: "นาย", fname: "", lname: "", username: "", password: "", pin: "",
        idcard: "", birthday: "", tel: "", email: "", address: "", ref_id_role: null
      };
    },
    editItem(item) {
      this.type = "edit";
      this.emp = {
        _id: item._id,
        pname: item.pname || "นาย",
        fname: item.fname,
        lname: item.lname,
        username: item.username,
        password: "",
        pin: item.pin || "",
        idcard: item.idcard,
        birthday: item.birthday,
        tel: item.tel,
        email: item.email,
        address: item.address,
        ref_id_role:
          item.ref_id_role && item.ref_id_role._id ? item.ref_id_role._id : item.ref_id_role
      };
      this.errors = {};
      this.dialog = true;
    },
    addItem() {
      this.type = "add";
      this.emp = this.blank();
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
        await this.$axios.$delete("/employee/" + this.deleteId);
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
      if (!this.emp.fname) e.fname = "กรุณากรอกชื่อ";
      if (!this.emp.username) e.username = "กรุณากรอกชื่อผู้ใช้";
      if (this.type === "add" && !this.emp.password) e.password = "กรุณากรอกรหัสผ่าน";
      this.errors = e;
      return Object.keys(e).length === 0;
    },
    async save() {
      if (!this.validate()) return;
      const payload = { ...this.emp };
      if (this.type === "edit" && !payload.password) delete payload.password;
      this.loading = true;
      try {
        if (this.type === "add") {
          await this.$axios.$post("/employee", payload);
        } else {
          await this.$axios.$put("/employee/" + this.emp._id, payload);
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
