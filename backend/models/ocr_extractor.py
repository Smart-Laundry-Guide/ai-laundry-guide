from io import BytesIO
import re

import cv2
import numpy as np
from PIL import Image
from paddleocr import PaddleOCR


# =========================================================
# 0. PaddleOCR 로드
# =========================================================

_ocr = None


def _load_ocr():
    """
    PaddleOCR 모델을 한 번만 로드해서 재사용합니다.
    """

    global _ocr

    if _ocr is not None:
        return _ocr

    try:
        # PaddleOCR 3.x 기준
        _ocr = PaddleOCR(
            lang="korean",
            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
            use_textline_orientation=False,
            enable_mkldnn=False
        )
    except TypeError:
        # 혹시 버전 차이로 위 옵션이 안 먹을 때 대비
        _ocr = PaddleOCR(
            lang="korean",
            enable_mkldnn=False
        )

    return _ocr


# =========================================================
# 1. 이미지 입력 변환
# =========================================================

def _bytes_to_numpy_rgb(image_bytes):
    """
    이미지 bytes를 numpy RGB 이미지로 변환합니다.
    """

    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    return np.array(image)


def _normalize_image_input(image_input):
    """
    입력을 numpy RGB 이미지로 통일합니다.

    label_bytes: bytes
    YOLO crop: numpy.ndarray
    """

    if isinstance(image_input, bytes):
        return _bytes_to_numpy_rgb(image_input)

    if isinstance(image_input, np.ndarray):
        return image_input

    raise TypeError("OCR 입력은 bytes 또는 numpy.ndarray여야 합니다.")


# =========================================================
# 2. OCR 결과 추출
# =========================================================

def extract_ocr_info(results):
    """
    PaddleOCR 결과에서 텍스트, confidence, line_texts를 추출합니다.
    기존 Colab 코드의 extract_ocr_info를 파이프라인용으로 정리한 함수입니다.
    """

    all_texts = []
    all_scores = []

    if results is None:
        return {
            "raw_text": "인식된 글자 없음",
            "avg_conf": 0.0,
            "token_count": 0,
            "char_count_no_space": 0,
            "line_texts": [],
            "line_scores": [],
        }

    for res in results:
        texts = []
        scores = []

        # PaddleOCR 3.x predict 결과: res.json 내부에 rec_texts / rec_scores가 있는 경우
        try:
            if hasattr(res, "json"):
                data = res.json.get("res", {})
                texts = data.get("rec_texts", [])
                scores = data.get("rec_scores", [])
        except Exception:
            pass

        # dict 형태로 반환되는 경우 대비
        if not texts and isinstance(res, dict):
            if "res" in res:
                data = res.get("res", {})
                texts = data.get("rec_texts", [])
                scores = data.get("rec_scores", [])
            else:
                texts = res.get("rec_texts", [])
                scores = res.get("rec_scores", [])

        # 구버전 ocr() 결과 형태 대비: [[box, (text, score)], ...]
        if not texts and isinstance(res, list):
            for line in res:
                try:
                    text = str(line[1][0]).strip()
                    score = float(line[1][1])

                    if text:
                        all_texts.append(text)
                        all_scores.append(score)
                except Exception:
                    continue

            continue

        for text, score in zip(texts, scores):
            text = str(text).strip()

            try:
                score = float(score)
            except Exception:
                score = 0.0

            if text:
                all_texts.append(text)
                all_scores.append(score)

    full_text = " ".join(all_texts).strip()
    avg_conf = float(np.mean(all_scores)) if all_scores else 0.0

    return {
        "raw_text": full_text if full_text else "인식된 글자 없음",
        "avg_conf": round(avg_conf, 4),
        "token_count": len(all_texts),
        "char_count_no_space": len(full_text.replace(" ", "")),
        "line_texts": all_texts,
        "line_scores": [round(x, 4) for x in all_scores],
    }


# =========================================================
# 3. OCR 전처리
# =========================================================

def resize_for_ocr(img, max_side=1800):
    """
    너무 큰 이미지는 OCR 속도를 위해 축소합니다.
    """

    h, w = img.shape[:2]
    scale = min(max_side / max(h, w), 1.0)

    if scale == 1.0:
        return img

    new_w = int(w * scale)
    new_h = int(h * scale)

    return cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)


