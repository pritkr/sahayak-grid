// Tiny IndexedDB wrapper (idb-keyval style, zero deps) + localStorage fallback.
// Works in browser; in Node/tests falls back to in-memory + localStorage shim.

export type QueueOp = {
  id: string;
  type: 'register' | 'consent' | 'alert_read';
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
};

const DB = 'sahayak-grid';
const STORE = 'kv';

function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key: string): Promise<string | null> {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const rq = tx.objectStore(STORE).get(key);
    rq.onsuccess = () => resolve((rq.result as string) ?? null);
    rq.onerror = () => reject(rq.error);
  });
}

async function idbSet(key: string, val: string): Promise<void> {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(val, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

const mem = new Map<string, string>();
const hasIDB = () => typeof indexedDB !== 'undefined';

export async function kvGet(key: string): Promise<string | null> {
  try {
    if (hasIDB()) return await idbGet(key);
  } catch { /* fall through */ }
  try {
    if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
  } catch { /* noop */ }
  return mem.get(key) ?? null;
}

export async function kvSet(key: string, val: string): Promise<void> {
  try {
    if (hasIDB()) { await idbSet(key, val); return; }
  } catch { /* fall through */ }
  try {
    if (typeof localStorage !== 'undefined') { localStorage.setItem(key, val); return; }
  } catch { /* noop */ }
  mem.set(key, val);
}

export async function getQueue(): Promise<QueueOp[]> {
  const raw = await kvGet('sg:queue');
  if (!raw) return [];
  try { return JSON.parse(raw) as QueueOp[]; } catch { return []; }
}

export async function enqueue(op: Omit<QueueOp, 'id' | 'createdAt' | 'attempts'>): Promise<QueueOp> {
  const q = await getQueue();
  const full: QueueOp = {
    ...op,
    id: (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? crypto.randomUUID()
      : `q_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  q.push(full);
  await kvSet('sg:queue', JSON.stringify(q));
  return full;
}

export async function dequeue(id: string): Promise<void> {
  const q = await getQueue();
  await kvSet('sg:queue', JSON.stringify(q.filter((o) => o.id !== id)));
}

// Replay queue against a push fn. Returns { sent, failed }.
export async function replayQueue(
  push: (op: QueueOp) => Promise<boolean>,
): Promise<{ sent: number; failed: number }> {
  const q = await getQueue();
  let sent = 0, failed = 0;
  for (const op of q) {
    try {
      const ok = await push(op);
      if (ok) { await dequeue(op.id); sent++; }
      else { failed++; }
    } catch { failed++; }
  }
  return { sent, failed };
}

export function mockPushFactory(online: () => boolean) {
  return async (_op: QueueOp): Promise<boolean> => online();
}
