import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, Move, Minimize2, Maximize2, ArrowLeftRight } from 'lucide-react';

export default function AskVaultAIFloatingButton({ onClick }) {
  const location = useLocation();

  // Load saved position or side preference
  const [side, setSide] = useState(() => {
    try {
      return localStorage.getItem('gharvault_ai_btn_side') || 'right';
    } catch {
      return 'right';
    }
  });

  const [isCompact, setIsCompact] = useState(() => {
    try {
      return localStorage.getItem('gharvault_ai_btn_compact') === 'true';
    } catch {
      return false;
    }
  });

  const [customPos, setCustomPos] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isModalOpenInDOM, setIsModalOpenInDOM] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, startLeft: 0, startTop: 0, moved: false });
  const btnRef = useRef(null);

  // Auto-hide when any modal or drawer is open in DOM (preventing overlap on modal action buttons)
  useEffect(() => {
    const checkModal = () => {
      const isLocked = document.body.style.overflow === 'hidden';
      const hasModal = document.querySelector('[role="dialog"]') || document.querySelector('.modal-backdrop');
      setIsModalOpenInDOM(Boolean(isLocked || hasModal));
    };

    checkModal();
    const observer = new MutationObserver(checkModal);
    observer.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'], childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  // Check if current page has sticky bottom bar (e.g. DocumentPreviewPage)
  const isPreviewPage = location.pathname.includes('/vault/documents/');

  // Touch and Mouse Drag Handlers
  const handleStart = (clientX, clientY) => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      startLeft: rect.left,
      startTop: rect.top,
      moved: false,
    };
    setIsDragging(true);
  };

  const handleMove = (clientX, clientY) => {
    if (!isDragging) return;
    const dx = clientX - dragStartRef.current.x;
    const dy = clientY - dragStartRef.current.y;

    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      dragStartRef.current.moved = true;
    }

    const maxX = window.innerWidth - (btnRef.current?.offsetWidth || 100) - 10;
    const maxY = window.innerHeight - (btnRef.current?.offsetHeight || 44) - 10;

    const newLeft = Math.max(10, Math.min(maxX, dragStartRef.current.startLeft + dx));
    const newTop = Math.max(10, Math.min(maxY, dragStartRef.current.startTop + dy));

    setCustomPos({ left: newLeft, top: newTop });
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const onMouseMove = (e) => handleMove(e.clientX, e.clientY);
    const onMouseUp = () => handleEnd();
    const onTouchMove = (e) => {
      if (e.touches[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => handleEnd();

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging]);

  const toggleSide = (e) => {
    e.stopPropagation();
    const nextSide = side === 'right' ? 'left' : 'right';
    setSide(nextSide);
    setCustomPos(null);
    try {
      localStorage.setItem('gharvault_ai_btn_side', nextSide);
    } catch {}
  };

  const toggleCompact = (e) => {
    e.stopPropagation();
    const nextCompact = !isCompact;
    setIsCompact(nextCompact);
    try {
      localStorage.setItem('gharvault_ai_btn_compact', nextCompact.toString());
    } catch {}
  };

  const handleClick = (e) => {
    // If it was dragged, don't trigger modal
    if (dragStartRef.current.moved) {
      dragStartRef.current.moved = false;
      return;
    }
    onClick();
  };

  if (isModalOpenInDOM) {
    return null; // Never block modal buttons
  }

  // Calculate default position styles
  const defaultPositionClass = customPos
    ? ''
    : side === 'left'
    ? `fixed left-3 sm:left-6 ${
        isPreviewPage
          ? 'bottom-[calc(6.25rem+env(safe-area-inset-bottom,0px))] md:bottom-20'
          : 'bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:bottom-6'
      }`
    : `fixed right-3 sm:right-6 ${
        isPreviewPage
          ? 'bottom-[calc(6.25rem+env(safe-area-inset-bottom,0px))] md:bottom-20'
          : 'bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:bottom-6'
      }`;

  const customStyle = customPos
    ? { position: 'fixed', left: `${customPos.left}px`, top: `${customPos.top}px`, bottom: 'auto', right: 'auto' }
    : {};

  return (
    <div
      ref={btnRef}
      style={customStyle}
      className={`${defaultPositionClass} z-30 select-none touch-none transition-shadow ${
        isDragging ? 'opacity-90 scale-105 cursor-grabbing' : 'transition-transform duration-150'
      }`}
    >
      <div className="flex items-center gap-1 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md rounded-full border border-slate-200/90 dark:border-[#2C2C2E] shadow-xl shadow-black/10 dark:shadow-black/60 p-1 group">
        {/* Main Clickable AI Assistant Trigger */}
        <button
          type="button"
          onClick={handleClick}
          onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
          onTouchStart={(e) => e.touches[0] && handleStart(e.touches[0].clientX, e.touches[0].clientY)}
          title="Ask Vault AI (Click to chat, or drag to move away from buttons)"
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-[#202022] transition-colors cursor-pointer text-slate-900 dark:text-white"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-600 to-[#10B981] dark:from-[#3ECF8E] dark:to-emerald-400 text-white dark:text-black flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles size={12} className="animate-pulse" />
          </div>
          {!isCompact && (
            <span className="text-xs font-bold tracking-tight pr-1 hidden xs:inline sm:inline">
              Ask AI
            </span>
          )}
        </button>

        {/* Quick Side-Switch (Left <-> Right) to instantly get out of the way */}
        <button
          type="button"
          onClick={toggleSide}
          title={side === 'right' ? 'Move to left side' : 'Move to right side'}
          className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-[#262626] transition-colors cursor-pointer shrink-0"
        >
          <ArrowLeftRight size={11} />
        </button>

        {/* Compact Toggle (Minimize / Expand) */}
        <button
          type="button"
          onClick={toggleCompact}
          title={isCompact ? 'Expand button' : 'Minimize button to icon'}
          className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-[#262626] transition-colors cursor-pointer shrink-0"
        >
          {isCompact ? <Maximize2 size={11} /> : <Minimize2 size={11} />}
        </button>
      </div>
    </div>
  );
}
