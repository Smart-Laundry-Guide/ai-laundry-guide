from pathlib import Path
from io import BytesIO

import numpy as np
from PIL import Image
from ultralytics import YOLO


# 현재 파일 위치:
# LAUNDRY-GUIDE/backend/models/yolo_detector.py
ROOT_DIR = Path(__file__).resolve().parents[2]

# YOLO 모델 파일 위치:
# LAUNDRY-GUIDE/model_weights/symbol_detector/best.pt
MODEL_PATH = ROOT_DIR / "model_weights" / "symbol_detector" / "best.pt"


_yolo_model = None


def _load_yolo_model():
    """
    YOLO 모델을 한 번만 로드해서 재사용합니다.
    """

    global _yolo_model

    if _yolo_model is not None:
        return _yolo_model

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"YOLO 모델 파일을 찾을 수 없습니다: {MODEL_PATH}"
        )

    _yolo_model = YOLO(str(MODEL_PATH))
    return _yolo_model


def _bytes_to_numpy_rgb(image_bytes):
    """
    이미지 bytes를 numpy RGB 이미지로 변환합니다.
    """

    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    return np.array(image)


def detect_symbols(label_bytes, conf_threshold=0.25):
    """
    라벨 이미지 bytes를 받아 YOLO로 세탁기호를 탐지합니다.

    반환 형식:
    [
        {
            "cls": "hand_wash",
            "confidence": 0.92,
            "bbox": [x1, y1, x2, y2],
            "crop": crop_image
        }
    ]

    crop은 OCR에 넘기기 위한 중간 이미지입니다.
    최종 JSON에는 crop을 넣으면 안 됩니다.
    """

    model = _load_yolo_model()
    image_np = _bytes_to_numpy_rgb(label_bytes)

    results = model(image_np, conf=conf_threshold)

    detected_symbols = []

    if len(results) == 0:
        return detected_symbols

    result = results[0]

    if result.boxes is None:
        return detected_symbols

    names = result.names
    height, width = image_np.shape[:2]

    for box in result.boxes:
        cls_id = int(box.cls[0].item())
        confidence = float(box.conf[0].item())

        x1, y1, x2, y2 = box.xyxy[0].tolist()
        x1, y1, x2, y2 = map(int, [x1, y1, x2, y2])

        # 이미지 범위 밖으로 나가지 않게 보정
        x1 = max(0, min(x1, width - 1))
        y1 = max(0, min(y1, height - 1))
        x2 = max(0, min(x2, width))
        y2 = max(0, min(y2, height))

        # 잘못된 bbox 방지
        if x2 <= x1 or y2 <= y1:
            continue

        crop = image_np[y1:y2, x1:x2]

        detected_symbols.append({
            "cls": names[cls_id],
            "confidence": round(confidence, 4),
            "bbox": [x1, y1, x2, y2],
            "crop": crop
        })

    # 라벨에서 왼쪽 → 오른쪽 순서로 정렬
    detected_symbols.sort(key=lambda item: item["bbox"][0])

    return detected_symbols