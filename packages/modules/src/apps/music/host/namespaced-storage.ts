const storagePrefixRoot = 'kernelon:mineradio:';

/**
 * Presents Mineradio with the unchanged Web Storage contract while keeping
 * every original key inside the active KernelOn principal/device namespace.
 */
export function createNamespacedStorage(storage: Storage, namespace?: string): Storage {
  if (!namespace) return storage;

  const prefix = `${storagePrefixRoot}${encodeURIComponent(namespace)}:`;
  const visibleKeys = () => {
    const keys: string[] = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key?.startsWith(prefix)) keys.push(key.slice(prefix.length));
    }
    return keys;
  };

  return {
    clear() {
      for (const key of visibleKeys()) storage.removeItem(`${prefix}${key}`);
    },
    getItem(key) {
      return storage.getItem(`${prefix}${key}`);
    },
    key(index) {
      return visibleKeys()[index] ?? null;
    },
    get length() {
      return visibleKeys().length;
    },
    removeItem(key) {
      storage.removeItem(`${prefix}${key}`);
    },
    setItem(key, value) {
      storage.setItem(`${prefix}${key}`, value);
    },
  };
}
