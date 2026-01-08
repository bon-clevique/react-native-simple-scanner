# npm パッケージ公開手順書

## 📋 事前確認事項

### 現在の状態

- **パッケージ名**: `react-native-simple-scanner`
- **現在のバージョン**: `0.1.0`
- **リポジトリ**: `https://github.com/bon-clevique/react-native-simple-scanner.git`
- **iOS対応**: ✅ 完了（iOS 14+）
- **Android対応**: ⚠️ 未対応（Roadmap Phase 2に明記済み）

### 公開前の注意事項

- Android未対応は README.md の Features セクションに明記済み
- "iOS 14+ (Android coming in Phase 2)" と記載されており、ユーザーに明確に伝わる状態
- 実機確認は iOS のみ完了しているが、README にその旨を記載しているため公開可能

---

## ✅ 公開前チェックリスト

### 1. パッケージ設定の確認

- [x] `package.json` の `name` が正しいか
  - 現在: `react-native-simple-scanner` ✅
- [x] `version` が適切か（セマンティックバージョニング）
  - 現在: `0.1.0` ✅（初回リリースに適切）
- [x] `description` が明確か
  - ✅ "A lightweight and simple barcode/QR code scanner for React Native"
- [x] `repository.url` が新しいリポジトリを指しているか
  - ✅ `https://github.com/bon-clevique/react-native-simple-scanner.git`
- [x] `bugs.url` が正しいか
  - ✅ `https://github.com/bon-clevique/react-native-simple-scanner/issues`
- [x] `homepage` が正しいか
  - ✅ `https://github.com/bon-clevique/react-native-simple-scanner#readme`
- [x] `author` 情報が正しいか
  - ✅ `Clevique <bon@clevique.app>`
- [x] `license` が設定されているか
  - ✅ `MIT`
- [x] `keywords` が適切か
  - ✅ react-native, ios, android, barcode, qr, qrcode, scanner
- [x] `files` フィールドで公開対象ファイルが適切に設定されているか
  - ✅ src, lib, android, ios, cpp, podspec など必要なファイルのみ

### 2. ドキュメントの確認

- [x] `README.md` が充実しているか
  - ✅ インストール手順、使用例、API リファレンス、トラブルシューティング完備
- [x] Android 未対応が明記されているか
  - ✅ Features セクションに "iOS 14+ (Android coming in Phase 2)" と明記
  - ✅ Roadmap に "Android support (Phase 2)" を記載
- [x] `LICENSE` ファイルが存在するか
  - 要確認（次のステップで確認）
- [ ] `CONTRIBUTING.md` が存在するか
  - README に記載があるが、ファイルの存在確認が必要
- [ ] `CHANGELOG.md` が存在するか（推奨）
  - 初回リリース時に作成推奨

### 3. コード品質の確認

```bash
# TypeScript 型チェック
pnpm typecheck

# ESLint
pnpm lint

# テスト実行
pnpm test

# ビルド確認
pnpm prepare
```

### 4. npm アカウントの準備

```bash
# npm にログイン（初回のみ）
npm login

# ログイン状態確認
npm whoami
```

### 5. 公開対象ファイルの確認

```bash
# 公開されるファイル一覧を確認（実際には公開しない）
npm pack --dry-run

# または
pnpm pack --dry-run
```

---

## 🚀 公開手順

### ステップ 1: 最終確認

1. **ブランチを master にマージ**

   ```bash
   # 現在のブランチを確認
   git branch

   # master ブランチに切り替え
   git checkout master

   # 最新状態を取得
   git pull origin master

   # 必要に応じてフィーチャーブランチをマージ
   git merge fix/uiscene-safeareaview-warnings
   ```

2. **全てのテストを実行**

   ```bash
   pnpm typecheck
   pnpm lint
   pnpm test
   ```

3. **ビルドを実行**
   ```bash
   pnpm prepare
   ```

### ステップ 2: バージョンの確認と更新（必要に応じて）

初回リリース `0.1.0` のまま公開する場合はスキップ可能。

```bash
# バージョンを更新する場合（例: 0.1.0 → 0.1.1）
npm version patch -m "chore: bump version to %s"

# または minor/major
# npm version minor -m "chore: bump version to %s"
# npm version major -m "chore: bump version to %s"
```

### ステップ 3: CHANGELOG の作成（推奨）

`CHANGELOG.md` を作成または更新:

```markdown
# Changelog

## [0.1.0] - 2026-01-XX

### Added

- Initial release
- iOS barcode/QR code scanner support (iOS 14+)
- Support for QR, EAN-13, EAN-8, CODE-128
- Flash control
- TypeScript support
- Fabric View architecture

### Known Limitations

- Android support not yet implemented (planned for Phase 2)
```

### ステップ 4: Git へのコミット・プッシュ

```bash
# 変更をステージング
git add .

# コミット
git commit -m "chore: prepare for initial npm release v0.1.0

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# プッシュ
git push origin master
```

