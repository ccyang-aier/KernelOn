import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import test from 'node:test';

const execFileAsync = promisify(execFile);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDir, '..', '..');
const manifestPath = path.join(
  workspaceRoot,
  'packages',
  'modules',
  'src',
  'apps',
  'music',
  'mineradio',
  'provenance',
  'upstream-manifest.json',
);
const migrationLedgerPath = path.join(
  workspaceRoot,
  'packages',
  'modules',
  'src',
  'apps',
  'music',
  'mineradio',
  'provenance',
  'migration-ledger.json',
);
const generatedRoot = path.join(
  workspaceRoot,
  'packages',
  'modules',
  'src',
  'apps',
  'music',
  'mineradio',
  'generated',
);
const canonicalSourceRoot = path.join(
  workspaceRoot,
  'packages',
  'modules',
  'src',
  'apps',
  'music',
  'mineradio',
  'source',
);
const musicAppRoot = path.join(
  workspaceRoot,
  'packages',
  'modules',
  'src',
  'apps',
  'music',
);
const routeLedgerPath = path.join(
  workspaceRoot,
  'apps',
  'api',
  'src',
  'kernelon_api',
  'modules',
  'music',
  'application',
  'route_contract.py',
);
const controllerPath = path.join(
  workspaceRoot,
  'apps',
  'api',
  'src',
  'kernelon_api',
  'modules',
  'music',
  'presentation',
  'controllers.py',
);

test('Mineradio generated assets are deterministic and current', async () => {
  const { stdout } = await execFileAsync(
    process.execPath,
    [path.join(scriptDir, 'sync-source.mjs'), '--check'],
    { cwd: workspaceRoot },
  );

  assert.match(
    stdout,
    /Mineradio generated output verified: 1093 functions, 323 DOM ids, 47 API routes\./,
  );
});

test('Mineradio build and verification use only the KernelOn-owned source snapshot', async () => {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const migrationLedger = JSON.parse(await readFile(migrationLedgerPath, 'utf8'));

  assert.deepEqual(manifest.ownership, {
    canonicalSourceRoot: 'packages/modules/src/apps/music/mineradio/source',
    externalSourceRequired: false,
    lockedSourceFileCount: 18,
    snapshotFileCount: 19,
  });
  assert.equal(
    (await collectFiles(canonicalSourceRoot)).length,
    manifest.ownership.snapshotFileCount,
  );

  await Promise.all(
    Object.keys(manifest.lockedHashes).map((relativePath) =>
      access(path.join(canonicalSourceRoot, relativePath)),
    ),
  );

  const independentFiles = [
    path.join(scriptDir, 'sync-source.mjs'),
    path.join(workspaceRoot, 'package.json'),
    path.join(workspaceRoot, 'packages', 'modules', 'package.json'),
    path.join(workspaceRoot, 'packages', 'modules', 'tests', 'music-dj-parity.test.ts'),
    path.join(workspaceRoot, 'packages', 'modules', 'src', 'apps', 'music', 'MineradioApp.tsx'),
    path.join(generatedRoot, 'runtime.ts'),
    path.join(generatedRoot, 'styles.ts'),
    path.join(generatedRoot, 'template.ts'),
    path.join(generatedRoot, 'dj-analyzer.ts'),
  ];
  const contents = await Promise.all(independentFiles.map((file) => readFile(file, 'utf8')));

  const externalSourceMarker = `${['open', 'source'].join('_')}/Mineradio`;
  const externalWindowsMarker = externalSourceMarker.replace('/', '\\');
  assert.ok(contents.every((content) => !content.includes(externalSourceMarker)));
  assert.ok(contents.every((content) => !content.includes(externalWindowsMarker)));

  assert.equal(migrationLedger.canonicalSourceRoot, manifest.ownership.canonicalSourceRoot);
  assert.equal(migrationLedger.schemaVersion, 2);
  assert.deepEqual(
    migrationLedger.entries.map((entry) => entry.sourcePath).sort(),
    Object.keys(manifest.lockedHashes).sort(),
  );
  assert.ok(
    migrationLedger.entries.every(
      (entry) =>
        entry.status === 'ported' &&
        entry.adaptationKind &&
        entry.classification &&
        entry.targets.length > 0,
    ),
  );
  await Promise.all(
    migrationLedger.entries.flatMap((entry) =>
      entry.targets.map((target) => assertLedgerTargetExists(target)),
    ),
  );
  const classifiedSourcePaths = [
    ...migrationLedger.entries.map((entry) => entry.sourcePath),
    ...migrationLedger.excludedEntries.map((entry) => entry.sourcePath),
  ];
  assert.equal(classifiedSourcePaths.length, migrationLedger.upstreamFileCount);
  assert.equal(new Set(classifiedSourcePaths).size, migrationLedger.upstreamFileCount);
  assert.ok(
    migrationLedger.excludedEntries.every(
      (entry) => entry.sourcePath && typeof entry.reason === 'string' && entry.reason.length > 0,
    ),
  );
});

