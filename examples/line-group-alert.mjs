/**
 * ตัวอย่างแจ้งเตือนกลุ่ม LINE เมื่อมีคนกรอกฟอร์ม "ขอให้ทีมงานโทรกลับ"
 *
 * ค่าเริ่มต้น = dry-run (พิมพ์ตัวอย่างอย่างเดียว ไม่ยิง LINE)
 *
 * ใช้จริงทีหลัง:
 *   set LINE_CHANNEL_ACCESS_TOKEN=...
 *   set LINE_GROUP_ID=Cb3b820230a981d7495ad092dced598ad
 *   set SEND_LINE=1
 *   node examples/line-group-alert.mjs --name "สมชาย" --phone "0812345678"
 *
 * ห้ามใส่ Channel Access Token ใน frontend / HTML / git
 */

const GROUP_ID = process.env.LINE_GROUP_ID || "Cb3b820230a981d7495ad092dced598ad";
const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";
const SEND = process.env.SEND_LINE === "1";

function arg(name, fallback = "") {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function formatThaiTime(date = new Date()) {
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/** ข้อความที่จะโผล่ในกลุ่ม LINE */
export function buildLeadAlert({ name, phone, source = "หน้าเว็บเต่าพนมมือ", submittedAt } = {}) {
  const when = formatThaiTime(submittedAt ? new Date(submittedAt) : new Date());
  return [
    "📞 มีคนขอให้ทีมงานโทรกลับ",
    "",
    `ชื่อ: ${name || "-"}`,
    `เบอร์: ${phone || "-"}`,
    `เวลา: ${when}`,
    `แหล่ง: ${source}`,
    "",
    "โปรดติดต่อกลับโดยเร็ว",
  ].join("\n");
}

async function pushToGroup(text) {
  if (!TOKEN) throw new Error("missing LINE_CHANNEL_ACCESS_TOKEN");
  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      to: GROUP_ID,
      messages: [{ type: "text", text }],
    }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`LINE ${res.status}: ${body}`);
  return body || "ok";
}

const lead = {
  name: arg("name", "คุณสมชาย"),
  phone: arg("phone", "081-234-5678"),
  source: "หน้าเว็บเต่าพนมมือ",
  submittedAt: new Date().toISOString(),
};

const text = buildLeadAlert(lead);

console.log("========== ตัวอย่างข้อความในกลุ่ม LINE ==========");
console.log(text);
console.log("=================================================");
console.log(`Group ID: ${GROUP_ID}`);
console.log(`โหมด: ${SEND ? "SEND (ยิงจริง)" : "DRY-RUN (ไม่ส่ง)"}`);

if (!SEND) {
  console.log("\nยังไม่ส่งเข้ากลุ่ม — ตั้ง SEND_LINE=1 และใส่ token ถ้าต้องการยิงจริง");
  process.exit(0);
}

try {
  const result = await pushToGroup(text);
  console.log("ส่งแล้ว:", result);
} catch (err) {
  console.error("ส่งไม่สำเร็จ:", err.message);
  process.exit(1);
}
