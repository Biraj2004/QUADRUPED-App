const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const PROJECT_ROOT = __dirname;
const PACKAGE_JSON_PATH = path.join(PROJECT_ROOT, 'package.json');
const APP_JSON_PATH = path.join(PROJECT_ROOT, 'app.json');
const DEFAULT_RELEASES_DIR = path.join(PROJECT_ROOT, 'releases');
const CACHE_DIR = path.join(PROJECT_ROOT, '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'build-apk.json');

const DEFAULT_ARCHITECTURES = 'arm64-v8a';
const VALID_ARCHITECTURES = new Set(['armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64']);

const VALID_BUMPS = new Set(['major', 'minor', 'patch', 'none']);

function runCommand(command, cwd = PROJECT_ROOT) {
  console.log(`\n> Running: ${command} (in ${cwd})`);
  try {
    execSync(command, { stdio: 'inherit', cwd });
  } catch (error) {
    console.error(`Command failed: ${command}`);
    process.exit(1);
  }
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`Error: Failed to parse JSON at ${filePath}`);
    process.exit(1);
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function parseArgs(argv) {
  const args = {
    bump: 'patch',
    forcePrebuild: false,
    skipPrebuild: false,
    clean: false,
    outputDir: '',
    architectures: '',
    universal: false,
    help: false,
    unknown: [],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--no-bump') {
      args.bump = 'none';
    } else if (arg === '--bump') {
      args.bump = argv[i + 1];
      i += 1;
    } else if (arg.startsWith('--bump=')) {
      args.bump = arg.split('=')[1];
    } else if (arg === '--force-prebuild') {
      args.forcePrebuild = true;
    } else if (arg === '--skip-prebuild') {
      args.skipPrebuild = true;
    } else if (arg === '--clean') {
      args.clean = true;
    } else if (arg === '--output-dir') {
      args.outputDir = argv[i + 1];
      i += 1;
    } else if (arg.startsWith('--output-dir=')) {
      args.outputDir = arg.split('=')[1];
    } else if (arg === '--abi' || arg === '--abis') {
      args.architectures = argv[i + 1];
      i += 1;
    } else if (arg.startsWith('--abi=')) {
      args.architectures = arg.split('=')[1];
    } else if (arg.startsWith('--abis=')) {
      args.architectures = arg.split('=')[1];
    } else if (arg === '--universal') {
      args.universal = true;
    } else {
      args.unknown.push(arg);
    }
  }

  return args;
}

function printHelp() {
  console.log(`\nUsage: node build-apk.js [options]\n\nOptions:\n  --bump <major|minor|patch>   Increment version (default: patch)\n  --no-bump                    Do not change version or versionCode\n  --force-prebuild             Always run expo prebuild\n  --skip-prebuild              Skip prebuild (requires android/ already)\n  --clean                      Run Gradle clean before build\n  --output-dir <dir>           Output directory (default: releases/)\n  --abi <arch>                 Build single ABI (arm64-v8a, armeabi-v7a, x86, x86_64)\n  --abis <list>                Build multiple ABIs (comma-separated)\n  --universal                  Build all ABIs (default Gradle setting)\n  -h, --help                   Show help\n`);
}

