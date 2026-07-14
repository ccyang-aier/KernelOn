export interface MineradioBeatmapCacheEntry {
  key: string;
  map: unknown;
  meta: {
    artist: string;
    mode: string;
    provider: string;
    title: string;
  };
  savedAt: number;
  v: 1;
}

export interface MineradioBeatmapCache {
  close(): void;
  read(key: string): Promise<MineradioBeatmapCacheEntry | null>;
  write(entry: MineradioBeatmapCacheEntry): Promise<void>;
}

const databaseName = 'kernelon-mineradio-beatmap-cache-v1';
const storeName = 'entries';

export function createBrowserBeatmapCache(factory: IDBFactory): MineradioBeatmapCache {
  let databasePromise: Promise<IDBDatabase> | undefined;
  let connectionEpoch = 0;

  const getDatabase = () => {
    const epoch = connectionEpoch;
    if (!databasePromise) {
      const pending = openDatabase(factory)
        .then((database) => {
          if (epoch !== connectionEpoch) {
            database.close();
            throw new Error('Beatmap cache connection was released');
          }
          return database;
        })
        .catch((error: unknown) => {
          if (databasePromise === pending) databasePromise = undefined;
          throw error;
        });
      databasePromise = pending;
    }
    return databasePromise;
  };

  return {
    close() {
      connectionEpoch += 1;
      const connection = databasePromise;
      databasePromise = undefined;
      void connection?.then((database) => database.close()).catch(() => undefined);
    },
    async read(key) {
      const database = await getDatabase();
      const request = database.transaction(storeName, 'readonly').objectStore(storeName).get(key);
      const value = await requestResult<MineradioBeatmapCacheEntry | undefined>(request);
      return value?.map ? value : null;
    },
    async write(entry) {
      const database = await getDatabase();
      const transaction = database.transaction(storeName, 'readwrite');
      transaction.objectStore(storeName).put(entry);
      await transactionComplete(transaction);
    },
  };
}

export function compactBeatmapCachePayload(
  value: unknown,
  now = Date.now(),
): MineradioBeatmapCacheEntry | null {
  if (!isRecord(value)) return null;
  const key = String(value.key ?? '').trim();
  if (!key || key.length > 240 || !isRecord(value.map)) return null;

  return {
    key,
    map: value.map,
    meta: {
      artist: String(value.artist ?? '').slice(0, 160),
      mode: String(value.mode ?? 'mr').slice(0, 32),
      provider: String(value.provider ?? '').slice(0, 32),
      title: String(value.title ?? '').slice(0, 160),
    },
    savedAt: now,
    v: 1,
  };
}

function openDatabase(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(databaseName, 1);
    request.addEventListener('upgradeneeded', () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(storeName)) {
        database.createObjectStore(storeName, { keyPath: 'key' });
      }
    });
    request.addEventListener(
      'success',
      () => {
        request.result.addEventListener('versionchange', () => request.result.close());
        resolve(request.result);
      },
      { once: true },
    );
    request.addEventListener('error', () => reject(request.error), { once: true });
    request.addEventListener('blocked', () => reject(new Error('Beatmap cache database blocked')), {
      once: true,
    });
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result), { once: true });
    request.addEventListener('error', () => reject(request.error), { once: true });
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.addEventListener('complete', () => resolve(), { once: true });
    transaction.addEventListener('abort', () => reject(transaction.error), { once: true });
    transaction.addEventListener('error', () => reject(transaction.error), { once: true });
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
