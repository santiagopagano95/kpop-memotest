"""
Download K-Pop idol profile photos from kpop.fandom.com static CDN.
These are fan-wiki images, publicly accessible.
"""

import os
import time
import requests
from PIL import Image
from io import BytesIO

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'client', 'public', 'images', 'idols')

# Fandom/wiki CDN direct image URLs
# These are profile/infobox images from kpop.fandom.com
IDOLS = [
    (
        "jungkook.jpg",
        [
            "https://static.wikia.nocookie.net/kpop/images/b/b0/Jungkook_April_2024.jpg",
            "https://static.wikia.nocookie.net/kpop/images/9/9d/Jungkook_Proof_Concept_Photo.jpg",
        ]
    ),
    (
        "taehyung.jpg",
        [
            "https://static.wikia.nocookie.net/kpop/images/c/c3/V_March_2024.jpg",
            "https://static.wikia.nocookie.net/kpop/images/f/f9/V_Layover_Concept_Photo.jpg",
        ]
    ),
    (
        "jimin.jpg",
        [
            "https://static.wikia.nocookie.net/kpop/images/c/c0/Jimin_January_2024.jpg",
            "https://static.wikia.nocookie.net/kpop/images/e/e7/Jimin_FACE_Concept_Photo.jpg",
        ]
    ),
    (
        "momo.jpg",
        [
            "https://static.wikia.nocookie.net/kpop/images/c/c2/Momo_February_2024.jpg",
            "https://static.wikia.nocookie.net/kpop/images/8/8b/Momo_Ready_To_Be_Concept_Photo.jpg",
        ]
    ),
    (
        "felix.jpg",
        [
            "https://static.wikia.nocookie.net/kpop/images/c/c9/Felix_February_2024.jpg",
            "https://static.wikia.nocookie.net/kpop/images/9/9e/Felix_Rock-Star_Concept_Photo.jpg",
        ]
    ),
    (
        "hyunjin.jpg",
        [
            "https://static.wikia.nocookie.net/kpop/images/8/8d/Hyunjin_February_2024.jpg",
            "https://static.wikia.nocookie.net/kpop/images/5/57/Hyunjin_Rock-Star_Concept_Photo.jpg",
        ]
    ),
    (
        "karina.jpg",
        [
            "https://static.wikia.nocookie.net/kpop/images/0/04/Karina_January_2024.jpg",
            "https://static.wikia.nocookie.net/kpop/images/8/8a/Karina_Drama_Concept_Photo.jpg",
        ]
    ),
    (
        "winter.jpg",
        [
            "https://static.wikia.nocookie.net/kpop/images/2/2a/Winter_January_2024.jpg",
            "https://static.wikia.nocookie.net/kpop/images/4/49/Winter_Drama_Concept_Photo.jpg",
        ]
    ),
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://kpop.fandom.com/",
    "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
}

TARGET_SIZE = 400
DELAY = 2


def crop_to_square_top_biased(img):
    w, h = img.size
    if w == h:
        return img
    if w > h:
        left = (w - h) // 2
        return img.crop((left, 0, left + h, h))
    else:
        side = w
        margin_top = int(h * 0.05)
        if margin_top + side > h:
            margin_top = max(0, h - side)
        return img.crop((0, margin_top, w, margin_top + side))


def download(filename, urls):
    out_path = os.path.join(OUTPUT_DIR, filename)
    if os.path.exists(out_path) and os.path.getsize(out_path) > 5000:
        print(f"  SKIP (already exists): {filename}")
        return True

    name = filename.replace('.jpg', '')
    print(f"\n{name}:")

    for i, url in enumerate(urls):
        short = url.split('/')[-1][:50]
        print(f"  [{i+1}] {short}")
        try:
            time.sleep(DELAY)
            resp = requests.get(url, headers=HEADERS, timeout=20)
            resp.raise_for_status()
            img = Image.open(BytesIO(resp.content)).convert("RGB")
            print(f"  OK: {img.size}")
            img = crop_to_square_top_biased(img)
            img = img.resize((TARGET_SIZE, TARGET_SIZE), Image.Resampling.LANCZOS)
            img.save(out_path, "JPEG", quality=85, optimize=True)
            kb = os.path.getsize(out_path) // 1024
            print(f"  Saved {TARGET_SIZE}x{TARGET_SIZE}px, {kb}KB")
            return True
        except Exception as e:
            print(f"  Error: {e}")

    return False


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    existing = sorted([f for f in os.listdir(OUTPUT_DIR) if f.endswith('.jpg') and os.path.getsize(os.path.join(OUTPUT_DIR, f)) > 5000])
    print(f"Already downloaded: {existing}\n")

    success = 0
    failed = []
    for filename, urls in IDOLS:
        ok = download(filename, urls)
        if ok:
            success += 1
        else:
            failed.append(filename)

    print(f"\nResult: {success}/{len(IDOLS)} downloaded.")
    if failed:
        print(f"Still missing: {', '.join(failed)}")
    else:
        print("All done!")


if __name__ == "__main__":
    main()
