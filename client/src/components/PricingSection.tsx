/**
 * PricingSection — "Special lifetime offer — pay once, use forever"
 * 4-tier pricing cards with featured "Plus" card
 */

import { Check, X, ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const plans = [
  {
    name: "Basic",
    price: 49,
    original: 456,
    credits: "100 credits/month",
    featured: false,
    features: [
      { text: "Generate unlimited ideas & content briefs", included: true },
      { text: "Write nonfiction books", included: true },
      { text: "Write up to 10,000 words per book", included: true },
      { text: "Write in your own voice", included: true },
      { text: "Generate book covers", included: true },
      { text: "Custom knowledge bases", included: false },
      { text: "Fiction books", included: false },
    ],
  },
  {
    name: "Starter",
    price: 119,
    original: 696,
    credits: "500 credits/month",
    featured: false,
    features: [
      { text: "Everything in Basic", included: true },
      { text: "Write up to 20,000 words per book", included: true },
      { text: "10 custom knowledge bases", included: true },
      { text: "Create digital products (coming soon)", included: true },
      { text: "Fiction books", included: false },
      { text: "Chapter illustrations", included: false },
      { text: "AI editor", included: false },
    ],
  },
  {
    name: "Plus",
    price: 269,
    original: 1416,
    credits: "1,000 credits/month",
    featured: true,
    badge: "Most Popular",
    features: [
      { text: "Everything in Starter", included: true },
      { text: "Write up to 30,000 words per book", included: true },
      { text: "50 custom knowledge bases", included: true },
      { text: "Write fiction books", included: true },
      { text: "Generate chapter illustrations", included: true },
      { text: "AI editor", included: false },
      { text: "Audiobooks (coming soon)", included: false },
    ],
  },
  {
    name: "Pro",
    price: 499,
    original: 2376,
    credits: "2,000 credits/month",
    featured: false,
    features: [
      { text: "Everything in Plus", included: true },
      { text: "Write up to 50,000 words per book", included: true },
      { text: "100 custom knowledge bases", included: true },
      { text: "Edit using AI editor", included: true },
      { text: "Generate audiobooks (coming soon)", included: true },
      { text: "Generate children's books (coming soon)", included: true },
      { text: "Priority support", included: true },
    ],
  },
];

const creditTable = [
  { size: "Mini (up to 5k words)", credits: "25 credits" },
  { size: "Short (up to 10k words)", credits: "50 credits" },
  { size: "Compact (up to 20k words)", credits: "100 credits" },
  { size: "Medium (up to 30k words)", credits: "150 credits" },
  { size: "Extended (up to 40k words)", credits: "200 credits" },
  { size: "Full (up to 50k words)", credits: "250 credits" },
];

export default function PricingSection() {
  const handleGetAccess = (planName: string) => {
    toast.success(`You selected the ${planName} plan!`, {
      description: "Checkout flow coming soon. Connect your payment processor to activate.",
    });
  };

  const discount = (original: number, price: number) =>
    Math.round((1 - price / original) * 100);

  return (
    <section id="pricing" className="py-24 bg-[#0d1526] relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#4F66FF]/30 to-transparent" />
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-[#4F66FF]/5 blur-3xl pointer-events-none" />

      <div className="container max-w-6xl mx-auto px-4 relative">
        <div className="text-center mb-16 fade-up">
          <p className="section-label mb-3">Pricing</p>
          <h2
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Special lifetime offer —{" "}
            <span className="gradient-text">pay once, use forever.</span>
          </h2>
          <p className="text-white/60 text-lg mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Limited spots available. No recurring charges, ever.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm font-semibold">
            ⏰ Save up to 75% — Limited time offer
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-end mb-10">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`rounded-2xl p-6 fade-up relative flex flex-col ${
                plan.featured
                  ? "pricing-featured lg:-mt-4"
                  : "glass-card"
              }`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#4F66FF] to-[#C65BFF] text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                  {(plan as any).badge}
                </div>
              )}

              <div className="mb-5">
                <h3
                  className="text-lg font-bold text-white mb-1"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  {plan.name}
                </h3>
                <p className="text-white/40 text-xs mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {plan.credits}
                </p>

                <div className="flex items-end gap-2 mb-1">
                  <span
                    className="text-4xl font-extrabold text-white"
                    style={{ fontFamily: "'Sora', sans-serif" }}
                  >
                    ${plan.price}
                  </span>
                  <div className="mb-1">
                    <span className="text-white/30 text-sm line-through block">${plan.original}</span>
                    <span className="text-green-400 text-xs font-semibold">
                      Save {discount(plan.original, plan.price)}%
                    </span>
                  </div>
                </div>
                <p className="text-white/40 text-xs" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  one-time payment
                </p>
              </div>

              <button
                onClick={() => handleGetAccess(plan.name)}
                className={`w-full py-3 rounded-xl text-sm font-bold mb-6 transition-all ${
                  plan.featured
                    ? "btn-glow text-white"
                    : "border border-white/20 text-white hover:border-[#4F66FF]/50 hover:bg-[#4F66FF]/10"
                }`}
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                Get Lifetime Access
              </button>

              <ul className="space-y-2.5 flex-1">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    {f.included ? (
                      <Check className="w-4 h-4 text-[#4F66FF] flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-4 h-4 text-white/20 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={f.included ? "text-white/70" : "text-white/30"}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-center text-white/40 text-sm mb-10 fade-up" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Prefer a monthly or yearly plan instead?{" "}
          <button
            className="text-[#4F66FF] hover:underline"
            onClick={() => toast.info("Monthly/yearly plans coming soon!")}
          >
            View subscription plans
          </button>
        </p>

        {/* Credit table */}
        <div className="glass-card rounded-2xl p-6 fade-up">
          <h4
            className="text-white font-semibold mb-4"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Book Lengths & Credits
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {creditTable.map((row, i) => (
              <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                <span className="text-white/60 text-xs" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {row.size}
                </span>
                <span className="text-[#4F66FF] text-xs font-semibold ml-2 whitespace-nowrap">
                  {row.credits}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
