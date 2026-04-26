"use client";

import React, { useState, useRef, useEffect } from "react";

interface FieldTooltipProps {
  content: string | React.ReactNode;
  trigger?: React.ReactNode;
}

export default function FieldTooltip({ content, trigger }: FieldTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-flex items-center ml-1.5" ref={containerRef}>
      <button
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-4 w-4 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container transition-colors cursor-help"
        aria-label="More information"
      >
        {trigger || <span className="text-[10px] font-black italic">?</span>}
      </button>

      {isOpen && (
        <div 
          className="absolute bottom-full left-1/2 mb-2 w-64 -translate-x-1/2 z-[100] animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="relative p-3 rounded-xl bg-surface-container-highest/95 backdrop-blur-md shadow-xl border border-outline-variant/20 text-xs text-on-surface leading-relaxed text-center">
            {content}
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -ml-1.5 border-8 border-transparent border-t-surface-container-highest/95" />
          </div>
        </div>
      )}
    </div>
  );
}
