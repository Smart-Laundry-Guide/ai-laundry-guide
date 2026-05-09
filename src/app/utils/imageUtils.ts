/**
 * 이미지 파일을 압축된 base64 data URL로 변환합니다.
 * localStorage 저장에 적합한 크기(~20-50KB)로 리사이즈 & 압축합니다.
 *
 * @param file     - 변환할 이미지 File 객체
 * @param maxDim   - 최대 가로/세로 픽셀 (기본 400px)
 * @param quality  - JPEG 압축 품질 0~1 (기본 0.65)
 */
export function compressImageToBase64(
  file: File,
  maxDim = 400,
  quality = 0.65,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // 비율 유지하며 리사이즈
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width  = maxDim;
        } else {
          width  = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas context unavailable')); return; }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Image load failed'));
    };

    img.src = objectUrl;
  });
}
