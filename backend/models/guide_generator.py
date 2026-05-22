# backend/models/guide_generator.py


# =========================================================
# 1. 의류 클래스 한글명
# =========================================================

CLS_KOREAN = {
    "T_shirt": "티셔츠",
    "denim": "데님",
    "knit": "니트",
    "pants": "바지",
    "shirt": "셔츠",
}


# =========================================================
# 2. YOLO 클래스명 API 스펙에 맞게 보정
# =========================================================

SYMBOL_CLS_MAP = {
    # YOLO 모델이 squeezer / no_squeezer로 학습된 경우
    # api_spec_final.json의 squeeze / no_squeeze로 변환
    "squeezer": "squeeze",
    "no_squeezer": "no_squeeze",

    # 이미 API 스펙과 맞는 이름
    "machine_wash": "machine_wash",
    "hand_wash": "hand_wash",
    "no_wash": "no_wash",
    "bleach": "bleach",
    "no_bleach": "no_bleach",
    "tumble_dry": "tumble_dry",
    "no_tumble_dry": "no_tumble_dry",
    "natural_dry": "natural_dry",
    "iron": "iron",
    "no_iron": "no_iron",
    "dry_clean": "dry_clean",
    "no_dry_clean": "no_dry_clean",
    "squeeze": "squeeze",
    "no_squeeze": "no_squeeze",
    "flame_warning": "flame_warning",
}


def normalize_symbol_cls(symbol_cls):
    """
    YOLO 클래스명을 api_spec_final.json의 enum에 맞게 변환합니다.
    """

    return SYMBOL_CLS_MAP.get(symbol_cls, symbol_cls)


# =========================================================
# 3. subclass가 null일 때도 modelSummary에 넣을 기본 문구
# =========================================================

SYMBOL_SUMMARY_TEXT = {
    "machine_wash": "기계 세탁 가능",
    "hand_wash": "손세탁 권장",
    "no_wash": "물세탁 금지",
    "bleach": "표백 가능",
    "no_bleach": "표백 금지",
    "tumble_dry": "건조기 사용 가능",
    "no_tumble_dry": "건조기 사용 금지",
    "natural_dry": "자연건조 권장",
    "iron": "다림질 가능",
    "no_iron": "다림질 금지",
    "dry_clean": "드라이클리닝 가능",
    "no_dry_clean": "드라이클리닝 금지",
    "squeeze": "짜기 가능",
    "no_squeeze": "짜기 금지",
    "flame_warning": "화기 주의",
}


# =========================================================
# 4. OCR 텍스트 기반 subclass 추론
# =========================================================