def upscale_for_ocr(img, scale=2.0, max_side=2400):
    """
    YOLO crop처럼 작은 이미지는 OCR 전에 확대합니다.
    """

    h, w = img.shape[:2]

    new_w = int(w * scale)
    new_h = int(h * scale)

    if max(new_w, new_h) > max_side:
        ratio = max_side / max(new_w, new_h)
        new_w = int(new_w * ratio)
        new_h = int(new_h * ratio)

    return cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_CUBIC)


def to_3ch(gray):
    """
    grayscale 이미지를 RGB 3채널로 변환합니다.
    """

    return cv2.cvtColor(gray, cv2.COLOR_GRAY2RGB)


def make_preprocess_variants(raw_img, max_side=1800, use_upscale=False):
    """
    OCR 후보 이미지 생성:
    1. original
    2. clahe

    기존 코드의 original + CLAHE 구조를 유지합니다.
    """

    variants = []

    original = resize_for_ocr(raw_img, max_side=max_side)

    if use_upscale:
        original = upscale_for_ocr(original, scale=2.0, max_side=2400)

    variants.append(("original", original))

    gray = cv2.cvtColor(original, cv2.COLOR_RGB2GRAY)

    clahe = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8)
    )

    clahe_img = clahe.apply(gray)
    clahe_img = to_3ch(clahe_img)

    variants.append(("clahe", clahe_img))

    return variants


# =========================================================
# 4. OCR 품질 평가
# =========================================================

MATERIAL_HINTS = [
    "면", "코튼", "cotton",
    "폴리에스터", "폴리에스텔", "polyester",
    "폴리우레탄", "스판", "스판덱스", "polyurethane", "spandex",
    "나일론", "nylon",
    "레이온", "rayon", "비스코스", "viscose",
    "아크릴", "acrylic",
    "울", "wool",
    "린넨", "linen",
    "실크", "silk"
]

CARE_HINTS = [
    "세탁", "건조", "표백", "다림질", "드라이", "손세탁",
    "주의", "금지", "wash", "dry", "iron", "bleach"
]


def contains_hint(text, hints):
    text = str(text).lower()
    return any(h.lower() in text for h in hints)


def score_ocr_info(info):
    """
    OCR 결과 품질 점수 계산.
    기존 코드의 점수 구조를 유지합니다.
    """

    raw_text = str(info.get("raw_text", ""))
    avg_conf = float(info.get("avg_conf", 0) or 0)
    token_count = int(info.get("token_count", 0) or 0)
    char_count = int(info.get("char_count_no_space", 0) or 0)

    score = 0.0

    score += avg_conf * 0.45
    score += min(char_count / 120, 1) * 0.25
    score += min(token_count / 20, 1) * 0.15

    if contains_hint(raw_text, MATERIAL_HINTS):
        score += 0.10

    if contains_hint(raw_text, CARE_HINTS):
        score += 0.05

    return round(score, 4)


def is_bad_ocr_info(info, mode="label"):
    """
    OCR 결과가 나쁘면 전처리 후보를 다시 돌리기 위한 판단 함수.

    mode="label":
        전체 라벨 OCR 기준. 글자 수와 토큰 수를 어느 정도 요구합니다.

    mode="symbol":
        YOLO crop OCR 기준. 기호 안 글자는 매우 짧을 수 있으므로 기준을 완화합니다.
    """

    raw_text = str(info.get("raw_text", ""))
    avg_conf = float(info.get("avg_conf", 0) or 0)
    token_count = int(info.get("token_count", 0) or 0)
    char_count = int(info.get("char_count_no_space", 0) or 0)

    if raw_text == "인식된 글자 없음":
        return True

    if mode == "symbol":
        if avg_conf < 0.50:
            return True
        if char_count < 1:
            return True
        return False

    if avg_conf < 0.75:
        return True

    if token_count < 5:
        return True

    if char_count < 30:
        return True

    if not contains_hint(raw_text, MATERIAL_HINTS) and not contains_hint(raw_text, CARE_HINTS):
        return True

    return False


# =========================================================
# 5. OCR 실행
# =========================================================

def run_ocr_on_variant(img):
    """
    단일 이미지 후보에 대해 OCR 실행.
    """

    ocr = _load_ocr()

    try:
        results = ocr.predict(img)
    except Exception:
        results = ocr.ocr(img)

    info = extract_ocr_info(results)
    info["ocr_quality_score"] = score_ocr_info(info)

    return info


