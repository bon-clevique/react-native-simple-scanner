// Build a separate consumer without changing the RN 0.84 development workspace.
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const destination = process.argv[2];
const templateIntegrity =
  'sha512-bFGQpjZ7RrH4+ZXgkPnbOXR87db49uoFRue3GuGOQOGDpev0a7z3/QY+DG79Z1vo7P1dcRZgWgY618mZfPDdFQ==';

async function main() {
  if (!destination || !path.isAbsolute(destination)) {
    throw new Error('Pass an absolute, nonexistent destination directory');
  }
  fs.mkdirSync(destination); // Refuse to overwrite another task's files.
  execFileSync(
    'npm',
    [
      'pack',
      '@react-native-community/template@0.88.1',
      '--registry=https://registry.npmjs.org',
      '--ignore-scripts',
      '--pack-destination',
      destination,
    ],
    { stdio: 'inherit' }
  );
  const archivePath = path.join(
    destination,
    'react-native-community-template-0.88.1.tgz'
  );
  const archive = fs.readFileSync(archivePath);
  const integrity = `sha512-${createHash('sha512').update(archive).digest('base64')}`;
  if (integrity !== templateIntegrity)
    throw new Error('Template hash mismatch');
  execFileSync('tar', ['-xzf', archivePath, '-C', destination]);
  const app = path.join(destination, 'app');
  fs.cpSync(path.join(destination, 'package/template'), app, {
    recursive: true,
  });
  // Android's official settings.gradle resolves the plugin directly in node_modules.
  fs.writeFileSync(
    path.join(app, '.npmrc'),
    'node-linker=hoisted\nengine-strict=true\n'
  );
  execFileSync(
    'npm',
    ['pack', '--ignore-scripts', '--pack-destination', destination],
    {
      cwd: root,
      stdio: 'inherit',
    }
  );
  const library = JSON.parse(fs.readFileSync(path.join(root, 'package.json')));
  const manifestPath = path.join(app, 'package.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath));
  manifest.name = 'scanner-rn088-consumer';
  delete manifest.dependencies['@react-native/new-app-screen'];
  manifest.dependencies[library.name] =
    `file:../${library.name}-${library.version}.tgz`;
  // Only retain build dependencies from the official template.
  const buildDependencies = new Set([
    '@babel/core',
    '@babel/preset-env',
    '@babel/runtime',
    '@react-native-community/cli',
    '@react-native-community/cli-platform-android',
    '@react-native-community/cli-platform-ios',
    '@react-native/babel-preset',
    '@react-native/metro-config',
    '@types/react',
    'typescript',
  ]);
  manifest.devDependencies = Object.fromEntries(
    Object.entries(manifest.devDependencies).filter(([name]) =>
      buildDependencies.has(name)
    )
  );
  manifest.packageManager = library.packageManager;
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  fs.copyFileSync(
    path.join(root, 'example/src/App.tsx'),
    path.join(app, 'App.tsx')
  );
  const plist = path.join(app, 'ios/HelloWorld/Info.plist');
  fs.writeFileSync(
    plist,
    fs
      .readFileSync(plist, 'utf8')
      .replace('Hello App Display Name', 'Scanner RN 0.88')
      .replace(
        '<key>NSLocationWhenInUseUsageDescription</key>',
        '<key>NSCameraUsageDescription</key>\n\t<string>Verify barcode scanning with React Native 0.88.</string>\n\t<key>NSLocationWhenInUseUsageDescription</key>'
      )
  );
  console.log(`Prepared RN 0.88.1 consumer: ${app}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
