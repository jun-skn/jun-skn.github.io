# 個人用Obsidian同期の案内サイト

GSyncでGoogle DriveとiPhoneのObsidianを同期する個人用環境について、日本語で説明するGitHub Pagesサイトです。HTMLとCSSのみを使用し、ビルドや追加パッケージは不要です。

## 公開後にGoogle Auth Platformへ登録するURL

| ブランディングの項目 | URL |
| --- | --- |
| アプリケーションのホームページ | https://jun-skn.github.io/ |
| アプリケーションのプライバシーポリシー | https://jun-skn.github.io/privacy.html |

上記は公開後のURLです。PR段階ではサイトを公開しません。OAuthの表示名はページとの対応が分かる名前（例：個人用Obsidian同期）に揃えてください。

この2ページは認証のコールバックではありません。OAuthクライアントの承認済みリダイレクトURIは、実際のGSync設定と一致させます。本変更ではコールバックページを追加せず、GSyncの設定も変更しません。

## 公開前の確認と公開方法

1. PRの `index.html` と `privacy.html` を読み、利用しているプラグインが [dg0988/ObsidianGSync](https://github.com/dg0988/ObsidianGSync) であることと、記載が実際の運用に合っていることを確認します。インストール済みバージョンや端末設定は本作業では確認していません。
2. 作業ブランチのファイルを取得し、`index.html` をブラウザで開きます。CSSとページ間リンクはローカルでも動作します。HTTPで確認する場合は、このディレクトリで `python3 -m http.server 8000 --bind 127.0.0.1` を実行し、同じ端末で `http://127.0.0.1:8000/` を開きます。
3. 内容を承認してPRを `main` にマージします。
4. [Settings → Pages](https://github.com/jun-skn/jun-skn.github.io/settings/pages) の **Build and deployment** で **Deploy from a branch**、ブランチ **main**、フォルダ **/ (root)** を選んで保存します。
5. Pagesのデプロイ完了後、上記2つのURLがログイン不要で閲覧できることを確認し、Google Auth Platformに登録します。

## OAuthについて確認したこと

- Google公式では、外部向けアプリが「テスト中」の場合、Drive権限を含むリフレッシュトークンは7日で失効します。GSync公式は「本番環境」への変更後に再サインインするよう案内しています。本番移行はトークンの無期限有効を保証するものではありません。
- 本番への切り替えとGoogleによる審査は別の手続きです。Googleは本人だけなどの個人利用を審査の例外として説明しており、未確認アプリの警告やユーザー数制限が残る場合があります。
- ブランド審査を行う場合、ホームページとポリシーの公開に加え、使用ドメインの所有権確認などが必要です。既定の認証中継ページのドメインはGSync開発者のものなので、このサイトの追加だけでドメイン要件がすべて満たされるとは限りません。実際のGoogle Cloud画面で要求される項目は別途確認してください。
- Google Cloudのプロジェクト、同意画面、使用中のOAuthクライアントは本作業では変更しません。実際の認証情報をリポジトリへ保存する必要はありません。

## 根拠として確認した公式情報

確認日：2026年10月17日。

- [GSync README：動作、権限、保存場所、7日失効への案内](https://github.com/dg0988/ObsidianGSync/blob/main/README.md)
- [GSync：認証処理と要求するDriveスコープ](https://github.com/dg0988/ObsidianGSync/blob/main/src/auth.ts)
- [GSync：認証中継ページ](https://github.com/dg0988/ObsidianGSync/blob/main/docs/callback.html)
- [Google：リフレッシュトークンの失効条件](https://developers.google.com/identity/protocols/oauth2#expiration)
- [Google：ブランド審査、ページ要件、個人利用の例外](https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification)
- [GitHub：Pagesの公開元設定](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [GitHub：プライバシーに関する声明](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement)
