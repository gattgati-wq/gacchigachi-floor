/* フロアの「送信」の中継役（Cloudflare Worker）。
   画面（公開ページ）から、合言葉つきで受け取って、GitHub に issue を作る。
   **鍵（GitHub のトークン）は、この Worker の「Secret」にだけ置く**。リポジトリにも、画面にも、置かん。
   必要な設定（Worker の変数・Secret）：
     GH_TOKEN        … GitHub の細かい権限のトークン（このリポジトリの Issues だけ 書ける）【Secret】
     SUGI_PASS       … すぎちゃんだけが知ってる合言葉（長くて、推測されんもの）【Secret】
     ALLOWED_ORIGIN  … 画面の場所。例：https://gattgati-wq.github.io （変数）
     REPO            … 例：gattgati-wq/gacchigachi-floor （変数）
   画面からの送り方：POST（JSON）{ "kind":"拡声器" か "個別", "to":"親方"（個別の時だけ）, "text":"…", "pass":"合言葉" } */

const MAX_TEXT = 2000;

const enc = new TextEncoder();
async function safeEqual(a, b) {                       // 合言葉の比べ方：時間で当てられんように、同じ長さの値にして、全部比べる
  const [x, y] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(String(a))), crypto.subtle.digest("SHA-256", enc.encode(String(b)))]);
  const A = new Uint8Array(x), B = new Uint8Array(y); let d = 0;
  for (let i = 0; i < A.length; i++) d |= A[i] ^ B[i];
  return d === 0;
}

function jstStamp() {
  const o = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tokyo", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date()).map(p => [p.type, p.value]));
  return `${o.year}-${o.month}-${o.day} ${o.hour}:${o.minute}`;
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const cors = origin && origin === env.ALLOWED_ORIGIN
      ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400", "Vary": "Origin" }
      : { "Vary": "Origin" };
    const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...cors } });

    if (req.method === "OPTIONS") return new Response(null, { status: origin === env.ALLOWED_ORIGIN ? 204 : 403, headers: cors });
    if (req.method !== "POST") return json({ ok: false, error: "method" }, 405);
    if (origin !== env.ALLOWED_ORIGIN) return json({ ok: false, error: "origin" }, 403);   // 画面以外のブラウザからは、受けん（鍵の代わりではない。本当の守りは、合言葉）

    let b; try { b = await req.json() } catch { return json({ ok: false, error: "json" }, 400) }
    if (!env.SUGI_PASS || !env.GH_TOKEN || !env.REPO) return json({ ok: false, error: "not-configured" }, 500);
    if (!(await safeEqual(b.pass ?? "", env.SUGI_PASS))) return json({ ok: false, error: "pass" }, 401);

    const kind = b.kind === "個別" ? "個別" : "拡声器";
    const text = String(b.text ?? "").trim();
    if (!text) return json({ ok: false, error: "empty" }, 400);
    if (text.length > MAX_TEXT) return json({ ok: false, error: "long" }, 413);
    const to = kind === "個別" ? String(b.to ?? "").slice(0, 30) : "";

    const first = text.replace(/\s+/g, " ").slice(0, 28);
    const title = `【${kind}】${to && !text.startsWith(to) ? to + "へ：" : ""}${first}${text.length > 28 ? "…" : ""}`;
    const body = `${text}\n\n---\nfrom: すぎちゃん\nsent: ${jstStamp()}（フロア画面から・中継）`;

    const r = await fetch(`https://api.github.com/repos/${env.REPO}/issues`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.GH_TOKEN}`, "Accept": "application/vnd.github+json", "User-Agent": "gacchigachi-floor-relay", "Content-Type": "application/json", "X-GitHub-Api-Version": "2022-11-28" },
      body: JSON.stringify({ title, body }),
    });
    if (!r.ok) return json({ ok: false, error: "github", status: r.status }, 502);
    const it = await r.json();
    return json({ ok: true, number: it.number, url: it.html_url });
  },
};
