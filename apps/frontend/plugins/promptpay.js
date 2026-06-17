// PromptPay QR generator ($pp) — builds the Thai EMVCo PromptPay payload and
// renders it to a QR data-URL. Works offline (no external API).
import QRCode from 'qrcode'

// TLV field: id(2) + length(2) + value
function field(id, value) {
  const v = String(value)
  return id + String(v.length).padStart(2, '0') + v
}

// CRC16-CCITT (poly 0x1021, init 0xFFFF) over the string
function crc16(str) {
  let crc = 0xffff
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

// Build the PromptPay payload string for a given proxy id (phone / national id /
// e-wallet) and optional amount.
function payload(id, amount) {
  id = String(id || '').replace(/[^0-9]/g, '')
  if (!id) return ''
  let proxyTag
  let proxyVal
  if (id.length === 13) {
    proxyTag = '02' // national id / tax id
    proxyVal = id
  } else if (id.length >= 15) {
    proxyTag = '03' // e-wallet
    proxyVal = id
  } else {
    proxyTag = '01' // mobile -> 0066 + 9 digits (drop leading 0)
    proxyVal = '0066' + id.replace(/^0/, '')
  }
  const merchant = field('00', 'A000000677010111') + field(proxyTag, proxyVal)
  const amt = Number(amount)
  const hasAmt = amt > 0
  let s =
    field('00', '01') +
    field('01', hasAmt ? '12' : '11') +
    field('29', merchant) +
    field('53', '764') +
    (hasAmt ? field('54', amt.toFixed(2)) : '') +
    field('58', 'TH')
  s += '6304'
  return s + crc16(s)
}

// Return a QR code data-URL (PNG) for the PromptPay payload, or '' if no id.
async function qr(id, amount, opts) {
  const data = payload(id, amount)
  if (!data) return ''
  return QRCode.toDataURL(data, Object.assign({ width: 220, margin: 1 }, opts || {}))
}

// Generic QR from any text/URL (e.g. LINE add-friend link)
async function qrText(text, opts) {
  if (!text) return ''
  return QRCode.toDataURL(String(text), Object.assign({ width: 220, margin: 1 }, opts || {}))
}

export default (ctx, inject) => {
  inject('pp', { payload, qr, qrText })
}

