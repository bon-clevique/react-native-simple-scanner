# Xcode ビルドエラー修正手順

## 現在の状況

- ✅ Metro Bundler は起動済み (`http://localhost:8081`)
- ✅ Info.plist の修正完了
- ✅ package.json に workspaces 追加完了
- ✅ Bridging Header ファイル作成完了

## Xcode での設定手順

### ステップ1: Bridging Header を設定

1. **Xcodeを開く**

   ```bash
   open /Users/bon/dev/clevique/public/react-native-simple-scanner/example/ios/SimpleScannerExample.xcworkspace
   ```

2. **プロジェクト設定を開く**
   - 左側のプロジェクトナビゲーターで `SimpleScannerExample` プロジェクトをクリック
   - TARGETS > `SimpleScannerExample` を選択
   - `Build Settings` タブを開く

3. **Bridging Header を設定**
   - 検索バーに `Objective-C Bridging Header` と入力
   - または `bridging` で検索
   - `Objective-C Bridging Header` の値を以下に設定：
     ```
     SimpleScannerExample/SimpleScannerExample-Bridging-Header.h
     ```

### ステップ2: Swift Compiler 設定を確認

同じ `Build Settings` タブで：

1. **Install Objective-C Compatibility Header** を `Yes` に設定
   - 検索バーに `Install Objective-C Compatibility Header` と入力
   - 値を `Yes` に設定

2. **Defines Module** を `Yes` に設定
   - 検索バーに `Defines Module` と入力
   - 値を `Yes` に設定

### ステップ3: Clean Build

1. **クリーンビルド**

   ```
   Product > Clean Build Folder (Shift + Cmd + K)
   ```

2. **派生データを削除**（オプション、問題が続く場合）
   ```
   Xcode > Settings... > Locations タブ
   Derived Data の右にある矢印アイコンをクリック
   Finder で SimpleScannerExample フォルダを削除
   ```

### ステップ4: ビルド実行

1. **デバイスまたはシミュレータを選択**
   - 上部ツールバーのデバイス選択ドロップダウンから選択

2. **ビルド実行**
   ```
   Cmd + R (または ▶ Run ボタン)
   ```

---

## トラブルシューティング

### エラー: "Cycle in dependencies between targets"

**解決策**:

```bash
cd /Users/bon/dev/clevique/public/react-native-simple-scanner/example/ios
pod deintegrate
pod install
```

### エラー: "Module 'React' not found"

**解決策**:

1. `Build Settings` > `Framework Search Paths` に以下を追加：
   ```
   $(inherited)
   "${PODS_CONFIGURATION_BUILD_DIR}/React-Core"
   "${PODS_CONFIGURATION_BUILD_DIR}/React-RCTFabric"
   ```

### エラー: "Sandbox: rsync.samba(...) deny(1) file-write-create"

**解決策**:

1. Xcode > Settings > Locations
2. Derived Data の場所を確認
3. ターミナルで：
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData/*
   ```
4. Xcodeを再起動

### Metro Bundlerが接続できない

**確認**:

```bash
# Metro bundlerが起動しているか確認
ps aux | grep metro

# 起動していない場合
cd /Users/bon/dev/clevique/public/react-native-simple-scanner/example
npm start
```

### ビルドは成功するがアプリが起動しない

**確認事項**:

1. Metro bundler が起動していること
2. カメラ権限がInfo.plistに設定されていること
3. Bundle Identifierが一意であること

---

## コマンドラインから確認

### SimpleScanner モジュール単体ビルド

```bash
cd /Users/bon/dev/clevique/public/react-native-simple-scanner/example/ios
xcodebuild \
  -workspace SimpleScannerExample.xcworkspace \
  -scheme SimpleScanner \
  -configuration Debug \
  -destination 'generic/platform=iOS' \
  build
```

### アプリ全体をビルド

```bash
cd /Users/bon/dev/clevique/public/react-native-simple-scanner/example/ios
xcodebuild \
  -workspace SimpleScannerExample.xcworkspace \
  -scheme SimpleScannerExample \
  -configuration Debug \
  -destination 'generic/platform=iOS Simulator' \
  build
```

---

## ビルド設定の確認コマンド

### Bridging Header設定を確認

```bash
cd /Users/bon/dev/clevique/public/react-native-simple-scanner/example/ios
grep -A 5 "SWIFT_OBJC_BRIDGING_HEADER" SimpleScannerExample.xcodeproj/project.pbxproj
```

### 現在のビルド設定を出力

```bash
xcodebuild \
  -workspace SimpleScannerExample.xcworkspace \
  -scheme SimpleScannerExample \
  -showBuildSettings | grep -i "bridging\|swift"
```

---

## 最終確認

ビルドが成功したら、以下を確認：

1. ✅ アプリが起動する
2. ✅ カメラ権限のダイアログが表示される
3. ✅ カメラプレビューが表示される
4. ✅ QRコード/バーコードをスキャンできる

---

## まだエラーが出る場合

エラーメッセージ全文とともに以下の情報を提供してください：

1. Xcodeのバージョン: `xcodebuild -version`
2. エラーの種類（コンパイルエラー / リンクエラー / ランタイムエラー）
3. エラーが出ているファイル名と行番号
4. Xcodeコンソールの完全なエラーログ
