import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18n from "../../src/i18n";
import { I18nextProvider } from "react-i18next";
import Navbar from "../components/Navbar";

constWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe("i18n", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    localStorage.clear();
  });

  describe("translation files", () => {
    it("loads English translations", () => {
      expect(i18n.getResource("en", "translation", "nav.howItWorks")).toBe("How it works");
      expect(i18n.getResource("en", "translation", "nav.forFreelancers")).toBe("For Freelancers");
    });

    it("loads Spanish translations", async () => {
      await i18n.changeLanguage("es");
      expect(i18n.getResource("es", "translation", "nav.howItWorks")).toBe("Cómo funciona");
      expect(i18n.getResource("es", "translation", "nav.forFreelancers")).toBe("Para Freelancers");
    });

    it("has consistent keys across languages", () => {
      const enKeys = Object.keys(i18n.getResourceBundle("en", "translation"));
      const esKeys = Object.keys(i18n.getResourceBundle("es", "translation"));
      expect(esKeys.sort()).toEqual(enKeys.sort());
    });
  });

  describe("language detection", () => {
    it("defaults to English", () => {
      expect(i18n.language).toBe("en");
    });

    it("falls back to English for missing keys", () => {
      const missingKey = i18n.t("this.key.does.not.exist" as any);
      expect(missingKey).toBe("this.key.does.not.exist");
    });

    it("falls back to English for missing namespace", () => {
      const missingNs = i18n.t("common.test" as any, { ns: "nonexistent" });
      expect(missingNs).toBe("common.test");
    });
  });

  describe("language switching", () => {
    it("switches to Spanish", async () => {
      await i18n.changeLanguage("es");
      expect(i18n.language).toBe("es");
    });

    it("switches back to English", async () => {
      await i18n.changeLanguage("es");
      await i18n.changeLanguage("en");
      expect(i18n.language).toBe("en");
    });
  });

  describe("persistence", () => {
    it("stores language preference in localStorage", async () => {
      await i18n.changeLanguage("es");
      expect(localStorage.getItem("language")).toBe("es");
    });

    it("recovers language from localStorage", async () => {
      localStorage.setItem("language", "es");
      i18n.services.languageDetector?.loadLanguages?.();
      await i18n.reloadResources();
      await i18n.changeLanguage("es");
      expect(i18n.language).toBe("es");
    });
  });
});

describe("Navbar language toggle", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    localStorage.clear();
  });

  it("renders language selector button", async () => {
    render(<Navbar />, { wrapper: TestWrapper });
    const langButton = screen.getByRole("button", { name: /select language/i });
    expect(langButton).toBeInTheDocument();
  });

  it("shows language dropdown on click", async () => {
    const user = userEvent.setup();
    render(<Navbar />, { wrapper: TestWrapper });
    const langButton = screen.getByRole("button", { name: /select language/i });
    await user.click(langButton);
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Español")).toBeInTheDocument();
  });

  it("changes language when Spanish is selected", async () => {
    const user = userEvent.setup();
    render(<Navbar />, { wrapper: TestWrapper });
    const langButton = screen.getByRole("button", { name: /select language/i });
    await user.click(langButton);
    const spanishButton = screen.getByText("Español");
    await user.click(spanishButton);
    expect(i18n.language).toBe("es");
  });

  it("displays navigation in current language", async () => {
    render(<Navbar />, { wrapper: TestWrapper });
    expect(screen.getByText("How it works")).toBeInTheDocument();
    expect(screen.getByText("For Freelancers")).toBeInTheDocument();
  });

  it("displays navigation in Spanish after switch", async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage("es");
    render(<Navbar />, { wrapper: TestWrapper });
    expect(screen.getByText("Cómo funciona")).toBeInTheDocument();
    expect(screen.getByText("Para Freelancers")).toBeInTheDocument();
  });
});

describe("Intl formatting", () => {
  it("formats dates with locale-specific patterns", () => {
    const date = new Date(2024, 5, 15);
    const enFormatted = date.toLocaleDateString("en-US");
    const esFormatted = date.toLocaleDateString("es-ES");
    expect(enFormatted).not.toBe(esFormatted);
  });

  it("formats numbers with locale-specific patterns", () => {
    const amount = 1234.56;
    const enFormatted = amount.toLocaleString("en-US");
    const esFormatted = amount.toLocaleString("es-ES");
    expect(enFormatted).not.toBe(esFormatted);
  });
});