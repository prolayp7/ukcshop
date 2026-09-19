"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CAT_ORDER } from "@/lib/types";
import { useHref } from "@/lib/design-context";
import { useApi } from "@/lib/use-api";
import { ApiGeneralSettings } from "@/lib/api";
import { theme } from "@/lib/theme.config";
import { subscribeNewsletter } from "@/lib/storefront-client";

export default function Footer() {
  const href = useHref();
  const settingsRes = useApi<{ data: ApiGeneralSettings }>("/api/settings/general");
  const settings = settingsRes.data?.data ?? {};
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterState, setNewsletterState] = useState<"idle" | "submitting" | "done" | "error">("idle");

  async function handleNewsletterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNewsletterState("submitting");
    try {
      await subscribeNewsletter(newsletterEmail);
      setNewsletterEmail("");
      setNewsletterState("done");
    } catch {
      setNewsletterState("error");
    }
  }

  return (
    <>
      <section style={{ paddingTop: 6 }}>
        <div className="wrap">
          <div className="newsletter">
            <div>
              <span className="eyebrow">Deals &amp; restock alerts</span>
              <h3>Get restock alerts &amp; deal notifications</h3>
              <p>One email a week, mostly about stock drops and price cuts. No spam.</p>
            </div>
            {newsletterState === "done" ? (
              <p style={{ margin: 0, fontWeight: 600 }}>Thanks for subscribing!</p>
            ) : (
              <form className="newsform" onSubmit={handleNewsletterSubmit}>
                <input
                  type="email"
                  required
                  placeholder="Email address for deals"
                  aria-label="Email address for deals"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                />
                <button type="submit" className="btn btn-p" disabled={newsletterState === "submitting"}>
                  {newsletterState === "submitting" ? "Subscribing…" : "Subscribe"}
                </button>
              </form>
            )}
            {newsletterState === "error" ? <p style={{ margin: "6px 0 0", color: "#c0392b", fontSize: 13 }}>Couldn&rsquo;t subscribe right now — please try again.</p> : null}
          </div>
        </div>
      </section>
      <footer>
        <div className="wrap">
          <div className="fgrid">
            <div>
              <Link className="logo" href={href.home()} style={{ marginBottom: 14 }}>
                <Image className="mark" src={settings.logo || "/images/logo/rigforge-mark.png"} alt={theme.brand.name} width={694} height={512} />
              </Link>
              <p style={{ margin: "0 0 16px", maxWidth: 300 }}>{theme.brand.about}</p>
              <div className="fsocial">
                <a href={settings.socialFacebook || "#"} aria-label="Facebook">
                  FB
                </a>
                <a href={settings.socialInstagram || "#"} aria-label="Instagram">
                  IG
                </a>
                <a href={settings.socialTwitter || "#"} aria-label="X (Twitter)">
                  X
                </a>
                <a href={settings.socialYoutube || "#"} aria-label="YouTube">
                  YT
                </a>
              </div>
            </div>
            <div>
              <h4>Shop</h4>
              <ul>
                {CAT_ORDER.map((c) => (
                  <li key={c}>
                    <Link href={href.category({ cat: c })}>{c}</Link>
                  </li>
                ))}
                <li>
                  <Link href={href.category({ sub: "Gaming PCs" })}>Gaming</Link>
                </li>
                <li>
                  <Link href={href.category({ deals: 1 })}>Deals</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4>Customer Service</h4>
              <ul>
                <li>
                  <a href="#">Contact us</a>
                </li>
                <li>
                  <a href="#">Delivery &amp; returns</a>
                </li>
                <li>
                  <Link href={href.account({ tab: "orders" })}>Warranty &amp; RMA</Link>
                </li>
                <li>
                  <a href="#">Track my order</a>
                </li>
                <li>
                  <a href="#">Payment methods</a>
                </li>
                <li>
                  <a href="/faqs">FAQs</a>
                </li>
              </ul>
            </div>
            <div>
              <h4>Company</h4>
              <ul>
                <li>
                  <a href="/pages/about-us">About us</a>
                </li>
                <li>
                  <a href="/testimonials">Reviews</a>
                </li>
                <li>
                  <a href="#">Careers</a>
                </li>
                <li>
                  <a href="#">Business &amp; education</a>
                </li>
                <li>
                  <a href="#">Services</a>
                </li>
                <li>
                  <Link href={href.brands()}>All brands</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4>Resources</h4>
              <ul>
                <li>
                  <a href="#">Tech hub</a>
                </li>
                <li>
                  <a href="#">Trade-in</a>
                </li>
                <li>
                  <Link href={href.compare()}>Compare products</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="fcontact">
            <div>
              <span>Call us</span>
              <b>{settings.supportPhone1 || theme.contact.phone}</b>
              {settings.supportPhone2 ? <b>{settings.supportPhone2}</b> : null}
            </div>
            <div>
              <span>Email</span>
              <b>{settings.supportEmail || theme.contact.email}</b>
            </div>
            <div>
              <span>Visit</span>
              <b>{settings.companyAddress || theme.contact.address}</b>
              {settings.latitude && settings.longitude ? (
                <a href={`https://www.google.com/maps?q=${encodeURIComponent(settings.latitude)},${encodeURIComponent(settings.longitude)}`} target="_blank" rel="noreferrer">
                  View on map
                </a>
              ) : null}
            </div>
            <div>
              <span>Opening hours</span>
              <b>{settings.openingHours || theme.contact.openingHours}</b>
            </div>
          </div>
          <div className="fbot">
            <div className="fbot-left">
              <span>
                {settings.copyright || `© 2026 ${theme.brand.legalName}`}
                {settings.vatNumber ? ` · VAT ${settings.vatNumber}` : ""}
              </span>
              <div className="flegal">
                <a href="#">Terms &amp; conditions</a>
                <a href="#">Privacy policy</a>
                <a href="#">Cookies</a>
                <a href="#">Accessibility</a>
              </div>
            </div>
            <div className="pay">
              {theme.paymentMethods.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