function sanitizeFilePart(value) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getGitSha() {
  try {
    return execSync('git rev-parse --short HEAD', {
      cwd: PROJECT_ROOT,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch (error) {
    return '';
  }
}

function hashFiles(filePaths) {
  const hash = crypto.createHash('sha256');
  filePaths
    .filter((filePath) => fs.existsSync(filePath))
    .forEach((filePath) => {
      hash.update(filePath);
      hash.update('\n');
      hash.update(fs.readFileSync(filePath));
      hash.update('\n');
    });
  return hash.digest('hex');
}

function readCache() {
  if (!fs.existsSync(CACHE_FILE)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch (error) {
    return {};
  }
}

function writeCache(data) {
  ensureDir(CACHE_DIR);
  fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function bumpVersion(parts, bumpType) {
  const next = [...parts];
  if (bumpType === 'major') {
    next[0] += 1;
    next[1] = 0;
    next[2] = 0;
  } else if (bumpType === 'minor') {
    next[1] += 1;
    next[2] = 0;
  } else {
    next[2] += 1;
  }
  return next.join('.');
}

function ensureUniquePath(filePath) {
  if (!fs.existsSync(filePath)) {
    return filePath;
  }

  const parsed = path.parse(filePath);
  let index = 1;
  let candidate = '';
  do {
    candidate = path.join(parsed.dir, `${parsed.name}-${index}${parsed.ext}`);
    index += 1;
  } while (fs.existsSync(candidate));

  return candidate;
}

function findLatestApk(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return '';
  }
  const apkFiles = fs
    .readdirSync(dirPath)
    .filter((name) => name.toLowerCase().endsWith('.apk'))
    .map((name) => ({
      name,
      mtimeMs: fs.statSync(path.join(dirPath, name)).mtimeMs,
    }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  return apkFiles.length ? path.join(dirPath, apkFiles[0].name) : '';
}

function main() {
  console.log('=== Quadruped App APK Release Builder ===');

  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
  }

  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }
  if (args.unknown.length > 0) {
    console.error(`Error: Unknown arguments: ${args.unknown.join(', ')}`);
    printHelp();
    process.exit(1);
  }
  if (args.skipPrebuild && args.forcePrebuild) {
    console.error('Error: --skip-prebuild and --force-prebuild cannot be used together.');
    process.exit(1);
  }
  if (!VALID_BUMPS.has(args.bump)) {
    console.error(`Error: Invalid --bump value: "${args.bump}"`);
    process.exit(1);
  }

  let architectures = args.architectures;
  if (args.universal) {
    architectures = '';
  } else if (!architectures) {
    architectures = DEFAULT_ARCHITECTURES;
  }

  if (architectures) {
    const requested = architectures.split(',').map((item) => item.trim()).filter(Boolean);
    const invalid = requested.filter((item) => !VALID_ARCHITECTURES.has(item));
    if (invalid.length > 0) {
      console.error(`Error: Invalid ABI(s): ${invalid.join(', ')}`);
      process.exit(1);
    }
    architectures = requested.join(',');
  }

  if (!fs.existsSync(PACKAGE_JSON_PATH) || !fs.existsSync(APP_JSON_PATH)) {
    console.error('Error: package.json or app.json not found.');
    process.exit(1);
  }

  const packageJson = readJson(PACKAGE_JSON_PATH);
  const appJson = readJson(APP_JSON_PATH);
  if (!appJson.expo) {
    console.error('Error: app.json is missing the "expo" config block.');
    process.exit(1);
  }

  const expoConfig = appJson.expo;
  const appName = expoConfig.name || packageJson.name || 'app';
  const appSlug = expoConfig.slug || appName;
  const safeSlug = sanitizeFilePart(appSlug) || sanitizeFilePart(appName) || 'app';

  if (packageJson.version && expoConfig.version && packageJson.version !== expoConfig.version) {
    console.warn(`Warning: package.json version (${packageJson.version}) and app.json version (${expoConfig.version}) differ.`);
  }

  const currentVersion = packageJson.version || expoConfig.version;
  if (!currentVersion) {
    console.error('Error: No version found in package.json or app.json.');
    process.exit(1);
  }

  const versionParts = currentVersion.split('.').map(Number);
  if (versionParts.length !== 3 || versionParts.some((part) => Number.isNaN(part))) {
    console.error(`Error: Invalid version format: "${currentVersion}". Use major.minor.patch (e.g. 1.2.3).`);
    process.exit(1);
  }

  const currentVersionCode = Number(expoConfig.android?.versionCode ?? 1);
  if (!Number.isInteger(currentVersionCode) || currentVersionCode < 1) {
    console.error(`Error: Invalid android.versionCode value: "${expoConfig.android?.versionCode}"`);
    process.exit(1);
  }

  let newVersion = currentVersion;
  let newVersionCode = currentVersionCode;

  if (args.bump !== 'none') {
    newVersion = bumpVersion(versionParts, args.bump);
    newVersionCode = currentVersionCode + 1;

    packageJson.version = newVersion;
    expoConfig.version = newVersion;
    if (!expoConfig.android) {
      expoConfig.android = {};
    }
    expoConfig.android.versionCode = newVersionCode;

    console.log(`\nUpdating version:`);
    console.log(`- Version string:   ${currentVersion} -> ${newVersion}`);
    console.log(`- Android code:     ${currentVersionCode} -> ${newVersionCode}`);

    writeJson(PACKAGE_JSON_PATH, packageJson);
    writeJson(APP_JSON_PATH, appJson);
    console.log('Saved updated config files.');
  } else {
    console.log('\nVersion bump disabled; using existing version metadata.');
  }

  const androidDir = path.join(PROJECT_ROOT, 'android');
  const isWindows = process.platform === 'win32';
  const gradlewCmd = isWindows ? '.\\gradlew.bat' : './gradlew';
  const gradlewPath = path.join(androidDir, isWindows ? 'gradlew.bat' : 'gradlew');

  const prebuildInputs = [
    APP_JSON_PATH,
    PACKAGE_JSON_PATH,
    path.join(PROJECT_ROOT, 'app.config.js'),
    path.join(PROJECT_ROOT, 'app.config.ts'),
    path.join(PROJECT_ROOT, 'metro.config.js'),
  ];
  const prebuildFingerprint = hashFiles(prebuildInputs);
  const cache = readCache();

  if (args.skipPrebuild) {
    if (!fs.existsSync(androidDir) || !fs.existsSync(gradlewPath)) {
      console.error('Error: android/ is missing. Remove --skip-prebuild or run prebuild first.');
      process.exit(1);
    }
  } else {
    const needsPrebuild =
      args.forcePrebuild ||
      !fs.existsSync(androidDir) ||
      !fs.existsSync(gradlewPath) ||
      cache.prebuildFingerprint !== prebuildFingerprint;

    if (needsPrebuild) {
      console.log('\nRunning Expo Prebuild...');
      runCommand('npx expo prebuild --platform android --no-install');
      writeCache({ prebuildFingerprint, lastPrebuildAt: new Date().toISOString() });
    } else {
      console.log('\nSkipping Expo Prebuild (cache hit).');
    }
  }

  if (!fs.existsSync(gradlewPath)) {
    console.error('Error: Gradle wrapper not found. Prebuild may have failed.');
    process.exit(1);
  }

  if (args.clean) {
    console.log('\nCleaning Gradle build...');
    runCommand(`${gradlewCmd} clean`, androidDir);
  }

  console.log('\nCompiling Optimized Release APK with Gradle...');
  const gradleArgs = [
    'assembleRelease',
    '-Pandroid.enableMinifyInReleaseBuilds=true',
    '-Pandroid.enableShrinkResourcesInReleaseBuilds=true',
    '--build-cache',
    '--parallel',
  ];

  if (architectures) {
    gradleArgs.push(`-PreactNativeArchitectures=${architectures}`);
    console.log(`- Target ABIs: ${architectures}`);
  } else {
    console.log('- Target ABIs: universal');
  }

  runCommand(`${gradlewCmd} ${gradleArgs.join(' ')}`, androidDir);

  const releaseApkDir = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release');
  let srcApkPath = path.join(releaseApkDir, 'app-release.apk');
  if (!fs.existsSync(srcApkPath)) {
    srcApkPath = findLatestApk(releaseApkDir);
  }
  if (!srcApkPath) {
    console.error(`Error: No APK found in ${releaseApkDir}`);
    process.exit(1);
  }

  const outputDir = args.outputDir
    ? path.resolve(PROJECT_ROOT, args.outputDir)
    : DEFAULT_RELEASES_DIR;
  ensureDir(outputDir);

  const buildDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const gitSha = getGitSha();
  const nameSuffix = gitSha ? `-${gitSha}` : '';
  const archTag = architectures
    ? `-${sanitizeFilePart(architectures.replace(/,/g, '-'))}`
    : '-universal';
  const destApkName = `${safeSlug}-v${newVersion}${archTag}.apk`;
  const destApkPath = ensureUniquePath(path.join(outputDir, destApkName));

  fs.copyFileSync(srcApkPath, destApkPath);

  console.log('\n=======================================');
  console.log('BUILD SUCCESSFUL!');
  console.log(`APK saved to: ${destApkPath}`);
  console.log('=======================================');
}

main();
