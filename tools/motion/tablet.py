"""Animate the explorer's gesture, Krake and the light reflected from the tablet."""
import math
import shutil
import subprocess
from pathlib import Path

import numpy as np
import cv2
from PIL import Image
from workshop import soft_region


ASSETS = Path(__file__).resolve().parents[2] / "public/assets"


def render():
    with Image.open(ASSETS / "workshop-tablet.webp") as image:
        art = np.asarray(image.convert("RGB").resize((768, 512), Image.Resampling.LANCZOS), dtype=np.float32)
    y, x = np.indices(art.shape[:2], dtype=np.float32)

    def glow(cx, cy, rx, ry):
        return np.exp(-2 * (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2))

    # Light from the glass reaches the tapping finger and the explorer's cheek.
    glass = glow(407, 257, 66, 22) + 0.38 * glow(389, 214, 27, 28)
    bench = glow(593, 353, 66, 21)
    head = soft_region(x.shape, [(278, 102), (329, 79), (389, 88), (417, 120),
                                 (420, 167), (387, 219), (362, 237), (315, 217),
                                 (274, 192), (262, 152)], 10)
    hand = soft_region(x.shape, [(278, 319), (323, 279), (352, 251), (404, 254),
                                 (401, 270), (373, 277), (354, 306), (303, 338)], 6)
    krake = soft_region(x.shape, [(427, 120), (482, 72), (508, 120), (508, 151),
                                  (529, 170), (542, 195), (539, 223), (512, 238),
                                  (441, 245), (404, 234), (409, 207), (428, 171)], 8)
    tentacle = glow(518, 204, 35, 38)
    # Keep the glass edge fixed while the index finger bends about the wrist.
    hand *= np.clip((409 - x) / 13, 0, 1)
    cyan = np.array([9, 48, 57], dtype=np.float32)
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        from imageio_ffmpeg import get_ffmpeg_exe
        ffmpeg = get_ffmpeg_exe()
    destination = ASSETS / "motion/tablet.mp4"
    fps, seconds = 24, 5
    command = [ffmpeg, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
               "-s", "768x512", "-r", str(fps), "-i", "-", "-an", "-c:v", "libx264",
               "-crf", "21", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(destination)]
    with subprocess.Popen(command, stdin=subprocess.PIPE) as encoder:
        for index in range(fps * seconds):
            phase = math.tau * index / (fps * seconds)
            nod = (1 - math.cos(phase)) / 2
            lift = math.sin(phase) ** 2
            hover = math.sin(phase)
            dx = (-(y - 223) * .048 * nod * head + 4 * lift * hand
                  + 2.8 * hover * krake + 2.5 * math.sin(2 * phase) * tentacle)
            dy = (-(x - 292) * .066 * nod * head + (x - 282) * .086 * lift * hand
                  + 6.5 * hover * krake + 2.2 * math.sin(2 * phase) * tentacle)
            frame = cv2.remap(art, x + dx, y + dy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
            light = glass * (1 - lift) ** 3 + bench * (0.4 - 0.4 * math.cos(2 * phase))
            encoder.stdin.write(np.uint8(np.clip(frame + light[..., None] * cyan, 0, 255)).tobytes())
        encoder.stdin.close()
        if encoder.wait():
            raise RuntimeError("FFmpeg could not encode the tablet scene")


if __name__ == "__main__":
    render()
