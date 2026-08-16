from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "logo.png"


def padded_asset(destination: Path, scale: float) -> None:
    source = Image.open(SOURCE).convert("RGBA")
    canvas_size = 2048
    target_size = int(canvas_size * scale)
    resized = source.resize((target_size, target_size), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (canvas_size, canvas_size), (255, 255, 255, 0))
    offset = (canvas_size - target_size) // 2
    canvas.alpha_composite(resized, (offset, offset))
    canvas.save(destination, "PNG", optimize=True)


if __name__ == "__main__":
    padded_asset(ROOT / "assets" / "app_icon.png", 0.62)
    padded_asset(ROOT / "assets" / "splash_logo.png", 0.66)
