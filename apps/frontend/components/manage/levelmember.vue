<template>
  <div class="ma-3">
    <v-card class="mx-auto mt-6 rounded-xl" elevation="5">
      <v-card-title class="pb-2">
        <v-icon left color="primary">mdi-medal-outline</v-icon>
        <span class="font-weight-bold">ระดับสมาชิก</span>
        <v-chip small class="ml-3" color="primary" outlined>{{ levels.length }} ระดับ</v-chip>
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search" append-icon="mdi-magnify" label="ค้นหา"
          single-line hide-details dense outlined style="max-width: 240px" class="mr-3"
        ></v-text-field>
        <v-btn color="primary" depressed @click="addItem">
          <v-icon left> mdi-plus </v-icon> เพิ่มระดับสมาชิก
        </v-btn>
      </v-card-title>
      <v-divider></v-divider>

      <v-data-table :headers="headers" :items="rows" :search="search" :items-per-page="15">
        <template v-slot:[`item.level_name`]="{ item }">
          <div class="d-flex align-center py-2">
            <v-avatar size="36" :color="hue(item.level_name)" class="mr-3"><v-icon dark small>mdi-medal</v-icon></v-avatar>
            <span class="font-weight-medium">{{ item.level_name }}</span>
          </div>
        </template>
        <template v-slot:[`item.point_rate`]="{ item }">
          <v-chip x-small color="teal" dark>x{{ item.point_rate }} แต้ม</v-chip>
        </template>
        <template v-slot:[`item.min_point`]="{ item }">
          <v-chip x-small color="amber darken-2" dark><v-icon x-small left>mdi-star</v-icon>{{ item.min_point || 0 }} แต้ม</v-chip>
        </template>
        <template v-slot:[`item.count`]="{ item }">
          <v-chip x-small :color="item.count ? 'amber darken-2' : 'grey lighten-1'" dark>{{ item.count }} คน</v-chip>
        </template>
        <template v-slot:no-data>
          <div class="pa-8 text-center grey--text">
            <v-icon size="48" color="grey lighten-1">mdi-medal-outline</v-icon>
            <div class="mt-2">ยังไม่มีระดับสมาชิก</div>
          </div>
        </template>
        <template v-slot:top>
          <v-dialog v-model="dialog" max-width="520px">
            <v-card>
              <v-card-title>
                <span class="text-h5"><v-icon left> mdi-medal </v-icon> {{ formTitle }}</span>
              </v-card-title>
              <v-card-text>
                <v-container>
                  <v-row>
                    <v-col cols="12" class="mt-2">
                      <v-text-field outlined label="ชื่อระดับ" v-model="item.level_name"
                        :error-messages="errorMsg"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6" class="mt-n7">
                      <v-text-field outlined type="number" label="อัตราแต้ม (เท่า)"
                        v-model="item.point_rate" prepend-inner-icon="mdi-close"
                        hint="ได้แต้มกี่เท่าเมื่อซื้อ" persistent-hint></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6" class="mt-n7">
                      <v-text-field outlined type="number" label="แต้มที่ต้องมีถึงจะได้ระดับนี้"
                        v-model="item.min_point" prepend-inner-icon="mdi-star"
                        hint="ลูกค้าจะเลื่อนขึ้นระดับนี้อัตโนมัติเมื่อแต้มถึง" persistent-hint></v-text-field>
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
      </v-data-table>
    </v-card>
  </div>
</template>

<script>
export default {
  props: ["levels", "customers"],
  data: () => ({
    dialog: false,
    dialogDelete: false,
    loading: false,
    search: "",
    errorMsg: "",
    headers: [
      { text: "ชื่อระดับ", value: "level_name" },
      { text: "อัตราแต้ม (เท่า)", value: "point_rate" },
      { text: "แต้มขั้นต่ำ", value: "min_point" },
      { text: "จำนวนสมาชิก", value: "count" },
      { text: "", value: "actions", sortable: false, align: "end" }
    ],
    item: { level_name: "", point_rate: 1, min_point: 0 },
    type: null,
    deleteId: null
  }),
  computed: {
    formTitle() {
      return this.type === "edit" ? "แก้ไขระดับสมาชิก" : "เพิ่มระดับสมาชิก";
    },
    countMap() {
      const m = {};
      (this.customers || []).forEach(c => {
        const id = c.ref_level_id && c.ref_level_id._id ? c.ref_level_id._id : c.ref_level_id;
        if (id) m[id] = (m[id] || 0) + 1;
      });
      return m;
    },
    rows() {
      return (this.levels || []).map(l => ({ ...l, count: this.countMap[l._id] || 0 }));
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
    hue(name) {
      const palette = ["primary", "teal", "indigo", "amber darken-2", "deep-orange", "purple"];
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
      this.item = { level_name: "", point_rate: 1, min_point: 0 };
      this.errorMsg = "";
      this.dialog = true;
    },
    deleteItem(item) {
      this.deleteId = item._id;
      this.dialogDelete = true;
    },
    async deleteItemConfirm() {
      this.loading = true;
      try {
        await this.$axios.$delete("/level/" + this.deleteId);
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
    async save() {
      if (!this.item.level_name || !this.item.level_name.trim()) {
        this.errorMsg = "กรุณากรอกชื่อระดับ";
        return;
      }
      const payload = {
        level_name: this.item.level_name,
        point_rate: Number(this.item.point_rate) || 1,
        min_point: Number(this.item.min_point) || 0
      };
      this.loading = true;
      try {
        if (this.type === "add") {
          await this.$axios.$post("/level", payload);
        } else {
          await this.$axios.$put("/level/" + this.item._id, payload);
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