### ステップ 5: npm へ公開

```bash
# npm にログイン（未ログインの場合）
npm login

# 公開実行
npm publish --access public
```

**注意**: 初回公開時は `--access public` が必要（スコープ付きパッケージの場合はデフォルトで private）。ただし、`react-native-simple-scanner` はスコープなしなので `--access public` は不要ですが、明示的に指定しても問題ありません。

```bash
# または pnpm を使用
pnpm publish --access public
```

### ステップ 6: Git タグの作成（推奨）

```bash
# バージョンタグを作成
git tag v0.1.0

# タグをプッシュ
git push origin v0.1.0
```

### ステップ 7: GitHub Release の作成（推奨）

```bash
# gh CLI を使用
gh release create v0.1.0 \
  --title "v0.1.0 - Initial Release" \
  --notes "## Initial Release

- iOS barcode/QR code scanner support (iOS 14+)
- Support for QR, EAN-13, EAN-8, CODE-128 formats
- Flash control
- TypeScript support
- Fabric View architecture

**Note**: Android support is planned for Phase 2.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

または GitHub の Web UI から手動で作成。

---

## 📦 公開後の確認

### 1. npm での確認

```bash
# パッケージが公開されたか確認
npm view react-native-simple-scanner

# 最新バージョンの確認
npm view react-native-simple-scanner version

# パッケージの詳細情報
npm info react-native-simple-scanner
```

### 2. インストールテスト

別のディレクトリで実際にインストールしてテスト:

```bash
# 新しいディレクトリでテスト
mkdir /tmp/test-install
cd /tmp/test-install
npm init -y
npm install react-native-simple-scanner

# インストールされたか確認
ls node_modules/react-native-simple-scanner
```

### 3. npm パッケージページの確認

ブラウザで確認:

- https://www.npmjs.com/package/react-native-simple-scanner

以下の情報が正しく表示されているか確認:

- README が表示されているか
- バージョン情報
- リポジトリリンク
- Keywords
- License

---

## 🔄 更新版の公開手順（将来用）

### Android 対応版（Phase 2）の公開例

1. **Android 実装完了後**
2. **テスト・品質チェック完了**
3. **README 更新**（"iOS 14+ (Android coming in Phase 2)" → "iOS 14+ and Android 8.0+"）
4. **バージョンアップ**
   ```bash
   # Minor バージョンアップ（機能追加）
   npm version minor -m "feat: add Android support"
   # 0.1.0 → 0.2.0
   ```
5. **CHANGELOG 更新**
6. **Git コミット・プッシュ**
7. **npm publish**
8. **Git タグ・GitHub Release 作成**

---

## 🚨 トラブルシューティング

### npm publish が失敗する場合

#### エラー: "You do not have permission to publish"

```bash
# ログイン状態を確認
npm whoami

# 再ログイン
npm logout
npm login
```

#### エラー: "Package name already exists"

- パッケージ名が既に使用されている
- `package.json` の `name` を変更する必要がある

#### エラー: "Version already published"

```bash
# バージョンを上げる
npm version patch
```

#### エラー: "Missing required files"

```bash
# ビルドを実行
pnpm prepare

# lib/ ディレクトリが生成されていることを確認
ls -la lib/
```

### GitHub のリンクが古い場合

1. **package.json を更新**

   ```json
   {
     "repository": {
       "type": "git",
       "url": "git+https://github.com/bon-clevique/react-native-simple-scanner.git"
     },
     "bugs": {
       "url": "https://github.com/bon-clevique/react-native-simple-scanner/issues"
     },
     "homepage": "https://github.com/bon-clevique/react-native-simple-scanner#readme"
   }
   ```

2. **コミット・プッシュ**
3. **バージョンアップして再公開**

---

## 📝 チェックリスト（実行前の最終確認）

公開前に以下を全て確認してください:

- [ ] `pnpm typecheck` が成功する
- [ ] `pnpm lint` がエラー・警告なし
- [ ] `pnpm test` が全て通過する
- [ ] `pnpm prepare` でビルドが成功する
- [ ] `lib/` ディレクトリにビルド成果物が生成されている
- [ ] README.md に Android 未対応が明記されている
- [ ] package.json のリポジトリ URL が正しい
- [ ] LICENSE ファイルが存在する
- [ ] npm にログインしている (`npm whoami`)
- [ ] Git の変更が全てコミット・プッシュされている
- [ ] master ブランチで作業している

---

## 📚 参考リンク

- [npm 公式ドキュメント - Publishing](https://docs.npmjs.com/cli/v10/commands/npm-publish)
- [Semantic Versioning 2.0.0](https://semver.org/)
- [React Native Library 公開ガイド](https://reactnative.dev/docs/native-modules-intro)
- [npmjs.com パッケージページ](https://www.npmjs.com/)

---

**最終更新**: 2026-01-07
