# Android エミュレータテスト手順

このドキュメントでは、SimpleScannerExample アプリを Android エミュレータでテストする手順を説明します。

## ⚠️ 重要な制限事項

**Android エミュレータでは、カメラ機能を使用したバーコードスキャン機能の完全なテストはできません。**

### エミュレータで確認できること

- ✅ アプリの起動・UI表示
- ✅ カメラプレビューの表示（仮想カメラ）
- ✅ 権限ダイアログの表示
- ✅ ボタンの配置・動作
- ✅ エラーハンドリングの基本動作

### エミュレータで確認できないこと

- ❌ 実際のバーコード/QRコードのスキャン
- ❌ カメラフォーカスの動作
- ❌ フラッシュライトの動作
- ❌ ML Kit による実際のバーコード認識

**本番環境での動作確認には、必ず Android 実機でのテストが必要です。**

---

## 前提条件

- Android Studio がインストールされている
- Android SDK と Emulator が設定済み
- Node.js と npm/yarn がインストール済み
- React Native 開発環境が構築済み

---

## ステップ1: Android エミュレータの作成・起動

### 1.1 Android Studio で AVD Manager を開く

```bash
# Android Studio を起動
open -a "Android Studio"
```

または、コマンドラインから：

```bash
# AVD Manager をCLIで起動
cd ~/Library/Android/sdk/tools/bin
./avdmanager list avd
```

### 1.2 エミュレータを作成（初回のみ）

Android Studio で：

1. **Tools** > **Device Manager** を選択
2. **Create Device** をクリック
3. デバイスを選択（推奨: **Pixel 6** 以上）
4. システムイメージを選択：
   - **API Level 33 (Android 13)** 以上を推奨
   - **x86_64** または **arm64-v8a** アーキテクチャ
   - **Google APIs** 版を選択（カメラサポートあり）
5. **Finish** をクリック

### 1.3 エミュレータを起動

Android Studio から：

- Device Manager でエミュレータを選択
- **▶ (Start)** ボタンをクリック

または、コマンドラインから：

```bash
# エミュレータ一覧を確認
emulator -list-avds

# エミュレータを起動（AVD名は上記コマンドで確認）
emulator -avd Pixel_6_API_33 &
```

### 1.4 エミュレータの起動確認

```bash
# 接続されたデバイスを確認
adb devices
```

以下のように表示されればOK：

```
List of devices attached
emulator-5554	device
```

---

## ステップ2: プロジェクトのセットアップ

### 2.1 依存関係のインストール

```bash
cd /Users/bon/dev/clevique/public/react-native-simple-scanner/example

# 依存関係をインストール
npm install

# Android ネイティブ依存関係をクリーン（初回または問題発生時）
cd android
./gradlew clean
cd ..
```

### 2.2 Metro Bundler の起動

別のターミナルウィンドウで：

```bash
cd /Users/bon/dev/clevique/public/react-native-simple-scanner/example

# Metro Bundler を起動
npm start
```

Metro Bundler が起動し、以下のように表示されます：

```
 BUNDLE  ./index.js

 WARN  Tips: Use CMD+D or Shake for Dev Menu
```

---

## ステップ3: アプリのビルド・インストール

### 3.1 エミュレータでアプリを実行

元のターミナルで（Metro Bundler とは別のウィンドウ）：

```bash
cd /Users/bon/dev/clevique/public/react-native-simple-scanner/example

# Android アプリをビルド・インストール
npx react-native run-android
```

### 3.2 ビルド成功の確認

以下のようなメッセージが表示されればビルド成功：

```
info Connecting to the development server...
info Starting the app on "emulator-5554"...
Starting: Intent { cmp=com.simplescanner/.MainActivity }
```

エミュレータにアプリが自動的にインストールされ、起動します。

### 3.3 ビルドエラーが出た場合

#### エラー: "SDK location not found"

**解決策**:

```bash
# local.properties を作成
cd /Users/bon/dev/clevique/public/react-native-simple-scanner/example/android
echo "sdk.dir=$HOME/Library/Android/sdk" > local.properties
```

#### エラー: "Execution failed for task ':app:installDebug'"

**解決策**:

```bash
# エミュレータが起動しているか確認
adb devices

# エミュレータを再起動
adb reboot

# クリーンビルド
cd /Users/bon/dev/clevique/public/react-native-simple-scanner/example/android
./gradlew clean
cd ..
npx react-native run-android
```

---

## ステップ4: カメラ権限の許可

### 4.1 初回起動時の権限ダイアログ

アプリが起動すると、カメラへのアクセス許可を求めるダイアログが表示されます：

**"Allow SimpleScannerExample to take pictures and record video?"**

