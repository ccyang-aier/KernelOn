import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDir, '..', '..');
const canonicalTargetRoot = path.join(
  workspaceRoot,
  'packages',
  'modules',
  'src',
  'apps',
  'music',
  'mineradio',
);
const sourceRoot = path.join(canonicalTargetRoot, 'source');
const checkMode = process.argv.includes('--check');
const targetRoot = checkMode
  ? await mkdtemp(path.join(os.tmpdir(), 'kernelon-mineradio-sync-'))
  : canonicalTargetRoot;
const generatedRoot = path.join(targetRoot, 'generated');
const provenanceRoot = path.join(targetRoot, 'provenance');
const assetsRoot = path.join(targetRoot, 'assets');

const upstreamCommit = '6b130103f759e5dcd1e133700071c8216b8fa5a6';
const lockedHashes = {
  LICENSE: '89DD03B341893D414795152E405341AD5922CF2569446D5E55432B1B8CF53FDF',
  'NOTICE.md': '24756354CA3B320F0FC3EAF3C78CD4B78C088F2F36D30636E782F00B2E55B1F0',
  'desktop/main.js': '0E14F4481570915FDD38E50586F862F6F26A7C0D5FD502AB374BC7878999D0F6',
  'desktop/overlay-preload.js': '8EEEE0502E899D030F6DB4FBC5AFD11DB5FD42084F3DE06C23E7DF7840F21EF5',
  'desktop/preload.js': '2D7DF39C9C8E35C054588DD2EC10C686955F5B992A357AF4708B55EBAE31BF48',
  'dj-analyzer.js': 'EC24B31E50E509E3D884EE335D67800C8DB3E56C1A7EAA4AAA213B04756A4B4F',
  'public/assets/skull-decimation-points.bin':
    '4DFC716A5B8D51C250E39FD9E26D975DEB0E1492E18F225691E3D516F822D8F0',
  'public/default-user-fx-archive.json':
    'A491E190D55E9954665760C581A6027BF0AEEEFB0B4574A02348DCD1284D844F',
  'public/desktop-lyrics.html': '0206DD540274D8DE1D207C56756ED4881F009AECDBF554FE9197D1D46EA663EF',
  'public/index.html': '78C6C7A760AC14326AF924A367A97DA94771A30E8072836F62B0745DAEABDFE2',
  'public/vendor/gsap.min.js': '92BB9A96476F983D212A2BC4F54C889039C1696DD4461D40A736860938570FBB',
  'public/vendor/music-tempo.LICENCE':
    '12B4E069F64AE9A2660C1F5FE788E548487EC8385960BDA0A0BFE177C95348CF',
  'public/vendor/music-tempo.min.js':
    '2927859A8E81E8874A95DC7AF3A2A06FEDD306826F774B7378E26AD5FA9CBD76',
  'public/vendor/three.r128.min.js':
    '9274BBCEC8D96168626C732B5D31C775AA8CFB7EAA0599BEC0C175908A2C1CE2',
  'public/wallpaper.html': '52C03155C9BE8FF93F2CFE1B6281A2078C671B182E3972CAF1D82364A20B7E97',
  'package.json': '6C8D565A99A488018EA6D36529E7B5F022C70974A21FC9B28758C3D2A1C0EA9A',
  'package-lock.json': 'F62706206E252F20D258F18730F84E021D04098E61069C20F02EBE38CFA9D00C',
  'server.js': '653D444A0BFDCEBCCFB7925BD28BCCCA71DBF0AA3512A28D1598598F1EE5650D',
};

await verifyLockedSources();

const indexHtml = await readText('public/index.html');
const styleMatch = indexHtml.match(/<style>([\s\S]*?)<\/style>/);
const bodyMatch = indexHtml.match(/<body>([\s\S]*)<\/body>\s*<\/html>\s*$/);

if (!styleMatch || !bodyMatch) {
  throw new Error('Unable to extract Mineradio style/body blocks');
}

const body = bodyMatch[1];
const runtimeStart = body.lastIndexOf('<script>');
const runtimeEnd = body.lastIndexOf('</script>');

if (runtimeStart < 0 || runtimeEnd <= runtimeStart) {
  throw new Error('Unable to extract Mineradio runtime script');
}

const sourceTemplate = body.slice(0, runtimeStart).trim();
const runtimeSource = body
  .slice(runtimeStart + '<script>'.length, runtimeEnd)
  .replace(/^\s*'use strict';\s*/, '')
  .trim();
const sourceStyles = styleMatch[1].trim();
const styles = adaptStylesForAppSurface(sourceStyles);
const functionDeclarations = extractTopLevelFunctionNames(runtimeSource);
const duplicateFunctionDeclarations = duplicates(functionDeclarations);
const uniqueFunctionNames = [...new Set(functionDeclarations)].sort();
const inlineActionNames = extractInlineActionNames(sourceTemplate, uniqueFunctionNames);
const template = adaptTemplateForAppSurface(sourceTemplate, inlineActionNames);
const serverSource = await readText('server.js');
const djAnalyzerSource = await readText('dj-analyzer.js');
const sourceContract = buildSourceContract({
  runtimeSource,
  serverSource,
  sourceStyles,
  sourceTemplate,
});

assertSourceContract(sourceContract);

await mkdir(generatedRoot, { recursive: true });
await mkdir(provenanceRoot, { recursive: true });
await mkdir(path.join(assetsRoot, 'vendor'), { recursive: true });

await writeText(
  path.join(generatedRoot, 'template.ts'),
  generatedStringModule('mineradioTemplate', template, 'public/index.html body markup'),
);
await writeText(
  path.join(generatedRoot, 'styles.ts'),
  generatedStringModule('mineradioStyles', styles, 'public/index.html style block'),
);
await writeText(
  path.join(generatedRoot, 'runtime.ts'),
  generateRuntimeModule(runtimeSource, inlineActionNames),
);
await writeText(
  path.join(generatedRoot, 'dj-analyzer.ts'),
  generateDjAnalyzerModule(djAnalyzerSource),
);

await copyLockedFile(
  'public/assets/skull-decimation-points.bin',
  'assets/skull-decimation-points.bin',
);
await copyLockedFile('public/default-user-fx-archive.json', 'assets/default-user-fx-archive.json');
await copyLockedFile('public/vendor/music-tempo.min.js', 'assets/vendor/music-tempo.min.js');
await copyLockedFile('public/vendor/music-tempo.LICENCE', 'assets/vendor/music-tempo.LICENCE.txt');
await copyLockedFile('LICENSE', 'LICENSE.txt');
await copyLockedFile('NOTICE.md', 'NOTICE.md');

