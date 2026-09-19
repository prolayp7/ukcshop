"use client";

import { Download, FileText, MessageCircle, ShieldCheck } from "lucide-react";
import type { ApiGeneralSettings, ApiProductBase } from "@/lib/api";
import type { Product } from "@/lib/types";
import { useApi } from "@/lib/use-api";

export default function ProductHelp({ product, api }: { product: Product; api: ApiProductBase }) {
  const settings = useApi<{ data: ApiGeneralSettings }>("/api/settings/general");
  const email = settings.data?.data.supportEmail;
  const contact = email ? `mailto:${email}?subject=${encodeURIComponent(`Product question: ${product.name} (${product.sku})`)}` : null;
  const faqs = api.faqs ?? [];
  const documents = (api.documents ?? []).filter((document) => /^(https?:\/\/|\/[^/])/i.test(document.url));

  return <section className="product-help" aria-label="Product questions and documentation">
    <div className="product-help-questions">
      <div className="product-feedback-heading"><div><p className="product-spec-eyebrow">Product Q&amp;A</p><h2>Frequently Asked Questions</h2></div>{contact && <a className="product-help-ask" href={contact}><MessageCircle size={14} aria-hidden="true" />Ask a Question</a>}</div>
      {faqs.length ? faqs.map((faq) => <article className="product-help-faq" key={faq.id}><h3><span aria-hidden="true">Q:</span>{faq.question}</h3><div className="product-help-answer"><span className="product-help-answer-label"><ShieldCheck size={14} aria-hidden="true" />Product information</span><p>{faq.answer}</p></div></article>) : <p className="product-help-empty">No questions have been answered for this product yet.{contact ? " Contact us for help with specifications or compatibility." : " Check the specifications above for product details."}</p>}
    </div>
    <aside className="product-help-documents" aria-labelledby="product-documents-title"><p className="product-spec-eyebrow">Downloads &amp; documentation</p><h2 id="product-documents-title">Official Documentation</h2><p>Product manuals, data sheets and other supporting documents.</p>
      <div className="product-help-files">{documents.length ? documents.map((document) => <a key={document.id} href={document.url} target="_blank" rel="noopener noreferrer"><FileText size={19} aria-hidden="true" /><span><b>{document.title}</b><small>Open document in a new tab</small></span><Download size={15} aria-hidden="true" /></a>) : <p className="product-help-empty">No documents are available for this product yet.</p>}</div>
      {contact && <p className="product-help-contact">Need help with specifications or compatibility?<br /><a href={contact}>Contact our support team</a></p>}
    </aside>
  </section>;
}
