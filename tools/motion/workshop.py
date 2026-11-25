"""Render the silent workshop loop from its illustration (NumPy, OpenCV and FFmpeg)."""

import math
import shutil
import subprocess
from pathlib import Path

import cv2
import numpy as np


ROOT = Path(__file__).resolve().parents[2]
WIDTH, HEIGHT = 540, 960
FPS, SECONDS = 24, 6
TAU = 2 * math.pi


def soft_region(shape, points, feather):
    """Feather an articulated piece into its surroundings for continuous mesh motion."""
    mask = np.zeros(shape, np.float32)
    cv2.fillPoly(mask, [np.array(points, np.int32)], 1)
    return cv2.GaussianBlur(mask, (0, 0), feather)


def ffmpeg_path():
    binary = shutil.which("ffmpeg")
    if binary:
        return binary
    from imageio_ffmpeg import get_ffmpeg_exe
    return get_ffmpeg_exe()


def render():
    image = cv2.imread(str(ROOT / "public/assets/scene-workshop.png"))
    frame = cv2.resize(image, (WIDTH, HEIGHT), interpolation=cv2.INTER_AREA)
    # The bench hides the lower tentacles. Only the visible cast and displays move.
    stage = frame[:480].copy()
    y, x = np.indices(stage.shape[:2], dtype=np.float32)

    krake = soft_region(x.shape, [(208, 191), (254, 145), (299, 188), (309, 226),
                                 (299, 266), (307, 282), (234, 283), (200, 264)], 9)
    stylus = soft_region(x.shape, [(282, 260), (305, 248), (312, 229), (334, 196),
                                  (350, 201), (344, 253), (324, 276), (296, 277)], 6)
    curl = soft_region(x.shape, [(161, 194), (176, 182), (201, 188), (221, 211),
                                (215, 244), (230, 261), (208, 268), (177, 250),
                                (177, 218), (165, 214)], 5)
    mechanic = soft_region(x.shape, [(402, 210), (451, 199), (530, 198), (538, 242),
                                    (506, 268), (476, 283), (454, 310), (414, 293),
                                    (399, 277)], 9)
    glove = soft_region(x.shape, [(321, 285), (341, 273), (349, 255), (365, 260),
                                 (386, 280), (401, 306), (389, 326), (369, 316),
                                 (353, 311), (321, 317)], 5)

    # Both holograms follow the slant of their physical screens.
    bench_display = soft_region(x.shape, [(355, 393), (458, 383), (448, 455), (341, 464)], 1)
    wall_display = soft_region(x.shape, [(394, 66), (536, 36), (536, 122), (394, 145)], 1)
    optic = np.exp(-((x - 275) ** 2 + (y - 249) ** 2) / 36)
    cyan = np.array([55, 38, 7], dtype=np.float32)

    target = ROOT / "public/assets/motion/workshop.mp4"
    target.parent.mkdir(parents=True, exist_ok=True)
    command = [ffmpeg_path(), "-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo",
               "-pixel_format", "bgr24", "-video_size", f"{WIDTH}x{HEIGHT}",
               "-framerate", str(FPS), "-i", "-", "-an", "-c:v", "libx264",
               "-preset", "medium", "-crf", "21", "-pix_fmt", "yuv420p",
               "-movflags", "+faststart", str(target)]
    with subprocess.Popen(command, stdin=subprocess.PIPE) as encoder:
        for index in range(FPS * SECONDS):
            phase = TAU * index / (FPS * SECONDS)
            hover = math.sin(phase)
            gesture = math.sin(phase * 2)
            nod = (1 - math.cos(phase)) / 2
            # Soft inverse maps articulate each part about its own joint. All weights
            # run to zero at the bench and surrounding characters, preserving occlusion.
            dx = (2.6 * hover * krake + ((y - 268) * .16 * gesture) * stylus
                  - 2.8 * hover * curl + ((y - 290) * .055 * nod) * mechanic
                  + 2.7 * gesture * glove)
            dy = (6.1 * hover * krake + (2.8 * hover - (x - 294) * .13 * gesture) * stylus
                  + 5.2 * hover * curl + (5.3 - (x - 451) * .055) * nod * mechanic
                  + (x - 397) * .12 * gesture * glove)
            surface = cv2.remap(stage, x + dx, y + dy, cv2.INTER_LINEAR,
                                borderMode=cv2.BORDER_REPLICATE).astype(np.float32)
            for screen, origin, offset, slope, travel in [(bench_display, 355, 390, .09, 73),
                                                          (wall_display, 394, 65, .21, 84)]:
                scan_phase = TAU * ((y - offset + (x - origin) * slope) / travel) - phase * 2
                scan = np.exp((np.cos(scan_phase) - 1) * 30)
                surface += (screen * scan)[:, :, None] * cyan
            glow = cv2.remap(optic, x + dx, y + dy, cv2.INTER_LINEAR)
            surface[:, :, 2] += glow * (20 + 16 * math.sin(phase * 2))
            frame[:stage.shape[0]] = np.clip(surface, 0, 255).astype(np.uint8)
            encoder.stdin.write(frame.tobytes())
        encoder.stdin.close()
        if encoder.wait() != 0:
            raise RuntimeError("FFmpeg could not encode the workshop.")


if __name__ == "__main__":
    render()
