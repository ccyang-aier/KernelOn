import type {
  MineradioJsonExportRequest,
  MineradioJsonFileResult,
  MineradioPlatformAdapter,
} from './contract';

export function createWebMineradioPlatformAdapter(): MineradioPlatformAdapter {
  return {
    files: {
      exportJsonFile,
      importJsonFile,
    },
    kind: 'web',
  };
}

async function exportJsonFile(
  payload: MineradioJsonExportRequest,
): Promise<MineradioJsonFileResult> {
  const text =
    typeof payload.text === 'string'
      ? payload.text
      : JSON.stringify(payload.data ?? {}, null, 2);
  const fileName = normalizeMineradioExportFileName(payload.defaultName);
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }));
  const anchor = document.createElement('a');

  anchor.download = fileName;
  anchor.href = url;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);

  return { ok: true, filePath: fileName };
}

export function normalizeMineradioExportFileName(defaultName?: string): string {
  const sourceName = String(defaultName || 'mineradio-export.json').replace(
    /[\\/:*?"<>|]+/g,
    '-',
  );
  return sourceName.toLowerCase().endsWith('.json')
    ? sourceName
    : `${sourceName}.json`;
}

async function importJsonFile(): Promise<MineradioJsonFileResult> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    let settled = false;

    const finish = (result: MineradioJsonFileResult) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('focus', detectCancellation);
      resolve(result);
    };
    const detectCancellation = () => {
      window.setTimeout(() => {
        if (!input.files?.length) finish({ ok: false, canceled: true });
      }, 0);
    };

    input.accept = 'application/json,.json';
    input.type = 'file';
    input.addEventListener(
      'change',
      () => {
        const file = input.files?.[0];
        if (!file) {
          finish({ ok: false, canceled: true });
          return;
        }
        void file
          .text()
          .then((text) => finish({ ok: true, filePath: file.name, text }))
          .catch((error: unknown) =>
            finish({
              ok: false,
              error: error instanceof Error ? error.message : 'IMPORT_FAILED',
            }),
          );
      },
      { once: true },
    );
    window.addEventListener('focus', detectCancellation, { once: true });
    input.click();
  });
}
