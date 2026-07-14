const customBackgroundDatabase = 'mineradio-custom-background-v1';
const databasePrefixRoot = 'kernelon:mineradio:';

/**
 * Keeps Mineradio's frozen IndexedDB name inside the active KernelOn user
 * namespace. Other databases are passed through untouched because shared
 * derived caches intentionally remain device-wide.
 */
export function createNamespacedIndexedDb(
  indexedDB: IDBFactory,
  namespace?: string,
): IDBFactory {
  if (!namespace) return indexedDB;

  const physicalName = (name: string) =>
    name === customBackgroundDatabase
      ? `${databasePrefixRoot}${encodeURIComponent(namespace)}:${name}`
      : name;

  return new Proxy(indexedDB, {
    get(target, property) {
      if (property === 'open') {
        return (name: string, version?: number) =>
          version === undefined
            ? target.open(physicalName(name))
            : target.open(physicalName(name), version);
      }
      if (property === 'deleteDatabase') {
        return (name: string) => target.deleteDatabase(physicalName(name));
      }

      const value = Reflect.get(target, property, target) as unknown;
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}
