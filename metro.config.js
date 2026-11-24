/**
 * Metro config for the brownfield predictive-back demo.
 *
 * Linked checkouts (scripts/link.js):
 *   react-native                         -> ../react-native/packages/react-native
 *
 * @callstack/react-native-brownfield comes from npm.
 *
 * watchFolders must list every linked root, otherwise Metro does not see edits
 * made in those repos and the packaged bundle is silently stale.
 */

const path = require('node:path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const CALLSTACK = path.resolve(__dirname, '..');
// RN_REPO points at another react-native checkout, for example a PR worktree.
const RN_REPO = process.env.RN_REPO ? path.resolve(process.env.RN_REPO) : path.join(CALLSTACK, 'react-native');

const defaultConfig = getDefaultConfig(__dirname);

/** @type {import('metro-config').MetroConfig} */
const config = {
  watchFolders: [
    // Carries node_modules that react-native itself depends on.
    path.join(RN_REPO, 'node_modules'),
    // Workspace packages that RN's JavaScript imports at runtime.
    path.join(RN_REPO, 'packages', 'react-native'),
    path.join(RN_REPO, 'packages', 'asset-utils'),
    path.join(RN_REPO, 'packages', 'normalize-color'),
    path.join(RN_REPO, 'packages', 'polyfills'),
    path.join(RN_REPO, 'packages', 'virtualized-lists'),
    path.join(CALLSTACK, 'rn-predictive-back-progress'),
  ],

  resolver: {
    nodeModulesPaths: [
      'node_modules',
      path.join(__dirname, 'node_modules'),
      path.join(RN_REPO, 'node_modules'),
    ],

    extraNodeModules: {
      'react-native': path.join(RN_REPO, 'packages', 'react-native'),
      react: path.join(__dirname, 'node_modules', 'react'),
    },

    blockList: [
      pathToRegex(path.join(RN_REPO, 'packages', 'react-native', 'sdks')),
      pathToRegex(path.join(RN_REPO, 'packages', 'rn-tester')),
      pathToRegex(path.join(RN_REPO, 'private')),
    ],

    resolveRequest: (context, moduleName, platform) => {
      // Both this app and the react-native checkout own a real node_modules/react.
      // Anything resolved from inside a watchFolder walks up and can land on RN's
      // copy, which gives two React instances -> "Invalid hook call".
      if (moduleName === 'react' || moduleName.startsWith('react/')) {
        return context.resolveRequest(
          context,
          path.join(
            __dirname,
            'node_modules',
            moduleName === 'react' ? 'react' : moduleName,
          ),
          platform,
        );
      }

      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

function pathToRegex(absolutePath) {
  const escaped = absolutePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped}${path.sep === '\\' ? '\\\\' : '/'}.*$`);
}

module.exports = mergeConfig(defaultConfig, config);
