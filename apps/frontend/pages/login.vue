<template>
  <v-row class="login-bg ma-0" justify="center" align="center" style="min-height: 100vh">
    <v-col cols="11" sm="8" md="5" lg="4" xl="3">
      <v-card class="rounded-xl pa-2" elevation="12">
        <div class="text-center pt-6 pb-2">
          <v-avatar color="primary" size="72" class="mb-3 elevation-4">
            <v-img v-if="shopLogo" :src="shopLogo"></v-img>
            <v-icon v-else size="40" dark>mdi-coffee</v-icon>
          </v-avatar>
          <h1 class="brand">{{ shopName }}</h1>
          <div class="grey--text">เข้าสู่ระบบจัดการร้าน</div>
        </div>

        <v-card-text class="px-6">
          <!-- mode switch -->
          <v-btn-toggle v-model="mode" mandatory dense color="primary" class="d-flex mb-5" group>
            <v-btn value="password" class="flex-grow-1"><v-icon left small>mdi-form-textbox-password</v-icon>รหัสผ่าน</v-btn>
            <v-btn value="pin" class="flex-grow-1"><v-icon left small>mdi-dialpad</v-icon>PIN</v-btn>
          </v-btn-toggle>

          <!-- USERNAME / PASSWORD -->
          <v-form v-if="mode === 'password'" v-model="valid" ref="form" @submit.prevent="login">
            <v-text-field
              label="ชื่อผู้ใช้ (USERNAME)" :rules="rules" v-model="username"
              outlined prepend-inner-icon="mdi-account-outline" color="primary" class="mb-1"
            ></v-text-field>
            <v-text-field
              label="รหัสผ่าน (PASSWORD)" :rules="rules" v-model="password"
              outlined prepend-inner-icon="mdi-lock-outline" color="primary"
              :type="showPass ? 'text' : 'password'"
              :append-icon="showPass ? 'mdi-eye' : 'mdi-eye-off'"
              @click:append="showPass = !showPass"
              @keyup.enter="login"
            ></v-text-field>
            <v-btn
              block x-large color="primary" class="mt-2 login-btn" :loading="loading"
              :disabled="!valid" @click="login"
            >
              <v-icon left>mdi-login</v-icon> Login
            </v-btn>
          </v-form>

          <!-- PIN PAD -->
          <div v-else class="text-center">
            <div class="grey--text mb-2">กรอกรหัส PIN เพื่อเข้าใช้งาน</div>
            <div class="pin-dots mb-4">
              <span v-for="i in 6" :key="i" class="pin-dot" :class="{ filled: i <= pin.length }"></span>
            </div>
            <div class="pin-pad">
              <v-btn v-for="n in 9" :key="n" class="pin-key" depressed large @click="pinPush(n)">{{ n }}</v-btn>
              <v-btn class="pin-key" text large @click="pinBack"><v-icon>mdi-backspace-outline</v-icon></v-btn>
              <v-btn class="pin-key" depressed large @click="pinPush(0)">0</v-btn>
              <v-btn class="pin-key" color="primary" depressed large :loading="loading"
                aria-label="เข้าสู่ระบบ PIN" @click="loginPin">
                <v-icon>mdi-check</v-icon>
              </v-btn>
            </div>
          </div>

          <v-alert dense text type="info" class="mt-5 mb-2 text-caption rounded-lg">
            <span v-if="mode === 'password'">ทดลอง: <b>admin / admin123</b> · <b>cashier / cashier123</b></span>
            <span v-else>ทดลอง PIN: <b>1111</b> (ผู้ดูแล) · <b>2222</b> (แคชเชียร์)</span>
          </v-alert>
        </v-card-text>
      </v-card>
      <div class="text-center white--text mt-4 text-caption" style="opacity:.85">
        © {{ new Date().getFullYear() }} SHIFT CAFÉ POS
      </div>
    </v-col>

    <v-snackbar v-model="snackbar" :timeout="timeout" centered color="error">
      {{ error }}
      <template v-slot:action="{ attrs }">
        <v-btn color="white" text v-bind="attrs" icon @click="snackbar = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
  </v-row>
</template>

<script>
import { mapState } from "vuex";
export default {
  layout: "login",
  middleware: "isLoggedIn",
  data() {
    return {
      mode: "password",
      showPass: false,
      rules: [value => !!value || "โปรดกรอกข้อมูลให้ครบถ้วน"],
      username: "",
      password: "",
      pin: "",
      snackbar: false,
      timeout: 2500,
      error: null,
      valid: true,
      loading: false
    };
  },
  methods: {
    async login() {
      this.$refs.form.validate();
      if (!this.valid) return;
      this.loading = true;
      const payload = { data: { username: this.username, password: this.password } };
      try {
        const res = await this.$auth.loginWith("local", payload);
        if (res.status === 200) {
          this.$router.push("/");
        }
      } catch (e) {
        this.error =
          (e.response && e.response.data && e.response.data.message) ||
          "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";
        this.snackbar = true;
      } finally {
        this.loading = false;
      }
    },
    pinPush(n) {
      if (this.pin.length >= 6) return;
      this.pin += String(n);
      if (this.pin.length === 6) this.loginPin();
    },
    pinBack() {
      this.pin = this.pin.slice(0, -1);
    },
    async loginPin() {
      if (this.pin.length < 4) {
        this.error = "PIN ต้องมีอย่างน้อย 4 หลัก";
        this.snackbar = true;
        return;
      }
      this.loading = true;
      try {
        const res = await this.$axios.post("authen/pin", { data: { pin: this.pin } });
        const token = res.data && res.data.token;
        if (token) {
          await this.$auth.setUserToken(token);
          this.$router.push("/");
        }
      } catch (e) {
        this.error =
          (e.response && e.response.data && e.response.data.message) || "PIN ไม่ถูกต้อง";
        this.snackbar = true;
        this.pin = "";
      } finally {
        this.loading = false;
      }
    }
  },
  computed: {
    ...mapState("auth", ["loggedIn"]),
    shopName() {
      const s = this.$store.state.settings || {};
      return s.shop_name || "SHIFT CAFÉ";
    },
    shopLogo() {
      const s = this.$store.state.settings || {};
      return this.$img(s.logo);
    }
  }
};
</script>

<style scoped>
.login-bg {
  background: linear-gradient(135deg, #2e9c3f 0%, #1d6f2c 100%);
}
.brand {
  font-family: "Mitr", sans-serif;
  font-weight: 600;
  font-size: 1.8rem;
  color: #1d1d1d;
  letter-spacing: 1px;
}
.login-btn {
  height: 52px !important;
  box-shadow: 0 8px 18px rgba(46, 156, 63, 0.4) !important;
}
.pin-dots {
  display: flex;
  justify-content: center;
  gap: 14px;
}
.pin-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #bdbdbd;
  transition: all 0.15s;
}
.pin-dot.filled {
  background: #2e9c3f;
  border-color: #2e9c3f;
  transform: scale(1.1);
}
.pin-pad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  max-width: 280px;
  margin: 0 auto;
}
.pin-key {
  height: 56px !important;
  font-size: 1.3rem !important;
  font-weight: 600;
  border-radius: 14px !important;
}
</style>
