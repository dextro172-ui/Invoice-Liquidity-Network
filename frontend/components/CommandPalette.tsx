"use client";

import React, { useEffect, useRef, useState } from "react";
import { useCommandPalette } from "../hooks/useCommandPalette";

export default function CommandPalette() {
  const { isOpen, query, setQuery, commands, executeCommand, close } = useCommandPalette();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, commands.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && commands[selectedIndex]) {
        e.preventDefault();
        executeCommand(commands[selectedIndex]);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, selectedIndex, commands, executeCommand, close]);

  useEffect(() => {
    const selected = listRef.current?.children[selectedIndex] as HTMLElement;
    if (selected && typeof selected.scrollIntoView === "function") {
      selected.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50" onClick={close}>
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command or invoice number..."
            className="w-full px-4 py-2 text-lg bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
        </div>

        <div ref={listRef} className="max-h-96 overflow-y-auto">
          {commands.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              {query ? "No commands found" : "No recent commands"}
            </div>
          ) : (
            commands.map((cmd, index) => (
              <div
                key={cmd.id}
                onClick={() => executeCommand(cmd)}
                className={`px-4 py-3 cursor-pointer flex items-center justify-between ${
                  index === selectedIndex
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                }`}
              >
                <span className="text-gray-900 dark:text-gray-100">{cmd.label}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">{cmd.category}</span>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex gap-4">
            <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Enter</kbd> Select</span>
            <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Esc</kbd> Close</span>
          </div>
          <span>Tip: Type # + number for invoices</span>
        </div>
      </div>
    </div>
  );
}
