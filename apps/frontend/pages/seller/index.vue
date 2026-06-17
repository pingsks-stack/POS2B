<template>
  <div class="ma-3">
    <v-row>
      <!-- LEFT: products -->
      <v-col cols="12" sm="12" md="8">
        <v-card class="rounded-xl pos-panel" elevation="0">
          <div class="d-flex align-center px-5 pt-4 pb-1 flex-wrap">
            <img v-if="settings.show_logo && settings.logo" :src="$img(settings.logo)"
              style="max-height:36px" class="mr-3" />
            <div class="cate-title mr-4">{{ cateName }}</div>
            <v-spacer></v-spacer>
            <v-text-field
              v-model="keyword" @input="searchProduct" placeholder="ค้นหาสินค้า"
              prepend-inner-icon="mdi-magnify" rounded filled dense hide-details
              background-color="grey lighten-4" style="max-width: 340px"
            ></v-text-field>
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-btn icon class="ml-2" v-bind="attrs" v-on="on" @click="toggleFullscreen">
                  <v-icon>{{ isFullscreen ? "mdi-fullscreen-exit" : "mdi-fullscreen" }}</v-icon>
                </v-btn>
              </template>
              <span>{{ isFullscreen ? "ออกจากเต็มจอ" : "เต็มจอ" }}</span>
            </v-tooltip>
          </div>
          <div class="px-4">
            <v-chip-group v-model="cateChip" mandatory show-arrows active-class="primary--text">
              <v-chip filter outlined large @click="showAll">
                <v-icon left small>mdi-view-grid</v-icon>ทั้งหมด
              </v-chip>
              <v-chip v-for="cate in categories" :key="cate._id" filter outlined large @click="changCate(cate)">
                <v-icon left small>mdi-coffee-outline</v-icon>{{ cate.cate_name }}
              </v-chip>
            </v-chip-group>
          </div>
          <div class="scroll pos-products d-flex flex-row flex-wrap overflow-y-auto align-content-start px-2 pb-3">
            <Product v-for="p in product2" :key="p._id" :product="p" @addOrder="addOrder" />
            <v-col v-if="product2.length === 0" class="text-center grey--text pa-10">
              <v-icon size="56" color="grey lighten-1">mdi-coffee-off</v-icon>
              <div class="mt-2">ไม่พบสินค้า</div>
            </v-col>
          </div>
        </v-card>
      </v-col>

      <!-- RIGHT: order panel -->
      <v-col cols="12" sm="12" md="4">
        <v-card class="rounded-xl pos-order d-flex flex-column" elevation="0">
          <div class="order-head d-flex align-center justify-space-between px-4 py-3">
            <div class="d-flex align-center">
              <v-icon dark class="mr-2">mdi-cart-outline</v-icon>
              <span class="text-h6 white--text font-weight-bold">ออเดอร์</span>
            </div>
            <v-btn small rounded light elevation="0" @click="openMember">
              <v-icon left small color="amber darken-2">mdi-account</v-icon>
              {{ selectedCustomer ? memberName(selectedCustomer) : "ลูกค้าทั่วไป" }}
            </v-btn>
          </div>

          <div class="order-items">
            <div v-if="orders.length === 0" class="text-center grey--text py-12">
              <v-icon size="52" color="grey lighten-1">mdi-cart-outline</v-icon>
              <div class="mt-2">ยังไม่มีสินค้าในตะกร้า</div>
            </div>
            <div class="order-row d-flex align-center px-4 py-2" v-for="(order, i) in orders" :key="i">
              <div class="flex-grow-1">
                <div class="font-weight-medium">{{ order.name }}</div>
                <div v-if="order.options && order.options.length" class="grey--text text-caption">
                  {{ order.options.join(" · ") }}
                </div>
                <div class="green--text text-caption font-weight-bold">{{ order.price }} ฿</div>
              </div>
              <div class="qty-box d-flex align-center px-1">
                <v-icon size="24" @click="deleteQty(i)">mdi-minus-circle-outline</v-icon>
                <span class="mx-3 font-weight-bold">{{ order.qty }}</span>
                <v-icon size="24" color="green" @click="addQty(i)">mdi-plus-circle-outline</v-icon>
              </div>
              <v-icon size="20" class="ml-2" color="grey lighten-1" @click="deleteOrder(i)">mdi-trash-can-outline</v-icon>
            </div>
          </div>

          <v-spacer></v-spacer>

          <div class="px-4 pt-2 pb-3 order-foot">
            <div class="d-flex align-center mb-3">
              <v-text-field
                v-model="couponCode" dense hide-details outlined label="โค้ดคูปอง"
                class="mr-2" :disabled="!!appliedCoupon" prepend-inner-icon="mdi-ticket-percent-outline"
              ></v-text-field>
              <v-btn v-if="!appliedCoupon" color="primary" @click="applyCoupon">ใช้</v-btn>
              <v-btn v-else color="error" outlined @click="clearCoupon">ยกเลิก</v-btn>
            </div>
            <div v-if="couponError" class="red--text text-caption mb-1">{{ couponError }}</div>

            <div class="d-flex justify-space-between text-body-2 mb-1">
              <span class="grey--text text--darken-1">ยอดรวม</span><span>{{ formatPrice(subTotal) }} ฿</span>
            </div>
            <div class="d-flex justify-space-between text-body-2 green--text mb-1" v-if="discountAmount > 0">
              <span>ส่วนลด ({{ appliedCoupon.codename }} -{{ appliedCoupon.discount }}%)</span>
              <span>-{{ formatPrice(discountAmount) }} ฿</span>
            </div>
            <v-divider class="my-2"></v-divider>
            <div class="d-flex justify-space-between align-center mb-2">
              <span class="text-h6">สุทธิ</span>
              <span class="text-h4 font-weight-bold net-amt">{{ formatPrice(netTotal) }} ฿</span>
            </div>

            <v-radio-group v-model="type_order" row hide-details class="mt-0 mb-1">
              <v-radio label="ทานที่ร้าน" value="1"></v-radio>
              <v-radio label="กลับบ้าน" value="2"></v-radio>
            </v-radio-group>
          </div>
        </v-card>

        <v-btn class="mt-4 checkout-btn white--text" rounded x-large block depressed @click="openCheckout">
          <v-icon left>mdi-cash-register</v-icon> ชำระเงิน ({{ formatPrice(netTotal) }} ฿)
        </v-btn>
        <div class="d-flex flex-row mt-3">
          <v-btn class="flex-grow-1 mr-2" rounded large outlined color="red" @click="clearOrder">
            <v-icon left small>mdi-close</v-icon>ยกเลิกบิล
          </v-btn>
          <v-btn class="flex-grow-1" rounded large outlined color="info" @click="holdDl = true">
            <v-chip class="mr-2" color="info" text-color="white" small>{{ heldOrders.length }}</v-chip>
            บิลที่พัก
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Option picker -->
    <v-dialog v-model="optionDl" max-width="480px">
      <v-card>
        <v-card-title class="primary white--text">
          {{ optionProduct.product_name }}
        </v-card-title>
        <v-card-text class="pt-4" style="max-height: 60vh; overflow-y: auto">
          <div v-for="(g, gi) in optionProduct.options" :key="gi" class="mb-3">
            <div class="font-weight-bold mb-1">
              {{ g.name }}
              <span v-if="g.required" class="red--text text-caption">*จำเป็น</span>
              <span v-if="g.multiple" class="grey--text text-caption">(เลือกได้หลายอย่าง)</span>
            </div>
            <!-- single choice -->
            <v-radio-group v-if="!g.multiple" v-model="optionSel[gi]" hide-details class="mt-0">
              <v-radio
                v-for="(c, ci) in g.choices" :key="ci" :value="ci"
                :label="c.label + (c.price ? '  +' + c.price + '฿' : '')"
              ></v-radio>
            </v-radio-group>
            <!-- multiple choice -->
            <div v-else>
              <v-checkbox
                v-for="(c, ci) in g.choices" :key="ci" :value="ci" v-model="optionSel[gi]"
                :label="c.label + (c.price ? '  +' + c.price + '฿' : '')"
                hide-details dense class="mt-1"
              ></v-checkbox>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn text color="grey" @click="optionDl = false">ยกเลิก</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="success" @click="confirmOptions">
            <v-icon left>mdi-cart-plus</v-icon>เพิ่มลงตะกร้า
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Member picker -->
    <v-dialog v-model="memberDl" max-width="600px">
      <v-card class="rounded-xl">
        <v-card-title>
          เลือกสมาชิก
          <v-spacer></v-spacer>
          <v-btn small :color="showQuick ? 'grey' : 'primary'" :text="showQuick" depressed @click="toggleQuick">
            <v-icon left small>{{ showQuick ? 'mdi-close' : 'mdi-account-plus' }}</v-icon>{{ showQuick ? 'ปิด' : 'สมัครเร็ว' }}
          </v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pt-4">
          <!-- QUICK REGISTER -->
          <v-expand-transition>
            <v-card v-if="showQuick" outlined class="pa-3 mb-3 rounded-lg quick-reg">
              <div class="font-weight-bold mb-2"><v-icon left small color="primary">mdi-account-plus</v-icon>สมัครสมาชิกใหม่ — กรอกชื่อเล่นหรือเบอร์อย่างใดอย่างหนึ่งก็พอ</div>
              <div class="d-flex flex-wrap align-center">
                <v-text-field v-model="quickName" label="ชื่อ / ชื่อเล่น" dense outlined hide-details
                  class="mr-2 mb-2" style="min-width:160px" prepend-inner-icon="mdi-account"
                  @keyup.enter="quickRegister"></v-text-field>
                <v-text-field v-model="quickTel" label="เบอร์โทร" dense outlined hide-details type="tel"
                  class="mr-2 mb-2" style="max-width:170px" prepend-inner-icon="mdi-phone"
                  @keyup.enter="quickRegister"></v-text-field>
                <v-btn color="primary" depressed class="mb-2" :loading="quickSaving" @click="quickRegister">
                  <v-icon left>mdi-check</v-icon>สมัคร &amp; เลือก
                </v-btn>
              </div>
              <div v-if="quickError" class="error--text text-caption mt-1">{{ quickError }}</div>
            </v-card>
          </v-expand-transition>

          <v-text-field v-model="memberSearch" outlined dense label="ค้นหาชื่อ / เบอร์โทร" prepend-inner-icon="mdi-magnify" clearable></v-text-field>
          <v-list dense style="max-height: 320px; overflow-y: auto">
            <v-list-item @click="selectCustomer(null)">
              <v-list-item-icon><v-icon>mdi-account-off</v-icon></v-list-item-icon>
              <v-list-item-content><v-list-item-title>ลูกค้าทั่วไป (ไม่ระบุ)</v-list-item-title></v-list-item-content>
            </v-list-item>
            <v-divider></v-divider>
            <v-list-item v-for="c in filteredCustomers" :key="c._id" @click="selectCustomer(c)">
              <v-list-item-icon><v-icon color="amber">mdi-account-star</v-icon></v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>{{ memberName(c) }}</v-list-item-title>
                <v-list-item-subtitle>{{ c.tel }} · {{ c.point || 0 }} แต้ม</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <!-- no match -> offer quick register with the typed term -->
            <v-list-item v-if="memberSearch && !filteredCustomers.length" @click="quickFromSearch">
              <v-list-item-icon><v-icon color="primary">mdi-account-plus</v-icon></v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title class="primary--text">สมัครสมาชิกใหม่ “{{ memberSearch }}”</v-list-item-title>
                <v-list-item-subtitle>ไม่พบสมาชิก — กดเพื่อสมัครเร็ว</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Checkout -->
    <v-dialog v-model="checkoutDl" max-width="460px">
      <v-card>
        <v-card-title>ชำระเงิน</v-card-title>
        <v-card-text>
          <v-text-field outlined dense label="ชื่อบิล / ลูกค้า" v-model="bill_name" :error-messages="billError"></v-text-field>

          <!-- redeem points (members only) -->
          <div v-if="selectedCustomer" class="mb-2">
            <div class="d-flex align-center">
              <v-text-field
                outlined dense type="number" label="ใช้แต้ม (1 แต้ม = 1฿)" v-model="pointsToUse"
                prepend-inner-icon="mdi-star" hide-details class="mr-2"
              ></v-text-field>
              <v-btn small text color="amber darken-2" @click="pointsToUse = maxRedeem">ใช้สูงสุด</v-btn>
            </div>
            <div class="text-caption grey--text">
              มีแต้ม {{ selectedCustomer.point || 0 }} · ใช้ได้สูงสุด {{ maxRedeem }}
            </div>
          </div>

          <div class="d-flex justify-space-between text-body-2"><span>ยอดรวม</span><span>{{ formatPrice(subTotal) }} ฿</span></div>
          <div class="d-flex justify-space-between green--text text-body-2" v-if="discountAmount > 0">
            <span>ส่วนลดคูปอง</span><span>-{{ formatPrice(discountAmount) }} ฿</span>
          </div>
          <div class="d-flex justify-space-between amber--text text--darken-2 text-body-2" v-if="pointsUsed > 0">
            <span>ใช้แต้ม</span><span>-{{ formatPrice(pointsUsed) }} ฿</span>
          </div>
          <div class="d-flex justify-space-between text-h5 info--text my-2">
            <span>สุทธิ</span><span>{{ formatPrice(netTotal) }} ฿</span>
          </div>

          <!-- payment method -->
          <div class="font-weight-medium mb-1">วิธีชำระเงิน</div>
          <v-btn-toggle v-model="paymentMethod" mandatory dense class="mb-3 flex-wrap" color="primary">
            <v-btn v-for="m in enabledPayMethods" :key="m.key" :value="m.key">
              <v-icon left small>{{ m.icon }}</v-icon>{{ m.label }}
            </v-btn>
          </v-btn-toggle>

          <!-- cash -->
          <template v-if="currentKind === 'cash'">
            <v-text-field
              outlined dense type="number" label="รับเงินมา (บาท)" v-model="cashReceived"
              prepend-inner-icon="mdi-cash"
            ></v-text-field>
            <div class="d-flex flex-row flex-wrap mb-2">
              <v-chip class="ma-1" small @click="cashReceived = netTotal">พอดี</v-chip>
              <v-chip class="ma-1" small v-for="n in quickCash" :key="n" @click="cashReceived = n">{{ n }}</v-chip>
            </div>
            <div class="d-flex justify-space-between text-h6" :class="change < 0 ? 'red--text' : 'success--text'">
              <span>เงินทอน</span><span>{{ formatPrice(Math.max(0, change)) }} ฿</span>
            </div>
          </template>

          <!-- split payment -->
          <template v-else-if="currentKind === 'split'">
            <div class="grey--text text-caption mb-1">กรอกจำนวนแต่ละช่องทาง (รวมให้ครบยอดสุทธิ)</div>
            <v-text-field outlined dense type="number" label="เงินสด" v-model="split.cash" hide-details class="mb-2"></v-text-field>
            <v-text-field outlined dense type="number" label="QR พร้อมเพย์" v-model="split.qr" hide-details class="mb-2"></v-text-field>
            <v-text-field outlined dense type="number" label="โอน" v-model="split.transfer" hide-details class="mb-2"></v-text-field>
            <v-text-field outlined dense type="number" label="บัตร" v-model="split.card" hide-details class="mb-2"></v-text-field>
            <div class="d-flex justify-space-between text-h6" :class="splitRemaining > 0 ? 'red--text' : 'success--text'">
              <span>{{ splitRemaining > 0 ? 'ขาดอีก' : 'ครบ' }}</span>
              <span>{{ formatPrice(Math.abs(splitRemaining)) }} ฿</span>
            </div>
          </template>

          <!-- qr / transfer / card / custom -->
          <template v-else>
            <div class="text-center pa-3 qr-box rounded-lg">
              <template v-if="currentKind === 'qr'">
                <div class="font-weight-bold mb-1">สแกน QR พร้อมเพย์เพื่อชำระ</div>
                <img v-if="qrImg" :src="qrImg" style="width: 190px" />
                <div v-else class="grey--text py-6">
                  <v-icon size="80" color="grey">mdi-qrcode</v-icon>
                  <div class="text-caption">ยังไม่ได้ตั้ง PromptPay ID (ไปที่ ตั้งค่า)</div>
                </div>
              </template>
              <template v-else>
                <v-icon size="100" color="primary">{{ currentMethod.icon || 'mdi-cash' }}</v-icon>
                <div class="font-weight-bold">{{ currentMethod.label }}</div>
              </template>
              <div class="text-h6 info--text">{{ formatPrice(netTotal) }} ฿</div>
              <div class="text-caption grey--text">กดยืนยันเมื่อได้รับเงินแล้ว</div>
            </div>
          </template>
        </v-card-text>
        <v-card-actions class="flex-wrap">
          <v-btn text color="grey" @click="checkoutDl = false">ปิด</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="warning" text :loading="saving" @click="save('0')"><v-icon left small>mdi-pause</v-icon>พักบิล</v-btn>
          <v-btn v-if="creditEnabled" color="deep-orange" text :loading="saving" @click="save('3')"><v-icon left small>mdi-account-clock</v-icon>เงินเชื่อ</v-btn>
          <v-btn color="success" :loading="saving" :disabled="!payEnabled" @click="save('1')">
            <v-icon left>mdi-cash-register</v-icon>ชำระเงิน
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Receipt -->
    <v-dialog v-model="receiptDl" max-width="380px">
      <v-card id="receipt-area">
        <v-card-text class="black--text">
          <div class="text-center">
            <img v-if="settings.show_logo && settings.logo" :src="$img(settings.logo)"
              style="max-height:64px" class="mb-1" />
            <h2>{{ settings.shop_name || "SHIFT CAFÉ" }}</h2>
            <div class="text-caption" v-if="settings.branch">{{ settings.branch }}</div>
            <div class="text-caption" v-if="shopAddress">{{ shopAddress }}</div>
            <div class="text-caption" v-if="settings.tel">โทร {{ settings.tel }}<span v-if="settings.tax_id"> · เลขภาษี {{ settings.tax_id }}</span></div>
            <div class="text-caption font-weight-bold mt-1">ใบเสร็จรับเงิน</div>
            <div class="text-caption">{{ formatDate(receipt.datetime) }}</div>
          </div>
          <div v-if="receipt.queue_no" class="text-center text-h6 font-weight-bold my-1">
            คิว {{ receipt.queue_no }}
          </div>
          <v-divider class="my-2"></v-divider>
          <div>บิล: {{ receipt.bill_name }}</div>
          <div v-if="receipt.memberName">สมาชิก: {{ receipt.memberName }}</div>
          <v-divider class="my-2"></v-divider>
          <div v-for="(l, i) in receipt.list_product" :key="i">
            <div class="d-flex justify-space-between">
              <span>{{ l.name }} x{{ l.qty }}</span><span>{{ formatPrice(l.price) }}</span>
            </div>
            <div v-if="l.options && l.options.length" class="text-caption grey--text">
              &nbsp;&nbsp;{{ l.options.join(" · ") }}
            </div>
          </div>
          <v-divider class="my-2"></v-divider>
          <div class="d-flex justify-space-between"><span>ยอดรวม</span><span>{{ formatPrice(receipt.subTotal) }}</span></div>
          <div class="d-flex justify-space-between" v-if="receipt.discount > 0">
            <span>ส่วนลดคูปอง</span><span>-{{ formatPrice(receipt.discount) }}</span>
          </div>
          <div class="d-flex justify-space-between" v-if="receipt.pointsUsed > 0">
            <span>ใช้แต้ม</span><span>-{{ formatPrice(receipt.pointsUsed) }}</span>
          </div>
          <div class="d-flex justify-space-between font-weight-bold">
            <span>สุทธิ</span><span>{{ formatPrice(receipt.total_price) }}</span>
          </div>
          <div class="d-flex justify-space-between"><span>ชำระโดย</span><span>{{ payName(receipt.paymentMethod) }}</span></div>
          <template v-if="receipt.paymentMethod === 'cash'">
            <div class="d-flex justify-space-between"><span>รับเงิน</span><span>{{ formatPrice(receipt.cash) }}</span></div>
            <div class="d-flex justify-space-between"><span>เงินทอน</span><span>{{ formatPrice(receipt.change) }}</span></div>
          </template>
          <div class="d-flex justify-space-between green--text" v-if="receipt.earnedPoints > 0">
            <span>แต้มที่ได้รับ</span><span>+{{ receipt.earnedPoints }}</span>
          </div>
          <div class="d-flex justify-space-between" v-if="receipt.newBalance != null">
            <span>แต้มคงเหลือ</span><span>{{ receipt.newBalance }}</span>
          </div>
          <template v-if="receipt.qrImage">
            <v-divider class="my-2"></v-divider>
            <div class="text-center">
              <div class="font-weight-bold">สแกนชำระผ่าน PromptPay</div>
              <img :src="receipt.qrImage" style="width: 150px" />
              <div>{{ formatPrice(receipt.total_price) }} บาท</div>
            </div>
          </template>
          <v-divider class="my-2"></v-divider>
          <div class="text-center text-caption">{{ settings.receipt_footer || "ขอบคุณที่ใช้บริการ" }}</div>
        </v-card-text>
        <v-card-actions class="hidden-print">
          <v-btn text @click="receiptDl = false">ปิด</v-btn>
          <v-spacer></v-spacer>
          <v-btn v-if="settings.sticker_enabled" color="teal" text @click="printStickers">
            <v-icon left>mdi-sticker-outline</v-icon>สติกเกอร์
          </v-btn>
          <v-btn color="primary" @click="printReceipt"><v-icon left>mdi-printer</v-icon>พิมพ์</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Held bills -->
    <v-dialog transition="dialog-bottom-transition" v-model="holdDl" max-width="1000">
      <v-card>
        <v-toolbar color="primary" dark>บิลที่พักไว้</v-toolbar>
        <div class="d-flex flex-row mb-1 mt-2 font-weight-bold">
          <v-col cols="3">ชื่อบิล</v-col><v-col cols="3">เวลา</v-col>
          <v-col cols="2">รายการ</v-col><v-col cols="2">รวมทั้งสิ้น</v-col><v-col cols="2">จัดการ</v-col>
        </div>
        <v-divider></v-divider>
        <div v-if="heldOrders.length === 0" class="pa-6 text-center grey--text">ไม่มีบิลที่พักไว้</div>
        <div class="d-flex flex-row align-center" v-for="order2 in heldOrders" :key="order2._id">
          <v-col cols="3">{{ order2.bill_name }}</v-col>
          <v-col cols="3">{{ formatDate(order2.datetime) }}</v-col>
          <v-col cols="2">{{ order2.list_product.length }}</v-col>
          <v-col cols="2">{{ order2.total_price }} ฿</v-col>
          <v-col cols="2">
            <div class="d-flex flex-row">
              <v-btn small fab @click="resumeOrder(order2)"><v-icon color="info">mdi-cart-arrow-down</v-icon></v-btn>
              <v-btn small fab class="ml-3" @click="deleteHeld(order2)"><v-icon color="red">mdi-close</v-icon></v-btn>
            </div>
          </v-col>
        </div>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :timeout="2500" :color="snackColor" top>{{ snackText }}</v-snackbar>
  </div>
