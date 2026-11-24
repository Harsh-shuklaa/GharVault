import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Crop,
  RotateCw,
  Sparkles,
  Maximize2,
  Check,
  X,
  FileText,
  Sliders,
  Sun,
  Eye,
  RefreshCw,
} from 'lucide-react';
import {
  distance,
  cropDocument,
  getInitialCorners,
  rotateImage90Deg,
} from '../utils/documentCropper';

export default function DocumentCropperModal({
  isOpen,
  file,
  onApplyCrop,
  onSkip,
  onClose,
}) {
  const [imageSrc, setImageSrc] = useState(null);
  const [imageObj, setImageObj] = useState(null);
  const [corners, setCorners] = useState([]); // [TL, TR, BR, BL] in image coordinates
  const [activeCornerIdx, setActiveCornerIdx] = useState(null);
  const [filterMode, setFilterMode] = useState('magic'); // 'magic', 'bw', 'original'
  const [rotationAngle, setRotationAngle] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // Load image when file changes
  useEffect(() => {
    if (!isOpen || !file) return;

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageObj(img);
      setImageSrc(url);
      setRotationAngle(0);
      setFilterMode('magic');
      // Set initial corners with smart 6% margin
      setCorners(getInitialCorners(img.naturalWidth, img.naturalHeight));
    };
    img.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [isOpen, file]);

  // Track container resize to maintain correct coordinate scaling
  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateContainerSize();
    window.addEventListener('resize', updateContainerSize);
    return () => window.removeEventListener('resize', updateContainerSize);
  }, [isOpen, imageSrc]);

  // Calculate scaling factor between natural image dimensions and displayed dimensions
  const getScaleInfo = useCallback(() => {
    if (!imageObj || containerSize.width === 0 || containerSize.height === 0) {
      return { scale: 1, offsetX: 0, offsetY: 0, displayWidth: 0, displayHeight: 0 };
    }

    const imgWidth = imageObj.naturalWidth;
    const imgHeight = imageObj.naturalHeight;

    const scaleX = (containerSize.width - 48) / imgWidth;
    const scaleY = (containerSize.height - 48) / imgHeight;
    const scale = Math.min(scaleX, scaleY, 1);

    const displayWidth = imgWidth * scale;
    const displayHeight = imgHeight * scale;

    const offsetX = (containerSize.width - displayWidth) / 2;
    const offsetY = (containerSize.height - displayHeight) / 2;

    return { scale, offsetX, offsetY, displayWidth, displayHeight };
  }, [imageObj, containerSize]);

  // Convert natural image coords to display coords
  const toDisplayCoords = useCallback(
    (pt) => {
      const { scale, offsetX, offsetY } = getScaleInfo();
      return {
        x: pt.x * scale + offsetX,
        y: pt.y * scale + offsetY,
      };
    },
    [getScaleInfo]
  );

  // Convert display coords to natural image coords
  const toImageCoords = useCallback(
    (clientX, clientY) => {
      if (!containerRef.current || !imageObj) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const clickY = clientY - rect.top;

      const { scale, offsetX, offsetY } = getScaleInfo();
      const naturalX = Math.max(0, Math.min(imageObj.naturalWidth, (clickX - offsetX) / scale));
      const naturalY = Math.max(0, Math.min(imageObj.naturalHeight, (clickY - offsetY) / scale));

      return { x: naturalX, y: naturalY };
    },
    [getScaleInfo, imageObj]
  );

  // Pointer event handlers for dragging corners
  const handlePointerDown = (idx) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveCornerIdx(idx);
  };

  const handlePointerMove = (e) => {
    if (activeCornerIdx === null || !imageObj) return;
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const newPt = toImageCoords(clientX, clientY);

    setCorners((prev) => {
      const copy = [...prev];
      copy[activeCornerIdx] = newPt;
      return copy;
    });
  };

  const handlePointerUp = () => {
    setActiveCornerIdx(null);
  };

  // Rotate image 90° clockwise
  const handleRotate = () => {
    if (!imageObj) return;
    const rotatedCanvas = rotateImage90Deg(imageObj);
    const newUrl = rotatedCanvas.toDataURL('image/jpeg', 0.95);

    const rotatedImg = new Image();
    rotatedImg.onload = () => {
      setImageObj(rotatedImg);
      setImageSrc(newUrl);
      setCorners(getInitialCorners(rotatedImg.naturalWidth, rotatedImg.naturalHeight));
    };
    rotatedImg.src = newUrl;
  };

  // Reset corners to 6% margin
  const handleResetCorners = () => {
    if (!imageObj) return;
    setCorners(getInitialCorners(imageObj.naturalWidth, imageObj.naturalHeight));
  };

  // Full-frame crop (100% of image)
  const handleFullFrame = () => {
    if (!imageObj) return;
    setCorners([
      { x: 0, y: 0 },
      { x: imageObj.naturalWidth, y: 0 },
      { x: imageObj.naturalWidth, y: imageObj.naturalHeight },
      { x: 0, y: imageObj.naturalHeight },
    ]);
  };

  // Apply native clean crop and generate optimized File
  const handleApply = async () => {
    if (!imageObj || corners.length !== 4) return;
    setIsProcessing(true);

    try {
      // Step 1: Cropping edges
      setProcessingStatus('✂️ Step 1/3: Cutting out bedsheet, table & hands...');
      await new Promise((r) => setTimeout(r, 280));

      // Step 2: Native Crop & Filter
      setProcessingStatus('🎨 Step 2/3: Applying Magic Color & converting to JPEG...');
      const resultCanvas = cropDocument(imageObj, corners, filterMode);
      await new Promise((r) => setTimeout(r, 280));

      // Step 3: HD Compression
      setProcessingStatus('⚡ Step 3/3: Optimizing file size (HD Ready)...');
      await new Promise((r) => setTimeout(r, 200));

      resultCanvas.toBlob(
        (blob) => {
          if (!blob) {
            setIsProcessing(false);
            setProcessingStatus('');
            onSkip();
            return;
          }
          const cleanFileName = file.name.replace(/\.[^.]+$/, '') + '_cropped.jpg';
          const croppedFile = new File([blob], cleanFileName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          setIsProcessing(false);
          setProcessingStatus('');
          onApplyCrop(croppedFile);
        },
        'image/jpeg',
        0.90
      );
    } catch (err) {
      console.error('Document crop failed:', err);
      setIsProcessing(false);
      setProcessingStatus('');
      onSkip();
    }
  };

  if (!isOpen) return null;

  const { displayWidth, displayHeight, offsetX, offsetY } = getScaleInfo();
  const displayCorners = corners.map(toDisplayCoords);

  // SVG Polygon Points
  const polygonPoints = displayCorners.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/90 backdrop-blur-md select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">Smart Document Scanner</h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                CamScanner Mode
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Drag corners to remove fingers, bedsheets & background tables
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSkip}
            className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            Skip Crop
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Interactive Crop Workspace */}
      <div
        ref={containerRef}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        className="relative flex-1 w-full overflow-hidden bg-slate-950 flex items-center justify-center p-6 touch-none cursor-crosshair"
      >
        {imageSrc && displayWidth > 0 && (
          <div
            className="relative shadow-2xl shadow-black rounded-lg overflow-hidden border border-slate-800"
            style={{
              width: displayWidth,
              height: displayHeight,
            }}
          >
            {/* Live Step-by-Step Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xl shadow-emerald-900/40 mb-3 animate-bounce">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-white mb-2">Enhancing Your Document</h4>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold text-xs shadow-lg">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>{processingStatus}</span>
                </div>
              </div>
            )}

            {/* The Source Image */}
            <img
              src={imageSrc}
              alt="Document for cropping"
              className="w-full h-full object-contain pointer-events-none"
            />

            {/* SVG Dark Tint & Highlight Overlay */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ width: displayWidth, height: displayHeight }}
            >
              <defs>
                <mask id="cropMask">
                  {/* White covers entire image (fully transparent mask) */}
                  <rect x="0" y="0" width="100%" height="100%" fill="white" />
                  {/* Black cutout over document area (unmasks document) */}
                  <polygon
                    points={displayCorners.map((p) => `${p.x - offsetX},${p.y - offsetY}`).join(' ')}
                    fill="black"
                  />
                </mask>
              </defs>

              {/* Darkened out-of-bounds overlay */}
              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="rgba(0, 0, 0, 0.65)"
                mask="url(#cropMask)"
              />

              {/* Glowing boundary polygon */}
              <polygon
                points={displayCorners.map((p) => `${p.x - offsetX},${p.y - offsetY}`).join(' ')}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                className="animate-dash"
              />
            </svg>

            {/* 4 Corner Magnetic Drag Handles */}
            {displayCorners.map((pt, idx) => {
              const label = ['Top-Left', 'Top-Right', 'Bottom-Right', 'Bottom-Left'][idx];
              const isHovered = activeCornerIdx === idx;
              return (
                <div
                  key={idx}
                  onMouseDown={handlePointerDown(idx)}
                  onTouchStart={handlePointerDown(idx)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-grab active:cursor-grabbing group transition-transform ${
                    isHovered ? 'scale-125' : 'hover:scale-110'
                  }`}
                  style={{
                    left: pt.x - offsetX,
                    top: pt.y - offsetY,
                  }}
                  title={label}
                >
                  {/* Outer Pulsing Glow */}
                  <div className="w-8 h-8 rounded-full bg-emerald-500/30 flex items-center justify-center animate-ping absolute inset-0" />
                  
                  {/* Inner Solid Handle */}
                  <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white shadow-xl flex items-center justify-center relative">
                    <div className="w-2.5 h-2.5 bg-white rounded-full shadow" />
                  </div>

                  {/* Corner Badge Tooltip */}
                  <div className="absolute top-9 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-slate-900/90 text-[10px] font-semibold text-emerald-300 border border-emerald-500/40 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Controls & Filters Bar */}
      <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Enhancement Filters */}
          <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 px-2 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              Filter:
            </span>
            <button
              type="button"
              onClick={() => setFilterMode('magic')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                filterMode === 'magic'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Magic Color
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('bw')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                filterMode === 'bw'
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              B&W Xerox
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('original')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterMode === 'original'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Original
            </button>
          </div>

          {/* Utility Tools & Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRotate}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="Rotate 90 degrees"
            >
              <RotateCw className="w-4 h-4" />
              Rotate
            </button>
            <button
              type="button"
              onClick={handleResetCorners}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="Auto frame card boundaries"
            >
              <RefreshCw className="w-4 h-4" />
              Auto Frame
            </button>
            <button
              type="button"
              onClick={handleFullFrame}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="Select full photo"
            >
              <Maximize2 className="w-4 h-4" />
              Full Image
            </button>

            {/* Apply & Finish Button */}
            <button
              type="button"
              onClick={handleApply}
              disabled={isProcessing}
              className="ml-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs shadow-lg shadow-emerald-900/40 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Straightening & Enhancing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Crop & Scan Document
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