def infer_symbol_subclass(symbol_cls, ocr_text):
    """
    YOLO class + OCR text를 이용해 subclass를 확정합니다.

    OCR 실패 또는 세부 분류를 확정할 수 없으면 None 반환.
    Python None은 FastAPI/JSON 응답에서 null로 변환됩니다.
    """

    symbol_cls = normalize_symbol_cls(symbol_cls)
    text = str(ocr_text or "").replace(" ", "")

    if not text:
        return None

    # machine_wash
    if symbol_cls == "machine_wash":
        if "95" in text:
            return "일반 세탁 (95℃)"
        if "60" in text:
            return "일반 세탁 (60℃)"
        if "40" in text or "50" in text:
            return "일반 세탁 (40℃~50℃)"
        if "30" in text:
            return "일반 세탁 (30℃ 이하)"
        return None

    # hand_wash
    if symbol_cls == "hand_wash":
        if "중성" in text:
            return "약하게 손세탁 (중성세제)"
        if "40" in text:
            return "손세탁 (40℃)"
        if "30" in text:
            return "손세탁 (30℃)"
        return None

    # bleach
    if symbol_cls == "bleach":
        if "염소" in text:
            return "염소계 표백"
        if "산소" in text:
            return "산소계 표백"
        return None

    # no_bleach
    if symbol_cls == "no_bleach":
        if "염소" in text:
            return "염소계 표백 금지"
        if "산소" in text:
            return "산소계 표백 금지"
        if "표백" in text:
            return "표백 금지"
        return None

    # tumble_dry
    if symbol_cls == "tumble_dry":
        if "60" in text:
            return "건조기 사용 가능 (60℃ 이하)"
        if "80" in text:
            return "건조기 사용 가능 (80℃ 이하)"
        return None

    # natural_dry
    if symbol_cls == "natural_dry":
        has_flat = "뉘" in text or "눕" in text or "평" in text
        has_hanger = "옷걸" in text or "걸어" in text
        has_sun = "햇빛" in text or "햇볕" in text
        has_shade = "그늘" in text

        if has_flat and has_sun:
            return "뉘어서 햇빛 건조"
        if has_flat and has_shade:
            return "뉘어서 그늘 건조"
        if has_hanger and has_sun:
            return "옷걸이에 걸어 햇빛 건조"
        if has_hanger and has_shade:
            return "옷걸이에 걸어 그늘 건조"

        return None

    # iron
    if symbol_cls == "iron":
        if "저온" in text or "120" in text:
            return "저온 다림질 (120℃)"
        if "중온" in text or "160" in text:
            return "중온 다림질 (160℃)"
        if "고온" in text or "210" in text:
            return "고온 다림질 (210℃)"
        return None

    # dry_clean
    if symbol_cls == "dry_clean":
        if "석유" in text:
            return "석유계 드라이클리닝"
        if "메테인" in text or "메탄" in text:
            return "메테인계 드라이클리닝"
        if "실리콘" in text:
            return "실리콘계 드라이클리닝"
        if "드라이" in text:
            return "드라이클리닝"
        return None

    # squeeze
    if symbol_cls == "squeeze":
        if "약" in text or "짜" in text:
            return "약하게 짜기"
        return None

    # 아래 클래스들은 api_spec_final.json에서 subclass 예시가 null
    if symbol_cls in [
        "no_wash",
        "no_tumble_dry",
        "no_iron",
        "no_dry_clean",
        "no_squeeze",
        "flame_warning",
    ]:
        return None

    return None


# =========================================================
# 5. 유틸 함수
# =========================================================

def _get_clothing_name(clothing_result):
    cls = clothing_result.get("cls", "")
    return CLS_KOREAN.get(cls, cls)


def _dedup_keep_order(items):
    result = []
    seen = set()

    for item in items:
        item = str(item).strip()

        if not item:
            continue

        if item not in seen:
            seen.add(item)
            result.append(item)

    return result


# =========================================================
# 6. modelSummary 생성
# =========================================================

def generate_model_summary(clothing_result, label_type="none", symbols=None, ocr_result=None):
    """
    api_spec_final.json의 optional modelSummary 생성 함수.

    pipeline.py에서 호출합니다.
    """

    clothing_name = _get_clothing_name(clothing_result)
    symbols = symbols or []
    ocr_result = ocr_result or {}

    # -----------------------------------------
    # labelType=none
    # -----------------------------------------
    if label_type == "none":
        return f"{clothing_name}로 판단됩니다."

    # -----------------------------------------
    # labelType=symbol
    # -----------------------------------------
    if label_type == "symbol":
        symbol_texts = []

        for item in symbols:
            cls = normalize_symbol_cls(item.get("cls"))
            subclass = item.get("subclass")

            if subclass:
                symbol_texts.append(subclass)
            else:
                fallback_text = SYMBOL_SUMMARY_TEXT.get(cls)
                if fallback_text:
                    symbol_texts.append(fallback_text)

        symbol_texts = _dedup_keep_order(symbol_texts)

        if symbol_texts:
            return f"{clothing_name}로 판단됩니다. " + " / ".join(symbol_texts) + "."

        return f"{clothing_name}로 판단됩니다."

    # -----------------------------------------
    # labelType=ocr
    # -----------------------------------------
    if label_type == "ocr":
        parts = []

        care = ocr_result.get("care", [])
        prohibitions = ocr_result.get("prohibitions", [])
        warning = ocr_result.get("warning", [])

        if care:
            parts.extend(care[:2])

        if prohibitions:
            parts.extend(prohibitions[:2])

        if warning:
            parts.extend(warning[:1])

        parts = _dedup_keep_order(parts)

        if parts:
            return f"{clothing_name}로 판단됩니다. " + " / ".join(parts) + "."

        return f"{clothing_name}로 판단됩니다."

    return f"{clothing_name}로 판단됩니다."