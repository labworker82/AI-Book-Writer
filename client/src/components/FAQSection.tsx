/**
 * FAQSection — Accordion-style FAQ
 */

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Who is this for?",
    a: "AI Book Writer is built for entrepreneurs, coaches, consultants, marketers, educators, and aspiring authors who want to write and publish books without spending months on the process. Whether you want to build authority, create a new income stream, or simply share your knowledge, this tool is for you.",
  },
  {
    q: "What AI technology does AI Book Writer use?",
    a: "AI Book Writer uses a combination of the latest large language models (LLMs) combined with our proprietary book-writing algorithm that ensures coherence, consistency, and quality across the entire manuscript — not just individual paragraphs.",
  },
  {
    q: "What's the difference between using ChatGPT and AI Book Writer?",
    a: "ChatGPT is a general-purpose tool. AI Book Writer is purpose-built for writing full-length books. It handles structure, chapter-to-chapter consistency, voice control, and even generates your Amazon KDP metadata. You'd need dozens of custom prompts and hours of work to replicate what AI Book Writer does in minutes.",
  },
  {
    q: "Can I switch plans after signing up?",
    a: "Yes! You can upgrade your plan at any time. If you're on a lifetime deal, you can upgrade to a higher tier and pay only the difference.",
  },
  {
    q: "Do I own the rights to my books?",
    a: "Absolutely. Any content you create with AI Book Writer is 100% yours. You retain full copyright and publishing rights to everything you generate.",
  },
  {
    q: "Is my data safe with AI Book Writer?",
    a: "Yes. We take data security seriously. Your content, writing samples, and uploaded documents are encrypted and never shared with third parties. We do not use your content to train our models.",
  },
  {
    q: "Will it sound like AI?",
    a: "Our system is specifically designed to avoid the generic, robotic tone that plagues most AI writing tools. By uploading writing samples and customizing tone settings, you can make the output sound authentically like you. Most readers won't be able to tell the difference.",
  },
  {
    q: "What formats can I export?",
    a: "You can export your manuscript in DOCX (Word) and EPUB formats, which are compatible with Amazon KDP, IngramSpark, and most other publishing platforms.",
  },
  {
    q: "How do I publish books created by AI Book Writer?",
    a: "Once your manuscript is ready, you can upload it directly to Amazon KDP. AI Book Writer generates all the metadata you need (title, description, keywords, categories) so the upload process takes under 5 minutes.",
  },
  {
    q: "Is there a learning curve to using AI Book Writer?",
    a: "No. The interface is designed to be intuitive and guide you step by step. Most users write their first complete book on their first session. No technical skills or prompting expertise required.",
  },
  {
    q: "Does AI Book Writer offer customer support?",
    a: "Yes! We offer email support for all plans, with priority support for Pro plan users. We also have a comprehensive knowledge base and community forum.",
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 bg-[#0d1526] relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#4F66FF]/30 to-transparent" />

      <div className="container max-w-3xl mx-auto px-4">
        <div className="text-center mb-16 fade-up">
          <p className="section-label mb-3">Support</p>
          <h2
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Frequently asked{" "}
            <span className="gradient-text">questions.</span>
          </h2>
          <p className="text-white/60 text-lg" style={{ fontFamily: "'Outfit', sans-serif" }}>
            We're here to answer all your questions.
          </p>
        </div>

        <div className="space-y-3 fade-up">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`glass-card rounded-xl overflow-hidden transition-all duration-300 ${
                open === i ? "border-[#4F66FF]/30" : "hover:border-white/15"
              }`}
            >
              <button
                className="w-full flex items-center justify-between px-6 py-4 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span
                  className="text-white font-medium text-sm pr-4"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-white/40 flex-shrink-0 transition-transform duration-300 ${
                    open === i ? "rotate-180 text-[#4F66FF]" : ""
                  }`}
                />
              </button>
              {open === i && (
                <div className="px-6 pb-5">
                  <p
                    className="text-white/60 text-sm leading-relaxed"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {faq.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
