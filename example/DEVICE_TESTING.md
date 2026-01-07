# iOS実機テスト手順

このドキュメントでは、SimpleScannerExampleアプリをiOS実機でテストする手順を説明します。

## 前提条件

- Xcode 15.0以上がインストールされている
- Apple Developer アカウント（無料アカウントでも可）
- iOS 15.1以上のiPhoneまたはiPad
- USB接続でMacとデバイスが接続されている

## ステップ1: デバイスを接続して認識を確認

### 1.1 デバイスを接続

iPhoneまたはiPadをUSBケーブルでMacに接続します。

### 1.2 デバイスの認識を確認

ターミナルで以下のコマンドを実行：

```bash
xcrun xctrace list devices
```

接続されたデバイスが表示されることを確認してください。

## ステップ2: Xcodeでプロジェクトを開く

```bash
cd /Users/bon/dev/clevique/public/react-native-simple-scanner/example/ios
open SimpleScannerExample.xcworkspace
```

**注意**: `.xcodeproj` ではなく `.xcworkspace` を開いてください。

## ステップ3: 署名設定（Signing & Capabilities）

### 3.1 プロジェクト設定を開く

1. Xcodeの左側のプロジェクトナビゲーターで **SimpleScannerExample** プロジェクトをクリック
2. TARGETSから **SimpleScannerExample** を選択
3. **Signing & Capabilities** タブを開く

### 3.2 開発チームを設定

1. **Automatically manage signing** にチェックを入れる
2. **Team** ドロップダウンから自分のApple Developer アカウントを選択
   - アカウントが表示されない場合：
     - 「Add Account...」をクリック
     - Apple IDでサインイン
     - 無料アカウントの場合は「Personal Team」を選択

### 3.3 Bundle Identifierを変更

1. **Bundle Identifier** を一意の値に変更
   - 例: `com.yourname.SimpleScannerExample`
   - 自分の名前や組織名を使用してください

### 3.4 エラーが出た場合

「Failed to register bundle identifier」エラーが出た場合：

- Bundle Identifierをさらに一意の値に変更してください
- 例: `com.yourname.scanner.test.20260106`

## ステップ4: ビルドデバイスを選択

1. Xcodeのツールバー（上部）で、デバイス選択ドロップダウンをクリック
2. 接続した実機を選択（例: "iPhone 16 Pro (bon's iPhone)"）

**シミュレータではなく、実機を選択してください**（カメラが必要なため）

## ステップ5: ビルドして実行

### 5.1 ビルド実行

1. Xcodeのツールバーの **▶ (Run)** ボタンをクリック
   - または、`Cmd + R` を押す

### 5.2 デバイスでの信頼設定（初回のみ）

実機に初めてアプリをインストールする場合：

1. iPhoneに「開発元を信頼」の警告が表示される場合があります
2. iPhone/iPadで以下の手順を実行：
   - **設定** > **一般** > **VPNとデバイス管理**（または **プロファイルとデバイス管理**）
   - 自分のApple IDを選択
   - **信頼** をタップ

### 5.3 ビルド成功の確認

- Xcodeのコンソールに「Build Succeeded」と表示される
- iPhoneにアプリがインストールされ、自動的に起動する

## ステップ6: カメラ権限の許可

### 6.1 初回起動時

アプリが起動すると、カメラへのアクセス許可を求めるダイアログが表示されます：

**「SimpleScannerExample would like to access the camera」**

- **This app needs camera access to scan barcodes and QR codes.**

→ **「OK」または「許可」** をタップ

### 6.2 権限を拒否してしまった場合

誤って拒否した場合は、以下の手順で許可できます：

1. iPhoneの **設定** アプリを開く
2. 下にスクロールして **SimpleScannerExample** を選択
3. **カメラ** をタップ
4. **許可** を選択

## ステップ7: アプリの動作確認

### 7.1 バーコードスキャン機能のテスト

1. **カメラビューが表示される**ことを確認
2. QRコードやバーコードをカメラにかざす
   - テスト用のQRコードは Google で「QR code generator」などで検索して作成できます
3. スキャン成功時にアラートが表示されることを確認
   - アラートに **Type**（バーコードタイプ）と **Data**（スキャン結果）が表示される
4. **OK** をタップするとアラートが閉じる

### 7.2 フラッシュライト機能のテスト

1. 画面右上の **🔦 OFF** ボタンをタップ
2. ボタンが **🔦 ON** に変わることを確認
3. デバイスのフラッシュライトが点灯することを確認
4. もう一度タップして消灯することを確認

### 7.3 結果表示のテスト

1. バーコードをスキャン
2. 画面下部に結果ボックスが表示されることを確認
   - バーコードタイプ（例: QR, EAN13）
   - スキャンデータ

### 7.4 エラーハンドリングのテスト

カメラを手で覆って、エラーが適切に処理されることを確認（オプション）

## ステップ8: トラブルシューティング

### ビルドエラーが出る場合

#### エラー: "Code Signing Error"

**解決策**:

- Team が正しく設定されているか確認
- Bundle Identifier が一意であることを確認

#### エラー: "Device is busy"

**解決策**:

- Xcodeでデバイスの処理が完了するまで待つ
- デバイスを再接続する
- Xcodeを再起動する

### カメラが真っ黒な場合

**解決策**:

1. カメラ権限が許可されているか確認
2. 他のアプリでカメラが動作するか確認
3. アプリを完全に終了して再起動

### アプリがクラッシュする場合

**解決策**:

1. Xcodeのコンソールでエラーログを確認
2. アプリをクリーンビルド：
   ```
   Xcode > Product > Clean Build Folder (Shift + Cmd + K)
   ```
3. 再度ビルド実行

### Metro Bundlerエラー

**解決策**:

1. Metro Bundlerを再起動：
   ```bash
   cd /Users/bon/dev/clevique/public/react-native-simple-scanner/example
   npm start -- --reset-cache
   ```
2. 別のターミナルでビルド実行

## ステップ9: テスト項目チェックリスト

実機テストの際は、以下の項目を確認してください：

- [ ] アプリが正常にビルド・インストールできる
- [ ] カメラ権限のダイアログが表示される
- [ ] カメラプレビューが正常に表示される
- [ ] QRコードをスキャンできる
- [ ] EAN-13バーコードをスキャンできる
- [ ] EAN-8バーコードをスキャンできる
- [ ] CODE-128バーコードをスキャンできる
- [ ] スキャン結果のアラートが正しく表示される
- [ ] スキャン結果が画面下部に表示される
- [ ] フラッシュライトのON/OFF切り替えが動作する
- [ ] カメラ権限を拒否した場合に適切なエラーメッセージが表示される
- [ ] アプリがクラッシュしない

## 代替方法: コマンドラインからビルド

Xcodeを使用せずにコマンドラインからビルドする場合：

```bash
cd /Users/bon/dev/clevique/public/react-native-simple-scanner/example

# デバイスのUDIDを確認
xcrun xctrace list devices | grep -v Simulator

# ビルド・インストール（UDIDを実際の値に置き換える）
npx react-native run-ios --device "iPhone name" --udid="DEVICE_UDID"
```

## 参考情報

- **New Architecture**: このプロジェクトはReact Native New Architectureを使用しています
- **最小iOS バージョン**: iOS 15.1
- **サポートバーコードタイプ**: QR, EAN-13, EAN-8, CODE-128, CODE-39, UPC-E

## 問題が解決しない場合

上記の手順でうまくいかない場合は、以下の情報を添えて報告してください：

1. Xcodeのバージョン
2. iOSデバイスのモデルとOSバージョン
3. エラーメッセージの全文
4. Xcodeコンソールのログ
