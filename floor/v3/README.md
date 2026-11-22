# フロアv3

`index.html` 1枚。開くたびに `floor/members.json` と `floor/status/*.json`（と拡声器）の最新を読む。
埋め込みデータの更新：`python3 floor/v3/embed.py`

## members.json に足せる項目（みーが書く・どれも省略可）
| 項目 | 意味 |
|---|---|
| title | 名札に出す「仕事役割」の名前。無ければ `name`（個人名）が出る |
| group | 仕事のまとまりの名前（例：予約システム）。同じ値の子が近くに座る。誰にも無ければ全員を1つのまとまりにする |
| art | `true` なら素材（`img/<ID>-<ポーズ>.webp`）で表示する |
| art_done | `true` なら、完了の子は `<ID>-done.webp` を使う（任意） |
| group_order | まとまりの並び順（数字、小さい順）。無ければ members.json に出てくる順 |

例
```json
{ "id": "chii", "name": "ちぃ", "role": "文字盤", "seat": "watch", "title": "予約・画面担当", "group": "予約システム", "group_order": 1 }
```
