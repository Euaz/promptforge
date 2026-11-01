"""Printify helper for the daily FORGE run. Reads the token from PRINTIFY_API_TOKEN.

New products copy an existing listing (the template, "Grow Gently" by default) so they get the same
blank, print provider, colours, sizes, prices and print placement as the shop's first designs.

usage:
  python3 printify.py check
  python3 printify.py publish --image print.png --title "..." --tags "a,b,..." --desc-file desc.txt
"""
import argparse
import base64
import json
import os
import ssl
import sys
import urllib.error
import urllib.request

API = "https://api.printify.com/v1"
TOKEN = os.environ.get("PRINTIFY_API_TOKEN", "").strip()
TEMPLATE = os.environ.get("PRINTIFY_TEMPLATE", "Grow Gently")
_bundle = os.environ.get("SSL_CERT_FILE") or ("/root/.ccr/ca-bundle.crt" if os.path.exists("/root/.ccr/ca-bundle.crt") else None)
CTX = ssl.create_default_context(cafile=_bundle) if _bundle else ssl.create_default_context()


def call(method, path, body=None):
    req = urllib.request.Request(API + path, method=method, data=json.dumps(body).encode() if body is not None else None)
    req.add_header("Authorization", "Bearer " + TOKEN)
    req.add_header("Content-Type", "application/json")
    req.add_header("User-Agent", "GrowGentlyAU-FORGE/1.0")
    try:
        with urllib.request.urlopen(req, context=CTX, timeout=180) as r:
            raw = r.read()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        sys.exit(f"Printify {method} {path} failed: {e.code} {e.read()[:600].decode(errors='replace')}")


def shop():
    shops = call("GET", "/shops.json")
    if not shops:
        sys.exit("No Printify shops found for this token.")
    etsy = [s for s in shops if "etsy" in str(s.get("sales_channel", "")).lower()]
    return (etsy or shops)[0]


def template(shop_id):
    page = 1
    while True:
        res = call("GET", f"/shops/{shop_id}/products.json?limit=50&page={page}")
        for p in res.get("data", []):
            if TEMPLATE.lower() in p.get("title", "").lower():
                return call("GET", f"/shops/{shop_id}/products/{p['id']}.json")
        if page >= res.get("last_page", 1):
            sys.exit(f"No product with '{TEMPLATE}' in its title to copy settings from.")
        page += 1


def upload(path):
    with open(path, "rb") as f:
        data = base64.b64encode(f.read()).decode()
    return call("POST", "/uploads/images.json", {"file_name": os.path.basename(path), "contents": data})


def build(tmpl, img, title, desc, tags):
    variants = [{"id": v["id"], "price": v["price"], "is_enabled": v["is_enabled"]} for v in tmpl["variants"]]
    areas = []
    for pa in tmpl["print_areas"]:
        holders = []
        for ph in pa["placeholders"]:
            if not ph.get("images"):
                continue
            t = ph["images"][0]
            # keep the printed height of the template design: scale is a fraction of the print-area width
            scale = t["scale"]
            if t.get("width") and t.get("height"):
                scale = t["scale"] * (t["height"] / t["width"]) * (img["width"] / img["height"])
            holders.append({"position": ph["position"], "images": [{"id": img["id"], "x": t["x"], "y": t["y"], "scale": round(min(scale, 1.0), 4), "angle": t.get("angle", 0)}]})
        if holders:
            areas.append({"variant_ids": pa["variant_ids"], "placeholders": holders})
    return {"title": title, "description": desc, "tags": tags, "blueprint_id": tmpl["blueprint_id"],
            "print_provider_id": tmpl["print_provider_id"], "variants": variants, "print_areas": areas}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["check", "publish"])
    ap.add_argument("--image"); ap.add_argument("--title"); ap.add_argument("--tags"); ap.add_argument("--desc-file")
    a = ap.parse_args()
    if not TOKEN:
        sys.exit("PRINTIFY_API_TOKEN is not set.")
    s = shop()
    t = template(s["id"])
    if a.cmd == "check":
        on = [v for v in t["variants"] if v["is_enabled"]]
        print(json.dumps({"shop": s.get("title"), "shop_id": s["id"], "channel": s.get("sales_channel"), "template": t["title"],
                          "blueprint_id": t["blueprint_id"], "print_provider_id": t["print_provider_id"], "enabled_variants": len(on),
                          "prices_cents": sorted({v["price"] for v in on})}, indent=1))
        return
    tags = [x.strip() for x in a.tags.split(",") if x.strip()][:13]
    desc = open(a.desc_file).read()
    img = upload(a.image)
    prod = call("POST", f"/shops/{s['id']}/products.json", build(t, img, a.title, desc, tags))
    call("POST", f"/shops/{s['id']}/products/{prod['id']}/publish.json",
         {"title": True, "description": True, "images": True, "variants": True, "tags": True, "keyFeatures": True, "shipping_template": True})
    print(json.dumps({"product_id": prod["id"], "shop_id": s["id"], "title": a.title}))


if __name__ == "__main__":
    main()