const snapshotFileCount = (await listFiles(sourceRoot)).length;
const manifest = {
  schemaVersion: 3,
  upstreamCommit,
  lockedHashes,
  ownership: {
    canonicalSourceRoot: 'packages/modules/src/apps/music/mineradio/source',
    externalSourceRequired: false,
    lockedSourceFileCount: Object.keys(lockedHashes).length,
    snapshotFileCount,
  },
  contracts: sourceContract,
  source: {
    indexBytes: Buffer.byteLength(indexHtml),
    template: sourcePartManifest(sourceTemplate, template),
    styles: sourcePartManifest(sourceStyles, styles),
    runtime: sourcePartManifest(
      runtimeSource,
      adaptRuntimeSourceForKernelOn(runtimeSource),
    ),
    djAnalyzer: sourcePartManifest(djAnalyzerSource, adaptDjAnalyzerForModule(djAnalyzerSource)),
    functionDeclarationCount: functionDeclarations.length,
    uniqueFunctionCount: uniqueFunctionNames.length,
    duplicateFunctionDeclarations,
    apiRoutes: sourceContract.api.server.map((endpoint) => endpoint.route),
    desktopWindowMembers: extractDesktopWindowMembers(await readText('desktop/preload.js')),
    domIds: extractUniqueMatches(template, /\sid="([^"]+)"/g),
    inlineEventCount: [...indexHtml.matchAll(/\son[a-z]+=/g)].length,
    inlineActionNames,
    localStorageKeys: extractStorageKeys(runtimeSource),
    indexedDB: extractIndexedDbContract(runtimeSource),
  },
  adaptationLedger: buildAdaptationLedger({ runtimeSource, sourceStyles, sourceTemplate }),
};

