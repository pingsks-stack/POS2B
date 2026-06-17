<template>
  <div class="ma-3">
    <v-card class="mx-auto mt-6 py-3 rounded-xl" elevation="5">
      <v-card-title>
        <v-btn color="primary" dark class="mr-5" @click="addItem">
          <v-icon left>mdi-tune-variant</v-icon> เพิ่มชุดตัวเลือก
        </v-btn>
        <v-spacer></v-spacer>
        <v-text-field v-model="search" append-icon="mdi-magnify" label="ค้นหา" single-line hide-details></v-text-field>
      </v-card-title>

      <v-data-table :headers="headers" :items="optiongroup" :search="search" :items-per-page="15">
        <template v-slot:[`item.choices`]="{ item }">
          <v-chip v-for="(c, i) in item.choices" :key="i" small label class="mr-1 my-1">
            {{ c.label }}<span v-if="c.price"> +{{ c.price }}</span>
          </v-chip>
        </template>
        <template v-slot:[`item.required`]="{ item }">
          <v-icon :color="item.required ? 'success' : 'grey lighten-1'">{{ item.required ? 'mdi-check-circle' : 'mdi-minus-circle-outline' }}</v-icon>
        </template>
        <template v-slot:[`item.multiple`]="{ item }">
          <v-icon :color="item.multiple ? 'success' : 'grey lighten-1'">{{ item.multiple ? 'mdi-check-circle' : 'mdi-minus-circle-outline' }}</v-icon>
        </template>
        <template v-slot:[`item.actions`]="{ item }">
          <v-btn small class="mr-2" color="warning" @click="editItem(item)"><v-icon small class="mr-1">mdi-pencil</v-icon>แก้ไข</v-btn>
          <v-btn small color="error" @click="deleteItem(item)"><v-icon small dark class="mr-1">mdi-delete</v-icon>ลบ</v-btn>
        </template>

        <template v-slot:top>
          <v-dialog v-model="dialog" max-width="640px">
            <v-card class="rounded-xl">
              <v-card-title><v-icon left>mdi-tune-variant</v-icon>{{ formTitle }}</v-card-title>
              <v-divider></v-divider>
              <v-card-text>
                <v-container>
                  <v-text-field class="mt-2" outlined label="ชื่อชุดตัวเลือก (เช่น ประเภท, ขนาด, ความหวาน)"
                    v-model="form.name" :error-messages="errors.name"></v-text-field>
                  <div class="d-flex">
                    <v-switch v-model="form.required" label="ต้องเลือก (จำเป็น)" inset class="mr-6 mt-0"></v-switch>
                    <v-switch v-model="form.multiple" label="เลือกได้หลายอย่าง" inset class="mt-0"></v-switch>
                  </div>
                  <div class="d-flex align-center mb-1">
                    <span class="font-weight-bold">ตัวเลือกย่อย</span>
                    <v-spacer></v-spacer>
                    <v-btn small outlined color="primary" @click="addChoice"><v-icon left small>mdi-plus</v-icon>เพิ่ม</v-btn>
                  </div>
                  <div v-for="(c, ci) in form.choices" :key="ci" class="d-flex align-center mt-2">
                    <v-text-field v-model="c.label" label="ชื่อตัวเลือก" dense outlined hide-details class="mr-2"></v-text-field>
                    <v-text-field v-model.number="c.price" label="+ราคา" type="number" dense outlined hide-details
                      style="max-width: 130px" class="mr-2"></v-text-field>
                    <v-btn icon small color="grey" @click="removeChoice(ci)"><v-icon>mdi-close</v-icon></v-btn>
                  </div>
                  <div v-if="errors.choices" class="error--text text-caption mt-2">{{ errors.choices }}</div>
                </v-container>
              </v-card-text>
              <v-card-actions class="px-4 pb-4">
                <v-btn color="primary" dark @click="close"><v-icon left>mdi-close</v-icon>ยกเลิก</v-btn>
                <v-spacer></v-spacer>
                <v-btn color="info" :loading="loading" @click="save"><v-icon left>mdi-content-save</v-icon>{{ type === 'edit' ? 'บันทึก' : 'เพิ่มข้อมูล' }}</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
          <v-dialog v-model="dialogDelete" max-width="320px">
            <v-card>
              <v-card-title class="text-h6 white--text primary">แน่ใจหรือไม่ที่จะลบ?</v-card-title>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="info" class="ma-2" @click="closeDelete">ยกเลิก</v-btn>
                <v-btn color="error" class="ma-2" :loading="loading" @click="deleteItemConfirm"><v-icon dark class="mx-2">mdi-delete</v-icon>ลบ</v-btn>
                <v-spacer></v-spacer>
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
  props: ["optiongroup"],
  data: () => ({
    dialog: false,
    dialogDelete: false,
    loading: false,
    search: "",
    headers: [
      { text: "ชื่อชุด", value: "name" },
      { text: "ตัวเลือกย่อย", value: "choices", sortable: false },
      { text: "จำเป็น", value: "required", align: "center" },
      { text: "หลายอย่าง", value: "multiple", align: "center" },
      { text: "Actions", value: "actions", sortable: false }
    ],
    form: { name: "", required: false, multiple: false, choices: [{ label: "", price: 0 }] },
    errors: {},
    type: null,
    deleteId: null
  }),
  computed: {
    formTitle() {
      return this.type === "edit" ? "แก้ไขชุดตัวเลือก" : "เพิ่มชุดตัวเลือก";
    }
  },
  watch: {
    dialog(v) { v || this.close(); },
    dialogDelete(v) { v || this.closeDelete(); }
  },
  methods: {
    blank() {
      return { name: "", required: false, multiple: false, choices: [{ label: "", price: 0 }] };
    },
    addChoice() { this.form.choices.push({ label: "", price: 0 }); },
    removeChoice(ci) { this.form.choices.splice(ci, 1); },
    addItem() {
      this.type = "add";
      this.form = this.blank();
      this.errors = {};
      this.dialog = true;
    },
    editItem(item) {
      this.type = "edit";
      this.form = {
        _id: item._id,
        name: item.name,
        required: !!item.required,
        multiple: !!item.multiple,
        choices: item.choices ? JSON.parse(JSON.stringify(item.choices)) : [{ label: "", price: 0 }]
      };
      this.errors = {};
      this.dialog = true;
    },
    deleteItem(item) { this.deleteId = item._id; this.dialogDelete = true; },
    async deleteItemConfirm() {
      this.loading = true;
      try {
        await this.$axios.$delete("/optiongroup/" + this.deleteId);
        this.$emit("refresh");
        this.closeDelete();
      } catch (e) { console.log(e); } finally { this.loading = false; }
    },
    close() { this.dialog = false; },
    closeDelete() { this.dialogDelete = false; },
    validate() {
      const e = {};
      if (!this.form.name) e.name = "กรุณากรอกชื่อชุดตัวเลือก";
      const choices = (this.form.choices || []).filter(c => c.label);
      if (!choices.length) e.choices = "ต้องมีตัวเลือกย่อยอย่างน้อย 1 รายการ";
      this.errors = e;
      return Object.keys(e).length === 0;
    },
    async save() {
      if (!this.validate()) return;
      const payload = {
        name: this.form.name,
        required: !!this.form.required,
        multiple: !!this.form.multiple,
        choices: (this.form.choices || [])
          .filter(c => c.label)
          .map(c => ({ label: c.label, price: Number(c.price) || 0 }))
      };
      this.loading = true;
      try {
        if (this.type === "add") await this.$axios.$post("/optiongroup", payload);
        else await this.$axios.$put("/optiongroup/" + this.form._id, payload);
        this.$emit("refresh");
        this.close();
      } catch (e) { console.log(e); } finally { this.loading = false; }
    }
  }
};
</script>
