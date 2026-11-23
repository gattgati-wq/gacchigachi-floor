# 送信の中継役（Cloudflare Worker）

目的：フロア画面の「送信」を、**ページを離れず、裏で**送る（GitHub の画面に飛ばん）。
鍵（GitHub のトークン）を、公開ページに置くことはできん（このリポジトリは公開）。だから、**鍵は、この Worker にだけ**持たせる。

```
フロア画面（公開）──合言葉つき──▶ Worker（鍵を持つ）──▶ GitHub に issue を作る（これまで通り、まなが読む）
```

## これは「外部への送信」＝重い許可
Cloudflare のアカウント・Worker・GitHub のトークンは、**すぎちゃんの許可と、本人の操作が要る**（まなは、作れん。許可も、勝手に出さん）。
下の手順は、**すぎちゃん本人か、部長（Cloudflare 担当）と一緒に**やる。みーが、橋渡しをする。

## 安全の考え方
- **トークン**：GitHub の「細かい権限のトークン」で、**このリポジトリの Issues だけ**（読み書き）。ほかの権限は、付けん。期限つき（90日ごとに入れ替え）。Worker の **Secret** にだけ置く。**リポジトリ・画面・チャットには、書かん**。
- **合言葉**：すぎちゃんだけが知ってる、長くて推測されんもの（20字以上）。Worker の Secret に入れて、画面には、**すぎちゃんの端末のブラウザに、最初の1回だけ入れる**。**これが本当の守り**。
  - なぜ大事か：画面は、「すぎちゃん本人が作った【拡声器】の issue」だけを信用して、ボードに出す。Worker は、すぎちゃん名義で issue を作る。合言葉が漏れると、他人が、すぎちゃんになりすませる。漏れたら、すぐ入れ替える（下の「入れ替え」）。
- **場所の確認**：Worker は、画面の場所（`https://gattgati-wq.github.io`）からの送信だけ受ける。ただし、これは、ブラウザ以外からは偽装できるので、**鍵の代わりにはならん**（守りは、合言葉）。
- 文は、2000字まで。お客さんの情報は、書かん（issue は公開）。

## 手順（1回だけ）
1. **GitHub のトークンを作る**（すぎちゃん）
   - GitHub → Settings → Developer settings → Fine-grained personal access tokens → Generate new token
   - Repository access：Only select repositories → `gacchigachi-floor` だけ
   - Permissions：**Issues = Read and write**（ほかは、全部 No access）
   - Expiration：90日。できたトークンは、**一度しか見えん**ので、すぐ、手順3に使う（どこにも貼らん）
2. **合言葉を決める**（すぎちゃん）：長くて、ほかで使ってないもの。
3. **Worker を作る**（すぎちゃん＋部長）
   - Cloudflare にログイン → Workers & Pages → Create → Worker（名前：`gacchigachi-floor-relay`）
   - コード：このフォルダの `worker.js` の中身を貼る（またはコマンドで：`cd floor/relay && npx wrangler deploy`）
   - Settings → Variables：`ALLOWED_ORIGIN` = `https://gattgati-wq.github.io`、`REPO` = `gattgati-wq/gacchigachi-floor`
   - Settings → Variables → **Secret**：`GH_TOKEN` = 手順1のトークン、`SUGI_PASS` = 手順2の合言葉
   - できた Worker の URL（`https://gacchigachi-floor-relay.〇〇.workers.dev`）を、みーに伝える（URL は、秘密ではない）
4. **画面に、URL を教える**（みー／まな）：`floor/relay.json` の `url` に、Worker の URL を書いて、PR（マージ）。
5. **最初の1回**（すぎちゃん）：フロア画面で、拡声器に書いて「送信」→ 合言葉を聞かれる → 入れる → 「送った ✔」と出れば成功。GitHub の issue に、`【拡声器】…` が、増えてるはず。

## できた後の動作確認（部長・すぎちゃん）
1. Worker の URL を、ブラウザで開く → `{"ok":false,"error":"method"}` と出れば、Worker は動いてる（GET は、わざと断る）。
2. **合言葉は、チャットやコマンドの履歴に、貼らん**。確認は、フロア画面から（手順5）でやる。
3. フロア画面で送信 → 「送った ✔（#番号）」→ GitHub の issues に `【拡声器】…` が増えてる → **まなが、その issue を読めるか**は、まなが確認する。
4. 動かん時の見分け方（画面に出る言葉）：
   - 「合言葉が違うみたい」→ `SUGI_PASS` と入れた合言葉が、違う。
   - GitHub の画面が開く（従来の形に戻った）→ Worker に届かん、または、GitHub への作成に失敗（トークンの権限・期限、`REPO` の綴り）。Cloudflare の「Logs」で、`github` の `status`（401＝トークン、404＝リポジトリ名か権限、403＝権限不足）を見る。
   - 何も起きん → `floor/relay.json` の url が空か、Worker の URL が違う。

## うまくいかん時
- 中継役に届かん・失敗した時は、**自動で、これまでの「GitHub の画面を開く形」に戻る**（送れなくなることは、無い）。
- 「合言葉が違うみたい」→ もう一度、送信を押して、入れ直す。

## 入れ替え（合言葉が漏れた時・トークンの期限）
- Worker の Secret（`SUGI_PASS` / `GH_TOKEN`）を、新しい値に入れ替える。画面側は、合言葉が違うと、自動で聞き直す。
- 漏れたかもしれん時は、**issue に、見覚えのない【拡声器】が無いかも確認**する（あれば、まなに知らせる）。

## 費用
- Cloudflare Workers の無料枠で足りる（1日10万リクエストまで。知らんけど、最新の条件は、Cloudflare で確認）。