→ **「Allow」または「許可」** をタップ

### 4.2 権限を拒否してしまった場合

誤って拒否した場合は、以下の手順で許可できます：

1. エミュレータの **Settings** アプリを開く
2. **Apps** > **SimpleScannerExample** を選択
3. **Permissions** をタップ
4. **Camera** をタップ
5. **Allow** を選択

---

## ステップ5: エミュレータでの動作確認

### 5.1 UI 表示の確認

以下が正常に表示されることを確認：

- ✅ カメラプレビュー領域（エミュレータの仮想カメラ映像）
- ✅ 画面右上のフラッシュライトボタン（🔦 OFF）
- ✅ 画面下部の結果表示エリア

### 5.2 カメラプレビューの動作

エミュレータのカメラは以下のように動作します：

- デフォルトでは**仮想シーン**が表示される（3D空間や静止画）
- カメラエミュレーションモードの変更が可能（後述）

### 5.3 エミュレータのカメラ設定を変更（オプション）

エミュレータの **Extended controls** を開く：

1. エミュレータウィンドウの右側のツールバーで **...（More）** をクリック
2. **Camera** タブを選択
3. **Virtual scene** モードまたは **Webcam** モードを選択

**Webcam モード（上級者向け）**:

- PCのWebカメラを使用
- Webカメラに紙のQRコードをかざすことで、限定的なテストが可能
- ただし、認識精度は実機と比べて大幅に低下

### 5.4 フラッシュライトボタンの確認

1. 画面右上の **🔦 OFF** ボタンをタップ
2. ボタンが **🔦 ON** に変わることを確認
3. もう一度タップして **🔦 OFF** に戻ることを確認

**注意**: エミュレータにはフラッシュライトハードウェアがないため、実際の点灯は確認できません。ボタンの状態変更のみ確認できます。

### 5.5 権限エラーのテスト

カメラ権限を拒否した状態で、適切なエラーメッセージが表示されることを確認：

1. アプリをアンインストール
   ```bash
   adb uninstall com.simplescanner
   ```
2. 再度インストール
   ```bash
   npx react-native run-android
   ```
3. 権限ダイアログで **「Deny」または「拒否」** を選択
4. エラーメッセージが表示されることを確認

---

## ステップ6: Webカメラを使った簡易スキャンテスト（上級者向け）

### 6.1 前提条件

- PCにWebカメラが接続されている
- 紙に印刷されたQRコードまたはバーコード

### 6.2 エミュレータでWebカメラを有効化

1. エミュレータの **Extended controls（...）** を開く
2. **Camera** タブを選択
3. **Back camera** を **Webcam0** に変更
4. **Front camera** を **Emulated** のままにする

### 6.3 QRコードをスキャンしてみる

1. 紙に印刷されたQRコードを用意
2. WebカメラにQRコードをかざす
3. スキャンが成功すると、アラートが表示される（可能性あり）

**注意事項**:

- Webカメラの画質によっては認識されない場合があります
- 照明条件が重要です（明るい場所で試す）
- エミュレータのML Kitが正常に動作しない場合があります
- **このテストは参考程度であり、実機テストの代替にはなりません**

---

## ステップ7: ログの確認

### 7.1 React Native ログ

Metro Bundler のターミナルで JavaScript ログを確認：

```
LOG  SimpleScanner mounted
LOG  Barcode scanned: {"type": "qr", "data": "https://example.com"}
```

### 7.2 Android ネイティブログ

別のターミナルで：

```bash
# すべてのログを表示
adb logcat

# SimpleScannerのログのみフィルタ
adb logcat | grep SimpleScanner

# エラーログのみ表示
adb logcat *:E
```

### 7.3 カメラ関連のログ

```bash
adb logcat | grep -E "Camera|BarcodeScanner"
```

以下のようなログが表示されるはずです：

```
BarcodeScanner: Camera initialized successfully
BarcodeScanner: Starting barcode scanning
```

---

## ステップ8: トラブルシューティング

### カメラが真っ黒な場合

**解決策**:

1. カメラ権限が許可されているか確認
2. エミュレータのカメラ設定を確認（Extended controls > Camera）
3. アプリを完全に終了して再起動
4. エミュレータを再起動

### アプリがクラッシュする場合

**解決策**:

```bash
# ログを確認
adb logcat *:E

# アプリをアンインストールして再インストール
adb uninstall com.simplescanner
npx react-native run-android

# キャッシュをクリア
cd android
./gradlew clean
cd ..
npm start -- --reset-cache
```

### Metro Bundler エラー

**解決策**:

```bash
# キャッシュをクリアして再起動
npm start -- --reset-cache

# ポートが使用中の場合
lsof -ti:8081 | xargs kill -9
npm start
```

