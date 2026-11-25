"""Render the crash-site background with Python, NumPy, OpenCV and FFmpeg."""

import math
import os
import shutil
import subprocess
from pathlib import Path

import cv2
import numpy as np


ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / "public/assets/scene-crash.png"
OUTPUT = ROOT / "public/assets/motion/landing.mp4"
WIDTH, HEIGHT, FPS, SECONDS = 540, 960, 24, 6
TAU = math.tau


def soft_mask(points, blur):
    mask = np.zeros((HEIGHT, WIDTH), np.float32)
    cv2.fillPoly(mask, [np.array(points, np.int32)], 1)
    return cv2.GaussianBlur(mask, (0, 0), blur)


def smoke_wisp(seed):
    """A lit bank of overlapping curls, in the palette of the painted plume."""
    rng = np.random.default_rng(seed)
    sy, sx = np.mgrid[-1:1:96j, -1:1:96j].astype(np.float32)
    alpha = np.zeros_like(sx)
    light = np.zeros_like(sx)
    for _ in range(11):
        cx, cy = rng.uniform(-0.38, 0.38, 2)
        radius = rng.uniform(0.29, 0.52)
        dx, dy = (sx - cx) / radius, (sy - cy) / radius
        distance = np.sqrt(dx * dx + dy * dy)
        lobe = np.clip((1 - distance) * 4, 0, 1)
        alpha = np.maximum(alpha, lobe)
        light += lobe * (0.16 + 0.42 * np.clip(0.5 + 0.5 * (dx - dy), 0, 1))
    light = np.clip(light * 0.44, 0, 1)
    shadow = np.array([65, 48, 67], np.float32)
    lit_edge = np.array([147, 103, 117], np.float32)
    rgb = shadow + light[..., None] * (lit_edge - shadow)
    return np.dstack((rgb, cv2.GaussianBlur(alpha, (0, 0), 1.3)))


def blend_wisp(frame, wisp, x, y, radius, visibility, opacity):
    size = int(2 * radius)
    left, top = round(x - radius), round(y - radius)
    x0, y0 = max(0, left), max(0, top)
    x1, y1 = min(WIDTH, left + size), min(HEIGHT, top + size)
    if x1 <= x0 or y1 <= y0:
        return
    patch = cv2.resize(wisp, (size, size))[y0-top:y1-top, x0-left:x1-left]
    alpha = opacity * visibility[y0:y1, x0:x1, None] * patch[:, :, 3:]
    region = frame[y0:y1, x0:x1]
    region[:] += alpha * (patch[:, :, :3] - region)


def main():
    art = cv2.imread(str(ART))
    art = cv2.cvtColor(cv2.resize(art, (WIDTH, HEIGHT), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2RGB)
    y, x = np.mgrid[:HEIGHT, :WIDTH].astype(np.float32)
    plume = soft_mask([(0, 0), (149, 0), (143, 47), (175, 83), (154, 133),
                       (177, 153), (213, 179), (239, 222), (228, 217), (198, 189),
                       (150, 168), (115, 157), (101, 128), (81, 108), (0, 62)], 5)
    # Keep the rising smoke behind the cockpit canopy and tail fin.
    sky = soft_mask([(0, 0), (WIDTH, 0), (WIDTH, 215), (239, 216),
                     (213, 195), (188, 180), (153, 168), (111, 157),
                     (61, 100), (15, 84), (0, 82)], 1)
    krake = soft_mask([(-15, 401), (43, 363), (67, 375), (72, 352),
                       (129, 310), (179, 341), (199, 399), (206, 447),
                       (228, 413), (243, 421), (233, 462), (198, 471),
                       (236, 500), (240, 550), (174, 563), (230, 575),
                       (211, 599), (64, 585), (-15, 536)], 4)
    krake *= np.clip((586 - y) / 210, 0, 1)
    grass = soft_mask([(464, 483), (493, 408), (518, 424), (540, 399),
                       (540, 484), (507, 475), (483, 500)], 4)
    led_glow = np.zeros((HEIGHT, WIDTH), np.float32)
    for start, end in [((49, 103), (60, 137)), ((91, 181), (108, 173)),
                       ((129, 266), (148, 269)), ((188, 241), (198, 245))]:
        cv2.line(led_glow, start, end, 1, 3)
    led_glow = cv2.GaussianBlur(led_glow, (0, 0), 5) * 2.6
    wisps = [smoke_wisp(i + 24) for i in range(9)]
    smoke_phase = (x * 0.017 + y * 0.049)
    ffmpeg = os.environ.get("FFMPEG") or shutil.which("ffmpeg")
    if not ffmpeg:
        import imageio_ffmpeg
        ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    args = [ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo",
            "-pix_fmt", "rgb24", "-s", f"{WIDTH}x{HEIGHT}", "-r", str(FPS), "-i", "-",
            "-an", "-c:v", "libx264", "-threads", "2", "-preset", "slow", "-crf", "22",
            "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(OUTPUT)]
    with subprocess.Popen(args, stdin=subprocess.PIPE) as encoder:
        for n in range(FPS * SECONDS):
            t = n / (FPS * SECONDS)
            phase = TAU * t
            curl = np.sin(smoke_phase + phase)
            ripple = np.cos(smoke_phase * 0.72 + 2 * phase)
            dx = plume * (6.5 * curl + 2.5 * ripple) + krake * (1.9 * math.sin(phase))
            dy = plume * (4.8 * ripple - 3.1 * curl) + krake * (4.8 * math.sin(phase))
            dx += grass * (3.6 * math.sin(2 * phase) + 1.4 * math.sin(phase))
            frame = cv2.remap(art, x + dx, y + dy, cv2.INTER_LINEAR,
                              borderMode=cv2.BORDER_REFLECT_101).astype(np.float32)
            # Each parcel fades in at the engine and drifts left into the larger plume.
            for i, wisp in enumerate(wisps):
                age = (t + i / len(wisps)) % 1
                wind = math.sin(TAU * (age + i * 0.31))
                cx = 232 - 197 * age + 12 * wind * age
                cy = 217 - 248 * age - 7 * math.sin(TAU * age)
                opacity = 0.67 * math.sin(math.pi * age) ** 0.85
                blend_wisp(frame, wisp, cx, cy, 9 + 48 * age, sky, opacity)
            pulse = (0.5 + 0.5 * math.cos(phase * 2)) ** 6
            frame += led_glow[..., None] * np.array([100, 34, 20], np.float32) * pulse
            encoder.stdin.write(np.uint8(np.clip(frame, 0, 255)).tobytes())
        encoder.stdin.close()
        if encoder.wait():
            raise RuntimeError("FFmpeg could not encode the landing loop")


if __name__ == "__main__":
    main()