test('Mineradio route ledger truthfully classifies all 47 source routes', async () => {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const ledgerSource = await readFile(routeLedgerPath, 'utf8');
  const controllerSource = await readFile(controllerPath, 'utf8');
  const transportSource = await readFile(path.join(musicAppRoot, 'host', 'transport.ts'), 'utf8');
  const djHostSource = await readFile(path.join(musicAppRoot, 'host', 'dj-analyzer.ts'), 'utf8');
  const djWorkerSource = await readFile(
    path.join(musicAppRoot, 'mineradio', 'runtime', 'dj-analyzer.worker.ts'),
    'utf8',
  );
  const ledger = parseRouteLedger(ledgerSource);

  assert.equal(ledger.length, 47);
  assert.deepEqual(
    sorted(ledger.map((entry) => entry.route)),
    sorted(manifest.contracts.api.server.map((entry) => entry.route)),
  );
  assert.deepEqual(
    sorted(ledger.filter((entry) => entry.consumed).map((entry) => entry.route)),
    sorted(manifest.contracts.api.frontend.map((entry) => entry.route)),
  );

  const classification = Object.fromEntries(
    ['available', 'host', 'worker', 'missing'].map((status) => [
      status,
      sorted(ledger.filter((entry) => entry.status === status).map((entry) => entry.route)),
    ]),
  );
  assert.deepEqual(classification, expectedRouteClassification);

  const controllerRoutes = sorted(
    extractUnique(controllerSource, /@(?:get|post|put|patch|delete)\("([^"]+)"/g).map(
      (route) => `/api${route}`,
    ),
  );
  const ledgerServiceRoutes = sorted(
    ledger
      .filter(
        (entry) =>
          (entry.kind === 'api' && entry.status === 'available') || entry.serviceFallback,
      )
      .map((entry) => entry.route),
  );
  assert.deepEqual(controllerRoutes, ledgerServiceRoutes);

  const hostManagedDisabledRoutes = extractSetRoutes(transportSource, 'updateRoutes');
  const deviceAdaptedRoutes = extractUnique(
    transportSource,
    /originalUrl\.pathname === ['"]([^'"]+)['"]/g,
  ).filter((route) => route !== '/api/podcast/dj-beatmap');
  assert.deepEqual(
    sorted([...hostManagedDisabledRoutes, ...deviceAdaptedRoutes]),
    classification.host,
  );
  assert.deepEqual(
    sorted(hostManagedDisabledRoutes),
    expectedHostRouteClassification.hostManagedDisabled,
  );
  assert.deepEqual(sorted(deviceAdaptedRoutes), expectedHostRouteClassification.deviceAdapted);
  assert.match(transportSource, /configured: false/);
  assert.match(transportSource, /reason: 'KERNELON_HOST_MANAGED'/);
  assert.match(transportSource, /originalUrl\.pathname === '\/api\/podcast\/dj-beatmap'/);
  assert.match(djHostSource, /new Worker\s*\(/);
  assert.match(djWorkerSource, /analyzePodcastDjStream/);
  assert.match(djWorkerSource, /analyzePodcastDjIntro/);
  assert.deepEqual(classification.worker, ['/api/podcast/dj-beatmap']);
});

