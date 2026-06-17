<template>
  <div class="ma-3">
    <v-card class="mx-auto mt-6 rounded-xl" elevation="5">
      <v-card-title class="pb-2">
        <v-icon left color="primary">mdi-warehouse</v-icon>
        <span class="font-weight-bold">คลังสินค้า / สต็อก</span>
        <v-chip small class="ml-3" color="error" outlined v-if="lowCount">{{ lowCount }} ใกล้หมด</v-chip>
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search" append-icon="mdi-magnify" label="ค้นหา"
          single-line hide-details dense outlined style="max-width: 240px" class="mr-3"
        ></v-text-field>
        <v-btn color="primary" depressed @click="addItem">
          <v-icon left>mdi-plus</v-icon> เพิ่ม Stock
        </v-btn>
      </v-card-title>
      <v-divider></v-divider>

      <v-data-table :headers="headers" :items="rows" :search="search" :items-per-page="15">
        <template v-slot:[`item.product_name`]="{ item }">
          <div class="d-flex align-center py-2">
            <v-avatar size="36" color="brown lighten-1" class="mr-3"><v-icon dark small>mdi-package-variant-closed</v-icon></v-avatar>
            <span class="font-weight-medium">{{ item.product_name }}</span>
          </div>
        </template>
        <template v-slot:[`item.stock_real`]="{ item }">
          <v-chip small dark :color="stockColor(item)">{{ item.stock_real }}</v-chip>
        </template>
        <template v-slot:[`item.status`]="{ item }">
          <v-chip :color="item.stock_real <= 0 ? 'red' : (item.stock_real <= item.qty_min ? 'orange' : 'success')" dark small>
            {{ item.stock_real <= 0 ? "หมด" : (item.stock_real <= item.qty_min ? "ใกล้หมด" : "ปกติ") }}
          </v-chip>
        </template>
        <template v-slot:[`item.actions`]="{ item }">
          <v-btn small depressed color="success" class="mr-2" @click="openStockIn(item)">
            <v-icon small class="mr-1">mdi-cart-arrow-down</v-icon>รับเข้า
          </v-btn>
          <v-btn small text color="primary" @click="editItem(item)"><v-icon small class="mr-1">mdi-pencil</v-icon>แก้ไข</v-btn>
          <v-btn small text color="error" @click="deleteItem(item)"><v-icon small class="mr-1">mdi-delete</v-icon>ลบ</v-btn>
        </template>
        <template v-slot:no-data>
          <div class="pa-8 text-center grey--text">
            <v-icon size="48" color="grey lighten-1">mdi-warehouse</v-icon>
            <div class="mt-2">ยังไม่มีข้อมูลสต็อก — กด “เพิ่ม Stock”</div>
          </div>
        </template>

        <template v-slot:top>
          <v-dialog v-model="dialog" max-width="560px">
            <v-card class="rounded-xl">
              <v-card-title><v-icon left color="primary">mdi-warehouse</v-icon>{{ formTitle }}</v-card-title>
              <v-divider></v-divider>
              <v-card-text class="pt-4">
                <v-container>
                  <v-row>
                    <v-col cols="12">
                      <v-select outlined label="สินค้า" item-text="product_name" item-value="_id"
                        :items="products" v-model="item.ref_pro_id"
                        :error-messages="errors.ref_pro_id"></v-select>
                    </v-col>
                    <v-col cols="12" md="6" class="mt-n7">
                      <v-text-field outlined type="number" label="จำนวนคงเหลือ (สูงสุด)"
                        v-model="item.qty_max"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6" class="mt-n7">
                      <v-text-field outlined type="number" label="จุดแจ้งเตือน (ต่ำสุด)"
                        v-model="item.qty_min"></v-text-field>
                    </v-col>
                  </v-row>
                </v-container>
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

          <!-- stock-in (รับสินค้าเข้า -> เพิ่มสต็อกจริงของสินค้า) -->
          <v-dialog v-model="stockInDl" max-width="400px">
            <v-card class="rounded-xl" v-if="stockInItem">
              <v-card-title><v-icon left color="success">mdi-cart-arrow-down</v-icon>รับสินค้าเข้า</v-card-title>
              <v-divider></v-divider>
              <v-card-text class="pt-4">
                <div class="mb-2">{{ stockInItem.product_name }} · คงเหลือปัจจุบัน <b>{{ stockInItem.stock_real }}</b></div>
                <v-text-field outlined type="number" label="จำนวนที่รับเข้า" v-model="stockInQty"
                  prepend-inner-icon="mdi-plus" autofocus @keyup.enter="saveStockIn"></v-text-field>
                <div class="success--text">คงเหลือใหม่: <b>{{ (Number(stockInItem.stock_real) || 0) + (Number(stockInQty) || 0) }}</b></div>
              </v-card-text>
              <v-card-actions class="px-4 pb-4">
                <v-btn text @click="stockInDl = false">ยกเลิก</v-btn>
                <v-spacer></v-spacer>
                <v-btn color="success" depressed :loading="loading" @click="saveStockIn">
                  <v-icon left>mdi-check</v-icon>รับเข้า
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>

          <v-dialog v-model="dialogDelete" max-width="320px">
            <v-card class="rounded-xl">
              <v-card-title class="text-h6">ยืนยันการลบ?</v-card-title>
              <v-card-actions class="px-4 pb-4">
                <v-spacer></v-spacer>
                <v-btn color="grey darken-1" text @click="closeDelete">ยกเลิก</v-btn>
                <v-btn color="error" depressed :loading="loading" @click="deleteItemConfirm">
                  <v-icon left>mdi-delete</v-icon>ลบ</v-btn>
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
  props: ["stock", "products"],
  data: () => ({
    dialog: false,
    dialogDelete: false,
    stockInDl: false,
    stockInItem: null,
    stockInQty: 0,
    loading: false,
    search: "",
    headers: [
      { text: "สินค้า", value: "product_name" },
      { text: "สต็อกจริง", value: "stock_real" },
      { text: "ตั้งคงเหลือ", value: "qty_max" },
      { text: "จุดแจ้งเตือน", value: "qty_min" },
      { text: "สถานะ", value: "status", sortable: false },
      { text: "", value: "actions", sortable: false, align: "end" }
    ],
    item: {},
    errors: {},
    type: null,
    deleteId: null
  }),
  computed: {
    rows() {
      return (this.stock || []).map(s => {
        const ref = s.ref_pro_id && s.ref_pro_id._id ? s.ref_pro_id._id : s.ref_pro_id;
        const p = (this.products || []).find(x => x._id === ref);
        return {
          ...s,
          ref_pro_id: ref,
          product_name: p ? p.product_name : "(ไม่พบสินค้า)",
          stock_real: p && typeof p.stock === "number" ? p.stock : 0
        };
      });
    },
    lowCount() {
      return this.rows.filter(r => r.stock_real <= (Number(r.qty_min) || 0)).length;
    },
    formTitle() {
      return this.type === "edit" ? "แก้ไข Stock" : "เพิ่ม Stock";
    }
  },
  watch: {
    dialog(val) { val || this.close(); },
    dialogDelete(val) { val || this.closeDelete(); }
  },
  methods: {
    stockColor(item) {
      if (item.stock_real <= 0) return "red";
      if (item.stock_real <= item.qty_min) return "orange";
      return "green";
    },
    editItem(item) {
      this.type = "edit";
      this.item = { _id: item._id, ref_pro_id: item.ref_pro_id, qty_max: item.qty_max, qty_min: item.qty_min };
      this.errors = {};
      this.dialog = true;
    },
    addItem() {
      this.type = "add";
      this.item = { ref_pro_id: null, qty_max: 0, qty_min: 0 };
      this.errors = {};
      this.dialog = true;
    },
    openStockIn(item) {
      this.stockInItem = item;
      this.stockInQty = 0;
      this.stockInDl = true;
    },
    async saveStockIn() {
      const add = Number(this.stockInQty) || 0;
      if (add <= 0) return;
      this.loading = true;
      try {
        const newStock = (Number(this.stockInItem.stock_real) || 0) + add;
        await this.$axios.$put("/product/" + this.stockInItem.ref_pro_id, { stock: newStock });
        this.stockInDl = false;
        this.$emit("refresh");
      } catch (e) {
        console.log(e);
      } finally {
        this.loading = false;
      }
    },
    deleteItem(item) {
      this.deleteId = item._id;
      this.dialogDelete = true;
    },
    async deleteItemConfirm() {
      this.loading = true;
      try {
        await this.$axios.$delete("/stock/" + this.deleteId);
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
      if (!this.item.ref_pro_id) {
        this.errors = { ref_pro_id: "กรุณาเลือกสินค้า" };
        return;
      }
      const payload = {
        ref_pro_id: this.item.ref_pro_id,
        qty_max: Number(this.item.qty_max) || 0,
        qty_min: Number(this.item.qty_min) || 0
      };
      this.loading = true;
      try {
        if (this.type === "add") {
          await this.$axios.$post("/stock", payload);
        } else {
          await this.$axios.$put("/stock/" + this.item._id, payload);
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
