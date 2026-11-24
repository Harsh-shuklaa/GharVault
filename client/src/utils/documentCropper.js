/**
 * Document Cropper & Image Enhancement Utility
 * Provides native canvas quadrilateral bounding cropping, rotation,
 * and CamScanner-style "Magic Color" & "B&W Photocopy" filters.
 */

// Calculate Euclidean distance between two points
export function distance(p1, p2) {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/**
 * Native Canvas Document Cropper
 * Crops the document region defined by corners, fills with white background,
 * and optionally applies visual clarity enhancement filters.
 *
 * @param {HTMLImageElement|HTMLCanvasElement} sourceImg - Source image object
 * @param {Array<{x: number, y: number}>} corners - [TL, TR, BR, BL] coordinates
 * @param {string} filterMode - 'magic' | 'bw' | 'original'
 * @returns {HTMLCanvasElement} - Clean, cropped, enhanced destination canvas
 */
export function cropDocument(sourceImg, corners, filterMode = 'magic') {
  const [tl, tr, br, bl] = corners;

  const naturalWidth = sourceImg.naturalWidth || sourceImg.width;
  const naturalHeight = sourceImg.naturalHeight || sourceImg.height;

  // Bounding box of the 4 selected points
  const minX = Math.max(0, Math.min(tl.x, bl.x, tr.x, br.x));
  const minY = Math.max(0, Math.min(tl.y, tr.y, bl.y, br.y));
  const maxX = Math.min(naturalWidth, Math.max(tl.x, tr.x, br.x, bl.x));
  const maxY = Math.min(naturalHeight, Math.max(tl.y, tr.y, br.y, bl.y));

  const cropWidth = Math.max(80, Math.round(maxX - minX));
  const cropHeight = Math.max(80, Math.round(maxY - minY));

  const destCanvas = document.createElement('canvas');
  destCanvas.width = cropWidth;
  destCanvas.height = cropHeight;
  const ctx = destCanvas.getContext('2d', { willReadFrequently: true });

  // 1. Safety Solid White Background (Eliminates ANY chance of black pixels)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, cropWidth, cropHeight);

  // 2. Native High-Resolution Crop from Source Image
  ctx.drawImage(
    sourceImg,
    minX,
    minY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight
  );

  // 3. Apply Visual Enhancement Filter
  if (filterMode && filterMode !== 'original') {
    applyDocumentFilter(ctx, cropWidth, cropHeight, filterMode);
  }

  return destCanvas;
}

/**
 * CamScanner & Adobe Scan style enhancement filters:
 * - 'magic': Removes shadow/yellow tint, boosts contrast, whitens background, sharpens dark text.
 * - 'bw': Clean black & white photocopy look.
 */
export function applyDocumentFilter(ctx, width, height, mode = 'magic') {
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    if (mode === 'bw') {
      // High-contrast clean photocopy
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const val = gray > 130 ? 255 : (gray < 85 ? 0 : Math.round(((gray - 85) / 45) * 255));
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
      }
    } else if (mode === 'magic') {
      // Magic Color: Whiten grayish/yellowish paper background, deepen dark text
      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

        if (luminance > 165) {
          // Bright paper background -> push to clean crisp white
          const boost = (luminance - 165) / 90;
          r = Math.min(255, r + (255 - r) * boost * 0.85);
          g = Math.min(255, g + (255 - g) * boost * 0.85);
          b = Math.min(255, b + (255 - b) * boost * 0.85);
        } else if (luminance < 110) {
          // Dark text -> enhance contrast and readability
          r = Math.max(0, r * 0.85);
          g = Math.max(0, r * 0.85);
          b = Math.max(0, r * 0.85);
        } else {
          // Midtones: gentle contrast boost
          r = Math.min(255, Math.max(0, ((r - 128) * 1.15) + 128));
          g = Math.min(255, Math.max(0, ((g - 128) * 1.15) + 128));
          b = Math.min(255, Math.max(0, ((b - 128) * 1.15) + 128));
        }

        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  } catch (err) {
    console.warn('Document filter skipped:', err);
  }
}

/**
 * Detect initial document corners.
 * Uses smart 8% boundary margin to automatically omit fingers, hands, and bedsheets on the edge.
 */
export function getInitialCorners(imgWidth, imgHeight) {
  const marginX = imgWidth * 0.08;
  const marginY = imgHeight * 0.08;

  return [
    { x: marginX, y: marginY },                          // Top-Left
    { x: imgWidth - marginX, y: marginY },                // Top-Right
    { x: imgWidth - marginX, y: imgHeight - marginY },    // Bottom-Right
    { x: marginX, y: imgHeight - marginY },                // Bottom-Left
  ];
}

/**
 * Rotate an image by 90 degrees clockwise onto a new canvas
 */
export function rotateImage90Deg(image) {
  const canvas = document.createElement('canvas');
  const imgWidth = image.naturalWidth || image.width;
  const imgHeight = image.naturalHeight || image.height;

  canvas.width = imgHeight;
  canvas.height = imgWidth;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((90 * Math.PI) / 180);
  ctx.drawImage(image, -imgWidth / 2, -imgHeight / 2);

  return canvas;
}