test('Mineradio source contract freezes all high-risk inventory counts', async () => {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const contract = manifest.contracts;

  assert.equal(manifest.schemaVersion, 3);
  assert.equal(contract.api.frontend.length, 45);
  assert.equal(contract.api.server.length, 47);
  assert.deepEqual(contract.api.serverOnlyRoutes, ['/api/app/version', '/api/podcast/detail']);
  assert.deepEqual(
    contract.api.frontend
      .filter((endpoint) => endpoint.methods.includes('POST'))
      .map((endpoint) => endpoint.route),
    [
      '/api/beatmap/cache',
      '/api/login/cookie',
      '/api/playlist/add-song',
      '/api/qq/login/cookie',
      '/api/update/download',
      '/api/update/patch',
    ],
  );
  assert.deepEqual(
    contract.api.server
      .filter((endpoint) => endpoint.methodPolicy === 'allowlist')
      .map(({ methodPolicy, methods, route }) => ({ methodPolicy, methods, route })),
    [
      {
        methodPolicy: 'allowlist',
        methods: ['GET', 'POST'],
        route: '/api/beatmap/cache',
      },
    ],
  );
  assert.deepEqual(
    contract.api.frontend
      .filter((endpoint) => endpoint.writeViaGet)
      .map((endpoint) => endpoint.route),
    ['/api/logout', '/api/playlist/create', '/api/qq/logout', '/api/song/like'],
  );
  assert.ok(contract.api.frontend.every((endpoint) => endpoint.request.invocations.length > 0));
  assert.ok(contract.api.server.every((endpoint) => endpoint.request));
  const weatherRequest = contract.api.server.find(
    (endpoint) => endpoint.route === '/api/weather/radio',
  ).request;
  assert.deepEqual(weatherRequest.query.parameters, ['city', 'lat', 'lon', 'q', 'timezone']);
  assert.deepEqual(weatherRequest.query.aliasGroups[0], {
    aliases: ['city', 'q'],
    field: 'city',
  });
  const beatCacheRequest = contract.api.server.find(
    (endpoint) => endpoint.route === '/api/beatmap/cache',
  ).request;
  assert.equal(beatCacheRequest.body.readsRequestBody, true);
  assert.deepEqual(beatCacheRequest.body.fields, [
    'artist',
    'key',
    'map',
    'mode',
    'provider',
    'title',
  ]);

  assert.deepEqual(contract.functions, {
    declarationCount: 1101,
    duplicateDeclarations: {
      applyUserFxArchive: 2,
      cancelUserFxArchiveRename: 2,
      commitUserFxArchiveRename: 2,
      defaultUserFxArchiveName: 2,
      normalizeUserFxArchiveName: 2,
      renameUserFxArchive: 2,
      renderUserFxArchives: 2,
      saveUserFxArchive: 2,
    },
    uniqueCount: 1093,
  });
  assert.deepEqual(contract.schedulers, {
    requestAnimationFrame: 44,
    requestIdleCallback: 6,
    setInterval: 7,
    setTimeout: 88,
  });
  assert.deepEqual(contract.workers, {
    constructorCount: 1,
    objectUrlCount: 4,
    terminateCount: 3,
  });

  assert.equal(contract.events.addEventListener.total, 155);
  assert.equal(contract.events.addEventListener.literalCount, 152);
  assert.equal(contract.events.addEventListener.dynamicCount, 3);
  assert.equal(contract.events.removeEventListener.total, 2);
  assert.equal(contract.events.inline.total, 205);
  assert.equal(contract.events.propertyAssignmentCount, 37);
  assert.equal(manifest.source.inlineActionNames.length, 89);

  assert.equal(contract.dom.staticIdCount, 323);
  assert.equal(contract.dom.staticClassCount, 231);
  assert.deepEqual(
    {
      classCount: contract.css.classCount,
      fixedPositionCount: contract.css.fixedPositionCount,
      idCount: contract.css.idCount,
      keyframeCount: contract.css.keyframeCount,
      mediaQueryCount: contract.css.mediaQueryCount,
      vhUnitCount: contract.css.vhUnitCount,
      vwUnitCount: contract.css.vwUnitCount,
    },
    {
      classCount: 480,
      fixedPositionCount: 38,
      idCount: 122,
      keyframeCount: 26,
      mediaQueryCount: 38,
      vhUnitCount: 14,
      vwUnitCount: 87,
    },
  );

  assert.equal(contract.storage.localStorageKeys.length, 21);
  assert.ok(contract.storage.localStorageKeys.includes('mineradio-listen-stats-v1'));
  assert.ok(contract.storage.localStorageKeys.includes('mineradio-weather-city'));
  assert.deepEqual(contract.storage.indexedDB, [
    {
      name: 'mineradio-custom-background-v1',
      stores: [{ keyPath: 'id', name: 'media' }],
      version: 1,
    },
  ]);
});

