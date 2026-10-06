"use client";

import { useEffect, useRef, type ReactNode } from "react";

export default function AutoScrollCards({ children, className, label }: { children: ReactNode; className: string; label: string }) {
  const carouselRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const mobile = window.matchMedia("(max-width: 767px)");
    const cards = Array.from(carousel.children) as HTMLElement[];
    if (cards.length < 2) return;

    let index = 0;
    let paused = false;
    let resumeTimer: number | undefined;
    const pause = () => { paused = true; };
    const resume = () => {
      paused = false;
      window.clearTimeout(resumeTimer);
    };
    const resumeAfterInteraction = () => {
      window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => { paused = false; }, 5000);
    };
    const cardPosition = (card: HTMLElement) => card.offsetLeft - cards[0].offsetLeft;
    const syncIndex = () => {
      index = cards.reduce((closest, card, cardIndex) => {
        const distance = Math.abs(cardPosition(card) - carousel.scrollLeft);
        return distance < Math.abs(cardPosition(cards[closest]) - carousel.scrollLeft) ? cardIndex : closest;
      }, 0);
    };
    const interval = window.setInterval(() => {
      if (!mobile.matches || paused || document.hidden) return;
      index = (index + 1) % cards.length;
      carousel.scrollTo({ left: cardPosition(cards[index]), behavior: "smooth" });
    }, 4200);

    carousel.addEventListener("mouseenter", pause);
    carousel.addEventListener("mouseleave", resume);
    carousel.addEventListener("focusin", pause);
    carousel.addEventListener("focusout", resume);
    carousel.addEventListener("pointerdown", pause);
    carousel.addEventListener("pointerup", resumeAfterInteraction);
    carousel.addEventListener("pointercancel", resumeAfterInteraction);
    carousel.addEventListener("scroll", syncIndex, { passive: true });

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(resumeTimer);
      carousel.removeEventListener("mouseenter", pause);
      carousel.removeEventListener("mouseleave", resume);
      carousel.removeEventListener("focusin", pause);
      carousel.removeEventListener("focusout", resume);
      carousel.removeEventListener("pointerdown", pause);
      carousel.removeEventListener("pointerup", resumeAfterInteraction);
      carousel.removeEventListener("pointercancel", resumeAfterInteraction);
      carousel.removeEventListener("scroll", syncIndex);
    };
  }, []);

  return <div className={`auto-scroll-cards ${className}`} ref={carouselRef} role="region" aria-label={label} aria-roledescription="carousel" tabIndex={0}>{children}</div>;
}