/**
 * GuaranteeSection — 14-day money-back guarantee
 */

import { Shield } from "lucide-react";

export default function GuaranteeSection() {
  return (
    <section className="py-16 bg-[#0B1220] relative">
      <div className="container max-w-3xl mx-auto px-4">
        <div className="glass-card rounded-2xl p-8 text-center border-[#4F66FF]/20 fade-up">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4F66FF] to-[#C65BFF] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#4F66FF]/30">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div className="inline-block px-3 py-1 rounded-full bg-[#4F66FF]/10 border border-[#4F66FF]/30 text-[#4F66FF] text-xs font-bold uppercase tracking-wider mb-4">
            14-Day Guarantee
          </div>
          <h3
            className="text-2xl font-bold text-white mb-3"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Our "Just Take A Look" Money-Back Guarantee
          </h3>
          <p className="text-white/60 leading-relaxed" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Get instant access to AI Book Writer and try it for yourself for 14 days. If you're not totally
            delighted for any reason, simply let us know within 14 days of purchase and we'll refund your money
            immediately. <span className="text-white/40 text-sm">*Subject to terms of service and not more than 25 credits used.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
