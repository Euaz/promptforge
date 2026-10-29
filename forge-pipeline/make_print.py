"""Turn a transparent design PNG into a print file and a small preview.

usage: python3 make_print.py <in.png> <out-dir> <slug>
writes <slug>-print.png (3900 px tall = 33 cm at 300 DPI) and <slug>-web.webp (900 px tall)
"""
import sys
import numpy as np
from PIL import Image

src, out, slug = sys.argv[1:4]
im = Image.open(src).convert("RGBA")
a = np.array(im)
if a[..., 3].min() == 255:
    sys.exit("no transparency: regenerate with a transparent background")
a[..., 3][a[..., 3] < 12] = 0  # drop near-invisible fringe so the printer lays no ink there
im = Image.fromarray(a)
im = im.crop(im.getbbox())
h = 3900
im.resize((round(im.width * h / im.height), h), Image.LANCZOS).save(f"{out}/{slug}-print.png", dpi=(300, 300), optimize=True)
im.resize((round(im.width * 900 / im.height), 900), Image.LANCZOS).save(f"{out}/{slug}-web.webp", quality=88)
print(f"{out}/{slug}-print.png", f"{out}/{slug}-web.webp")
