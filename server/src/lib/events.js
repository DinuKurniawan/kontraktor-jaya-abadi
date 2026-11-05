// Event Bus internal untuk memancarkan perubahan data server ke stream SSE
import { EventEmitter } from "node:events";

class RealtimeEmitter extends EventEmitter {}

export const realtimeEmitter = new RealtimeEmitter();
// Cegah limit memory leak warning saat banyak koneksi
realtimeEmitter.setMaxListeners(100);

export function emitChange(resource, action = "update", details = {}) {
  realtimeEmitter.emit("change", { resource, action, details, timestamp: Date.now() });
}
