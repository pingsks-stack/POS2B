<template>
  <div class="pa-5">
    <h1 class="set-title mb-1">ตั้งค่าระบบ</h1>
    <div class="grey--text mb-4">ข้อมูลร้าน ใบเสร็จ แต้มสะสม และบัญชีผู้ใช้</div>

    <div class="settings-grid">
      <!-- shop info -->
        <v-card class="rounded-xl mb-5">
          <v-card-title><v-icon left color="primary">mdi-store-cog-outline</v-icon> รายละเอียดร้าน</v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="7"><v-text-field outlined dense label="ชื่อร้าน" v-model="form.shop_name"></v-text-field></v-col>
              <v-col cols="12" md="5"><v-text-field outlined dense label="ประเภทธุรกิจ" v-model="form.business_type"></v-text-field></v-col>
              <v-col cols="12" md="4" class="mt-n4">
                <v-text-field outlined dense label="สาขา" v-model="form.branch_code"
                  hint="00000 = สำนักงานใหญ่" persistent-hint></v-text-field>
              </v-col>
              <v-col cols="12" md="4" class="mt-n4"><v-text-field outlined dense label="เบอร์โทรเจ้าของร้าน" v-model="form.owner_tel"></v-text-field></v-col>
              <v-col cols="12" md="4" class="mt-n4"><v-text-field outlined dense label="พาร์ทเนอร์" v-model="form.partner"></v-text-field></v-col>
              <v-col cols="12" md="6" class="mt-2"><v-text-field outlined dense label="ชื่อสาขา (แสดงบนใบเสร็จ)" v-model="form.branch"></v-text-field></v-col>
              <v-col cols="12" md="6" class="mt-2"><v-text-field outlined dense label="เลขผู้เสียภาษี" v-model="form.tax_id"></v-text-field></v-col>

              <v-col cols="12" class="mt-2">
                <div class="font-weight-medium mb-1">รูปภาพ / โลโก้ร้าน</div>
                <div class="d-flex align-center">
                  <v-avatar tile size="80" color="grey lighten-3" class="mr-3 rounded-lg">
                    <v-img v-if="form.logo" :src="$img(form.logo)"></v-img>
                    <v-icon v-else color="grey">mdi-image-outline</v-icon>
                  </v-avatar>
                  <div class="flex-grow-1">
                    <v-file-input
                      outlined dense accept="image/*" label="อัปโหลดรูป (อย่างน้อย 400 x 240 px)"
                      v-model="logoFile" :loading="uploading" hide-details @change="uploadLogo"
                    ></v-file-input>
                    <v-switch v-model="form.show_logo" label="แสดงรูปภาพในหน้าขาย/ใบเสร็จ" hide-details dense class="mt-2"></v-switch>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-card class="rounded-xl mb-5">
          <v-card-title><v-icon left color="primary">mdi-card-account-phone-outline</v-icon> ข้อมูลติดต่อ</v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6"><v-text-field outlined dense label="อีเมล" v-model="form.email"></v-text-field></v-col>
              <v-col cols="12" md="6"><v-text-field outlined dense label="เบอร์โทรศัพท์" v-model="form.tel"></v-text-field></v-col>
              <v-col cols="12" class="mt-n4">
                <v-text-field outlined dense label="ที่อยู่" v-model="form.address"
                  hint="ขึ้นต้นด้วยบ้านเลขที่ เช่น 99/99" persistent-hint></v-text-field>
              </v-col>
              <v-col cols="12" md="6" class="mt-1"><v-text-field outlined dense label="ประเทศ" v-model="form.country"></v-text-field></v-col>
              <v-col cols="12" md="6" class="mt-1"><v-text-field outlined dense label="จังหวัด/รัฐ" v-model="form.province"></v-text-field></v-col>
              <v-col cols="12" md="6" class="mt-n4"><v-text-field outlined dense label="อำเภอ/เขต" v-model="form.district"></v-text-field></v-col>
              <v-col cols="12" md="6" class="mt-n4"><v-text-field outlined dense label="ตำบล/แขวง" v-model="form.subdistrict"></v-text-field></v-col>
              <v-col cols="12" md="4" class="mt-n4"><v-text-field outlined dense label="รหัสไปรษณีย์" v-model="form.postcode"></v-text-field></v-col>
              <v-col cols="12" md="4" class="mt-n4"><v-text-field outlined dense label="เบอร์แฟกซ์" v-model="form.fax"></v-text-field></v-col>
              <v-col cols="12" md="4" class="mt-n4"><v-text-field outlined dense label="ไลน์ไอดี" v-model="form.line_id"></v-text-field></v-col>
            </v-row>
          </v-card-text>
          <v-card-actions class="px-4 pb-4">
            <v-spacer></v-spacer>
            <v-btn color="primary" :loading="saving" @click="saveSettings">
              <v-icon left>mdi-content-save</v-icon> บันทึกข้อมูลร้าน
            </v-btn>
          </v-card-actions>
        </v-card>

        <v-card class="rounded-xl mb-5">
          <v-card-title><v-icon left color="primary">mdi-receipt-text-outline</v-icon> ใบเสร็จ & แต้มสะสม</v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-text-field outlined dense label="ข้อความท้ายใบเสร็จ" v-model="form.receipt_footer"></v-text-field>
            <v-text-field
              outlined dense type="number" class="mt-n2"
              label="ใช้จ่ายกี่บาท ได้ 1 แต้ม" v-model="form.point_per_baht"
              hint="เช่น 10 = ทุก 10 บาท ได้ 1 แต้ม (คูณด้วยอัตราระดับสมาชิก)" persistent-hint
            ></v-text-field>
            <v-switch
              v-model="form.auto_print" class="mt-3"
              label="พิมพ์ใบเสร็จอัตโนมัติหลังชำระเงิน" inset hide-details
            ></v-switch>
            <v-divider class="my-3"></v-divider>
            <v-switch v-model="form.vat_enabled" inset hide-details
              label="คิดภาษีมูลค่าเพิ่ม (VAT) — แสดงบนใบเสร็จ/ใบกำกับภาษี"></v-switch>
            <v-text-field v-if="form.vat_enabled" outlined dense type="number" class="mt-3"
              label="อัตรา VAT (%)" v-model="form.vat_rate"
              hint="ราคาสินค้าเป็นแบบรวม VAT แล้ว (ระบบถอด VAT มาแสดง)" persistent-hint></v-text-field>
          </v-card-text>
          <v-card-actions class="px-4 pb-4">
            <v-spacer></v-spacer>
            <v-btn color="primary" :loading="saving" @click="saveSettings">
              <v-icon left>mdi-content-save</v-icon> บันทึกการตั้งค่า
            </v-btn>
          </v-card-actions>
        </v-card>

        <v-card class="rounded-xl mb-5">
          <v-card-title><v-icon left color="primary">mdi-credit-card-multiple-outline</v-icon> วิธีชำระเงิน</v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <div class="grey--text text-caption mb-2">เปิด/ปิด แก้ชื่อ หรือเพิ่มวิธีชำระเอง — จะแสดงในหน้าขายเฉพาะที่เปิด</div>
            <div v-for="(m, i) in form.payment_methods" :key="i" class="d-flex align-center mb-2">
              <v-icon class="mr-2" color="grey darken-1">{{ m.icon }}</v-icon>
              <v-text-field dense hide-details outlined v-model="m.label" class="mr-3" style="max-width:260px"></v-text-field>
              <v-chip x-small outlined class="mr-2">{{ kindName(m.kind) }}</v-chip>
              <v-spacer></v-spacer>
              <v-switch v-model="m.enabled" dense hide-details class="mt-0 mr-1"></v-switch>
              <v-btn v-if="!m.builtin" icon small color="error" @click="form.payment_methods.splice(i, 1)"><v-icon>mdi-delete</v-icon></v-btn>
              <div v-else style="width:36px"></div>
            </div>
            <v-btn small outlined color="primary" class="mt-2" @click="addPayMethod">
              <v-icon left small>mdi-plus</v-icon>เพิ่มวิธีชำระเอง
            </v-btn>
          </v-card-text>
          <v-card-actions class="px-4 pb-4">
            <v-spacer></v-spacer>
            <v-btn color="primary" :loading="saving" @click="saveSettings">บันทึกวิธีชำระเงิน</v-btn>
          </v-card-actions>
        </v-card>

      <!-- preview + devices -->
        <v-card class="rounded-xl mb-5">
          <v-card-title><v-icon left color="primary">mdi-eye-outline</v-icon> ตัวอย่างใบเสร็จ</v-card-title>
          <v-divider></v-divider>
          <v-card-text class="text-center" style="background:#f4f6f8">
            <iframe ref="preview" class="slip-frame"></iframe>
            <div class="text-caption grey--text mt-1">ตัวอย่างสลิปจริงตามที่ตั้งค่า (รายการสินค้าเป็นตัวอย่าง)</div>
          </v-card-text>
        </v-card>

        <v-card class="rounded-xl mb-5">
          <v-card-title><v-icon left color="primary">mdi-qrcode</v-icon> รับเงิน PromptPay</v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-text-field
              outlined dense label="PromptPay ID (เบอร์โทร / เลขบัตรประชาชน)"
              v-model="form.promptpay_id" @input="genPreview"
              hint="ใช้สร้าง QR รับเงินบนหน้าขายและท้ายใบเสร็จ" persistent-hint
            ></v-text-field>
            <div class="text-center mt-3">
              <img v-if="ppPreview" :src="ppPreview" style="width:160px" />
              <div v-else class="grey--text py-6"><v-icon size="60" color="grey">mdi-qrcode</v-icon><div class="text-caption">กรอก PromptPay ID เพื่อดูตัวอย่าง QR</div></div>
              <div class="text-caption grey--text">ตัวอย่าง QR (ยังไม่ระบุยอด) · ตอนขายจะใส่ยอดให้อัตโนมัติ</div>
            </div>
          </v-card-text>
          <v-card-actions class="px-4 pb-4">
            <v-spacer></v-spacer>
            <v-btn color="primary" outlined :loading="saving" @click="saveSettings">บันทึก PromptPay</v-btn>
          </v-card-actions>
        </v-card>

        <v-card class="rounded-xl mb-5">
          <v-card-title><v-icon left color="primary">mdi-printer-pos</v-icon> เครื่องพิมพ์สลิป</v-card-title>
          <v-divider></v-divider>
          <!-- NATIVE APP: pick an assigned slip printer (VP58BT) -->
          <v-card-text v-if="isNativeApp">
            <div class="d-flex align-center mb-3">
              <v-icon large :color="form.printer_slip_address ? 'success' : 'grey'" class="mr-3">
                {{ form.printer_slip_address ? "mdi-printer-check" : "mdi-printer-off" }}
              </v-icon>
              <div class="flex-grow-1">
                <div class="font-weight-medium">
                  เครื่องพิมพ์สลิป: {{ form.printer_slip_name || "ยังไม่ได้เลือก" }}
                </div>
                <div class="text-caption grey--text">พิมพ์ใบเสร็จ 58mm ผ่าน Bluetooth (รูปภาพ ภาษาไทยคมชัด)</div>
              </div>
            </div>
            <div class="d-flex flex-wrap">
              <v-btn color="primary" class="mr-2 mb-2" @click="openBtScan('slip')">
                <v-icon left>mdi-bluetooth</v-icon>{{ form.printer_slip_address ? "เปลี่ยนเครื่องพิมพ์" : "เลือกเครื่องพิมพ์" }}
              </v-btn>
              <v-btn color="primary" outlined class="mb-2" @click="testPrint">
                <v-icon left>mdi-printer-eye</v-icon>ทดสอบพิมพ์
              </v-btn>
            </div>
            <v-divider class="my-3"></v-divider>
            <div class="text-caption grey--text">
              จับคู่ (pair) เครื่องพิมพ์ใน <strong>Bluetooth ของ Android</strong> ก่อน แล้วกด "เลือกเครื่องพิมพ์" ·
              รองรับเครื่องพิมพ์ความร้อน 58mm (เช่น VPOS VP58BT)
            </div>
          </v-card-text>

          <!-- WEB: Web Bluetooth (Chrome/Edge) -->
          <v-card-text v-else>
            <div class="d-flex align-center mb-3">
              <v-icon large :color="connected ? 'success' : 'grey'" class="mr-3">
                {{ connected ? "mdi-printer-check" : "mdi-printer-off" }}
              </v-icon>
              <div class="flex-grow-1">
                <div class="font-weight-medium">
                  {{ connected ? "เชื่อมต่อแล้ว: " + printerName : "ยังไม่ได้เชื่อมต่อ (Bluetooth)" }}
                </div>
                <div class="text-caption grey--text">
                  {{ connected ? "พิมพ์ผ่าน Bluetooth แบบไม่มีหน้าต่าง" : "ถ้าไม่เชื่อม BT จะพิมพ์ผ่านหน้าต่างเบราว์เซอร์ (USB/ไดรเวอร์)" }}
                </div>
              </div>
            </div>
            <div class="d-flex flex-wrap">
              <v-btn v-if="!connected" color="primary" class="mr-2 mb-2" @click="connectPrinter">
                <v-icon left>mdi-bluetooth</v-icon>เชื่อมต่อ Bluetooth
              </v-btn>
              <v-btn v-else color="error" outlined class="mr-2 mb-2" @click="disconnectPrinter">
                <v-icon left>mdi-bluetooth-off</v-icon>ตัดการเชื่อมต่อ
              </v-btn>
              <v-btn color="primary" outlined class="mb-2" @click="testPrint">
                <v-icon left>mdi-printer-eye</v-icon>ทดสอบพิมพ์
              </v-btn>
            </div>
            <v-divider class="my-3"></v-divider>
            <div class="text-caption grey--text">
              รองรับเครื่องพิมพ์ความร้อน 58mm (เช่น VPOS VP58BT) ·
              บนเว็บใช้ Chrome/Edge (Web Bluetooth) · USB: ตั้งเครื่องพิมพ์เริ่มต้น + กระดาษ 58mm
            </div>
          </v-card-text>
        </v-card>

        <!-- Sticker / label printer (e.g. CLABEL 230B) — app only -->
        <v-card class="rounded-xl mb-5">
          <v-card-title><v-icon left color="teal">mdi-sticker-text-outline</v-icon> เครื่องพิมพ์สติกเกอร์ (ฉลาก)</v-card-title>
          <v-divider></v-divider>
          <v-card-text v-if="isNativeApp">
            <div class="d-flex align-center mb-3">
              <v-icon large :color="form.printer_sticker_address ? 'success' : 'grey'" class="mr-3">
                {{ form.printer_sticker_address ? "mdi-printer-check" : "mdi-printer-off" }}
              </v-icon>
              <div class="flex-grow-1">
                <div class="font-weight-medium">
                  เครื่องพิมพ์สติกเกอร์: {{ form.printer_sticker_name || "ยังไม่ได้เลือก" }}
                </div>
                <div class="text-caption grey--text">เช่น CLABEL 230B · ถ้าเว้นว่างจะพิมพ์สติกเกอร์ออกเครื่องพิมพ์สลิป</div>
              </div>
            </div>
            <div class="d-flex flex-wrap align-center">
              <v-btn color="teal" dark class="mr-2 mb-2" @click="openBtScan('sticker')">
                <v-icon left>mdi-bluetooth</v-icon>{{ form.printer_sticker_address ? "เปลี่ยนเครื่องพิมพ์" : "เลือกเครื่องพิมพ์" }}
              </v-btn>
              <v-btn v-if="form.printer_sticker_address" color="error" text class="mr-2 mb-2" @click="clearSticker">
                ลบ
              </v-btn>
              <v-btn color="teal" outlined class="mb-2" @click="testSticker">
                <v-icon left>mdi-printer-eye</v-icon>ทดสอบพิมพ์สติกเกอร์
              </v-btn>
            </div>
            <v-row class="mt-1" dense>
              <v-col cols="6" sm="4">
                <v-select outlined dense hide-details label="ขนาดฉลาก (มม.)" :items="stickerSizes"
                  v-model="form.sticker_size"></v-select>
              </v-col>
              <v-col cols="6" sm="4">
                <v-text-field outlined dense hide-details type="number" label="ความละเอียด (DPI)"
                  v-model.number="form.printer_sticker_dpi" hint="CLABEL 230B = 300" persistent-hint></v-text-field>
              </v-col>
            </v-row>
            <v-divider class="my-3"></v-divider>
            <div class="text-caption grey--text">
              จับคู่ CLABEL 230B ใน Bluetooth ของ Android ก่อน · ฉลากพิมพ์เป็นรูปภาพ (ภาษาไทยคมชัด รองรับโลโก้)
            </div>
          </v-card-text>
          <v-card-text v-else class="grey--text">
            <v-icon left color="grey">mdi-information-outline</v-icon>
            เครื่องพิมพ์สติกเกอร์แยก (เช่น CLABEL 230B) ใช้ได้เฉพาะในแอป (APK) · บนเว็บสติกเกอร์จะพิมพ์ผ่านหน้าต่างเบราว์เซอร์
          </v-card-text>
        </v-card>

        <!-- Native Bluetooth device picker (APK only) -->
        <v-dialog v-model="btDialog" max-width="440" @click:outside="closeBtScan">
          <v-card class="rounded-xl">
            <v-card-title>
              <v-icon left color="primary">mdi-bluetooth-connect</v-icon>เลือกเครื่องพิมพ์
              <v-spacer></v-spacer>
              <v-progress-circular v-if="btScanning" indeterminate size="20" width="2" color="primary"></v-progress-circular>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text class="pa-0">
              <v-list two-line>
                <v-list-item v-for="d in btDevices" :key="d.address" :disabled="!!btConnecting" @click="pickDevice(d)">
                  <v-list-item-icon><v-icon color="primary">mdi-printer-pos</v-icon></v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>{{ d.name || "(ไม่มีชื่อ)" }}</v-list-item-title>
                    <v-list-item-subtitle>{{ d.address }}</v-list-item-subtitle>
                  </v-list-item-content>
                  <v-list-item-action>
                    <v-progress-circular v-if="btConnecting === d.address" indeterminate size="18" width="2"></v-progress-circular>
                    <v-icon v-else>mdi-chevron-right</v-icon>
                  </v-list-item-action>
                </v-list-item>
                <div v-if="!btDevices.length" class="text-center grey--text pa-6">
                  {{ btScanning ? "กำลังค้นหา... (เปิด Bluetooth + จับคู่เครื่องพิมพ์ไว้ก่อน)" : "ไม่พบเครื่องพิมพ์" }}
                </div>
              </v-list>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn text @click="closeBtScan">ปิด</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <v-card class="rounded-xl mb-5">
          <v-card-title><v-icon left color="primary">mdi-sticker-outline</v-icon> สติกเกอร์ออเดอร์</v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-switch v-model="form.sticker_enabled" inset hide-details class="mt-0"
              label="เปิดใช้สติกเกอร์ออเดอร์ (ฉลากติดแก้ว/ถุง)"></v-switch>
            <v-switch v-model="form.sticker_auto" inset hide-details class="mt-2"
              label="พิมพ์สติกเกอร์อัตโนมัติหลังชำระเงิน"></v-switch>
            <v-row class="mt-2">
              <v-col cols="7">
                <v-select outlined dense label="ขนาดฉลาก (มม.)" :items="stickerSizes"
                  v-model="form.sticker_size" hide-details></v-select>
              </v-col>
              <v-col cols="5" class="d-flex align-center">
                <v-switch v-model="form.sticker_per_qty" hide-details dense class="mt-0"
                  label="1 ดวง/แก้ว"></v-switch>
              </v-col>
            </v-row>
            <div class="mt-3 font-weight-medium text-body-2">แสดงบนสติกเกอร์</div>
            <div class="d-flex flex-wrap">
              <v-switch v-model="form.sticker_show_logo" dense hide-details class="mt-1 mr-4" label="โลโก้"></v-switch>
              <v-switch v-model="form.sticker_show_options" dense hide-details class="mt-1 mr-4" label="ออปชั่น"></v-switch>
              <v-switch v-model="form.sticker_show_price" dense hide-details class="mt-1 mr-4" label="ราคา"></v-switch>
              <v-switch v-model="form.sticker_show_datetime" dense hide-details class="mt-1" label="วันเวลา"></v-switch>
            </div>
            <div class="text-center mt-4" style="background:#f4f6f8;border-radius:8px;padding:10px">
              <div class="text-caption grey--text mb-1">ตัวอย่างสติกเกอร์</div>
              <iframe ref="stickerPreview" class="sticker-frame"></iframe>
            </div>
          </v-card-text>
          <v-card-actions class="px-4 pb-4">
            <v-btn color="teal" outlined @click="testSticker"><v-icon left>mdi-printer</v-icon>ทดสอบพิมพ์สติกเกอร์</v-btn>
            <v-spacer></v-spacer>
            <v-btn color="primary" :loading="saving" @click="saveSettings">บันทึก</v-btn>
          </v-card-actions>
        </v-card>

        <v-card class="rounded-xl mb-5">
          <v-card-title><v-icon left color="green darken-1">mdi-chat</v-icon> LINE CRM</v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-switch v-model="form.line_enabled" inset hide-details class="mt-0"
              label="เปิดใช้ LINE CRM"></v-switch>
            <v-row class="mt-2">
              <v-col cols="6"><v-text-field outlined dense label="LINE OA Basic ID" v-model="form.line_basic_id"
                @input="genLineQr" hint="เช่น @brewpos" persistent-hint></v-text-field></v-col>
              <v-col cols="6"><v-text-field outlined dense label="ชื่อ OA" v-model="form.line_oa_name"></v-text-field></v-col>
            </v-row>
            <v-text-field outlined dense class="mt-1" label="Channel Access Token"
              v-model="form.line_channel_token" type="password"
              hint="ใส่เพื่อส่งจริง · ว่าง = โหมดจำลอง (log ไว้ทดสอบ)" persistent-hint></v-text-field>
            <v-switch v-model="form.line_notify_purchase" dense hide-details class="mt-2"
              label="แจ้งแต้ม/ใบเสร็จเข้า LINE หลังลูกค้าซื้อ"></v-switch>
            <v-textarea outlined dense rows="2" class="mt-3" label="ข้อความต้อนรับ"
              v-model="form.line_welcome"></v-textarea>
            <div class="text-center mt-2">
              <div class="text-caption grey--text mb-1">QR เพิ่มเพื่อน LINE OA</div>
              <img v-if="lineQr" :src="lineQr" style="width:150px" />
              <div v-else class="grey--text"><v-icon size="50" color="grey">mdi-qrcode</v-icon></div>
            </div>
          </v-card-text>
          <v-card-actions class="px-4 pb-4">
            <v-spacer></v-spacer>
            <v-btn color="green darken-1" dark :loading="saving" @click="saveSettings">บันทึก LINE CRM</v-btn>
          </v-card-actions>
        </v-card>

        <v-card class="rounded-xl">
          <v-card-title><v-icon left color="primary">mdi-lock-reset</v-icon> เปลี่ยนรหัสผ่าน</v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <div class="grey--text text-caption mb-2">บัญชี: {{ meName }} ({{ meUsername }})</div>
            <v-text-field
              outlined dense type="password" label="รหัสผ่านใหม่" v-model="newPass"
              :error-messages="passError"
            ></v-text-field>
            <v-text-field
              outlined dense type="password" class="mt-n2" label="ยืนยันรหัสผ่านใหม่" v-model="newPass2"
            ></v-text-field>
          </v-card-text>
          <v-card-actions class="px-4 pb-4">
            <v-spacer></v-spacer>
            <v-btn color="primary" outlined :loading="savingPass" @click="changePassword">
              <v-icon left>mdi-key-variant</v-icon> เปลี่ยนรหัสผ่าน
            </v-btn>
          </v-card-actions>
        </v-card>
    </div>

    <v-snackbar v-model="snackbar" :timeout="2500" :color="snackColor" top>{{ snackText }}</v-snackbar>
  </div>
