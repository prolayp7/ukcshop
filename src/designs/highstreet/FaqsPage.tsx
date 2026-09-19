"use client";

import { useState } from "react";
import { useApi } from "@/lib/use-api";
import { ApiFaqCategory } from "@/lib/api";
import { Icon } from "@/components/Icon";
import { useHref } from "@/lib/design-context";
import Crumbs from "@/components/Crumbs";
import Header from "./Header";
import Footer from "./Footer";

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item${open ? " open" : ""}`}>
      <div className="faq-q" onClick={() => setOpen((o) => !o)}>
        {question}
        <Icon id="i-arr" w={14} />
      </div>
      <div className="faq-a">
        <div className="faq-a-inner">
          <p>{answer}</p>
        </div>
      </div>
    </div>
  );
}

export default function FaqsPage() {
  const href = useHref();
  const res = useApi<{ items: ApiFaqCategory[] }>("/api/faqs");
  const categories = res.data?.items ?? [];

  return (
    <>
      <Header />
      <Crumbs items={[{ label: "Home", href: href.home() }, { label: "FAQs" }]} />
      <div className="wrap">
        <div className="info-hero">
          <span className="eyebrow">Help centre</span>
          <h1>Frequently asked questions</h1>
          <p>Delivery, returns, warranty and ordering — the questions we get asked most.</p>
        </div>
        {categories.length ? (
          categories.map((cat) => (
            <div className="faq-group" key={cat.id}>
              <h2>{cat.name}</h2>
              {cat.faqs.map((f) => (
                <FaqItem key={f.id} question={f.question} answer={f.answer} />
              ))}
            </div>
          ))
        ) : res.loading ? (
          <p style={{ color: "var(--body)" }}>Loading…</p>
        ) : (
          <p style={{ color: "var(--body)" }}>No FAQs published yet.</p>
        )}
      </div>
      <Footer />
    </>
  );
}
