# フロア画面 v3（全画面マス目版）

`index.html` 1枚で動くWEBページ。方針は `floor/V3-DIRECTION.md`。

## マスの構成
- 上段：案件ボード（待機中／作業中／承認待ち／完了）・カレンダー・アナログ時計・会長室・取引先窓口（キキ／えみ）
- 下段：社員マス。人数に合わせて行を均等に割るので、空きマスは出ない
- ゲスト：members.json で `"guest": true`、または members.json にない id の状態ファイル。状態があるときだけマスが出る
- 承認待ち列には wait_light／wait_heavy／wait_member が入る（付箋に「会長」「みー」「〇〇待ち」の札）

## データの入り方（優先順）
1. `window.FLOOR_DATA`（ページを開く前にセットされていれば）
2. ページのデータベース `floor/snapshot`（claude.ai に公開した版だけ。変わると自動で反映）
3. ページ内の `<script id="floor-data">`（埋め込み）

データの形：
```json
{
  "collected_at": "+09:00付き時刻",
  "members": { members.json の中身 },
  "status": [ status/*.json を並べたもの ],
  "notes": { "id": "初期メモ（任意）" },
  "mii_jobs": [ ["いつ", "なにを"], ... ],
  "partners": [ { "id": "kiki", "name": "キキ", "who": "ChatGPT", "job": "絵・素材" }, ... ]
}
```
色を変えたいときは members.json の各メンバーに `"color": "#rrggbb"` を足す（付箋・服・マスが全部その色になる）。

## 書き込み欄の保存（優先順）
1. `window.FLOOR_STORE = { load(id) → Promise<string>, save(id, text) → Promise }` があればそれを使う
2. claude.ai に公開した版：ページのデータベース `notes/<id>`（PC・スマホ共通）
3. どちらもない時：その端末だけに保存（画面に「この端末だけに保存されます」と出る）
