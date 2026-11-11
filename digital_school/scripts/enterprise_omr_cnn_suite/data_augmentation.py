"""
Enterprise Data Augmentation Engine for Realistic Smartphone & Human OMR Captures
Simulates:
- 3D perspective warp & phone inclination (angles up to 25 degrees)
- Non-uniform lighting gradients & LED flashlight hot-spots
- Phone & hand shadow occlusions
- Mechanical paper wrinkles, folds, and perforation tears
- Human marking imperfections (pencil shine, tick marks, cross marks, over-fills, double-marks)
- Sensor motion blur, defocus blur, and JPEG compression artifacts
"""

import math
import random
import numpy as np
import cv2


class PhysicalAugmentationPipeline:
    def __init__(self, seed=42):
        self.rng = random.Random(seed)
        self.np_rng = np.random.RandomState(seed)

    def apply_3d_perspective_tilt(self, image, max_tilt_deg=18, max_rot_deg=12):
        """
        Simulates holding a smartphone camera at an angle above the desk.
        """
        h, w = image.shape[:2]
        # Random angles
        rot_angle = self.rng.uniform(-max_rot_deg, max_rot_deg)
        tilt_x = self.rng.uniform(-max_tilt_deg, max_tilt_deg)
        tilt_y = self.rng.uniform(-max_tilt_deg, max_tilt_deg)

        # 4 source corners
        src_pts = np.float32([[0, 0], [w, 0], [w, h], [0, h]])

        # Displacement based on tilts
        dx1 = w * (tilt_y / 90.0) * 0.4
        dx2 = -w * (tilt_y / 90.0) * 0.4
        dy1 = h * (tilt_x / 90.0) * 0.4
        dy2 = -h * (tilt_x / 90.0) * 0.4

        dst_pts = np.float32([
            [max(0, dx1), max(0, dy1)],
            [w - max(0, -dx1), max(0, -dy1)],
            [w - max(0, -dx2), h - max(0, -dy2)],
            [max(0, dx2), h - max(0, dy2)]
        ])

        M = cv2.getPerspectiveTransform(src_pts, dst_pts)
        warped = cv2.warpPerspective(image, M, (w, h), borderValue=(240, 240, 240))

        # Add 2D in-plane rotation
        rot_mat = cv2.getRotationMatrix2D((w / 2, h / 2), rot_angle, 0.95)
        warped = cv2.warpAffine(warped, rot_mat, (w, h), borderValue=(240, 240, 240))
        return warped, M, rot_mat

    def apply_lighting_and_shadows(self, image, add_flash=True, add_shadow=True):
        """
        Simulates ambient room light gradient, smartphone camera flash glare,
        and hands/phone casting a shadow over the test sheet.
        """
        h, w = image.shape[:2]
        result = image.astype(np.float32)

        # 1. Directional illumination gradient (e.g. overhead fluorescent tube)
        angle = self.rng.uniform(0, 2 * math.pi)
        x_coords = np.linspace(-1, 1, w)
        y_coords = np.linspace(-1, 1, h)
        xx, yy = np.meshgrid(x_coords, y_coords)
        grad = xx * math.cos(angle) + yy * math.sin(angle)
        light_mod = 0.85 + 0.30 * (grad + 1.0) / 2.0  # multiplier in [0.85, 1.15]
        result = result * light_mod[:, :, np.newaxis]

        # 2. Smartphone LED Flash Glare (central/offset radial hotspot)
        if add_flash and self.rng.random() > 0.4:
            cx = self.rng.uniform(0.3 * w, 0.7 * w)
            cy = self.rng.uniform(0.2 * h, 0.6 * h)
            radius = self.rng.uniform(0.25 * w, 0.5 * w)
            intensity = self.rng.uniform(25.0, 55.0)

            dist_sq = (xx * (w / 2) + w / 2 - cx) ** 2 + (yy * (h / 2) + h / 2 - cy) ** 2
            flash_mask = np.exp(-dist_sq / (2 * (radius ** 2))) * intensity
            result += flash_mask[:, :, np.newaxis]

        # 3. Hand or Smartphone Shadow (semi-transparent dark polygonal band)
        if add_shadow and self.rng.random() > 0.3:
            shadow_mask = np.ones((h, w), dtype=np.float32)
            # Create polygon for shadow
            pts = np.array([
                [self.rng.uniform(0, 0.3 * w), 0],
                [self.rng.uniform(0.5 * w, 0.9 * w), 0],
                [self.rng.uniform(0.3 * w, 0.7 * w), h],
                [0, self.rng.uniform(0.4 * h, 0.9 * h)]
            ], dtype=np.int32)
            cv2.fillPoly(shadow_mask, [pts], 0.65)
            # Blur shadow edges for realistic penumbra
            shadow_mask = cv2.GaussianBlur(shadow_mask, (51, 51), 25)
            result = result * shadow_mask[:, :, np.newaxis]

        return np.clip(result, 0, 255).astype(np.uint8)

    def apply_folds_and_wrinkles(self, image):
        """
        Simulates paper crease lines (folding down middle or along perforation)
        and subtle 3D paper curvature wrinkles.
        """
        h, w = image.shape[:2]
        img = image.copy()

        # Fold line across center or horizontal third
        if self.rng.random() > 0.4:
            fold_y = int(self.rng.uniform(0.25 * h, 0.75 * h))
            crease_thickness = self.rng.randint(2, 4)
            # Dark crease shadow
            cv2.line(img, (0, fold_y), (w, fold_y), (140, 140, 140), crease_thickness)
            # Adjacent highlight line
            cv2.line(img, (0, fold_y + crease_thickness), (w, fold_y + crease_thickness), (255, 255, 255), 1)

        # Perforation tear or fraying on left border
        if self.rng.random() > 0.5:
            for y_step in range(40, h - 40, 45):
                cv2.circle(img, (12, y_step), 3, (200, 200, 200), -1)

        return img

    def apply_sensor_noise_and_blur(self, image, motion_blur=True, defocus_blur=True, jpeg_artifacts=True):
        """
        Simulates phone camera motion blur (hand tremor), slight defocus,
        and aggressive JPEG compression.
        """
        img = image.copy()

        # 1. Defocus or Motion Blur
        if motion_blur and self.rng.random() > 0.4:
            kernel_size = self.rng.choice([3, 5, 7])
            kernel = np.zeros((kernel_size, kernel_size))
            if self.rng.random() > 0.5:
                # Diagonal motion
                np.fill_diagonal(kernel, 1.0 / kernel_size)
            else:
                # Horizontal tremor
                kernel[int((kernel_size - 1) / 2), :] = 1.0 / kernel_size
            img = cv2.filter2D(img, -1, kernel)
        elif defocus_blur and self.rng.random() > 0.3:
            k = self.rng.choice([3, 5])
            img = cv2.GaussianBlur(img, (k, k), 1.2)

        # 2. Additive Sensor Shot Noise
        noise = self.np_rng.normal(0, self.rng.uniform(2.0, 7.0), img.shape).astype(np.float32)
        img = np.clip(img.astype(np.float32) + noise, 0, 255).astype(np.uint8)

        # 3. JPEG compression artifact
        if jpeg_artifacts:
            quality = self.rng.randint(45, 85)
            encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), quality]
            _, enc = cv2.imencode('.jpg', img, encode_param)
            img = cv2.imdecode(enc, 1)

        return img

    def render_student_bubble_fill(self, image, cx, cy, radius, fill_type="SOLID_PEN"):
        """
        Simulates realistic human bubble marking styles:
        - SOLID_PEN: Solid black/blue ballpoint ink
        - PENCIL: Graphite fill with subtle texture
        - TICK_MARK: Human checkmark (✔)
        - CROSS_MARK: Human X mark (✖)
        - PARTIAL_FILL: Half-filled or faint circle
        - OVERFILL: Ink spills beyond outer boundary
        """
        cx, cy, r = int(cx), int(cy), int(radius)
        ink_color = self.rng.choice([(25, 20, 20), (35, 30, 25), (40, 25, 15)])  # black / dark blue ink

        if fill_type == "SOLID_PEN":
            # Dark solid fill with slightly jittered radius
            cv2.circle(image, (cx, cy), int(r * self.rng.uniform(0.85, 0.98)), ink_color, -1)
        elif fill_type == "PENCIL":
            # Graphite pencil: slightly grayer with noise
            pencil_color = (self.rng.randint(65, 95), self.rng.randint(65, 95), self.rng.randint(65, 95))
            cv2.circle(image, (cx, cy), int(r * 0.9), pencil_color, -1)
        elif fill_type == "OVERFILL":
            # Student vigorously fills outside border
            cv2.circle(image, (cx, cy), int(r * self.rng.uniform(1.15, 1.35)), ink_color, -1)
        elif fill_type == "PARTIAL_FILL":
            # Student only puts small dot or half moon in center
            cv2.circle(image, (cx + self.rng.randint(-2, 2), cy + self.rng.randint(-2, 2)), int(r * 0.45), ink_color, -1)
        elif fill_type == "TICK_MARK":
            # Checkmark ✔
            p1 = (cx - int(r * 0.6), cy)
            p2 = (cx - int(r * 0.1), cy + int(r * 0.6))
            p3 = (cx + int(r * 0.7), cy - int(r * 0.7))
            cv2.line(image, p1, p2, ink_color, thickness=2)
            cv2.line(image, p2, p3, ink_color, thickness=2)
        elif fill_type == "CROSS_MARK":
            # X mark ✖
            p1 = (cx - int(r * 0.6), cy - int(r * 0.6))
            p2 = (cx + int(r * 0.6), cy + int(r * 0.6))
            p3 = (cx - int(r * 0.6), cy + int(r * 0.6))
            p4 = (cx + int(r * 0.6), cy - int(r * 0.6))
            cv2.line(image, p1, p2, ink_color, thickness=2)
            cv2.line(image, p3, p4, ink_color, thickness=2)

        return image
