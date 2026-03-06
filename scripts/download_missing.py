"""
Download missing idol photos with delays to respect Wikimedia rate limits.
Only downloads files that don't already exist.
"""

import os
import time
import requests
from PIL import Image
from io import BytesIO

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'client', 'public', 'images', 'idols')

# Only the missing ones, with thumbnail URLs (smaller = less restricted)
MISSING = [
    (
        "jungkook.jpg",
        [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Jungkook_GMA_Summer_Concert_2019_%28cropped%29.jpg/400px-Jungkook_GMA_Summer_Concert_2019_%28cropped%29.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Jeon_Jungkook_in_2019_%28cropped%29.jpg/400px-Jeon_Jungkook_in_2019_%28cropped%29.jpg",
        ]
    ),
    (
        "taehyung.jpg",
        [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Kim_Taehyung_V_in_2022.jpg/400px-Kim_Taehyung_V_in_2022.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Kim_Taehyung_20190820.jpg/400px-Kim_Taehyung_20190820.jpg",
        ]
    ),
    (
        "jimin.jpg",
        [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Jimin_BTS_2022_Weverse_Concert_%28cropped%29.jpg/400px-Jimin_BTS_2022_Weverse_Concert_%28cropped%29.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Park_Jimin_in_2019.jpg/400px-Park_Jimin_in_2019.jpg",
        ]
    ),
    (
        "momo.jpg",
        [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Momo_at_TWICE_4th_World_Tour_in_2022_%28cropped%29.jpg/400px-Momo_at_TWICE_4th_World_Tour_in_2022_%28cropped%29.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/TWICE_Momo_in_2019.jpg/400px-TWICE_Momo_in_2019.jpg",
        ]
    ),
    (
        "felix.jpg",
        [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Felix_at_SKZ_Unlock_concert_in_2023_%28cropped%29.jpg/400px-Felix_at_SKZ_Unlock_concert_in_2023_%28cropped%29.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Felix_Stray_Kids_2022.jpg/400px-Felix_Stray_Kids_2022.jpg",
        ]
    ),
    (
        "hyunjin.jpg",
        [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Hyunjin_at_SKZ_Unlock_concert_in_2023_%28cropped%29.jpg/400px-Hyunjin_at_SKZ_Unlock_concert_in_2023_%28cropped%29.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Stray_Kids_Hyunjin_in_2022.jpg/400px-Stray_Kids_Hyunjin_in_2022.jpg",
        ]
    ),
    (
        "karina.jpg",
        [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Karina_%28aespa%29_at_2024_Gaon_Chart_Music_Awards_%28cropped%29.jpg/400px-Karina_%28aespa%29_at_2024_Gaon_Chart_Music_Awards_%28cropped%29.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Karina_of_aespa_in_2022.jpg/400px-Karina_of_aespa_in_2022.jpg",
        ]
    ),
    (
        "winter.jpg",
        [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Winter_at_Kilian_Paris_event_on_27012026_%284%29.png/400px-Winter_at_Kilian_Paris_event_on_27012026_%284%29.png",
            "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Winter_%28aespa%29_at_2022_Gaon_Chart_Music_Awards_%28cropped%29.jpg/400px-Winter_%28aespa%29_at_2022_Gaon_Chart_Music_Awards_%28cropped%29.jpg",
        ]
    ),
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://commons.wikimedia.org/",
    "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
}

TARGET_SIZE = 400
DELAY_BETWEEN = 4  # seconds between requests


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
    print(f"\nDownloading: {name}")

    for i, url in enumerate(urls):
        short = url.split('/')[-1][:60]
        print(f"  [{i+1}/{len(urls)}] {short}")
        try:
            time.sleep(DELAY_BETWEEN)
            resp = requests.get(url, headers=HEADERS, timeout=25)
            resp.raise_for_status()
            img = Image.open(BytesIO(resp.content)).convert("RGB")
            print(f"  OK: {img.size}")
            img = crop_to_square_top_biased(img)
            img = img.resize((TARGET_SIZE, TARGET_SIZE), Image.Resampling.LANCZOS)
            img.save(out_path, "JPEG", quality=85, optimize=True)
            kb = os.path.getsize(out_path) // 1024
            print(f"  Saved: {TARGET_SIZE}x{TARGET_SIZE}px, {kb}KB")
            return True
        except Exception as e:
            print(f"  Error: {e}")
            if i < len(urls) - 1:
                print(f"  Retrying with next URL in {DELAY_BETWEEN}s...")

    print(f"  FAILED: {filename}")
    return False


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    existing = [f for f in os.listdir(OUTPUT_DIR) if f.endswith('.jpg') and os.path.getsize(os.path.join(OUTPUT_DIR, f)) > 5000]
    print(f"Already have: {', '.join(existing) if existing else 'none'}")
    print(f"To download: {len(MISSING)} files (with {DELAY_BETWEEN}s delay between requests)\n")

    success = 0
    failed = []
    for filename, urls in MISSING:
        ok = download(filename, urls)
        if ok:
            success += 1
        else:
            failed.append(filename)

    print(f"\nResult: {success}/{len(MISSING)} downloaded.")
    if failed:
        print(f"Still missing: {', '.join(failed)}")


if __name__ == "__main__":
    main()