test('Mineradio generated CSS and inline action surface retain fragile upstream symbols', async () => {
  const stylesModule = await readFile(path.join(generatedRoot, 'styles.ts'), 'utf8');
  const styles = JSON.parse(stylesModule.match(/= (.*);\s*$/s)?.[1] ?? 'null');
  const runtime = await readFile(path.join(generatedRoot, 'runtime.ts'), 'utf8');
  const templateModule = await readFile(path.join(generatedRoot, 'template.ts'), 'utf8');
  const template = JSON.parse(templateModule.match(/= (.*);\s*$/s)?.[1] ?? 'null');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

  assert.doesNotMatch(styles, /-\.mineradio-root/);
  assert.match(styles, /#mineradio-control-glass-filter/);
  assert.match(styles, /#mineradio-search-box-glass-filter/);
  assert.match(styles, /#mineradio-search-pill-glass-filter/);
  for (const actionName of manifest.source.inlineActionNames) {
    assert.match(runtime, new RegExp(`"${actionName}": ${actionName},`));
    assert.match(template, new RegExp(`window\\.__kernelonMineradioActions\\.${actionName}`));
  }
  const registration = runtime.match(
    /environment\.registerInlineActions\(\{([\s\S]*?)\n {2}\}\);/,
  )?.[1];
  assert.ok(registration);
  assert.equal([...registration.matchAll(/^\s+"[^"]+":/gm)].length, 89);
});

test('Mineradio generated template and CSS retain the complete high-risk source surface', async () => {
  const indexHtml = await readFile(path.join(canonicalSourceRoot, 'public', 'index.html'), 'utf8');
  const { runtimeSource: sourceRuntime, sourceStyles, sourceTemplate } = extractIndexParts(indexHtml);
  const template = await readGeneratedString(path.join(generatedRoot, 'template.ts'));
  const styles = await readGeneratedString(path.join(generatedRoot, 'styles.ts'));
  const runtime = await readFile(path.join(generatedRoot, 'runtime.ts'), 'utf8');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

  assert.deepEqual(extractHtmlIds(template), extractHtmlIds(sourceTemplate));
  assert.deepEqual(extractHtmlClasses(template), extractHtmlClasses(sourceTemplate));

  const sourceTemplateInline = extractInlineAttributes(sourceTemplate);
  const generatedTemplateInline = extractInlineAttributes(template).map(({ name, value }) => ({
    name,
    value: value
      .replaceAll('window.__mineradioDocument.', 'document.')
      .replaceAll('window.__kernelonMineradioActions.', ''),
  }));
  assert.equal(sourceTemplateInline.length, 147);
  assert.deepEqual(generatedTemplateInline, sourceTemplateInline);

  const sourceInline = extractInlineAttributes(`${sourceTemplate}\n${sourceRuntime}`);
  const generatedInline = extractInlineAttributes(`${template}\n${runtime}`).map(
    ({ name, value }) => ({
      name,
      value: value
        .replaceAll('window.__mineradioDocument.', 'document.')
        .replaceAll('window.__kernelonMineradioActions.', ''),
    }),
  );
  assert.equal(sourceInline.length, 205);
  assert.deepEqual(generatedInline, sourceInline);

  const handlerCalls = sorted(
    extractUnique(
      sourceTemplateInline.map((attribute) => attribute.value).join('\n'),
      /(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(/g,
    ).filter((name) => !inlineIntrinsicCalls.has(name)),
  );
  assert.deepEqual(handlerCalls, sorted(manifest.source.inlineActionNames));

  const registration = runtime.match(
    /environment\.registerInlineActions\(\{([\s\S]*?)\n {2}\}\);/,
  )?.[1];
  assert.ok(registration);
  const registeredActions = extractUnique(registration, /^\s+"([^"]+)":/gm);
  assert.deepEqual(registeredActions, sorted(manifest.source.inlineActionNames));

  const adaptedStyles = styles.split('\n').slice(2).join('\n');
  assert.deepEqual(
    extractCssNames(adaptedStyles, /\.(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)/g),
    sorted([
      ...extractCssNames(sourceStyles, /\.(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)/g),
      'mineradio-root',
    ]),
  );
  assert.deepEqual(
    extractCssNames(adaptedStyles, /#(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)/g),
    extractCssNames(sourceStyles, /#(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)/g),
  );
  assert.deepEqual(
    extractCssNames(adaptedStyles, /@(?:-webkit-)?keyframes\s+([\w-]+)/g),
    extractCssNames(sourceStyles, /@(?:-webkit-)?keyframes\s+([\w-]+)/g),
  );
  assert.deepEqual(
    extractCssNames(adaptedStyles, /--([\w-]+)\s*:/g),
    extractCssNames(sourceStyles, /--([\w-]+)\s*:/g),
  );
  assert.deepEqual(
    extractCssNames(adaptedStyles, /url\(#([^)]+)\)/g),
    extractCssNames(sourceStyles, /url\(#([^)]+)\)/g),
  );
  assert.equal(count(sourceStyles, /position\s*:\s*fixed/g), 38);
  assert.equal(count(adaptedStyles, /position\s*:\s*fixed/g), 0);
  assert.equal(count(adaptedStyles, /@container\s+mineradio\b/g), 38);
  assert.equal(count(adaptedStyles, /@media\s/g), 0);
  assert.equal(count(adaptedStyles, /-?\d*\.?\d+vw\b/g), 0);
  assert.equal(count(adaptedStyles, /-?\d*\.?\d+vh\b/g), 0);
});

test('Mineradio runtime build assets are owned, hash-identical and statically reachable', async () => {
  const assetPairs = [
    ['public/assets/skull-decimation-points.bin', 'assets/skull-decimation-points.bin'],
    ['public/default-user-fx-archive.json', 'assets/default-user-fx-archive.json'],
    ['public/vendor/music-tempo.min.js', 'assets/vendor/music-tempo.min.js'],
    ['public/vendor/music-tempo.LICENCE', 'assets/vendor/music-tempo.LICENCE.txt'],
    ['LICENSE', 'LICENSE.txt'],
    ['NOTICE.md', 'NOTICE.md'],
  ];
  const mineradioRoot = path.join(musicAppRoot, 'mineradio');

  for (const [sourceRelativePath, targetRelativePath] of assetPairs) {
    const source = await readFile(path.join(canonicalSourceRoot, sourceRelativePath));
    const target = await readFile(path.join(mineradioRoot, targetRelativePath));
    assert.equal(sha256(target), sha256(source), targetRelativePath);
  }

  const sourcePackage = JSON.parse(await readFile(path.join(canonicalSourceRoot, 'package.json')));
  const modulesPackage = JSON.parse(
    await readFile(path.join(workspaceRoot, 'packages', 'modules', 'package.json')),
  );
  const gsapVendor = await readFile(
    path.join(canonicalSourceRoot, 'public', 'vendor', 'gsap.min.js'),
    'utf8',
  );
  assert.match(gsapVendor, /GSAP 3\.15\.0/);
  assert.equal(modulesPackage.dependencies.gsap, '3.15.0');
  assert.equal(modulesPackage.dependencies.three, '0.128.0');
  assert.equal(modulesPackage.dependencies['mpg123-decoder'], '1.0.3');
  assert.equal(sourcePackage.dependencies.gsap, '^3.15.0');
  assert.equal(sourcePackage.dependencies['mpg123-decoder'], '^1.0.3');

  const environmentSource = await readFile(
    path.join(mineradioRoot, 'runtime', 'scoped-browser-environment.ts'),
    'utf8',
  );
  const runtimeSource = await readFile(path.join(generatedRoot, 'runtime.ts'), 'utf8');
  const djWorkerSource = await readFile(
    path.join(mineradioRoot, 'runtime', 'dj-analyzer.worker.ts'),
    'utf8',
  );
  assert.match(environmentSource, /new URL\('\.\.\/assets\/vendor\/music-tempo\.min\.js'/);
  assert.match(environmentSource, /new URL\('\.\.\/assets\/skull-decimation-points\.bin'/);
  assert.match(runtimeSource, /environment\.assets\.musicTempoUrl/);
  assert.match(runtimeSource, /environment\.assets\.skullPointsUrl/);
  assert.match(djWorkerSource, /from '\.\.\/generated\/dj-analyzer'/);

  const forbiddenPosix = `${['open', 'source'].join('_')}/Mineradio`;
  const forbiddenWindows = forbiddenPosix.replace('/', '\\');
  const scannedFiles = [
    ...(await collectTextFiles(scriptDir)),
    ...(await collectTextFiles(musicAppRoot, canonicalSourceRoot)),
    ...(await collectTextFiles(path.join(workspaceRoot, 'packages', 'modules', 'tests'))),
    path.join(workspaceRoot, 'package.json'),
    path.join(workspaceRoot, 'packages', 'modules', 'package.json'),
  ];
  const violations = [];
  for (const file of scannedFiles) {
    const content = await readFile(file, 'utf8');
    if (content.includes(forbiddenPosix) || content.includes(forbiddenWindows)) {
      violations.push(path.relative(workspaceRoot, file));
    }
  }
  assert.deepEqual(violations, []);
});

const expectedRouteClassification = {
  available: [
    '/api/app/version',
    '/api/artist/detail',
    '/api/audio',
    '/api/cover',
    '/api/discover/home',
    '/api/login/cookie',
    '/api/login/qr/check',
    '/api/login/qr/create',
    '/api/login/qr/key',
    '/api/login/status',
    '/api/logout',
    '/api/lyric',
    '/api/playlist/add-song',
    '/api/playlist/create',
    '/api/playlist/tracks',
    '/api/podcast/detail',
    '/api/podcast/hot',
    '/api/podcast/my',
    '/api/podcast/my/items',
    '/api/podcast/programs',
    '/api/podcast/search',
    '/api/qq/artist/detail',
    '/api/qq/login/cookie',
    '/api/qq/login/status',
    '/api/qq/logout',
    '/api/qq/lyric',
    '/api/qq/playlist/tracks',
    '/api/qq/search',
    '/api/qq/song/comments',
    '/api/qq/song/url',
    '/api/qq/user/playlists',
    '/api/search',
    '/api/song/comments',
    '/api/song/like',
    '/api/song/like/check',
    '/api/song/url',
    '/api/user/playlists',
    '/api/weather/ip-location',
    '/api/weather/radio',
  ],
  host: [
    '/api/beatmap/cache',
    '/api/beatmap/cache/status',
    '/api/update/download',
    '/api/update/download/status',
    '/api/update/latest',
    '/api/update/patch',
    '/api/update/patch/status',
  ],
  worker: ['/api/podcast/dj-beatmap'],
  missing: [],
};

const expectedHostRouteClassification = {
  deviceAdapted: ['/api/beatmap/cache', '/api/beatmap/cache/status'],
  hostManagedDisabled: [
    '/api/update/download',
    '/api/update/download/status',
    '/api/update/latest',
    '/api/update/patch',
    '/api/update/patch/status',
  ],
};

const inlineIntrinsicCalls = new Set(['confirm']);

function parseRouteLedger(source) {
  return [...source.matchAll(/^\s+_(api|host|worker)\("([^"]+)"(.*)\),\s*$/gm)].map(
    (match) => {
      const kind = match[1];
      const options = match[3];
      return {
        consumed: !options.includes('consumed=False'),
        kind,
        route: match[2],
        serviceFallback: kind === 'host' && options.includes('service_fallback=True'),
        status:
          kind === 'host'
            ? 'host'
            : kind === 'worker'
              ? 'worker'
              : options.includes('available=True')
                ? 'available'
                : 'missing',
      };
    },
  );
}

function extractSetRoutes(source, name) {
  const block = source.match(new RegExp(`const ${name} = new Set\\(\\[([\\s\\S]*?)\\]\\);`))?.[1];
  assert.ok(block, `Missing ${name}`);
  return extractUnique(block, /['"](\/api\/[^'"]+)['"]/g);
}

function extractIndexParts(indexHtml) {
  const styleMatch = indexHtml.match(/<style>([\s\S]*?)<\/style>/);
  const bodyMatch = indexHtml.match(/<body>([\s\S]*)<\/body>\s*<\/html>\s*$/);
  assert.ok(styleMatch);
  assert.ok(bodyMatch);
  const runtimeStart = bodyMatch[1].lastIndexOf('<script>');
  const runtimeEnd = bodyMatch[1].lastIndexOf('</script>');
  assert.notEqual(runtimeStart, -1);
  assert.ok(runtimeEnd > runtimeStart);
  return {
    runtimeSource: bodyMatch[1]
      .slice(runtimeStart + '<script>'.length, runtimeEnd)
      .replace(/^\s*'use strict';\s*/, '')
      .trim(),
    sourceStyles: styleMatch[1].trim(),
    sourceTemplate: bodyMatch[1].slice(0, runtimeStart).trim(),
  };
}

function extractHtmlIds(source) {
  return [...source.matchAll(/\sid\s*=\s*(["'])(.*?)\1/g)].map((match) => match[2]);
}

function extractHtmlClasses(source) {
  return [...source.matchAll(/\sclass\s*=\s*(["'])(.*?)\1/g)].flatMap((match) =>
    match[2].split(/\s+/).filter(Boolean),
  );
}

function extractInlineAttributes(source) {
  return [...source.matchAll(/\s(on[a-z]+)\s*=\s*(["'])(.*?)\2/g)].map((match) => ({
    name: match[1],
    value: match[3],
  }));
}

function extractCssNames(source, pattern) {
  return sorted(extractUnique(source, pattern));
}

function extractUnique(source, pattern) {
  return [...new Set([...source.matchAll(pattern)].map((match) => match[1]))];
}

function sorted(values) {
  return [...values].sort();
}

function count(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

async function assertLedgerTargetExists(target) {
  const [relativePath, propertyPath] = target.split('#', 2);
  const absolutePath = path.join(workspaceRoot, relativePath);
  await access(absolutePath);
  if (!propertyPath) return;

  let value = JSON.parse(await readFile(absolutePath, 'utf8'));
  for (const segment of propertyPath.split('.').filter(Boolean)) {
    assert.ok(value && Object.hasOwn(value, segment), `${target} is not a real package mapping`);
    value = value[segment];
  }
  assert.notEqual(value, undefined, target);
}

async function readGeneratedString(file) {
  const moduleSource = await readFile(file, 'utf8');
  return JSON.parse(moduleSource.match(/= (.*);\s*$/s)?.[1] ?? 'null');
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function collectTextFiles(root, excludedRoot) {
  const files = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const file = path.join(root, entry.name);
    if (excludedRoot && (file === excludedRoot || file.startsWith(`${excludedRoot}${path.sep}`))) {
      continue;
    }
    if (entry.isDirectory()) files.push(...(await collectTextFiles(file, excludedRoot)));
    else if (/\.(?:cjs|js|json|mjs|ts|tsx)$/.test(entry.name)) files.push(file);
  }
  return files;
}

async function collectFiles(root) {
  const files = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(file)));
    else files.push(file);
  }
  return files;
}
