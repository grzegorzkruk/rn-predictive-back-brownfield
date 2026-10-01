/**
 * Links the local checkouts into this app's node_modules:
 *
 *   react-native                      -> ../react-native/packages/react-native
 *   @callstack/react-native-brownfield -> ../react-native-brownfield/packages/react-native-brownfield
 *
 * plus the tooling packages that only exist inside the react-native monorepo at
 * this version (0.87 on npm does not match the 1000.0.0 checkout).
 *
 * Everything else (react-navigation, react-native-screens, safe-area-context) is
 * a plain npm install on purpose: this demo is about who owns the back gesture,
 * not about patched libraries.
 *
 * Run with `yarn link` (also runs automatically after `yarn install`).
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const APP_ROOT = path.resolve(__dirname, '..');
const CALLSTACK = path.resolve(APP_ROOT, '..');
const NM = path.join(APP_ROOT, 'node_modules');

const RN_REPO = path.join(CALLSTACK, 'react-native');
const RN_PACKAGES = path.join(RN_REPO, 'packages');
const BROWNFIELD_REPO = path.join(CALLSTACK, 'react-native-brownfield');

/** package name -> absolute source directory */
const LINKS = {
  'react-native': path.join(RN_PACKAGES, 'react-native'),
  '@callstack/react-native-brownfield': path.join(
    BROWNFIELD_REPO,
    'packages',
    'react-native-brownfield',
  ),

  // Not published at the checkout's version, so they have to come from the repo.
  '@react-native/codegen': path.join(RN_PACKAGES, 'react-native-codegen'),
  '@react-native/asset-utils': path.join(RN_PACKAGES, 'asset-utils'),
  '@react-native/babel-preset': path.join(RN_PACKAGES, 'react-native-babel-preset'),
  '@react-native/babel-transformer': path.join(RN_PACKAGES, 'react-native-babel-transformer'),
  '@react-native/community-cli-plugin': path.join(RN_PACKAGES, 'community-cli-plugin'),
  '@react-native/gradle-plugin': path.join(RN_PACKAGES, 'gradle-plugin'),
  '@react-native/metro-config': path.join(RN_PACKAGES, 'metro-config'),
  '@react-native/normalize-colors': path.join(RN_PACKAGES, 'normalize-color'),
  '@react-native/polyfills': path.join(RN_PACKAGES, 'polyfills'),
  '@react-native/virtualized-lists': path.join(RN_PACKAGES, 'virtualized-lists'),
};

function ensureSymlink(linkPath, targetPath) {
  if (!fs.existsSync(targetPath)) {
    throw new Error(
      `Missing source checkout for ${linkPath}: ${targetPath}\n` +
        'Adjust LINKS in scripts/link.js if your checkouts live elsewhere.',
    );
  }

  const parent = path.dirname(linkPath);
  fs.mkdirSync(parent, { recursive: true });

  let stats = null;
  try {
    stats = fs.lstatSync(linkPath);
  } catch {
    // does not exist
  }

  if (stats != null) {
    if (stats.isSymbolicLink()) {
      const current = fs.readlinkSync(linkPath);
      if (path.resolve(parent, current) === targetPath) {
        return 'unchanged';
      }
      fs.unlinkSync(linkPath);
    } else if (stats.isDirectory()) {
      // npm/yarn installed a real copy of a package we want to link.
      fs.rmSync(linkPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(linkPath);
    }
  }

  fs.symlinkSync(targetPath, linkPath, 'junction');
  return 'linked';
}

function main() {
  if (!fs.existsSync(NM)) {
    console.error('node_modules is missing. Run `yarn install` first.');
    process.exit(1);
  }

  const results = [];
  for (const [name, target] of Object.entries(LINKS)) {
    const status = ensureSymlink(path.join(NM, name), target);
    results.push([status, name, target]);
  }

  for (const [status, name, target] of results) {
    const mark = status === 'linked' ? '\x1b[32m~\x1b[0m' : '\x1b[90m=\x1b[0m';
    console.log(`${mark} ${name.padEnd(38)} ${path.relative(CALLSTACK, target)}`);
  }

  console.log('\nNext: `yarn package:android && yarn publish:android`, then `yarn native:install`.');
}

main();
