"use client";

import Image from "next/image";
import Link from "next/link";
import { CAT_ORDER } from "@/lib/types";
import { useHref, useInitialStorefrontChrome } from "@/lib/design-context";
import { theme } from "@/lib/theme.config";
import type { Product } from "@/lib/types";
import { useRecentIds } from "@/lib/basket";
import { useApi } from "@/lib/use-api";
import NewsletterForm from "./NewsletterForm";
import Section from "./Section";
import { reopenCookieBanner } from "@/components/CookieBanner";

export default function Footer() {
  const href = useHref();
  const { settings, footerMenu: menuColumns, footerContent: content } = useInitialStorefrontChrome();
  const recentIds = useRecentIds().slice(0, 4);
  const recentProductsRes = useApi<{ items: Product[] }>(recentIds.length ? `/api/products?ids=${recentIds.join(",")}` : null);
  const aboutText = content ? content.aboutText : theme.brand.about;
  const paymentMethods = content?.paymentMethods ?? theme.paymentMethods;
  const socialLinks = [
    { label: "Facebook", short: "FB", url: settings.socialFacebook },
    { label: "Instagram", short: "IG", url: settings.socialInstagram },
    { label: "X (Twitter)", short: "X", url: settings.socialTwitter },
    { label: "YouTube", short: "YT", url: settings.socialYoutube },
  ].filter((social): social is { label: string; short: string; url: string } => Boolean(social.url?.trim()));
  return (
    <>
      <Section title="Your browsing history" items={recentProductsRes.data?.items ?? []} />
      <footer>
        <div className="wrap">
          <div className="fgrid">
            <div>
              <Link className="logo" href={href.home()} style={{ marginBottom: 14 }}>
                <Image className="mark" src={settings.logo || "/images/logo/rigforge-mark.png"} alt={theme.brand.name} width={694} height={512} />
              </Link>
              {aboutText ? <p style={{ margin: "0 0 16px", maxWidth: 300 }}>{aboutText}</p> : null}
              {/* Only the profiles set in Admin > Settings; the row hides when none are. */}
              {socialLinks.length ? (
                <div className="fsocial">
                  {socialLinks.map((social) => (
                    <a key={social.label} href={social.url} aria-label={social.label} target="_blank" rel="noopener noreferrer">
                      {social.short}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
            {menuColumns.length ? menuColumns.map((column) => (
              <div key={column.title}>
                <h4>{column.title}</h4>
                <ul>
                  {column.links.map((link) => (
                    <li key={link.label + link.href}>
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )) : (
              <>
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
                  <Link href={href.account({ tab: "orders" })}>Warranty &amp; RMA</Link>
                </li>
                <li>
                  <Link href={href.account({ tab: "orders" })}>Track my order</Link>
                </li>
                <li>
                  <Link href="/faqs">FAQs</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4>Company</h4>
              <ul>
                <li>
                  <Link href="/pages/about-us">About us</Link>
                </li>
                <li>
                  <Link href="/testimonials">Reviews</Link>
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
                  <Link href={href.compare()}>Compare products</Link>
                </li>
              </ul>
            </div>
              </>
            )}
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
              {/* Legal pages are linked from the "Legal" column in Admin > Menus > Footer. This button lets a
                  visitor change or withdraw their cookie choice as easily as they gave it (PECR). */}
              <div className="flegal">
                <button type="button" onClick={reopenCookieBanner} style={{ background: "none", border: 0, padding: 0, color: "inherit", font: "inherit", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2 }}>
                  Cookie preferences
                </button>
              </div>
            </div>
            {paymentMethods.length ? (
              <div className="pay">
                {paymentMethods.map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </footer>
    </>
  );
}