def run_adaptive_ocr(image_input, mode="label"):
    """
    원본 OCR 먼저 실행.
    결과가 좋으면 그대로 사용.
    결과가 나쁘면 CLAHE 후보를 실행하고 점수가 높은 결과 선택.
    """

    raw_img = _normalize_image_input(image_input)

    variants = make_preprocess_variants(
        raw_img,
        max_side=1800,
        use_upscale=(mode == "symbol")
    )

    tried = []

    for variant_name, variant_img in variants:
        try:
            info = run_ocr_on_variant(variant_img)
        except Exception as e:
            info = {
                "raw_text": f"오류: {e}",
                "avg_conf": 0,
                "token_count": 0,
                "char_count_no_space": 0,
                "line_texts": [],
                "line_scores": [],
                "ocr_quality_score": 0
            }

        info["variant"] = variant_name
        tried.append(info)

        # 원본 결과가 충분히 좋으면 CLAHE까지 안 감
        if variant_name == "original" and not is_bad_ocr_info(info, mode=mode):
            break

    best = max(tried, key=lambda x: x.get("ocr_quality_score", 0))

    best["tried_variants"] = [
        {
            "variant": x.get("variant", ""),
            "avg_conf": x.get("avg_conf", 0),
            "token_count": x.get("token_count", 0),
            "char_count_no_space": x.get("char_count_no_space", 0),
            "ocr_quality_score": x.get("ocr_quality_score", 0),
        }
        for x in tried
    ]

    return best


# =========================================================
# 6. OCR 텍스트 정형화
# =========================================================

MATERIAL_CANONICAL = {
    "면": ["면", "코튼", "cotton", "c0tton", "cottn"],
    "폴리에스터": [
        "폴리에스터", "폴리에스텔", "폴리에스테르", "폴리 에스터",
        "polyester", "poly", "polyster", "poliester", "polyest"
    ],
    "폴리우레탄": [
        "폴리우레탄", "폴리 우레탄", "스판", "스판덱스",
        "polyurethane", "poly urethane", "spandex", "elastane", "pu"
    ],
    "나일론": ["나일론", "nylon", "nyl0n", "naylon"],
    "레이온": ["레이온", "비스코스", "viscose", "rayon"],
    "아크릴": ["아크릴", "acrylic", "acryl"],
    "울": ["울", "모", "wool"],
    "견": ["견", "실크", "silk"],
    "린넨": ["린넨", "마", "linen"],
    "모달": ["모달", "modal"],
    "텐셀": ["텐셀", "리오셀", "tencel", "lyocell"],
    "캐시미어": ["캐시미어", "cashmere"],
    "아세테이트": ["아세테이트", "acetate"],
}

VARIANT_TO_CANON = {}

for canon, variants in MATERIAL_CANONICAL.items():
    for variant in variants:
        key = variant.lower().replace(" ", "")
        VARIANT_TO_CANON[key] = canon


CARE_KEYWORDS = [
    "세탁", "손세탁", "단독", "분리", "중성세제", "세탁망",
    "건조", "자연건조", "그늘", "드라이", "드라이클리닝",
    "다림질", "저온", "약하게", "헹굼", "탈수", "옷걸이", "뒤집어",
    "기계세탁"
]

PROHIBITION_KEYWORDS = [
    "금지", "하지 마십시오", "마십시오", "두지 마십시오",
    "사용하지 마십시오", "담가두지", "담가 두지",
    "기계건조", "건조기", "표백", "염소표백", "함께 세탁하지",
    "드럼 세탁기", "비틀어 짜지", "비비거나", "열풍건조", "햇볕"
]

WARNING_KEYWORDS = [
    "주의", "주의하십시오", "취급주의", "우려", "탈색", "이염",
    "마찰", "손상", "오염", "변형", "수축", "녹", "찢어", "뜯김",
    "변색", "미어짐", "올풀림", "보풀"
]

META_KEYWORDS = [
    "품번", "품명", "고객상담실", "소비자상담실", "제조년월",
    "연락처", "주소", "브랜드", "style", "code", "size", "검사필"
]


def dedup_keep_order(items):
    out = []
    seen = set()

    for item in items:
        item = str(item).strip()

        if not item:
            continue

        key = item.lower()

        if key not in seen:
            seen.add(key)
            out.append(item)

    return out


