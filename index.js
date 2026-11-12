// include: shell.js
// include: minimum_runtime_check.js
(function() {
  // "30.0.0" -> 300000
  function humanReadableVersionToPacked(str) {
    str = str.split('-')[0]; // Remove any trailing part from e.g. "12.53.3-alpha"
    let vers = str.split('.').slice(0, 3);
    while(vers.length < 3) vers.push('00');
    vers = vers.map((n, i, arr) => n.padStart(2, '0'));
    return vers.join('');
  }
  // 300000 -> "30.0.0"
  const packedVersionToHumanReadable = n => [n / 10_000 | 0, (n / 100 | 0) % 100, n % 100].join('.');

  const TARGET_NOT_SUPPORTED = 2147483647;

  // Note: We use a typeof check here instead of optional chaining using
  // globalThis because older browsers might not have globalThis defined.

  // We skip the node version checking when running on Bun/Deno since the node
  // version they report doesn't seem to be useful.
  if (typeof process !== 'undefined' && !process.versions?.bun && typeof Deno === "undefined") {
    const currentNodeVersion = process.versions?.node ? humanReadableVersionToPacked(process.versions.node) : TARGET_NOT_SUPPORTED;
    if (currentNodeVersion < 180300) {
      throw new Error(`This emscripten-generated code requires node v${ packedVersionToHumanReadable(180300) } (detected v${packedVersionToHumanReadable(currentNodeVersion)})`);
    }
  }

  const userAgent = typeof navigator !== 'undefined' && navigator.userAgent;
  if (!userAgent) {
    return;
  }

  const currentSafariVersion = userAgent.includes("Safari/") && !userAgent.includes("Chrome/") && userAgent.match(/Version\/(\d+\.?\d*\.?\d*)/) ? humanReadableVersionToPacked(userAgent.match(/Version\/(\d+\.?\d*\.?\d*)/)[1]) : TARGET_NOT_SUPPORTED;
  if (currentSafariVersion < 150400) {
    throw new Error(`This emscripten-generated code requires Safari v${ packedVersionToHumanReadable(150400) } (detected v${currentSafariVersion})`);
  }

  const currentFirefoxVersion = userAgent.match(/Firefox\/(\d+(?:\.\d+)?)/) ? parseFloat(userAgent.match(/Firefox\/(\d+(?:\.\d+)?)/)[1]) : TARGET_NOT_SUPPORTED;
  if (currentFirefoxVersion < 92) {
    throw new Error(`This emscripten-generated code requires Firefox v92 (detected v${currentFirefoxVersion})`);
  }

  const currentChromeVersion = userAgent.match(/Chrome\/(\d+(?:\.\d+)?)/) ? parseFloat(userAgent.match(/Chrome\/(\d+(?:\.\d+)?)/)[1]) : TARGET_NOT_SUPPORTED;
  if (currentChromeVersion < 93) {
    throw new Error(`This emscripten-generated code requires Chrome v93 (detected v${currentChromeVersion})`);
  }
})();

// end include: minimum_runtime_check.js
// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(moduleArg) => Promise<Module>
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = typeof Module !== 'undefined' ? Module : {};

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).

// Attempt to auto-detect the environment
var ENVIRONMENT_IS_WEB = !!globalThis.window;
var ENVIRONMENT_IS_WORKER = !!globalThis.WorkerGlobalScope;
// N.b. Electron.js environment is simultaneously a NODE-environment, but
// also a web environment.
var ENVIRONMENT_IS_NODE = globalThis.process?.versions?.node && globalThis.process?.type != 'renderer';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)
// include: C:\Users\prido\AppData\Local\Temp\tmpwirac64i.js

  if (!Module['expectedDataFileDownloads']) Module['expectedDataFileDownloads'] = 0;
  Module['expectedDataFileDownloads']++;
  (() => {
    // Do not attempt to redownload the virtual filesystem data when in a pthread or a Wasm Worker context.
    var isPthread = typeof ENVIRONMENT_IS_PTHREAD !== 'undefined' && ENVIRONMENT_IS_PTHREAD;
    var isWasmWorker = typeof ENVIRONMENT_IS_WASM_WORKER !== 'undefined' && ENVIRONMENT_IS_WASM_WORKER;
    if (isPthread || isWasmWorker) return;
    var isNode = globalThis.process && globalThis.process.versions && globalThis.process.versions.node && globalThis.process.type != 'renderer';
    async function loadPackage(metadata) {

      var PACKAGE_PATH = '';
      if (typeof window === 'object') {
        PACKAGE_PATH = window['encodeURIComponent'](window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/')) + '/');
      } else if (typeof process === 'undefined' && typeof location !== 'undefined') {
        // web worker
        PACKAGE_PATH = encodeURIComponent(location.pathname.substring(0, location.pathname.lastIndexOf('/')) + '/');
      }
      var PACKAGE_NAME = 'index.data';
      var REMOTE_PACKAGE_BASE = 'index.data';
      var REMOTE_PACKAGE_NAME = Module['locateFile'] ? Module['locateFile'](REMOTE_PACKAGE_BASE, '') : REMOTE_PACKAGE_BASE;
      var REMOTE_PACKAGE_SIZE = metadata['remote_package_size'];

      async function fetchRemotePackage(packageName, packageSize) {
        if (isNode) {
          var contents = require('fs').readFileSync(packageName);
          return new Uint8Array(contents).buffer;
        }
        if (!Module['dataFileDownloads']) Module['dataFileDownloads'] = {};
        try {
          var response = await fetch(packageName);
        } catch (e) {
          throw new Error(`Network Error: ${packageName}`, {e});
        }
        if (!response.ok) {
          throw new Error(`${response.status}: ${response.url}`);
        }

        const chunks = [];
        const headers = response.headers;
        const total = Number(headers.get('Content-Length') || packageSize);
        let loaded = 0;

        Module['setStatus'] && Module['setStatus']('Downloading data...');
        const reader = response.body.getReader();

        while (1) {
          var {done, value} = await reader.read();
          if (done) break;
          chunks.push(value);
          loaded += value.length;
          Module['dataFileDownloads'][packageName] = {loaded, total};

          let totalLoaded = 0;
          let totalSize = 0;

          for (const download of Object.values(Module['dataFileDownloads'])) {
            totalLoaded += download.loaded;
            totalSize += download.total;
          }

          Module['setStatus'] && Module['setStatus'](`Downloading data... (${totalLoaded}/${totalSize})`);
        }

        const packageData = new Uint8Array(chunks.map((c) => c.length).reduce((a, b) => a + b, 0));
        let offset = 0;
        for (const chunk of chunks) {
          packageData.set(chunk, offset);
          offset += chunk.length;
        }
        return packageData.buffer;
      }

      var fetchPromise;
      var fetched = Module['getPreloadedPackage'] && Module['getPreloadedPackage'](REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE);

      if (!fetched) {
        // Note that we don't use await here because we want to execute the
        // the rest of this function immediately.
        fetchPromise = fetchRemotePackage(REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE);
      }

    async function runWithFS(Module) {

      function assert(check, msg) {
        if (!check) throw new Error(msg);
      }
Module['FS_createPath']("/", "SDL_WebBuild", true, true);
Module['FS_createPath']("/SDL_WebBuild", "x64", true, true);
Module['FS_createPath']("/SDL_WebBuild/x64", "Debug", true, true);
Module['FS_createPath']("/SDL_WebBuild/x64/Debug", "SDL_WebBuild.tlog", true, true);
Module['FS_createPath']("/", "assets", true, true);
Module['FS_createPath']("/assets", "sounds", true, true);
Module['FS_createPath']("/", "build-web", true, true);
Module['FS_createPath']("/build-web", "CMakeFiles", true, true);
Module['FS_createPath']("/build-web/CMakeFiles", "4.3.1-msvc1", true, true);
Module['FS_createPath']("/build-web/CMakeFiles", "MyGame.dir", true, true);
Module['FS_createPath']("/build-web/CMakeFiles/MyGame.dir", "src", true, true);
Module['FS_createPath']("/build-web", "external", true, true);
Module['FS_createPath']("/build-web/external", "SDL", true, true);
Module['FS_createPath']("/build-web/external/SDL", "CMakeFiles", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles", "CMakeTmp", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/CMakeTmp", "SDL_detect_arch", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles", "SDL3-static.dir", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir", "src", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src", "atomic", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src", "audio", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/audio", "disk", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/audio", "dummy", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/audio", "emscripten", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src", "camera", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/camera", "dummy", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/camera", "emscripten", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src", "core", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src", "cpuinfo", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src", "dialog", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/dialog", "unix", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src", "dynapi", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src", "events", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src", "filesystem", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/filesystem", "emscripten", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/filesystem", "posix", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src", "gpu", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/gpu", "xr", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src", "haptic", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/haptic", "dummy", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src", "hidapi", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src", "io", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/io", "generic", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src", "joystick", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick", "emscripten", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick", "virtual", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src", "libm", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src", "loadso", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/loadso", "dlopen", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src", "locale", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/locale", "emscripten", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src", "main", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/main", "emscripten", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src", "misc", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/misc", "emscripten", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src", "notification", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/notification", "dummy", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src", "power", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/power", "emscripten", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src", "process", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/process", "posix", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src", "render", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render", "direct3d", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render", "direct3d11", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render", "direct3d12", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render", "gpu", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render", "ngage", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render", "opengl", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render", "opengles", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render", "opengles2", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render", "ps2", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render", "psp", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render", "software", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render", "vitagxm", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render", "vulkan", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src", "sensor", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/sensor", "emscripten", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src", "stdlib", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src", "storage", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/storage", "generic", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src", "thread", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/thread", "generic", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src", "time", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/time", "unix", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src", "timer", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/timer", "unix", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src", "tray", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/tray", "dummy", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src", "video", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video", "dummy", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video", "emscripten", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video", "offscreen", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video", "yuv2rgb", true, true);
Module['FS_createPath']("/build-web/external/SDL/CMakeFiles", "git-data", true, true);
Module['FS_createPath']("/build-web/external/SDL", "include-config-", true, true);
Module['FS_createPath']("/build-web/external/SDL/include-config-", "build_config", true, true);
Module['FS_createPath']("/build-web/external/SDL", "include-revision", true, true);
Module['FS_createPath']("/build-web/external/SDL/include-revision", "SDL3", true, true);
Module['FS_createPath']("/build-web/external", "SDL_mixer", true, true);
Module['FS_createPath']("/build-web/external/SDL_mixer", "CMakeFiles", true, true);
Module['FS_createPath']("/build-web/external/SDL_mixer/CMakeFiles", "SDL3_mixer-static.dir", true, true);
Module['FS_createPath']("/build-web/external/SDL_mixer/CMakeFiles/SDL3_mixer-static.dir", "src", true, true);
Module['FS_createPath']("/build-web/external/SDL_mixer/CMakeFiles/SDL3_mixer-static.dir/src", "timidity", true, true);
Module['FS_createPath']("/", "build", true, true);
Module['FS_createPath']("/build", "CMakeFiles", true, true);
Module['FS_createPath']("/build/CMakeFiles", "4.3.1-msvc1", true, true);
Module['FS_createPath']("/build/CMakeFiles/4.3.1-msvc1", "CompilerIdC", true, true);
Module['FS_createPath']("/build/CMakeFiles/4.3.1-msvc1", "CompilerIdCXX", true, true);
Module['FS_createPath']("/build/CMakeFiles", "MyGame.dir", true, true);
Module['FS_createPath']("/build/CMakeFiles/MyGame.dir", "src", true, true);
Module['FS_createPath']("/build/CMakeFiles", "ShowIncludes", true, true);
Module['FS_createPath']("/build", "external", true, true);
Module['FS_createPath']("/build/external", "SDL", true, true);
Module['FS_createPath']("/build/external/SDL", "CMakeFiles", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles", "CMakeTmp", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/CMakeTmp", "SDL_detect_arch", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles", "SDL3-static.dir", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir", "src", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src", "atomic", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src", "audio", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/audio", "directsound", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/audio", "disk", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/audio", "dummy", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/audio", "wasapi", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src", "camera", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/camera", "dummy", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/camera", "mediafoundation", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src", "core", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/core", "windows", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/core/windows", "gameinput", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src", "cpuinfo", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src", "dialog", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/dialog", "windows", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src", "dynapi", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src", "events", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src", "filesystem", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/filesystem", "windows", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src", "gpu", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/gpu", "d3d12", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/gpu", "vulkan", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/gpu", "xr", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src", "haptic", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/haptic", "hidapi", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/haptic", "windows", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src", "hidapi", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src", "io", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/io", "generic", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/io", "windows", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src", "joystick", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick", "gdk", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick", "hidapi", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick", "virtual", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick", "windows", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src", "libm", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src", "loadso", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/loadso", "windows", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src", "locale", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/locale", "windows", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src", "main", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/main", "generic", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/main", "windows", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src", "misc", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/misc", "windows", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src", "notification", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/notification", "windows", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src", "power", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/power", "windows", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src", "process", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/process", "windows", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src", "render", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render", "direct3d", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render", "direct3d11", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render", "direct3d12", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render", "gpu", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render", "ngage", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render", "opengl", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render", "opengles", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render", "opengles2", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render", "ps2", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render", "psp", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render", "software", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render", "vitagxm", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render", "vulkan", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src", "sensor", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/sensor", "windows", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src", "stdlib", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src", "storage", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/storage", "generic", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/storage", "steam", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src", "thread", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/thread", "generic", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/thread", "windows", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src", "time", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/time", "windows", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src", "timer", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/timer", "windows", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src", "tray", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/tray", "windows", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src", "video", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video", "dummy", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video", "offscreen", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video", "windows", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video", "yuv2rgb", true, true);
Module['FS_createPath']("/build/external/SDL/CMakeFiles", "git-data", true, true);
Module['FS_createPath']("/build/external/SDL", "include-config-debug", true, true);
Module['FS_createPath']("/build/external/SDL/include-config-debug", "build_config", true, true);
Module['FS_createPath']("/build/external/SDL", "include-revision", true, true);
Module['FS_createPath']("/build/external/SDL/include-revision", "SDL3", true, true);
Module['FS_createPath']("/", "external", true, true);
Module['FS_createPath']("/external", "SDL", true, true);
Module['FS_createPath']("/external/SDL", ".github", true, true);
Module['FS_createPath']("/external/SDL/.github", "actions", true, true);
Module['FS_createPath']("/external/SDL/.github/actions", "setup-djgpp-toolchain", true, true);
Module['FS_createPath']("/external/SDL/.github/actions", "setup-gdk-desktop", true, true);
Module['FS_createPath']("/external/SDL/.github/actions", "setup-harmonyos-toolchain", true, true);
Module['FS_createPath']("/external/SDL/.github/actions", "setup-loongarch64-toolchain", true, true);
Module['FS_createPath']("/external/SDL/.github/actions", "setup-msvc-libusb", true, true);
Module['FS_createPath']("/external/SDL/.github/actions", "setup-ngage-sdk", true, true);
Module['FS_createPath']("/external/SDL/.github/actions", "setup-ninja", true, true);
Module['FS_createPath']("/external/SDL/.github/actions", "setup-vita-gles", true, true);
Module['FS_createPath']("/external/SDL/.github", "cmake", true, true);
Module['FS_createPath']("/external/SDL/.github", "workflows", true, true);
Module['FS_createPath']("/external/SDL", "VisualC-GDK", true, true);
Module['FS_createPath']("/external/SDL/VisualC-GDK", "SDL", true, true);
Module['FS_createPath']("/external/SDL/VisualC-GDK", "SDL_test", true, true);
Module['FS_createPath']("/external/SDL/VisualC-GDK", "logos", true, true);
Module['FS_createPath']("/external/SDL/VisualC-GDK", "tests", true, true);
Module['FS_createPath']("/external/SDL/VisualC-GDK/tests", "testcontroller", true, true);
Module['FS_createPath']("/external/SDL/VisualC-GDK/tests/testcontroller", "wingdk", true, true);
Module['FS_createPath']("/external/SDL/VisualC-GDK/tests/testcontroller", "xboxone", true, true);
Module['FS_createPath']("/external/SDL/VisualC-GDK/tests/testcontroller", "xboxseries", true, true);
Module['FS_createPath']("/external/SDL/VisualC-GDK/tests", "testgdk", true, true);
Module['FS_createPath']("/external/SDL/VisualC-GDK/tests/testgdk", "src", true, true);
Module['FS_createPath']("/external/SDL/VisualC-GDK/tests/testgdk", "wingdk", true, true);
Module['FS_createPath']("/external/SDL/VisualC-GDK/tests/testgdk", "xboxone", true, true);
Module['FS_createPath']("/external/SDL/VisualC-GDK/tests/testgdk", "xboxseries", true, true);
Module['FS_createPath']("/external/SDL/VisualC-GDK/tests", "testsprite", true, true);
Module['FS_createPath']("/external/SDL/VisualC-GDK/tests/testsprite", "wingdk", true, true);
Module['FS_createPath']("/external/SDL/VisualC-GDK/tests/testsprite", "xboxone", true, true);
Module['FS_createPath']("/external/SDL/VisualC-GDK/tests/testsprite", "xboxseries", true, true);
Module['FS_createPath']("/external/SDL", "VisualC", true, true);
Module['FS_createPath']("/external/SDL/VisualC", "SDL", true, true);
Module['FS_createPath']("/external/SDL/VisualC", "SDL_test", true, true);
Module['FS_createPath']("/external/SDL/VisualC", "examples", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples", "asyncio", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/asyncio", "01-load-bitmaps", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples", "audio", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/audio", "01-simple-playback", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/audio", "02-simple-playback-callback", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/audio", "03-load-wav", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/audio", "04-multiple-streams", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/audio", "05-planar-data", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples", "camera", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/camera", "01-read-and-draw", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples", "demo", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/demo", "01-snake", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/demo", "02-woodeneye-008", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/demo", "03-infinite-monkeys", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/demo", "04-bytepusher", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples", "input", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/input", "01-joystick-polling", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/input", "02-joystick-events", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/input", "03-gamepad-polling", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/input", "04-gamepad-events", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/input", "05-gamepad-rumble", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples", "misc", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/misc", "01-power", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/misc", "02-clipboard", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/misc", "03-locale", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples", "pen", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/pen", "01-drawing-lines", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples", "renderer", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/renderer", "01-clear", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/renderer", "02-primitives", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/renderer", "03-lines", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/renderer", "04-points", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/renderer", "05-rectangles", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/renderer", "06-textures", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/renderer", "07-streaming-textures", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/renderer", "08-rotating-textures", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/renderer", "09-scaling-textures", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/renderer", "10-geometry", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/renderer", "11-color-mods", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/renderer", "14-viewport", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/renderer", "15-cliprect", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/renderer", "17-read-pixels", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/renderer", "18-debug-text", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/renderer", "19-affine-textures", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/renderer", "20-blending", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples", "storage", true, true);
Module['FS_createPath']("/external/SDL/VisualC/examples/storage", "01-user", true, true);
Module['FS_createPath']("/external/SDL/VisualC", "tests", true, true);
Module['FS_createPath']("/external/SDL/VisualC/tests", "checkkeys", true, true);
Module['FS_createPath']("/external/SDL/VisualC/tests", "loopwave", true, true);
Module['FS_createPath']("/external/SDL/VisualC/tests", "testatomic", true, true);
Module['FS_createPath']("/external/SDL/VisualC/tests", "testautomation", true, true);
Module['FS_createPath']("/external/SDL/VisualC/tests", "testcontroller", true, true);
Module['FS_createPath']("/external/SDL/VisualC/tests", "testdialog", true, true);
Module['FS_createPath']("/external/SDL/VisualC/tests", "testdraw", true, true);
Module['FS_createPath']("/external/SDL/VisualC/tests", "testfile", true, true);
Module['FS_createPath']("/external/SDL/VisualC/tests", "testgl", true, true);
Module['FS_createPath']("/external/SDL/VisualC/tests", "testgles2", true, true);
Module['FS_createPath']("/external/SDL/VisualC/tests", "testoverlay", true, true);
Module['FS_createPath']("/external/SDL/VisualC/tests", "testpen", true, true);
Module['FS_createPath']("/external/SDL/VisualC/tests", "testplatform", true, true);
Module['FS_createPath']("/external/SDL/VisualC/tests", "testpower", true, true);
Module['FS_createPath']("/external/SDL/VisualC/tests", "testrendertarget", true, true);
Module['FS_createPath']("/external/SDL/VisualC/tests", "testrumble", true, true);
Module['FS_createPath']("/external/SDL/VisualC/tests", "testscale", true, true);
Module['FS_createPath']("/external/SDL/VisualC/tests", "testsensor", true, true);
Module['FS_createPath']("/external/SDL/VisualC/tests", "testshape", true, true);
Module['FS_createPath']("/external/SDL/VisualC/tests", "testsoftwaretransparent", true, true);
Module['FS_createPath']("/external/SDL/VisualC/tests", "testsprite", true, true);
Module['FS_createPath']("/external/SDL/VisualC/tests", "testsurround", true, true);
Module['FS_createPath']("/external/SDL/VisualC/tests", "testtray", true, true);
Module['FS_createPath']("/external/SDL/VisualC/tests", "testvulkan", true, true);
Module['FS_createPath']("/external/SDL/VisualC/tests", "testwm", true, true);
Module['FS_createPath']("/external/SDL/VisualC/tests", "testyuv", true, true);
Module['FS_createPath']("/external/SDL", "Xcode", true, true);
Module['FS_createPath']("/external/SDL/Xcode", "SDL", true, true);
Module['FS_createPath']("/external/SDL/Xcode/SDL", "SDL.xcodeproj", true, true);
Module['FS_createPath']("/external/SDL/Xcode/SDL", "SDL3", true, true);
Module['FS_createPath']("/external/SDL/Xcode/SDL", "pkg-support", true, true);
Module['FS_createPath']("/external/SDL/Xcode/SDL/pkg-support", "resources", true, true);
Module['FS_createPath']("/external/SDL/Xcode/SDL/pkg-support/resources", "CMake", true, true);
Module['FS_createPath']("/external/SDL/Xcode/SDL/pkg-support/resources", "framework", true, true);
Module['FS_createPath']("/external/SDL/Xcode/SDL/pkg-support", "share", true, true);
Module['FS_createPath']("/external/SDL/Xcode/SDL/pkg-support/share", "cmake", true, true);
Module['FS_createPath']("/external/SDL/Xcode/SDL/pkg-support/share/cmake", "SDL3", true, true);
Module['FS_createPath']("/external/SDL/Xcode", "SDLTest", true, true);
Module['FS_createPath']("/external/SDL/Xcode/SDLTest", "SDLTest.xcodeproj", true, true);
Module['FS_createPath']("/external/SDL/Xcode", "XcodeDocSet", true, true);
Module['FS_createPath']("/external/SDL", "android-project", true, true);
Module['FS_createPath']("/external/SDL/android-project", "app", true, true);
Module['FS_createPath']("/external/SDL/android-project/app", "jni", true, true);
Module['FS_createPath']("/external/SDL/android-project/app/jni", "src", true, true);
Module['FS_createPath']("/external/SDL/android-project/app", "src", true, true);
Module['FS_createPath']("/external/SDL/android-project/app/src", "main", true, true);
Module['FS_createPath']("/external/SDL/android-project/app/src/main", "java", true, true);
Module['FS_createPath']("/external/SDL/android-project/app/src/main/java", "org", true, true);
Module['FS_createPath']("/external/SDL/android-project/app/src/main/java/org", "libsdl", true, true);
Module['FS_createPath']("/external/SDL/android-project/app/src/main/java/org/libsdl", "app", true, true);
Module['FS_createPath']("/external/SDL/android-project/app/src/main", "res", true, true);
Module['FS_createPath']("/external/SDL/android-project/app/src/main/res", "mipmap-hdpi", true, true);
Module['FS_createPath']("/external/SDL/android-project/app/src/main/res", "mipmap-mdpi", true, true);
Module['FS_createPath']("/external/SDL/android-project/app/src/main/res", "mipmap-xhdpi", true, true);
Module['FS_createPath']("/external/SDL/android-project/app/src/main/res", "mipmap-xxhdpi", true, true);
Module['FS_createPath']("/external/SDL/android-project/app/src/main/res", "mipmap-xxxhdpi", true, true);
Module['FS_createPath']("/external/SDL/android-project/app/src/main/res", "values", true, true);
Module['FS_createPath']("/external/SDL/android-project", "gradle", true, true);
Module['FS_createPath']("/external/SDL/android-project/gradle", "wrapper", true, true);
Module['FS_createPath']("/external/SDL", "build-scripts", true, true);
Module['FS_createPath']("/external/SDL/build-scripts", "pkg-support", true, true);
Module['FS_createPath']("/external/SDL/build-scripts/pkg-support", "android", true, true);
Module['FS_createPath']("/external/SDL/build-scripts/pkg-support/android", "aar", true, true);
Module['FS_createPath']("/external/SDL/build-scripts/pkg-support/android/aar", "cmake", true, true);
Module['FS_createPath']("/external/SDL/build-scripts/pkg-support", "mingw", true, true);
Module['FS_createPath']("/external/SDL/build-scripts/pkg-support/mingw", "cmake", true, true);
Module['FS_createPath']("/external/SDL/build-scripts/pkg-support", "msvc", true, true);
Module['FS_createPath']("/external/SDL/build-scripts/pkg-support/msvc", "arm64", true, true);
Module['FS_createPath']("/external/SDL/build-scripts/pkg-support/msvc", "cmake", true, true);
Module['FS_createPath']("/external/SDL/build-scripts/pkg-support/msvc", "x64", true, true);
Module['FS_createPath']("/external/SDL/build-scripts/pkg-support/msvc", "x86", true, true);
Module['FS_createPath']("/external/SDL/build-scripts/pkg-support", "source", true, true);
Module['FS_createPath']("/external/SDL", "cmake", true, true);
Module['FS_createPath']("/external/SDL/cmake", "android", true, true);
Module['FS_createPath']("/external/SDL/cmake", "test", true, true);
Module['FS_createPath']("/external/SDL/cmake/test", "swift", true, true);
Module['FS_createPath']("/external/SDL", "docs", true, true);
Module['FS_createPath']("/external/SDL", "examples", true, true);
Module['FS_createPath']("/external/SDL/examples", "asyncio", true, true);
Module['FS_createPath']("/external/SDL/examples/asyncio", "01-load-bitmaps", true, true);
Module['FS_createPath']("/external/SDL/examples", "audio", true, true);
Module['FS_createPath']("/external/SDL/examples/audio", "01-simple-playback", true, true);
Module['FS_createPath']("/external/SDL/examples/audio", "02-simple-playback-callback", true, true);
Module['FS_createPath']("/external/SDL/examples/audio", "03-load-wav", true, true);
Module['FS_createPath']("/external/SDL/examples/audio", "04-multiple-streams", true, true);
Module['FS_createPath']("/external/SDL/examples/audio", "05-planar-data", true, true);
Module['FS_createPath']("/external/SDL/examples", "camera", true, true);
Module['FS_createPath']("/external/SDL/examples/camera", "01-read-and-draw", true, true);
Module['FS_createPath']("/external/SDL/examples", "demo", true, true);
Module['FS_createPath']("/external/SDL/examples/demo", "01-snake", true, true);
Module['FS_createPath']("/external/SDL/examples/demo", "02-woodeneye-008", true, true);
Module['FS_createPath']("/external/SDL/examples/demo", "03-infinite-monkeys", true, true);
Module['FS_createPath']("/external/SDL/examples/demo", "04-bytepusher", true, true);
Module['FS_createPath']("/external/SDL/examples", "input", true, true);
Module['FS_createPath']("/external/SDL/examples/input", "01-joystick-polling", true, true);
Module['FS_createPath']("/external/SDL/examples/input", "02-joystick-events", true, true);
Module['FS_createPath']("/external/SDL/examples/input", "03-gamepad-polling", true, true);
Module['FS_createPath']("/external/SDL/examples/input", "04-gamepad-events", true, true);
Module['FS_createPath']("/external/SDL/examples/input", "05-gamepad-rumble", true, true);
Module['FS_createPath']("/external/SDL/examples", "misc", true, true);
Module['FS_createPath']("/external/SDL/examples/misc", "01-power", true, true);
Module['FS_createPath']("/external/SDL/examples/misc", "02-clipboard", true, true);
Module['FS_createPath']("/external/SDL/examples/misc", "03-locale", true, true);
Module['FS_createPath']("/external/SDL/examples", "pen", true, true);
Module['FS_createPath']("/external/SDL/examples/pen", "01-drawing-lines", true, true);
Module['FS_createPath']("/external/SDL/examples", "renderer", true, true);
Module['FS_createPath']("/external/SDL/examples/renderer", "01-clear", true, true);
Module['FS_createPath']("/external/SDL/examples/renderer", "02-primitives", true, true);
Module['FS_createPath']("/external/SDL/examples/renderer", "03-lines", true, true);
Module['FS_createPath']("/external/SDL/examples/renderer", "04-points", true, true);
Module['FS_createPath']("/external/SDL/examples/renderer", "05-rectangles", true, true);
Module['FS_createPath']("/external/SDL/examples/renderer", "06-textures", true, true);
Module['FS_createPath']("/external/SDL/examples/renderer", "07-streaming-textures", true, true);
Module['FS_createPath']("/external/SDL/examples/renderer", "08-rotating-textures", true, true);
Module['FS_createPath']("/external/SDL/examples/renderer", "09-scaling-textures", true, true);
Module['FS_createPath']("/external/SDL/examples/renderer", "10-geometry", true, true);
Module['FS_createPath']("/external/SDL/examples/renderer", "11-color-mods", true, true);
Module['FS_createPath']("/external/SDL/examples/renderer", "14-viewport", true, true);
Module['FS_createPath']("/external/SDL/examples/renderer", "15-cliprect", true, true);
Module['FS_createPath']("/external/SDL/examples/renderer", "17-read-pixels", true, true);
Module['FS_createPath']("/external/SDL/examples/renderer", "18-debug-text", true, true);
Module['FS_createPath']("/external/SDL/examples/renderer", "19-affine-textures", true, true);
Module['FS_createPath']("/external/SDL/examples/renderer", "20-blending", true, true);
Module['FS_createPath']("/external/SDL/examples", "storage", true, true);
Module['FS_createPath']("/external/SDL/examples/storage", "01-user", true, true);
Module['FS_createPath']("/external/SDL", "include", true, true);
Module['FS_createPath']("/external/SDL/include", "SDL3", true, true);
Module['FS_createPath']("/external/SDL/include", "build_config", true, true);
Module['FS_createPath']("/external/SDL", "openharmony-project", true, true);
Module['FS_createPath']("/external/SDL/openharmony-project", "AppScope", true, true);
Module['FS_createPath']("/external/SDL/openharmony-project/AppScope", "resources", true, true);
Module['FS_createPath']("/external/SDL/openharmony-project/AppScope/resources", "base", true, true);
Module['FS_createPath']("/external/SDL/openharmony-project/AppScope/resources/base", "element", true, true);
Module['FS_createPath']("/external/SDL/openharmony-project/AppScope/resources/base", "media", true, true);
Module['FS_createPath']("/external/SDL/openharmony-project", "entry", true, true);
Module['FS_createPath']("/external/SDL/openharmony-project/entry", "src", true, true);
Module['FS_createPath']("/external/SDL/openharmony-project/entry/src", "main", true, true);
Module['FS_createPath']("/external/SDL/openharmony-project/entry/src/main", "cpp", true, true);
Module['FS_createPath']("/external/SDL/openharmony-project/entry/src/main/cpp", "types", true, true);
Module['FS_createPath']("/external/SDL/openharmony-project/entry/src/main/cpp/types", "libSDL3", true, true);
Module['FS_createPath']("/external/SDL/openharmony-project/entry/src/main", "ets", true, true);
Module['FS_createPath']("/external/SDL/openharmony-project/entry/src/main/ets", "entryability", true, true);
Module['FS_createPath']("/external/SDL/openharmony-project/entry/src/main/ets", "entrybackupability", true, true);
Module['FS_createPath']("/external/SDL/openharmony-project/entry/src/main/ets", "pages", true, true);
Module['FS_createPath']("/external/SDL/openharmony-project/entry/src/main", "resources", true, true);
Module['FS_createPath']("/external/SDL/openharmony-project/entry/src/main/resources", "base", true, true);
Module['FS_createPath']("/external/SDL/openharmony-project/entry/src/main/resources/base", "element", true, true);
Module['FS_createPath']("/external/SDL/openharmony-project/entry/src/main/resources/base", "media", true, true);
Module['FS_createPath']("/external/SDL/openharmony-project/entry/src/main/resources/base", "profile", true, true);
Module['FS_createPath']("/external/SDL/openharmony-project/entry/src/main/resources", "dark", true, true);
Module['FS_createPath']("/external/SDL/openharmony-project/entry/src/main/resources/dark", "element", true, true);
Module['FS_createPath']("/external/SDL/openharmony-project", "hvigor", true, true);
Module['FS_createPath']("/external/SDL", "src", true, true);
Module['FS_createPath']("/external/SDL/src", "atomic", true, true);
Module['FS_createPath']("/external/SDL/src", "audio", true, true);
Module['FS_createPath']("/external/SDL/src/audio", "aaudio", true, true);
Module['FS_createPath']("/external/SDL/src/audio", "alsa", true, true);
Module['FS_createPath']("/external/SDL/src/audio", "coreaudio", true, true);
Module['FS_createPath']("/external/SDL/src/audio", "directsound", true, true);
Module['FS_createPath']("/external/SDL/src/audio", "disk", true, true);
Module['FS_createPath']("/external/SDL/src/audio", "dos", true, true);
Module['FS_createPath']("/external/SDL/src/audio", "dsp", true, true);
Module['FS_createPath']("/external/SDL/src/audio", "dummy", true, true);
Module['FS_createPath']("/external/SDL/src/audio", "emscripten", true, true);
Module['FS_createPath']("/external/SDL/src/audio", "haiku", true, true);
Module['FS_createPath']("/external/SDL/src/audio", "jack", true, true);
Module['FS_createPath']("/external/SDL/src/audio", "n3ds", true, true);
Module['FS_createPath']("/external/SDL/src/audio", "netbsd", true, true);
Module['FS_createPath']("/external/SDL/src/audio", "ngage", true, true);
Module['FS_createPath']("/external/SDL/src/audio", "ohaudio", true, true);
Module['FS_createPath']("/external/SDL/src/audio", "openslES", true, true);
Module['FS_createPath']("/external/SDL/src/audio", "pipewire", true, true);
Module['FS_createPath']("/external/SDL/src/audio", "ps2", true, true);
Module['FS_createPath']("/external/SDL/src/audio", "psp", true, true);
Module['FS_createPath']("/external/SDL/src/audio", "pulseaudio", true, true);
Module['FS_createPath']("/external/SDL/src/audio", "qnx", true, true);
Module['FS_createPath']("/external/SDL/src/audio", "sndio", true, true);
Module['FS_createPath']("/external/SDL/src/audio", "vita", true, true);
Module['FS_createPath']("/external/SDL/src/audio", "wasapi", true, true);
Module['FS_createPath']("/external/SDL/src", "camera", true, true);
Module['FS_createPath']("/external/SDL/src/camera", "android", true, true);
Module['FS_createPath']("/external/SDL/src/camera", "coremedia", true, true);
Module['FS_createPath']("/external/SDL/src/camera", "dummy", true, true);
Module['FS_createPath']("/external/SDL/src/camera", "emscripten", true, true);
Module['FS_createPath']("/external/SDL/src/camera", "mediafoundation", true, true);
Module['FS_createPath']("/external/SDL/src/camera", "openharmony", true, true);
Module['FS_createPath']("/external/SDL/src/camera", "pipewire", true, true);
Module['FS_createPath']("/external/SDL/src/camera", "v4l2", true, true);
Module['FS_createPath']("/external/SDL/src/camera", "vita", true, true);
Module['FS_createPath']("/external/SDL/src", "core", true, true);
Module['FS_createPath']("/external/SDL/src/core", "android", true, true);
Module['FS_createPath']("/external/SDL/src/core", "dos", true, true);
Module['FS_createPath']("/external/SDL/src/core", "freebsd", true, true);
Module['FS_createPath']("/external/SDL/src/core", "gdk", true, true);
Module['FS_createPath']("/external/SDL/src/core", "haiku", true, true);
Module['FS_createPath']("/external/SDL/src/core", "linux", true, true);
Module['FS_createPath']("/external/SDL/src/core", "macos", true, true);
Module['FS_createPath']("/external/SDL/src/core", "ngage", true, true);
Module['FS_createPath']("/external/SDL/src/core", "openbsd", true, true);
Module['FS_createPath']("/external/SDL/src/core", "openharmony", true, true);
Module['FS_createPath']("/external/SDL/src/core", "unix", true, true);
Module['FS_createPath']("/external/SDL/src/core", "windows", true, true);
Module['FS_createPath']("/external/SDL/src/core/windows", "gameinput", true, true);
Module['FS_createPath']("/external/SDL/src", "cpuinfo", true, true);
Module['FS_createPath']("/external/SDL/src", "dialog", true, true);
Module['FS_createPath']("/external/SDL/src/dialog", "android", true, true);
Module['FS_createPath']("/external/SDL/src/dialog", "cocoa", true, true);
Module['FS_createPath']("/external/SDL/src/dialog", "dummy", true, true);
Module['FS_createPath']("/external/SDL/src/dialog", "haiku", true, true);
Module['FS_createPath']("/external/SDL/src/dialog", "unix", true, true);
Module['FS_createPath']("/external/SDL/src/dialog", "windows", true, true);
Module['FS_createPath']("/external/SDL/src", "dynapi", true, true);
Module['FS_createPath']("/external/SDL/src", "events", true, true);
Module['FS_createPath']("/external/SDL/src", "filesystem", true, true);
Module['FS_createPath']("/external/SDL/src/filesystem", "android", true, true);
Module['FS_createPath']("/external/SDL/src/filesystem", "cocoa", true, true);
Module['FS_createPath']("/external/SDL/src/filesystem", "dos", true, true);
Module['FS_createPath']("/external/SDL/src/filesystem", "dummy", true, true);
Module['FS_createPath']("/external/SDL/src/filesystem", "emscripten", true, true);
Module['FS_createPath']("/external/SDL/src/filesystem", "gdk", true, true);
Module['FS_createPath']("/external/SDL/src/filesystem", "haiku", true, true);
Module['FS_createPath']("/external/SDL/src/filesystem", "n3ds", true, true);
Module['FS_createPath']("/external/SDL/src/filesystem", "ngage", true, true);
Module['FS_createPath']("/external/SDL/src/filesystem", "openharmony", true, true);
Module['FS_createPath']("/external/SDL/src/filesystem", "posix", true, true);
Module['FS_createPath']("/external/SDL/src/filesystem", "ps2", true, true);
Module['FS_createPath']("/external/SDL/src/filesystem", "psp", true, true);
Module['FS_createPath']("/external/SDL/src/filesystem", "riscos", true, true);
Module['FS_createPath']("/external/SDL/src/filesystem", "unix", true, true);
Module['FS_createPath']("/external/SDL/src/filesystem", "vita", true, true);
Module['FS_createPath']("/external/SDL/src/filesystem", "windows", true, true);
Module['FS_createPath']("/external/SDL/src", "gpu", true, true);
Module['FS_createPath']("/external/SDL/src/gpu", "d3d12", true, true);
Module['FS_createPath']("/external/SDL/src/gpu", "metal", true, true);
Module['FS_createPath']("/external/SDL/src/gpu", "vulkan", true, true);
Module['FS_createPath']("/external/SDL/src/gpu", "xr", true, true);
Module['FS_createPath']("/external/SDL/src", "haptic", true, true);
Module['FS_createPath']("/external/SDL/src/haptic", "android", true, true);
Module['FS_createPath']("/external/SDL/src/haptic", "darwin", true, true);
Module['FS_createPath']("/external/SDL/src/haptic", "dummy", true, true);
Module['FS_createPath']("/external/SDL/src/haptic", "hidapi", true, true);
Module['FS_createPath']("/external/SDL/src/haptic", "linux", true, true);
Module['FS_createPath']("/external/SDL/src/haptic", "windows", true, true);
Module['FS_createPath']("/external/SDL/src", "hidapi", true, true);
Module['FS_createPath']("/external/SDL/src/hidapi", "android", true, true);
Module['FS_createPath']("/external/SDL/src/hidapi", "dist", true, true);
Module['FS_createPath']("/external/SDL/src/hidapi", "documentation", true, true);
Module['FS_createPath']("/external/SDL/src/hidapi", "doxygen", true, true);
Module['FS_createPath']("/external/SDL/src/hidapi", "hidapi", true, true);
Module['FS_createPath']("/external/SDL/src/hidapi", "hidtest", true, true);
Module['FS_createPath']("/external/SDL/src/hidapi", "ios", true, true);
Module['FS_createPath']("/external/SDL/src/hidapi", "libusb", true, true);
Module['FS_createPath']("/external/SDL/src/hidapi", "linux", true, true);
Module['FS_createPath']("/external/SDL/src/hidapi", "m4", true, true);
Module['FS_createPath']("/external/SDL/src/hidapi", "mac", true, true);
Module['FS_createPath']("/external/SDL/src/hidapi", "netbsd", true, true);
Module['FS_createPath']("/external/SDL/src/hidapi", "pc", true, true);
Module['FS_createPath']("/external/SDL/src/hidapi", "src", true, true);
Module['FS_createPath']("/external/SDL/src/hidapi/src", "cmake", true, true);
Module['FS_createPath']("/external/SDL/src/hidapi", "subprojects", true, true);
Module['FS_createPath']("/external/SDL/src/hidapi/subprojects", "hidapi_build_cmake", true, true);
Module['FS_createPath']("/external/SDL/src/hidapi", "testgui", true, true);
Module['FS_createPath']("/external/SDL/src/hidapi/testgui", "TestGUI.app.in", true, true);
Module['FS_createPath']("/external/SDL/src/hidapi/testgui/TestGUI.app.in", "Contents", true, true);
Module['FS_createPath']("/external/SDL/src/hidapi/testgui/TestGUI.app.in/Contents", "Resources", true, true);
Module['FS_createPath']("/external/SDL/src/hidapi/testgui/TestGUI.app.in/Contents/Resources", "English.lproj", true, true);
Module['FS_createPath']("/external/SDL/src/hidapi", "udev", true, true);
Module['FS_createPath']("/external/SDL/src/hidapi", "windows", true, true);
Module['FS_createPath']("/external/SDL/src/hidapi/windows", "pp_data_dump", true, true);
Module['FS_createPath']("/external/SDL/src/hidapi/windows", "test", true, true);
Module['FS_createPath']("/external/SDL/src/hidapi/windows/test", "data", true, true);
Module['FS_createPath']("/external/SDL/src", "io", true, true);
Module['FS_createPath']("/external/SDL/src/io", "generic", true, true);
Module['FS_createPath']("/external/SDL/src/io", "io_uring", true, true);
Module['FS_createPath']("/external/SDL/src/io", "n3ds", true, true);
Module['FS_createPath']("/external/SDL/src/io", "windows", true, true);
Module['FS_createPath']("/external/SDL/src", "joystick", true, true);
Module['FS_createPath']("/external/SDL/src/joystick", "android", true, true);
Module['FS_createPath']("/external/SDL/src/joystick", "apple", true, true);
Module['FS_createPath']("/external/SDL/src/joystick", "bsd", true, true);
Module['FS_createPath']("/external/SDL/src/joystick", "darwin", true, true);
Module['FS_createPath']("/external/SDL/src/joystick", "dos", true, true);
Module['FS_createPath']("/external/SDL/src/joystick", "dummy", true, true);
Module['FS_createPath']("/external/SDL/src/joystick", "emscripten", true, true);
Module['FS_createPath']("/external/SDL/src/joystick", "gdk", true, true);
Module['FS_createPath']("/external/SDL/src/joystick", "haiku", true, true);
Module['FS_createPath']("/external/SDL/src/joystick", "hidapi", true, true);
Module['FS_createPath']("/external/SDL/src/joystick/hidapi", "steam", true, true);
Module['FS_createPath']("/external/SDL/src/joystick", "linux", true, true);
Module['FS_createPath']("/external/SDL/src/joystick", "n3ds", true, true);
Module['FS_createPath']("/external/SDL/src/joystick", "ps2", true, true);
Module['FS_createPath']("/external/SDL/src/joystick", "psp", true, true);
Module['FS_createPath']("/external/SDL/src/joystick", "virtual", true, true);
Module['FS_createPath']("/external/SDL/src/joystick", "vita", true, true);
Module['FS_createPath']("/external/SDL/src/joystick", "windows", true, true);
Module['FS_createPath']("/external/SDL/src", "libm", true, true);
Module['FS_createPath']("/external/SDL/src", "loadso", true, true);
Module['FS_createPath']("/external/SDL/src/loadso", "dlopen", true, true);
Module['FS_createPath']("/external/SDL/src/loadso", "dummy", true, true);
Module['FS_createPath']("/external/SDL/src/loadso", "windows", true, true);
Module['FS_createPath']("/external/SDL/src", "locale", true, true);
Module['FS_createPath']("/external/SDL/src/locale", "android", true, true);
Module['FS_createPath']("/external/SDL/src/locale", "dummy", true, true);
Module['FS_createPath']("/external/SDL/src/locale", "emscripten", true, true);
Module['FS_createPath']("/external/SDL/src/locale", "haiku", true, true);
Module['FS_createPath']("/external/SDL/src/locale", "macos", true, true);
Module['FS_createPath']("/external/SDL/src/locale", "n3ds", true, true);
Module['FS_createPath']("/external/SDL/src/locale", "ngage", true, true);
Module['FS_createPath']("/external/SDL/src/locale", "openharmony", true, true);
Module['FS_createPath']("/external/SDL/src/locale", "psp", true, true);
Module['FS_createPath']("/external/SDL/src/locale", "unix", true, true);
Module['FS_createPath']("/external/SDL/src/locale", "vita", true, true);
Module['FS_createPath']("/external/SDL/src/locale", "windows", true, true);
Module['FS_createPath']("/external/SDL/src", "main", true, true);
Module['FS_createPath']("/external/SDL/src/main", "dos", true, true);
Module['FS_createPath']("/external/SDL/src/main", "emscripten", true, true);
Module['FS_createPath']("/external/SDL/src/main", "gdk", true, true);
Module['FS_createPath']("/external/SDL/src/main", "generic", true, true);
Module['FS_createPath']("/external/SDL/src/main", "ios", true, true);
Module['FS_createPath']("/external/SDL/src/main", "n3ds", true, true);
Module['FS_createPath']("/external/SDL/src/main", "ngage", true, true);
Module['FS_createPath']("/external/SDL/src/main", "openharmony", true, true);
Module['FS_createPath']("/external/SDL/src/main", "ps2", true, true);
Module['FS_createPath']("/external/SDL/src/main", "psp", true, true);
Module['FS_createPath']("/external/SDL/src/main", "windows", true, true);
Module['FS_createPath']("/external/SDL/src", "misc", true, true);
Module['FS_createPath']("/external/SDL/src/misc", "android", true, true);
Module['FS_createPath']("/external/SDL/src/misc", "dummy", true, true);
Module['FS_createPath']("/external/SDL/src/misc", "emscripten", true, true);
Module['FS_createPath']("/external/SDL/src/misc", "haiku", true, true);
Module['FS_createPath']("/external/SDL/src/misc", "ios", true, true);
Module['FS_createPath']("/external/SDL/src/misc", "macos", true, true);
Module['FS_createPath']("/external/SDL/src/misc", "openharmony", true, true);
Module['FS_createPath']("/external/SDL/src/misc", "riscos", true, true);
Module['FS_createPath']("/external/SDL/src/misc", "unix", true, true);
Module['FS_createPath']("/external/SDL/src/misc", "vita", true, true);
Module['FS_createPath']("/external/SDL/src/misc", "windows", true, true);
Module['FS_createPath']("/external/SDL/src", "notification", true, true);
Module['FS_createPath']("/external/SDL/src/notification", "cocoa", true, true);
Module['FS_createPath']("/external/SDL/src/notification", "dummy", true, true);
Module['FS_createPath']("/external/SDL/src/notification", "unix", true, true);
Module['FS_createPath']("/external/SDL/src/notification", "windows", true, true);
Module['FS_createPath']("/external/SDL/src", "power", true, true);
Module['FS_createPath']("/external/SDL/src/power", "android", true, true);
Module['FS_createPath']("/external/SDL/src/power", "emscripten", true, true);
Module['FS_createPath']("/external/SDL/src/power", "haiku", true, true);
Module['FS_createPath']("/external/SDL/src/power", "linux", true, true);
Module['FS_createPath']("/external/SDL/src/power", "macos", true, true);
Module['FS_createPath']("/external/SDL/src/power", "n3ds", true, true);
Module['FS_createPath']("/external/SDL/src/power", "openharmony", true, true);
Module['FS_createPath']("/external/SDL/src/power", "psp", true, true);
Module['FS_createPath']("/external/SDL/src/power", "uikit", true, true);
Module['FS_createPath']("/external/SDL/src/power", "vita", true, true);
Module['FS_createPath']("/external/SDL/src/power", "windows", true, true);
Module['FS_createPath']("/external/SDL/src", "process", true, true);
Module['FS_createPath']("/external/SDL/src/process", "dummy", true, true);
Module['FS_createPath']("/external/SDL/src/process", "posix", true, true);
Module['FS_createPath']("/external/SDL/src/process", "windows", true, true);
Module['FS_createPath']("/external/SDL/src", "render", true, true);
Module['FS_createPath']("/external/SDL/src/render", "direct3d", true, true);
Module['FS_createPath']("/external/SDL/src/render", "direct3d11", true, true);
Module['FS_createPath']("/external/SDL/src/render", "direct3d12", true, true);
Module['FS_createPath']("/external/SDL/src/render", "gpu", true, true);
Module['FS_createPath']("/external/SDL/src/render/gpu", "shaders", true, true);
Module['FS_createPath']("/external/SDL/src/render", "metal", true, true);
Module['FS_createPath']("/external/SDL/src/render", "ngage", true, true);
Module['FS_createPath']("/external/SDL/src/render", "opengl", true, true);
Module['FS_createPath']("/external/SDL/src/render", "opengles", true, true);
Module['FS_createPath']("/external/SDL/src/render", "opengles2", true, true);
Module['FS_createPath']("/external/SDL/src/render", "ps2", true, true);
Module['FS_createPath']("/external/SDL/src/render", "psp", true, true);
Module['FS_createPath']("/external/SDL/src/render", "software", true, true);
Module['FS_createPath']("/external/SDL/src/render", "vitagxm", true, true);
Module['FS_createPath']("/external/SDL/src/render/vitagxm", "shader_src", true, true);
Module['FS_createPath']("/external/SDL/src/render", "vulkan", true, true);
Module['FS_createPath']("/external/SDL/src", "sensor", true, true);
Module['FS_createPath']("/external/SDL/src/sensor", "android", true, true);
Module['FS_createPath']("/external/SDL/src/sensor", "coremotion", true, true);
Module['FS_createPath']("/external/SDL/src/sensor", "dummy", true, true);
Module['FS_createPath']("/external/SDL/src/sensor", "emscripten", true, true);
Module['FS_createPath']("/external/SDL/src/sensor", "n3ds", true, true);
Module['FS_createPath']("/external/SDL/src/sensor", "vita", true, true);
Module['FS_createPath']("/external/SDL/src/sensor", "windows", true, true);
Module['FS_createPath']("/external/SDL/src", "stdlib", true, true);
Module['FS_createPath']("/external/SDL/src", "storage", true, true);
Module['FS_createPath']("/external/SDL/src/storage", "generic", true, true);
Module['FS_createPath']("/external/SDL/src/storage", "steam", true, true);
Module['FS_createPath']("/external/SDL/src", "test", true, true);
Module['FS_createPath']("/external/SDL/src", "thread", true, true);
Module['FS_createPath']("/external/SDL/src/thread", "dos", true, true);
Module['FS_createPath']("/external/SDL/src/thread", "generic", true, true);
Module['FS_createPath']("/external/SDL/src/thread", "n3ds", true, true);
Module['FS_createPath']("/external/SDL/src/thread", "ps2", true, true);
Module['FS_createPath']("/external/SDL/src/thread", "psp", true, true);
Module['FS_createPath']("/external/SDL/src/thread", "pthread", true, true);
Module['FS_createPath']("/external/SDL/src/thread", "vita", true, true);
Module['FS_createPath']("/external/SDL/src/thread", "windows", true, true);
Module['FS_createPath']("/external/SDL/src", "time", true, true);
Module['FS_createPath']("/external/SDL/src/time", "dummy", true, true);
Module['FS_createPath']("/external/SDL/src/time", "n3ds", true, true);
Module['FS_createPath']("/external/SDL/src/time", "ngage", true, true);
Module['FS_createPath']("/external/SDL/src/time", "psp", true, true);
Module['FS_createPath']("/external/SDL/src/time", "unix", true, true);
Module['FS_createPath']("/external/SDL/src/time", "vita", true, true);
Module['FS_createPath']("/external/SDL/src/time", "windows", true, true);
Module['FS_createPath']("/external/SDL/src", "timer", true, true);
Module['FS_createPath']("/external/SDL/src/timer", "dos", true, true);
Module['FS_createPath']("/external/SDL/src/timer", "haiku", true, true);
Module['FS_createPath']("/external/SDL/src/timer", "n3ds", true, true);
Module['FS_createPath']("/external/SDL/src/timer", "ngage", true, true);
Module['FS_createPath']("/external/SDL/src/timer", "ps2", true, true);
Module['FS_createPath']("/external/SDL/src/timer", "psp", true, true);
Module['FS_createPath']("/external/SDL/src/timer", "unix", true, true);
Module['FS_createPath']("/external/SDL/src/timer", "vita", true, true);
Module['FS_createPath']("/external/SDL/src/timer", "windows", true, true);
Module['FS_createPath']("/external/SDL/src", "tray", true, true);
Module['FS_createPath']("/external/SDL/src/tray", "cocoa", true, true);
Module['FS_createPath']("/external/SDL/src/tray", "dummy", true, true);
Module['FS_createPath']("/external/SDL/src/tray", "unix", true, true);
Module['FS_createPath']("/external/SDL/src/tray", "windows", true, true);
Module['FS_createPath']("/external/SDL/src", "video", true, true);
Module['FS_createPath']("/external/SDL/src/video", "android", true, true);
Module['FS_createPath']("/external/SDL/src/video", "arm", true, true);
Module['FS_createPath']("/external/SDL/src/video", "cocoa", true, true);
Module['FS_createPath']("/external/SDL/src/video", "directx", true, true);
Module['FS_createPath']("/external/SDL/src/video", "dos", true, true);
Module['FS_createPath']("/external/SDL/src/video", "dummy", true, true);
Module['FS_createPath']("/external/SDL/src/video", "emscripten", true, true);
Module['FS_createPath']("/external/SDL/src/video", "gdk", true, true);
Module['FS_createPath']("/external/SDL/src/video", "haiku", true, true);
Module['FS_createPath']("/external/SDL/src/video", "khronos", true, true);
Module['FS_createPath']("/external/SDL/src/video/khronos", "EGL", true, true);
Module['FS_createPath']("/external/SDL/src/video/khronos", "GLES", true, true);
Module['FS_createPath']("/external/SDL/src/video/khronos", "GLES2", true, true);
Module['FS_createPath']("/external/SDL/src/video/khronos", "GLES3", true, true);
Module['FS_createPath']("/external/SDL/src/video/khronos", "KHR", true, true);
Module['FS_createPath']("/external/SDL/src/video/khronos", "openxr", true, true);
Module['FS_createPath']("/external/SDL/src/video/khronos", "vk_video", true, true);
Module['FS_createPath']("/external/SDL/src/video/khronos", "vulkan", true, true);
Module['FS_createPath']("/external/SDL/src/video", "kmsdrm", true, true);
Module['FS_createPath']("/external/SDL/src/video", "n3ds", true, true);
Module['FS_createPath']("/external/SDL/src/video", "ngage", true, true);
Module['FS_createPath']("/external/SDL/src/video", "offscreen", true, true);
Module['FS_createPath']("/external/SDL/src/video", "openharmony", true, true);
Module['FS_createPath']("/external/SDL/src/video", "openvr", true, true);
Module['FS_createPath']("/external/SDL/src/video", "ps2", true, true);
Module['FS_createPath']("/external/SDL/src/video", "psp", true, true);
Module['FS_createPath']("/external/SDL/src/video", "qnx", true, true);
Module['FS_createPath']("/external/SDL/src/video", "raspberry", true, true);
Module['FS_createPath']("/external/SDL/src/video", "riscos", true, true);
Module['FS_createPath']("/external/SDL/src/video", "uikit", true, true);
Module['FS_createPath']("/external/SDL/src/video", "vita", true, true);
Module['FS_createPath']("/external/SDL/src/video", "vivante", true, true);
Module['FS_createPath']("/external/SDL/src/video", "wayland", true, true);
Module['FS_createPath']("/external/SDL/src/video", "windows", true, true);
Module['FS_createPath']("/external/SDL/src/video", "x11", true, true);
Module['FS_createPath']("/external/SDL/src/video", "yuv2rgb", true, true);
Module['FS_createPath']("/external/SDL", "test", true, true);
Module['FS_createPath']("/external/SDL/test", "android", true, true);
Module['FS_createPath']("/external/SDL/test/android", "cmake", true, true);
Module['FS_createPath']("/external/SDL/test/android/cmake", "res", true, true);
Module['FS_createPath']("/external/SDL/test/android/cmake/res", "values", true, true);
Module['FS_createPath']("/external/SDL/test/android/cmake/res", "xml", true, true);
Module['FS_createPath']("/external/SDL/test/android", "res", true, true);
Module['FS_createPath']("/external/SDL/test/android/res", "drawable", true, true);
Module['FS_createPath']("/external/SDL/test/android/res", "layout", true, true);
Module['FS_createPath']("/external/SDL/test/android/res", "mipmap-anydpi-v26", true, true);
Module['FS_createPath']("/external/SDL/test/android/res", "mipmap-hdpi", true, true);
Module['FS_createPath']("/external/SDL/test/android/res", "mipmap-mdpi", true, true);
Module['FS_createPath']("/external/SDL/test/android/res", "mipmap-xhdpi", true, true);
Module['FS_createPath']("/external/SDL/test/android/res", "mipmap-xxhdpi", true, true);
Module['FS_createPath']("/external/SDL/test/android/res", "mipmap-xxxhdpi", true, true);
Module['FS_createPath']("/external/SDL/test/android/res", "values", true, true);
Module['FS_createPath']("/external/SDL/test", "emscripten", true, true);
Module['FS_createPath']("/external/SDL/test", "n3ds", true, true);
Module['FS_createPath']("/external/SDL/test", "testgpu", true, true);
Module['FS_createPath']("/external/SDL/test", "unix", true, true);
Module['FS_createPath']("/external/SDL/test", "win32", true, true);
Module['FS_createPath']("/external/SDL", "wayland-protocols", true, true);
Module['FS_createPath']("/external", "SDL_image", true, true);
Module['FS_createPath']("/external/SDL_image", ".github", true, true);
Module['FS_createPath']("/external/SDL_image/.github", "actions", true, true);
Module['FS_createPath']("/external/SDL_image/.github/actions", "setup-ninja", true, true);
Module['FS_createPath']("/external/SDL_image/.github", "workflows", true, true);
Module['FS_createPath']("/external/SDL_image", "VisualC", true, true);
Module['FS_createPath']("/external/SDL_image/VisualC", "external", true, true);
Module['FS_createPath']("/external/SDL_image/VisualC/external", "include", true, true);
Module['FS_createPath']("/external/SDL_image/VisualC/external/include", "avif", true, true);
Module['FS_createPath']("/external/SDL_image/VisualC/external/include", "webp", true, true);
Module['FS_createPath']("/external/SDL_image/VisualC/external", "optional", true, true);
Module['FS_createPath']("/external/SDL_image/VisualC/external/optional", "x64", true, true);
Module['FS_createPath']("/external/SDL_image/VisualC/external/optional", "x86", true, true);
Module['FS_createPath']("/external/SDL_image/VisualC", "showanim", true, true);
Module['FS_createPath']("/external/SDL_image/VisualC", "showimage", true, true);
Module['FS_createPath']("/external/SDL_image", "Xcode", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode", "SDL_image.xcodeproj", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode", "avif", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode/avif", "aom", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode/avif/aom", "arm64", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode/avif/aom/arm64", "config", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode/avif/aom", "x86_64", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode/avif/aom/x86_64", "config", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode/avif", "avif.xcodeproj", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode/avif", "dav1d", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode/avif/dav1d", "arm64", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode/avif/dav1d", "armv7", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode/avif/dav1d", "x86_64", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode", "iOS", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode/iOS", "SDL3.framework", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode/iOS/SDL3.framework", "Headers", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode", "jxl", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode/jxl", "jxl.xcodeproj", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode/jxl", "jxl", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode", "macOS", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode/macOS", "SDL3.framework", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode/macOS/SDL3.framework", "Versions", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode/macOS/SDL3.framework/Versions", "A", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A", "Headers", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A", "Resources", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode", "pkg-support", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode/pkg-support", "resources", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode/pkg-support/resources", "CMake", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode/pkg-support/resources", "framework", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode/pkg-support/resources", "share", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode/pkg-support/resources/share", "cmake", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode/pkg-support/resources/share/cmake", "SDL3_image", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode", "png", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode/png", "libpng", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode/png", "png.xcodeproj", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode", "showanim", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode/showanim", "macOS", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode/showanim", "showanim.xcodeproj", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode", "showimage", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode/showimage", "macOS", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode/showimage", "showimage.xcodeproj", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode", "webp", true, true);
Module['FS_createPath']("/external/SDL_image/Xcode/webp", "webp.xcodeproj", true, true);
Module['FS_createPath']("/external/SDL_image", "build-scripts", true, true);
Module['FS_createPath']("/external/SDL_image/build-scripts", "pkg-support", true, true);
Module['FS_createPath']("/external/SDL_image/build-scripts/pkg-support", "android", true, true);
Module['FS_createPath']("/external/SDL_image/build-scripts/pkg-support/android", "aar", true, true);
Module['FS_createPath']("/external/SDL_image/build-scripts/pkg-support/android/aar", "cmake", true, true);
Module['FS_createPath']("/external/SDL_image/build-scripts/pkg-support", "mingw", true, true);
Module['FS_createPath']("/external/SDL_image/build-scripts/pkg-support/mingw", "cmake", true, true);
Module['FS_createPath']("/external/SDL_image/build-scripts/pkg-support", "msvc", true, true);
Module['FS_createPath']("/external/SDL_image/build-scripts/pkg-support/msvc", "arm64", true, true);
Module['FS_createPath']("/external/SDL_image/build-scripts/pkg-support/msvc", "cmake", true, true);
Module['FS_createPath']("/external/SDL_image/build-scripts/pkg-support/msvc", "x64", true, true);
Module['FS_createPath']("/external/SDL_image/build-scripts/pkg-support/msvc", "x86", true, true);
Module['FS_createPath']("/external/SDL_image", "cmake", true, true);
Module['FS_createPath']("/external/SDL_image/cmake", "test", true, true);
Module['FS_createPath']("/external/SDL_image", "docs", true, true);
Module['FS_createPath']("/external/SDL_image", "examples", true, true);
Module['FS_createPath']("/external/SDL_image", "external", true, true);
Module['FS_createPath']("/external/SDL_image", "include", true, true);
Module['FS_createPath']("/external/SDL_image/include", "SDL3_image", true, true);
Module['FS_createPath']("/external/SDL_image", "src", true, true);
Module['FS_createPath']("/external/SDL_image", "test", true, true);
Module['FS_createPath']("/external", "SDL_mixer", true, true);
Module['FS_createPath']("/external/SDL_mixer", ".github", true, true);
Module['FS_createPath']("/external/SDL_mixer/.github", "actions", true, true);
Module['FS_createPath']("/external/SDL_mixer/.github/actions", "setup-ninja", true, true);
Module['FS_createPath']("/external/SDL_mixer/.github", "workflows", true, true);
Module['FS_createPath']("/external/SDL_mixer", "VisualC", true, true);
Module['FS_createPath']("/external/SDL_mixer/VisualC", "external", true, true);
Module['FS_createPath']("/external/SDL_mixer/VisualC/external", "include", true, true);
Module['FS_createPath']("/external/SDL_mixer/VisualC/external/include", "gme", true, true);
Module['FS_createPath']("/external/SDL_mixer/VisualC/external/include", "ogg", true, true);
Module['FS_createPath']("/external/SDL_mixer/VisualC/external/include", "opus", true, true);
Module['FS_createPath']("/external/SDL_mixer/VisualC/external/include", "wavpack", true, true);
Module['FS_createPath']("/external/SDL_mixer/VisualC/external", "optional", true, true);
Module['FS_createPath']("/external/SDL_mixer/VisualC/external/optional", "x64", true, true);
Module['FS_createPath']("/external/SDL_mixer/VisualC/external/optional", "x86", true, true);
Module['FS_createPath']("/external/SDL_mixer/VisualC", "timidity", true, true);
Module['FS_createPath']("/external/SDL_mixer", "Xcode", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode", "FLAC", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode/FLAC", "FLAC.xcodeproj", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode", "SDL_mixer.xcodeproj", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode", "gme", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode/gme", "gme.xcodeproj", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode", "iOS", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode/iOS", "SDL3.framework", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode/iOS/SDL3.framework", "Headers", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode", "macOS", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode/macOS", "SDL3.framework", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode/macOS/SDL3.framework", "Versions", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions", "A", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A", "Headers", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A", "Resources", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode", "mpg123", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode/mpg123", "arm64", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode/mpg123", "armv7", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode/mpg123", "mpg123.xcodeproj", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode/mpg123", "x86_64", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode", "ogg", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode/ogg", "ogg.xcodeproj", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode", "opus", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode/opus", "arm64", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode/opus", "armv7", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode/opus", "opus.xcodeproj", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode/opus", "x86_64", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode", "pkg-support", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode/pkg-support", "resources", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode/pkg-support/resources", "CMake", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode/pkg-support/resources", "framework", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode/pkg-support/resources", "share", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode/pkg-support/resources/share", "cmake", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode/pkg-support/resources/share/cmake", "SDL3_mixer", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode", "playmus", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode/playmus", "macOS", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode/playmus", "playmus.xcodeproj", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode", "playwave", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode/playwave", "macOS", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode/playwave", "playwave.xcodeproj", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode", "tremor", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode/tremor", "tremor.xcodeproj", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode", "vorbis", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode/vorbis", "vorbis.xcodeproj", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode", "wavpack", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode/wavpack", "wavpack.xcodeproj", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode", "xmp", true, true);
Module['FS_createPath']("/external/SDL_mixer/Xcode/xmp", "xmp.xcodeproj", true, true);
Module['FS_createPath']("/external/SDL_mixer", "build-scripts", true, true);
Module['FS_createPath']("/external/SDL_mixer/build-scripts", "pkg-support", true, true);
Module['FS_createPath']("/external/SDL_mixer/build-scripts/pkg-support", "android", true, true);
Module['FS_createPath']("/external/SDL_mixer/build-scripts/pkg-support/android", "aar", true, true);
Module['FS_createPath']("/external/SDL_mixer/build-scripts/pkg-support/android/aar", "cmake", true, true);
Module['FS_createPath']("/external/SDL_mixer/build-scripts/pkg-support", "mingw", true, true);
Module['FS_createPath']("/external/SDL_mixer/build-scripts/pkg-support/mingw", "cmake", true, true);
Module['FS_createPath']("/external/SDL_mixer/build-scripts/pkg-support", "msvc", true, true);
Module['FS_createPath']("/external/SDL_mixer/build-scripts/pkg-support/msvc", "arm64", true, true);
Module['FS_createPath']("/external/SDL_mixer/build-scripts/pkg-support/msvc", "cmake", true, true);
Module['FS_createPath']("/external/SDL_mixer/build-scripts/pkg-support/msvc", "x64", true, true);
Module['FS_createPath']("/external/SDL_mixer/build-scripts/pkg-support/msvc", "x86", true, true);
Module['FS_createPath']("/external/SDL_mixer", "cmake", true, true);
Module['FS_createPath']("/external/SDL_mixer/cmake", "test", true, true);
Module['FS_createPath']("/external/SDL_mixer", "docs", true, true);
Module['FS_createPath']("/external/SDL_mixer", "examples", true, true);
Module['FS_createPath']("/external/SDL_mixer/examples", "advanced", true, true);
Module['FS_createPath']("/external/SDL_mixer/examples/advanced", "01-tag-tracks", true, true);
Module['FS_createPath']("/external/SDL_mixer/examples", "basics", true, true);
Module['FS_createPath']("/external/SDL_mixer/examples/basics", "01-load-and-play", true, true);
Module['FS_createPath']("/external/SDL_mixer/examples/basics", "02-play-with-options", true, true);
Module['FS_createPath']("/external/SDL_mixer/examples/basics", "03-play-multiple-sounds", true, true);
Module['FS_createPath']("/external/SDL_mixer/examples/basics", "04-metadata", true, true);
Module['FS_createPath']("/external/SDL_mixer/examples/basics", "05-sinewave", true, true);
Module['FS_createPath']("/external/SDL_mixer/examples/basics", "06-seeking", true, true);
Module['FS_createPath']("/external/SDL_mixer", "external", true, true);
Module['FS_createPath']("/external/SDL_mixer", "include", true, true);
Module['FS_createPath']("/external/SDL_mixer/include", "SDL3_mixer", true, true);
Module['FS_createPath']("/external/SDL_mixer", "mingw", true, true);
Module['FS_createPath']("/external/SDL_mixer/mingw", "pkg-support", true, true);
Module['FS_createPath']("/external/SDL_mixer/mingw/pkg-support", "cmake", true, true);
Module['FS_createPath']("/external/SDL_mixer", "src", true, true);
Module['FS_createPath']("/external/SDL_mixer/src", "dr_libs", true, true);
Module['FS_createPath']("/external/SDL_mixer/src", "stb_vorbis", true, true);
Module['FS_createPath']("/external/SDL_mixer/src", "timidity", true, true);
Module['FS_createPath']("/external/SDL_mixer", "test", true, true);
Module['FS_createPath']("/external", "SDL_ttf", true, true);
Module['FS_createPath']("/external/SDL_ttf", ".github", true, true);
Module['FS_createPath']("/external/SDL_ttf/.github", "actions", true, true);
Module['FS_createPath']("/external/SDL_ttf/.github/actions", "setup-ninja", true, true);
Module['FS_createPath']("/external/SDL_ttf/.github", "workflows", true, true);
Module['FS_createPath']("/external/SDL_ttf", "VisualC", true, true);
Module['FS_createPath']("/external/SDL_ttf/VisualC", "glfont", true, true);
Module['FS_createPath']("/external/SDL_ttf/VisualC", "showfont", true, true);
Module['FS_createPath']("/external/SDL_ttf", "Xcode", true, true);
Module['FS_createPath']("/external/SDL_ttf/Xcode", "SDL_ttf.xcodeproj", true, true);
Module['FS_createPath']("/external/SDL_ttf/Xcode", "iOS", true, true);
Module['FS_createPath']("/external/SDL_ttf/Xcode/iOS", "SDL3.framework", true, true);
Module['FS_createPath']("/external/SDL_ttf/Xcode/iOS/SDL3.framework", "Headers", true, true);
Module['FS_createPath']("/external/SDL_ttf/Xcode", "macOS", true, true);
Module['FS_createPath']("/external/SDL_ttf/Xcode/macOS", "SDL3.framework", true, true);
Module['FS_createPath']("/external/SDL_ttf/Xcode/macOS/SDL3.framework", "Versions", true, true);
Module['FS_createPath']("/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions", "A", true, true);
Module['FS_createPath']("/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A", "Headers", true, true);
Module['FS_createPath']("/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A", "Resources", true, true);
Module['FS_createPath']("/external/SDL_ttf/Xcode", "pkg-support", true, true);
Module['FS_createPath']("/external/SDL_ttf/Xcode/pkg-support", "resources", true, true);
Module['FS_createPath']("/external/SDL_ttf/Xcode/pkg-support/resources", "CMake", true, true);
Module['FS_createPath']("/external/SDL_ttf/Xcode/pkg-support/resources", "framework", true, true);
Module['FS_createPath']("/external/SDL_ttf/Xcode/pkg-support", "share", true, true);
Module['FS_createPath']("/external/SDL_ttf/Xcode/pkg-support/share", "cmake", true, true);
Module['FS_createPath']("/external/SDL_ttf/Xcode/pkg-support/share/cmake", "SDL3_ttf", true, true);
Module['FS_createPath']("/external/SDL_ttf/Xcode", "showfont", true, true);
Module['FS_createPath']("/external/SDL_ttf/Xcode/showfont", "macOS", true, true);
Module['FS_createPath']("/external/SDL_ttf/Xcode/showfont", "showfont.xcodeproj", true, true);
Module['FS_createPath']("/external/SDL_ttf", "build-scripts", true, true);
Module['FS_createPath']("/external/SDL_ttf/build-scripts", "pkg-support", true, true);
Module['FS_createPath']("/external/SDL_ttf/build-scripts/pkg-support", "android", true, true);
Module['FS_createPath']("/external/SDL_ttf/build-scripts/pkg-support/android", "aar", true, true);
Module['FS_createPath']("/external/SDL_ttf/build-scripts/pkg-support/android/aar", "cmake", true, true);
Module['FS_createPath']("/external/SDL_ttf/build-scripts/pkg-support", "mingw", true, true);
Module['FS_createPath']("/external/SDL_ttf/build-scripts/pkg-support/mingw", "cmake", true, true);
Module['FS_createPath']("/external/SDL_ttf/build-scripts/pkg-support", "msvc", true, true);
Module['FS_createPath']("/external/SDL_ttf/build-scripts/pkg-support/msvc", "arm64", true, true);
Module['FS_createPath']("/external/SDL_ttf/build-scripts/pkg-support/msvc", "cmake", true, true);
Module['FS_createPath']("/external/SDL_ttf/build-scripts/pkg-support/msvc", "x64", true, true);
Module['FS_createPath']("/external/SDL_ttf/build-scripts/pkg-support/msvc", "x86", true, true);
Module['FS_createPath']("/external/SDL_ttf", "cmake", true, true);
Module['FS_createPath']("/external/SDL_ttf/cmake", "test", true, true);
Module['FS_createPath']("/external/SDL_ttf", "docs", true, true);
Module['FS_createPath']("/external/SDL_ttf", "examples", true, true);
Module['FS_createPath']("/external/SDL_ttf/examples", "testgputext", true, true);
Module['FS_createPath']("/external/SDL_ttf/examples/testgputext", "shaders", true, true);
Module['FS_createPath']("/external/SDL_ttf", "external", true, true);
Module['FS_createPath']("/external/SDL_ttf", "include", true, true);
Module['FS_createPath']("/external/SDL_ttf/include", "SDL3_ttf", true, true);
Module['FS_createPath']("/external/SDL_ttf", "mingw", true, true);
Module['FS_createPath']("/external/SDL_ttf/mingw", "pkg-support", true, true);
Module['FS_createPath']("/external/SDL_ttf/mingw/pkg-support", "cmake", true, true);
Module['FS_createPath']("/external/SDL_ttf", "src", true, true);
Module['FS_createPath']("/", "x64", true, true);
Module['FS_createPath']("/x64", "Debug", true, true);

      async function processPackageData(arrayBuffer) {
        assert(arrayBuffer, 'Loading data file failed.');
        assert(arrayBuffer.constructor.name === ArrayBuffer.name, 'bad input to processPackageData ' + arrayBuffer.constructor.name);
        var byteArray = new Uint8Array(arrayBuffer);
        var curr;
        // Reuse the bytearray from the XHR as the source for file reads.
          for (var file of metadata['files']) {
            var name = file['filename'];
            var data = byteArray.subarray(file['start'], file['end']);
            // canOwn this data in the filesystem, it is a slice into the heap that will never change
        Module['FS_createDataFile'](name, null, data, true, true, true);
          }
          Module['removeRunDependency']('datafile_index.data');
      }
      Module['addRunDependency']('datafile_index.data');

      if (!Module['preloadResults']) Module['preloadResults'] = {};

      Module['preloadResults'][PACKAGE_NAME] = {fromCache: false};
      if (!fetched) {
        fetched = await fetchPromise;
      }
      await processPackageData(fetched);

    }
    // Detect whether the module JS file has already been loaded.
    if (Module['FS_createPath']) {
      runWithFS(Module);
    } else {
      if (!Module['preRun']) Module['preRun'] = [];
      Module['preRun'].push(runWithFS); // FS is not initialized yet, wait for it
    }

    }
    loadPackage({"files": [{"filename": "/CMakeLists.txt", "start": 0, "end": 1339}, {"filename": "/GameObject.cpp", "start": 1339, "end": 1364}, {"filename": "/GameObject.h", "start": 1364, "end": 1427}, {"filename": "/SDL_WebBuild.slnx", "start": 1427, "end": 1636}, {"filename": "/SDL_WebBuild.vcxproj", "start": 1636, "end": 8812}, {"filename": "/SDL_WebBuild.vcxproj.filters", "start": 8812, "end": 10182}, {"filename": "/SDL_WebBuild.vcxproj.user", "start": 10182, "end": 10407}, {"filename": "/SDL_WebBuild/x64/Debug/GameObject.cpp.obj.dt.d.json", "start": 10407, "end": 10748}, {"filename": "/SDL_WebBuild/x64/Debug/GameObject.cpp.obj.dt.module.json", "start": 10748, "end": 11135}, {"filename": "/SDL_WebBuild/x64/Debug/GameObject.cpp.obj.dt.module.json.command", "start": 11135, "end": 15021}, {"filename": "/SDL_WebBuild/x64/Debug/GameObject.h.obj.dt.d.json", "start": 15021, "end": 15275}, {"filename": "/SDL_WebBuild/x64/Debug/GameObject.h.obj.dt.module.json", "start": 15275, "end": 15658}, {"filename": "/SDL_WebBuild/x64/Debug/GameObject.h.obj.dt.module.json.command", "start": 15658, "end": 19532}, {"filename": "/SDL_WebBuild/x64/Debug/GameObject.obj", "start": 19532, "end": 20895}, {"filename": "/SDL_WebBuild/x64/Debug/SDL_WebBuild.Build.CppClean.log", "start": 20895, "end": 22469}, {"filename": "/SDL_WebBuild/x64/Debug/SDL_WebBuild.exe.recipe", "start": 22469, "end": 22779}, {"filename": "/SDL_WebBuild/x64/Debug/SDL_WebBuild.ilk", "start": 22779, "end": 790975}, {"filename": "/SDL_WebBuild/x64/Debug/SDL_WebBuild.log", "start": 790975, "end": 791085}, {"filename": "/SDL_WebBuild/x64/Debug/SDL_WebBuild.tlog/CL.command.1.tlog", "start": 791085, "end": 793767}, {"filename": "/SDL_WebBuild/x64/Debug/SDL_WebBuild.tlog/CL.read.1.tlog", "start": 793767, "end": 826277}, {"filename": "/SDL_WebBuild/x64/Debug/SDL_WebBuild.tlog/CL.write.1.tlog", "start": 826277, "end": 827921}, {"filename": "/SDL_WebBuild/x64/Debug/SDL_WebBuild.tlog/Cl.items.tlog", "start": 827921, "end": 828181}, {"filename": "/SDL_WebBuild/x64/Debug/SDL_WebBuild.tlog/SDL_WebBuild.lastbuildstate", "start": 828181, "end": 828491}, {"filename": "/SDL_WebBuild/x64/Debug/SDL_WebBuild.tlog/SDL_WebBuild.write.1u.tlog", "start": 828491, "end": 828703}, {"filename": "/SDL_WebBuild/x64/Debug/SDL_WebBuild.tlog/link.command.1.tlog", "start": 828703, "end": 832909}, {"filename": "/SDL_WebBuild/x64/Debug/SDL_WebBuild.tlog/link.read.1.tlog", "start": 832909, "end": 839855}, {"filename": "/SDL_WebBuild/x64/Debug/SDL_WebBuild.tlog/link.secondary.1.tlog", "start": 839855, "end": 840091}, {"filename": "/SDL_WebBuild/x64/Debug/SDL_WebBuild.tlog/link.write.1.tlog", "start": 840091, "end": 840677}, {"filename": "/SDL_WebBuild/x64/Debug/SDL_WebBuild.vcxproj.FileListAbsolute.txt", "start": 840677, "end": 840896}, {"filename": "/SDL_WebBuild/x64/Debug/SDL_rect.h.obj.dt.d.json", "start": 840896, "end": 846919}, {"filename": "/SDL_WebBuild/x64/Debug/SDL_rect.h.obj.dt.module.json", "start": 846919, "end": 847296}, {"filename": "/SDL_WebBuild/x64/Debug/SDL_rect.h.obj.dt.module.json.command", "start": 847296, "end": 851164}, {"filename": "/SDL_WebBuild/x64/Debug/SDL_touch.h.obj.dt.d.json", "start": 851164, "end": 859399}, {"filename": "/SDL_WebBuild/x64/Debug/SDL_touch.h.obj.dt.module.json", "start": 859399, "end": 859779}, {"filename": "/SDL_WebBuild/x64/Debug/SDL_touch.h.obj.dt.module.json.command", "start": 859779, "end": 863653}, {"filename": "/SDL_WebBuild/x64/Debug/a.h.obj.dt.d.json", "start": 863653, "end": 863898}, {"filename": "/SDL_WebBuild/x64/Debug/a.h.obj.dt.module.json", "start": 863898, "end": 864254}, {"filename": "/SDL_WebBuild/x64/Debug/a.h.obj.dt.module.json.command", "start": 864254, "end": 868074}, {"filename": "/SDL_WebBuild/x64/Debug/main.cpp.obj.dt.d.json", "start": 868074, "end": 897397}, {"filename": "/SDL_WebBuild/x64/Debug/main.cpp.obj.dt.module.json", "start": 897397, "end": 897766}, {"filename": "/SDL_WebBuild/x64/Debug/main.cpp.obj.dt.module.json.command", "start": 897766, "end": 901616}, {"filename": "/SDL_WebBuild/x64/Debug/main.obj", "start": 901616, "end": 988596}, {"filename": "/SDL_WebBuild/x64/Debug/vc145.idb", "start": 988596, "end": 1368500}, {"filename": "/SDL_WebBuild/x64/Debug/vc145.pdb", "start": 1368500, "end": 1880500}, {"filename": "/SDL_WebBuild/x64/Debug/vcpkg.applocal.log", "start": 1880500, "end": 1880606}, {"filename": "/assets/sounds/009.wav", "start": 1880606, "end": 3291858}, {"filename": "/build-web/.ninja_deps", "start": 3291858, "end": 3541994}, {"filename": "/build-web/.ninja_lock", "start": 3541994, "end": 3541994}, {"filename": "/build-web/.ninja_log", "start": 3541994, "end": 3571592}, {"filename": "/build-web/CMakeCache.txt", "start": 3571592, "end": 3621345}, {"filename": "/build-web/CMakeFiles/4.3.1-msvc1/CMakeCCompiler.cmake", "start": 3621345, "end": 3624280}, {"filename": "/build-web/CMakeFiles/4.3.1-msvc1/CMakeCXXCompiler.cmake", "start": 3624280, "end": 3630467}, {"filename": "/build-web/CMakeFiles/4.3.1-msvc1/CMakeSystem.cmake", "start": 3630467, "end": 3630926}, {"filename": "/build-web/CMakeFiles/CMakeConfigureLog.yaml", "start": 3630926, "end": 4273289}, {"filename": "/build-web/CMakeFiles/InstallScripts.json", "start": 4273289, "end": 4273609}, {"filename": "/build-web/CMakeFiles/MyGame.dir/main.cpp.o", "start": 4273609, "end": 4276376}, {"filename": "/build-web/CMakeFiles/MyGame.dir/src/main.cpp.o", "start": 4276376, "end": 4293944}, {"filename": "/build-web/CMakeFiles/TargetDirectories.txt", "start": 4293944, "end": 4294845}, {"filename": "/build-web/CMakeFiles/VerifyGlobs.cmake", "start": 4294845, "end": 4428530}, {"filename": "/build-web/CMakeFiles/cmake.check_cache", "start": 4428530, "end": 4428616}, {"filename": "/build-web/CMakeFiles/cmake.verify_globs", "start": 4428616, "end": 4428694}, {"filename": "/build-web/CMakeFiles/rules.ninja", "start": 4428694, "end": 4435773}, {"filename": "/build-web/MyGame.data", "start": 4435773, "end": 223244956}, {"filename": "/build-web/build.ninja", "start": 223244956, "end": 223722635}, {"filename": "/build-web/cmake_install.cmake", "start": 223722635, "end": 223724740}, {"filename": "/build-web/external/SDL/CMakeFiles/CMakeTmp/SDL_detect_arch.c", "start": 223724740, "end": 223727752}, {"filename": "/build-web/external/SDL/CMakeFiles/CMakeTmp/SDL_detect_arch/bin", "start": 223727752, "end": 223730586}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/cmake_pch.h", "start": 223730586, "end": 223730728}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/cmake_pch.h.c", "start": 223730728, "end": 223730754}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/cmake_pch.h.pch", "start": 223730754, "end": 225380594}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/SDL.c.o", "start": 225380594, "end": 225395289}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/SDL_assert.c.o", "start": 225395289, "end": 225401914}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/SDL_error.c.o", "start": 225401914, "end": 225403666}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/SDL_guid.c.o", "start": 225403666, "end": 225405144}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/SDL_hashtable.c.o", "start": 225405144, "end": 225415631}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/SDL_hints.c.o", "start": 225415631, "end": 225422638}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/SDL_list.c.o", "start": 225422638, "end": 225424947}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/SDL_log.c.o", "start": 225424947, "end": 225436121}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/SDL_properties.c.o", "start": 225436121, "end": 225452319}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/SDL_utils.c.o", "start": 225452319, "end": 225467057}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/atomic/SDL_atomic.c.o", "start": 225467057, "end": 225468677}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/atomic/SDL_spinlock.c.o", "start": 225468677, "end": 225469437}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/audio/SDL_audio.c.o", "start": 225469437, "end": 225544867}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/audio/SDL_audiocvt.c.o", "start": 225544867, "end": 225599293}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/audio/SDL_audiodev.c.o", "start": 225599293, "end": 225599640}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/audio/SDL_audioqueue.c.o", "start": 225599640, "end": 225610854}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/audio/SDL_audioresample.c.o", "start": 225610854, "end": 225619941}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/audio/SDL_audiotypecvt.c.o", "start": 225619941, "end": 225626614}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/audio/SDL_mixer.c.o", "start": 225626614, "end": 225630406}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/audio/SDL_wave.c.o", "start": 225630406, "end": 225661836}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/audio/disk/SDL_diskaudio.c.o", "start": 225661836, "end": 225666847}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/audio/dummy/SDL_dummyaudio.c.o", "start": 225666847, "end": 225670056}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/audio/emscripten/SDL_emscriptenaudio.c.o", "start": 225670056, "end": 225680247}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/camera/SDL_camera.c.o", "start": 225680247, "end": 225718243}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/camera/dummy/SDL_camera_dummy.c.o", "start": 225718243, "end": 225719881}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/camera/emscripten/SDL_camera_emscripten.c.o", "start": 225719881, "end": 225727256}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/core/SDL_core_unsupported.c.o", "start": 225727256, "end": 225730155}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/cpuinfo/SDL_cpuinfo.c.o", "start": 225730155, "end": 225740683}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/dialog/SDL_dialog.c.o", "start": 225740683, "end": 225743767}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/dialog/SDL_dialog_utils.c.o", "start": 225743767, "end": 225748561}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/dialog/unix/SDL_portaldialog.c.o", "start": 225748561, "end": 225749355}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/dialog/unix/SDL_unixdialog.c.o", "start": 225749355, "end": 225751417}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/dialog/unix/SDL_zenitydialog.c.o", "start": 225751417, "end": 225760539}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/dialog/unix/SDL_zenitymessagebox.c.o", "start": 225760539, "end": 225766181}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/dynapi/SDL_dynapi.c.o", "start": 225766181, "end": 225766672}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/events/SDL_categories.c.o", "start": 225766672, "end": 225768838}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/events/SDL_clipboardevents.c.o", "start": 225768838, "end": 225769697}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/events/SDL_displayevents.c.o", "start": 225769697, "end": 225770771}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/events/SDL_dropevents.c.o", "start": 225770771, "end": 225773152}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/events/SDL_events.c.o", "start": 225773152, "end": 225837085}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/events/SDL_eventwatch.c.o", "start": 225837085, "end": 225839474}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/events/SDL_keyboard.c.o", "start": 225839474, "end": 225856230}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/events/SDL_keymap.c.o", "start": 225856230, "end": 225890992}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/events/SDL_keysym_to_keycode.c.o", "start": 225890992, "end": 225891339}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/events/SDL_keysym_to_scancode.c.o", "start": 225891339, "end": 225891686}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/events/SDL_mouse.c.o", "start": 225891686, "end": 225926239}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/events/SDL_notificationevents.c.o", "start": 225926239, "end": 225926997}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/events/SDL_pen.c.o", "start": 225926997, "end": 225943830}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/events/SDL_quit.c.o", "start": 225943830, "end": 225946069}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/events/SDL_scancode_tables.c.o", "start": 225946069, "end": 225946416}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/events/SDL_touch.c.o", "start": 225946416, "end": 225958007}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/events/SDL_windowevents.c.o", "start": 225958007, "end": 225964011}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/events/imKStoUCS.c.o", "start": 225964011, "end": 225964358}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/filesystem/SDL_filesystem.c.o", "start": 225964358, "end": 225980016}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/filesystem/emscripten/SDL_sysfilesystem.c.o", "start": 225980016, "end": 225982483}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/filesystem/posix/SDL_sysfsops.c.o", "start": 225982483, "end": 225987822}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/gpu/SDL_gpu.c.o", "start": 225987822, "end": 226121055}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/gpu/xr/SDL_gpu_openxr.c.o", "start": 226121055, "end": 226125338}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/gpu/xr/SDL_openxrdyn.c.o", "start": 226125338, "end": 226129890}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/haptic/SDL_haptic.c.o", "start": 226129890, "end": 226149926}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/haptic/dummy/SDL_syshaptic.c.o", "start": 226149926, "end": 226152429}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/hidapi/SDL_hidapi.c.o", "start": 226152429, "end": 226165378}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/io/SDL_asyncio.c.o", "start": 226165378, "end": 226174030}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/io/SDL_iostream.c.o", "start": 226174030, "end": 226198393}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/io/generic/SDL_asyncio_generic.c.o", "start": 226198393, "end": 226204832}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/SDL_gamepad.c.o", "start": 226204832, "end": 226290402}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/SDL_joystick.c.o", "start": 226290402, "end": 226380106}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/SDL_steam_virtual_gamepad.c.o", "start": 226380106, "end": 226384751}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/controller_type.c.o", "start": 226384751, "end": 226400289}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/emscripten/SDL_sysjoystick.c.o", "start": 226400289, "end": 226416846}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/virtual/SDL_virtualjoystick.c.o", "start": 226416846, "end": 226434760}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/e_atan2.c.o", "start": 226434760, "end": 226436396}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/e_exp.c.o", "start": 226436396, "end": 226438254}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/e_fmod.c.o", "start": 226438254, "end": 226440753}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/e_log.c.o", "start": 226440753, "end": 226442481}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/e_log10.c.o", "start": 226442481, "end": 226443450}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/e_pow.c.o", "start": 226443450, "end": 226448791}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/e_rem_pio2.c.o", "start": 226448791, "end": 226451831}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/e_sqrt.c.o", "start": 226451831, "end": 226453745}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/k_cos.c.o", "start": 226453745, "end": 226454716}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/k_rem_pio2.c.o", "start": 226454716, "end": 226461244}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/k_sin.c.o", "start": 226461244, "end": 226462068}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/k_tan.c.o", "start": 226462068, "end": 226463887}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/s_atan.c.o", "start": 226463887, "end": 226465784}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/s_copysign.c.o", "start": 226465784, "end": 226466363}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/s_cos.c.o", "start": 226466363, "end": 226467272}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/s_fabs.c.o", "start": 226467272, "end": 226467806}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/s_floor.c.o", "start": 226467806, "end": 226468969}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/s_isinf.c.o", "start": 226468969, "end": 226469545}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/s_isinff.c.o", "start": 226469545, "end": 226470116}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/s_isnan.c.o", "start": 226470116, "end": 226470702}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/s_isnanf.c.o", "start": 226470702, "end": 226471242}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/s_modf.c.o", "start": 226471242, "end": 226472361}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/s_scalbn.c.o", "start": 226472361, "end": 226473649}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/s_sin.c.o", "start": 226473649, "end": 226474560}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/s_tan.c.o", "start": 226474560, "end": 226475350}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/loadso/dlopen/SDL_sysloadso.c.o", "start": 226475350, "end": 226476783}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/locale/SDL_locale.c.o", "start": 226476783, "end": 226478669}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/locale/emscripten/SDL_syslocale.c.o", "start": 226478669, "end": 226480130}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/main/SDL_main_callbacks.c.o", "start": 226480130, "end": 226483554}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/main/SDL_runapp.c.o", "start": 226483554, "end": 226483901}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/main/emscripten/SDL_sysmain_callbacks.c.o", "start": 226483901, "end": 226486811}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/main/emscripten/SDL_sysmain_runapp.c.o", "start": 226486811, "end": 226488204}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/misc/SDL_libusb.c.o", "start": 226488204, "end": 226488551}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/misc/SDL_url.c.o", "start": 226488551, "end": 226490249}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/misc/emscripten/SDL_sysurl.c.o", "start": 226490249, "end": 226491027}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/notification/SDL_notification.c.o", "start": 226491027, "end": 226493071}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/notification/dummy/SDL_dummynotification.c.o", "start": 226493071, "end": 226493934}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/power/SDL_power.c.o", "start": 226493934, "end": 226494872}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/power/emscripten/SDL_syspower.c.o", "start": 226494872, "end": 226495788}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/process/SDL_process.c.o", "start": 226495788, "end": 226500647}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/process/posix/SDL_posixprocess.c.o", "start": 226500647, "end": 226511848}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render/SDL_render.c.o", "start": 226511848, "end": 226666226}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render/SDL_render_unsupported.c.o", "start": 226666226, "end": 226666573}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render/SDL_yuv_sw.c.o", "start": 226666573, "end": 226677189}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render/direct3d/SDL_render_d3d.c.o", "start": 226677189, "end": 226677536}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render/direct3d/SDL_shaders_d3d.c.o", "start": 226677536, "end": 226677883}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render/direct3d11/SDL_render_d3d11.c.o", "start": 226677883, "end": 226678230}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render/direct3d11/SDL_shaders_d3d11.c.o", "start": 226678230, "end": 226678577}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render/direct3d12/SDL_render_d3d12.c.o", "start": 226678577, "end": 226678924}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render/direct3d12/SDL_shaders_d3d12.c.o", "start": 226678924, "end": 226679271}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render/gpu/SDL_pipeline_gpu.c.o", "start": 226679271, "end": 226679618}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render/gpu/SDL_render_gpu.c.o", "start": 226679618, "end": 226679965}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render/gpu/SDL_shaders_gpu.c.o", "start": 226679965, "end": 226680312}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render/ngage/SDL_render_ngage.c.o", "start": 226680312, "end": 226680659}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render/opengl/SDL_render_gl.c.o", "start": 226680659, "end": 226681006}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render/opengl/SDL_shaders_gl.c.o", "start": 226681006, "end": 226681353}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render/opengles/SDL_render_gles.c.o", "start": 226681353, "end": 226681700}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render/opengles2/SDL_render_gles2.c.o", "start": 226681700, "end": 226738837}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render/opengles2/SDL_shaders_gles2.c.o", "start": 226738837, "end": 226758394}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render/ps2/SDL_render_ps2.c.o", "start": 226758394, "end": 226758741}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render/psp/SDL_render_psp.c.o", "start": 226758741, "end": 226759088}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render/software/SDL_blendfillrect.c.o", "start": 226759088, "end": 226945563}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render/software/SDL_blendline.c.o", "start": 226945563, "end": 227124447}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render/software/SDL_blendpoint.c.o", "start": 227124447, "end": 227151306}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render/software/SDL_drawline.c.o", "start": 227151306, "end": 227164014}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render/software/SDL_drawpoint.c.o", "start": 227164014, "end": 227166232}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render/software/SDL_render_sw.c.o", "start": 227166232, "end": 227192660}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render/software/SDL_triangle.c.o", "start": 227192660, "end": 227223919}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render/vitagxm/SDL_render_vita_gxm.c.o", "start": 227223919, "end": 227224266}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render/vitagxm/SDL_render_vita_gxm_memory.c.o", "start": 227224266, "end": 227224613}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render/vitagxm/SDL_render_vita_gxm_tools.c.o", "start": 227224613, "end": 227224960}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render/vulkan/SDL_render_vulkan.c.o", "start": 227224960, "end": 227225307}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/render/vulkan/SDL_shaders_vulkan.c.o", "start": 227225307, "end": 227225654}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/sensor/SDL_sensor.c.o", "start": 227225654, "end": 227237913}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/sensor/emscripten/SDL_emscriptensensor.c.o", "start": 227237913, "end": 227241291}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/stdlib/SDL_crc16.c.o", "start": 227241291, "end": 227242126}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/stdlib/SDL_crc32.c.o", "start": 227242126, "end": 227242888}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/stdlib/SDL_getenv.c.o", "start": 227242888, "end": 227249316}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/stdlib/SDL_iconv.c.o", "start": 227249316, "end": 227251293}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/stdlib/SDL_malloc.c.o", "start": 227251293, "end": 227254005}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/stdlib/SDL_memcpy.c.o", "start": 227254005, "end": 227254529}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/stdlib/SDL_memmove.c.o", "start": 227254529, "end": 227255054}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/stdlib/SDL_memset.c.o", "start": 227255054, "end": 227256074}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/stdlib/SDL_mslibc.c.o", "start": 227256074, "end": 227256421}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/stdlib/SDL_murmur3.c.o", "start": 227256421, "end": 227257643}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/stdlib/SDL_qsort.c.o", "start": 227257643, "end": 227270879}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/stdlib/SDL_random.c.o", "start": 227270879, "end": 227272364}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/stdlib/SDL_stdlib.c.o", "start": 227272364, "end": 227280332}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/stdlib/SDL_string.c.o", "start": 227280332, "end": 227325552}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/stdlib/SDL_strtokr.c.o", "start": 227325552, "end": 227326108}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/storage/SDL_storage.c.o", "start": 227326108, "end": 227336289}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/storage/generic/SDL_genericstorage.c.o", "start": 227336289, "end": 227342992}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/thread/SDL_thread.c.o", "start": 227342992, "end": 227354081}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/thread/generic/SDL_syscond.c.o", "start": 227354081, "end": 227355395}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/thread/generic/SDL_sysmutex.c.o", "start": 227355395, "end": 227356311}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/thread/generic/SDL_sysrwlock.c.o", "start": 227356311, "end": 227357553}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/thread/generic/SDL_syssem.c.o", "start": 227357553, "end": 227358439}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/thread/generic/SDL_systhread.c.o", "start": 227358439, "end": 227359374}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/thread/generic/SDL_systls.c.o", "start": 227359374, "end": 227360142}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/time/SDL_time.c.o", "start": 227360142, "end": 227365699}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/time/unix/SDL_systime.c.o", "start": 227365699, "end": 227368040}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/timer/SDL_timer.c.o", "start": 227368040, "end": 227373666}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/timer/unix/SDL_systimer.c.o", "start": 227373666, "end": 227375402}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/tray/SDL_tray_utils.c.o", "start": 227375402, "end": 227378308}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/tray/dummy/SDL_tray.c.o", "start": 227378308, "end": 227381315}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_RLEaccel.c.o", "start": 227381315, "end": 227424389}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_blit.c.o", "start": 227424389, "end": 227429756}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_blit_0.c.o", "start": 227429756, "end": 227480582}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_blit_1.c.o", "start": 227480582, "end": 227543170}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_blit_A.c.o", "start": 227543170, "end": 227694923}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_blit_N.c.o", "start": 227694923, "end": 227809259}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_blit_auto.c.o", "start": 227809259, "end": 228137260}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_blit_copy.c.o", "start": 228137260, "end": 228138341}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_blit_slow.c.o", "start": 228138341, "end": 228168229}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_bmp.c.o", "start": 228168229, "end": 228182287}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_clipboard.c.o", "start": 228182287, "end": 228190589}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_egl.c.o", "start": 228190589, "end": 228190936}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_fillrect.c.o", "start": 228190936, "end": 228195610}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_pixels.c.o", "start": 228195610, "end": 228229263}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_rect.c.o", "start": 228229263, "end": 228248177}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_rotate.c.o", "start": 228248177, "end": 228257783}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_stb.c.o", "start": 228257783, "end": 228391927}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_stretch.c.o", "start": 228391927, "end": 228401344}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_surface.c.o", "start": 228401344, "end": 228464542}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_video.c.o", "start": 228464542, "end": 228602428}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_video_unsupported.c.o", "start": 228602428, "end": 228603653}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_vulkan_utils.c.o", "start": 228603653, "end": 228604000}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_yuv.c.o", "start": 228604000, "end": 228662918}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/dummy/SDL_nullevents.c.o", "start": 228662918, "end": 228663390}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/dummy/SDL_nullframebuffer.c.o", "start": 228663390, "end": 228665453}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/dummy/SDL_nullvideo.c.o", "start": 228665453, "end": 228668003}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/emscripten/SDL_emscriptenevents.c.o", "start": 228668003, "end": 228704954}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/emscripten/SDL_emscriptenframebuffer.c.o", "start": 228704954, "end": 228707700}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/emscripten/SDL_emscriptenmouse.c.o", "start": 228707700, "end": 228713156}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/emscripten/SDL_emscriptenopengles.c.o", "start": 228713156, "end": 228716607}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/emscripten/SDL_emscriptenvideo.c.o", "start": 228716607, "end": 228735645}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/offscreen/SDL_offscreenevents.c.o", "start": 228735645, "end": 228736121}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/offscreen/SDL_offscreenframebuffer.c.o", "start": 228736121, "end": 228738212}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/offscreen/SDL_offscreenopengles.c.o", "start": 228738212, "end": 228738559}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/offscreen/SDL_offscreenvideo.c.o", "start": 228738559, "end": 228740773}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/offscreen/SDL_offscreenvulkan.c.o", "start": 228740773, "end": 228741120}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/offscreen/SDL_offscreenwindow.c.o", "start": 228741120, "end": 228742192}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/yuv2rgb/yuv_rgb_lsx.c.o", "start": 228742192, "end": 228742539}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/yuv2rgb/yuv_rgb_sse.c.o", "start": 228742539, "end": 228742886}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL3-static.dir/src/video/yuv2rgb/yuv_rgb_std.c.o", "start": 228742886, "end": 228798649}, {"filename": "/build-web/external/SDL/CMakeFiles/SDL_build_config.h.intermediate", "start": 228798649, "end": 228817439}, {"filename": "/build-web/external/SDL/CMakeFiles/dummy.sym", "start": 228817439, "end": 228817481}, {"filename": "/build-web/external/SDL/CMakeFiles/git-data/HEAD", "start": 228817481, "end": 228817502}, {"filename": "/build-web/external/SDL/CMakeFiles/git-data/grabRef.cmake", "start": 228817502, "end": 228820040}, {"filename": "/build-web/external/SDL/CMakeFiles/git-data/head-ref", "start": 228820040, "end": 228820081}, {"filename": "/build-web/external/SDL/SDL3Config.cmake", "start": 228820081, "end": 228823953}, {"filename": "/build-web/external/SDL/SDL3ConfigVersion.cmake", "start": 228823953, "end": 228825857}, {"filename": "/build-web/external/SDL/SDL3headersTargets.cmake", "start": 228825857, "end": 228828355}, {"filename": "/build-web/external/SDL/SDL3staticTargets.cmake", "start": 228828355, "end": 228832092}, {"filename": "/build-web/external/SDL/SDL3testTargets.cmake", "start": 228832092, "end": 228835700}, {"filename": "/build-web/external/SDL/cmake_install.cmake", "start": 228835700, "end": 228837206}, {"filename": "/build-web/external/SDL/include-config-/build_config/SDL_build_config.h", "start": 228837206, "end": 228855996}, {"filename": "/build-web/external/SDL/include-revision/SDL3/SDL_revision.h", "start": 228855996, "end": 228857350}, {"filename": "/build-web/external/SDL/libSDL3.a", "start": 228857350, "end": 232345784}, {"filename": "/build-web/external/SDL_mixer/CMakeFiles/SDL3_mixer-static.dir/src/SDL_mixer.c.o", "start": 232345784, "end": 232424529}, {"filename": "/build-web/external/SDL_mixer/CMakeFiles/SDL3_mixer-static.dir/src/SDL_mixer_metadata_tags.c.o", "start": 232424529, "end": 232450561}, {"filename": "/build-web/external/SDL_mixer/CMakeFiles/SDL3_mixer-static.dir/src/SDL_mixer_spatialization.c.o", "start": 232450561, "end": 232459608}, {"filename": "/build-web/external/SDL_mixer/CMakeFiles/SDL3_mixer-static.dir/src/decoder_aiff.c.o", "start": 232459608, "end": 232469828}, {"filename": "/build-web/external/SDL_mixer/CMakeFiles/SDL3_mixer-static.dir/src/decoder_au.c.o", "start": 232469828, "end": 232474294}, {"filename": "/build-web/external/SDL_mixer/CMakeFiles/SDL3_mixer-static.dir/src/decoder_drflac.c.o", "start": 232474294, "end": 232743972}, {"filename": "/build-web/external/SDL_mixer/CMakeFiles/SDL3_mixer-static.dir/src/decoder_drmp3.c.o", "start": 232743972, "end": 232826467}, {"filename": "/build-web/external/SDL_mixer/CMakeFiles/SDL3_mixer-static.dir/src/decoder_flac.c.o", "start": 232826467, "end": 232826814}, {"filename": "/build-web/external/SDL_mixer/CMakeFiles/SDL3_mixer-static.dir/src/decoder_fluidsynth.c.o", "start": 232826814, "end": 232827161}, {"filename": "/build-web/external/SDL_mixer/CMakeFiles/SDL3_mixer-static.dir/src/decoder_gme.c.o", "start": 232827161, "end": 232827508}, {"filename": "/build-web/external/SDL_mixer/CMakeFiles/SDL3_mixer-static.dir/src/decoder_mpg123.c.o", "start": 232827508, "end": 232827855}, {"filename": "/build-web/external/SDL_mixer/CMakeFiles/SDL3_mixer-static.dir/src/decoder_opus.c.o", "start": 232827855, "end": 232828202}, {"filename": "/build-web/external/SDL_mixer/CMakeFiles/SDL3_mixer-static.dir/src/decoder_raw.c.o", "start": 232828202, "end": 232832157}, {"filename": "/build-web/external/SDL_mixer/CMakeFiles/SDL3_mixer-static.dir/src/decoder_sinewave.c.o", "start": 232832157, "end": 232835454}, {"filename": "/build-web/external/SDL_mixer/CMakeFiles/SDL3_mixer-static.dir/src/decoder_stb_vorbis.c.o", "start": 232835454, "end": 232936780}, {"filename": "/build-web/external/SDL_mixer/CMakeFiles/SDL3_mixer-static.dir/src/decoder_timidity.c.o", "start": 232936780, "end": 232941238}, {"filename": "/build-web/external/SDL_mixer/CMakeFiles/SDL3_mixer-static.dir/src/decoder_voc.c.o", "start": 232941238, "end": 232952427}, {"filename": "/build-web/external/SDL_mixer/CMakeFiles/SDL3_mixer-static.dir/src/decoder_vorbis.c.o", "start": 232952427, "end": 232952774}, {"filename": "/build-web/external/SDL_mixer/CMakeFiles/SDL3_mixer-static.dir/src/decoder_wav.c.o", "start": 232952774, "end": 232984554}, {"filename": "/build-web/external/SDL_mixer/CMakeFiles/SDL3_mixer-static.dir/src/decoder_wavpack.c.o", "start": 232984554, "end": 232984901}, {"filename": "/build-web/external/SDL_mixer/CMakeFiles/SDL3_mixer-static.dir/src/decoder_xmp.c.o", "start": 232984901, "end": 232985248}, {"filename": "/build-web/external/SDL_mixer/CMakeFiles/SDL3_mixer-static.dir/src/timidity/common.c.o", "start": 232985248, "end": 232987010}, {"filename": "/build-web/external/SDL_mixer/CMakeFiles/SDL3_mixer-static.dir/src/timidity/instrum.c.o", "start": 232987010, "end": 232995737}, {"filename": "/build-web/external/SDL_mixer/CMakeFiles/SDL3_mixer-static.dir/src/timidity/mix.c.o", "start": 232995737, "end": 233004643}, {"filename": "/build-web/external/SDL_mixer/CMakeFiles/SDL3_mixer-static.dir/src/timidity/output.c.o", "start": 233004643, "end": 233006695}, {"filename": "/build-web/external/SDL_mixer/CMakeFiles/SDL3_mixer-static.dir/src/timidity/playmidi.c.o", "start": 233006695, "end": 233021804}, {"filename": "/build-web/external/SDL_mixer/CMakeFiles/SDL3_mixer-static.dir/src/timidity/readmidi.c.o", "start": 233021804, "end": 233031340}, {"filename": "/build-web/external/SDL_mixer/CMakeFiles/SDL3_mixer-static.dir/src/timidity/readsbk.c.o", "start": 233031340, "end": 233040542}, {"filename": "/build-web/external/SDL_mixer/CMakeFiles/SDL3_mixer-static.dir/src/timidity/resample.c.o", "start": 233040542, "end": 233048982}, {"filename": "/build-web/external/SDL_mixer/CMakeFiles/SDL3_mixer-static.dir/src/timidity/sndfont.c.o", "start": 233048982, "end": 233063162}, {"filename": "/build-web/external/SDL_mixer/CMakeFiles/SDL3_mixer-static.dir/src/timidity/tables.c.o", "start": 233063162, "end": 233068370}, {"filename": "/build-web/external/SDL_mixer/CMakeFiles/SDL3_mixer-static.dir/src/timidity/timidity.c.o", "start": 233068370, "end": 233083402}, {"filename": "/build-web/external/SDL_mixer/cmake_install.cmake", "start": 233083402, "end": 233084920}, {"filename": "/build-web/external/SDL_mixer/dummy.sym", "start": 233084920, "end": 233084962}, {"filename": "/build-web/external/SDL_mixer/libSDL3_mixer.a", "start": 233084962, "end": 233830806}, {"filename": "/build/.ninja_deps", "start": 233830806, "end": 233890014}, {"filename": "/build/.ninja_log", "start": 233890014, "end": 233924363}, {"filename": "/build/CMakeCache.txt", "start": 233924363, "end": 233959627}, {"filename": "/build/CMakeFiles/4.3.1-msvc1/CMakeCCompiler.cmake", "start": 233959627, "end": 233962957}, {"filename": "/build/CMakeFiles/4.3.1-msvc1/CMakeCXXCompiler.cmake", "start": 233962957, "end": 233969601}, {"filename": "/build/CMakeFiles/4.3.1-msvc1/CMakeDetermineCompilerABI_C.bin", "start": 233969601, "end": 234006977}, {"filename": "/build/CMakeFiles/4.3.1-msvc1/CMakeDetermineCompilerABI_CXX.bin", "start": 234006977, "end": 234044353}, {"filename": "/build/CMakeFiles/4.3.1-msvc1/CMakeRCCompiler.cmake", "start": 234044353, "end": 234044629}, {"filename": "/build/CMakeFiles/4.3.1-msvc1/CMakeSystem.cmake", "start": 234044629, "end": 234045024}, {"filename": "/build/CMakeFiles/4.3.1-msvc1/CompilerIdC/CMakeCCompilerId.c", "start": 234045024, "end": 234074626}, {"filename": "/build/CMakeFiles/4.3.1-msvc1/CompilerIdC/CMakeCCompilerId.exe", "start": 234074626, "end": 234164738}, {"filename": "/build/CMakeFiles/4.3.1-msvc1/CompilerIdC/CMakeCCompilerId.obj", "start": 234164738, "end": 234166299}, {"filename": "/build/CMakeFiles/4.3.1-msvc1/CompilerIdCXX/CMakeCXXCompilerId.cpp", "start": 234166299, "end": 234196728}, {"filename": "/build/CMakeFiles/4.3.1-msvc1/CompilerIdCXX/CMakeCXXCompilerId.exe", "start": 234196728, "end": 234286840}, {"filename": "/build/CMakeFiles/4.3.1-msvc1/CompilerIdCXX/CMakeCXXCompilerId.obj", "start": 234286840, "end": 234288448}, {"filename": "/build/CMakeFiles/CMakeConfigureLog.yaml", "start": 234288448, "end": 234569644}, {"filename": "/build/CMakeFiles/InstallScripts.json", "start": 234569644, "end": 234569860}, {"filename": "/build/CMakeFiles/MyGame.dir/embed.manifest", "start": 234569860, "end": 234570266}, {"filename": "/build/CMakeFiles/MyGame.dir/intermediate.manifest", "start": 234570266, "end": 234570647}, {"filename": "/build/CMakeFiles/MyGame.dir/manifest.rc", "start": 234570647, "end": 234570822}, {"filename": "/build/CMakeFiles/MyGame.dir/manifest.res", "start": 234570822, "end": 234571294}, {"filename": "/build/CMakeFiles/MyGame.dir/src/main.cpp.obj", "start": 234571294, "end": 234594162}, {"filename": "/build/CMakeFiles/MyGame.dir/vc140.pdb", "start": 234594162, "end": 234696562}, {"filename": "/build/CMakeFiles/ShowIncludes/foo.h", "start": 234696562, "end": 234696564}, {"filename": "/build/CMakeFiles/ShowIncludes/main.c", "start": 234696564, "end": 234696597}, {"filename": "/build/CMakeFiles/ShowIncludes/main.obj", "start": 234696597, "end": 234697225}, {"filename": "/build/CMakeFiles/TargetDirectories.txt", "start": 234697225, "end": 234697797}, {"filename": "/build/CMakeFiles/VerifyGlobs.cmake", "start": 234697797, "end": 234842521}, {"filename": "/build/CMakeFiles/cmake.check_cache", "start": 234842521, "end": 234842607}, {"filename": "/build/CMakeFiles/cmake.verify_globs", "start": 234842607, "end": 234842685}, {"filename": "/build/CMakeFiles/rules.ninja", "start": 234842685, "end": 234850813}, {"filename": "/build/MyGame.exe", "start": 234850813, "end": 240407037}, {"filename": "/build/MyGame.ilk", "start": 240407037, "end": 245585743}, {"filename": "/build/MyGame.pdb", "start": 245585743, "end": 258115407}, {"filename": "/build/build.ninja", "start": 258115407, "end": 258668885}, {"filename": "/build/cmake_install.cmake", "start": 258668885, "end": 258670826}, {"filename": "/build/external/SDL/CMakeFiles/CMakeTmp/SDL_detect_arch.c", "start": 258670826, "end": 258673838}, {"filename": "/build/external/SDL/CMakeFiles/CMakeTmp/SDL_detect_arch/bin", "start": 258673838, "end": 258678680}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/CXX.dd", "start": 258678680, "end": 258679204}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/CXXDependInfo.json", "start": 258679204, "end": 258681906}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/CXXModules.json", "start": 258681906, "end": 258681965}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/SDL3-static.pdb", "start": 258681965, "end": 261528685}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/cmake_pch.c", "start": 261528685, "end": 261528711}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/cmake_pch.c.obj", "start": 261528711, "end": 261561620}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/cmake_pch.c.pch", "start": 261561620, "end": 267132180}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/cmake_pch.cxx", "start": 267132180, "end": 267132206}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/cmake_pch.cxx.obj", "start": 267132206, "end": 267166356}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/cmake_pch.cxx.pch", "start": 267166356, "end": 274440852}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/cmake_pch.h", "start": 274440852, "end": 274440988}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/cmake_pch.hxx", "start": 274440988, "end": 274441167}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/SDL.c.obj", "start": 274441167, "end": 274490911}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/SDL_assert.c.obj", "start": 274490911, "end": 274522101}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/SDL_error.c.obj", "start": 274522101, "end": 274528042}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/SDL_guid.c.obj", "start": 274528042, "end": 274532656}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/SDL_hashtable.c.obj", "start": 274532656, "end": 274559921}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/SDL_hints.c.obj", "start": 274559921, "end": 274575955}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/SDL_list.c.obj", "start": 274575955, "end": 274582314}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/SDL_log.c.obj", "start": 274582314, "end": 274624822}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/SDL_properties.c.obj", "start": 274624822, "end": 274669603}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/SDL_utils.c.obj", "start": 274669603, "end": 274697565}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/atomic/SDL_atomic.c.obj", "start": 274697565, "end": 274704395}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/atomic/SDL_spinlock.c.obj", "start": 274704395, "end": 274719459}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/audio/SDL_audio.c.obj", "start": 274719459, "end": 274879771}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/audio/SDL_audiocvt.c.obj", "start": 274879771, "end": 275014189}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/audio/SDL_audiodev.c.obj", "start": 275014189, "end": 275015708}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/audio/SDL_audioqueue.c.obj", "start": 275015708, "end": 275041082}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/audio/SDL_audioresample.c.obj", "start": 275041082, "end": 275069020}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/audio/SDL_audiotypecvt.c.obj", "start": 275069020, "end": 275102476}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/audio/SDL_mixer.c.obj", "start": 275102476, "end": 275112317}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/audio/SDL_wave.c.obj", "start": 275112317, "end": 275170779}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/audio/directsound/SDL_directsound.c.obj", "start": 275170779, "end": 275235376}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/audio/disk/SDL_diskaudio.c.obj", "start": 275235376, "end": 275246479}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/audio/dummy/SDL_dummyaudio.c.obj", "start": 275246479, "end": 275252907}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/audio/wasapi/SDL_wasapi.c.obj", "start": 275252907, "end": 275338787}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/camera/SDL_camera.c.obj", "start": 275338787, "end": 275428510}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/camera/dummy/SDL_camera_dummy.c.obj", "start": 275428510, "end": 275435066}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/camera/mediafoundation/SDL_camera_mediafoundation.c.obj", "start": 275435066, "end": 275666813}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/core/SDL_core_unsupported.c.obj", "start": 275666813, "end": 275680560}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/core/windows/SDL_gameinput.cpp.obj", "start": 275680560, "end": 275720179}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/core/windows/SDL_gameinput.cpp.obj.ddi", "start": 275720179, "end": 275720778}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/core/windows/SDL_gameinput.cpp.obj.modmap", "start": 275720778, "end": 275720778}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/core/windows/SDL_hid.c.obj", "start": 275720778, "end": 275760448}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/core/windows/SDL_immdevice.c.obj", "start": 275760448, "end": 275821275}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/core/windows/SDL_windows.c.obj", "start": 275821275, "end": 275888887}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/core/windows/SDL_xinput.c.obj", "start": 275888887, "end": 275909248}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/core/windows/gameinput/gameinput.cpp.obj", "start": 275909248, "end": 275990018}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/core/windows/gameinput/gameinput.cpp.obj.ddi", "start": 275990018, "end": 275990631}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/core/windows/gameinput/gameinput.cpp.obj.modmap", "start": 275990631, "end": 275990631}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/core/windows/pch.c.obj", "start": 275990631, "end": 275992146}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/core/windows/pch_cpp.cpp.obj", "start": 275992146, "end": 275993730}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/core/windows/pch_cpp.cpp.obj.ddi", "start": 275993730, "end": 275994317}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/core/windows/pch_cpp.cpp.obj.modmap", "start": 275994317, "end": 275994317}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/cpuinfo/SDL_cpuinfo.c.obj", "start": 275994317, "end": 276033561}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/dialog/SDL_dialog.c.obj", "start": 276033561, "end": 276040949}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/dialog/SDL_dialog_utils.c.obj", "start": 276040949, "end": 276051539}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/dialog/windows/SDL_windowsdialog.c.obj", "start": 276051539, "end": 276124598}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/dynapi/SDL_dynapi.c.obj", "start": 276124598, "end": 277508780}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/events/SDL_categories.c.obj", "start": 277508780, "end": 277524765}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/events/SDL_clipboardevents.c.obj", "start": 277524765, "end": 277530307}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/events/SDL_displayevents.c.obj", "start": 277530307, "end": 277536325}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/events/SDL_dropevents.c.obj", "start": 277536325, "end": 277544933}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/events/SDL_events.c.obj", "start": 277544933, "end": 277665547}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/events/SDL_eventwatch.c.obj", "start": 277665547, "end": 277673763}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/events/SDL_keyboard.c.obj", "start": 277673763, "end": 277716635}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/events/SDL_keymap.c.obj", "start": 277716635, "end": 277786009}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/events/SDL_keysym_to_keycode.c.obj", "start": 277786009, "end": 277787548}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/events/SDL_keysym_to_scancode.c.obj", "start": 277787548, "end": 277789087}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/events/SDL_mouse.c.obj", "start": 277789087, "end": 277874858}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/events/SDL_notificationevents.c.obj", "start": 277874858, "end": 277880305}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/events/SDL_pen.c.obj", "start": 277880305, "end": 277917203}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/events/SDL_quit.c.obj", "start": 277917203, "end": 277926470}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/events/SDL_scancode_tables.c.obj", "start": 277926470, "end": 277928005}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/events/SDL_touch.c.obj", "start": 277928005, "end": 277956214}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/events/SDL_windowevents.c.obj", "start": 277956214, "end": 277974525}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/events/imKStoUCS.c.obj", "start": 277974525, "end": 277976040}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/filesystem/SDL_filesystem.c.obj", "start": 277976040, "end": 278010022}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/filesystem/windows/SDL_sysfilesystem.c.obj", "start": 278010022, "end": 278061317}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/filesystem/windows/SDL_sysfsops.c.obj", "start": 278061317, "end": 278087077}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/gpu/SDL_gpu.c.obj", "start": 278087077, "end": 278343338}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/gpu/d3d12/SDL_gpu_d3d12.c.obj", "start": 278343338, "end": 278747121}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/gpu/vulkan/SDL_gpu_vulkan.c.obj", "start": 278747121, "end": 279350011}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/gpu/xr/SDL_gpu_openxr.c.obj", "start": 279350011, "end": 279387375}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/gpu/xr/SDL_openxrdyn.c.obj", "start": 279387375, "end": 279424693}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/haptic/SDL_haptic.c.obj", "start": 279424693, "end": 279465655}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/haptic/hidapi/SDL_hidapihaptic.c.obj", "start": 279465655, "end": 279484825}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/haptic/hidapi/SDL_hidapihaptic_lg4ff.c.obj", "start": 279484825, "end": 279532756}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/haptic/windows/SDL_dinputhaptic.c.obj", "start": 279532756, "end": 279607845}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/haptic/windows/SDL_windowshaptic.c.obj", "start": 279607845, "end": 279655954}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/hidapi/SDL_hidapi.c.obj", "start": 279655954, "end": 279814337}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/io/SDL_asyncio.c.obj", "start": 279814337, "end": 279832494}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/io/SDL_iostream.c.obj", "start": 279832494, "end": 279906263}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/io/generic/SDL_asyncio_generic.c.obj", "start": 279906263, "end": 279929735}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/io/windows/SDL_asyncio_windows_ioring.c.obj", "start": 279929735, "end": 279931410}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/SDL_gamepad.c.obj", "start": 279931410, "end": 280215271}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/SDL_joystick.c.obj", "start": 280215271, "end": 280424588}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/SDL_steam_virtual_gamepad.c.obj", "start": 280424588, "end": 280448592}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/controller_type.c.obj", "start": 280448592, "end": 280471251}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/gdk/SDL_gameinputjoystick.cpp.obj", "start": 280471251, "end": 280568248}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/gdk/SDL_gameinputjoystick.cpp.obj.ddi", "start": 280568248, "end": 280568863}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/gdk/SDL_gameinputjoystick.cpp.obj.modmap", "start": 280568863, "end": 280568863}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/hidapi/SDL_hidapi_8bitdo.c.obj", "start": 280568863, "end": 280603078}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/hidapi/SDL_hidapi_combined.c.obj", "start": 280603078, "end": 280618888}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/hidapi/SDL_hidapi_flydigi.c.obj", "start": 280618888, "end": 280674850}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/hidapi/SDL_hidapi_gamecube.c.obj", "start": 280674850, "end": 280705119}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/hidapi/SDL_hidapi_gamesir.c.obj", "start": 280705119, "end": 280780221}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/hidapi/SDL_hidapi_gip.c.obj", "start": 280780221, "end": 280873766}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/hidapi/SDL_hidapi_lg4ff.c.obj", "start": 280873766, "end": 280919122}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/hidapi/SDL_hidapi_luna.c.obj", "start": 280919122, "end": 280942863}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/hidapi/SDL_hidapi_ps3.c.obj", "start": 280942863, "end": 281002114}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/hidapi/SDL_hidapi_ps4.c.obj", "start": 281002114, "end": 281056525}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/hidapi/SDL_hidapi_ps5.c.obj", "start": 281056525, "end": 281117284}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/hidapi/SDL_hidapi_rumble.c.obj", "start": 281117284, "end": 281141812}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/hidapi/SDL_hidapi_shield.c.obj", "start": 281141812, "end": 281169601}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/hidapi/SDL_hidapi_sinput.c.obj", "start": 281169601, "end": 281207820}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/hidapi/SDL_hidapi_stadia.c.obj", "start": 281207820, "end": 281226746}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/hidapi/SDL_hidapi_steam.c.obj", "start": 281226746, "end": 281288787}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/hidapi/SDL_hidapi_steam_hori.c.obj", "start": 281288787, "end": 281312830}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/hidapi/SDL_hidapi_steam_triton.c.obj", "start": 281312830, "end": 281349741}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/hidapi/SDL_hidapi_steamdeck.c.obj", "start": 281349741, "end": 281377308}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/hidapi/SDL_hidapi_switch.c.obj", "start": 281377308, "end": 281499250}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/hidapi/SDL_hidapi_switch2.c.obj", "start": 281499250, "end": 281503609}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/hidapi/SDL_hidapi_wii.c.obj", "start": 281503609, "end": 281567202}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/hidapi/SDL_hidapi_xbox360.c.obj", "start": 281567202, "end": 281588163}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/hidapi/SDL_hidapi_xbox360bb.c.obj", "start": 281588163, "end": 281603931}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/hidapi/SDL_hidapi_xbox360w.c.obj", "start": 281603931, "end": 281629447}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/hidapi/SDL_hidapi_xboxone.c.obj", "start": 281629447, "end": 281699814}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/hidapi/SDL_hidapi_zuiki.c.obj", "start": 281699814, "end": 281730308}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/hidapi/SDL_hidapijoystick.c.obj", "start": 281730308, "end": 281810215}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/hidapi/SDL_report_descriptor.c.obj", "start": 281810215, "end": 281832608}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/virtual/SDL_virtualjoystick.c.obj", "start": 281832608, "end": 281866114}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/windows/SDL_dinputjoystick.c.obj", "start": 281866114, "end": 281979400}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/joystick/windows/SDL_xinputjoystick.c.obj", "start": 281979400, "end": 282015680}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/e_atan2.c.obj", "start": 282015680, "end": 282023386}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/e_exp.c.obj", "start": 282023386, "end": 282030269}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/e_fmod.c.obj", "start": 282030269, "end": 282035904}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/e_log.c.obj", "start": 282035904, "end": 282042622}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/e_log10.c.obj", "start": 282042622, "end": 282047337}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/e_pow.c.obj", "start": 282047337, "end": 282062142}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/e_rem_pio2.c.obj", "start": 282062142, "end": 282070570}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/e_sqrt.c.obj", "start": 282070570, "end": 282075631}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/k_cos.c.obj", "start": 282075631, "end": 282080283}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/k_rem_pio2.c.obj", "start": 282080283, "end": 282092284}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/k_sin.c.obj", "start": 282092284, "end": 282096303}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/k_tan.c.obj", "start": 282096303, "end": 282102676}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/s_atan.c.obj", "start": 282102676, "end": 282108678}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/s_copysign.c.obj", "start": 282108678, "end": 282112144}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/s_cos.c.obj", "start": 282112144, "end": 282116219}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/s_fabs.c.obj", "start": 282116219, "end": 282119452}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/s_floor.c.obj", "start": 282119452, "end": 282123694}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/s_isinf.c.obj", "start": 282123694, "end": 282126699}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/s_isinff.c.obj", "start": 282126699, "end": 282129705}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/s_isnan.c.obj", "start": 282129705, "end": 282132718}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/s_isnanf.c.obj", "start": 282132718, "end": 282135680}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/s_modf.c.obj", "start": 282135680, "end": 282140552}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/s_scalbn.c.obj", "start": 282140552, "end": 282145891}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/s_sin.c.obj", "start": 282145891, "end": 282149962}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/libm/s_tan.c.obj", "start": 282149962, "end": 282153514}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/loadso/windows/SDL_sysloadso.c.obj", "start": 282153514, "end": 282170956}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/locale/SDL_locale.c.obj", "start": 282170956, "end": 282176196}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/locale/windows/SDL_syslocale.c.obj", "start": 282176196, "end": 282196220}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/main/SDL_main_callbacks.c.obj", "start": 282196220, "end": 282206777}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/main/SDL_runapp.c.obj", "start": 282206777, "end": 282208416}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/main/generic/SDL_sysmain_callbacks.c.obj", "start": 282208416, "end": 282215987}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/main/windows/SDL_sysmain_runapp.c.obj", "start": 282215987, "end": 282231450}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/misc/SDL_libusb.c.obj", "start": 282231450, "end": 282233081}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/misc/SDL_url.c.obj", "start": 282233081, "end": 282237473}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/misc/windows/SDL_sysurl.c.obj", "start": 282237473, "end": 282253007}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/notification/SDL_notification.c.obj", "start": 282253007, "end": 282257919}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/notification/windows/SDL_windowsnotification.c.obj", "start": 282257919, "end": 284776003}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/power/SDL_power.c.obj", "start": 284776003, "end": 284779709}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/power/windows/SDL_syspower.c.obj", "start": 284779709, "end": 284795309}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/process/SDL_process.c.obj", "start": 284795309, "end": 284805582}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/process/windows/SDL_windowsprocess.c.obj", "start": 284805582, "end": 284848230}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render/SDL_render.c.obj", "start": 284848230, "end": 285134447}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render/SDL_render_unsupported.c.obj", "start": 285134447, "end": 285135986}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render/SDL_yuv_sw.c.obj", "start": 285135986, "end": 285154796}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render/direct3d/SDL_render_d3d.c.obj", "start": 285154796, "end": 285275624}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render/direct3d/SDL_shaders_d3d.c.obj", "start": 285275624, "end": 285308936}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render/direct3d11/SDL_render_d3d11.c.obj", "start": 285308936, "end": 285607685}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render/direct3d11/SDL_shaders_d3d11.c.obj", "start": 285607685, "end": 285798425}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render/direct3d12/SDL_render_d3d12.c.obj", "start": 285798425, "end": 285997140}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render/direct3d12/SDL_shaders_d3d12.c.obj", "start": 285997140, "end": 286089605}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render/gpu/SDL_pipeline_gpu.c.obj", "start": 286089605, "end": 286103388}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render/gpu/SDL_render_gpu.c.obj", "start": 286103388, "end": 286184857}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render/gpu/SDL_shaders_gpu.c.obj", "start": 286184857, "end": 286265490}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render/ngage/SDL_render_ngage.c.obj", "start": 286265490, "end": 286267029}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render/opengl/SDL_render_gl.c.obj", "start": 286267029, "end": 286372948}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render/opengl/SDL_shaders_gl.c.obj", "start": 286372948, "end": 286413682}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render/opengles/SDL_render_gles.c.obj", "start": 286413682, "end": 286415229}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render/opengles2/SDL_render_gles2.c.obj", "start": 286415229, "end": 286522448}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render/opengles2/SDL_shaders_gles2.c.obj", "start": 286522448, "end": 286550193}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render/ps2/SDL_render_ps2.c.obj", "start": 286550193, "end": 286551724}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render/psp/SDL_render_psp.c.obj", "start": 286551724, "end": 286553255}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render/software/SDL_blendfillrect.c.obj", "start": 286553255, "end": 286678659}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render/software/SDL_blendline.c.obj", "start": 286678659, "end": 286878266}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render/software/SDL_blendpoint.c.obj", "start": 286878266, "end": 286914348}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render/software/SDL_drawline.c.obj", "start": 286914348, "end": 286933633}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render/software/SDL_drawpoint.c.obj", "start": 286933633, "end": 286939505}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render/software/SDL_render_sw.c.obj", "start": 286939505, "end": 286994639}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render/software/SDL_triangle.c.obj", "start": 286994639, "end": 287042594}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render/vitagxm/SDL_render_vita_gxm.c.obj", "start": 287042594, "end": 287044145}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render/vitagxm/SDL_render_vita_gxm_memory.c.obj", "start": 287044145, "end": 287045708}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render/vitagxm/SDL_render_vita_gxm_tools.c.obj", "start": 287045708, "end": 287047271}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render/vulkan/SDL_render_vulkan.c.obj", "start": 287047271, "end": 287454037}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/render/vulkan/SDL_shaders_vulkan.c.obj", "start": 287454037, "end": 287480642}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/sensor/SDL_sensor.c.obj", "start": 287480642, "end": 287512891}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/sensor/windows/SDL_windowssensor.c.obj", "start": 287512891, "end": 287650298}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/stdlib/SDL_crc16.c.obj", "start": 287650298, "end": 287653292}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/stdlib/SDL_crc32.c.obj", "start": 287653292, "end": 287656219}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/stdlib/SDL_getenv.c.obj", "start": 287656219, "end": 287686210}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/stdlib/SDL_iconv.c.obj", "start": 287686210, "end": 287706835}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/stdlib/SDL_malloc.c.obj", "start": 287706835, "end": 287715388}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/stdlib/SDL_memcpy.c.obj", "start": 287715388, "end": 287717827}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/stdlib/SDL_memmove.c.obj", "start": 287717827, "end": 287720267}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/stdlib/SDL_memset.c.obj", "start": 287720267, "end": 287723708}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/stdlib/SDL_mslibc.c.obj", "start": 287723708, "end": 287725223}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/stdlib/SDL_murmur3.c.obj", "start": 287725223, "end": 287729360}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/stdlib/SDL_qsort.c.obj", "start": 287729360, "end": 287753843}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/stdlib/SDL_random.c.obj", "start": 287753843, "end": 287759667}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/stdlib/SDL_stdlib.c.obj", "start": 287759667, "end": 287799736}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/stdlib/SDL_string.c.obj", "start": 287799736, "end": 287889565}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/stdlib/SDL_strtokr.c.obj", "start": 287889565, "end": 287892460}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/storage/SDL_storage.c.obj", "start": 287892460, "end": 287914830}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/storage/generic/SDL_genericstorage.c.obj", "start": 287914830, "end": 287931931}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/storage/steam/SDL_steamstorage.c.obj", "start": 287931931, "end": 287951584}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/thread/SDL_thread.c.obj", "start": 287951584, "end": 287991746}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/thread/generic/SDL_syscond.c.obj", "start": 287991746, "end": 287997973}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/thread/generic/SDL_sysrwlock.c.obj", "start": 287997973, "end": 288006177}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/thread/windows/SDL_syscond_cv.c.obj", "start": 288006177, "end": 288031938}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/thread/windows/SDL_sysmutex.c.obj", "start": 288031938, "end": 288059091}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/thread/windows/SDL_sysrwlock_srw.c.obj", "start": 288059091, "end": 288084963}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/thread/windows/SDL_syssem.c.obj", "start": 288084963, "end": 288110398}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/thread/windows/SDL_systhread.c.obj", "start": 288110398, "end": 288134815}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/thread/windows/SDL_systls.c.obj", "start": 288134815, "end": 288151923}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/time/SDL_time.c.obj", "start": 288151923, "end": 288164009}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/time/windows/SDL_systime.c.obj", "start": 288164009, "end": 288185288}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/timer/SDL_timer.c.obj", "start": 288185288, "end": 288218521}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/timer/windows/SDL_systimer.c.obj", "start": 288218521, "end": 288241543}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/tray/SDL_tray_utils.c.obj", "start": 288241543, "end": 288251372}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/tray/windows/SDL_tray.c.obj", "start": 288251372, "end": 288299446}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_RLEaccel.c.obj", "start": 288299446, "end": 288364033}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_blit.c.obj", "start": 288364033, "end": 288374393}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_blit_0.c.obj", "start": 288374393, "end": 288422118}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_blit_1.c.obj", "start": 288422118, "end": 288468160}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_blit_A.c.obj", "start": 288468160, "end": 288586502}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_blit_N.c.obj", "start": 288586502, "end": 288697231}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_blit_auto.c.obj", "start": 288697231, "end": 289265597}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_blit_copy.c.obj", "start": 289265597, "end": 289270807}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_blit_slow.c.obj", "start": 289270807, "end": 289323636}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_bmp.c.obj", "start": 289323636, "end": 289352722}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_clipboard.c.obj", "start": 289352722, "end": 289376359}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_egl.c.obj", "start": 289376359, "end": 289438860}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_fillrect.c.obj", "start": 289438860, "end": 289453720}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_pixels.c.obj", "start": 289453720, "end": 289516811}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_rect.c.obj", "start": 289516811, "end": 289550491}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_rotate.c.obj", "start": 289550491, "end": 289572984}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_stb.c.obj", "start": 289572984, "end": 289820006}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_stretch.c.obj", "start": 289820006, "end": 289848973}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_surface.c.obj", "start": 289848973, "end": 289969767}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_video.c.obj", "start": 289969767, "end": 290245651}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_video_unsupported.c.obj", "start": 290245651, "end": 290249876}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_vulkan_utils.c.obj", "start": 290249876, "end": 290391012}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/SDL_yuv.c.obj", "start": 290391012, "end": 290537832}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/dummy/SDL_nullevents.c.obj", "start": 290537832, "end": 290542606}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/dummy/SDL_nullframebuffer.c.obj", "start": 290542606, "end": 290550079}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/dummy/SDL_nullvideo.c.obj", "start": 290550079, "end": 290560668}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/offscreen/SDL_offscreenevents.c.obj", "start": 290560668, "end": 290565490}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/offscreen/SDL_offscreenframebuffer.c.obj", "start": 290565490, "end": 290573027}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/offscreen/SDL_offscreenopengles.c.obj", "start": 290573027, "end": 290591951}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/offscreen/SDL_offscreenvideo.c.obj", "start": 290591951, "end": 290614137}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/offscreen/SDL_offscreenvulkan.c.obj", "start": 290614137, "end": 290741835}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/offscreen/SDL_offscreenwindow.c.obj", "start": 290741835, "end": 290760603}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/windows/SDL_windowsclipboard.c.obj", "start": 290760603, "end": 290819923}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/windows/SDL_windowsevents.c.obj", "start": 290819923, "end": 290974639}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/windows/SDL_windowsframebuffer.c.obj", "start": 290974639, "end": 291016008}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/windows/SDL_windowsgameinput.cpp.obj", "start": 291016008, "end": 291091640}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/windows/SDL_windowsgameinput.cpp.obj.ddi", "start": 291091640, "end": 291092255}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/windows/SDL_windowsgameinput.cpp.obj.modmap", "start": 291092255, "end": 291092255}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/windows/SDL_windowskeyboard.c.obj", "start": 291092255, "end": 291178182}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/windows/SDL_windowsmessagebox.c.obj", "start": 291178182, "end": 291242704}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/windows/SDL_windowsmodes.c.obj", "start": 291242704, "end": 291320429}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/windows/SDL_windowsmouse.c.obj", "start": 291320429, "end": 291398548}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/windows/SDL_windowsopengl.c.obj", "start": 291398548, "end": 291464691}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/windows/SDL_windowsopengles.c.obj", "start": 291464691, "end": 291504988}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/windows/SDL_windowsrawinput.c.obj", "start": 291504988, "end": 291556649}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/windows/SDL_windowsshape.c.obj", "start": 291556649, "end": 291596554}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/windows/SDL_windowsvideo.c.obj", "start": 291596554, "end": 291781520}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/windows/SDL_windowsvulkan.c.obj", "start": 291781520, "end": 291929468}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/windows/SDL_windowswindow.c.obj", "start": 291929468, "end": 292080354}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/yuv2rgb/yuv_rgb_lsx.c.obj", "start": 292080354, "end": 292083065}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/yuv2rgb/yuv_rgb_sse.c.obj", "start": 292083065, "end": 292242337}, {"filename": "/build/external/SDL/CMakeFiles/SDL3-static.dir/src/video/yuv2rgb/yuv_rgb_std.c.obj", "start": 292242337, "end": 292329535}, {"filename": "/build/external/SDL/CMakeFiles/SDL_build_config.h.intermediate", "start": 292329535, "end": 292348355}, {"filename": "/build/external/SDL/CMakeFiles/git-data/HEAD", "start": 292348355, "end": 292348376}, {"filename": "/build/external/SDL/CMakeFiles/git-data/grabRef.cmake", "start": 292348376, "end": 292350882}, {"filename": "/build/external/SDL/CMakeFiles/git-data/head-ref", "start": 292350882, "end": 292350923}, {"filename": "/build/external/SDL/SDL3-static.lib", "start": 292350923, "end": 311349325}, {"filename": "/build/external/SDL/SDL3Config.cmake", "start": 311349325, "end": 311353191}, {"filename": "/build/external/SDL/SDL3ConfigVersion.cmake", "start": 311353191, "end": 311355095}, {"filename": "/build/external/SDL/SDL3headersTargets.cmake", "start": 311355095, "end": 311357589}, {"filename": "/build/external/SDL/SDL3staticTargets.cmake", "start": 311357589, "end": 311361630}, {"filename": "/build/external/SDL/SDL3testTargets.cmake", "start": 311361630, "end": 311365229}, {"filename": "/build/external/SDL/cmake_install.cmake", "start": 311365229, "end": 311366575}, {"filename": "/build/external/SDL/include-config-debug/build_config/SDL_build_config.h", "start": 311366575, "end": 311385395}, {"filename": "/build/external/SDL/include-revision/SDL3/SDL_revision.h", "start": 311385395, "end": 311386749}, {"filename": "/build/external/SDL/target-SDL3-static-Debug.cmake", "start": 311386749, "end": 311386832}, {"filename": "/build/external/SDL/target-SDL3-static-Debug.modules.json", "start": 311386832, "end": 311386891}, {"filename": "/build_web.bat", "start": 311386891, "end": 311386990}, {"filename": "/external/SDL/.clang-format", "start": 311386990, "end": 311389349}, {"filename": "/external/SDL/.clang-tidy", "start": 311389349, "end": 311391399}, {"filename": "/external/SDL/.editorconfig", "start": 311391399, "end": 311392823}, {"filename": "/external/SDL/.github/PULL_REQUEST_TEMPLATE.md", "start": 311392823, "end": 311393279}, {"filename": "/external/SDL/.github/actions/setup-djgpp-toolchain/action.yml", "start": 311393279, "end": 311396129}, {"filename": "/external/SDL/.github/actions/setup-gdk-desktop/action.yml", "start": 311396129, "end": 311399608}, {"filename": "/external/SDL/.github/actions/setup-harmonyos-toolchain/action.yml", "start": 311399608, "end": 311402245}, {"filename": "/external/SDL/.github/actions/setup-loongarch64-toolchain/action.yml", "start": 311402245, "end": 311404048}, {"filename": "/external/SDL/.github/actions/setup-msvc-libusb/action.yml", "start": 311404048, "end": 311406735}, {"filename": "/external/SDL/.github/actions/setup-ngage-sdk/action.yml", "start": 311406735, "end": 311412011}, {"filename": "/external/SDL/.github/actions/setup-ninja/action.yml", "start": 311412011, "end": 311414556}, {"filename": "/external/SDL/.github/actions/setup-vita-gles/action.yml", "start": 311414556, "end": 311418101}, {"filename": "/external/SDL/.github/cmake/CMakeLists.txt", "start": 311418101, "end": 311418575}, {"filename": "/external/SDL/.github/workflows/build.yml", "start": 311418575, "end": 311421378}, {"filename": "/external/SDL/.github/workflows/create-test-plan.py", "start": 311421378, "end": 311474546}, {"filename": "/external/SDL/.github/workflows/generic.yml", "start": 311474546, "end": 311497209}, {"filename": "/external/SDL/.github/workflows/release.yml", "start": 311497209, "end": 311534495}, {"filename": "/external/SDL/.gitignore", "start": 311534495, "end": 311537690}, {"filename": "/external/SDL/.wikiheaders-options", "start": 311537690, "end": 311540341}, {"filename": "/external/SDL/AGENTS.md", "start": 311540341, "end": 311540874}, {"filename": "/external/SDL/Android.mk", "start": 311540874, "end": 311546016}, {"filename": "/external/SDL/BUGS.txt", "start": 311546016, "end": 311546574}, {"filename": "/external/SDL/CLAUDE.md", "start": 311546574, "end": 311547107}, {"filename": "/external/SDL/CMakeLists.txt", "start": 311547107, "end": 311711365}, {"filename": "/external/SDL/CREDITS.md", "start": 311711365, "end": 311713572}, {"filename": "/external/SDL/INSTALL.md", "start": 311713572, "end": 311715077}, {"filename": "/external/SDL/LICENSE.txt", "start": 311715077, "end": 311715979}, {"filename": "/external/SDL/README.md", "start": 311715979, "end": 311716482}, {"filename": "/external/SDL/VisualC-GDK/SDL.sln", "start": 311716482, "end": 311727561}, {"filename": "/external/SDL/VisualC-GDK/SDL/SDL.vcxproj", "start": 311727561, "end": 311792932}, {"filename": "/external/SDL/VisualC-GDK/SDL/SDL.vcxproj.filters", "start": 311792932, "end": 311826782}, {"filename": "/external/SDL/VisualC-GDK/SDL_test/SDL_test.vcxproj", "start": 311826782, "end": 311841294}, {"filename": "/external/SDL/VisualC-GDK/clean.sh", "start": 311841294, "end": 311841739}, {"filename": "/external/SDL/VisualC-GDK/logos/Logo100x100.png", "start": 311841739, "end": 311852571}, {"filename": "/external/SDL/VisualC-GDK/logos/Logo150x150.png", "start": 311852571, "end": 311865280}, {"filename": "/external/SDL/VisualC-GDK/logos/Logo44x44.png", "start": 311865280, "end": 311872740}, {"filename": "/external/SDL/VisualC-GDK/logos/Logo480x480.png", "start": 311872740, "end": 311901417}, {"filename": "/external/SDL/VisualC-GDK/logos/SplashScreenImage.png", "start": 311901417, "end": 311908016}, {"filename": "/external/SDL/VisualC-GDK/tests/testcontroller/PackageLayout.xml", "start": 311908016, "end": 311908466}, {"filename": "/external/SDL/VisualC-GDK/tests/testcontroller/testcontroller.vcxproj", "start": 311908466, "end": 311930259}, {"filename": "/external/SDL/VisualC-GDK/tests/testcontroller/testcontroller.vcxproj.filters", "start": 311930259, "end": 311932212}, {"filename": "/external/SDL/VisualC-GDK/tests/testcontroller/wingdk/MicrosoftGame.config", "start": 311932212, "end": 311933163}, {"filename": "/external/SDL/VisualC-GDK/tests/testcontroller/xboxone/MicrosoftGame.config", "start": 311933163, "end": 311934040}, {"filename": "/external/SDL/VisualC-GDK/tests/testcontroller/xboxseries/MicrosoftGame.config", "start": 311934040, "end": 311934918}, {"filename": "/external/SDL/VisualC-GDK/tests/testgdk/PackageLayout.xml", "start": 311934918, "end": 311935431}, {"filename": "/external/SDL/VisualC-GDK/tests/testgdk/src/testgdk.cpp", "start": 311935431, "end": 311951540}, {"filename": "/external/SDL/VisualC-GDK/tests/testgdk/testgdk.vcxproj", "start": 311951540, "end": 311976711}, {"filename": "/external/SDL/VisualC-GDK/tests/testgdk/testgdk.vcxproj.filters", "start": 311976711, "end": 311978713}, {"filename": "/external/SDL/VisualC-GDK/tests/testgdk/wingdk/MicrosoftGame.config", "start": 311978713, "end": 311979641}, {"filename": "/external/SDL/VisualC-GDK/tests/testgdk/xboxone/MicrosoftGame.config", "start": 311979641, "end": 311980495}, {"filename": "/external/SDL/VisualC-GDK/tests/testgdk/xboxseries/MicrosoftGame.config", "start": 311980495, "end": 311981350}, {"filename": "/external/SDL/VisualC-GDK/tests/testsprite/PackageLayout.xml", "start": 311981350, "end": 311981796}, {"filename": "/external/SDL/VisualC-GDK/tests/testsprite/testsprite.vcxproj", "start": 311981796, "end": 312006789}, {"filename": "/external/SDL/VisualC-GDK/tests/testsprite/testsprite.vcxproj.filters", "start": 312006789, "end": 312008740}, {"filename": "/external/SDL/VisualC-GDK/tests/testsprite/wingdk/MicrosoftGame.config", "start": 312008740, "end": 312009677}, {"filename": "/external/SDL/VisualC-GDK/tests/testsprite/xboxone/MicrosoftGame.config", "start": 312009677, "end": 312010540}, {"filename": "/external/SDL/VisualC-GDK/tests/testsprite/xboxseries/MicrosoftGame.config", "start": 312010540, "end": 312011404}, {"filename": "/external/SDL/VisualC/SDL.sln", "start": 312011404, "end": 312090169}, {"filename": "/external/SDL/VisualC/SDL/Directory.Build.props", "start": 312090169, "end": 312090511}, {"filename": "/external/SDL/VisualC/SDL/SDL.vcxproj", "start": 312090511, "end": 312159439}, {"filename": "/external/SDL/VisualC/SDL/SDL.vcxproj.filters", "start": 312159439, "end": 312245063}, {"filename": "/external/SDL/VisualC/SDL_test/Directory.Build.props", "start": 312245063, "end": 312245405}, {"filename": "/external/SDL/VisualC/SDL_test/SDL_test.vcxproj", "start": 312245405, "end": 312261889}, {"filename": "/external/SDL/VisualC/SDL_test/SDL_test.vcxproj.filters", "start": 312261889, "end": 312264220}, {"filename": "/external/SDL/VisualC/clean.sh", "start": 312264220, "end": 312264506}, {"filename": "/external/SDL/VisualC/examples/Examples.props", "start": 312264506, "end": 312278112}, {"filename": "/external/SDL/VisualC/examples/asyncio/01-load-bitmaps/01-load-bitmaps.vcxproj", "start": 312278112, "end": 312279128}, {"filename": "/external/SDL/VisualC/examples/audio/01-simple-playback/01-simple-playback.vcxproj", "start": 312279128, "end": 312279741}, {"filename": "/external/SDL/VisualC/examples/audio/02-simple-playback-callback/02-simple-playback-callback.vcxproj", "start": 312279741, "end": 312280381}, {"filename": "/external/SDL/VisualC/examples/audio/03-load-wav/03-load-wav.vcxproj", "start": 312280381, "end": 312281073}, {"filename": "/external/SDL/VisualC/examples/audio/04-multiple-streams/04-multiple-streams.vcxproj", "start": 312281073, "end": 312281888}, {"filename": "/external/SDL/VisualC/examples/audio/05-planar-data/05-planar-data.vcxproj", "start": 312281888, "end": 312282489}, {"filename": "/external/SDL/VisualC/examples/camera/01-read-and-draw/01-read-and-draw.vcxproj", "start": 312282489, "end": 312283098}, {"filename": "/external/SDL/VisualC/examples/demo/01-snake/01-snake.vcxproj", "start": 312283098, "end": 312283679}, {"filename": "/external/SDL/VisualC/examples/demo/02-woodeneye-008/02-woodeneye-008.vcxproj", "start": 312283679, "end": 312284284}, {"filename": "/external/SDL/VisualC/examples/demo/03-infinite-monkeys/03-infinite-monkeys.vcxproj", "start": 312284284, "end": 312284898}, {"filename": "/external/SDL/VisualC/examples/demo/04-bytepusher/04-bytepusher.vcxproj", "start": 312284898, "end": 312285494}, {"filename": "/external/SDL/VisualC/examples/generate.py", "start": 312285494, "end": 312287339}, {"filename": "/external/SDL/VisualC/examples/input/01-joystick-polling/01-joystick-polling.vcxproj", "start": 312287339, "end": 312287955}, {"filename": "/external/SDL/VisualC/examples/input/02-joystick-events/02-joystick-events.vcxproj", "start": 312287955, "end": 312288568}, {"filename": "/external/SDL/VisualC/examples/input/03-gamepad-polling/03-gamepad-polling.vcxproj", "start": 312288568, "end": 312289288}, {"filename": "/external/SDL/VisualC/examples/input/04-gamepad-events/04-gamepad-events.vcxproj", "start": 312289288, "end": 312289898}, {"filename": "/external/SDL/VisualC/examples/input/05-gamepad-rumble/05-gamepad-rumble.vcxproj", "start": 312289898, "end": 312290508}, {"filename": "/external/SDL/VisualC/examples/misc/01-power/01-power.vcxproj", "start": 312290508, "end": 312291089}, {"filename": "/external/SDL/VisualC/examples/misc/02-clipboard/02-clipboard.vcxproj", "start": 312291089, "end": 312291682}, {"filename": "/external/SDL/VisualC/examples/misc/03-locale/03-locale.vcxproj", "start": 312291682, "end": 312292266}, {"filename": "/external/SDL/VisualC/examples/pen/01-drawing-lines/01-drawing-lines.vcxproj", "start": 312292266, "end": 312292869}, {"filename": "/external/SDL/VisualC/examples/renderer/01-clear/01-clear.vcxproj", "start": 312292869, "end": 312293458}, {"filename": "/external/SDL/VisualC/examples/renderer/02-primitives/02-primitives.vcxproj", "start": 312293458, "end": 312294062}, {"filename": "/external/SDL/VisualC/examples/renderer/03-lines/03-lines.vcxproj", "start": 312294062, "end": 312294651}, {"filename": "/external/SDL/VisualC/examples/renderer/04-points/04-points.vcxproj", "start": 312294651, "end": 312295243}, {"filename": "/external/SDL/VisualC/examples/renderer/05-rectangles/05-rectangles.vcxproj", "start": 312295243, "end": 312295847}, {"filename": "/external/SDL/VisualC/examples/renderer/06-textures/06-textures.vcxproj", "start": 312295847, "end": 312296545}, {"filename": "/external/SDL/VisualC/examples/renderer/07-streaming-textures/07-streaming-textures.vcxproj", "start": 312296545, "end": 312297173}, {"filename": "/external/SDL/VisualC/examples/renderer/08-rotating-textures/08-rotating-textures.vcxproj", "start": 312297173, "end": 312297898}, {"filename": "/external/SDL/VisualC/examples/renderer/09-scaling-textures/09-scaling-textures.vcxproj", "start": 312297898, "end": 312298620}, {"filename": "/external/SDL/VisualC/examples/renderer/10-geometry/10-geometry.vcxproj", "start": 312298620, "end": 312299318}, {"filename": "/external/SDL/VisualC/examples/renderer/11-color-mods/11-color-mods.vcxproj", "start": 312299318, "end": 312300022}, {"filename": "/external/SDL/VisualC/examples/renderer/14-viewport/14-viewport.vcxproj", "start": 312300022, "end": 312300720}, {"filename": "/external/SDL/VisualC/examples/renderer/15-cliprect/15-cliprect.vcxproj", "start": 312300720, "end": 312301418}, {"filename": "/external/SDL/VisualC/examples/renderer/17-read-pixels/17-read-pixels.vcxproj", "start": 312301418, "end": 312302125}, {"filename": "/external/SDL/VisualC/examples/renderer/18-debug-text/18-debug-text.vcxproj", "start": 312302125, "end": 312302729}, {"filename": "/external/SDL/VisualC/examples/renderer/19-affine-textures/19-affine-textures.vcxproj", "start": 312302729, "end": 312303448}, {"filename": "/external/SDL/VisualC/examples/renderer/20-blending/20-blending.vcxproj", "start": 312303448, "end": 312304046}, {"filename": "/external/SDL/VisualC/examples/storage/01-user/01-user.vcxproj", "start": 312304046, "end": 312304630}, {"filename": "/external/SDL/VisualC/tests/checkkeys/checkkeys.vcxproj", "start": 312304630, "end": 312324616}, {"filename": "/external/SDL/VisualC/tests/loopwave/loopwave.vcxproj", "start": 312324616, "end": 312344811}, {"filename": "/external/SDL/VisualC/tests/testatomic/testatomic.vcxproj", "start": 312344811, "end": 312362198}, {"filename": "/external/SDL/VisualC/tests/testautomation/testautomation.vcxproj", "start": 312362198, "end": 312381763}, {"filename": "/external/SDL/VisualC/tests/testcontroller/testcontroller.vcxproj", "start": 312381763, "end": 312399295}, {"filename": "/external/SDL/VisualC/tests/testdialog/testdialog.vcxproj", "start": 312399295, "end": 312416682}, {"filename": "/external/SDL/VisualC/tests/testdraw/testdraw.vcxproj", "start": 312416682, "end": 312434053}, {"filename": "/external/SDL/VisualC/tests/testfile/testfile.vcxproj", "start": 312434053, "end": 312451424}, {"filename": "/external/SDL/VisualC/tests/testgl/testgl.vcxproj", "start": 312451424, "end": 312469421}, {"filename": "/external/SDL/VisualC/tests/testgles2/testgles2.vcxproj", "start": 312469421, "end": 312486868}, {"filename": "/external/SDL/VisualC/tests/testoverlay/testoverlay.vcxproj", "start": 312486868, "end": 312506654}, {"filename": "/external/SDL/VisualC/tests/testpen/testpen.vcxproj", "start": 312506654, "end": 312524031}, {"filename": "/external/SDL/VisualC/tests/testplatform/testplatform.vcxproj", "start": 312524031, "end": 312542280}, {"filename": "/external/SDL/VisualC/tests/testpower/testpower.vcxproj", "start": 312542280, "end": 312559659}, {"filename": "/external/SDL/VisualC/tests/testrendertarget/testrendertarget.vcxproj", "start": 312559659, "end": 312581790}, {"filename": "/external/SDL/VisualC/tests/testrumble/testrumble.vcxproj", "start": 312581790, "end": 312599177}, {"filename": "/external/SDL/VisualC/tests/testscale/testscale.vcxproj", "start": 312599177, "end": 312621252}, {"filename": "/external/SDL/VisualC/tests/testsensor/testsensor.vcxproj", "start": 312621252, "end": 312638639}, {"filename": "/external/SDL/VisualC/tests/testshape/testshape.vcxproj", "start": 312638639, "end": 312656018}, {"filename": "/external/SDL/VisualC/tests/testsoftwaretransparent/testsoftwaretransparent.vcxproj", "start": 312656018, "end": 312673509}, {"filename": "/external/SDL/VisualC/tests/testsprite/testsprite.vcxproj", "start": 312673509, "end": 312693286}, {"filename": "/external/SDL/VisualC/tests/testsurround/testsurround.vcxproj", "start": 312693286, "end": 312711133}, {"filename": "/external/SDL/VisualC/tests/testtray/testtray.vcxproj", "start": 312711133, "end": 312733210}, {"filename": "/external/SDL/VisualC/tests/testvulkan/testvulkan.vcxproj", "start": 312733210, "end": 312750459}, {"filename": "/external/SDL/VisualC/tests/testwm/testwm.vcxproj", "start": 312750459, "end": 312767814}, {"filename": "/external/SDL/VisualC/tests/testyuv/testyuv.vcxproj", "start": 312767814, "end": 312787715}, {"filename": "/external/SDL/WhatsNew.txt", "start": 312787715, "end": 312798012}, {"filename": "/external/SDL/Xcode/SDL/Info-Framework.plist", "start": 312798012, "end": 312798915}, {"filename": "/external/SDL/Xcode/SDL/SDL.xcodeproj/project.pbxproj", "start": 312798915, "end": 313095645}, {"filename": "/external/SDL/Xcode/SDL/SDL3/Info.plist", "start": 313095645, "end": 313096419}, {"filename": "/external/SDL/Xcode/SDL/config.xcconfig", "start": 313096419, "end": 313096768}, {"filename": "/external/SDL/Xcode/SDL/pkg-support/SDL.info", "start": 313096768, "end": 313097076}, {"filename": "/external/SDL/Xcode/SDL/pkg-support/build.xcconfig", "start": 313097076, "end": 313097289}, {"filename": "/external/SDL/Xcode/SDL/pkg-support/resources/CMake/SDL3Config.cmake", "start": 313097289, "end": 313101361}, {"filename": "/external/SDL/Xcode/SDL/pkg-support/resources/CMake/SDL3ConfigVersion.cmake", "start": 313101361, "end": 313104298}, {"filename": "/external/SDL/Xcode/SDL/pkg-support/resources/INSTALL.md", "start": 313104298, "end": 313105301}, {"filename": "/external/SDL/Xcode/SDL/pkg-support/resources/SDL_DS_Store", "start": 313105301, "end": 313115545}, {"filename": "/external/SDL/Xcode/SDL/pkg-support/resources/framework/INSTALL.md", "start": 313115545, "end": 313116389}, {"filename": "/external/SDL/Xcode/SDL/pkg-support/sdl_logo.pdf", "start": 313116389, "end": 313280189}, {"filename": "/external/SDL/Xcode/SDL/pkg-support/share/cmake/SDL3/SDL3Config.cmake", "start": 313280189, "end": 313286401}, {"filename": "/external/SDL/Xcode/SDL/pkg-support/share/cmake/SDL3/SDL3ConfigVersion.cmake", "start": 313286401, "end": 313290102}, {"filename": "/external/SDL/Xcode/SDLTest/SDLTest.xcodeproj/project.pbxproj", "start": 313290102, "end": 313529997}, {"filename": "/external/SDL/Xcode/SDLTest/config.xcconfig", "start": 313529997, "end": 313530392}, {"filename": "/external/SDL/Xcode/SDLTest/test-Info.plist", "start": 313530392, "end": 313531052}, {"filename": "/external/SDL/Xcode/XcodeDocSet/Doxyfile", "start": 313531052, "end": 313598092}, {"filename": "/external/SDL/android-project/app/build.gradle", "start": 313598092, "end": 313599867}, {"filename": "/external/SDL/android-project/app/jni/Android.mk", "start": 313599867, "end": 313599905}, {"filename": "/external/SDL/android-project/app/jni/Application.mk", "start": 313599905, "end": 313600180}, {"filename": "/external/SDL/android-project/app/jni/CMakeLists.txt", "start": 313600180, "end": 313600527}, {"filename": "/external/SDL/android-project/app/jni/src/Android.mk", "start": 313600527, "end": 313600933}, {"filename": "/external/SDL/android-project/app/jni/src/CMakeLists.txt", "start": 313600933, "end": 313601167}, {"filename": "/external/SDL/android-project/app/jni/src/YourSourceHere.c", "start": 313601167, "end": 313602122}, {"filename": "/external/SDL/android-project/app/proguard-rules.pro", "start": 313602122, "end": 313605493}, {"filename": "/external/SDL/android-project/app/src/main/AndroidManifest.xml", "start": 313605493, "end": 313610026}, {"filename": "/external/SDL/android-project/app/src/main/java/org/libsdl/app/HIDDevice.java", "start": 313610026, "end": 313610644}, {"filename": "/external/SDL/android-project/app/src/main/java/org/libsdl/app/HIDDeviceBLESteamController.java", "start": 313610644, "end": 313644308}, {"filename": "/external/SDL/android-project/app/src/main/java/org/libsdl/app/HIDDeviceManager.java", "start": 313644308, "end": 313672774}, {"filename": "/external/SDL/android-project/app/src/main/java/org/libsdl/app/HIDDeviceUSB.java", "start": 313672774, "end": 313684848}, {"filename": "/external/SDL/android-project/app/src/main/java/org/libsdl/app/SDL.java", "start": 313684848, "end": 313690391}, {"filename": "/external/SDL/android-project/app/src/main/java/org/libsdl/app/SDLActivity.java", "start": 313690391, "end": 313788438}, {"filename": "/external/SDL/android-project/app/src/main/java/org/libsdl/app/SDLAudioManager.java", "start": 313788438, "end": 313793548}, {"filename": "/external/SDL/android-project/app/src/main/java/org/libsdl/app/SDLControllerManager.java", "start": 313793548, "end": 313837391}, {"filename": "/external/SDL/android-project/app/src/main/java/org/libsdl/app/SDLDummyEdit.java", "start": 313837391, "end": 313839838}, {"filename": "/external/SDL/android-project/app/src/main/java/org/libsdl/app/SDLInputConnection.java", "start": 313839838, "end": 313844763}, {"filename": "/external/SDL/android-project/app/src/main/java/org/libsdl/app/SDLSensorManager.java", "start": 313844763, "end": 313847587}, {"filename": "/external/SDL/android-project/app/src/main/java/org/libsdl/app/SDLSurface.java", "start": 313847587, "end": 313871397}, {"filename": "/external/SDL/android-project/app/src/main/res/mipmap-hdpi/ic_launcher.png", "start": 313871397, "end": 313874080}, {"filename": "/external/SDL/android-project/app/src/main/res/mipmap-mdpi/ic_launcher.png", "start": 313874080, "end": 313875778}, {"filename": "/external/SDL/android-project/app/src/main/res/mipmap-xhdpi/ic_launcher.png", "start": 313875778, "end": 313879650}, {"filename": "/external/SDL/android-project/app/src/main/res/mipmap-xxhdpi/ic_launcher.png", "start": 313879650, "end": 313886524}, {"filename": "/external/SDL/android-project/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png", "start": 313886524, "end": 313901050}, {"filename": "/external/SDL/android-project/app/src/main/res/values/colors.xml", "start": 313901050, "end": 313901264}, {"filename": "/external/SDL/android-project/app/src/main/res/values/strings.xml", "start": 313901264, "end": 313901334}, {"filename": "/external/SDL/android-project/app/src/main/res/values/styles.xml", "start": 313901334, "end": 313901829}, {"filename": "/external/SDL/android-project/build.gradle", "start": 313901829, "end": 313902396}, {"filename": "/external/SDL/android-project/gradle.properties", "start": 313902396, "end": 313903143}, {"filename": "/external/SDL/android-project/gradle/wrapper/gradle-wrapper.jar", "start": 313903143, "end": 313957356}, {"filename": "/external/SDL/android-project/gradle/wrapper/gradle-wrapper.properties", "start": 313957356, "end": 313957593}, {"filename": "/external/SDL/android-project/gradlew", "start": 313957593, "end": 313962728}, {"filename": "/external/SDL/android-project/gradlew.bat", "start": 313962728, "end": 313965132}, {"filename": "/external/SDL/android-project/settings.gradle", "start": 313965132, "end": 313965148}, {"filename": "/external/SDL/build-scripts/SDL_migration.cocci", "start": 313965148, "end": 314036181}, {"filename": "/external/SDL/build-scripts/add-source-to-projects.pl", "start": 314036181, "end": 314058004}, {"filename": "/external/SDL/build-scripts/androidbuildlibs.sh", "start": 314058004, "end": 314059839}, {"filename": "/external/SDL/build-scripts/build-release.py", "start": 314059839, "end": 314145472}, {"filename": "/external/SDL/build-scripts/build-web-examples.pl", "start": 314145472, "end": 314160785}, {"filename": "/external/SDL/build-scripts/casefolding.txt", "start": 314160785, "end": 314247282}, {"filename": "/external/SDL/build-scripts/check_android_jni.py", "start": 314247282, "end": 314253599}, {"filename": "/external/SDL/build-scripts/check_elf_alignment.sh", "start": 314253599, "end": 314257137}, {"filename": "/external/SDL/build-scripts/check_stdlib_usage.py", "start": 314257137, "end": 314266047}, {"filename": "/external/SDL/build-scripts/clang-format-src.sh", "start": 314266047, "end": 314267082}, {"filename": "/external/SDL/build-scripts/cmake-toolchain-mingw64-i686.cmake", "start": 314267082, "end": 314267639}, {"filename": "/external/SDL/build-scripts/cmake-toolchain-mingw64-x86_64.cmake", "start": 314267639, "end": 314268205}, {"filename": "/external/SDL/build-scripts/cmake-toolchain-qnx-aarch64le.cmake", "start": 314268205, "end": 314268575}, {"filename": "/external/SDL/build-scripts/cmake-toolchain-qnx-x86_64.cmake", "start": 314268575, "end": 314268942}, {"filename": "/external/SDL/build-scripts/codechecker-buildbot.sh", "start": 314268942, "end": 314270738}, {"filename": "/external/SDL/build-scripts/create-android-project.py", "start": 314270738, "end": 314279948}, {"filename": "/external/SDL/build-scripts/create-release.py", "start": 314279948, "end": 314281482}, {"filename": "/external/SDL/build-scripts/create_tbds.py", "start": 314281482, "end": 314285453}, {"filename": "/external/SDL/build-scripts/djgpp-platform-overrides.cmake", "start": 314285453, "end": 314286181}, {"filename": "/external/SDL/build-scripts/fnsince.pl", "start": 314286181, "end": 314291847}, {"filename": "/external/SDL/build-scripts/gen_audio_channel_conversion.c", "start": 314291847, "end": 314321984}, {"filename": "/external/SDL/build-scripts/git-pre-push-hook.pl", "start": 314321984, "end": 314324485}, {"filename": "/external/SDL/build-scripts/harmonyos-tool.sh", "start": 314324485, "end": 314330014}, {"filename": "/external/SDL/build-scripts/i586-pc-msdosdjgpp.cmake", "start": 314330014, "end": 314333303}, {"filename": "/external/SDL/build-scripts/makecasefoldhashtable.pl", "start": 314333303, "end": 314343588}, {"filename": "/external/SDL/build-scripts/pkg-support/android/INSTALL.md.in", "start": 314343588, "end": 314345874}, {"filename": "/external/SDL/build-scripts/pkg-support/android/aar/__main__.py.in", "start": 314345874, "end": 314350346}, {"filename": "/external/SDL/build-scripts/pkg-support/android/aar/cmake/SDL3Config.cmake", "start": 314350346, "end": 314355169}, {"filename": "/external/SDL/build-scripts/pkg-support/android/aar/cmake/SDL3ConfigVersion.cmake.in", "start": 314355169, "end": 314356870}, {"filename": "/external/SDL/build-scripts/pkg-support/android/aar/description.json.in", "start": 314356870, "end": 314356992}, {"filename": "/external/SDL/build-scripts/pkg-support/mingw/INSTALL.md.in", "start": 314356992, "end": 314358401}, {"filename": "/external/SDL/build-scripts/pkg-support/mingw/Makefile", "start": 314358401, "end": 314359496}, {"filename": "/external/SDL/build-scripts/pkg-support/mingw/cmake/SDL3Config.cmake", "start": 314359496, "end": 314360181}, {"filename": "/external/SDL/build-scripts/pkg-support/mingw/cmake/SDL3ConfigVersion.cmake", "start": 314360181, "end": 314360918}, {"filename": "/external/SDL/build-scripts/pkg-support/msvc/Directory.Build.props", "start": 314360918, "end": 314361260}, {"filename": "/external/SDL/build-scripts/pkg-support/msvc/INSTALL.md.in", "start": 314361260, "end": 314362423}, {"filename": "/external/SDL/build-scripts/pkg-support/msvc/arm64/INSTALL.md.in", "start": 314362423, "end": 314362939}, {"filename": "/external/SDL/build-scripts/pkg-support/msvc/cmake/SDL3Config.cmake.in", "start": 314362939, "end": 314367385}, {"filename": "/external/SDL/build-scripts/pkg-support/msvc/cmake/SDL3ConfigVersion.cmake.in", "start": 314367385, "end": 314369072}, {"filename": "/external/SDL/build-scripts/pkg-support/msvc/x64/INSTALL.md.in", "start": 314369072, "end": 314369582}, {"filename": "/external/SDL/build-scripts/pkg-support/msvc/x86/INSTALL.md.in", "start": 314369582, "end": 314370092}, {"filename": "/external/SDL/build-scripts/pkg-support/source/SDL_revision.h.cmake.in", "start": 314370092, "end": 314371556}, {"filename": "/external/SDL/build-scripts/pkg-support/source/SDL_revision.h.in", "start": 314371556, "end": 314373645}, {"filename": "/external/SDL/build-scripts/release-info.json", "start": 314373645, "end": 314379592}, {"filename": "/external/SDL/build-scripts/rename_api.py", "start": 314379592, "end": 314387966}, {"filename": "/external/SDL/build-scripts/rename_headers.py", "start": 314387966, "end": 314390787}, {"filename": "/external/SDL/build-scripts/rename_macros.py", "start": 314390787, "end": 314402626}, {"filename": "/external/SDL/build-scripts/rename_symbols.py", "start": 314402626, "end": 314406713}, {"filename": "/external/SDL/build-scripts/rename_types.py", "start": 314406713, "end": 314408964}, {"filename": "/external/SDL/build-scripts/setup-gdk-desktop.py", "start": 314408964, "end": 314422667}, {"filename": "/external/SDL/build-scripts/showrev.sh", "start": 314422667, "end": 314423966}, {"filename": "/external/SDL/build-scripts/test-versioning.sh", "start": 314423966, "end": 314429487}, {"filename": "/external/SDL/build-scripts/trigger-build.py", "start": 314429487, "end": 314431015}, {"filename": "/external/SDL/build-scripts/update-copyright.sh", "start": 314431015, "end": 314431376}, {"filename": "/external/SDL/build-scripts/update-version.sh", "start": 314431376, "end": 314434860}, {"filename": "/external/SDL/build-scripts/updaterev.sh", "start": 314434860, "end": 314436082}, {"filename": "/external/SDL/build-scripts/wikiheaders.pl", "start": 314436082, "end": 314594689}, {"filename": "/external/SDL/cmake/3rdparty.cmake", "start": 314594689, "end": 314597366}, {"filename": "/external/SDL/cmake/CPackProjectConfig.cmake.in", "start": 314597366, "end": 314598757}, {"filename": "/external/SDL/cmake/FindFFmpeg.cmake", "start": 314598757, "end": 314604324}, {"filename": "/external/SDL/cmake/FindLibUSB.cmake", "start": 314604324, "end": 314606578}, {"filename": "/external/SDL/cmake/GetGitRevisionDescription.cmake", "start": 314606578, "end": 314616959}, {"filename": "/external/SDL/cmake/GetGitRevisionDescription.cmake.in", "start": 314616959, "end": 314618566}, {"filename": "/external/SDL/cmake/PkgConfigHelper.cmake", "start": 314618566, "end": 314619973}, {"filename": "/external/SDL/cmake/PreseedDOSCache.cmake", "start": 314619973, "end": 314640722}, {"filename": "/external/SDL/cmake/PreseedEmscriptenCache.cmake", "start": 314640722, "end": 314660652}, {"filename": "/external/SDL/cmake/PreseedHaikuCache.cmake", "start": 314660652, "end": 314682713}, {"filename": "/external/SDL/cmake/PreseedMSVCCache.cmake", "start": 314682713, "end": 314701145}, {"filename": "/external/SDL/cmake/PreseedNokiaNGageCache.cmake", "start": 314701145, "end": 314720385}, {"filename": "/external/SDL/cmake/PreseedOpenHarmonyCache.cmake", "start": 314720385, "end": 314739131}, {"filename": "/external/SDL/cmake/SDL3Config.cmake.in", "start": 314739131, "end": 314742411}, {"filename": "/external/SDL/cmake/SDL3jarTargets.cmake.in", "start": 314742411, "end": 314742682}, {"filename": "/external/SDL/cmake/android/FindSdlAndroid.cmake", "start": 314742682, "end": 314745451}, {"filename": "/external/SDL/cmake/android/FindSdlAndroidBuildTools.cmake", "start": 314745451, "end": 314749100}, {"filename": "/external/SDL/cmake/android/FindSdlAndroidPlatform.cmake", "start": 314749100, "end": 314753054}, {"filename": "/external/SDL/cmake/android/SdlAndroidFunctions.cmake", "start": 314753054, "end": 314763663}, {"filename": "/external/SDL/cmake/android/SdlAndroidScript.cmake", "start": 314763663, "end": 314766120}, {"filename": "/external/SDL/cmake/cmake_uninstall.cmake.in", "start": 314766120, "end": 314766813}, {"filename": "/external/SDL/cmake/macros.cmake", "start": 314766813, "end": 314785224}, {"filename": "/external/SDL/cmake/sdl3.pc.in", "start": 314785224, "end": 314785822}, {"filename": "/external/SDL/cmake/sdlchecks.cmake", "start": 314785822, "end": 314841436}, {"filename": "/external/SDL/cmake/sdlcommands.cmake", "start": 314841436, "end": 314860112}, {"filename": "/external/SDL/cmake/sdlcompilers.cmake", "start": 314860112, "end": 314869469}, {"filename": "/external/SDL/cmake/sdlcpu.cmake", "start": 314869469, "end": 314875199}, {"filename": "/external/SDL/cmake/sdlmanpages.cmake", "start": 314875199, "end": 314877722}, {"filename": "/external/SDL/cmake/sdlplatform.cmake", "start": 314877722, "end": 314880730}, {"filename": "/external/SDL/cmake/test/CMakeLists.txt", "start": 314880730, "end": 314886071}, {"filename": "/external/SDL/cmake/test/inc_sdl_slash.c", "start": 314886071, "end": 314886215}, {"filename": "/external/SDL/cmake/test/main.swift", "start": 314886215, "end": 314886498}, {"filename": "/external/SDL/cmake/test/main_cli.c", "start": 314886498, "end": 314886812}, {"filename": "/external/SDL/cmake/test/main_gui.c", "start": 314886812, "end": 314887865}, {"filename": "/external/SDL/cmake/test/main_lib.c", "start": 314887865, "end": 314888617}, {"filename": "/external/SDL/cmake/test/sdltest.c", "start": 314888617, "end": 314889162}, {"filename": "/external/SDL/cmake/test/swift/module.modulemap", "start": 314889162, "end": 314889226}, {"filename": "/external/SDL/cmake/test/swift/shim.h", "start": 314889226, "end": 314889317}, {"filename": "/external/SDL/cmake/test/test_pkgconfig.sh", "start": 314889317, "end": 314890781}, {"filename": "/external/SDL/cmake/xxd.py", "start": 314890781, "end": 314892299}, {"filename": "/external/SDL/docs/INTRO-androidstudio.md", "start": 314892299, "end": 314892851}, {"filename": "/external/SDL/docs/INTRO-cmake.md", "start": 314892851, "end": 314894458}, {"filename": "/external/SDL/docs/INTRO-emscripten.md", "start": 314894458, "end": 314896002}, {"filename": "/external/SDL/docs/INTRO-mingw.md", "start": 314896002, "end": 314899489}, {"filename": "/external/SDL/docs/INTRO-visualstudio.md", "start": 314899489, "end": 314900567}, {"filename": "/external/SDL/docs/INTRO-xcode.md", "start": 314900567, "end": 314901636}, {"filename": "/external/SDL/docs/README-android.md", "start": 314901636, "end": 314930049}, {"filename": "/external/SDL/docs/README-bsd.md", "start": 314930049, "end": 314930368}, {"filename": "/external/SDL/docs/README-cmake.md", "start": 314930368, "end": 314946568}, {"filename": "/external/SDL/docs/README-contributing.md", "start": 314946568, "end": 314951839}, {"filename": "/external/SDL/docs/README-documentation-rules.md", "start": 314951839, "end": 314970155}, {"filename": "/external/SDL/docs/README-dos.md", "start": 314970155, "end": 314975365}, {"filename": "/external/SDL/docs/README-dynapi.md", "start": 314975365, "end": 314982292}, {"filename": "/external/SDL/docs/README-emscripten.md", "start": 314982292, "end": 315001336}, {"filename": "/external/SDL/docs/README-gdk.md", "start": 315001336, "end": 315017072}, {"filename": "/external/SDL/docs/README-haiku.md", "start": 315017072, "end": 315017170}, {"filename": "/external/SDL/docs/README-harmonyos.md", "start": 315017170, "end": 315055645}, {"filename": "/external/SDL/docs/README-highdpi.md", "start": 315055645, "end": 315060069}, {"filename": "/external/SDL/docs/README-ios.md", "start": 315060069, "end": 315077584}, {"filename": "/external/SDL/docs/README-kmsbsd.md", "start": 315077584, "end": 315079057}, {"filename": "/external/SDL/docs/README-linux.md", "start": 315079057, "end": 315083614}, {"filename": "/external/SDL/docs/README-macos.md", "start": 315083614, "end": 315093583}, {"filename": "/external/SDL/docs/README-main-functions.md", "start": 315093583, "end": 315103732}, {"filename": "/external/SDL/docs/README-migration.md", "start": 315103732, "end": 315224746}, {"filename": "/external/SDL/docs/README-n3ds.md", "start": 315224746, "end": 315226299}, {"filename": "/external/SDL/docs/README-ngage.md", "start": 315226299, "end": 315228657}, {"filename": "/external/SDL/docs/README-platforms.md", "start": 315228657, "end": 315231319}, {"filename": "/external/SDL/docs/README-porting.md", "start": 315231319, "end": 315233426}, {"filename": "/external/SDL/docs/README-ps2.md", "start": 315233426, "end": 315235648}, {"filename": "/external/SDL/docs/README-ps4.md", "start": 315235648, "end": 315235971}, {"filename": "/external/SDL/docs/README-ps5.md", "start": 315235971, "end": 315236294}, {"filename": "/external/SDL/docs/README-psp.md", "start": 315236294, "end": 315237203}, {"filename": "/external/SDL/docs/README-qnx.md", "start": 315237203, "end": 315238805}, {"filename": "/external/SDL/docs/README-riscos.md", "start": 315238805, "end": 315240415}, {"filename": "/external/SDL/docs/README-steamos.md", "start": 315240415, "end": 315241722}, {"filename": "/external/SDL/docs/README-strings.md", "start": 315241722, "end": 315241928}, {"filename": "/external/SDL/docs/README-switch.md", "start": 315241928, "end": 315242293}, {"filename": "/external/SDL/docs/README-touch.md", "start": 315242293, "end": 315246140}, {"filename": "/external/SDL/docs/README-ubuntu-touch.md", "start": 315246140, "end": 315247255}, {"filename": "/external/SDL/docs/README-versions.md", "start": 315247255, "end": 315249794}, {"filename": "/external/SDL/docs/README-vita.md", "start": 315249794, "end": 315251597}, {"filename": "/external/SDL/docs/README-wayland.md", "start": 315251597, "end": 315267427}, {"filename": "/external/SDL/docs/README-windows.md", "start": 315267427, "end": 315273885}, {"filename": "/external/SDL/docs/README-xr.md", "start": 315273885, "end": 315283883}, {"filename": "/external/SDL/docs/README.md", "start": 315283883, "end": 315285805}, {"filename": "/external/SDL/docs/doxyfile", "start": 315285805, "end": 315353155}, {"filename": "/external/SDL/docs/hello.c", "start": 315353155, "end": 315355490}, {"filename": "/external/SDL/docs/release_checklist.md", "start": 315355490, "end": 315357223}, {"filename": "/external/SDL/examples/CMakeLists.txt", "start": 315357223, "end": 315377157}, {"filename": "/external/SDL/examples/README.md", "start": 315377157, "end": 315380850}, {"filename": "/external/SDL/examples/asyncio/01-load-bitmaps/README.txt", "start": 315380850, "end": 315381218}, {"filename": "/external/SDL/examples/asyncio/01-load-bitmaps/load-bitmaps.c", "start": 315381218, "end": 315386118}, {"filename": "/external/SDL/examples/asyncio/01-load-bitmaps/thumbnail.png", "start": 315386118, "end": 315462352}, {"filename": "/external/SDL/examples/asyncio/description.txt", "start": 315462352, "end": 315462368}, {"filename": "/external/SDL/examples/audio/01-simple-playback/README.txt", "start": 315462368, "end": 315462681}, {"filename": "/external/SDL/examples/audio/01-simple-playback/simple-playback.c", "start": 315462681, "end": 315467018}, {"filename": "/external/SDL/examples/audio/02-simple-playback-callback/README.txt", "start": 315467018, "end": 315467330}, {"filename": "/external/SDL/examples/audio/02-simple-playback-callback/simple-playback-callback.c", "start": 315467330, "end": 315472462}, {"filename": "/external/SDL/examples/audio/03-load-wav/README.txt", "start": 315472462, "end": 315472702}, {"filename": "/external/SDL/examples/audio/03-load-wav/load-wav.c", "start": 315472702, "end": 315477042}, {"filename": "/external/SDL/examples/audio/04-multiple-streams/README.txt", "start": 315477042, "end": 315477339}, {"filename": "/external/SDL/examples/audio/04-multiple-streams/multiple-streams.c", "start": 315477339, "end": 315482404}, {"filename": "/external/SDL/examples/audio/05-planar-data/README.txt", "start": 315482404, "end": 315482766}, {"filename": "/external/SDL/examples/audio/05-planar-data/onmouseover.webp", "start": 315482766, "end": 315500254}, {"filename": "/external/SDL/examples/audio/05-planar-data/planar-data.c", "start": 315500254, "end": 315528354}, {"filename": "/external/SDL/examples/audio/05-planar-data/thumbnail.png", "start": 315528354, "end": 315530991}, {"filename": "/external/SDL/examples/audio/onmouseover.webp", "start": 315530991, "end": 315707461}, {"filename": "/external/SDL/examples/audio/thumbnail.png", "start": 315707461, "end": 315721682}, {"filename": "/external/SDL/examples/camera/01-read-and-draw/README.txt", "start": 315721682, "end": 315721749}, {"filename": "/external/SDL/examples/camera/01-read-and-draw/onmouseover.webp", "start": 315721749, "end": 316068605}, {"filename": "/external/SDL/examples/camera/01-read-and-draw/read-and-draw.c", "start": 316068605, "end": 316072986}, {"filename": "/external/SDL/examples/camera/01-read-and-draw/thumbnail.png", "start": 316072986, "end": 316312583}, {"filename": "/external/SDL/examples/categories.txt", "start": 316312583, "end": 316312929}, {"filename": "/external/SDL/examples/demo/01-snake/README.txt", "start": 316312929, "end": 316312972}, {"filename": "/external/SDL/examples/demo/01-snake/onmouseover.webp", "start": 316312972, "end": 316343968}, {"filename": "/external/SDL/examples/demo/01-snake/snake.c", "start": 316343968, "end": 316355885}, {"filename": "/external/SDL/examples/demo/01-snake/thumbnail.png", "start": 316355885, "end": 316358843}, {"filename": "/external/SDL/examples/demo/02-woodeneye-008/README.txt", "start": 316358843, "end": 316358931}, {"filename": "/external/SDL/examples/demo/02-woodeneye-008/onmouseover.webp", "start": 316358931, "end": 316826953}, {"filename": "/external/SDL/examples/demo/02-woodeneye-008/thumbnail.png", "start": 316826953, "end": 316852144}, {"filename": "/external/SDL/examples/demo/02-woodeneye-008/woodeneye-008.c", "start": 316852144, "end": 316871241}, {"filename": "/external/SDL/examples/demo/03-infinite-monkeys/README.txt", "start": 316871241, "end": 316871446}, {"filename": "/external/SDL/examples/demo/03-infinite-monkeys/infinite-monkeys.c", "start": 316871446, "end": 316882133}, {"filename": "/external/SDL/examples/demo/03-infinite-monkeys/onmouseover.webp", "start": 316882133, "end": 316977711}, {"filename": "/external/SDL/examples/demo/03-infinite-monkeys/thumbnail.png", "start": 316977711, "end": 316985451}, {"filename": "/external/SDL/examples/demo/04-bytepusher/README.txt", "start": 316985451, "end": 316985596}, {"filename": "/external/SDL/examples/demo/04-bytepusher/bytepusher.c", "start": 316985596, "end": 316997938}, {"filename": "/external/SDL/examples/demo/04-bytepusher/onmouseover.webp", "start": 316997938, "end": 317428034}, {"filename": "/external/SDL/examples/demo/04-bytepusher/thumbnail.png", "start": 317428034, "end": 317451885}, {"filename": "/external/SDL/examples/demo/description.txt", "start": 317451885, "end": 317451908}, {"filename": "/external/SDL/examples/highlight-plugin.lua", "start": 317451908, "end": 317454909}, {"filename": "/external/SDL/examples/input/01-joystick-polling/README.txt", "start": 317454909, "end": 317455023}, {"filename": "/external/SDL/examples/input/01-joystick-polling/joystick-polling.c", "start": 317455023, "end": 317463247}, {"filename": "/external/SDL/examples/input/01-joystick-polling/onmouseover.webp", "start": 317463247, "end": 317511087}, {"filename": "/external/SDL/examples/input/01-joystick-polling/thumbnail.png", "start": 317511087, "end": 317517027}, {"filename": "/external/SDL/examples/input/02-joystick-events/README.txt", "start": 317517027, "end": 317517138}, {"filename": "/external/SDL/examples/input/02-joystick-events/joystick-events.c", "start": 317517138, "end": 317526550}, {"filename": "/external/SDL/examples/input/02-joystick-events/onmouseover.webp", "start": 317526550, "end": 318073602}, {"filename": "/external/SDL/examples/input/02-joystick-events/thumbnail.png", "start": 318073602, "end": 318104387}, {"filename": "/external/SDL/examples/input/03-gamepad-polling/README.txt", "start": 318104387, "end": 318104910}, {"filename": "/external/SDL/examples/input/03-gamepad-polling/gamepad-polling.c", "start": 318104910, "end": 318115423}, {"filename": "/external/SDL/examples/input/03-gamepad-polling/onmouseover.webp", "start": 318115423, "end": 318186613}, {"filename": "/external/SDL/examples/input/03-gamepad-polling/thumbnail.png", "start": 318186613, "end": 318234567}, {"filename": "/external/SDL/examples/input/04-gamepad-events/README.txt", "start": 318234567, "end": 318234677}, {"filename": "/external/SDL/examples/input/04-gamepad-events/gamepad-events.c", "start": 318234677, "end": 318243146}, {"filename": "/external/SDL/examples/input/04-gamepad-events/onmouseover.webp", "start": 318243146, "end": 318688932}, {"filename": "/external/SDL/examples/input/04-gamepad-events/thumbnail.png", "start": 318688932, "end": 318704890}, {"filename": "/external/SDL/examples/input/05-gamepad-rumble/README.txt", "start": 318704890, "end": 318704952}, {"filename": "/external/SDL/examples/input/05-gamepad-rumble/gamepad-rumble.c", "start": 318704952, "end": 318710473}, {"filename": "/external/SDL/examples/input/05-gamepad-rumble/onmouseover.webp", "start": 318710473, "end": 318722145}, {"filename": "/external/SDL/examples/input/05-gamepad-rumble/thumbnail.png", "start": 318722145, "end": 318723290}, {"filename": "/external/SDL/examples/misc/01-power/README.txt", "start": 318723290, "end": 318723508}, {"filename": "/external/SDL/examples/misc/01-power/onmouseover.webp", "start": 318723508, "end": 318742752}, {"filename": "/external/SDL/examples/misc/01-power/power.c", "start": 318742752, "end": 318748729}, {"filename": "/external/SDL/examples/misc/01-power/thumbnail.png", "start": 318748729, "end": 318749351}, {"filename": "/external/SDL/examples/misc/02-clipboard/README.txt", "start": 318749351, "end": 318749647}, {"filename": "/external/SDL/examples/misc/02-clipboard/clipboard.c", "start": 318749647, "end": 318759007}, {"filename": "/external/SDL/examples/misc/02-clipboard/onmouseover.webp", "start": 318759007, "end": 318826279}, {"filename": "/external/SDL/examples/misc/02-clipboard/thumbnail.png", "start": 318826279, "end": 318827671}, {"filename": "/external/SDL/examples/misc/03-locale/README.txt", "start": 318827671, "end": 318827730}, {"filename": "/external/SDL/examples/misc/03-locale/locale.c", "start": 318827730, "end": 318831146}, {"filename": "/external/SDL/examples/misc/03-locale/thumbnail.png", "start": 318831146, "end": 318831655}, {"filename": "/external/SDL/examples/misc/description.txt", "start": 318831655, "end": 318831695}, {"filename": "/external/SDL/examples/pen/01-drawing-lines/README.txt", "start": 318831695, "end": 318831832}, {"filename": "/external/SDL/examples/pen/01-drawing-lines/drawing-lines.c", "start": 318831832, "end": 318836941}, {"filename": "/external/SDL/examples/pen/01-drawing-lines/onmouseover.webp", "start": 318836941, "end": 318865287}, {"filename": "/external/SDL/examples/pen/01-drawing-lines/thumbnail.png", "start": 318865287, "end": 318867329}, {"filename": "/external/SDL/examples/renderer/01-clear/README.txt", "start": 318867329, "end": 318867521}, {"filename": "/external/SDL/examples/renderer/01-clear/clear.c", "start": 318867521, "end": 318870270}, {"filename": "/external/SDL/examples/renderer/01-clear/onmouseover.webp", "start": 318870270, "end": 318939662}, {"filename": "/external/SDL/examples/renderer/01-clear/thumbnail.png", "start": 318939662, "end": 318941732}, {"filename": "/external/SDL/examples/renderer/02-primitives/README.txt", "start": 318941732, "end": 318941970}, {"filename": "/external/SDL/examples/renderer/02-primitives/primitives.c", "start": 318941970, "end": 318945517}, {"filename": "/external/SDL/examples/renderer/02-primitives/thumbnail.png", "start": 318945517, "end": 318954278}, {"filename": "/external/SDL/examples/renderer/03-lines/README.txt", "start": 318954278, "end": 318954425}, {"filename": "/external/SDL/examples/renderer/03-lines/lines.c", "start": 318954425, "end": 318958340}, {"filename": "/external/SDL/examples/renderer/03-lines/onmouseover.webp", "start": 318958340, "end": 319024374}, {"filename": "/external/SDL/examples/renderer/03-lines/thumbnail.png", "start": 319024374, "end": 319052504}, {"filename": "/external/SDL/examples/renderer/04-points/README.txt", "start": 319052504, "end": 319052624}, {"filename": "/external/SDL/examples/renderer/04-points/onmouseover.webp", "start": 319052624, "end": 319208420}, {"filename": "/external/SDL/examples/renderer/04-points/points.c", "start": 319208420, "end": 319213156}, {"filename": "/external/SDL/examples/renderer/04-points/thumbnail.png", "start": 319213156, "end": 319221270}, {"filename": "/external/SDL/examples/renderer/05-rectangles/README.txt", "start": 319221270, "end": 319221384}, {"filename": "/external/SDL/examples/renderer/05-rectangles/onmouseover.webp", "start": 319221384, "end": 319297138}, {"filename": "/external/SDL/examples/renderer/05-rectangles/rectangles.c", "start": 319297138, "end": 319301742}, {"filename": "/external/SDL/examples/renderer/05-rectangles/thumbnail.png", "start": 319301742, "end": 319305376}, {"filename": "/external/SDL/examples/renderer/06-textures/README.txt", "start": 319305376, "end": 319305505}, {"filename": "/external/SDL/examples/renderer/06-textures/onmouseover.webp", "start": 319305505, "end": 319911459}, {"filename": "/external/SDL/examples/renderer/06-textures/textures.c", "start": 319911459, "end": 319916417}, {"filename": "/external/SDL/examples/renderer/06-textures/thumbnail.png", "start": 319916417, "end": 320155071}, {"filename": "/external/SDL/examples/renderer/07-streaming-textures/README.txt", "start": 320155071, "end": 320155214}, {"filename": "/external/SDL/examples/renderer/07-streaming-textures/onmouseover.webp", "start": 320155214, "end": 320172374}, {"filename": "/external/SDL/examples/renderer/07-streaming-textures/streaming-textures.c", "start": 320172374, "end": 320177224}, {"filename": "/external/SDL/examples/renderer/07-streaming-textures/thumbnail.png", "start": 320177224, "end": 320180776}, {"filename": "/external/SDL/examples/renderer/08-rotating-textures/README.txt", "start": 320180776, "end": 320180924}, {"filename": "/external/SDL/examples/renderer/08-rotating-textures/onmouseover.webp", "start": 320180924, "end": 320493922}, {"filename": "/external/SDL/examples/renderer/08-rotating-textures/rotating-textures.c", "start": 320493922, "end": 320498479}, {"filename": "/external/SDL/examples/renderer/08-rotating-textures/thumbnail.png", "start": 320498479, "end": 320589577}, {"filename": "/external/SDL/examples/renderer/09-scaling-textures/README.txt", "start": 320589577, "end": 320589707}, {"filename": "/external/SDL/examples/renderer/09-scaling-textures/onmouseover.webp", "start": 320589707, "end": 320908621}, {"filename": "/external/SDL/examples/renderer/09-scaling-textures/scaling-textures.c", "start": 320908621, "end": 320912969}, {"filename": "/external/SDL/examples/renderer/09-scaling-textures/thumbnail.png", "start": 320912969, "end": 320996400}, {"filename": "/external/SDL/examples/renderer/10-geometry/README.txt", "start": 320996400, "end": 320996542}, {"filename": "/external/SDL/examples/renderer/10-geometry/geometry.c", "start": 320996542, "end": 321003537}, {"filename": "/external/SDL/examples/renderer/10-geometry/onmouseover.webp", "start": 321003537, "end": 321122791}, {"filename": "/external/SDL/examples/renderer/10-geometry/thumbnail.png", "start": 321122791, "end": 321179955}, {"filename": "/external/SDL/examples/renderer/11-color-mods/README.txt", "start": 321179955, "end": 321180106}, {"filename": "/external/SDL/examples/renderer/11-color-mods/color-mods.c", "start": 321180106, "end": 321185827}, {"filename": "/external/SDL/examples/renderer/11-color-mods/onmouseover.webp", "start": 321185827, "end": 321464113}, {"filename": "/external/SDL/examples/renderer/11-color-mods/thumbnail.png", "start": 321464113, "end": 321586552}, {"filename": "/external/SDL/examples/renderer/14-viewport/README.txt", "start": 321586552, "end": 321586723}, {"filename": "/external/SDL/examples/renderer/14-viewport/thumbnail.png", "start": 321586723, "end": 321733029}, {"filename": "/external/SDL/examples/renderer/14-viewport/viewport.c", "start": 321733029, "end": 321738328}, {"filename": "/external/SDL/examples/renderer/15-cliprect/README.txt", "start": 321738328, "end": 321738561}, {"filename": "/external/SDL/examples/renderer/15-cliprect/cliprect.c", "start": 321738561, "end": 321744011}, {"filename": "/external/SDL/examples/renderer/15-cliprect/onmouseover.webp", "start": 321744011, "end": 322004411}, {"filename": "/external/SDL/examples/renderer/15-cliprect/thumbnail.png", "start": 322004411, "end": 322091436}, {"filename": "/external/SDL/examples/renderer/17-read-pixels/README.txt", "start": 322091436, "end": 322092032}, {"filename": "/external/SDL/examples/renderer/17-read-pixels/onmouseover.webp", "start": 322092032, "end": 322574412}, {"filename": "/external/SDL/examples/renderer/17-read-pixels/read-pixels.c", "start": 322574412, "end": 322582404}, {"filename": "/external/SDL/examples/renderer/17-read-pixels/thumbnail.png", "start": 322582404, "end": 322685242}, {"filename": "/external/SDL/examples/renderer/18-debug-text/README.txt", "start": 322685242, "end": 322685464}, {"filename": "/external/SDL/examples/renderer/18-debug-text/debug-text.c", "start": 322685464, "end": 322688876}, {"filename": "/external/SDL/examples/renderer/18-debug-text/thumbnail.png", "start": 322688876, "end": 322693220}, {"filename": "/external/SDL/examples/renderer/19-affine-textures/README.txt", "start": 322693220, "end": 322693360}, {"filename": "/external/SDL/examples/renderer/19-affine-textures/affine-textures.c", "start": 322693360, "end": 322699095}, {"filename": "/external/SDL/examples/renderer/19-affine-textures/onmouseover.webp", "start": 322699095, "end": 322910585}, {"filename": "/external/SDL/examples/renderer/19-affine-textures/thumbnail.png", "start": 322910585, "end": 323145339}, {"filename": "/external/SDL/examples/renderer/20-blending/README.txt", "start": 323145339, "end": 323145628}, {"filename": "/external/SDL/examples/renderer/20-blending/blending.c", "start": 323145628, "end": 323155470}, {"filename": "/external/SDL/examples/renderer/20-blending/onmouseover.webp", "start": 323155470, "end": 323225326}, {"filename": "/external/SDL/examples/renderer/20-blending/thumbnail.png", "start": 323225326, "end": 323235333}, {"filename": "/external/SDL/examples/save-rendering-to-bitmaps.h", "start": 323235333, "end": 323237452}, {"filename": "/external/SDL/examples/storage/01-user/README.txt", "start": 323237452, "end": 323237776}, {"filename": "/external/SDL/examples/storage/01-user/onmouseover.webp", "start": 323237776, "end": 323239758}, {"filename": "/external/SDL/examples/storage/01-user/thumbnail.png", "start": 323239758, "end": 323240041}, {"filename": "/external/SDL/examples/storage/01-user/user.c", "start": 323240041, "end": 323250054}, {"filename": "/external/SDL/examples/template-category.html", "start": 323250054, "end": 323251424}, {"filename": "/external/SDL/examples/template-homepage.html", "start": 323251424, "end": 323252584}, {"filename": "/external/SDL/examples/template-placeholder.png", "start": 323252584, "end": 323287541}, {"filename": "/external/SDL/examples/template.c", "start": 323287541, "end": 323289401}, {"filename": "/external/SDL/examples/template.css", "start": 323289401, "end": 323293702}, {"filename": "/external/SDL/examples/template.html", "start": 323293702, "end": 323302247}, {"filename": "/external/SDL/include/SDL3/SDL.h", "start": 323302247, "end": 323305359}, {"filename": "/external/SDL/include/SDL3/SDL_assert.h", "start": 323305359, "end": 323334554}, {"filename": "/external/SDL/include/SDL3/SDL_asyncio.h", "start": 323334554, "end": 323358554}, {"filename": "/external/SDL/include/SDL3/SDL_atomic.h", "start": 323358554, "end": 323385333}, {"filename": "/external/SDL/include/SDL3/SDL_audio.h", "start": 323385333, "end": 323489208}, {"filename": "/external/SDL/include/SDL3/SDL_begin_code.h", "start": 323489208, "end": 323508493}, {"filename": "/external/SDL/include/SDL3/SDL_bits.h", "start": 323508493, "end": 323512995}, {"filename": "/external/SDL/include/SDL3/SDL_blendmode.h", "start": 323512995, "end": 323522539}, {"filename": "/external/SDL/include/SDL3/SDL_camera.h", "start": 323522539, "end": 323544182}, {"filename": "/external/SDL/include/SDL3/SDL_clipboard.h", "start": 323544182, "end": 323557464}, {"filename": "/external/SDL/include/SDL3/SDL_close_code.h", "start": 323557464, "end": 323559072}, {"filename": "/external/SDL/include/SDL3/SDL_copying.h", "start": 323559072, "end": 323560078}, {"filename": "/external/SDL/include/SDL3/SDL_cpuinfo.h", "start": 323560078, "end": 323572159}, {"filename": "/external/SDL/include/SDL3/SDL_dialog.h", "start": 323572159, "end": 323587820}, {"filename": "/external/SDL/include/SDL3/SDL_dlopennote.h", "start": 323587820, "end": 323596840}, {"filename": "/external/SDL/include/SDL3/SDL_egl.h", "start": 323596840, "end": 323710233}, {"filename": "/external/SDL/include/SDL3/SDL_endian.h", "start": 323710233, "end": 323731040}, {"filename": "/external/SDL/include/SDL3/SDL_error.h", "start": 323731040, "end": 323738361}, {"filename": "/external/SDL/include/SDL3/SDL_events.h", "start": 323738361, "end": 323817170}, {"filename": "/external/SDL/include/SDL3/SDL_filesystem.h", "start": 323817170, "end": 323840649}, {"filename": "/external/SDL/include/SDL3/SDL_gamepad.h", "start": 323840649, "end": 323904172}, {"filename": "/external/SDL/include/SDL3/SDL_gpu.h", "start": 323904172, "end": 324109582}, {"filename": "/external/SDL/include/SDL3/SDL_guid.h", "start": 324109582, "end": 324113118}, {"filename": "/external/SDL/include/SDL3/SDL_haptic.h", "start": 324113118, "end": 324159654}, {"filename": "/external/SDL/include/SDL3/SDL_hidapi.h", "start": 324159654, "end": 324182261}, {"filename": "/external/SDL/include/SDL3/SDL_hints.h", "start": 324182261, "end": 324364966}, {"filename": "/external/SDL/include/SDL3/SDL_init.h", "start": 324364966, "end": 324386465}, {"filename": "/external/SDL/include/SDL3/SDL_intrin.h", "start": 324386465, "end": 324402452}, {"filename": "/external/SDL/include/SDL3/SDL_iostream.h", "start": 324402452, "end": 324457780}, {"filename": "/external/SDL/include/SDL3/SDL_joystick.h", "start": 324457780, "end": 324514803}, {"filename": "/external/SDL/include/SDL3/SDL_keyboard.h", "start": 324514803, "end": 324538484}, {"filename": "/external/SDL/include/SDL3/SDL_keycode.h", "start": 324538484, "end": 324565629}, {"filename": "/external/SDL/include/SDL3/SDL_loadso.h", "start": 324565629, "end": 324570956}, {"filename": "/external/SDL/include/SDL3/SDL_locale.h", "start": 324570956, "end": 324576217}, {"filename": "/external/SDL/include/SDL3/SDL_log.h", "start": 324576217, "end": 324593740}, {"filename": "/external/SDL/include/SDL3/SDL_main.h", "start": 324593740, "end": 324623779}, {"filename": "/external/SDL/include/SDL3/SDL_main_impl.h", "start": 324623779, "end": 324630233}, {"filename": "/external/SDL/include/SDL3/SDL_messagebox.h", "start": 324630233, "end": 324638641}, {"filename": "/external/SDL/include/SDL3/SDL_metal.h", "start": 324638641, "end": 324642108}, {"filename": "/external/SDL/include/SDL3/SDL_misc.h", "start": 324642108, "end": 324647084}, {"filename": "/external/SDL/include/SDL3/SDL_mouse.h", "start": 324647084, "end": 324680768}, {"filename": "/external/SDL/include/SDL3/SDL_mutex.h", "start": 324680768, "end": 324718645}, {"filename": "/external/SDL/include/SDL3/SDL_notification.h", "start": 324718645, "end": 324730174}, {"filename": "/external/SDL/include/SDL3/SDL_oldnames.h", "start": 324730174, "end": 324812243}, {"filename": "/external/SDL/include/SDL3/SDL_opengl.h", "start": 324812243, "end": 324942159}, {"filename": "/external/SDL/include/SDL3/SDL_opengl_glext.h", "start": 324942159, "end": 325829690}, {"filename": "/external/SDL/include/SDL3/SDL_opengles.h", "start": 325829690, "end": 325830972}, {"filename": "/external/SDL/include/SDL3/SDL_opengles2.h", "start": 325830972, "end": 325832638}, {"filename": "/external/SDL/include/SDL3/SDL_opengles2_gl2.h", "start": 325832638, "end": 325876232}, {"filename": "/external/SDL/include/SDL3/SDL_opengles2_gl2ext.h", "start": 325876232, "end": 326131861}, {"filename": "/external/SDL/include/SDL3/SDL_opengles2_gl2platform.h", "start": 326131861, "end": 326132534}, {"filename": "/external/SDL/include/SDL3/SDL_opengles2_khrplatform.h", "start": 326132534, "end": 326144072}, {"filename": "/external/SDL/include/SDL3/SDL_openxr.h", "start": 326144072, "end": 326152318}, {"filename": "/external/SDL/include/SDL3/SDL_pen.h", "start": 326152318, "end": 326160810}, {"filename": "/external/SDL/include/SDL3/SDL_pixels.h", "start": 326160810, "end": 326222807}, {"filename": "/external/SDL/include/SDL3/SDL_platform.h", "start": 326222807, "end": 326224836}, {"filename": "/external/SDL/include/SDL3/SDL_platform_defines.h", "start": 326224836, "end": 326237989}, {"filename": "/external/SDL/include/SDL3/SDL_power.h", "start": 326237989, "end": 326242326}, {"filename": "/external/SDL/include/SDL3/SDL_process.h", "start": 326242326, "end": 326261512}, {"filename": "/external/SDL/include/SDL3/SDL_properties.h", "start": 326261512, "end": 326282936}, {"filename": "/external/SDL/include/SDL3/SDL_rect.h", "start": 326282936, "end": 326302545}, {"filename": "/external/SDL/include/SDL3/SDL_render.h", "start": 326302545, "end": 326449945}, {"filename": "/external/SDL/include/SDL3/SDL_revision.h", "start": 326449945, "end": 326452096}, {"filename": "/external/SDL/include/SDL3/SDL_scancode.h", "start": 326452096, "end": 326469834}, {"filename": "/external/SDL/include/SDL3/SDL_sensor.h", "start": 326469834, "end": 326480653}, {"filename": "/external/SDL/include/SDL3/SDL_stdinc.h", "start": 326480653, "end": 326700871}, {"filename": "/external/SDL/include/SDL3/SDL_storage.h", "start": 326700871, "end": 326727524}, {"filename": "/external/SDL/include/SDL3/SDL_surface.h", "start": 326727524, "end": 326802202}, {"filename": "/external/SDL/include/SDL3/SDL_system.h", "start": 326802202, "end": 326840746}, {"filename": "/external/SDL/include/SDL3/SDL_test.h", "start": 326840746, "end": 326842763}, {"filename": "/external/SDL/include/SDL3/SDL_test_assert.h", "start": 326842763, "end": 326846057}, {"filename": "/external/SDL/include/SDL3/SDL_test_common.h", "start": 326846057, "end": 326855154}, {"filename": "/external/SDL/include/SDL3/SDL_test_compare.h", "start": 326855154, "end": 326858009}, {"filename": "/external/SDL/include/SDL3/SDL_test_crc32.h", "start": 326858009, "end": 326861744}, {"filename": "/external/SDL/include/SDL3/SDL_test_font.h", "start": 326861744, "end": 326867418}, {"filename": "/external/SDL/include/SDL3/SDL_test_fuzzer.h", "start": 326867418, "end": 326880994}, {"filename": "/external/SDL/include/SDL3/SDL_test_harness.h", "start": 326880994, "end": 326886519}, {"filename": "/external/SDL/include/SDL3/SDL_test_log.h", "start": 326886519, "end": 326889173}, {"filename": "/external/SDL/include/SDL3/SDL_test_md5.h", "start": 326889173, "end": 326893928}, {"filename": "/external/SDL/include/SDL3/SDL_test_memory.h", "start": 326893928, "end": 326895936}, {"filename": "/external/SDL/include/SDL3/SDL_thread.h", "start": 326895936, "end": 326920329}, {"filename": "/external/SDL/include/SDL3/SDL_time.h", "start": 326920329, "end": 326929317}, {"filename": "/external/SDL/include/SDL3/SDL_timer.h", "start": 326929317, "end": 326944585}, {"filename": "/external/SDL/include/SDL3/SDL_touch.h", "start": 326944585, "end": 326951122}, {"filename": "/external/SDL/include/SDL3/SDL_tray.h", "start": 326951122, "end": 326972717}, {"filename": "/external/SDL/include/SDL3/SDL_version.h", "start": 326972717, "end": 326978724}, {"filename": "/external/SDL/include/SDL3/SDL_video.h", "start": 326978724, "end": 327130551}, {"filename": "/external/SDL/include/SDL3/SDL_vulkan.h", "start": 327130551, "end": 327142735}, {"filename": "/external/SDL/include/build_config/SDL_build_config.h", "start": 327142735, "end": 327144817}, {"filename": "/external/SDL/include/build_config/SDL_build_config.h.cmake", "start": 327144817, "end": 327166187}, {"filename": "/external/SDL/include/build_config/SDL_build_config_android.h", "start": 327166187, "end": 327172027}, {"filename": "/external/SDL/include/build_config/SDL_build_config_ios.h", "start": 327172027, "end": 327178395}, {"filename": "/external/SDL/include/build_config/SDL_build_config_macos.h", "start": 327178395, "end": 327185526}, {"filename": "/external/SDL/include/build_config/SDL_build_config_minimal.h", "start": 327185526, "end": 327188769}, {"filename": "/external/SDL/include/build_config/SDL_build_config_windows.h", "start": 327188769, "end": 327197126}, {"filename": "/external/SDL/include/build_config/SDL_build_config_wingdk.h", "start": 327197126, "end": 327203502}, {"filename": "/external/SDL/include/build_config/SDL_build_config_xbox.h", "start": 327203502, "end": 327209744}, {"filename": "/external/SDL/include/build_config/SDL_revision.h.cmake", "start": 327209744, "end": 327211068}, {"filename": "/external/SDL/openharmony-project/.gitignore", "start": 327211068, "end": 327211212}, {"filename": "/external/SDL/openharmony-project/AppScope/app.json5", "start": 327211212, "end": 327211453}, {"filename": "/external/SDL/openharmony-project/AppScope/resources/base/element/string.json", "start": 327211453, "end": 327211542}, {"filename": "/external/SDL/openharmony-project/AppScope/resources/base/media/background.png", "start": 327211542, "end": 327303484}, {"filename": "/external/SDL/openharmony-project/AppScope/resources/base/media/foreground.png", "start": 327303484, "end": 327318809}, {"filename": "/external/SDL/openharmony-project/AppScope/resources/base/media/layered_image.json", "start": 327318809, "end": 327318924}, {"filename": "/external/SDL/openharmony-project/build-profile.json5", "start": 327318924, "end": 327319735}, {"filename": "/external/SDL/openharmony-project/code-linter.json5", "start": 327319735, "end": 327320620}, {"filename": "/external/SDL/openharmony-project/entry/.gitignore", "start": 327320620, "end": 327320680}, {"filename": "/external/SDL/openharmony-project/entry/build-profile.json5", "start": 327320680, "end": 327321599}, {"filename": "/external/SDL/openharmony-project/entry/hvigorfile.ts", "start": 327321599, "end": 327321831}, {"filename": "/external/SDL/openharmony-project/entry/obfuscation-rules.txt", "start": 327321831, "end": 327322855}, {"filename": "/external/SDL/openharmony-project/entry/oh-package-lock.json5", "start": 327322855, "end": 327323379}, {"filename": "/external/SDL/openharmony-project/entry/oh-package.json5", "start": 327323379, "end": 327323622}, {"filename": "/external/SDL/openharmony-project/entry/src/main/cpp/CMakeLists.txt", "start": 327323622, "end": 327324111}, {"filename": "/external/SDL/openharmony-project/entry/src/main/cpp/types/libSDL3/Index.d.ts", "start": 327324111, "end": 327324237}, {"filename": "/external/SDL/openharmony-project/entry/src/main/cpp/types/libSDL3/oh-package.json5", "start": 327324237, "end": 327324378}, {"filename": "/external/SDL/openharmony-project/entry/src/main/ets/entryability/EntryAbility.ets", "start": 327324378, "end": 327326012}, {"filename": "/external/SDL/openharmony-project/entry/src/main/ets/entrybackupability/EntryBackupAbility.ets", "start": 327326012, "end": 327326534}, {"filename": "/external/SDL/openharmony-project/entry/src/main/ets/pages/Index.ets", "start": 327326534, "end": 327326825}, {"filename": "/external/SDL/openharmony-project/entry/src/main/module.json5", "start": 327326825, "end": 327329676}, {"filename": "/external/SDL/openharmony-project/entry/src/main/resources/base/element/color.json", "start": 327329676, "end": 327329781}, {"filename": "/external/SDL/openharmony-project/entry/src/main/resources/base/element/float.json", "start": 327329781, "end": 327329881}, {"filename": "/external/SDL/openharmony-project/entry/src/main/resources/base/element/string.json", "start": 327329881, "end": 327330556}, {"filename": "/external/SDL/openharmony-project/entry/src/main/resources/base/media/background.png", "start": 327330556, "end": 327422498}, {"filename": "/external/SDL/openharmony-project/entry/src/main/resources/base/media/foreground.png", "start": 327422498, "end": 327431303}, {"filename": "/external/SDL/openharmony-project/entry/src/main/resources/base/media/layered_image.json", "start": 327431303, "end": 327431418}, {"filename": "/external/SDL/openharmony-project/entry/src/main/resources/base/media/startIcon.png", "start": 327431418, "end": 327451511}, {"filename": "/external/SDL/openharmony-project/entry/src/main/resources/base/profile/backup_config.json", "start": 327451511, "end": 327451547}, {"filename": "/external/SDL/openharmony-project/entry/src/main/resources/base/profile/main_pages.json", "start": 327451547, "end": 327451589}, {"filename": "/external/SDL/openharmony-project/entry/src/main/resources/dark/element/color.json", "start": 327451589, "end": 327451694}, {"filename": "/external/SDL/openharmony-project/hvigor/hvigor-config.json5", "start": 327451694, "end": 327453175}, {"filename": "/external/SDL/openharmony-project/hvigorfile.ts", "start": 327453175, "end": 327453407}, {"filename": "/external/SDL/openharmony-project/oh-package-lock.json5", "start": 327453407, "end": 327454409}, {"filename": "/external/SDL/openharmony-project/oh-package.json5", "start": 327454409, "end": 327454619}, {"filename": "/external/SDL/src/SDL.c", "start": 327454619, "end": 327485960}, {"filename": "/external/SDL/src/SDL_assert.c", "start": 327485960, "end": 327499557}, {"filename": "/external/SDL/src/SDL_assert_c.h", "start": 327499557, "end": 327500665}, {"filename": "/external/SDL/src/SDL_error.c", "start": 327500665, "end": 327504360}, {"filename": "/external/SDL/src/SDL_error_c.h", "start": 327504360, "end": 327506079}, {"filename": "/external/SDL/src/SDL_generic_hashtable.h", "start": 327506079, "end": 327521567}, {"filename": "/external/SDL/src/SDL_guid.c", "start": 327521567, "end": 327524453}, {"filename": "/external/SDL/src/SDL_hashtable.c", "start": 327524453, "end": 327540353}, {"filename": "/external/SDL/src/SDL_hashtable.h", "start": 327540353, "end": 327565821}, {"filename": "/external/SDL/src/SDL_hints.c", "start": 327565821, "end": 327578067}, {"filename": "/external/SDL/src/SDL_hints_c.h", "start": 327578067, "end": 327579414}, {"filename": "/external/SDL/src/SDL_internal.h", "start": 327579414, "end": 327590091}, {"filename": "/external/SDL/src/SDL_list.c", "start": 327590091, "end": 327593951}, {"filename": "/external/SDL/src/SDL_list.h", "start": 327593951, "end": 327595456}, {"filename": "/external/SDL/src/SDL_log.c", "start": 327595456, "end": 327621734}, {"filename": "/external/SDL/src/SDL_log_c.h", "start": 327621734, "end": 327622927}, {"filename": "/external/SDL/src/SDL_menu.h", "start": 327622927, "end": 327625005}, {"filename": "/external/SDL/src/SDL_properties.c", "start": 327625005, "end": 327655658}, {"filename": "/external/SDL/src/SDL_properties_c.h", "start": 327655658, "end": 327656948}, {"filename": "/external/SDL/src/SDL_utils.c", "start": 327656948, "end": 327676509}, {"filename": "/external/SDL/src/SDL_utils_c.h", "start": 327676509, "end": 327680419}, {"filename": "/external/SDL/src/atomic/SDL_atomic.c", "start": 327680419, "end": 327694584}, {"filename": "/external/SDL/src/atomic/SDL_spinlock.c", "start": 327694584, "end": 327700363}, {"filename": "/external/SDL/src/audio/SDL_audio.c", "start": 327700363, "end": 327816931}, {"filename": "/external/SDL/src/audio/SDL_audio_c.h", "start": 327816931, "end": 327818006}, {"filename": "/external/SDL/src/audio/SDL_audio_channel_converters.h", "start": 327818006, "end": 327853241}, {"filename": "/external/SDL/src/audio/SDL_audiocvt.c", "start": 327853241, "end": 327909693}, {"filename": "/external/SDL/src/audio/SDL_audiodev.c", "start": 327909693, "end": 327913861}, {"filename": "/external/SDL/src/audio/SDL_audiodev_c.h", "start": 327913861, "end": 327915359}, {"filename": "/external/SDL/src/audio/SDL_audioqueue.c", "start": 327915359, "end": 327933427}, {"filename": "/external/SDL/src/audio/SDL_audioqueue.h", "start": 327933427, "end": 327936952}, {"filename": "/external/SDL/src/audio/SDL_audioresample.c", "start": 327936952, "end": 327960530}, {"filename": "/external/SDL/src/audio/SDL_audioresample.h", "start": 327960530, "end": 327962523}, {"filename": "/external/SDL/src/audio/SDL_audiotypecvt.c", "start": 327962523, "end": 328000767}, {"filename": "/external/SDL/src/audio/SDL_mixer.c", "start": 328000767, "end": 328011870}, {"filename": "/external/SDL/src/audio/SDL_sysaudio.h", "start": 328011870, "end": 328030782}, {"filename": "/external/SDL/src/audio/SDL_wave.c", "start": 328030782, "end": 328109569}, {"filename": "/external/SDL/src/audio/SDL_wave.h", "start": 328109569, "end": 328115022}, {"filename": "/external/SDL/src/audio/aaudio/SDL_aaudio.c", "start": 328115022, "end": 328141711}, {"filename": "/external/SDL/src/audio/aaudio/SDL_aaudio.h", "start": 328141711, "end": 328142973}, {"filename": "/external/SDL/src/audio/aaudio/SDL_aaudiofuncs.h", "start": 328142973, "end": 328150227}, {"filename": "/external/SDL/src/audio/alsa/SDL_alsa_audio.c", "start": 328150227, "end": 328213275}, {"filename": "/external/SDL/src/audio/alsa/SDL_alsa_audio.h", "start": 328213275, "end": 328214679}, {"filename": "/external/SDL/src/audio/coreaudio/SDL_coreaudio.h", "start": 328214679, "end": 328216751}, {"filename": "/external/SDL/src/audio/coreaudio/SDL_coreaudio.m", "start": 328216751, "end": 328260365}, {"filename": "/external/SDL/src/audio/directsound/SDL_directsound.c", "start": 328260365, "end": 328285578}, {"filename": "/external/SDL/src/audio/directsound/SDL_directsound.h", "start": 328285578, "end": 328287074}, {"filename": "/external/SDL/src/audio/disk/SDL_diskaudio.c", "start": 328287074, "end": 328293234}, {"filename": "/external/SDL/src/audio/disk/SDL_diskaudio.h", "start": 328293234, "end": 328294488}, {"filename": "/external/SDL/src/audio/dos/SDL_dosaudio_sb.c", "start": 328294488, "end": 328321910}, {"filename": "/external/SDL/src/audio/dos/SDL_dosaudio_sb.h", "start": 328321910, "end": 328323781}, {"filename": "/external/SDL/src/audio/dsp/SDL_dspaudio.c", "start": 328323781, "end": 328333928}, {"filename": "/external/SDL/src/audio/dsp/SDL_dspaudio.h", "start": 328333928, "end": 328335181}, {"filename": "/external/SDL/src/audio/dummy/SDL_dummyaudio.c", "start": 328335181, "end": 328339845}, {"filename": "/external/SDL/src/audio/dummy/SDL_dummyaudio.h", "start": 328339845, "end": 328341116}, {"filename": "/external/SDL/src/audio/emscripten/SDL_emscriptenaudio.c", "start": 328341116, "end": 328356567}, {"filename": "/external/SDL/src/audio/emscripten/SDL_emscriptenaudio.h", "start": 328356567, "end": 328357745}, {"filename": "/external/SDL/src/audio/haiku/SDL_haikuaudio.cc", "start": 328357745, "end": 328364675}, {"filename": "/external/SDL/src/audio/haiku/SDL_haikuaudio.h", "start": 328364675, "end": 328365905}, {"filename": "/external/SDL/src/audio/jack/SDL_jackaudio.c", "start": 328365905, "end": 328381800}, {"filename": "/external/SDL/src/audio/jack/SDL_jackaudio.h", "start": 328381800, "end": 328383016}, {"filename": "/external/SDL/src/audio/n3ds/SDL_n3dsaudio.c", "start": 328383016, "end": 328391882}, {"filename": "/external/SDL/src/audio/n3ds/SDL_n3dsaudio.h", "start": 328391882, "end": 328393184}, {"filename": "/external/SDL/src/audio/netbsd/SDL_netbsdaudio.c", "start": 328393184, "end": 328404038}, {"filename": "/external/SDL/src/audio/netbsd/SDL_netbsdaudio.h", "start": 328404038, "end": 328405511}, {"filename": "/external/SDL/src/audio/ngage/SDL_ngageaudio.c", "start": 328405511, "end": 328408886}, {"filename": "/external/SDL/src/audio/ngage/SDL_ngageaudio.cpp", "start": 328408886, "end": 328420167}, {"filename": "/external/SDL/src/audio/ngage/SDL_ngageaudio.h", "start": 328420167, "end": 328422159}, {"filename": "/external/SDL/src/audio/ngage/SDL_ngageaudio.hpp", "start": 328422159, "end": 328424980}, {"filename": "/external/SDL/src/audio/ohaudio/SDL_ohaudio.c", "start": 328424980, "end": 328453990}, {"filename": "/external/SDL/src/audio/ohaudio/SDL_ohaudio.h", "start": 328453990, "end": 328455260}, {"filename": "/external/SDL/src/audio/ohaudio/SDL_ohaudiofuncs.h", "start": 328455260, "end": 328460310}, {"filename": "/external/SDL/src/audio/openslES/SDL_openslES.c", "start": 328460310, "end": 328488843}, {"filename": "/external/SDL/src/audio/openslES/SDL_openslES.h", "start": 328488843, "end": 328490136}, {"filename": "/external/SDL/src/audio/pipewire/SDL_pipewire.c", "start": 328490136, "end": 328543868}, {"filename": "/external/SDL/src/audio/pipewire/SDL_pipewire.h", "start": 328543868, "end": 328545344}, {"filename": "/external/SDL/src/audio/ps2/SDL_ps2audio.c", "start": 328545344, "end": 328550705}, {"filename": "/external/SDL/src/audio/ps2/SDL_ps2audio.h", "start": 328550705, "end": 328552098}, {"filename": "/external/SDL/src/audio/psp/SDL_pspaudio.c", "start": 328552098, "end": 328558818}, {"filename": "/external/SDL/src/audio/psp/SDL_pspaudio.h", "start": 328558818, "end": 328560211}, {"filename": "/external/SDL/src/audio/pulseaudio/SDL_pulseaudio.c", "start": 328560211, "end": 328607949}, {"filename": "/external/SDL/src/audio/pulseaudio/SDL_pulseaudio.h", "start": 328607949, "end": 328609355}, {"filename": "/external/SDL/src/audio/qnx/SDL_qsa_audio.c", "start": 328609355, "end": 328627074}, {"filename": "/external/SDL/src/audio/qnx/SDL_qsa_audio.h", "start": 328627074, "end": 328628483}, {"filename": "/external/SDL/src/audio/sndio/SDL_sndioaudio.c", "start": 328628483, "end": 328639991}, {"filename": "/external/SDL/src/audio/sndio/SDL_sndioaudio.h", "start": 328639991, "end": 328641349}, {"filename": "/external/SDL/src/audio/vita/SDL_vitaaudio.c", "start": 328641349, "end": 328649624}, {"filename": "/external/SDL/src/audio/vita/SDL_vitaaudio.h", "start": 328649624, "end": 328651017}, {"filename": "/external/SDL/src/audio/wasapi/SDL_wasapi.c", "start": 328651017, "end": 328689717}, {"filename": "/external/SDL/src/audio/wasapi/SDL_wasapi.h", "start": 328689717, "end": 328691785}, {"filename": "/external/SDL/src/camera/SDL_camera.c", "start": 328691785, "end": 328752452}, {"filename": "/external/SDL/src/camera/SDL_camera_c.h", "start": 328752452, "end": 328753752}, {"filename": "/external/SDL/src/camera/SDL_syscamera.h", "start": 328753752, "end": 328763270}, {"filename": "/external/SDL/src/camera/android/SDL_camera_android.c", "start": 328763270, "end": 328804136}, {"filename": "/external/SDL/src/camera/coremedia/SDL_camera_coremedia.m", "start": 328804136, "end": 328832234}, {"filename": "/external/SDL/src/camera/dummy/SDL_camera_dummy.c", "start": 328832234, "end": 328834685}, {"filename": "/external/SDL/src/camera/emscripten/SDL_camera_emscripten.c", "start": 328834685, "end": 328846113}, {"filename": "/external/SDL/src/camera/mediafoundation/SDL_camera_mediafoundation.c", "start": 328846113, "end": 328890888}, {"filename": "/external/SDL/src/camera/openharmony/SDL_camera_openharmony.c", "start": 328890888, "end": 328924775}, {"filename": "/external/SDL/src/camera/pipewire/SDL_camera_pipewire.c", "start": 328924775, "end": 328963358}, {"filename": "/external/SDL/src/camera/v4l2/SDL_camera_v4l2.c", "start": 328963358, "end": 328998074}, {"filename": "/external/SDL/src/camera/vita/SDL_camera_vita.c", "start": 328998074, "end": 329006349}, {"filename": "/external/SDL/src/core/SDL_core_unsupported.c", "start": 329006349, "end": 329010998}, {"filename": "/external/SDL/src/core/SDL_core_unsupported.h", "start": 329010998, "end": 329015071}, {"filename": "/external/SDL/src/core/android/SDL_android.c", "start": 329015071, "end": 329153760}, {"filename": "/external/SDL/src/core/android/SDL_android.h", "start": 329153760, "end": 329160761}, {"filename": "/external/SDL/src/core/dos/SDL_dos.c", "start": 329160761, "end": 329166130}, {"filename": "/external/SDL/src/core/dos/SDL_dos.h", "start": 329166130, "end": 329171644}, {"filename": "/external/SDL/src/core/dos/SDL_dos_scheduler.c", "start": 329171644, "end": 329181436}, {"filename": "/external/SDL/src/core/dos/SDL_dos_scheduler.h", "start": 329181436, "end": 329185158}, {"filename": "/external/SDL/src/core/freebsd/SDL_evdev_kbd_default_keyaccmap.h", "start": 329185158, "end": 329195961}, {"filename": "/external/SDL/src/core/freebsd/SDL_evdev_kbd_freebsd.c", "start": 329195961, "end": 329218892}, {"filename": "/external/SDL/src/core/gdk/SDL_gdk.cpp", "start": 329218892, "end": 329224524}, {"filename": "/external/SDL/src/core/gdk/SDL_gdk.h", "start": 329224524, "end": 329225708}, {"filename": "/external/SDL/src/core/haiku/SDL_BApp.h", "start": 329225708, "end": 329237652}, {"filename": "/external/SDL/src/core/haiku/SDL_BeApp.cc", "start": 329237652, "end": 329242647}, {"filename": "/external/SDL/src/core/haiku/SDL_BeApp.h", "start": 329242647, "end": 329244030}, {"filename": "/external/SDL/src/core/linux/SDL_dbus.c", "start": 329244030, "end": 329328361}, {"filename": "/external/SDL/src/core/linux/SDL_dbus.h", "start": 329328361, "end": 329337017}, {"filename": "/external/SDL/src/core/linux/SDL_evdev.c", "start": 329337017, "end": 329376171}, {"filename": "/external/SDL/src/core/linux/SDL_evdev.h", "start": 329376171, "end": 329377762}, {"filename": "/external/SDL/src/core/linux/SDL_evdev_capabilities.c", "start": 329377762, "end": 329384178}, {"filename": "/external/SDL/src/core/linux/SDL_evdev_capabilities.h", "start": 329384178, "end": 329387052}, {"filename": "/external/SDL/src/core/linux/SDL_evdev_kbd.c", "start": 329387052, "end": 329414598}, {"filename": "/external/SDL/src/core/linux/SDL_evdev_kbd.h", "start": 329414598, "end": 329416448}, {"filename": "/external/SDL/src/core/linux/SDL_evdev_kbd_default_accents.h", "start": 329416448, "end": 329425416}, {"filename": "/external/SDL/src/core/linux/SDL_evdev_kbd_default_keymap.h", "start": 329425416, "end": 329726991}, {"filename": "/external/SDL/src/core/linux/SDL_fcitx.c", "start": 329726991, "end": 329741760}, {"filename": "/external/SDL/src/core/linux/SDL_fcitx.h", "start": 329741760, "end": 329743162}, {"filename": "/external/SDL/src/core/linux/SDL_ibus.c", "start": 329743162, "end": 329766541}, {"filename": "/external/SDL/src/core/linux/SDL_ibus.h", "start": 329766541, "end": 329768689}, {"filename": "/external/SDL/src/core/linux/SDL_ime.c", "start": 329768689, "end": 329773343}, {"filename": "/external/SDL/src/core/linux/SDL_ime.h", "start": 329773343, "end": 329774725}, {"filename": "/external/SDL/src/core/linux/SDL_progressbar.c", "start": 329774725, "end": 329780437}, {"filename": "/external/SDL/src/core/linux/SDL_progressbar.h", "start": 329780437, "end": 329781639}, {"filename": "/external/SDL/src/core/linux/SDL_sysfs.c", "start": 329781639, "end": 329784833}, {"filename": "/external/SDL/src/core/linux/SDL_sysfs.h", "start": 329784833, "end": 329786157}, {"filename": "/external/SDL/src/core/linux/SDL_system_theme.c", "start": 329786157, "end": 329793834}, {"filename": "/external/SDL/src/core/linux/SDL_system_theme.h", "start": 329793834, "end": 329795009}, {"filename": "/external/SDL/src/core/linux/SDL_threadprio.c", "start": 329795009, "end": 329807837}, {"filename": "/external/SDL/src/core/linux/SDL_ubuntu_touch.c", "start": 329807837, "end": 329810588}, {"filename": "/external/SDL/src/core/linux/SDL_ubuntu_touch.h", "start": 329810588, "end": 329811683}, {"filename": "/external/SDL/src/core/linux/SDL_udev.c", "start": 329811683, "end": 329832767}, {"filename": "/external/SDL/src/core/linux/SDL_udev.h", "start": 329832767, "end": 329837617}, {"filename": "/external/SDL/src/core/macos/SDL_ioreg.c", "start": 329837617, "end": 329840608}, {"filename": "/external/SDL/src/core/macos/SDL_ioreg.h", "start": 329840608, "end": 329842038}, {"filename": "/external/SDL/src/core/ngage/SDL_ngage.cpp", "start": 329842038, "end": 329843726}, {"filename": "/external/SDL/src/core/ngage/SDL_ngage.h", "start": 329843726, "end": 329844991}, {"filename": "/external/SDL/src/core/openbsd/SDL_wscons.h", "start": 329844991, "end": 329846047}, {"filename": "/external/SDL/src/core/openbsd/SDL_wscons_kbd.c", "start": 329846047, "end": 329881486}, {"filename": "/external/SDL/src/core/openbsd/SDL_wscons_mouse.c", "start": 329881486, "end": 329885590}, {"filename": "/external/SDL/src/core/openharmony/SDL_openharmony.c", "start": 329885590, "end": 329938393}, {"filename": "/external/SDL/src/core/openharmony/SDL_openharmony.h", "start": 329938393, "end": 329941243}, {"filename": "/external/SDL/src/core/unix/SDL_appid.c", "start": 329941243, "end": 329942804}, {"filename": "/external/SDL/src/core/unix/SDL_appid.h", "start": 329942804, "end": 329943876}, {"filename": "/external/SDL/src/core/unix/SDL_fribidi.c", "start": 329943876, "end": 329949845}, {"filename": "/external/SDL/src/core/unix/SDL_fribidi.h", "start": 329949845, "end": 329952947}, {"filename": "/external/SDL/src/core/unix/SDL_libthai.c", "start": 329952947, "end": 329954993}, {"filename": "/external/SDL/src/core/unix/SDL_libthai.h", "start": 329954993, "end": 329956465}, {"filename": "/external/SDL/src/core/unix/SDL_poll.c", "start": 329956465, "end": 329958805}, {"filename": "/external/SDL/src/core/unix/SDL_poll.h", "start": 329958805, "end": 329960018}, {"filename": "/external/SDL/src/core/windows/SDL_directx.h", "start": 329960018, "end": 329963050}, {"filename": "/external/SDL/src/core/windows/SDL_gameinput.cpp", "start": 329963050, "end": 329965850}, {"filename": "/external/SDL/src/core/windows/SDL_gameinput.h", "start": 329965850, "end": 329968258}, {"filename": "/external/SDL/src/core/windows/SDL_hid.c", "start": 329968258, "end": 329986712}, {"filename": "/external/SDL/src/core/windows/SDL_hid.h", "start": 329986712, "end": 329994537}, {"filename": "/external/SDL/src/core/windows/SDL_immdevice.c", "start": 329994537, "end": 330016273}, {"filename": "/external/SDL/src/core/windows/SDL_immdevice.h", "start": 330016273, "end": 330018338}, {"filename": "/external/SDL/src/core/windows/SDL_windows.c", "start": 330018338, "end": 330046226}, {"filename": "/external/SDL/src/core/windows/SDL_windows.h", "start": 330046226, "end": 330055055}, {"filename": "/external/SDL/src/core/windows/SDL_xinput.c", "start": 330055055, "end": 330059944}, {"filename": "/external/SDL/src/core/windows/SDL_xinput.h", "start": 330059944, "end": 330067902}, {"filename": "/external/SDL/src/core/windows/gameinput/gameinput.cpp", "start": 330067902, "end": 330086651}, {"filename": "/external/SDL/src/core/windows/gameinput/gameinput.h", "start": 330086651, "end": 330139595}, {"filename": "/external/SDL/src/core/windows/pch.c", "start": 330139595, "end": 330140581}, {"filename": "/external/SDL/src/core/windows/pch_cpp.cpp", "start": 330140581, "end": 330141567}, {"filename": "/external/SDL/src/core/windows/version.rc", "start": 330141567, "end": 330142526}, {"filename": "/external/SDL/src/cpuinfo/SDL_cpuinfo.c", "start": 330142526, "end": 330185422}, {"filename": "/external/SDL/src/cpuinfo/SDL_cpuinfo_c.h", "start": 330185422, "end": 330186503}, {"filename": "/external/SDL/src/dialog/SDL_dialog.c", "start": 330186503, "end": 330191563}, {"filename": "/external/SDL/src/dialog/SDL_dialog.h", "start": 330191563, "end": 330192666}, {"filename": "/external/SDL/src/dialog/SDL_dialog_utils.c", "start": 330192666, "end": 330200966}, {"filename": "/external/SDL/src/dialog/SDL_dialog_utils.h", "start": 330200966, "end": 330204026}, {"filename": "/external/SDL/src/dialog/android/SDL_androiddialog.c", "start": 330204026, "end": 330206149}, {"filename": "/external/SDL/src/dialog/cocoa/SDL_cocoadialog.m", "start": 330206149, "end": 330215025}, {"filename": "/external/SDL/src/dialog/dummy/SDL_dummydialog.c", "start": 330215025, "end": 330216302}, {"filename": "/external/SDL/src/dialog/haiku/SDL_haikudialog.cc", "start": 330216302, "end": 330225029}, {"filename": "/external/SDL/src/dialog/unix/SDL_portaldialog.c", "start": 330225029, "end": 330248880}, {"filename": "/external/SDL/src/dialog/unix/SDL_portaldialog.h", "start": 330248880, "end": 330250108}, {"filename": "/external/SDL/src/dialog/unix/SDL_unixdialog.c", "start": 330250108, "end": 330253089}, {"filename": "/external/SDL/src/dialog/unix/SDL_zenitydialog.c", "start": 330253089, "end": 330266022}, {"filename": "/external/SDL/src/dialog/unix/SDL_zenitydialog.h", "start": 330266022, "end": 330267264}, {"filename": "/external/SDL/src/dialog/unix/SDL_zenitymessagebox.c", "start": 330267264, "end": 330274681}, {"filename": "/external/SDL/src/dialog/unix/SDL_zenitymessagebox.h", "start": 330274681, "end": 330275905}, {"filename": "/external/SDL/src/dialog/windows/SDL_windowsdialog.c", "start": 330275905, "end": 330323909}, {"filename": "/external/SDL/src/dynapi/SDL_dynapi.c", "start": 330323909, "end": 330360303}, {"filename": "/external/SDL/src/dynapi/SDL_dynapi.exports", "start": 330360303, "end": 330390766}, {"filename": "/external/SDL/src/dynapi/SDL_dynapi.h", "start": 330390766, "end": 330394522}, {"filename": "/external/SDL/src/dynapi/SDL_dynapi.sym", "start": 330394522, "end": 330430343}, {"filename": "/external/SDL/src/dynapi/SDL_dynapi_overrides.h", "start": 330430343, "end": 330505556}, {"filename": "/external/SDL/src/dynapi/SDL_dynapi_procs.h", "start": 330505556, "end": 330624622}, {"filename": "/external/SDL/src/dynapi/SDL_dynapi_unsupported.h", "start": 330624622, "end": 330625965}, {"filename": "/external/SDL/src/dynapi/gendynapi.py", "start": 330625965, "end": 330646411}, {"filename": "/external/SDL/src/events/SDL_categories.c", "start": 330646411, "end": 330654810}, {"filename": "/external/SDL/src/events/SDL_categories_c.h", "start": 330654810, "end": 330657305}, {"filename": "/external/SDL/src/events/SDL_clipboardevents.c", "start": 330657305, "end": 330659085}, {"filename": "/external/SDL/src/events/SDL_clipboardevents_c.h", "start": 330659085, "end": 330660273}, {"filename": "/external/SDL/src/events/SDL_displayevents.c", "start": 330660273, "end": 330662657}, {"filename": "/external/SDL/src/events/SDL_displayevents_c.h", "start": 330662657, "end": 330663859}, {"filename": "/external/SDL/src/events/SDL_dropevents.c", "start": 330663859, "end": 330667626}, {"filename": "/external/SDL/src/events/SDL_dropevents_c.h", "start": 330667626, "end": 330668993}, {"filename": "/external/SDL/src/events/SDL_events.c", "start": 330668993, "end": 330743670}, {"filename": "/external/SDL/src/events/SDL_events_c.h", "start": 330743670, "end": 330746440}, {"filename": "/external/SDL/src/events/SDL_eventwatch.c", "start": 330746440, "end": 330750657}, {"filename": "/external/SDL/src/events/SDL_eventwatch_c.h", "start": 330750657, "end": 330752379}, {"filename": "/external/SDL/src/events/SDL_keyboard.c", "start": 330752379, "end": 330781834}, {"filename": "/external/SDL/src/events/SDL_keyboard_c.h", "start": 330781834, "end": 330785839}, {"filename": "/external/SDL/src/events/SDL_keymap.c", "start": 330785839, "end": 330825786}, {"filename": "/external/SDL/src/events/SDL_keymap_c.h", "start": 330825786, "end": 330827744}, {"filename": "/external/SDL/src/events/SDL_keysym_to_keycode.c", "start": 330827744, "end": 330832764}, {"filename": "/external/SDL/src/events/SDL_keysym_to_keycode_c.h", "start": 330832764, "end": 330833978}, {"filename": "/external/SDL/src/events/SDL_keysym_to_scancode.c", "start": 330833978, "end": 330853148}, {"filename": "/external/SDL/src/events/SDL_keysym_to_scancode_c.h", "start": 330853148, "end": 330854397}, {"filename": "/external/SDL/src/events/SDL_mouse.c", "start": 330854397, "end": 330917128}, {"filename": "/external/SDL/src/events/SDL_mouse_c.h", "start": 330917128, "end": 330925518}, {"filename": "/external/SDL/src/events/SDL_notificationevents.c", "start": 330925518, "end": 330927101}, {"filename": "/external/SDL/src/events/SDL_notificationevents_c.h", "start": 330927101, "end": 330928310}, {"filename": "/external/SDL/src/events/SDL_pen.c", "start": 330928310, "end": 330957098}, {"filename": "/external/SDL/src/events/SDL_pen_c.h", "start": 330957098, "end": 330963450}, {"filename": "/external/SDL/src/events/SDL_quit.c", "start": 330963450, "end": 330968564}, {"filename": "/external/SDL/src/events/SDL_scancode_tables.c", "start": 330968564, "end": 330971268}, {"filename": "/external/SDL/src/events/SDL_scancode_tables_c.h", "start": 330971268, "end": 330972638}, {"filename": "/external/SDL/src/events/SDL_touch.c", "start": 330972638, "end": 330993166}, {"filename": "/external/SDL/src/events/SDL_touch_c.h", "start": 330993166, "end": 330995416}, {"filename": "/external/SDL/src/events/SDL_windowevents.c", "start": 330995416, "end": 331006799}, {"filename": "/external/SDL/src/events/SDL_windowevents_c.h", "start": 331006799, "end": 331008623}, {"filename": "/external/SDL/src/events/blank_cursor.h", "start": 331008623, "end": 331009995}, {"filename": "/external/SDL/src/events/default_cursor.h", "start": 331009995, "end": 331012698}, {"filename": "/external/SDL/src/events/imKStoUCS.c", "start": 331012698, "end": 331035593}, {"filename": "/external/SDL/src/events/imKStoUCS.h", "start": 331035593, "end": 331036995}, {"filename": "/external/SDL/src/events/scancodes_darwin.h", "start": 331036995, "end": 331044935}, {"filename": "/external/SDL/src/events/scancodes_linux.h", "start": 331044935, "end": 331096013}, {"filename": "/external/SDL/src/events/scancodes_windows.h", "start": 331096013, "end": 331107646}, {"filename": "/external/SDL/src/events/scancodes_xfree86.h", "start": 331107646, "end": 331134875}, {"filename": "/external/SDL/src/filesystem/SDL_filesystem.c", "start": 331134875, "end": 331153261}, {"filename": "/external/SDL/src/filesystem/SDL_filesystem_c.h", "start": 331153261, "end": 331154372}, {"filename": "/external/SDL/src/filesystem/SDL_sysfilesystem.h", "start": 331154372, "end": 331156612}, {"filename": "/external/SDL/src/filesystem/android/SDL_sysfilesystem.c", "start": 331156612, "end": 331158723}, {"filename": "/external/SDL/src/filesystem/cocoa/SDL_sysfilesystem.m", "start": 331158723, "end": 331167100}, {"filename": "/external/SDL/src/filesystem/dos/SDL_sysfilesystem.c", "start": 331167100, "end": 331172560}, {"filename": "/external/SDL/src/filesystem/dummy/SDL_sysfilesystem.c", "start": 331172560, "end": 331174380}, {"filename": "/external/SDL/src/filesystem/dummy/SDL_sysfsops.c", "start": 331174380, "end": 331176209}, {"filename": "/external/SDL/src/filesystem/emscripten/SDL_sysfilesystem.c", "start": 331176209, "end": 331179488}, {"filename": "/external/SDL/src/filesystem/gdk/SDL_sysfilesystem.cpp", "start": 331179488, "end": 331184031}, {"filename": "/external/SDL/src/filesystem/haiku/SDL_sysfilesystem.cc", "start": 331184031, "end": 331188952}, {"filename": "/external/SDL/src/filesystem/n3ds/SDL_sysfilesystem.c", "start": 331188952, "end": 331191388}, {"filename": "/external/SDL/src/filesystem/ngage/SDL_sysfilesystem.c", "start": 331191388, "end": 331193742}, {"filename": "/external/SDL/src/filesystem/ngage/SDL_sysfilesystem.cpp", "start": 331193742, "end": 331196138}, {"filename": "/external/SDL/src/filesystem/openharmony/SDL_sysfilesystem.c", "start": 331196138, "end": 331198773}, {"filename": "/external/SDL/src/filesystem/posix/SDL_sysfsops.c", "start": 331198773, "end": 331213016}, {"filename": "/external/SDL/src/filesystem/ps2/SDL_sysfilesystem.c", "start": 331213016, "end": 331216024}, {"filename": "/external/SDL/src/filesystem/psp/SDL_sysfilesystem.c", "start": 331216024, "end": 331218346}, {"filename": "/external/SDL/src/filesystem/riscos/SDL_sysfilesystem.c", "start": 331218346, "end": 331224274}, {"filename": "/external/SDL/src/filesystem/unix/SDL_sysfilesystem.c", "start": 331224274, "end": 331242968}, {"filename": "/external/SDL/src/filesystem/vita/SDL_sysfilesystem.c", "start": 331242968, "end": 331245334}, {"filename": "/external/SDL/src/filesystem/windows/SDL_sysfilesystem.c", "start": 331245334, "end": 331256858}, {"filename": "/external/SDL/src/filesystem/windows/SDL_sysfsops.c", "start": 331256858, "end": 331265018}, {"filename": "/external/SDL/src/gpu/SDL_gpu.c", "start": 331265018, "end": 331394831}, {"filename": "/external/SDL/src/gpu/SDL_sysgpu.h", "start": 331394831, "end": 331441461}, {"filename": "/external/SDL/src/gpu/d3d12/D3D12_Blit.h", "start": 331441461, "end": 331508609}, {"filename": "/external/SDL/src/gpu/d3d12/D3D_Blit.hlsl", "start": 331508609, "end": 331512422}, {"filename": "/external/SDL/src/gpu/d3d12/SDL_gpu_d3d12.c", "start": 331512422, "end": 331908534}, {"filename": "/external/SDL/src/gpu/d3d12/compile_shaders.bat", "start": 331908534, "end": 331909692}, {"filename": "/external/SDL/src/gpu/d3d12/compile_shaders_xbox.bat", "start": 331909692, "end": 331909996}, {"filename": "/external/SDL/src/gpu/metal/Metal_Blit.h", "start": 331909996, "end": 332661644}, {"filename": "/external/SDL/src/gpu/metal/Metal_Blit.metal", "start": 332661644, "end": 332665977}, {"filename": "/external/SDL/src/gpu/metal/SDL_gpu_metal.m", "start": 332665977, "end": 332856570}, {"filename": "/external/SDL/src/gpu/metal/compile_shaders.sh", "start": 332856570, "end": 332858662}, {"filename": "/external/SDL/src/gpu/vulkan/SDL_gpu_vulkan.c", "start": 332858662, "end": 333408421}, {"filename": "/external/SDL/src/gpu/vulkan/SDL_gpu_vulkan_vkfuncs.h", "start": 333408421, "end": 333415627}, {"filename": "/external/SDL/src/gpu/xr/SDL_gpu_openxr.c", "start": 333415627, "end": 333425093}, {"filename": "/external/SDL/src/gpu/xr/SDL_gpu_openxr.h", "start": 333425093, "end": 333426301}, {"filename": "/external/SDL/src/gpu/xr/SDL_openxr_internal.h", "start": 333426301, "end": 333428608}, {"filename": "/external/SDL/src/gpu/xr/SDL_openxrdyn.c", "start": 333428608, "end": 333444717}, {"filename": "/external/SDL/src/gpu/xr/SDL_openxrdyn.h", "start": 333444717, "end": 333446624}, {"filename": "/external/SDL/src/gpu/xr/SDL_openxrsym.h", "start": 333446624, "end": 333448416}, {"filename": "/external/SDL/src/haptic/SDL_haptic.c", "start": 333448416, "end": 333474371}, {"filename": "/external/SDL/src/haptic/SDL_haptic_c.h", "start": 333474371, "end": 333475485}, {"filename": "/external/SDL/src/haptic/SDL_syshaptic.h", "start": 333475485, "end": 333481526}, {"filename": "/external/SDL/src/haptic/android/SDL_syshaptic.c", "start": 333481526, "end": 333489472}, {"filename": "/external/SDL/src/haptic/android/SDL_syshaptic_c.h", "start": 333489472, "end": 333490636}, {"filename": "/external/SDL/src/haptic/darwin/SDL_syshaptic.c", "start": 333490636, "end": 333531959}, {"filename": "/external/SDL/src/haptic/darwin/SDL_syshaptic_c.h", "start": 333531959, "end": 333533247}, {"filename": "/external/SDL/src/haptic/dummy/SDL_syshaptic.c", "start": 333533247, "end": 333536852}, {"filename": "/external/SDL/src/haptic/hidapi/SDL_hidapihaptic.c", "start": 333536852, "end": 333546855}, {"filename": "/external/SDL/src/haptic/hidapi/SDL_hidapihaptic.h", "start": 333546855, "end": 333549252}, {"filename": "/external/SDL/src/haptic/hidapi/SDL_hidapihaptic_c.h", "start": 333549252, "end": 333553502}, {"filename": "/external/SDL/src/haptic/hidapi/SDL_hidapihaptic_lg4ff.c", "start": 333553502, "end": 333594861}, {"filename": "/external/SDL/src/haptic/linux/SDL_syshaptic.c", "start": 333594861, "end": 333627058}, {"filename": "/external/SDL/src/haptic/windows/SDL_dinputhaptic.c", "start": 333627058, "end": 333670651}, {"filename": "/external/SDL/src/haptic/windows/SDL_dinputhaptic_c.h", "start": 333670651, "end": 333673395}, {"filename": "/external/SDL/src/haptic/windows/SDL_windowshaptic.c", "start": 333673395, "end": 333682968}, {"filename": "/external/SDL/src/haptic/windows/SDL_windowshaptic_c.h", "start": 333682968, "end": 333685422}, {"filename": "/external/SDL/src/hidapi/AUTHORS.txt", "start": 333685422, "end": 333685865}, {"filename": "/external/SDL/src/hidapi/BUILD.autotools.md", "start": 333685865, "end": 333689565}, {"filename": "/external/SDL/src/hidapi/BUILD.cmake.md", "start": 333689565, "end": 333705790}, {"filename": "/external/SDL/src/hidapi/BUILD.md", "start": 333705790, "end": 333711201}, {"filename": "/external/SDL/src/hidapi/CMakeLists.txt", "start": 333711201, "end": 333715357}, {"filename": "/external/SDL/src/hidapi/HACKING.txt", "start": 333715357, "end": 333716206}, {"filename": "/external/SDL/src/hidapi/LICENSE-bsd.txt", "start": 333716206, "end": 333717766}, {"filename": "/external/SDL/src/hidapi/LICENSE-gpl3.txt", "start": 333717766, "end": 333753587}, {"filename": "/external/SDL/src/hidapi/LICENSE-orig.txt", "start": 333753587, "end": 333753860}, {"filename": "/external/SDL/src/hidapi/LICENSE.txt", "start": 333753860, "end": 333754403}, {"filename": "/external/SDL/src/hidapi/Makefile.am", "start": 333754403, "end": 333755652}, {"filename": "/external/SDL/src/hidapi/README.md", "start": 333755652, "end": 333762852}, {"filename": "/external/SDL/src/hidapi/SDL_hidapi.c", "start": 333762852, "end": 333827291}, {"filename": "/external/SDL/src/hidapi/SDL_hidapi_android.h", "start": 333827291, "end": 333828430}, {"filename": "/external/SDL/src/hidapi/SDL_hidapi_c.h", "start": 333828430, "end": 333829920}, {"filename": "/external/SDL/src/hidapi/SDL_hidapi_ios.h", "start": 333829920, "end": 333831062}, {"filename": "/external/SDL/src/hidapi/SDL_hidapi_libusb.h", "start": 333831062, "end": 333836129}, {"filename": "/external/SDL/src/hidapi/SDL_hidapi_linux.h", "start": 333836129, "end": 333839125}, {"filename": "/external/SDL/src/hidapi/SDL_hidapi_mac.h", "start": 333839125, "end": 333840193}, {"filename": "/external/SDL/src/hidapi/SDL_hidapi_netbsd.h", "start": 333840193, "end": 333841264}, {"filename": "/external/SDL/src/hidapi/SDL_hidapi_steamxbox.h", "start": 333841264, "end": 333842272}, {"filename": "/external/SDL/src/hidapi/SDL_hidapi_windows.h", "start": 333842272, "end": 333845091}, {"filename": "/external/SDL/src/hidapi/VERSION", "start": 333845091, "end": 333845097}, {"filename": "/external/SDL/src/hidapi/android/hid.cpp", "start": 333845097, "end": 333889149}, {"filename": "/external/SDL/src/hidapi/android/hid.h", "start": 333889149, "end": 333890377}, {"filename": "/external/SDL/src/hidapi/bootstrap", "start": 333890377, "end": 333890431}, {"filename": "/external/SDL/src/hidapi/configure.ac", "start": 333890431, "end": 333898476}, {"filename": "/external/SDL/src/hidapi/dist/hidapi.podspec", "start": 333898476, "end": 333899924}, {"filename": "/external/SDL/src/hidapi/documentation/cmake-gui-drop-down.png", "start": 333899924, "end": 333922240}, {"filename": "/external/SDL/src/hidapi/documentation/cmake-gui-highlights.png", "start": 333922240, "end": 333999567}, {"filename": "/external/SDL/src/hidapi/doxygen/Doxyfile", "start": 333999567, "end": 334123779}, {"filename": "/external/SDL/src/hidapi/doxygen/main_page.md", "start": 334123779, "end": 334124376}, {"filename": "/external/SDL/src/hidapi/hidapi/hidapi.h", "start": 334124376, "end": 334146737}, {"filename": "/external/SDL/src/hidapi/hidtest/CMakeLists.txt", "start": 334146737, "end": 334148122}, {"filename": "/external/SDL/src/hidapi/hidtest/Makefile.am", "start": 334148122, "end": 334148706}, {"filename": "/external/SDL/src/hidapi/hidtest/test.c", "start": 334148706, "end": 334157086}, {"filename": "/external/SDL/src/hidapi/ios/hid.m", "start": 334157086, "end": 334194891}, {"filename": "/external/SDL/src/hidapi/libusb/CMakeLists.txt", "start": 334194891, "end": 334199079}, {"filename": "/external/SDL/src/hidapi/libusb/Makefile-manual", "start": 334199079, "end": 334199393}, {"filename": "/external/SDL/src/hidapi/libusb/Makefile.am", "start": 334199393, "end": 334200261}, {"filename": "/external/SDL/src/hidapi/libusb/Makefile.freebsd", "start": 334200261, "end": 334201072}, {"filename": "/external/SDL/src/hidapi/libusb/Makefile.haiku", "start": 334201072, "end": 334201895}, {"filename": "/external/SDL/src/hidapi/libusb/Makefile.linux", "start": 334201895, "end": 334202843}, {"filename": "/external/SDL/src/hidapi/libusb/hid.c", "start": 334202843, "end": 334272453}, {"filename": "/external/SDL/src/hidapi/libusb/hidapi_libusb.h", "start": 334272453, "end": 334274194}, {"filename": "/external/SDL/src/hidapi/libusb/hidapi_thread_pthread.h", "start": 334274194, "end": 334278835}, {"filename": "/external/SDL/src/hidapi/libusb/hidapi_thread_sdl.h", "start": 334278835, "end": 334284888}, {"filename": "/external/SDL/src/hidapi/linux/CMakeLists.txt", "start": 334284888, "end": 334286056}, {"filename": "/external/SDL/src/hidapi/linux/Makefile-manual", "start": 334286056, "end": 334286945}, {"filename": "/external/SDL/src/hidapi/linux/Makefile.am", "start": 334286945, "end": 334287276}, {"filename": "/external/SDL/src/hidapi/linux/hid.c", "start": 334287276, "end": 334328940}, {"filename": "/external/SDL/src/hidapi/m4/ax_pthread.m4", "start": 334328940, "end": 334341783}, {"filename": "/external/SDL/src/hidapi/m4/pkg.m4", "start": 334341783, "end": 334347161}, {"filename": "/external/SDL/src/hidapi/mac/CMakeLists.txt", "start": 334347161, "end": 334348629}, {"filename": "/external/SDL/src/hidapi/mac/Makefile-manual", "start": 334348629, "end": 334349128}, {"filename": "/external/SDL/src/hidapi/mac/Makefile.am", "start": 334349128, "end": 334349376}, {"filename": "/external/SDL/src/hidapi/mac/hid.c", "start": 334349376, "end": 334396682}, {"filename": "/external/SDL/src/hidapi/mac/hidapi_darwin.h", "start": 334396682, "end": 334399918}, {"filename": "/external/SDL/src/hidapi/meson.build", "start": 334399918, "end": 334400834}, {"filename": "/external/SDL/src/hidapi/netbsd/CMakeLists.txt", "start": 334400834, "end": 334401896}, {"filename": "/external/SDL/src/hidapi/netbsd/README.md", "start": 334401896, "end": 334403144}, {"filename": "/external/SDL/src/hidapi/netbsd/hid.c", "start": 334403144, "end": 334434125}, {"filename": "/external/SDL/src/hidapi/pc/hidapi-hidraw.pc.in", "start": 334434125, "end": 334434499}, {"filename": "/external/SDL/src/hidapi/pc/hidapi-libusb.pc.in", "start": 334434499, "end": 334434863}, {"filename": "/external/SDL/src/hidapi/pc/hidapi-netbsd.pc.in", "start": 334434863, "end": 334435237}, {"filename": "/external/SDL/src/hidapi/pc/hidapi.pc.in", "start": 334435237, "end": 334435562}, {"filename": "/external/SDL/src/hidapi/src/CMakeLists.txt", "start": 334435562, "end": 334442754}, {"filename": "/external/SDL/src/hidapi/src/cmake/hidapi-config.cmake.in", "start": 334442754, "end": 334444673}, {"filename": "/external/SDL/src/hidapi/subprojects/README.md", "start": 334444673, "end": 334444829}, {"filename": "/external/SDL/src/hidapi/subprojects/hidapi_build_cmake/CMakeLists.txt", "start": 334444829, "end": 334445256}, {"filename": "/external/SDL/src/hidapi/testgui/Makefile-manual", "start": 334445256, "end": 334445619}, {"filename": "/external/SDL/src/hidapi/testgui/Makefile.am", "start": 334445619, "end": 334446776}, {"filename": "/external/SDL/src/hidapi/testgui/Makefile.freebsd", "start": 334446776, "end": 334447426}, {"filename": "/external/SDL/src/hidapi/testgui/Makefile.linux", "start": 334447426, "end": 334448082}, {"filename": "/external/SDL/src/hidapi/testgui/Makefile.mac", "start": 334448082, "end": 334449200}, {"filename": "/external/SDL/src/hidapi/testgui/Makefile.mingw", "start": 334449200, "end": 334449947}, {"filename": "/external/SDL/src/hidapi/testgui/TestGUI.app.in/Contents/Info.plist", "start": 334449947, "end": 334450791}, {"filename": "/external/SDL/src/hidapi/testgui/TestGUI.app.in/Contents/PkgInfo", "start": 334450791, "end": 334450799}, {"filename": "/external/SDL/src/hidapi/testgui/TestGUI.app.in/Contents/Resources/English.lproj/InfoPlist.strings", "start": 334450799, "end": 334450891}, {"filename": "/external/SDL/src/hidapi/testgui/TestGUI.app.in/Contents/Resources/Signal11.icns", "start": 334450891, "end": 334472809}, {"filename": "/external/SDL/src/hidapi/testgui/copy_to_bundle.sh", "start": 334472809, "end": 334475486}, {"filename": "/external/SDL/src/hidapi/testgui/mac_support.h", "start": 334475486, "end": 334475769}, {"filename": "/external/SDL/src/hidapi/testgui/mac_support_cocoa.m", "start": 334475769, "end": 334478204}, {"filename": "/external/SDL/src/hidapi/testgui/test.cpp", "start": 334478204, "end": 334493965}, {"filename": "/external/SDL/src/hidapi/testgui/testgui.sln", "start": 334493965, "end": 334494849}, {"filename": "/external/SDL/src/hidapi/testgui/testgui.vcproj", "start": 334494849, "end": 334499661}, {"filename": "/external/SDL/src/hidapi/udev/69-hid.rules", "start": 334499661, "end": 334501336}, {"filename": "/external/SDL/src/hidapi/windows/CMakeLists.txt", "start": 334501336, "end": 334503007}, {"filename": "/external/SDL/src/hidapi/windows/Makefile-manual", "start": 334503007, "end": 334503211}, {"filename": "/external/SDL/src/hidapi/windows/Makefile.am", "start": 334503211, "end": 334503570}, {"filename": "/external/SDL/src/hidapi/windows/Makefile.mingw", "start": 334503570, "end": 334504139}, {"filename": "/external/SDL/src/hidapi/windows/hid.c", "start": 334504139, "end": 334557129}, {"filename": "/external/SDL/src/hidapi/windows/hidapi.rc", "start": 334557129, "end": 334558136}, {"filename": "/external/SDL/src/hidapi/windows/hidapi.sln", "start": 334558136, "end": 334560328}, {"filename": "/external/SDL/src/hidapi/windows/hidapi.vcproj", "start": 334560328, "end": 334564512}, {"filename": "/external/SDL/src/hidapi/windows/hidapi.vcxproj", "start": 334564512, "end": 334575798}, {"filename": "/external/SDL/src/hidapi/windows/hidapi_cfgmgr32.h", "start": 334575798, "end": 334579957}, {"filename": "/external/SDL/src/hidapi/windows/hidapi_descriptor_reconstruct.c", "start": 334579957, "end": 334631647}, {"filename": "/external/SDL/src/hidapi/windows/hidapi_descriptor_reconstruct.h", "start": 334631647, "end": 334639699}, {"filename": "/external/SDL/src/hidapi/windows/hidapi_hidclass.h", "start": 334639699, "end": 334640907}, {"filename": "/external/SDL/src/hidapi/windows/hidapi_hidpi.h", "start": 334640907, "end": 334642885}, {"filename": "/external/SDL/src/hidapi/windows/hidapi_hidsdi.h", "start": 334642885, "end": 334645323}, {"filename": "/external/SDL/src/hidapi/windows/hidapi_winapi.h", "start": 334645323, "end": 334647922}, {"filename": "/external/SDL/src/hidapi/windows/hidtest.vcproj", "start": 334647922, "end": 334652081}, {"filename": "/external/SDL/src/hidapi/windows/hidtest.vcxproj", "start": 334652081, "end": 334662542}, {"filename": "/external/SDL/src/hidapi/windows/pp_data_dump/CMakeLists.txt", "start": 334662542, "end": 334662882}, {"filename": "/external/SDL/src/hidapi/windows/pp_data_dump/README.md", "start": 334662882, "end": 334669306}, {"filename": "/external/SDL/src/hidapi/windows/pp_data_dump/pp_data_dump.c", "start": 334669306, "end": 334683961}, {"filename": "/external/SDL/src/hidapi/windows/test/CMakeLists.txt", "start": 334683961, "end": 334686945}, {"filename": "/external/SDL/src/hidapi/windows/test/data/045E_02FF_0005_0001.pp_data", "start": 334686945, "end": 334710077}, {"filename": "/external/SDL/src/hidapi/windows/test/data/045E_02FF_0005_0001_expected.rpt_desc", "start": 334710077, "end": 334710765}, {"filename": "/external/SDL/src/hidapi/windows/test/data/045E_02FF_0005_0001_real.rpt_desc", "start": 334710765, "end": 334713896}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046A_0011_0006_0001.pp_data", "start": 334713896, "end": 334723627}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046A_0011_0006_0001_expected.rpt_desc", "start": 334723627, "end": 334724035}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046A_0011_0006_0001_real.rpt_desc", "start": 334724035, "end": 334724443}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_0A37_0001_000C.pp_data", "start": 334724443, "end": 334753821}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_0A37_0001_000C_expected.rpt_desc", "start": 334753821, "end": 334754775}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_0A37_0001_000C_real.rpt_desc", "start": 334754775, "end": 334757006}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_B010_0001_000C.pp_data", "start": 334757006, "end": 334762013}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_B010_0001_000C_expected.rpt_desc", "start": 334762013, "end": 334762155}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_B010_0001_000C_real.rpt_desc", "start": 334762155, "end": 334763940}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_B010_0001_FF00.pp_data", "start": 334763940, "end": 334771276}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_B010_0001_FF00_expected.rpt_desc", "start": 334771276, "end": 334771498}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_B010_0001_FF00_real.rpt_desc", "start": 334771498, "end": 334773365}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_B010_0002_0001.pp_data", "start": 334773365, "end": 334789883}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_B010_0002_0001_expected.rpt_desc", "start": 334789883, "end": 334790347}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_B010_0002_0001_real.rpt_desc", "start": 334790347, "end": 334793325}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_B010_0002_FF00.pp_data", "start": 334793325, "end": 334800667}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_B010_0002_FF00_expected.rpt_desc", "start": 334800667, "end": 334800889}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_B010_0002_FF00_real.rpt_desc", "start": 334800889, "end": 334802757}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_B010_0006_0001.pp_data", "start": 334802757, "end": 334812588}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_B010_0006_0001_expected.rpt_desc", "start": 334812588, "end": 334813008}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_B010_0006_0001_real.rpt_desc", "start": 334813008, "end": 334815941}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C077_0002_0001.pp_data", "start": 334815941, "end": 334829574}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C077_0002_0001_expected.rpt_desc", "start": 334829574, "end": 334829858}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C077_0002_0001_real.rpt_desc", "start": 334829858, "end": 334830723}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C283_0004_0001.pp_data", "start": 334830723, "end": 334859460}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C283_0004_0001_expected.rpt_desc", "start": 334859460, "end": 334860520}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C283_0004_0001_real.rpt_desc", "start": 334860520, "end": 334861580}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C52F_0001_000C.pp_data", "start": 334861580, "end": 334866269}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C52F_0001_000C_expected.rpt_desc", "start": 334866269, "end": 334866423}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C52F_0001_000C_real.rpt_desc", "start": 334866423, "end": 334866829}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C52F_0001_FF00.pp_data", "start": 334866829, "end": 334874106}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C52F_0001_FF00_expected.rpt_desc", "start": 334874106, "end": 334874328}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C52F_0001_FF00_real.rpt_desc", "start": 334874328, "end": 334874789}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C52F_0002_0001.pp_data", "start": 334874789, "end": 334891253}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C52F_0002_0001_expected.rpt_desc", "start": 334891253, "end": 334891705}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C52F_0002_0001_real.rpt_desc", "start": 334891705, "end": 334892968}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C52F_0002_FF00.pp_data", "start": 334892968, "end": 334900251}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C52F_0002_FF00_expected.rpt_desc", "start": 334900251, "end": 334900473}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C52F_0002_FF00_real.rpt_desc", "start": 334900473, "end": 334900936}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C534_0001_000C.pp_data", "start": 334900936, "end": 334905625}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C534_0001_000C_expected.rpt_desc", "start": 334905625, "end": 334905779}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C534_0001_000C_real.rpt_desc", "start": 334905779, "end": 334906535}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C534_0001_FF00.pp_data", "start": 334906535, "end": 334913812}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C534_0001_FF00_expected.rpt_desc", "start": 334913812, "end": 334914034}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C534_0001_FF00_real.rpt_desc", "start": 334914034, "end": 334914894}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C534_0002_0001.pp_data", "start": 334914894, "end": 334931360}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C534_0002_0001_expected.rpt_desc", "start": 334931360, "end": 334931824}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C534_0002_0001_real.rpt_desc", "start": 334931824, "end": 334933827}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C534_0002_FF00.pp_data", "start": 334933827, "end": 334941110}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C534_0002_FF00_expected.rpt_desc", "start": 334941110, "end": 334941332}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C534_0002_FF00_real.rpt_desc", "start": 334941332, "end": 334942181}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C534_0006_0001.pp_data", "start": 334942181, "end": 334951946}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C534_0006_0001_expected.rpt_desc", "start": 334951946, "end": 334952354}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C534_0006_0001_real.rpt_desc", "start": 334952354, "end": 334954418}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C534_0080_0001.pp_data", "start": 334954418, "end": 334964253}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C534_0080_0001_expected.rpt_desc", "start": 334964253, "end": 334964445}, {"filename": "/external/SDL/src/hidapi/windows/test/data/046D_C534_0080_0001_real.rpt_desc", "start": 334964445, "end": 334965335}, {"filename": "/external/SDL/src/hidapi/windows/test/data/047F_C056_0001_000C.pp_data", "start": 334965335, "end": 334986422}, {"filename": "/external/SDL/src/hidapi/windows/test/data/047F_C056_0001_000C_expected.rpt_desc", "start": 334986422, "end": 334987034}, {"filename": "/external/SDL/src/hidapi/windows/test/data/047F_C056_0001_000C_real.rpt_desc", "start": 334987034, "end": 334989311}, {"filename": "/external/SDL/src/hidapi/windows/test/data/047F_C056_0003_FFA0.pp_data", "start": 334989311, "end": 335059597}, {"filename": "/external/SDL/src/hidapi/windows/test/data/047F_C056_0003_FFA0_expected.rpt_desc", "start": 335059597, "end": 335061053}, {"filename": "/external/SDL/src/hidapi/windows/test/data/047F_C056_0003_FFA0_real.rpt_desc", "start": 335061053, "end": 335066846}, {"filename": "/external/SDL/src/hidapi/windows/test/data/047F_C056_0005_000B.pp_data", "start": 335066846, "end": 335092062}, {"filename": "/external/SDL/src/hidapi/windows/test/data/047F_C056_0005_000B_expected.rpt_desc", "start": 335092062, "end": 335093072}, {"filename": "/external/SDL/src/hidapi/windows/test/data/047F_C056_0005_000B_real.rpt_desc", "start": 335093072, "end": 335096809}, {"filename": "/external/SDL/src/hidapi/windows/test/data/17CC_1130_0000_FF01.pp_data", "start": 335096809, "end": 335759148}, {"filename": "/external/SDL/src/hidapi/windows/test/data/17CC_1130_0000_FF01_expected.rpt_desc", "start": 335759148, "end": 335763772}, {"filename": "/external/SDL/src/hidapi/windows/test/data/17CC_1130_0000_FF01_real.rpt_desc", "start": 335763772, "end": 335779498}, {"filename": "/external/SDL/src/hidapi/windows/test/hid_report_reconstructor_test.c", "start": 335779498, "end": 335803541}, {"filename": "/external/SDL/src/io/SDL_asyncio.c", "start": 335803541, "end": 335814846}, {"filename": "/external/SDL/src/io/SDL_asyncio_c.h", "start": 335814846, "end": 335816062}, {"filename": "/external/SDL/src/io/SDL_iostream.c", "start": 335816062, "end": 335872165}, {"filename": "/external/SDL/src/io/SDL_iostream_c.h", "start": 335872165, "end": 335873562}, {"filename": "/external/SDL/src/io/SDL_sysasyncio.h", "start": 335873562, "end": 335879427}, {"filename": "/external/SDL/src/io/generic/SDL_asyncio_generic.c", "start": 335879427, "end": 335895787}, {"filename": "/external/SDL/src/io/io_uring/SDL_asyncio_liburing.c", "start": 335895787, "end": 335920053}, {"filename": "/external/SDL/src/io/n3ds/SDL_iostreamromfs.c", "start": 335920053, "end": 335922781}, {"filename": "/external/SDL/src/io/n3ds/SDL_iostreamromfs.h", "start": 335922781, "end": 335923923}, {"filename": "/external/SDL/src/io/windows/SDL_asyncio_windows_ioring.c", "start": 335923923, "end": 335946055}, {"filename": "/external/SDL/src/joystick/SDL_gamepad.c", "start": 335946055, "end": 336104235}, {"filename": "/external/SDL/src/joystick/SDL_gamepad_c.h", "start": 336104235, "end": 336106361}, {"filename": "/external/SDL/src/joystick/SDL_gamepad_db.h", "start": 336106361, "end": 336336622}, {"filename": "/external/SDL/src/joystick/SDL_joystick.c", "start": 336336622, "end": 336507012}, {"filename": "/external/SDL/src/joystick/SDL_joystick_c.h", "start": 336507012, "end": 336522296}, {"filename": "/external/SDL/src/joystick/SDL_steam_virtual_gamepad.c", "start": 336522296, "end": 336530796}, {"filename": "/external/SDL/src/joystick/SDL_steam_virtual_gamepad.h", "start": 336530796, "end": 336532235}, {"filename": "/external/SDL/src/joystick/SDL_sysjoystick.h", "start": 336532235, "end": 336543890}, {"filename": "/external/SDL/src/joystick/android/SDL_sysjoystick.c", "start": 336543890, "end": 336567676}, {"filename": "/external/SDL/src/joystick/android/SDL_sysjoystick_c.h", "start": 336567676, "end": 336569569}, {"filename": "/external/SDL/src/joystick/apple/SDL_mfijoystick.m", "start": 336569569, "end": 336645219}, {"filename": "/external/SDL/src/joystick/bsd/SDL_bsdjoystick.c", "start": 336645219, "end": 336668282}, {"filename": "/external/SDL/src/joystick/check_8bitdo.sh", "start": 336668282, "end": 336669330}, {"filename": "/external/SDL/src/joystick/controller_list.h", "start": 336669330, "end": 336751732}, {"filename": "/external/SDL/src/joystick/controller_type.c", "start": 336751732, "end": 336755909}, {"filename": "/external/SDL/src/joystick/controller_type.h", "start": 336755909, "end": 336759377}, {"filename": "/external/SDL/src/joystick/darwin/SDL_iokitjoystick.c", "start": 336759377, "end": 336801505}, {"filename": "/external/SDL/src/joystick/darwin/SDL_iokitjoystick_c.h", "start": 336801505, "end": 336804783}, {"filename": "/external/SDL/src/joystick/dos/SDL_sysjoystick.c", "start": 336804783, "end": 336812307}, {"filename": "/external/SDL/src/joystick/dummy/SDL_sysjoystick.c", "start": 336812307, "end": 336813597}, {"filename": "/external/SDL/src/joystick/emscripten/SDL_sysjoystick.c", "start": 336813597, "end": 336841467}, {"filename": "/external/SDL/src/joystick/gdk/SDL_gameinputjoystick.cpp", "start": 336841467, "end": 336891737}, {"filename": "/external/SDL/src/joystick/haiku/SDL_haikujoystick.cc", "start": 336891737, "end": 336898550}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_hidapi_8bitdo.c", "start": 336898550, "end": 336929716}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_hidapi_combined.c", "start": 336929716, "end": 336938051}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_hidapi_flydigi.c", "start": 336938051, "end": 336985067}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_hidapi_flydigi.h", "start": 336985067, "end": 336986488}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_hidapi_gamecube.c", "start": 336986488, "end": 337013948}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_hidapi_gamesir.c", "start": 337013948, "end": 337055377}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_hidapi_gip.c", "start": 337055377, "end": 337164163}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_hidapi_lg4ff.c", "start": 337164163, "end": 337197142}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_hidapi_luna.c", "start": 337197142, "end": 337211362}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_hidapi_nintendo.h", "start": 337211362, "end": 337213540}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_hidapi_ps3.c", "start": 337213540, "end": 337267240}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_hidapi_ps4.c", "start": 337267240, "end": 337321819}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_hidapi_ps5.c", "start": 337321819, "end": 337388153}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_hidapi_rumble.c", "start": 337388153, "end": 337396696}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_hidapi_rumble.h", "start": 337396696, "end": 337398771}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_hidapi_shield.c", "start": 337398771, "end": 337420080}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_hidapi_sinput.c", "start": 337420080, "end": 337460168}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_hidapi_sinput.h", "start": 337460168, "end": 337462668}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_hidapi_stadia.c", "start": 337462668, "end": 337472937}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_hidapi_steam.c", "start": 337472937, "end": 337533161}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_hidapi_steam_hori.c", "start": 337533161, "end": 337548091}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_hidapi_steam_triton.c", "start": 337548091, "end": 337578902}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_hidapi_steamdeck.c", "start": 337578902, "end": 337599957}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_hidapi_switch.c", "start": 337599957, "end": 337735442}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_hidapi_switch2.c", "start": 337735442, "end": 337785802}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_hidapi_wii.c", "start": 337785802, "end": 337841767}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_hidapi_xbox360.c", "start": 337841767, "end": 337862964}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_hidapi_xbox360.h", "start": 337862964, "end": 337863518}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_hidapi_xbox360bb.c", "start": 337863518, "end": 337872348}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_hidapi_xbox360w.c", "start": 337872348, "end": 337891180}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_hidapi_xboxone.c", "start": 337891180, "end": 337965787}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_hidapi_zuiki.c", "start": 337965787, "end": 337985755}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_hidapijoystick.c", "start": 337985755, "end": 338044384}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_hidapijoystick_c.h", "start": 338044384, "end": 338054088}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_report_descriptor.c", "start": 338054088, "end": 338071869}, {"filename": "/external/SDL/src/joystick/hidapi/SDL_report_descriptor.h", "start": 338071869, "end": 338073567}, {"filename": "/external/SDL/src/joystick/hidapi/steam/controller_constants.h", "start": 338073567, "end": 338090909}, {"filename": "/external/SDL/src/joystick/hidapi/steam/controller_structs.h", "start": 338090909, "end": 338107962}, {"filename": "/external/SDL/src/joystick/linux/SDL_sysjoystick.c", "start": 338107962, "end": 338207315}, {"filename": "/external/SDL/src/joystick/linux/SDL_sysjoystick_c.h", "start": 338207315, "end": 338210666}, {"filename": "/external/SDL/src/joystick/n3ds/SDL_sysjoystick.c", "start": 338210666, "end": 338220430}, {"filename": "/external/SDL/src/joystick/ps2/SDL_sysjoystick.c", "start": 338220430, "end": 338233698}, {"filename": "/external/SDL/src/joystick/psp/SDL_sysjoystick.c", "start": 338233698, "end": 338240434}, {"filename": "/external/SDL/src/joystick/sort_controllers.py", "start": 338240434, "end": 338246203}, {"filename": "/external/SDL/src/joystick/usb_ids.h", "start": 338246203, "end": 338261550}, {"filename": "/external/SDL/src/joystick/virtual/SDL_virtualjoystick.c", "start": 338261550, "end": 338291964}, {"filename": "/external/SDL/src/joystick/virtual/SDL_virtualjoystick_c.h", "start": 338291964, "end": 338294013}, {"filename": "/external/SDL/src/joystick/vita/SDL_sysjoystick.c", "start": 338294013, "end": 338304314}, {"filename": "/external/SDL/src/joystick/windows/SDL_dinputjoystick.c", "start": 338304314, "end": 338356774}, {"filename": "/external/SDL/src/joystick/windows/SDL_dinputjoystick_c.h", "start": 338356774, "end": 338359047}, {"filename": "/external/SDL/src/joystick/windows/SDL_xinputjoystick.c", "start": 338359047, "end": 338373897}, {"filename": "/external/SDL/src/joystick/windows/SDL_xinputjoystick_c.h", "start": 338373897, "end": 338375107}, {"filename": "/external/SDL/src/libm/e_atan2.c", "start": 338375107, "end": 338379335}, {"filename": "/external/SDL/src/libm/e_exp.c", "start": 338379335, "end": 338385668}, {"filename": "/external/SDL/src/libm/e_fmod.c", "start": 338385668, "end": 338389421}, {"filename": "/external/SDL/src/libm/e_log.c", "start": 338389421, "end": 338394393}, {"filename": "/external/SDL/src/libm/e_log10.c", "start": 338394393, "end": 338397636}, {"filename": "/external/SDL/src/libm/e_pow.c", "start": 338397636, "end": 338408803}, {"filename": "/external/SDL/src/libm/e_rem_pio2.c", "start": 338408803, "end": 338414251}, {"filename": "/external/SDL/src/libm/e_sqrt.c", "start": 338414251, "end": 338429237}, {"filename": "/external/SDL/src/libm/k_cos.c", "start": 338429237, "end": 338432246}, {"filename": "/external/SDL/src/libm/k_rem_pio2.c", "start": 338432246, "end": 338441164}, {"filename": "/external/SDL/src/libm/k_sin.c", "start": 338441164, "end": 338443523}, {"filename": "/external/SDL/src/libm/k_tan.c", "start": 338443523, "end": 338447617}, {"filename": "/external/SDL/src/libm/math_libm.h", "start": 338447617, "end": 338449633}, {"filename": "/external/SDL/src/libm/math_private.h", "start": 338449633, "end": 338457019}, {"filename": "/external/SDL/src/libm/s_atan.c", "start": 338457019, "end": 338461160}, {"filename": "/external/SDL/src/libm/s_copysign.c", "start": 338461160, "end": 338461972}, {"filename": "/external/SDL/src/libm/s_cos.c", "start": 338461972, "end": 338464016}, {"filename": "/external/SDL/src/libm/s_fabs.c", "start": 338464016, "end": 338464805}, {"filename": "/external/SDL/src/libm/s_floor.c", "start": 338464805, "end": 338466664}, {"filename": "/external/SDL/src/libm/s_isinf.c", "start": 338466664, "end": 338467146}, {"filename": "/external/SDL/src/libm/s_isinff.c", "start": 338467146, "end": 338467553}, {"filename": "/external/SDL/src/libm/s_isnan.c", "start": 338467553, "end": 338468316}, {"filename": "/external/SDL/src/libm/s_isnanf.c", "start": 338468316, "end": 338469145}, {"filename": "/external/SDL/src/libm/s_modf.c", "start": 338469145, "end": 338470994}, {"filename": "/external/SDL/src/libm/s_scalbn.c", "start": 338470994, "end": 338472906}, {"filename": "/external/SDL/src/libm/s_sin.c", "start": 338472906, "end": 338474941}, {"filename": "/external/SDL/src/libm/s_tan.c", "start": 338474941, "end": 338476819}, {"filename": "/external/SDL/src/loadso/dlopen/SDL_sysloadso.c", "start": 338476819, "end": 338479394}, {"filename": "/external/SDL/src/loadso/dummy/SDL_sysloadso.c", "start": 338479394, "end": 338480874}, {"filename": "/external/SDL/src/loadso/windows/SDL_sysloadso.c", "start": 338480874, "end": 338483108}, {"filename": "/external/SDL/src/locale/SDL_locale.c", "start": 338483108, "end": 338486482}, {"filename": "/external/SDL/src/locale/SDL_syslocale.h", "start": 338486482, "end": 338487679}, {"filename": "/external/SDL/src/locale/android/SDL_syslocale.c", "start": 338487679, "end": 338488859}, {"filename": "/external/SDL/src/locale/dummy/SDL_syslocale.c", "start": 338488859, "end": 338490041}, {"filename": "/external/SDL/src/locale/emscripten/SDL_syslocale.c", "start": 338490041, "end": 338492553}, {"filename": "/external/SDL/src/locale/haiku/SDL_syslocale.cc", "start": 338492553, "end": 338494907}, {"filename": "/external/SDL/src/locale/macos/SDL_syslocale.m", "start": 338494907, "end": 338497435}, {"filename": "/external/SDL/src/locale/n3ds/SDL_syslocale.c", "start": 338497435, "end": 338499576}, {"filename": "/external/SDL/src/locale/ngage/SDL_syslocale.cpp", "start": 338499576, "end": 338507069}, {"filename": "/external/SDL/src/locale/openharmony/SDL_syslocale.c", "start": 338507069, "end": 338508437}, {"filename": "/external/SDL/src/locale/psp/SDL_syslocale.c", "start": 338508437, "end": 338511297}, {"filename": "/external/SDL/src/locale/unix/SDL_syslocale.c", "start": 338511297, "end": 338514208}, {"filename": "/external/SDL/src/locale/vita/SDL_syslocale.c", "start": 338514208, "end": 338516317}, {"filename": "/external/SDL/src/locale/windows/SDL_syslocale.c", "start": 338516317, "end": 338520453}, {"filename": "/external/SDL/src/main/SDL_main_callbacks.c", "start": 338520453, "end": 338526402}, {"filename": "/external/SDL/src/main/SDL_main_callbacks.h", "start": 338526402, "end": 338528165}, {"filename": "/external/SDL/src/main/SDL_runapp.c", "start": 338528165, "end": 338529786}, {"filename": "/external/SDL/src/main/dos/SDL_sysmain_runapp.c", "start": 338529786, "end": 338531601}, {"filename": "/external/SDL/src/main/emscripten/SDL_sysmain_callbacks.c", "start": 338531601, "end": 338537090}, {"filename": "/external/SDL/src/main/emscripten/SDL_sysmain_runapp.c", "start": 338537090, "end": 338540805}, {"filename": "/external/SDL/src/main/gdk/SDL_sysmain_runapp.cpp", "start": 338540805, "end": 338544588}, {"filename": "/external/SDL/src/main/generic/SDL_sysmain_callbacks.c", "start": 338544588, "end": 338549619}, {"filename": "/external/SDL/src/main/ios/SDL_sysmain_callbacks.m", "start": 338549619, "end": 338555011}, {"filename": "/external/SDL/src/main/n3ds/SDL_sysmain_runapp.c", "start": 338555011, "end": 338556434}, {"filename": "/external/SDL/src/main/ngage/SDL_sysmain_callbacks.c", "start": 338556434, "end": 338558165}, {"filename": "/external/SDL/src/main/ngage/SDL_sysmain_main.cpp", "start": 338558165, "end": 338564070}, {"filename": "/external/SDL/src/main/ngage/SDL_sysmain_main.hpp", "start": 338564070, "end": 338565434}, {"filename": "/external/SDL/src/main/openharmony/SDL_sysmain_callbacks.c", "start": 338565434, "end": 338568553}, {"filename": "/external/SDL/src/main/openharmony/SDL_sysmain_runapp.c", "start": 338568553, "end": 338572834}, {"filename": "/external/SDL/src/main/ps2/SDL_sysmain_runapp.c", "start": 338572834, "end": 338574968}, {"filename": "/external/SDL/src/main/psp/SDL_sysmain_runapp.c", "start": 338574968, "end": 338577639}, {"filename": "/external/SDL/src/main/windows/SDL_sysmain_runapp.c", "start": 338577639, "end": 338579529}, {"filename": "/external/SDL/src/misc/SDL_libusb.c", "start": 338579529, "end": 338586253}, {"filename": "/external/SDL/src/misc/SDL_libusb.h", "start": 338586253, "end": 338591510}, {"filename": "/external/SDL/src/misc/SDL_sysurl.h", "start": 338591510, "end": 338592622}, {"filename": "/external/SDL/src/misc/SDL_url.c", "start": 338592622, "end": 338595245}, {"filename": "/external/SDL/src/misc/android/SDL_sysurl.c", "start": 338595245, "end": 338596440}, {"filename": "/external/SDL/src/misc/dummy/SDL_sysurl.c", "start": 338596440, "end": 338597534}, {"filename": "/external/SDL/src/misc/emscripten/SDL_sysurl.c", "start": 338597534, "end": 338598755}, {"filename": "/external/SDL/src/misc/haiku/SDL_sysurl.cc", "start": 338598755, "end": 338600136}, {"filename": "/external/SDL/src/misc/ios/SDL_sysurl.m", "start": 338600136, "end": 338601780}, {"filename": "/external/SDL/src/misc/macos/SDL_sysurl.m", "start": 338601780, "end": 338603268}, {"filename": "/external/SDL/src/misc/openharmony/SDL_sysurl.c", "start": 338603268, "end": 338604478}, {"filename": "/external/SDL/src/misc/riscos/SDL_sysurl.c", "start": 338604478, "end": 338606038}, {"filename": "/external/SDL/src/misc/unix/SDL_sysurl.c", "start": 338606038, "end": 338609391}, {"filename": "/external/SDL/src/misc/vita/SDL_sysurl.c", "start": 338609391, "end": 338610897}, {"filename": "/external/SDL/src/misc/windows/SDL_sysurl.c", "start": 338610897, "end": 338612972}, {"filename": "/external/SDL/src/notification/SDL_notification.c", "start": 338612972, "end": 338615826}, {"filename": "/external/SDL/src/notification/SDL_notification_c.h", "start": 338615826, "end": 338617240}, {"filename": "/external/SDL/src/notification/cocoa/SDL_cocoanotification.m", "start": 338617240, "end": 338633228}, {"filename": "/external/SDL/src/notification/dummy/SDL_dummynotification.c", "start": 338633228, "end": 338634856}, {"filename": "/external/SDL/src/notification/unix/SDL_dbusnotification.c", "start": 338634856, "end": 338690109}, {"filename": "/external/SDL/src/notification/windows/SDL_windowsnotification.c", "start": 338690109, "end": 338731104}, {"filename": "/external/SDL/src/power/SDL_power.c", "start": 338731104, "end": 338734700}, {"filename": "/external/SDL/src/power/SDL_syspower.h", "start": 338734700, "end": 338736967}, {"filename": "/external/SDL/src/power/android/SDL_syspower.c", "start": 338736967, "end": 338738937}, {"filename": "/external/SDL/src/power/emscripten/SDL_syspower.c", "start": 338738937, "end": 338740948}, {"filename": "/external/SDL/src/power/haiku/SDL_syspower.c", "start": 338740948, "end": 338744927}, {"filename": "/external/SDL/src/power/linux/SDL_syspower.c", "start": 338744927, "end": 338766505}, {"filename": "/external/SDL/src/power/macos/SDL_syspower.c", "start": 338766505, "end": 338772319}, {"filename": "/external/SDL/src/power/n3ds/SDL_syspower.c", "start": 338772319, "end": 338775336}, {"filename": "/external/SDL/src/power/openharmony/SDL_syspower.c", "start": 338775336, "end": 338776974}, {"filename": "/external/SDL/src/power/psp/SDL_syspower.c", "start": 338776974, "end": 338779106}, {"filename": "/external/SDL/src/power/uikit/SDL_syspower.h", "start": 338779106, "end": 338780277}, {"filename": "/external/SDL/src/power/uikit/SDL_syspower.m", "start": 338780277, "end": 338783829}, {"filename": "/external/SDL/src/power/vita/SDL_syspower.c", "start": 338783829, "end": 338785944}, {"filename": "/external/SDL/src/power/windows/SDL_syspower.c", "start": 338785944, "end": 338788548}, {"filename": "/external/SDL/src/process/SDL_process.c", "start": 338788548, "end": 338794690}, {"filename": "/external/SDL/src/process/SDL_sysprocess.h", "start": 338794690, "end": 338796347}, {"filename": "/external/SDL/src/process/dummy/SDL_dummyprocess.c", "start": 338796347, "end": 338797840}, {"filename": "/external/SDL/src/process/posix/SDL_posixprocess.c", "start": 338797840, "end": 338815840}, {"filename": "/external/SDL/src/process/windows/SDL_windowsprocess.c", "start": 338815840, "end": 338838035}, {"filename": "/external/SDL/src/render/SDL_d3dmath.h", "start": 338838035, "end": 338843336}, {"filename": "/external/SDL/src/render/SDL_render.c", "start": 338843336, "end": 339071005}, {"filename": "/external/SDL/src/render/SDL_render_debug_font.h", "start": 339071005, "end": 339120344}, {"filename": "/external/SDL/src/render/SDL_render_unsupported.c", "start": 339120344, "end": 339121332}, {"filename": "/external/SDL/src/render/SDL_sysrender.h", "start": 339121332, "end": 339137496}, {"filename": "/external/SDL/src/render/SDL_yuv_sw.c", "start": 339137496, "end": 339154861}, {"filename": "/external/SDL/src/render/SDL_yuv_sw_c.h", "start": 339154861, "end": 339157754}, {"filename": "/external/SDL/src/render/direct3d/D3D9_PixelShader_Palette.h", "start": 339157754, "end": 339166193}, {"filename": "/external/SDL/src/render/direct3d/D3D9_PixelShader_Palette.hlsli", "start": 339166193, "end": 339167657}, {"filename": "/external/SDL/src/render/direct3d/D3D9_PixelShader_Palette_Linear.h", "start": 339167657, "end": 339174041}, {"filename": "/external/SDL/src/render/direct3d/D3D9_PixelShader_Palette_Linear.hlsl", "start": 339174041, "end": 339174201}, {"filename": "/external/SDL/src/render/direct3d/D3D9_PixelShader_Palette_Nearest.h", "start": 339174201, "end": 339176885}, {"filename": "/external/SDL/src/render/direct3d/D3D9_PixelShader_Palette_Nearest.hlsl", "start": 339176885, "end": 339177046}, {"filename": "/external/SDL/src/render/direct3d/D3D9_PixelShader_YUV.h", "start": 339177046, "end": 339182063}, {"filename": "/external/SDL/src/render/direct3d/D3D9_PixelShader_YUV.hlsl", "start": 339182063, "end": 339183068}, {"filename": "/external/SDL/src/render/direct3d/SDL_render_d3d.c", "start": 339183068, "end": 339260808}, {"filename": "/external/SDL/src/render/direct3d/SDL_shaders_d3d.c", "start": 339260808, "end": 339262842}, {"filename": "/external/SDL/src/render/direct3d/SDL_shaders_d3d.h", "start": 339262842, "end": 339264133}, {"filename": "/external/SDL/src/render/direct3d/compile_shaders.bat", "start": 339264133, "end": 339264383}, {"filename": "/external/SDL/src/render/direct3d11/D3D11_PixelShader_Advanced.h", "start": 339264383, "end": 339336178}, {"filename": "/external/SDL/src/render/direct3d11/D3D11_PixelShader_Advanced.hlsl", "start": 339336178, "end": 339336320}, {"filename": "/external/SDL/src/render/direct3d11/D3D11_PixelShader_Colors.h", "start": 339336320, "end": 339346590}, {"filename": "/external/SDL/src/render/direct3d11/D3D11_PixelShader_Colors.hlsl", "start": 339346590, "end": 339346739}, {"filename": "/external/SDL/src/render/direct3d11/D3D11_PixelShader_Colors_PQ.h", "start": 339346739, "end": 339362050}, {"filename": "/external/SDL/src/render/direct3d11/D3D11_PixelShader_Colors_PQ.hlsl", "start": 339362050, "end": 339362191}, {"filename": "/external/SDL/src/render/direct3d11/D3D11_PixelShader_Common.hlsli", "start": 339362191, "end": 339371735}, {"filename": "/external/SDL/src/render/direct3d11/D3D11_PixelShader_Textures.h", "start": 339371735, "end": 339383773}, {"filename": "/external/SDL/src/render/direct3d11/D3D11_PixelShader_Textures.hlsl", "start": 339383773, "end": 339383955}, {"filename": "/external/SDL/src/render/direct3d11/D3D11_VertexShader.h", "start": 339383955, "end": 339395464}, {"filename": "/external/SDL/src/render/direct3d11/D3D11_VertexShader.hlsl", "start": 339395464, "end": 339396300}, {"filename": "/external/SDL/src/render/direct3d11/SDL_render_d3d11.c", "start": 339396300, "end": 339527666}, {"filename": "/external/SDL/src/render/direct3d11/SDL_shaders_d3d11.c", "start": 339527666, "end": 339532205}, {"filename": "/external/SDL/src/render/direct3d11/SDL_shaders_d3d11.h", "start": 339532205, "end": 339533629}, {"filename": "/external/SDL/src/render/direct3d11/compile_shaders.bat", "start": 339533629, "end": 339534051}, {"filename": "/external/SDL/src/render/direct3d12/D3D12_PixelShader_Advanced.h", "start": 339534051, "end": 339660562}, {"filename": "/external/SDL/src/render/direct3d12/D3D12_PixelShader_Advanced.hlsl", "start": 339660562, "end": 339660733}, {"filename": "/external/SDL/src/render/direct3d12/D3D12_PixelShader_Colors.h", "start": 339660733, "end": 339693042}, {"filename": "/external/SDL/src/render/direct3d12/D3D12_PixelShader_Colors.hlsl", "start": 339693042, "end": 339693218}, {"filename": "/external/SDL/src/render/direct3d12/D3D12_PixelShader_Colors_PQ.h", "start": 339693218, "end": 339730879}, {"filename": "/external/SDL/src/render/direct3d12/D3D12_PixelShader_Colors_PQ.hlsl", "start": 339730879, "end": 339731047}, {"filename": "/external/SDL/src/render/direct3d12/D3D12_PixelShader_Common.hlsli", "start": 339731047, "end": 339740629}, {"filename": "/external/SDL/src/render/direct3d12/D3D12_PixelShader_Textures.h", "start": 339740629, "end": 339780103}, {"filename": "/external/SDL/src/render/direct3d12/D3D12_PixelShader_Textures.hlsl", "start": 339780103, "end": 339780313}, {"filename": "/external/SDL/src/render/direct3d12/D3D12_RootSig_Advanced.h", "start": 339780313, "end": 339782493}, {"filename": "/external/SDL/src/render/direct3d12/D3D12_RootSig_Color.h", "start": 339782493, "end": 339783296}, {"filename": "/external/SDL/src/render/direct3d12/D3D12_RootSig_Texture.h", "start": 339783296, "end": 339784650}, {"filename": "/external/SDL/src/render/direct3d12/D3D12_Shader_Common.hlsli", "start": 339784650, "end": 339786279}, {"filename": "/external/SDL/src/render/direct3d12/D3D12_VertexShader.hlsl", "start": 339786279, "end": 339787235}, {"filename": "/external/SDL/src/render/direct3d12/D3D12_VertexShader_Advanced.h", "start": 339787235, "end": 339827062}, {"filename": "/external/SDL/src/render/direct3d12/D3D12_VertexShader_Color.h", "start": 339827062, "end": 339865374}, {"filename": "/external/SDL/src/render/direct3d12/D3D12_VertexShader_Texture.h", "start": 339865374, "end": 339904296}, {"filename": "/external/SDL/src/render/direct3d12/SDL_render_d3d12.c", "start": 339904296, "end": 340063601}, {"filename": "/external/SDL/src/render/direct3d12/SDL_render_d3d12_xbox.cpp", "start": 340063601, "end": 340069817}, {"filename": "/external/SDL/src/render/direct3d12/SDL_render_d3d12_xbox.h", "start": 340069817, "end": 340071585}, {"filename": "/external/SDL/src/render/direct3d12/SDL_shaders_d3d12.c", "start": 340071585, "end": 340076206}, {"filename": "/external/SDL/src/render/direct3d12/SDL_shaders_d3d12.h", "start": 340076206, "end": 340078038}, {"filename": "/external/SDL/src/render/direct3d12/SDL_shaders_d3d12_xboxone.cpp", "start": 340078038, "end": 340082752}, {"filename": "/external/SDL/src/render/direct3d12/SDL_shaders_d3d12_xboxseries.cpp", "start": 340082752, "end": 340087503}, {"filename": "/external/SDL/src/render/direct3d12/compile_shaders.bat", "start": 340087503, "end": 340088816}, {"filename": "/external/SDL/src/render/direct3d12/compile_shaders_xbox.bat", "start": 340088816, "end": 340089097}, {"filename": "/external/SDL/src/render/gpu/SDL_gpu_util.h", "start": 340089097, "end": 340091935}, {"filename": "/external/SDL/src/render/gpu/SDL_pipeline_gpu.c", "start": 340091935, "end": 340098646}, {"filename": "/external/SDL/src/render/gpu/SDL_pipeline_gpu.h", "start": 340098646, "end": 340100463}, {"filename": "/external/SDL/src/render/gpu/SDL_render_gpu.c", "start": 340100463, "end": 340175561}, {"filename": "/external/SDL/src/render/gpu/SDL_shaders_gpu.c", "start": 340175561, "end": 340185705}, {"filename": "/external/SDL/src/render/gpu/SDL_shaders_gpu.h", "start": 340185705, "end": 340187858}, {"filename": "/external/SDL/src/render/gpu/shaders/.gitattributes", "start": 340187858, "end": 340187882}, {"filename": "/external/SDL/src/render/gpu/shaders/.gitignore", "start": 340187882, "end": 340187915}, {"filename": "/external/SDL/src/render/gpu/shaders/build-shaders.sh", "start": 340187915, "end": 340188610}, {"filename": "/external/SDL/src/render/gpu/shaders/color.frag.dxil.h", "start": 340188610, "end": 340209670}, {"filename": "/external/SDL/src/render/gpu/shaders/color.frag.hlsl", "start": 340209670, "end": 340210027}, {"filename": "/external/SDL/src/render/gpu/shaders/color.frag.msl.h", "start": 340210027, "end": 340213897}, {"filename": "/external/SDL/src/render/gpu/shaders/color.frag.spv.h", "start": 340213897, "end": 340218979}, {"filename": "/external/SDL/src/render/gpu/shaders/color_pq.frag.dxil.h", "start": 340218979, "end": 340243570}, {"filename": "/external/SDL/src/render/gpu/shaders/color_pq.frag.hlsl", "start": 340243570, "end": 340244465}, {"filename": "/external/SDL/src/render/gpu/shaders/color_pq.frag.msl.h", "start": 340244465, "end": 340249970}, {"filename": "/external/SDL/src/render/gpu/shaders/color_pq.frag.spv.h", "start": 340249970, "end": 340258983}, {"filename": "/external/SDL/src/render/gpu/shaders/common.frag.hlsli", "start": 340258983, "end": 340259137}, {"filename": "/external/SDL/src/render/gpu/shaders/dxil.h", "start": 340259137, "end": 340259418}, {"filename": "/external/SDL/src/render/gpu/shaders/linepoint.vert.dxil.h", "start": 340259418, "end": 340284059}, {"filename": "/external/SDL/src/render/gpu/shaders/linepoint.vert.hlsl", "start": 340284059, "end": 340284628}, {"filename": "/external/SDL/src/render/gpu/shaders/linepoint.vert.msl.h", "start": 340284628, "end": 340288824}, {"filename": "/external/SDL/src/render/gpu/shaders/linepoint.vert.spv.h", "start": 340288824, "end": 340295138}, {"filename": "/external/SDL/src/render/gpu/shaders/msl.h", "start": 340295138, "end": 340295411}, {"filename": "/external/SDL/src/render/gpu/shaders/spir-v.h", "start": 340295411, "end": 340295684}, {"filename": "/external/SDL/src/render/gpu/shaders/texture_advanced.frag.dxil.h", "start": 340295684, "end": 340365091}, {"filename": "/external/SDL/src/render/gpu/shaders/texture_advanced.frag.hlsl", "start": 340365091, "end": 340374466}, {"filename": "/external/SDL/src/render/gpu/shaders/texture_advanced.frag.msl.h", "start": 340374466, "end": 340471228}, {"filename": "/external/SDL/src/render/gpu/shaders/texture_advanced.frag.spv.h", "start": 340471228, "end": 340573708}, {"filename": "/external/SDL/src/render/gpu/shaders/texture_rgb.frag.dxil.h", "start": 340573708, "end": 340600030}, {"filename": "/external/SDL/src/render/gpu/shaders/texture_rgb.frag.hlsl", "start": 340600030, "end": 340600566}, {"filename": "/external/SDL/src/render/gpu/shaders/texture_rgb.frag.msl.h", "start": 340600566, "end": 340605573}, {"filename": "/external/SDL/src/render/gpu/shaders/texture_rgb.frag.spv.h", "start": 340605573, "end": 340614316}, {"filename": "/external/SDL/src/render/gpu/shaders/texture_rgba.frag.dxil.h", "start": 340614316, "end": 340640664}, {"filename": "/external/SDL/src/render/gpu/shaders/texture_rgba.frag.hlsl", "start": 340640664, "end": 340641182}, {"filename": "/external/SDL/src/render/gpu/shaders/texture_rgba.frag.msl.h", "start": 340641182, "end": 340646233}, {"filename": "/external/SDL/src/render/gpu/shaders/texture_rgba.frag.spv.h", "start": 340646233, "end": 340654453}, {"filename": "/external/SDL/src/render/gpu/shaders/tri_color.vert.dxil.h", "start": 340654453, "end": 340680870}, {"filename": "/external/SDL/src/render/gpu/shaders/tri_color.vert.hlsl", "start": 340680870, "end": 340681397}, {"filename": "/external/SDL/src/render/gpu/shaders/tri_color.vert.msl.h", "start": 340681397, "end": 340686055}, {"filename": "/external/SDL/src/render/gpu/shaders/tri_color.vert.spv.h", "start": 340686055, "end": 340693045}, {"filename": "/external/SDL/src/render/gpu/shaders/tri_texture.vert.dxil.h", "start": 340693045, "end": 340719466}, {"filename": "/external/SDL/src/render/gpu/shaders/tri_texture.vert.hlsl", "start": 340719466, "end": 340719995}, {"filename": "/external/SDL/src/render/gpu/shaders/tri_texture.vert.msl.h", "start": 340719995, "end": 340724657}, {"filename": "/external/SDL/src/render/gpu/shaders/tri_texture.vert.spv.h", "start": 340724657, "end": 340731651}, {"filename": "/external/SDL/src/render/metal/SDL_render_metal.m", "start": 340731651, "end": 340844631}, {"filename": "/external/SDL/src/render/metal/SDL_shaders_metal.metal", "start": 340844631, "end": 340857405}, {"filename": "/external/SDL/src/render/metal/SDL_shaders_metal_ios.h", "start": 340857405, "end": 341115902}, {"filename": "/external/SDL/src/render/metal/SDL_shaders_metal_iphonesimulator.h", "start": 341115902, "end": 341417035}, {"filename": "/external/SDL/src/render/metal/SDL_shaders_metal_macos.h", "start": 341417035, "end": 341656032}, {"filename": "/external/SDL/src/render/metal/SDL_shaders_metal_tvos.h", "start": 341656032, "end": 341914529}, {"filename": "/external/SDL/src/render/metal/SDL_shaders_metal_tvsimulator.h", "start": 341914529, "end": 342215662}, {"filename": "/external/SDL/src/render/metal/build-metal-shaders.sh", "start": 342215662, "end": 342216535}, {"filename": "/external/SDL/src/render/ngage/SDL_render_ngage.c", "start": 342216535, "end": 342238957}, {"filename": "/external/SDL/src/render/ngage/SDL_render_ngage.cpp", "start": 342238957, "end": 342275676}, {"filename": "/external/SDL/src/render/ngage/SDL_render_ngage_c.h", "start": 342275676, "end": 342279183}, {"filename": "/external/SDL/src/render/ngage/SDL_render_ngage_c.hpp", "start": 342279183, "end": 342282840}, {"filename": "/external/SDL/src/render/ngage/SDL_render_ops.cpp", "start": 342282840, "end": 342297333}, {"filename": "/external/SDL/src/render/ngage/SDL_render_ops.hpp", "start": 342297333, "end": 342299049}, {"filename": "/external/SDL/src/render/opengl/SDL_glfuncs.h", "start": 342299049, "end": 342325652}, {"filename": "/external/SDL/src/render/opengl/SDL_render_gl.c", "start": 342325652, "end": 342409208}, {"filename": "/external/SDL/src/render/opengl/SDL_shaders_gl.c", "start": 342409208, "end": 342441388}, {"filename": "/external/SDL/src/render/opengl/SDL_shaders_gl.h", "start": 342441388, "end": 342443231}, {"filename": "/external/SDL/src/render/opengles/SDL_glesfuncs.h", "start": 342443231, "end": 342446640}, {"filename": "/external/SDL/src/render/opengles/SDL_render_gles.c", "start": 342446640, "end": 342488678}, {"filename": "/external/SDL/src/render/opengles2/SDL_gles2funcs.h", "start": 342488678, "end": 342493096}, {"filename": "/external/SDL/src/render/opengles2/SDL_render_gles2.c", "start": 342493096, "end": 342589526}, {"filename": "/external/SDL/src/render/opengles2/SDL_shaders_gles2.c", "start": 342589526, "end": 342614063}, {"filename": "/external/SDL/src/render/opengles2/SDL_shaders_gles2.h", "start": 342614063, "end": 342617051}, {"filename": "/external/SDL/src/render/ps2/SDL_render_ps2.c", "start": 342617051, "end": 342643975}, {"filename": "/external/SDL/src/render/psp/SDL_render_psp.c", "start": 342643975, "end": 342696645}, {"filename": "/external/SDL/src/render/psp/SDL_render_psp_c.h", "start": 342696645, "end": 342697889}, {"filename": "/external/SDL/src/render/software/SDL_blendfillrect.c", "start": 342697889, "end": 342709676}, {"filename": "/external/SDL/src/render/software/SDL_blendfillrect.h", "start": 342709676, "end": 342711041}, {"filename": "/external/SDL/src/render/software/SDL_blendline.c", "start": 342711041, "end": 342746122}, {"filename": "/external/SDL/src/render/software/SDL_blendline.h", "start": 342746122, "end": 342747479}, {"filename": "/external/SDL/src/render/software/SDL_blendpoint.c", "start": 342747479, "end": 342758867}, {"filename": "/external/SDL/src/render/software/SDL_blendpoint.h", "start": 342758867, "end": 342760211}, {"filename": "/external/SDL/src/render/software/SDL_draw.h", "start": 342760211, "end": 342797805}, {"filename": "/external/SDL/src/render/software/SDL_drawline.c", "start": 342797805, "end": 342804586}, {"filename": "/external/SDL/src/render/software/SDL_drawline.h", "start": 342804586, "end": 342805844}, {"filename": "/external/SDL/src/render/software/SDL_drawpoint.c", "start": 342805844, "end": 342809046}, {"filename": "/external/SDL/src/render/software/SDL_drawpoint.h", "start": 342809046, "end": 342810291}, {"filename": "/external/SDL/src/render/software/SDL_render_sw.c", "start": 342810291, "end": 342859201}, {"filename": "/external/SDL/src/render/software/SDL_render_sw_c.h", "start": 342859201, "end": 342860456}, {"filename": "/external/SDL/src/render/software/SDL_triangle.c", "start": 342860456, "end": 342891928}, {"filename": "/external/SDL/src/render/software/SDL_triangle.h", "start": 342891928, "end": 342893778}, {"filename": "/external/SDL/src/render/vitagxm/SDL_render_vita_gxm.c", "start": 342893778, "end": 342940726}, {"filename": "/external/SDL/src/render/vitagxm/SDL_render_vita_gxm_memory.c", "start": 342940726, "end": 342945936}, {"filename": "/external/SDL/src/render/vitagxm/SDL_render_vita_gxm_memory.h", "start": 342945936, "end": 342947818}, {"filename": "/external/SDL/src/render/vitagxm/SDL_render_vita_gxm_shaders.h", "start": 342947818, "end": 342962199}, {"filename": "/external/SDL/src/render/vitagxm/SDL_render_vita_gxm_tools.c", "start": 342962199, "end": 343009587}, {"filename": "/external/SDL/src/render/vitagxm/SDL_render_vita_gxm_tools.h", "start": 343009587, "end": 343012365}, {"filename": "/external/SDL/src/render/vitagxm/SDL_render_vita_gxm_types.h", "start": 343012365, "end": 343018173}, {"filename": "/external/SDL/src/render/vitagxm/shader_src/clear_f.cg", "start": 343018173, "end": 343018254}, {"filename": "/external/SDL/src/render/vitagxm/shader_src/clear_v.cg", "start": 343018254, "end": 343018343}, {"filename": "/external/SDL/src/render/vitagxm/shader_src/color_f.cg", "start": 343018343, "end": 343018405}, {"filename": "/external/SDL/src/render/vitagxm/shader_src/color_v.cg", "start": 343018405, "end": 343018692}, {"filename": "/external/SDL/src/render/vitagxm/shader_src/texture_f.cg", "start": 343018692, "end": 343018831}, {"filename": "/external/SDL/src/render/vitagxm/shader_src/texture_v.cg", "start": 343018831, "end": 343019160}, {"filename": "/external/SDL/src/render/vulkan/SDL_render_vulkan.c", "start": 343019160, "end": 343274627}, {"filename": "/external/SDL/src/render/vulkan/SDL_shaders_vulkan.c", "start": 343274627, "end": 343277164}, {"filename": "/external/SDL/src/render/vulkan/SDL_shaders_vulkan.h", "start": 343277164, "end": 343278715}, {"filename": "/external/SDL/src/render/vulkan/VULKAN_PixelShader_Advanced.h", "start": 343278715, "end": 343322350}, {"filename": "/external/SDL/src/render/vulkan/VULKAN_PixelShader_Advanced.hlsl", "start": 343322350, "end": 343322490}, {"filename": "/external/SDL/src/render/vulkan/VULKAN_PixelShader_Colors.h", "start": 343322490, "end": 343326560}, {"filename": "/external/SDL/src/render/vulkan/VULKAN_PixelShader_Colors.hlsl", "start": 343326560, "end": 343326711}, {"filename": "/external/SDL/src/render/vulkan/VULKAN_PixelShader_Colors_PQ.h", "start": 343326711, "end": 343332513}, {"filename": "/external/SDL/src/render/vulkan/VULKAN_PixelShader_Colors_PQ.hlsl", "start": 343332513, "end": 343332656}, {"filename": "/external/SDL/src/render/vulkan/VULKAN_PixelShader_Common.hlsli", "start": 343332656, "end": 343342334}, {"filename": "/external/SDL/src/render/vulkan/VULKAN_PixelShader_Textures.h", "start": 343342334, "end": 343347214}, {"filename": "/external/SDL/src/render/vulkan/VULKAN_PixelShader_Textures.hlsl", "start": 343347214, "end": 343347397}, {"filename": "/external/SDL/src/render/vulkan/VULKAN_VertexShader.h", "start": 343347397, "end": 343351723}, {"filename": "/external/SDL/src/render/vulkan/VULKAN_VertexShader.hlsl", "start": 343351723, "end": 343352824}, {"filename": "/external/SDL/src/render/vulkan/compile_shaders.bat", "start": 343352824, "end": 343353755}, {"filename": "/external/SDL/src/sensor/SDL_sensor.c", "start": 343353755, "end": 343371823}, {"filename": "/external/SDL/src/sensor/SDL_sensor_c.h", "start": 343371823, "end": 343374136}, {"filename": "/external/SDL/src/sensor/SDL_syssensor.h", "start": 343374136, "end": 343378256}, {"filename": "/external/SDL/src/sensor/android/SDL_androidsensor.c", "start": 343378256, "end": 343387515}, {"filename": "/external/SDL/src/sensor/android/SDL_androidsensor.h", "start": 343387515, "end": 343388501}, {"filename": "/external/SDL/src/sensor/coremotion/SDL_coremotionsensor.h", "start": 343388501, "end": 343389595}, {"filename": "/external/SDL/src/sensor/coremotion/SDL_coremotionsensor.m", "start": 343389595, "end": 343396005}, {"filename": "/external/SDL/src/sensor/dummy/SDL_dummysensor.c", "start": 343396005, "end": 343398449}, {"filename": "/external/SDL/src/sensor/dummy/SDL_dummysensor.h", "start": 343398449, "end": 343399435}, {"filename": "/external/SDL/src/sensor/emscripten/SDL_emscriptensensor.c", "start": 343399435, "end": 343405737}, {"filename": "/external/SDL/src/sensor/emscripten/SDL_emscriptensensor.h", "start": 343405737, "end": 343406723}, {"filename": "/external/SDL/src/sensor/n3ds/SDL_n3dssensor.c", "start": 343406723, "end": 343412420}, {"filename": "/external/SDL/src/sensor/vita/SDL_vitasensor.c", "start": 343412420, "end": 343418456}, {"filename": "/external/SDL/src/sensor/vita/SDL_vitasensor.h", "start": 343418456, "end": 343419610}, {"filename": "/external/SDL/src/sensor/windows/SDL_windowssensor.c", "start": 343419610, "end": 343435955}, {"filename": "/external/SDL/src/sensor/windows/SDL_windowssensor.h", "start": 343435955, "end": 343436941}, {"filename": "/external/SDL/src/stdlib/SDL_casefolding.h", "start": 343436941, "end": 343515291}, {"filename": "/external/SDL/src/stdlib/SDL_crc16.c", "start": 343515291, "end": 343517126}, {"filename": "/external/SDL/src/stdlib/SDL_crc32.c", "start": 343517126, "end": 343519151}, {"filename": "/external/SDL/src/stdlib/SDL_getenv.c", "start": 343519151, "end": 343537679}, {"filename": "/external/SDL/src/stdlib/SDL_getenv_c.h", "start": 343537679, "end": 343538747}, {"filename": "/external/SDL/src/stdlib/SDL_iconv.c", "start": 343538747, "end": 343564904}, {"filename": "/external/SDL/src/stdlib/SDL_malloc.c", "start": 343564904, "end": 343803080}, {"filename": "/external/SDL/src/stdlib/SDL_memcpy.c", "start": 343803080, "end": 343806412}, {"filename": "/external/SDL/src/stdlib/SDL_memmove.c", "start": 343806412, "end": 343808700}, {"filename": "/external/SDL/src/stdlib/SDL_memset.c", "start": 343808700, "end": 343812817}, {"filename": "/external/SDL/src/stdlib/SDL_mslibc.c", "start": 343812817, "end": 343833379}, {"filename": "/external/SDL/src/stdlib/SDL_mslibc_arm64.masm", "start": 343833379, "end": 343834067}, {"filename": "/external/SDL/src/stdlib/SDL_mslibc_x64.masm", "start": 343834067, "end": 343834775}, {"filename": "/external/SDL/src/stdlib/SDL_murmur3.c", "start": 343834775, "end": 343837614}, {"filename": "/external/SDL/src/stdlib/SDL_qsort.c", "start": 343837614, "end": 343859579}, {"filename": "/external/SDL/src/stdlib/SDL_random.c", "start": 343859579, "end": 343863755}, {"filename": "/external/SDL/src/stdlib/SDL_stdlib.c", "start": 343863755, "end": 343875352}, {"filename": "/external/SDL/src/stdlib/SDL_string.c", "start": 343875352, "end": 343955656}, {"filename": "/external/SDL/src/stdlib/SDL_strtokr.c", "start": 343955656, "end": 343958559}, {"filename": "/external/SDL/src/stdlib/SDL_sysstdlib.h", "start": 343958559, "end": 343959851}, {"filename": "/external/SDL/src/stdlib/SDL_vacopy.h", "start": 343959851, "end": 343961193}, {"filename": "/external/SDL/src/storage/SDL_storage.c", "start": 343961193, "end": 343974432}, {"filename": "/external/SDL/src/storage/SDL_sysstorage.h", "start": 343974432, "end": 343976265}, {"filename": "/external/SDL/src/storage/generic/SDL_genericstorage.c", "start": 343976265, "end": 343988663}, {"filename": "/external/SDL/src/storage/steam/SDL_steamstorage.c", "start": 343988663, "end": 343999757}, {"filename": "/external/SDL/src/storage/steam/SDL_steamstorage_proc.h", "start": 343999757, "end": 344000948}, {"filename": "/external/SDL/src/test/SDL_test_assert.c", "start": 344000948, "end": 344005992}, {"filename": "/external/SDL/src/test/SDL_test_common.c", "start": 344005992, "end": 344118409}, {"filename": "/external/SDL/src/test/SDL_test_compare.c", "start": 344118409, "end": 344131128}, {"filename": "/external/SDL/src/test/SDL_test_crc32.c", "start": 344131128, "end": 344135211}, {"filename": "/external/SDL/src/test/SDL_test_font.c", "start": 344135211, "end": 344140091}, {"filename": "/external/SDL/src/test/SDL_test_fuzzer.c", "start": 344140091, "end": 344154270}, {"filename": "/external/SDL/src/test/SDL_test_harness.c", "start": 344154270, "end": 344186201}, {"filename": "/external/SDL/src/test/SDL_test_internal.h", "start": 344186201, "end": 344187835}, {"filename": "/external/SDL/src/test/SDL_test_log.c", "start": 344187835, "end": 344195176}, {"filename": "/external/SDL/src/test/SDL_test_md5.c", "start": 344195176, "end": 344208135}, {"filename": "/external/SDL/src/test/SDL_test_memory.c", "start": 344208135, "end": 344223771}, {"filename": "/external/SDL/src/thread/SDL_systhread.h", "start": 344223771, "end": 344226546}, {"filename": "/external/SDL/src/thread/SDL_thread.c", "start": 344226546, "end": 344244937}, {"filename": "/external/SDL/src/thread/SDL_thread_c.h", "start": 344244937, "end": 344248180}, {"filename": "/external/SDL/src/thread/dos/SDL_sysmutex.c", "start": 344248180, "end": 344251368}, {"filename": "/external/SDL/src/thread/dos/SDL_syssem.c", "start": 344251368, "end": 344254455}, {"filename": "/external/SDL/src/thread/dos/SDL_systhread.c", "start": 344254455, "end": 344257252}, {"filename": "/external/SDL/src/thread/dos/SDL_systhread_c.h", "start": 344257252, "end": 344258409}, {"filename": "/external/SDL/src/thread/dos/SDL_systls.c", "start": 344258409, "end": 344260376}, {"filename": "/external/SDL/src/thread/generic/SDL_syscond.c", "start": 344260376, "end": 344267497}, {"filename": "/external/SDL/src/thread/generic/SDL_syscond_c.h", "start": 344267497, "end": 344268994}, {"filename": "/external/SDL/src/thread/generic/SDL_sysmutex.c", "start": 344268994, "end": 344273191}, {"filename": "/external/SDL/src/thread/generic/SDL_sysmutex_c.h", "start": 344273191, "end": 344274177}, {"filename": "/external/SDL/src/thread/generic/SDL_sysrwlock.c", "start": 344274177, "end": 344280894}, {"filename": "/external/SDL/src/thread/generic/SDL_sysrwlock_c.h", "start": 344280894, "end": 344282458}, {"filename": "/external/SDL/src/thread/generic/SDL_syssem.c", "start": 344282458, "end": 344287178}, {"filename": "/external/SDL/src/thread/generic/SDL_systhread.c", "start": 344287178, "end": 344288841}, {"filename": "/external/SDL/src/thread/generic/SDL_systhread_c.h", "start": 344288841, "end": 344289913}, {"filename": "/external/SDL/src/thread/generic/SDL_systls.c", "start": 344289913, "end": 344291256}, {"filename": "/external/SDL/src/thread/n3ds/SDL_sysmutex.c", "start": 344291256, "end": 344293178}, {"filename": "/external/SDL/src/thread/n3ds/SDL_sysmutex_c.h", "start": 344293178, "end": 344294323}, {"filename": "/external/SDL/src/thread/n3ds/SDL_syssem.c", "start": 344294323, "end": 344297308}, {"filename": "/external/SDL/src/thread/n3ds/SDL_systhread.c", "start": 344297308, "end": 344301885}, {"filename": "/external/SDL/src/thread/n3ds/SDL_systhread_c.h", "start": 344301885, "end": 344303017}, {"filename": "/external/SDL/src/thread/ps2/SDL_syssem.c", "start": 344303017, "end": 344305952}, {"filename": "/external/SDL/src/thread/ps2/SDL_systhread.c", "start": 344305952, "end": 344309978}, {"filename": "/external/SDL/src/thread/ps2/SDL_systhread_c.h", "start": 344309978, "end": 344310974}, {"filename": "/external/SDL/src/thread/psp/SDL_sysmutex.c", "start": 344310974, "end": 344314079}, {"filename": "/external/SDL/src/thread/psp/SDL_sysmutex_c.h", "start": 344314079, "end": 344315065}, {"filename": "/external/SDL/src/thread/psp/SDL_syssem.c", "start": 344315065, "end": 344318211}, {"filename": "/external/SDL/src/thread/psp/SDL_systhread.c", "start": 344318211, "end": 344321891}, {"filename": "/external/SDL/src/thread/psp/SDL_systhread_c.h", "start": 344321891, "end": 344322917}, {"filename": "/external/SDL/src/thread/pthread/SDL_syscond.c", "start": 344322917, "end": 344326810}, {"filename": "/external/SDL/src/thread/pthread/SDL_sysmutex.c", "start": 344326810, "end": 344332072}, {"filename": "/external/SDL/src/thread/pthread/SDL_sysmutex_c.h", "start": 344332072, "end": 344333416}, {"filename": "/external/SDL/src/thread/pthread/SDL_sysrwlock.c", "start": 344333416, "end": 344336848}, {"filename": "/external/SDL/src/thread/pthread/SDL_syssem.c", "start": 344336848, "end": 344341459}, {"filename": "/external/SDL/src/thread/pthread/SDL_systhread.c", "start": 344341459, "end": 344352113}, {"filename": "/external/SDL/src/thread/pthread/SDL_systhread_c.h", "start": 344352113, "end": 344353162}, {"filename": "/external/SDL/src/thread/pthread/SDL_systls.c", "start": 344353162, "end": 344355679}, {"filename": "/external/SDL/src/thread/vita/SDL_sysmutex.c", "start": 344355679, "end": 344358785}, {"filename": "/external/SDL/src/thread/vita/SDL_sysmutex_c.h", "start": 344358785, "end": 344359771}, {"filename": "/external/SDL/src/thread/vita/SDL_syssem.c", "start": 344359771, "end": 344362994}, {"filename": "/external/SDL/src/thread/vita/SDL_systhread.c", "start": 344362994, "end": 344367376}, {"filename": "/external/SDL/src/thread/vita/SDL_systhread_c.h", "start": 344367376, "end": 344368398}, {"filename": "/external/SDL/src/thread/windows/SDL_syscond_cv.c", "start": 344368398, "end": 344375946}, {"filename": "/external/SDL/src/thread/windows/SDL_sysmutex.c", "start": 344375946, "end": 344383577}, {"filename": "/external/SDL/src/thread/windows/SDL_sysmutex_c.h", "start": 344383577, "end": 344385722}, {"filename": "/external/SDL/src/thread/windows/SDL_sysrwlock_srw.c", "start": 344385722, "end": 344393925}, {"filename": "/external/SDL/src/thread/windows/SDL_syssem.c", "start": 344393925, "end": 344404084}, {"filename": "/external/SDL/src/thread/windows/SDL_systhread.c", "start": 344404084, "end": 344411285}, {"filename": "/external/SDL/src/thread/windows/SDL_systhread_c.h", "start": 344411285, "end": 344412444}, {"filename": "/external/SDL/src/thread/windows/SDL_systls.c", "start": 344412444, "end": 344414885}, {"filename": "/external/SDL/src/time/SDL_time.c", "start": 344414885, "end": 344422830}, {"filename": "/external/SDL/src/time/SDL_time_c.h", "start": 344422830, "end": 344424271}, {"filename": "/external/SDL/src/time/dummy/SDL_systime.c", "start": 344424271, "end": 344426036}, {"filename": "/external/SDL/src/time/n3ds/SDL_systime.c", "start": 344426036, "end": 344431360}, {"filename": "/external/SDL/src/time/ngage/SDL_systime.cpp", "start": 344431360, "end": 344437488}, {"filename": "/external/SDL/src/time/psp/SDL_systime.c", "start": 344437488, "end": 344442050}, {"filename": "/external/SDL/src/time/unix/SDL_systime.c", "start": 344442050, "end": 344448685}, {"filename": "/external/SDL/src/time/vita/SDL_systime.c", "start": 344448685, "end": 344453576}, {"filename": "/external/SDL/src/time/windows/SDL_systime.c", "start": 344453576, "end": 344458903}, {"filename": "/external/SDL/src/timer/SDL_timer.c", "start": 344458903, "end": 344481376}, {"filename": "/external/SDL/src/timer/SDL_timer_c.h", "start": 344481376, "end": 344482786}, {"filename": "/external/SDL/src/timer/dos/SDL_systimer.c", "start": 344482786, "end": 344485216}, {"filename": "/external/SDL/src/timer/haiku/SDL_systimer.c", "start": 344485216, "end": 344486524}, {"filename": "/external/SDL/src/timer/n3ds/SDL_systimer.c", "start": 344486524, "end": 344487809}, {"filename": "/external/SDL/src/timer/ngage/SDL_systimer.cpp", "start": 344487809, "end": 344489242}, {"filename": "/external/SDL/src/timer/ps2/SDL_systimer.c", "start": 344489242, "end": 344490728}, {"filename": "/external/SDL/src/timer/psp/SDL_systimer.c", "start": 344490728, "end": 344492335}, {"filename": "/external/SDL/src/timer/unix/SDL_systimer.c", "start": 344492335, "end": 344497609}, {"filename": "/external/SDL/src/timer/vita/SDL_systimer.c", "start": 344497609, "end": 344499169}, {"filename": "/external/SDL/src/timer/windows/SDL_systimer.c", "start": 344499169, "end": 344504788}, {"filename": "/external/SDL/src/tray/SDL_tray_utils.c", "start": 344504788, "end": 344507474}, {"filename": "/external/SDL/src/tray/SDL_tray_utils.h", "start": 344507474, "end": 344508737}, {"filename": "/external/SDL/src/tray/cocoa/SDL_tray.m", "start": 344508737, "end": 344528437}, {"filename": "/external/SDL/src/tray/dummy/SDL_tray.c", "start": 344528437, "end": 344531829}, {"filename": "/external/SDL/src/tray/unix/SDL_dbustray.c", "start": 344531829, "end": 344584586}, {"filename": "/external/SDL/src/tray/unix/SDL_tray.c", "start": 344584586, "end": 344592713}, {"filename": "/external/SDL/src/tray/unix/SDL_unixtray.h", "start": 344592713, "end": 344595518}, {"filename": "/external/SDL/src/tray/windows/SDL_tray.c", "start": 344595518, "end": 344616987}, {"filename": "/external/SDL/src/video/SDL_RLEaccel.c", "start": 344616987, "end": 344685369}, {"filename": "/external/SDL/src/video/SDL_RLEaccel_c.h", "start": 344685369, "end": 344686607}, {"filename": "/external/SDL/src/video/SDL_blit.c", "start": 344686607, "end": 344694664}, {"filename": "/external/SDL/src/video/SDL_blit.h", "start": 344694664, "end": 344730203}, {"filename": "/external/SDL/src/video/SDL_blit_0.c", "start": 344730203, "end": 344764001}, {"filename": "/external/SDL/src/video/SDL_blit_1.c", "start": 344764001, "end": 344779393}, {"filename": "/external/SDL/src/video/SDL_blit_A.c", "start": 344779393, "end": 344837534}, {"filename": "/external/SDL/src/video/SDL_blit_N.c", "start": 344837534, "end": 344966504}, {"filename": "/external/SDL/src/video/SDL_blit_auto.c", "start": 344966504, "end": 345417655}, {"filename": "/external/SDL/src/video/SDL_blit_auto.h", "start": 345417655, "end": 345418927}, {"filename": "/external/SDL/src/video/SDL_blit_copy.c", "start": 345418927, "end": 345422243}, {"filename": "/external/SDL/src/video/SDL_blit_copy.h", "start": 345422243, "end": 345423328}, {"filename": "/external/SDL/src/video/SDL_blit_slow.c", "start": 345423328, "end": 345459124}, {"filename": "/external/SDL/src/video/SDL_blit_slow.h", "start": 345459124, "end": 345460300}, {"filename": "/external/SDL/src/video/SDL_bmp.c", "start": 345460300, "end": 345491010}, {"filename": "/external/SDL/src/video/SDL_clipboard.c", "start": 345491010, "end": 345505488}, {"filename": "/external/SDL/src/video/SDL_clipboard_c.h", "start": 345505488, "end": 345507499}, {"filename": "/external/SDL/src/video/SDL_egl.c", "start": 345507499, "end": 345561506}, {"filename": "/external/SDL/src/video/SDL_egl_c.h", "start": 345561506, "end": 345570956}, {"filename": "/external/SDL/src/video/SDL_fillrect.c", "start": 345570956, "end": 345582906}, {"filename": "/external/SDL/src/video/SDL_pixels.c", "start": 345582906, "end": 345638140}, {"filename": "/external/SDL/src/video/SDL_pixels_c.h", "start": 345638140, "end": 345641019}, {"filename": "/external/SDL/src/video/SDL_rect.c", "start": 345641019, "end": 345645251}, {"filename": "/external/SDL/src/video/SDL_rect_c.h", "start": 345645251, "end": 345646431}, {"filename": "/external/SDL/src/video/SDL_rect_impl.h", "start": 345646431, "end": 345660254}, {"filename": "/external/SDL/src/video/SDL_rotate.c", "start": 345660254, "end": 345682983}, {"filename": "/external/SDL/src/video/SDL_rotate.h", "start": 345682983, "end": 345684458}, {"filename": "/external/SDL/src/video/SDL_stb.c", "start": 345684458, "end": 345704533}, {"filename": "/external/SDL/src/video/SDL_stb_c.h", "start": 345704533, "end": 345705929}, {"filename": "/external/SDL/src/video/SDL_stretch.c", "start": 345705929, "end": 345742922}, {"filename": "/external/SDL/src/video/SDL_surface.c", "start": 345742922, "end": 345844237}, {"filename": "/external/SDL/src/video/SDL_surface_c.h", "start": 345844237, "end": 345848428}, {"filename": "/external/SDL/src/video/SDL_sysvideo.h", "start": 345848428, "end": 345874788}, {"filename": "/external/SDL/src/video/SDL_video.c", "start": 345874788, "end": 346082006}, {"filename": "/external/SDL/src/video/SDL_video_c.h", "start": 346082006, "end": 346084726}, {"filename": "/external/SDL/src/video/SDL_video_unsupported.c", "start": 346084726, "end": 346087456}, {"filename": "/external/SDL/src/video/SDL_video_unsupported.h", "start": 346087456, "end": 346089963}, {"filename": "/external/SDL/src/video/SDL_vulkan_internal.h", "start": 346089963, "end": 346093728}, {"filename": "/external/SDL/src/video/SDL_vulkan_utils.c", "start": 346093728, "end": 346114433}, {"filename": "/external/SDL/src/video/SDL_yuv.c", "start": 346114433, "end": 346214536}, {"filename": "/external/SDL/src/video/SDL_yuv_c.h", "start": 346214536, "end": 346216659}, {"filename": "/external/SDL/src/video/android/SDL_androidclipboard.c", "start": 346216659, "end": 346218175}, {"filename": "/external/SDL/src/video/android/SDL_androidclipboard.h", "start": 346218175, "end": 346219476}, {"filename": "/external/SDL/src/video/android/SDL_androidevents.c", "start": 346219476, "end": 346228016}, {"filename": "/external/SDL/src/video/android/SDL_androidevents.h", "start": 346228016, "end": 346229187}, {"filename": "/external/SDL/src/video/android/SDL_androidgl.c", "start": 346229187, "end": 346231937}, {"filename": "/external/SDL/src/video/android/SDL_androidgl.h", "start": 346231937, "end": 346233372}, {"filename": "/external/SDL/src/video/android/SDL_androidkeyboard.c", "start": 346233372, "end": 346256611}, {"filename": "/external/SDL/src/video/android/SDL_androidkeyboard.h", "start": 346256611, "end": 346258075}, {"filename": "/external/SDL/src/video/android/SDL_androidmessagebox.c", "start": 346258075, "end": 346259377}, {"filename": "/external/SDL/src/video/android/SDL_androidmessagebox.h", "start": 346259377, "end": 346260532}, {"filename": "/external/SDL/src/video/android/SDL_androidmouse.c", "start": 346260532, "end": 346269345}, {"filename": "/external/SDL/src/video/android/SDL_androidmouse.h", "start": 346269345, "end": 346270615}, {"filename": "/external/SDL/src/video/android/SDL_androidpen.c", "start": 346270615, "end": 346274296}, {"filename": "/external/SDL/src/video/android/SDL_androidpen.h", "start": 346274296, "end": 346275462}, {"filename": "/external/SDL/src/video/android/SDL_androidtouch.c", "start": 346275462, "end": 346278712}, {"filename": "/external/SDL/src/video/android/SDL_androidtouch.h", "start": 346278712, "end": 346280009}, {"filename": "/external/SDL/src/video/android/SDL_androidvideo.c", "start": 346280009, "end": 346292401}, {"filename": "/external/SDL/src/video/android/SDL_androidvideo.h", "start": 346292401, "end": 346294457}, {"filename": "/external/SDL/src/video/android/SDL_androidvulkan.c", "start": 346294457, "end": 346301425}, {"filename": "/external/SDL/src/video/android/SDL_androidvulkan.h", "start": 346301425, "end": 346303659}, {"filename": "/external/SDL/src/video/android/SDL_androidwindow.c", "start": 346303659, "end": 346310254}, {"filename": "/external/SDL/src/video/android/SDL_androidwindow.h", "start": 346310254, "end": 346312400}, {"filename": "/external/SDL/src/video/arm/SDL_sve2_blit_A.c", "start": 346312400, "end": 346320065}, {"filename": "/external/SDL/src/video/arm/SDL_sve2_blit_A.h", "start": 346320065, "end": 346321467}, {"filename": "/external/SDL/src/video/arm/SDL_sve2_blit_N.c", "start": 346321467, "end": 346333868}, {"filename": "/external/SDL/src/video/arm/SDL_sve2_blit_N.h", "start": 346333868, "end": 346335250}, {"filename": "/external/SDL/src/video/arm/SDL_sve2_extension.h", "start": 346335250, "end": 346409090}, {"filename": "/external/SDL/src/video/arm/SDL_sve2_swizzle.h", "start": 346409090, "end": 346503293}, {"filename": "/external/SDL/src/video/arm/SDL_sve2_util.h", "start": 346503293, "end": 346507120}, {"filename": "/external/SDL/src/video/cocoa/SDL_cocoaclipboard.h", "start": 346507120, "end": 346508572}, {"filename": "/external/SDL/src/video/cocoa/SDL_cocoaclipboard.m", "start": 346508572, "end": 346523741}, {"filename": "/external/SDL/src/video/cocoa/SDL_cocoaevents.h", "start": 346523741, "end": 346525201}, {"filename": "/external/SDL/src/video/cocoa/SDL_cocoaevents.m", "start": 346525201, "end": 346551015}, {"filename": "/external/SDL/src/video/cocoa/SDL_cocoakeyboard.h", "start": 346551015, "end": 346552657}, {"filename": "/external/SDL/src/video/cocoa/SDL_cocoakeyboard.m", "start": 346552657, "end": 346575065}, {"filename": "/external/SDL/src/video/cocoa/SDL_cocoamessagebox.h", "start": 346575065, "end": 346576214}, {"filename": "/external/SDL/src/video/cocoa/SDL_cocoamessagebox.m", "start": 346576214, "end": 346581102}, {"filename": "/external/SDL/src/video/cocoa/SDL_cocoametalview.h", "start": 346581102, "end": 346583396}, {"filename": "/external/SDL/src/video/cocoa/SDL_cocoametalview.m", "start": 346583396, "end": 346589393}, {"filename": "/external/SDL/src/video/cocoa/SDL_cocoamodes.h", "start": 346589393, "end": 346591326}, {"filename": "/external/SDL/src/video/cocoa/SDL_cocoamodes.m", "start": 346591326, "end": 346619681}, {"filename": "/external/SDL/src/video/cocoa/SDL_cocoamouse.h", "start": 346619681, "end": 346621907}, {"filename": "/external/SDL/src/video/cocoa/SDL_cocoamouse.m", "start": 346621907, "end": 346657533}, {"filename": "/external/SDL/src/video/cocoa/SDL_cocoaopengl.h", "start": 346657533, "end": 346660650}, {"filename": "/external/SDL/src/video/cocoa/SDL_cocoaopengl.m", "start": 346660650, "end": 346680772}, {"filename": "/external/SDL/src/video/cocoa/SDL_cocoaopengles.h", "start": 346680772, "end": 346682923}, {"filename": "/external/SDL/src/video/cocoa/SDL_cocoaopengles.m", "start": 346682923, "end": 346689016}, {"filename": "/external/SDL/src/video/cocoa/SDL_cocoapen.h", "start": 346689016, "end": 346690349}, {"filename": "/external/SDL/src/video/cocoa/SDL_cocoapen.m", "start": 346690349, "end": 346697701}, {"filename": "/external/SDL/src/video/cocoa/SDL_cocoashape.h", "start": 346697701, "end": 346698878}, {"filename": "/external/SDL/src/video/cocoa/SDL_cocoashape.m", "start": 346698878, "end": 346700941}, {"filename": "/external/SDL/src/video/cocoa/SDL_cocoavideo.h", "start": 346700941, "end": 346703305}, {"filename": "/external/SDL/src/video/cocoa/SDL_cocoavideo.m", "start": 346703305, "end": 346716797}, {"filename": "/external/SDL/src/video/cocoa/SDL_cocoavulkan.h", "start": 346716797, "end": 346718946}, {"filename": "/external/SDL/src/video/cocoa/SDL_cocoavulkan.m", "start": 346718946, "end": 346733714}, {"filename": "/external/SDL/src/video/cocoa/SDL_cocoawindow.h", "start": 346733714, "end": 346743146}, {"filename": "/external/SDL/src/video/cocoa/SDL_cocoawindow.m", "start": 346743146, "end": 346875444}, {"filename": "/external/SDL/src/video/directx/SDL_d3d12.h", "start": 346875444, "end": 346879246}, {"filename": "/external/SDL/src/video/directx/SDL_d3d12_xbox_cmacros.h", "start": 346879246, "end": 347260758}, {"filename": "/external/SDL/src/video/directx/d3d12.h", "start": 347260758, "end": 348802729}, {"filename": "/external/SDL/src/video/directx/d3d12sdklayers.h", "start": 348802729, "end": 348984178}, {"filename": "/external/SDL/src/video/directx/gen_xbox_cmacros.cs", "start": 348984178, "end": 348987976}, {"filename": "/external/SDL/src/video/dos/SDL_dosevents.c", "start": 348987976, "end": 349003329}, {"filename": "/external/SDL/src/video/dos/SDL_dosevents_c.h", "start": 349003329, "end": 349004566}, {"filename": "/external/SDL/src/video/dos/SDL_dosframebuffer.c", "start": 349004566, "end": 349046299}, {"filename": "/external/SDL/src/video/dos/SDL_dosframebuffer_c.h", "start": 349046299, "end": 349048022}, {"filename": "/external/SDL/src/video/dos/SDL_dosmodes.c", "start": 349048022, "end": 349073994}, {"filename": "/external/SDL/src/video/dos/SDL_dosmodes.h", "start": 349073994, "end": 349076285}, {"filename": "/external/SDL/src/video/dos/SDL_dosmouse.c", "start": 349076285, "end": 349081411}, {"filename": "/external/SDL/src/video/dos/SDL_dosmouse.h", "start": 349081411, "end": 349082770}, {"filename": "/external/SDL/src/video/dos/SDL_dosvideo.c", "start": 349082770, "end": 349095902}, {"filename": "/external/SDL/src/video/dos/SDL_dosvideo.h", "start": 349095902, "end": 349099187}, {"filename": "/external/SDL/src/video/dummy/SDL_nullevents.c", "start": 349099187, "end": 349100521}, {"filename": "/external/SDL/src/video/dummy/SDL_nullevents_c.h", "start": 349100521, "end": 349101689}, {"filename": "/external/SDL/src/video/dummy/SDL_nullframebuffer.c", "start": 349101689, "end": 349104507}, {"filename": "/external/SDL/src/video/dummy/SDL_nullframebuffer_c.h", "start": 349104507, "end": 349105971}, {"filename": "/external/SDL/src/video/dummy/SDL_nullvideo.c", "start": 349105971, "end": 349112197}, {"filename": "/external/SDL/src/video/dummy/SDL_nullvideo.h", "start": 349112197, "end": 349113299}, {"filename": "/external/SDL/src/video/emscripten/SDL_emscriptenevents.c", "start": 349113299, "end": 349174323}, {"filename": "/external/SDL/src/video/emscripten/SDL_emscriptenevents.h", "start": 349174323, "end": 349175823}, {"filename": "/external/SDL/src/video/emscripten/SDL_emscriptenframebuffer.c", "start": 349175823, "end": 349180000}, {"filename": "/external/SDL/src/video/emscripten/SDL_emscriptenframebuffer.h", "start": 349180000, "end": 349181477}, {"filename": "/external/SDL/src/video/emscripten/SDL_emscriptenmouse.c", "start": 349181477, "end": 349190224}, {"filename": "/external/SDL/src/video/emscripten/SDL_emscriptenmouse.h", "start": 349190224, "end": 349191454}, {"filename": "/external/SDL/src/video/emscripten/SDL_emscriptenopengles.c", "start": 349191454, "end": 349197037}, {"filename": "/external/SDL/src/video/emscripten/SDL_emscriptenopengles.h", "start": 349197037, "end": 349199076}, {"filename": "/external/SDL/src/video/emscripten/SDL_emscriptenvideo.c", "start": 349199076, "end": 349230657}, {"filename": "/external/SDL/src/video/emscripten/SDL_emscriptenvideo.h", "start": 349230657, "end": 349232509}, {"filename": "/external/SDL/src/video/gdk/SDL_gdktextinput.cpp", "start": 349232509, "end": 349243058}, {"filename": "/external/SDL/src/video/gdk/SDL_gdktextinput.h", "start": 349243058, "end": 349244834}, {"filename": "/external/SDL/src/video/haiku/SDL_BWin.h", "start": 349244834, "end": 349266612}, {"filename": "/external/SDL/src/video/haiku/SDL_bclipboard.cc", "start": 349266612, "end": 349269420}, {"filename": "/external/SDL/src/video/haiku/SDL_bclipboard.h", "start": 349269420, "end": 349270676}, {"filename": "/external/SDL/src/video/haiku/SDL_bevents.cc", "start": 349270676, "end": 349271968}, {"filename": "/external/SDL/src/video/haiku/SDL_bevents.h", "start": 349271968, "end": 349273151}, {"filename": "/external/SDL/src/video/haiku/SDL_bframebuffer.cc", "start": 349273151, "end": 349276500}, {"filename": "/external/SDL/src/video/haiku/SDL_bframebuffer.h", "start": 349276500, "end": 349278211}, {"filename": "/external/SDL/src/video/haiku/SDL_bkeyboard.cc", "start": 349278211, "end": 349285228}, {"filename": "/external/SDL/src/video/haiku/SDL_bkeyboard.h", "start": 349285228, "end": 349286456}, {"filename": "/external/SDL/src/video/haiku/SDL_bmessagebox.cc", "start": 349286456, "end": 349297316}, {"filename": "/external/SDL/src/video/haiku/SDL_bmessagebox.h", "start": 349297316, "end": 349298664}, {"filename": "/external/SDL/src/video/haiku/SDL_bmodes.cc", "start": 349298664, "end": 349307508}, {"filename": "/external/SDL/src/video/haiku/SDL_bmodes.h", "start": 349307508, "end": 349309118}, {"filename": "/external/SDL/src/video/haiku/SDL_bopengl.cc", "start": 349309118, "end": 349315447}, {"filename": "/external/SDL/src/video/haiku/SDL_bopengl.h", "start": 349315447, "end": 349317606}, {"filename": "/external/SDL/src/video/haiku/SDL_bvideo.cc", "start": 349317606, "end": 349328301}, {"filename": "/external/SDL/src/video/haiku/SDL_bvideo.h", "start": 349328301, "end": 349329625}, {"filename": "/external/SDL/src/video/haiku/SDL_bwindow.cc", "start": 349329625, "end": 349336380}, {"filename": "/external/SDL/src/video/haiku/SDL_bwindow.h", "start": 349336380, "end": 349339043}, {"filename": "/external/SDL/src/video/khronos/EGL/egl.h", "start": 349339043, "end": 349358671}, {"filename": "/external/SDL/src/video/khronos/EGL/eglext.h", "start": 349358671, "end": 349433981}, {"filename": "/external/SDL/src/video/khronos/EGL/eglplatform.h", "start": 349433981, "end": 349439395}, {"filename": "/external/SDL/src/video/khronos/GLES/egl.h", "start": 349439395, "end": 349439812}, {"filename": "/external/SDL/src/video/khronos/GLES/gl.h", "start": 349439812, "end": 349470984}, {"filename": "/external/SDL/src/video/khronos/GLES/glext.h", "start": 349470984, "end": 349524648}, {"filename": "/external/SDL/src/video/khronos/GLES/glplatform.h", "start": 349524648, "end": 349525309}, {"filename": "/external/SDL/src/video/khronos/GLES2/gl2.h", "start": 349525309, "end": 349568895}, {"filename": "/external/SDL/src/video/khronos/GLES2/gl2ext.h", "start": 349568895, "end": 349824524}, {"filename": "/external/SDL/src/video/khronos/GLES2/gl2platform.h", "start": 349824524, "end": 349825193}, {"filename": "/external/SDL/src/video/khronos/GLES3/gl3.h", "start": 349825193, "end": 349907985}, {"filename": "/external/SDL/src/video/khronos/GLES3/gl31.h", "start": 349907985, "end": 350015884}, {"filename": "/external/SDL/src/video/khronos/GLES3/gl32.h", "start": 350015884, "end": 350144964}, {"filename": "/external/SDL/src/video/khronos/GLES3/gl3platform.h", "start": 350144964, "end": 350145633}, {"filename": "/external/SDL/src/video/khronos/KHR/khrplatform.h", "start": 350145633, "end": 350157171}, {"filename": "/external/SDL/src/video/khronos/openxr/openxr.h", "start": 350157171, "end": 350884911}, {"filename": "/external/SDL/src/video/khronos/openxr/openxr_loader_negotiation.h", "start": 350884911, "end": 350890060}, {"filename": "/external/SDL/src/video/khronos/openxr/openxr_platform.h", "start": 350890060, "end": 350926082}, {"filename": "/external/SDL/src/video/khronos/openxr/openxr_platform_defines.h", "start": 350926082, "end": 350930108}, {"filename": "/external/SDL/src/video/khronos/openxr/openxr_reflection.h", "start": 350930108, "end": 351548583}, {"filename": "/external/SDL/src/video/khronos/openxr/openxr_reflection_parent_structs.h", "start": 351548583, "end": 351579833}, {"filename": "/external/SDL/src/video/khronos/openxr/openxr_reflection_structs.h", "start": 351579833, "end": 351660020}, {"filename": "/external/SDL/src/video/khronos/vk_video/vulkan_video_codec_av1std.h", "start": 351660020, "end": 351677114}, {"filename": "/external/SDL/src/video/khronos/vk_video/vulkan_video_codec_av1std_decode.h", "start": 351677114, "end": 351681484}, {"filename": "/external/SDL/src/video/khronos/vk_video/vulkan_video_codec_av1std_encode.h", "start": 351681484, "end": 351687617}, {"filename": "/external/SDL/src/video/khronos/vk_video/vulkan_video_codec_h264std.h", "start": 351687617, "end": 351701898}, {"filename": "/external/SDL/src/video/khronos/vk_video/vulkan_video_codec_h264std_decode.h", "start": 351701898, "end": 351704709}, {"filename": "/external/SDL/src/video/khronos/vk_video/vulkan_video_codec_h264std_encode.h", "start": 351704709, "end": 351711745}, {"filename": "/external/SDL/src/video/khronos/vk_video/vulkan_video_codec_h265std.h", "start": 351711745, "end": 351735643}, {"filename": "/external/SDL/src/video/khronos/vk_video/vulkan_video_codec_h265std_decode.h", "start": 351735643, "end": 351738150}, {"filename": "/external/SDL/src/video/khronos/vk_video/vulkan_video_codec_h265std_encode.h", "start": 351738150, "end": 351745780}, {"filename": "/external/SDL/src/video/khronos/vk_video/vulkan_video_codec_vp9std.h", "start": 351745780, "end": 351751328}, {"filename": "/external/SDL/src/video/khronos/vk_video/vulkan_video_codec_vp9std_decode.h", "start": 351751328, "end": 351753778}, {"filename": "/external/SDL/src/video/khronos/vk_video/vulkan_video_codecs_common.h", "start": 351753778, "end": 351754481}, {"filename": "/external/SDL/src/video/khronos/vulkan/vk_icd.h", "start": 351754481, "end": 351763185}, {"filename": "/external/SDL/src/video/khronos/vulkan/vk_layer.h", "start": 351763185, "end": 351770558}, {"filename": "/external/SDL/src/video/khronos/vulkan/vk_platform.h", "start": 351770558, "end": 351773526}, {"filename": "/external/SDL/src/video/khronos/vulkan/vulkan.h", "start": 351773526, "end": 351775432}, {"filename": "/external/SDL/src/video/khronos/vulkan/vulkan_android.h", "start": 351775432, "end": 351781952}, {"filename": "/external/SDL/src/video/khronos/vulkan/vulkan_beta.h", "start": 351781952, "end": 351799754}, {"filename": "/external/SDL/src/video/khronos/vulkan/vulkan_core.h", "start": 351799754, "end": 353194252}, {"filename": "/external/SDL/src/video/khronos/vulkan/vulkan_directfb.h", "start": 353194252, "end": 353196278}, {"filename": "/external/SDL/src/video/khronos/vulkan/vulkan_fuchsia.h", "start": 353196278, "end": 353209493}, {"filename": "/external/SDL/src/video/khronos/vulkan/vulkan_ggp.h", "start": 353209493, "end": 353211515}, {"filename": "/external/SDL/src/video/khronos/vulkan/vulkan_ios.h", "start": 353211515, "end": 353212934}, {"filename": "/external/SDL/src/video/khronos/vulkan/vulkan_macos.h", "start": 353212934, "end": 353214385}, {"filename": "/external/SDL/src/video/khronos/vulkan/vulkan_metal.h", "start": 353214385, "end": 353223058}, {"filename": "/external/SDL/src/video/khronos/vulkan/vulkan_ohos.h", "start": 353223058, "end": 353227311}, {"filename": "/external/SDL/src/video/khronos/vulkan/vulkan_screen.h", "start": 353227311, "end": 353231641}, {"filename": "/external/SDL/src/video/khronos/vulkan/vulkan_ubm.h", "start": 353231641, "end": 353233586}, {"filename": "/external/SDL/src/video/khronos/vulkan/vulkan_vi.h", "start": 353233586, "end": 353234978}, {"filename": "/external/SDL/src/video/khronos/vulkan/vulkan_wayland.h", "start": 353234978, "end": 353237004}, {"filename": "/external/SDL/src/video/khronos/vulkan/vulkan_win32.h", "start": 353237004, "end": 353253188}, {"filename": "/external/SDL/src/video/khronos/vulkan/vulkan_xcb.h", "start": 353253188, "end": 353255229}, {"filename": "/external/SDL/src/video/khronos/vulkan/vulkan_xlib.h", "start": 353255229, "end": 353257251}, {"filename": "/external/SDL/src/video/khronos/vulkan/vulkan_xlib_xrandr.h", "start": 353257251, "end": 353258809}, {"filename": "/external/SDL/src/video/kmsdrm/SDL_kmsdrmdyn.c", "start": 353258809, "end": 353264400}, {"filename": "/external/SDL/src/video/kmsdrm/SDL_kmsdrmdyn.h", "start": 353264400, "end": 353266226}, {"filename": "/external/SDL/src/video/kmsdrm/SDL_kmsdrmevents.c", "start": 353266226, "end": 353267676}, {"filename": "/external/SDL/src/video/kmsdrm/SDL_kmsdrmevents.h", "start": 353267676, "end": 353268815}, {"filename": "/external/SDL/src/video/kmsdrm/SDL_kmsdrmmouse.c", "start": 353268815, "end": 353288307}, {"filename": "/external/SDL/src/video/kmsdrm/SDL_kmsdrmmouse.h", "start": 353288307, "end": 353290114}, {"filename": "/external/SDL/src/video/kmsdrm/SDL_kmsdrmopengles.c", "start": 353290114, "end": 353314762}, {"filename": "/external/SDL/src/video/kmsdrm/SDL_kmsdrmopengles.h", "start": 353314762, "end": 353316728}, {"filename": "/external/SDL/src/video/kmsdrm/SDL_kmsdrmsym.h", "start": 353316728, "end": 353325296}, {"filename": "/external/SDL/src/video/kmsdrm/SDL_kmsdrmvideo.c", "start": 353325296, "end": 353412067}, {"filename": "/external/SDL/src/video/kmsdrm/SDL_kmsdrmvideo.h", "start": 353412067, "end": 353420765}, {"filename": "/external/SDL/src/video/kmsdrm/SDL_kmsdrmvulkan.c", "start": 353420765, "end": 353442169}, {"filename": "/external/SDL/src/video/kmsdrm/SDL_kmsdrmvulkan.h", "start": 353442169, "end": 353444312}, {"filename": "/external/SDL/src/video/miniz.h", "start": 353444312, "end": 353681899}, {"filename": "/external/SDL/src/video/n3ds/SDL_n3dsevents.c", "start": 353681899, "end": 353683350}, {"filename": "/external/SDL/src/video/n3ds/SDL_n3dsevents_c.h", "start": 353683350, "end": 353684487}, {"filename": "/external/SDL/src/video/n3ds/SDL_n3dsframebuffer.c", "start": 353684487, "end": 353690638}, {"filename": "/external/SDL/src/video/n3ds/SDL_n3dsframebuffer_c.h", "start": 353690638, "end": 353692099}, {"filename": "/external/SDL/src/video/n3ds/SDL_n3dsswkb.c", "start": 353692099, "end": 353693996}, {"filename": "/external/SDL/src/video/n3ds/SDL_n3dsswkb.h", "start": 353693996, "end": 353695391}, {"filename": "/external/SDL/src/video/n3ds/SDL_n3dstouch.c", "start": 353695391, "end": 353698299}, {"filename": "/external/SDL/src/video/n3ds/SDL_n3dstouch.h", "start": 353698299, "end": 353699446}, {"filename": "/external/SDL/src/video/n3ds/SDL_n3dsvideo.c", "start": 353699446, "end": 353707324}, {"filename": "/external/SDL/src/video/n3ds/SDL_n3dsvideo.h", "start": 353707324, "end": 353708653}, {"filename": "/external/SDL/src/video/ngage/SDL_ngagevideo.c", "start": 353708653, "end": 353713517}, {"filename": "/external/SDL/src/video/ngage/SDL_ngagevideo.h", "start": 353713517, "end": 353714804}, {"filename": "/external/SDL/src/video/offscreen/SDL_offscreenevents.c", "start": 353714804, "end": 353716165}, {"filename": "/external/SDL/src/video/offscreen/SDL_offscreenevents_c.h", "start": 353716165, "end": 353717212}, {"filename": "/external/SDL/src/video/offscreen/SDL_offscreenframebuffer.c", "start": 353717212, "end": 353720081}, {"filename": "/external/SDL/src/video/offscreen/SDL_offscreenframebuffer_c.h", "start": 353720081, "end": 353721447}, {"filename": "/external/SDL/src/video/offscreen/SDL_offscreenopengles.c", "start": 353721447, "end": 353724246}, {"filename": "/external/SDL/src/video/offscreen/SDL_offscreenopengles.h", "start": 353724246, "end": 353726236}, {"filename": "/external/SDL/src/video/offscreen/SDL_offscreenvideo.c", "start": 353726236, "end": 353731432}, {"filename": "/external/SDL/src/video/offscreen/SDL_offscreenvideo.h", "start": 353731432, "end": 353732546}, {"filename": "/external/SDL/src/video/offscreen/SDL_offscreenvulkan.c", "start": 353732546, "end": 353742912}, {"filename": "/external/SDL/src/video/offscreen/SDL_offscreenvulkan.h", "start": 353742912, "end": 353744763}, {"filename": "/external/SDL/src/video/offscreen/SDL_offscreenwindow.c", "start": 353744763, "end": 353747701}, {"filename": "/external/SDL/src/video/offscreen/SDL_offscreenwindow.h", "start": 353747701, "end": 353749226}, {"filename": "/external/SDL/src/video/openharmony/SDL_openharmonyclipboard.c", "start": 353749226, "end": 353756671}, {"filename": "/external/SDL/src/video/openharmony/SDL_openharmonyclipboard.h", "start": 353756671, "end": 353758231}, {"filename": "/external/SDL/src/video/openharmony/SDL_openharmonyevents.c", "start": 353758231, "end": 353780109}, {"filename": "/external/SDL/src/video/openharmony/SDL_openharmonyevents.h", "start": 353780109, "end": 353781699}, {"filename": "/external/SDL/src/video/openharmony/SDL_openharmonykeyboard.c", "start": 353781699, "end": 353785260}, {"filename": "/external/SDL/src/video/openharmony/SDL_openharmonykeyboard.h", "start": 353785260, "end": 353786656}, {"filename": "/external/SDL/src/video/openharmony/SDL_openharmonymouse.c", "start": 353786656, "end": 353789113}, {"filename": "/external/SDL/src/video/openharmony/SDL_openharmonymouse.h", "start": 353789113, "end": 353790300}, {"filename": "/external/SDL/src/video/openharmony/SDL_openharmonyopengl.c", "start": 353790300, "end": 353793057}, {"filename": "/external/SDL/src/video/openharmony/SDL_openharmonyopengl.h", "start": 353793057, "end": 353794532}, {"filename": "/external/SDL/src/video/openharmony/SDL_openharmonyvideo.c", "start": 353794532, "end": 353806432}, {"filename": "/external/SDL/src/video/openharmony/SDL_openharmonyvideo.h", "start": 353806432, "end": 353808216}, {"filename": "/external/SDL/src/video/openharmony/SDL_openharmonyvulkan.c", "start": 353808216, "end": 353814866}, {"filename": "/external/SDL/src/video/openharmony/SDL_openharmonyvulkan.h", "start": 353814866, "end": 353817201}, {"filename": "/external/SDL/src/video/openharmony/SDL_openharmonywindow.c", "start": 353817201, "end": 353824108}, {"filename": "/external/SDL/src/video/openharmony/SDL_openharmonywindow.h", "start": 353824108, "end": 353826321}, {"filename": "/external/SDL/src/video/openvr/SDL_openvrvideo.c", "start": 353826321, "end": 353887798}, {"filename": "/external/SDL/src/video/openvr/SDL_openvrvideo.h", "start": 353887798, "end": 353890035}, {"filename": "/external/SDL/src/video/openvr/openvr_capi.h", "start": 353890035, "end": 354060755}, {"filename": "/external/SDL/src/video/ps2/SDL_ps2video.c", "start": 354060755, "end": 354064405}, {"filename": "/external/SDL/src/video/ps2/SDL_ps2video.h", "start": 354064405, "end": 354065832}, {"filename": "/external/SDL/src/video/psp/SDL_pspevents.c", "start": 354065832, "end": 354074719}, {"filename": "/external/SDL/src/video/psp/SDL_pspevents_c.h", "start": 354074719, "end": 354075956}, {"filename": "/external/SDL/src/video/psp/SDL_pspgl.c", "start": 354075956, "end": 354082323}, {"filename": "/external/SDL/src/video/psp/SDL_pspgl_c.h", "start": 354082323, "end": 354084303}, {"filename": "/external/SDL/src/video/psp/SDL_pspvideo.c", "start": 354084303, "end": 354100085}, {"filename": "/external/SDL/src/video/psp/SDL_pspvideo.h", "start": 354100085, "end": 354103907}, {"filename": "/external/SDL/src/video/qnx/SDL_qnx.h", "start": 354103907, "end": 354107242}, {"filename": "/external/SDL/src/video/qnx/SDL_qnxgl.c", "start": 354107242, "end": 354111923}, {"filename": "/external/SDL/src/video/qnx/SDL_qnxkeyboard.c", "start": 354111923, "end": 354120341}, {"filename": "/external/SDL/src/video/qnx/SDL_qnxmodes.c", "start": 354120341, "end": 354127442}, {"filename": "/external/SDL/src/video/qnx/SDL_qnxmouse.c", "start": 354127442, "end": 354134144}, {"filename": "/external/SDL/src/video/qnx/SDL_qnxpointer.c", "start": 354134144, "end": 354137479}, {"filename": "/external/SDL/src/video/qnx/SDL_qnxvideo.c", "start": 354137479, "end": 354157077}, {"filename": "/external/SDL/src/video/raspberry/SDL_rpievents.c", "start": 354157077, "end": 354158488}, {"filename": "/external/SDL/src/video/raspberry/SDL_rpievents_c.h", "start": 354158488, "end": 354159614}, {"filename": "/external/SDL/src/video/raspberry/SDL_rpimouse.c", "start": 354159614, "end": 354170101}, {"filename": "/external/SDL/src/video/raspberry/SDL_rpimouse.h", "start": 354170101, "end": 354171549}, {"filename": "/external/SDL/src/video/raspberry/SDL_rpiopengles.c", "start": 354171549, "end": 354173947}, {"filename": "/external/SDL/src/video/raspberry/SDL_rpiopengles.h", "start": 354173947, "end": 354176005}, {"filename": "/external/SDL/src/video/raspberry/SDL_rpivideo.c", "start": 354176005, "end": 354188188}, {"filename": "/external/SDL/src/video/raspberry/SDL_rpivideo.h", "start": 354188188, "end": 354192065}, {"filename": "/external/SDL/src/video/riscos/SDL_riscosdefs.h", "start": 354192065, "end": 354193737}, {"filename": "/external/SDL/src/video/riscos/SDL_riscosevents.c", "start": 354193737, "end": 354199055}, {"filename": "/external/SDL/src/video/riscos/SDL_riscosevents_c.h", "start": 354199055, "end": 354200344}, {"filename": "/external/SDL/src/video/riscos/SDL_riscosframebuffer.c", "start": 354200344, "end": 354204572}, {"filename": "/external/SDL/src/video/riscos/SDL_riscosframebuffer_c.h", "start": 354204572, "end": 354206033}, {"filename": "/external/SDL/src/video/riscos/SDL_riscosmessagebox.c", "start": 354206033, "end": 354208325}, {"filename": "/external/SDL/src/video/riscos/SDL_riscosmessagebox.h", "start": 354208325, "end": 354209477}, {"filename": "/external/SDL/src/video/riscos/SDL_riscosmodes.c", "start": 354209477, "end": 354218540}, {"filename": "/external/SDL/src/video/riscos/SDL_riscosmodes.h", "start": 354218540, "end": 354219871}, {"filename": "/external/SDL/src/video/riscos/SDL_riscosmouse.c", "start": 354219871, "end": 354222322}, {"filename": "/external/SDL/src/video/riscos/SDL_riscosmouse.h", "start": 354222322, "end": 354223455}, {"filename": "/external/SDL/src/video/riscos/SDL_riscosvideo.c", "start": 354223455, "end": 354227257}, {"filename": "/external/SDL/src/video/riscos/SDL_riscosvideo.h", "start": 354227257, "end": 354228511}, {"filename": "/external/SDL/src/video/riscos/SDL_riscoswindow.c", "start": 354228511, "end": 354230264}, {"filename": "/external/SDL/src/video/riscos/SDL_riscoswindow.h", "start": 354230264, "end": 354231679}, {"filename": "/external/SDL/src/video/riscos/scancodes_riscos.h", "start": 354231679, "end": 354237892}, {"filename": "/external/SDL/src/video/sdlgenblit.pl", "start": 354237892, "end": 354260015}, {"filename": "/external/SDL/src/video/stb_image.h", "start": 354260015, "end": 354560656}, {"filename": "/external/SDL/src/video/uikit/SDL_CurvedContentHosting.swift", "start": 354560656, "end": 354580437}, {"filename": "/external/SDL/src/video/uikit/SDL_CurvedContentView.swift", "start": 354580437, "end": 354596369}, {"filename": "/external/SDL/src/video/uikit/SDL_CurvedUIShader.swift", "start": 354596369, "end": 354620857}, {"filename": "/external/SDL/src/video/uikit/SDL_RealityKitHelper.swift", "start": 354620857, "end": 354637481}, {"filename": "/external/SDL/src/video/uikit/SDL_UIKitBridge-objc.h", "start": 354637481, "end": 354639422}, {"filename": "/external/SDL/src/video/uikit/SDL_UIKitBridge-swift.h", "start": 354639422, "end": 354641470}, {"filename": "/external/SDL/src/video/uikit/SDL_UIKitBridge.m", "start": 354641470, "end": 354649367}, {"filename": "/external/SDL/src/video/uikit/SDL_uikitappdelegate.h", "start": 354649367, "end": 354651267}, {"filename": "/external/SDL/src/video/uikit/SDL_uikitappdelegate.m", "start": 354651267, "end": 354677186}, {"filename": "/external/SDL/src/video/uikit/SDL_uikitclipboard.h", "start": 354677186, "end": 354678596}, {"filename": "/external/SDL/src/video/uikit/SDL_uikitclipboard.m", "start": 354678596, "end": 354682370}, {"filename": "/external/SDL/src/video/uikit/SDL_uikitevents.h", "start": 354682370, "end": 354683849}, {"filename": "/external/SDL/src/video/uikit/SDL_uikitevents.m", "start": 354683849, "end": 354702733}, {"filename": "/external/SDL/src/video/uikit/SDL_uikitmessagebox.h", "start": 354702733, "end": 354703926}, {"filename": "/external/SDL/src/video/uikit/SDL_uikitmessagebox.m", "start": 354703926, "end": 354709622}, {"filename": "/external/SDL/src/video/uikit/SDL_uikitmetalview.h", "start": 354709622, "end": 354711587}, {"filename": "/external/SDL/src/video/uikit/SDL_uikitmetalview.m", "start": 354711587, "end": 354716474}, {"filename": "/external/SDL/src/video/uikit/SDL_uikitmodes.h", "start": 354716474, "end": 354718957}, {"filename": "/external/SDL/src/video/uikit/SDL_uikitmodes.m", "start": 354718957, "end": 354736483}, {"filename": "/external/SDL/src/video/uikit/SDL_uikitopengles.h", "start": 354736483, "end": 354738303}, {"filename": "/external/SDL/src/video/uikit/SDL_uikitopengles.m", "start": 354738303, "end": 354747454}, {"filename": "/external/SDL/src/video/uikit/SDL_uikitopenglview.h", "start": 354747454, "end": 354749760}, {"filename": "/external/SDL/src/video/uikit/SDL_uikitopenglview.m", "start": 354749760, "end": 354762867}, {"filename": "/external/SDL/src/video/uikit/SDL_uikitpen.h", "start": 354762867, "end": 354764460}, {"filename": "/external/SDL/src/video/uikit/SDL_uikitpen.m", "start": 354764460, "end": 354773362}, {"filename": "/external/SDL/src/video/uikit/SDL_uikitvideo.h", "start": 354773362, "end": 354775622}, {"filename": "/external/SDL/src/video/uikit/SDL_uikitvideo.m", "start": 354775622, "end": 354792871}, {"filename": "/external/SDL/src/video/uikit/SDL_uikitview.h", "start": 354792871, "end": 354795170}, {"filename": "/external/SDL/src/video/uikit/SDL_uikitview.m", "start": 354795170, "end": 354817938}, {"filename": "/external/SDL/src/video/uikit/SDL_uikitviewcontroller.h", "start": 354817938, "end": 354821352}, {"filename": "/external/SDL/src/video/uikit/SDL_uikitviewcontroller.m", "start": 354821352, "end": 354846576}, {"filename": "/external/SDL/src/video/uikit/SDL_uikitviewcontroller.swift", "start": 354846576, "end": 354847867}, {"filename": "/external/SDL/src/video/uikit/SDL_uikitvulkan.h", "start": 354847867, "end": 354850016}, {"filename": "/external/SDL/src/video/uikit/SDL_uikitvulkan.m", "start": 354850016, "end": 354860017}, {"filename": "/external/SDL/src/video/uikit/SDL_uikitwindow.h", "start": 354860017, "end": 354862905}, {"filename": "/external/SDL/src/video/uikit/SDL_uikitwindow.m", "start": 354862905, "end": 354887430}, {"filename": "/external/SDL/src/video/vita/SDL_vitaframebuffer.c", "start": 354887430, "end": 354890779}, {"filename": "/external/SDL/src/video/vita/SDL_vitaframebuffer.h", "start": 354890779, "end": 354892118}, {"filename": "/external/SDL/src/video/vita/SDL_vitagl_pvr.c", "start": 354892118, "end": 354896584}, {"filename": "/external/SDL/src/video/vita/SDL_vitagles.c", "start": 354896584, "end": 354903808}, {"filename": "/external/SDL/src/video/vita/SDL_vitagles_pvr.c", "start": 354903808, "end": 354907250}, {"filename": "/external/SDL/src/video/vita/SDL_vitakeyboard.c", "start": 354907250, "end": 354914966}, {"filename": "/external/SDL/src/video/vita/SDL_vitakeyboard.h", "start": 354914966, "end": 354916145}, {"filename": "/external/SDL/src/video/vita/SDL_vitamessagebox.c", "start": 354916145, "end": 354920702}, {"filename": "/external/SDL/src/video/vita/SDL_vitamessagebox.h", "start": 354920702, "end": 354921920}, {"filename": "/external/SDL/src/video/vita/SDL_vitamouse.c", "start": 354921920, "end": 354926116}, {"filename": "/external/SDL/src/video/vita/SDL_vitamouse_c.h", "start": 354926116, "end": 354927277}, {"filename": "/external/SDL/src/video/vita/SDL_vitatouch.c", "start": 354927277, "end": 354934116}, {"filename": "/external/SDL/src/video/vita/SDL_vitatouch.h", "start": 354934116, "end": 354935408}, {"filename": "/external/SDL/src/video/vita/SDL_vitavideo.c", "start": 354935408, "end": 354953209}, {"filename": "/external/SDL/src/video/vita/SDL_vitavideo.h", "start": 354953209, "end": 354958063}, {"filename": "/external/SDL/src/video/vivante/SDL_vivanteopengles.c", "start": 354958063, "end": 354959652}, {"filename": "/external/SDL/src/video/vivante/SDL_vivanteopengles.h", "start": 354959652, "end": 354961699}, {"filename": "/external/SDL/src/video/vivante/SDL_vivanteplatform.c", "start": 354961699, "end": 354963152}, {"filename": "/external/SDL/src/video/vivante/SDL_vivanteplatform.h", "start": 354963152, "end": 354964754}, {"filename": "/external/SDL/src/video/vivante/SDL_vivantevideo.c", "start": 354964754, "end": 354976388}, {"filename": "/external/SDL/src/video/vivante/SDL_vivantevideo.h", "start": 354976388, "end": 354980086}, {"filename": "/external/SDL/src/video/vivante/SDL_vivantevulkan.c", "start": 354980086, "end": 354986037}, {"filename": "/external/SDL/src/video/vivante/SDL_vivantevulkan.h", "start": 354986037, "end": 354988237}, {"filename": "/external/SDL/src/video/wayland/SDL_waylandclipboard.c", "start": 354988237, "end": 354994560}, {"filename": "/external/SDL/src/video/wayland/SDL_waylandclipboard.h", "start": 354994560, "end": 354996235}, {"filename": "/external/SDL/src/video/wayland/SDL_waylandcolor.c", "start": 354996235, "end": 355011073}, {"filename": "/external/SDL/src/video/wayland/SDL_waylandcolor.h", "start": 355011073, "end": 355012507}, {"filename": "/external/SDL/src/video/wayland/SDL_waylanddatamanager.c", "start": 355012507, "end": 355066118}, {"filename": "/external/SDL/src/video/wayland/SDL_waylanddatamanager.h", "start": 355066118, "end": 355069324}, {"filename": "/external/SDL/src/video/wayland/SDL_waylanddyn.c", "start": 355069324, "end": 355076390}, {"filename": "/external/SDL/src/video/wayland/SDL_waylanddyn.h", "start": 355076390, "end": 355085258}, {"filename": "/external/SDL/src/video/wayland/SDL_waylandevents.c", "start": 355085258, "end": 355223428}, {"filename": "/external/SDL/src/video/wayland/SDL_waylandevents_c.h", "start": 355223428, "end": 355233256}, {"filename": "/external/SDL/src/video/wayland/SDL_waylandeventthread.c", "start": 355233256, "end": 355245737}, {"filename": "/external/SDL/src/video/wayland/SDL_waylandeventthread.h", "start": 355245737, "end": 355247895}, {"filename": "/external/SDL/src/video/wayland/SDL_waylandframebuffer.c", "start": 355247895, "end": 355257894}, {"filename": "/external/SDL/src/video/wayland/SDL_waylandframebuffer.h", "start": 355257894, "end": 355259720}, {"filename": "/external/SDL/src/video/wayland/SDL_waylandkeyboard.c", "start": 355259720, "end": 355271668}, {"filename": "/external/SDL/src/video/wayland/SDL_waylandkeyboard.h", "start": 355271668, "end": 355273276}, {"filename": "/external/SDL/src/video/wayland/SDL_waylandmessagebox.c", "start": 355273276, "end": 355274917}, {"filename": "/external/SDL/src/video/wayland/SDL_waylandmessagebox.h", "start": 355274917, "end": 355276153}, {"filename": "/external/SDL/src/video/wayland/SDL_waylandmouse.c", "start": 355276153, "end": 355332020}, {"filename": "/external/SDL/src/video/wayland/SDL_waylandmouse.h", "start": 355332020, "end": 355333797}, {"filename": "/external/SDL/src/video/wayland/SDL_waylandopengles.c", "start": 355333797, "end": 355341153}, {"filename": "/external/SDL/src/video/wayland/SDL_waylandopengles.h", "start": 355341153, "end": 355343378}, {"filename": "/external/SDL/src/video/wayland/SDL_waylandshmbuffer.c", "start": 355343378, "end": 355349141}, {"filename": "/external/SDL/src/video/wayland/SDL_waylandshmbuffer.h", "start": 355349141, "end": 355350598}, {"filename": "/external/SDL/src/video/wayland/SDL_waylandsym.h", "start": 355350598, "end": 355366760}, {"filename": "/external/SDL/src/video/wayland/SDL_waylandutil.c", "start": 355366760, "end": 355372004}, {"filename": "/external/SDL/src/video/wayland/SDL_waylandutil.h", "start": 355372004, "end": 355373384}, {"filename": "/external/SDL/src/video/wayland/SDL_waylandvideo.c", "start": 355373384, "end": 355453588}, {"filename": "/external/SDL/src/video/wayland/SDL_waylandvideo.h", "start": 355453588, "end": 355459780}, {"filename": "/external/SDL/src/video/wayland/SDL_waylandvulkan.c", "start": 355459780, "end": 355467874}, {"filename": "/external/SDL/src/video/wayland/SDL_waylandvulkan.h", "start": 355467874, "end": 355470337}, {"filename": "/external/SDL/src/video/wayland/SDL_waylandwindow.c", "start": 355470337, "end": 355637880}, {"filename": "/external/SDL/src/video/wayland/SDL_waylandwindow.h", "start": 355637880, "end": 355648847}, {"filename": "/external/SDL/src/video/windows/SDL_msctf.h", "start": 355648847, "end": 355660678}, {"filename": "/external/SDL/src/video/windows/SDL_windowsclipboard.c", "start": 355660678, "end": 355679618}, {"filename": "/external/SDL/src/video/windows/SDL_windowsclipboard.h", "start": 355679618, "end": 355681065}, {"filename": "/external/SDL/src/video/windows/SDL_windowsevents.c", "start": 355681065, "end": 355797740}, {"filename": "/external/SDL/src/video/windows/SDL_windowsevents.h", "start": 355797740, "end": 355799447}, {"filename": "/external/SDL/src/video/windows/SDL_windowsframebuffer.c", "start": 355799447, "end": 355804325}, {"filename": "/external/SDL/src/video/windows/SDL_windowsframebuffer.h", "start": 355804325, "end": 355805661}, {"filename": "/external/SDL/src/video/windows/SDL_windowsgameinput.cpp", "start": 355805661, "end": 355829589}, {"filename": "/external/SDL/src/video/windows/SDL_windowsgameinput.h", "start": 355829589, "end": 355831050}, {"filename": "/external/SDL/src/video/windows/SDL_windowskeyboard.c", "start": 355831050, "end": 355875082}, {"filename": "/external/SDL/src/video/windows/SDL_windowskeyboard.h", "start": 355875082, "end": 355876894}, {"filename": "/external/SDL/src/video/windows/SDL_windowsmessagebox.c", "start": 355876894, "end": 355914925}, {"filename": "/external/SDL/src/video/windows/SDL_windowsmessagebox.h", "start": 355914925, "end": 355916076}, {"filename": "/external/SDL/src/video/windows/SDL_windowsmodes.c", "start": 355916076, "end": 355950330}, {"filename": "/external/SDL/src/video/windows/SDL_windowsmodes.h", "start": 355950330, "end": 355952351}, {"filename": "/external/SDL/src/video/windows/SDL_windowsmouse.c", "start": 355952351, "end": 355981040}, {"filename": "/external/SDL/src/video/windows/SDL_windowsmouse.h", "start": 355981040, "end": 355982381}, {"filename": "/external/SDL/src/video/windows/SDL_windowsopengl.c", "start": 355982381, "end": 356017261}, {"filename": "/external/SDL/src/video/windows/SDL_windowsopengl.h", "start": 356017261, "end": 356024839}, {"filename": "/external/SDL/src/video/windows/SDL_windowsopengles.c", "start": 356024839, "end": 356030322}, {"filename": "/external/SDL/src/video/windows/SDL_windowsopengles.h", "start": 356030322, "end": 356032443}, {"filename": "/external/SDL/src/video/windows/SDL_windowsrawinput.c", "start": 356032443, "end": 356046793}, {"filename": "/external/SDL/src/video/windows/SDL_windowsrawinput.h", "start": 356046793, "end": 356048342}, {"filename": "/external/SDL/src/video/windows/SDL_windowsshape.c", "start": 356048342, "end": 356052862}, {"filename": "/external/SDL/src/video/windows/SDL_windowsshape.h", "start": 356052862, "end": 356054043}, {"filename": "/external/SDL/src/video/windows/SDL_windowsvideo.c", "start": 356054043, "end": 356090863}, {"filename": "/external/SDL/src/video/windows/SDL_windowsvideo.h", "start": 356090863, "end": 356111208}, {"filename": "/external/SDL/src/video/windows/SDL_windowsvulkan.c", "start": 356111208, "end": 356118754}, {"filename": "/external/SDL/src/video/windows/SDL_windowsvulkan.h", "start": 356118754, "end": 356121126}, {"filename": "/external/SDL/src/video/windows/SDL_windowswindow.c", "start": 356121126, "end": 356213853}, {"filename": "/external/SDL/src/video/windows/SDL_windowswindow.h", "start": 356213853, "end": 356220525}, {"filename": "/external/SDL/src/video/windows/wmmsg.h", "start": 356220525, "end": 356244356}, {"filename": "/external/SDL/src/video/x11/SDL_x11clipboard.c", "start": 356244356, "end": 356255980}, {"filename": "/external/SDL/src/video/x11/SDL_x11clipboard.h", "start": 356255980, "end": 356257946}, {"filename": "/external/SDL/src/video/x11/SDL_x11dyn.c", "start": 356257946, "end": 356265878}, {"filename": "/external/SDL/src/video/x11/SDL_x11dyn.h", "start": 356265878, "end": 356269036}, {"filename": "/external/SDL/src/video/x11/SDL_x11events.c", "start": 356269036, "end": 356370066}, {"filename": "/external/SDL/src/video/x11/SDL_x11events.h", "start": 356370066, "end": 356372434}, {"filename": "/external/SDL/src/video/x11/SDL_x11framebuffer.c", "start": 356372434, "end": 356380676}, {"filename": "/external/SDL/src/video/x11/SDL_x11framebuffer.h", "start": 356380676, "end": 356382236}, {"filename": "/external/SDL/src/video/x11/SDL_x11keyboard.c", "start": 356382236, "end": 356419579}, {"filename": "/external/SDL/src/video/x11/SDL_x11keyboard.h", "start": 356419579, "end": 356421527}, {"filename": "/external/SDL/src/video/x11/SDL_x11messagebox.c", "start": 356421527, "end": 356434896}, {"filename": "/external/SDL/src/video/x11/SDL_x11messagebox.h", "start": 356434896, "end": 356436108}, {"filename": "/external/SDL/src/video/x11/SDL_x11modes.c", "start": 356436108, "end": 356483938}, {"filename": "/external/SDL/src/video/x11/SDL_x11modes.h", "start": 356483938, "end": 356486625}, {"filename": "/external/SDL/src/video/x11/SDL_x11mouse.c", "start": 356486625, "end": 356508590}, {"filename": "/external/SDL/src/video/x11/SDL_x11mouse.h", "start": 356508590, "end": 356509820}, {"filename": "/external/SDL/src/video/x11/SDL_x11opengl.c", "start": 356509820, "end": 356553812}, {"filename": "/external/SDL/src/video/x11/SDL_x11opengl.h", "start": 356553812, "end": 356557860}, {"filename": "/external/SDL/src/video/x11/SDL_x11opengles.c", "start": 356557860, "end": 356563724}, {"filename": "/external/SDL/src/video/x11/SDL_x11opengles.h", "start": 356563724, "end": 356566178}, {"filename": "/external/SDL/src/video/x11/SDL_x11pen.c", "start": 356566178, "end": 356583409}, {"filename": "/external/SDL/src/video/x11/SDL_x11pen.h", "start": 356583409, "end": 356586300}, {"filename": "/external/SDL/src/video/x11/SDL_x11settings.c", "start": 356586300, "end": 356589797}, {"filename": "/external/SDL/src/video/x11/SDL_x11settings.h", "start": 356589797, "end": 356591572}, {"filename": "/external/SDL/src/video/x11/SDL_x11shape.c", "start": 356591572, "end": 356595365}, {"filename": "/external/SDL/src/video/x11/SDL_x11shape.h", "start": 356595365, "end": 356596534}, {"filename": "/external/SDL/src/video/x11/SDL_x11sym.h", "start": 356596534, "end": 356619594}, {"filename": "/external/SDL/src/video/x11/SDL_x11toolkit.c", "start": 356619594, "end": 356724748}, {"filename": "/external/SDL/src/video/x11/SDL_x11toolkit.h", "start": 356724748, "end": 356733190}, {"filename": "/external/SDL/src/video/x11/SDL_x11touch.c", "start": 356733190, "end": 356734637}, {"filename": "/external/SDL/src/video/x11/SDL_x11touch.h", "start": 356734637, "end": 356735863}, {"filename": "/external/SDL/src/video/x11/SDL_x11video.c", "start": 356735863, "end": 356753402}, {"filename": "/external/SDL/src/video/x11/SDL_x11video.h", "start": 356753402, "end": 356759490}, {"filename": "/external/SDL/src/video/x11/SDL_x11vulkan.c", "start": 356759490, "end": 356771945}, {"filename": "/external/SDL/src/video/x11/SDL_x11vulkan.h", "start": 356771945, "end": 356774315}, {"filename": "/external/SDL/src/video/x11/SDL_x11window.c", "start": 356774315, "end": 356868730}, {"filename": "/external/SDL/src/video/x11/SDL_x11window.h", "start": 356868730, "end": 356876065}, {"filename": "/external/SDL/src/video/x11/SDL_x11xfixes.c", "start": 356876065, "end": 356884574}, {"filename": "/external/SDL/src/video/x11/SDL_x11xfixes.h", "start": 356884574, "end": 356886200}, {"filename": "/external/SDL/src/video/x11/SDL_x11xinput2.c", "start": 356886200, "end": 356930519}, {"filename": "/external/SDL/src/video/x11/SDL_x11xinput2.h", "start": 356930519, "end": 356932699}, {"filename": "/external/SDL/src/video/x11/SDL_x11xsync.c", "start": 356932699, "end": 356937242}, {"filename": "/external/SDL/src/video/x11/SDL_x11xsync.h", "start": 356937242, "end": 356938805}, {"filename": "/external/SDL/src/video/x11/SDL_x11xtest.c", "start": 356938805, "end": 356941303}, {"filename": "/external/SDL/src/video/x11/SDL_x11xtest.h", "start": 356941303, "end": 356942564}, {"filename": "/external/SDL/src/video/x11/edid-parse.c", "start": 356942564, "end": 356964590}, {"filename": "/external/SDL/src/video/x11/edid.h", "start": 356964590, "end": 356969613}, {"filename": "/external/SDL/src/video/x11/xsettings-client.c", "start": 356969613, "end": 356991829}, {"filename": "/external/SDL/src/video/x11/xsettings-client.h", "start": 356991829, "end": 356997840}, {"filename": "/external/SDL/src/video/yuv2rgb/LICENSE", "start": 356997840, "end": 356999347}, {"filename": "/external/SDL/src/video/yuv2rgb/README.md", "start": 356999347, "end": 357002254}, {"filename": "/external/SDL/src/video/yuv2rgb/yuv_rgb.h", "start": 357002254, "end": 357003621}, {"filename": "/external/SDL/src/video/yuv2rgb/yuv_rgb_common.h", "start": 357003621, "end": 357003936}, {"filename": "/external/SDL/src/video/yuv2rgb/yuv_rgb_internal.h", "start": 357003936, "end": 357007844}, {"filename": "/external/SDL/src/video/yuv2rgb/yuv_rgb_lsx.c", "start": 357007844, "end": 357009090}, {"filename": "/external/SDL/src/video/yuv2rgb/yuv_rgb_lsx.h", "start": 357009090, "end": 357010294}, {"filename": "/external/SDL/src/video/yuv2rgb/yuv_rgb_lsx_func.h", "start": 357010294, "end": 357029078}, {"filename": "/external/SDL/src/video/yuv2rgb/yuv_rgb_sse.c", "start": 357029078, "end": 357045795}, {"filename": "/external/SDL/src/video/yuv2rgb/yuv_rgb_sse.h", "start": 357045795, "end": 357055507}, {"filename": "/external/SDL/src/video/yuv2rgb/yuv_rgb_sse_func.h", "start": 357055507, "end": 357076099}, {"filename": "/external/SDL/src/video/yuv2rgb/yuv_rgb_std.c", "start": 357076099, "end": 357085656}, {"filename": "/external/SDL/src/video/yuv2rgb/yuv_rgb_std.h", "start": 357085656, "end": 357093215}, {"filename": "/external/SDL/src/video/yuv2rgb/yuv_rgb_std_func.h", "start": 357093215, "end": 357101516}, {"filename": "/external/SDL/test/CMakeLists.txt", "start": 357101516, "end": 357149061}, {"filename": "/external/SDL/test/COPYING", "start": 357149061, "end": 357149279}, {"filename": "/external/SDL/test/LICENSE.txt", "start": 357149279, "end": 357150733}, {"filename": "/external/SDL/test/android/cmake/AndroidManifest.xml.cmake", "start": 357150733, "end": 357153715}, {"filename": "/external/SDL/test/android/cmake/AndroidManifest.xr.xml.cmake", "start": 357153715, "end": 357157763}, {"filename": "/external/SDL/test/android/cmake/SDLEntryTestActivity.java.cmake", "start": 357157763, "end": 357161706}, {"filename": "/external/SDL/test/android/cmake/SDLTestActivity.java.cmake", "start": 357161706, "end": 357162640}, {"filename": "/external/SDL/test/android/cmake/res/values/strings.xml.cmake", "start": 357162640, "end": 357162859}, {"filename": "/external/SDL/test/android/cmake/res/xml/shortcuts.xml.cmake", "start": 357162859, "end": 357163993}, {"filename": "/external/SDL/test/android/res/drawable/sdl-test_foreground.xml", "start": 357163993, "end": 357209115}, {"filename": "/external/SDL/test/android/res/layout/arguments_layout.xml", "start": 357209115, "end": 357210162}, {"filename": "/external/SDL/test/android/res/mipmap-anydpi-v26/sdl-test.xml", "start": 357210162, "end": 357210427}, {"filename": "/external/SDL/test/android/res/mipmap-anydpi-v26/sdl-test_round.xml", "start": 357210427, "end": 357210692}, {"filename": "/external/SDL/test/android/res/mipmap-hdpi/sdl-test.png", "start": 357210692, "end": 357213733}, {"filename": "/external/SDL/test/android/res/mipmap-hdpi/sdl-test_round.png", "start": 357213733, "end": 357219025}, {"filename": "/external/SDL/test/android/res/mipmap-mdpi/sdl-test.png", "start": 357219025, "end": 357220906}, {"filename": "/external/SDL/test/android/res/mipmap-mdpi/sdl-test_round.png", "start": 357220906, "end": 357224056}, {"filename": "/external/SDL/test/android/res/mipmap-xhdpi/sdl-test.png", "start": 357224056, "end": 357228482}, {"filename": "/external/SDL/test/android/res/mipmap-xhdpi/sdl-test_round.png", "start": 357228482, "end": 357236271}, {"filename": "/external/SDL/test/android/res/mipmap-xxhdpi/sdl-test.png", "start": 357236271, "end": 357243660}, {"filename": "/external/SDL/test/android/res/mipmap-xxhdpi/sdl-test_round.png", "start": 357243660, "end": 357256892}, {"filename": "/external/SDL/test/android/res/mipmap-xxxhdpi/sdl-test.png", "start": 357256892, "end": 357268110}, {"filename": "/external/SDL/test/android/res/mipmap-xxxhdpi/sdl-test_round.png", "start": 357268110, "end": 357287736}, {"filename": "/external/SDL/test/android/res/values/arg_strings.xml", "start": 357287736, "end": 357288157}, {"filename": "/external/SDL/test/android/res/values/sdl-test_background.xml", "start": 357288157, "end": 357288277}, {"filename": "/external/SDL/test/android/res/values/styles.xml", "start": 357288277, "end": 357288515}, {"filename": "/external/SDL/test/audiofile.png", "start": 357288515, "end": 357307280}, {"filename": "/external/SDL/test/build-shaders.sh", "start": 357307280, "end": 357307949}, {"filename": "/external/SDL/test/checkkeys.c", "start": 357307949, "end": 357325135}, {"filename": "/external/SDL/test/childprocess.c", "start": 357325135, "end": 357331254}, {"filename": "/external/SDL/test/emscripten/driver.py", "start": 357331254, "end": 357337878}, {"filename": "/external/SDL/test/emscripten/joystick-pre.js", "start": 357337878, "end": 357338652}, {"filename": "/external/SDL/test/emscripten/pre.js", "start": 357338652, "end": 357339917}, {"filename": "/external/SDL/test/emscripten/server.py", "start": 357339917, "end": 357343342}, {"filename": "/external/SDL/test/gamepad_axis.h", "start": 357343342, "end": 357345759}, {"filename": "/external/SDL/test/gamepad_axis.png", "start": 357345759, "end": 357346132}, {"filename": "/external/SDL/test/gamepad_axis_arrow.h", "start": 357346132, "end": 357347067}, {"filename": "/external/SDL/test/gamepad_axis_arrow.png", "start": 357347067, "end": 357347201}, {"filename": "/external/SDL/test/gamepad_back.h", "start": 357347201, "end": 357422487}, {"filename": "/external/SDL/test/gamepad_back.png", "start": 357422487, "end": 357434519}, {"filename": "/external/SDL/test/gamepad_battery.h", "start": 357434519, "end": 357435859}, {"filename": "/external/SDL/test/gamepad_battery.png", "start": 357435859, "end": 357436059}, {"filename": "/external/SDL/test/gamepad_battery_unknown.h", "start": 357436059, "end": 357449329}, {"filename": "/external/SDL/test/gamepad_battery_unknown.png", "start": 357449329, "end": 357449659}, {"filename": "/external/SDL/test/gamepad_battery_wired.h", "start": 357449659, "end": 357452280}, {"filename": "/external/SDL/test/gamepad_battery_wired.png", "start": 357452280, "end": 357452683}, {"filename": "/external/SDL/test/gamepad_button.h", "start": 357452683, "end": 357471635}, {"filename": "/external/SDL/test/gamepad_button.png", "start": 357471635, "end": 357474653}, {"filename": "/external/SDL/test/gamepad_button_background.h", "start": 357474653, "end": 357478482}, {"filename": "/external/SDL/test/gamepad_button_background.png", "start": 357478482, "end": 357479077}, {"filename": "/external/SDL/test/gamepad_button_small.h", "start": 357479077, "end": 357480472}, {"filename": "/external/SDL/test/gamepad_button_small.png", "start": 357480472, "end": 357480679}, {"filename": "/external/SDL/test/gamepad_dual_touchpad.h", "start": 357480679, "end": 357484800}, {"filename": "/external/SDL/test/gamepad_dual_touchpad.png", "start": 357484800, "end": 357485443}, {"filename": "/external/SDL/test/gamepad_face_abxy.h", "start": 357485443, "end": 357498926}, {"filename": "/external/SDL/test/gamepad_face_abxy.png", "start": 357498926, "end": 357501068}, {"filename": "/external/SDL/test/gamepad_face_axby.h", "start": 357501068, "end": 357513870}, {"filename": "/external/SDL/test/gamepad_face_axby.png", "start": 357513870, "end": 357515903}, {"filename": "/external/SDL/test/gamepad_face_bayx.h", "start": 357515903, "end": 357529074}, {"filename": "/external/SDL/test/gamepad_face_bayx.png", "start": 357529074, "end": 357531166}, {"filename": "/external/SDL/test/gamepad_face_sony.h", "start": 357531166, "end": 357544004}, {"filename": "/external/SDL/test/gamepad_face_sony.png", "start": 357544004, "end": 357546043}, {"filename": "/external/SDL/test/gamepad_front.h", "start": 357546043, "end": 357706531}, {"filename": "/external/SDL/test/gamepad_front.png", "start": 357706531, "end": 357732195}, {"filename": "/external/SDL/test/gamepad_grip_sense.h", "start": 357732195, "end": 357737522}, {"filename": "/external/SDL/test/gamepad_grip_sense.png", "start": 357737522, "end": 357738359}, {"filename": "/external/SDL/test/gamepad_touchpad.h", "start": 357738359, "end": 357742113}, {"filename": "/external/SDL/test/gamepad_touchpad.png", "start": 357742113, "end": 357742699}, {"filename": "/external/SDL/test/gamepad_wired.h", "start": 357742699, "end": 357744848}, {"filename": "/external/SDL/test/gamepad_wired.png", "start": 357744848, "end": 357745178}, {"filename": "/external/SDL/test/gamepad_wireless.h", "start": 357745178, "end": 357747282}, {"filename": "/external/SDL/test/gamepad_wireless.png", "start": 357747282, "end": 357747604}, {"filename": "/external/SDL/test/gamepadutils.c", "start": 357747604, "end": 357881226}, {"filename": "/external/SDL/test/gamepadutils.h", "start": 357881226, "end": 357891992}, {"filename": "/external/SDL/test/glass.h", "start": 357891992, "end": 358329820}, {"filename": "/external/SDL/test/glass.png", "start": 358329820, "end": 358399861}, {"filename": "/external/SDL/test/icon.h", "start": 358399861, "end": 358401179}, {"filename": "/external/SDL/test/icon.png", "start": 358401179, "end": 358401379}, {"filename": "/external/SDL/test/icon2x.png", "start": 358401379, "end": 358401592}, {"filename": "/external/SDL/test/logaudiodev.png", "start": 358401592, "end": 358419541}, {"filename": "/external/SDL/test/loopwave.c", "start": 358419541, "end": 358423832}, {"filename": "/external/SDL/test/main.cpp", "start": 358423832, "end": 358424182}, {"filename": "/external/SDL/test/moose.dat", "start": 358424182, "end": 358480502}, {"filename": "/external/SDL/test/msdf_font.csv", "start": 358480502, "end": 358492043}, {"filename": "/external/SDL/test/msdf_font.png", "start": 358492043, "end": 358544947}, {"filename": "/external/SDL/test/n3ds/logo48x48.png", "start": 358544947, "end": 358548016}, {"filename": "/external/SDL/test/physaudiodev.png", "start": 358548016, "end": 358561121}, {"filename": "/external/SDL/test/picture.xbm", "start": 358561121, "end": 358562019}, {"filename": "/external/SDL/test/pretest.c", "start": 358562019, "end": 358563139}, {"filename": "/external/SDL/test/relative_mode.markdown", "start": 358563139, "end": 358564445}, {"filename": "/external/SDL/test/sample.png", "start": 358564445, "end": 358589189}, {"filename": "/external/SDL/test/sample.wav", "start": 358589189, "end": 358711135}, {"filename": "/external/SDL/test/sdl-test_round.png", "start": 358711135, "end": 358733216}, {"filename": "/external/SDL/test/soundboard.png", "start": 358733216, "end": 358744491}, {"filename": "/external/SDL/test/soundboard_levels.png", "start": 358744491, "end": 358745496}, {"filename": "/external/SDL/test/speaker.png", "start": 358745496, "end": 358755343}, {"filename": "/external/SDL/test/sword.wav", "start": 358755343, "end": 358846701}, {"filename": "/external/SDL/test/template.test.in", "start": 358846701, "end": 358846777}, {"filename": "/external/SDL/test/testasyncio.c", "start": 358846777, "end": 358852525}, {"filename": "/external/SDL/test/testatomic.c", "start": 358852525, "end": 358875288}, {"filename": "/external/SDL/test/testaudio.c", "start": 358875288, "end": 358920600}, {"filename": "/external/SDL/test/testaudiohotplug.c", "start": 358920600, "end": 358927082}, {"filename": "/external/SDL/test/testaudioinfo.c", "start": 358927082, "end": 358931558}, {"filename": "/external/SDL/test/testaudiorecording.c", "start": 358931558, "end": 358939800}, {"filename": "/external/SDL/test/testaudiostreamdynamicresample.c", "start": 358939800, "end": 358953116}, {"filename": "/external/SDL/test/testautomation.c", "start": 358953116, "end": 358957229}, {"filename": "/external/SDL/test/testautomation_audio.c", "start": 358957229, "end": 359015895}, {"filename": "/external/SDL/test/testautomation_blit.c", "start": 359015895, "end": 359024107}, {"filename": "/external/SDL/test/testautomation_clipboard.c", "start": 359024107, "end": 359046773}, {"filename": "/external/SDL/test/testautomation_events.c", "start": 359046773, "end": 359059455}, {"filename": "/external/SDL/test/testautomation_guid.c", "start": 359059455, "end": 359063001}, {"filename": "/external/SDL/test/testautomation_hints.c", "start": 359063001, "end": 359075006}, {"filename": "/external/SDL/test/testautomation_images.c", "start": 359075006, "end": 359349813}, {"filename": "/external/SDL/test/testautomation_images.h", "start": 359349813, "end": 359351082}, {"filename": "/external/SDL/test/testautomation_intrinsics.c", "start": 359351082, "end": 359374393}, {"filename": "/external/SDL/test/testautomation_iostream.c", "start": 359374393, "end": 359410504}, {"filename": "/external/SDL/test/testautomation_joystick.c", "start": 359410504, "end": 359433237}, {"filename": "/external/SDL/test/testautomation_keyboard.c", "start": 359433237, "end": 359460183}, {"filename": "/external/SDL/test/testautomation_log.c", "start": 359460183, "end": 359469603}, {"filename": "/external/SDL/test/testautomation_main.c", "start": 359469603, "end": 359476273}, {"filename": "/external/SDL/test/testautomation_math.c", "start": 359476273, "end": 359579937}, {"filename": "/external/SDL/test/testautomation_mouse.c", "start": 359579937, "end": 359603405}, {"filename": "/external/SDL/test/testautomation_pixels.c", "start": 359603405, "end": 359695972}, {"filename": "/external/SDL/test/testautomation_platform.c", "start": 359695972, "end": 359714071}, {"filename": "/external/SDL/test/testautomation_properties.c", "start": 359714071, "end": 359731825}, {"filename": "/external/SDL/test/testautomation_rect.c", "start": 359731825, "end": 359828103}, {"filename": "/external/SDL/test/testautomation_render.c", "start": 359828103, "end": 359925767}, {"filename": "/external/SDL/test/testautomation_sdltest.c", "start": 359925767, "end": 359988588}, {"filename": "/external/SDL/test/testautomation_stdlib.c", "start": 359988588, "end": 360071802}, {"filename": "/external/SDL/test/testautomation_subsystems.c", "start": 360071802, "end": 360083057}, {"filename": "/external/SDL/test/testautomation_suites.h", "start": 360083057, "end": 360084654}, {"filename": "/external/SDL/test/testautomation_surface.c", "start": 360084654, "end": 360188633}, {"filename": "/external/SDL/test/testautomation_time.c", "start": 360188633, "end": 360200421}, {"filename": "/external/SDL/test/testautomation_timer.c", "start": 360200421, "end": 360207199}, {"filename": "/external/SDL/test/testautomation_video.c", "start": 360207199, "end": 360330321}, {"filename": "/external/SDL/test/testbounds.c", "start": 360330321, "end": 360332016}, {"filename": "/external/SDL/test/testcamera.c", "start": 360332016, "end": 360345161}, {"filename": "/external/SDL/test/testclipboard.c", "start": 360345161, "end": 360353607}, {"filename": "/external/SDL/test/testcolorspace.c", "start": 360353607, "end": 360391599}, {"filename": "/external/SDL/test/testcontroller.c", "start": 360391599, "end": 360497952}, {"filename": "/external/SDL/test/testcustomcursor.c", "start": 360497952, "end": 360516294}, {"filename": "/external/SDL/test/testdescriptor.c", "start": 360516294, "end": 360518721}, {"filename": "/external/SDL/test/testdialog.c", "start": 360518721, "end": 360525088}, {"filename": "/external/SDL/test/testdisplayinfo.c", "start": 360525088, "end": 360528358}, {"filename": "/external/SDL/test/testdlopennote.c", "start": 360528358, "end": 360530412}, {"filename": "/external/SDL/test/testdraw.c", "start": 360530412, "end": 360540834}, {"filename": "/external/SDL/test/testdrawchessboard.c", "start": 360540834, "end": 360547854}, {"filename": "/external/SDL/test/testdropfile.c", "start": 360547854, "end": 360552207}, {"filename": "/external/SDL/test/testdynaudioreopen.c", "start": 360552207, "end": 360559290}, {"filename": "/external/SDL/test/testerror.c", "start": 360559290, "end": 360562455}, {"filename": "/external/SDL/test/testevdev.c", "start": 360562455, "end": 360647728}, {"filename": "/external/SDL/test/testffmpeg.c", "start": 360647728, "end": 360707700}, {"filename": "/external/SDL/test/testffmpeg_vulkan.c", "start": 360707700, "end": 360761931}, {"filename": "/external/SDL/test/testffmpeg_vulkan.h", "start": 360761931, "end": 360763218}, {"filename": "/external/SDL/test/testfile.c", "start": 360763218, "end": 360774364}, {"filename": "/external/SDL/test/testfilesystem.c", "start": 360774364, "end": 360789293}, {"filename": "/external/SDL/test/testgeometry.c", "start": 360789293, "end": 360798359}, {"filename": "/external/SDL/test/testgl.c", "start": 360798359, "end": 360812557}, {"filename": "/external/SDL/test/testgles.c", "start": 360812557, "end": 360824033}, {"filename": "/external/SDL/test/testgles2.c", "start": 360824033, "end": 360851217}, {"filename": "/external/SDL/test/testgpu/build-shaders.sh", "start": 360851217, "end": 360851912}, {"filename": "/external/SDL/test/testgpu/cube.frag.dxil.h", "start": 360851912, "end": 360869643}, {"filename": "/external/SDL/test/testgpu/cube.frag.hlsl", "start": 360869643, "end": 360869901}, {"filename": "/external/SDL/test/testgpu/cube.frag.msl.h", "start": 360869901, "end": 360872206}, {"filename": "/external/SDL/test/testgpu/cube.frag.spv.h", "start": 360872206, "end": 360874634}, {"filename": "/external/SDL/test/testgpu/cube.hlsli", "start": 360874634, "end": 360874819}, {"filename": "/external/SDL/test/testgpu/cube.vert.dxil.h", "start": 360874819, "end": 360900077}, {"filename": "/external/SDL/test/testgpu/cube.vert.hlsl", "start": 360900077, "end": 360900376}, {"filename": "/external/SDL/test/testgpu/cube.vert.msl.h", "start": 360900376, "end": 360904304}, {"filename": "/external/SDL/test/testgpu/cube.vert.spv.h", "start": 360904304, "end": 360910783}, {"filename": "/external/SDL/test/testgpu/overlay.frag.dxil.h", "start": 360910783, "end": 360933695}, {"filename": "/external/SDL/test/testgpu/overlay.frag.hlsl", "start": 360933695, "end": 360933899}, {"filename": "/external/SDL/test/testgpu/overlay.frag.msl.h", "start": 360933899, "end": 360936696}, {"filename": "/external/SDL/test/testgpu/overlay.frag.spv.h", "start": 360936696, "end": 360941482}, {"filename": "/external/SDL/test/testgpu/overlay.hlsli", "start": 360941482, "end": 360941565}, {"filename": "/external/SDL/test/testgpu/overlay.vert.dxil.h", "start": 360941565, "end": 360963004}, {"filename": "/external/SDL/test/testgpu/overlay.vert.hlsl", "start": 360963004, "end": 360963503}, {"filename": "/external/SDL/test/testgpu/overlay.vert.msl.h", "start": 360963503, "end": 360974326}, {"filename": "/external/SDL/test/testgpu/overlay.vert.spv.h", "start": 360974326, "end": 360981936}, {"filename": "/external/SDL/test/testgpu_simple_clear.c", "start": 360981936, "end": 360986343}, {"filename": "/external/SDL/test/testgpu_spinning_cube.c", "start": 360986343, "end": 361022981}, {"filename": "/external/SDL/test/testgpu_spinning_cube_xr.c", "start": 361022981, "end": 361062398}, {"filename": "/external/SDL/test/testgpurender_effects.c", "start": 361062398, "end": 361073445}, {"filename": "/external/SDL/test/testgpurender_effects_CRT.frag.dxil.h", "start": 361073445, "end": 361102744}, {"filename": "/external/SDL/test/testgpurender_effects_CRT.frag.hlsl", "start": 361102744, "end": 361104474}, {"filename": "/external/SDL/test/testgpurender_effects_CRT.frag.msl.h", "start": 361104474, "end": 361112303}, {"filename": "/external/SDL/test/testgpurender_effects_CRT.frag.spv.h", "start": 361112303, "end": 361126351}, {"filename": "/external/SDL/test/testgpurender_effects_grayscale.frag.dxil.h", "start": 361126351, "end": 361150886}, {"filename": "/external/SDL/test/testgpurender_effects_grayscale.frag.hlsl", "start": 361150886, "end": 361151408}, {"filename": "/external/SDL/test/testgpurender_effects_grayscale.frag.msl.h", "start": 361151408, "end": 361155915}, {"filename": "/external/SDL/test/testgpurender_effects_grayscale.frag.spv.h", "start": 361155915, "end": 361163150}, {"filename": "/external/SDL/test/testgpurender_msdf.c", "start": 361163150, "end": 361173342}, {"filename": "/external/SDL/test/testgpurender_msdf.frag.dxil.h", "start": 361173342, "end": 361203101}, {"filename": "/external/SDL/test/testgpurender_msdf.frag.hlsl", "start": 361203101, "end": 361204207}, {"filename": "/external/SDL/test/testgpurender_msdf.frag.msl.h", "start": 361204207, "end": 361211335}, {"filename": "/external/SDL/test/testgpurender_msdf.frag.spv.h", "start": 361211335, "end": 361223368}, {"filename": "/external/SDL/test/testhaptic.c", "start": 361223368, "end": 361238205}, {"filename": "/external/SDL/test/testhittesting.c", "start": 361238205, "end": 361243691}, {"filename": "/external/SDL/test/testhotplug.c", "start": 361243691, "end": 361250440}, {"filename": "/external/SDL/test/testiconv.c", "start": 361250440, "end": 361254219}, {"filename": "/external/SDL/test/testime.c", "start": 361254219, "end": 361297889}, {"filename": "/external/SDL/test/testintersections.c", "start": 361297889, "end": 361310002}, {"filename": "/external/SDL/test/testkeys.c", "start": 361310002, "end": 361311352}, {"filename": "/external/SDL/test/testloadso.c", "start": 361311352, "end": 361314690}, {"filename": "/external/SDL/test/testlocale.c", "start": 361314690, "end": 361317462}, {"filename": "/external/SDL/test/testlock.c", "start": 361317462, "end": 361323587}, {"filename": "/external/SDL/test/testmanymouse.c", "start": 361323587, "end": 361340811}, {"filename": "/external/SDL/test/testmessage.c", "start": 361340811, "end": 361355868}, {"filename": "/external/SDL/test/testmodal.c", "start": 361355868, "end": 361362004}, {"filename": "/external/SDL/test/testmouse.c", "start": 361362004, "end": 361372382}, {"filename": "/external/SDL/test/testmultiaudio.c", "start": 361372382, "end": 361378772}, {"filename": "/external/SDL/test/testnative.c", "start": 361378772, "end": 361386094}, {"filename": "/external/SDL/test/testnative.h", "start": 361386094, "end": 361387392}, {"filename": "/external/SDL/test/testnativecocoa.m", "start": 361387392, "end": 361388931}, {"filename": "/external/SDL/test/testnativew32.c", "start": 361388931, "end": 361391147}, {"filename": "/external/SDL/test/testnativewayland.c", "start": 361391147, "end": 361398879}, {"filename": "/external/SDL/test/testnativex11.c", "start": 361398879, "end": 361400113}, {"filename": "/external/SDL/test/testnotification.c", "start": 361400113, "end": 361406459}, {"filename": "/external/SDL/test/testoffscreen.c", "start": 361406459, "end": 361410836}, {"filename": "/external/SDL/test/testoverlay.c", "start": 361410836, "end": 361426286}, {"filename": "/external/SDL/test/testpalette.c", "start": 361426286, "end": 361445190}, {"filename": "/external/SDL/test/testpen.c", "start": 361445190, "end": 361455044}, {"filename": "/external/SDL/test/testplatform.c", "start": 361455044, "end": 361479694}, {"filename": "/external/SDL/test/testpopup.c", "start": 361479694, "end": 361489085}, {"filename": "/external/SDL/test/testpower.c", "start": 361489085, "end": 361491309}, {"filename": "/external/SDL/test/testprocess.c", "start": 361491309, "end": 361540480}, {"filename": "/external/SDL/test/testqsort.c", "start": 361540480, "end": 361568776}, {"filename": "/external/SDL/test/testrelative.c", "start": 361568776, "end": 361575137}, {"filename": "/external/SDL/test/testrendercopyex.c", "start": 361575137, "end": 361579807}, {"filename": "/external/SDL/test/testrendertarget.c", "start": 361579807, "end": 361588449}, {"filename": "/external/SDL/test/testresample.c", "start": 361588449, "end": 361593484}, {"filename": "/external/SDL/test/testrotate.c", "start": 361593484, "end": 361599120}, {"filename": "/external/SDL/test/testrumble.c", "start": 361599120, "end": 361605279}, {"filename": "/external/SDL/test/testrwlock.c", "start": 361605279, "end": 361611627}, {"filename": "/external/SDL/test/testscale.c", "start": 361611627, "end": 361616892}, {"filename": "/external/SDL/test/testsem.c", "start": 361616892, "end": 361626804}, {"filename": "/external/SDL/test/testsensor.c", "start": 361626804, "end": 361631171}, {"filename": "/external/SDL/test/testshader.c", "start": 361631171, "end": 361649168}, {"filename": "/external/SDL/test/testshape.c", "start": 361649168, "end": 361653366}, {"filename": "/external/SDL/test/testsoftwaretransparent.c", "start": 361653366, "end": 361656921}, {"filename": "/external/SDL/test/testsprite.c", "start": 361656921, "end": 361679632}, {"filename": "/external/SDL/test/testsprite.cpp", "start": 361679632, "end": 361679657}, {"filename": "/external/SDL/test/testspriteminimal.c", "start": 361679657, "end": 361684381}, {"filename": "/external/SDL/test/testspritesurface.c", "start": 361684381, "end": 361689190}, {"filename": "/external/SDL/test/testsurround.c", "start": 361689190, "end": 361697622}, {"filename": "/external/SDL/test/testsymbols.c", "start": 361697622, "end": 361702186}, {"filename": "/external/SDL/test/testthread.c", "start": 361702186, "end": 361707158}, {"filename": "/external/SDL/test/testtime.c", "start": 361707158, "end": 361714710}, {"filename": "/external/SDL/test/testtimer.c", "start": 361714710, "end": 361723965}, {"filename": "/external/SDL/test/testtray.c", "start": 361723965, "end": 361747162}, {"filename": "/external/SDL/test/testurl.c", "start": 361747162, "end": 361750896}, {"filename": "/external/SDL/test/testutils.c", "start": 361750896, "end": 361755642}, {"filename": "/external/SDL/test/testutils.h", "start": 361755642, "end": 361756456}, {"filename": "/external/SDL/test/testver.c", "start": 361756456, "end": 361758169}, {"filename": "/external/SDL/test/testviewport.c", "start": 361758169, "end": 361765388}, {"filename": "/external/SDL/test/testvulkan.c", "start": 361765388, "end": 361815380}, {"filename": "/external/SDL/test/testwaylandcustom.c", "start": 361815380, "end": 361827164}, {"filename": "/external/SDL/test/testwm.c", "start": 361827164, "end": 361837104}, {"filename": "/external/SDL/test/testyuv.c", "start": 361837104, "end": 361893134}, {"filename": "/external/SDL/test/testyuv.png", "start": 361893134, "end": 362171615}, {"filename": "/external/SDL/test/testyuv_cvt.c", "start": 362171615, "end": 362191655}, {"filename": "/external/SDL/test/testyuv_cvt.h", "start": 362191655, "end": 362193015}, {"filename": "/external/SDL/test/torturethread.c", "start": 362193015, "end": 362196354}, {"filename": "/external/SDL/test/trashcan.png", "start": 362196354, "end": 362214928}, {"filename": "/external/SDL/test/unifont-15.1.05-license.txt", "start": 362214928, "end": 362219268}, {"filename": "/external/SDL/test/unifont-15.1.05.hex", "start": 362219268, "end": 366042312}, {"filename": "/external/SDL/test/unix/gdbcmds.txt", "start": 366042312, "end": 366043178}, {"filename": "/external/SDL/test/utf8.txt", "start": 366043178, "end": 366065000}, {"filename": "/external/SDL/test/win32/sdlprocdump.c", "start": 366065000, "end": 366097054}, {"filename": "/external/SDL/wayland-protocols/alpha-modifier-v1.xml", "start": 366097054, "end": 366101857}, {"filename": "/external/SDL/wayland-protocols/color-management-v1.xml", "start": 366101857, "end": 366182008}, {"filename": "/external/SDL/wayland-protocols/cursor-shape-v1.xml", "start": 366182008, "end": 366191312}, {"filename": "/external/SDL/wayland-protocols/fractional-scale-v1.xml", "start": 366191312, "end": 366196050}, {"filename": "/external/SDL/wayland-protocols/frog-color-management-v1.xml", "start": 366196050, "end": 366212442}, {"filename": "/external/SDL/wayland-protocols/idle-inhibit-unstable-v1.xml", "start": 366212442, "end": 366216542}, {"filename": "/external/SDL/wayland-protocols/input-timestamps-unstable-v1.xml", "start": 366216542, "end": 366223816}, {"filename": "/external/SDL/wayland-protocols/keyboard-shortcuts-inhibit-unstable-v1.xml", "start": 366223816, "end": 366230604}, {"filename": "/external/SDL/wayland-protocols/pointer-constraints-unstable-v1.xml", "start": 366230604, "end": 366246362}, {"filename": "/external/SDL/wayland-protocols/pointer-gestures-unstable-v1.xml", "start": 366246362, "end": 366257960}, {"filename": "/external/SDL/wayland-protocols/pointer-warp-v1.xml", "start": 366257960, "end": 366261551}, {"filename": "/external/SDL/wayland-protocols/primary-selection-unstable-v1.xml", "start": 366261551, "end": 366272245}, {"filename": "/external/SDL/wayland-protocols/relative-pointer-unstable-v1.xml", "start": 366272245, "end": 366278965}, {"filename": "/external/SDL/wayland-protocols/single-pixel-buffer-v1.xml", "start": 366278965, "end": 366282533}, {"filename": "/external/SDL/wayland-protocols/tablet-v2.xml", "start": 366282533, "end": 366335183}, {"filename": "/external/SDL/wayland-protocols/text-input-unstable-v3.xml", "start": 366335183, "end": 366356827}, {"filename": "/external/SDL/wayland-protocols/viewporter.xml", "start": 366356827, "end": 366365554}, {"filename": "/external/SDL/wayland-protocols/wayland.xml", "start": 366365554, "end": 366537652}, {"filename": "/external/SDL/wayland-protocols/xdg-activation-v1.xml", "start": 366537652, "end": 366546182}, {"filename": "/external/SDL/wayland-protocols/xdg-decoration-unstable-v1.xml", "start": 366546182, "end": 366554598}, {"filename": "/external/SDL/wayland-protocols/xdg-dialog-v1.xml", "start": 366554598, "end": 366559540}, {"filename": "/external/SDL/wayland-protocols/xdg-foreign-unstable-v2.xml", "start": 366559540, "end": 366568946}, {"filename": "/external/SDL/wayland-protocols/xdg-output-unstable-v1.xml", "start": 366568946, "end": 366578712}, {"filename": "/external/SDL/wayland-protocols/xdg-session-management-v1.xml", "start": 366578712, "end": 366594568}, {"filename": "/external/SDL/wayland-protocols/xdg-shell.xml", "start": 366594568, "end": 366658680}, {"filename": "/external/SDL/wayland-protocols/xdg-toplevel-icon-v1.xml", "start": 366658680, "end": 366668262}, {"filename": "/external/SDL/wayland-protocols/xdg-toplevel-tag-v1.xml", "start": 366668262, "end": 366672482}, {"filename": "/external/SDL_image/.clang-format", "start": 366672482, "end": 366674600}, {"filename": "/external/SDL_image/.editorconfig", "start": 366674600, "end": 366675557}, {"filename": "/external/SDL_image/.github/PULL_REQUEST_TEMPLATE.md", "start": 366675557, "end": 366676013}, {"filename": "/external/SDL_image/.github/actions/setup-ninja/action.yml", "start": 366676013, "end": 366678562}, {"filename": "/external/SDL_image/.github/workflows/main.yml", "start": 366678562, "end": 366686756}, {"filename": "/external/SDL_image/.github/workflows/release.yml", "start": 366686756, "end": 366722534}, {"filename": "/external/SDL_image/.gitignore", "start": 366722534, "end": 366723102}, {"filename": "/external/SDL_image/.gitmodules", "start": 366723102, "end": 366724226}, {"filename": "/external/SDL_image/.wikiheaders-options", "start": 366724226, "end": 366725410}, {"filename": "/external/SDL_image/AGENTS.md", "start": 366725410, "end": 366725943}, {"filename": "/external/SDL_image/Android.mk", "start": 366725943, "end": 366731411}, {"filename": "/external/SDL_image/CHANGES.txt", "start": 366731411, "end": 366733363}, {"filename": "/external/SDL_image/CLAUDE.md", "start": 366733363, "end": 366733896}, {"filename": "/external/SDL_image/CMakeLists.txt", "start": 366733896, "end": 366794500}, {"filename": "/external/SDL_image/INSTALL.md", "start": 366794500, "end": 366796041}, {"filename": "/external/SDL_image/LICENSE.txt", "start": 366796041, "end": 366796936}, {"filename": "/external/SDL_image/README.md", "start": 366796936, "end": 366797600}, {"filename": "/external/SDL_image/VisualC/SDL_image.sln", "start": 366797600, "end": 366800592}, {"filename": "/external/SDL_image/VisualC/SDL_image.vcxproj", "start": 366800592, "end": 366836835}, {"filename": "/external/SDL_image/VisualC/SDL_image.vcxproj.filters", "start": 366836835, "end": 366843653}, {"filename": "/external/SDL_image/VisualC/clean.sh", "start": 366843653, "end": 366843800}, {"filename": "/external/SDL_image/VisualC/external/include/avif/avif.h", "start": 366843800, "end": 366928831}, {"filename": "/external/SDL_image/VisualC/external/include/png.h", "start": 366928831, "end": 367080886}, {"filename": "/external/SDL_image/VisualC/external/include/pngconf.h", "start": 367080886, "end": 367104174}, {"filename": "/external/SDL_image/VisualC/external/include/pnglibconf.h", "start": 367104174, "end": 367112488}, {"filename": "/external/SDL_image/VisualC/external/include/tiff.h", "start": 367112488, "end": 367173336}, {"filename": "/external/SDL_image/VisualC/external/include/tiffconf.h", "start": 367173336, "end": 367177542}, {"filename": "/external/SDL_image/VisualC/external/include/tiffio.h", "start": 367177542, "end": 367207719}, {"filename": "/external/SDL_image/VisualC/external/include/tiffvers.h", "start": 367207719, "end": 367209170}, {"filename": "/external/SDL_image/VisualC/external/include/webp/decode.h", "start": 367209170, "end": 367233455}, {"filename": "/external/SDL_image/VisualC/external/include/webp/demux.h", "start": 367233455, "end": 367249421}, {"filename": "/external/SDL_image/VisualC/external/include/webp/encode.h", "start": 367249421, "end": 367277983}, {"filename": "/external/SDL_image/VisualC/external/include/webp/mux.h", "start": 367277983, "end": 367301346}, {"filename": "/external/SDL_image/VisualC/external/include/webp/mux_types.h", "start": 367301346, "end": 367304637}, {"filename": "/external/SDL_image/VisualC/external/include/webp/types.h", "start": 367304637, "end": 367306881}, {"filename": "/external/SDL_image/VisualC/external/optional/x64/LICENSE.aom.txt", "start": 367306881, "end": 367308224}, {"filename": "/external/SDL_image/VisualC/external/optional/x64/LICENSE.avif.txt", "start": 367308224, "end": 367327376}, {"filename": "/external/SDL_image/VisualC/external/optional/x64/LICENSE.dav1d.txt", "start": 367327376, "end": 367328716}, {"filename": "/external/SDL_image/VisualC/external/optional/x64/LICENSE.libpng.txt", "start": 367328716, "end": 367334195}, {"filename": "/external/SDL_image/VisualC/external/optional/x64/LICENSE.tiff.txt", "start": 367334195, "end": 367335362}, {"filename": "/external/SDL_image/VisualC/external/optional/x64/LICENSE.webp.txt", "start": 367335362, "end": 367336888}, {"filename": "/external/SDL_image/VisualC/external/optional/x64/libavif-16.dll", "start": 367336888, "end": 375030712}, {"filename": "/external/SDL_image/VisualC/external/optional/x64/libpng16-16.dll", "start": 375030712, "end": 375280056}, {"filename": "/external/SDL_image/VisualC/external/optional/x64/libtiff-6.dll", "start": 375280056, "end": 375698872}, {"filename": "/external/SDL_image/VisualC/external/optional/x64/libwebp-7.dll", "start": 375698872, "end": 376155576}, {"filename": "/external/SDL_image/VisualC/external/optional/x64/libwebpdemux-2.dll", "start": 376155576, "end": 376179640}, {"filename": "/external/SDL_image/VisualC/external/optional/x64/libwebpmux-3.dll", "start": 376179640, "end": 376224184}, {"filename": "/external/SDL_image/VisualC/external/optional/x86/LICENSE.aom.txt", "start": 376224184, "end": 376225527}, {"filename": "/external/SDL_image/VisualC/external/optional/x86/LICENSE.avif.txt", "start": 376225527, "end": 376244679}, {"filename": "/external/SDL_image/VisualC/external/optional/x86/LICENSE.dav1d.txt", "start": 376244679, "end": 376246019}, {"filename": "/external/SDL_image/VisualC/external/optional/x86/LICENSE.libpng.txt", "start": 376246019, "end": 376251498}, {"filename": "/external/SDL_image/VisualC/external/optional/x86/LICENSE.tiff.txt", "start": 376251498, "end": 376252665}, {"filename": "/external/SDL_image/VisualC/external/optional/x86/LICENSE.webp.txt", "start": 376252665, "end": 376254191}, {"filename": "/external/SDL_image/VisualC/external/optional/x86/libavif-16.dll", "start": 376254191, "end": 383103727}, {"filename": "/external/SDL_image/VisualC/external/optional/x86/libpng16-16.dll", "start": 383103727, "end": 383335151}, {"filename": "/external/SDL_image/VisualC/external/optional/x86/libtiff-6.dll", "start": 383335151, "end": 383754479}, {"filename": "/external/SDL_image/VisualC/external/optional/x86/libwebp-7.dll", "start": 383754479, "end": 384172271}, {"filename": "/external/SDL_image/VisualC/external/optional/x86/libwebpdemux-2.dll", "start": 384172271, "end": 384191727}, {"filename": "/external/SDL_image/VisualC/external/optional/x86/libwebpmux-3.dll", "start": 384191727, "end": 384230639}, {"filename": "/external/SDL_image/VisualC/showanim/showanim.vcxproj", "start": 384230639, "end": 384243090}, {"filename": "/external/SDL_image/VisualC/showanim/showanim.vcxproj.filters", "start": 384243090, "end": 384243321}, {"filename": "/external/SDL_image/VisualC/showimage/showimage.vcxproj", "start": 384243321, "end": 384255777}, {"filename": "/external/SDL_image/VisualC/showimage/showimage.vcxproj.filters", "start": 384255777, "end": 384256007}, {"filename": "/external/SDL_image/Xcode/Info-Framework.plist", "start": 384256007, "end": 384256700}, {"filename": "/external/SDL_image/Xcode/SDL_image.xcodeproj/project.pbxproj", "start": 384256700, "end": 384309437}, {"filename": "/external/SDL_image/Xcode/avif/aom/arm64/config/aom_config.h", "start": 384309437, "end": 384312291}, {"filename": "/external/SDL_image/Xcode/avif/aom/arm64/config/aom_dsp_rtcd.h", "start": 384312291, "end": 384752374}, {"filename": "/external/SDL_image/Xcode/avif/aom/arm64/config/aom_scale_rtcd.h", "start": 384752374, "end": 384757452}, {"filename": "/external/SDL_image/Xcode/avif/aom/arm64/config/aom_version.h", "start": 384757452, "end": 384758260}, {"filename": "/external/SDL_image/Xcode/avif/aom/arm64/config/av1_rtcd.h", "start": 384758260, "end": 384817186}, {"filename": "/external/SDL_image/Xcode/avif/aom/config.xcconfig", "start": 384817186, "end": 384818584}, {"filename": "/external/SDL_image/Xcode/avif/aom/x86_64/config/aom_config.asm", "start": 384818584, "end": 384821028}, {"filename": "/external/SDL_image/Xcode/avif/aom/x86_64/config/aom_config.h", "start": 384821028, "end": 384823882}, {"filename": "/external/SDL_image/Xcode/avif/aom/x86_64/config/aom_dsp_rtcd.h", "start": 384823882, "end": 385470316}, {"filename": "/external/SDL_image/Xcode/avif/aom/x86_64/config/aom_scale_rtcd.h", "start": 385470316, "end": 385475357}, {"filename": "/external/SDL_image/Xcode/avif/aom/x86_64/config/aom_version.h", "start": 385475357, "end": 385476165}, {"filename": "/external/SDL_image/Xcode/avif/aom/x86_64/config/av1_rtcd.h", "start": 385476165, "end": 385541880}, {"filename": "/external/SDL_image/Xcode/avif/avif.xcodeproj/project.pbxproj", "start": 385541880, "end": 385791451}, {"filename": "/external/SDL_image/Xcode/avif/dav1d/arm64/config.h", "start": 385791451, "end": 385791993}, {"filename": "/external/SDL_image/Xcode/avif/dav1d/armv7/config.h", "start": 385791993, "end": 385792535}, {"filename": "/external/SDL_image/Xcode/avif/dav1d/vcs_version.h", "start": 385792535, "end": 385792612}, {"filename": "/external/SDL_image/Xcode/avif/dav1d/version.h", "start": 385792612, "end": 385794212}, {"filename": "/external/SDL_image/Xcode/avif/dav1d/x86_64/config.h", "start": 385794212, "end": 385794741}, {"filename": "/external/SDL_image/Xcode/config.xcconfig", "start": 385794741, "end": 385796591}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL.h", "start": 385796591, "end": 385799667}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_assert.h", "start": 385799667, "end": 385828308}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_asyncio.h", "start": 385828308, "end": 385852164}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_atomic.h", "start": 385852164, "end": 385878213}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_audio.h", "start": 385878213, "end": 385977933}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_begin_code.h", "start": 385977933, "end": 385996596}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_bits.h", "start": 385996596, "end": 386001138}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_blendmode.h", "start": 386001138, "end": 386010682}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_camera.h", "start": 386010682, "end": 386032327}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_clipboard.h", "start": 386032327, "end": 386045093}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_close_code.h", "start": 386045093, "end": 386046701}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_copying.h", "start": 386046701, "end": 386047707}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_cpuinfo.h", "start": 386047707, "end": 386059440}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_dialog.h", "start": 386059440, "end": 386074321}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_dlopennote.h", "start": 386074321, "end": 386083341}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_egl.h", "start": 386083341, "end": 386194637}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_endian.h", "start": 386194637, "end": 386215435}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_error.h", "start": 386215435, "end": 386222756}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_events.h", "start": 386222756, "end": 386296105}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_filesystem.h", "start": 386296105, "end": 386319391}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_gamepad.h", "start": 386319391, "end": 386380521}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_gpu.h", "start": 386380521, "end": 386564925}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_guid.h", "start": 386564925, "end": 386568461}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_haptic.h", "start": 386568461, "end": 386614998}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_hidapi.h", "start": 386614998, "end": 386637612}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_hints.h", "start": 386637612, "end": 386805657}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_init.h", "start": 386805657, "end": 386826668}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_intrin.h", "start": 386826668, "end": 386840899}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_iostream.h", "start": 386840899, "end": 386895826}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_joystick.h", "start": 386895826, "end": 386948807}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_keyboard.h", "start": 386948807, "end": 386970907}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_keycode.h", "start": 386970907, "end": 386997951}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_loadso.h", "start": 386997951, "end": 387003278}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_locale.h", "start": 387003278, "end": 387007865}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_log.h", "start": 387007865, "end": 387025318}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_main.h", "start": 387025318, "end": 387052597}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_main_impl.h", "start": 387052597, "end": 387058594}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_messagebox.h", "start": 387058594, "end": 387066846}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_metal.h", "start": 387066846, "end": 387070079}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_misc.h", "start": 387070079, "end": 387073000}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_mouse.h", "start": 387073000, "end": 387105532}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_mutex.h", "start": 387105532, "end": 387141813}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_oldnames.h", "start": 387141813, "end": 387222642}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_opengl.h", "start": 387222642, "end": 387352426}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_opengl_glext.h", "start": 387352426, "end": 388229709}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_opengles.h", "start": 388229709, "end": 388230991}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_opengles2.h", "start": 388230991, "end": 388232657}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_opengles2_gl2.h", "start": 388232657, "end": 388276251}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_opengles2_gl2ext.h", "start": 388276251, "end": 388521505}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_opengles2_gl2platform.h", "start": 388521505, "end": 388522178}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_opengles2_khrplatform.h", "start": 388522178, "end": 388533620}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_pen.h", "start": 388533620, "end": 388542115}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_pixels.h", "start": 388542115, "end": 388603268}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_platform.h", "start": 388603268, "end": 388605225}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_platform_defines.h", "start": 388605225, "end": 388617891}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_power.h", "start": 388617891, "end": 388622172}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_process.h", "start": 388622172, "end": 388641103}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_properties.h", "start": 388641103, "end": 388661974}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_rect.h", "start": 388661974, "end": 388680930}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_render.h", "start": 388680930, "end": 388811786}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_revision.h", "start": 388811786, "end": 388813937}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_scancode.h", "start": 388813937, "end": 388831612}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_sensor.h", "start": 388831612, "end": 388842431}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_stdinc.h", "start": 388842431, "end": 389053716}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_storage.h", "start": 389053716, "end": 389080369}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_surface.h", "start": 389080369, "end": 389153131}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_system.h", "start": 389153131, "end": 389183276}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_thread.h", "start": 389183276, "end": 389206728}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_time.h", "start": 389206728, "end": 389215084}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_timer.h", "start": 389215084, "end": 389230221}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_touch.h", "start": 389230221, "end": 389236758}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_tray.h", "start": 389236758, "end": 389254773}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_version.h", "start": 389254773, "end": 389260291}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_video.h", "start": 389260291, "end": 389405947}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Headers/SDL_vulkan.h", "start": 389405947, "end": 389418131}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/Info.plist", "start": 389418131, "end": 389418951}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/LICENSE.txt", "start": 389418951, "end": 389419853}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/README.md", "start": 389419853, "end": 389420356}, {"filename": "/external/SDL_image/Xcode/iOS/SDL3.framework/SDL3.tbd", "start": 389420356, "end": 389469765}, {"filename": "/external/SDL_image/Xcode/jxl/jxl.xcodeproj/project.pbxproj", "start": 389469765, "end": 389575629}, {"filename": "/external/SDL_image/Xcode/jxl/jxl/jxl_export.h", "start": 389575629, "end": 389576621}, {"filename": "/external/SDL_image/Xcode/jxl/jxl/version.h", "start": 389576621, "end": 389577770}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Headers", "start": 389577770, "end": 389577794}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Resources", "start": 389577794, "end": 389577820}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/SDL3.tbd", "start": 389577820, "end": 389577845}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL.h", "start": 389577845, "end": 389580921}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_assert.h", "start": 389580921, "end": 389609562}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_asyncio.h", "start": 389609562, "end": 389633418}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_atomic.h", "start": 389633418, "end": 389659467}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_audio.h", "start": 389659467, "end": 389759187}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_begin_code.h", "start": 389759187, "end": 389777850}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_bits.h", "start": 389777850, "end": 389782392}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_blendmode.h", "start": 389782392, "end": 389791936}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_camera.h", "start": 389791936, "end": 389813581}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_clipboard.h", "start": 389813581, "end": 389826347}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_close_code.h", "start": 389826347, "end": 389827955}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_copying.h", "start": 389827955, "end": 389828961}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_cpuinfo.h", "start": 389828961, "end": 389840694}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_dialog.h", "start": 389840694, "end": 389855575}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_dlopennote.h", "start": 389855575, "end": 389864595}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_egl.h", "start": 389864595, "end": 389975891}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_endian.h", "start": 389975891, "end": 389996689}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_error.h", "start": 389996689, "end": 390004010}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_events.h", "start": 390004010, "end": 390077359}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_filesystem.h", "start": 390077359, "end": 390100645}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_gamepad.h", "start": 390100645, "end": 390161775}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_gpu.h", "start": 390161775, "end": 390346179}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_guid.h", "start": 390346179, "end": 390349715}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_haptic.h", "start": 390349715, "end": 390396252}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_hidapi.h", "start": 390396252, "end": 390418866}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_hints.h", "start": 390418866, "end": 390586911}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_init.h", "start": 390586911, "end": 390607922}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_intrin.h", "start": 390607922, "end": 390622153}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_iostream.h", "start": 390622153, "end": 390677080}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_joystick.h", "start": 390677080, "end": 390730061}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_keyboard.h", "start": 390730061, "end": 390752161}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_keycode.h", "start": 390752161, "end": 390779205}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_loadso.h", "start": 390779205, "end": 390784532}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_locale.h", "start": 390784532, "end": 390789119}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_log.h", "start": 390789119, "end": 390806572}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_main.h", "start": 390806572, "end": 390833851}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_main_impl.h", "start": 390833851, "end": 390839848}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_messagebox.h", "start": 390839848, "end": 390848100}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_metal.h", "start": 390848100, "end": 390851333}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_misc.h", "start": 390851333, "end": 390854254}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_mouse.h", "start": 390854254, "end": 390886786}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_mutex.h", "start": 390886786, "end": 390923067}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_oldnames.h", "start": 390923067, "end": 391003896}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_opengl.h", "start": 391003896, "end": 391133680}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_opengl_glext.h", "start": 391133680, "end": 392010963}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_opengles.h", "start": 392010963, "end": 392012245}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_opengles2.h", "start": 392012245, "end": 392013911}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_opengles2_gl2.h", "start": 392013911, "end": 392057505}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_opengles2_gl2ext.h", "start": 392057505, "end": 392302759}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_opengles2_gl2platform.h", "start": 392302759, "end": 392303432}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_opengles2_khrplatform.h", "start": 392303432, "end": 392314874}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_pen.h", "start": 392314874, "end": 392323369}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_pixels.h", "start": 392323369, "end": 392384522}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_platform.h", "start": 392384522, "end": 392386479}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_platform_defines.h", "start": 392386479, "end": 392399145}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_power.h", "start": 392399145, "end": 392403426}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_process.h", "start": 392403426, "end": 392422357}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_properties.h", "start": 392422357, "end": 392443228}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_rect.h", "start": 392443228, "end": 392462184}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_render.h", "start": 392462184, "end": 392593040}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_revision.h", "start": 392593040, "end": 392595191}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_scancode.h", "start": 392595191, "end": 392612866}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_sensor.h", "start": 392612866, "end": 392623685}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_stdinc.h", "start": 392623685, "end": 392834970}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_storage.h", "start": 392834970, "end": 392861623}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_surface.h", "start": 392861623, "end": 392934385}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_system.h", "start": 392934385, "end": 392964530}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_thread.h", "start": 392964530, "end": 392987982}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_time.h", "start": 392987982, "end": 392996338}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_timer.h", "start": 392996338, "end": 393011475}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_touch.h", "start": 393011475, "end": 393018012}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_tray.h", "start": 393018012, "end": 393036027}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_version.h", "start": 393036027, "end": 393041545}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_video.h", "start": 393041545, "end": 393187201}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_vulkan.h", "start": 393187201, "end": 393199385}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Resources/Info.plist", "start": 393199385, "end": 393200205}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Resources/LICENSE.txt", "start": 393200205, "end": 393201107}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/Resources/README.md", "start": 393201107, "end": 393201610}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/A/SDL3.tbd", "start": 393201610, "end": 393250472}, {"filename": "/external/SDL_image/Xcode/macOS/SDL3.framework/Versions/Current", "start": 393250472, "end": 393250473}, {"filename": "/external/SDL_image/Xcode/pkg-support/build.xcconfig", "start": 393250473, "end": 393251774}, {"filename": "/external/SDL_image/Xcode/pkg-support/resources/CMake/SDL3_imageConfig.cmake", "start": 393251774, "end": 393255561}, {"filename": "/external/SDL_image/Xcode/pkg-support/resources/CMake/SDL3_imageConfigVersion.cmake", "start": 393255561, "end": 393258512}, {"filename": "/external/SDL_image/Xcode/pkg-support/resources/INSTALL.md", "start": 393258512, "end": 393259608}, {"filename": "/external/SDL_image/Xcode/pkg-support/resources/SDL_DS_Store", "start": 393259608, "end": 393269852}, {"filename": "/external/SDL_image/Xcode/pkg-support/resources/framework/INSTALL.md", "start": 393269852, "end": 393270597}, {"filename": "/external/SDL_image/Xcode/pkg-support/resources/share/cmake/SDL3_image/SDL3_imageConfig.cmake", "start": 393270597, "end": 393277267}, {"filename": "/external/SDL_image/Xcode/pkg-support/resources/share/cmake/SDL3_image/SDL3_imageConfigVersion.cmake", "start": 393277267, "end": 393281221}, {"filename": "/external/SDL_image/Xcode/pkg-support/sdl_logo.pdf", "start": 393281221, "end": 393445021}, {"filename": "/external/SDL_image/Xcode/png/libpng/pnglibconf.h", "start": 393445021, "end": 393453344}, {"filename": "/external/SDL_image/Xcode/png/png.xcodeproj/project.pbxproj", "start": 393453344, "end": 393479951}, {"filename": "/external/SDL_image/Xcode/showanim/config.xcconfig", "start": 393479951, "end": 393480177}, {"filename": "/external/SDL_image/Xcode/showanim/macOS/macOS.entitlements", "start": 393480177, "end": 393480509}, {"filename": "/external/SDL_image/Xcode/showanim/showanim.xcodeproj/project.pbxproj", "start": 393480509, "end": 393515414}, {"filename": "/external/SDL_image/Xcode/showimage/config.xcconfig", "start": 393515414, "end": 393515640}, {"filename": "/external/SDL_image/Xcode/showimage/macOS/macOS.entitlements", "start": 393515640, "end": 393515972}, {"filename": "/external/SDL_image/Xcode/showimage/showimage.xcodeproj/project.pbxproj", "start": 393515972, "end": 393547747}, {"filename": "/external/SDL_image/Xcode/webp/webp.xcodeproj/project.pbxproj", "start": 393547747, "end": 393628321}, {"filename": "/external/SDL_image/build-scripts/build-release.py", "start": 393628321, "end": 393713954}, {"filename": "/external/SDL_image/build-scripts/check_elf_alignment.sh", "start": 393713954, "end": 393717492}, {"filename": "/external/SDL_image/build-scripts/cmake-toolchain-mingw64-i686.cmake", "start": 393717492, "end": 393718049}, {"filename": "/external/SDL_image/build-scripts/cmake-toolchain-mingw64-x86_64.cmake", "start": 393718049, "end": 393718615}, {"filename": "/external/SDL_image/build-scripts/create-release.py", "start": 393718615, "end": 393720149}, {"filename": "/external/SDL_image/build-scripts/pkg-support/android/INSTALL.md.in", "start": 393720149, "end": 393722319}, {"filename": "/external/SDL_image/build-scripts/pkg-support/android/aar/__main__.py.in", "start": 393722319, "end": 393726857}, {"filename": "/external/SDL_image/build-scripts/pkg-support/android/aar/cmake/SDL3_imageConfig.cmake", "start": 393726857, "end": 393731194}, {"filename": "/external/SDL_image/build-scripts/pkg-support/android/aar/cmake/SDL3_imageConfigVersion.cmake.in", "start": 393731194, "end": 393732721}, {"filename": "/external/SDL_image/build-scripts/pkg-support/android/aar/description.json.in", "start": 393732721, "end": 393732843}, {"filename": "/external/SDL_image/build-scripts/pkg-support/mingw/INSTALL.md.in", "start": 393732843, "end": 393734214}, {"filename": "/external/SDL_image/build-scripts/pkg-support/mingw/Makefile", "start": 393734214, "end": 393735315}, {"filename": "/external/SDL_image/build-scripts/pkg-support/mingw/cmake/SDL3_imageConfig.cmake", "start": 393735315, "end": 393736114}, {"filename": "/external/SDL_image/build-scripts/pkg-support/mingw/cmake/SDL3_imageConfigVersion.cmake", "start": 393736114, "end": 393736953}, {"filename": "/external/SDL_image/build-scripts/pkg-support/msvc/INSTALL.md.in", "start": 393736953, "end": 393738210}, {"filename": "/external/SDL_image/build-scripts/pkg-support/msvc/arm64/INSTALL.md.in", "start": 393738210, "end": 393738926}, {"filename": "/external/SDL_image/build-scripts/pkg-support/msvc/cmake/SDL3_imageConfig.cmake.in", "start": 393738926, "end": 393742866}, {"filename": "/external/SDL_image/build-scripts/pkg-support/msvc/cmake/SDL3_imageConfigVersion.cmake.in", "start": 393742866, "end": 393744390}, {"filename": "/external/SDL_image/build-scripts/pkg-support/msvc/x64/INSTALL.md.in", "start": 393744390, "end": 393745100}, {"filename": "/external/SDL_image/build-scripts/pkg-support/msvc/x86/INSTALL.md.in", "start": 393745100, "end": 393745810}, {"filename": "/external/SDL_image/build-scripts/release-info.json", "start": 393745810, "end": 393757086}, {"filename": "/external/SDL_image/build-scripts/test-versioning.sh", "start": 393757086, "end": 393761772}, {"filename": "/external/SDL_image/build-scripts/wikiheaders.pl", "start": 393761772, "end": 393920094}, {"filename": "/external/SDL_image/cmake/CPackProjectConfig.cmake.in", "start": 393920094, "end": 393921501}, {"filename": "/external/SDL_image/cmake/Findlibjxl.cmake", "start": 393921501, "end": 393922924}, {"filename": "/external/SDL_image/cmake/Findwebp.cmake", "start": 393922924, "end": 393927145}, {"filename": "/external/SDL_image/cmake/GetGitRevisionDescription.cmake", "start": 393927145, "end": 393937526}, {"filename": "/external/SDL_image/cmake/GetGitRevisionDescription.cmake.in", "start": 393937526, "end": 393939133}, {"filename": "/external/SDL_image/cmake/PkgConfigHelper.cmake", "start": 393939133, "end": 393940420}, {"filename": "/external/SDL_image/cmake/PrivateSdlFunctions.cmake", "start": 393940420, "end": 393957905}, {"filename": "/external/SDL_image/cmake/SDL3_imageConfig.cmake.in", "start": 393957905, "end": 393964080}, {"filename": "/external/SDL_image/cmake/cmake_uninstall.cmake.in", "start": 393964080, "end": 393964773}, {"filename": "/external/SDL_image/cmake/sdl3-image.pc.in", "start": 393964773, "end": 393965173}, {"filename": "/external/SDL_image/cmake/sdlcpu.cmake", "start": 393965173, "end": 393970903}, {"filename": "/external/SDL_image/cmake/sdlmanpages.cmake", "start": 393970903, "end": 393973426}, {"filename": "/external/SDL_image/cmake/sdlplatform.cmake", "start": 393973426, "end": 393977195}, {"filename": "/external/SDL_image/cmake/test/CMakeLists.txt", "start": 393977195, "end": 393978730}, {"filename": "/external/SDL_image/cmake/test/main.c", "start": 393978730, "end": 393979027}, {"filename": "/external/SDL_image/docs/INTRO-androidstudio.md", "start": 393979027, "end": 393979398}, {"filename": "/external/SDL_image/docs/INTRO-cmake.md", "start": 393979398, "end": 393981138}, {"filename": "/external/SDL_image/docs/INTRO-emscripten.md", "start": 393981138, "end": 393982755}, {"filename": "/external/SDL_image/docs/INTRO-visualstudio.md", "start": 393982755, "end": 393984526}, {"filename": "/external/SDL_image/docs/INTRO-xcode.md", "start": 393984526, "end": 393986093}, {"filename": "/external/SDL_image/docs/README-migration.md", "start": 393986093, "end": 393986641}, {"filename": "/external/SDL_image/docs/README-versions.md", "start": 393986641, "end": 393989180}, {"filename": "/external/SDL_image/docs/hello.c", "start": 393989180, "end": 393995492}, {"filename": "/external/SDL_image/docs/release_checklist.md", "start": 393995492, "end": 393998727}, {"filename": "/external/SDL_image/examples/showanim.c", "start": 393998727, "end": 394006329}, {"filename": "/external/SDL_image/examples/showclipboard.c", "start": 394006329, "end": 394011189}, {"filename": "/external/SDL_image/examples/showgpuimage.c", "start": 394011189, "end": 394016843}, {"filename": "/external/SDL_image/examples/showimage.c", "start": 394016843, "end": 394029873}, {"filename": "/external/SDL_image/external/Get-GitModules.ps1", "start": 394029873, "end": 394031410}, {"filename": "/external/SDL_image/external/download.sh", "start": 394031410, "end": 394031826}, {"filename": "/external/SDL_image/include/SDL3_image/SDL_image.h", "start": 394031826, "end": 394151419}, {"filename": "/external/SDL_image/src/IMG.c", "start": 394151419, "end": 394170860}, {"filename": "/external/SDL_image/src/IMG.h", "start": 394170860, "end": 394171956}, {"filename": "/external/SDL_image/src/IMG_ImageIO.h", "start": 394171956, "end": 394173017}, {"filename": "/external/SDL_image/src/IMG_ImageIO.m", "start": 394173017, "end": 394193046}, {"filename": "/external/SDL_image/src/IMG_WIC.c", "start": 394193046, "end": 394200319}, {"filename": "/external/SDL_image/src/IMG_WIC.h", "start": 394200319, "end": 394201403}, {"filename": "/external/SDL_image/src/IMG_ani.c", "start": 394201403, "end": 394223452}, {"filename": "/external/SDL_image/src/IMG_ani.h", "start": 394223452, "end": 394224650}, {"filename": "/external/SDL_image/src/IMG_anim_decoder.c", "start": 394224650, "end": 394238882}, {"filename": "/external/SDL_image/src/IMG_anim_decoder.h", "start": 394238882, "end": 394240831}, {"filename": "/external/SDL_image/src/IMG_anim_encoder.c", "start": 394240831, "end": 394250292}, {"filename": "/external/SDL_image/src/IMG_anim_encoder.h", "start": 394250292, "end": 394252087}, {"filename": "/external/SDL_image/src/IMG_avif.c", "start": 394252087, "end": 394310201}, {"filename": "/external/SDL_image/src/IMG_avif.h", "start": 394310201, "end": 394311399}, {"filename": "/external/SDL_image/src/IMG_bmp.c", "start": 394311399, "end": 394339013}, {"filename": "/external/SDL_image/src/IMG_gif.c", "start": 394339013, "end": 394434241}, {"filename": "/external/SDL_image/src/IMG_gif.h", "start": 394434241, "end": 394435437}, {"filename": "/external/SDL_image/src/IMG_gpu.c", "start": 394435437, "end": 394440726}, {"filename": "/external/SDL_image/src/IMG_jpg.c", "start": 394440726, "end": 394468069}, {"filename": "/external/SDL_image/src/IMG_jxl.c", "start": 394468069, "end": 394477410}, {"filename": "/external/SDL_image/src/IMG_lbm.c", "start": 394477410, "end": 394495000}, {"filename": "/external/SDL_image/src/IMG_libpng.c", "start": 394495000, "end": 394587371}, {"filename": "/external/SDL_image/src/IMG_libpng.h", "start": 394587371, "end": 394588751}, {"filename": "/external/SDL_image/src/IMG_pcx.c", "start": 394588751, "end": 394598727}, {"filename": "/external/SDL_image/src/IMG_png.c", "start": 394598727, "end": 394602410}, {"filename": "/external/SDL_image/src/IMG_pnm.c", "start": 394602410, "end": 394610264}, {"filename": "/external/SDL_image/src/IMG_qoi.c", "start": 394610264, "end": 394613805}, {"filename": "/external/SDL_image/src/IMG_stb.c", "start": 394613805, "end": 394622186}, {"filename": "/external/SDL_image/src/IMG_svg.c", "start": 394622186, "end": 394627472}, {"filename": "/external/SDL_image/src/IMG_tga.c", "start": 394627472, "end": 394643979}, {"filename": "/external/SDL_image/src/IMG_tif.c", "start": 394643979, "end": 394651785}, {"filename": "/external/SDL_image/src/IMG_utils.h", "start": 394651785, "end": 394652867}, {"filename": "/external/SDL_image/src/IMG_webp.c", "start": 394652867, "end": 394694453}, {"filename": "/external/SDL_image/src/IMG_webp.h", "start": 394694453, "end": 394695653}, {"filename": "/external/SDL_image/src/IMG_xcf.c", "start": 394695653, "end": 394727947}, {"filename": "/external/SDL_image/src/IMG_xpm.c", "start": 394727947, "end": 394777548}, {"filename": "/external/SDL_image/src/IMG_xv.c", "start": 394777548, "end": 394781920}, {"filename": "/external/SDL_image/src/IMG_xxx.c", "start": 394781920, "end": 394784122}, {"filename": "/external/SDL_image/src/SDL_image.exports", "start": 394784122, "end": 394786217}, {"filename": "/external/SDL_image/src/SDL_image.sym", "start": 394786217, "end": 394788744}, {"filename": "/external/SDL_image/src/genexports.py", "start": 394788744, "end": 394810772}, {"filename": "/external/SDL_image/src/nanosvg.h", "start": 394810772, "end": 394901681}, {"filename": "/external/SDL_image/src/nanosvgrast.h", "start": 394901681, "end": 394941956}, {"filename": "/external/SDL_image/src/qoi.h", "start": 394941956, "end": 394961906}, {"filename": "/external/SDL_image/src/stb_image.h", "start": 394961906, "end": 395259647}, {"filename": "/external/SDL_image/src/tiny_jpeg.h", "start": 395259647, "end": 395302762}, {"filename": "/external/SDL_image/src/version.rc", "start": 395302762, "end": 395303739}, {"filename": "/external/SDL_image/src/xmlman.c", "start": 395303739, "end": 395323414}, {"filename": "/external/SDL_image/src/xmlman.h", "start": 395323414, "end": 395325350}, {"filename": "/external/SDL_image/test/.gitignore", "start": 395325350, "end": 395325430}, {"filename": "/external/SDL_image/test/CMakeLists.txt", "start": 395325430, "end": 395330869}, {"filename": "/external/SDL_image/test/README.md", "start": 395330869, "end": 395334097}, {"filename": "/external/SDL_image/test/grey1.bmp", "start": 395334097, "end": 395335179}, {"filename": "/external/SDL_image/test/grey1.png", "start": 395335179, "end": 395335246}, {"filename": "/external/SDL_image/test/grey2.bmp", "start": 395335246, "end": 395336328}, {"filename": "/external/SDL_image/test/grey2.png", "start": 395336328, "end": 395336395}, {"filename": "/external/SDL_image/test/grey4.bmp", "start": 395336395, "end": 395337489}, {"filename": "/external/SDL_image/test/grey4.png", "start": 395337489, "end": 395337563}, {"filename": "/external/SDL_image/test/grey8.bmp", "start": 395337563, "end": 395338897}, {"filename": "/external/SDL_image/test/grey8.png", "start": 395338897, "end": 395339222}, {"filename": "/external/SDL_image/test/palette.bmp", "start": 395339222, "end": 395340464}, {"filename": "/external/SDL_image/test/palette.gif", "start": 395340464, "end": 395341032}, {"filename": "/external/SDL_image/test/rgbrgb.ani", "start": 395341032, "end": 395346436}, {"filename": "/external/SDL_image/test/rgbrgb.avifs", "start": 395346436, "end": 395348922}, {"filename": "/external/SDL_image/test/rgbrgb.gif", "start": 395348922, "end": 395351417}, {"filename": "/external/SDL_image/test/rgbrgb.png", "start": 395351417, "end": 395353806}, {"filename": "/external/SDL_image/test/rgbrgb.webp", "start": 395353806, "end": 395354186}, {"filename": "/external/SDL_image/test/rgbrgb_thirdpartymetadata.webp", "start": 395354186, "end": 395357584}, {"filename": "/external/SDL_image/test/sample.avif", "start": 395357584, "end": 395357906}, {"filename": "/external/SDL_image/test/sample.bmp", "start": 395357906, "end": 395361068}, {"filename": "/external/SDL_image/test/sample.cur", "start": 395361068, "end": 395364322}, {"filename": "/external/SDL_image/test/sample.ico", "start": 395364322, "end": 395367576}, {"filename": "/external/SDL_image/test/sample.jpg", "start": 395367576, "end": 395368154}, {"filename": "/external/SDL_image/test/sample.jxl", "start": 395368154, "end": 395368317}, {"filename": "/external/SDL_image/test/sample.pcx", "start": 395368317, "end": 395371595}, {"filename": "/external/SDL_image/test/sample.png", "start": 395371595, "end": 395372445}, {"filename": "/external/SDL_image/test/sample.pnm", "start": 395372445, "end": 395375402}, {"filename": "/external/SDL_image/test/sample.qoi", "start": 395375402, "end": 395376882}, {"filename": "/external/SDL_image/test/sample.tga", "start": 395376882, "end": 395379865}, {"filename": "/external/SDL_image/test/sample.tif", "start": 395379865, "end": 395383008}, {"filename": "/external/SDL_image/test/sample.webp", "start": 395383008, "end": 395383676}, {"filename": "/external/SDL_image/test/sample.xcf", "start": 395383676, "end": 395387187}, {"filename": "/external/SDL_image/test/sample.xpm", "start": 395387187, "end": 395397906}, {"filename": "/external/SDL_image/test/svg-class.bmp", "start": 395397906, "end": 395424924}, {"filename": "/external/SDL_image/test/svg-class.svg", "start": 395424924, "end": 395426478}, {"filename": "/external/SDL_image/test/svg.bmp", "start": 395426478, "end": 395430696}, {"filename": "/external/SDL_image/test/svg.svg", "start": 395430696, "end": 395431260}, {"filename": "/external/SDL_image/test/svg64.bmp", "start": 395431260, "end": 395447766}, {"filename": "/external/SDL_image/test/template.test.in", "start": 395447766, "end": 395447823}, {"filename": "/external/SDL_image/test/testanimation.c", "start": 395447823, "end": 395495842}, {"filename": "/external/SDL_image/test/testimage.c", "start": 395495842, "end": 395524754}, {"filename": "/external/SDL_mixer/.clang-format", "start": 395524754, "end": 395526872}, {"filename": "/external/SDL_mixer/.editorconfig", "start": 395526872, "end": 395527829}, {"filename": "/external/SDL_mixer/.github/PULL_REQUEST_TEMPLATE.md", "start": 395527829, "end": 395528065}, {"filename": "/external/SDL_mixer/.github/actions/setup-ninja/action.yml", "start": 395528065, "end": 395530614}, {"filename": "/external/SDL_mixer/.github/workflows/main.yml", "start": 395530614, "end": 395536389}, {"filename": "/external/SDL_mixer/.github/workflows/release.yml", "start": 395536389, "end": 395573260}, {"filename": "/external/SDL_mixer/.gitignore", "start": 395573260, "end": 395573548}, {"filename": "/external/SDL_mixer/.gitmodules", "start": 395573548, "end": 395574954}, {"filename": "/external/SDL_mixer/.wikiheaders-options", "start": 395574954, "end": 395576209}, {"filename": "/external/SDL_mixer/AGENTS.md", "start": 395576209, "end": 395576742}, {"filename": "/external/SDL_mixer/Android.mk", "start": 395576742, "end": 395583866}, {"filename": "/external/SDL_mixer/CHANGES.txt", "start": 395583866, "end": 395583909}, {"filename": "/external/SDL_mixer/CLAUDE.md", "start": 395583909, "end": 395584442}, {"filename": "/external/SDL_mixer/CMakeLists.txt", "start": 395584442, "end": 395641528}, {"filename": "/external/SDL_mixer/INSTALL.md", "start": 395641528, "end": 395643184}, {"filename": "/external/SDL_mixer/LICENSE.txt", "start": 395643184, "end": 395644079}, {"filename": "/external/SDL_mixer/README.md", "start": 395644079, "end": 395645186}, {"filename": "/external/SDL_mixer/VisualC/SDL_mixer.sln", "start": 395645186, "end": 395648088}, {"filename": "/external/SDL_mixer/VisualC/SDL_mixer.vcxproj", "start": 395648088, "end": 395689063}, {"filename": "/external/SDL_mixer/VisualC/SDL_mixer.vcxproj.filters", "start": 395689063, "end": 395694737}, {"filename": "/external/SDL_mixer/VisualC/clean.sh", "start": 395694737, "end": 395694884}, {"filename": "/external/SDL_mixer/VisualC/external/include/gme/gme.h", "start": 395694884, "end": 395707512}, {"filename": "/external/SDL_mixer/VisualC/external/include/ogg/config_types.h", "start": 395707512, "end": 395708076}, {"filename": "/external/SDL_mixer/VisualC/external/include/ogg/ogg.h", "start": 395708076, "end": 395716658}, {"filename": "/external/SDL_mixer/VisualC/external/include/ogg/os_types.h", "start": 395716658, "end": 395721702}, {"filename": "/external/SDL_mixer/VisualC/external/include/opus/opus.h", "start": 395721702, "end": 395771146}, {"filename": "/external/SDL_mixer/VisualC/external/include/opus/opus_defines.h", "start": 395771146, "end": 395807321}, {"filename": "/external/SDL_mixer/VisualC/external/include/opus/opus_multistream.h", "start": 395807321, "end": 395841525}, {"filename": "/external/SDL_mixer/VisualC/external/include/opus/opus_projection.h", "start": 395841525, "end": 395870333}, {"filename": "/external/SDL_mixer/VisualC/external/include/opus/opus_types.h", "start": 395870333, "end": 395875656}, {"filename": "/external/SDL_mixer/VisualC/external/include/opus/opusfile.h", "start": 395875656, "end": 395993218}, {"filename": "/external/SDL_mixer/VisualC/external/include/opusfile.h", "start": 395993218, "end": 395993366}, {"filename": "/external/SDL_mixer/VisualC/external/include/wavpack/wavpack.h", "start": 395993366, "end": 396014810}, {"filename": "/external/SDL_mixer/VisualC/external/include/xmp.h", "start": 396014810, "end": 396031264}, {"filename": "/external/SDL_mixer/VisualC/external/optional/x64/LICENSE.gme.txt", "start": 396031264, "end": 396058204}, {"filename": "/external/SDL_mixer/VisualC/external/optional/x64/LICENSE.ogg-vorbis.txt", "start": 396058204, "end": 396059702}, {"filename": "/external/SDL_mixer/VisualC/external/optional/x64/LICENSE.opus.txt", "start": 396059702, "end": 396061674}, {"filename": "/external/SDL_mixer/VisualC/external/optional/x64/LICENSE.opusfile.txt", "start": 396061674, "end": 396063189}, {"filename": "/external/SDL_mixer/VisualC/external/optional/x64/LICENSE.wavpack.txt", "start": 396063189, "end": 396064775}, {"filename": "/external/SDL_mixer/VisualC/external/optional/x64/LICENSE.xmp.txt", "start": 396064775, "end": 396065907}, {"filename": "/external/SDL_mixer/VisualC/external/optional/x64/libgme.dll", "start": 396065907, "end": 396556915}, {"filename": "/external/SDL_mixer/VisualC/external/optional/x64/libogg-0.dll", "start": 396556915, "end": 396589683}, {"filename": "/external/SDL_mixer/VisualC/external/optional/x64/libopus-0.dll", "start": 396589683, "end": 396957299}, {"filename": "/external/SDL_mixer/VisualC/external/optional/x64/libopusfile-0.dll", "start": 396957299, "end": 397005939}, {"filename": "/external/SDL_mixer/VisualC/external/optional/x64/libwavpack-1.dll", "start": 397005939, "end": 397184627}, {"filename": "/external/SDL_mixer/VisualC/external/optional/x64/libxmp.dll", "start": 397184627, "end": 397604979}, {"filename": "/external/SDL_mixer/VisualC/external/optional/x86/LICENSE.gme.txt", "start": 397604979, "end": 397631919}, {"filename": "/external/SDL_mixer/VisualC/external/optional/x86/LICENSE.ogg-vorbis.txt", "start": 397631919, "end": 397633417}, {"filename": "/external/SDL_mixer/VisualC/external/optional/x86/LICENSE.opus.txt", "start": 397633417, "end": 397635389}, {"filename": "/external/SDL_mixer/VisualC/external/optional/x86/LICENSE.opusfile.txt", "start": 397635389, "end": 397636904}, {"filename": "/external/SDL_mixer/VisualC/external/optional/x86/LICENSE.wavpack.txt", "start": 397636904, "end": 397638490}, {"filename": "/external/SDL_mixer/VisualC/external/optional/x86/LICENSE.xmp.txt", "start": 397638490, "end": 397639622}, {"filename": "/external/SDL_mixer/VisualC/external/optional/x86/libgme.dll", "start": 397639622, "end": 398101958}, {"filename": "/external/SDL_mixer/VisualC/external/optional/x86/libogg-0.dll", "start": 398101958, "end": 398131654}, {"filename": "/external/SDL_mixer/VisualC/external/optional/x86/libopus-0.dll", "start": 398131654, "end": 398478790}, {"filename": "/external/SDL_mixer/VisualC/external/optional/x86/libopusfile-0.dll", "start": 398478790, "end": 398529990}, {"filename": "/external/SDL_mixer/VisualC/external/optional/x86/libwavpack-1.dll", "start": 398529990, "end": 398702534}, {"filename": "/external/SDL_mixer/VisualC/external/optional/x86/libxmp.dll", "start": 398702534, "end": 399111622}, {"filename": "/external/SDL_mixer/VisualC/timidity/timidity.vcxproj", "start": 399111622, "end": 399123386}, {"filename": "/external/SDL_mixer/Xcode/FLAC/FLAC.xcodeproj/project.pbxproj", "start": 399123386, "end": 399159171}, {"filename": "/external/SDL_mixer/Xcode/FLAC/config.h", "start": 399159171, "end": 399166583}, {"filename": "/external/SDL_mixer/Xcode/Info-Framework.plist", "start": 399166583, "end": 399167283}, {"filename": "/external/SDL_mixer/Xcode/SDL_mixer.xcodeproj/project.pbxproj", "start": 399167283, "end": 399210556}, {"filename": "/external/SDL_mixer/Xcode/config.xcconfig", "start": 399210556, "end": 399212345}, {"filename": "/external/SDL_mixer/Xcode/gme/gme.xcodeproj/project.pbxproj", "start": 399212345, "end": 399256073}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL.h", "start": 399256073, "end": 399259149}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_assert.h", "start": 399259149, "end": 399287790}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_asyncio.h", "start": 399287790, "end": 399311646}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_atomic.h", "start": 399311646, "end": 399337695}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_audio.h", "start": 399337695, "end": 399437415}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_begin_code.h", "start": 399437415, "end": 399456078}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_bits.h", "start": 399456078, "end": 399460620}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_blendmode.h", "start": 399460620, "end": 399470164}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_camera.h", "start": 399470164, "end": 399491809}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_clipboard.h", "start": 399491809, "end": 399504575}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_close_code.h", "start": 399504575, "end": 399506183}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_copying.h", "start": 399506183, "end": 399507189}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_cpuinfo.h", "start": 399507189, "end": 399518922}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_dialog.h", "start": 399518922, "end": 399533803}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_dlopennote.h", "start": 399533803, "end": 399542823}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_egl.h", "start": 399542823, "end": 399654119}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_endian.h", "start": 399654119, "end": 399674917}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_error.h", "start": 399674917, "end": 399682238}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_events.h", "start": 399682238, "end": 399755587}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_filesystem.h", "start": 399755587, "end": 399778873}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_gamepad.h", "start": 399778873, "end": 399840003}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_gpu.h", "start": 399840003, "end": 400024407}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_guid.h", "start": 400024407, "end": 400027943}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_haptic.h", "start": 400027943, "end": 400074480}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_hidapi.h", "start": 400074480, "end": 400097094}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_hints.h", "start": 400097094, "end": 400265139}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_init.h", "start": 400265139, "end": 400286150}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_intrin.h", "start": 400286150, "end": 400300381}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_iostream.h", "start": 400300381, "end": 400355308}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_joystick.h", "start": 400355308, "end": 400408289}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_keyboard.h", "start": 400408289, "end": 400430389}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_keycode.h", "start": 400430389, "end": 400457433}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_loadso.h", "start": 400457433, "end": 400462760}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_locale.h", "start": 400462760, "end": 400467347}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_log.h", "start": 400467347, "end": 400484800}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_main.h", "start": 400484800, "end": 400512079}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_main_impl.h", "start": 400512079, "end": 400518076}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_messagebox.h", "start": 400518076, "end": 400526328}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_metal.h", "start": 400526328, "end": 400529561}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_misc.h", "start": 400529561, "end": 400532482}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_mouse.h", "start": 400532482, "end": 400565014}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_mutex.h", "start": 400565014, "end": 400601295}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_oldnames.h", "start": 400601295, "end": 400682124}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_opengl.h", "start": 400682124, "end": 400811908}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_opengl_glext.h", "start": 400811908, "end": 401689191}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_opengles.h", "start": 401689191, "end": 401690473}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_opengles2.h", "start": 401690473, "end": 401692139}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_opengles2_gl2.h", "start": 401692139, "end": 401735733}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_opengles2_gl2ext.h", "start": 401735733, "end": 401980987}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_opengles2_gl2platform.h", "start": 401980987, "end": 401981660}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_opengles2_khrplatform.h", "start": 401981660, "end": 401993102}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_pen.h", "start": 401993102, "end": 402001597}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_pixels.h", "start": 402001597, "end": 402062750}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_platform.h", "start": 402062750, "end": 402064707}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_platform_defines.h", "start": 402064707, "end": 402077373}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_power.h", "start": 402077373, "end": 402081654}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_process.h", "start": 402081654, "end": 402100585}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_properties.h", "start": 402100585, "end": 402121456}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_rect.h", "start": 402121456, "end": 402140412}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_render.h", "start": 402140412, "end": 402271268}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_revision.h", "start": 402271268, "end": 402273419}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_scancode.h", "start": 402273419, "end": 402291094}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_sensor.h", "start": 402291094, "end": 402301913}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_stdinc.h", "start": 402301913, "end": 402513198}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_storage.h", "start": 402513198, "end": 402539851}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_surface.h", "start": 402539851, "end": 402612613}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_system.h", "start": 402612613, "end": 402642758}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_thread.h", "start": 402642758, "end": 402666210}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_time.h", "start": 402666210, "end": 402674566}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_timer.h", "start": 402674566, "end": 402689703}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_touch.h", "start": 402689703, "end": 402696240}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_tray.h", "start": 402696240, "end": 402714255}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_version.h", "start": 402714255, "end": 402719773}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_video.h", "start": 402719773, "end": 402865429}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Headers/SDL_vulkan.h", "start": 402865429, "end": 402877613}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/Info.plist", "start": 402877613, "end": 402878433}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/LICENSE.txt", "start": 402878433, "end": 402879335}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/README.md", "start": 402879335, "end": 402879838}, {"filename": "/external/SDL_mixer/Xcode/iOS/SDL3.framework/SDL3.tbd", "start": 402879838, "end": 402929247}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Headers", "start": 402929247, "end": 402929271}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Resources", "start": 402929271, "end": 402929297}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/SDL3.tbd", "start": 402929297, "end": 402929322}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL.h", "start": 402929322, "end": 402932398}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_assert.h", "start": 402932398, "end": 402961039}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_asyncio.h", "start": 402961039, "end": 402984895}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_atomic.h", "start": 402984895, "end": 403010944}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_audio.h", "start": 403010944, "end": 403110664}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_begin_code.h", "start": 403110664, "end": 403129327}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_bits.h", "start": 403129327, "end": 403133869}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_blendmode.h", "start": 403133869, "end": 403143413}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_camera.h", "start": 403143413, "end": 403165058}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_clipboard.h", "start": 403165058, "end": 403177824}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_close_code.h", "start": 403177824, "end": 403179432}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_copying.h", "start": 403179432, "end": 403180438}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_cpuinfo.h", "start": 403180438, "end": 403192171}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_dialog.h", "start": 403192171, "end": 403207052}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_dlopennote.h", "start": 403207052, "end": 403216072}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_egl.h", "start": 403216072, "end": 403327368}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_endian.h", "start": 403327368, "end": 403348166}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_error.h", "start": 403348166, "end": 403355487}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_events.h", "start": 403355487, "end": 403428836}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_filesystem.h", "start": 403428836, "end": 403452122}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_gamepad.h", "start": 403452122, "end": 403513252}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_gpu.h", "start": 403513252, "end": 403697656}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_guid.h", "start": 403697656, "end": 403701192}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_haptic.h", "start": 403701192, "end": 403747729}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_hidapi.h", "start": 403747729, "end": 403770343}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_hints.h", "start": 403770343, "end": 403938388}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_init.h", "start": 403938388, "end": 403959399}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_intrin.h", "start": 403959399, "end": 403973630}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_iostream.h", "start": 403973630, "end": 404028557}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_joystick.h", "start": 404028557, "end": 404081538}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_keyboard.h", "start": 404081538, "end": 404103638}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_keycode.h", "start": 404103638, "end": 404130682}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_loadso.h", "start": 404130682, "end": 404136009}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_locale.h", "start": 404136009, "end": 404140596}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_log.h", "start": 404140596, "end": 404158049}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_main.h", "start": 404158049, "end": 404185328}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_main_impl.h", "start": 404185328, "end": 404191325}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_messagebox.h", "start": 404191325, "end": 404199577}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_metal.h", "start": 404199577, "end": 404202810}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_misc.h", "start": 404202810, "end": 404205731}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_mouse.h", "start": 404205731, "end": 404238263}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_mutex.h", "start": 404238263, "end": 404274544}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_oldnames.h", "start": 404274544, "end": 404355373}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_opengl.h", "start": 404355373, "end": 404485157}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_opengl_glext.h", "start": 404485157, "end": 405362440}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_opengles.h", "start": 405362440, "end": 405363722}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_opengles2.h", "start": 405363722, "end": 405365388}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_opengles2_gl2.h", "start": 405365388, "end": 405408982}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_opengles2_gl2ext.h", "start": 405408982, "end": 405654236}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_opengles2_gl2platform.h", "start": 405654236, "end": 405654909}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_opengles2_khrplatform.h", "start": 405654909, "end": 405666351}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_pen.h", "start": 405666351, "end": 405674846}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_pixels.h", "start": 405674846, "end": 405735999}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_platform.h", "start": 405735999, "end": 405737956}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_platform_defines.h", "start": 405737956, "end": 405750622}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_power.h", "start": 405750622, "end": 405754903}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_process.h", "start": 405754903, "end": 405773834}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_properties.h", "start": 405773834, "end": 405794705}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_rect.h", "start": 405794705, "end": 405813661}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_render.h", "start": 405813661, "end": 405944517}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_revision.h", "start": 405944517, "end": 405946668}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_scancode.h", "start": 405946668, "end": 405964343}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_sensor.h", "start": 405964343, "end": 405975162}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_stdinc.h", "start": 405975162, "end": 406186447}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_storage.h", "start": 406186447, "end": 406213100}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_surface.h", "start": 406213100, "end": 406285862}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_system.h", "start": 406285862, "end": 406316007}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_thread.h", "start": 406316007, "end": 406339459}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_time.h", "start": 406339459, "end": 406347815}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_timer.h", "start": 406347815, "end": 406362952}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_touch.h", "start": 406362952, "end": 406369489}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_tray.h", "start": 406369489, "end": 406387504}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_version.h", "start": 406387504, "end": 406393022}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_video.h", "start": 406393022, "end": 406538678}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_vulkan.h", "start": 406538678, "end": 406550862}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Resources/Info.plist", "start": 406550862, "end": 406551682}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Resources/LICENSE.txt", "start": 406551682, "end": 406552584}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/Resources/README.md", "start": 406552584, "end": 406553087}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/A/SDL3.tbd", "start": 406553087, "end": 406601949}, {"filename": "/external/SDL_mixer/Xcode/macOS/SDL3.framework/Versions/Current", "start": 406601949, "end": 406601950}, {"filename": "/external/SDL_mixer/Xcode/mpg123/arm64/config.h", "start": 406601950, "end": 406617083}, {"filename": "/external/SDL_mixer/Xcode/mpg123/armv7/config.h", "start": 406617083, "end": 406632215}, {"filename": "/external/SDL_mixer/Xcode/mpg123/config.xcconfig", "start": 406632215, "end": 406635694}, {"filename": "/external/SDL_mixer/Xcode/mpg123/mpg123.xcodeproj/project.pbxproj", "start": 406635694, "end": 406690658}, {"filename": "/external/SDL_mixer/Xcode/mpg123/x86_64/config.h", "start": 406690658, "end": 406705791}, {"filename": "/external/SDL_mixer/Xcode/ogg/ogg.xcodeproj/project.pbxproj", "start": 406705791, "end": 406724829}, {"filename": "/external/SDL_mixer/Xcode/opus/arm64/config.h", "start": 406724829, "end": 406730988}, {"filename": "/external/SDL_mixer/Xcode/opus/armv7/config.h", "start": 406730988, "end": 406737150}, {"filename": "/external/SDL_mixer/Xcode/opus/config.xcconfig", "start": 406737150, "end": 406737526}, {"filename": "/external/SDL_mixer/Xcode/opus/opus.xcodeproj/project.pbxproj", "start": 406737526, "end": 406835259}, {"filename": "/external/SDL_mixer/Xcode/opus/x86_64/config.h", "start": 406835259, "end": 406841427}, {"filename": "/external/SDL_mixer/Xcode/pkg-support/build.xcconfig", "start": 406841427, "end": 406842793}, {"filename": "/external/SDL_mixer/Xcode/pkg-support/resources/CMake/SDL3_mixerConfig.cmake", "start": 406842793, "end": 406846944}, {"filename": "/external/SDL_mixer/Xcode/pkg-support/resources/CMake/SDL3_mixerConfigVersion.cmake", "start": 406846944, "end": 406849847}, {"filename": "/external/SDL_mixer/Xcode/pkg-support/resources/INSTALL.md", "start": 406849847, "end": 406850943}, {"filename": "/external/SDL_mixer/Xcode/pkg-support/resources/SDL_DS_Store", "start": 406850943, "end": 406861187}, {"filename": "/external/SDL_mixer/Xcode/pkg-support/resources/framework/INSTALL.md", "start": 406861187, "end": 406861932}, {"filename": "/external/SDL_mixer/Xcode/pkg-support/resources/share/cmake/SDL3_mixer/SDL3_mixerConfig.cmake", "start": 406861932, "end": 406868797}, {"filename": "/external/SDL_mixer/Xcode/pkg-support/resources/share/cmake/SDL3_mixer/SDL3_mixerConfigVersion.cmake", "start": 406868797, "end": 406872751}, {"filename": "/external/SDL_mixer/Xcode/pkg-support/sdl_logo.pdf", "start": 406872751, "end": 407036551}, {"filename": "/external/SDL_mixer/Xcode/playmus/config.xcconfig", "start": 407036551, "end": 407036777}, {"filename": "/external/SDL_mixer/Xcode/playmus/macOS/macOS.entitlements", "start": 407036777, "end": 407037109}, {"filename": "/external/SDL_mixer/Xcode/playmus/playmus.xcodeproj/project.pbxproj", "start": 407037109, "end": 407069147}, {"filename": "/external/SDL_mixer/Xcode/playwave/config.xcconfig", "start": 407069147, "end": 407069373}, {"filename": "/external/SDL_mixer/Xcode/playwave/macOS/macOS.entitlements", "start": 407069373, "end": 407069705}, {"filename": "/external/SDL_mixer/Xcode/playwave/playwave.xcodeproj/project.pbxproj", "start": 407069705, "end": 407101800}, {"filename": "/external/SDL_mixer/Xcode/tremor/config.h", "start": 407101800, "end": 407105004}, {"filename": "/external/SDL_mixer/Xcode/tremor/tremor.xcodeproj/project.pbxproj", "start": 407105004, "end": 407131280}, {"filename": "/external/SDL_mixer/Xcode/vorbis/config.h", "start": 407131280, "end": 407134281}, {"filename": "/external/SDL_mixer/Xcode/vorbis/vorbis.xcodeproj/project.pbxproj", "start": 407134281, "end": 407164796}, {"filename": "/external/SDL_mixer/Xcode/wavpack/config.xcconfig", "start": 407164796, "end": 407165581}, {"filename": "/external/SDL_mixer/Xcode/wavpack/wavpack.xcodeproj/project.pbxproj", "start": 407165581, "end": 407198144}, {"filename": "/external/SDL_mixer/Xcode/xmp/xmp.xcodeproj/project.pbxproj", "start": 407198144, "end": 407258298}, {"filename": "/external/SDL_mixer/build-scripts/android-prefab.sh", "start": 407258298, "end": 407271171}, {"filename": "/external/SDL_mixer/build-scripts/build-release.py", "start": 407271171, "end": 407356804}, {"filename": "/external/SDL_mixer/build-scripts/build-web-examples.pl", "start": 407356804, "end": 407372117}, {"filename": "/external/SDL_mixer/build-scripts/check_elf_alignment.sh", "start": 407372117, "end": 407375655}, {"filename": "/external/SDL_mixer/build-scripts/cmake-toolchain-mingw64-i686.cmake", "start": 407375655, "end": 407376212}, {"filename": "/external/SDL_mixer/build-scripts/cmake-toolchain-mingw64-x86_64.cmake", "start": 407376212, "end": 407376778}, {"filename": "/external/SDL_mixer/build-scripts/create-release.py", "start": 407376778, "end": 407378312}, {"filename": "/external/SDL_mixer/build-scripts/pkg-support/android/INSTALL.md.in", "start": 407378312, "end": 407380482}, {"filename": "/external/SDL_mixer/build-scripts/pkg-support/android/aar/__main__.py.in", "start": 407380482, "end": 407385020}, {"filename": "/external/SDL_mixer/build-scripts/pkg-support/android/aar/cmake/SDL3_mixerConfig.cmake", "start": 407385020, "end": 407389614}, {"filename": "/external/SDL_mixer/build-scripts/pkg-support/android/aar/cmake/SDL3_mixerConfigVersion.cmake.in", "start": 407389614, "end": 407391305}, {"filename": "/external/SDL_mixer/build-scripts/pkg-support/android/aar/description.json.in", "start": 407391305, "end": 407391427}, {"filename": "/external/SDL_mixer/build-scripts/pkg-support/mingw/INSTALL.md.in", "start": 407391427, "end": 407392798}, {"filename": "/external/SDL_mixer/build-scripts/pkg-support/mingw/Makefile", "start": 407392798, "end": 407393899}, {"filename": "/external/SDL_mixer/build-scripts/pkg-support/mingw/cmake/SDL3_mixerConfig.cmake", "start": 407393899, "end": 407394698}, {"filename": "/external/SDL_mixer/build-scripts/pkg-support/mingw/cmake/SDL3_mixerConfigVersion.cmake", "start": 407394698, "end": 407395537}, {"filename": "/external/SDL_mixer/build-scripts/pkg-support/msvc/INSTALL.md.in", "start": 407395537, "end": 407396794}, {"filename": "/external/SDL_mixer/build-scripts/pkg-support/msvc/arm64/INSTALL.md.in", "start": 407396794, "end": 407397510}, {"filename": "/external/SDL_mixer/build-scripts/pkg-support/msvc/cmake/SDL3_mixerConfig.cmake.in", "start": 407397510, "end": 407401392}, {"filename": "/external/SDL_mixer/build-scripts/pkg-support/msvc/cmake/SDL3_mixerConfigVersion.cmake.in", "start": 407401392, "end": 407403030}, {"filename": "/external/SDL_mixer/build-scripts/pkg-support/msvc/x64/INSTALL.md.in", "start": 407403030, "end": 407403740}, {"filename": "/external/SDL_mixer/build-scripts/pkg-support/msvc/x86/INSTALL.md.in", "start": 407403740, "end": 407404450}, {"filename": "/external/SDL_mixer/build-scripts/release-info.json", "start": 407404450, "end": 407415330}, {"filename": "/external/SDL_mixer/build-scripts/test-versioning.sh", "start": 407415330, "end": 407420016}, {"filename": "/external/SDL_mixer/build-scripts/wikiheaders.pl", "start": 407420016, "end": 407578338}, {"filename": "/external/SDL_mixer/cmake/CPackProjectConfig.cmake.in", "start": 407578338, "end": 407579745}, {"filename": "/external/SDL_mixer/cmake/FindFLAC.cmake", "start": 407579745, "end": 407581161}, {"filename": "/external/SDL_mixer/cmake/FindFluidSynth.cmake", "start": 407581161, "end": 407583410}, {"filename": "/external/SDL_mixer/cmake/FindOgg.cmake", "start": 407583410, "end": 407584974}, {"filename": "/external/SDL_mixer/cmake/FindOpus.cmake", "start": 407584974, "end": 407586704}, {"filename": "/external/SDL_mixer/cmake/FindOpusFile.cmake", "start": 407586704, "end": 407588650}, {"filename": "/external/SDL_mixer/cmake/FindVorbis.cmake", "start": 407588650, "end": 407590376}, {"filename": "/external/SDL_mixer/cmake/Findgme.cmake", "start": 407590376, "end": 407591898}, {"filename": "/external/SDL_mixer/cmake/Findlibxmp-lite.cmake", "start": 407591898, "end": 407593602}, {"filename": "/external/SDL_mixer/cmake/Findlibxmp.cmake", "start": 407593602, "end": 407595067}, {"filename": "/external/SDL_mixer/cmake/Findmpg123.cmake", "start": 407595067, "end": 407596571}, {"filename": "/external/SDL_mixer/cmake/Findtremor.cmake", "start": 407596571, "end": 407598099}, {"filename": "/external/SDL_mixer/cmake/Findwavpack.cmake", "start": 407598099, "end": 407599265}, {"filename": "/external/SDL_mixer/cmake/GetGitRevisionDescription.cmake", "start": 407599265, "end": 407609646}, {"filename": "/external/SDL_mixer/cmake/GetGitRevisionDescription.cmake.in", "start": 407609646, "end": 407611253}, {"filename": "/external/SDL_mixer/cmake/PkgConfigHelper.cmake", "start": 407611253, "end": 407612540}, {"filename": "/external/SDL_mixer/cmake/PrivateSdlFunctions.cmake", "start": 407612540, "end": 407630025}, {"filename": "/external/SDL_mixer/cmake/SDL3_mixerConfig.cmake.in", "start": 407630025, "end": 407636188}, {"filename": "/external/SDL_mixer/cmake/sdl3-mixer.pc.in", "start": 407636188, "end": 407636580}, {"filename": "/external/SDL_mixer/cmake/sdlcpu.cmake", "start": 407636580, "end": 407642310}, {"filename": "/external/SDL_mixer/cmake/sdlmanpages.cmake", "start": 407642310, "end": 407644833}, {"filename": "/external/SDL_mixer/cmake/sdlplatform.cmake", "start": 407644833, "end": 407648602}, {"filename": "/external/SDL_mixer/cmake/test/CMakeLists.txt", "start": 407648602, "end": 407650142}, {"filename": "/external/SDL_mixer/cmake/test/main.c", "start": 407650142, "end": 407650570}, {"filename": "/external/SDL_mixer/docs/INTRO-androidstudio.md", "start": 407650570, "end": 407650945}, {"filename": "/external/SDL_mixer/docs/INTRO-cmake.md", "start": 407650945, "end": 407652689}, {"filename": "/external/SDL_mixer/docs/INTRO-emscripten.md", "start": 407652689, "end": 407654306}, {"filename": "/external/SDL_mixer/docs/INTRO-visualstudio.md", "start": 407654306, "end": 407655969}, {"filename": "/external/SDL_mixer/docs/INTRO-xcode.md", "start": 407655969, "end": 407657544}, {"filename": "/external/SDL_mixer/docs/README-migration.md", "start": 407657544, "end": 407676547}, {"filename": "/external/SDL_mixer/docs/hello.c", "start": 407676547, "end": 407678874}, {"filename": "/external/SDL_mixer/docs/release_checklist.md", "start": 407678874, "end": 407682006}, {"filename": "/external/SDL_mixer/examples/CMakeLists.txt", "start": 407682006, "end": 407690717}, {"filename": "/external/SDL_mixer/examples/README.md", "start": 407690717, "end": 407694129}, {"filename": "/external/SDL_mixer/examples/advanced/01-tag-tracks/README.txt", "start": 407694129, "end": 407694501}, {"filename": "/external/SDL_mixer/examples/advanced/01-tag-tracks/onmouseover.webp", "start": 407694501, "end": 407704047}, {"filename": "/external/SDL_mixer/examples/advanced/01-tag-tracks/tag-tracks.c", "start": 407704047, "end": 407711956}, {"filename": "/external/SDL_mixer/examples/advanced/01-tag-tracks/thumbnail.png", "start": 407711956, "end": 407713503}, {"filename": "/external/SDL_mixer/examples/basics/01-load-and-play/README.txt", "start": 407713503, "end": 407713658}, {"filename": "/external/SDL_mixer/examples/basics/01-load-and-play/load-and-play.c", "start": 407713658, "end": 407717652}, {"filename": "/external/SDL_mixer/examples/basics/01-load-and-play/onmouseover.webp", "start": 407717652, "end": 407894122}, {"filename": "/external/SDL_mixer/examples/basics/01-load-and-play/thumbnail.png", "start": 407894122, "end": 407908343}, {"filename": "/external/SDL_mixer/examples/basics/02-play-with-options/README.txt", "start": 407908343, "end": 407908546}, {"filename": "/external/SDL_mixer/examples/basics/02-play-with-options/onmouseover.webp", "start": 407908546, "end": 408085016}, {"filename": "/external/SDL_mixer/examples/basics/02-play-with-options/play-with-options.c", "start": 408085016, "end": 408090294}, {"filename": "/external/SDL_mixer/examples/basics/02-play-with-options/thumbnail.png", "start": 408090294, "end": 408104515}, {"filename": "/external/SDL_mixer/examples/basics/03-play-multiple-sounds/README.txt", "start": 408104515, "end": 408104663}, {"filename": "/external/SDL_mixer/examples/basics/03-play-multiple-sounds/onmouseover.webp", "start": 408104663, "end": 408281133}, {"filename": "/external/SDL_mixer/examples/basics/03-play-multiple-sounds/play-multiple-sounds.c", "start": 408281133, "end": 408286402}, {"filename": "/external/SDL_mixer/examples/basics/03-play-multiple-sounds/thumbnail.png", "start": 408286402, "end": 408300623}, {"filename": "/external/SDL_mixer/examples/basics/04-metadata/README.txt", "start": 408300623, "end": 408300687}, {"filename": "/external/SDL_mixer/examples/basics/04-metadata/metadata.c", "start": 408300687, "end": 408306528}, {"filename": "/external/SDL_mixer/examples/basics/04-metadata/thumbnail.png", "start": 408306528, "end": 408308995}, {"filename": "/external/SDL_mixer/examples/basics/05-sinewave/README.txt", "start": 408308995, "end": 408309139}, {"filename": "/external/SDL_mixer/examples/basics/05-sinewave/onmouseover.webp", "start": 408309139, "end": 408485609}, {"filename": "/external/SDL_mixer/examples/basics/05-sinewave/sinewave.c", "start": 408485609, "end": 408489573}, {"filename": "/external/SDL_mixer/examples/basics/05-sinewave/thumbnail.png", "start": 408489573, "end": 408503794}, {"filename": "/external/SDL_mixer/examples/basics/06-seeking/README.txt", "start": 408503794, "end": 408504009}, {"filename": "/external/SDL_mixer/examples/basics/06-seeking/onmouseover.webp", "start": 408504009, "end": 408505873}, {"filename": "/external/SDL_mixer/examples/basics/06-seeking/seeking.c", "start": 408505873, "end": 408511454}, {"filename": "/external/SDL_mixer/examples/basics/06-seeking/thumbnail.png", "start": 408511454, "end": 408511870}, {"filename": "/external/SDL_mixer/examples/categories.txt", "start": 408511870, "end": 408512167}, {"filename": "/external/SDL_mixer/examples/highlight-plugin.lua", "start": 408512167, "end": 408515993}, {"filename": "/external/SDL_mixer/examples/music.mp3", "start": 408515993, "end": 409067033}, {"filename": "/external/SDL_mixer/examples/save-rendering-to-bitmaps.h", "start": 409067033, "end": 409068970}, {"filename": "/external/SDL_mixer/examples/splash.wav", "start": 409068970, "end": 409091344}, {"filename": "/external/SDL_mixer/examples/spring.wav", "start": 409091344, "end": 409325986}, {"filename": "/external/SDL_mixer/examples/sword.wav", "start": 409325986, "end": 409417344}, {"filename": "/external/SDL_mixer/examples/template-category.html", "start": 409417344, "end": 409418714}, {"filename": "/external/SDL_mixer/examples/template-homepage.html", "start": 409418714, "end": 409419874}, {"filename": "/external/SDL_mixer/examples/template-placeholder.png", "start": 409419874, "end": 409454831}, {"filename": "/external/SDL_mixer/examples/template.c", "start": 409454831, "end": 409456691}, {"filename": "/external/SDL_mixer/examples/template.css", "start": 409456691, "end": 409460992}, {"filename": "/external/SDL_mixer/examples/template.html", "start": 409460992, "end": 409469543}, {"filename": "/external/SDL_mixer/external/Get-GitModules.ps1", "start": 409469543, "end": 409471080}, {"filename": "/external/SDL_mixer/external/download.sh", "start": 409471080, "end": 409471496}, {"filename": "/external/SDL_mixer/include/SDL3_mixer/SDL_mixer.h", "start": 409471496, "end": 409615028}, {"filename": "/external/SDL_mixer/mingw/pkg-support/cmake/sdl3_mixer-config-version.cmake", "start": 409615028, "end": 409615855}, {"filename": "/external/SDL_mixer/mingw/pkg-support/cmake/sdl3_mixer-config.cmake", "start": 409615855, "end": 409616756}, {"filename": "/external/SDL_mixer/src/SDL_mixer.c", "start": 409616756, "end": 409736368}, {"filename": "/external/SDL_mixer/src/SDL_mixer.exports", "start": 409736368, "end": 409738474}, {"filename": "/external/SDL_mixer/src/SDL_mixer.sym", "start": 409738474, "end": 409740980}, {"filename": "/external/SDL_mixer/src/SDL_mixer_internal.h", "start": 409740980, "end": 409755220}, {"filename": "/external/SDL_mixer/src/SDL_mixer_loader.h", "start": 409755220, "end": 409758081}, {"filename": "/external/SDL_mixer/src/SDL_mixer_metadata_tags.c", "start": 409758081, "end": 409809380}, {"filename": "/external/SDL_mixer/src/SDL_mixer_spatialization.c", "start": 409809380, "end": 409829507}, {"filename": "/external/SDL_mixer/src/decoder_aiff.c", "start": 409829507, "end": 409848965}, {"filename": "/external/SDL_mixer/src/decoder_au.c", "start": 409848965, "end": 409858333}, {"filename": "/external/SDL_mixer/src/decoder_drflac.c", "start": 409858333, "end": 409871219}, {"filename": "/external/SDL_mixer/src/decoder_drmp3.c", "start": 409871219, "end": 409878357}, {"filename": "/external/SDL_mixer/src/decoder_flac.c", "start": 409878357, "end": 409900878}, {"filename": "/external/SDL_mixer/src/decoder_fluidsynth.c", "start": 409900878, "end": 409919431}, {"filename": "/external/SDL_mixer/src/decoder_gme.c", "start": 409919431, "end": 409927163}, {"filename": "/external/SDL_mixer/src/decoder_mpg123.c", "start": 409927163, "end": 409944425}, {"filename": "/external/SDL_mixer/src/decoder_opus.c", "start": 409944425, "end": 409957820}, {"filename": "/external/SDL_mixer/src/decoder_raw.c", "start": 409957820, "end": 409963082}, {"filename": "/external/SDL_mixer/src/decoder_sinewave.c", "start": 409963082, "end": 409968858}, {"filename": "/external/SDL_mixer/src/decoder_stb_vorbis.c", "start": 409968858, "end": 409982416}, {"filename": "/external/SDL_mixer/src/decoder_timidity.c", "start": 409982416, "end": 409988420}, {"filename": "/external/SDL_mixer/src/decoder_voc.c", "start": 409988420, "end": 410010840}, {"filename": "/external/SDL_mixer/src/decoder_vorbis.c", "start": 410010840, "end": 410028235}, {"filename": "/external/SDL_mixer/src/decoder_wav.c", "start": 410028235, "end": 410095997}, {"filename": "/external/SDL_mixer/src/decoder_wavpack.c", "start": 410095997, "end": 410118152}, {"filename": "/external/SDL_mixer/src/decoder_xmp.c", "start": 410118152, "end": 410128825}, {"filename": "/external/SDL_mixer/src/dr_libs/LICENSE", "start": 410128825, "end": 410131470}, {"filename": "/external/SDL_mixer/src/dr_libs/README.md", "start": 410131470, "end": 410132707}, {"filename": "/external/SDL_mixer/src/dr_libs/dr_flac.h", "start": 410132707, "end": 410694977}, {"filename": "/external/SDL_mixer/src/dr_libs/dr_mp3.h", "start": 410694977, "end": 410899115}, {"filename": "/external/SDL_mixer/src/genexports.py", "start": 410899115, "end": 410921143}, {"filename": "/external/SDL_mixer/src/stb_vorbis/README.txt", "start": 410921143, "end": 410921427}, {"filename": "/external/SDL_mixer/src/stb_vorbis/stb_vorbis.h", "start": 410921427, "end": 411129221}, {"filename": "/external/SDL_mixer/src/timidity/Android.mk", "start": 411129221, "end": 411129621}, {"filename": "/external/SDL_mixer/src/timidity/CHANGES", "start": 411129621, "end": 411132889}, {"filename": "/external/SDL_mixer/src/timidity/COPYING", "start": 411132889, "end": 411133454}, {"filename": "/external/SDL_mixer/src/timidity/COPYING.LGPL", "start": 411133454, "end": 411160374}, {"filename": "/external/SDL_mixer/src/timidity/COPYING.artistic", "start": 411160374, "end": 411166615}, {"filename": "/external/SDL_mixer/src/timidity/FAQ", "start": 411166615, "end": 411171504}, {"filename": "/external/SDL_mixer/src/timidity/README", "start": 411171504, "end": 411173880}, {"filename": "/external/SDL_mixer/src/timidity/README.sf", "start": 411173880, "end": 411176056}, {"filename": "/external/SDL_mixer/src/timidity/TODO", "start": 411176056, "end": 411177422}, {"filename": "/external/SDL_mixer/src/timidity/common.c", "start": 411177422, "end": 411180057}, {"filename": "/external/SDL_mixer/src/timidity/common.h", "start": 411180057, "end": 411180924}, {"filename": "/external/SDL_mixer/src/timidity/instrum.c", "start": 411180924, "end": 411197613}, {"filename": "/external/SDL_mixer/src/timidity/instrum.h", "start": 411197613, "end": 411198891}, {"filename": "/external/SDL_mixer/src/timidity/mix.c", "start": 411198891, "end": 411211301}, {"filename": "/external/SDL_mixer/src/timidity/mix.h", "start": 411211301, "end": 411212034}, {"filename": "/external/SDL_mixer/src/timidity/options.h", "start": 411212034, "end": 411215718}, {"filename": "/external/SDL_mixer/src/timidity/output.c", "start": 411215718, "end": 411218034}, {"filename": "/external/SDL_mixer/src/timidity/output.h", "start": 411218034, "end": 411219914}, {"filename": "/external/SDL_mixer/src/timidity/playmidi.c", "start": 411219914, "end": 411241718}, {"filename": "/external/SDL_mixer/src/timidity/playmidi.h", "start": 411241718, "end": 411243045}, {"filename": "/external/SDL_mixer/src/timidity/readmidi.c", "start": 411243045, "end": 411261095}, {"filename": "/external/SDL_mixer/src/timidity/readmidi.h", "start": 411261095, "end": 411261620}, {"filename": "/external/SDL_mixer/src/timidity/readsbk.c", "start": 411261620, "end": 411274670}, {"filename": "/external/SDL_mixer/src/timidity/resample.c", "start": 411274670, "end": 411289890}, {"filename": "/external/SDL_mixer/src/timidity/resample.h", "start": 411289890, "end": 411290518}, {"filename": "/external/SDL_mixer/src/timidity/sbk.h", "start": 411290518, "end": 411292590}, {"filename": "/external/SDL_mixer/src/timidity/sflayer.h", "start": 411292590, "end": 411295786}, {"filename": "/external/SDL_mixer/src/timidity/sndfont.c", "start": 411295786, "end": 411324271}, {"filename": "/external/SDL_mixer/src/timidity/sndfont.cfg", "start": 411324271, "end": 411324838}, {"filename": "/external/SDL_mixer/src/timidity/sndfont.h", "start": 411324838, "end": 411326000}, {"filename": "/external/SDL_mixer/src/timidity/tables.c", "start": 411326000, "end": 411338050}, {"filename": "/external/SDL_mixer/src/timidity/tables.h", "start": 411338050, "end": 411338848}, {"filename": "/external/SDL_mixer/src/timidity/timidity.c", "start": 411338848, "end": 411360173}, {"filename": "/external/SDL_mixer/src/timidity/timidity.h", "start": 411360173, "end": 411365314}, {"filename": "/external/SDL_mixer/src/version.rc", "start": 411365314, "end": 411366291}, {"filename": "/external/SDL_mixer/test/CMakeLists.txt", "start": 411366291, "end": 411367639}, {"filename": "/external/SDL_mixer/test/testaudiodecoder.c", "start": 411367639, "end": 411371711}, {"filename": "/external/SDL_mixer/test/testmixer.c", "start": 411371711, "end": 411386425}, {"filename": "/external/SDL_mixer/test/testspatialization.c", "start": 411386425, "end": 411392947}, {"filename": "/external/SDL_ttf/.clang-format", "start": 411392947, "end": 411395065}, {"filename": "/external/SDL_ttf/.editorconfig", "start": 411395065, "end": 411396022}, {"filename": "/external/SDL_ttf/.github/PULL_REQUEST_TEMPLATE.md", "start": 411396022, "end": 411396478}, {"filename": "/external/SDL_ttf/.github/actions/setup-ninja/action.yml", "start": 411396478, "end": 411399027}, {"filename": "/external/SDL_ttf/.github/workflows/main.yml", "start": 411399027, "end": 411404366}, {"filename": "/external/SDL_ttf/.github/workflows/release.yml", "start": 411404366, "end": 411440629}, {"filename": "/external/SDL_ttf/.gitignore", "start": 411440629, "end": 411441199}, {"filename": "/external/SDL_ttf/.gitmodules", "start": 411441199, "end": 411441731}, {"filename": "/external/SDL_ttf/.wikiheaders-options", "start": 411441731, "end": 411442872}, {"filename": "/external/SDL_ttf/AGENTS.md", "start": 411442872, "end": 411443405}, {"filename": "/external/SDL_ttf/Android.mk", "start": 411443405, "end": 411446110}, {"filename": "/external/SDL_ttf/CHANGES.txt", "start": 411446110, "end": 411447143}, {"filename": "/external/SDL_ttf/CLAUDE.md", "start": 411447143, "end": 411447676}, {"filename": "/external/SDL_ttf/CMakeLists.txt", "start": 411447676, "end": 411474744}, {"filename": "/external/SDL_ttf/INSTALL.md", "start": 411474744, "end": 411476273}, {"filename": "/external/SDL_ttf/LICENSE.txt", "start": 411476273, "end": 411477168}, {"filename": "/external/SDL_ttf/README.md", "start": 411477168, "end": 411478168}, {"filename": "/external/SDL_ttf/VisualC/SDL_ttf.sln", "start": 411478168, "end": 411480923}, {"filename": "/external/SDL_ttf/VisualC/SDL_ttf.vcxproj", "start": 411480923, "end": 411501401}, {"filename": "/external/SDL_ttf/VisualC/SDL_ttf.vcxproj.filters", "start": 411501401, "end": 411511573}, {"filename": "/external/SDL_ttf/VisualC/clean.sh", "start": 411511573, "end": 411511720}, {"filename": "/external/SDL_ttf/VisualC/glfont/glfont.vcxproj", "start": 411511720, "end": 411525543}, {"filename": "/external/SDL_ttf/VisualC/showfont/showfont.vcxproj", "start": 411525543, "end": 411538744}, {"filename": "/external/SDL_ttf/Xcode/Info-Framework.plist", "start": 411538744, "end": 411539440}, {"filename": "/external/SDL_ttf/Xcode/SDL_ttf.xcodeproj/project.pbxproj", "start": 411539440, "end": 411599416}, {"filename": "/external/SDL_ttf/Xcode/config.xcconfig", "start": 411599416, "end": 411599908}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL.h", "start": 411599908, "end": 411602950}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_assert.h", "start": 411602950, "end": 411630440}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_asyncio.h", "start": 411630440, "end": 411654296}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_atomic.h", "start": 411654296, "end": 411679764}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_audio.h", "start": 411679764, "end": 411771592}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_begin_code.h", "start": 411771592, "end": 411787975}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_bits.h", "start": 411787975, "end": 411792517}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_blendmode.h", "start": 411792517, "end": 411802061}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_camera.h", "start": 411802061, "end": 411823166}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_clipboard.h", "start": 411823166, "end": 411835993}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_close_code.h", "start": 411835993, "end": 411837601}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_copying.h", "start": 411837601, "end": 411838607}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_cpuinfo.h", "start": 411838607, "end": 411849474}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_dialog.h", "start": 411849474, "end": 411864219}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_egl.h", "start": 411864219, "end": 411975515}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_endian.h", "start": 411975515, "end": 411996248}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_error.h", "start": 411996248, "end": 412003569}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_events.h", "start": 412003569, "end": 412073157}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_filesystem.h", "start": 412073157, "end": 412095066}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_gamepad.h", "start": 412095066, "end": 412150580}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_gpu.h", "start": 412150580, "end": 412316364}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_guid.h", "start": 412316364, "end": 412319900}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_haptic.h", "start": 412319900, "end": 412365900}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_hidapi.h", "start": 412365900, "end": 412387775}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_hints.h", "start": 412387775, "end": 412543391}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_init.h", "start": 412543391, "end": 412564515}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_intrin.h", "start": 412564515, "end": 412578552}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_iostream.h", "start": 412578552, "end": 412631081}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_joystick.h", "start": 412631081, "end": 412677209}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_keyboard.h", "start": 412677209, "end": 412699350}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_keycode.h", "start": 412699350, "end": 412726266}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_loadso.h", "start": 412726266, "end": 412731593}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_locale.h", "start": 412731593, "end": 412736180}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_log.h", "start": 412736180, "end": 412753494}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_main.h", "start": 412753494, "end": 412780574}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_main_impl.h", "start": 412780574, "end": 412786571}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_messagebox.h", "start": 412786571, "end": 412794823}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_metal.h", "start": 412794823, "end": 412798056}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_misc.h", "start": 412798056, "end": 412800977}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_mouse.h", "start": 412800977, "end": 412828033}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_mutex.h", "start": 412828033, "end": 412864311}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_oldnames.h", "start": 412864311, "end": 412945140}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_opengl.h", "start": 412945140, "end": 413074924}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_opengl_glext.h", "start": 413074924, "end": 413952207}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_opengles.h", "start": 413952207, "end": 413953489}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_opengles2.h", "start": 413953489, "end": 413955155}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_opengles2_gl2.h", "start": 413955155, "end": 413998749}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_opengles2_gl2ext.h", "start": 413998749, "end": 414244003}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_opengles2_gl2platform.h", "start": 414244003, "end": 414244676}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_opengles2_khrplatform.h", "start": 414244676, "end": 414256118}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_pen.h", "start": 414256118, "end": 414260980}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_pixels.h", "start": 414260980, "end": 414322093}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_platform.h", "start": 414322093, "end": 414324050}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_platform_defines.h", "start": 414324050, "end": 414336272}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_power.h", "start": 414336272, "end": 414340371}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_process.h", "start": 414340371, "end": 414358500}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_properties.h", "start": 414358500, "end": 414378095}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_rect.h", "start": 414378095, "end": 414396813}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_render.h", "start": 414396813, "end": 414510909}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_revision.h", "start": 414510909, "end": 414512940}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_scancode.h", "start": 414512940, "end": 414530615}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_sensor.h", "start": 414530615, "end": 414541412}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_stdinc.h", "start": 414541412, "end": 414750923}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_storage.h", "start": 414750923, "end": 414777362}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_surface.h", "start": 414777362, "end": 414837847}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_system.h", "start": 414837847, "end": 414867992}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_thread.h", "start": 414867992, "end": 414891372}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_time.h", "start": 414891372, "end": 414899728}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_timer.h", "start": 414899728, "end": 414914735}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_touch.h", "start": 414914735, "end": 414921272}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_tray.h", "start": 414921272, "end": 414939287}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_version.h", "start": 414939287, "end": 414944742}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_video.h", "start": 414944742, "end": 415080737}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Headers/SDL_vulkan.h", "start": 415080737, "end": 415092842}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/Info.plist", "start": 415092842, "end": 415093662}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/LICENSE.txt", "start": 415093662, "end": 415094564}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/README.md", "start": 415094564, "end": 415095067}, {"filename": "/external/SDL_ttf/Xcode/iOS/SDL3.framework/SDL3.tbd", "start": 415095067, "end": 415142925}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Headers", "start": 415142925, "end": 415142949}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Resources", "start": 415142949, "end": 415142975}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/SDL3.tbd", "start": 415142975, "end": 415143000}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL.h", "start": 415143000, "end": 415146042}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_assert.h", "start": 415146042, "end": 415173532}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_asyncio.h", "start": 415173532, "end": 415197388}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_atomic.h", "start": 415197388, "end": 415222856}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_audio.h", "start": 415222856, "end": 415314684}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_begin_code.h", "start": 415314684, "end": 415331067}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_bits.h", "start": 415331067, "end": 415335609}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_blendmode.h", "start": 415335609, "end": 415345153}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_camera.h", "start": 415345153, "end": 415366258}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_clipboard.h", "start": 415366258, "end": 415379085}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_close_code.h", "start": 415379085, "end": 415380693}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_copying.h", "start": 415380693, "end": 415381699}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_cpuinfo.h", "start": 415381699, "end": 415392566}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_dialog.h", "start": 415392566, "end": 415407311}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_egl.h", "start": 415407311, "end": 415518607}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_endian.h", "start": 415518607, "end": 415539340}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_error.h", "start": 415539340, "end": 415546661}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_events.h", "start": 415546661, "end": 415616249}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_filesystem.h", "start": 415616249, "end": 415638158}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_gamepad.h", "start": 415638158, "end": 415693672}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_gpu.h", "start": 415693672, "end": 415859456}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_guid.h", "start": 415859456, "end": 415862992}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_haptic.h", "start": 415862992, "end": 415908992}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_hidapi.h", "start": 415908992, "end": 415930867}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_hints.h", "start": 415930867, "end": 416086483}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_init.h", "start": 416086483, "end": 416107607}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_intrin.h", "start": 416107607, "end": 416121644}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_iostream.h", "start": 416121644, "end": 416174173}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_joystick.h", "start": 416174173, "end": 416220301}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_keyboard.h", "start": 416220301, "end": 416242442}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_keycode.h", "start": 416242442, "end": 416269358}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_loadso.h", "start": 416269358, "end": 416274685}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_locale.h", "start": 416274685, "end": 416279272}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_log.h", "start": 416279272, "end": 416296586}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_main.h", "start": 416296586, "end": 416323666}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_main_impl.h", "start": 416323666, "end": 416329663}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_messagebox.h", "start": 416329663, "end": 416337915}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_metal.h", "start": 416337915, "end": 416341148}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_misc.h", "start": 416341148, "end": 416344069}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_mouse.h", "start": 416344069, "end": 416371125}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_mutex.h", "start": 416371125, "end": 416407403}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_oldnames.h", "start": 416407403, "end": 416488232}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_opengl.h", "start": 416488232, "end": 416618016}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_opengl_glext.h", "start": 416618016, "end": 417495299}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_opengles.h", "start": 417495299, "end": 417496581}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_opengles2.h", "start": 417496581, "end": 417498247}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_opengles2_gl2.h", "start": 417498247, "end": 417541841}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_opengles2_gl2ext.h", "start": 417541841, "end": 417787095}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_opengles2_gl2platform.h", "start": 417787095, "end": 417787768}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_opengles2_khrplatform.h", "start": 417787768, "end": 417799210}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_pen.h", "start": 417799210, "end": 417804072}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_pixels.h", "start": 417804072, "end": 417865185}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_platform.h", "start": 417865185, "end": 417867142}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_platform_defines.h", "start": 417867142, "end": 417879364}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_power.h", "start": 417879364, "end": 417883463}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_process.h", "start": 417883463, "end": 417901592}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_properties.h", "start": 417901592, "end": 417921187}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_rect.h", "start": 417921187, "end": 417939905}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_render.h", "start": 417939905, "end": 418054001}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_revision.h", "start": 418054001, "end": 418056032}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_scancode.h", "start": 418056032, "end": 418073707}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_sensor.h", "start": 418073707, "end": 418084504}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_stdinc.h", "start": 418084504, "end": 418294015}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_storage.h", "start": 418294015, "end": 418320454}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_surface.h", "start": 418320454, "end": 418380939}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_system.h", "start": 418380939, "end": 418411084}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_thread.h", "start": 418411084, "end": 418434464}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_time.h", "start": 418434464, "end": 418442820}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_timer.h", "start": 418442820, "end": 418457827}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_touch.h", "start": 418457827, "end": 418464364}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_tray.h", "start": 418464364, "end": 418482379}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_version.h", "start": 418482379, "end": 418487834}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_video.h", "start": 418487834, "end": 418623829}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Headers/SDL_vulkan.h", "start": 418623829, "end": 418635934}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Resources/Info.plist", "start": 418635934, "end": 418636754}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Resources/LICENSE.txt", "start": 418636754, "end": 418637656}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/Resources/README.md", "start": 418637656, "end": 418638159}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/A/SDL3.tbd", "start": 418638159, "end": 418685470}, {"filename": "/external/SDL_ttf/Xcode/macOS/SDL3.framework/Versions/Current", "start": 418685470, "end": 418685471}, {"filename": "/external/SDL_ttf/Xcode/pkg-support/resources/CMake/SDL3_ttfConfig.cmake", "start": 418685471, "end": 418688877}, {"filename": "/external/SDL_ttf/Xcode/pkg-support/resources/CMake/SDL3_ttfConfigVersion.cmake", "start": 418688877, "end": 418691776}, {"filename": "/external/SDL_ttf/Xcode/pkg-support/resources/INSTALL.md", "start": 418691776, "end": 418692678}, {"filename": "/external/SDL_ttf/Xcode/pkg-support/resources/SDL_DS_Store", "start": 418692678, "end": 418702922}, {"filename": "/external/SDL_ttf/Xcode/pkg-support/resources/framework/INSTALL.md", "start": 418702922, "end": 418703661}, {"filename": "/external/SDL_ttf/Xcode/pkg-support/sdl_logo.pdf", "start": 418703661, "end": 418867461}, {"filename": "/external/SDL_ttf/Xcode/pkg-support/share/cmake/SDL3_ttf/SDL3_ttfConfig.cmake", "start": 418867461, "end": 418873449}, {"filename": "/external/SDL_ttf/Xcode/pkg-support/share/cmake/SDL3_ttf/SDL3_ttfConfigVersion.cmake", "start": 418873449, "end": 418877323}, {"filename": "/external/SDL_ttf/Xcode/showfont/config.xcconfig", "start": 418877323, "end": 418877549}, {"filename": "/external/SDL_ttf/Xcode/showfont/macOS/macOS.entitlements", "start": 418877549, "end": 418877881}, {"filename": "/external/SDL_ttf/Xcode/showfont/showfont.xcodeproj/project.pbxproj", "start": 418877881, "end": 418901039}, {"filename": "/external/SDL_ttf/build-scripts/SDL_migration.cocci", "start": 418901039, "end": 418903434}, {"filename": "/external/SDL_ttf/build-scripts/build-release.py", "start": 418903434, "end": 418989067}, {"filename": "/external/SDL_ttf/build-scripts/check_elf_alignment.sh", "start": 418989067, "end": 418992605}, {"filename": "/external/SDL_ttf/build-scripts/cmake-toolchain-mingw64-i686.cmake", "start": 418992605, "end": 418993162}, {"filename": "/external/SDL_ttf/build-scripts/cmake-toolchain-mingw64-x86_64.cmake", "start": 418993162, "end": 418993728}, {"filename": "/external/SDL_ttf/build-scripts/create-release.py", "start": 418993728, "end": 418995262}, {"filename": "/external/SDL_ttf/build-scripts/pkg-support/android/INSTALL.md.in", "start": 418995262, "end": 418997432}, {"filename": "/external/SDL_ttf/build-scripts/pkg-support/android/aar/__main__.py.in", "start": 418997432, "end": 419001970}, {"filename": "/external/SDL_ttf/build-scripts/pkg-support/android/aar/cmake/SDL3_ttfConfig.cmake", "start": 419001970, "end": 419005694}, {"filename": "/external/SDL_ttf/build-scripts/pkg-support/android/aar/cmake/SDL3_ttfConfigVersion.cmake.in", "start": 419005694, "end": 419007293}, {"filename": "/external/SDL_ttf/build-scripts/pkg-support/android/aar/description.json.in", "start": 419007293, "end": 419007411}, {"filename": "/external/SDL_ttf/build-scripts/pkg-support/mingw/INSTALL.md.in", "start": 419007411, "end": 419008782}, {"filename": "/external/SDL_ttf/build-scripts/pkg-support/mingw/Makefile", "start": 419008782, "end": 419009881}, {"filename": "/external/SDL_ttf/build-scripts/pkg-support/mingw/cmake/SDL3_ttfConfig.cmake", "start": 419009881, "end": 419010654}, {"filename": "/external/SDL_ttf/build-scripts/pkg-support/mingw/cmake/SDL3_ttfConfigVersion.cmake", "start": 419010654, "end": 419011471}, {"filename": "/external/SDL_ttf/build-scripts/pkg-support/msvc/INSTALL.md.in", "start": 419011471, "end": 419012517}, {"filename": "/external/SDL_ttf/build-scripts/pkg-support/msvc/arm64/INSTALL.md.in", "start": 419012517, "end": 419013033}, {"filename": "/external/SDL_ttf/build-scripts/pkg-support/msvc/cmake/SDL3_ttfConfig.cmake.in", "start": 419013033, "end": 419016117}, {"filename": "/external/SDL_ttf/build-scripts/pkg-support/msvc/cmake/SDL3_ttfConfigVersion.cmake.in", "start": 419016117, "end": 419017643}, {"filename": "/external/SDL_ttf/build-scripts/pkg-support/msvc/x64/INSTALL.md.in", "start": 419017643, "end": 419018153}, {"filename": "/external/SDL_ttf/build-scripts/pkg-support/msvc/x86/INSTALL.md.in", "start": 419018153, "end": 419018663}, {"filename": "/external/SDL_ttf/build-scripts/release-info.json", "start": 419018663, "end": 419023930}, {"filename": "/external/SDL_ttf/build-scripts/rename_api.py", "start": 419023930, "end": 419028650}, {"filename": "/external/SDL_ttf/build-scripts/rename_symbols.py", "start": 419028650, "end": 419032737}, {"filename": "/external/SDL_ttf/build-scripts/test-versioning.sh", "start": 419032737, "end": 419037481}, {"filename": "/external/SDL_ttf/build-scripts/wikiheaders.pl", "start": 419037481, "end": 419195803}, {"filename": "/external/SDL_ttf/cmake/CPackProjectConfig.cmake.in", "start": 419195803, "end": 419197210}, {"filename": "/external/SDL_ttf/cmake/Findharfbuzz.cmake", "start": 419197210, "end": 419199921}, {"filename": "/external/SDL_ttf/cmake/Findplutosvg.cmake", "start": 419199921, "end": 419201533}, {"filename": "/external/SDL_ttf/cmake/Findplutovg.cmake", "start": 419201533, "end": 419203249}, {"filename": "/external/SDL_ttf/cmake/GetGitRevisionDescription.cmake", "start": 419203249, "end": 419213630}, {"filename": "/external/SDL_ttf/cmake/GetGitRevisionDescription.cmake.in", "start": 419213630, "end": 419215237}, {"filename": "/external/SDL_ttf/cmake/PkgConfigHelper.cmake", "start": 419215237, "end": 419216524}, {"filename": "/external/SDL_ttf/cmake/PrivateSdlFunctions.cmake", "start": 419216524, "end": 419234009}, {"filename": "/external/SDL_ttf/cmake/SDL3_ttfConfig.cmake.in", "start": 419234009, "end": 419237347}, {"filename": "/external/SDL_ttf/cmake/sdl3-ttf.pc.in", "start": 419237347, "end": 419237753}, {"filename": "/external/SDL_ttf/cmake/sdlcpu.cmake", "start": 419237753, "end": 419243483}, {"filename": "/external/SDL_ttf/cmake/sdlmanpages.cmake", "start": 419243483, "end": 419246006}, {"filename": "/external/SDL_ttf/cmake/sdlplatform.cmake", "start": 419246006, "end": 419249775}, {"filename": "/external/SDL_ttf/cmake/test/CMakeLists.txt", "start": 419249775, "end": 419251297}, {"filename": "/external/SDL_ttf/cmake/test/main.c", "start": 419251297, "end": 419251712}, {"filename": "/external/SDL_ttf/docs/INTRO-androidstudio.md", "start": 419251712, "end": 419251843}, {"filename": "/external/SDL_ttf/docs/INTRO-cmake.md", "start": 419251843, "end": 419253401}, {"filename": "/external/SDL_ttf/docs/INTRO-emscripten.md", "start": 419253401, "end": 419255136}, {"filename": "/external/SDL_ttf/docs/INTRO-visualstudio.md", "start": 419255136, "end": 419256550}, {"filename": "/external/SDL_ttf/docs/INTRO-xcode.md", "start": 419256550, "end": 419257932}, {"filename": "/external/SDL_ttf/docs/README-migration.md", "start": 419257932, "end": 419262307}, {"filename": "/external/SDL_ttf/docs/README-versions.md", "start": 419262307, "end": 419264846}, {"filename": "/external/SDL_ttf/docs/hello-textengine.c", "start": 419264846, "end": 419313590}, {"filename": "/external/SDL_ttf/docs/hello.c", "start": 419313590, "end": 419360996}, {"filename": "/external/SDL_ttf/docs/release_checklist.md", "start": 419360996, "end": 419363724}, {"filename": "/external/SDL_ttf/examples/editbox.c", "start": 419363724, "end": 419392986}, {"filename": "/external/SDL_ttf/examples/editbox.h", "start": 419392986, "end": 419395715}, {"filename": "/external/SDL_ttf/examples/glfont.c", "start": 419395715, "end": 419409934}, {"filename": "/external/SDL_ttf/examples/showfont.c", "start": 419409934, "end": 419432660}, {"filename": "/external/SDL_ttf/examples/showfps.c", "start": 419432660, "end": 419482094}, {"filename": "/external/SDL_ttf/examples/testapp.c", "start": 419482094, "end": 419530941}, {"filename": "/external/SDL_ttf/examples/testgltext.c", "start": 419530941, "end": 419549098}, {"filename": "/external/SDL_ttf/examples/testgputext.c", "start": 419549098, "end": 419569884}, {"filename": "/external/SDL_ttf/examples/testgputext/SDL_math3d.h", "start": 419569884, "end": 419578490}, {"filename": "/external/SDL_ttf/examples/testgputext/shaders/build-shaders.sh", "start": 419578490, "end": 419579159}, {"filename": "/external/SDL_ttf/examples/testgputext/shaders/shader-sdf.frag.dxil.h", "start": 419579159, "end": 419604102}, {"filename": "/external/SDL_ttf/examples/testgputext/shaders/shader-sdf.frag.hlsl", "start": 419604102, "end": 419604662}, {"filename": "/external/SDL_ttf/examples/testgputext/shaders/shader-sdf.frag.msl.h", "start": 419604662, "end": 419608317}, {"filename": "/external/SDL_ttf/examples/testgputext/shaders/shader-sdf.frag.spv.h", "start": 419608317, "end": 419615609}, {"filename": "/external/SDL_ttf/examples/testgputext/shaders/shader-solid.frag.dxil.h", "start": 419615609, "end": 419636632}, {"filename": "/external/SDL_ttf/examples/testgputext/shaders/shader-solid.frag.hlsl", "start": 419636632, "end": 419637049}, {"filename": "/external/SDL_ttf/examples/testgputext/shaders/shader-solid.frag.msl.h", "start": 419637049, "end": 419640825}, {"filename": "/external/SDL_ttf/examples/testgputext/shaders/shader-solid.frag.spv.h", "start": 419640825, "end": 419646995}, {"filename": "/external/SDL_ttf/examples/testgputext/shaders/shader.frag.dxil.h", "start": 419646995, "end": 419671207}, {"filename": "/external/SDL_ttf/examples/testgputext/shaders/shader.frag.hlsl", "start": 419671207, "end": 419671591}, {"filename": "/external/SDL_ttf/examples/testgputext/shaders/shader.frag.msl.h", "start": 419671591, "end": 419674830}, {"filename": "/external/SDL_ttf/examples/testgputext/shaders/shader.frag.spv.h", "start": 419674830, "end": 419680364}, {"filename": "/external/SDL_ttf/examples/testgputext/shaders/shader.vert.dxil.h", "start": 419680364, "end": 419713201}, {"filename": "/external/SDL_ttf/examples/testgputext/shaders/shader.vert.hlsl", "start": 419713201, "end": 419713837}, {"filename": "/external/SDL_ttf/examples/testgputext/shaders/shader.vert.msl.h", "start": 419713837, "end": 419718888}, {"filename": "/external/SDL_ttf/examples/testgputext/shaders/shader.vert.spv.h", "start": 419718888, "end": 419727198}, {"filename": "/external/SDL_ttf/external/Get-GitModules.ps1", "start": 419727198, "end": 419728735}, {"filename": "/external/SDL_ttf/external/download.sh", "start": 419728735, "end": 419729151}, {"filename": "/external/SDL_ttf/include/SDL3_ttf/SDL_textengine.h", "start": 419729151, "end": 419736396}, {"filename": "/external/SDL_ttf/include/SDL3_ttf/SDL_ttf.h", "start": 419736396, "end": 419849943}, {"filename": "/external/SDL_ttf/mingw/pkg-support/cmake/sdl3_ttf-config-version.cmake", "start": 419849943, "end": 419850764}, {"filename": "/external/SDL_ttf/mingw/pkg-support/cmake/sdl3_ttf-config.cmake", "start": 419850764, "end": 419851539}, {"filename": "/external/SDL_ttf/src/SDL_gl_textengine.c", "start": 419851539, "end": 419887056}, {"filename": "/external/SDL_ttf/src/SDL_gpu_textengine.c", "start": 419887056, "end": 419919514}, {"filename": "/external/SDL_ttf/src/SDL_hashtable.c", "start": 419919514, "end": 419935272}, {"filename": "/external/SDL_ttf/src/SDL_hashtable.h", "start": 419935272, "end": 419960321}, {"filename": "/external/SDL_ttf/src/SDL_hashtable_names.h", "start": 419960321, "end": 419962097}, {"filename": "/external/SDL_ttf/src/SDL_hashtable_ttf.c", "start": 419962097, "end": 419964917}, {"filename": "/external/SDL_ttf/src/SDL_hashtable_ttf.h", "start": 419964917, "end": 419966377}, {"filename": "/external/SDL_ttf/src/SDL_renderer_textengine.c", "start": 419966377, "end": 419996351}, {"filename": "/external/SDL_ttf/src/SDL_surface_textengine.c", "start": 419996351, "end": 420008202}, {"filename": "/external/SDL_ttf/src/SDL_ttf.c", "start": 420008202, "end": 420226549}, {"filename": "/external/SDL_ttf/src/SDL_ttf.exports", "start": 420226549, "end": 420229535}, {"filename": "/external/SDL_ttf/src/SDL_ttf.sym", "start": 420229535, "end": 420233045}, {"filename": "/external/SDL_ttf/src/genexports.py", "start": 420233045, "end": 420255073}, {"filename": "/external/SDL_ttf/src/stb_rect_pack.h", "start": 420255073, "end": 420276112}, {"filename": "/external/SDL_ttf/src/version.rc", "start": 420276112, "end": 420277083}, {"filename": "/main.cpp", "start": 420277083, "end": 420279003}, {"filename": "/memo.txt", "start": 420279003, "end": 420280777}, {"filename": "/x64/Debug/SDL3.dll", "start": 420280777, "end": 426586057}, {"filename": "/x64/Debug/SDL3_mixer.dll", "start": 426586057, "end": 426942921}, {"filename": "/x64/Debug/SDL_WebBuild.exe", "start": 426942921, "end": 427014089}, {"filename": "/x64/Debug/SDL_WebBuild.pdb", "start": 427014089, "end": 429254601}], "remote_package_size": 429254601});

  })();

// end include: C:\Users\prido\AppData\Local\Temp\tmpwirac64i.js
// include: C:\Users\prido\AppData\Local\Temp\tmp0q7rui21.js

    // All the pre-js content up to here must remain later on, we need to run
    // it.
    if ((typeof ENVIRONMENT_IS_WASM_WORKER !== 'undefined' && ENVIRONMENT_IS_WASM_WORKER) || (typeof ENVIRONMENT_IS_PTHREAD !== 'undefined' && ENVIRONMENT_IS_PTHREAD) || (typeof ENVIRONMENT_IS_AUDIO_WORKLET !== 'undefined' && ENVIRONMENT_IS_AUDIO_WORKLET)) Module['preRun'] = [];
    var necessaryPreJSTasks = Module['preRun'].slice();
  // end include: C:\Users\prido\AppData\Local\Temp\tmp0q7rui21.js
// include: C:\Users\prido\AppData\Local\Temp\tmp9pelq2te.js

    if (!Module['preRun']) throw 'Module.preRun should exist because file support used it; did a pre-js delete it?';
    necessaryPreJSTasks.forEach((task) => {
      if (!Module['preRun'].includes(task)) throw 'All preRun tasks that exist before user pre-js code should remain after; did you replace Module or modify Module.preRun?';
    });
  // end include: C:\Users\prido\AppData\Local\Temp\tmp9pelq2te.js


var programArgs = [];
var thisProgram = './this.program';
var quit_ = (status, toThrow) => {
  throw toThrow;
};

// In MODULARIZE mode _scriptName needs to be captured already at the very top of the page immediately when the page is parsed, so it is generated there
// before the page load. In non-MODULARIZE modes generate it here.
var _scriptName = globalThis.document?.currentScript?.src;

if (typeof __filename !== 'undefined') { // Node
  _scriptName = __filename;
} else
if (ENVIRONMENT_IS_WORKER) {
  _scriptName = self.location.href;
}

// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = '';
function locateFile(path) {
  if (Module['locateFile']) {
    return Module['locateFile'](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

// Hooks that are implemented differently in different runtime environments.
var readAsync, readBinary;

if (ENVIRONMENT_IS_NODE) {
  const isNode = globalThis.process?.versions?.node && globalThis.process?.type != 'renderer';
  if (!isNode) throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');

  // These modules will usually be used on Node.js. Load them eagerly to avoid
  // the complexity of lazy-loading.
  var fs = require('node:fs');

  scriptDirectory = __dirname + '/';

// include: node_shell_read.js
readBinary = (filename) => {
  // We need to re-wrap `file://` strings to URLs.
  filename = isFileURI(filename) ? new URL(filename) : filename;
  var ret = fs.readFileSync(filename);
  assert(Buffer.isBuffer(ret));
  return ret;
};

readAsync = async (filename, binary = true) => {
  // See the comment in the `readBinary` function.
  filename = isFileURI(filename) ? new URL(filename) : filename;
  var ret = fs.readFileSync(filename, binary ? undefined : 'utf8');
  assert(binary ? Buffer.isBuffer(ret) : typeof ret === 'string');
  return ret;
};
// end include: node_shell_read.js
  if (process.argv.length > 1) {
    thisProgram = process.argv[1].replace(/\\/g, '/');
  }

  programArgs = process.argv.slice(2);

  // MODULARIZE will export the module in the proper place outside, we don't need to export here
  if (typeof module !== 'undefined') {
    module['exports'] = Module;
  }

  quit_ = (status, toThrow) => {
    process.exitCode = status;
    throw toThrow;
  };

} else
if (ENVIRONMENT_IS_SHELL) {

} else

// Note that this includes Node.js workers when relevant (pthreads is enabled).
// Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
// ENVIRONMENT_IS_NODE.
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  try {
    scriptDirectory = new URL('.', _scriptName).href; // includes trailing slash
  } catch {
    // Must be a `blob:` or `data:` URL (e.g. `blob:http://site.com/etc/etc`), we cannot
    // infer anything from them.
  }

  if (!(globalThis.window || globalThis.WorkerGlobalScope)) throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');

  {
// include: web_or_worker_shell_read.js
if (ENVIRONMENT_IS_WORKER) {
    readBinary = (url) => {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.responseType = 'arraybuffer';
      xhr.send(null);
      return new Uint8Array(/** @type{!ArrayBuffer} */(xhr.response));
    };
  }

  readAsync = async (url) => {
    // Fetch has some additional restrictions over XHR, like it can't be used on a file:// url.
    // See https://github.com/github/fetch/pull/92#issuecomment-140665932
    // Cordova or Electron apps are typically loaded from a file:// url.
    // So use XHR on webview if URL is a file URL.
    if (isFileURI(url)) {
      return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = () => {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            resolve(xhr.response);
            return;
          }
          reject(xhr.status);
        };
        xhr.onerror = reject;
        xhr.send(null);
      });
    }
    var response = await fetch(url, { credentials: 'same-origin' });
    if (response.ok) {
      return response.arrayBuffer();
    }
    throw new Error(response.status + ' : ' + response.url);
  };
// end include: web_or_worker_shell_read.js
  }
} else
{
  throw new Error('environment detection error');
}

var out = console.log.bind(console);
var err = console.error.bind(console);

var IDBFS = 'IDBFS is no longer included by default; build with -lidbfs.js';
var PROXYFS = 'PROXYFS is no longer included by default; build with -lproxyfs.js';
var WORKERFS = 'WORKERFS is no longer included by default; build with -lworkerfs.js';
var FETCHFS = 'FETCHFS is no longer included by default; build with -lfetchfs.js';
var ICASEFS = 'ICASEFS is no longer included by default; build with -licasefs.js';
var JSFILEFS = 'JSFILEFS is no longer included by default; build with -ljsfilefs.js';
var OPFS = 'OPFS is no longer included by default; build with -lopfs.js';

var NODEFS = 'NODEFS is no longer included by default; build with -lnodefs.js';

// perform assertions in shell.js after we set up out() and err(), as otherwise
// if an assertion fails it cannot print the message

assert(!ENVIRONMENT_IS_SHELL, 'shell environment detected but not enabled at build time (add `shell` to `-sENVIRONMENT` to enable)');

// end include: shell.js

// include: preamble.js
// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

var wasmBinary;

if (!globalThis.WebAssembly) {
  err('no native wasm support detected');
}

// Wasm globals

//========================================
// Runtime essentials
//========================================

// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS;

// In STRICT mode, we only define assert() when ASSERTIONS is set.  i.e. we
// don't define it at all in release modes.  This matches the behaviour of
// MINIMAL_RUNTIME.
// TODO(sbc): Make this the default even without STRICT enabled.
/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed' + (text ? ': ' + text : ''));
  }
}

// We used to include malloc/free by default in the past. Show a helpful error in
// builds with assertions.
function _free() {
  // Show a helpful error since we used to include free by default in the past.
  abort('free() called but not included in the build - add `_free` to EXPORTED_FUNCTIONS');
}

/**
 * Indicates whether filename is delivered via file protocol (as opposed to http/https)
 * @noinline
 */
var isFileURI = (filename) => filename.startsWith('file://');

// include: runtime_common.js
// include: runtime_exceptions.js
// Base Emscripten EH error class
class EmscriptenEH {}

class EmscriptenSjLj extends EmscriptenEH {}

// end include: runtime_exceptions.js
// include: runtime_debug.js
var runtimeDebug = true; // Switch to false at runtime to disable logging at the right times

// Used by XXXXX_DEBUG settings to output debug messages.
function dbg(...args) {
  if (!runtimeDebug && typeof runtimeDebug !== 'undefined') return;
  // TODO(sbc): Make this configurable somehow.  Its not always convenient for
  // logging to show up as warnings.
  console.warn(...args);
}

// Endianness check
(() => {
  const h16 = new Int16Array(1);
  const h8 = new Int8Array(h16.buffer);
  h16[0] = 0x6373;
  if (h8[0] !== 0x73 || h8[1] !== 0x63) abort('Runtime error: expected the system to be little-endian! (Run with -sSUPPORT_BIG_ENDIAN to bypass)');
})();

function consumedModuleProp(prop) {
  let value = Module[prop];
  const msg = `Attempt to modify \`Module.${prop}\` after it has already been processed.  This can happen, for example, when code is injected via '--post-js' rather than '--pre-js'`;
  if (Array.isArray(value)) {
    value = new Proxy(value, {
      set(target, key, val) {
        abort(msg);
        return false;
      },
      defineProperty(target, key, descriptor) {
        abort(msg);
        return false;
      },
      deleteProperty(target, key) {
        abort(msg);
        return false;
      }
    });
  }
  Object.defineProperty(Module, prop, {
    configurable: true,
    get() { return value; },
    set() {
      abort(msg);
    }
  });
}

function makeInvalidEarlyAccess(name) {
  return () => assert(false, `call to '${name}' via reference taken before Wasm module initialization`);

}

function ignoredModuleProp(prop) {
  if (Object.getOwnPropertyDescriptor(Module, prop)) {
    abort(`\`Module.${prop}\` was supplied but \`${prop}\` not included in INCOMING_MODULE_JS_API`);
  }
}

// forcing the filesystem exports a few things by default
function isExportedByForceFilesystem(name) {
  return name === 'FS_createPath' ||
         name === 'FS_createDataFile' ||
         name === 'FS_createPreloadedFile' ||
         name === 'FS_preloadFile' ||
         name === 'FS_unlink' ||
         name === 'addRunDependency' ||
         // The old FS has some functionality that WasmFS lacks.
         name === 'FS_createLazyFile' ||
         name === 'FS_createDevice' ||
         name === 'removeRunDependency';
}

/**
 * Intercept access to a symbols in the global symbol.  This enables us to give
 * informative warnings/errors when folks attempt to use symbols they did not
 * include in their build, or no symbols that no longer exist.
 *
 * We don't define this in MODULARIZE mode since in that mode emscripten symbols
 * are never placed in the global scope.
 */
function hookGlobalSymbolAccess(sym, func) {
  if (!Object.getOwnPropertyDescriptor(globalThis, sym)) {
    Object.defineProperty(globalThis, sym, {
      configurable: true,
      get() {
        func();
        return undefined;
      }
    });
  }
}

function missingGlobal(sym, msg) {
  hookGlobalSymbolAccess(sym, () => {
    warnOnce(`\`${sym}\` is no longer defined by emscripten. ${msg}`);
  });
}

missingGlobal('buffer', 'Please use HEAP8.buffer or wasmMemory.buffer');
missingGlobal('asm', 'Please use wasmExports instead');

function missingLibrarySymbol(sym) {
  hookGlobalSymbolAccess(sym, () => {
    // Can't `abort()` here because it would break code that does runtime
    // checks.  e.g. `if (typeof SDL === 'undefined')`.
    let msg = `\`${sym}\` is a library symbol and not included by default; add it to your library.js __deps or to DEFAULT_LIBRARY_FUNCS_TO_INCLUDE on the command line`;
    // DEFAULT_LIBRARY_FUNCS_TO_INCLUDE requires the name as it appears in
    // library.js, which means $name for a JS name with no prefix, or name
    // for a JS name like _name.
    let librarySymbol = sym;
    if (!librarySymbol.startsWith('_')) {
      librarySymbol = '$' + sym;
    }
    msg += ` (e.g. -sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE='${librarySymbol}')`;
    if (isExportedByForceFilesystem(sym)) {
      msg += '. Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you';
    }
    warnOnce(msg);
  });

  // Any symbol that is not included from the JS library is also (by definition)
  // not exported on the Module object.
  unexportedRuntimeSymbol(sym);
}

function unexportedRuntimeSymbol(sym) {
  if (!Object.getOwnPropertyDescriptor(Module, sym)) {
    Object.defineProperty(Module, sym, {
      configurable: true,
      get() {
        let msg = `'${sym}' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the Emscripten FAQ)`;
        if (isExportedByForceFilesystem(sym)) {
          msg += '. Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you';
        }
        abort(msg);
      },
    });
  }
}

// end include: runtime_debug.js
// include: runtime_stack_check.js
const stackCookie1 = 0x02135467;
const stackCookie2 = 0x89BACDFE;

// Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
function writeStackCookie() {
  let max = _emscripten_stack_get_end();
  assert((max & 3) == 0);
  // If the stack ends at address zero we write our cookies 4 bytes into the
  // stack.  This prevents interference with SAFE_HEAP and ASAN which also
  // monitor writes to address zero.
  if (max == 0) {
    max += 4;
  }
  // The stack grow downwards towards _emscripten_stack_get_end.
  // We write cookies to the final two words in the stack and detect if they are
  // ever overwritten.
  HEAPU32[((max)>>2)] = stackCookie1;
  HEAPU32[(((max)+(4))>>2)] = stackCookie2;
  // Also test the global address 0 for integrity.
  HEAPU32[((0)>>2)] = 1668509029;
}

function u32ToHexString(num) {
  return '0x' + (num >>> 0).toString(16).padStart(8, '0');
}

function checkStackCookie() {
  if (ABORT) return;
  let max = _emscripten_stack_get_end();
  // See writeStackCookie().
  if (max == 0) {
    max += 4;
  }
  const val1 = HEAPU32[((max)>>2)];
  const val2 = HEAPU32[(((max)+(4))>>2)];
  if (val1 != stackCookie1 || val2 != stackCookie2) {
    abort(`Stack overflow! Stack cookie has been overwritten at ${ptrToString(max)}, expected hex dwords ${u32ToHexString(stackCookie2)} and ${u32ToHexString(stackCookie1)}, but received ${u32ToHexString(val2)} ${u32ToHexString(val1)}`);
  }
  // Also test the global address 0 for integrity.
  if (HEAPU32[((0)>>2)] != 0x63736d65 /* 'emsc' */) {
    abort('Runtime error: The application has corrupted its heap memory area (address zero)!');
  }
}
// end include: runtime_stack_check.js
// Memory management

var runtimeInitialized = false;



// When ALLOW_MEMORY_GROWTH is enabled, the conversion from Wasm
// memory to ArrayBuffer requires some additional logic.
function getMemoryBuffer() {
  return wasmMemory.buffer;
}

function updateMemoryViews() {
  // If we already have a heap that is resizeable/growable buffer we don't
  // need to do anything in updateMemoryViews.
  if (HEAP8?.buffer?.resizable) return;
  var b = getMemoryBuffer();
  HEAP8 = new Int8Array(b);
  HEAP16 = new Int16Array(b);
  HEAPU8 = new Uint8Array(b);
  HEAPU16 = new Uint16Array(b);
  HEAP32 = new Int32Array(b);
  HEAPU32 = new Uint32Array(b);
  HEAPF32 = new Float32Array(b);
  HEAPF64 = new Float64Array(b);
  HEAP64 = new BigInt64Array(b);
  
}

// include: memoryprofiler.js
// end include: memoryprofiler.js
// end include: runtime_common.js
assert(globalThis.Int32Array && globalThis.Float64Array && Int32Array.prototype.subarray && Int32Array.prototype.set,
       'JS engine does not provide full typed array support');

function preRun() {
  var preRun = Module['preRun'];
  if (preRun) {
    if (typeof preRun === 'function') preRun = [preRun];
    onPreRuns.push(...preRun);
  }
  consumedModuleProp('preRun');
  // Begin ATPRERUNS hooks
  callRuntimeCallbacks(onPreRuns);
  // End ATPRERUNS hooks
}

function initRuntime() {
  assert(!runtimeInitialized);
  runtimeInitialized = true;

  checkStackCookie();

  // Begin ATINITS hooks
  if (!Module['noFSInit'] && !FS.initialized) FS.init();
TTY.init();
  // End ATINITS hooks

  wasmExports['__wasm_call_ctors']();

  // Begin ATPOSTCTORS hooks
  FS.ignorePermissions = false;
  // End ATPOSTCTORS hooks

  checkStackCookie();
}

function postRun() {
  checkStackCookie();

  var postRun = Module['postRun'];
  if (postRun) {
    if (typeof postRun === 'function') postRun = [postRun];
    onPostRuns.push(...postRun);
  }
  consumedModuleProp('postRun');

  // Begin ATPOSTRUNS hooks
  callRuntimeCallbacks(onPostRuns);
  // End ATPOSTRUNS hooks
}

/**
 * @param {string|number=} what
 */
function abort(what) {
  Module['onAbort']?.(what);

  what = `Aborted(${what})`;
  // TODO(sbc): Should we remove printing and leave it up to whoever
  // catches the exception?
  err(what);

  ABORT = true;

  // Use a wasm runtime error, because a JS error might be seen as a foreign
  // exception, which means we'd run destructors on it. We need the error to
  // simply make the program stop.
  // FIXME This approach does not work in Wasm EH because it currently does not assume
  // all RuntimeErrors are from traps; it decides whether a RuntimeError is from
  // a trap or not based on a hidden field within the object. So at the moment
  // we don't have a way of throwing a wasm trap from JS. TODO Make a JS API that
  // allows this in the wasm spec.
  throw new WebAssembly.RuntimeError(what);
}

function createExportWrapper(name, func, nargs) {
  assert(func);
  return (...args) => {
    assert(runtimeInitialized, `native function \`${name}\` called before runtime initialization`);
    // Only assert for too many arguments. Too few can be valid since the missing arguments will be zero filled.
    assert(args.length <= nargs, `native function \`${name}\` called with ${args.length} args but expects ${nargs}`);
    return func(...args);
  };
}

var wasmBinaryFile;

function findWasmBinary() {
  return locateFile('index.wasm');
}

function getBinarySync(file) {
  if (readBinary) {
    return readBinary(file);
  }
  // Throwing a plain string here, even though it not normally advisable since
  // this gets turning into an `abort` in instantiateArrayBuffer.
  throw 'both async and sync fetching of the wasm failed';
}

async function getWasmBinary(binaryFile) {
  // If we don't have the binary yet, load it asynchronously using readAsync.
  if (!wasmBinary) {
    // Fetch the binary using readAsync
    try {
      // Await so a rejection is caught and falls back to getBinarySync.
      return await readAsync(binaryFile);
    } catch {
      // Fall back to getBinarySync below;
    }
  }

  // Otherwise, getBinarySync should be able to get it synchronously
  return getBinarySync(binaryFile);
}

async function instantiateArrayBuffer(binaryFile, imports) {
  try {
    var binary = await getWasmBinary(binaryFile);
    var instance = await WebAssembly.instantiate(binary, imports);
    return instance;
  } catch (reason) {
    err(`failed to asynchronously prepare wasm: ${reason}`);

    // Warn on some common problems.
    if (isFileURI(binaryFile)) {
      err(`warning: Loading from a file URI (${binaryFile}) is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing`);
    }
    abort(reason);
  }
}

async function instantiateAsync(binary, binaryFile, imports) {
  if (!binary
      // Don't use streaming for file:// delivered objects in a webview, fetch them synchronously.
      && !isFileURI(binaryFile)
      // Avoid using instantiateStreaming() on Node.js since the `fetch()` API
      // does not support `file://` URLs.
      // See: https://github.com/emscripten-core/emscripten/pull/16917
      && !ENVIRONMENT_IS_NODE
     ) {
    try {
      var response = fetch(binaryFile, { credentials: 'same-origin' });
      var instantiationResult = await WebAssembly.instantiateStreaming(response, imports);
      return instantiationResult;
    } catch (reason) {
      // We expect the most common failure cause to be a bad MIME type for the binary,
      // in which case falling back to ArrayBuffer instantiation should work.
      err(`wasm streaming compile failed: ${reason}`);
      err('falling back to ArrayBuffer instantiation');
      // fall back of instantiateArrayBuffer below
    };
  }
  return instantiateArrayBuffer(binaryFile, imports);
}

function getWasmImports() {
  // prepare imports
  var imports = {
    'env': wasmImports,
    'wasi_snapshot_preview1': wasmImports,
  };
  return imports;
}

// Create the wasm instance.
// Receives the wasm imports, returns the exports.
async function createWasm() {
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
  function receiveInstance(instance) {
    wasmExports = instance.exports;

    assignWasmExports(wasmExports);

    updateMemoryViews();

    return wasmExports;
  }

  // Prefer streaming instantiation if available.
  // Async compilation can be confusing when an error on the page overwrites Module
  // (for example, if the order of elements is wrong, and the one defining Module is
  // later), so we save Module and check it later.
  var trueModule = Module;
  function receiveInstantiationResult(result) {
    // 'result' is a ResultObject object which has both the module and instance.
    // receiveInstance() will swap in the exports (to Module.asm) so they can be called
    assert(Module === trueModule, 'the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?');
    trueModule = null;
    // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193, the above line no longer optimizes out down to the following line.
    // When the regression is fixed, can restore the above PTHREADS-enabled path.
    return receiveInstance(result['instance']);
  }

  var info = getWasmImports();

  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to
  // run the instantiation parallel to any other async startup actions they are
  // performing.
  // Also pthreads and wasm workers initialize the wasm instance through this
  // path.
  var instantiateWasm = Module['instantiateWasm'];
  if (instantiateWasm) {
    return new Promise((resolve) => {
      try {
        instantiateWasm(info, (inst) => resolve(receiveInstance(inst)));
      } catch(e) {
        err(`Module.instantiateWasm callback failed with error: ${e}`);
        throw e;
      }
    });
  }

  wasmBinaryFile ??= findWasmBinary();
  var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info);
  var exports = receiveInstantiationResult(result);
  return exports;
}

// end include: preamble.js

// Begin JS library code

  class ExitStatus {
      name = 'ExitStatus';
      constructor(status) {
        this.message = `Program terminated with exit(${status})`;
        this.status = status;
      }
    }
  /** @type {!Int32Array} */
  var HEAP32;
  /** @type {!Int8Array} */
  var HEAP8;
  /** @type {!Uint32Array} */
  var HEAPU32;
  var callRuntimeCallbacks = (callbacks) => {
      while (callbacks.length > 0) {
        // Pass the module as the first argument.
        callbacks.shift()(Module);
      }
    };
  var onPostRuns = [];
  var addOnPostRun = (cb) => onPostRuns.push(cb);
  var onPreRuns = [];
  var addOnPreRun = (cb) => onPreRuns.push(cb);

  var noExitRuntime = true;
  function ptrToString(ptr) {
      assert(typeof ptr === 'number', `ptrToString expects a number, got ${typeof ptr}`);
      // Convert to 32-bit unsigned value
      ptr >>>= 0;
      return '0x' + ptr.toString(16).padStart(8, '0');
    }
  var stackRestore = (val) => __emscripten_stack_restore(val);
  var stackSave = () => _emscripten_stack_get_current();
  var warnOnce = (text) => {
      warnOnce.shown ||= {};
      if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        if (ENVIRONMENT_IS_NODE) text = 'warning: ' + text;
        err(text);
      }
    };

  var ERRNO_CODES = {
      'EPERM': 63,
      'ENOENT': 44,
      'ESRCH': 71,
      'EINTR': 27,
      'EIO': 29,
      'ENXIO': 60,
      'E2BIG': 1,
      'ENOEXEC': 45,
      'EBADF': 8,
      'ECHILD': 12,
      'EAGAIN': 6,
      'EWOULDBLOCK': 6,
      'ENOMEM': 48,
      'EACCES': 2,
      'EFAULT': 21,
      'ENOTBLK': 105,
      'EBUSY': 10,
      'EEXIST': 20,
      'EXDEV': 75,
      'ENODEV': 43,
      'ENOTDIR': 54,
      'EISDIR': 31,
      'EINVAL': 28,
      'ENFILE': 41,
      'EMFILE': 33,
      'ENOTTY': 59,
      'ETXTBSY': 74,
      'EFBIG': 22,
      'ENOSPC': 51,
      'ESPIPE': 70,
      'EROFS': 69,
      'EMLINK': 34,
      'EPIPE': 64,
      'EDOM': 18,
      'ERANGE': 68,
      'ENOMSG': 49,
      'EIDRM': 24,
      'ECHRNG': 106,
      'EL2NSYNC': 156,
      'EL3HLT': 107,
      'EL3RST': 108,
      'ELNRNG': 109,
      'EUNATCH': 110,
      'ENOCSI': 111,
      'EL2HLT': 112,
      'EDEADLK': 16,
      'ENOLCK': 46,
      'EBADE': 113,
      'EBADR': 114,
      'EXFULL': 115,
      'ENOANO': 104,
      'EBADRQC': 103,
      'EBADSLT': 102,
      'EDEADLOCK': 16,
      'EBFONT': 101,
      'ENOSTR': 100,
      'ENODATA': 116,
      'ETIME': 117,
      'ENOSR': 118,
      'ENONET': 119,
      'ENOPKG': 120,
      'EREMOTE': 121,
      'ENOLINK': 47,
      'EADV': 122,
      'ESRMNT': 123,
      'ECOMM': 124,
      'EPROTO': 65,
      'EMULTIHOP': 36,
      'EDOTDOT': 125,
      'EBADMSG': 9,
      'ENOTUNIQ': 126,
      'EBADFD': 127,
      'EREMCHG': 128,
      'ELIBACC': 129,
      'ELIBBAD': 130,
      'ELIBSCN': 131,
      'ELIBMAX': 132,
      'ELIBEXEC': 133,
      'ENOSYS': 52,
      'ENOTEMPTY': 55,
      'ENAMETOOLONG': 37,
      'ELOOP': 32,
      'EOPNOTSUPP': 138,
      'EPFNOSUPPORT': 139,
      'ECONNRESET': 15,
      'ENOBUFS': 42,
      'EAFNOSUPPORT': 5,
      'EPROTOTYPE': 67,
      'ENOTSOCK': 57,
      'ENOPROTOOPT': 50,
      'ESHUTDOWN': 140,
      'ECONNREFUSED': 14,
      'EADDRINUSE': 3,
      'ECONNABORTED': 13,
      'ENETUNREACH': 40,
      'ENETDOWN': 38,
      'ETIMEDOUT': 73,
      'EHOSTDOWN': 142,
      'EHOSTUNREACH': 23,
      'EINPROGRESS': 26,
      'EALREADY': 7,
      'EDESTADDRREQ': 17,
      'EMSGSIZE': 35,
      'EPROTONOSUPPORT': 66,
      'ESOCKTNOSUPPORT': 137,
      'EADDRNOTAVAIL': 4,
      'ENETRESET': 39,
      'EISCONN': 30,
      'ENOTCONN': 53,
      'ETOOMANYREFS': 141,
      'EUSERS': 136,
      'EDQUOT': 19,
      'ESTALE': 72,
      'ENOTSUP': 138,
      'ENOMEDIUM': 148,
      'EILSEQ': 25,
      'EOVERFLOW': 61,
      'ECANCELED': 11,
      'ENOTRECOVERABLE': 56,
      'EOWNERDEAD': 62,
      'ESTRPIPE': 135,
    };
  const FS_MAX_OPEN_FDS = 4096;
  var FS_createDataFile = (...args) => FS.createDataFile(...args);
  var preloadPlugins = [];
  var FS_handledByPreloadPlugin = async (byteArray, fullname) => {
      // Ensure plugins are ready.
      if (typeof Browser !== 'undefined') Browser.init();
  
      for (var plugin of preloadPlugins) {
        if (plugin['canHandle'](fullname)) {
          assert(plugin['handle'].constructor.name === 'AsyncFunction', 'Filesystem plugin handlers must be async functions (See #24914)')
          return plugin['handle'](byteArray, fullname);
        }
      }
      // If no plugin handled this file then return the original/unmodified
      // byteArray.
      return byteArray;
    };
  var PATH = {
  isAbs:(path) => path.charAt(0) === '/',
  splitPath:(filename) => {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },
  normalizeArray:(parts, allowAboveRoot) => {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up; up--) {
            parts.unshift('..');
          }
        }
        return parts;
      },
  normalize:(path) => {
        var isAbsolute = PATH.isAbs(path),
            trailingSlash = path.slice(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter((p) => !!p), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },
  dirname:(path) => {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.slice(0, -1);
        }
        return root + dir;
      },
  basename:(path) => path && path.match(/([^\/]+|\/)\/*$/)[1],
join:(...paths) => PATH.normalize(paths.join('/')),
join2:(l, r) => PATH.normalize(l + '/' + r),
};
var PATH_FS = {
resolve:(...args) => {
      var resolvedPath = '',
        resolvedAbsolute = false;
      for (var i = args.length - 1; i >= -1 && !resolvedAbsolute; i--) {
        var path = (i >= 0) ? args[i] : FS.cwd();
        // Skip empty and invalid entries
        if (typeof path !== 'string') {
          throw new TypeError('Arguments to path.resolve must be strings');
        } else if (!path) {
          return ''; // an invalid portion invalidates the whole thing
        }
        resolvedPath = path + '/' + resolvedPath;
        resolvedAbsolute = PATH.isAbs(path);
      }
      // At this point the path should be resolved to a full absolute path, but
      // handle relative paths to be safe (might happen when process.cwd() fails)
      resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter((p) => !!p), !resolvedAbsolute).join('/');
      return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
    },
relative:(from, to) => {
      from = PATH_FS.resolve(from).slice(1);
      to = PATH_FS.resolve(to).slice(1);
      function trim(arr) {
        var start = 0;
        for (; start < arr.length; start++) {
          if (arr[start] !== '') break;
        }
        var end = arr.length - 1;
        for (; end >= 0; end--) {
          if (arr[end] !== '') break;
        }
        if (start > end) return [];
        return arr.slice(start, end - start + 1);
      }
      var fromParts = trim(from.split('/'));
      var toParts = trim(to.split('/'));
      var length = Math.min(fromParts.length, toParts.length);
      var samePartsLength = length;
      for (var i = 0; i < length; i++) {
        if (fromParts[i] !== toParts[i]) {
          samePartsLength = i;
          break;
        }
      }
      var outputParts = [];
      for (var i = samePartsLength; i < fromParts.length; i++) {
        outputParts.push('..');
      }
      outputParts = outputParts.concat(toParts.slice(samePartsLength));
      return outputParts.join('/');
    },
};
var dependenciesPromise = null;
var dependenciesPromiseResolve = null;
var resolveRunDependencies = async () => dependenciesPromise;
var runDependencies = 0;
var runDependencyTracking = {
};
var runDependencyWatcher = null;
var removeRunDependency = (id) => {
    runDependencies--;

    Module['monitorRunDependencies']?.(runDependencies);

    assert(id, 'removeRunDependency requires an ID');
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
    if (!runDependencies) {
      if (runDependencyWatcher !== null) {
        clearInterval(runDependencyWatcher);
        runDependencyWatcher = null;
      }
      dependenciesPromiseResolve();
    }
  };
var addRunDependency = (id) => {
    if (!runDependencies) {
      dependenciesPromise = new Promise((resolve) => dependenciesPromiseResolve = resolve);
    }
    runDependencies++;

    Module['monitorRunDependencies']?.(runDependencies);

    assert(id, 'addRunDependency requires an ID')
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (!runDependencyWatcher && globalThis.setInterval) {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(() => {
        if (ABORT) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
          return;
        }
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            err('still waiting on run dependencies:');
          }
          err(`dependency: ${dep}`);
        }
        if (shown) {
          err('(end of list)');
        }
      }, 10_000);
      // Prevent this timer from keeping the runtime alive if nothing
      // else is.
      runDependencyWatcher.unref?.()
    }
  };
var asyncLoad = async (url) => {
    var arrayBuffer = await readAsync(url);
    assert(arrayBuffer, `Loading data file "${url}" failed (no arrayBuffer).`);
    return new Uint8Array(arrayBuffer);
  };
var getUniqueRunDependency = (id) => {
    var orig = id;
    while (1) {
      if (!runDependencyTracking[id]) return id;
      id = orig + Math.random();
    }
  };
var FS_preloadFile = async (parent, name, url, canRead = undefined, canWrite = undefined, dontCreateFile = undefined, canOwn = undefined, preFinish = undefined) => {
    // TODO we should allow people to just pass in a complete filename instead
    // of parent and name being that we just join them anyways
    var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
    var dep = getUniqueRunDependency(`cp ${fullname}`); // might have several active requests for the same fullname
    addRunDependency(dep);

    try {
      var byteArray = url;
      if (typeof url === 'string') {
        byteArray = await asyncLoad(url);
      }

      byteArray = await FS_handledByPreloadPlugin(byteArray, fullname);
      preFinish?.();
      if (!dontCreateFile) {
        FS_createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
      }
    } finally {
      removeRunDependency(dep);
    }
  };
var FS_createPreloadedFile = (parent, name, url, canRead = undefined, canWrite = undefined, onload = undefined, onerror = undefined, dontCreateFile = undefined, canOwn = undefined, preFinish = undefined) => {
    FS_preloadFile(parent, name, url, canRead, canWrite, dontCreateFile, canOwn, preFinish).then(onload).catch(onerror);
  };
var lengthBytesUTF8 = (str) => {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
      var u = str.codePointAt(i);
      if (u <= 0x7F) {
        len++;
      } else if (u <= 0x7FF) {
        len += 2;
      } else if (u <= 0xFFFF) {
        len += 3;
      } else {
        len += 4;
        // Gotcha: if codePoint is over 0xFFFF, it is represented as a surrogate pair in UTF-16.
        // We need to manually skip over the second code unit for correct iteration.
        i++;
      }
    }
    return len;
  };
var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
    assert(typeof str === 'string', `stringToUTF8Array expects a string (got ${typeof str})`);
    // Parameter maxBytesToWrite is not optional. Negative values, 0, null,
    // undefined and false each don't write out any bytes.
    if (!(maxBytesToWrite > 0))
      return 0;

    var startIdx = outIdx;
    var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
    for (var i = 0; i < str.length; ++i) {
      // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description
      // and https://www.ietf.org/rfc/rfc2279.txt
      // and https://tools.ietf.org/html/rfc3629
      var u = str.codePointAt(i);
      if (u <= 0x7F) {
        if (outIdx >= endIdx) break;
        heap[outIdx++] = u;
      } else if (u <= 0x7FF) {
        if (outIdx + 1 >= endIdx) break;
        heap[outIdx++] = 0xC0 | (u >> 6);
        heap[outIdx++] = 0x80 | (u & 63);
      } else if (u <= 0xFFFF) {
        if (outIdx + 2 >= endIdx) break;
        heap[outIdx++] = 0xE0 | (u >> 12);
        heap[outIdx++] = 0x80 | ((u >> 6) & 63);
        heap[outIdx++] = 0x80 | (u & 63);
      } else {
        if (outIdx + 3 >= endIdx) break;
        if (u > 0x10FFFF) warnOnce(`Invalid Unicode code point ${ptrToString(u)} encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x10FFFF).`);
        heap[outIdx++] = 0xF0 | (u >> 18);
        heap[outIdx++] = 0x80 | ((u >> 12) & 63);
        heap[outIdx++] = 0x80 | ((u >> 6) & 63);
        heap[outIdx++] = 0x80 | (u & 63);
        // Gotcha: if codePoint is over 0xFFFF, it is represented as a surrogate pair in UTF-16.
        // We need to manually skip over the second code unit for correct iteration.
        i++;
      }
    }
    // Null-terminate the pointer to the buffer.
    heap[outIdx] = 0;
    return outIdx - startIdx;
  };
/** @type {function(string, boolean=, number=)} */
  var intArrayFromString = (stringy, dontAddNull, length) => {
      var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
      var u8array = new Array(len);
      var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
      if (dontAddNull) u8array.length = numBytesWritten;
      return u8array;
    };
  var FS_fileDataToTypedArray = (data) => {
      if (typeof data === 'string') {
        data = intArrayFromString(data, true);
      }
      if (!data.subarray) {
        data = new Uint8Array(data);
      }
      return data;
    };
  var FS_getMode = (canRead, canWrite) => {
      var mode = 0;
      if (canRead) mode |= 292 | 73;
      if (canWrite) mode |= 146;
      return mode;
    };
  var FS_modeStringToFlags = (str) => {
      if (typeof str !== 'string') return str;
      var flagModes = {
        'r': 0,
        'r+': 2,
        'w': 512 | 64 | 1,
        'w+': 512 | 64 | 2,
        'a': 1024 | 64 | 1,
        'a+': 1024 | 64 | 2,
      };
      var flags = flagModes[str];
      if (typeof flags === 'undefined') {
        throw new Error(`Unknown file open mode: ${str}`);
      }
      return flags;
    };
  var mmapAlloc = (size) => {
      abort('internal error: mmapAlloc called but `emscripten_builtin_memalign` native symbol not exported');
    };
  var MEMFS = {
  ops_table:null,
  mount(mount) {
        return MEMFS.createNode(null, '/', 16895, 0);
      },
  createNode(parent, name, mode, dev = undefined) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // not supported
          throw new FS.ErrnoError(63);
        }
        MEMFS.ops_table ||= {
          dir: {
            node: {
              getattr: MEMFS.node_ops.getattr,
              setattr: MEMFS.node_ops.setattr,
              lookup: MEMFS.node_ops.lookup,
              mknod: MEMFS.node_ops.mknod,
              rename: MEMFS.node_ops.rename,
              unlink: MEMFS.node_ops.unlink,
              rmdir: MEMFS.node_ops.rmdir,
              readdir: MEMFS.node_ops.readdir,
              symlink: MEMFS.node_ops.symlink
            },
            stream: {
              llseek: MEMFS.stream_ops.llseek
            }
          },
          file: {
            node: {
              getattr: MEMFS.node_ops.getattr,
              setattr: MEMFS.node_ops.setattr
            },
            stream: {
              llseek: MEMFS.stream_ops.llseek,
              read: MEMFS.stream_ops.read,
              write: MEMFS.stream_ops.write,
              mmap: MEMFS.stream_ops.mmap,
              msync: MEMFS.stream_ops.msync
            }
          },
          link: {
            node: {
              getattr: MEMFS.node_ops.getattr,
              setattr: MEMFS.node_ops.setattr,
              readlink: MEMFS.node_ops.readlink
            },
            stream: {}
          },
          chrdev: {
            node: {
              getattr: MEMFS.node_ops.getattr,
              setattr: MEMFS.node_ops.setattr
            },
            stream: FS.chrdev_stream_ops
          }
        };
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          // The actual number of bytes used in the typed array, as opposed to
          // contents.length which gives the whole capacity.
          node.usedBytes = 0;
          // The byte data of the file is stored in a typed array.
          // Note: typed arrays are not resizable like normal JS arrays are, so
          // there is a small penalty involved for appending file writes that
          // continuously grow a file similar to std::vector capacity vs used.
          node.contents = MEMFS.emptyFileContents ??= new Uint8Array(0);
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.atime = node.mtime = node.ctime = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
          parent.atime = parent.mtime = parent.ctime = node.atime;
        }
        return node;
      },
  getFileDataAsTypedArray(node) {
        assert(FS.isFile(node.mode), 'getFileDataAsTypedArray called on non-file');
        return node.contents.subarray(0, node.usedBytes); // Make sure to not return excess unused bytes.
      },
  expandFileStorage(node, newCapacity) {
        var prevCapacity = node.contents.length;
        if (prevCapacity >= newCapacity) return; // No need to expand, the storage was already large enough.
        // Don't expand strictly to the given requested limit if it's only a very
        // small increase, but instead geometrically grow capacity.
        // For small filesizes (<1MB), perform size*2 geometric increase, but for
        // large sizes, do a much more conservative size*1.125 increase to avoid
        // overshooting the allocation cap by a very large margin.
        const CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2.0 : 1.125)) >>> 0);
        if (prevCapacity) newCapacity = Math.max(newCapacity, 256); // At minimum allocate 256b for each file when expanding.
        var oldContents = MEMFS.getFileDataAsTypedArray(node);
        node.contents = new Uint8Array(newCapacity); // Allocate new storage.
        node.contents.set(oldContents);
      },
  resizeFileStorage(node, newSize) {
        if (node.usedBytes == newSize) return;
        var oldContents = node.contents;
        node.contents = new Uint8Array(newSize); // Allocate new storage.
        node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes))); // Copy old data over to the new storage.
        node.usedBytes = newSize;
      },
  node_ops:{
  getattr(node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.usedBytes;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.atime);
          attr.mtime = new Date(node.mtime);
          attr.ctime = new Date(node.ctime);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },
  setattr(node, attr) {
          for (const key of ['mode', 'atime', 'mtime', 'ctime']) {
            if (attr[key] != null) {
              node[key] = attr[key];
            }
          }
          if (attr.size !== undefined) {
            MEMFS.resizeFileStorage(node, attr.size);
          }
        },
  lookup(parent, name) {
          throw new FS.ErrnoError(44);
        },
  mknod(parent, name, mode, dev = undefined) {
          return MEMFS.createNode(parent, name, mode, dev);
        },
  rename(old_node, new_dir, new_name) {
          var new_node;
          try {
            new_node = FS.lookupNode(new_dir, new_name);
          } catch (e) {}
          if (new_node && FS.isDir(old_node.mode)) {
            // if we're overwriting a directory at new_name, make sure it's empty.
            for (var i in new_node.contents) {
              throw new FS.ErrnoError(55);
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          new_dir.contents[new_name] = old_node;
          old_node.name = new_name;
          new_dir.ctime = new_dir.mtime = old_node.parent.ctime = old_node.parent.mtime = Date.now();
        },
  unlink(parent, name) {
          delete parent.contents[name];
          parent.ctime = parent.mtime = Date.now();
        },
  rmdir(parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(55);
          }
          delete parent.contents[name];
          parent.ctime = parent.mtime = Date.now();
        },
  readdir(node) {
          return ['.', '..', ...Object.keys(node.contents)];
        },
  symlink(parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 0o777 | 40960, 0);
          node.link = oldpath;
          return node;
        },
  readlink(node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(28);
          }
          return node.link;
        },
  },
  stream_ops:{
  read(stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= stream.node.usedBytes) return 0;
          var size = Math.min(stream.node.usedBytes - position, length);
          assert(size >= 0);
          buffer.set(contents.subarray(position, position + size), offset);
          return size;
        },
  write(stream, buffer, offset, length, position, canOwn) {
          assert(buffer.subarray, 'FS.write expects a TypedArray');
          // If the buffer is located in main memory (HEAP), and if
          // memory can grow, we can't hold on to references of the
          // memory buffer, as they may get invalidated. That means we
          // need to copy its contents.
          if (buffer.buffer === HEAP8.buffer) {
            canOwn = false;
          }
  
          if (!length) return 0;
          var node = stream.node;
          node.mtime = node.ctime = Date.now();
  
          if (canOwn) {
            assert(!position, 'canOwn must imply no weird position inside the file');
            node.contents = buffer.subarray(offset, offset + length);
            node.usedBytes = length;
          } else if (!node.usedBytes && !position) { // If this is a simple first write to an empty file, do a fast set since we don't need to care about old data.
            node.contents = buffer.slice(offset, offset + length);
            node.usedBytes = length;
          } else {
            MEMFS.expandFileStorage(node, position+length);
            // Use typed array write which is available.
            node.contents.set(buffer.subarray(offset, offset + length), position);
            node.usedBytes = Math.max(node.usedBytes, position + length);
          }
          return length;
        },
  llseek(stream, offset, whence) {
          var position = offset;
          if (whence === 1) {
            position += stream.position;
          } else if (whence === 2) {
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.usedBytes;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(28);
          }
          return position;
        },
  mmap(stream, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(43);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if (!(flags & 2) && contents.buffer === HEAP8.buffer) {
            // We can't emulate MAP_SHARED when the file is not backed by the
            // buffer we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            allocated = true;
            ptr = mmapAlloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(48);
            }
            if (contents) {
              // Try to avoid unnecessary slices.
              if (position > 0 || position + length < contents.length) {
                if (contents.subarray) {
                  contents = contents.subarray(position, position + length);
                } else {
                  contents = contents.slice(position, position + length);
                }
              }
              HEAP8.set(contents, ptr);
            }
          }
          return { ptr, allocated };
        },
  msync(stream, buffer, offset, length, mmapFlags) {
          MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
          // should we check if bytesWritten and length are the same?
          return 0;
        },
  },
  };
  var FS_stdin_getChar_buffer = [];
  var FS_stdin_getChar = () => {
      if (!FS_stdin_getChar_buffer.length) {
        var result = null;
        if (ENVIRONMENT_IS_NODE) {
          // we will read data by chunks of BUFSIZE
          var BUFSIZE = 256;
          var buf = Buffer.alloc(BUFSIZE);
          var bytesRead = 0;
  
          try {
            bytesRead = fs.readSync(process.stdin.fd, buf, 0, BUFSIZE);
          } catch(e) {
            // Cross-platform differences: on Windows, reading EOF throws an
            // exception, but on other OSes, reading EOF returns 0. Uniformize
            // behavior by treating the EOF exception to return 0.
            if (e.toString().includes('EOF')) bytesRead = 0;
            else throw e;
          }
  
          if (bytesRead > 0) {
            result = buf.toString('utf-8', 0, bytesRead);
          }
        } else
        if (globalThis.window?.prompt) {
          // Browser.
          result = window.prompt('Input: ');  // returns null on cancel
          if (result !== null) {
            result += '\n';
          }
        } else
        {}
        if (!result) {
          return null;
        }
        FS_stdin_getChar_buffer = intArrayFromString(result, true);
      }
      return FS_stdin_getChar_buffer.shift();
    };
  var UTF8Decoder = globalThis.TextDecoder && new TextDecoder();
  
    /**
   * heapOrArray is either a regular array, or a JavaScript typed array view.
   * @param {number} idx
   * @param {number=} maxBytesToRead
   * @param {boolean=} ignoreNul
   * @return {number}
   */
  var findStringEnd = (heapOrArray, idx, maxBytesToRead, ignoreNul) => {
      var maxIdx = idx + maxBytesToRead;
      if (ignoreNul) return maxIdx;
      // TextDecoder needs to know the byte length in advance, it doesn't stop on
      // null terminator by itself.
      // As a tiny code save trick, compare idx against maxIdx using a negation,
      // so that maxBytesToRead=undefined/NaN means Infinity.
      while (heapOrArray[idx] && !(idx >= maxIdx)) ++idx;
      return idx;
    };
  
    /**
   * Given a pointer 'idx' to a null-terminated UTF8-encoded string in the given
   * array that contains uint8 values, returns a copy of that string as a
   * Javascript String object.
   * heapOrArray is either a regular array, or a JavaScript typed array view.
   * @param {number=} idx
   * @param {number=} maxBytesToRead
   * @param {boolean=} ignoreNul - If true, the function will not stop on a NUL character.
   * @return {string}
   */
  var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead, ignoreNul) => {
  
      var endPtr = findStringEnd(heapOrArray, idx, maxBytesToRead, ignoreNul);
  
      // When using conditional TextDecoder, skip it for short strings as the overhead of the native call is not worth it.
      if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
        return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
      }
      var str = '';
      while (idx < endPtr) {
        // For UTF8 byte structure, see:
        // http://en.wikipedia.org/wiki/UTF-8#Description
        // https://www.ietf.org/rfc/rfc2279.txt
        // https://tools.ietf.org/html/rfc3629
        var u0 = heapOrArray[idx++];
        if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
        var u1 = heapOrArray[idx++] & 63;
        if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
        var u2 = heapOrArray[idx++] & 63;
        if ((u0 & 0xF0) == 0xE0) {
          u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
        } else {
          if ((u0 & 0xF8) != 0xF0) warnOnce(`Invalid UTF-8 leading byte ${ptrToString(u0)} encountered when deserializing a UTF-8 string in wasm memory to a JS string!`);
          u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
        }
  
        if (u0 < 0x10000) {
          str += String.fromCharCode(u0);
        } else {
          var ch = u0 - 0x10000;
          str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
        }
      }
      return str;
    };
  var TTY = {
  ttys:[],
  init() {
        // https://github.com/emscripten-core/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process.stdin.setEncoding('utf8');
        // }
      },
  shutdown() {
        // https://github.com/emscripten-core/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process.stdin.pause();
        // }
      },
  register(dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },
  stream_ops:{
  open(stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(43);
          }
          stream.tty = tty;
          stream.seekable = false;
        },
  close(stream) {
          // flush any pending line data
          stream.tty.ops.fsync(stream.tty);
        },
  fsync(stream) {
          stream.tty.ops.fsync(stream.tty);
        },
  read(stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(60);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(29);
            }
            if (result === undefined && !bytesRead) {
              throw new FS.ErrnoError(6);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
            // We currently only support canonical mode (ICANON), where
            // read(2) returns as soon as a line delimiter is read.
            if (result === 10) break;
          }
          if (bytesRead) {
            stream.node.atime = Date.now();
          }
          return bytesRead;
        },
  write(stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(60);
          }
          try {
            for (var i = 0; i < length; i++) {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            }
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
          if (length) {
            stream.node.mtime = stream.node.ctime = Date.now();
          }
          return i;
        },
  },
  default_tty_ops:{
  get_char(tty) {
          return FS_stdin_getChar();
        },
  put_char(tty, val) {
          if (val === null || val === 10) {
            out(UTF8ArrayToString(tty.output));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val); // val == 0 would cut text output off in the middle.
          }
        },
  fsync(tty) {
          if (tty.output?.length > 0) {
            out(UTF8ArrayToString(tty.output));
            tty.output = [];
          }
        },
  ioctl_tcgets(tty) {
          // typical setting
          return {
            c_iflag: 25856,
            c_oflag: 5,
            c_cflag: 191,
            c_lflag: 35387,
            c_cc: [
              0x03, 0x1c, 0x7f, 0x15, 0x04, 0x00, 0x01, 0x00, 0x11, 0x13, 0x1a, 0x00,
              0x12, 0x0f, 0x17, 0x16, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
              0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            ]
          };
        },
  ioctl_tcsets(tty, optional_actions, data) {
          // currently just ignore
          return 0;
        },
  ioctl_tiocgwinsz(tty) {
          return [24, 80];
        },
  },
  default_tty1_ops:{
  put_char(tty, val) {
          if (val === null || val === 10) {
            err(UTF8ArrayToString(tty.output));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val);
          }
        },
  fsync(tty) {
          if (tty.output?.length > 0) {
            err(UTF8ArrayToString(tty.output));
            tty.output = [];
          }
        },
  },
  };
  var initRandomFill = () => {
      // This block is not needed on v19+ since crypto.getRandomValues is builtin
      if (ENVIRONMENT_IS_NODE) {
        var nodeCrypto = require('node:crypto');
        return (view) => (nodeCrypto.randomFillSync(view), 0);
      }
  
      return (view) => (crypto.getRandomValues(view), 0);
    };
  var randomFill = (view) => (randomFill = initRandomFill())(view);
  /** @type {!Uint8Array} */
  var HEAPU8;
  
    /**
   * Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the
   * emscripten HEAP, returns a copy of that string as a Javascript String object.
   *
   * @param {number} ptr
   * @param {number=} maxBytesToRead - An optional length that specifies the
   *   maximum number of bytes to read. You can omit this parameter to scan the
   *   string until the first 0 byte. If maxBytesToRead is passed, and the string
   *   at [ptr, ptr+maxBytesToReadr[ contains a null byte in the middle, then the
   *   string will cut short at that byte index.
   * @param {boolean=} ignoreNul - If true, the function will not stop on a NUL character.
   * @return {string}
   */
  var UTF8ToString = (ptr, maxBytesToRead, ignoreNul) => {
      assert(typeof ptr === 'number', `UTF8ToString expects a number (got ${typeof ptr})`);
      return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead, ignoreNul) : '';
    };
  var strError = (errno) => UTF8ToString(_strerror(errno));
  var FS = {
  root:null,
  mounts:[],
  devices:{
  },
  streams:[],
  nextInode:1,
  nameTable:[],
  currentPath:"/",
  initialized:false,
  ignorePermissions:true,
  syncFSRequests:0,
  ErrnoError:class extends Error {
        name = 'ErrnoError';
        // We set the `name` property to be able to identify `FS.ErrnoError`
        // - the `name` is a standard ECMA-262 property of error objects. Kind of good to have it anyway.
        // - when using PROXYFS, an error can come from an underlying FS
        // as different FS objects have their own FS.ErrnoError each,
        // the test `err instanceof FS.ErrnoError` won't detect an error coming from another filesystem, causing bugs.
        // we'll use the reliable test `err.name == "ErrnoError"` instead
        constructor(errno) {
          super(runtimeInitialized ? strError(errno) : '');
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
        }
      },
  FSStream:class {
        shared = {};
        get object() {
          return this.node;
        }
        set object(val) {
          this.node = val;
        }
        get isRead() {
          return (this.flags & 2097155) !== 1;
        }
        get isWrite() {
          return (this.flags & 2097155) !== 0;
        }
        get isAppend() {
          return (this.flags & 1024);
        }
        get flags() {
          return this.shared.flags;
        }
        set flags(val) {
          this.shared.flags = val;
        }
        get position() {
          return this.shared.position;
        }
        set position(val) {
          this.shared.position = val;
        }
      },
  FSNode:class {
        node_ops = {};
        stream_ops = {};
        readMode = 292 | 73;
        writeMode = 146;
        mounted = null;
        constructor(parent, name, mode, rdev) {
          if (!parent) {
            parent = this;  // root node sets parent to itself
          }
          this.parent = parent;
          this.mount = parent.mount;
          this.id = FS.nextInode++;
          this.name = name;
          this.mode = mode;
          this.rdev = rdev;
          this.atime = this.mtime = this.ctime = Date.now();
        }
        get read() {
          return (this.mode & this.readMode) === this.readMode;
        }
        set read(val) {
          val ? this.mode |= this.readMode : this.mode &= ~this.readMode;
        }
        get write() {
          return (this.mode & this.writeMode) === this.writeMode;
        }
        set write(val) {
          val ? this.mode |= this.writeMode : this.mode &= ~this.writeMode;
        }
        get isFolder() {
          return FS.isDir(this.mode);
        }
        get isDevice() {
          return FS.isChrdev(this.mode);
        }
        // The per-inode readiness wait-queue. The node carries a Set of listener
        // entries {cb}; producers (SOCKFS, PIPEFS) call notifyListeners on a
        // readiness transition, and poll()/epoll consume it. It lives on the node
        // (not the fd) so dup'd fds share one queue. Only nodes that derive real
        // readiness (sockets, pipes, and an epoll's own node) ever use this -
        // always-ready types (regular files, ttys) never register or notify.
        addListener(cb, exclusive = false) {
          var entry = {cb, exclusive};
          var listeners = (this.listeners ??= new Set());
          listeners.add(entry);
          return {listeners, entry};
        }
        notifyListeners(flags) {
          // Iterates the set without copying, which is safe ONLY under a
          // load-bearing contract that every internal listener must honour:
          //   1. A listener must not run user code synchronously (a poll waiter only
          //      resolves a Promise; an epoll registration only re-lists +
          //      re-notifies; the epoll callback only schedules a tick). User code
          //      runs on a later tick, never inside this loop.
          //   2. A listener may delete entries only from ITS OWN waiter, never from
          //      a sibling node's set that may be mid-iteration. (Deleting an entry
          //      of the set being iterated here is fine - a Set tolerates removal of
          //      a not-yet-visited entry mid-iteration; mutating a *different* node's
          //      set is fine because that set is not being iterated.)
          // Violating either gives silently skipped wakeups that are near-impossible
          // to reproduce. Any new producer/listener must preserve it.
          if (!this.listeners) return;
          // Fire every non-exclusive listener. Among EPOLLEXCLUSIVE registrations
          // (one fd watched by several epolls) wake only one, rotating round-robin
          // per node, to avoid a thundering herd. (Only epoll registrations are ever
          // exclusive; poll waiters and a node's own consumers are not.)
          var excl;
          for (var entry of this.listeners) {
            if (entry.exclusive) (excl ||= []).push(entry);
            else entry.cb(flags);
          }
          if (excl) {
            var i = (this.exclTurn || 0) % excl.length;
            this.exclTurn = i + 1;
            excl[i].cb(flags);
          }
        }
      },
  lookupPath(path, opts = {}) {
        if (!path) {
          throw new FS.ErrnoError(44);
        }
        opts.follow_mount ??= true
  
        if (!PATH.isAbs(path)) {
          path = FS.cwd() + '/' + path;
        }
  
        // limit max consecutive symlinks to SYMLOOP_MAX.
        linkloop: for (var nlinks = 0; nlinks < 40; nlinks++) {
          // split the absolute path
          var parts = path.split('/').filter((p) => !!p);
  
          // start at the root
          var current = FS.root;
          var current_path = '/';
  
          for (var i = 0; i < parts.length; i++) {
            var islast = (i === parts.length-1);
            if (islast && opts.parent) {
              // stop resolving
              break;
            }
  
            if (parts[i] === '.') {
              continue;
            }
  
            if (parts[i] === '..') {
              current_path = PATH.dirname(current_path);
              if (FS.isRoot(current)) {
                path = current_path + '/' + parts.slice(i + 1).join('/');
                // We're making progress here, don't let many consecutive ..'s
                // lead to ELOOP
                nlinks--;
                continue linkloop;
              } else {
                current = current.parent;
              }
              continue;
            }
  
            current_path = PATH.join2(current_path, parts[i]);
            try {
              current = FS.lookupNode(current, parts[i]);
            } catch (e) {
              // if noent_okay is true, suppress a ENOENT in the last component
              // and return an object with an undefined node. This is needed for
              // resolving symlinks in the path when creating a file.
              if ((e?.errno === 44) && islast && opts.noent_okay) {
                return { path: current_path };
              }
              throw e;
            }
  
            // jump to the mount's root node if this is a mountpoint
            if (FS.isMountpoint(current) && (!islast || opts.follow_mount)) {
              current = current.mounted.root;
            }
  
            // by default, lookupPath will not follow a symlink if it is the final path component.
            // setting opts.follow = true will override this behavior.
            if (FS.isLink(current.mode) && (!islast || opts.follow)) {
              if (!current.node_ops.readlink) {
                throw new FS.ErrnoError(52);
              }
              var link = current.node_ops.readlink(current);
              if (!PATH.isAbs(link)) {
                link = PATH.dirname(current_path) + '/' + link;
              }
              path = link + '/' + parts.slice(i + 1).join('/');
              continue linkloop;
            }
          }
          return { path: current_path, node: current };
        }
        throw new FS.ErrnoError(32);
      },
  getPath(node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? `${mount}/${path}` : mount + path;
          }
          path = path ? `${node.name}/${path}` : node.name;
          node = node.parent;
        }
      },
  hashName(parentid, name) {
        var hash = 0;
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },
  hashAddNode(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },
  hashRemoveNode(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },
  lookupNode(parent, name) {
        var errCode = FS.mayLookup(parent);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },
  createNode(parent, name, mode, rdev = undefined) {
        assert(typeof parent === 'object')
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },
  destroyNode(node) {
        FS.hashRemoveNode(node);
      },
  isRoot(node) {
        return node === node.parent;
      },
  isMountpoint(node) {
        return !!node.mounted;
      },
  isFile(mode) {
        return (mode & 61440) === 32768;
      },
  isDir(mode) {
        return (mode & 61440) === 16384;
      },
  isLink(mode) {
        return (mode & 61440) === 40960;
      },
  isChrdev(mode) {
        return (mode & 61440) === 8192;
      },
  isBlkdev(mode) {
        return (mode & 61440) === 24576;
      },
  isFIFO(mode) {
        return (mode & 61440) === 4096;
      },
  isSocket(mode) {
        return (mode & 49152) === 49152;
      },
  flagsToPermissionString(flag) {
        var perms = ['r', 'w', 'rw'][flag & 3];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },
  nodePermissions(node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.includes('r') && !(node.mode & 292)) {
          return 2;
        }
        if (perms.includes('w') && !(node.mode & 146)) {
          return 2;
        }
        if (perms.includes('x') && !(node.mode & 73)) {
          return 2;
        }
        return 0;
      },
  mayLookup(dir) {
        if (!FS.isDir(dir.mode)) return 54;
        var errCode = FS.nodePermissions(dir, 'x');
        if (errCode) return errCode;
        if (!dir.node_ops.lookup) return 2;
        return 0;
      },
  mayCreate(dir, name) {
        if (!FS.isDir(dir.mode)) {
          return 54;
        }
        try {
          var node = FS.lookupNode(dir, name);
          return 20;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },
  mayDelete(dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var errCode = FS.nodePermissions(dir, 'wx');
        if (errCode) {
          return errCode;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return 54;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return 10;
          }
        } else if (FS.isDir(node.mode)) {
          return 31;
        }
        return 0;
      },
  mayOpen(node, flags) {
        if (!node) {
          return 44;
        }
        if (FS.isLink(node.mode)) {
          return 32;
        }
        var mode = FS.flagsToPermissionString(flags);
        if (FS.isDir(node.mode)) {
          // opening for write
          // TODO: check for O_SEARCH? (== search for dir only)
          if (mode !== 'r' || (flags & (512 | 64))) {
            return 31;
          }
        }
        return FS.nodePermissions(node, mode);
      },
  checkOpExists(op, err) {
        if (!op) {
          throw new FS.ErrnoError(err);
        }
        return op;
      },
  nextfd() {
        for (var fd = 0; fd <= FS_MAX_OPEN_FDS; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(33);
      },
  getStreamChecked(fd) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(8);
        }
        return stream;
      },
  getStream:(fd) => FS.streams[fd],
  createStream(stream, fd = -1) {
        assert(fd >= -1);
  
        // clone it, so we can return an instance of FSStream
        stream = Object.assign(new FS.FSStream(), stream);
        if (fd == -1) {
          fd = FS.nextfd();
        }
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },
  closeStream(fd) {
        FS.streams[fd] = null;
      },
  dupStream(origStream, fd = -1) {
        var stream = FS.createStream(origStream, fd);
        stream.stream_ops?.dup?.(stream);
        return stream;
      },
  doSetAttr(stream, node, attr) {
        var setattr = stream?.stream_ops.setattr;
        var arg = setattr ? stream : node;
        setattr ??= node.node_ops.setattr;
        FS.checkOpExists(setattr, 63)
        try {
          setattr(arg, attr);
        } catch (e) {
          if (e instanceof RangeError) {
            throw new FS.ErrnoError(22);
          }
          throw e;
        }
      },
  chrdev_stream_ops:{
  open(stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          stream.stream_ops.open?.(stream);
        },
  llseek() {
          throw new FS.ErrnoError(70);
        },
  },
  major:(dev) => ((dev) >> 8),
  minor:(dev) => ((dev) & 0xff),
  makedev:(ma, mi) => ((ma) << 8 | (mi)),
  registerDevice(dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },
  getDevice:(dev) => FS.devices[dev],
  getMounts(mount) {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push(...m.mounts);
        }
  
        return mounts;
      },
  syncfs(populate, callback) {
        if (typeof populate === 'function') {
          callback = populate;
          populate = false;
        }
  
        FS.syncFSRequests++;
  
        if (FS.syncFSRequests > 1) {
          err(`warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`);
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function doCallback(errCode) {
          assert(FS.syncFSRequests > 0);
          FS.syncFSRequests--;
          return callback(errCode);
        }
  
        function done(errCode) {
          if (errCode) {
            if (!done.errored) {
              done.errored = true;
              return doCallback(errCode);
            }
            return;
          }
          if (++completed >= mounts.length) {
            doCallback(null);
          }
        };
  
        // sync all mounts
        for (var mount of mounts) {
          if (mount.type.syncfs) {
            mount.type.syncfs(mount, populate, done);
          } else {
            done(null);
          }
        }
      },
  mount(type, opts, mountpoint) {
        if (typeof type === 'string') {
          // The filesystem was not included, and instead we have an error
          // message stored in the variable.
          throw type;
        }
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(10);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(54);
          }
        }
  
        var mount = {
          type,
          opts,
          mountpoint,
          mounts: []
        };
  
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
  
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;
  
          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
  
        return mountRoot;
      },
  unmount(mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(28);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        for (var [hash, current] of Object.entries(FS.nameTable)) {
          while (current) {
            var next = current.name_next;
  
            if (mounts.includes(current.mount)) {
              FS.destroyNode(current);
            }
  
            current = next;
          }
        }
  
        // no longer a mountpoint
        node.mounted = null;
  
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
      },
  lookup(parent, name) {
        return parent.node_ops.lookup(parent, name);
      },
  mknod(path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name) {
          throw new FS.ErrnoError(28);
        }
        if (name === '.' || name === '..') {
          throw new FS.ErrnoError(20);
        }
        var errCode = FS.mayCreate(parent, name);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(63);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },
  statfs(path) {
        return FS.statfsNode(FS.lookupPath(path, {follow: true}).node);
      },
  statfsStream(stream) {
        // We keep a separate statfsStream function because noderawfs overrides
        // it. In noderawfs, stream.node is sometimes null. Instead, we need to
        // look at stream.path.
        return FS.statfsNode(stream.node);
      },
  statfsNode(node) {
        // NOTE: None of the defaults here are true. We're just returning safe and
        //       sane values. Currently nodefs and rawfs replace these defaults,
        //       other file systems leave them alone.
        var rtn = {
          bsize: 4096,
          frsize: 4096,
          blocks: 1_000_000,
          bfree: 500_000,
          bavail: 500_000,
          files: FS.nextInode,
          ffree: FS.nextInode - 1,
          fsid: 42,
          flags: 2,
          namelen: 255,
        };
  
        if (node.node_ops.statfs) {
          Object.assign(rtn, node.node_ops.statfs(node.mount.opts.root));
        }
        return rtn;
      },
  create(path, mode = 0o666) {
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },
  mkdir(path, mode = 0o777) {
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },
  mkdirTree(path, mode = 0o777) {
        var dirs = path.split('/');
        var d = '';
        for (var dir of dirs) {
          if (!dir) continue;
          if (d || PATH.isAbs(path)) d += '/';
          d += dir;
          try {
            FS.mkdir(d, mode);
          } catch(e) {
            if (e.errno != 20) throw e;
          }
        }
      },
  mkdev(path, mode, dev = undefined) {
        if (typeof dev === 'undefined') {
          dev = mode;
          mode = 0o666;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },
  symlink(oldpath, newpath) {
        if (!PATH_FS.resolve(oldpath)) {
          throw new FS.ErrnoError(44);
        }
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(44);
        }
        var newname = PATH.basename(newpath);
        var errCode = FS.mayCreate(parent, newname);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(63);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },
  link(oldpath, newpath, flags) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(44);
        }
        var newname = PATH.basename(newpath);
        var errCode = FS.mayCreate(parent, newname);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        // Hardlinks are only supported by filesystem backends that provide a
        // `link` node op (e.g. NODERAWFS backed by the host). NODEFS omits it:
        // a host hardlink cannot be confined to the mount root.
        if (!parent.node_ops.link) {
          throw new FS.ErrnoError(34);
        }
        return parent.node_ops.link(parent, newname, oldpath, flags);
      },
  rename(old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
  
        // let the errors from non existent directories percolate up
        lookup = FS.lookupPath(old_path, { parent: true });
        old_dir = lookup.node;
        lookup = FS.lookupPath(new_path, { parent: true });
        new_dir = lookup.node;
  
        if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(75);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH_FS.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(28);
        }
        // new path should not be an ancestor of the old path
        relative = PATH_FS.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(55);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var errCode = FS.mayDelete(old_dir, old_name, isdir);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        errCode = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(10);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          errCode = FS.nodePermissions(old_dir, 'w');
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
          // The replaced node is stale now. Evict it only after the rename
          // succeeded: backends like NODEFS report node.id as st_ino.
          if (new_node) {
            FS.hashRemoveNode(new_node);
          }
          // update old node (we do this here to avoid each backend
          // needing to)
          old_node.parent = new_dir;
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },
  rmdir(path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, true);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },
  readdir(path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        var readdir = FS.checkOpExists(node.node_ops.readdir, 54);
        return readdir(node);
      },
  unlink(path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(44);
        }
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, false);
        if (errCode) {
          // According to POSIX, we should map EISDIR to EPERM, but
          // we instead do what Linux does (and we must, as we use
          // the musl linux libc).
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },
  readlink(path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
          throw new FS.ErrnoError(44);
        }
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(28);
        }
        return link.node_ops.readlink(link);
      },
  stat(path, dontFollow = false) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        var getattr = FS.checkOpExists(node.node_ops.getattr, 63);
        return getattr(node);
      },
  fstat(fd) {
        var stream = FS.getStreamChecked(fd);
        var node = stream.node;
        var getattr = stream.stream_ops.getattr;
        var arg = getattr ? stream : node;
        getattr ??= node.node_ops.getattr;
        FS.checkOpExists(getattr, 63)
        return getattr(arg);
      },
  lstat(path) {
        return FS.stat(path, true);
      },
  doChmod(stream, node, mode, dontFollow = false) {
        FS.doSetAttr(stream, node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          ctime: Date.now(),
          dontFollow
        });
      },
  chmod(path, mode, dontFollow = false) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        FS.doChmod(null, node, mode, dontFollow);
      },
  lchmod(path, mode) {
        FS.chmod(path, mode, true);
      },
  fchmod(fd, mode) {
        var stream = FS.getStreamChecked(fd);
        FS.doChmod(stream, stream.node, mode, false);
      },
  doChown(stream, node, dontFollow = false) {
        FS.doSetAttr(stream, node, {
          timestamp: Date.now(),
          dontFollow
          // we ignore the uid / gid for now
        });
      },
  chown(path, uid, gid, dontFollow = false) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        FS.doChown(null, node, dontFollow);
      },
  lchown(path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },
  fchown(fd, uid, gid) {
        var stream = FS.getStreamChecked(fd);
        FS.doChown(stream, stream.node, false);
      },
  doTruncate(stream, node, len) {
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(28);
        }
        var errCode = FS.nodePermissions(node, 'w');
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        FS.doSetAttr(stream, node, {
          size: len,
          timestamp: Date.now()
        });
      },
  truncate(path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(28);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        FS.doTruncate(null, node, len);
      },
  ftruncate(fd, len) {
        var stream = FS.getStreamChecked(fd);
        if (len < 0 || (stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(28);
        }
        FS.doTruncate(stream, stream.node, len);
      },
  utime(path, atime, mtime, dontFollow = false) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        FS.doSetAttr(null, lookup.node, {
          atime: atime,
          mtime: mtime,
          dontFollow
        });
      },
  open(path, flags, mode = 0o666) {
        if (path === '') {
          throw new FS.ErrnoError(44);
        }
        flags = FS_modeStringToFlags(flags);
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        var isDirPath;
        if (typeof path === 'object') {
          node = path;
        } else {
          isDirPath = path.endsWith('/');
          // noent_okay makes it so that if the final component of the path
          // doesn't exist, lookupPath returns `node: undefined`. `path` will be
          // updated to point to the target of all symlinks.
          var lookup = FS.lookupPath(path, {
            follow: !(flags & 131072),
            noent_okay: true
          });
          node = lookup.node;
          path = lookup.path;
        }
        // perhaps we need to create the node
        var created = false;
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(20);
            }
          } else if (isDirPath) {
            throw new FS.ErrnoError(31);
          } else {
            // node doesn't exist, try to create it
            // Ignore the permission bits here to ensure we can `open` this new
            // file below. We use chmod below to apply the permissions once the
            // file is open.
            node = FS.mknod(path, mode | 0o777, 0);
            created = true;
          }
        }
        if (!node) {
          throw new FS.ErrnoError(44);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // if asked only for a directory, then this must be one
        if ((flags & 65536) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(54);
        }
        // check permissions, if this is not a file we just created now (it is ok to
        // create and write to a file with read-only permissions; it is read-only
        // for later use)
        if (!created) {
          var errCode = FS.mayOpen(node, flags);
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
        }
        // do truncation if necessary
        if ((flags & 512) && !created) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512 | 131072);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        });
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (created) {
          FS.chmod(node, mode & 0o777);
        }
        return stream;
      },
  close(stream) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (stream.getdents) stream.getdents = null; // free readdir state
        // The fd is going away: wake anything waiting on it (poll/epoll) with
        // POLLNVAL so a blocking wait unblocks and an epoll registration is evicted
        // on its next derive. Only sockets/pipes/epoll ever carry a wait-queue, so
        // for every other stream (incl. nodeless noderawfs stdio) this is a no-op.
        stream.node?.notifyListeners(32);
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
        stream.fd = null;
      },
  isClosed(stream) {
        return stream.fd === null;
      },
  llseek(stream, offset, whence) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(70);
        }
        if (whence != 0 && whence != 1 && whence != 2) {
          throw new FS.ErrnoError(28);
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position;
      },
  read(stream, buffer, offset, length, position = undefined) {
        assert(offset >= 0);
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(28);
        }
        var seeking = typeof position !== 'undefined';
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(70);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },
  write(stream, buffer, offset, length, position = undefined, canOwn = undefined) {
        assert(offset >= 0);
        assert(buffer.subarray, 'FS.write expects a TypedArray');
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(28);
        }
        if (stream.seekable && stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var seeking = typeof position !== 'undefined';
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(70);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },
  mmap(stream, length, position, prot, flags) {
        // User requests writing to file (prot & PROT_WRITE != 0).
        // Checking if we have permissions to write to the file unless
        // MAP_PRIVATE flag is set. According to POSIX spec it is possible
        // to write to file opened in read-only mode with MAP_PRIVATE flag,
        // as all modifications will be visible only in the memory of
        // the current process.
        if ((prot & 2)
            && !(flags & 2)
            && (stream.flags & 2097155) !== 2) {
          throw new FS.ErrnoError(2);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(2);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(43);
        }
        if (!length) {
          throw new FS.ErrnoError(28);
        }
        return stream.stream_ops.mmap(stream, length, position, prot, flags);
      },
  msync(stream, buffer, offset, length, mmapFlags) {
        assert(offset >= 0);
        if (!stream.stream_ops.msync) {
          return 0;
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
      },
  ioctl(stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(59);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },
  readFile(path, opts = {}) {
        opts.flags ??= 0;
        opts.encoding ??= 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          abort(`Invalid encoding type "${opts.encoding}"`);
        }
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          buf = UTF8ArrayToString(buf);
        }
        FS.close(stream);
        return buf;
      },
  writeFile(path, data, opts = {}) {
        opts.flags ??= 577;
        var stream = FS.open(path, opts.flags, opts.mode);
        data = FS_fileDataToTypedArray(data);
        FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
        FS.close(stream);
      },
  cwd:() => FS.currentPath,
  chdir(path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (lookup.node === null) {
          throw new FS.ErrnoError(44);
        }
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(54);
        }
        var errCode = FS.nodePermissions(lookup.node, 'x');
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        FS.currentPath = lookup.path;
      },
  createDefaultDirectories() {
        FS.mkdir('/tmp');
        FS.mkdir('/home');
        FS.mkdir('/home/web_user');
      },
  createDefaultDevices() {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: () => 0,
          write: (stream, buffer, offset, length, pos) => length,
          llseek: () => 0,
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using err() rather than out()
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // setup /dev/[u]random
        // use a buffer to avoid overhead of individual crypto calls per byte
        var randomBuffer = new Uint8Array(1024), randomLeft = 0;
        var randomByte = () => {
          if (!randomLeft) {
            randomFill(randomBuffer);
            randomLeft = randomBuffer.byteLength;
          }
          return randomBuffer[--randomLeft];
        };
        FS.createDevice('/dev', 'random', randomByte);
        FS.createDevice('/dev', 'urandom', randomByte);
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },
  createSpecialDirectories() {
        // create /proc/self/fd which allows /proc/self/fd/6 => readlink gives the
        // name of the stream for fd 6 (see test_unistd_ttyname)
        FS.mkdir('/proc');
        var proc_self = FS.mkdir('/proc/self');
        FS.mkdir('/proc/self/fd');
        FS.mount({
          mount() {
            var node = FS.createNode(proc_self, 'fd', 16895, 73);
            node.stream_ops = {
              llseek: MEMFS.stream_ops.llseek,
            };
            node.node_ops = {
              lookup(parent, name) {
                var fd = +name;
                var stream = FS.getStreamChecked(fd);
                var ret = {
                  parent: null,
                  mount: { mountpoint: 'fake' },
                  node_ops: { readlink: () => stream.path },
                  id: fd + 1,
                };
                ret.parent = ret; // make it look like a simple root node
                return ret;
              },
              readdir() {
                return Array.from(FS.streams.entries())
                  .filter(([k, v]) => v)
                  .map(([k, v]) => k.toString());
              }
            };
            return node;
          }
        }, {}, '/proc/self/fd');
      },
  createStandardStreams(input, output, error) {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (input) {
          FS.createDevice('/dev', 'stdin', input);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (output) {
          FS.createDevice('/dev', 'stdout', null, output);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (error) {
          FS.createDevice('/dev', 'stderr', null, error);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 0);
        var stdout = FS.open('/dev/stdout', 1);
        var stderr = FS.open('/dev/stderr', 1);
        assert(stdin.fd === 0, `invalid handle for stdin (${stdin.fd})`);
        assert(stdout.fd === 1, `invalid handle for stdout (${stdout.fd})`);
        assert(stderr.fd === 2, `invalid handle for stderr (${stderr.fd})`);
      },
  staticInit() {
        FS.nameTable.length = 4096;
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
      },
  init(input = undefined, output = undefined, error = undefined) {
        assert(!FS.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.initialized = true;
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        input ??= Module['stdin'];
        output ??= Module['stdout'];
        error ??= Module['stderr'];
  
        FS.createStandardStreams(input, output, error);
      },
  quit() {
        FS.initialized = false;
        // force-flush all streams, so we get musl std streams printed out
        _fflush(0);
        // close all of our streams
        for (var stream of FS.streams) {
          if (stream) {
            FS.close(stream);
          }
        }
      },
  analyzePath(path, dontResolveLastLink = false) {
        warnOnce('FS.analyzePath is deprecated; use FS.lookupPath or FS.stat instead');
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },
  createPath(parent, path, canRead = undefined, canWrite = undefined) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            if (e.errno != 20) throw e;
          }
          parent = current;
        }
        return current;
      },
  createFile(parent, name, properties, canRead = undefined, canWrite = undefined) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS_getMode(canRead, canWrite);
        return FS.create(path, mode);
      },
  createDataFile(parent, name, data = undefined, canRead = undefined, canWrite = undefined, canOwn = undefined) {
        var path = name;
        if (parent) {
          parent = typeof parent === 'string' ? parent : FS.getPath(parent);
          path = name ? PATH.join2(parent, name) : parent;
        }
        var mode = FS_getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          data = FS_fileDataToTypedArray(data);
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 577);
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
      },
  createDevice(parent, name, input = undefined, output = undefined) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS_getMode(!!input, !!output);
        FS.createDevice.major ??= 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open(stream) {
            stream.seekable = false;
          },
          close(stream) {
            // flush any pending line data
            if (output?.buffer?.length) {
              output(10);
            }
          },
          read(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
              if (result === undefined && !bytesRead) {
                throw new FS.ErrnoError(6);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.atime = Date.now();
            }
            return bytesRead;
          },
          write(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
            }
            if (length) {
              stream.node.mtime = stream.node.ctime = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },
  forceLoadFile(obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        if (globalThis.XMLHttpRequest) {
          abort('Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.');
        } else { // Command-line.
          try {
            obj.contents = readBinary(obj.url);
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
        }
      },
  createLazyFile(parent, name, url, canRead = undefined, canWrite = undefined) {
        // Lazy chunked Uint8Array (implements get and length from Uint8Array).
        // Actual getting is abstracted away for eventual reuse.
        class LazyUint8Array {
          lengthKnown = false;
          chunks = []; // Loaded chunks. Index is the chunk number
          get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = (idx / this.chunkSize)|0;
            return this.getter(chunkNum)[chunkOffset];
          }
          setDataGetter(getter) {
            this.getter = getter;
          }
          cacheLength() {
            // Find length
            var xhr = new XMLHttpRequest();
            xhr.open('HEAD', url, false);
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) abort(`Couldn't load ${url}. Status: ${xhr.status}`);
            var datalength = Number(xhr.getResponseHeader('Content-length'));
            var header;
            var hasByteServing = (header = xhr.getResponseHeader('Accept-Ranges')) && header === 'bytes';
            var usesGzip = (header = xhr.getResponseHeader('Content-Encoding')) && header === 'gzip';
  
            var chunkSize = 1024*1024; // Chunk size in bytes
  
            if (!hasByteServing) chunkSize = datalength;
  
            // Function to get a range from the remote URL.
            var doXHR = (from, to) => {
              if (from > to) abort(`invalid range (${from}, ${to}) or no bytes requested!`);
              if (to > datalength-1) abort(`only ${datalength} bytes available! programmer error!`);
  
              // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
              var xhr = new XMLHttpRequest();
              xhr.open('GET', url, false);
              if (datalength !== chunkSize) xhr.setRequestHeader('Range', `bytes=${from}-${to}`);
  
              // Some hints to the browser that we want binary data.
              xhr.responseType = 'arraybuffer';
              if (xhr.overrideMimeType) {
                xhr.overrideMimeType('text/plain; charset=x-user-defined');
              }
  
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) abort(`Couldn't load ${url}. Status: ${xhr.status}`);
              if (xhr.response !== undefined) {
                return new Uint8Array(/** @type{Array<number>} */(xhr.response || []));
              }
              return intArrayFromString(xhr.responseText ?? '', true);
            };
            var lazyArray = this;
            lazyArray.setDataGetter((chunkNum) => {
              var start = chunkNum * chunkSize;
              var end = (chunkNum+1) * chunkSize - 1; // including this byte
              end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
              if (typeof lazyArray.chunks[chunkNum] === 'undefined') {
                lazyArray.chunks[chunkNum] = doXHR(start, end);
              }
              if (typeof lazyArray.chunks[chunkNum] === 'undefined') abort('doXHR failed!');
              return lazyArray.chunks[chunkNum];
            });
  
            if (usesGzip || !datalength) {
              // if the server uses gzip or doesn't supply the length, we have to download the whole file to get the (uncompressed) length
              chunkSize = datalength = 1; // this will force getter(0)/doXHR do download the whole file
              datalength = this.getter(0).length;
              chunkSize = datalength;
              out('LazyFiles on gzip forces download of the whole file when length is accessed');
            }
  
            this._length = datalength;
            this._chunkSize = chunkSize;
            this.lengthKnown = true;
          }
          get length() {
            if (!this.lengthKnown) {
              this.cacheLength();
            }
            return this._length;
          }
          get chunkSize() {
            if (!this.lengthKnown) {
              this.cacheLength();
            }
            return this._chunkSize;
          }
        }
  
        if (globalThis.XMLHttpRequest) {
          if (!ENVIRONMENT_IS_WORKER) abort('Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc');
          var lazyArray = new LazyUint8Array();
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // Add a function that defers querying the file size until it is asked the first time.
        Object.defineProperties(node, {
          usedBytes: {
            get: function() { return this.contents.length; }
          }
        });
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        for (const [key, fn] of Object.entries(node.stream_ops)) {
          stream_ops[key] = (...args) => {
            FS.forceLoadFile(node);
            return fn(...args);
          };
        }
        function writeChunks(stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        }
        // use a custom read function
        stream_ops.read = (stream, buffer, offset, length, position) => {
          FS.forceLoadFile(node);
          return writeChunks(stream, buffer, offset, length, position)
        };
        // use a custom mmap function
        stream_ops.mmap = (stream, length, position, prot, flags) => {
          FS.forceLoadFile(node);
          var ptr = mmapAlloc(length);
          if (!ptr) {
            throw new FS.ErrnoError(48);
          }
          writeChunks(stream, HEAP8, ptr, length, position);
          return { ptr, allocated: true };
        };
        node.stream_ops = stream_ops;
        return node;
      },
  };
  /** @type {!Int16Array} */
  var HEAP16;
  /** not-@type {!BigInt64Array} */
  var HEAP64;
  var SYSCALLS = {
  currentUmask:18,
  calculateAt(dirfd, path, allowEmpty = false) {
        if (PATH.isAbs(path)) {
          return path;
        }
        // relative path
        var dir;
        if (dirfd === -100) {
          dir = FS.cwd();
        } else {
          var dirstream = SYSCALLS.getStreamFromFD(dirfd);
          dir = dirstream.path;
        }
        if (path.length == 0) {
          if (!allowEmpty) {
            throw new FS.ErrnoError(44);;
          }
          return dir;
        }
        return dir + '/' + path;
      },
  writeStat(buf, stat) {
        HEAPU32[((buf)>>2)] = stat.dev;
        HEAPU32[(((buf)+(4))>>2)] = stat.mode;
        HEAPU32[(((buf)+(8))>>2)] = stat.nlink;
        HEAPU32[(((buf)+(12))>>2)] = stat.uid;
        HEAPU32[(((buf)+(16))>>2)] = stat.gid;
        HEAPU32[(((buf)+(20))>>2)] = stat.rdev;
        HEAP64[(((buf)+(24))>>3)] = BigInt(stat.size);
        HEAP32[(((buf)+(32))>>2)] = 4096;
        HEAP32[(((buf)+(36))>>2)] = stat.blocks;
        var atime = stat.atime.getTime();
        var mtime = stat.mtime.getTime();
        var ctime = stat.ctime.getTime();
        HEAP64[(((buf)+(40))>>3)] = BigInt(Math.floor(atime / 1000));
        HEAPU32[(((buf)+(48))>>2)] = (atime % 1000) * 1000 * 1000;
        HEAP64[(((buf)+(56))>>3)] = BigInt(Math.floor(mtime / 1000));
        HEAPU32[(((buf)+(64))>>2)] = (mtime % 1000) * 1000 * 1000;
        HEAP64[(((buf)+(72))>>3)] = BigInt(Math.floor(ctime / 1000));
        HEAPU32[(((buf)+(80))>>2)] = (ctime % 1000) * 1000 * 1000;
        HEAP64[(((buf)+(88))>>3)] = BigInt(stat.ino);
        return 0;
      },
  writeStatFs(buf, stats) {
        HEAPU32[(((buf)+(4))>>2)] = stats.bsize;
        HEAPU32[(((buf)+(60))>>2)] = stats.bsize;
        HEAP64[(((buf)+(8))>>3)] = BigInt(stats.blocks);
        HEAP64[(((buf)+(16))>>3)] = BigInt(stats.bfree);
        HEAP64[(((buf)+(24))>>3)] = BigInt(stats.bavail);
        HEAP64[(((buf)+(32))>>3)] = BigInt(stats.files);
        HEAP64[(((buf)+(40))>>3)] = BigInt(stats.ffree);
        HEAPU32[(((buf)+(48))>>2)] = stats.fsid;
        HEAPU32[(((buf)+(64))>>2)] = stats.flags;  // ST_NOSUID
        HEAPU32[(((buf)+(56))>>2)] = stats.namelen;
      },
  doMsync(addr, stream, len, flags, offset) {
        if (!FS.isFile(stream.node.mode)) {
          throw new FS.ErrnoError(43);
        }
        if (flags & 2) {
          // MAP_PRIVATE calls need not to be synced back to underlying fs
          return 0;
        }
        var buffer = HEAPU8.subarray(addr, addr + len);
        FS.msync(stream, buffer, offset, len, flags);
      },
  getStreamFromFD(fd) {
        var stream = FS.getStreamChecked(fd);
        return stream;
      },
  varargs:undefined,
  getStr(ptr) {
        var ret = UTF8ToString(ptr);
        return ret;
      },
  };
  var syscallGetVarargI = () => {
      assert(SYSCALLS.varargs != undefined);
      // the `+` prepended here is necessary to convince the JSCompiler that varargs is indeed a number.
      var ret = HEAP32[((+SYSCALLS.varargs)>>2)];
      SYSCALLS.varargs += 4;
      return ret;
    };
  function ___syscall_fcntl64(fd, cmd, varargs) {
  SYSCALLS.varargs = varargs;
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      switch (cmd) {
        case 0: {
          var arg = syscallGetVarargI();
          if (arg < 0) {
            return -28;
          }
          while (FS.streams[arg]) {
            arg++;
          }
          var newStream;
          newStream = FS.dupStream(stream, arg);
          return newStream.fd;
        }
        case 1:
        case 2:
          return 0;  // FD_CLOEXEC makes no sense for a single process.
        case 3:
          return stream.flags;
        case 4: {
          var arg = syscallGetVarargI();
          var mask = 289792;
          stream.flags = (stream.flags & ~mask) | (arg & mask);
          return 0;
        }
        case 12: {
          var arg = syscallGetVarargP();
          var offset = 0;
          // We're always unlocked.
          HEAP16[(((arg)+(offset))>>1)] = 2;
          return 0;
        }
        case 13:
        case 14:
          // Pretend that the locking is successful. These are process-level locks,
          // and Emscripten programs are a single process. If we supported linking a
          // filesystem between programs, we'd need to do more here.
          // See https://github.com/emscripten-core/emscripten/issues/23697
          return 0;
      }
      return -28;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  
  function ___syscall_fdatasync(fd) {
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      return 0; // we can't do anything synchronously; the in-memory FS is already synced to
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  
  function ___syscall_fstat64(fd, buf) {
  try {
  
      return SYSCALLS.writeStat(buf, FS.fstat(fd));
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  
  function ___syscall_ioctl(fd, op, varargs) {
  SYSCALLS.varargs = varargs;
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      switch (op) {
        case 21509: {
          if (!stream.tty) return -59;
          return 0;
        }
        case 21505: {
          if (!stream.tty) return -59;
          if (stream.tty.ops.ioctl_tcgets) {
            var termios = stream.tty.ops.ioctl_tcgets(stream);
            var argp = syscallGetVarargP();
            HEAP32[((argp)>>2)] = termios.c_iflag || 0;
            HEAP32[(((argp)+(4))>>2)] = termios.c_oflag || 0;
            HEAP32[(((argp)+(8))>>2)] = termios.c_cflag || 0;
            HEAP32[(((argp)+(12))>>2)] = termios.c_lflag || 0;
            for (var i = 0; i < 32; i++) {
              HEAP8[(argp + i)+(17)] = termios.c_cc[i] || 0;
            }
            return 0;
          }
          return 0;
        }
        case 21510:
        case 21511:
        case 21512: {
          if (!stream.tty) return -59;
          return 0; // no-op, not actually adjusting terminal settings
        }
        case 21506:
        case 21507:
        case 21508: {
          if (!stream.tty) return -59;
          if (stream.tty.ops.ioctl_tcsets) {
            var argp = syscallGetVarargP();
            var c_iflag = HEAP32[((argp)>>2)];
            var c_oflag = HEAP32[(((argp)+(4))>>2)];
            var c_cflag = HEAP32[(((argp)+(8))>>2)];
            var c_lflag = HEAP32[(((argp)+(12))>>2)];
            var c_cc = []
            for (var i = 0; i < 32; i++) {
              c_cc.push(HEAP8[(argp + i)+(17)]);
            }
            return stream.tty.ops.ioctl_tcsets(stream.tty, op, { c_iflag, c_oflag, c_cflag, c_lflag, c_cc });
          }
          return 0; // no-op, not actually adjusting terminal settings
        }
        case 21519: {
          if (!stream.tty) return -59;
          var argp = syscallGetVarargP();
          HEAP32[((argp)>>2)] = 0;
          return 0;
        }
        case 21520: {
          if (!stream.tty) return -59;
          return -28; // not supported
        }
        case 21537:
        case 21531: {
          var argp = syscallGetVarargP();
          return FS.ioctl(stream, op, argp);
        }
        case 21523: {
          // TODO: in theory we should write to the winsize struct that gets
          // passed in, but for now musl doesn't read anything on it
          if (!stream.tty) return -59;
          if (stream.tty.ops.ioctl_tiocgwinsz) {
            var winsize = stream.tty.ops.ioctl_tiocgwinsz(stream.tty);
            var argp = syscallGetVarargP();
            HEAP16[((argp)>>1)] = winsize[0];
            HEAP16[(((argp)+(2))>>1)] = winsize[1];
          }
          return 0;
        }
        case 21524: {
          // TODO: technically, this ioctl call should change the window size.
          // but, since emscripten doesn't have any concept of a terminal window
          // yet, we'll just silently throw it away as we do TIOCGWINSZ
          if (!stream.tty) return -59;
          return 0;
        }
        case 21515: {
          if (!stream.tty) return -59;
          return 0;
        }
        default: return -28; // not supported
      }
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  
  function ___syscall_lstat64(path, buf) {
  try {
  
      path = SYSCALLS.getStr(path);
      return SYSCALLS.writeStat(buf, FS.lstat(path));
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  
  function ___syscall_newfstatat(dirfd, path, buf, flags) {
  try {
  
      path = SYSCALLS.getStr(path);
      var nofollow = flags & 256;
      var allowEmpty = flags & 4096;
      flags = flags & (~6400);
      assert(!flags, `unknown flags in __syscall_newfstatat: ${flags}`);
      path = SYSCALLS.calculateAt(dirfd, path, allowEmpty);
      return SYSCALLS.writeStat(buf, nofollow ? FS.lstat(path) : FS.stat(path));
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  
  function ___syscall_openat(dirfd, path, flags, varargs) {
  SYSCALLS.varargs = varargs;
  try {
  
      path = SYSCALLS.getStr(path);
      path = SYSCALLS.calculateAt(dirfd, path);
      var mode = varargs ? syscallGetVarargI() : 0;
      if (flags & 64) {
        mode &= ~SYSCALLS.currentUmask;
      }
      return FS.open(path, flags, mode).fd;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  
  function ___syscall_stat64(path, buf) {
  try {
  
      path = SYSCALLS.getStr(path);
      return SYSCALLS.writeStat(buf, FS.stat(path));
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  
  var __abort_js = () =>
      abort('native code called abort()');
  const INT53_MAX = 9007199254740992;
  const INT53_MIN = -9007199254740992;
  var bigintToI53Checked = (num) => (num < INT53_MIN || num > INT53_MAX) ? NaN : Number(num);
  var checkWasiClock = (clock_id) => clock_id >= 0 && clock_id <= 3;
  const nowIsMonotonic = 1;
  var _emscripten_date_now = () => Date.now();
  var _emscripten_get_now = () => performance.now();
  function _clock_time_get(clk_id, ignored_precision, ptime) {
    ignored_precision = bigintToI53Checked(ignored_precision);
  
  
      if (!checkWasiClock(clk_id)) {
        return 28;
      }
      var now;
      // all wasi clocks but realtime are monotonic
      if (clk_id === 0) {
        now = _emscripten_date_now();
      } else if (nowIsMonotonic) {
        now = _emscripten_get_now();
      } else {
        return 52;
      }
      // "now" is in ms, and wasi times are in ns.
      var nsec = Math.round(now * 1_000_000);
      HEAP64[((ptime)>>3)] = BigInt(nsec);
      return 0;
    ;
  }
  /** @type {function(?, ?): boolean} */
  var hasOwn = Object.hasOwn;
  /** @type {!Float64Array} */
  var HEAPF64;
  const STACK_ALIGN = 16;
  var readEmAsmArgsArray = [];
  var readEmAsmArgs = (sigPtr, buf) => {
      // Nobody should have mutated _readEmAsmArgsArray underneath us to be something else than an array.
      assert(Array.isArray(readEmAsmArgsArray));
      // The input buffer is allocated on the stack, so it must be stack-aligned.
      assert(buf % STACK_ALIGN == 0);
      readEmAsmArgsArray.length = 0;
      var ch;
      // Most arguments are i32s, so shift the buffer pointer so it is a plain
      // index into HEAP32.
      while (ch = HEAPU8[sigPtr++]) {
        var chr = String.fromCharCode(ch);
        var validChars = ['d', 'f', 'i', 'p'];
        // In WASM_BIGINT mode we support passing i64 values as bigint.
        validChars.push('j');
        assert(validChars.includes(chr), `Invalid character ${ch}("${chr}") in readEmAsmArgs! Use only [${validChars}], and do not specify "v" for void return argument.`);
        // Floats are always passed as doubles, so all types except for 'i'
        // are 8 bytes and require alignment.
        var wide = (ch != 105);
        wide &= (ch != 112);
        buf += wide && (buf % 8) ? 4 : 0;
        readEmAsmArgsArray.push(
          // Special case for pointers under wasm64 or CAN_ADDRESS_2GB mode.
          ch == 112 ? HEAPU32[((buf)>>2)] :
          ch == 106 ? HEAP64[((buf)>>3)] :
          ch == 105 ?
            HEAP32[((buf)>>2)] :
            HEAPF64[((buf)>>3)]
        );
        buf += wide ? 8 : 4;
      }
      return readEmAsmArgsArray;
    };
  var runMainThreadEmAsm = (emAsmAddr, sigPtr, argbuf, sync) => {
      var args = readEmAsmArgs(sigPtr, argbuf);
      assert(hasOwn(ASM_CONSTS, emAsmAddr), `No EM_ASM constant found at address ${emAsmAddr}.  The loaded WebAssembly file is likely out of sync with the generated JavaScript.`);
      return ASM_CONSTS[emAsmAddr](...args);
    };
  var _emscripten_asm_const_int_sync_on_main_thread = (emAsmAddr, sigPtr, argbuf) => runMainThreadEmAsm(emAsmAddr, sigPtr, argbuf, 1);
  var runEmAsmFunction = (code, sigPtr, argbuf) => {
      var args = readEmAsmArgs(sigPtr, argbuf);
      assert(hasOwn(ASM_CONSTS, code), `No EM_ASM constant found at address ${code}.  The loaded WebAssembly file is likely out of sync with the generated JavaScript.`);
      return ASM_CONSTS[code](...args);
    };
  var _emscripten_asm_const_int = (code, sigPtr, argbuf) => {
      return runEmAsmFunction(code, sigPtr, argbuf);
    };

  var _emscripten_asm_const_ptr_sync_on_main_thread = (emAsmAddr, sigPtr, argbuf) => runMainThreadEmAsm(emAsmAddr, sigPtr, argbuf, 1);
  var handleException = (e) => {
      // Certain exception types we do not treat as errors since they are used for
      // internal control flow.
      // 1. ExitStatus, which is thrown by exit()
      // 2. "unwind", which is thrown by emscripten_unwind_to_js_event_loop() and others
      //    that wish to return to JS event loop.
      if (e instanceof ExitStatus || e == 'unwind') {
        return EXITSTATUS;
      }
      checkStackCookie();
      if (e instanceof WebAssembly.RuntimeError) {
        if (_emscripten_stack_get_current() <= 0) {
          err('Stack overflow detected.  You can try increasing -sSTACK_SIZE (currently set to 65536)');
        }
      }
      quit_(1, e);
    };
  var runtimeKeepaliveCounter = 0;
  var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;
  var _proc_exit = (code) => {
      EXITSTATUS = code;
      if (!keepRuntimeAlive()) {
        Module['onExit']?.(code);
        ABORT = true;
      }
      quit_(code, new ExitStatus(code));
    };
  /** @param {boolean|number=} implicit */
  var exitJS = (status, implicit) => {
      EXITSTATUS = status;
  
      checkUnflushedContent();
  
      // if exit() was called explicitly, warn the user if the runtime isn't actually being shut down
      if (keepRuntimeAlive() && !implicit) {
        var msg = `program exited (with status: ${status}), but keepRuntimeAlive() is set (counter=${runtimeKeepaliveCounter}) due to an async operation, so halting execution but not exiting the runtime or preventing further async execution (you can use emscripten_force_exit, if you want to force a true shutdown)`;
        err(msg);
      }
  
      _proc_exit(status);
    };
  var maybeExit = () => {
      if (!keepRuntimeAlive()) {
        try {
          _exit(EXITSTATUS);
        } catch (e) {
          handleException(e);
        }
      }
    };
  var callUserCallback = (func, ...args) => {
      if (ABORT) {
        err('user callback triggered after runtime exited or application aborted.  Ignoring.');
        return;
      }
      try {
        return func(...args);
      } catch (e) {
        handleException(e);
      } finally {
        maybeExit();
      }
    };
  var _emscripten_set_main_loop_timing = (mode, value) => {
      MainLoop.timingMode = mode;
      MainLoop.timingValue = value;
  
      if (!MainLoop.func) {
        err('emscripten_set_main_loop_timing: Cannot set timing mode for main loop since a main loop does not exist! Call emscripten_set_main_loop first to set one up.');
        return 1; // Return non-zero on failure, can't set timing mode when there is no main loop.
      }
  
      if (mode == 0) {
        MainLoop.scheduler = function MainLoop_scheduler_setTimeout() {
          var timeUntilNextTick = Math.max(0, MainLoop.tickStartTime + value - _emscripten_get_now())|0;
          setTimeout(MainLoop.runner, timeUntilNextTick); // doing this each time means that on exception, we stop
        };
      } else if (mode == 1) {
        MainLoop.scheduler = function MainLoop_scheduler_rAF() {
          MainLoop.requestAnimationFrame(MainLoop.runner);
        };
      } else {
        assert(mode == 2);
        if (!MainLoop.setImmediate) {
          if (globalThis.scheduler) {
            // Some modern browsers implement scheduler.postTask, but not all.
            MainLoop.setImmediate = scheduler.postTask.bind(scheduler);
          } else if (globalThis.setImmediate) {
            MainLoop.setImmediate = setImmediate;
          } else {
            // Emulate setImmediate. (note: not a complete polyfill, we don't emulate clearImmediate() to keep code size to minimum, since not needed)
            var setImmediates = [];
            var emscriptenMainLoopMessageId = 'setimmediate';
            /** @param {Event} event */
            var MainLoop_setImmediate_messageHandler = (event) => {
              if (event.data === emscriptenMainLoopMessageId) {
                event.stopPropagation();
                setImmediates.shift()();
              }
            };
            addEventListener('message', MainLoop_setImmediate_messageHandler, true);
            MainLoop.setImmediate = /** @type{function(function(): ?, ...?): number} */((func) => {
              setImmediates.push(func);
              if (ENVIRONMENT_IS_WORKER) {
                // The postMessge API in a Worker, sends message to the main
                // thread and does not support the `targetOrigin` (*) argument.
                postMessage(emscriptenMainLoopMessageId);
              } else {
                postMessage(emscriptenMainLoopMessageId, '*');
              }
            });
          }
        }
        MainLoop.scheduler = function MainLoop_scheduler_setImmediate() {
          MainLoop.setImmediate(MainLoop.runner);
        };
      }
      return 0;
    };
  
    /**
   * @param {number=} arg
   * @param {boolean=} noSetTiming
   */
  var setMainLoop = (iterFunc, fps, simulateInfiniteLoop, arg, noSetTiming) => {
      assert(!MainLoop.func, 'emscripten_set_main_loop: there can only be one main loop function at once')
      MainLoop.func = iterFunc;
      MainLoop.arg = arg;
  
      var thisMainLoopId = MainLoop.currentlyRunningMainloop;
      function checkIsRunning() {
        if (thisMainLoopId < MainLoop.currentlyRunningMainloop) {
          maybeExit();
          return false;
        }
        return true;
      }
  
      // We create the loop runner here but it is not actually running until
      // _emscripten_set_main_loop_timing is called (which might happen at a
      // later time).
      MainLoop.runner = function MainLoop_runner() {
        if (ABORT) return;
        if (MainLoop.queue.length > 0) {
          var start = Date.now();
          var blocker = MainLoop.queue.shift();
          blocker.func(blocker.arg);
          if (MainLoop.remainingBlockers) {
            var remaining = MainLoop.remainingBlockers;
            var next = remaining%1 == 0 ? remaining-1 : Math.floor(remaining);
            if (blocker.counted) {
              MainLoop.remainingBlockers = next;
            } else {
              // not counted, but move the progress along a tiny bit
              next = next + 0.5; // do not steal all the next one's progress
              MainLoop.remainingBlockers = (8*remaining + next)/9;
            }
          }
          MainLoop.updateStatus();
  
          // catches pause/resume main loop from blocker execution
          if (!checkIsRunning()) return;
  
          setTimeout(MainLoop.runner, 0);
          return;
        }
  
        // catch pauses from non-main loop sources
        if (!checkIsRunning()) return;
  
        // Implement very basic swap interval control
        MainLoop.currentFrameNumber = MainLoop.currentFrameNumber + 1 | 0;
        if (MainLoop.timingMode == 1 && MainLoop.timingValue > 1 && MainLoop.currentFrameNumber % MainLoop.timingValue != 0) {
          // Not the scheduled time to render this frame - skip.
          MainLoop.scheduler();
          return;
        } else if (MainLoop.timingMode == 0) {
          MainLoop.tickStartTime = _emscripten_get_now();
          if (Module['ctx']) {
            warnOnce('Looks like you are rendering without using requestAnimationFrame for the main loop. You should use 0 for the frame rate in emscripten_set_main_loop in order to use requestAnimationFrame, as that can greatly improve your frame rates!');
          }
        }
  
        MainLoop.runIter(iterFunc);
  
        // catch pauses from the main loop itself
        if (!checkIsRunning()) return;
  
        MainLoop.scheduler();
      }
  
      if (!noSetTiming) {
        if (fps > 0) {
          _emscripten_set_main_loop_timing(0, 1000.0 / fps);
        } else {
          // Do rAF by rendering each frame (no decimating)
          _emscripten_set_main_loop_timing(1, 1);
        }
  
        MainLoop.scheduler();
      }
  
      if (simulateInfiniteLoop) {
        throw 'unwind';
      }
    };
  var MainLoop = {
  func:null,
  scheduler:null,
  currentlyRunningMainloop:0,
  arg:0,
  timingMode:0,
  timingValue:0,
  currentFrameNumber:0,
  queue:[],
  preMainLoop:[],
  postMainLoop:[],
  pause() {
        if (MainLoop.scheduler) {
          MainLoop.scheduler = null;
          // Incrementing this signals the previous main loop that it's now become old, and it must return.
          MainLoop.currentlyRunningMainloop++;
          
        }
      },
  resume() {
        MainLoop.currentlyRunningMainloop++;
        var timingMode = MainLoop.timingMode;
        var timingValue = MainLoop.timingValue;
        var func = MainLoop.func;
        MainLoop.func = null;
        // do not set timing and call scheduler, we will do it on the next lines
        setMainLoop(func, 0, false, MainLoop.arg, true);
        _emscripten_set_main_loop_timing(timingMode, timingValue);
        MainLoop.scheduler();
      },
  updateStatus() {
        if (Module['setStatus']) {
          var message = Module['statusMessage'] || 'Please wait...';
          var remaining = MainLoop.remainingBlockers ?? 0;
          var expected = MainLoop.expectedBlockers ?? 0;
          if (remaining) {
            if (remaining < expected) {
              Module['setStatus'](`${message} (${expected - remaining}/${expected})`);
            } else {
              Module['setStatus'](message);
            }
          } else {
            Module['setStatus']('');
          }
        }
      },
  init() {
      },
  runIter(func) {
        if (ABORT) return;
        for (var pre of MainLoop.preMainLoop) {
          if (pre() === false) {
            return; // |return false| skips a frame
          }
        }
        callUserCallback(func);
        for (var post of MainLoop.postMainLoop) {
          post();
        }
        checkStackCookie();
      },
  nextRAF:0,
  fakeRequestAnimationFrame(func) {
        // try to keep 60fps between calls to here
        var now = Date.now();
        if (!MainLoop.nextRAF) {
          MainLoop.nextRAF = now + 1000/60;
        } else {
          while (now + 2 >= MainLoop.nextRAF) { // fudge a little, to avoid timer jitter causing us to do lots of delay:0
            MainLoop.nextRAF += 1000/60;
          }
        }
        var delay = Math.max(MainLoop.nextRAF - now, 0);
        setTimeout(func, delay);
      },
  requestAnimationFrame(func) {
        if (globalThis.requestAnimationFrame) {
          requestAnimationFrame(func);
        } else {
          MainLoop.fakeRequestAnimationFrame(func);
        }
      },
  };
  var _emscripten_cancel_main_loop = () => {
      MainLoop.pause();
      MainLoop.func = null;
    };

  var JSEvents = {
  removeAllEventListeners() {
        while (JSEvents.eventHandlers.length) {
          JSEvents._removeHandler(JSEvents.eventHandlers.length - 1);
        }
        JSEvents.deferredCalls = [];
      },
  inEventHandler:0,
  deferredCalls:[],
  deferCall(targetFunction, precedence, argsList) {
        function arraysHaveEqualContent(arrA, arrB) {
          if (arrA.length != arrB.length) return false;
  
          for (var i = 0; i < arrA.length; i++) {
            if (arrA[i] != arrB[i]) return false;
          }
          return true;
        }
        // Test if the given call was already queued, and if so, don't add it again.
        for (var call of JSEvents.deferredCalls) {
          if (call.targetFunction == targetFunction && arraysHaveEqualContent(call.argsList, argsList)) {
            return;
          }
        }
        JSEvents.deferredCalls.push({
          targetFunction,
          precedence,
          argsList
        });
  
        JSEvents.deferredCalls.sort((x,y) => x.precedence - y.precedence);
      },
  removeDeferredCalls(targetFunction) {
        JSEvents.deferredCalls = JSEvents.deferredCalls.filter((call) => call.targetFunction != targetFunction);
      },
  canPerformEventHandlerRequests() {
        // Browsers that support navigator.userActivation.isActive: https://developer.mozilla.org/en-US/docs/Web/API/UserActivation/isActive
        if (navigator.userActivation) {
          // Verify against transient activation status from UserActivation API
          // whether it is possible to perform a request here without needing to defer. See
          // https://developer.mozilla.org/en-US/docs/Web/Security/User_activation#transient_activation
          // and https://caniuse.com/mdn-api_useractivation
          return navigator.userActivation.isActive;
        }
  
        return JSEvents.inEventHandler && JSEvents.currentEventHandler.allowsDeferredCalls;
      },
  runDeferredCalls() {
        if (!JSEvents.canPerformEventHandlerRequests()) {
          return;
        }
        var deferredCalls = JSEvents.deferredCalls;
        JSEvents.deferredCalls = [];
        for (var call of deferredCalls) {
          call.targetFunction(...call.argsList);
        }
      },
  eventHandlers:[],
  removeAllHandlersOnTarget:(target, eventTypeString = undefined) => {
        for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
          if (JSEvents.eventHandlers[i].target == target &&
            (!eventTypeString || eventTypeString == JSEvents.eventHandlers[i].eventTypeString)) {
             JSEvents._removeHandler(i--);
           }
        }
      },
  _removeHandler(i) {
        var h = JSEvents.eventHandlers[i];
        h.target.removeEventListener(h.eventTypeString, h.eventListenerFunc, h.useCapture);
        JSEvents.eventHandlers.splice(i, 1);
      },
  registerOrRemoveHandler(eventHandler) {
        if (!eventHandler.target) {
          err('registerOrRemoveHandler: the target element for event handler registration does not exist, when processing the following event handler registration:');
          console.dir(eventHandler);
          return -4;
        }
        if (eventHandler.callbackfunc) {
          eventHandler.eventListenerFunc = function(event) {
            // Increment nesting count for the event handler.
            ++JSEvents.inEventHandler;
            JSEvents.currentEventHandler = eventHandler;
            // Process any old deferred calls the user has placed.
            JSEvents.runDeferredCalls();
            // Process the actual event, calls back to user C code handler.
            eventHandler.handlerFunc(event);
            // Process any new deferred calls that were placed right now from this event handler.
            JSEvents.runDeferredCalls();
            // Out of event handler - restore nesting count.
            --JSEvents.inEventHandler;
          };
  
          eventHandler.target.addEventListener(eventHandler.eventTypeString,
                                               eventHandler.eventListenerFunc,
                                               eventHandler.useCapture);
          JSEvents.eventHandlers.push(eventHandler);
        } else {
          for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
            if (JSEvents.eventHandlers[i].target == eventHandler.target
             && JSEvents.eventHandlers[i].eventTypeString == eventHandler.eventTypeString) {
               JSEvents._removeHandler(i--);
             }
          }
        }
        return 0;
      },
  removeSingleHandler(eventHandler) {
        let success = false;
        for (let i = 0; i < JSEvents.eventHandlers.length; ++i) {
          const handler = JSEvents.eventHandlers[i];
          if (handler.target === eventHandler.target
            && handler.eventTypeId === eventHandler.eventTypeId
            && handler.callbackfunc === eventHandler.callbackfunc
            && handler.userData === eventHandler.userData) {
            // in some very rare cases (ex: Safari / fullscreen events), there is more than 1 handler (eventTypeString is different)
            JSEvents._removeHandler(i--);
            success = true;
          }
        }
        return success ? 0 : -5;
      },
  getNodeNameForTarget(target) {
        if (target == window) return '#window';
        if (target == screen) return '#screen';
        return target?.nodeName ?? '';
      },
  fullscreenEnabled() {
        return document.fullscreenEnabled
        // Safari 13.0.3 on macOS Catalina 10.15.1 still ships with prefixed webkitFullscreenEnabled.
        // TODO: If Safari at some point ships with unprefixed version, update the version check above.
        ?? document.webkitFullscreenEnabled
         ;
      },
  };
  /** @type {Object} */
  var specialHTMLTargets = [0, globalThis.document ?? 0, globalThis.window ?? 0];
  var getBoundingClientRect = (e) => specialHTMLTargets.includes(e) ? {'left':0,'top':0} : e.getBoundingClientRect();
  var stackAlloc = (sz) => __emscripten_stack_alloc(sz);
  var stringToUTF8 = (str, outPtr, maxBytesToWrite) => {
      assert(typeof maxBytesToWrite === 'number', 'stringToUTF8 requires a third parameter that specifies the length of the output buffer');
      return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
    };
  var stringToUTF8OnStack = (str) => {
      var size = lengthBytesUTF8(str) + 1;
      var ret = stackAlloc(size);
      stringToUTF8(str, ret, size);
      return ret;
    };
  var maybeCStringToJsString = (cString) => {
      // 'cString > 2' checks if the input is a number, and isn't of the special
      // values we accept here, EMSCRIPTEN_EVENT_TARGET_* (which map to 0, 1, 2).
      // In other words, if cString > 2 then it's a pointer to a valid place in
      // memory, and points to a C string.
      return cString > 2 ? UTF8ToString(cString) : cString;
    };
  var findEventTarget = (target) => {
      target = maybeCStringToJsString(target);
      var domElement = specialHTMLTargets[target] || globalThis.document?.querySelector(target);
      return domElement;
    };
  var _emscripten_get_canvas_element_size = (target, width, height) => {
      var canvas = findCanvasEventTarget(target);
      if (!canvas) return -4;
      HEAP32[((width)>>2)] = canvas.width;
      HEAP32[((height)>>2)] = canvas.height;
      return 0;
    };
  var getCanvasElementSize = (target) => {
      var sp = stackSave();
      var w = stackAlloc(8);
      var h = w + 4;
  
      var targetInt = stringToUTF8OnStack(target.id);
      _emscripten_get_canvas_element_size(targetInt, w, h);
      var size = [HEAP32[((w)>>2)], HEAP32[((h)>>2)]];
      stackRestore(sp);
      return size;
    };
  var wasmTableMirror = [];
  var getWasmTableEntry = (funcPtr) => {
      var func = wasmTableMirror[funcPtr];
      if (!func) {
        /** @suppress {checkTypes} */
        wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
      }
      /** @suppress {checkTypes} */
      assert(wasmTable.get(funcPtr) == func, 'table mirror is out of date');
      return func;
    };
  var callCanvasResizedCallback = (strategy) => {
      if (strategy.canvasResizedCallback) {
        getWasmTableEntry(strategy.canvasResizedCallback)(37, 0, strategy.canvasResizedCallbackUserData);
      }
    };
  var currentFullscreenStrategy = 0;
  function getFullscreenElement() {
      return document.fullscreenElement
             ?? document.webkitFullscreenElement
             ;
    }
  var _emscripten_set_canvas_element_size = (target, width, height) => {
      var canvas = findCanvasEventTarget(target);
      if (!canvas) return -4;
      canvas.width = width;
      canvas.height = height;
      return 0;
    };
  var setCanvasElementSize = (target, width, height) => {
      if (!target.controlTransferredOffscreen) {
        target.width = width;
        target.height = height;
      } else {
        // This function is being called from high-level JavaScript code instead of asm.js/Wasm,
        // and it needs to synchronously proxy over to another thread, so marshal the string onto the heap to do the call.
        var sp = stackSave();
        var targetInt = stringToUTF8OnStack(target.id);
        _emscripten_set_canvas_element_size(targetInt, width, height);
        stackRestore(sp);
      }
    };
  var registerRestoreOldStyle = (canvas) => {
      var canvasSize = getCanvasElementSize(canvas);
      var oldWidth = canvasSize[0];
      var oldHeight = canvasSize[1];
      var oldCssWidth = canvas.style.width;
      var oldCssHeight = canvas.style.height;
      var oldBackgroundColor = canvas.style.backgroundColor; // Chrome reads color from here.
      var oldDocumentBackgroundColor = document.body.style.backgroundColor; // IE11 reads color from here.
      // Firefox always has black background color.
      var oldPaddingLeft = canvas.style.paddingLeft; // Chrome, FF, Safari
      var oldPaddingRight = canvas.style.paddingRight;
      var oldPaddingTop = canvas.style.paddingTop;
      var oldPaddingBottom = canvas.style.paddingBottom;
      var oldMarginLeft = canvas.style.marginLeft; // IE11
      var oldMarginRight = canvas.style.marginRight;
      var oldMarginTop = canvas.style.marginTop;
      var oldMarginBottom = canvas.style.marginBottom;
      var oldDocumentBodyMargin = document.body.style.margin;
      var oldDocumentOverflow = document.documentElement.style.overflow; // Chrome, Firefox
      var oldDocumentScroll = document.body.scroll; // IE
      var oldImageRendering = canvas.style.imageRendering;
  
      function restoreOldStyle() {
        if (!getFullscreenElement()) {
          document.removeEventListener('fullscreenchange', restoreOldStyle);
  
          document.removeEventListener('webkitfullscreenchange', restoreOldStyle);
  
          setCanvasElementSize(canvas, oldWidth, oldHeight);
  
          canvas.style.width = oldCssWidth;
          canvas.style.height = oldCssHeight;
          canvas.style.backgroundColor = oldBackgroundColor; // Chrome
          // IE11 hack: assigning 'undefined' or an empty string to document.body.style.backgroundColor
          // has no effect, so first assign back the default color before setting the undefined value.
          // Setting undefined value is also important, or otherwise we would later treat that as
          // something that the user had explicitly set so subsequent fullscreen transitions would not
          // set background color properly.
          if (!oldDocumentBackgroundColor) document.body.style.backgroundColor = 'white';
          document.body.style.backgroundColor = oldDocumentBackgroundColor; // IE11
          canvas.style.paddingLeft = oldPaddingLeft; // Chrome, FF, Safari
          canvas.style.paddingRight = oldPaddingRight;
          canvas.style.paddingTop = oldPaddingTop;
          canvas.style.paddingBottom = oldPaddingBottom;
          canvas.style.marginLeft = oldMarginLeft; // IE11
          canvas.style.marginRight = oldMarginRight;
          canvas.style.marginTop = oldMarginTop;
          canvas.style.marginBottom = oldMarginBottom;
          document.body.style.margin = oldDocumentBodyMargin;
          document.documentElement.style.overflow = oldDocumentOverflow; // Chrome, Firefox
          document.body.scroll = oldDocumentScroll; // IE
          canvas.style.imageRendering = oldImageRendering;
          canvas.GLctxObject?.GLctx.viewport(0, 0, oldWidth, oldHeight);
  
          callCanvasResizedCallback(currentFullscreenStrategy);
        }
      }
      document.addEventListener('fullscreenchange', restoreOldStyle);
      document.addEventListener('webkitfullscreenchange', restoreOldStyle);
      return restoreOldStyle;
    };
  var setLetterbox = (element, topBottom, leftRight) => {
      // Cannot use margin to specify letterboxes in FF or Chrome, since those ignore margins in fullscreen mode.
      element.style.paddingLeft = element.style.paddingRight = leftRight + 'px';
      element.style.paddingTop = element.style.paddingBottom = topBottom + 'px';
    };
  var JSEvents_resizeCanvasForFullscreen = (target, strategy) => {
      var restoreOldStyle = registerRestoreOldStyle(target);
      var cssWidth = strategy.softFullscreen ? innerWidth : screen.width;
      var cssHeight = strategy.softFullscreen ? innerHeight : screen.height;
      var rect = getBoundingClientRect(target);
      var windowedCssWidth = rect.width;
      var windowedCssHeight = rect.height;
      var canvasSize = getCanvasElementSize(target);
      var windowedRttWidth = canvasSize[0];
      var windowedRttHeight = canvasSize[1];
  
      if (strategy.scaleMode == 3) {
        setLetterbox(target, (cssHeight - windowedCssHeight) / 2, (cssWidth - windowedCssWidth) / 2);
        cssWidth = windowedCssWidth;
        cssHeight = windowedCssHeight;
      } else if (strategy.scaleMode == 2) {
        if (cssWidth*windowedRttHeight < windowedRttWidth*cssHeight) {
          var desiredCssHeight = windowedRttHeight * cssWidth / windowedRttWidth;
          setLetterbox(target, (cssHeight - desiredCssHeight) / 2, 0);
          cssHeight = desiredCssHeight;
        } else {
          var desiredCssWidth = windowedRttWidth * cssHeight / windowedRttHeight;
          setLetterbox(target, 0, (cssWidth - desiredCssWidth) / 2);
          cssWidth = desiredCssWidth;
        }
      }
  
      // If we are adding padding, must choose a background color or otherwise Chrome will give the
      // padding a default white color. Do it only if user has not customized their own background color.
      target.style.backgroundColor ||= 'black';
      // IE11 does the same, but requires the color to be set in the document body.
      document.body.style.backgroundColor ||= 'black'; // IE11
      // Firefox always shows black letterboxes independent of style color.
  
      target.style.width = cssWidth + 'px';
      target.style.height = cssHeight + 'px';
  
      if (strategy.filteringMode == 1) {
        target.style.imageRendering = 'optimizeSpeed';
        target.style.imageRendering = '-moz-crisp-edges';
        target.style.imageRendering = '-o-crisp-edges';
        target.style.imageRendering = '-webkit-optimize-contrast';
        target.style.imageRendering = 'optimize-contrast';
        target.style.imageRendering = 'crisp-edges';
        target.style.imageRendering = 'pixelated';
      }
  
      var dpiScale = (strategy.canvasResolutionScaleMode == 2) ? devicePixelRatio : 1;
      if (strategy.canvasResolutionScaleMode != 0) {
        var newWidth = (cssWidth * dpiScale)|0;
        var newHeight = (cssHeight * dpiScale)|0;
        setCanvasElementSize(target, newWidth, newHeight);
        target.GLctxObject?.GLctx.viewport(0, 0, newWidth, newHeight);
      }
      return restoreOldStyle;
    };
  var JSEvents_requestFullscreen = (target, strategy) => {
      // EMSCRIPTEN_FULLSCREEN_SCALE_DEFAULT + EMSCRIPTEN_FULLSCREEN_CANVAS_SCALE_NONE is a mode where no extra logic is performed to the DOM elements.
      if (strategy.scaleMode != 0 || strategy.canvasResolutionScaleMode != 0) {
        JSEvents_resizeCanvasForFullscreen(target, strategy);
      }
  
      if (target.requestFullscreen) {
        target.requestFullscreen();
      } else if (target.webkitRequestFullscreen) {
        // Safari didn't Element.requestFullscreen support until 16.4
        // See: https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen
        target.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
      } else {
        return JSEvents.fullscreenEnabled() ? -3 : -1;
      }
  
      currentFullscreenStrategy = strategy;
      callCanvasResizedCallback(strategy);
      return 0;
    };
  var _emscripten_exit_fullscreen = () => {
      if (!JSEvents.fullscreenEnabled()) return -1;
      // Make sure no queued up calls will fire after this.
      JSEvents.removeDeferredCalls(JSEvents_requestFullscreen);
  
      var d = specialHTMLTargets[1];
      if (d.exitFullscreen) {
        d.fullscreenElement && d.exitFullscreen();
      } else if (d.webkitExitFullscreen) {
        d.webkitFullscreenElement && d.webkitExitFullscreen();
      } else {
        return -1;
      }
  
      return 0;
    };
  var requestPointerLock = (target) => {
      if (target.requestPointerLock) {
        target.requestPointerLock();
      } else {
        // document.body is known to accept pointer lock, so use that to differentiate if the user passed a bad element,
        // or if the whole browser just doesn't support the feature.
        if (document.body.requestPointerLock) {
          return -3;
        }
        return -1;
      }
      return 0;
    };
  var _emscripten_exit_pointerlock = () => {
      // Make sure no queued up calls will fire after this.
      JSEvents.removeDeferredCalls(requestPointerLock);
      if (!document.exitPointerLock) return -1;
      document.exitPointerLock();
      return 0;
    };
  var _emscripten_get_device_pixel_ratio = () => {
      return globalThis.devicePixelRatio ?? 1.0;
    };
  var _emscripten_get_element_css_size = (target, width, height) => {
      target = findEventTarget(target);
      if (!target) return -4;
  
      var rect = getBoundingClientRect(target);
      HEAPF64[((width)>>3)] = rect.width;
      HEAPF64[((height)>>3)] = rect.height;
  
      return 0;
    };
  var fillFullscreenChangeEventData = (eventStruct) => {
      var fullscreenElement = getFullscreenElement();
      var isFullscreen = !!fullscreenElement;
      // Assigning a boolean to HEAP32 with expected type coercion.
      /** @suppress{checkTypes} */
      HEAP8[eventStruct] = isFullscreen;
      HEAP8[(eventStruct)+(1)] = JSEvents.fullscreenEnabled();
      // If transitioning to fullscreen, report info about the element that is now fullscreen.
      // If transitioning to windowed mode, report info about the element that just was fullscreen.
      var reportedElement = isFullscreen ? fullscreenElement : JSEvents.previousFullscreenElement;
      var nodeName = JSEvents.getNodeNameForTarget(reportedElement);
      var id = reportedElement?.id ?? '';
      stringToUTF8(nodeName, eventStruct + 2, 128);
      stringToUTF8(id, eventStruct + 130, 128);
      HEAP32[(((eventStruct)+(260))>>2)] = reportedElement?.clientWidth ?? 0;
      HEAP32[(((eventStruct)+(264))>>2)] = reportedElement?.clientHeight ?? 0;
      HEAP32[(((eventStruct)+(268))>>2)] = screen.width;
      HEAP32[(((eventStruct)+(272))>>2)] = screen.height;
      if (isFullscreen) {
        JSEvents.previousFullscreenElement = fullscreenElement;
      }
    };
  var _emscripten_get_fullscreen_status = (fullscreenStatus) => {
      if (!JSEvents.fullscreenEnabled()) return -1;
      fillFullscreenChangeEventData(fullscreenStatus);
      return 0;
    };
  var fillGamepadEventData = (eventStruct, e) => {
      HEAPF64[((eventStruct)>>3)] = e.timestamp;
      for (var i = 0; i < e.axes.length; ++i) {
        HEAPF64[(((eventStruct+i*8)+(16))>>3)] = e.axes[i];
      }
      for (var i = 0; i < e.buttons.length; ++i) {
        HEAP8[(eventStruct+i)+(1040)] = e.buttons[i].pressed;
        HEAPF64[(((eventStruct+i*8)+(528))>>3)] = e.buttons[i].value;
      }
      HEAP8[(eventStruct)+(1104)] = e.connected;
      HEAP32[(((eventStruct)+(1108))>>2)] = e.index;
      HEAP32[(((eventStruct)+(8))>>2)] = e.axes.length;
      HEAP32[(((eventStruct)+(12))>>2)] = e.buttons.length;
      stringToUTF8(e.id, eventStruct + 1112, 64);
      stringToUTF8(e.mapping, eventStruct + 1176, 64);
    };
  var _emscripten_get_gamepad_status = (index, gamepadState) => {
      assert(JSEvents.lastGamepadState, 'emscripten_get_gamepad_status() called before emscripten_sample_gamepad_data()');
      // INVALID_PARAM is returned on a Gamepad index that never was there.
      if (index < 0 || index >= JSEvents.lastGamepadState.length) return -5;
  
      // NO_DATA is returned on a Gamepad index that was removed.
      // For previously disconnected gamepads there should be an empty slot (null/undefined/false) at the index.
      // This is because gamepads must keep their original position in the array.
      // For example, removing the first of two gamepads produces [null/undefined/false, gamepad].
      if (!JSEvents.lastGamepadState[index]) return -7;
  
      fillGamepadEventData(gamepadState, JSEvents.lastGamepadState[index]);
      return 0;
    };
  var _emscripten_get_main_loop_timing = (mode, value) => {
      if (mode) HEAP32[((mode)>>2)] = MainLoop.timingMode;
      if (value) HEAP32[((value)>>2)] = MainLoop.timingValue;
    };

  var _emscripten_get_num_gamepads = () => {
      assert(JSEvents.lastGamepadState, 'emscripten_get_num_gamepads() called before emscripten_sample_gamepad_data()');
      // N.B. Do not call emscripten_get_num_gamepads() unless having first called
      // emscripten_sample_gamepad_data(), and that has returned EMSCRIPTEN_RESULT_SUCCESS.
      // Otherwise the following line will throw an exception.
      return JSEvents.lastGamepadState.length;
    };
  var _emscripten_get_screen_size = (width, height) => {
      HEAP32[((width)>>2)] = screen.width;
      HEAP32[((height)>>2)] = screen.height;
    };
  var getEmscriptenSupportedExtensions = (ctx) => {
      // Restrict the list of advertised extensions to those that we actually
      // support.
      var supportedExtensions = [
        // WebGL 1 extensions
        'ANGLE_instanced_arrays',
        'EXT_blend_minmax',
        'EXT_disjoint_timer_query',
        'EXT_frag_depth',
        'EXT_shader_texture_lod',
        'EXT_sRGB',
        'OES_element_index_uint',
        'OES_fbo_render_mipmap',
        'OES_standard_derivatives',
        'OES_texture_float',
        'OES_texture_half_float',
        'OES_texture_half_float_linear',
        'OES_vertex_array_object',
        'WEBGL_color_buffer_float',
        'WEBGL_depth_texture',
        'WEBGL_draw_buffers',
        // WebGL 1 and WebGL 2 extensions
        'EXT_clip_control',
        'EXT_color_buffer_half_float',
        'EXT_depth_clamp',
        'EXT_float_blend',
        'EXT_polygon_offset_clamp',
        'EXT_texture_compression_bptc',
        'EXT_texture_compression_rgtc',
        'EXT_texture_filter_anisotropic',
        'KHR_parallel_shader_compile',
        'OES_texture_float_linear',
        'WEBGL_blend_func_extended',
        'WEBGL_compressed_texture_astc',
        'WEBGL_compressed_texture_etc',
        'WEBGL_compressed_texture_etc1',
        'WEBGL_compressed_texture_s3tc',
        'WEBGL_compressed_texture_s3tc_srgb',
        'WEBGL_debug_renderer_info',
        'WEBGL_debug_shaders',
        'WEBGL_lose_context',
        'WEBGL_multi_draw',
        'WEBGL_polygon_mode'
      ];
      // .getSupportedExtensions() can return null if context is lost, so coerce to empty array.
      return ctx.getSupportedExtensions()?.filter(ext => supportedExtensions.includes(ext)) ?? [];
    };
  var webgl_enable_ANGLE_instanced_arrays = (ctx) => {
      // Extension available in WebGL 1 from Firefox 26 and Google Chrome 30 onwards. Core feature in WebGL 2.
      var ext = ctx.getExtension('ANGLE_instanced_arrays');
      // Because this extension is a core function in WebGL 2, assign the extension entry points in place of
      // where the core functions will reside in WebGL 2. This way the calling code can call these without
      // having to dynamically branch depending if running against WebGL 1 or WebGL 2.
      if (ext) {
        ctx['vertexAttribDivisor'] = (index, divisor) => ext['vertexAttribDivisorANGLE'](index, divisor);
        ctx['drawArraysInstanced'] = (mode, first, count, primcount) => ext['drawArraysInstancedANGLE'](mode, first, count, primcount);
        ctx['drawElementsInstanced'] = (mode, count, type, indices, primcount) => ext['drawElementsInstancedANGLE'](mode, count, type, indices, primcount);
        return 1;
      }
    };
  var webgl_enable_EXT_clip_control = (ctx) =>
      !!(ctx.extClipControl = ctx.getExtension('EXT_clip_control'));
  var webgl_enable_EXT_polygon_offset_clamp = (ctx) =>
      !!(ctx.extPolygonOffsetClamp = ctx.getExtension('EXT_polygon_offset_clamp'));
  var webgl_enable_OES_vertex_array_object = (ctx) => {
      // Extension available in WebGL 1 from Firefox 25 and WebKit 536.28/desktop Safari 6.0.3 onwards. Core feature in WebGL 2.
      var ext = ctx.getExtension('OES_vertex_array_object');
      if (ext) {
        ctx['createVertexArray'] = () => ext['createVertexArrayOES']();
        ctx['deleteVertexArray'] = (vao) => ext['deleteVertexArrayOES'](vao);
        ctx['bindVertexArray'] = (vao) => ext['bindVertexArrayOES'](vao);
        ctx['isVertexArray'] = (vao) => ext['isVertexArrayOES'](vao);
        return 1;
      }
    };
  var webgl_enable_WEBGL_draw_buffers = (ctx) => {
      // Extension available in WebGL 1 from Firefox 28 onwards. Core feature in WebGL 2.
      var ext = ctx.getExtension('WEBGL_draw_buffers');
      if (ext) {
        ctx['drawBuffers'] = (n, bufs) => ext['drawBuffersWEBGL'](n, bufs);
        return 1;
      }
    };
  var webgl_enable_WEBGL_multi_draw = (ctx) =>
      // Closure is expected to be allowed to minify the '.multiDrawWebgl' property, so not accessing it quoted.
      !!(ctx.multiDrawWebgl = ctx.getExtension('WEBGL_multi_draw'));
  var webgl_enable_WEBGL_polygon_mode = (ctx) =>
      !!(ctx.webglPolygonMode = ctx.getExtension('WEBGL_polygon_mode'));
  var GL = {
  counter:1,
  buffers:[],
  programs:[],
  framebuffers:[],
  renderbuffers:[],
  textures:[],
  shaders:[],
  vaos:[],
  contexts:[],
  offscreenCanvases:{
  },
  queries:[],
  stringCache:{
  },
  unpackAlignment:4,
  unpackRowLength:0,
  recordError:(errorCode) => {
        if (!GL.lastError) {
          GL.lastError = errorCode;
        }
      },
  getNewId:(table) => {
        var ret = GL.counter++;
        for (var i = table.length; i < ret; i++) {
          table[i] = null;
        }
        return ret;
      },
  genObject:(n, buffers, createFunction, objectTable
        ) => {
        for (var i = 0; i < n; i++) {
          var buffer = GLctx[createFunction]();
          var id = buffer && GL.getNewId(objectTable);
          if (buffer) {
            buffer.name = id;
            objectTable[id] = buffer;
          } else {
            GL.recordError(0x502 /* GL_INVALID_OPERATION */);
          }
          HEAP32[(((buffers)+(i*4))>>2)] = id;
        }
      },
  getSource:(shader, count, string, length) => {
        var source = '';
        for (var i = 0; i < count; ++i) {
          var len = length ? HEAPU32[(((length)+(i*4))>>2)] : undefined;
          source += UTF8ToString(HEAPU32[(((string)+(i*4))>>2)], len);
        }
        return source;
      },
  createContext:(/** @type {HTMLCanvasElement} */ canvas, webGLContextAttributes) => {
  
        // BUG: Workaround Safari WebGL issue: After successfully acquiring WebGL
        // context on a canvas, calling .getContext() will always return that
        // context independent of which 'webgl' or 'webgl2'
        // context version was passed. See:
        //   https://webkit.org/b/222758
        // and:
        //   https://github.com/emscripten-core/emscripten/issues/13295.
        // TODO: Once the bug is fixed and shipped in Safari, adjust the Safari
        // version field in above check.
        if (!canvas.getContextSafariWebGL2Fixed) {
          canvas.getContextSafariWebGL2Fixed = canvas.getContext;
          /** @type {function(this:HTMLCanvasElement, string, (Object|null)=): (RenderingContext|null)} */
          function fixedGetContext(ver, attrs) {
            var gl = canvas.getContextSafariWebGL2Fixed(ver, attrs);
            return ((ver == 'webgl') == (gl instanceof WebGLRenderingContext)) ? gl : null;
          }
          canvas.getContext = fixedGetContext;
        }
  
        var ctx =
          canvas.getContext('webgl', webGLContextAttributes);
  
        if (!ctx) return 0;
  
        var handle = GL.registerContext(ctx, webGLContextAttributes);
  
        return handle;
      },
  registerContext:(ctx, webGLContextAttributes) => {
        // without pthreads a context is just an integer ID
        var handle = GL.getNewId(GL.contexts);
  
        var context = {
          handle,
          attributes: webGLContextAttributes,
          version: webGLContextAttributes.majorVersion,
          GLctx: ctx
        };
  
        // Store the created context object so that we can access the context
        // given a canvas without having to pass the parameters again.
        if (ctx.canvas) ctx.canvas.GLctxObject = context;
        GL.contexts[handle] = context;
        if (typeof webGLContextAttributes.enableExtensionsByDefault === 'undefined' || webGLContextAttributes.enableExtensionsByDefault) {
          GL.initExtensions(context);
        }
  
        return handle;
      },
  makeContextCurrent:(contextHandle) => {
  
        // Active Emscripten GL layer context object.
        GL.currentContext = GL.contexts[contextHandle];
        // Active WebGL context object.
        Module['ctx'] = GLctx = GL.currentContext?.GLctx;
        return !(contextHandle && !GLctx);
      },
  getContext:(contextHandle) => {
        return GL.contexts[contextHandle];
      },
  deleteContext:(contextHandle) => {
        if (GL.currentContext === GL.contexts[contextHandle]) {
          GL.currentContext = null;
        }
        if (typeof JSEvents === 'object') {
          // Release all JS event handlers on the DOM element that the GL context is
          // associated with since the context is now deleted.
          JSEvents.removeAllHandlersOnTarget(GL.contexts[contextHandle].GLctx.canvas);
        }
        // Make sure the canvas object no longer refers to the context object so
        // there are no GC surprises.
        if (GL.contexts[contextHandle]?.GLctx.canvas) {
          GL.contexts[contextHandle].GLctx.canvas.GLctxObject = undefined;
        }
        GL.contexts[contextHandle] = null;
      },
  initExtensions:(context) => {
        // If this function is called without a specific context object, init the
        // extensions of the currently active context.
        context ||= GL.currentContext;
  
        if (context.initExtensionsDone) return;
        context.initExtensionsDone = true;
  
        var gl = context.GLctx;
  
        // Detect the presence of a few extensions manually, since the GL interop
        // layer itself will need to know if they exist.
  
        // Extensions that are available in both WebGL 1 and WebGL 2
        webgl_enable_WEBGL_multi_draw(gl);
        webgl_enable_EXT_polygon_offset_clamp(gl);
        webgl_enable_EXT_clip_control(gl);
        webgl_enable_WEBGL_polygon_mode(gl);
        // Extensions that are only available in WebGL 1 (the calls will be no-ops
        // if called on a WebGL 2 context active)
        webgl_enable_ANGLE_instanced_arrays(gl);
        webgl_enable_OES_vertex_array_object(gl);
        webgl_enable_WEBGL_draw_buffers(gl);
        {
          gl.disjointTimerQueryExt = gl.getExtension('EXT_disjoint_timer_query');
        }
  
        for (var ext of getEmscriptenSupportedExtensions(gl)) {
          // WEBGL_lose_context, WEBGL_debug_renderer_info and WEBGL_debug_shaders
          // are not enabled by default.
          if (!ext.includes('lose_context') && !ext.includes('debug')) {
            // Call .getExtension() to enable that extension permanently.
            gl.getExtension(ext);
          }
        }
      },
  };
  var GLctx;
  var _emscripten_glActiveTexture = (x0) => GLctx.activeTexture(x0);
  var _emscripten_glAttachShader = (program, shader) => {
      GLctx.attachShader(GL.programs[program], GL.shaders[shader]);
    };
  var _emscripten_glBeginQueryEXT = (target, id) => {
      GLctx.disjointTimerQueryExt['beginQueryEXT'](target, GL.queries[id]);
    };
  var _emscripten_glBindAttribLocation = (program, index, name) => {
      GLctx.bindAttribLocation(GL.programs[program], index, UTF8ToString(name));
    };
  var _emscripten_glBindBuffer = (target, buffer) => {
  
      GLctx.bindBuffer(target, GL.buffers[buffer]);
    };
  var _emscripten_glBindFramebuffer = (target, framebuffer) => {
  
      GLctx.bindFramebuffer(target, GL.framebuffers[framebuffer]);
  
    };
  var _emscripten_glBindRenderbuffer = (target, renderbuffer) => {
      GLctx.bindRenderbuffer(target, GL.renderbuffers[renderbuffer]);
    };
  var _emscripten_glBindTexture = (target, texture) => {
      GLctx.bindTexture(target, GL.textures[texture]);
    };
  var _emscripten_glBindVertexArray = (vao) => {
      GLctx.bindVertexArray(GL.vaos[vao]);
    };
  var _emscripten_glBlendColor = (x0, x1, x2, x3) => GLctx.blendColor(x0, x1, x2, x3);
  var _emscripten_glBlendEquation = (x0) => GLctx.blendEquation(x0);
  var _emscripten_glBlendEquationSeparate = (x0, x1) => GLctx.blendEquationSeparate(x0, x1);
  var _emscripten_glBlendFunc = (x0, x1) => GLctx.blendFunc(x0, x1);
  var _emscripten_glBlendFuncSeparate = (x0, x1, x2, x3) => GLctx.blendFuncSeparate(x0, x1, x2, x3);
  var _emscripten_glBufferData = (target, size, data, usage) => {
  
      // N.b. here first form specifies a heap subarray, second form an integer
      // size, so the ?: code here is polymorphic. It is advised to avoid
      // randomly mixing both uses in calling code, to avoid any potential JS
      // engine JIT issues.
      GLctx.bufferData(target, data ? HEAPU8.subarray(data, data+size) : size, usage);
    };
  var webglBufferSubData = (target, offset, size, data, src = HEAPU8) => {
      GLctx.bufferSubData(target, offset, src.subarray(data, data + size));
    };
  var _emscripten_glBufferSubData = (target, offset, size, data) => webglBufferSubData(target, offset, size, data);
  var _emscripten_glCheckFramebufferStatus = (x0) => GLctx.checkFramebufferStatus(x0);
  var _emscripten_glClear = (x0) => GLctx.clear(x0);
  var _emscripten_glClearColor = (x0, x1, x2, x3) => GLctx.clearColor(x0, x1, x2, x3);
  var _emscripten_glClearDepthf = (x0) => GLctx.clearDepth(x0);
  var _emscripten_glClearStencil = (x0) => GLctx.clearStencil(x0);
  var _emscripten_glClipControlEXT = (origin, depth) => {
      GLctx.extClipControl['clipControlEXT'](origin, depth);
    };
  var _emscripten_glColorMask = (red, green, blue, alpha) => {
      GLctx.colorMask(!!red, !!green, !!blue, !!alpha);
    };
  var _emscripten_glCompileShader = (shader) => {
      GLctx.compileShader(GL.shaders[shader]);
    };
  var _emscripten_glCompressedTexImage2D = (target, level, internalFormat, width, height, border, imageSize, data) => {
      // `data` may be null here, which means "allocate uninitialized space but
      // don't upload" in GLES parlance, but `compressedTexImage2D` requires the
      // final data parameter, so we simply pass a heap view starting at zero
      // effectively uploading whatever happens to be near address zero.  See
      // https://github.com/emscripten-core/emscripten/issues/19300.
      GLctx.compressedTexImage2D(target, level, internalFormat, width, height, border, HEAPU8.subarray(data, data + imageSize));
    };
  var _emscripten_glCompressedTexSubImage2D = (target, level, xoffset, yoffset, width, height, format, imageSize, data) => {
      GLctx.compressedTexSubImage2D(target, level, xoffset, yoffset, width, height, format, HEAPU8.subarray(data, data + imageSize));
    };
  var _emscripten_glCopyTexImage2D = (x0, x1, x2, x3, x4, x5, x6, x7) => GLctx.copyTexImage2D(x0, x1, x2, x3, x4, x5, x6, x7);
  var _emscripten_glCopyTexSubImage2D = (x0, x1, x2, x3, x4, x5, x6, x7) => GLctx.copyTexSubImage2D(x0, x1, x2, x3, x4, x5, x6, x7);
  var _emscripten_glCreateProgram = () => {
      var id = GL.getNewId(GL.programs);
      var program = GLctx.createProgram();
      // Store additional information needed for each shader program:
      program.name = id;
      // Lazy cache results of
      // glGetProgramiv(GL_ACTIVE_UNIFORM_MAX_LENGTH/GL_ACTIVE_ATTRIBUTE_MAX_LENGTH/GL_ACTIVE_UNIFORM_BLOCK_MAX_NAME_LENGTH)
      program.maxUniformLength = program.maxAttributeLength = program.maxUniformBlockNameLength = 0;
      program.uniformIdCounter = 1;
      GL.programs[id] = program;
      return id;
    };
  var _emscripten_glCreateShader = (shaderType) => {
      var id = GL.getNewId(GL.shaders);
      GL.shaders[id] = GLctx.createShader(shaderType);
  
      return id;
    };
  var _emscripten_glCullFace = (x0) => GLctx.cullFace(x0);
  var _emscripten_glDeleteBuffers = (n, buffers) => {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((buffers)+(i*4))>>2)];
        var buffer = GL.buffers[id];
  
        // From spec: "glDeleteBuffers silently ignores 0's and names that do not
        // correspond to existing buffer objects."
        if (!buffer) continue;
  
        GLctx.deleteBuffer(buffer);
        buffer.name = 0;
        GL.buffers[id] = null;
  
      }
    };
  var _emscripten_glDeleteFramebuffers = (n, framebuffers) => {
      for (var i = 0; i < n; ++i) {
        var id = HEAP32[(((framebuffers)+(i*4))>>2)];
        var framebuffer = GL.framebuffers[id];
        if (!framebuffer) continue; // GL spec: "glDeleteFramebuffers silently ignores 0s and names that do not correspond to existing framebuffer objects".
        GLctx.deleteFramebuffer(framebuffer);
        framebuffer.name = 0;
        GL.framebuffers[id] = null;
      }
    };
  var _emscripten_glDeleteProgram = (id) => {
      if (!id) return;
      var program = GL.programs[id];
      if (!program) {
        // glDeleteProgram actually signals an error when deleting a nonexisting
        // object, unlike some other GL delete functions.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      GLctx.deleteProgram(program);
      program.name = 0;
      GL.programs[id] = null;
    };
  var _emscripten_glDeleteQueriesEXT = (n, ids) => {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((ids)+(i*4))>>2)];
        var query = GL.queries[id];
        if (!query) continue; // GL spec: "unused names in ids are ignored, as is the name zero."
        GLctx.disjointTimerQueryExt['deleteQueryEXT'](query);
        GL.queries[id] = null;
      }
    };
  var _emscripten_glDeleteRenderbuffers = (n, renderbuffers) => {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((renderbuffers)+(i*4))>>2)];
        var renderbuffer = GL.renderbuffers[id];
        if (!renderbuffer) continue; // GL spec: "glDeleteRenderbuffers silently ignores 0s and names that do not correspond to existing renderbuffer objects".
        GLctx.deleteRenderbuffer(renderbuffer);
        renderbuffer.name = 0;
        GL.renderbuffers[id] = null;
      }
    };
  var _emscripten_glDeleteShader = (id) => {
      if (!id) return;
      var shader = GL.shaders[id];
      if (!shader) {
        // glDeleteShader actually signals an error when deleting a nonexisting
        // object, unlike some other GL delete functions.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      GLctx.deleteShader(shader);
      GL.shaders[id] = null;
    };
  var _emscripten_glDeleteTextures = (n, textures) => {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((textures)+(i*4))>>2)];
        var texture = GL.textures[id];
        // GL spec: "glDeleteTextures silently ignores 0s and names that do not
        // correspond to existing textures".
        if (!texture) continue;
        GLctx.deleteTexture(texture);
        texture.name = 0;
        GL.textures[id] = null;
      }
    };
  var _emscripten_glDeleteVertexArrays = (n, vaos) => {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((vaos)+(i*4))>>2)];
        GLctx.deleteVertexArray(GL.vaos[id]);
        GL.vaos[id] = null;
      }
    };
  var _emscripten_glDepthFunc = (x0) => GLctx.depthFunc(x0);
  var _emscripten_glDepthMask = (flag) => {
      GLctx.depthMask(!!flag);
    };
  var _emscripten_glDepthRangef = (x0, x1) => GLctx.depthRange(x0, x1);
  var _emscripten_glDetachShader = (program, shader) => {
      GLctx.detachShader(GL.programs[program], GL.shaders[shader]);
    };
  var _emscripten_glDisable = (x0) => GLctx.disable(x0);
  var _emscripten_glDisableVertexAttribArray = (index) => {
      GLctx.disableVertexAttribArray(index);
    };
  var _emscripten_glDrawArrays = (mode, first, count) => {
  
      GLctx.drawArrays(mode, first, count);
  
    };
  var _emscripten_glDrawArraysInstanced = (mode, first, count, primcount) => {
      GLctx.drawArraysInstanced(mode, first, count, primcount);
    };
  var tempFixedLengthArray = [];
  var _emscripten_glDrawBuffers = (n, bufs) => {
  
      var bufArray = tempFixedLengthArray[n];
      for (var i = 0; i < n; i++) {
        bufArray[i] = HEAP32[(((bufs)+(i*4))>>2)];
      }
  
      GLctx.drawBuffers(bufArray);
    };
  var _emscripten_glDrawElements = (mode, count, type, indices) => {
  
      GLctx.drawElements(mode, count, type, indices);
  
    };
  var _emscripten_glDrawElementsInstanced = (mode, count, type, indices, primcount) => {
      GLctx.drawElementsInstanced(mode, count, type, indices, primcount);
    };
  var _emscripten_glEnable = (x0) => GLctx.enable(x0);
  var _emscripten_glEnableVertexAttribArray = (index) => {
      GLctx.enableVertexAttribArray(index);
    };
  var _emscripten_glEndQueryEXT = (target) => {
      GLctx.disjointTimerQueryExt['endQueryEXT'](target);
    };
  var _emscripten_glFinish = () => GLctx.finish();
  var _emscripten_glFlush = () => GLctx.flush();
  var _emscripten_glFramebufferRenderbuffer = (target, attachment, renderbuffertarget, renderbuffer) => {
      GLctx.framebufferRenderbuffer(target, attachment, renderbuffertarget,
                                         GL.renderbuffers[renderbuffer]);
    };
  var _emscripten_glFramebufferTexture2D = (target, attachment, textarget, texture, level) => {
      GLctx.framebufferTexture2D(target, attachment, textarget,
                                      GL.textures[texture], level);
    };
  var _emscripten_glFrontFace = (x0) => GLctx.frontFace(x0);
  var _emscripten_glGenBuffers = (n, buffers) => {
      GL.genObject(n, buffers, 'createBuffer', GL.buffers
        );
    };
  var _emscripten_glGenFramebuffers = (n, ids) => {
      GL.genObject(n, ids, 'createFramebuffer', GL.framebuffers
        );
    };
  var _emscripten_glGenQueriesEXT = (n, ids) => {
      for (var i = 0; i < n; i++) {
        var query = GLctx.disjointTimerQueryExt['createQueryEXT']();
        if (!query) {
          GL.recordError(0x502 /* GL_INVALID_OPERATION */);
          while (i < n) HEAP32[(((ids)+(i++*4))>>2)] = 0;
          return;
        }
        var id = GL.getNewId(GL.queries);
        query.name = id;
        GL.queries[id] = query;
        HEAP32[(((ids)+(i*4))>>2)] = id;
      }
    };
  var _emscripten_glGenRenderbuffers = (n, renderbuffers) => {
      GL.genObject(n, renderbuffers, 'createRenderbuffer', GL.renderbuffers
        );
    };
  var _emscripten_glGenTextures = (n, textures) => {
      GL.genObject(n, textures, 'createTexture', GL.textures
        );
    };
  var _emscripten_glGenVertexArrays = (n, arrays) => {
      GL.genObject(n, arrays, 'createVertexArray', GL.vaos
        );
    };
  var _emscripten_glGenerateMipmap = (x0) => GLctx.generateMipmap(x0);
  var __glGetActiveAttribOrUniform = (funcName, program, index, bufSize, length, size, type, name) => {
      program = GL.programs[program];
      var info = GLctx[funcName](program, index);
      if (info) {
        // If an error occurs, nothing will be written to length, size and type and name.
        var numBytesWrittenExclNull = name && stringToUTF8(info.name, name, bufSize);
        if (length) HEAP32[((length)>>2)] = numBytesWrittenExclNull;
        if (size) HEAP32[((size)>>2)] = info.size;
        if (type) HEAP32[((type)>>2)] = info.type;
      }
    };
  var _emscripten_glGetActiveAttrib = (program, index, bufSize, length, size, type, name) =>
      __glGetActiveAttribOrUniform('getActiveAttrib', program, index, bufSize, length, size, type, name);
  var _emscripten_glGetActiveUniform = (program, index, bufSize, length, size, type, name) =>
      __glGetActiveAttribOrUniform('getActiveUniform', program, index, bufSize, length, size, type, name);
  var _emscripten_glGetAttachedShaders = (program, maxCount, count, shaders) => {
      var result = GLctx.getAttachedShaders(GL.programs[program]);
      var len = result.length;
      if (len > maxCount) {
        len = maxCount;
      }
      HEAP32[((count)>>2)] = len;
      for (var i = 0; i < len; ++i) {
        var id = GL.shaders.indexOf(result[i]);
        HEAP32[(((shaders)+(i*4))>>2)] = id;
      }
    };
  var _emscripten_glGetAttribLocation = (program, name) =>
      GLctx.getAttribLocation(GL.programs[program], UTF8ToString(name));
  /** @type {!Float32Array} */
  var HEAPF32;
  var readI53FromI64 = (ptr) => {
      return HEAPU32[((ptr)>>2)] + HEAP32[(((ptr)+(4))>>2)] * 4294967296;
    };
  var readI53FromU64 = (ptr) => {
      return HEAPU32[((ptr)>>2)] + HEAPU32[(((ptr)+(4))>>2)] * 4294967296;
    };
  var writeI53ToI64 = (ptr, num) => {
      HEAPU32[((ptr)>>2)] = num;
      var lower = HEAPU32[((ptr)>>2)];
      HEAPU32[(((ptr)+(4))>>2)] = (num - lower)/4294967296;
      var deserialized = (num >= 0) ? readI53FromU64(ptr) : readI53FromI64(ptr);
      var offset = ((ptr)>>2);
      if (deserialized != num) warnOnce(`writeI53ToI64() out of range: serialized JS Number ${num} to Wasm heap as bytes lo=${ptrToString(HEAPU32[offset])}, hi=${ptrToString(HEAPU32[offset+1])}, which deserializes back to ${deserialized} instead!`);
    };
  var emscriptenWebGLGet = (name_, p, type) => {
      // Guard against user passing a null pointer.
      // Note that GLES2 spec does not say anything about how passing a null
      // pointer should be treated.  Testing on desktop core GL 3, the application
      // crashes on glGetIntegerv to a null pointer, but better to report an error
      // instead of doing anything random.
      if (!p) {
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      var ret = undefined;
      switch (name_) { // Handle a few trivial GLES values
        case 0x8DFA: // GL_SHADER_COMPILER
          ret = 1;
          break;
        case 0x8DF8: // GL_SHADER_BINARY_FORMATS
          if (type != 0 && type != 1) {
            GL.recordError(0x500); // GL_INVALID_ENUM
          }
          // Do not write anything to the out pointer, since no binary formats are
          // supported.
          return;
        case 0x8DF9: // GL_NUM_SHADER_BINARY_FORMATS
          ret = 0;
          break;
        case 0x86A2: // GL_NUM_COMPRESSED_TEXTURE_FORMATS
          // WebGL doesn't have GL_NUM_COMPRESSED_TEXTURE_FORMATS (it's obsolete
          // since GL_COMPRESSED_TEXTURE_FORMATS returns a JS array that can be
          // queried for length), so implement it ourselves to allow C++ GLES2
          // code to get the length.
          var formats = GLctx.getParameter(0x86A3 /*GL_COMPRESSED_TEXTURE_FORMATS*/);
          ret = formats ? formats.length : 0;
          break;
  
      }
  
      if (ret === undefined) {
        var result = GLctx.getParameter(name_);
        switch (typeof result) {
          case 'number':
            ret = result;
            break;
          case 'boolean':
            ret = result ? 1 : 0;
            break;
          case 'string':
            GL.recordError(0x500); // GL_INVALID_ENUM
            return;
          case 'object':
            if (result === null) {
              // null is a valid result for some (e.g., which buffer is bound -
              // perhaps nothing is bound), but otherwise can mean an invalid
              // name_, which we need to report as an error
              switch (name_) {
                case 0x8894: // ARRAY_BUFFER_BINDING
                case 0x8B8D: // CURRENT_PROGRAM
                case 0x8895: // ELEMENT_ARRAY_BUFFER_BINDING
                case 0x8CA6: // FRAMEBUFFER_BINDING or DRAW_FRAMEBUFFER_BINDING
                case 0x8CA7: // RENDERBUFFER_BINDING
                case 0x8069: // TEXTURE_BINDING_2D
                case 0x85B5: // WebGL 2 GL_VERTEX_ARRAY_BINDING, or WebGL 1 extension OES_vertex_array_object GL_VERTEX_ARRAY_BINDING_OES
                case 0x8514: { // TEXTURE_BINDING_CUBE_MAP
                  ret = 0;
                  break;
                }
                default: {
                  GL.recordError(0x500); // GL_INVALID_ENUM
                  return;
                }
              }
            } else if (result instanceof Float32Array ||
                       result instanceof Uint32Array ||
                       result instanceof Int32Array ||
                       result instanceof Array) {
              for (var i = 0; i < result.length; ++i) {
                switch (type) {
                  case 0: HEAP32[(((p)+(i*4))>>2)] = result[i]; break;
                  case 2: HEAPF32[(((p)+(i*4))>>2)] = result[i]; break;
                  case 4: HEAP8[(p)+(i)] = result[i] ? 1 : 0; break;
                }
              }
              return;
            } else {
              try {
                ret = result.name | 0;
              } catch(e) {
                GL.recordError(0x500); // GL_INVALID_ENUM
                err(`GL_INVALID_ENUM in glGet${type}v: Unknown object returned from WebGL getParameter(${name_})! (error: ${e})`);
                return;
              }
            }
            break;
          default:
            GL.recordError(0x500); // GL_INVALID_ENUM
            err(`GL_INVALID_ENUM in glGet${type}v: Native code calling glGet${type}v(${name_}) and it returns ${result} of type ${typeof(result)}!`);
            return;
        }
      }
  
      switch (type) {
        case 1: writeI53ToI64(p, ret); break;
        case 0: HEAP32[((p)>>2)] = ret; break;
        case 2:   HEAPF32[((p)>>2)] = ret; break;
        case 4: HEAP8[p] = ret ? 1 : 0; break;
      }
    };
  var _emscripten_glGetBooleanv = (name_, p) => emscriptenWebGLGet(name_, p, 4);
  var _emscripten_glGetBufferParameteriv = (target, value, data) => {
      if (!data) {
        // GLES2 specification does not specify how to behave if data is a null
        // pointer. Since calling this function does not make sense if data ==
        // null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      HEAP32[((data)>>2)] = GLctx.getBufferParameter(target, value);
    };
  var _emscripten_glGetError = () => {
      var error = GLctx.getError() || GL.lastError;
      GL.lastError = 0/*GL_NO_ERROR*/;
      return error;
    };
  var _emscripten_glGetFloatv = (name_, p) => emscriptenWebGLGet(name_, p, 2);
  var _emscripten_glGetFramebufferAttachmentParameteriv = (target, attachment, pname, params) => {
      var result = GLctx.getFramebufferAttachmentParameter(target, attachment, pname);
      if (result instanceof WebGLRenderbuffer ||
          result instanceof WebGLTexture) {
        result = result.name | 0;
      }
      HEAP32[((params)>>2)] = result;
    };
  var _emscripten_glGetIntegerv = (name_, p) => emscriptenWebGLGet(name_, p, 0);
  var _emscripten_glGetProgramInfoLog = (program, maxLength, length, infoLog) => {
      var log = GLctx.getProgramInfoLog(GL.programs[program]);
      if (log === null) log = '(unknown error)';
      var numBytesWrittenExclNull = (maxLength > 0 && infoLog) ? stringToUTF8(log, infoLog, maxLength) : 0;
      if (length) HEAP32[((length)>>2)] = numBytesWrittenExclNull;
    };
  var _emscripten_glGetProgramiv = (program, pname, p) => {
      if (!p) {
        // GLES2 specification does not specify how to behave if p is a null
        // pointer. Since calling this function does not make sense if p == null,
        // issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
  
      if (program >= GL.counter) {
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
  
      program = GL.programs[program];
  
      if (pname == 0x8B84) { // GL_INFO_LOG_LENGTH
        var log = GLctx.getProgramInfoLog(program);
        if (log === null) log = '(unknown error)';
        HEAP32[((p)>>2)] = log.length + 1;
      } else if (pname == 0x8B87 /* GL_ACTIVE_UNIFORM_MAX_LENGTH */) {
        if (!program.maxUniformLength) {
          var numActiveUniforms = GLctx.getProgramParameter(program, 0x8B86/*GL_ACTIVE_UNIFORMS*/);
          for (var i = 0; i < numActiveUniforms; ++i) {
            program.maxUniformLength = Math.max(program.maxUniformLength, GLctx.getActiveUniform(program, i).name.length+1);
          }
        }
        HEAP32[((p)>>2)] = program.maxUniformLength;
      } else if (pname == 0x8B8A /* GL_ACTIVE_ATTRIBUTE_MAX_LENGTH */) {
        if (!program.maxAttributeLength) {
          var numActiveAttributes = GLctx.getProgramParameter(program, 0x8B89/*GL_ACTIVE_ATTRIBUTES*/);
          for (var i = 0; i < numActiveAttributes; ++i) {
            program.maxAttributeLength = Math.max(program.maxAttributeLength, GLctx.getActiveAttrib(program, i).name.length+1);
          }
        }
        HEAP32[((p)>>2)] = program.maxAttributeLength;
      } else if (pname == 0x8A35 /* GL_ACTIVE_UNIFORM_BLOCK_MAX_NAME_LENGTH */) {
        if (!program.maxUniformBlockNameLength) {
          var numActiveUniformBlocks = GLctx.getProgramParameter(program, 0x8A36/*GL_ACTIVE_UNIFORM_BLOCKS*/);
          for (var i = 0; i < numActiveUniformBlocks; ++i) {
            program.maxUniformBlockNameLength = Math.max(program.maxUniformBlockNameLength, GLctx.getActiveUniformBlockName(program, i).length+1);
          }
        }
        HEAP32[((p)>>2)] = program.maxUniformBlockNameLength;
      } else {
        HEAP32[((p)>>2)] = GLctx.getProgramParameter(program, pname);
      }
    };
  var _emscripten_glGetQueryObjecti64vEXT = (id, pname, params) => {
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
        // if p == null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      var query = GL.queries[id];
      var param;
      {
        param = GLctx.disjointTimerQueryExt['getQueryObjectEXT'](query, pname);
      }
      var ret;
      if (typeof param === 'boolean') {
        ret = param ? 1 : 0;
      } else {
        ret = param;
      }
      writeI53ToI64(params, ret);
    };
  var _emscripten_glGetQueryObjectivEXT = (id, pname, params) => {
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
        // if p == null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      var query = GL.queries[id];
      var param = GLctx.disjointTimerQueryExt['getQueryObjectEXT'](query, pname);
      var ret;
      if (typeof param === 'boolean') {
        ret = param ? 1 : 0;
      } else {
        ret = param;
      }
      HEAP32[((params)>>2)] = ret;
    };


  var _emscripten_glGetQueryivEXT = (target, pname, params) => {
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
        // if p == null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      HEAP32[((params)>>2)] = GLctx.disjointTimerQueryExt['getQueryEXT'](target, pname);
    };
  var _emscripten_glGetRenderbufferParameteriv = (target, pname, params) => {
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
        // if params == null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      HEAP32[((params)>>2)] = GLctx.getRenderbufferParameter(target, pname);
    };
  var _emscripten_glGetShaderInfoLog = (shader, maxLength, length, infoLog) => {
      var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
      if (log === null) log = '(unknown error)';
      var numBytesWrittenExclNull = (maxLength > 0 && infoLog) ? stringToUTF8(log, infoLog, maxLength) : 0;
      if (length) HEAP32[((length)>>2)] = numBytesWrittenExclNull;
    };
  var _emscripten_glGetShaderPrecisionFormat = (shaderType, precisionType, range, precision) => {
      var result = GLctx.getShaderPrecisionFormat(shaderType, precisionType);
      HEAP32[((range)>>2)] = result.rangeMin;
      HEAP32[(((range)+(4))>>2)] = result.rangeMax;
      HEAP32[((precision)>>2)] = result.precision;
    };
  var _emscripten_glGetShaderSource = (shader, bufSize, length, source) => {
      var result = GLctx.getShaderSource(GL.shaders[shader]);
      if (!result) return; // If an error occurs, nothing will be written to length or source.
      var numBytesWrittenExclNull = (bufSize > 0 && source) ? stringToUTF8(result, source, bufSize) : 0;
      if (length) HEAP32[((length)>>2)] = numBytesWrittenExclNull;
    };
  var _emscripten_glGetShaderiv = (shader, pname, p) => {
      if (!p) {
        // GLES2 specification does not specify how to behave if p is a null
        // pointer. Since calling this function does not make sense if p == null,
        // issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      if (pname == 0x8B84) { // GL_INFO_LOG_LENGTH
        var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
        if (log === null) log = '(unknown error)';
        // The GLES2 specification says that if the shader has an empty info log,
        // a value of 0 is returned. Otherwise the log has a null char appended.
        // (An empty string is falsey, so we can just check that instead of
        // looking at log.length.)
        var logLength = log ? log.length + 1 : 0;
        HEAP32[((p)>>2)] = logLength;
      } else if (pname == 0x8B88) { // GL_SHADER_SOURCE_LENGTH
        var source = GLctx.getShaderSource(GL.shaders[shader]);
        // source may be a null, or the empty string, both of which are falsey
        // values that we report a 0 length for.
        var sourceLength = source ? source.length + 1 : 0;
        HEAP32[((p)>>2)] = sourceLength;
      } else {
        HEAP32[((p)>>2)] = GLctx.getShaderParameter(GL.shaders[shader], pname);
      }
    };
  var stringToNewUTF8 = (str) => {
      var size = lengthBytesUTF8(str) + 1;
      var ret = _malloc(size);
      if (ret) stringToUTF8(str, ret, size);
      return ret;
    };
  var webglGetExtensions = () => {
      var exts = getEmscriptenSupportedExtensions(GLctx);
      exts = exts.concat(exts.map((e) => 'GL_' + e));
      return exts;
    };
  var _emscripten_glGetString = (name_) => {
      var ret = GL.stringCache[name_];
      if (!ret) {
        switch (name_) {
          case 0x1F03 /* GL_EXTENSIONS */:
            ret = stringToNewUTF8(webglGetExtensions().join(' '));
            break;
          case 0x1F00 /* GL_VENDOR */:
          case 0x1F01 /* GL_RENDERER */:
          case 0x9245 /* UNMASKED_VENDOR_WEBGL */:
          case 0x9246 /* UNMASKED_RENDERER_WEBGL */:
            var s = GLctx.getParameter(name_);
            if (!s) {
              GL.recordError(0x500/*GL_INVALID_ENUM*/);
            }
            ret = s ? stringToNewUTF8(s) : 0;
            break;
  
          case 0x1F02 /* GL_VERSION */:
            var webGLVersion = GLctx.getParameter(0x1F02 /*GL_VERSION*/);
            // return GLES version string corresponding to the version of the WebGL context
            var glVersion = `OpenGL ES 2.0 (${webGLVersion})`;
            ret = stringToNewUTF8(glVersion);
            break;
          case 0x8B8C /* GL_SHADING_LANGUAGE_VERSION */:
            var glslVersion = GLctx.getParameter(0x8B8C /*GL_SHADING_LANGUAGE_VERSION*/);
            // extract the version number 'N.M' from the string 'WebGL GLSL ES N.M ...'
            var ver_re = /^WebGL GLSL ES ([0-9]\.[0-9][0-9]?)(?:$| .*)/;
            var ver_num = glslVersion.match(ver_re);
            if (ver_num !== null) {
              if (ver_num[1].length == 3) ver_num[1] = ver_num[1] + '0'; // ensure minor version has 2 digits
              glslVersion = `OpenGL ES GLSL ES ${ver_num[1]} (${glslVersion})`;
            }
            ret = stringToNewUTF8(glslVersion);
            break;
          default:
            GL.recordError(0x500/*GL_INVALID_ENUM*/);
            // fall through
        }
        GL.stringCache[name_] = ret;
      }
      return ret;
    };
  var _emscripten_glGetTexParameterfv = (target, pname, params) => {
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null
        // pointer. Since calling this function does not make sense if p == null,
        // issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      HEAPF32[((params)>>2)] = GLctx.getTexParameter(target, pname);
    };
  var _emscripten_glGetTexParameteriv = (target, pname, params) => {
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null
        // pointer. Since calling this function does not make sense if p == null,
        // issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      HEAP32[((params)>>2)] = GLctx.getTexParameter(target, pname);
    };
  /** @suppress {checkTypes} */
  var jstoi_q = (str) => parseInt(str);
  /** @noinline */
  var webglGetLeftBracePos = (name) => name.slice(-1) == ']' && name.lastIndexOf('[');
  var webglPrepareUniformLocationsBeforeFirstUse = (program) => {
      var uniformLocsById = program.uniformLocsById, // Maps GLuint -> WebGLUniformLocation
        uniformSizeAndIdsByName = program.uniformSizeAndIdsByName, // Maps name -> [uniform array length, GLuint]
        i, j;
  
      // On the first time invocation of glGetUniformLocation on this shader program:
      // initialize cache data structures and discover which uniforms are arrays.
      if (!uniformLocsById) {
        // maps GLint integer locations to WebGLUniformLocations
        program.uniformLocsById = uniformLocsById = {};
        // maps integer locations back to uniform name strings, so that we can lazily fetch uniform array locations
        program.uniformArrayNamesById = {};
  
        var numActiveUniforms = GLctx.getProgramParameter(program, 0x8B86/*GL_ACTIVE_UNIFORMS*/);
        for (i = 0; i < numActiveUniforms; ++i) {
          var u = GLctx.getActiveUniform(program, i);
          var nm = u.name;
          var sz = u.size;
          var lb = webglGetLeftBracePos(nm);
          var arrayName = lb > 0 ? nm.slice(0, lb) : nm;
  
          // Assign a new location.
          var id = program.uniformIdCounter;
          program.uniformIdCounter += sz;
          // Eagerly get the location of the uniformArray[0] base element.
          // The remaining indices >0 will be left for lazy evaluation to
          // improve performance. Those may never be needed to fetch, if the
          // application fills arrays always in full starting from the first
          // element of the array.
          uniformSizeAndIdsByName[arrayName] = [sz, id];
  
          // Store placeholder integers in place that highlight that these
          // >0 index locations are array indices pending population.
          for (j = 0; j < sz; ++j) {
            uniformLocsById[id] = j;
            program.uniformArrayNamesById[id++] = arrayName;
          }
        }
      }
    };
  var _emscripten_glGetUniformLocation = (program, name) => {
  
      name = UTF8ToString(name);
  
      if (program = GL.programs[program]) {
        webglPrepareUniformLocationsBeforeFirstUse(program);
        var uniformLocsById = program.uniformLocsById; // Maps GLuint -> WebGLUniformLocation
        var arrayIndex = 0;
        var uniformBaseName = name;
  
        // Invariant: when populating integer IDs for uniform locations, we must
        // maintain the precondition that arrays reside in contiguous addresses,
        // i.e. for a 'vec4 colors[10];', colors[4] must be at location
        // colors[0]+4.  However, user might call glGetUniformLocation(program,
        // "colors") for an array, so we cannot discover based on the user input
        // arguments whether the uniform we are dealing with is an array. The only
        // way to discover which uniforms are arrays is to enumerate over all the
        // active uniforms in the program.
        var leftBrace = webglGetLeftBracePos(name);
  
        // If user passed an array accessor "[index]", parse the array index off the accessor.
        if (leftBrace > 0) {
          arrayIndex = jstoi_q(name.slice(leftBrace + 1)) >>> 0; // "index]", coerce parseInt(']') with >>>0 to treat "foo[]" as "foo[0]" and foo[-1] as unsigned out-of-bounds.
          uniformBaseName = name.slice(0, leftBrace);
        }
  
        // Have we cached the location of this uniform before?
        // A pair [array length, GLint of the uniform location]
        var sizeAndId = program.uniformSizeAndIdsByName[uniformBaseName];
  
        // If a uniform with this name exists, and if its index is within the
        // array limits (if it's even an array), query the WebGLlocation, or
        // return an existing cached location.
        if (sizeAndId && arrayIndex < sizeAndId[0]) {
          arrayIndex += sizeAndId[1]; // Add the base location of the uniform to the array index offset.
          if ((uniformLocsById[arrayIndex] = uniformLocsById[arrayIndex] || GLctx.getUniformLocation(program, name))) {
            return arrayIndex;
          }
        }
      }
      else {
        // N.b. we are currently unable to distinguish between GL program IDs that
        // never existed vs GL program IDs that have been deleted, so report
        // GL_INVALID_VALUE in both cases.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
      }
      return -1;
    };
  var webglGetProgramUniformLocation = (program, location) => {
  
      if (program) {
        var webglLoc = program.uniformLocsById[location];
        // program.uniformLocsById[location] stores either an integer, or a
        // WebGLUniformLocation.
        // If an integer, we have not yet bound the location, so do it now. The
        // integer value specifies the array index we should bind to.
        if (typeof webglLoc === 'number') {
          program.uniformLocsById[location] = webglLoc = GLctx.getUniformLocation(program, program.uniformArrayNamesById[location] + (webglLoc > 0 ? `[${webglLoc}]` : ''));
        }
        // Else an already cached WebGLUniformLocation, return it.
        return webglLoc;
      } else {
        GL.recordError(0x502/*GL_INVALID_OPERATION*/);
      }
    };
  /** @suppress{checkTypes} */
  var emscriptenWebGLGetUniform = (program, location, params, type) => {
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null
        // pointer. Since calling this function does not make sense if params ==
        // null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      program = GL.programs[program];
      webglPrepareUniformLocationsBeforeFirstUse(program);
      var data = GLctx.getUniform(program, webglGetProgramUniformLocation(program, location));
      if (typeof data === 'number' || typeof data === 'boolean') {
        switch (type) {
          case 0: HEAP32[((params)>>2)] = data; break;
          case 2: HEAPF32[((params)>>2)] = data; break;
        }
      } else {
        for (var i = 0; i < data.length; i++) {
          switch (type) {
            case 0: HEAP32[(((params)+(i*4))>>2)] = data[i]; break;
            case 2: HEAPF32[(((params)+(i*4))>>2)] = data[i]; break;
          }
        }
      }
    };
  var _emscripten_glGetUniformfv = (program, location, params) => {
      emscriptenWebGLGetUniform(program, location, params, 2);
    };
  var _emscripten_glGetUniformiv = (program, location, params) => {
      emscriptenWebGLGetUniform(program, location, params, 0);
    };
  var _emscripten_glGetVertexAttribPointerv = (index, pname, pointer) => {
      if (!pointer) {
        // GLES2 specification does not specify how to behave if pointer is a null
        // pointer. Since calling this function does not make sense if pointer ==
        // null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      HEAP32[((pointer)>>2)] = GLctx.getVertexAttribOffset(index, pname);
    };
  /** @suppress{checkTypes} */
  var emscriptenWebGLGetVertexAttrib = (index, pname, params, type) => {
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null
        // pointer. Since calling this function does not make sense if params ==
        // null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      var data = GLctx.getVertexAttrib(index, pname);
      if (pname == 0x889F/*VERTEX_ATTRIB_ARRAY_BUFFER_BINDING*/) {
        HEAP32[((params)>>2)] = data && data["name"];
      } else if (typeof data === 'number' || typeof data === 'boolean') {
        switch (type) {
          case 0: HEAP32[((params)>>2)] = data; break;
          case 2: HEAPF32[((params)>>2)] = data; break;
          case 5: HEAP32[((params)>>2)] = Math.fround(data); break;
        }
      } else {
        for (var i = 0; i < data.length; i++) {
          switch (type) {
            case 0: HEAP32[(((params)+(i*4))>>2)] = data[i]; break;
            case 2: HEAPF32[(((params)+(i*4))>>2)] = data[i]; break;
            case 5: HEAP32[(((params)+(i*4))>>2)] = Math.fround(data[i]); break;
          }
        }
      }
    };
  var _emscripten_glGetVertexAttribfv = (index, pname, params) => {
      // N.B. This function may only be called if the vertex attribute was
      // specified using the function glVertexAttrib*f(), otherwise the results
      // are undefined. (GLES3 spec 6.1.12)
      emscriptenWebGLGetVertexAttrib(index, pname, params, 2);
    };
  var _emscripten_glGetVertexAttribiv = (index, pname, params) => {
      // N.B. This function may only be called if the vertex attribute was
      // specified using the function glVertexAttrib*f(), otherwise the results
      // are undefined. (GLES3 spec 6.1.12)
      emscriptenWebGLGetVertexAttrib(index, pname, params, 5);
    };
  var _emscripten_glHint = (x0, x1) => GLctx.hint(x0, x1);
  var _emscripten_glIsBuffer = (buffer) => {
      var b = GL.buffers[buffer];
      if (!b) return 0;
      return GLctx.isBuffer(b);
    };
  var _emscripten_glIsEnabled = (x0) => GLctx.isEnabled(x0);
  var _emscripten_glIsFramebuffer = (framebuffer) => {
      var fb = GL.framebuffers[framebuffer];
      if (!fb) return 0;
      return GLctx.isFramebuffer(fb);
    };
  var _emscripten_glIsProgram = (program) => {
      program = GL.programs[program];
      if (!program) return 0;
      return GLctx.isProgram(program);
    };
  var _emscripten_glIsQueryEXT = (id) => {
      var query = GL.queries[id];
      if (!query) return 0;
      return GLctx.disjointTimerQueryExt['isQueryEXT'](query);
    };
  var _emscripten_glIsRenderbuffer = (renderbuffer) => {
      var rb = GL.renderbuffers[renderbuffer];
      if (!rb) return 0;
      return GLctx.isRenderbuffer(rb);
    };
  var _emscripten_glIsShader = (shader) => {
      var s = GL.shaders[shader];
      if (!s) return 0;
      return GLctx.isShader(s);
    };
  var _emscripten_glIsTexture = (id) => {
      var texture = GL.textures[id];
      if (!texture) return 0;
      return GLctx.isTexture(texture);
    };
  var _emscripten_glIsVertexArray = (array) => {
  
      var vao = GL.vaos[array];
      if (!vao) return 0;
      return GLctx.isVertexArray(vao);
    };
  var _emscripten_glLineWidth = (x0) => GLctx.lineWidth(x0);
  var _emscripten_glLinkProgram = (program) => {
      program = GL.programs[program];
      GLctx.linkProgram(program);
      // Invalidate earlier computed uniform->ID mappings, those have now become stale
      program.uniformLocsById = 0; // Mark as null-like so that glGetUniformLocation() knows to populate this again.
      program.uniformSizeAndIdsByName = {};
  
    };
  var _emscripten_glPixelStorei = (pname, param) => {
      if (pname == 3317) {
        GL.unpackAlignment = param;
      } else if (pname == 3314) {
        GL.unpackRowLength = param;
      }
      GLctx.pixelStorei(pname, param);
    };
  var _emscripten_glPolygonModeWEBGL = (face, mode) => {
      GLctx.webglPolygonMode['polygonModeWEBGL'](face, mode);
    };
  var _emscripten_glPolygonOffset = (x0, x1) => GLctx.polygonOffset(x0, x1);
  var _emscripten_glPolygonOffsetClampEXT = (factor, units, clamp) => {
      GLctx.extPolygonOffsetClamp['polygonOffsetClampEXT'](factor, units, clamp);
    };
  var _emscripten_glQueryCounterEXT = (id, target) => {
      GLctx.disjointTimerQueryExt['queryCounterEXT'](GL.queries[id], target);
    };
  var colorChannelsInGlTextureFormat = (format) => {
      // Micro-optimizations for size: map format to size by subtracting smallest
      // enum value (0x1902) from all values first.  Also omit the most common
      // size value (1) from the list, which is assumed by formats not on the
      // list.
      var colorChannels = {
        // 0x1902 /* GL_DEPTH_COMPONENT */ - 0x1902: 1,
        // 0x1906 /* GL_ALPHA */ - 0x1902: 1,
        5: 3,
        6: 4,
        // 0x1909 /* GL_LUMINANCE */ - 0x1902: 1,
        8: 2,
        29502: 3,
        29504: 4,
      };
      return colorChannels[format - 0x1902]||1;
    };
  var computeUnpackAlignedImageSize = (width, height, sizePerPixel) => {
      function roundedToNextMultipleOf(x, y) {
        return (x + y - 1) & -y;
      }
      var plainRowSize = (GL.unpackRowLength || width) * sizePerPixel;
      var alignedRowSize = roundedToNextMultipleOf(plainRowSize, GL.unpackAlignment);
      return height * alignedRowSize;
    };
  /** @type {!Uint16Array} */
  var HEAPU16;
  var heapObjectForWebGLType = (type) => {
      // Micro-optimization for size: Subtract lowest GL enum number (0x1400/* GL_BYTE */) from type to compare
      // smaller values for the heap, for shorter generated code size.
      // Also the type HEAPU16 is not tested for explicitly, but any unrecognized type will return out HEAPU16.
      // (since most types are HEAPU16)
      type -= 0x1400;
  
      if (type == 1) return HEAPU8;
  
      if (type == 4) return HEAP32;
  
      if (type == 6) return HEAPF32;
  
      if (type == 5
        || type == 28922
        )
        return HEAPU32;
  
      return HEAPU16;
    };
  var toTypedArrayIndex = (pointer, heap) =>
      pointer >>> (31 - Math.clz32(heap.BYTES_PER_ELEMENT));
  var emscriptenWebGLGetTexPixelData = (type, format, width, height, pixels) => {
      var heap = heapObjectForWebGLType(type);
      var sizePerPixel = colorChannelsInGlTextureFormat(format) * heap.BYTES_PER_ELEMENT;
      var bytes = computeUnpackAlignedImageSize(width, height, sizePerPixel);
      return heap.subarray(toTypedArrayIndex(pixels, heap), toTypedArrayIndex(pixels + bytes, heap));
    };
  var _emscripten_glReadPixels = (x, y, width, height, format, type, pixels) => {
      var pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels);
      if (!pixelData) {
        GL.recordError(0x500/*GL_INVALID_ENUM*/);
        return;
      }
      GLctx.readPixels(x, y, width, height, format, type, pixelData);
    };
  var _emscripten_glReleaseShaderCompiler = () => {
      // NOP (as allowed by GLES 2.0 spec)
    };
  var _emscripten_glRenderbufferStorage = (x0, x1, x2, x3) => GLctx.renderbufferStorage(x0, x1, x2, x3);
  var _emscripten_glSampleCoverage = (value, invert) => {
      GLctx.sampleCoverage(value, !!invert);
    };
  var _emscripten_glScissor = (x0, x1, x2, x3) => GLctx.scissor(x0, x1, x2, x3);
  var _emscripten_glShaderBinary = (count, shaders, binaryformat, binary, length) => {
      GL.recordError(0x500/*GL_INVALID_ENUM*/);
    };
  var _emscripten_glShaderSource = (shader, count, string, length) => {
      var source = GL.getSource(shader, count, string, length);
  
      GLctx.shaderSource(GL.shaders[shader], source);
    };
  var _emscripten_glStencilFunc = (x0, x1, x2) => GLctx.stencilFunc(x0, x1, x2);
  var _emscripten_glStencilFuncSeparate = (x0, x1, x2, x3) => GLctx.stencilFuncSeparate(x0, x1, x2, x3);
  var _emscripten_glStencilMask = (x0) => GLctx.stencilMask(x0);
  var _emscripten_glStencilMaskSeparate = (x0, x1) => GLctx.stencilMaskSeparate(x0, x1);
  var _emscripten_glStencilOp = (x0, x1, x2) => GLctx.stencilOp(x0, x1, x2);
  var _emscripten_glStencilOpSeparate = (x0, x1, x2, x3) => GLctx.stencilOpSeparate(x0, x1, x2, x3);
  var _emscripten_glTexImage2D = (target, level, internalFormat, width, height, border, format, type, pixels) => {
      var pixelData = pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels) : null;
      GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixelData);
    };
  var _emscripten_glTexParameterf = (x0, x1, x2) => GLctx.texParameterf(x0, x1, x2);
  var _emscripten_glTexParameterfv = (target, pname, params) => {
      var param = HEAPF32[((params)>>2)];
      GLctx.texParameterf(target, pname, param);
    };
  var _emscripten_glTexParameteri = (x0, x1, x2) => GLctx.texParameteri(x0, x1, x2);
  var _emscripten_glTexParameteriv = (target, pname, params) => {
      var param = HEAP32[((params)>>2)];
      GLctx.texParameteri(target, pname, param);
    };
  var _emscripten_glTexSubImage2D = (target, level, xoffset, yoffset, width, height, format, type, pixels) => {
      var pixelData = pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels) : null;
      GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixelData);
    };
  var webglGetUniformLocation = (location) => {
  
      return webglGetProgramUniformLocation(GLctx.currentProgram, location);
    };
  var _emscripten_glUniform1f = (location, v0) => {
      GLctx.uniform1f(webglGetUniformLocation(location), v0);
    };
  const GL_POOL_TEMP_BUFFERS_SIZE = 288;
  var miniTempWebGLFloatBuffers = [];
  var _emscripten_glUniform1fv = (location, count, value) => {
  
      if (count <= GL_POOL_TEMP_BUFFERS_SIZE) {
        // avoid allocation when uploading few enough uniforms
        var view = miniTempWebGLFloatBuffers[count];
        for (var i = 0; i < count; ++i) {
          view[i] = HEAPF32[(((value)+(4*i))>>2)];
        }
      } else
      {
        var view = HEAPF32.subarray((((value)>>2)), ((value+count*4)>>2));
      }
      GLctx.uniform1fv(webglGetUniformLocation(location), view);
    };
  var _emscripten_glUniform1i = (location, v0) => {
      GLctx.uniform1i(webglGetUniformLocation(location), v0);
    };
  var miniTempWebGLIntBuffers = [];
  var _emscripten_glUniform1iv = (location, count, value) => {
  
      if (count <= GL_POOL_TEMP_BUFFERS_SIZE) {
        // avoid allocation when uploading few enough uniforms
        var view = miniTempWebGLIntBuffers[count];
        for (var i = 0; i < count; ++i) {
          view[i] = HEAP32[(((value)+(4*i))>>2)];
        }
      } else
      {
        var view = HEAP32.subarray((((value)>>2)), ((value+count*4)>>2));
      }
      GLctx.uniform1iv(webglGetUniformLocation(location), view);
    };
  var _emscripten_glUniform2f = (location, v0, v1) => {
      GLctx.uniform2f(webglGetUniformLocation(location), v0, v1);
    };
  var _emscripten_glUniform2fv = (location, count, value) => {
  
      if (count <= GL_POOL_TEMP_BUFFERS_SIZE / 2) {
        // avoid allocation when uploading few enough uniforms
        count *= 2;
        var view = miniTempWebGLFloatBuffers[count];
        for (var i = 0; i < count; i += 2) {
          view[i] = HEAPF32[(((value)+(4*i))>>2)];
          view[i+1] = HEAPF32[(((value)+(4*i+4))>>2)];
        }
      } else
      {
        var view = HEAPF32.subarray((((value)>>2)), ((value+count*8)>>2));
      }
      GLctx.uniform2fv(webglGetUniformLocation(location), view);
    };
  var _emscripten_glUniform2i = (location, v0, v1) => {
      GLctx.uniform2i(webglGetUniformLocation(location), v0, v1);
    };
  var _emscripten_glUniform2iv = (location, count, value) => {
  
      if (count <= GL_POOL_TEMP_BUFFERS_SIZE / 2) {
        // avoid allocation when uploading few enough uniforms
        count *= 2;
        var view = miniTempWebGLIntBuffers[count];
        for (var i = 0; i < count; i += 2) {
          view[i] = HEAP32[(((value)+(4*i))>>2)];
          view[i+1] = HEAP32[(((value)+(4*i+4))>>2)];
        }
      } else
      {
        var view = HEAP32.subarray((((value)>>2)), ((value+count*8)>>2));
      }
      GLctx.uniform2iv(webglGetUniformLocation(location), view);
    };
  var _emscripten_glUniform3f = (location, v0, v1, v2) => {
      GLctx.uniform3f(webglGetUniformLocation(location), v0, v1, v2);
    };
  var _emscripten_glUniform3fv = (location, count, value) => {
  
      if (count <= GL_POOL_TEMP_BUFFERS_SIZE / 3) {
        // avoid allocation when uploading few enough uniforms
        count *= 3;
        var view = miniTempWebGLFloatBuffers[count];
        for (var i = 0; i < count; i += 3) {
          view[i] = HEAPF32[(((value)+(4*i))>>2)];
          view[i+1] = HEAPF32[(((value)+(4*i+4))>>2)];
          view[i+2] = HEAPF32[(((value)+(4*i+8))>>2)];
        }
      } else
      {
        var view = HEAPF32.subarray((((value)>>2)), ((value+count*12)>>2));
      }
      GLctx.uniform3fv(webglGetUniformLocation(location), view);
    };
  var _emscripten_glUniform3i = (location, v0, v1, v2) => {
      GLctx.uniform3i(webglGetUniformLocation(location), v0, v1, v2);
    };
  var _emscripten_glUniform3iv = (location, count, value) => {
  
      if (count <= GL_POOL_TEMP_BUFFERS_SIZE / 3) {
        // avoid allocation when uploading few enough uniforms
        count *= 3;
        var view = miniTempWebGLIntBuffers[count];
        for (var i = 0; i < count; i += 3) {
          view[i] = HEAP32[(((value)+(4*i))>>2)];
          view[i+1] = HEAP32[(((value)+(4*i+4))>>2)];
          view[i+2] = HEAP32[(((value)+(4*i+8))>>2)];
        }
      } else
      {
        var view = HEAP32.subarray((((value)>>2)), ((value+count*12)>>2));
      }
      GLctx.uniform3iv(webglGetUniformLocation(location), view);
    };
  var _emscripten_glUniform4f = (location, v0, v1, v2, v3) => {
      GLctx.uniform4f(webglGetUniformLocation(location), v0, v1, v2, v3);
    };
  var _emscripten_glUniform4fv = (location, count, value) => {
  
      if (count <= GL_POOL_TEMP_BUFFERS_SIZE / 4) {
        // avoid allocation when uploading few enough uniforms
        var view = miniTempWebGLFloatBuffers[4*count];
        // hoist the heap out of the loop for size and for pthreads+growth.
        var heap = HEAPF32;
        value = ((value)>>2);
        count *= 4;
        for (var i = 0; i < count; i += 4) {
          var dst = value + i;
          view[i] = heap[dst];
          view[i + 1] = heap[dst + 1];
          view[i + 2] = heap[dst + 2];
          view[i + 3] = heap[dst + 3];
        }
      } else
      {
        var view = HEAPF32.subarray((((value)>>2)), ((value+count*16)>>2));
      }
      GLctx.uniform4fv(webglGetUniformLocation(location), view);
    };
  var _emscripten_glUniform4i = (location, v0, v1, v2, v3) => {
      GLctx.uniform4i(webglGetUniformLocation(location), v0, v1, v2, v3);
    };
  var _emscripten_glUniform4iv = (location, count, value) => {
  
      if (count <= GL_POOL_TEMP_BUFFERS_SIZE / 4) {
        // avoid allocation when uploading few enough uniforms
        count *= 4;
        var view = miniTempWebGLIntBuffers[count];
        for (var i = 0; i < count; i += 4) {
          view[i] = HEAP32[(((value)+(4*i))>>2)];
          view[i+1] = HEAP32[(((value)+(4*i+4))>>2)];
          view[i+2] = HEAP32[(((value)+(4*i+8))>>2)];
          view[i+3] = HEAP32[(((value)+(4*i+12))>>2)];
        }
      } else
      {
        var view = HEAP32.subarray((((value)>>2)), ((value+count*16)>>2));
      }
      GLctx.uniform4iv(webglGetUniformLocation(location), view);
    };
  var _emscripten_glUniformMatrix2fv = (location, count, transpose, value) => {
  
      if (count <= GL_POOL_TEMP_BUFFERS_SIZE / 4) {
        // avoid allocation when uploading few enough uniforms
        count *= 4;
        var view = miniTempWebGLFloatBuffers[count];
        for (var i = 0; i < count; i += 4) {
          view[i] = HEAPF32[(((value)+(4*i))>>2)];
          view[i+1] = HEAPF32[(((value)+(4*i+4))>>2)];
          view[i+2] = HEAPF32[(((value)+(4*i+8))>>2)];
          view[i+3] = HEAPF32[(((value)+(4*i+12))>>2)];
        }
      } else
      {
        var view = HEAPF32.subarray((((value)>>2)), ((value+count*16)>>2));
      }
      GLctx.uniformMatrix2fv(webglGetUniformLocation(location), !!transpose, view);
    };
  var _emscripten_glUniformMatrix3fv = (location, count, transpose, value) => {
  
      if (count <= GL_POOL_TEMP_BUFFERS_SIZE / 9) {
        // avoid allocation when uploading few enough uniforms
        count *= 9;
        var view = miniTempWebGLFloatBuffers[count];
        for (var i = 0; i < count; i += 9) {
          view[i] = HEAPF32[(((value)+(4*i))>>2)];
          view[i+1] = HEAPF32[(((value)+(4*i+4))>>2)];
          view[i+2] = HEAPF32[(((value)+(4*i+8))>>2)];
          view[i+3] = HEAPF32[(((value)+(4*i+12))>>2)];
          view[i+4] = HEAPF32[(((value)+(4*i+16))>>2)];
          view[i+5] = HEAPF32[(((value)+(4*i+20))>>2)];
          view[i+6] = HEAPF32[(((value)+(4*i+24))>>2)];
          view[i+7] = HEAPF32[(((value)+(4*i+28))>>2)];
          view[i+8] = HEAPF32[(((value)+(4*i+32))>>2)];
        }
      } else
      {
        var view = HEAPF32.subarray((((value)>>2)), ((value+count*36)>>2));
      }
      GLctx.uniformMatrix3fv(webglGetUniformLocation(location), !!transpose, view);
    };
  var _emscripten_glUniformMatrix4fv = (location, count, transpose, value) => {
  
      if (count <= GL_POOL_TEMP_BUFFERS_SIZE / 16) {
        // avoid allocation when uploading few enough uniforms
        var view = miniTempWebGLFloatBuffers[16*count];
        // hoist the heap out of the loop for size and for pthreads+growth.
        var heap = HEAPF32;
        value = ((value)>>2);
        count *= 16;
        for (var i = 0; i < count; i += 16) {
          var dst = value + i;
          view[i] = heap[dst];
          view[i + 1] = heap[dst + 1];
          view[i + 2] = heap[dst + 2];
          view[i + 3] = heap[dst + 3];
          view[i + 4] = heap[dst + 4];
          view[i + 5] = heap[dst + 5];
          view[i + 6] = heap[dst + 6];
          view[i + 7] = heap[dst + 7];
          view[i + 8] = heap[dst + 8];
          view[i + 9] = heap[dst + 9];
          view[i + 10] = heap[dst + 10];
          view[i + 11] = heap[dst + 11];
          view[i + 12] = heap[dst + 12];
          view[i + 13] = heap[dst + 13];
          view[i + 14] = heap[dst + 14];
          view[i + 15] = heap[dst + 15];
        }
      } else
      {
        var view = HEAPF32.subarray((((value)>>2)), ((value+count*64)>>2));
      }
      GLctx.uniformMatrix4fv(webglGetUniformLocation(location), !!transpose, view);
    };
  var _emscripten_glUseProgram = (program) => {
      program = GL.programs[program];
      GLctx.useProgram(program);
      // Record the currently active program so that we can access the uniform
      // mapping table of that program.
      GLctx.currentProgram = program;
    };
  var _emscripten_glValidateProgram = (program) => {
      GLctx.validateProgram(GL.programs[program]);
    };
  var _emscripten_glVertexAttrib1f = (x0, x1) => GLctx.vertexAttrib1f(x0, x1);
  var _emscripten_glVertexAttrib1fv = (index, v) => {
  
      GLctx.vertexAttrib1f(index, HEAPF32[v>>2]);
    };
  var _emscripten_glVertexAttrib2f = (x0, x1, x2) => GLctx.vertexAttrib2f(x0, x1, x2);
  var _emscripten_glVertexAttrib2fv = (index, v) => {
  
      GLctx.vertexAttrib2f(index, HEAPF32[v>>2], HEAPF32[v+4>>2]);
    };
  var _emscripten_glVertexAttrib3f = (x0, x1, x2, x3) => GLctx.vertexAttrib3f(x0, x1, x2, x3);
  var _emscripten_glVertexAttrib3fv = (index, v) => {
  
      GLctx.vertexAttrib3f(index, HEAPF32[v>>2], HEAPF32[v+4>>2], HEAPF32[v+8>>2]);
    };
  var _emscripten_glVertexAttrib4f = (x0, x1, x2, x3, x4) => GLctx.vertexAttrib4f(x0, x1, x2, x3, x4);
  var _emscripten_glVertexAttrib4fv = (index, v) => {
  
      GLctx.vertexAttrib4f(index, HEAPF32[v>>2], HEAPF32[v+4>>2], HEAPF32[v+8>>2], HEAPF32[v+12>>2]);
    };
  var _emscripten_glVertexAttribDivisor = (index, divisor) => {
      GLctx.vertexAttribDivisor(index, divisor);
    };
  var _emscripten_glVertexAttribPointer = (index, size, type, normalized, stride, ptr) => {
      GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr);
    };
  var _emscripten_glViewport = (x0, x1, x2, x3) => GLctx.viewport(x0, x1, x2, x3);
  var _emscripten_has_asyncify = () => 0;
  var doRequestFullscreen = (target, strategy) => {
      if (!JSEvents.fullscreenEnabled()) return -1;
      target = findEventTarget(target);
      if (!target) return -4;
  
      if (!target.requestFullscreen
        // Safari didn't Element.requestFullscreen support until 16.4
        // See: https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen
        && !target.webkitRequestFullscreen
        ) {
        return -3;
      }
  
      // Queue this function call if we're not currently in an event handler and
      // the user saw it appropriate to do so.
      if (!JSEvents.canPerformEventHandlerRequests()) {
        if (strategy.deferUntilInEventHandler) {
          JSEvents.deferCall(JSEvents_requestFullscreen, 1 /* priority over pointer lock */, [target, strategy]);
          return 1;
        }
        return -2;
      }
  
      return JSEvents_requestFullscreen(target, strategy);
    };
  var _emscripten_request_fullscreen_strategy = (target, deferUntilInEventHandler, fullscreenStrategy) => {
      var strategy = {
        scaleMode: HEAP32[((fullscreenStrategy)>>2)],
        canvasResolutionScaleMode: HEAP32[(((fullscreenStrategy)+(4))>>2)],
        filteringMode: HEAP32[(((fullscreenStrategy)+(8))>>2)],
        deferUntilInEventHandler,
        canvasResizedCallback: HEAP32[(((fullscreenStrategy)+(12))>>2)],
        canvasResizedCallbackUserData: HEAP32[(((fullscreenStrategy)+(16))>>2)]
      };
  
      return doRequestFullscreen(target, strategy);
    };
  var _emscripten_request_pointerlock = (target, deferUntilInEventHandler) => {
      target = findEventTarget(target);
      if (!target) return -4;
      if (!target.requestPointerLock) {
        return -1;
      }
  
      // Queue this function call if we're not currently in an event handler and
      // the user saw it appropriate to do so.
      if (!JSEvents.canPerformEventHandlerRequests()) {
        if (deferUntilInEventHandler) {
          JSEvents.deferCall(requestPointerLock, 2 /* priority below fullscreen */, [target]);
          return 1;
        }
        return -2;
      }
  
      return requestPointerLock(target);
    };
  var alignMemory = (size, alignment) => {
      assert(alignment, 'alignment argument is required');
      return Math.ceil(size / alignment) * alignment;
    };
  var getHeapMax = () =>
      // Stay one Wasm page short of 4GB: while e.g. Chrome is able to allocate
      // full 4GB Wasm memories, the size will wrap back to 0 bytes in Wasm side
      // for any code that deals with heap sizes, which would require special
      // casing all heap size related code to treat 0 specially.
      2147483648;
  var growMemory = (size) => {
      var oldHeapSize = wasmMemory.buffer.byteLength;
      var pages = ((size - oldHeapSize + 65535) / 65536) | 0;
      try {
        // round size grow request up to wasm page size (fixed 64KB per spec)
        wasmMemory.grow(pages); // .grow() takes a delta compared to the previous size
        updateMemoryViews();
        return 1 /*success*/;
      } catch(e) {
        err(`growMemory: Attempted to grow heap from ${oldHeapSize} bytes to ${size} bytes, but got error: ${e}`);
      }
      // implicit 0 return to save code size (caller will cast 'undefined' into 0
      // anyhow)
    };
  var _emscripten_resize_heap = (requestedSize) => {
      var oldSize = HEAPU8.length;
      // With CAN_ADDRESS_2GB or MEMORY64, pointers are already unsigned.
      requestedSize >>>= 0;
      // With multithreaded builds, races can happen (another thread might increase the size
      // in between), so return a failure, and let the caller retry.
      assert(requestedSize > oldSize);
  
      // Memory resize rules:
      // 1.  Always increase heap size to at least the requested size, rounded up
      //     to next page multiple.
      // 2a. If MEMORY_GROWTH_LINEAR_STEP == -1, excessively resize the heap
      //     geometrically: increase the heap size according to
      //     MEMORY_GROWTH_GEOMETRIC_STEP factor (default +20%), At most
      //     overreserve by MEMORY_GROWTH_GEOMETRIC_CAP bytes (default 96MB).
      // 2b. If MEMORY_GROWTH_LINEAR_STEP != -1, excessively resize the heap
      //     linearly: increase the heap size by at least
      //     MEMORY_GROWTH_LINEAR_STEP bytes.
      // 3.  Max size for the heap is capped at 2048MB-WASM_PAGE_SIZE, or by
      //     MAXIMUM_MEMORY, or by ASAN limit, depending on which is smallest
      // 4.  If we were unable to allocate as much memory, it may be due to
      //     over-eager decision to excessively reserve due to (3) above.
      //     Hence if an allocation fails, cut down on the amount of excess
      //     growth, in an attempt to succeed to perform a smaller allocation.
  
      // A limit is set for how much we can grow. We should not exceed that
      // (the wasm binary specifies it, so if we tried, we'd fail anyhow).
      var maxHeapSize = getHeapMax();
      if (requestedSize > maxHeapSize) {
        err(`Cannot enlarge memory, requested ${requestedSize} bytes, but the limit is ${maxHeapSize} bytes!`);
        return false;
      }
  
      // Loop through potential heap size increases. If we attempt a too eager
      // reservation that fails, cut down on the attempted size and reserve a
      // smaller bump instead. (max 3 times, chosen somewhat arbitrarily)
      for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
        var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown); // ensure geometric growth
        // but limit overreserving (default to capping at +96MB overgrowth at most)
        overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296 );
  
        var newSize = Math.min(maxHeapSize, alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536));
  
        var replacement = growMemory(newSize);
        if (replacement) {
  
          return true;
        }
      }
      err(`Failed to grow the heap from ${oldSize} bytes to ${newSize} bytes, not enough memory!`);
      return false;
    };
  /** @suppress {checkTypes} */
  var _emscripten_sample_gamepad_data = () => {
      try {
        if (navigator.getGamepads) {
          return (JSEvents.lastGamepadState = navigator.getGamepads()) ? 0 : -1;
        }
      } catch(e) {
        err(`navigator.getGamepads() exists, but failed to execute with exception ${e}. Disabling Gamepad access.`);
        navigator.getGamepads = null; // Disable getGamepads() so that it won't be attempted to be used again.
      }
      return -1;
    };
  var registerBeforeUnloadEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString) => {
      var beforeUnloadEventHandlerFunc = (e) => {
        // Note: This is always called on the main browser thread, since it needs synchronously return a value!
        var confirmationMessage = getWasmTableEntry(callbackfunc)(eventTypeId, 0, userData);
  
        if (confirmationMessage) {
          confirmationMessage = UTF8ToString(confirmationMessage);
        }
        if (confirmationMessage) {
          e.preventDefault();
          e.returnValue = confirmationMessage;
          return confirmationMessage;
        }
      };
  
      var eventHandler = {
        target: findEventTarget(target),
        eventTypeString,
        eventTypeId,
        userData,
        callbackfunc,
        handlerFunc: beforeUnloadEventHandlerFunc,
        useCapture
      };
      return JSEvents.registerOrRemoveHandler(eventHandler);
    };
  var _emscripten_set_beforeunload_callback_on_thread = (userData, callbackfunc, targetThread) => {
      if (typeof onbeforeunload === 'undefined') return -1;
      // beforeunload callback can only be registered on the main browser thread, because the page will
      // go away immediately after returning from the handler, and there is no time to start proxying
      // it anywhere.
      if (targetThread !== 1) return -5;
      return registerBeforeUnloadEventCallback(2, userData, true, callbackfunc, 28, 'beforeunload');
    };
  var registerFocusEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
      const eventSize = 256;
      JSEvents.focusEvent ||= _malloc(eventSize);
  
      var focusEventHandlerFunc = (e) => {
        var nodeName = JSEvents.getNodeNameForTarget(e.target);
        var id = e.target.id ?? '';
  
        var focusEvent = JSEvents.focusEvent;
        stringToUTF8(nodeName, focusEvent + 0, 128);
        stringToUTF8(id, focusEvent + 128, 128);
  
        if (getWasmTableEntry(callbackfunc)(eventTypeId, focusEvent, userData)) e.preventDefault();
      };
  
      var eventHandler = {
        target: findEventTarget(target),
        eventTypeString,
        eventTypeId,
        userData,
        callbackfunc,
        handlerFunc: focusEventHandlerFunc,
        useCapture
      };
      return JSEvents.registerOrRemoveHandler(eventHandler);
    };
  var _emscripten_set_blur_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) =>
      registerFocusEventCallback(target, userData, useCapture, callbackfunc, 12, 'blur', targetThread);

  var fillDeviceMotionEventData = (eventStruct, e, target) => {
      var a = e.acceleration;
      var ag = e.accelerationIncludingGravity;
      var rr = e.rotationRate;
      var supportedFields = 0;
      supportedFields |= a && 1;
      supportedFields |= ag && 2;
      supportedFields |= rr && 4;
      HEAP32[(((eventStruct)+(72))>>2)] = supportedFields;
      HEAPF64[((eventStruct)>>3)] = a?.x;
      HEAPF64[(((eventStruct)+(8))>>3)] = a?.y;
      HEAPF64[(((eventStruct)+(16))>>3)] = a?.z;
      HEAPF64[(((eventStruct)+(24))>>3)] = ag?.x;
      HEAPF64[(((eventStruct)+(32))>>3)] = ag?.y;
      HEAPF64[(((eventStruct)+(40))>>3)] = ag?.z;
      HEAPF64[(((eventStruct)+(48))>>3)] = rr?.alpha;
      HEAPF64[(((eventStruct)+(56))>>3)] = rr?.beta;
      HEAPF64[(((eventStruct)+(64))>>3)] = rr?.gamma;
    };
  var registerDeviceMotionEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
      const eventSize = 80;
      JSEvents.deviceMotionEvent ||= _malloc(eventSize);
  
      var deviceMotionEventHandlerFunc = (e) => {
        fillDeviceMotionEventData(JSEvents.deviceMotionEvent, e, target); // TODO: Thread-safety with respect to emscripten_get_devicemotion_status()
  
        if (getWasmTableEntry(callbackfunc)(eventTypeId, JSEvents.deviceMotionEvent, userData)) e.preventDefault();
      };
  
      var eventHandler = {
        target: findEventTarget(target),
        eventTypeString,
        eventTypeId,
        userData,
        callbackfunc,
        handlerFunc: deviceMotionEventHandlerFunc,
        useCapture
      };
      return JSEvents.registerOrRemoveHandler(eventHandler);
    };
  var _emscripten_set_devicemotion_callback_on_thread = (userData, useCapture, callbackfunc, targetThread) =>
      registerDeviceMotionEventCallback(2, userData, useCapture, callbackfunc, 17, 'devicemotion', targetThread);
  var _emscripten_set_element_css_size = (target, width, height) => {
      target = findEventTarget(target);
      if (!target) return -4;
  
      target.style.width = width + 'px';
      target.style.height = height + 'px';
  
      return 0;
    };
  var _emscripten_set_focus_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) =>
      registerFocusEventCallback(target, userData, useCapture, callbackfunc, 13, 'focus', targetThread);
  var registerFullscreenChangeEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
      const eventSize = 276;
      JSEvents.fullscreenChangeEvent ||= _malloc(eventSize);
  
      var fullscreenChangeEventHandlerFunc = (e) => {
        var fullscreenChangeEvent = JSEvents.fullscreenChangeEvent;
        fillFullscreenChangeEventData(fullscreenChangeEvent);
  
        if (getWasmTableEntry(callbackfunc)(eventTypeId, fullscreenChangeEvent, userData)) e.preventDefault();
      };
  
      var eventHandler = {
        target,
        eventTypeString,
        eventTypeId,
        userData,
        callbackfunc,
        handlerFunc: fullscreenChangeEventHandlerFunc,
        useCapture
      };
      return JSEvents.registerOrRemoveHandler(eventHandler);
    };
  var _emscripten_set_fullscreenchange_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) => {
      if (!JSEvents.fullscreenEnabled()) return -1;
      target = findEventTarget(target);
      if (!target) return -4;
  
      // TODO: When this block is removed, also change test/test_html5_remove_event_listener.c test expectation on emscripten_set_fullscreenchange_callback().
      registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, 19, 'webkitfullscreenchange', targetThread);
  
      return registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, 19, 'fullscreenchange', targetThread);
    };
  var registerGamepadEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
      const eventSize = 1240;
      JSEvents.gamepadEvent ||= _malloc(eventSize);
  
      var gamepadEventHandlerFunc = (e) => {
        var gamepadEvent = JSEvents.gamepadEvent;
        fillGamepadEventData(gamepadEvent, e['gamepad']);
  
        if (getWasmTableEntry(callbackfunc)(eventTypeId, gamepadEvent, userData)) e.preventDefault();
      };
  
      var eventHandler = {
        target: findEventTarget(target),
        allowsDeferredCalls: true,
        eventTypeString,
        eventTypeId,
        userData,
        callbackfunc,
        handlerFunc: gamepadEventHandlerFunc,
        useCapture
      };
      return JSEvents.registerOrRemoveHandler(eventHandler);
    };
  var _emscripten_set_gamepadconnected_callback_on_thread = (userData, useCapture, callbackfunc, targetThread) => {
      if (_emscripten_sample_gamepad_data()) return -1;
      return registerGamepadEventCallback(2, userData, useCapture, callbackfunc, 26, 'gamepadconnected', targetThread);
    };
  var _emscripten_set_gamepaddisconnected_callback_on_thread = (userData, useCapture, callbackfunc, targetThread) => {
      if (_emscripten_sample_gamepad_data()) return -1;
      return registerGamepadEventCallback(2, userData, useCapture, callbackfunc, 27, 'gamepaddisconnected', targetThread);
    };
  var registerKeyEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
      const eventSize = 160;
      JSEvents.keyEvent ||= _malloc(eventSize);
  
      var keyEventHandlerFunc = (e) => {
        assert(e);
  
        var keyEventData = JSEvents.keyEvent;
        HEAPF64[((keyEventData)>>3)] = e.timeStamp;
  
        var idx = ((keyEventData)>>2);
  
        HEAP32[idx + 2] = e.location;
        HEAP8[keyEventData + 12] = e.ctrlKey;
        HEAP8[keyEventData + 13] = e.shiftKey;
        HEAP8[keyEventData + 14] = e.altKey;
        HEAP8[keyEventData + 15] = e.metaKey;
        HEAP8[keyEventData + 16] = e.repeat;
        HEAP32[idx + 5] = e.charCode;
        HEAP32[idx + 6] = e.keyCode;
        HEAP32[idx + 7] = e.which;
        stringToUTF8(e.key ?? '', keyEventData + 32, 32);
        stringToUTF8(e.code ?? '', keyEventData + 64, 32);
        stringToUTF8(e.char ?? '', keyEventData + 96, 32);
        stringToUTF8(e.locale ?? '', keyEventData + 128, 32);
  
        if (getWasmTableEntry(callbackfunc)(eventTypeId, keyEventData, userData)) e.preventDefault();
      };
  
      var eventHandler = {
        target: findEventTarget(target),
        eventTypeString,
        eventTypeId,
        userData,
        callbackfunc,
        handlerFunc: keyEventHandlerFunc,
        useCapture
      };
      return JSEvents.registerOrRemoveHandler(eventHandler);
    };
  var _emscripten_set_keydown_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) =>
      registerKeyEventCallback(target, userData, useCapture, callbackfunc, 2, 'keydown', targetThread);
  var _emscripten_set_keypress_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) =>
      registerKeyEventCallback(target, userData, useCapture, callbackfunc, 1, 'keypress', targetThread);
  var _emscripten_set_keyup_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) =>
      registerKeyEventCallback(target, userData, useCapture, callbackfunc, 3, 'keyup', targetThread);
  var _emscripten_set_main_loop = (func, fps, simulateInfiniteLoop) => {
      var iterFunc = getWasmTableEntry(func);
      setMainLoop(iterFunc, fps, simulateInfiniteLoop);
    };

  var screenOrientation = () => window.screen?.orientation;
  var fillOrientationChangeEventData = (eventStruct) => {
      // OrientationType enum
      var orientationsType1 = ['portrait-primary', 'portrait-secondary', 'landscape-primary', 'landscape-secondary'];
      // alternative selection from OrientationLockType enum
      var orientationsType2 = ['portrait',         'portrait',           'landscape',         'landscape'];
  
      var orientationIndex = 0;
      var orientationAngle = 0;
      var screenOrientObj  = screenOrientation();
      if (screenOrientObj) {
        orientationIndex = orientationsType1.indexOf(screenOrientObj.type);
        if (orientationIndex < 0) {
          orientationIndex = orientationsType2.indexOf(screenOrientObj.type);
        }
        if (orientationIndex >= 0) {
          orientationIndex = 1 << orientationIndex;
        }
        orientationAngle = screenOrientObj.angle;
      }
      else {
        // fallback for Safari earlier than 16.4 (March 2023)
        orientationAngle = window.orientation;
      }
  
      HEAP32[((eventStruct)>>2)] = orientationIndex;
      HEAP32[(((eventStruct)+(4))>>2)] = orientationAngle;
    };
  var registerOrientationChangeEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
      const eventSize = 8;
      JSEvents.orientationChangeEvent ||= _malloc(eventSize);
  
      var orientationChangeEventHandlerFunc = (e) => {
        var orientationChangeEvent = JSEvents.orientationChangeEvent;
        fillOrientationChangeEventData(orientationChangeEvent);
  
        if (getWasmTableEntry(callbackfunc)(eventTypeId, orientationChangeEvent, userData)) e.preventDefault();
      };
  
      var eventHandler = {
        target,
        eventTypeString,
        eventTypeId,
        userData,
        callbackfunc,
        handlerFunc: orientationChangeEventHandlerFunc,
        useCapture
      };
      return JSEvents.registerOrRemoveHandler(eventHandler);
    };
  var _emscripten_set_orientationchange_callback_on_thread = (userData, useCapture, callbackfunc, targetThread) => {
      if (!window.screen?.orientation) return -1;
      return registerOrientationChangeEventCallback(screen.orientation, userData, useCapture, callbackfunc, 18, 'change', targetThread);
    };
  var fillPointerlockChangeEventData = (eventStruct) => {
      var pointerLockElement = document.pointerLockElement;
      var isPointerlocked = !!pointerLockElement;
      // Assigning a boolean to HEAP32 with expected type coercion.
      /** @suppress{checkTypes} */
      HEAP8[eventStruct] = isPointerlocked;
      var nodeName = JSEvents.getNodeNameForTarget(pointerLockElement);
      var id = pointerLockElement?.id ?? '';
      stringToUTF8(nodeName, eventStruct + 1, 128);
      stringToUTF8(id, eventStruct + 129, 128);
    };
  var registerPointerlockChangeEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
      const eventSize = 257;
      JSEvents.pointerlockChangeEvent ||= _malloc(eventSize);
  
      var pointerlockChangeEventHandlerFunc = (e) => {
        var pointerlockChangeEvent = JSEvents.pointerlockChangeEvent;
        fillPointerlockChangeEventData(pointerlockChangeEvent);
  
        if (getWasmTableEntry(callbackfunc)(eventTypeId, pointerlockChangeEvent, userData)) e.preventDefault();
      };
  
      var eventHandler = {
        target,
        eventTypeString,
        eventTypeId,
        userData,
        callbackfunc,
        handlerFunc: pointerlockChangeEventHandlerFunc,
        useCapture
      };
      return JSEvents.registerOrRemoveHandler(eventHandler);
    };
  var _emscripten_set_pointerlockchange_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) => {
      if (!document.body?.requestPointerLock) {
        return -1;
      }
  
      target = findEventTarget(target);
      if (!target) return -4;
      return registerPointerlockChangeEventCallback(target, userData, useCapture, callbackfunc, 20, 'pointerlockchange', targetThread);
    };
  var registerUiEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
      const eventSize = 36;
      JSEvents.uiEvent ||= _malloc(eventSize);
  
      target = findEventTarget(target);
  
      var uiEventHandlerFunc = (e) => {
        if (e.target != target) {
          // Never take ui events such as scroll via a 'bubbled' route, but always from the direct element that
          // was targeted. Otherwise e.g. if app logs a message in response to a page scroll, the Emscripten log
          // message box could cause to scroll, generating a new (bubbled) scroll message, causing a new log print,
          // causing a new scroll, etc..
          return;
        }
  
        // Take document.body to a variable, Closure compiler does not outline access to it on its own.
        var b = document.body;
        if (!b) {
          // During a page unload 'body' can be null, with "Cannot read property 'clientWidth' of null" being thrown
          return;
        }
        var uiEvent = JSEvents.uiEvent;
        HEAP32[((uiEvent)>>2)] = 0; // always zero for resize and scroll
        HEAP32[(((uiEvent)+(4))>>2)] = b.clientWidth;
        HEAP32[(((uiEvent)+(8))>>2)] = b.clientHeight;
        HEAP32[(((uiEvent)+(12))>>2)] = innerWidth;
        HEAP32[(((uiEvent)+(16))>>2)] = innerHeight;
        HEAP32[(((uiEvent)+(20))>>2)] = outerWidth;
        HEAP32[(((uiEvent)+(24))>>2)] = outerHeight;
        HEAP32[(((uiEvent)+(28))>>2)] = pageXOffset | 0; // scroll offsets are float
        HEAP32[(((uiEvent)+(32))>>2)] = pageYOffset | 0;
        if (getWasmTableEntry(callbackfunc)(eventTypeId, uiEvent, userData)) e.preventDefault();
      };
  
      var eventHandler = {
        target,
        eventTypeString,
        eventTypeId,
        userData,
        callbackfunc,
        handlerFunc: uiEventHandlerFunc,
        useCapture
      };
      return JSEvents.registerOrRemoveHandler(eventHandler);
    };
  var _emscripten_set_resize_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) =>
      registerUiEventCallback(target, userData, useCapture, callbackfunc, 10, 'resize', targetThread);
  var fillVisibilityChangeEventData = (eventStruct) => {
      var visibilityStates = [ 'hidden', 'visible', 'prerender', 'unloaded' ];
      var visibilityState = visibilityStates.indexOf(document.visibilityState);
  
      // Assigning a boolean to HEAP32 with expected type coercion.
      /** @suppress{checkTypes} */
      HEAP8[eventStruct] = document.hidden;
      HEAP32[(((eventStruct)+(4))>>2)] = visibilityState;
    };
  var registerVisibilityChangeEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
      const eventSize = 8;
      JSEvents.visibilityChangeEvent ||= _malloc(eventSize);
  
      var visibilityChangeEventHandlerFunc = (e) => {
        var visibilityChangeEvent = JSEvents.visibilityChangeEvent;
        fillVisibilityChangeEventData(visibilityChangeEvent);
  
        if (getWasmTableEntry(callbackfunc)(eventTypeId, visibilityChangeEvent, userData)) e.preventDefault();
      };
  
      var eventHandler = {
        target,
        eventTypeString,
        eventTypeId,
        userData,
        callbackfunc,
        handlerFunc: visibilityChangeEventHandlerFunc,
        useCapture
      };
      return JSEvents.registerOrRemoveHandler(eventHandler);
    };
  var _emscripten_set_visibilitychange_callback_on_thread = (userData, useCapture, callbackfunc, targetThread) => {
    if (!specialHTMLTargets[1]) {
      return -4;
    }
      return registerVisibilityChangeEventCallback(specialHTMLTargets[1], userData, useCapture, callbackfunc, 21, 'visibilitychange', targetThread);
    };
  var fillMouseEventData = (eventStruct, e, target) => {
      assert(eventStruct % 4 == 0);
      HEAPF64[((eventStruct)>>3)] = e.timeStamp;
      var idx = ((eventStruct)>>2);
      HEAP32[idx + 2] = e.screenX;
      HEAP32[idx + 3] = e.screenY;
      HEAP32[idx + 4] = e.clientX;
      HEAP32[idx + 5] = e.clientY;
      HEAP8[eventStruct + 24] = e.ctrlKey;
      HEAP8[eventStruct + 25] = e.shiftKey;
      HEAP8[eventStruct + 26] = e.altKey;
      HEAP8[eventStruct + 27] = e.metaKey;
      HEAP16[idx*2 + 14] = e.button;
      HEAP16[idx*2 + 15] = e.buttons;
      HEAP32[idx + 8] = e.movementX;
      HEAP32[idx + 9] = e.movementY;
  
      // Note: rect contains doubles (truncated to placate SAFE_HEAP, which is the
      // same behaviour when writing to HEAP32 anyway)
      var rect = getBoundingClientRect(target);
      HEAP32[idx + 10] = e.clientX - (rect.left | 0);
      HEAP32[idx + 11] = e.clientY - (rect.top  | 0);
    };
  var registerWheelEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
      const eventSize = 96;
      JSEvents.wheelEvent ||= _malloc(eventSize)
  
      // The DOM Level 3 events spec event 'wheel'
      var wheelHandlerFunc = (e) => {
        var wheelEvent = JSEvents.wheelEvent;
        fillMouseEventData(wheelEvent, e, target);
        HEAPF64[(((wheelEvent)+(64))>>3)] = e["deltaX"];
        HEAPF64[(((wheelEvent)+(72))>>3)] = e["deltaY"];
        HEAPF64[(((wheelEvent)+(80))>>3)] = e["deltaZ"];
        HEAP32[(((wheelEvent)+(88))>>2)] = e["deltaMode"];
        if (getWasmTableEntry(callbackfunc)(eventTypeId, wheelEvent, userData)) e.preventDefault();
      };
  
      var eventHandler = {
        target,
        allowsDeferredCalls: true,
        eventTypeString,
        eventTypeId,
        userData,
        callbackfunc,
        handlerFunc: wheelHandlerFunc,
        useCapture
      };
      return JSEvents.registerOrRemoveHandler(eventHandler);
    };
  var _emscripten_set_wheel_callback_on_thread = (target, userData, useCapture, callbackfunc, targetThread) => {
      target = findEventTarget(target);
      if (!target) return -4;
      if (typeof target.onwheel !== 'undefined') {
        return registerWheelEventCallback(target, userData, useCapture, callbackfunc, 9, 'wheel', targetThread);
      } else {
        return -1;
      }
    };
  var _emscripten_set_window_title = (title) => document.title = UTF8ToString(title);
  var _emscripten_sleep = () => {
      abort('Please compile your program with async support in order to use asynchronous operations like emscripten_sleep');
    };
  var webglPowerPreferences = ["default","low-power","high-performance"];
  var __emscripten_webgl_do_create_context = (target, attributes) => {
      assert(attributes);
      var attr32 = ((attributes)>>2);
      var powerPreference = HEAP32[attr32 + (8>>2)];
      var contextAttributes = {
        'alpha': !!HEAP8[attributes + 0],
        'depth': !!HEAP8[attributes + 1],
        'stencil': !!HEAP8[attributes + 2],
        'antialias': !!HEAP8[attributes + 3],
        'premultipliedAlpha': !!HEAP8[attributes + 4],
        'preserveDrawingBuffer': !!HEAP8[attributes + 5],
        'powerPreference': webglPowerPreferences[powerPreference],
        'failIfMajorPerformanceCaveat': !!HEAP8[attributes + 12],
        'desynchronized': !!HEAP8[attributes + 33],
        // The following are not predefined WebGL context attributes in the WebGL specification, so the property names can be minified by Closure.
        majorVersion: HEAP32[attr32 + (16>>2)],
        minorVersion: HEAP32[attr32 + (20>>2)],
        enableExtensionsByDefault: HEAP8[attributes + 24],
        explicitSwapControl: HEAP8[attributes + 25],
        proxyContextToMainThread: HEAP32[attr32 + (28>>2)],
        renderViaOffscreenBackBuffer: HEAP8[attributes + 32]
      };
  
      //  TODO: Make these into hard errors at some point in the future
      if (contextAttributes.majorVersion !== 1 && contextAttributes.majorVersion !== 2) {
        err(`Invalid WebGL version requested: ${contextAttributes.majorVersion}`);
      }
      if (contextAttributes.majorVersion !== 1) {
        err('WebGL 2 requested but only WebGL 1 is supported (set -sMAX_WEBGL_VERSION=2 to fix the problem)');
      }
  
      var canvas = findCanvasEventTarget(target);
  
      if (!canvas) {
        return 0;
      }
  
      if (contextAttributes.explicitSwapControl) {
        return 0;
      }
  
      var contextHandle = GL.createContext(canvas, contextAttributes);
      return contextHandle;
    };
  var __emscripten_webgl_do_destroy_context = (contextHandle) => {
      if (GL.currentContext == contextHandle) GL.currentContext = 0;
      GL.deleteContext(contextHandle);
    };
  var _emscripten_webgl_make_context_current = (contextHandle) => {
      var success = GL.makeContextCurrent(contextHandle);
      return success ? 0 : -5;
    };
  var ENV = {
  };
  var getExecutableName = () => thisProgram;
  var getEnvStrings = () => {
      if (!getEnvStrings.strings) {
        // Default values.
        var lang = (globalThis.navigator?.language ?? 'C').replace('-', '_') + '.UTF-8';
        var env = {
          'USER': 'web_user',
          'LOGNAME': 'web_user',
          'PATH': '/',
          'PWD': '/',
          'HOME': '/home/web_user',
          'LANG': lang,
          '_': getExecutableName()
        };
        // Apply the user-provided values, if any.
        for (var x in ENV) {
          // x is a key in ENV; if ENV[x] is undefined, that means it was
          // explicitly set to be so. We allow user code to do that to
          // force variables with default values to remain unset.
          if (ENV[x] === undefined) delete env[x];
          else env[x] = ENV[x];
        }
        var strings = [];
        for (var x in env) {
          strings.push(`${x}=${env[x]}`);
        }
        getEnvStrings.strings = strings;
      }
      return getEnvStrings.strings;
    };
  var _environ_get = (__environ, environ_buf) => {
      var bufSize = 0;
      var envp = 0;
      for (var string of getEnvStrings()) {
        var ptr = environ_buf + bufSize;
        HEAPU32[(((__environ)+(envp))>>2)] = ptr;
        bufSize += stringToUTF8(string, ptr, Infinity) + 1;
        envp += 4;
      }
      return 0;
    };
  var _environ_sizes_get = (penviron_count, penviron_buf_size) => {
      var strings = getEnvStrings();
      HEAPU32[((penviron_count)>>2)] = strings.length;
      var bufSize = 0;
      for (var string of strings) {
        bufSize += lengthBytesUTF8(string) + 1;
      }
      HEAPU32[((penviron_buf_size)>>2)] = bufSize;
      return 0;
    };
  function _fd_close(fd) {
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      FS.close(stream);
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  }
  
  /** @param {number=} offset */
  var doReadv = (stream, iov, iovcnt, offset) => {
      var ret = 0;
      for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[((iov)>>2)];
        var len = HEAPU32[(((iov)+(4))>>2)];
        iov += 8;
        try {
          var curr = FS.read(stream, HEAP8, ptr, len, offset);
        } catch (e) {
          // On a non-blocking stream a subsequent read may would-block after we
          // already gathered data. POSIX readv is a single gather-read: return
          // what we have rather than failing the whole call.
          if (ret > 0 && e instanceof FS.ErrnoError &&
              (e.errno == 6 || e.errno == 6)) {
            break;
          }
          throw e;
        }
        if (curr < 0) return -1;
        ret += curr;
        if (curr < len) break; // nothing more to read
        if (typeof offset !== 'undefined') {
          offset += curr;
        }
      }
      return ret;
    };
  function _fd_read(fd, iov, iovcnt, pnum) {
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = doReadv(stream, iov, iovcnt);
      HEAPU32[((pnum)>>2)] = num;
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  }
  
  function _fd_seek(fd, offset, whence, newOffset) {
    offset = bigintToI53Checked(offset);
  
  
  try {
  
      if (isNaN(offset)) return 22;
      var stream = SYSCALLS.getStreamFromFD(fd);
      FS.llseek(stream, offset, whence);
      HEAP64[((newOffset)>>3)] = BigInt(stream.position);
      if (stream.getdents && !offset && whence === 0) stream.getdents = null; // reset readdir state
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  ;
  }
  /** @param {number=} offset */
  var doWritev = (stream, iov, iovcnt, offset) => {
      // Gather all iovecs into one contiguous buffer and issue a single
      // FS.write, matching POSIX writev's single gather-write semantics (as
      // __syscall_sendmsg already does). Per-iovec writes fragment a stream
      // socket send into multiple segments, breaking stream byte semantics.
      if (iovcnt == 1) {
        // Single iovec: write directly from HEAP8, no gather buffer needed.
        return FS.write(stream, HEAP8, HEAPU32[((iov)>>2)], HEAPU32[(((iov)+(4))>>2)], offset);
      }
      var total = 0;
      for (var i = 0, p = iov; i < iovcnt; i++, p += 8) {
        total += HEAPU32[(((p)+(4))>>2)];
      }
      var view = new Uint8Array(total);
      var voff = 0;
      for (var i = 0; i < iovcnt; i++, iov += 8) {
        var ptr = HEAPU32[((iov)>>2)];
        var len = HEAPU32[(((iov)+(4))>>2)];
        view.set(HEAPU8.subarray(ptr, ptr + len), voff);
        voff += len;
      }
      return FS.write(stream, view, 0, total, offset);
    };
  function _fd_write(fd, iov, iovcnt, pnum) {
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = doWritev(stream, iov, iovcnt);
      HEAPU32[((pnum)>>2)] = num;
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  }
  




  var autoResumeAudioContext = (ctx) => {
      for (var event of ['keydown', 'mousedown', 'touchstart']) {
        for (var element of [document, document.getElementById('canvas')]) {
          element?.addEventListener(event, () => {
            if (ctx.state === 'suspended') ctx.resume();
          }, { 'once': true });
        }
      }
    };
  var dynCall = (sig, ptr, args = [], promising = false) => {
      assert(ptr, `null function pointer in dynCall`);
      assert(!promising, 'async dynCall is not supported in this mode')
      assert(getWasmTableEntry(ptr), `missing table entry in dynCall: ${ptr}`);
      var func = getWasmTableEntry(ptr);
      var rtn = func(...args);
  
      function convert(rtn) {
        return rtn;
      }
  
      return convert(rtn);
    };



  var writeArrayToMemory = (array, buffer) => {
      assert(array.length >= 0, 'writeArrayToMemory array must have a length (should be an array or typed array)')
      HEAP8.set(array, buffer);
    };



  
    /**
   * @param {number} ptr
   * @param {number} value
   * @param {string} type
   */
  function setValue(ptr, value, type = 'i8') {
    if (type.endsWith('*')) type = '*';
    switch (type) {
      case 'i1': HEAP8[ptr] = value; break;
      case 'i8': HEAP8[ptr] = value; break;
      case 'i16': HEAP16[((ptr)>>1)] = value; break;
      case 'i32': HEAP32[((ptr)>>2)] = value; break;
      case 'i64': HEAP64[((ptr)>>3)] = BigInt(value); break;
      case 'float': HEAPF32[((ptr)>>2)] = value; break;
      case 'double': HEAPF64[((ptr)>>3)] = value; break;
      case '*': HEAPU32[((ptr)>>2)] = value; break;
      default: abort(`invalid type for setValue: ${type}`);
    }
  }




















  /** @param {number=} timeout */
  var safeSetTimeout = (func, timeout) => {
      
      var id = safeSetTimeout.nextId++;
      safeSetTimeout.pending.set(id, setTimeout(() => {
        safeSetTimeout.pending.delete(id);
        
        callUserCallback(func);
      }, timeout));
      return id;
    };
  var Browser = {
  useWebGL:false,
  isFullscreen:false,
  pointerLock:false,
  moduleContextCreatedCallbacks:[],
  preloadedImages:{
  },
  preloadedAudios:{
  },
  getCanvas:() => Module['canvas'],
  init() {
        if (Browser.initted) return;
        Browser.initted = true;
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = (name) => {
          return !Module['noImageDecoding'] && /\.(jpg|jpeg|png|bmp|webp)$/i.test(name);
        };
        imagePlugin['handle'] = async (byteArray, name) => {
          var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
          if (b.size !== byteArray.length) { // Safari bug #118630
            // Safari's Blob can only take an ArrayBuffer
            b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
          }
          var url = URL.createObjectURL(b);
          return new Promise((resolve, reject) => {
            var img = new Image();
            img.onload = () => {
              assert(img.complete, `Image ${name} could not be decoded`);
              var canvas = /** @type {!HTMLCanvasElement} */ (document.createElement('canvas'));
              canvas.width = img.width;
              canvas.height = img.height;
              var ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
              Browser.preloadedImages[name] = canvas;
              URL.revokeObjectURL(url);
              resolve(byteArray);
            };
            img.onerror = (event) => {
              err(`Image ${url} could not be decoded`);
              reject();
            };
            img.src = url;
          });
        };
        preloadPlugins.push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = (name) => {
          return !Module['noAudioDecoding'] && name.slice(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = async (byteArray, name) => {
          return new Promise((resolve, reject) => {
            var done = false;
            function finish(audio) {
              if (done) return;
              done = true;
              Browser.preloadedAudios[name] = audio;
              resolve(byteArray);
            }
            var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            var url = URL.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', () => finish(audio)); // use addEventListener due to chromium bug 124926
            audio.onerror = (event) => {
              if (done) return;
              err(`warning: browser could not fully decode audio ${name}, trying slower base64 approach`);
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                const PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var byte of data) {
                  leftchar = (leftchar << 8) | byte;
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.slice(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            safeSetTimeout(() => {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10_000);
          });
        };
        preloadPlugins.push(audioPlugin);
  
        // Canvas event setup
  
        function pointerLockChange() {
          var canvas = Browser.getCanvas();
          Browser.pointerLock = document.pointerLockElement === canvas;
        }
        var canvas = Browser.getCanvas();
        if (canvas) {
          // forced aspect ratio can be enabled by defining 'forcedAspectRatio' on Module
          // Module['forcedAspectRatio'] = 4 / 3;
  
          document.addEventListener('pointerlockchange', pointerLockChange);
  
          if (Module['elementPointerLock']) {
            canvas.addEventListener('click', (ev) => {
              if (!Browser.pointerLock && Browser.getCanvas().requestPointerLock) {
                Browser.getCanvas().requestPointerLock();
                ev.preventDefault();
              }
            });
          }
        }
      },
  createContext(/** @type {HTMLCanvasElement} */ canvas, useWebGL, setInModule, webGLContextAttributes) {
        if (useWebGL && Module['ctx'] && canvas == Browser.getCanvas()) return Module['ctx']; // no need to recreate GL context if it's already been created for this canvas.
  
        var ctx;
        var contextHandle;
        if (useWebGL) {
          // For GLES2/desktop GL compatibility, adjust a few defaults to be different to WebGL defaults, so that they align better with the desktop defaults.
          var contextAttributes = {
            antialias: false,
            alpha: false,
            majorVersion: 1,
          };
  
          if (webGLContextAttributes) {
            for (var attribute in webGLContextAttributes) {
              contextAttributes[attribute] = webGLContextAttributes[attribute];
            }
          }
  
          // This check of existence of GL is here to satisfy Closure compiler, which yells if variable GL is referenced below but GL object is not
          // actually compiled in because application is not doing any GL operations. TODO: Ideally if GL is not being used, this function
          // Browser.createContext() should not even be emitted.
          if (typeof GL !== 'undefined') {
            contextHandle = GL.createContext(canvas, contextAttributes);
            if (contextHandle) {
              ctx = GL.getContext(contextHandle).GLctx;
            }
          }
        } else {
          ctx = canvas.getContext('2d');
        }
  
        if (!ctx) return null;
  
        if (setInModule) {
          if (!useWebGL) assert(typeof GLctx === 'undefined', 'cannot set in module if GLctx is used, but we are a non-GL context that would replace it');
          Module['ctx'] = ctx;
          if (useWebGL) GL.makeContextCurrent(contextHandle);
          Browser.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach((callback) => callback());
          Browser.init();
        }
        return ctx;
      },
  fullscreenHandlersInstalled:false,
  lockPointer:undefined,
  resizeCanvas:undefined,
  requestFullscreen(lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
  
        var canvas = Browser.getCanvas();
        function fullscreenChange() {
          Browser.isFullscreen = false;
          var canvasContainer = canvas.parentNode;
          if (getFullscreenElement() === canvasContainer) {
            canvas.exitFullscreen = Browser.exitFullscreen;
            if (Browser.lockPointer) canvas.requestPointerLock?.();
            Browser.isFullscreen = true;
            if (Browser.resizeCanvas) {
              Browser.setFullscreenCanvasSize();
            } else {
              Browser.updateCanvasDimensions(canvas);
            }
          } else {
            // remove the full screen specific parent of the canvas again to restore the HTML structure from before going full screen
            canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
            canvasContainer.parentNode.removeChild(canvasContainer);
  
            if (Browser.resizeCanvas) {
              Browser.setWindowedCanvasSize();
            } else {
              Browser.updateCanvasDimensions(canvas);
            }
          }
        }
  
        if (!Browser.fullscreenHandlersInstalled) {
          Browser.fullscreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullscreenChange);
          document.addEventListener('webkitfullscreenchange', fullscreenChange);
        }
  
        // create a new parent to ensure the canvas has no siblings. this allows browsers to optimize full screen performance when its parent is the full screen root
        var canvasContainer = document.createElement('div');
        canvas.parentNode.insertBefore(canvasContainer, canvas);
        canvasContainer.appendChild(canvas);
  
        // use parent of canvas as full screen root to allow aspect ratio correction (Firefox stretches the root to screen size)
        // Safari didn't support Element.requestFullscreen until 16.4
        // See: https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen
        /** @suppress {checkTypes} */
        canvasContainer.requestFullscreen ??= (canvasContainer['webkitRequestFullscreen'] ? () => canvasContainer['webkitRequestFullscreen'](Element.ALLOW_KEYBOARD_INPUT) : null) ??
                                              (canvasContainer['webkitRequestFullScreen'] ? () => canvasContainer['webkitRequestFullScreen'](Element.ALLOW_KEYBOARD_INPUT) : null);
  
        canvasContainer.requestFullscreen();
      },
  exitFullscreen() {
        // This is workaround for chrome. Trying to exit from fullscreen
        // not in fullscreen state will cause 'TypeError: Document not active'
        // in chrome. See https://github.com/emscripten-core/emscripten/pull/8236
        if (!Browser.isFullscreen) {
          return false;
        }
  
        var CFS = document.exitFullscreen ?? document['webkitCancelFullScreen'];
        CFS.call(document);
        return true;
      },
  getMimetype(name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.slice(name.lastIndexOf('.')+1)];
      },
  getMouseWheelDelta(event) {
        var delta = 0;
        switch (event.type) {
          case 'DOMMouseScroll':
            // 3 lines make up a step
            delta = event.detail / 3;
            break;
          case 'mousewheel':
            // 120 units make up a step
            delta = event.wheelDelta / 120;
            break;
          case 'wheel':
            delta = event.deltaY
            switch (event.deltaMode) {
              case 0:
                // DOM_DELTA_PIXEL: 100 pixels make up a step
                delta /= 100;
                break;
              case 1:
                // DOM_DELTA_LINE: 3 lines make up a step
                delta /= 3;
                break;
              case 2:
                // DOM_DELTA_PAGE: A page makes up 80 steps
                delta *= 80;
                break;
              default:
                abort('unrecognized mouse wheel delta mode: ' + event.deltaMode);
            }
            break;
          default:
            abort('unrecognized mouse wheel event: ' + event.type);
        }
        return delta;
      },
  mouseX:0,
  mouseY:0,
  mouseMovementX:0,
  mouseMovementY:0,
  touches:{
  },
  lastTouches:{
  },
  calculateMouseCoords(pageX, pageY) {
        // Calculate the movement based on the changes
        // in the coordinates.
        var canvas = Browser.getCanvas();
        var rect = canvas.getBoundingClientRect();
  
        var adjustedX = pageX - (window.scrollX + rect.left);
        var adjustedY = pageY - (window.scrollY + rect.top);
  
        // the canvas might be CSS-scaled compared to its backbuffer;
        // SDL-using content will want mouse coordinates in terms
        // of backbuffer units.
        adjustedX = adjustedX * (canvas.width / rect.width);
        adjustedY = adjustedY * (canvas.height / rect.height);
  
        return { x: adjustedX, y: adjustedY };
      },
  setMouseCoords(pageX, pageY) {
        const {x, y} = Browser.calculateMouseCoords(pageX, pageY);
        Browser.mouseMovementX = x - Browser.mouseX;
        Browser.mouseMovementY = y - Browser.mouseY;
        Browser.mouseX = x;
        Browser.mouseY = y;
      },
  calculateMouseEvent(event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          Browser.mouseMovementX = event.movementX;
          Browser.mouseMovementY = event.movementY;
  
          // add the mouse delta to the current absolute mouse position
          Browser.mouseX += Browser.mouseMovementX;
          Browser.mouseY += Browser.mouseMovementY;
        } else {
          if (event.type === 'touchstart' || event.type === 'touchend' || event.type === 'touchmove') {
            var touch = event.touch;
            if (touch === undefined) {
              return; // the 'touch' property is only defined in SDL
  
            }
            var coords = Browser.calculateMouseCoords(touch.pageX, touch.pageY);
  
            if (event.type === 'touchstart') {
              Browser.lastTouches[touch.identifier] = coords;
              Browser.touches[touch.identifier] = coords;
            } else if (event.type === 'touchend' || event.type === 'touchmove') {
              var last = Browser.touches[touch.identifier];
              last ||= coords;
              Browser.lastTouches[touch.identifier] = last;
              Browser.touches[touch.identifier] = coords;
            }
            return;
          }
  
          Browser.setMouseCoords(event.pageX, event.pageY);
        }
      },
  resizeListeners:[],
  updateResizeListeners() {
        var canvas = Browser.getCanvas();
        Browser.resizeListeners.forEach((listener) => listener(canvas.width, canvas.height));
      },
  setCanvasSize(width, height, noUpdates = undefined) {
        var canvas = Browser.getCanvas();
        Browser.updateCanvasDimensions(canvas, width, height);
        if (!noUpdates) Browser.updateResizeListeners();
      },
  setFullscreenCanvasSize() {
        // check if SDL is available
        if (typeof SDL !== 'undefined') {
          var flags = HEAPU32[((SDL.screen)>>2)];
          flags = flags | 8388608;
          HEAP32[((SDL.screen)>>2)] = flags;
        }
        Browser.updateCanvasDimensions(Browser.getCanvas());
        Browser.updateResizeListeners();
      },
  setWindowedCanvasSize() {
        // check if SDL is available
        if (typeof SDL !== 'undefined') {
          var flags = HEAPU32[((SDL.screen)>>2)];
          flags = flags & ~8388608;
          HEAP32[((SDL.screen)>>2)] = flags;
        }
        Browser.updateCanvasDimensions(Browser.getCanvas());
        Browser.updateResizeListeners();
      },
  updateCanvasDimensions(canvas, wNative = undefined, hNative = undefined) {
        if (wNative && hNative) {
          canvas.widthNative = wNative;
          canvas.heightNative = hNative;
        } else {
          wNative = canvas.widthNative;
          hNative = canvas.heightNative;
        }
        var w = wNative;
        var h = hNative;
        if ((getFullscreenElement() === canvas.parentNode) && (typeof screen !== 'undefined')) {
           var factor = Math.min(screen.width / w, screen.height / h);
           w = Math.round(w * factor);
           h = Math.round(h * factor);
        }
        if (Browser.resizeCanvas) {
          if (canvas.width  != w) canvas.width  = w;
          if (canvas.height != h) canvas.height = h;
          if (typeof canvas.style !== 'undefined') {
            canvas.style.removeProperty( 'width');
            canvas.style.removeProperty('height');
          }
        } else {
          if (canvas.width  != wNative) canvas.width  = wNative;
          if (canvas.height != hNative) canvas.height = hNative;
          if (typeof canvas.style !== 'undefined') {
            if (w != wNative || h != hNative) {
              canvas.style.setProperty( 'width', w + 'px', 'important');
              canvas.style.setProperty('height', h + 'px', 'important');
            } else {
              canvas.style.removeProperty( 'width');
              canvas.style.removeProperty('height');
            }
          }
        }
      },
  };
  var requestFullscreen = Browser.requestFullscreen;
  var FS_createPath = (...args) => FS.createPath(...args);


  var FS_unlink = (...args) => FS.unlink(...args);
  var FS_createLazyFile = (...args) => FS.createLazyFile(...args);
  var FS_createDevice = (...args) => FS.createDevice(...args);


  var syscallGetVarargP = syscallGetVarargI;
  var _emscripten_asm_const_double_sync_on_main_thread = _emscripten_asm_const_int_sync_on_main_thread;
  var _exit = exitJS;
  var findCanvasEventTarget = findEventTarget;
  var _emscripten_glBindVertexArrayOES = _emscripten_glBindVertexArray;
  var _emscripten_glDeleteVertexArraysOES = _emscripten_glDeleteVertexArrays;
  var _emscripten_glDrawArraysInstancedANGLE = _emscripten_glDrawArraysInstanced;
  var _emscripten_glDrawBuffersWEBGL = _emscripten_glDrawBuffers;
  var _emscripten_glDrawElementsInstancedANGLE = _emscripten_glDrawElementsInstanced;
  var _emscripten_glGenVertexArraysOES = _emscripten_glGenVertexArrays;
  var _emscripten_glGetQueryObjectui64vEXT = _emscripten_glGetQueryObjecti64vEXT;
  var _emscripten_glGetQueryObjectuivEXT = _emscripten_glGetQueryObjectivEXT;
  var _emscripten_glIsVertexArrayOES = _emscripten_glIsVertexArray;
  var _emscripten_glVertexAttribDivisorANGLE = _emscripten_glVertexAttribDivisor;
  var _emscripten_webgl_create_context = __emscripten_webgl_do_create_context;
  var _emscripten_webgl_destroy_context = __emscripten_webgl_do_destroy_context;
  
  FS.createPreloadedFile = FS_createPreloadedFile;
  FS.preloadFile = FS_preloadFile;
  FS.staticInit();;
  
      Module['requestAnimationFrame'] = MainLoop.requestAnimationFrame;
      Module['pauseMainLoop'] = MainLoop.pause;
      Module['resumeMainLoop'] = MainLoop.resume;
      MainLoop.init();;
  for (let i = 0; i < 32; ++i) tempFixedLengthArray.push(new Array(i));;
  var miniTempWebGLFloatBuffersStorage = new Float32Array(GL_POOL_TEMP_BUFFERS_SIZE);
  // Create GL_POOL_TEMP_BUFFERS_SIZE+1 temporary buffers, for uploads of size 0 through GL_POOL_TEMP_BUFFERS_SIZE inclusive
  for (let i = 0; i <= GL_POOL_TEMP_BUFFERS_SIZE; ++i) {
    miniTempWebGLFloatBuffers[i] = miniTempWebGLFloatBuffersStorage.subarray(0, i);
  };
  var miniTempWebGLIntBuffersStorage = new Int32Array(GL_POOL_TEMP_BUFFERS_SIZE);
  // Create GL_POOL_TEMP_BUFFERS_SIZE+1 temporary buffers, for uploads of size 0 through GL_POOL_TEMP_BUFFERS_SIZE inclusive
  for (let i = 0; i <= GL_POOL_TEMP_BUFFERS_SIZE; ++i) {
    miniTempWebGLIntBuffers[i] = miniTempWebGLIntBuffersStorage.subarray(0, i);
  };
  safeSetTimeout.pending = new Map(); safeSetTimeout.nextId = 1;;
// End JS library code

// include: postlibrary.js
// This file is included after the automatically-generated JS library code
// but before the wasm module is created.

{

  // Begin ATMODULES hooks
  if (Module['noExitRuntime']) noExitRuntime = Module['noExitRuntime'];

if (Module['print']) out = Module['print'];
if (Module['printErr']) err = Module['printErr'];
  // End ATMODULES hooks

  checkIncomingModuleAPI();

  if (Module['arguments']) programArgs = Module['arguments'];
  if (Module['thisProgram']) thisProgram = Module['thisProgram'];

  // Assertions on removed incoming Module JS APIs.
  assert(typeof Module['memoryInitializerPrefixURL'] === 'undefined', 'Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['pthreadMainPrefixURL'] === 'undefined', 'Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['cdInitializerPrefixURL'] === 'undefined', 'Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['filePackagePrefixURL'] === 'undefined', 'Module.filePackagePrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['read'] === 'undefined', 'Module.read option was removed');
  assert(typeof Module['readAsync'] === 'undefined', 'Module.readAsync option was removed (modify readAsync in JS)');
  assert(typeof Module['readBinary'] === 'undefined', 'Module.readBinary option was removed (modify readBinary in JS)');
  assert(typeof Module['setWindowTitle'] === 'undefined', 'Module.setWindowTitle option was removed (modify emscripten_set_window_title in JS)');
  assert(typeof Module['TOTAL_MEMORY'] === 'undefined', 'Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY');
  assert(typeof Module['ENVIRONMENT'] === 'undefined', 'Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)');
  assert(typeof Module['STACK_SIZE'] === 'undefined', 'STACK_SIZE can no longer be set at runtime.  Use -sSTACK_SIZE at link time')
  // If memory is defined in wasm, the user can't provide it, or set INITIAL_MEMORY
  assert(typeof Module['wasmMemory'] === 'undefined', 'Use of `wasmMemory` detected.  Use -sIMPORTED_MEMORY to define wasmMemory externally');
  assert(typeof Module['INITIAL_MEMORY'] === 'undefined', 'Detected runtime INITIAL_MEMORY setting.  Use -sIMPORTED_MEMORY to define wasmMemory dynamically');

  var preInit = Module['preInit'];
  if (preInit) {
    if (typeof preInit === 'function') Module['preInit'] = preInit = [preInit];
    // Written as a loop so that preInit functions that themselves add more
    // preInit functions.  Is this actually needed?
    while (preInit.length > 0) {
      preInit.shift()();
    }
  }
  consumedModuleProp('preInit');
}

// Begin runtime exports
  Module['addRunDependency'] = addRunDependency;
  Module['removeRunDependency'] = removeRunDependency;
  Module['requestFullscreen'] = requestFullscreen;
  Module['FS_preloadFile'] = FS_preloadFile;
  Module['FS_unlink'] = FS_unlink;
  Module['FS_createPath'] = FS_createPath;
  Module['FS_createDevice'] = FS_createDevice;
  Module['FS_createDataFile'] = FS_createDataFile;
  Module['FS_createLazyFile'] = FS_createLazyFile;
  var missingLibrarySymbols = [
  'writeI53ToI64Clamped',
  'writeI53ToI64Signaling',
  'writeI53ToU64Clamped',
  'writeI53ToU64Signaling',
  'convertI32PairToI53',
  'convertI32PairToI53Checked',
  'convertU32PairToI53',
  'getTempRet0',
  'setTempRet0',
  'createNamedFunction',
  'zeroMemory',
  'withStackSave',
  'inetPton4',
  'inetNtop4',
  'inetPton6',
  'inetNtop6',
  'readSockaddr',
  'writeSockaddr',
  'getDynCaller',
  'runtimeKeepalivePush',
  'runtimeKeepalivePop',
  'asmjsMangle',
  'HandleAllocator',
  'addOnInit',
  'addOnPostCtor',
  'addOnPreMain',
  'addOnExit',
  'STACK_SIZE',
  'POINTER_SIZE',
  'ASSERTIONS',
  'ccall',
  'cwrap',
  'convertJsFunctionToWasm',
  'getEmptyTableSlot',
  'updateTableMap',
  'getFunctionAddress',
  'addFunction',
  'removeFunction',
  'getValue',
  'intArrayToString',
  'AsciiToString',
  'stringToAscii',
  'UTF16ToString',
  'stringToUTF16',
  'lengthBytesUTF16',
  'UTF32ToString',
  'stringToUTF32',
  'lengthBytesUTF32',
  'registerMouseEventCallback',
  'fillDeviceOrientationEventData',
  'registerDeviceOrientationEventCallback',
  'hideEverythingExceptGivenElement',
  'restoreHiddenElements',
  'softFullscreenResizeWebGLRenderTarget',
  'registerPointerlockErrorEventCallback',
  'registerTouchEventCallback',
  'fillBatteryEventData',
  'registerBatteryEventCallback',
  'jsStackTrace',
  'getCallstack',
  'convertPCtoSourceLocation',
  'wasiRightsToMuslOFlags',
  'wasiOFlagsToMuslOFlags',
  'safeClearTimeout',
  'setImmediateWrapped',
  'safeRequestAnimationFrame',
  'clearImmediateWrapped',
  'registerPostMainLoop',
  'registerPreMainLoop',
  'getPromise',
  'makePromise',
  'addPromise',
  'idsToPromises',
  'makePromiseCallback',
  'uncaughtExceptionCount',
  'ExceptionInfo',
  'findMatchingCatch',
  'incrementUncaughtExceptionCount',
  'decrementUncaughtExceptionCount',
  'Browser_asyncPrepareDataCounter',
  'isLeapYear',
  'ydayFromDate',
  'arraySum',
  'addDays',
  'getSocketFromFD',
  'getSocketAddress',
  'FS_mkdirTree',
  '_setNetworkCallback',
  'writeGLArray',
  'registerWebGlEventCallback',
  'runAndAbortIfError',
  'writeStringToMemory',
  'writeAsciiToMemory',
  'allocateUTF8',
  'allocateUTF8OnStack',
  'demangle',
  'stackTrace',
  'getNativeTypeSize',
];
missingLibrarySymbols.forEach(missingLibrarySymbol)

  var unexportedSymbols = [
  'run',
  'out',
  'err',
  'callMain',
  'abort',
  'wasmExports',
  'writeStackCookie',
  'checkStackCookie',
  'writeI53ToI64',
  'readI53FromI64',
  'readI53FromU64',
  'INT53_MAX',
  'INT53_MIN',
  'bigintToI53Checked',
  'HEAP8',
  'HEAPU8',
  'HEAP16',
  'HEAPU16',
  'HEAP32',
  'HEAPU32',
  'HEAPF32',
  'HEAPF64',
  'HEAP64',
  'HEAPU64',
  'stackSave',
  'stackRestore',
  'stackAlloc',
  'ptrToString',
  'exitJS',
  'getHeapMax',
  'growMemory',
  'ENV',
  'ERRNO_CODES',
  'strError',
  'DNS',
  'Protocols',
  'timers',
  'warnOnce',
  'readEmAsmArgsArray',
  'readEmAsmArgs',
  'runEmAsmFunction',
  'runMainThreadEmAsm',
  'jstoi_q',
  'getExecutableName',
  'autoResumeAudioContext',
  'dynCall',
  'getWasmTableEntry',
  'handleException',
  'keepRuntimeAlive',
  'callUserCallback',
  'maybeExit',
  'asyncLoad',
  'alignMemory',
  'mmapAlloc',
  'wasmTable',
  'wasmMemory',
  'getUniqueRunDependency',
  'noExitRuntime',
  'addOnPreRun',
  'addOnPostRun',
  'STACK_ALIGN',
  'freeTableIndexes',
  'functionsInTableMap',
  'setValue',
  'PATH',
  'PATH_FS',
  'UTF8Decoder',
  'UTF8ArrayToString',
  'UTF8ToString',
  'stringToUTF8Array',
  'stringToUTF8',
  'lengthBytesUTF8',
  'intArrayFromString',
  'UTF16Decoder',
  'stringToNewUTF8',
  'stringToUTF8OnStack',
  'writeArrayToMemory',
  'JSEvents',
  'registerKeyEventCallback',
  'specialHTMLTargets',
  'maybeCStringToJsString',
  'findEventTarget',
  'findCanvasEventTarget',
  'getBoundingClientRect',
  'fillMouseEventData',
  'registerWheelEventCallback',
  'registerUiEventCallback',
  'registerFocusEventCallback',
  'fillDeviceMotionEventData',
  'registerDeviceMotionEventCallback',
  'screenOrientation',
  'fillOrientationChangeEventData',
  'registerOrientationChangeEventCallback',
  'fillFullscreenChangeEventData',
  'registerFullscreenChangeEventCallback',
  'callCanvasResizedCallback',
  'JSEvents_requestFullscreen',
  'JSEvents_resizeCanvasForFullscreen',
  'registerRestoreOldStyle',
  'setLetterbox',
  'currentFullscreenStrategy',
  'restoreOldWindowedStyle',
  'doRequestFullscreen',
  'fillPointerlockChangeEventData',
  'registerPointerlockChangeEventCallback',
  'requestPointerLock',
  'fillVisibilityChangeEventData',
  'registerVisibilityChangeEventCallback',
  'fillGamepadEventData',
  'registerGamepadEventCallback',
  'registerBeforeUnloadEventCallback',
  'setCanvasElementSize',
  'getCanvasElementSize',
  'UNWIND_CACHE',
  'ExitStatus',
  'getEnvStrings',
  'checkWasiClock',
  'doReadv',
  'doWritev',
  'initRandomFill',
  'randomFill',
  'safeSetTimeout',
  'emSetImmediate',
  'emClearImmediate',
  'promiseMap',
  'exceptionCaught',
  'Browser',
  'setCanvasSize',
  'createContext',
  'wget',
  'MONTH_DAYS_REGULAR',
  'MONTH_DAYS_LEAP',
  'MONTH_DAYS_REGULAR_CUMULATIVE',
  'MONTH_DAYS_LEAP_CUMULATIVE',
  'SYSCALLS',
  'preloadPlugins',
  'FS_createPreloadedFile',
  'FS_modeStringToFlags',
  'FS_getMode',
  'FS_fileDataToTypedArray',
  'FS_stdin_getChar_buffer',
  'FS_stdin_getChar',
  'FS_readFile',
  'FS',
  'FS_lookupPath',
  'FS_getPath',
  'FS_hashName',
  'FS_hashAddNode',
  'FS_hashRemoveNode',
  'FS_lookupNode',
  'FS_createNode',
  'FS_destroyNode',
  'FS_isRoot',
  'FS_isMountpoint',
  'FS_isFile',
  'FS_isDir',
  'FS_isLink',
  'FS_isChrdev',
  'FS_isBlkdev',
  'FS_isFIFO',
  'FS_isSocket',
  'FS_flagsToPermissionString',
  'FS_nodePermissions',
  'FS_mayLookup',
  'FS_mayCreate',
  'FS_mayDelete',
  'FS_mayOpen',
  'FS_checkOpExists',
  'FS_nextfd',
  'FS_getStreamChecked',
  'FS_getStream',
  'FS_createStream',
  'FS_closeStream',
  'FS_dupStream',
  'FS_doSetAttr',
  'FS_major',
  'FS_minor',
  'FS_makedev',
  'FS_registerDevice',
  'FS_getDevice',
  'FS_getMounts',
  'FS_syncfs',
  'FS_mount',
  'FS_unmount',
  'FS_lookup',
  'FS_mknod',
  'FS_statfs',
  'FS_statfsStream',
  'FS_statfsNode',
  'FS_create',
  'FS_mkdir',
  'FS_mkdev',
  'FS_symlink',
  'FS_link',
  'FS_rename',
  'FS_rmdir',
  'FS_readdir',
  'FS_readlink',
  'FS_stat',
  'FS_fstat',
  'FS_lstat',
  'FS_doChmod',
  'FS_chmod',
  'FS_lchmod',
  'FS_fchmod',
  'FS_doChown',
  'FS_chown',
  'FS_lchown',
  'FS_fchown',
  'FS_doTruncate',
  'FS_truncate',
  'FS_ftruncate',
  'FS_utime',
  'FS_open',
  'FS_close',
  'FS_isClosed',
  'FS_llseek',
  'FS_read',
  'FS_write',
  'FS_mmap',
  'FS_msync',
  'FS_ioctl',
  'FS_writeFile',
  'FS_cwd',
  'FS_chdir',
  'FS_createDefaultDirectories',
  'FS_createDefaultDevices',
  'FS_createSpecialDirectories',
  'FS_createStandardStreams',
  'FS_staticInit',
  'FS_init',
  'FS_quit',
  'FS_analyzePath',
  'FS_createFile',
  'FS_forceLoadFile',
  'MEMFS',
  'TTY',
  'PIPEFS',
  'SOCKFS',
  'tempFixedLengthArray',
  'miniTempWebGLFloatBuffers',
  'miniTempWebGLIntBuffers',
  'heapObjectForWebGLType',
  'toTypedArrayIndex',
  'webgl_enable_ANGLE_instanced_arrays',
  'webgl_enable_OES_vertex_array_object',
  'webgl_enable_WEBGL_draw_buffers',
  'webgl_enable_WEBGL_multi_draw',
  'webgl_enable_EXT_polygon_offset_clamp',
  'webgl_enable_EXT_clip_control',
  'webgl_enable_WEBGL_polygon_mode',
  'GL',
  'emscriptenWebGLGet',
  'computeUnpackAlignedImageSize',
  'colorChannelsInGlTextureFormat',
  'emscriptenWebGLGetTexPixelData',
  'emscriptenWebGLGetUniform',
  'webglGetProgramUniformLocation',
  'webglGetUniformLocation',
  'webglPrepareUniformLocationsBeforeFirstUse',
  'webglGetLeftBracePos',
  'emscriptenWebGLGetVertexAttrib',
  '__glGetActiveAttribOrUniform',
  'AL',
  'GLUT',
  'EGL',
  'GLEW',
  'IDBStore',
  'SDL',
  'SDL_gfx',
  'print',
  'printErr',
  'jstoi_s',
];
unexportedSymbols.forEach(unexportedRuntimeSymbol);

  // End runtime exports
  // Begin JS library exports
  // End JS library exports

// end include: postlibrary.js

function checkIncomingModuleAPI() {
  ignoredModuleProp('fetchSettings');
  ignoredModuleProp('logReadFiles');
  ignoredModuleProp('loadSplitModule');
  ignoredModuleProp('onMalloc');
  ignoredModuleProp('onRealloc');
  ignoredModuleProp('onFree');
  ignoredModuleProp('onSbrkGrow');
  ignoredModuleProp('onCOSCacheHit');
  ignoredModuleProp('onCOSCacheMiss');
  ignoredModuleProp('onCOSStore');
  ignoredModuleProp('GL_MAX_TEXTURE_IMAGE_UNITS');
  ignoredModuleProp('SDL_canPlayWithWebAudio');
  ignoredModuleProp('SDL_numSimultaneouslyQueuedBuffers');
  ignoredModuleProp('freePreloadedMediaOnUse');
  ignoredModuleProp('preinitializedWebGLContext');
  ignoredModuleProp('keyboardListeningElement');
  ignoredModuleProp('doNotCaptureKeyboard');
  ignoredModuleProp('extraStackTrace');
  ignoredModuleProp('preloadPlugins');
  ignoredModuleProp('preMainLoop');
  ignoredModuleProp('postMainLoop');
  ignoredModuleProp('forcedAspectRatio');
  ignoredModuleProp('mainScriptUrlOrBlob');
  ignoredModuleProp('onFullScreen');
  ignoredModuleProp('INITIAL_MEMORY');
  ignoredModuleProp('wasmMemory');
  ignoredModuleProp('wasmBinary');
}
var ASM_CONSTS = {
  376692: () => { if (typeof(Module['SDL3']) === 'undefined') { Module['SDL3'] = {}; } var SDL3 = Module['SDL3']; if (typeof(SDL3.JSVarToCPtr) === 'undefined') { SDL3.JSVarToCPtr = function(v) { return v; }; } if (typeof(SDL3.CPtrToHeap32Index) === 'undefined') { SDL3.CPtrToHeap32Index = function(ptr) { return ptr >>> 2; }; } },  
 377006: ($0) => { var str = UTF8ToString($0) + '\n\n' + 'Abort/Retry/Ignore/AlwaysIgnore? [ariA] :'; var reply = window.prompt(str, "i"); if (reply === null) { reply = "i"; } return reply.length === 1 ? reply.charCodeAt(0) : -1; },  
 377221: () => { Module['SDL3'].dummy_audio = {}; Module['SDL3'].dummy_audio.timers = []; Module['SDL3'].dummy_audio.timers[0] = undefined; Module['SDL3'].dummy_audio.timers[1] = undefined; },  
 377398: ($0, $1, $2, $3, $4) => { var a = Module['SDL3'].dummy_audio; if (a.timers[$0] !== undefined) { clearInterval(a.timers[$0]); } a.timers[$0] = setInterval(function() { dynCall('vi', $3, [$4]); }, ($1 / $2) * 1000); },  
 377590: ($0) => { var a = Module['SDL3'].dummy_audio; if (a.timers[$0] !== undefined) { clearInterval(a.timers[$0]); } a.timers[$0] = undefined; },  
 377721: () => { if (typeof(AudioContext) !== 'undefined') { return true; } else if (typeof(webkitAudioContext) !== 'undefined') { return true; } return false; },  
 377868: () => { if ((typeof(navigator.mediaDevices) !== 'undefined') && (typeof(navigator.mediaDevices.getUserMedia) !== 'undefined')) { return true; } return false; },  
 378022: () => { var SDL3 = Module['SDL3']; if (typeof(SDL3.audio_playback) === 'undefined') { SDL3.audio_playback = {}; } if (typeof(SDL3.audio_recording) === 'undefined') { SDL3.audio_recording = {}; } if (!SDL3.audioContext) { if (typeof(AudioContext) !== 'undefined') { SDL3.audioContext = new AudioContext(); } else if (typeof(webkitAudioContext) !== 'undefined') { SDL3.audioContext = new webkitAudioContext(); } if (SDL3.audioContext) { if ((typeof navigator.userActivation) === 'undefined') { autoResumeAudioContext(SDL3.audioContext); } } } return (SDL3.audioContext !== undefined); },  
 378601: () => { return Module['SDL3'].audioContext.sampleRate; },  
 378652: ($0, $1, $2, $3) => { var SDL3 = Module['SDL3']; var have_microphone = function(stream) { if (SDL3.audio_recording.silenceTimer !== undefined) { clearInterval(SDL3.audio_recording.silenceTimer); SDL3.audio_recording.silenceTimer = undefined; SDL3.audio_recording.silenceBuffer = undefined } SDL3.audio_recording.mediaStreamNode = SDL3.audioContext.createMediaStreamSource(stream); SDL3.audio_recording.scriptProcessorNode = SDL3.audioContext.createScriptProcessor($1, $0, 1); SDL3.audio_recording.scriptProcessorNode.onaudioprocess = function(audioProcessingEvent) { if ((SDL3 === undefined) || (SDL3.audio_recording === undefined)) { return; } audioProcessingEvent.outputBuffer.getChannelData(0).fill(0.0); SDL3.audio_recording.currentRecordingBuffer = audioProcessingEvent.inputBuffer; dynCall('ip', $2, [$3]); }; SDL3.audio_recording.mediaStreamNode.connect(SDL3.audio_recording.scriptProcessorNode); SDL3.audio_recording.scriptProcessorNode.connect(SDL3.audioContext.destination); SDL3.audio_recording.stream = stream; }; var no_microphone = function(error) { }; SDL3.audio_recording.silenceBuffer = SDL3.audioContext.createBuffer($0, $1, SDL3.audioContext.sampleRate); SDL3.audio_recording.silenceBuffer.getChannelData(0).fill(0.0); var silence_callback = function() { SDL3.audio_recording.currentRecordingBuffer = SDL3.audio_recording.silenceBuffer; dynCall('ip', $2, [$3]); }; SDL3.audio_recording.silenceTimer = setInterval(silence_callback, ($1 / SDL3.audioContext.sampleRate) * 1000); if ((navigator.mediaDevices !== undefined) && (navigator.mediaDevices.getUserMedia !== undefined)) { navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(have_microphone).catch(no_microphone); } },  
 380343: ($0, $1, $2, $3) => { var SDL3 = Module['SDL3']; SDL3.audio_playback.scriptProcessorNode = SDL3.audioContext['createScriptProcessor']($1, 0, $0); SDL3.audio_playback.scriptProcessorNode['onaudioprocess'] = function (e) { if ((SDL3 === undefined) || (SDL3.audio_playback === undefined)) { return; } if (SDL3.audio_playback.silenceTimer !== undefined) { clearInterval(SDL3.audio_playback.silenceTimer); SDL3.audio_playback.silenceTimer = undefined; SDL3.audio_playback.silenceBuffer = undefined; } SDL3.audio_playback.currentPlaybackBuffer = e['outputBuffer']; dynCall('ip', $2, [$3]); }; SDL3.audio_playback.scriptProcessorNode['connect'](SDL3.audioContext['destination']); if (SDL3.audioContext.state === 'suspended') { SDL3.audio_playback.silenceBuffer = SDL3.audioContext.createBuffer($0, $1, SDL3.audioContext.sampleRate); SDL3.audio_playback.silenceBuffer.getChannelData(0).fill(0.0); var silence_callback = function() { if ((typeof navigator.userActivation) !== 'undefined') { if (navigator.userActivation.hasBeenActive) { SDL3.audioContext.resume(); } } SDL3.audio_playback.currentPlaybackBuffer = SDL3.audio_playback.silenceBuffer; dynCall('ip', $2, [$3]); SDL3.audio_playback.currentPlaybackBuffer = undefined; }; SDL3.audio_playback.silenceTimer = setInterval(silence_callback, ($1 / SDL3.audioContext.sampleRate) * 1000); } },  
 381659: ($0) => { var SDL3 = Module['SDL3']; if ($0) { if (SDL3.audio_recording.silenceTimer !== undefined) { clearInterval(SDL3.audio_recording.silenceTimer); } if (SDL3.audio_recording.stream !== undefined) { var tracks = SDL3.audio_recording.stream.getAudioTracks(); for (var i = 0; i < tracks.length; i++) { SDL3.audio_recording.stream.removeTrack(tracks[i]); } } if (SDL3.audio_recording.scriptProcessorNode !== undefined) { SDL3.audio_recording.scriptProcessorNode.onaudioprocess = function(audioProcessingEvent) {}; SDL3.audio_recording.scriptProcessorNode.disconnect(); } if (SDL3.audio_recording.mediaStreamNode !== undefined) { SDL3.audio_recording.mediaStreamNode.disconnect(); } SDL3.audio_recording = undefined; } else { if (SDL3.audio_playback.scriptProcessorNode != undefined) { SDL3.audio_playback.scriptProcessorNode.disconnect(); } if (SDL3.audio_playback.silenceTimer !== undefined) { clearInterval(SDL3.audio_playback.silenceTimer); } SDL3.audio_playback = undefined; } if ((SDL3.audioContext !== undefined) && (SDL3.audio_playback === undefined) && (SDL3.audio_recording === undefined)) { SDL3.audioContext.close(); SDL3.audioContext = undefined; } },  
 382815: ($0, $1) => { var SDL3 = Module['SDL3']; var buf = SDL3.CPtrToHeap32Index($0); var numChannels = SDL3.audio_playback.currentPlaybackBuffer['numberOfChannels']; for (var c = 0; c < numChannels; ++c) { var channelData = SDL3.audio_playback.currentPlaybackBuffer['getChannelData'](c); if (channelData.length != $1) { throw 'Web Audio playback buffer length mismatch! Destination size: ' + channelData.length + ' samples vs expected ' + $1 + ' samples!'; } for (var j = 0; j < $1; ++j) { channelData[j] = HEAPF32[buf + (j * numChannels + c)]; } } },  
 383348: ($0, $1) => { var SDL3 = Module['SDL3']; var numChannels = SDL3.audio_recording.currentRecordingBuffer.numberOfChannels; for (var c = 0; c < numChannels; ++c) { var channelData = SDL3.audio_recording.currentRecordingBuffer.getChannelData(c); if (channelData.length != $1) { throw 'Web Audio recording buffer length mismatch! Destination size: ' + channelData.length + ' samples vs expected ' + $1 + ' samples!'; } if (numChannels == 1) { for (var j = 0; j < $1; ++j) { setValue($0 + (j * 4), channelData[j], 'float'); } } else { for (var j = 0; j < $1; ++j) { setValue($0 + (((j * numChannels) + c) * 4), channelData[j], 'float'); } } } },  
 383975: () => { Module['SDL3'].camera = {}; },  
 384007: () => { return (navigator.mediaDevices === undefined) ? 0 : 1; },  
 384066: ($0, $1, $2, $3, $4) => { const device = $0; const w = $1; const h = $2; const framerate_numerator = $3; const framerate_denominator = $4; const outcome = Module._SDLEmscriptenCameraPermissionOutcome; const iterate = Module._SDLEmscriptenThreadIterate; const constraints = {}; if ((w <= 0) || (h <= 0)) { constraints.video = true; } else { constraints.video = {}; constraints.video.width = w; constraints.video.height = h; } if ((framerate_numerator > 0) && (framerate_denominator > 0)) { var fps = framerate_numerator / framerate_denominator; constraints.video.frameRate = { ideal: fps }; } function grabNextCameraFrame() { const SDL3 = Module['SDL3']; if ((typeof(SDL3) === 'undefined') || (typeof(SDL3.camera) === 'undefined') || (typeof(SDL3.camera.stream) === 'undefined')) { return; } const nextframems = SDL3.camera.next_frame_time; const now = performance.now(); if (now >= nextframems) { iterate(device); while (SDL3.camera.next_frame_time < now) { SDL3.camera.next_frame_time += SDL3.camera.fpsincrms; } } requestAnimationFrame(grabNextCameraFrame); } navigator.mediaDevices.getUserMedia(constraints) .then((stream) => { const settings = stream.getVideoTracks()[0].getSettings(); const actualw = settings.width; const actualh = settings.height; const actualfps = settings.frameRate; console.log("Camera is opened! Actual spec: (" + actualw + "x" + actualh + "), fps=" + actualfps); if (outcome(device, 1, actualw, actualh, actualfps)) { const video = document.createElement("video"); video.width = actualw; video.height = actualh; video.style.display = 'none'; video.srcObject = stream; const canvas = document.createElement("canvas"); canvas.width = actualw; canvas.height = actualh; canvas.style.display = 'none'; const ctx2d = canvas.getContext('2d'); const SDL3 = Module['SDL3']; SDL3.camera.width = actualw; SDL3.camera.height = actualh; SDL3.camera.fps = actualfps; SDL3.camera.fpsincrms = 1000.0 / actualfps; SDL3.camera.stream = stream; SDL3.camera.video = video; SDL3.camera.canvas = canvas; SDL3.camera.ctx2d = ctx2d; SDL3.camera.next_frame_time = performance.now(); video.play(); video.addEventListener('loadedmetadata', () => { grabNextCameraFrame(); }); } }) .catch((err) => { console.error("Tried to open camera but it threw an error! " + err.name + ": " + err.message); outcome(device, 0, 0, 0, 0); }); },  
 386372: () => { const SDL3 = Module['SDL3']; if ((typeof(SDL3) === 'undefined') || (typeof(SDL3.camera) === 'undefined') || (typeof(SDL3.camera.stream) === 'undefined')) { return; } SDL3.camera.stream.getTracks().forEach(track => track.stop()); SDL3.camera = {}; },  
 386623: ($0, $1, $2) => { const w = $0; const h = $1; const rgba = $2; const SDL3 = Module['SDL3']; if ((typeof(SDL3) === 'undefined') || (typeof(SDL3.camera) === 'undefined') || (typeof(SDL3.camera.ctx2d) === 'undefined')) { return 0; } SDL3.camera.ctx2d.drawImage(SDL3.camera.video, 0, 0, w, h); const imgrgba = SDL3.camera.ctx2d.getImageData(0, 0, w, h).data; HEAPU8.set(imgrgba, rgba); return 1; },  
 387001: () => { if (typeof(Module['SDL3']) !== 'undefined') { Module['SDL3'].camera = undefined; } },  
 387088: ($0) => { let gamepad = navigator['getGamepads']()[$0]; if (!gamepad || !gamepad['vibrationActuator'] || !gamepad['vibrationActuator']['effects'] || !gamepad['vibrationActuator']['effects']['includes']('trigger-rumble')) { return false; } return true; },  
 387334: ($0) => { let gamepad = navigator['getGamepads']()[$0]; if (!gamepad) { return 0; } let vendor_str = 'Vendor: '; if (gamepad['id']['indexOf'](vendor_str) > 0) { let vendor_str_index = gamepad['id']['indexOf'](vendor_str) + vendor_str['length']; return parseInt(gamepad['id']['substr'](vendor_str_index, 4), 16); } let id_split = gamepad['id']['split']('-'); if (id_split['length'] > 1 && !isNaN(parseInt(id_split[0], 16))) { return parseInt(id_split[0], 16); } return 0; },  
 387799: ($0) => { let gamepad = navigator['getGamepads']()[$0]; if (!gamepad) { return 0; } let product_str = 'Product: '; if (gamepad['id']['indexOf'](product_str) > 0) { let product_str_index = gamepad['id']['indexOf'](product_str) + product_str['length']; return parseInt(gamepad['id']['substr'](product_str_index, 4), 16); } let id_split = gamepad['id']['split']('-'); if (id_split['length'] > 1 && !isNaN(parseInt(id_split[1], 16))) { return parseInt(id_split[1], 16); } return 0; },  
 388271: ($0) => { let gamepad = navigator['getGamepads']()[$0]; if (!gamepad) { return 0; } return gamepad['id']['toLowerCase']()['indexOf']('xinput') >= 0; },  
 388414: () => { const os = ([ 'Android', 'Linux', 'iPhone', 'Macintosh', 'Windows', ]); const ua = navigator['userAgent']; for (let i = 0; i < os.length; i++) { if (ua['indexOf'](os[i]) >= 0) { return i + 1; } } return 0; },  
 388624: ($0, $1, $2) => { let gamepad = navigator['getGamepads']()[$0]; if (!gamepad) { stringToUTF8('\0', $1, $2); return; } let id = gamepad['id']; let output = id; if (id['indexOf'](' (STANDARD GAMEPAD') > 0) { output = id['substr'](0, id['indexOf'](' (STANDARD GAMEPAD')); } else if (id['indexOf'](' (Vendor:') > 0) { output = id['substr'](0, id['indexOf'](' (Vendor:')); } else if (id['indexOf'](' (XInput') > 0) { output = id['substr'](0, id['indexOf'](' (XInput')); } let id_split = id['split']('-'); if (id_split['length'] > 1 && !isNaN(parseInt(id_split[0], 16))) { let start = id['indexOf']('-', id['indexOf']('-')+1)+1; output = id['substr'](start); } stringToUTF8(output.trim(), $1, $2); },  
 389302: ($0) => { let gamepad = navigator['getGamepads']()[$0]; if (!gamepad || !gamepad['vibrationActuator']) { return false; } return true; },  
 389430: ($0, $1, $2, $3, $4) => { let gamepad = navigator['getGamepads']()[$0]; if (!gamepad) { return false; } gamepad['vibrationActuator']['playEffect']('dual-rumble', { 'startDelay': 0, 'duration': 3000, 'weakMagnitude': $1 / 0xFFFF, 'strongMagnitude': $2 / 0xFFFF, 'leftTrigger': $3 / 0xFFFF, 'rightTrigger': $4 / 0xFFFF, }); return true; },  
 389743: ($0, $1, $2, $3) => { var w = $0; var h = $1; var pixels = $2; var canvasId = UTF8ToString($3); var canvas = document.querySelector(canvasId); var SDL3 = Module['SDL3']; if (SDL3.ctxCanvas !== canvas) { SDL3.ctx = Browser.createContext(canvas, false, true); if (!SDL3.ctx) { return false; } SDL3.ctxCanvas = canvas; } if (SDL3.w !== w || SDL3.h !== h || SDL3.imageCtx !== SDL3.ctx) { SDL3.image = SDL3.ctx.createImageData(w, h); SDL3.w = w; SDL3.h = h; SDL3.imageCtx = SDL3.ctx; } var data = SDL3.image.data; var src = pixels / 4; if (SDL3.data32Data !== data) { SDL3.data32 = new Int32Array(data.buffer); SDL3.data32Data = data; } var data32 = SDL3.data32; data32.set(HEAP32.subarray(src, src + data32.length)); SDL3.ctx.putImageData(SDL3.image, 0, 0); return true; },  
 390492: () => { var SDL3 = Module['SDL3']; SDL3['mouse_x'] = 0; SDL3['mouse_y'] = 0; SDL3['mouse_buttons'] = []; for (var i = 0; i < 5; ++i) { SDL3['mouse_buttons'][i] = false; } document.addEventListener('mousemove', function(e) { var SDL3 = Module['SDL3']; SDL3['mouse_x'] = e.clientX; SDL3['mouse_y'] = e.clientY; }); document.addEventListener('mousedown', function(e) { var SDL3 = Module['SDL3']; if (0 <= e.button && e.button < SDL3['mouse_buttons'].length) { SDL3['mouse_buttons'][e.button] = true; } }); document.addEventListener('mouseup', function(e) { var SDL3 = Module['SDL3']; if (0 <= e.button && e.button < SDL3['mouse_buttons'].length) { SDL3['mouse_buttons'][e.button] = false; } }); },  
 391180: ($0, $1, $2, $3, $4) => { var w = $0; var h = $1; var hot_x = $2; var hot_y = $3; var pixels = $4; var canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h; var ctx = canvas.getContext("2d"); var image = ctx.createImageData(w, h); var data = image.data; var src = pixels / 4; var data32 = new Int32Array(data.buffer); data32.set(HEAP32.subarray(src, src + data32.length)); ctx.putImageData(image, 0, 0); var url = hot_x === 0 && hot_y === 0 ? "url(" + canvas.toDataURL() + "), auto" : "url(" + canvas.toDataURL() + ") " + hot_x + " " + hot_y + ", auto"; var urlBuf = _SDL_malloc(url.length + 1); stringToUTF8(url, urlBuf, url.length + 1); return urlBuf; },  
 391838: ($0) => { if (Module['canvas']) { Module['canvas'].style['cursor'] = UTF8ToString($0); } },  
 391921: () => { if (Module['canvas']) { Module['canvas'].style['cursor'] = 'none'; } },  
 391990: () => { return Module['SDL3']['mouse_x']; },  
 392028: () => { return Module['SDL3']['mouse_y']; },  
 392066: ($0) => { return Module['SDL3']['mouse_buttons'][$0]; },  
 392114: ($0) => { var data = $0; if (document.sdlEventHandlerLockKeysCheck) { document.removeEventListener("keydown", document.sdlEventHandlerLockKeysCheck); } document.sdlEventHandlerLockKeysCheck = function(event) { if ((event.key != "CapsLock") && (event.key != "NumLock") && (event.key != "ScrollLock")) { _Emscripten_HandleLockKeysCheck(Module['SDL3'].JSVarToCPtr(data), event.getModifierState("CapsLock"), event.getModifierState("NumLock"), event.getModifierState("ScrollLock")); } }; document.addEventListener("keydown", document.sdlEventHandlerLockKeysCheck); },  
 392668: () => { document.removeEventListener("keydown", document.sdlEventHandlerLockKeysCheck); },  
 392752: ($0) => { var target = document; if (target) { target.sdlEventHandlerMouseButtonUpGlobal = function(event) { var SDL3 = Module['SDL3']; var d = SDL3.makePointerEventCStruct(0, 0, event); if (d != 0) { _Emscripten_HandleMouseButtonUpGlobal(SDL3.JSVarToCPtr($0), d); _SDL_free(d); } }; target.addEventListener("pointerup", target.sdlEventHandlerMouseButtonUpGlobal); } },  
 393113: ($0) => { var SDL3 = Module['SDL3']; if (SDL3.makePointerEventCStruct === undefined) { SDL3.makePointerEventCStruct = function(left, top, event) { var ptrtype = 0; if (event.pointerType == "mouse") { ptrtype = 1; } else if (event.pointerType == "touch") { ptrtype = 2; } else if (event.pointerType == "pen") { ptrtype = 3; } else { return 0; } var ptr = _SDL_malloc($0); if (ptr != 0) { var idx = SDL3.CPtrToHeap32Index(ptr); HEAP32[idx++] = ptrtype; HEAP32[idx++] = event.pointerId; HEAP32[idx++] = (typeof(event.button) !== "undefined") ? event.button : -1; HEAP32[idx++] = event.buttons; HEAP32[idx++] = (event.type == "pointerdown") ? 1 : 0; HEAPF32[idx++] = event.movementX; HEAPF32[idx++] = event.movementY; HEAPF32[idx++] = event.clientX - left; HEAPF32[idx++] = event.clientY - top; if (ptrtype == 3) { HEAPF32[idx++] = event.pressure; HEAPF32[idx++] = event.tangentialPressure; HEAPF32[idx++] = event.tiltX; HEAPF32[idx++] = event.tiltY; HEAPF32[idx++] = event.twist; } } return ptr; }; } },  
 394105: ($0) => { var id = UTF8ToString($0); try { var canvas = document.querySelector(id); if (canvas) { return canvas === document.activeElement; } } catch (e) { } return false; },  
 394271: () => { return document.hasFocus(); },  
 394303: () => { var target = document; if (target) { target.removeEventListener("pointerup", target.sdlEventHandlerMouseButtonUpGlobal); target.sdlEventHandlerMouseButtonUpGlobal = undefined; } },  
 394485: () => { return document.body.clientWidth; },  
 394523: () => { return document.body.clientHeight; },  
 394562: () => { return window.innerWidth; },  
 394592: () => { return window.innerHeight; },  
 394623: () => { return window.outerWidth; },  
 394653: () => { return window.outerHeight; },  
 394684: () => { return window.pageXOffset; },  
 394715: () => { return window.pageYOffset; },  
 394746: ($0, $1) => { var target = document.querySelector(UTF8ToString($1)); if (target) { var SDL3 = Module['SDL3']; var data = $0; target.sdlEventHandlerPointerEnter = function(event) { var rect = target.getBoundingClientRect(); var d = SDL3.makePointerEventCStruct(rect.left, rect.top, event); if (d != 0) { _Emscripten_HandlePointerEnter(SDL3.JSVarToCPtr(data), d); _SDL_free(d); } }; target.sdlEventHandlerPointerLeave = function(event) { var rect = target.getBoundingClientRect(); var d = SDL3.makePointerEventCStruct(rect.left, rect.top, event); if (d != 0) { _Emscripten_HandlePointerLeave(SDL3.JSVarToCPtr(data), d); _SDL_free(d); } }; target.sdlEventHandlerPointerGeneric = function(event) { var rect = target.getBoundingClientRect(); var d = SDL3.makePointerEventCStruct(rect.left, rect.top, event); if (d != 0) { _Emscripten_HandlePointerGeneric(SDL3.JSVarToCPtr(data), d); _SDL_free(d); } }; target.style.touchAction = "none"; target.addEventListener("pointerenter", target.sdlEventHandlerPointerEnter); target.addEventListener("pointerleave", target.sdlEventHandlerPointerLeave); target.addEventListener("pointercancel", target.sdlEventHandlerPointerLeave); target.addEventListener("pointerdown", target.sdlEventHandlerPointerGeneric); target.addEventListener("pointermove", target.sdlEventHandlerPointerGeneric); target.addEventListener("pointerup", target.sdlEventHandlerPointerGeneric); } },  
 396134: ($0, $1, $2) => { var target = document.querySelector(UTF8ToString($1)); if (target) { var data = $0; var SDL3 = Module['SDL3']; var makeDropEventCStruct = function(event) { var ptr = 0; ptr = _SDL_malloc($2); if (ptr != 0) { var idx = ptr >> 2; var rect = target.getBoundingClientRect(); HEAP32[idx++] = event.clientX - rect.left; HEAP32[idx++] = event.clientY - rect.top; } return ptr; }; SDL3.eventHandlerDropDragover = function(event) { event.preventDefault(); var d = makeDropEventCStruct(event); if (d != 0) { _Emscripten_SendDragEvent(data, d); _SDL_free(d); } }; target.addEventListener("dragover", SDL3.eventHandlerDropDragover); SDL3.drop_count = 0; try { FS.mkdir("/tmp/filedrop"); } catch (e) {} SDL3.eventHandlerDropDrop = function(event) { event.preventDefault(); if (event.dataTransfer.types.includes("text/plain")) { let plain_text = stringToNewUTF8(event.dataTransfer.getData("text/plain")); _Emscripten_SendDragTextEvent(data, plain_text); _Emscripten_force_free(plain_text); } else if (event.dataTransfer.types.includes("Files")) { let files_read = 0; const files_to_read = event.dataTransfer.files.length; for (let i = 0; i < files_to_read; i++) { const file = event.dataTransfer.files.item(i); const file_reader = new FileReader(); file_reader.readAsArrayBuffer(file); file_reader.onload = function(event) { const fs_dropdir = `/tmp/filedrop/${SDL3.drop_count}`; SDL3.drop_count += 1; const fs_filepath = `${fs_dropdir}/${file.name}`; const c_fs_filepath = stringToNewUTF8(fs_filepath); const contents_array8 = new Uint8Array(event.target.result); try { FS.mkdir(fs_dropdir); var stream = FS.open(fs_filepath, "w"); FS.write(stream, contents_array8, 0, contents_array8.length, 0); FS.close(stream); _Emscripten_SendDragFileEvent(data, c_fs_filepath); } catch (e) { } _Emscripten_force_free(c_fs_filepath); onFileRead(); }; file_reader.onerror = function(event) { onFileRead(); }; } function onFileRead() { ++files_read; if (files_read === files_to_read) { _Emscripten_SendDragCompleteEvent(data); } } } _Emscripten_SendDragCompleteEvent(data); }; target.addEventListener("drop", SDL3.eventHandlerDropDrop); SDL3.eventHandlerDropDragend = function(event) { event.preventDefault(); _Emscripten_SendDragCompleteEvent(data); }; target.addEventListener("dragend", SDL3.eventHandlerDropDragend); target.addEventListener("dragleave", SDL3.eventHandlerDropDragend); } },  
 398501: ($0) => { var target = document.querySelector(UTF8ToString($0)); if (target) { var SDL3 = Module['SDL3']; target.removeEventListener("dragleave", SDL3.eventHandlerDropDragend); target.removeEventListener("dragend", SDL3.eventHandlerDropDragend); target.removeEventListener("drop", SDL3.eventHandlerDropDrop); SDL3.drop_count = undefined; function recursive_remove(dirpath) { FS.readdir(dirpath).forEach((filename) => { const p = `${dirpath}/${filename}`; const p_s = FS.stat(p); if (FS.isFile(p_s.mode)) { FS.unlink(p); } else if (FS.isDir(p)) { recursive_remove(p); } }); FS.rmdir(dirpath); }("/tmp/filedrop"); FS.rmdir("/tmp/filedrop"); target.removeEventListener("dragover", SDL3.eventHandlerDropDragover); SDL3.eventHandlerDropDragover = undefined; SDL3.eventHandlerDropDrop = undefined; SDL3.eventHandlerDropDragend = undefined; } },  
 399331: ($0) => { var target = document.querySelector(UTF8ToString($0)); if (target) { target.removeEventListener("pointerenter", target.sdlEventHandlerPointerEnter); target.removeEventListener("pointerleave", target.sdlEventHandlerPointerLeave); target.removeEventListener("pointercancel", target.sdlEventHandlerPointerLeave); target.removeEventListener("pointerdown", target.sdlEventHandlerPointerGeneric); target.removeEventListener("pointermove", target.sdlEventHandlerPointerGeneric); target.removeEventListener("pointerup", target.sdlEventHandlerPointerGeneric); target.style.touchAction = ""; target.sdlEventHandlerPointerEnter = undefined; target.sdlEventHandlerPointerLeave = undefined; target.sdlEventHandlerPointerGeneric = undefined; } },  
 400065: () => { if (!window.matchMedia) { return -1; } if (window.matchMedia('(prefers-color-scheme: light)').matches) { return 0; } if (window.matchMedia('(prefers-color-scheme: dark)').matches) { return 1; } return -1; },  
 400274: () => { if (typeof(Module['SDL3']) !== 'undefined') { var SDL3 = Module['SDL3']; SDL3.themeChangedMatchMedia.removeEventListener('change', SDL3.eventHandlerThemeChanged); SDL3.themeChangedMatchMedia = undefined; SDL3.eventHandlerThemeChanged = undefined; } },  
 400527: () => { return window.innerWidth; },  
 400557: () => { return window.innerHeight; },  
 400588: ($0) => { Module['requestFullscreen'] = function(lockPointer, resizeCanvas) { _requestFullscreenThroughSDL($0); }; },  
 400697: ($0, $1) => { var ptr = Number($0); var len = Number($1); var pngData = HEAPU8.buffer instanceof ArrayBuffer ? HEAPU8.subarray(ptr, ptr + len) : HEAPU8.slice(ptr, ptr + len); var blob = new Blob([pngData], {type: 'image/png'}); var url = URL.createObjectURL(blob); var link = document.querySelector("link[rel~='icon']"); if (!link) { link = document.createElement('link'); link.rel = 'icon'; link.type = 'image/png'; document.head.appendChild(link); } if (link.href && link.href.startsWith('blob:')) { URL.revokeObjectURL(link.href); } link.href = url; },  
 401240: () => { Module['requestFullscreen'] = function(lockPointer, resizeCanvas) {}; },  
 401314: () => { return window.innerWidth; },  
 401344: () => { return window.innerHeight; },  
 401375: ($0) => { var canvas = document.querySelector(UTF8ToString($0)); canvas.SDL3_original_position = canvas.style.position; canvas.SDL3_original_top = canvas.style.top; canvas.SDL3_original_left = canvas.style.left; var div = document.createElement('div'); div.id = 'SDL3_fill_document_background_elements'; div.SDL3_canvas = canvas; div.SDL3_canvas_parent = canvas.parentNode; div.SDL3_canvas_nextsib = canvas.nextSibling; var children = Array.from(document.body.children); for (var child of children) { div.appendChild(child); } document.body.appendChild(div); div.style.display = 'none'; document.body.appendChild(canvas); canvas.style.position = 'fixed'; canvas.style.top = '0'; canvas.style.left = '0'; },  
 402073: () => { var div = document.getElementById('SDL3_fill_document_background_elements'); if (div) { if (div.SDL3_canvas_nextsib) { div.SDL3_canvas_parent.insertBefore(div.SDL3_canvas, div.SDL3_canvas_nextsib); } else { div.SDL3_canvas_parent.appendChild(div.SDL3_canvas); } while (div.firstChild) { document.body.insertBefore(div.firstChild, div); } div.SDL3_canvas.style.position = div.SDL3_canvas.SDL3_original_position; div.SDL3_canvas.style.top = div.SDL3_canvas.SDL3_original_top; div.SDL3_canvas.style.left = div.SDL3_canvas.SDL3_original_left; div.remove(); } },  
 402632: () => { if (window.matchMedia) { var SDL3 = Module['SDL3']; SDL3.eventHandlerThemeChanged = function(event) { _Emscripten_SendSystemThemeChangedEvent(); }; SDL3.themeChangedMatchMedia = window.matchMedia('(prefers-color-scheme: dark)'); SDL3.themeChangedMatchMedia.addEventListener('change', SDL3.eventHandlerThemeChanged); } },  
 402954: ($0, $1, $2, $3, $4) => { var title = UTF8ToString($0); var message = UTF8ToString($1); var background = UTF8ToString($2); var color = UTF8ToString($3); var id = UTF8ToString($4); var dialog = document.createElement("dialog"); dialog.classList.add("SDL3_messagebox"); dialog.id = id; dialog.style.color = color; dialog.style.backgroundColor = background; document.body.append(dialog); var h1 = document.createElement("h1"); h1.innerText = title; dialog.append(h1); var p = document.createElement("p"); p.innerText = message; dialog.append(p); dialog.showModal(); },  
 403495: ($0, $1, $2, $3, $4, $5, $6, $7) => { var dialog_id = UTF8ToString($0); var text = UTF8ToString($1); var responseId = $2; var clickOnReturn = $3; var clickOnEscape = $4; var border = UTF8ToString($5); var background = UTF8ToString($6); var hovered = UTF8ToString($7); var dialog = document.getElementById(dialog_id); if (!dialog) { return false; } var button = document.createElement("button"); button.innerText = text; button.style.borderColor = border; button.style.backgroundColor = background; dialog.addEventListener('keydown', function(e) { if (clickOnReturn && e.key === "Enter") { e.preventDefault(); button.click(); } else if (clickOnEscape && e.key === "Escape") { e.preventDefault(); button.click(); } }); dialog.addEventListener('cancel', function(e){ e.preventDefault(); }); button.onmouseenter = function(e){ button.style.backgroundColor = hovered; }; button.onmouseleave = function(e){ button.style.backgroundColor = background; }; button.onclick = function(e) { dialog.close(responseId); }; dialog.append(button); return true; },  
 404504: ($0) => { var dialog_id = UTF8ToString($0); var dialog = document.getElementById(dialog_id); if (!dialog) { return false; } return dialog.open; },  
 404642: ($0) => { var dialog_id = UTF8ToString($0); var dialog = document.getElementById(dialog_id); if (!dialog) { return 0; } try { return parseInt(dialog.returnValue); } catch(e) { return 0; } },  
 404824: ($0, $1) => { alert(UTF8ToString($0) + "\n\n" + UTF8ToString($1)); }
};

// Imports from the Wasm binary.
var _main = Module['_main'] = makeInvalidEarlyAccess('_main');
var _SDL_free = Module['_SDL_free'] = makeInvalidEarlyAccess('_SDL_free');
var _SDL_malloc = Module['_SDL_malloc'] = makeInvalidEarlyAccess('_SDL_malloc');
var _SDL_calloc = Module['_SDL_calloc'] = makeInvalidEarlyAccess('_SDL_calloc');
var _Emscripten_force_free = Module['_Emscripten_force_free'] = makeInvalidEarlyAccess('_Emscripten_force_free');
var _SDL_realloc = Module['_SDL_realloc'] = makeInvalidEarlyAccess('_SDL_realloc');
var _strerror = makeInvalidEarlyAccess('_strerror');
var _fflush = makeInvalidEarlyAccess('_fflush');
var _malloc = makeInvalidEarlyAccess('_malloc');
var _SDLEmscriptenCameraPermissionOutcome = Module['_SDLEmscriptenCameraPermissionOutcome'] = makeInvalidEarlyAccess('_SDLEmscriptenCameraPermissionOutcome');
var _SDLEmscriptenThreadIterate = Module['_SDLEmscriptenThreadIterate'] = makeInvalidEarlyAccess('_SDLEmscriptenThreadIterate');
var _Emscripten_HandlePointerEnter = Module['_Emscripten_HandlePointerEnter'] = makeInvalidEarlyAccess('_Emscripten_HandlePointerEnter');
var _Emscripten_HandlePointerLeave = Module['_Emscripten_HandlePointerLeave'] = makeInvalidEarlyAccess('_Emscripten_HandlePointerLeave');
var _Emscripten_HandlePointerGeneric = Module['_Emscripten_HandlePointerGeneric'] = makeInvalidEarlyAccess('_Emscripten_HandlePointerGeneric');
var _Emscripten_HandleMouseButtonUpGlobal = Module['_Emscripten_HandleMouseButtonUpGlobal'] = makeInvalidEarlyAccess('_Emscripten_HandleMouseButtonUpGlobal');
var _Emscripten_SendDragEvent = Module['_Emscripten_SendDragEvent'] = makeInvalidEarlyAccess('_Emscripten_SendDragEvent');
var _Emscripten_SendDragCompleteEvent = Module['_Emscripten_SendDragCompleteEvent'] = makeInvalidEarlyAccess('_Emscripten_SendDragCompleteEvent');
var _Emscripten_SendDragTextEvent = Module['_Emscripten_SendDragTextEvent'] = makeInvalidEarlyAccess('_Emscripten_SendDragTextEvent');
var _Emscripten_SendDragFileEvent = Module['_Emscripten_SendDragFileEvent'] = makeInvalidEarlyAccess('_Emscripten_SendDragFileEvent');
var _Emscripten_HandleLockKeysCheck = Module['_Emscripten_HandleLockKeysCheck'] = makeInvalidEarlyAccess('_Emscripten_HandleLockKeysCheck');
var _Emscripten_SendSystemThemeChangedEvent = Module['_Emscripten_SendSystemThemeChangedEvent'] = makeInvalidEarlyAccess('_Emscripten_SendSystemThemeChangedEvent');
var _requestFullscreenThroughSDL = Module['_requestFullscreenThroughSDL'] = makeInvalidEarlyAccess('_requestFullscreenThroughSDL');
var _emscripten_stack_get_end = makeInvalidEarlyAccess('_emscripten_stack_get_end');
var _emscripten_stack_get_base = makeInvalidEarlyAccess('_emscripten_stack_get_base');
var _setThrew = makeInvalidEarlyAccess('_setThrew');
var _emscripten_stack_init = makeInvalidEarlyAccess('_emscripten_stack_init');
var _emscripten_stack_get_free = makeInvalidEarlyAccess('_emscripten_stack_get_free');
var __emscripten_stack_restore = makeInvalidEarlyAccess('__emscripten_stack_restore');
var __emscripten_stack_alloc = makeInvalidEarlyAccess('__emscripten_stack_alloc');
var _emscripten_stack_get_current = makeInvalidEarlyAccess('_emscripten_stack_get_current');
var memory = makeInvalidEarlyAccess('memory');
var __indirect_function_table = makeInvalidEarlyAccess('__indirect_function_table');
var wasmMemory = makeInvalidEarlyAccess('wasmMemory');
var wasmTable = makeInvalidEarlyAccess('wasmTable');

function assignWasmExports(wasmExports) {
  assert(typeof wasmExports['__main_argc_argv'] !== 'undefined', 'missing Wasm export: __main_argc_argv');
  assert(typeof wasmExports['SDL_free'] !== 'undefined', 'missing Wasm export: SDL_free');
  assert(typeof wasmExports['SDL_malloc'] !== 'undefined', 'missing Wasm export: SDL_malloc');
  assert(typeof wasmExports['SDL_calloc'] !== 'undefined', 'missing Wasm export: SDL_calloc');
  assert(typeof wasmExports['Emscripten_force_free'] !== 'undefined', 'missing Wasm export: Emscripten_force_free');
  assert(typeof wasmExports['SDL_realloc'] !== 'undefined', 'missing Wasm export: SDL_realloc');
  assert(typeof wasmExports['strerror'] !== 'undefined', 'missing Wasm export: strerror');
  assert(typeof wasmExports['fflush'] !== 'undefined', 'missing Wasm export: fflush');
  assert(typeof wasmExports['malloc'] !== 'undefined', 'missing Wasm export: malloc');
  assert(typeof wasmExports['SDLEmscriptenCameraPermissionOutcome'] !== 'undefined', 'missing Wasm export: SDLEmscriptenCameraPermissionOutcome');
  assert(typeof wasmExports['SDLEmscriptenThreadIterate'] !== 'undefined', 'missing Wasm export: SDLEmscriptenThreadIterate');
  assert(typeof wasmExports['Emscripten_HandlePointerEnter'] !== 'undefined', 'missing Wasm export: Emscripten_HandlePointerEnter');
  assert(typeof wasmExports['Emscripten_HandlePointerLeave'] !== 'undefined', 'missing Wasm export: Emscripten_HandlePointerLeave');
  assert(typeof wasmExports['Emscripten_HandlePointerGeneric'] !== 'undefined', 'missing Wasm export: Emscripten_HandlePointerGeneric');
  assert(typeof wasmExports['Emscripten_HandleMouseButtonUpGlobal'] !== 'undefined', 'missing Wasm export: Emscripten_HandleMouseButtonUpGlobal');
  assert(typeof wasmExports['Emscripten_SendDragEvent'] !== 'undefined', 'missing Wasm export: Emscripten_SendDragEvent');
  assert(typeof wasmExports['Emscripten_SendDragCompleteEvent'] !== 'undefined', 'missing Wasm export: Emscripten_SendDragCompleteEvent');
  assert(typeof wasmExports['Emscripten_SendDragTextEvent'] !== 'undefined', 'missing Wasm export: Emscripten_SendDragTextEvent');
  assert(typeof wasmExports['Emscripten_SendDragFileEvent'] !== 'undefined', 'missing Wasm export: Emscripten_SendDragFileEvent');
  assert(typeof wasmExports['Emscripten_HandleLockKeysCheck'] !== 'undefined', 'missing Wasm export: Emscripten_HandleLockKeysCheck');
  assert(typeof wasmExports['Emscripten_SendSystemThemeChangedEvent'] !== 'undefined', 'missing Wasm export: Emscripten_SendSystemThemeChangedEvent');
  assert(typeof wasmExports['requestFullscreenThroughSDL'] !== 'undefined', 'missing Wasm export: requestFullscreenThroughSDL');
  assert(typeof wasmExports['emscripten_stack_get_end'] !== 'undefined', 'missing Wasm export: emscripten_stack_get_end');
  assert(typeof wasmExports['emscripten_stack_get_base'] !== 'undefined', 'missing Wasm export: emscripten_stack_get_base');
  assert(typeof wasmExports['setThrew'] !== 'undefined', 'missing Wasm export: setThrew');
  assert(typeof wasmExports['emscripten_stack_init'] !== 'undefined', 'missing Wasm export: emscripten_stack_init');
  assert(typeof wasmExports['emscripten_stack_get_free'] !== 'undefined', 'missing Wasm export: emscripten_stack_get_free');
  assert(typeof wasmExports['_emscripten_stack_restore'] !== 'undefined', 'missing Wasm export: _emscripten_stack_restore');
  assert(typeof wasmExports['_emscripten_stack_alloc'] !== 'undefined', 'missing Wasm export: _emscripten_stack_alloc');
  assert(typeof wasmExports['emscripten_stack_get_current'] !== 'undefined', 'missing Wasm export: emscripten_stack_get_current');
  assert(typeof wasmExports['memory'] !== 'undefined', 'missing Wasm export: memory');
  assert(typeof wasmExports['__indirect_function_table'] !== 'undefined', 'missing Wasm export: __indirect_function_table');
  _main = Module['_main'] = createExportWrapper('__main_argc_argv', wasmExports['__main_argc_argv'], 2);
  _SDL_free = Module['_SDL_free'] = createExportWrapper('SDL_free', wasmExports['SDL_free'], 1);
  _SDL_malloc = Module['_SDL_malloc'] = createExportWrapper('SDL_malloc', wasmExports['SDL_malloc'], 1);
  _SDL_calloc = Module['_SDL_calloc'] = createExportWrapper('SDL_calloc', wasmExports['SDL_calloc'], 2);
  _Emscripten_force_free = Module['_Emscripten_force_free'] = createExportWrapper('Emscripten_force_free', wasmExports['Emscripten_force_free'], 1);
  _SDL_realloc = Module['_SDL_realloc'] = createExportWrapper('SDL_realloc', wasmExports['SDL_realloc'], 2);
  _strerror = createExportWrapper('strerror', wasmExports['strerror'], 1);
  _fflush = createExportWrapper('fflush', wasmExports['fflush'], 1);
  _malloc = createExportWrapper('malloc', wasmExports['malloc'], 1);
  _SDLEmscriptenCameraPermissionOutcome = Module['_SDLEmscriptenCameraPermissionOutcome'] = createExportWrapper('SDLEmscriptenCameraPermissionOutcome', wasmExports['SDLEmscriptenCameraPermissionOutcome'], 5);
  _SDLEmscriptenThreadIterate = Module['_SDLEmscriptenThreadIterate'] = createExportWrapper('SDLEmscriptenThreadIterate', wasmExports['SDLEmscriptenThreadIterate'], 1);
  _Emscripten_HandlePointerEnter = Module['_Emscripten_HandlePointerEnter'] = createExportWrapper('Emscripten_HandlePointerEnter', wasmExports['Emscripten_HandlePointerEnter'], 2);
  _Emscripten_HandlePointerLeave = Module['_Emscripten_HandlePointerLeave'] = createExportWrapper('Emscripten_HandlePointerLeave', wasmExports['Emscripten_HandlePointerLeave'], 2);
  _Emscripten_HandlePointerGeneric = Module['_Emscripten_HandlePointerGeneric'] = createExportWrapper('Emscripten_HandlePointerGeneric', wasmExports['Emscripten_HandlePointerGeneric'], 2);
  _Emscripten_HandleMouseButtonUpGlobal = Module['_Emscripten_HandleMouseButtonUpGlobal'] = createExportWrapper('Emscripten_HandleMouseButtonUpGlobal', wasmExports['Emscripten_HandleMouseButtonUpGlobal'], 2);
  _Emscripten_SendDragEvent = Module['_Emscripten_SendDragEvent'] = createExportWrapper('Emscripten_SendDragEvent', wasmExports['Emscripten_SendDragEvent'], 2);
  _Emscripten_SendDragCompleteEvent = Module['_Emscripten_SendDragCompleteEvent'] = createExportWrapper('Emscripten_SendDragCompleteEvent', wasmExports['Emscripten_SendDragCompleteEvent'], 1);
  _Emscripten_SendDragTextEvent = Module['_Emscripten_SendDragTextEvent'] = createExportWrapper('Emscripten_SendDragTextEvent', wasmExports['Emscripten_SendDragTextEvent'], 2);
  _Emscripten_SendDragFileEvent = Module['_Emscripten_SendDragFileEvent'] = createExportWrapper('Emscripten_SendDragFileEvent', wasmExports['Emscripten_SendDragFileEvent'], 2);
  _Emscripten_HandleLockKeysCheck = Module['_Emscripten_HandleLockKeysCheck'] = createExportWrapper('Emscripten_HandleLockKeysCheck', wasmExports['Emscripten_HandleLockKeysCheck'], 4);
  _Emscripten_SendSystemThemeChangedEvent = Module['_Emscripten_SendSystemThemeChangedEvent'] = createExportWrapper('Emscripten_SendSystemThemeChangedEvent', wasmExports['Emscripten_SendSystemThemeChangedEvent'], 0);
  _requestFullscreenThroughSDL = Module['_requestFullscreenThroughSDL'] = createExportWrapper('requestFullscreenThroughSDL', wasmExports['requestFullscreenThroughSDL'], 1);
  _emscripten_stack_get_end = wasmExports['emscripten_stack_get_end'];
  _emscripten_stack_get_base = wasmExports['emscripten_stack_get_base'];
  _setThrew = createExportWrapper('setThrew', wasmExports['setThrew'], 2);
  _emscripten_stack_init = wasmExports['emscripten_stack_init'];
  _emscripten_stack_get_free = wasmExports['emscripten_stack_get_free'];
  __emscripten_stack_restore = wasmExports['_emscripten_stack_restore'];
  __emscripten_stack_alloc = wasmExports['_emscripten_stack_alloc'];
  _emscripten_stack_get_current = wasmExports['emscripten_stack_get_current'];
  memory = wasmMemory = wasmExports['memory'];
  __indirect_function_table = wasmTable = wasmExports['__indirect_function_table'];
}

var wasmImports = {
  /** @export */
  __syscall_fcntl64: ___syscall_fcntl64,
  /** @export */
  __syscall_fdatasync: ___syscall_fdatasync,
  /** @export */
  __syscall_fstat64: ___syscall_fstat64,
  /** @export */
  __syscall_ioctl: ___syscall_ioctl,
  /** @export */
  __syscall_lstat64: ___syscall_lstat64,
  /** @export */
  __syscall_newfstatat: ___syscall_newfstatat,
  /** @export */
  __syscall_openat: ___syscall_openat,
  /** @export */
  __syscall_stat64: ___syscall_stat64,
  /** @export */
  _abort_js: __abort_js,
  /** @export */
  clock_time_get: _clock_time_get,
  /** @export */
  emscripten_asm_const_double_sync_on_main_thread: _emscripten_asm_const_double_sync_on_main_thread,
  /** @export */
  emscripten_asm_const_int: _emscripten_asm_const_int,
  /** @export */
  emscripten_asm_const_int_sync_on_main_thread: _emscripten_asm_const_int_sync_on_main_thread,
  /** @export */
  emscripten_asm_const_ptr_sync_on_main_thread: _emscripten_asm_const_ptr_sync_on_main_thread,
  /** @export */
  emscripten_cancel_main_loop: _emscripten_cancel_main_loop,
  /** @export */
  emscripten_date_now: _emscripten_date_now,
  /** @export */
  emscripten_exit_fullscreen: _emscripten_exit_fullscreen,
  /** @export */
  emscripten_exit_pointerlock: _emscripten_exit_pointerlock,
  /** @export */
  emscripten_get_device_pixel_ratio: _emscripten_get_device_pixel_ratio,
  /** @export */
  emscripten_get_element_css_size: _emscripten_get_element_css_size,
  /** @export */
  emscripten_get_fullscreen_status: _emscripten_get_fullscreen_status,
  /** @export */
  emscripten_get_gamepad_status: _emscripten_get_gamepad_status,
  /** @export */
  emscripten_get_main_loop_timing: _emscripten_get_main_loop_timing,
  /** @export */
  emscripten_get_now: _emscripten_get_now,
  /** @export */
  emscripten_get_num_gamepads: _emscripten_get_num_gamepads,
  /** @export */
  emscripten_get_screen_size: _emscripten_get_screen_size,
  /** @export */
  emscripten_glActiveTexture: _emscripten_glActiveTexture,
  /** @export */
  emscripten_glAttachShader: _emscripten_glAttachShader,
  /** @export */
  emscripten_glBeginQueryEXT: _emscripten_glBeginQueryEXT,
  /** @export */
  emscripten_glBindAttribLocation: _emscripten_glBindAttribLocation,
  /** @export */
  emscripten_glBindBuffer: _emscripten_glBindBuffer,
  /** @export */
  emscripten_glBindFramebuffer: _emscripten_glBindFramebuffer,
  /** @export */
  emscripten_glBindRenderbuffer: _emscripten_glBindRenderbuffer,
  /** @export */
  emscripten_glBindTexture: _emscripten_glBindTexture,
  /** @export */
  emscripten_glBindVertexArrayOES: _emscripten_glBindVertexArrayOES,
  /** @export */
  emscripten_glBlendColor: _emscripten_glBlendColor,
  /** @export */
  emscripten_glBlendEquation: _emscripten_glBlendEquation,
  /** @export */
  emscripten_glBlendEquationSeparate: _emscripten_glBlendEquationSeparate,
  /** @export */
  emscripten_glBlendFunc: _emscripten_glBlendFunc,
  /** @export */
  emscripten_glBlendFuncSeparate: _emscripten_glBlendFuncSeparate,
  /** @export */
  emscripten_glBufferData: _emscripten_glBufferData,
  /** @export */
  emscripten_glBufferSubData: _emscripten_glBufferSubData,
  /** @export */
  emscripten_glCheckFramebufferStatus: _emscripten_glCheckFramebufferStatus,
  /** @export */
  emscripten_glClear: _emscripten_glClear,
  /** @export */
  emscripten_glClearColor: _emscripten_glClearColor,
  /** @export */
  emscripten_glClearDepthf: _emscripten_glClearDepthf,
  /** @export */
  emscripten_glClearStencil: _emscripten_glClearStencil,
  /** @export */
  emscripten_glClipControlEXT: _emscripten_glClipControlEXT,
  /** @export */
  emscripten_glColorMask: _emscripten_glColorMask,
  /** @export */
  emscripten_glCompileShader: _emscripten_glCompileShader,
  /** @export */
  emscripten_glCompressedTexImage2D: _emscripten_glCompressedTexImage2D,
  /** @export */
  emscripten_glCompressedTexSubImage2D: _emscripten_glCompressedTexSubImage2D,
  /** @export */
  emscripten_glCopyTexImage2D: _emscripten_glCopyTexImage2D,
  /** @export */
  emscripten_glCopyTexSubImage2D: _emscripten_glCopyTexSubImage2D,
  /** @export */
  emscripten_glCreateProgram: _emscripten_glCreateProgram,
  /** @export */
  emscripten_glCreateShader: _emscripten_glCreateShader,
  /** @export */
  emscripten_glCullFace: _emscripten_glCullFace,
  /** @export */
  emscripten_glDeleteBuffers: _emscripten_glDeleteBuffers,
  /** @export */
  emscripten_glDeleteFramebuffers: _emscripten_glDeleteFramebuffers,
  /** @export */
  emscripten_glDeleteProgram: _emscripten_glDeleteProgram,
  /** @export */
  emscripten_glDeleteQueriesEXT: _emscripten_glDeleteQueriesEXT,
  /** @export */
  emscripten_glDeleteRenderbuffers: _emscripten_glDeleteRenderbuffers,
  /** @export */
  emscripten_glDeleteShader: _emscripten_glDeleteShader,
  /** @export */
  emscripten_glDeleteTextures: _emscripten_glDeleteTextures,
  /** @export */
  emscripten_glDeleteVertexArraysOES: _emscripten_glDeleteVertexArraysOES,
  /** @export */
  emscripten_glDepthFunc: _emscripten_glDepthFunc,
  /** @export */
  emscripten_glDepthMask: _emscripten_glDepthMask,
  /** @export */
  emscripten_glDepthRangef: _emscripten_glDepthRangef,
  /** @export */
  emscripten_glDetachShader: _emscripten_glDetachShader,
  /** @export */
  emscripten_glDisable: _emscripten_glDisable,
  /** @export */
  emscripten_glDisableVertexAttribArray: _emscripten_glDisableVertexAttribArray,
  /** @export */
  emscripten_glDrawArrays: _emscripten_glDrawArrays,
  /** @export */
  emscripten_glDrawArraysInstancedANGLE: _emscripten_glDrawArraysInstancedANGLE,
  /** @export */
  emscripten_glDrawBuffersWEBGL: _emscripten_glDrawBuffersWEBGL,
  /** @export */
  emscripten_glDrawElements: _emscripten_glDrawElements,
  /** @export */
  emscripten_glDrawElementsInstancedANGLE: _emscripten_glDrawElementsInstancedANGLE,
  /** @export */
  emscripten_glEnable: _emscripten_glEnable,
  /** @export */
  emscripten_glEnableVertexAttribArray: _emscripten_glEnableVertexAttribArray,
  /** @export */
  emscripten_glEndQueryEXT: _emscripten_glEndQueryEXT,
  /** @export */
  emscripten_glFinish: _emscripten_glFinish,
  /** @export */
  emscripten_glFlush: _emscripten_glFlush,
  /** @export */
  emscripten_glFramebufferRenderbuffer: _emscripten_glFramebufferRenderbuffer,
  /** @export */
  emscripten_glFramebufferTexture2D: _emscripten_glFramebufferTexture2D,
  /** @export */
  emscripten_glFrontFace: _emscripten_glFrontFace,
  /** @export */
  emscripten_glGenBuffers: _emscripten_glGenBuffers,
  /** @export */
  emscripten_glGenFramebuffers: _emscripten_glGenFramebuffers,
  /** @export */
  emscripten_glGenQueriesEXT: _emscripten_glGenQueriesEXT,
  /** @export */
  emscripten_glGenRenderbuffers: _emscripten_glGenRenderbuffers,
  /** @export */
  emscripten_glGenTextures: _emscripten_glGenTextures,
  /** @export */
  emscripten_glGenVertexArraysOES: _emscripten_glGenVertexArraysOES,
  /** @export */
  emscripten_glGenerateMipmap: _emscripten_glGenerateMipmap,
  /** @export */
  emscripten_glGetActiveAttrib: _emscripten_glGetActiveAttrib,
  /** @export */
  emscripten_glGetActiveUniform: _emscripten_glGetActiveUniform,
  /** @export */
  emscripten_glGetAttachedShaders: _emscripten_glGetAttachedShaders,
  /** @export */
  emscripten_glGetAttribLocation: _emscripten_glGetAttribLocation,
  /** @export */
  emscripten_glGetBooleanv: _emscripten_glGetBooleanv,
  /** @export */
  emscripten_glGetBufferParameteriv: _emscripten_glGetBufferParameteriv,
  /** @export */
  emscripten_glGetError: _emscripten_glGetError,
  /** @export */
  emscripten_glGetFloatv: _emscripten_glGetFloatv,
  /** @export */
  emscripten_glGetFramebufferAttachmentParameteriv: _emscripten_glGetFramebufferAttachmentParameteriv,
  /** @export */
  emscripten_glGetIntegerv: _emscripten_glGetIntegerv,
  /** @export */
  emscripten_glGetProgramInfoLog: _emscripten_glGetProgramInfoLog,
  /** @export */
  emscripten_glGetProgramiv: _emscripten_glGetProgramiv,
  /** @export */
  emscripten_glGetQueryObjecti64vEXT: _emscripten_glGetQueryObjecti64vEXT,
  /** @export */
  emscripten_glGetQueryObjectivEXT: _emscripten_glGetQueryObjectivEXT,
  /** @export */
  emscripten_glGetQueryObjectui64vEXT: _emscripten_glGetQueryObjectui64vEXT,
  /** @export */
  emscripten_glGetQueryObjectuivEXT: _emscripten_glGetQueryObjectuivEXT,
  /** @export */
  emscripten_glGetQueryivEXT: _emscripten_glGetQueryivEXT,
  /** @export */
  emscripten_glGetRenderbufferParameteriv: _emscripten_glGetRenderbufferParameteriv,
  /** @export */
  emscripten_glGetShaderInfoLog: _emscripten_glGetShaderInfoLog,
  /** @export */
  emscripten_glGetShaderPrecisionFormat: _emscripten_glGetShaderPrecisionFormat,
  /** @export */
  emscripten_glGetShaderSource: _emscripten_glGetShaderSource,
  /** @export */
  emscripten_glGetShaderiv: _emscripten_glGetShaderiv,
  /** @export */
  emscripten_glGetString: _emscripten_glGetString,
  /** @export */
  emscripten_glGetTexParameterfv: _emscripten_glGetTexParameterfv,
  /** @export */
  emscripten_glGetTexParameteriv: _emscripten_glGetTexParameteriv,
  /** @export */
  emscripten_glGetUniformLocation: _emscripten_glGetUniformLocation,
  /** @export */
  emscripten_glGetUniformfv: _emscripten_glGetUniformfv,
  /** @export */
  emscripten_glGetUniformiv: _emscripten_glGetUniformiv,
  /** @export */
  emscripten_glGetVertexAttribPointerv: _emscripten_glGetVertexAttribPointerv,
  /** @export */
  emscripten_glGetVertexAttribfv: _emscripten_glGetVertexAttribfv,
  /** @export */
  emscripten_glGetVertexAttribiv: _emscripten_glGetVertexAttribiv,
  /** @export */
  emscripten_glHint: _emscripten_glHint,
  /** @export */
  emscripten_glIsBuffer: _emscripten_glIsBuffer,
  /** @export */
  emscripten_glIsEnabled: _emscripten_glIsEnabled,
  /** @export */
  emscripten_glIsFramebuffer: _emscripten_glIsFramebuffer,
  /** @export */
  emscripten_glIsProgram: _emscripten_glIsProgram,
  /** @export */
  emscripten_glIsQueryEXT: _emscripten_glIsQueryEXT,
  /** @export */
  emscripten_glIsRenderbuffer: _emscripten_glIsRenderbuffer,
  /** @export */
  emscripten_glIsShader: _emscripten_glIsShader,
  /** @export */
  emscripten_glIsTexture: _emscripten_glIsTexture,
  /** @export */
  emscripten_glIsVertexArrayOES: _emscripten_glIsVertexArrayOES,
  /** @export */
  emscripten_glLineWidth: _emscripten_glLineWidth,
  /** @export */
  emscripten_glLinkProgram: _emscripten_glLinkProgram,
  /** @export */
  emscripten_glPixelStorei: _emscripten_glPixelStorei,
  /** @export */
  emscripten_glPolygonModeWEBGL: _emscripten_glPolygonModeWEBGL,
  /** @export */
  emscripten_glPolygonOffset: _emscripten_glPolygonOffset,
  /** @export */
  emscripten_glPolygonOffsetClampEXT: _emscripten_glPolygonOffsetClampEXT,
  /** @export */
  emscripten_glQueryCounterEXT: _emscripten_glQueryCounterEXT,
  /** @export */
  emscripten_glReadPixels: _emscripten_glReadPixels,
  /** @export */
  emscripten_glReleaseShaderCompiler: _emscripten_glReleaseShaderCompiler,
  /** @export */
  emscripten_glRenderbufferStorage: _emscripten_glRenderbufferStorage,
  /** @export */
  emscripten_glSampleCoverage: _emscripten_glSampleCoverage,
  /** @export */
  emscripten_glScissor: _emscripten_glScissor,
  /** @export */
  emscripten_glShaderBinary: _emscripten_glShaderBinary,
  /** @export */
  emscripten_glShaderSource: _emscripten_glShaderSource,
  /** @export */
  emscripten_glStencilFunc: _emscripten_glStencilFunc,
  /** @export */
  emscripten_glStencilFuncSeparate: _emscripten_glStencilFuncSeparate,
  /** @export */
  emscripten_glStencilMask: _emscripten_glStencilMask,
  /** @export */
  emscripten_glStencilMaskSeparate: _emscripten_glStencilMaskSeparate,
  /** @export */
  emscripten_glStencilOp: _emscripten_glStencilOp,
  /** @export */
  emscripten_glStencilOpSeparate: _emscripten_glStencilOpSeparate,
  /** @export */
  emscripten_glTexImage2D: _emscripten_glTexImage2D,
  /** @export */
  emscripten_glTexParameterf: _emscripten_glTexParameterf,
  /** @export */
  emscripten_glTexParameterfv: _emscripten_glTexParameterfv,
  /** @export */
  emscripten_glTexParameteri: _emscripten_glTexParameteri,
  /** @export */
  emscripten_glTexParameteriv: _emscripten_glTexParameteriv,
  /** @export */
  emscripten_glTexSubImage2D: _emscripten_glTexSubImage2D,
  /** @export */
  emscripten_glUniform1f: _emscripten_glUniform1f,
  /** @export */
  emscripten_glUniform1fv: _emscripten_glUniform1fv,
  /** @export */
  emscripten_glUniform1i: _emscripten_glUniform1i,
  /** @export */
  emscripten_glUniform1iv: _emscripten_glUniform1iv,
  /** @export */
  emscripten_glUniform2f: _emscripten_glUniform2f,
  /** @export */
  emscripten_glUniform2fv: _emscripten_glUniform2fv,
  /** @export */
  emscripten_glUniform2i: _emscripten_glUniform2i,
  /** @export */
  emscripten_glUniform2iv: _emscripten_glUniform2iv,
  /** @export */
  emscripten_glUniform3f: _emscripten_glUniform3f,
  /** @export */
  emscripten_glUniform3fv: _emscripten_glUniform3fv,
  /** @export */
  emscripten_glUniform3i: _emscripten_glUniform3i,
  /** @export */
  emscripten_glUniform3iv: _emscripten_glUniform3iv,
  /** @export */
  emscripten_glUniform4f: _emscripten_glUniform4f,
  /** @export */
  emscripten_glUniform4fv: _emscripten_glUniform4fv,
  /** @export */
  emscripten_glUniform4i: _emscripten_glUniform4i,
  /** @export */
  emscripten_glUniform4iv: _emscripten_glUniform4iv,
  /** @export */
  emscripten_glUniformMatrix2fv: _emscripten_glUniformMatrix2fv,
  /** @export */
  emscripten_glUniformMatrix3fv: _emscripten_glUniformMatrix3fv,
  /** @export */
  emscripten_glUniformMatrix4fv: _emscripten_glUniformMatrix4fv,
  /** @export */
  emscripten_glUseProgram: _emscripten_glUseProgram,
  /** @export */
  emscripten_glValidateProgram: _emscripten_glValidateProgram,
  /** @export */
  emscripten_glVertexAttrib1f: _emscripten_glVertexAttrib1f,
  /** @export */
  emscripten_glVertexAttrib1fv: _emscripten_glVertexAttrib1fv,
  /** @export */
  emscripten_glVertexAttrib2f: _emscripten_glVertexAttrib2f,
  /** @export */
  emscripten_glVertexAttrib2fv: _emscripten_glVertexAttrib2fv,
  /** @export */
  emscripten_glVertexAttrib3f: _emscripten_glVertexAttrib3f,
  /** @export */
  emscripten_glVertexAttrib3fv: _emscripten_glVertexAttrib3fv,
  /** @export */
  emscripten_glVertexAttrib4f: _emscripten_glVertexAttrib4f,
  /** @export */
  emscripten_glVertexAttrib4fv: _emscripten_glVertexAttrib4fv,
  /** @export */
  emscripten_glVertexAttribDivisorANGLE: _emscripten_glVertexAttribDivisorANGLE,
  /** @export */
  emscripten_glVertexAttribPointer: _emscripten_glVertexAttribPointer,
  /** @export */
  emscripten_glViewport: _emscripten_glViewport,
  /** @export */
  emscripten_has_asyncify: _emscripten_has_asyncify,
  /** @export */
  emscripten_request_fullscreen_strategy: _emscripten_request_fullscreen_strategy,
  /** @export */
  emscripten_request_pointerlock: _emscripten_request_pointerlock,
  /** @export */
  emscripten_resize_heap: _emscripten_resize_heap,
  /** @export */
  emscripten_sample_gamepad_data: _emscripten_sample_gamepad_data,
  /** @export */
  emscripten_set_beforeunload_callback_on_thread: _emscripten_set_beforeunload_callback_on_thread,
  /** @export */
  emscripten_set_blur_callback_on_thread: _emscripten_set_blur_callback_on_thread,
  /** @export */
  emscripten_set_canvas_element_size: _emscripten_set_canvas_element_size,
  /** @export */
  emscripten_set_devicemotion_callback_on_thread: _emscripten_set_devicemotion_callback_on_thread,
  /** @export */
  emscripten_set_element_css_size: _emscripten_set_element_css_size,
  /** @export */
  emscripten_set_focus_callback_on_thread: _emscripten_set_focus_callback_on_thread,
  /** @export */
  emscripten_set_fullscreenchange_callback_on_thread: _emscripten_set_fullscreenchange_callback_on_thread,
  /** @export */
  emscripten_set_gamepadconnected_callback_on_thread: _emscripten_set_gamepadconnected_callback_on_thread,
  /** @export */
  emscripten_set_gamepaddisconnected_callback_on_thread: _emscripten_set_gamepaddisconnected_callback_on_thread,
  /** @export */
  emscripten_set_keydown_callback_on_thread: _emscripten_set_keydown_callback_on_thread,
  /** @export */
  emscripten_set_keypress_callback_on_thread: _emscripten_set_keypress_callback_on_thread,
  /** @export */
  emscripten_set_keyup_callback_on_thread: _emscripten_set_keyup_callback_on_thread,
  /** @export */
  emscripten_set_main_loop: _emscripten_set_main_loop,
  /** @export */
  emscripten_set_main_loop_timing: _emscripten_set_main_loop_timing,
  /** @export */
  emscripten_set_orientationchange_callback_on_thread: _emscripten_set_orientationchange_callback_on_thread,
  /** @export */
  emscripten_set_pointerlockchange_callback_on_thread: _emscripten_set_pointerlockchange_callback_on_thread,
  /** @export */
  emscripten_set_resize_callback_on_thread: _emscripten_set_resize_callback_on_thread,
  /** @export */
  emscripten_set_visibilitychange_callback_on_thread: _emscripten_set_visibilitychange_callback_on_thread,
  /** @export */
  emscripten_set_wheel_callback_on_thread: _emscripten_set_wheel_callback_on_thread,
  /** @export */
  emscripten_set_window_title: _emscripten_set_window_title,
  /** @export */
  emscripten_sleep: _emscripten_sleep,
  /** @export */
  emscripten_webgl_create_context: _emscripten_webgl_create_context,
  /** @export */
  emscripten_webgl_destroy_context: _emscripten_webgl_destroy_context,
  /** @export */
  emscripten_webgl_make_context_current: _emscripten_webgl_make_context_current,
  /** @export */
  environ_get: _environ_get,
  /** @export */
  environ_sizes_get: _environ_sizes_get,
  /** @export */
  fd_close: _fd_close,
  /** @export */
  fd_read: _fd_read,
  /** @export */
  fd_seek: _fd_seek,
  /** @export */
  fd_write: _fd_write
};


// include: postamble.js
// === Auto-generated postamble setup entry stuff ===

var calledRun;

function callMain(args = []) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on Module["onRuntimeInitialized"])');
  assert(typeof onPreRuns === 'undefined' || onPreRuns.length == 0, 'cannot call main when preRun functions remain to be called');

  var entryFunction = _main;

  args.unshift(thisProgram);

  var argc = args.length;
  var argv = stackAlloc((argc + 1) * 4);
  var argv_ptr = argv;
  for (var arg of args) {
    HEAPU32[((argv_ptr)>>2)] = stringToUTF8OnStack(arg);
    argv_ptr += 4;
  }
  HEAPU32[((argv_ptr)>>2)] = 0;

  try {

    var ret = entryFunction(argc, argv);

    // if we're not running an evented main loop, it's time to exit
    exitJS(ret, /* implicit = */ true);
    return ret;
  } catch (e) {
    return handleException(e);
  }
}

function stackCheckInit() {
  // This is normally called automatically during __wasm_call_ctors but need to
  // get these values before even running any of the ctors so we call it redundantly
  // here.
  _emscripten_stack_init();
  // TODO(sbc): Move writeStackCookie to native to to avoid this.
  writeStackCookie();
}

async function run(args = programArgs) {
  assert(!calledRun);
  calledRun = true;

  stackCheckInit();

  preRun();

  if (runDependencies) {
    await resolveRunDependencies();
  }

  var setStatus = Module['setStatus'];
  if (setStatus) {
    setStatus('Running...');
    // Yield to the event loop to allow the browser to paint "Running..."
    await new Promise((resolve) => setTimeout(resolve, 1));
    // Then we want to clear the status text, but only after the rest of this function runs.
    setTimeout(setStatus, 1, '');
  }

  if (ABORT) return;

  initRuntime();

  // No ATMAINS hooks

  Module['onRuntimeInitialized']?.();
  consumedModuleProp('onRuntimeInitialized');

  var noInitialRun = Module['noInitialRun'] || false;
  if (!noInitialRun) callMain(args);

  postRun();
}

function checkUnflushedContent() {
  // Compiler settings do not allow exiting the runtime, so flushing
  // the streams is not possible. but in ASSERTIONS mode we check
  // if there was something to flush, and if so tell the user they
  // should request that the runtime be exitable.
  // Normally we would not even include flush() at all, but in ASSERTIONS
  // builds we do so just for this check, and here we see if there is any
  // content to flush, that is, we check if there would have been
  // something a non-ASSERTIONS build would have not seen.
  // How we flush the streams depends on whether we are in SYSCALLS_REQUIRE_FILESYSTEM=0
  // mode (which has its own special function for this; otherwise, all
  // the code is inside libc)
  var oldOut = out;
  var oldErr = err;
  var has = false;
  out = err = (x) => {
    has = true;
  }
  try { // it doesn't matter if it fails
    _fflush(0);
    // also flush in the JS FS layer
    for (var tty of Object.values(TTY.ttys)) {
      if (tty.output.length) {
        has = true;
      }
    }
  } catch(e) {}
  out = oldOut;
  err = oldErr;
  if (has) {
    warnOnce('stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the Emscripten FAQ), or make sure to emit a newline when you printf etc.');
  }
}

var wasmExports;

// With async instantation wasmExports is assigned asynchronously when the
// instance is received.
createWasm().then(() => run());

// end include: postamble.js

