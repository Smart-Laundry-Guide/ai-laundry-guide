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

def _contains_all(text, keywords):
    return all(keyword in text for keyword in keywords)


def _contains_any(text, keywords):
    return any(keyword in text for keyword in keywords)


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

    # =====================================================
    # 1. machine_wash
    # =====================================================
    if symbol_cls == "machine_wash":
        # 복합 조건 먼저 판단
        if _contains_all(text, ["30", "약", "중성"]):
            return "30°C 약하게 세탁 (중성세제)"
        if _contains_all(text, ["30", "매우"]):
            return "30°C 매우 약하게 세탁"
        if _contains_all(text, ["30", "약"]):
            return "30°C 약하게 세탁"

        if _contains_all(text, ["40", "매우"]):
            return "40°C 매우 약하게 세탁"
        if _contains_all(text, ["40", "약"]):
            return "40°C 약하게 세탁"

        if _contains_all(text, ["50", "약"]):
            return "50°C 약하게 세탁"

        if _contains_all(text, ["60", "약"]):
            return "60°C 약하게 세탁"

        # 온도만 있는 경우
        if "95" in text:
            return "95°C 일반 세탁"
        if "70" in text:
            return "70°C 일반 세탁"
        if "60" in text:
            return "60°C 일반 세탁"
        if "50" in text:
            return "50°C 일반 세탁"
        if "40" in text:
            return "40°C 일반 세탁"
        if "30" in text:
            return "30°C 일반 세탁"

        return None

    # =====================================================
    # 2. hand_wash
    # =====================================================
    if symbol_cls == "hand_wash":
        if _contains_all(text, ["40", "약", "중성"]):
            return "40°C 중성세제로 약하게 손세탁"
        if _contains_all(text, ["30", "약", "중성"]):
            return "30°C 중성세제로 약하게 손세탁"

        if _contains_all(text, ["40", "중성"]):
            return "40°C 중성세제로 손세탁"
        if _contains_all(text, ["30", "중성"]):
            return "30°C 중성세제로 손세탁"

        if _contains_all(text, ["40", "약"]):
            return "40°C 약하게 손세탁"
        if _contains_all(text, ["30", "약"]):
            return "30°C 약하게 손세탁"

        if "40" in text:
            return "40°C 손세탁"
        if "30" in text:
            return "30°C 손세탁"

        return None

    # =====================================================
    # 3. bleach
    # =====================================================
    if symbol_cls == "bleach":
        if _contains_all(text, ["염소", "산소"]):
            return "염소·산소계 표백 가능"
        if "염소" in text:
            return "염소계 표백 가능"
        if "산소" in text:
            return "산소계 표백 가능"

        return None

    # =====================================================
    # 4. no_bleach
    # =====================================================
    if symbol_cls == "no_bleach":
        if _contains_all(text, ["염소", "산소"]):
            return "염소·산소계 표백 금지"
        if "염소" in text:
            return "염소계 표백 금지"
        if "산소" in text:
            return "산소계 표백 금지"
        if "표백" in text:
            return "표백 금지"

        return None

    # =====================================================
    # 5. tumble_dry
    # =====================================================
    if symbol_cls == "tumble_dry":
        if "80" in text:
            return "80℃ 이하 기계건조"
        if "60" in text:
            return "60℃ 이하 기계건조"

        return None

    # =====================================================
    # 6. natural_dry
    # =====================================================
    if symbol_cls == "natural_dry":
        has_flat = "뉘" in text or "눕" in text or "평" in text
        has_hanger = "옷걸" in text or "걸어" in text
        has_sun = "햇빛" in text or "햇볕" in text
        has_shade = "그늘" in text
        has_no_spin = "비탈수" in text or "탈수없이" in text

        if has_flat and has_no_spin:
            return "탈수 없이 뉘어서 그늘 건조"
        if has_hanger and has_no_spin:
            return "탈수 없이 옷걸이 그늘 건조"

        if has_flat and has_sun:
            return "뉘어서 햇빛 건조"
        if has_flat and has_shade:
            return "뉘어서 그늘 건조"
        if has_hanger and has_sun:
            return "옷걸이에 걸어 햇빛 건조"
        if has_hanger and has_shade:
            return "옷걸이에 걸어 그늘 건조"

        if has_flat:
            return "뉘어서 그늘 건조"
        if has_hanger:
            return "옷걸이에 걸어 그늘 건조"
        if has_shade:
            return "그늘 건조"
        if has_sun:
            return "햇빛 건조"

        return None

    # =====================================================
    # 7. iron
    # =====================================================
    if symbol_cls == "iron":
        if "3" in text or "210" in text or "고온" in text:
            return "고온 다림질 (210℃ 이하)"
        if "2" in text or "160" in text or "중온" in text:
            return "중온 다림질 (160℃ 이하)"
        if "1" in text or "120" in text or "저온" in text:
            return "저온 다림질 (120℃ 이하)"

        return None

    # =====================================================
    # 8. dry_clean
    # =====================================================
    if symbol_cls == "dry_clean":
        if "석유" in text:
            return "석유계 드라이클리닝"
        if "메테인" in text or "메탄" in text:
            return "메테인계 드라이클리닝"
        if "실리콘" in text:
            return "실리콘계 드라이클리닝"
        if "전문" in text:
            return "특수 전문점 드라이클리닝"
        if "드라이" in text:
            return "드라이클리닝"

        return None

    # =====================================================
    # 9. squeeze
    # =====================================================
    if symbol_cls == "squeeze":
        if "약" in text or "짜" in text:
            return "약하게 짜기"

        return None

    # =====================================================
    # 10. subclass가 없는 금지/주의 계열
    # =====================================================
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