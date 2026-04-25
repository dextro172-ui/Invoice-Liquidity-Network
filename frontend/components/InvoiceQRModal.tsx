"use client";

import { useRef, useState, useCallback } from "react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { formatAddress, formatDate, formatUSDC } from "../utils/format";

interface InvoiceQRModalProps {
  invoiceId: bigint;
  amount: bigint;
  dueDate: bigint;
  freelancer: string;
  baseUrl?: string;
  onClose: () => void;
}

export default function InvoiceQRModal({
  invoiceId,
  amount,
  dueDate,
  freelancer,
  baseUrl,
  onClose,
}: InvoiceQRModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const origin = baseUrl ?? (typeof window !== "undefined" ? window.location.origin : "");
  const payUrl = `${origin}/pay/${invoiceId.toString()}`;

  const downloadPng = useCallback(() => {
    // QRCodeCanvas renders into a <canvas>; grab its data URL
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const dataUrl = canvasEl.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `invoice-${invoiceId.toString()}-qr.png`;
    link.href = dataUrl;
    link.click();
  }, [invoiceId]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(payUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  }, [payUrl]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Invoice QR Code"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-sm rounded-[32px] bg-white p-8 shadow-2xl flex flex-col items-center gap-6">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-high transition-colors"
          aria-label="Close QR modal"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <h2 className="text-lg font-bold text-on-surface">Scan to pay this invoice</h2>

        {/* Hidden canvas used for PNG download */}
        <QRCodeCanvas
          ref={canvasRef}
          value={payUrl}
          size={240}
          includeMargin
          className="hidden"
        />

        {/* Visible SVG QR code */}
        <div className="rounded-2xl border border-outline-variant/20 p-4 bg-white">
          <QRCodeSVG
            value={payUrl}
            size={220}
            includeMargin={false}
            aria-label={`QR code for invoice ${invoiceId.toString()}`}
          />
        </div>

        {/* Invoice summary */}
        <div className="w-full rounded-2xl bg-surface-container-low p-4 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-on-surface-variant font-medium">Invoice</span>
            <span className="font-bold">#{invoiceId.toString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant font-medium">Amount</span>
            <span className="font-bold">{formatUSDC(amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant font-medium">Due</span>
            <span className="font-semibold">{formatDate(dueDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant font-medium">Freelancer</span>
            <span className="font-mono text-xs">{formatAddress(freelancer)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full">
          <button
            onClick={downloadPng}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Download PNG
          </button>
          <button
            onClick={() => void copyLink()}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-outline-variant/30 px-4 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">
              {linkCopied ? "check" : "link"}
            </span>
            {linkCopied ? "Copied!" : "Copy link"}
          </button>
        </div>
      </div>
    </div>
  );
}
