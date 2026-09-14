"use client";

import { CSSProperties, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Icon } from "@/components/Icon";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { useHref } from "@/lib/design-context";
import { HomeBundle } from "@/lib/api";

const AUTOPLAY_DELAY = 6500;

type HeroSlide = HomeBundle["hero"]["slides"][number];
export type HeroSideCard = { kicker: string; heading: string; description: string; ctaLabel: string; href: string; image: string | null };

const contentVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 24 : -24 }),
  centre: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -18 : 18 }),
};

export default function Hero({ slides, sideCards }: { slides: HeroSlide[]; sideCards: HeroSideCard[] }) {
  const href = useHref();
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [hovered, setHovered] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [pageHidden, setPageHidden] = useState(false);
  const paused = hovered || focusWithin || pageHidden;

  const selectSlide = useCallback((nextIndex: number) => {
    setActiveIndex((currentIndex) => {
      if (currentIndex === nextIndex) return currentIndex;
      setDirection(nextIndex > currentIndex ? 1 : -1);
      return nextIndex;
    });
  }, []);

  const stepSlide = useCallback((step: number) => {
    setDirection(step > 0 ? 1 : -1);
    setActiveIndex((currentIndex) => (currentIndex + step + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (paused || reduceMotion || slides.length < 2) return;

    const timer = window.setTimeout(() => stepSlide(1), AUTOPLAY_DELAY);
    return () => window.clearTimeout(timer);
  }, [activeIndex, paused, reduceMotion, slides.length, stepSlide]);

  useEffect(() => {
    const handleVisibility = () => setPageHidden(document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  if (!slides.length) return null;

  const slide = slides[Math.min(activeIndex, slides.length - 1)];
  const instantTransition = { duration: 0.01 };

  return (
    <section
      className="hero"
      aria-roledescription="carousel"
      aria-label="Featured collections"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocusWithin(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") stepSlide(-1);
        if (event.key === "ArrowRight") stepSlide(1);
      }}
    >
      <div className="hero-frame">
        <div className="grid">
          <div className={`slide hero-tone-${slide.tone.toLowerCase()}`}>
            {slide.image ? (
              <AnimatePresence custom={direction}>
                <motion.div
                  className="hero-media"
                  key={slide.image}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.045 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={reduceMotion ? instantTransition : { duration: 0.78, ease: [0.16, 1, 0.3, 1] }}
                  aria-hidden="true"
                >
                  <Image src={slide.image} alt="" fill sizes="(max-width: 1100px) 100vw, calc(100vw - 460px)" preload={activeIndex === 0} style={{ objectFit: "cover", objectPosition: slide.imagePosition ?? "center" }} />
                </motion.div>
              </AnimatePresence>
            ) : null}

            <div className="hero-veil" aria-hidden="true" />
            <motion.div className="hero-glow" aria-hidden="true" animate={reduceMotion ? undefined : { opacity: [0.45, 0.82, 0.58], scale: [0.96, 1.035, 1] }} transition={{ duration: 1.25, ease: [0.16, 1, 0.3, 1] }} />

            <div className="txt">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div className="txt-inner" key={activeIndex} custom={direction} variants={contentVariants} initial="enter" animate="centre" exit="exit" transition={reduceMotion ? instantTransition : { duration: 0.34, ease: [0.22, 1, 0.36, 1] }}>
                  {slide.eyebrow ? (
                    <motion.span className="tag" initial={reduceMotion ? false : { opacity: 0, y: 9 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.34 }}>
                      {slide.eyebrow}
                    </motion.span>
                  ) : null}

                  <h2 className="slide-lead" aria-label={slide.headline}>
                    {slide.headline.split(" ").map((word, index) => (
                      <span className="hero-word-mask" aria-hidden="true" key={`${word}-${index}`}>
                        <motion.span initial={reduceMotion ? false : { y: "112%", opacity: 0, filter: "blur(5px)" }} animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }} transition={{ delay: 0.11 + Math.min(index, 8) * 0.025, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
                          {word}&nbsp;
                        </motion.span>
                      </span>
                    ))}
                  </h2>

                  {slide.subheading ? (
                    <motion.p initial={reduceMotion ? false : { opacity: 0, y: 12, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ delay: 0.32, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                      {slide.subheading}
                    </motion.p>
                  ) : null}

                  {slide.ctaLabel || slide.secondaryCtaLabel ? (
                    <motion.div className="hero-actions" initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.43, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}>
                      {slide.ctaLabel ? (
                        <motion.div className="hero-cta-motion" whileHover={reduceMotion ? undefined : { y: -2 }} whileTap={{ scale: 0.98 }}>
                          <ShimmerButton className="btn btn-p hero-primary-cta" href={slide.ctaUrl ?? href.home()} shimmerColor="#f4f5f7" shimmerSize="0.09em" shimmerDuration="3.6s" borderRadius="9px" background="#e2231a">
                            <span>{slide.ctaLabel}</span><Icon id="i-arr" w={16} />
                          </ShimmerButton>
                        </motion.div>
                      ) : null}
                      {slide.secondaryCtaLabel ? (
                        <motion.div className="hero-cta-motion" whileHover={reduceMotion ? undefined : { y: -2 }} whileTap={{ scale: 0.98 }}>
                          <Link className="btn btn-g" href={slide.secondaryCtaUrl ?? href.home()}><span>{slide.secondaryCtaLabel}</span><Icon id="i-arr" w={16} /></Link>
                        </motion.div>
                      ) : null}
                    </motion.div>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>

            {slides.length > 1 ? (
              <div className="hero-controls" aria-label="Choose featured collection">
                {slides.map((item, index) => (
                  <button type="button" className="hero-dot" key={item.id} aria-label={`Show slide ${index + 1}: ${item.headline}`} aria-current={index === activeIndex ? "true" : undefined} onClick={() => selectSlide(index)}>
                    <span className="hero-dot-track">
                      {index === activeIndex && <motion.span className="hero-dot-progress" key={`${activeIndex}-${paused}`} initial={{ scaleX: 0 }} animate={{ scaleX: paused || reduceMotion ? 0 : 1 }} transition={paused || reduceMotion ? instantTransition : { duration: AUTOPLAY_DELAY / 1000, ease: "linear" }} />}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="side">
            {sideCards.map((card, index) => (
              <motion.div key={index} initial={reduceMotion ? false : { opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.24 + index * 0.1, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}>
                <Link className="scard" href={card.href} style={card.image ? ({ "--scard-image": `url(${encodeURI(card.image)})` } as CSSProperties) : undefined}><div><span className={index === 1 ? "k scard-service-label" : "k"}>{card.kicker}</span><h3>{card.heading}</h3><p>{card.description}</p></div><span className="go">{card.ctaLabel} <Icon id="i-arr" w={14} /></span></Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
