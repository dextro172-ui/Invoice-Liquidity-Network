"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import SubmitInvoiceForm from "../../components/SubmitInvoiceForm";

function SubmitContent() {
  const searchParams = useSearchParams();
  
  const prefillId = searchParams.get("prefill_id");
  const initialValues = prefillId ? {
    payer: searchParams.get("payer") || "",
    amount: searchParams.get("amount") || "",
    discountRate: searchParams.get("discount") || "3.00",
    tokenId: searchParams.get("token") || "",
  } : undefined;

  return (
    <main className="min-h-screen bg-surface-container-lowest">
      <Navbar />
      
      <section className="pt-32 pb-20 px-6 md:px-8">
        <div className="max-w-5xl mx-auto">
          <SubmitInvoiceForm 
            initialValues={initialValues} 
            prefillId={prefillId || undefined} 
          />
        </div>
      </section>
      
      <Footer />
    </main>
  );
}

function SubmitLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function SubmitPage() {
  return (
    <Suspense fallback={<SubmitLoading />}>
      <SubmitContent />
    </Suspense>
  );
}