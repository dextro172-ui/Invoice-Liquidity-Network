"use client";

import Footer from "../../components/Footer";
import LPDashboard from "../../components/LPDashboard";
import Navbar from "../../components/Navbar";

export default function LPDashboardPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <section className="pt-32 pb-8 px-8">
        <div className="max-w-7xl mx-auto">
          <LPDashboard />
        </div>
      </section>
      <Footer />
    </main>
  );
}
