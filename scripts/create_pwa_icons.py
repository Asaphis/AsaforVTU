from pathlib import Path
from PIL import Image

source = Path('/home/ubuntu/upload/247043.jpg')
out_dir = Path('/home/ubuntu/AsaforVTU/web/frontend/public')
image = Image.open(source).convert('RGB')
for size in (192, 512):
    output = out_dir / f'pwa-icon-{size}.png'
    image.resize((size, size), Image.Resampling.LANCZOS).save(output, format='PNG', optimize=True)
    print(f'created {output} ({size}x{size})')
