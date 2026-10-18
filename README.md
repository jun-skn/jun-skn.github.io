# 個人用Obsidian同期の案内サイト

GSyncでGoogle DriveとiPhoneのObsidianを同期する個人用環境のGitHub Pagesサイトです。ホームとプライバシーポリシーはHTML/CSS、認証中継ページはGSync公式由来の小さなJavaScriptで構成し、ビルドや追加パッケージは不要です。

## ページと設定の対応

| 用途 | URL | 設定先 |
| --- | --- | --- |
| ホーム | https://jun-skn.github.io/ | Google Auth Platform → Branding → アプリケーションのホームページ |
| プライバシーポリシー | https://jun-skn.github.io/privacy.html | Branding → アプリケーションのプライバシーポリシー |
| 新しい認証中継ページ | https://jun-skn.github.io/gsync/callback.html | Clients → 使用中のWeb applicationクライアント → Authorized redirect URIs、および端末のGSync → Sign-in redirect page |
| 移行中も残す既定の認証中継ページ | https://dg0988.github.io/ObsidianGSync/callback.html | 既存のAuthorized redirect URIsを削除しない。未移行端末の設定も維持 |

ホーム・ポリシーと認証中継先は別の設定です。Google側とGSync側のリダイレクトURIは、パス・大文字小文字・末尾のスラッシュを含めて完全一致させます。新URLに末尾の `/` やクエリを追加しません。

公開元は `main / (root)` です。ホームとポリシーはPR #1のマージ後に公開済みで、中継ページは今回のPRをマージし、Pagesの配信を確認してから利用します。PR作成だけでは新ページは公開されません。

## 認証中継の仕組みと実装元

Google → `gsync/callback.html?code=…&state=…` → `obsidian://gsync-auth?vault=…&code=…&state=…` → 端末上のGSync → Googleのトークンエンドポイント、という順に処理します。Googleがエラーを返した場合は `error` をGSyncへ渡します。

- stateの `~` より後ろに入っているbase64url形式の保管庫名を復元し、日本語名も端末のObsidianへ渡します。state自体は変更しません。
- 自動でObsidianに戻す処理と、ブラウザが自動起動を許可しない場合の「Obsidianを開く」リンクを備えます。
- パラメータがない通常の閲覧ではGSync設定から認証を始める案内を表示します。
- Googleから受け取ったcode/state/errorをブラウザ内で扱います。認証中継時にクエリをアドレスバーと現在の履歴項目から除きますが、最初のHTTPSリクエストはクエリを含めてGitHubへ届きます。
- 外部スクリプト・画像・フォント・解析、トークン交換、CookieやWeb Storageへの保存はありません。`no-referrer` は公式のまま維持しています。
- state照合、15分の有効期限、PKCE verifierによるトークン交換は公式GSyncが端末上で行います。中継ページは認証結果を運び、認証成功の判定はGSyncが行います。

