export function getJSON<T>(key: string, fallback: T, store: Storage = localStorage): T {
  try {
    const raw = store.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setJSON<T>(key: string, value: T, store: Storage = localStorage): void {
  try {
    store.setItem(key, JSON.stringify(value));
  } catch {
    /* ignorér quota-fejl */
  }
}
