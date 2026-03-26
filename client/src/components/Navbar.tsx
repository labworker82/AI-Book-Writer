/**
 * Navbar — Dark Tech Premium
 * Sticky top nav with blur background, gradient logo, CTA button
 */

import { useState, useEffect } from "react";
import { Menu, X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#workflow" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const handleNav = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0B1220]/90 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4F66FF] to-[#C65BFF] flex items-center justify-center shadow-lg shadow-[#4F66FF]/30">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg" style={{ fontFamily: "'Sora', sans-serif" }}>
            <span className="gradient-text">AI</span>
            <span className="text-white"> Book Writer</span>
          </span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNav(link.href)}
              className="text-sm text-white/70 hover:text-white transition-colors duration-200 font-medium"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <button
            className="text-sm text-white/70 hover:text-white transition-colors font-medium"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Login
          </button>
          <button
            onClick={() => handleNav("#pricing")}
            className="btn-glow px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Get Started
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-white/80 hover:text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0B1220]/95 backdrop-blur-md border-b border-white/10 px-4 py-4 flex flex-col gap-3">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNav(link.href)}
              className="text-left text-white/80 hover:text-white py-2 text-sm font-medium"
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => handleNav("#pricing")}
            className="btn-glow px-4 py-2 rounded-lg text-sm font-semibold text-white text-center mt-2"
          >
            Get Started Free
          </button>
        </div>
      )}
    </header>
  );
}
