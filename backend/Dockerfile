# 파이썬 3.10 버전 사용
FROM python:3.10-slim

# 작업 폴더 설정
WORKDIR /app

# OpenCV와 PaddleOCR 위한 패키지 설치
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 파이썬 라이브러리 목록 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 백엔드 코드 전체 복사 (YOLO 모델, 파이썬 코드 등)
COPY . .

# 허깅페이스 전용 포트(7860) 설정
ENV HOST=0.0.0.0
ENV PORT=7860
EXPOSE 7860

# 백엔드 서버 가동
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]