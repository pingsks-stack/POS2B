<template>
  <div class="ma-3">
    <v-card class="mx-auto mt-6 rounded-xl" elevation="5">
      <v-card-title class="pb-2">
        <v-icon left color="primary">mdi-scale-balance</v-icon>
        <span class="font-weight-bold">หน่วยนับ</span>
        <v-chip small class="ml-3" color="primary" outlined>{{ unit.length }} หน่วย</v-chip>
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search" append-icon="mdi-magnify" label="ค้นหา"
          single-line hide-details dense outlined style="max-width: 240px" class="mr-3"
        ></v-text-field>
        <v-btn color="primary" depressed @click="addItem">
          <v-icon left>mdi-plus</v-icon> เพิ่มหน่วยนับ
        </v-btn>
      </v-card-title>
      <v-divider></v-divider>

      <v-data-table :headers="headers" :items="rows" :search="search" :items-per-page="15" class="unit-table">
        <template v-slot:[`item.u_name`]="{ item }">
          <div class="d-flex align-center py-2">
            <v-avatar size="38" :color="hue(item.u_name)" class="mr-3">
              <v-icon dark small>mdi-cup-outline</v-icon>
            </v-avatar>
            <span class="font-weight-medium">{{ item.u_name }}</span>
          </div>
        </template>
        <template v-slot:[`item.count`]="{ item }">
          <v-chip small :color="item.count ? 'primary' : 'grey lighten-1'" :outlined="!item.count" dark>
            <v-icon x-small left>mdi-coffee</v-icon>{{ item.count }} สินค้า
          </v-chip>
        </template>
        <template v-slot:[`item.actions`]="{ item }">
          <v-btn small text color="primary" @click="editItem(item)"><v-icon small class="mr-1">mdi-pencil</v-icon>แก้ไข</v-btn>
          <v-btn small text color="error" @click="deleteItem(item)"><v-icon small class="mr-1">mdi-delete</v-icon>ลบ</v-btn>
        </template>
        <template v-slot:no-data>
          <div class="pa-8 text-center grey--text">
            <v-icon size="48" color="grey lighten-1">mdi-scale-balance</v-icon>
            <div class="mt-2">ยังไม่มีหน่วยนับ — กด “เพิ่มหน่วยนับ” เพื่อเริ่ม</div>
          </div>
        </template>

        <template v-slot:top>
          <v-dialog v-model="dialog" max-width="460px">
            <v-card class="rounded-xl">
              <v-card-title><v-icon left color="primary">mdi-scale-balance</v-icon>{{ formTitle }}</v-card-title>
              <v-divider></v-divider>
              <v-card-text class="pt-4">
                <v-text-field
                  outlined v-model="item.u_name" label="ชื่อหน่วยนับ"
                  :error-messages="errorMsg" autofocus @keyup.enter="save"
                  prepend-inner-icon="mdi-ruler" hint="เช่น แก้ว, ชิ้น, ขวด, จาน" persistent-hint
                ></v-text-field>
              </v-card-text>
              <v-card-actions class="px-4 pb-4">
                <v-btn color="primary" text @click="close">ยกเลิก</v-btn>
                <v-spacer></v-spacer>
                <v-btn color="primary" depressed :loading="loading" @click="save">
                  <v-icon left>mdi-content-save</v-icon>{{ type === "edit" ? "บันทึก" : "เพิ่มข้อมูล" }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
          <v-dialog v-model="dialogDelete" max-width="360px">
            <v-card class="rounded-xl">
              <v-card-title class="text-h6">ยืนยันการลบ?</v-card-title>
              <v-card-text>
                ลบหน่วยนับ <b>{{ item.u_name }}</b>
                <div v-if="item.count" class="error--text mt-2">
                  <v-icon small color="error" left>mdi-alert</v-icon>
                  มีสินค้า {{ item.count }} รายการใช้หน่วยนี้อยู่
                </div>
              </v-card-text>
              <v-card-actions class="px-4 pb-4">
                <v-spacer></v-spacer>
                <v-btn color="grey darken-1" text @click="closeDelete">ยกเลิก</v-btn>
                <v-btn color="error" depressed :loading="loading" @click="deleteItemConfirm">
                  <v-icon left>mdi-delete</v-icon>ลบ
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script>
export default {
  props: ["unit", "products"],
  data: () => ({
    dialog: false,
    dialogDelete: false,
    loading: false,
    search: "",
    errorMsg: "",
    headers: [
      { text: "หน่วยนับ", align: "start", value: "u_name" },
      { text: "จำนวนสินค้า", align: "start", value: "count" },
      { text: "", value: "actions", sortable: false, align: "end" }
    ],
    item: { _id: "", u_name: "", count: 0 },
    type: null,
    deleteId: null
  }),
  computed: {
    formTitle() {
      return this.type === "edit" ? "แก้ไขหน่วยนับ" : "เพิ่มหน่วยนับ";
    },
    countMap() {
      const m = {};
      (this.products || []).forEach(p => {
        const id = p.ref_uid && p.ref_uid._id ? p.ref_uid._id : p.ref_uid;
        if (id) m[id] = (m[id] || 0) + 1;
      });
      return m;
    },
    rows() {
      return (this.unit || []).map(u => ({ ...u, count: this.countMap[u._id] || 0 }));
    }
  },
  watch: {
    dialog(val) { val || this.close(); },
    dialogDelete(val) { val || this.closeDelete(); }
  },
  methods: {
    hue(name) {
      const palette = ["primary", "teal", "indigo", "deep-orange", "purple", "cyan darken-1", "pink darken-1", "blue darken-1"];
      let h = 0;
      for (const ch of String(name || "")) h = (h + ch.charCodeAt(0)) % palette.length;
      return palette[h];
    },
    editItem(item) {
      this.type = "edit";
      this.item = Object.assign({}, item);
      this.errorMsg = "";
      this.dialog = true;
    },
    addItem() {
      this.type = "add";
      this.item = { _id: "", u_name: "", count: 0 };
      this.errorMsg = "";
      this.dialog = true;
    },
    deleteItem(item) {
      this.item = Object.assign({}, item);
      this.deleteId = item._id;
      this.dialogDelete = true;
    },
    async deleteItemConfirm() {
      this.loading = true;
      try {
        await this.$axios.$delete("/unit/" + this.deleteId);
        this.$emit("refresh");
        this.closeDelete();
      } catch (e) {
        console.log(e);
      } finally {
        this.loading = false;
      }
    },
    close() { this.dialog = false; },
    closeDelete() { this.dialogDelete = false; },
    async save() {
      if (!this.item.u_name || !this.item.u_name.trim()) {
        this.errorMsg = "กรุณากรอกชื่อหน่วยนับ";
        return;
      }
      this.loading = true;
      try {
        if (this.type === "add") {
          await this.$axios.$post("/unit", { u_name: this.item.u_name });
        } else {
          await this.$axios.$put("/unit/" + this.item._id, { u_name: this.item.u_name });
        }
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

<style scoped>
.unit-table >>> td { height: 60px; }
</style>
