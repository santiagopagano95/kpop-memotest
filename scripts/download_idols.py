"""
Download K-Pop idol profile photos from Wikimedia Commons (direct URLs).
Saves to client/public/images/idols/ as 400x400 square JPGs.
"""

import os
import sys
import requests
from PIL import Image
from io import BytesIO

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'client', 'public', 'images', 'idols')

# Direct Wikimedia Commons URLs — chosen for being clear head/upper-body shots
# All are freely licensed (CC or public domain)
IDOLS = [
    (
        "jin.jpg",
        [
            "https://upload.wikimedia.org/wikipedia/commons/7/79/Kim_Seok-jin_in_2019.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/4/4b/BTS_Jin_at_Maison_Fred%2C_13_March_2025_04.png",
        ]
    ),
    (
        "jungkook.jpg",
        [
            "https://upload.wikimedia.org/wikipedia/commons/9/9e/Jungkook_GMA_Summer_Concert_2019_%28cropped%29.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/5/5e/Jeon_Jungkook_in_2019_%28cropped%29.jpg",
        ]
    ),
    (
        "taehyung.jpg",
        [
            "https://upload.wikimedia.org/wikipedia/commons/7/74/Kim_Taehyung_V_in_2022.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/8/8e/Kim_Taehyung_20190820.jpg",
        ]
    ),
    (
        "jimin.jpg",
        [
            "https://upload.wikimedia.org/wikipedia/commons/d/d8/Jimin_BTS_2022_Weverse_Concert_%28cropped%29.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/9/9e/Park_Jimin_in_2019.jpg",
        ]
    ),
    (
        "momo.jpg",
        [
            "https://upload.wikimedia.org/wikipedia/commons/a/ae/Momo_at_TWICE_4th_World_Tour_in_2022_%28cropped%29.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/3/30/TWICE_Momo_in_2019.jpg",
        ]
    ),
    (
        "nayeon.jpg",
        [
            "https://upload.wikimedia.org/wikipedia/commons/7/72/Nayeon_251120_1.jpg",
        ]
    ),
    (
        "lisa.jpg",
        [
            "https://upload.wikimedia.org/wikipedia/commons/a/ae/20240314_Lisa_Manoban_07.jpg",
        ]
    ),
    (
        "jennie.jpg",
        [
            "https://upload.wikimedia.org/wikipedia/commons/7/78/Jennie_2026_GDA_1.jpg",
        ]
    ),
    (
        "felix.jpg",
        [
            "https://upload.wikimedia.org/wikipedia/commons/b/bc/Felix_at_SKZ_Unlock_concert_in_2023_%28cropped%29.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/e/e8/Felix_Stray_Kids_2022.jpg",
        ]
    ),
    (
        "hyunjin.jpg",
        [
            "https://upload.wikimedia.org/wikipedia/commons/b/b5/Hyunjin_at_SKZ_Unlock_concert_in_2023_%28cropped%29.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/5/5c/Stray_Kids_Hyunjin_in_2022.jpg",
        ]
    ),
    (
        "karina.jpg",
        [
            "https://upload.wikimedia.org/wikipedia/commons/0/03/Karina_%28aespa%29_at_2024_Gaon_Chart_Music_Awards_%28cropped%29.jpg",
            "https://upload.wikimedia.org/wikipedia/commons/a/a5/Karina_of_aespa_in_2022.jpg",
        ]
    ),
    (
        "winter.jpg",
        [
            "https://upload.wikimedia.org/wikipedia/commons/e/e5/Winter_at_Kilian_Paris_event_on_27012026_%284%29.png",
            "https://upload.wikimedia.org/wikipedia/commons/9/92/Winter_%28aespa%29_at_2022_Gaon_Chart_Music_Awards_%28cropped%29.jpg",
        ]
    ),
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://commons.wikimedia.org/",
    "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
}

TARGET_SIZE = 400


def crop_to_square_top_biased(img: Image.Image) -> Image.Image:
    """Crop to square, biased toward top to capture faces in portrait shots."""
    w, h = img.size
    if w == h:
        return img
    if w > h:
        left = (w - h) // 2
        return img.crop((left, 0, left + h, h))
    else:
        # Portrait: take top portion (face usually in top 60%)
        side = w
        margin_top = int(h * 0.05)
        if margin_top + side > h:
            margin_top = max(0, h - side)
        return img.crop((0, margin_top, w, margin_top + side))


def try_download(url: str) -> Image.Image | None:
    """Try to download and open an image. Returns PIL Image or None."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=20)
        resp.raise_for_status()
        return Image.open(BytesIO(resp.content)).convert("RGB")
    except Exception as e:
        print(f"    Failed ({type(e).__name__}): {e}")
        return None


def download_idol(filename: str, urls: list[str]) -> bool:
    name = filename.replace('.jpg', '')
    print(f"Downloading: {name} -> {filename}")
    
    img = None
    for url in urls:
        short_url = url.split('/')[-1][:60]
        print(f"  Trying: ...{short_url}")
        img = try_download(url)
        if img:
            print(f"  OK: original size {img.size}")
            break
    
    if img is None:
        print(f"  FAILED: all URLs failed for {filename}")
        return False

    img = crop_to_square_top_biased(img)
    img = img.resize((TARGET_SIZE, TARGET_SIZE), Image.Resampling.LANCZOS)

    out_path = os.path.join(OUTPUT_DIR, filename)
    img.save(out_path, "JPEG", quality=85, optimize=True)
    size_kb = os.path.getsize(out_path) // 1024
    print(f"  Saved: {TARGET_SIZE}x{TARGET_SIZE}px, {size_kb}KB")
    return True


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Output: {os.path.abspath(OUTPUT_DIR)}\n")

    success = 0
    failed = []

    for filename, urls in IDOLS:
        ok = download_idol(filename, urls)
        if ok:
            success += 1
        else:
            failed.append(filename)
        print()

    print(f"Result: {success}/{len(IDOLS)} downloaded.")

    if failed:
        print(f"\nMissing: {', '.join(failed)}")
        print("Add these manually to client/public/images/idols/")
        sys.exit(1)
    else:
        print("All idol photos downloaded successfully!")


if __name__ == "__main__":
    main()
