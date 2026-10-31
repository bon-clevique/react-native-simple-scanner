# Releasing to npm

Releases use npm Trusted Publishing (OIDC), not `NPM_TOKEN`. A push to `master`
runs the reusable CI workflow for that exact commit. The release job starts only
after **all** jobs in `ci.yml` succeed, then builds the package and runs the lockfile-pinned
semantic-release toolchain. Pull requests and merge groups run CI without publishing.
Release runs are serialized and an active publication is not cancelled by a newer push.

## One-time npm configuration

This is a separate, security-sensitive maintainer action. Obtain approval before
saving it. Sign in to npm as a maintainer of `react-native-simple-scanner`, open
the package **Settings**, and inspect the existing **Trusted Publisher** entries.
If the matching entry already exists, verify it rather than creating a duplicate.
If an entry differs, review the existing trust before changing it.

| Field                | Value                                                       |
| -------------------- | ----------------------------------------------------------- |
| Provider             | GitHub Actions                                              |
| Organization or user | `bon-clevique`                                              |
| Repository           | `react-native-simple-scanner`                               |
| Workflow filename    | `release.yml` (filename only)                               |
| Environment name     | Leave empty; the workflow does not use a GitHub environment |
| Allow npm publish    | Enabled; semantic-release publishes directly                |
| Allow npm dist-tag   | Leave disabled; only `master`/`latest` is configured        |

This grants this repository's `release.yml` identity the ability to publish this
package, without an expiring npm secret. There is no environment approval gate.
The workflow itself restricts publication to `master` after successful CI; npm's
publisher form does not add a branch restriction. Changes to this workflow must
therefore be reviewed as changes to publishing authority. Do not add a broader
publisher or relax 2FA settings to make a run pass.

The workflow uses GitHub-hosted Ubuntu, `id-token: write` only in the release job,
and Node from `.nvmrc` (24.22.1). semantic-release 25.0.9 and its plugins are
resolved through `pnpm-lock.yaml`, including `@semantic-release/npm` 13.2.0 and
its npm CLI 11.21.1. These meet npm's OIDC and the plugins' Node requirements.
Do not add `registry-url` to setup-node or write an auth token to `.npmrc`.

## Verification and first publication

1. Keep the migration PR in draft until the maintainer approves npm trust setup
   and the publication boundary. Registering trust does not itself publish.
2. Review the commits since the last release and the proposed tarball contents.
   Merging into `master` starts Release and may publish a new version immediately
   after CI succeeds. A local dry run or `npm whoami` does **not** prove that npm
   will authorize an OIDC publication.
3. After separate approval to publish, merge the reviewed PR or make the approved
   release commit. Do not rerun an older failed Release: it contains the old
   workflow and may target a different commit.
4. Check the Release run's commit and version, its GitHub release/tag, and npm's
   published version and `latest` dist-tag. Download the published tarball, check
   `dist.integrity` and expected JS/types/native files, and verify the npm
   provenance links to the expected repository, workflow, and commit. A passing
   PR CI run only verifies code and packaging, not registry authorization.
5. Only after that successful OIDC publication, separately review removal of the
   old GitHub `NPM_TOKEN` secret and revocation of any remaining npm token, then
   retire `.github/workflows/token-reminder.yml` and its obsolete reminder issue.
   Do not copy token values into logs, issues, or chat. This migration leaves
   existing secrets and reminders untouched.

## Recovery

Before a publication, revert the migration through a reviewed PR if necessary;
the old token route will still require working credentials. After a publication,
a Git revert cannot undo the released npm version. Stop further releases,
investigate the failed step, and obtain approval for a corrective release. Do not
disable branch protections, introduce a personal access token, or rerun a release
as a workaround for an authentication or permissions failure.

## References

- [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/)
- [npm access-token policy](https://docs.npmjs.com/about-access-tokens/)
- [semantic-release GitHub Actions recipe](https://semantic-release.org/recipes/ci-configurations/github-actions/)
- [npm plugin authentication](https://github.com/semantic-release/npm#npm-registry-authentication)