def clean_text(text):
    text = str(text)
    text = text.replace("|||", " ")
    text = text.replace("％", "%")
    text = text.replace("﹪", "%")
    text = re.sub(r"[^\w가-힣%°C\s:/.,()\-]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def clean_material_text(text):
    text = clean_text(text).lower()

    replacements = {
        "c0tton": "cotton",
        "nyl0n": "nylon",
        "poly ester": "polyester",
        "poly-ester": "polyester",
        "poly urethane": "polyurethane",
        "poly-urethane": "polyurethane",
        "폴리 에스터": "폴리에스터",
        "폴리 우레탄": "폴리우레탄",
    }

    for wrong, right in replacements.items():
        text = text.replace(wrong, right)

    text = re.sub(r"\s+", " ", text).strip()
    return text


def extract_materials_from_text(text):
    text = clean_material_text(text)
    compact_text = text.replace(" ", "")

    found = []

    for variant_key, canon in VARIANT_TO_CANON.items():
        variant = re.escape(variant_key)

        patterns = [
            rf"{variant}\s*[:/]?\s*(\d{{1,3}})\s*%",
            rf"(\d{{1,3}})\s*%\s*{variant}",
            rf"{variant}\s*[:/]?\s*(\d{{1,3}})(?!\d)",
            rf"(?<!\d)(\d{{1,3}})\s*{variant}",
        ]

        for pattern in patterns:
            matches = re.findall(pattern, compact_text, flags=re.IGNORECASE)

            for value in matches:
                try:
                    num = int(value)
                except Exception:
                    continue

                if 1 <= num <= 100:
                    found.append(f"{canon} {num}%")

    return dedup_keep_order(found)


def contains_any(text, keywords):
    text = str(text).lower()
    return any(k.lower() in text for k in keywords)


def split_lines_from_info(info):
    """
    OCR line_texts가 있으면 line_texts 기준으로 나누고,
    없으면 raw_text를 문장 기준으로 대략 분리합니다.
    """

    line_texts = info.get("line_texts", [])
    raw_text = str(info.get("raw_text", ""))

    if line_texts:
        lines = line_texts
    else:
        lines = re.split(r"[/.]|(?<=하십시오)\s+|(?<=마십시오)\s+", raw_text)

    cleaned = []

    for line in lines:
        line = clean_text(line)
        line = re.sub(r"^\s*\d+\s*[.)]?\s*", "", line).strip(" .")

        if line and line != "인식된 글자 없음":
            cleaned.append(line)

    return cleaned


def normalize_line(line):
    """
    자주 나오는 OCR 문장을 표준 표현으로 정리합니다.
    """

    line = clean_text(line)

    normalize_patterns = [
        (r"취금주의|취급주의|위금주의|취급시\s*주의사항|취급상\s*주의사항", "취급주의"),
        (r"손세탁", "손세탁하십시오"),
        (r"단독\s*세탁|단독세탁", "단독 세탁하십시오"),
        (r"분리\s*세탁|분리세탁", "분리 세탁하십시오"),
        (r"중성세제.*사용", "중성세제를 사용하십시오"),
        (r"세탁망.*세탁|망에\s*넣어.*세탁", "세탁망에 넣어 세탁하십시오"),
        (r"뒤집어.*세탁|집어서.*세탁", "뒤집어서 세탁하십시오"),
        (r"뒤집어.*건조", "뒤집어 건조하십시오"),
        (r"그늘.*건조", "그늘에서 건조하십시오"),
        (r"자연\s*건조", "자연건조하십시오"),
        (r"다림질", "다림질하십시오"),
        (r"기계세탁.*가능|물세탁.*가능", "기계세탁 가능"),

        (r"표백.*(사용하지|마십시|금지)", "표백 금지"),
        (r"염소.*표백", "표백 금지"),
        (r"기계\s*건조.*마십시|건조기.*마십시|건조기.*금지", "기계건조 금지"),
        (r"드럼\s*세탁기.*금지", "드럼 세탁기 사용 금지"),
        (r"담가\s*두지|담가두지|남가\s*두지|당가\s*두지", "장시간 담가두지 마십시오"),
        (r"함께\s*세탁하지|함께세탁하지", "타의류와 함께 세탁하지 마십시오"),
        (r"비틀어\s*짜지|비비거나.*짜지|비들어\s*짜지", "심하게 비비거나 비틀어 짜지 마십시오"),
        (r"열풍건조|열품건조", "열풍건조 금지"),
        (r"햇볕|햇별", "장시간 햇볕 노출 금지"),

        (r"마찰", "마찰 주의"),
        (r"탈색", "탈색 우려"),
        (r"이염|이영|이엄", "이염 우려"),
        (r"오염|오영", "오염 우려"),
        (r"변색", "변색 우려"),
        (r"수축", "수축 우려"),
        (r"변형", "변형 우려"),
        (r"손상", "제품 손상 우려"),
        (r"녹", "녹 발생 주의"),
        (r"미어짐|뜯김|올풀림|보풀", "뜯김/미어짐 우려"),
    ]

    for pattern, replacement in normalize_patterns:
        if re.search(pattern, line, flags=re.IGNORECASE):
            return replacement

    return line


def classify_line(line):
    """
    한 줄을 materials / care / prohibitions / warnings / meta로 분류합니다.
    """

    if extract_materials_from_text(line):
        return "materials"

    if contains_any(line, PROHIBITION_KEYWORDS):
        return "prohibitions"

    if contains_any(line, CARE_KEYWORDS):
        return "care"

    if contains_any(line, WARNING_KEYWORDS):
        return "warnings"

    if contains_any(line, META_KEYWORDS):
        return "meta"

    return "meta"


def structure_ocr_info(info):
    """
    OCR 결과 info를 최종 구조화합니다.
    """

    lines = split_lines_from_info(info)
    norm_lines = [normalize_line(line) for line in lines]
    norm_lines = [line for line in norm_lines if line]

    whole_text = " ".join(norm_lines) + " " + str(info.get("raw_text", ""))

    materials = extract_materials_from_text(whole_text)
    care = []
    prohibitions = []
    warnings = []
    meta = []

    for line in norm_lines:
        label = classify_line(line)

        if label == "materials":
            materials.extend(extract_materials_from_text(line))
        elif label == "care":
            care.append(line)
        elif label == "prohibitions":
            prohibitions.append(line)
        elif label == "warnings":
            warnings.append(line)
        else:
            meta.append(line)

    core_items = materials + care + prohibitions + warnings
    core_set = set(str(x).lower() for x in core_items)

    meta = [
        item for item in meta
        if str(item).lower() not in core_set
    ]

    return {
        "materials": dedup_keep_order(materials),
        "care": dedup_keep_order(care),
        "prohibitions": dedup_keep_order(prohibitions),
        "warnings": dedup_keep_order(warnings),
        "meta": dedup_keep_order(meta),
    }


# =========================================================
# 7. pipeline.py가 호출할 최종 함수
# =========================================================

def extract_symbol_text(crop):
    """
    YOLO가 잘라낸 세탁기호 crop 내부 텍스트를 읽습니다.

    입력:
        crop: numpy.ndarray

    반환:
        문자열
        예: "석유계", "중성", "저온"
    """

    if crop is None:
        return ""

    info = run_adaptive_ocr(crop, mode="symbol")
    text = info.get("raw_text", "")

    if text == "인식된 글자 없음":
        return ""

    return text


def extract_caution_text(label_bytes):
    """
    전체 라벨 이미지에서 OCR을 수행하고,
    care / prohibitions / warnings / materials로 정형화합니다.

    입력:
        label_bytes: 이미지 bytes

    반환 형식:
    {
        "rawText": "...",
        "care": [],
        "prohibitions": [],
        "warnings": [],
        "materials": [],
        "meta": [],
        "ocrQuality": {...}
    }
    """

    info = run_adaptive_ocr(label_bytes, mode="label")
    structured = structure_ocr_info(info)

    raw_text = info.get("raw_text", "")

    if raw_text == "인식된 글자 없음":
        raw_text = ""

    return {
        "rawText": raw_text,
        "care": structured["care"],
        "prohibitions": structured["prohibitions"],
        "warnings": structured["warnings"],
        "materials": structured["materials"],
        "meta": structured["meta"],
        "ocrQuality": {
            "variantUsed": info.get("variant", ""),
            "avgConf": info.get("avg_conf", 0),
            "tokenCount": info.get("token_count", 0),
            "charCountNoSpace": info.get("char_count_no_space", 0),
            "score": info.get("ocr_quality_score", 0),
            "triedVariants": info.get("tried_variants", [])
        }
    }