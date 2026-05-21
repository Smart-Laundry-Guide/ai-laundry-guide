from models.efficientnet_classifier import predict_clothing
from models.yolo_detector import detect_symbols
from models.ocr_extractor import extract_symbol_text, extract_caution_text
from models.guide_generator import (
    normalize_symbol_cls,
    infer_symbol_subclass,
    generate_model_summary
)


def _get_top_candidates(clothing_result):
    """
    api_spec_final.json 기준:
    topCandidates는 항상 2개 반환.
    EfficientNet 결과에서 cls, confidence만 추려서 반환한다.
    """

    top_candidates = clothing_result.get("topCandidates", [])

    if not top_candidates:
        top_candidates = [
            {
                "cls": clothing_result.get("cls"),
                "confidence": clothing_result.get("confidence", 0)
            }
        ]

    cleaned = []

    for item in top_candidates[:2]:
        cleaned.append({
            "cls": item.get("cls"),
            "confidence": item.get("confidence")
        })

    return cleaned


def _dedup_symbols(symbols):
    """
    같은 cls + subclass 조합이 반복되면 하나만 남긴다.

    예:
    [
        {"cls": "iron", "subclass": None},
        {"cls": "iron", "subclass": None}
    ]
    →
    [
        {"cls": "iron", "subclass": None}
    ]
    """

    result = []
    seen = set()

    for symbol in symbols:
        key = (
            symbol.get("cls"),
            symbol.get("subclass")
        )

        if key in seen:
            continue

        seen.add(key)
        result.append(symbol)

    return result


def run_pipeline(clothing_bytes, label_bytes=None, label_type="none"):
    """
    전체 모델 통합 실행 함수.

    입력:
        clothing_bytes:
            의류 이미지 bytes

        label_bytes:
            라벨 이미지 bytes

        label_type:
            "none", "symbol", "ocr"

    반환:
        api_spec_final.json 기준 최종 JSON

        label_type="none":
        {
            "topCandidates": [...],
            "modelSummary": "..."
        }

        label_type="symbol":
        {
            "topCandidates": [...],
            "symbols": [
                {"cls": "...", "subclass": "... 또는 None"}
            ],
            "modelSummary": "..."
        }

        label_type="ocr":
        {
            "topCandidates": [...],
            "ocrResult": {
                "materials": [],
                "care": [],
                "prohibitions": [],
                "warning": []
            },
            "modelSummary": "..."
        }
    """

    # 1. EfficientNet 의류 분류
    clothing_result = predict_clothing(clothing_bytes)
    top_candidates = _get_top_candidates(clothing_result)

    # 2. label_type = none
    # 의류 사진만 있는 경우
    if label_type == "none":
        model_summary = generate_model_summary(
            clothing_result=clothing_result,
            label_type="none"
        )

        return {
            "topCandidates": top_candidates,
            "modelSummary": model_summary
        }

    # 3. label_type = symbol
    # 세탁기호 라벨인 경우: YOLO + 기호 내부 OCR
    elif label_type == "symbol":
        if label_bytes is None:
            raise ValueError("label_type이 'symbol'이면 label_bytes가 필요합니다.")

        detected_symbols = detect_symbols(label_bytes)

        symbols = []

        for symbol in detected_symbols:
            raw_cls = symbol.get("cls")
            api_cls = normalize_symbol_cls(raw_cls)

            crop_img = symbol.get("crop")

            if crop_img is not None:
                ocr_text = extract_symbol_text(crop_img)
            else:
                ocr_text = ""

            subclass = infer_symbol_subclass(api_cls, ocr_text)

            symbols.append({
                "cls": api_cls,
                "subclass": subclass
            })

        # 같은 기호가 중복 탐지된 경우 제거
        symbols = _dedup_symbols(symbols)

        model_summary = generate_model_summary(
            clothing_result=clothing_result,
            label_type="symbol",
            symbols=symbols
        )

        return {
            "topCandidates": top_candidates,
            "symbols": symbols,
            "modelSummary": model_summary
        }

    # 4. label_type = ocr
    # 텍스트 라벨인 경우: 전체 라벨 OCR
    elif label_type == "ocr":
        if label_bytes is None:
            raise ValueError("label_type이 'ocr'이면 label_bytes가 필요합니다.")

        ocr_result = extract_caution_text(label_bytes)

        # api_spec_final.json 기준 key만 남김
        api_ocr_result = {
            "materials": ocr_result.get("materials", []),
            "care": ocr_result.get("care", []),
            "prohibitions": ocr_result.get("prohibitions", []),
            "warning": ocr_result.get("warning", ocr_result.get("warnings", []))
        }

        model_summary = generate_model_summary(
            clothing_result=clothing_result,
            label_type="ocr",
            ocr_result=api_ocr_result
        )

        return {
            "topCandidates": top_candidates,
            "ocrResult": api_ocr_result,
            "modelSummary": model_summary
        }

    else:
        raise ValueError("label_type은 'none', 'symbol', 'ocr' 중 하나여야 합니다.")