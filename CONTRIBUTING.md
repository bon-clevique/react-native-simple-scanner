# Contributing

Contributions are always welcome, no matter how large or small!

We want this community to be friendly and respectful to each other. Please follow it in all your interactions with the project. Before contributing, please read the [code of conduct](./CODE_OF_CONDUCT.md).

## Development workflow

This project is a monorepo managed using [pnpm workspaces](https://pnpm.io/workspaces). It contains the following packages:

- The library package in the root directory.
- An example app in the `example/` directory.

To get started, use [Node.js](https://nodejs.org/) 24.22.2, pinned in [`.nvmrc`](./.nvmrc) and the root and example `.tool-versions` files. Both package manifests require `^22.23.4 || ^24.22.1 || ^26.12.1`, the supported release lines containing the October 2026 security fixes. The repository's `.npmrc` enables `engine-strict`, so dependency installation fails on older stable patches and unsupported release lines. Package managers can accept prereleases above these floors, so use the pinned stable version for development and publication. CI uses `.nvmrc`, and its dependency caches are separated by the Node.js pin.

Use `nvm install && nvm use`, or run `asdf install` from the repository root, before installing dependencies. When raising the security baseline, update both manifests and all three version-pin files together; the fixed patch version ensures that development, native builds, and publication use the same Node.js release.

Run `pnpm install` in the root directory to install the required dependencies for each package:

```sh
pnpm install
```

> This project uses pnpm workspaces. Make sure you have [pnpm](https://pnpm.io/) installed.

Run `pnpm test:dependencies` for the dependency security and compatibility regression checks, and `pnpm audit --audit-level=low` for the full audit. CI runs both without advisory exclusions or `--ignore-unfixable`.

The development-tool overrides in `package.json` replace vulnerable minimatch versions with 11.0.3 and alias deepmerge 4.3.1 to the API-compatible `@stackline/deepmerge` 1.1.0. The latter has no runtime dependencies and fixes [CVE-2026-93753](https://github.com/advisories/GHSA-gcqx-w48m-w2h4), for which upstream deepmerge has no released fix. The tests cover Jest's merge behavior and the React Native CLI's array replacement. Chromium Edge launcher 2.0.1 and the older Istanbul plugin's test-exclude 7.0.2 remove the legacy glob/minimatch path without replacing callable APIs in place.

`patches/typedoc@0.28.20.patch` adapts TypeDoc's removed `Minimatch.matchOne` call to the public partial-match API, preserving traversal of negated patterns. Keep this patch until an upstream TypeDoc release supports minimatch 11; when changing these pins, run the dependency checks, coverage, lint, typecheck, documentation generation, and native CI builds together. These overrides affect development tools, not the scanner's runtime dependencies.

`patches/@react-native__dev-middleware@0.84.1.patch` completes the debugger browser launch on the child process's `spawn` event, handles spawn errors, and releases the detached process reference. Upstream 0.84.1 listens for `data` on the child process with ignored output, leaving the launch pending even after the browser displays the page. The patch preserves Chrome-first discovery, Edge fallback, the system-browser fallback, and launch arguments. Revalidate it when updating React Native; the dependency checks cover successful startup, selection order, and failures.

The [example app](/example/) demonstrates usage of the library. You need to run it to test any changes you make.

It is configured to use the local version of the library, so any changes you make to the library's source code will be reflected in the example app. Changes to the library's JavaScript code will be reflected in the example app without a rebuild, but native code changes will require a rebuild of the example app.

If you want to use Android Studio or Xcode to edit the native code, you can open the `example/android` or `example/ios` directories respectively in those editors. To edit the Objective-C or Swift files, open `example/ios/SimpleScannerExample.xcworkspace` in Xcode and find the source files at `Pods > Development Pods > react-native-simple-scanner`.

To edit the Java or Kotlin files, open `example/android` in Android studio and find the source files at `react-native-simple-scanner` under `Android`.

You can use various commands from the root directory to work with the project.

To start the packager:

```sh
pnpm example start
```

To run the example app on Android:

```sh
pnpm example android
```

To run the example app on iOS:

```sh
pnpm example ios
```

To confirm that the app is running with the new architecture, you can check the Metro logs for a message like this:

```sh
Running "SimpleScannerExample" with {"fabric":true,"initialProps":{"concurrentRoot":true},"rootTag":1}
```

Note the `"fabric":true` and `"concurrentRoot":true` properties.

Make sure your code passes TypeScript:

```sh
pnpm typecheck
```

To check for linting errors, run the following:

```sh
pnpm lint
```

To fix formatting errors, run the following:

```sh
pnpm lint --fix
```

### Scripts

The `package.json` file contains various scripts for common tasks:

- `pnpm install`: setup project by installing dependencies.
- `pnpm typecheck`: type-check files with TypeScript.
- `pnpm lint`: lint files with [ESLint](https://eslint.org/).
- `pnpm example start`: start the Metro server for the example app.
- `pnpm example android`: run the example app on Android.
- `pnpm example ios`: run the example app on iOS.

### Sending a pull request

> **Working on your first pull request?** You can learn how from this _free_ series: [How to Contribute to an Open Source Project on GitHub](https://app.egghead.io/playlists/how-to-contribute-to-an-open-source-project-on-github).

When you're sending a pull request:

- Prefer small pull requests focused on one change.
- Verify that linters and tests are passing.
- Review the documentation to make sure it looks good.
- Follow the pull request template when opening a pull request.
- For pull requests that change the API or implementation, discuss with maintainers first by opening an issue.
