"""
Download TWICE member photos from kpop.fandom.com
"""
import os
import time
import requests
from PIL import Image
from io import BytesIO

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'client', 'public', 'images', 'idols')

# TWICE members to download (excluding Nayeon and Momo which already exist)
IDOLS = [
    ("jeongyeon.jpg", ["Jeongyeon", "Yoo Jeongyeon", "Jeongyeon (TWICE)"]),
    ("sana.jpg", ["Sana", "Minatozaki Sana", "Sana (TWICE)"]),
    ("jihyo.jpg", ["Jihyo", "Park Jihyo", "Jihyo (TWICE)"]),
    ("mina.jpg", ["Mina", "Myoui Mina", "Mina (TWICE)"]),
    ("dahyun.jpg", ["Dahyun", "Kim Dahyun", "Dahyun (TWICE)"]),
    ("chaeyoung.jpg", ["Chaeyoung", "Son Chaeyoung", "Chaeyoung (TWICE)"]),
    ("tzuyu.jpg", ["Tzuyu", "Chou Tzuyu", "Tzuyu (TWICE)"]),
]

FANDOM_API = "https://kpop.fandom.com/api.php"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://kpop.fandom.com/",
}

TARGET_SIZE = 400
DELAY = 2


def get_fandom_image_url(page_title):
    """Use MediaWiki API to get the main image for a page."""
    params = {
        "action": "query",
        "titles": page_title,
        "prop": "pageimages",
        "pithumbsize": 600,
        "format": "json",
    }
    try:
        resp = requests.get(FANDOM_API, params=params, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        pages = data.get("query", {}).get("pages", {})
        for page in pages.values():
            if page.get("pageid", -1) == -1:
                continue
            thumb = page.get("thumbnail", {})
            if thumb.get("source"):
                return thumb["source"]
    except Exception as e:
        print(f"    API error: {e}")
    return None


def crop_to_square_centered(img):
    """Crop image to square, centering the face."""
    w, h = img.size
    if w == h:
        return img
    if w > h:
        # Landscape - crop sides
        left = (w - h) // 2
        return img.crop((left, 0, left + h, h))
    else:
        # Portrait - crop top/bottom, favor center (face is usually in center)
        side = w
        top = (h - w) // 2
        return img.crop((0, top, w, top + side))


def download(filename, page_titles):
    out_path = os.path.join(OUTPUT_DIR, filename)
    if os.path.exists(out_path) and os.path.getsize(out_path) > 5000:
        print(f"  SKIP (exists): {filename}")
        return True

    name = filename.replace('.jpg', '')
    print(f"\n{name}:")

    img_url = None
    for title in page_titles:
        print(f"  Searching: '{title}'")
        time.sleep(DELAY)
        img_url = get_fandom_image_url(title)
        if img_url:
            print(f"  Found: {img_url.split('/')[-1][:60]}")
            break

    if not img_url:
        print(f"  No image found via API")
        return False

    try:
        time.sleep(DELAY)
        resp = requests.get(img_url, headers=HEADERS, timeout=20)
        resp.raise_for_status()
        img = Image.open(BytesIO(resp.content)).convert("RGB")
        print(f"  Downloaded: {img.size}")
        img = crop_to_square_centered(img)
        img = img.resize((TARGET_SIZE, TARGET_SIZE), Image.Resampling.LANCZOS)
        img.save(out_path, "JPEG", quality=90, optimize=True)
        kb = os.path.getsize(out_path) // 1024
        print(f"  Saved: {TARGET_SIZE}x{TARGET_SIZE}px, {kb}KB")
        return True
    except Exception as e:
        print(f"  Download error: {e}")
        return False


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    success = 0
    failed = []
    for filename, titles in IDOLS:
        ok = download(filename, titles)
        if ok:
            success += 1
        else:
            failed.append(filename)

    print(f"\n{'='*50}")
    print(f"Result: {success}/{len(IDOLS)} downloaded.")
    if failed:
        print(f"Still missing: {', '.join(failed)}")
    else:
        print("All TWICE members downloaded successfully!")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
