<template>
  <div class="ma-3">
    <v-card class="mx-auto mt-6 py-3" elevation="5">
      <v-card-title>
        <v-btn color="primary" dark class="mr-5" @click="addItem">
          <v-icon left> mdi-coffee </v-icon> เพิ่มสินค้า
        </v-btn>
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="ค้นหา"
          single-line
          hide-details
        ></v-text-field>
      </v-card-title>

      <v-data-table :headers="headers" :items="product" :search="search" :items-per-page="15">
        <template v-slot:[`item.img`]="{ item }">
          <img
            v-if="item.img"
            :src="$img(item.img)"
            class="mt-2 mb-2 rounded-xl"
            style="width: 90px; height: 90px; object-fit: cover"
          />
          <v-icon v-else size="60" color="grey lighten-1">mdi-image-off</v-icon>
        </template>
        <template v-slot:top>
          <v-dialog v-model="dialog" max-width="700px">
            <v-card>
              <v-card-title>
                <span class="text-h5"
                  ><v-icon left> mdi-coffee </v-icon> {{ formTitle }}</span
                >
              </v-card-title>

              <v-card-text>
                <v-container>
                  <v-row>
                    <v-col cols="12" class="mt-2">
                      <v-text-field
                        outlined
                        label="ชื่อสินค้า"
                        v-model="products.product_name"
                        :error-messages="errors.product_name"
                        color="#1D1D1D"
                      ></v-text-field>
                    </v-col>

                    <v-col cols="12" md="6" class="mt-n7">
                      <v-select
                        label="ประเภท"
                        outlined
                        color="#1D1D1D"
                        item-text="name"
                        item-value="_id"
                        :items="categoryname"
                        v-model="products.ref_cate_id"
                        :error-messages="errors.ref_cate_id"
                      ></v-select>
                    </v-col>
                    <v-col cols="12" md="6" class="mt-n7">
                      <v-select
                        label="หน่วย"
                        outlined
                        color="#1D1D1D"
                        item-text="name"
                        item-value="_id"
                        :items="unitname"
                        v-model="products.ref_uid"
                        :error-messages="errors.ref_uid"
                      ></v-select>
                    </v-col>
                    <v-col cols="12" md="4" class="mt-n7">
                      <v-text-field
                        outlined
                        label="ราคาต้นทุน"
                        type="number"
                        v-model="products.price_cost"
                        color="#1D1D1D"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="4" class="mt-n7">
                      <v-text-field
                        outlined
                        label="ราคาขาย"
                        type="number"
                        v-model="products.price"
                        :error-messages="errors.price"
                        color="#1D1D1D"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="4" class="mt-n7">
                      <v-text-field
                        outlined
                        label="จำนวน Stock"
                        type="number"
                        v-model="products.stock"
                        color="#1D1D1D"
                      ></v-text-field>
                    </v-col>

                    <v-col cols="12" class="mt-n7">
                      <v-file-input
                        v-model="imgFile"
                        label="รูปสินค้า"
                        outlined
                        show-size
                        dense
                        accept="image/*"
                        color="#1D1D1D"
                        :loading="uploading"
                        @change="saveImage"
                      ></v-file-input>
                      <img
                        v-if="products.img"
                        :src="$img(products.img)"
                        style="max-height: 120px"
                        class="rounded-lg"
                      />
                    </v-col>

                    <!-- REUSABLE OPTION GROUPS (created in ชุดตัวเลือก) -->
                    <v-col cols="12" class="mt-n4">
                      <div class="d-flex align-center mb-2">
                        <v-icon left>mdi-tune-variant</v-icon>
                        <span class="font-weight-bold">ชุดตัวเลือก (เลือกจากที่สร้างไว้)</span>
                        <v-spacer></v-spacer>
                        <v-btn small text color="primary" to="/manage/optiongroup" target="_blank">
                          <v-icon left small>mdi-cog-outline</v-icon>จัดการชุดตัวเลือก
                        </v-btn>
                      </div>
                      <v-select
                        outlined chips deletable-chips multiple small-chips
                        color="#1D1D1D"
                        :items="optiongroup || []"
                        item-text="name" item-value="_id"
                        v-model="products.option_group_ids"
                        placeholder="เช่น ประเภท, ขนาด, ความหวาน"
                        hint="สร้างครั้งเดียวที่หน้า 'ชุดตัวเลือก' แล้วเลือกใส่เมนูได้เลย"
                        persistent-hint
                      >
                        <template v-slot:item="{ item }">
                          <v-list-item-content>
                            <v-list-item-title>{{ item.name }}</v-list-item-title>
                            <v-list-item-subtitle>
                              {{ (item.choices || []).map(c => c.label).join(' · ') }}
                            </v-list-item-subtitle>
                          </v-list-item-content>
                        </template>
                      </v-select>
                    </v-col>

                    <!-- PER-PRODUCT CUSTOM OPTIONS (optional) -->
                    <v-col cols="12" class="mt-n2">
                      <div class="d-flex align-center mb-2">
                        <v-icon left>mdi-pencil-plus-outline</v-icon>
                        <span class="font-weight-bold">ตัวเลือกเฉพาะเมนูนี้ (ถ้ามี)</span>
                        <v-spacer></v-spacer>
                        <v-btn small outlined color="primary" @click="addOptionGroup">
                          <v-icon left small>mdi-plus</v-icon>เพิ่มกลุ่มเฉพาะ
                        </v-btn>
                      </div>
                      <v-card
                        v-for="(g, gi) in products.options" :key="gi"
                        outlined class="pa-3 mb-2 rounded-lg"
                      >
                        <div class="d-flex align-center flex-wrap">
                          <v-text-field
                            v-model="g.name" label="ชื่อกลุ่ม" dense outlined hide-details
                            style="max-width: 200px" class="mr-3"
                          ></v-text-field>
                          <v-switch v-model="g.required" label="จำเป็น" dense hide-details class="mr-3 mt-0"></v-switch>
                          <v-switch v-model="g.multiple" label="เลือกหลายอย่าง" dense hide-details class="mt-0"></v-switch>
                          <v-spacer></v-spacer>
                          <v-btn icon color="error" @click="removeOptionGroup(gi)"><v-icon>mdi-delete</v-icon></v-btn>
                        </div>
                        <div v-for="(c, ci) in g.choices" :key="ci" class="d-flex align-center mt-2">
                          <v-text-field v-model="c.label" label="ตัวเลือก" dense outlined hide-details class="mr-2"></v-text-field>
                          <v-text-field
                            v-model.number="c.price" label="+ราคา" type="number" dense outlined hide-details
                            style="max-width: 120px" class="mr-2"
                          ></v-text-field>
                          <v-btn icon small color="grey" @click="removeChoice(gi, ci)"><v-icon>mdi-close</v-icon></v-btn>
                        </div>
                        <v-btn text small color="primary" class="mt-2" @click="addChoice(gi)">
                          <v-icon left small>mdi-plus</v-icon>เพิ่มตัวเลือกย่อย
                        </v-btn>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-container>
              </v-card-text>

              <v-card-actions>
                <v-btn class="ma-1" color="primary" dark @click="close">
                  <v-icon class="mx-2"> mdi-close </v-icon>
                  ยกเลิก
                </v-btn>
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
              <v-card-title class="text-h6 white--text primary">
                แน่ใจหรือไม่ที่จะลบ?
              </v-card-title>
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
          <v-btn small class="mr-2" color="warning" @click="editItem(item)">
            <v-icon small class="mr-1"> mdi-pencil </v-icon>
            แก้ไข
          </v-btn>
          <v-btn small color="error" @click="deleteItem(item)">
            <v-icon small dark class="mr-1"> mdi-delete </v-icon>
            ลบ
          </v-btn>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script>
