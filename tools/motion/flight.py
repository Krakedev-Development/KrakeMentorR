"""Render the two looping cockpit backgrounds. Requires Pillow, NumPy and FFmpeg."""

import argparse
import math
from pathlib import Path
import random
import subprocess

import numpy as np
from PIL import Image, ImageChops, ImageDraw


ASSETS = Path(__file__).resolve().parents[2] / "public" / "assets"
WIDTH, HEIGHT = 540, 960
SIZE = WIDTH, HEIGHT
FPS, SECONDS = 24, 8
TAU = math.tau
Y, X = np.ogrid[0:HEIGHT, 0:WIDTH]


def glow(size, color):
    """Halo with a small bright core and a long soft falloff."""
    x = np.linspace(-1, 1, size)
    radius = np.hypot(x[:, None], x[None, :])
    strength = np.maximum(0, 1 - radius)
    return Image.fromarray((strength[:, :, None] ** 3 * color).astype('uint8'))


def light(canvas, sprite, x, y, strength=1):
    if strength <= 0:
        return
    if strength < 1:
        sprite = sprite.point(lambda c: c * strength)
    left, top = round(x - sprite.width / 2), round(y - sprite.height / 2)
    box = (left, top, left + sprite.width, top + sprite.height)
    canvas.paste(ImageChops.add(canvas.crop(box), sprite), (left, top))


def camera(image, scale, dx, dy):
    return image.transform(SIZE, Image.Transform.AFFINE, (
        1 / scale, 0, WIDTH / 2 * (1 - 1 / scale) - dx / scale,
        0, 1 / scale, HEIGHT / 2 * (1 - 1 / scale) - dy / scale,
    ), Image.Resampling.BILINEAR)


def render(alert, ffmpeg):
    name = "alert" if alert else "travel"
    source = "espaciopeligro.png" if alert else "espacio1.png"
    original = Image.open(ASSETS / source).convert("RGB").resize(SIZE, Image.Resampling.LANCZOS)
    # Blend the moving sky into the fixed canopy at its actual top and bottom rims.
    top = (38 + 66 * np.abs(2 * X / WIDTH - 1) ** 3) if not alert else 34 + 105 * (1 - X / WIDTH) ** 3
    bottom = HEIGHT - 40 - 48 * np.abs(2 * X / WIDTH - 1) ** 3
    mask = np.clip((Y - top) / 25, 0, 1) * np.clip((bottom - Y) / 22, 0, 1)
    glass = Image.fromarray((mask * 255).astype('uint8'))
    rng = random.Random(81)
    stars = [(rng.uniform(8, WIDTH * .82), rng.uniform(70, HEIGHT * .80),
              rng.uniform(.3, 1), rng.random() * TAU) for _ in range(85)]
    cyan = glow(55, np.array([104, 198, 238]))
    core = glow(11, np.array([192, 241, 255]))
    red = glow(144, np.array([143, 20, 38]))
    flare = glow(48, np.array([216, 78, 98]))
    out = ASSETS / 'motion' / (name + '.mp4')
    out.parent.mkdir(exist_ok=True)
    command = [ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
               '-s', f'{WIDTH}x{HEIGHT}', '-framerate', str(FPS), '-i', '-', '-an',
               '-c:v', 'libx264', '-preset', 'fast', '-crf', '21', '-pix_fmt', 'yuv420p',
               '-movflags', '+faststart', str(out)]
    with subprocess.Popen(command, stdin=subprocess.PIPE) as encoder:
        for frame in range(FPS * SECONDS):
            phase = frame / (FPS * SECONDS)
            angle = TAU * phase
            sway = math.sin(angle)
            drift = 1 - math.cos(angle)
            sky = camera(original, 1.045 + .024 * drift, 7 * sway, -5.5 * drift)
            sky = Image.composite(sky, original, glass)
            effects = Image.new('RGB', SIZE)
            draw = ImageDraw.Draw(effects)
            for x, y, depth, offset in stars:
                # Keep the foreground dust off the illustrated planet.
                if ((x - WIDTH * 1.04) / 166) ** 2 + ((y - 308) / 178) ** 2 < 1.05:
                    continue
                px = x + depth * (9 * sway + 1.5 * drift)
                py = y - depth * 5 * drift
                luma = (.5 + .4 * math.sin(angle + offset)) * depth
                color = tuple(round(v * luma) for v in (137, 187, 231))
                draw.ellipse((px, py, px + depth * 1.7, py + depth * 1.7), fill=color)
            if alert:
                # Pulses follow the existing red reflectors in the cockpit frame.
                pulse = (.5 - .5 * math.cos(2 * angle)) ** 1.7
                for x, y in [(9, 146), (95, 36), (519, 918), (36, 930)]:
                    light(effects, red, x, y, pulse)
                    light(effects, flare, x, y, pulse * .78)
                for x, y, offset in [(56, 259, .05), (492, 350, .32), (458, 522, .57)]:
                    t = (phase + offset) % 1
                    level = math.sin(math.pi * t) ** 7
                    tail = 30 + 36 * level
                    px = x - 22 + 44 * t
                    for segment in range(10):
                        gain = level * (1 - segment / 10)
                        draw.line((px - tail * segment / 10, y, px - tail * (segment + 1) / 10, y),
                                  fill=(round(195 * gain), round(42 * gain), round(70 * gain)), width=2)
                result = ImageChops.screen(sky, effects)
                result = camera(result, 1.011, 1.8 * pulse * math.sin(5 * angle), 2 * pulse * math.sin(4 * angle))
            else:
                # The returning signal travels from the planet toward the upper-left viewport.
                t = min(1, max(0, (phase - .10) / .75))
                strength = math.sin(math.pi * t) ** 1.2
                px = 409 - 360 * t
                py = 239 - 107 * t + 9 * math.sin(math.pi * t)
                for k in range(24):
                    fade = strength * (1 - k / 24) ** 2
                    draw.line((px + k * 1.7, py + k * .50, px + (k + 1) * 1.7, py + (k + 1) * .50),
                              fill=(int(110 * fade), int(211 * fade), int(242 * fade)), width=2)
                light(effects, cyan, px, py, strength * .82)
                light(effects, core, px, py, strength)
                result = ImageChops.screen(sky, effects)
            encoder.stdin.write(result.tobytes())
        encoder.stdin.close()
        if encoder.wait():
            raise RuntimeError(f"FFmpeg failed for {name}")
    print(out, flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ffmpeg', default='ffmpeg')
    args = parser.parse_args()
    for emergency in [False, True]:
        render(emergency, args.ffmpeg)