### ビルドエラー: "Duplicate class found"

**解決策**:

```bash
# Gradle キャッシュをクリア
cd android
./gradlew clean
./gradlew cleanBuildCache
cd ..
rm -rf node_modules
npm install
npx react-native run-android
```

---

## ステップ9: テスト項目チェックリスト

エミュレータでのテストでは、以下の項目を確認してください：

### 基本動作

- [ ] アプリが正常にビルド・インストールできる
- [ ] アプリが起動する（クラッシュしない）
- [ ] カメラ権限のダイアログが表示される
- [ ] カメラ権限を許可できる

### UI表示

- [ ] カメラプレビュー領域が表示される
- [ ] フラッシュライトボタンが表示される
- [ ] 結果表示エリアが表示される
- [ ] レイアウトが正しく表示される（オーバーラップなし）

### 機能動作

- [ ] フラッシュライトボタンをタップして ON/OFF 切り替えができる
- [ ] カメラ権限を拒否した場合にエラーメッセージが表示される
- [ ] アプリがバックグラウンドに移動しても復帰できる

### ログ確認

- [ ] Metro Bundler でJavaScriptログが正常に表示される
- [ ] adb logcat でネイティブログが確認できる
- [ ] エラーログが出ていない

### 制限事項の理解（確認不可）

- [ ] 実際のバーコードスキャンは**確認できない**ことを理解している
- [ ] 実機テストが必須であることを理解している

---

## エミュレータの制限まとめ

| 項目               | エミュレータ    | 実機                |
| ------------------ | --------------- | ------------------- |
| アプリ起動         | ✅ 可能         | ✅ 可能             |
| UI表示             | ✅ 可能         | ✅ 可能             |
| カメラプレビュー   | ✅ 可能（仮想） | ✅ 可能（実カメラ） |
| 権限ダイアログ     | ✅ 可能         | ✅ 可能             |
| QRコードスキャン   | ❌ 困難         | ✅ 可能             |
| バーコードスキャン | ❌ 困難         | ✅ 可能             |
| フラッシュライト   | ❌ 不可         | ✅ 可能             |
| ML Kit 認識精度    | ⚠️ 低い         | ✅ 高い             |

---

## 実機テストへの移行

エミュレータでの基本動作確認が完了したら、以下の方法で実機テストに移行してください：

### Android 実機の準備

1. **USB デバッグを有効化**
   - Android デバイスの **設定** > **デバイス情報** > **ビルド番号** を7回タップ
   - **設定** > **開発者向けオプション** > **USB デバッグ** を有効化

2. **デバイスを接続**

   ```bash
   # USB接続後、デバイスが認識されているか確認
   adb devices
   ```

3. **実機でアプリを実行**

   ```bash
   # エミュレータを停止
   adb -e emu kill

   # 実機にインストール
   npx react-native run-android --deviceId=<DEVICE_ID>
   ```

### 実機で必ず確認すべき項目

- [ ] QRコードの実際のスキャン動作
- [ ] EAN-13 バーコードのスキャン
- [ ] EAN-8 バーコードのスキャン
- [ ] CODE-128 バーコードのスキャン
- [ ] フラッシュライトの点灯・消灯
- [ ] カメラフォーカスの動作
- [ ] 様々な照明条件でのスキャン精度

---

## 参考情報

- **New Architecture**: このプロジェクトは React Native New Architecture を使用しています
- **最小 Android バージョン**: Android API Level 21 (Android 5.0)
- **サポートバーコードタイプ**: QR, EAN-13, EAN-8, CODE-128
- **使用ライブラリ**: Google ML Kit Barcode Scanning, CameraX

---

## デバッグコマンド一覧

```bash
# エミュレータ一覧
emulator -list-avds

# エミュレータ起動
emulator -avd <AVD_NAME> &

# 接続デバイス確認
adb devices

# アプリアンインストール
adb uninstall com.simplescanner

# ログ確認
adb logcat
adb logcat | grep BarcodeScanner

# キャッシュクリア
npm start -- --reset-cache

# Gradle クリーンビルド
cd android && ./gradlew clean && cd ..

# Metro Bundler 再起動
lsof -ti:8081 | xargs kill -9
npm start
```

---

## 問題が解決しない場合

上記の手順でうまくいかない場合は、以下の情報を添えて報告してください：

1. Android Studio のバージョン
2. エミュレータの API Level
3. エラーメッセージの全文
4. `adb logcat` のログ
5. Metro Bundler のログ

---

**注意**: このドキュメントはエミュレータでの限定的なテスト手順です。本番リリース前には**必ず Android 実機でのテストを実施してください。**