export default {
  props: ["product", "unit", "category", "optiongroup"],
  data: () => ({
    dialog: false,
    dialogDelete: false,
    loading: false,
    uploading: false,
    search: "",
    imgFile: null,
    headers: [
      { text: "ภาพ", sortable: false, value: "img" },
      { text: "ชื่อสินค้า", sortable: false, value: "product_name" },
      { text: "หน่วย", sortable: false, value: "ref_uid.u_name" },
      { text: "ประเภท", sortable: false, value: "ref_cate_id.cate_name" },
      { text: "ราคาต้นทุน", sortable: false, value: "price_cost" },
      { text: "ราคา", sortable: false, value: "price" },
      { text: "สต็อก", sortable: false, value: "stock" },
      { text: "Actions", value: "actions", sortable: false }
    ],
    products: {
      product_name: "",
      ref_uid: "",
      ref_cate_id: "",
      price_cost: 0,
      price: 0,
      stock: 0,
      img: "",
      option_group_ids: [],
      options: []
    },
    errors: {},
    type: null,
    deleteId: null
  }),
  computed: {
    imgBase() {
      return this.$axios.defaults.baseURL.replace("/api", "/");
    },
    unitname() {
      return (this.unit || []).map(u => ({ _id: u._id, name: u.u_name }));
    },
    categoryname() {
      return (this.category || []).map(c => ({ _id: c._id, name: c.cate_name }));
    },
    formTitle() {
      return this.type === "edit" ? "แก้ไขสินค้า" : "เพิ่มสินค้า";
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
    async saveImage(file) {
      if (!file) return;
      const imageData = new FormData();
      imageData.append("file", file);
      this.uploading = true;
      try {
        const result = await this.$axios.post("/product", imageData);
        this.products.img = result.data.url;
      } catch (error) {
        console.log(error.response || error);
      } finally {
        this.uploading = false;
      }
    },
    blankProduct() {
      return {
        product_name: "",
        ref_uid: "",
        ref_cate_id: "",
        price_cost: 0,
        price: 0,
        stock: 0,
        img: "",
        option_group_ids: [],
        options: []
      };
    },
    addOptionGroup() {
      if (!this.products.options) this.$set(this.products, "options", []);
      this.products.options.push({ name: "", required: false, multiple: false, choices: [{ label: "", price: 0 }] });
    },
    removeOptionGroup(gi) {
      this.products.options.splice(gi, 1);
    },
    addChoice(gi) {
      this.products.options[gi].choices.push({ label: "", price: 0 });
    },
    removeChoice(gi, ci) {
      this.products.options[gi].choices.splice(ci, 1);
    },
    editItem(item) {
      this.type = "edit";
      // flatten populated refs back to ids for the selects
      this.products = {
        _id: item._id,
        product_name: item.product_name,
        ref_uid: item.ref_uid && item.ref_uid._id ? item.ref_uid._id : item.ref_uid,
        ref_cate_id:
          item.ref_cate_id && item.ref_cate_id._id ? item.ref_cate_id._id : item.ref_cate_id,
        price_cost: item.price_cost,
        price: item.price,
        stock: item.stock,
        img: item.img || "",
        option_group_ids: Array.isArray(item.option_group_ids) ? [...item.option_group_ids] : [],
        // edit only the per-product custom options (not the resolved group options)
        options: item.custom_options
          ? JSON.parse(JSON.stringify(item.custom_options))
          : []
      };
      this.imgFile = null;
      this.errors = {};
      this.dialog = true;
    },
    addItem() {
      this.type = "add";
      this.products = this.blankProduct();
      this.imgFile = null;
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
        await this.$axios.$delete("/product/" + this.deleteId);
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
      if (!this.products.product_name) e.product_name = "กรุณากรอกชื่อสินค้า";
      if (!this.products.ref_cate_id) e.ref_cate_id = "เลือกประเภท";
      if (!this.products.ref_uid) e.ref_uid = "เลือกหน่วย";
      if (this.products.price === "" || this.products.price === null) e.price = "กรอกราคา";
      this.errors = e;
      return Object.keys(e).length === 0;
    },
    async save() {
      if (!this.validate()) return;
      const payload = {
        product_name: this.products.product_name,
        ref_cate_id: this.products.ref_cate_id,
        ref_uid: this.products.ref_uid,
        price_cost: Number(this.products.price_cost) || 0,
        price: Number(this.products.price) || 0,
        stock: Number(this.products.stock) || 0,
        img: this.products.img || "",
        option_group_ids: this.products.option_group_ids || [],
        options: (this.products.options || []).filter(g => g.name && g.choices && g.choices.length)
      };
      this.loading = true;
      try {
        if (this.type === "add") {
          await this.$axios.$post("/product", payload);
        } else {
          await this.$axios.$put("/product/" + this.products._id, payload);
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