await writeText(
  path.join(provenanceRoot, 'upstream-manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

if (checkMode) {
  try {
    await verifyGeneratedOutput(targetRoot, canonicalTargetRoot);
    process.stdout.write(
      `Mineradio generated output verified: ${uniqueFunctionNames.length} functions, ${manifest.source.domIds.length} DOM ids, ${manifest.source.apiRoutes.length} API routes.\n`,
    );
  } finally {
    await rm(targetRoot, { force: true, recursive: true });
  }
} else {
  process.stdout.write(
    `Mineradio synced: ${uniqueFunctionNames.length} functions, ${manifest.source.domIds.length} DOM ids, ${manifest.source.apiRoutes.length} API routes.\n`,
  );
}

async function verifyLockedSources() {
  const mismatches = [];

  for (const [relativePath, expected] of Object.entries(lockedHashes)) {
    const actual = sha256(await readFile(path.join(sourceRoot, relativePath)));
    if (actual !== expected) mismatches.push({ actual, expected, relativePath });
  }

  if (mismatches.length) {
    throw new Error(`Mineradio source lock mismatch:\n${JSON.stringify(mismatches, null, 2)}`);
  }
}

function adaptStylesForAppSurface(source) {
  return [
    '@import url("https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Inter:wght@200;300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;700;900&family=UnifrakturCook:wght@700&display=swap");',
    ':host{display:block;width:100%;height:100%;min-width:0;min-height:0;overflow:hidden;container-name:mineradio;container-type:size}',
    source
      .replace(/html:fullscreen\s+body/g, '.mineradio-root:fullscreen')
      .replace(/html\.desktop-shell-root\s+body/g, '.mineradio-root.desktop-shell-root')
      .replace(/html,body/g, '.mineradio-root')
      .replace(/:root/g, '.mineradio-root')
      .replace(/(?<![-\w])html(?![-\w])/g, '.mineradio-root')
      .replace(/(?<![-\w])body(?![-\w])/g, '.mineradio-root')
      .replace(/\.mineradio-root,\.mineradio-root/g, '.mineradio-root')
      .replace(/position\s*:\s*fixed/g, 'position:absolute')
      .replace(/(-?\d*\.?\d+)vw\b/g, '$1cqw')
      .replace(/(-?\d*\.?\d+)vh\b/g, '$1cqh')
      .replace(/@media\s*([^{]+){/g, (_match, query) => {
        const normalized = String(query)
          .trim()
          .replace(/\)\s*,\s*\(/g, ') or (');
        return `@container mineradio ${normalized}{`;
      }),
  ].join('\n');
}

function adaptTemplateForAppSurface(source, inlineActionNames) {
  const scoped = source.replaceAll(
    'document.getElementById(',
    'window.__mineradioDocument.getElementById(',
  );

  return scoped.replace(/\s(on[a-z]+)\s*=\s*(["'])(.*?)\2/gs, (attribute, name, quote, handler) => {
    let adaptedHandler = handler;
    for (const actionName of inlineActionNames) {
      adaptedHandler = adaptedHandler.replace(
        new RegExp(`(?<![\\w$.])${escapeRegExp(actionName)}(?=\\s*\\()`, 'g'),
        `window.__kernelonMineradioActions.${actionName}`,
      );
    }
    return ` ${name}=${quote}${adaptedHandler}${quote}`;
  });
}

function generateRuntimeModule(source, functionNames) {
  const adaptedSource = adaptRuntimeSourceForKernelOn(source)
    .replace(
      "fetch('assets/skull-decimation-points.bin?v=regular-surface-teeth-soften-20260621', { cache: 'reload' })",
      "fetch(environment.assets.skullPointsUrl, { cache: 'reload' })",
    )
    .replace("fetch('/vendor/music-tempo.min.js')", 'fetch(environment.assets.musicTempoUrl)')
    .replace(
      "scriptUrl: location.origin + '/vendor/music-tempo.min.js'",
      'scriptUrl: environment.assets.musicTempoUrl',
    );
  const actionEntries = functionNames
    .map((name) => `    ${JSON.stringify(name)}: ${name},`)
    .join('\n');

  return `// Generated by scripts/mineradio/sync-source.mjs from KernelOn's owned Mineradio source snapshot.\n// Do not hand-edit ported logic; change only the audited source adapter.\n// @ts-nocheck\n\nimport type { MineradioRuntimeEnvironment, MineradioRuntimeInstance } from '../runtime/environment';\n\nexport function mountPortedMineradioRuntime(\n  environment: MineradioRuntimeEnvironment,\n): MineradioRuntimeInstance {\n  var window = environment.window;\n  var document = environment.document;\n  var localStorage = environment.localStorage;\n  var fetch = environment.fetch;\n  var location = environment.location;\n  var navigator = environment.navigator;\n  var indexedDB = environment.indexedDB;\n  var Audio = environment.Audio;\n  var Worker = environment.Worker;\n  var URL = environment.URL;\n  var THREE = environment.THREE;\n  var requestAnimationFrame = environment.requestAnimationFrame;\n  var cancelAnimationFrame = environment.cancelAnimationFrame;\n  var requestIdleCallback = environment.requestIdleCallback;\n  var setTimeout = environment.setTimeout;\n  var clearTimeout = environment.clearTimeout;\n  var setInterval = environment.setInterval;\n  var clearInterval = environment.clearInterval;\n\n${adaptedSource}\n\n  environment.registerInlineActions({\n${actionEntries}\n  });\n\n  return environment.finalize(function destroyPortedMineradioRuntime() {\n    try { if (typeof stopHeadTracking === 'function') stopHeadTracking(); } catch (_) {}\n    try { if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); } } catch (_) {}\n    try { if (audioCtx && audioCtx.state !== 'closed') audioCtx.close(); } catch (_) {}\n    try { if (renderer && typeof renderer.dispose === 'function') renderer.dispose(); } catch (_) {}\n    try { if (musicTempoWorkerUrl) URL.revokeObjectURL(musicTempoWorkerUrl); } catch (_) {}\n  });\n}\n`;
}

function adaptRuntimeSourceForKernelOn(source) {
  return adaptLifecycleAbortHandlingForKernelOn(
    adaptGestureLifecycleForKernelOn(
      adaptWebLoginFallbacksForKernelOn(adaptRuntimeForAppSurface(source)),
    ),
  );
}

function adaptWebLoginFallbacksForKernelOn(source) {
  const adapted = source.replace(
    /(async function openQQWebLogin\(\) \{[\s\S]*?var api = window\.desktopWindow;)\n {2}if \(!api \|\| !api\.isDesktop \|\| typeof api\.openQQMusicLogin !== 'function'\) \{[\s\S]*?\n {4}return;\n {2}\}/,
    `$1
  if (!api || !api.isDesktop || typeof api.openQQMusicLogin !== 'function') {
    qqManualCookieOpen = true;
    updateLoginProviderUi();
    try { window.open('https://y.qq.com/', '_blank', 'noopener,noreferrer'); } catch (_) {}
    if (statusEl) {
      statusEl.textContent = '已打开 QQ 音乐官网。网页登录后，请将 y.qq.com 的 Cookie 粘贴到下方完成导入。';
      statusEl.className = 'preview';
    }
    var cookieInput = window.__mineradioDocument.getElementById('qq-cookie-input');
    if (cookieInput) window.setTimeout(function(){ cookieInput.focus(); }, 0);
    return;
  }`,
  );
  if (adapted === source) {
    throw new Error('Unable to adapt Mineradio QQ Web login fallback');
  }
  return adapted;
}

function adaptLifecycleAbortHandlingForKernelOn(source) {
  let guardCount = 0;
  const withBlockCatchGuards = source.replace(
    /(\s)catch\s*\(\s*([A-Za-z_$][\w$]*)\s*\)\s*\{/g,
    (match, leadingWhitespace, errorName) => {
      guardCount += 1;
      return `${leadingWhitespace}${match.slice(leadingWhitespace.length)}\n    if (environment.isLifecycleAbort(${errorName})) return;`;
    },
  );
  const withAllCatchGuards = withBlockCatchGuards.replace(
    /\.catch\(function\(\s*([A-Za-z_$][\w$]*)?\s*\)\s*\{/g,
    (match, errorName) => {
      guardCount += 1;
      const guardedErrorName = errorName || '__mineradioLifecycleError';
      return `.catch(function(${guardedErrorName}) {\n    if (environment.isLifecycleAbort(${guardedErrorName})) return;`;
    },
  );

  if (guardCount === 0) {
    throw new Error('Unable to adapt Mineradio lifecycle abort handling');
  }
  return withAllCatchGuards;
}

function adaptGestureLifecycleForKernelOn(source) {
  const withSharedScriptLoader = source.replace(
    /function loadScriptOnce\(src\) \{[\s\S]*?\n\}/,
    `function loadScriptOnce(src) {
  var expectedGlobal = src.indexOf('/camera_utils/') >= 0 ? 'Camera' : (src.indexOf('/hands/') >= 0 ? 'Hands' : '');
  return environment.loadExternalScript(src, expectedGlobal);
}`,
  );
  if (withSharedScriptLoader === source) {
    throw new Error('Unable to adapt Mineradio external script loader');
  }

  const withStartupGeneration = withSharedScriptLoader.replace(
    /async function startGestureControl\(\) \{[\s\S]*?\n\}\n\nfunction stopGestureControl/,
    `function releaseGestureStartupResources(video, camera, hands) {
  var ownsCurrentGesture = gestureVideo === video && gestureCamera === camera && gestureHands === hands;
  environment.stopGestureCapture(camera, video);
  try {
    var handsCloseResult = hands && hands.close ? hands.close() : null;
    if (handsCloseResult && handsCloseResult.catch) handsCloseResult.catch(function(){});
  } catch (e) {}
  if (gestureVideo === video) gestureVideo = null;
  if (gestureCamera === camera) gestureCamera = null;
  if (gestureHands === hands) gestureHands = null;
  return ownsCurrentGesture;
}

async function startGestureControl() {
  if (gestureActive) return;
  var startupToken = environment.gestureStartup.begin();
  if (!startupToken) return;
  var startupVideo = null, startupCamera = null, startupHands = null;
  showToast('正在加载手势识别…');
  try {
    await loadScriptOnce('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
    if (!environment.gestureStartup.isCurrent(startupToken)) return;
    await loadScriptOnce('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
    if (!environment.gestureStartup.isCurrent(startupToken)) return;
    startupVideo = document.createElement('video');
    gestureVideo = startupVideo;
    startupVideo.playsInline = true; startupVideo.muted = true;
    startupVideo.style.display = 'none';
    document.body.appendChild(startupVideo);
    startupHands = new Hands({ locateFile: function(f){ return 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/' + f; } });
    gestureHands = startupHands;
    // modelComplexity:1 比 0 更稳定, 但仍流畅. 提高 confidence 减少误检
    startupHands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.7, minTrackingConfidence: 0.7 });
    startupHands.onResults(function(res){
      if (!gestureActive || gestureHands !== startupHands) return;
      var lm = res.multiHandLandmarks && res.multiHandLandmarks[0];
      if (!lm) { onHandLost(); return; }
      processHandFrame(lm);
    });
    startupCamera = new Camera(startupVideo, { onFrame: async function(){ if (startupHands) await startupHands.send({ image: startupVideo }); }, width: 480, height: 360 });
    gestureCamera = startupCamera;
    await startupCamera.start();
    if (!environment.gestureStartup.isCurrent(startupToken)) {
      releaseGestureStartupResources(startupVideo, startupCamera, startupHands);
      return;
    }
    gestureActive = true;
    // 准备 hand canvas
    handCanvas = window.__mineradioDocument.getElementById('hand-canvas');
    handCanvasCtx = handCanvas.getContext('2d');
    resizeHandCanvas();
    handCanvas.classList.add('show');
    showToast('手势已开启: 手掌推开 · 捏合旋转 · 握拳收束');
    showGestureHUD('待命', 0, '把手放进视野');
  } catch (e) {
    if (releaseGestureStartupResources(startupVideo, startupCamera, startupHands)) gestureActive = false;
    if (!environment.gestureStartup.isCurrent(startupToken)) return;
    console.warn('Gesture failed:', e);
    showToast('手势启动失败 (需要摄像头权限)');
    fx.cam = 'off';
    document.querySelectorAll('#cam-seg button').forEach(function(b){ b.classList.toggle('active', b.dataset.cam === 'off'); });
  } finally {
    environment.gestureStartup.finish(startupToken);
  }
}

function stopGestureControl`,
  );
  if (withStartupGeneration === withSharedScriptLoader) {
    throw new Error('Unable to adapt Mineradio gesture startup generation');
  }

  const withExhaustiveCaptureCleanup = withStartupGeneration.replace(
    /function stopGestureControl\(\) \{\n {2}if \(!gestureActive\) return;\n {2}try \{ if \(gestureCamera && gestureCamera\.stop\) gestureCamera\.stop\(\); \} catch\(e\)\{\}\n {2}try \{ if \(gestureVideo && gestureVideo\.srcObject\) gestureVideo\.srcObject\.getTracks\(\)\.forEach\(function\(t\)\{ t\.stop\(\); \}\); \} catch\(e\)\{\}\n {2}try \{ if \(gestureVideo\) gestureVideo\.remove\(\); \} catch\(e\)\{\}/,
    `function stopGestureControl() {
  // Stop invalidates pending script/Camera awaits before releasing partial resources.
  environment.gestureStartup.cancel();
  releaseGestureStartupResources(gestureVideo, gestureCamera, gestureHands);`,
  );
  if (withExhaustiveCaptureCleanup === withStartupGeneration) {
    throw new Error('Unable to adapt Mineradio Camera and MediaStream cleanup');
  }

  const cleanupOnRuntimeDestroy = withExhaustiveCaptureCleanup.replace(
    'function stopHeadTracking(){}      // stub',
    `function stopHeadTracking(){
  // The generated runtime destroy hook already invokes this compatibility function.
  stopGestureControl();
}      // KernelOn virtual-App lifecycle adapter`,
  );
  if (cleanupOnRuntimeDestroy === withExhaustiveCaptureCleanup) {
    throw new Error('Unable to connect Mineradio gesture cleanup to runtime destroy');
  }

  return `environment.registerMountAbortCleanup(function rollbackGestureMount() {
  try {
    environment.gestureStartup.cancel();
    releaseGestureStartupResources(gestureVideo, gestureCamera, gestureHands);
  } catch (_) {}
});

${cleanupOnRuntimeDestroy}`;
}

function adaptRuntimeForAppSurface(source) {
  const musicTempoLoaderPattern =
    /function ensureMusicTempo\(\) \{[\s\S]*?\n\}\n\nvar musicTempoWorkerUrl/;
  const withoutDynamicEval = source.replace(
    musicTempoLoaderPattern,
    `function ensureMusicTempo() {
  if (musicTempoLoadPromise) return musicTempoLoadPromise;
  musicTempoLoadPromise = environment.loadMusicTempo();
  return musicTempoLoadPromise;
}

var musicTempoWorkerUrl`,
  );

  if (withoutDynamicEval === source) {
    throw new Error('Unable to adapt Mineradio music-tempo loader without eval');
  }

  const withoutLateHomeRender = withoutDynamicEval.replace(
    'function renderHomeDiscover() {',
    `function renderHomeDiscover() {
  if (environment.isDestroyed()) return;`,
  );
  if (withoutLateHomeRender === withoutDynamicEval) {
    throw new Error('Unable to guard Mineradio home rendering after runtime destroy');
  }

  return withoutLateHomeRender
    .replaceAll('document.getElementById(', 'window.__mineradioDocument.getElementById(')
    .replace(/(?<![\w$.])innerWidth\b/g, 'window.innerWidth')
    .replace(/(?<![\w$.])innerHeight\b/g, 'window.innerHeight');
}

function generatedStringModule(name, value, sourceLabel) {
  return `// Generated by scripts/mineradio/sync-source.mjs from ${sourceLabel}.\n// Do not hand-edit.\nexport const ${name} = ${JSON.stringify(value)};\n`;
}

function generateDjAnalyzerModule(source) {
  return `// Generated by scripts/mineradio/sync-source.mjs from KernelOn's owned Mineradio source snapshot.\n// The analysis algorithm is unchanged; only the CommonJS export is adapted to ESM.\n// @ts-nocheck\n\n${adaptDjAnalyzerForModule(source)}`;
}

function adaptDjAnalyzerForModule(source) {
  const adapted = source.replace(
    /module\.exports = \{\s*analyzePodcastDjStream,\s*analyzePodcastDjIntro,\s*buildBeatMapFromLowEnergy,\s*\};\s*$/,
    'export { analyzePodcastDjStream, analyzePodcastDjIntro, buildBeatMapFromLowEnergy };\n',
  );
  if (adapted === source) throw new Error('Unable to adapt Mineradio DJ analyzer exports');
  return adapted;
}

function extractTopLevelFunctionNames(source) {
  return [...source.matchAll(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/gm)].map(
    (match) => match[1],
  );
}

function extractInlineActionNames(sourceTemplate, functionNames) {
  const functionNameSet = new Set(functionNames);
  const names = new Set();

  for (const match of sourceTemplate.matchAll(/\son[a-z]+\s*=\s*(["'])(.*?)\1/gs)) {
    const handler = match[2];
    for (const call of handler.matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)) {
      if (functionNameSet.has(call[1])) names.add(call[1]);
    }
  }

  if (!names.size) throw new Error('Unable to extract Mineradio inline action names');
  return [...names].sort(compareText);
}

function duplicates(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return Object.fromEntries(
    [...counts].filter(([, count]) => count > 1).sort(([a], [b]) => a.localeCompare(b)),
  );
}

function extractUniqueMatches(source, pattern, captureIndex = 1) {
  return [...new Set([...source.matchAll(pattern)].map((match) => match[captureIndex]))].sort(
    compareText,
  );
}

function buildSourceContract({ runtimeSource, serverSource, sourceStyles, sourceTemplate }) {
  const frontendApi = extractFrontendApiEndpoints(runtimeSource);
  const serverApi = extractServerApiEndpoints(serverSource);

  return {
    api: {
      frontend: frontendApi,
      server: serverApi,
      serverOnlyRoutes: serverApi
        .map((endpoint) => endpoint.route)
        .filter((route) => !frontendApi.some((endpoint) => endpoint.route === route)),
    },
    css: extractCssContract(sourceStyles),
    dom: {
      staticClassCount: extractHtmlClasses(sourceTemplate).length,
      staticClasses: extractHtmlClasses(sourceTemplate),
      staticIdCount: extractHtmlIds(sourceTemplate).length,
      staticIds: extractHtmlIds(sourceTemplate),
    },
    events: extractEventContract(runtimeSource, sourceTemplate),
    functions: {
      declarationCount: extractTopLevelFunctionNames(runtimeSource).length,
      duplicateDeclarations: duplicates(extractTopLevelFunctionNames(runtimeSource)),
      uniqueCount: new Set(extractTopLevelFunctionNames(runtimeSource)).size,
    },
    schedulers: {
      requestAnimationFrame: countMatches(runtimeSource, /(?<![\w.])requestAnimationFrame\s*\(/g),
      requestIdleCallback: countMatches(runtimeSource, /(?<![\w.])requestIdleCallback\s*\(/g),
      setInterval: countMatches(runtimeSource, /(?<![\w.])setInterval\s*\(/g),
      setTimeout: countMatches(runtimeSource, /(?<![\w.])setTimeout\s*\(/g),
    },
    storage: {
      indexedDB: extractIndexedDbContract(runtimeSource),
      localStorageKeys: extractStorageKeys(runtimeSource),
    },
    workers: {
      constructorCount: countMatches(runtimeSource, /new\s+Worker\s*\(/g),
      objectUrlCount: countMatches(runtimeSource, /URL\.createObjectURL\s*\(/g),
      terminateCount: countMatches(runtimeSource, /\.terminate\s*\(/g),
    },
  };
}

function extractFrontendApiEndpoints(source) {
  const routeMatches = [...source.matchAll(/["'`](\/api\/[A-Za-z0-9_\-/]+)/g)];
  const callRecords = extractNamedCallRecords(source, ['apiJson', 'fetch']);
  const writeMethodsByRoute = new Map([
    ['/api/beatmap/cache', ['POST']],
    ['/api/login/cookie', ['POST']],
    ['/api/logout', ['GET']],
    ['/api/playlist/add-song', ['POST']],
    ['/api/playlist/create', ['GET']],
    ['/api/qq/login/cookie', ['POST']],
    ['/api/qq/logout', ['GET']],
    ['/api/song/like', ['GET']],
    ['/api/update/download', ['POST']],
    ['/api/update/patch', ['POST']],
  ]);
  const routes = new Map();

  for (const match of routeMatches) {
    const route = match[1];
    const routeIndex = match.index;
    const containingCall = callRecords.find(
      (record) => routeIndex >= record.start && routeIndex < record.end,
    );
    const expression = sliceRouteExpression(source, match.index);
    const method = containingCall?.source.match(/\bmethod\s*:\s*["']([A-Z]+)["']/)?.[1] ?? 'GET';
    const queryParameters = extractFrontendQueryParameters(source, routeIndex, expression);
    const bodyFields = containingCall ? extractJsonBodyFields(containingCall.source) : [];
    const invocation = {
      bodyFields,
      method,
      queryParameters,
      transport: containingCall?.name ?? 'constructed-url',
    };
    const endpoint = routes.get(route) ?? { invocations: [], methods: new Set(), route };
    const signature = JSON.stringify(invocation);

    endpoint.methods.add(method);
    if (!endpoint.invocations.some((item) => JSON.stringify(item) === signature)) {
      endpoint.invocations.push(invocation);
    }
    routes.set(route, endpoint);
  }

  return [...routes.values()]
    .map((endpoint) => {
      const methods = [...endpoint.methods].sort(compareText);
      const writeMethods = writeMethodsByRoute.get(endpoint.route) ?? [];
      return {
        methods,
        request: {
          bodyFields: uniqueSorted(endpoint.invocations.flatMap((item) => item.bodyFields)),
          invocations: endpoint.invocations.sort(compareInvocation),
          queryParameters: uniqueSorted(
            endpoint.invocations.flatMap((item) => item.queryParameters),
          ),
        },
        route: endpoint.route,
        writeMethods,
        writeViaGet: writeMethods.includes('GET'),
      };
    })
    .sort((a, b) => compareText(a.route, b.route));
}

function extractServerApiEndpoints(source) {
  return [...source.matchAll(/if\s*\(pn === '([^']+)'\)\s*\{/g)]
    .filter((match) => match[1].startsWith('/api/'))
    .map((match) => {
      const blockStart = match.index + match[0].lastIndexOf('{');
      const block = sliceBalancedBlock(source, blockStart);
      const guardedMethods = extractUniqueMatches(block, /req\.method === ['"]([A-Z]+)['"]/g);
      const hasMethodRejection = /METHOD_NOT_ALLOWED|\b405\b/.test(block);

      return {
        methodPolicy: guardedMethods.length && hasMethodRejection ? 'allowlist' : 'unrestricted',
        methods: guardedMethods.length && hasMethodRejection ? guardedMethods : ['*'],
        request: extractServerRequestContract(source, block),
        route: match[1],
      };
    })
    .sort((a, b) => compareText(a.route, b.route));
}

function extractNamedCallRecords(source, names) {
  const calls = [];
  const pattern = new RegExp(`\\b(${names.join('|')})\\s*\\(`, 'g');

  for (const match of source.matchAll(pattern)) {
    const openParen = source.indexOf('(', match.index);
    const call = sliceBalanced(source, openParen, '(', ')');
    if (call) {
      calls.push({
        end: openParen + call.length,
        name: match[1],
        source: source.slice(match.index, openParen) + call,
        start: match.index,
      });
    }
  }

  return calls;
}

function sliceRouteExpression(source, start) {
  let quote = '';
  let escaped = false;
  let parens = 0;
  let brackets = 0;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '(') parens += 1;
    else if (char === ')') {
      if (parens === 0) return source.slice(start, index);
      parens -= 1;
    } else if (char === '[') brackets += 1;
    else if (char === ']') brackets -= 1;
    else if (parens === 0 && brackets === 0 && (char === ',' || char === ';' || char === ':')) {
      return source.slice(start, index);
    }
  }

  return source.slice(start);
}

function extractFrontendQueryParameters(source, routeIndex, expression) {
  const names = new Set(extractQueryLiteralNames(expression));
  const maskedExpression = maskStringContents(expression);
  const identifiers = uniqueSorted([
    ...extractUniqueMatches(maskedExpression, /(?<![.\w$])([A-Za-z_$][\w$]*)\b(?!\s*\.)/g),
    ...extractUniqueMatches(maskedExpression, /(?<![.\w$])([A-Za-z_$][\w$]*)\s*\.join\s*\(/g),
  ]).filter((name) => !['encodeURIComponent'].includes(name));
  const functionBlock = findContainingFunctionBlock(source, routeIndex);

  for (const identifier of identifiers) {
    const escaped = escapeRegExp(identifier);
    const assignments = [
      ...functionBlock.matchAll(new RegExp(`\\b${escaped}\\s*=\\s*([^;]+);`, 'g')),
    ];
    for (const assignment of assignments) {
      for (const name of extractQueryLiteralNames(assignment[1])) names.add(name);
    }
    for (const push of functionBlock.matchAll(
      new RegExp(`\\b${escaped}\\.push\\(\\s*["']([A-Za-z0-9_-]+)=`, 'g'),
    )) {
      names.add(push[1]);
    }
  }

  return [...names].sort(compareText);
}

function findContainingFunctionBlock(source, index) {
  let candidate = '';
  for (const match of source.matchAll(
    /\b(?:async\s+)?function(?:\s+[A-Za-z_$][\w$]*)?\s*\([^)]*\)\s*\{/g,
  )) {
    if (match.index > index) break;
    const openBrace = source.indexOf('{', match.index);
    const block = sliceBalancedBlock(source, openBrace);
    if (block && openBrace + block.length > index) candidate = block;
  }
  return candidate;
}

function extractQueryLiteralNames(source) {
  return extractUniqueMatches(source, /[?&]([A-Za-z0-9_-]+)=/g);
}

function extractJsonBodyFields(callSource) {
  const stringifyIndex = callSource.indexOf('JSON.stringify');
  if (stringifyIndex < 0) return [];
  const openBrace = callSource.indexOf('{', stringifyIndex);
  const objectSource = openBrace >= 0 ? sliceBalancedBlock(callSource, openBrace) : '';
  if (!objectSource) return [];

  const fields = extractUniqueMatches(objectSource, /(?:^|[,{])\s*([A-Za-z_$][\w$]*)\s*:/g);
  const shorthandFields = extractUniqueMatches(
    objectSource,
    /(?:^|[,{])\s*([A-Za-z_$][\w$]*)\s*(?=,|})/g,
  );
  return uniqueSorted([...fields, ...shorthandFields]);
}

function extractServerRequestContract(serverSource, block) {
  const queryAccess = (source) => [
    ...extractUniqueMatches(source, /url\.searchParams\.get\(\s*["']([^"']+)["']\s*\)/g),
    ...extractUniqueMatches(source, /\bq\.([A-Za-z_$][\w$]*)/g),
    ...extractUniqueMatches(source, /\bq\[['"]([^'"]+)['"]\]/g),
  ];
  const bodyAccess = (source) => extractIdentifierProperties(source, 'body');
  const queryParameters = uniqueSorted(queryAccess(block));
  const readsRequestBody = /readRequestBody\s*\(\s*req\s*\)/.test(block);
  const bodyFields = readsRequestBody
    ? collectForwardedBodyFields(serverSource, block, 'body', new Set())
    : [];

  return {
    body: {
      aliasGroups: extractRequestAliasGroups(block, bodyAccess, bodyFields),
      fields: bodyFields,
      readsRequestBody,
    },
    query: {
      aliasGroups: extractRequestAliasGroups(block, queryAccess, queryParameters),
      parameters: queryParameters,
    },
  };
}

function collectForwardedBodyFields(serverSource, snippet, identifier, visited) {
  const visitKey = `${identifier}:${snippet.slice(0, 80)}`;
  if (visited.has(visitKey)) return [];
  visited.add(visitKey);

  const fields = new Set(extractIdentifierProperties(snippet, identifier));
  const callPattern = /\b([A-Za-z_$][\w$]*)\s*\(([^()]*)\)/g;
  for (const call of snippet.matchAll(callPattern)) {
    const args = call[2].split(',').map((arg) => arg.trim());
    const argumentIndex = args.indexOf(identifier);
    if (argumentIndex < 0) continue;

    const declaration = findFunctionDeclaration(serverSource, call[1]);
    if (!declaration || !declaration.parameters[argumentIndex]) continue;
    for (const field of collectForwardedBodyFields(
      serverSource,
      declaration.block,
      declaration.parameters[argumentIndex],
      visited,
    )) {
      fields.add(field);
    }
  }

  return [...fields].sort(compareText);
}

function extractIdentifierProperties(source, identifier) {
  const escaped = escapeRegExp(identifier);
  return uniqueSorted([
    ...extractUniqueMatches(
      source,
      new RegExp(`(?<![.\\w$])${escaped}\\.([A-Za-z_$][\\w$]*)`, 'g'),
    ),
    ...extractUniqueMatches(
      source,
      new RegExp(`(?<![.\\w$])${escaped}\\[['"]([^'"]+)['"]\\]`, 'g'),
    ),
  ]);
}

function findFunctionDeclaration(source, name) {
  const escaped = escapeRegExp(name);
  const match = new RegExp(`\\bfunction\\s+${escaped}\\s*\\(([^)]*)\\)\\s*\\{`).exec(source);
  if (!match) return null;
  const openBrace = source.indexOf('{', match.index);
  return {
    block: sliceBalancedBlock(source, openBrace),
    parameters: match[1]
      .split(',')
      .map((parameter) => parameter.trim())
      .filter(Boolean),
  };
}

function extractRequestAliasGroups(block, extractAccesses, allNames) {
  const groups = [];
  const groupedNames = new Set();

  for (const match of block.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([^;]+);/g)) {
    const objectProperties = extractObjectPropertyExpressions(match[2]);
    if (objectProperties.length) {
      for (const property of objectProperties) {
        const aliases = uniqueSorted(extractAccesses(property.expression));
        if (!aliases.length) continue;
        groups.push({ aliases, field: property.field });
        for (const alias of aliases) groupedNames.add(alias);
      }
      continue;
    }

    const aliases = uniqueSorted(extractAccesses(match[2]));
    if (!aliases.length) continue;
    groups.push({ aliases, field: match[1] });
    for (const alias of aliases) groupedNames.add(alias);
  }
  for (const name of allNames) {
    if (!groupedNames.has(name)) groups.push({ aliases: [name], field: name });
  }

  return groups.sort((a, b) => compareText(a.field, b.field));
}

function extractObjectPropertyExpressions(source) {
  const openBrace = source.indexOf('{');
  const objectSource = openBrace >= 0 ? sliceBalancedBlock(source, openBrace) : '';
  if (!objectSource) return [];

  return splitTopLevel(objectSource.slice(1, -1), ',')
    .map((entry) => {
      const separator = findTopLevelCharacter(entry, ':');
      if (separator < 0) return null;
      const field = entry
        .slice(0, separator)
        .trim()
        .match(/^([A-Za-z_$][\w$]*)$/)?.[1];
      if (!field) return null;
      return { expression: entry.slice(separator + 1), field };
    })
    .filter(Boolean);
}

function splitTopLevel(source, separator) {
  const parts = [];
  let start = 0;
  let quote = '';
  let escaped = false;
  let depth = 0;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'" || char === '`') quote = char;
    else if (char === '(' || char === '[' || char === '{') depth += 1;
    else if (char === ')' || char === ']' || char === '}') depth -= 1;
    else if (char === separator && depth === 0) {
      parts.push(source.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(source.slice(start));
  return parts;
}

function findTopLevelCharacter(source, target) {
  const parts = splitTopLevel(source, target);
  return parts.length > 1 ? parts[0].length : -1;
}

function compareInvocation(a, b) {
  return compareText(JSON.stringify(a), JSON.stringify(b));
}

function uniqueSorted(values) {
  return [...new Set(values)].sort(compareText);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function maskStringContents(source) {
  let result = '';
  let quote = '';
  let escaped = false;
  for (const char of source) {
    if (quote) {
      result += ' ';
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
    } else if (char === '"' || char === "'" || char === '`') {
      quote = char;
      result += ' ';
    } else {
      result += char;
    }
  }
  return result;
}

function sliceBalancedBlock(source, openBrace) {
  return sliceBalanced(source, openBrace, '{', '}');
}

function sliceBalanced(source, start, open, close) {
  let depth = 0;
  let quote = '';
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (char === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '/' && next === '/') {
      lineComment = true;
      index += 1;
      continue;
    }
    if (char === '/' && next === '*') {
      blockComment = true;
      index += 1;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === open) depth += 1;
    if (char === close) {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }

  return '';
}

function extractEventContract(runtimeSource, sourceTemplate) {
  const addTypes = [...runtimeSource.matchAll(/\.addEventListener\s*\(\s*(['"])(.*?)\1/g)].map(
    (match) => match[2],
  );
  const removeTypes = [
    ...runtimeSource.matchAll(/\.removeEventListener\s*\(\s*(['"])(.*?)\1/g),
  ].map((match) => match[2]);
  const inlineTypes = [...`${sourceTemplate}\n${runtimeSource}`.matchAll(/\s(on[a-z]+)=/g)].map(
    (match) => match[1],
  );

  return {
    addEventListener: {
      dynamicCount: countMatches(runtimeSource, /\.addEventListener\s*\(/g) - addTypes.length,
      literalCount: addTypes.length,
      literalTypes: countValues(addTypes),
      total: countMatches(runtimeSource, /\.addEventListener\s*\(/g),
    },
    inline: {
      total: inlineTypes.length,
      types: countValues(inlineTypes),
    },
    propertyAssignmentCount: countMatches(runtimeSource, /\.on[a-z]+\s*=/g),
    removeEventListener: {
      literalCount: removeTypes.length,
      literalTypes: countValues(removeTypes),
      total: countMatches(runtimeSource, /\.removeEventListener\s*\(/g),
    },
  };
}

function extractCssContract(source) {
  const classes = extractUniqueMatches(source, /\.(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)/g);
  const ids = extractUniqueMatches(source, /#(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)/g);
  const keyframes = extractUniqueMatches(source, /@(?:-webkit-)?keyframes\s+([\w-]+)/g);
  const mediaQueries = [...source.matchAll(/@media\s*([^{]+){/g)].map((match) => match[1].trim());

  return {
    classCount: classes.length,
    classes,
    fixedPositionCount: countMatches(source, /position\s*:\s*fixed/g),
    idCount: ids.length,
    ids,
    keyframeCount: keyframes.length,
    keyframes,
    mediaQueryCount: mediaQueries.length,
    mediaQueries,
    uniqueMediaQueries: [...new Set(mediaQueries)].sort(compareText),
    vhUnitCount: countMatches(source, /-?\d*\.?\d+vh\b/g),
    vwUnitCount: countMatches(source, /-?\d*\.?\d+vw\b/g),
  };
}

function extractHtmlClasses(source) {
  const classes = [];
  for (const match of source.matchAll(/\sclass\s*=\s*(["'])(.*?)\1/g)) {
    classes.push(...match[2].split(/\s+/).filter(Boolean));
  }
  return [...new Set(classes)].sort(compareText);
}

function extractHtmlIds(source) {
  return extractUniqueMatches(source, /\sid\s*=\s*(["'])(.*?)\1/g, 2);
}

function assertSourceContract(contract) {
  const expected = {
    css: {
      classCount: 480,
      fixedPositionCount: 38,
      idCount: 122,
      keyframeCount: 26,
      mediaQueryCount: 38,
      vhUnitCount: 14,
      vwUnitCount: 87,
    },
    dom: { staticClassCount: 231, staticIdCount: 323 },
    events: {
      addDynamic: 3,
      addLiteral: 152,
      addTotal: 155,
      inline: 205,
      propertyAssignments: 37,
      removeTotal: 2,
    },
    frontendApiCount: 45,
    functions: { declarations: 1101, unique: 1093 },
    schedulers: {
      requestAnimationFrame: 44,
      requestIdleCallback: 6,
      setInterval: 7,
      setTimeout: 88,
    },
    serverApiCount: 47,
    storage: { indexedDB: 1, localStorage: 21 },
    workers: { constructors: 1, objectUrls: 4, terminate: 3 },
  };
  const actual = {
    css: pick(contract.css, Object.keys(expected.css)),
    dom: pick(contract.dom, Object.keys(expected.dom)),
    events: {
      addDynamic: contract.events.addEventListener.dynamicCount,
      addLiteral: contract.events.addEventListener.literalCount,
      addTotal: contract.events.addEventListener.total,
      inline: contract.events.inline.total,
      propertyAssignments: contract.events.propertyAssignmentCount,
      removeTotal: contract.events.removeEventListener.total,
    },
    frontendApiCount: contract.api.frontend.length,
    functions: {
      declarations: contract.functions.declarationCount,
      unique: contract.functions.uniqueCount,
    },
    schedulers: contract.schedulers,
    serverApiCount: contract.api.server.length,
    storage: {
      indexedDB: contract.storage.indexedDB.length,
      localStorage: contract.storage.localStorageKeys.length,
    },
    workers: {
      constructors: contract.workers.constructorCount,
      objectUrls: contract.workers.objectUrlCount,
      terminate: contract.workers.terminateCount,
    },
  };

  const expectedPostRoutes = [
    '/api/beatmap/cache',
    '/api/login/cookie',
    '/api/playlist/add-song',
    '/api/qq/login/cookie',
    '/api/update/download',
    '/api/update/patch',
  ];
  const actualPostRoutes = contract.api.frontend
    .filter((endpoint) => endpoint.methods.includes('POST'))
    .map((endpoint) => endpoint.route);
  const expectedGetWriteRoutes = [
    '/api/logout',
    '/api/playlist/create',
    '/api/qq/logout',
    '/api/song/like',
  ];
  const actualGetWriteRoutes = contract.api.frontend
    .filter((endpoint) => endpoint.writeViaGet)
    .map((endpoint) => endpoint.route);
  const expectedServerOnly = ['/api/app/version', '/api/podcast/detail'];
  const expectedRequestBodyRoutes = {
    '/api/beatmap/cache': ['artist', 'key', 'map', 'mode', 'provider', 'title'],
    '/api/login/cookie': ['cookie', 'data', 'text'],
    '/api/playlist/add-song': ['id', 'ids', 'pid'],
    '/api/playlist/create': ['name', 'privacy'],
    '/api/qq/login/cookie': ['cookie', 'data', 'text'],
    '/api/song/like': ['id', 'like'],
  };
  const actualRequestBodyRoutes = Object.fromEntries(
    contract.api.server
      .filter((endpoint) => endpoint.request.body.readsRequestBody)
      .map((endpoint) => [endpoint.route, endpoint.request.body.fields]),
  );
  const unmappedFrontendRoutes = contract.api.frontend
    .filter(
      (endpoint) =>
        !endpoint.request ||
        !Array.isArray(endpoint.request.queryParameters) ||
        !Array.isArray(endpoint.request.bodyFields) ||
        !endpoint.request.invocations?.length ||
        endpoint.request.invocations.some(
          (invocation) =>
            !invocation.method ||
            !invocation.transport ||
            !Array.isArray(invocation.queryParameters) ||
            !Array.isArray(invocation.bodyFields),
        ),
    )
    .map((endpoint) => endpoint.route);
  const unmappedServerRoutes = contract.api.server
    .filter(
      (endpoint) =>
        !endpoint.request ||
        !Array.isArray(endpoint.request.query?.parameters) ||
        !Array.isArray(endpoint.request.query?.aliasGroups) ||
        !Array.isArray(endpoint.request.body?.fields) ||
        !Array.isArray(endpoint.request.body?.aliasGroups) ||
        typeof endpoint.request.body?.readsRequestBody !== 'boolean',
    )
    .map((endpoint) => endpoint.route);

  const failures = [];
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    failures.push({ actual, expected, name: 'counts' });
  if (JSON.stringify(actualPostRoutes) !== JSON.stringify(expectedPostRoutes)) {
    failures.push({
      actual: actualPostRoutes,
      expected: expectedPostRoutes,
      name: 'frontend POST routes',
    });
  }
  if (JSON.stringify(actualGetWriteRoutes) !== JSON.stringify(expectedGetWriteRoutes)) {
    failures.push({
      actual: actualGetWriteRoutes,
      expected: expectedGetWriteRoutes,
      name: 'frontend GET write routes',
    });
  }
  if (unmappedFrontendRoutes.length || unmappedServerRoutes.length) {
    failures.push({
      actual: { frontend: unmappedFrontendRoutes, server: unmappedServerRoutes },
      expected: { frontend: [], server: [] },
      name: 'request contract coverage',
    });
  }
  if (JSON.stringify(actualRequestBodyRoutes) !== JSON.stringify(expectedRequestBodyRoutes)) {
    failures.push({
      actual: actualRequestBodyRoutes,
      expected: expectedRequestBodyRoutes,
      name: 'server readRequestBody fields',
    });
  }
  if (JSON.stringify(contract.api.serverOnlyRoutes) !== JSON.stringify(expectedServerOnly)) {
    failures.push({
      actual: contract.api.serverOnlyRoutes,
      expected: expectedServerOnly,
      name: 'server-only routes',
    });
  }
  if (
    contract.api.server.filter((endpoint) => endpoint.methodPolicy === 'allowlist').length !== 1
  ) {
    failures.push({
      actual: contract.api.server.filter((endpoint) => endpoint.methodPolicy === 'allowlist'),
      expected: [{ methods: ['GET', 'POST'], route: '/api/beatmap/cache' }],
      name: 'server method allowlists',
    });
  }

  if (failures.length) {
    throw new Error(`Mineradio source contract drift:\n${JSON.stringify(failures, null, 2)}`);
  }
}

function countValues(values) {
  return Object.fromEntries(
    [...new Set(values)]
      .sort(compareText)
      .map((value) => [value, values.filter((item) => item === value).length]),
  );
}

function pick(value, keys) {
  return Object.fromEntries(keys.map((key) => [key, value[key]]));
}

function compareText(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function extractDesktopWindowMembers(source) {
  const bridgeBody = source.match(/exposeInMainWorld\('desktopWindow',\s*\{([\s\S]*?)\n\}\);/);

  if (!bridgeBody) {
    throw new Error('Unable to extract desktopWindow bridge contract');
  }

  return extractUniqueMatches(bridgeBody[1], /^\s{2}([A-Za-z_$][\w$]*):/gm);
}

function extractStorageKeys(source) {
  const constants = new Map(
    [...source.matchAll(/\bvar\s+([A-Za-z_$][\w$]*)\s*=\s*['"]([^'"]+)['"]/g)].map((match) => [
      match[1],
      match[2],
    ]),
  );
  const keys = new Set();

  for (const match of source.matchAll(
    /localStorage\.(?:getItem|setItem|removeItem)\(\s*([^,)]+)/g,
  )) {
    const expression = match[1]?.trim() ?? '';
    const literal = expression.match(/^['"]([^'"]+)['"]$/)?.[1];
    const resolved = literal ?? constants.get(expression);
    if (resolved) keys.add(resolved);
  }

  for (const [name, value] of constants) {
    if (/(?:_STORE_KEY|HOME_LISTEN_STATS_KEY|HOME_WEATHER_CITY_KEY)$/.test(name)) {
      keys.add(value);
    }
  }

  return [...keys].sort();
}

function extractIndexedDbContract(source) {
  const constants = new Map(
    [...source.matchAll(/\bvar\s+([A-Za-z_$][\w$]*)\s*=\s*['"]([^'"]+)['"]/g)].map((match) => [
      match[1],
      match[2],
    ]),
  );
  const open = source.match(/indexedDB\.open\(([^,]+),\s*(\d+)\)/);
  const store = source.match(
    /createObjectStore\(([^,]+),\s*\{\s*keyPath:\s*['"]([^'"]+)['"]\s*\}\)/,
  );

  if (!open || !store) return [];

  return [
    {
      name: constants.get(open[1].trim()) ?? open[1].trim(),
      stores: [
        {
          keyPath: store[2],
          name: constants.get(store[1].trim()) ?? store[1].trim(),
        },
      ],
      version: Number(open[2]),
    },
  ];
}

function sourcePartManifest(source, adapted) {
  return {
    adaptedBytes: Buffer.byteLength(adapted),
    adaptedSha256: sha256(adapted),
    sourceBytes: Buffer.byteLength(source),
    sourceSha256: sha256(source),
  };
}

function buildAdaptationLedger({ runtimeSource, sourceStyles, sourceTemplate }) {
  return {
    css: {
      fixedToAbsolute: countMatches(sourceStyles, /position\s*:\s*fixed/g),
      mediaToContainer: countMatches(sourceStyles, /@media\s*[^{]+{/g),
      rootSelectorScoping: countMatches(sourceStyles, /(?<![-\w])(?:html|body)(?![-\w])|:root/g),
      vhToCqh: countMatches(sourceStyles, /-?\d*\.?\d+vh\b/g),
      vwToCqw: countMatches(sourceStyles, /-?\d*\.?\d+vw\b/g),
    },
    runtime: {
      documentLookupScoping: countMatches(runtimeSource, /document\.getElementById\(/g),
      innerHeightScoping: countMatches(runtimeSource, /(?<![\w$.])innerHeight\b/g),
      innerWidthScoping: countMatches(runtimeSource, /(?<![\w$.])innerWidth\b/g),
      musicTempoEvalRemoval: 1,
      resourceUrlMappings: 3,
      lifecycleAbortGuards:
        countMatches(runtimeSource, /\scatch\s*\(\s*[A-Za-z_$][\w$]*\s*\)\s*\{/g) +
        countMatches(runtimeSource, /\.catch\(function\(\s*(?:[A-Za-z_$][\w$]*)?\s*\)\s*\{/g),
      virtualAppGestureLifecycle: 4,
    },
    template: {
      documentLookupScoping: countMatches(sourceTemplate, /document\.getElementById\(/g),
    },
  };
}

function countMatches(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

async function copyLockedFile(sourceRelativePath, targetRelativePath) {
  const content = await readFile(path.join(sourceRoot, sourceRelativePath));
  const target = path.join(targetRoot, targetRelativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content);
}

async function readText(relativePath) {
  return readFile(path.join(sourceRoot, relativePath), 'utf8');
}

async function writeText(targetPath, content) {
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, content, 'utf8');
}

function sha256(content) {
  return createHash('sha256').update(content).digest('hex').toUpperCase();
}

async function verifyGeneratedOutput(generatedDirectory, canonicalDirectory) {
  const generatedFiles = await listFiles(generatedDirectory);
  const isManagedOutput = (relativePath) => {
    const normalized = normalizeRelativePath(relativePath);
    return (
      normalized.startsWith('generated/') || normalized === 'provenance/upstream-manifest.json'
    );
  };
  const canonicalManagedFiles = (await listFiles(canonicalDirectory)).filter((relativePath) =>
    isManagedOutput(relativePath),
  );
  const generatedManagedFiles = generatedFiles.filter((relativePath) =>
    isManagedOutput(relativePath),
  );
  const mismatches = [];

  for (const relativePath of canonicalManagedFiles) {
    if (!generatedManagedFiles.includes(relativePath)) {
      mismatches.push({ reason: 'obsolete canonical output', relativePath });
    }
  }

  for (const relativePath of generatedFiles) {
    const generated = await readFile(path.join(generatedDirectory, relativePath));
    let canonical;

    try {
      canonical = await readFile(path.join(canonicalDirectory, relativePath));
    } catch {
      mismatches.push({ reason: 'missing canonical output', relativePath });
      continue;
    }

    if (!generated.equals(canonical)) {
      mismatches.push({
        canonicalSha256: sha256(canonical),
        generatedSha256: sha256(generated),
        reason: 'content mismatch',
        relativePath,
      });
    }
  }

  if (mismatches.length) {
    throw new Error(`Mineradio generated output is stale:\n${JSON.stringify(mismatches, null, 2)}`);
  }
}

function normalizeRelativePath(relativePath) {
  return relativePath.split(path.sep).join('/');
}

async function listFiles(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.join(prefix, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(path.join(directory, entry.name), relativePath)));
    } else if (entry.isFile()) files.push(relativePath);
  }

  return files.sort();
}