実装元は [dg0988/ObsidianGSync の docs/callback.html](https://github.com/dg0988/ObsidianGSync/blob/568016625ba0b77ab06e0718a48bb5eb39275f37/docs/callback.html)（確認時のmain: `568016625ba0b77ab06e0718a48bb5eb39275f37`、manifestおよび最新リリース: `1.0.4`）です。認証パラメータの受け渡し処理を保ち、日本語表示・サイト内リンク・JavaScript無効時の案内・検索除外を加えています。MITライセンスの著作権表示と全文はHTMLコメント内に保持しています。

## 移行手順

Google Cloudの管理画面と端末のObsidianで本人の操作が必要です。使用中のOAuthプロジェクト、登録済みURI、インストール済みGSyncのバージョンや端末設定は未確認です。今回のPRはそれらを変更しません。認証情報や実際の認証URLをPR・Issue・スクリーンショットへ貼る必要はありません。

### 1. 公開を確認する

1. PRの差分を確認し、承認後に `main` へマージします。
2. [Settings → Pages](https://github.com/jun-skn/jun-skn.github.io/settings/pages) と [Actions](https://github.com/jun-skn/jun-skn.github.io/actions) で配信完了を確認します。公開元は **Deploy from a branch / main / (root)** のままです。
3. 新URLをパラメータなしで開き、「ObsidianのGSync設定からGoogle認証を開始してください。」と表示されること、ホームとポリシーへのリンクが開くことを確認します。この閲覧だけでは認証は完了しません。

### 2. 同じOAuthクライアントに新URLを追加する

1. [Google Auth Platform → Clients](https://console.cloud.google.com/auth/clients) で、現在GSyncが使用しているプロジェクトと **Web application** 型クライアントを開きます。新しいクライアントやシークレットの作成は不要です。
2. **Authorized redirect URIs（承認済みのリダイレクトURI）** に `https://jun-skn.github.io/gsync/callback.html` を追加して保存します。既存の `https://dg0988.github.io/ObsidianGSync/callback.html` は残します。Authorized JavaScript originsへ追加する方式ではありません。
3. Googleの設定反映には時間がかかる場合があります。保存・反映を確認してから次へ進みます。
4. Brandingのホームとポリシーは上表のURLを維持します。承認済みドメインの追加や所有権確認を画面で求められた場合は、下記「Googleの審査・ドメイン設定」を確認します。

### 3. 端末を1台ずつ切り替える

1. まず1台で **Obsidian → Settings → GSync → Sign-in redirect page** を新URLに変更します。既存のクライアントID・シークレット、Google Drive folder、同期設定は維持します。この欄がない場合はインストール済みバージョンを確認し、公式リリースとの違いを確認してから進みます。
2. 設定を保存した後、その端末の **Sign in again**（未認証なら **Sign in with Google**）から新しい認証を開始します。以前開いたタブの認証URLを再利用しません。サインアウトやGoogleアカウントでのアクセス取り消しは移行手順に含めません。
3. 同じ端末のブラウザでGoogle認証を完了します。Googleから戻ったページのホストが `jun-skn.github.io`、パスが `/gsync/callback.html` であることを確認します。URLは共有しないでください。自動で戻らない場合は **Obsidianを開く** を押します。
4. 開始から15分以内に元の保管庫へ戻り、GSyncの **Signed in.** と認証完了通知を確認します。Signed in.は以前のトークンでも表示されるため、この表示だけで移行成功とは判断しません。
5. **Sync now** が正常終了することを確認し、ほかの利用端末・保管庫でも順に切り替えます。GSyncの認証設定は端末ごとです。中継先変更だけでは既存トークンは新経路を通らないため、各端末の再認証で確認します。

### 4. 完了判定と旧経路の扱い

すべての対象端末・保管庫で、新URLを通る再認証と同期を確認するまでは、Google側の旧URIと未移行端末の旧設定を残します。この実装では旧URIを削除しません。移行が完了しても、旧URIの削除は別の操作として判断します。

新経路で失敗した場合は、その端末の **Sign-in redirect page** を旧URLに戻し、GSyncから新しく認証を開始できます。認証途中での設定変更や、開いたままの認証タブの使い回しは避けます。既存クライアントを削除したり、アプリ全体のアクセス権を取り消したりしないでください。

| 症状 | 確認する内容 |
| --- | --- |
| `redirect_uri_mismatch` | 同じクライアントのAuthorized redirect URIsとGSyncの新URLが完全一致するか。Google設定の反映を待ち、新しく認証を開始する |
| 新ページが404 | PRのマージ、Pages配信結果、ファイルパス。Google/GSyncの切り替えを進めない |
| Obsidianが自動で開かない | ページの「Obsidianを開く」を押し、OS・ブラウザのアプリ起動確認を許可する |
| `state didn't match`、期限切れ | 認証を始めた端末・保管庫のGSyncからやり直し、15分以内に完了する |
| Googleがアクセスを拒否 | 正しいアカウント、テストユーザー登録、同意画面のAudience設定を確認する |

### Googleの審査・ドメイン設定

- **認証経路の移行と審査完了は別です。** 個人利用には審査例外があり得ます。中継先の変更だけで未確認アプリの警告が消えるとは限りません。
- Brandingで承認済みドメインの設定を求められた場合は、新URLのドメインに対応する値をGoogleの画面で確認します。所有権確認が必要な場合は、プロジェクトのOwner/Editorと関連付いたGoogleアカウントでSearch Consoleの確認を行います。確認用HTMLファイルやmetaタグの発行は本人の画面で行い、必要なサイト変更は別途PRにします。
- ブランド審査は同意画面とクライアントに関連するドメインを対象にします。移行中に旧 `dg0988.github.io` のURIを残す間は、そのドメインも残るため、新ページの追加だけで審査のドメイン要件が解消するとは断定できません。旧URIを残す今回の方針と分け、全端末の移行後に確認します。
- 審査済みアプリへのリダイレクトURI追加・ブランド情報変更には再審査が必要になる場合があります。審査状況や要求内容は実際のConsoleで確認します。
- AudienceがTestingの外部アプリでは、Drive権限を含むリフレッシュトークンは原則7日で失効します。今回の中継先変更だけではこの期限は変わりません。In productionへの切り替えや審査は、トークンの無期限有効を保証しません。

## ローカル確認

ホームとポリシーはファイルを直接開いて確認できます。中継処理の自動検証はNode.js標準機能だけで実行できます。

```sh
node --test tests/callback.test.cjs
```

HTTP経由で確認する場合は、このディレクトリで次を実行します。

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

同じ端末で `http://127.0.0.1:8000/gsync/callback.html` を開きます。テスト用のcode/stateでリンク生成は検証できますが、実際の認証成功・iPhone上のアプリ復帰は、公開後にGSyncから開始する手順で確認します。

## 根拠となる公式情報

確認日：2026年10月19日。

- [GSync README：自己ホスト、設定、既知の認証エラー](https://github.com/dg0988/ObsidianGSync/blob/568016625ba0b77ab06e0718a48bb5eb39275f37/README.md)
- [GSync auth.ts：PKCE、state、トークン交換](https://github.com/dg0988/ObsidianGSync/blob/568016625ba0b77ab06e0718a48bb5eb39275f37/src/auth.ts)
- [GSync settings.ts：Sign-in redirect page](https://github.com/dg0988/ObsidianGSync/blob/568016625ba0b77ab06e0718a48bb5eb39275f37/src/settings.ts)
- [GSync main.ts：復帰時のstate照合・有効期限の検証](https://github.com/dg0988/ObsidianGSync/blob/568016625ba0b77ab06e0718a48bb5eb39275f37/src/main.ts)
- [Google：OAuth Web applicationのredirect_uriの一致条件](https://developers.google.com/identity/protocols/oauth2/web-server#creatingcred)
- [Google：OAuthの設定](https://support.google.com/googleapi/answer/6158849)
- [Google：リフレッシュトークンの失効条件](https://developers.google.com/identity/protocols/oauth2#expiration)
- [Google：ブランド審査、ドメイン要件、個人利用の例外](https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification)
- [Google：審査済みアプリの変更](https://support.google.com/cloud/answer/13464018)
- [GitHub：Pagesの公開元設定](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [GitHub：プライバシーに関する声明](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement)
