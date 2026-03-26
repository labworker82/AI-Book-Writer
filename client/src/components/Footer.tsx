/**
 * Footer — Dark Tech Premium
 */

import { BookOpen } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#080e1a] border-t border-white/5 py-12">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4F66FF] to-[#C65BFF] flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg" style={{ fontFamily: "'Sora', sans-serif" }}>
                <span className="gradient-text">AI</span>
                <span className="text-white"> Book Writer</span>
              </span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Practical AI for business owners, marketers, and creators. Turn any idea into a published book in minutes.
            </p>
            <p className="text-white/25 text-xs mt-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Trusted by over 30,000 users worldwide.
            </p>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-white/80 font-semibold text-sm mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>
              Products
            </h4>
            <ul className="space-y-2.5">
              {["AI Book Writer", "Word Generator", "Image Creator"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-white/40 text-sm hover:text-white/70 transition-colors" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white/80 font-semibold text-sm mb-4" style={{ fontFamily: "'Sora', sans-serif" }}>
              Company
            </h4>
            <ul className="space-y-2.5">
              {["About", "Blog", "Partners", "Contact", "Privacy", "Terms"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-white/40 text-sm hover:text-white/70 transition-colors" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/25 text-xs" style={{ fontFamily: "'Outfit', sans-serif" }}>
            © 2026 AI Book Writer. All rights reserved.
          </p>
          <p className="text-white/20 text-xs" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Built with ❤️ for authors everywhere
          </p>
        </div>
      </div>
    </footer>
  );
}
