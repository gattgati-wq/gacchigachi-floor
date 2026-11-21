#!/usr/bin/env python3
"""members.json と status/*.json を index.html の埋め込みデータに反映する（みー用）。
使い方: python3 floor/v3/embed.py"""
import json, glob, re, os, datetime
d = os.path.dirname(os.path.abspath(__file__)); f = os.path.dirname(d)
members = json.load(open(f+"/members.json", encoding="utf-8"))
status = [json.load(open(p, encoding="utf-8")) for p in sorted(glob.glob(f+"/status/*.json"))]
jst = datetime.timezone(datetime.timedelta(hours=9))
def jl(path):
    return json.load(open(path, encoding="utf-8")) if os.path.exists(path) else None
msg = jl(f+"/megaphone/current.json")
replies = [json.load(open(p, encoding="utf-8")) for p in sorted(glob.glob(f+"/megaphone/replies/*.json"))]
messages = {}
msg_replies = {}
for fp in sorted(glob.glob(f+"/messages/*.json")):
    messages[os.path.basename(fp)[:-5]] = json.load(open(fp, encoding="utf-8"))
for fp in sorted(glob.glob(f+"/messages/replies/*.json")):
    msg_replies[os.path.basename(fp)[:-5]] = json.load(open(fp, encoding="utf-8"))
data = {"messages": messages, "msgReplies": msg_replies, "megaphone": {"message": msg, "replies": replies}, "collected_at": datetime.datetime.now(jst).isoformat(timespec="seconds"), "members": members, "status": status}
html = open(d+"/index.html", encoding="utf-8").read()
blob = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
new = re.sub(r'(<script id="floor-data" type="application/json">).*?(</script>)', lambda m: m.group(1)+blob+m.group(2), html, count=1, flags=re.S)
open(d+"/index.html", "w", encoding="utf-8").write(new)
print("embedded", len(status), "status files")