</template>

<script>
import Product from "@/components/seller/Product.vue";
import Category from "@/components/seller/Category.vue";

export default {
  middleware: ["auth", "check"],
  layout(context) {
    const u = context.store.state.auth && context.store.state.auth.user;
    const pos = u && u.ref_id_role ? u.ref_id_role.position : "";
    return pos === "cashier" || pos === "staff" ? "layoutCashier" : "default";
  },
  async asyncData(context) {
    const [products, categories, customers, orderOnDatabase, coupons, settings] = await Promise.all([
      context.$axios.$get("/product"),
      context.$axios.$get("/category"),
      context.$axios.$get("/customer"),
      context.$axios.$get("/order"),
      context.$axios.$get("/coupon"),
      context.$axios.$get("/settings")
    ]);
    return { products, categories, product2: products, customers, orderOnDatabase, coupons, settings };
  },
  components: { Product, Category },
  data: () => ({
    cateName: "เมนูทั้งหมด",
    orders: [],
    cateId: "",
    cateChip: 0,
    product2: [],
    products: [],
    categories: [],
    customers: [],
    coupons: [],
    settings: {},
    subTotal: 0,
    keyword: "",
    type_order: "1",
    bill_name: "",
    billError: "",
    cashReceived: "",
    paymentMethod: "cash",
    pointsToUse: 0,
    split: { cash: 0, qr: 0, transfer: 0, card: 0 },
    qrImg: "",
    isFullscreen: false,
    checkoutDl: false,
    holdDl: false,
    memberDl: false,
    showQuick: false,
    quickName: "",
    quickTel: "",
    quickSaving: false,
    quickError: "",
    receiptDl: false,
    optionDl: false,
    optionProduct: { options: [] },
    optionSel: {},
    memberSearch: "",
    selectedCustomer: null,
    couponCode: "",
    appliedCoupon: null,
    couponError: "",
    saving: false,
    snackbar: false,
    snackText: "",
    snackColor: "success",
    receipt: {},
    orderOnDatabase: []
  }),
  head() {
    return { title: "ขายหน้าร้าน" };
  },
  mounted() {
    this._fsHandler = () => {
      this.isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
    };
    document.addEventListener("fullscreenchange", this._fsHandler);
    document.addEventListener("webkitfullscreenchange", this._fsHandler);
  },
  beforeDestroy() {
    document.removeEventListener("fullscreenchange", this._fsHandler);
    document.removeEventListener("webkitfullscreenchange", this._fsHandler);
  },
  computed: {
    imgBase() {
      return this.$axios.defaults.baseURL.replace("/api", "/");
    },
    shopAddress() {
      const s = this.settings || {};
      return [s.address, s.subdistrict, s.district, s.province, s.postcode].filter(Boolean).join(" ");
    },
    heldOrders() {
      return (this.orderOnDatabase || []).filter(o => String(o.status) === "0");
    },
    discountAmount() {
      if (!this.appliedCoupon) return 0;
      return Math.round((this.subTotal * Number(this.appliedCoupon.discount)) / 100);
    },
    maxRedeem() {
      if (!this.selectedCustomer) return 0;
      const payable = Math.max(0, this.subTotal - this.discountAmount);
      return Math.min(Number(this.selectedCustomer.point) || 0, payable);
    },
    pointsUsed() {
      const v = Math.floor(Number(this.pointsToUse) || 0);
      return Math.max(0, Math.min(v, this.maxRedeem));
    },
    netTotal() {
      return Math.max(0, this.subTotal - this.discountAmount - this.pointsUsed);
    },
    change() {
      return (Number(this.cashReceived) || 0) - this.netTotal;
    },
    payMethodList() {
      const list = (this.settings && this.settings.payment_methods) || [];
      return list.length ? list : [{ key: "cash", label: "เงินสด", icon: "mdi-cash", kind: "cash", enabled: true }];
    },
    enabledPayMethods() {
      return this.payMethodList.filter(m => m.enabled && m.kind !== "credit");
    },
    creditEnabled() {
      return this.payMethodList.some(m => m.enabled && m.kind === "credit");
    },
    currentMethod() {
      return this.payMethodList.find(m => m.key === this.paymentMethod) || { kind: "cash", label: "" };
    },
    currentKind() {
      return this.currentMethod.kind || "other";
    },
    splitSum() {
      const s = this.split;
      return (Number(s.cash) || 0) + (Number(s.qr) || 0) + (Number(s.transfer) || 0) + (Number(s.card) || 0);
    },
    splitRemaining() {
      return this.netTotal - this.splitSum;
    },
    payEnabled() {
      if (this.currentKind === "cash") return this.change >= 0;
      if (this.currentKind === "split") return this.splitSum >= this.netTotal && this.netTotal > 0;
      return this.netTotal >= 0;
    },
    quickCash() {
      const t = this.netTotal;
      const set = new Set();
      [100, 500, 1000].forEach(n => { if (n > t) set.add(n); });
      set.add(Math.ceil(t / 100) * 100);
      return [...set].filter(n => n > t).sort((a, b) => a - b).slice(0, 3);
    },
    filteredCustomers() {
      const kw = this.memberSearch.toLowerCase();
      return (this.customers || []).filter(c =>
        this.memberName(c).toLowerCase().includes(kw) || (c.tel || "").includes(kw)
      );
    }
  },
  watch: {
    paymentMethod() {
      if (this.currentKind === "qr") this.refreshQr();
    },
    netTotal() {
      if (this.checkoutDl && this.currentKind === "qr") this.refreshQr();
    },
    checkoutDl(v) {
      if (v && this.currentKind === "qr") this.refreshQr();
    }
  },
  methods: {
    async refreshQr() {
      this.qrImg = "";
      if (this.$pp && this.settings.promptpay_id) {
        this.qrImg = await this.$pp.qr(this.settings.promptpay_id, this.netTotal);
      }
    },
    memberName(c) {
      return ((c.fname || "") + " " + (c.lname || "")).trim();
    },
    toggleFullscreen() {
      const el = document.documentElement;
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
      try {
        if (!fsEl) {
          (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el);
        } else {
          (document.exitFullscreen || document.webkitExitFullscreen || (() => {})).call(document);
        }
      } catch (e) {
        this.notify("เบราว์เซอร์ไม่รองรับโหมดเต็มจอ", "error");
      }
    },
    showAll() {
      this.cateId = "";
      this.cateName = "เมนูทั้งหมด";
      this.searchProduct();
    },
    changCate(cate) {
      this.cateId = cate._id;
      this.cateName = cate.cate_name;
      this.searchProduct();
    },
    stockOf(id) {
      const p = this.products.find(pr => pr._id === id);
      return p ? Number(p.stock) || 0 : 0;
    },
    qtyInCart(id) {
      return this.orders.filter(o => o.ref_pro_id === id).reduce((s, o) => s + o.qty, 0);
    },
    addOrder(product) {
      // products with options open a picker first
      if (product.options && product.options.length) {
        this.openOptions(product);
        return;
      }
      this.addToCart(product, [], parseInt(product.price));
    },
    addToCart(product, optionLabels, unit) {
      if (this.qtyInCart(product._id) + 1 > this.stockOf(product._id)) {
        this.notify("สต็อกไม่พอ (เหลือ " + this.stockOf(product._id) + ")", "error");
        return;
      }
      const key = product._id + "|" + optionLabels.join(",");
      const existing = this.orders.find(o => o.key === key);
      if (existing) {
        existing.qty++;
        existing.price = existing.unit * existing.qty;
      } else {
        this.orders.push({
          key,
          ref_pro_id: product._id,
          name: product.product_name,
          options: optionLabels,
          unit,
          qty: 1,
          price: unit
        });
      }
      this.totalPrice();
    },
    deleteOrder(i) {
      this.orders.splice(i, 1);
      this.totalPrice();
    },
    addQty(i) {
      const o = this.orders[i];
      if (this.qtyInCart(o.ref_pro_id) + 1 > this.stockOf(o.ref_pro_id)) {
        this.notify("สต็อกไม่พอ (เหลือ " + this.stockOf(o.ref_pro_id) + ")", "error");
        return;
      }
      o.qty++;
      o.price = o.unit * o.qty;
      this.totalPrice();
    },
    deleteQty(i) {
      const o = this.orders[i];
      if (o.qty > 1) {
        o.qty--;
        o.price = o.unit * o.qty;
      }
      this.totalPrice();
    },
    // ---- option picker ----
    openOptions(product) {
      this.optionProduct = product;
      const sel = {};
      product.options.forEach((g, gi) => {
        if (g.multiple) sel[gi] = [];
        else sel[gi] = g.required ? 0 : null; // default first choice for required single
      });
      this.optionSel = sel;
      this.optionDl = true;
    },
    optionChoicePrice(gi, ci) {
      return Number(this.optionProduct.options[gi].choices[ci].price) || 0;
    },
    confirmOptions() {
      const p = this.optionProduct;
      // validate required single groups
      for (let gi = 0; gi < p.options.length; gi++) {
        const g = p.options[gi];
        if (g.required && !g.multiple && (this.optionSel[gi] === null || this.optionSel[gi] === undefined)) {
          this.notify("กรุณาเลือก " + g.name, "error");
          return;
        }
      }
      let unit = parseInt(p.price);
      const labels = [];
      p.options.forEach((g, gi) => {
        const v = this.optionSel[gi];
        if (g.multiple) {
          (v || []).forEach(ci => {
            unit += this.optionChoicePrice(gi, ci);
            labels.push(g.choices[ci].label);
          });
        } else if (v !== null && v !== undefined) {
          unit += this.optionChoicePrice(gi, v);
          labels.push(g.choices[v].label);
        }
      });
      this.addToCart(p, labels, unit);
      this.optionDl = false;
    },
    totalPrice() {
      this.subTotal = this.orders.reduce((s, o) => s + parseInt(o.price), 0);
    },
    clearOrder() {
      this.orders = [];
      this.subTotal = 0;
      this.bill_name = "";
      this.cashReceived = "";
      this.pointsToUse = 0;
      this.paymentMethod = "cash";
      this.selectedCustomer = null;
      this.clearCoupon();
    },
    searchProduct() {
      const kw = this.keyword.trim();
      let list = this.cateId
        ? this.products.filter(p => {
            const c = p.ref_cate_id && p.ref_cate_id._id ? p.ref_cate_id._id : p.ref_cate_id;
            return c === this.cateId;
          })
        : this.products;
      this.product2 = kw ? list.filter(p => p.product_name.includes(kw)) : list;
    },
    openMember() {
      this.memberSearch = "";
      this.showQuick = false;
      this.quickName = "";
      this.quickTel = "";
      this.quickError = "";
      this.memberDl = true;
    },
    selectCustomer(c) {
      this.selectedCustomer = c;
      if (c && !this.bill_name) this.bill_name = this.memberName(c);
      this.memberDl = false;
    },
    toggleQuick() {
      this.showQuick = !this.showQuick;
      this.quickError = "";
      // prefill from the current search box for speed
      if (this.showQuick && this.memberSearch) {
        if (/^[0-9\s-]+$/.test(this.memberSearch)) this.quickTel = this.memberSearch.trim();
        else this.quickName = this.memberSearch.trim();
      }
    },
    quickFromSearch() {
      this.showQuick = true;
      const kw = (this.memberSearch || "").trim();
      if (/^[0-9\s-]+$/.test(kw)) this.quickTel = kw;
      else this.quickName = kw;
      this.quickError = "";
    },
    async quickRegister() {
      const name = (this.quickName || "").trim();
      const tel = (this.quickTel || "").trim();
      if (!name && !tel) {
        this.quickError = "กรอกชื่อเล่นหรือเบอร์อย่างน้อยหนึ่งอย่าง";
        return;
      }
      // avoid duplicate phone
      if (tel && (this.customers || []).some(c => (c.tel || "") === tel)) {
        this.quickError = "เบอร์นี้เป็นสมาชิกอยู่แล้ว";
        return;
      }
      this.quickSaving = true;
      this.quickError = "";
      try {
        const res = await this.$axios.$post("/customer", {
          pname: "",
          fname: name || "ลูกค้า",
          lname: "",
          tel,
          point: 0,
          ref_level_id: "60e439b7c7d6ae35548c7b62" // default level (ทั่วไป)
        });
        const created = res && res.data ? res.data : res;
        if (created && created._id) {
          this.customers.push(created);
          this.selectCustomer(created);
        }
        this.showQuick = false;
        this.quickName = "";
        this.quickTel = "";
        this.notify("สมัครสมาชิกใหม่สำเร็จ");
      } catch (e) {
        this.quickError = "สมัครไม่สำเร็จ ลองใหม่อีกครั้ง";
      } finally {
        this.quickSaving = false;
      }
    },
    applyCoupon() {
      this.couponError = "";
      const code = this.couponCode.trim().toLowerCase();
      if (!code) return;
      const c = (this.coupons || []).find(x => (x.codename || "").toLowerCase() === code);
      if (!c) { this.couponError = "ไม่พบคูปองนี้"; return; }
      if (Number(c.num_use) <= 0) { this.couponError = "คูปองถูกใช้ครบแล้ว"; return; }
      if (c.exp && new Date(c.exp) < new Date(new Date().toDateString())) {
        this.couponError = "คูปองหมดอายุแล้ว"; return;
      }
      this.appliedCoupon = c;
      this.notify("ใช้คูปอง " + c.codename + " สำเร็จ");
    },
    clearCoupon() {
      this.appliedCoupon = null;
      this.couponCode = "";
      this.couponError = "";
    },
    formatPrice(value2) {
      const value = parseInt(value2) || 0;
      return (value / 1).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    formatDate(d) {
      return d ? new Date(d).toLocaleString("th-TH") : "";
    },
    payName(m) {
      return m === "qr" ? "QR พร้อมเพย์" : m === "transfer" ? "โอนเงิน" : "เงินสด";
    },
    notify(text, color) {
      this.snackText = text;
      this.snackColor = color || "success";
      this.snackbar = true;
    },
    openCheckout() {
      if (this.orders.length === 0) {
        this.notify("กรุณาเลือกสินค้าก่อน", "error");
        return;
      }
      this.billError = "";
      this.cashReceived = "";
      this.pointsToUse = 0;
      this.paymentMethod = this.enabledPayMethods.length ? this.enabledPayMethods[0].key : "cash";
      this.split = { cash: 0, qr: 0, transfer: 0, card: 0 };
      if (!this.bill_name) {
        this.bill_name = this.selectedCustomer ? this.memberName(this.selectedCustomer) : "ลูกค้าทั่วไป";
      }
      this.checkoutDl = true;
    },
    async refresh() {
      const [orders, products, customers] = await Promise.all([
        this.$axios.$get("/order"),
        this.$axios.$get("/product"),
        this.$axios.$get("/customer")
      ]);
      this.orderOnDatabase = orders;
      this.products = products;
      this.customers = customers;
      this.searchProduct();
    },
    async save(status) {
      if (!this.bill_name || !this.bill_name.trim()) {
        this.billError = "กรุณากรอกชื่อบิล";
        return;
      }
      if (status === "1" && this.paymentMethod === "cash" && this.change < 0) {
        this.notify("รับเงินไม่พอ", "error");
        return;
      }
      if (status === "1" && this.paymentMethod === "split" && this.splitSum < this.netTotal) {
        this.notify("ยอดแยกชำระยังไม่ครบ", "error");
        return;
      }
      const isCash = this.currentKind === "cash";
      const isSplit = this.currentKind === "split";
      // payment method stored: credit bill -> 'credit', else the chosen key
      const method = status === "3" ? "credit" : this.paymentMethod;
      // per-channel payment lines (for accurate reports)
      let payments = [];
      if (status === "1") {
        if (isSplit) {
          payments = ["cash", "qr", "transfer", "card"]
            .map(m => ({ method: m, amount: Number(this.split[m]) || 0 }))
            .filter(p => p.amount > 0);
        } else {
          payments = [{ method: this.paymentMethod, amount: this.netTotal }];
        }
      }
      const cash =
        status !== "1" ? 0 : isCash ? Number(this.cashReceived) || 0 : isSplit ? this.splitSum : this.netTotal;
      const change = status === "1" && isCash ? this.change : status === "1" && isSplit ? this.splitSum - this.netTotal : 0;
      const payload = {
        bill_name: this.bill_name,
        list_product: this.orders.map(o => ({
          ref_pro_id: o.ref_pro_id, name: o.name, qty: o.qty, price: o.price,
          options: o.options || [], unit: o.unit
        })),
        total_price: this.netTotal,
        discount: this.discountAmount,
        type_order: this.type_order,
        status,
        customer_ref: this.selectedCustomer ? this.selectedCustomer._id : null,
        coupon_ref: this.appliedCoupon ? this.appliedCoupon._id : null,
        payment_method: method,
        payments,
        ref_emp_id: this.$store.state.auth && this.$store.state.auth.user ? this.$store.state.auth.user._id : null,
        points_used: status === "1" ? this.pointsUsed : 0,
        cash_received: cash,
        change
      };
      this.saving = true;
      try {
        const res = await this.$axios.$post("/order", payload);
        if (status === "1") {
          this.receipt = {
            datetime: new Date().toISOString(),
            bill_name: this.bill_name,
            memberName: this.selectedCustomer ? this.memberName(this.selectedCustomer) : "",
            paymentMethod: this.paymentMethod,
            list_product: payload.list_product,
            subTotal: this.subTotal,
            discount: this.discountAmount,
            pointsUsed: this.pointsUsed,
            total_price: this.netTotal,
            cash,
            change: isCash ? this.change : 0,
            earnedPoints: res.earnedPoints || 0,
            newBalance: res.data && res.data.newBalance != null ? res.data.newBalance : null,
            queue_no: res.data && res.data.queue_no ? res.data.queue_no : null,
            qrImage: ""
          };
          // PromptPay QR for this bill (end of slip + on-screen receipt)
          if (this.$pp && this.settings.promptpay_id) {
            try {
              this.receipt.qrImage = await this.$pp.qr(this.settings.promptpay_id, this.netTotal);
            } catch (e) {}
          }
          this.receiptDl = true;
          this.notify("ชำระเงินสำเร็จ");
          // auto-print (per Settings): silent via Bluetooth if connected, else browser/USB
          if (this.settings.auto_print !== false && this.$printer) {
            this.$nextTick(() => this.$printer.print(this.receipt, this.printSettings()).catch(() => {}));
          }
          // auto-print order stickers (labels) if enabled
          if (this.settings.sticker_enabled && this.settings.sticker_auto && this.$printer) {
            this.$nextTick(() =>
              this.$printer.printStickers(this.receipt, this.printSettings()).catch(() => {})
            );
          }
        } else if (status === "3") {
          this.notify("บันทึกเป็นเงินเชื่อแล้ว (ชำระภายหลังที่หน้าดูสลิป)", "warning");
        } else {
          this.notify("พักบิลแล้ว", "warning");
        }
        await this.refresh();
        this.clearOrder();
        this.checkoutDl = false;
      } catch (e) {
        const msg = e.response && e.response.data && e.response.data.message;
        this.billError = msg || "บันทึกไม่สำเร็จ";
        this.notify(msg || "บันทึกไม่สำเร็จ", "error");
      } finally {
        this.saving = false;
      }
    },
    printSettings() {
      return {
        ...this.settings,
        logoUrl: this.$img(this.settings.logo)
      };
    },
    async printReceipt() {
      try {
        await this.$printer.print(this.receipt, this.printSettings());
      } catch (e) {
        this.notify(e.message || "พิมพ์ไม่สำเร็จ", "error");
      }
    },
    async printStickers() {
      try {
        await this.$printer.printStickers(this.receipt, this.printSettings());
      } catch (e) {
        this.notify(e.message || "พิมพ์สติกเกอร์ไม่สำเร็จ", "error");
      }
    },
    resumeOrder(order) {
      this.orders = order.list_product.map(p => {
        const options = p.options || [];
        const unit = p.unit || Math.round(p.price / (p.qty || 1));
        return {
          key: p.ref_pro_id + "|" + options.join(","),
          ref_pro_id: p.ref_pro_id, name: p.name, options, unit, qty: p.qty, price: p.price
        };
      });
      this.bill_name = order.bill_name;
      this.type_order = order.type_order || "1";
      if (order.customer_ref) {
        this.selectedCustomer = this.customers.find(c => c._id === order.customer_ref) || null;
      }
      this.totalPrice();
      this.deleteHeld(order, true);
      this.holdDl = false;
    },
    async deleteHeld(order, silent) {
      try {
        await this.$axios.$delete("/order/" + order._id);
        await this.refresh();
        if (!silent) this.notify("ลบบิลแล้ว", "warning");
      } catch (e) {
        console.log(e);
      }
    }
  }
};
</script>

<style>
.scroll::-webkit-scrollbar { width: 10px; }
.scroll::-webkit-scrollbar-track { background: transparent; border-radius: 10px; }
.scroll::-webkit-scrollbar-thumb { background: #c7c7c7; border: solid 2px transparent; background-clip: content-box; border-radius: 10px; }
.scroll::-webkit-scrollbar-thumb:hover { background: #9e9e9e; background-clip: content-box; }
.cursor { cursor: pointer; }

/* product panel */
.pos-panel { background: #ffffff; box-shadow: 0 6px 24px rgba(0,0,0,.06) !important; }
.cate-title { font-family: 'Mitr', sans-serif; font-size: 1.5rem; font-weight: 600; color: #1d1d1d; }
.pos-products { height: calc(100vh - 230px); min-height: 360px; }

/* order panel */
.pos-order { background: #ffffff; height: calc(100vh - 250px); min-height: 420px; box-shadow: 0 6px 24px rgba(0,0,0,.06) !important; overflow: hidden; }

/* tablet/portrait & below (Vuetify lg starts at 1264): stack naturally so the
   order panel sits right under the products instead of being pushed off-screen */
@media (max-width: 1263px) {
  .pos-products { height: auto !important; max-height: 56vh; min-height: 200px; }
  .pos-order { height: auto !important; min-height: 0; overflow: visible; }
  .order-items { max-height: 50vh; }
}
.order-head { background: linear-gradient(135deg, #2b2b2b, #1d1d1d); }
.order-items { flex: 1 1 auto; overflow-y: auto; }
.order-row { border-bottom: 1px solid #f1f1f1; }
.order-row:hover { background: #fafafa; }
.qty-box { background: #f5f5f5; border-radius: 20px; }
.order-foot { background: #fafafa; border-top: 1px solid #eee; }
.net-amt { color: #39b54a; }
.qr-box { background: #f5f7ff; border: 1px dashed #c5cae9; }
/* dark theme overrides */
.theme--dark .pos-panel,
.theme--dark .pos-order { background: #16181c; box-shadow: 0 6px 24px rgba(0,0,0,.45) !important; }
.theme--dark .cate-title { color: #f1f3f5; }
.theme--dark .order-row { border-bottom-color: #2a2e35; }
.theme--dark .order-row:hover { background: #20242b; }
.theme--dark .qty-box { background: #2a2e35; }
.theme--dark .order-foot { background: #1b1e24; border-top-color: #2a2e35; }
.theme--dark .qr-box { background: #1c2030; border-color: #3a3f5a; }
.theme--dark #receipt-area { background: #ffffff; } /* slip preview = paper, keep white */
.checkout-btn {
  height: 58px !important;
  background: linear-gradient(135deg, #39b54a, #2e9c3f) !important;
  box-shadow: 0 8px 18px rgba(57,181,74,.4) !important;
  font-size: 1.05rem;
}
@media print {
  @page { size: 58mm auto; margin: 0; }
  body * { visibility: hidden; }
  #receipt-area, #receipt-area * { visibility: visible; }
  #receipt-area {
    position: absolute; left: 0; top: 0; width: 58mm; box-shadow: none !important;
    border-radius: 0 !important; font-size: 12px; line-height: 1.25;
  }
  #receipt-area .text-h5, #receipt-area h2 { font-size: 15px !important; }
  .hidden-print { display: none !important; }
}
</style>
