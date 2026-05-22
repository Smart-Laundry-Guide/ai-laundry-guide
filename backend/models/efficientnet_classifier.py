from pathlib import Path
from io import BytesIO

import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image


# 현재 파일 위치:
# LAUNDRY-GUIDE/backend/models/efficientnet_classifier.py
ROOT_DIR = Path(__file__).resolve().parents[2]

# 모델 파일 위치:
# LAUNDRY-GUIDE/model_weights/EfficientNet_B0_final.pth
MODEL_PATH = ROOT_DIR / "model_weights" / "EfficientNet_B0_final.pth"

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# final_efficientnet_b0.py 기준 5개 클래스
# 학습 코드에서 ImageFolder(RAW_DIR)를 사용했기 때문에 보통 폴더명 정렬 순서입니다.
# 팀원이 Colab 출력값 "클래스 순서:"를 알려주면 그 순서와 반드시 맞추세요.
CLASS_NAMES = ["T_shirt", "denim", "knit", "pants", "shirt"]


_model = None


def _load_model():
    """
    EfficientNet_B0_final.pth 모델을 한 번만 로드해서 재사용합니다.
    """

    global _model

    if _model is not None:
        return _model

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"EfficientNet 모델 파일을 찾을 수 없습니다: {MODEL_PATH}"
        )

    # EfficientNet-B0 구조 생성
    model = models.efficientnet_b0(weights=None)

    # final_efficientnet_b0.py에서 출력층을 NUM_CLASSES개로 변경했음
    model.classifier[1] = nn.Linear(1280, len(CLASS_NAMES))

    # 저장된 state_dict 불러오기
    state_dict = torch.load(MODEL_PATH, map_location=DEVICE)

    # 모델에 가중치 적용
    model.load_state_dict(state_dict)

    model.to(DEVICE)
    model.eval()

    _model = model
    return _model


def _bytes_to_pil_image(image_bytes):
    """
    이미지 bytes를 PIL Image로 변환합니다.
    """

    return Image.open(BytesIO(image_bytes)).convert("RGB")


def _get_transform():
    """
    학습 코드의 추론 transform과 동일하게 맞춥니다.
    Resize(224, 224) → ToTensor → Normalize
    """

    return transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(
            [0.485, 0.456, 0.406],
            [0.229, 0.224, 0.225]
        )
    ])


def predict_clothing(clothing_bytes):
    """
    의류 이미지 bytes를 받아 EfficientNet-B0로 의류 종류를 예측합니다.

    반환 형식:
    {
        "cls": "knit",
        "confidence": 0.91,
        "topCandidates": [
            {"cls": "knit", "confidence": 0.91},
            {"cls": "shirt", "confidence": 0.07}
        ]
    }
    """

    model = _load_model()
    transform = _get_transform()

    image = _bytes_to_pil_image(clothing_bytes)
    tensor = transform(image).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        output = model(tensor)
        probabilities = torch.softmax(output, dim=1)[0]

    # 확률 높은 상위 2개 클래스 반환
    top_values, top_indices = probabilities.topk(2)

    top_candidates = []

    for value, index in zip(top_values, top_indices):
        idx = int(index.item())
        cls_name = CLASS_NAMES[idx]
        confidence = float(value.item())

        top_candidates.append({
            "cls": cls_name,
            "confidence": round(confidence, 4)
        })

    best = top_candidates[0]

    return {
        "cls": best["cls"],
        "confidence": best["confidence"],
        "topCandidates": top_candidates
    }