</template>

<script>
export default {
  middleware: ["auth", "check"],
  async asyncData(context) {
    const settings = await context.$axios.$get("/settings");
    return { form: settings };
  },
  data: () => ({
    form: {},
    ppPreview: "",
    lineQr: "",
    previewTimer: null,
    stickerSizes: ["40x30", "50x30", "50x40", "80x40"],
    logoFile: null,
    uploading: false,
    saving: false,
    savingPass: false,
    newPass: "",
    newPass2: "",
    passError: "",
    snackbar: false,
    snackText: "",
    snackColor: "success",
    btDialog: false,
    btScanning: false,
    btDevices: [],
    btConnecting: "",
    btTarget: "slip"
  }),
  computed: {
    imgBase() {
      return this.$axios.defaults.baseURL.replace("/api", "/");
    },
    fullAddress() {
      return [this.form.address, this.form.subdistrict, this.form.district, this.form.province, this.form.postcode]
        .filter(Boolean)
        .join(" ");
    },
    me() {
      return (this.$store.state.auth && this.$store.state.auth.user) || {};
    },
    meName() {
      return ((this.me.fname || "") + " " + (this.me.lname || "")).trim();
    },
    meUsername() {
      return this.me.username || "";
    },
    connected() {
      return !!(this.$printer && this.$printer.state.connected);
    },
    printerName() {
      return this.$printer ? this.$printer.state.name : "";
    },
    isNativeApp() {
      return !!(this.$printer && this.$printer.isNative && this.$printer.isNative());
    }
  },
  async mounted() {
    await this.genPreview();
    await this.genLineQr();
    this.$nextTick(() => {
      this.renderPreview();
      this.renderStickerPreview();
    });
  },
  watch: {
    form: {
      deep: true,
      handler() {
        clearTimeout(this.previewTimer);
        this.previewTimer = setTimeout(() => {
          this.renderPreview();
          this.renderStickerPreview();
        }, 300);
      }
    }
  },
  methods: {
    kindName(k) {
      return { cash: "เงินสด", qr: "QR", transfer: "โอน", split: "แยกชำระ", credit: "เงินเชื่อ", other: "ทั่วไป" }[k] || "ทั่วไป";
    },
    addPayMethod() {
      if (!Array.isArray(this.form.payment_methods)) this.$set(this.form, "payment_methods", []);
      this.form.payment_methods.push({
        key: "m" + Date.now(),
        label: "วิธีใหม่",
        icon: "mdi-wallet-outline",
        kind: "other",
        enabled: true,
        builtin: false
      });
    },
    async genPreview() {
      this.ppPreview = "";
      if (this.$pp && this.form.promptpay_id) {
        this.ppPreview = await this.$pp.qr(this.form.promptpay_id, 0);
      }
    },
    async genLineQr() {
      this.lineQr = "";
      const id = (this.form.line_basic_id || "").replace(/^@/, "");
      if (this.$pp && id) {
        this.lineQr = await this.$pp.qrText("https://line.me/R/ti/p/@" + id);
      }
    },
    renderPreview() {
      const f = this.$refs.preview;
      if (!f || !this.$printer) return;
      const s = { ...this.form, logoUrl: this.$img(this.form.logo) };
      const items = [
        { name: "อเมริกาโน่ (ร้อน)", qty: 1, price: 50, options: ["ร้อน", "หวานน้อย"] },
        { name: "เค้กช็อกโกแลต", qty: 1, price: 75, options: [] }
      ];
      const total = items.reduce((a, i) => a + i.price, 0);
      const build = qrImage => {
        const receipt = {
          bill_name: "ตัวอย่าง",
          datetime: Date.now(),
          list_product: items,
          subTotal: total, discount: 0, pointsUsed: 0, total_price: total,
          paymentMethod: "cash", cash: 500, change: 500 - total,
          earnedPoints: Math.floor(total / (Number(this.form.point_per_baht) || 10)),
          qrImage
        };
        f.srcdoc = this.$printer.buildHtml(receipt, s);
        f.onload = () => {
          try {
            f.style.height = f.contentWindow.document.body.scrollHeight + 10 + "px";
          } catch (e) {}
        };
      };
      if (this.$pp && this.form.promptpay_id) {
        this.$pp.qr(this.form.promptpay_id, total).then(build).catch(() => build(""));
      } else {
        build("");
      }
    },
    stickerSample() {
      return {
        bill_name: "โต๊ะ 5",
        queue_no: 12,
        datetime: Date.now(),
        list_product: [
          { name: "ลาเต้", qty: 1, options: ["เย็น", "แก้วใหญ่", "หวานน้อย"], unit: 80, price: 80 },
          { name: "อเมริกาโน่", qty: 1, options: ["ร้อน"], unit: 50, price: 50 }
        ]
      };
    },
    stickerSettings() {
      return { ...this.form, logoUrl: this.$img(this.form.logo) };
    },
    renderStickerPreview() {
      const f = this.$refs.stickerPreview;
      if (!f || !this.$printer || !this.$printer.buildStickerHtml) return;
      f.srcdoc = this.$printer.buildStickerHtml(this.stickerSample(), this.stickerSettings());
      f.onload = () => {
        try {
          f.style.height = f.contentWindow.document.body.scrollHeight + 6 + "px";
        } catch (e) {}
      };
    },
    async testSticker() {
      try {
        const how = await this.$printer.printStickers(this.stickerSample(), this.stickerSettings());
        if (how === "bluetooth") this.notify("ส่งสติกเกอร์ไปยังเครื่องพิมพ์แล้ว");
        else if (how === "browser") this.notify("ส่งสติกเกอร์ไปยังหน้าต่างพิมพ์แล้ว");
        else this.notify("ยังไม่ได้เลือกเครื่องพิมพ์สติกเกอร์", "error");
      } catch (e) {
        this.notify(e.message || "พิมพ์สติกเกอร์ไม่สำเร็จ", "error");
      }
    },
    async uploadLogo(file) {
      if (!file) return;
      const fd = new FormData();
      fd.append("file", file);
      this.uploading = true;
      try {
        const res = await this.$axios.post("/upload", fd);
        this.$set(this.form, "logo", res.data.url);
        this.notify("อัปโหลดรูปสำเร็จ (อย่าลืมกดบันทึก)");
      } catch (e) {
        this.notify("อัปโหลดรูปไม่สำเร็จ", "error");
      } finally {
        this.uploading = false;
      }
    },
    async connectPrinter() {
      // Native app (APK): scan paired/nearby Bluetooth printers and let the user pick.
      if (this.$printer && this.$printer.isNative && this.$printer.isNative()) {
        this.openBtScan();
        return;
      }
      // Web (Chrome/Edge): use the Web Bluetooth picker.
      try {
        const name = await this.$printer.connectBluetooth();
        this.notify("เชื่อมต่อเครื่องพิมพ์: " + name);
      } catch (e) {
        this.notify(e.message || "เชื่อมต่อไม่สำเร็จ", "error");
      }
    },
    async openBtScan(target) {
      this.btTarget = target || "slip";
      this.btDevices = [];
      this.btConnecting = "";
      this.btDialog = true;
      this.btScanning = true;
      try {
        await this.$printer.startScan(devices => {
          this.btDevices = devices;
        });
      } catch (e) {
        this.btScanning = false;
        this.notify(e.message || "ค้นหาเครื่องพิมพ์ไม่สำเร็จ", "error");
      }
    },
    async pickDevice(dev) {
      this.btConnecting = dev.address;
      try {
        const sticker = this.btTarget === "sticker";
        // assign the chosen device to the slip or sticker slot
        if (sticker) {
          this.$set(this.form, "printer_sticker_address", dev.address);
          this.$set(this.form, "printer_sticker_name", dev.name || dev.address);
        } else {
          this.$set(this.form, "printer_slip_address", dev.address);
          this.$set(this.form, "printer_slip_name", dev.name || dev.address);
        }
        // verify by connecting now (also leaves it warm for the first print)
        const name = await this.$printer.connectNative(dev.address);
        await this.saveSettings();
        this.btDialog = false;
        this.btScanning = false;
        this.notify((sticker ? "เครื่องพิมพ์สติกเกอร์: " : "เครื่องพิมพ์สลิป: ") + name);
      } catch (e) {
        this.notify(e.message || "เชื่อมต่อไม่สำเร็จ", "error");
      } finally {
        this.btConnecting = "";
      }
    },
    async clearSticker() {
      this.$set(this.form, "printer_sticker_address", "");
      this.$set(this.form, "printer_sticker_name", "");
      await this.saveSettings();
      this.notify("ลบเครื่องพิมพ์สติกเกอร์แล้ว");
    },
    async closeBtScan() {
      this.btDialog = false;
      this.btScanning = false;
      if (this.$printer && this.$printer.stopScan) {
        try { await this.$printer.stopScan(); } catch (e) {}
      }
    },
    async disconnectPrinter() {
      if (this.$printer) await this.$printer.disconnect();
      this.notify("ตัดการเชื่อมต่อแล้ว");
    },
    async testPrint() {
      try {
        // real shop settings (header/footer/logo/contact) from the form
        const s = {
          ...this.form,
          logoUrl: this.$img(this.form.logo)
        };
        // only the menu items are sample data; everything else is real
        const items = [
          { name: "อเมริกาโน่ (ร้อน)", qty: 1, price: 50, options: ["ร้อน", "หวานน้อย"] },
          { name: "เค้กช็อกโกแลต", qty: 1, price: 75, options: [] }
        ];
        const subTotal = items.reduce((a, i) => a + i.price, 0);
        const total = subTotal;
        const perBaht = Number(this.form.point_per_baht) || 10;
        const cash = 500;
        const receipt = {
          bill_name: "ทดสอบพิมพ์",
          datetime: Date.now(),
          list_product: items,
          subTotal,
          discount: 0,
          pointsUsed: 0,
          total_price: total,
          paymentMethod: "cash",
          cash,
          change: cash - total,
          earnedPoints: Math.floor(total / perBaht),
          // real PromptPay QR for the test amount (uses the configured PromptPay ID)
          qrImage:
            this.$pp && this.form.promptpay_id
              ? await this.$pp.qr(this.form.promptpay_id, total)
              : ""
        };
        const how = await this.$printer.print(receipt, s);
        if (how === "browser") this.notify("ส่งไปยังหน้าต่างพิมพ์แล้ว");
        else if (how === "bluetooth") this.notify("ส่งไปยังเครื่องพิมพ์ Bluetooth แล้ว");
      } catch (e) {
        this.notify(e.message || "พิมพ์ไม่สำเร็จ", "error");
      }
    },
    notify(text, color) {
      this.snackText = text;
      this.snackColor = color || "success";
      this.snackbar = true;
    },
    async saveSettings() {
      this.saving = true;
      try {
        const payload = { ...this.form, point_per_baht: Number(this.form.point_per_baht) || 10 };
        await this.$axios.$put("/settings", payload);
        // update app-wide store so sidebar/login brand + tab title react immediately
        this.$store.commit("setSettings", payload);
        if (typeof window !== "undefined" && window.__applyBranding) window.__applyBranding();
        this.notify("บันทึกการตั้งค่าสำเร็จ");
      } catch (e) {
        console.log(e);
        this.notify("บันทึกไม่สำเร็จ", "error");
      } finally {
        this.saving = false;
      }
    },
    async changePassword() {
      this.passError = "";
      if (!this.newPass || this.newPass.length < 4) {
        this.passError = "รหัสผ่านอย่างน้อย 4 ตัวอักษร";
        return;
      }
      if (this.newPass !== this.newPass2) {
        this.passError = "รหัสผ่านยืนยันไม่ตรงกัน";
        return;
      }
      this.savingPass = true;
      try {
        await this.$axios.$put("/employee/" + this.me._id, { password: this.newPass });
        this.newPass = "";
        this.newPass2 = "";
        this.notify("เปลี่ยนรหัสผ่านสำเร็จ");
      } catch (e) {
        console.log(e);
        this.notify("เปลี่ยนรหัสผ่านไม่สำเร็จ", "error");
      } finally {
        this.savingPass = false;
      }
    }
  }
};
</script>

<style scoped>
.set-title { font-family: "Mitr", sans-serif; font-weight: 600; color: #1d1d1d; }
.slip-frame {
  width: 240px;
  min-height: 360px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}
.sticker-frame {
  width: 200px;
  min-height: 150px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: #fff;
}
</style>
