"use client";

import React, { useEffect, useState } from "react";

interface SpotlightProps {
  targetId?: string;
  title: string;
  content: string;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
}

export default function Spotlight({
  targetId,
  title,
  content,
  currentStep,
  totalSteps,
  onNext,
  onSkip,
}: SpotlightProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!targetId) {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      const el = document.getElementById(targetId);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
        // Scroll into view with smooth behavior and some padding
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setTargetRect(null);
      }
    };

    updateRect();

    // Re-check periodically in case of dynamic rendering or resize
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect);
    const interval = setInterval(updateRect, 500);

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect);
      clearInterval(interval);
    };
  }, [targetId]);

  // If no target ID or target not found on screen yet, just show a centered modal
  if (!targetId || !targetRect) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
        <PopoverContent
          title={title}
          content={content}
          currentStep={currentStep}
          totalSteps={totalSteps}
          onNext={onNext}
          onSkip={onSkip}
        />
      </div>
    );
  }

  // Draw overlay with cutout using box-shadow
  // The element itself is an absolute div matching the target rect exactly
  // Its box-shadow covers the rest of the screen
  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden animate-in fade-in duration-300">
      <div
        className="absolute bg-transparent transition-all duration-300 ease-in-out"
        style={{
          top: targetRect.top - 8,
          left: targetRect.left - 8,
          width: targetRect.width + 16,
          height: targetRect.height + 16,
          boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.75)",
          borderRadius: "16px",
        }}
      />
      
      {/* Position popover near the target */}
      <div
        className="absolute pointer-events-auto transition-all duration-300 ease-in-out"
        style={{
          top: Math.max(16, targetRect.bottom + 16),
          // Try to center horizontally relative to target, but keep within viewport
          left: Math.max(16, Math.min(window.innerWidth - 340, targetRect.left + (targetRect.width / 2) - 160)),
        }}
      >
        <PopoverContent
          title={title}
          content={content}
          currentStep={currentStep}
          totalSteps={totalSteps}
          onNext={onNext}
          onSkip={onSkip}
        />
      </div>
    </div>
  );
}

function PopoverContent({
  title,
  content,
  currentStep,
  totalSteps,
  onNext,
  onSkip,
}: {
  title: string;
  content: string;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  const isLast = currentStep === totalSteps - 1;

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/20 shadow-2xl rounded-2xl p-5 w-80 max-w-[calc(100vw-32px)] pointer-events-auto relative">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg text-on-surface leading-tight">{title}</h3>
        <span className="text-xs font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded uppercase tracking-wider">
          {currentStep + 1} of {totalSteps}
        </span>
      </div>
      
      <p className="text-sm text-on-surface-variant mb-5 leading-relaxed">
        {content}
      </p>
      
      <div className="flex justify-between items-center gap-3">
        <button
          onClick={onSkip}
          className="text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors uppercase tracking-wider"
        >
          {isLast ? "Close" : "Skip"}
        </button>
        <button
          onClick={onNext}
          className="bg-primary text-surface-container-lowest px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-primary/90 transition-colors active:scale-95"
        >
          {isLast ? "Done" : "Next"}
        </button>
      </div>
    </div>
  );
}
