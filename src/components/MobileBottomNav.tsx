"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { BookOpenText, ChevronDown, ChevronRight, Grid2x2, Home, LifeBuoy, Search, UserRound, type LucideIcon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Icon } from "@/components/Icon";
import { useHref, useInitialStorefrontChrome } from "@/lib/design-context";
import type { ApiCategory, HeaderNavItem } from "@/lib/api";
import { theme } from "@/lib/theme.config";

const links: Array<{ href: string | null; label: string; icon: LucideIcon; action?: "categories" | "search" }> = [
  { href: "/", label: "Home", icon: Home },
  { href: null, label: "Categories", icon: Grid2x2, action: "categories" },
  { href: "/faqs", label: "Guides", icon: BookOpenText },
  { href: null, label: "Search", icon: Search, action: "search" },
  { href: "/account", label: "Account", icon: UserRound },
];

function MenuArtwork({ image, alt, icon, className }: { image?: string | null; alt: string; icon: string | null; className: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <span className={className} aria-hidden="true">
      {image && !imageFailed ? <Image src={image} alt={alt} width={36} height={36} unoptimized onError={() => setImageFailed(true)} /> : <Icon id={icon || "i-gpu"} w={18} h={18} />}
    </span>
  );
}

export function MobileBottomNav({ categories }: { categories: ApiCategory[] }) {
  const pathname = usePathname();
  const href = useHref();
  const { nav: headerNav, settings } = useInitialStorefrontChrome();
  const [open, setOpen] = useState(false);
  const [expandedDepartment, setExpandedDepartment] = useState<string | null>(null);
  const departments: HeaderNavItem[] = headerNav ?? categories.map((category) => ({
    label: category.title,
    href: href.category({ cat: category.slug }),
    icon: null,
    highlight: false,
    panel: category.children.length ? {
      kind: "auto",
      eyebrow: null,
      links: category.children.map((child) => ({ label: child.title, href: href.category({ sub: child.slug }) })),
      promo: null,
    } : null,
  }));
  const categoryByTitle = new Map(categories.flatMap((category) => [category, ...category.children]).map((category) => [category.title.toLowerCase(), category]));

  const renderPanelLink = (department: HeaderNavItem, link: { label: string; href: string }) => {
    const category = categoryByTitle.get(link.label.toLowerCase());
    return (
      <Link key={`${link.label}-${link.href}`} href={link.href} onClick={() => setOpen(false)} className="mobile-mega-link">
        <MenuArtwork className="mobile-mega-image" image={category?.thumbnailImage} alt={category?.thumbnailImageAlt || ""} icon={department.icon} />
        <span>{link.label}</span>
        <ChevronRight size={16} aria-hidden="true" />
      </Link>
    );
  };

  return (
    <div className="sm:hidden">
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 grid h-[calc(76px+env(safe-area-inset-bottom))] grid-cols-5 bg-[#14171b] px-2 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 text-[11px] text-slate-300 shadow-[0_-12px_30px_rgba(15,23,42,0.18)]"
      >
        {links.map((link) => {
          const Icon = link.icon;
          const active =
            link.action === "categories"
              ? open || pathname.startsWith("/c/") || pathname.startsWith("/category/")
              : !open && link.href !== null && (link.href === "/" ? pathname === "/" : pathname === link.href || pathname.startsWith(`${link.href}/`) || (link.label === "Account" && (pathname === "/login" || pathname === "/register" || pathname === "/forgot-password")));

          const content = (
            <>
              <Icon className={`h-5.5 w-5.5 ${active ? "text-[#e40503]" : "text-slate-300"}`} />
              {active && <span aria-hidden className="absolute top-1.5 h-1.5 w-1.5 rounded-full bg-[#e40503]" />}
              <span className={`mt-0.5 ${active ? "text-[#e40503]" : "text-slate-300"}`}>{link.label}</span>
            </>
          );

          if (!link.href) {
            return (
              <button
                key={link.label}
                type="button"
                data-mobile-search-trigger={link.action === "search" ? "" : undefined}
                aria-haspopup={link.action ? "dialog" : undefined}
                aria-expanded={link.action === "categories" ? open : undefined}
                onClick={() => {
                  if (link.action === "search") {
                    window.dispatchEvent(new Event("ukcs:open-mobile-search"));
                  } else {
                    setOpen(true);
                  }
                }}
                className="relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-md px-1 text-center focus-visible:outline-2 focus-visible:outline-[#e40503]"
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={link.label}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className="relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-md px-1 text-center transition hover:text-white focus-visible:outline-2 focus-visible:outline-[#e40503]"
            >
              {content}
            </Link>
          );
        })}
      </nav>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="mobile-category-sheet w-full gap-0 p-0 sm:max-w-sm">
          <SheetHeader className="mobile-category-header border-b px-4 py-3">
            <SheetTitle className="text-left">
              <Link href="/" onClick={() => setOpen(false)} className="mobile-category-brand">
                <Image src={settings.logo || "/images/logo/rigforge-mark.png"} alt={theme.brand.name} width={96} height={72} unoptimized className="mobile-category-logo" />
                <span>{theme.brand.name}</span>
              </Link>
            </SheetTitle>
          </SheetHeader>

          <nav aria-label="Departments" className="mobile-category-nav">
            <p className="mobile-category-label">Departments</p>
            <ul className="mobile-departments">
              {departments.map((department) => {
                const rootCategory = categoryByTitle.get(department.label.toLowerCase());
                const panelId = `mobile-department-${department.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
                const expanded = expandedDepartment === department.label;
                return (
                  <li className="mobile-department" key={`${department.label}-${department.href}`}>
                    <div className="mobile-department-row">
                      <Link href={department.href} onClick={() => setOpen(false)} className="mobile-department-link">
                        <MenuArtwork className="mobile-department-image" image={rootCategory?.thumbnailImage} alt={rootCategory?.thumbnailImageAlt || ""} icon={department.icon} />
                        <span>{department.label}</span>
                      </Link>
                      {department.panel ? (
                        <button type="button" className="mobile-department-toggle" aria-label={`${expanded ? "Hide" : "Show"} ${department.label} subcategories`} aria-expanded={expanded} aria-controls={panelId} onClick={() => setExpandedDepartment(expanded ? null : department.label)}>
                          <ChevronDown size={18} aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>
                    {department.panel && expanded ? (
                      <div className="mobile-mega-panel" id={panelId}>
                        {department.panel.kind === "auto" ? (
                          <div className="mobile-mega-grid">
                            {department.panel.links.map((link) => renderPanelLink(department, link))}
                          </div>
                        ) : department.panel.columns.map((column, index) => (
                          <div className="mobile-mega-column" key={`${department.label}-column-${index}`}>
                            {column.title ? <h3>{column.title}</h3> : null}
                            <div className="mobile-mega-grid">
                              {column.links.map((link) => renderPanelLink(department, link))}
                            </div>
                          </div>
                        ))}
                        {department.panel.promo ? (
                          <Link href={department.panel.promo.href} onClick={() => setOpen(false)} className="mobile-mega-promo">
                            <span>Featured</span>
                            <strong>{department.panel.promo.title}</strong>
                            {department.panel.promo.text ? <span>{department.panel.promo.text}</span> : null}
                            <b>{department.panel.promo.cta}<Icon id="i-arr" w={14} /></b>
                          </Link>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>

            <div className="mobile-category-extras">
              <Link href="/faqs" onClick={() => setOpen(false)}>
                <LifeBuoy size={17} />
                Help centre
              </Link>
              <Link href={href.account({ tab: "orders" })} onClick={() => setOpen(false)}>
                <Grid2x2 size={17} />
                Track order
              </Link>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
