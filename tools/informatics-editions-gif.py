"""Assemble the unaltered browser captures into one reading sequence per edition."""
from pathlib import Path
from os import environ
from PIL import Image

root = Path(environ.get("INFORMATICS_SCREENS", "artifacts/informatics-editions"))
for edition in ["june", "november"]:
    frames = []
    for source in sorted(root.glob(edition + "-*.png")):
        with Image.open(source) as image:
            image = image.convert("RGB")
            width = min(720, image.width)
            frames.append(image.resize((width, round(image.height * width / image.width)), Image.Resampling.LANCZOS))
    assert len(frames) == 7, edition
    size = max(f.width for f in frames), max(f.height for f in frames)
    padded = []
    for frame in frames:
        canvas = Image.new("RGB", size, "white")
        canvas.paste(frame, (0, 0))
        padded.append(canvas)
    padded[0].save(root / (edition + "-paths.gif"), save_all=True, append_images=padded[1:],
                   duration=[1800, 2200, 2400, 2000, 2200, 1800, 2100], loop=0)
