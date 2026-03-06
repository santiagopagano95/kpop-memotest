"""
Download last 3 idols directly from Wikimedia Commons.
Try known file names and variations.
"""
import os
import requests
from PIL import Image
from io import BytesIO

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'client', 'public', 'images', 'idols')

# Try specific Wikimedia Commons file names
CANDIDATES = {
    "jungkook.jpg": [
        # BTS Jungkook
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Jeon_Jung-kook_at_the_White_House_31_May_2022.jpg/400px-Jeon_Jung-kook_at_the_White_House_31_May_2022.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Jeon_Jung-kook_at_the_White_House_31_May_2022.jpg/600px-Jeon_Jung-kook_at_the_White_House_31_May_2022.jpg",
    ],
    "momo.jpg": [
        # Momo from TWICE
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Momo_at_Gimpo_Airport_on_January_13%2C_2020.jpg/400px-Momo_at_Gimpo_Airport_on_January_13%2C_2020.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Momo_at_Gimpo_Airport_on_January_13%2C_2020.jpg/600px-Momo_at_Gimpo_Airport_on_January_13%2C_2020.jpg",
    ],
    "felix.jpg": [
        # Felix from Stray Kids - try a direct search result
    ],
}

# Build felix URLs from pattern
for year in [2022, 2023, 2024]:
    for month in range(1, 13):
        for day in range(1, 32):
            date_str = f"{year}_{month:02d}_{day:02d}"
            url = f"https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Felix_{date_str}.jpg/400px-Felix_{date_str}.jpg"
            # Actually let's not brute force, let me try specific known photos
            pass

# Let me try some specific Felix URLs
CANDIDATES["felix.jpg"] = [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Felix_of_Stray_Kids_at_Incheon_Airport_on_November_22%2C_2023.jpg/400px-Felix_of_Stray_Kids_at_Incheon_Airport_on_November_22%2C_2023.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Lee_Felix_in_2019.jpg/400px-Lee_Felix_in_2019.jpg",
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
}

TARGET_SIZE = 400


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


def try_download(filename, urls):
    out_path = os.path.join(OUTPUT_DIR, filename)
    if os.path.exists(out_path) and os.path.getsize(out_path) > 5000:
        print(f"  SKIP (exists): {filename}")
        return True

    name = filename.replace('.jpg', '')
    print(f"\n{name}:")

    for url in urls:
        try:
            print(f"  Trying: {url[:70]}...")
            resp = requests.get(url, headers=HEADERS, timeout=15)
            if resp.status_code == 200:
                content_type = resp.headers.get('Content-Type', '')
                if 'image' in content_type or len(resp.content) > 10000:
                    img = Image.open(BytesIO(resp.content)).convert("RGB")
                    print(f"  Downloaded: {img.size}")
                    img = crop_to_square_top_biased(img)
                    img = img.resize((TARGET_SIZE, TARGET_SIZE), Image.Resampling.LANCZOS)
                    img.save(out_path, "JPEG", quality=85, optimize=True)
                    kb = os.path.getsize(out_path) // 1024
                    print(f"  Saved: {TARGET_SIZE}x{TARGET_SIZE}px, {kb}KB")
                    return True
        except Exception as e:
            print(f"    Error: {e}")
            continue
    
    print(f"  Failed to download from any URL")
    return False


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    success = 0
    failed = []
    for filename, urls in CANDIDATES.items():
        ok = try_download(filename, urls)
        if ok:
            success += 1
        else:
            failed.append(filename)

    print(f"\nResult: {success}/{len(CANDIDATES)} downloaded.")
    if failed:
        print(f"Still missing: {', '.join(failed)}")
    else:
        print("All done!")


if __name__ == "__main__":
    main()
