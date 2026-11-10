// OpenStatusBadge — status buka/tutup kantor utama berdasarkan waktu WIB.
import { useEffect, useState } from "react";

const DAY_NAMES = { Sunday: "Minggu", Monday: "Senin", Tuesday: "Selasa", Wednesday: "Rabu", Thursday: "Kamis", Friday: "Jumat", Saturday: "Sabtu" };
const DAY_ORDER = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

function currentWib() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", weekday: "long", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const get = (type) => parts.find((part) => part.type === type)?.value ?? "0";
  return { day: DAY_NAMES[get("weekday")], minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

function toMinutes(value) {
  const [hour, minute] = String(value ?? "").split(":").map(Number);
  return Number.isFinite(hour) && Number.isFinite(minute) ? hour * 60 + minute : null;
}

function formatTime(value) { return String(value ?? "").replace(":", "."); }

function getStatus(hours) {
  const now = currentWib();
  const today = hours.find((item) => item.hari === now.day);
  const open = toMinutes(today?.buka);
  const close = toMinutes(today?.tutup);
  if (today && !today.libur && open !== null && close !== null && now.minutes >= open && now.minutes < close) {
    return { open: true, text: `Buka sekarang - tutup ${formatTime(today.tutup)}` };
  }

  const todayIndex = DAY_ORDER.indexOf(now.day);
  for (let offset = 1; offset <= DAY_ORDER.length; offset += 1) {
    const nextDay = DAY_ORDER[(todayIndex + offset) % DAY_ORDER.length];
    const next = hours.find((item) => item.hari === nextDay);
    if (next && !next.libur && toMinutes(next.buka) !== null) return { open: false, text: `Tutup - buka ${nextDay} ${formatTime(next.buka)}` };
  }
  return { open: false, text: "Tutup - jadwal belum tersedia" };
}

export default function OpenStatusBadge({ openingHours = [] }) {
  const [, refresh] = useState(0);
  useEffect(() => { const timer = setInterval(() => refresh((value) => value + 1), 60 * 1000); return () => clearInterval(timer); }, []);
  const status = getStatus(openingHours);
  return <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${status.open ? "bg-success-soft text-ink-soft" : "bg-ink/10 text-ink-soft"}`}><span className={`h-2 w-2 rounded-full ${status.open ? "bg-success" : "bg-ink-light"}`} aria-hidden />{status.text} WIB</span>;
}
