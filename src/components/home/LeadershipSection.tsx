"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

const leaders = [
  {
    name: "Prof. Frederick Kwaku Sarfo",
    title: "Vice-Chancellor",
    image: "/leadership/frederick-sarfo.png",
  },
  {
    name: "Prof. Isaac Boateng",
    title: "Pro Vice-Chancellor",
    image: "/leadership/isaac-boateng.png",
  },
  {
    name: "Mr. Augustus Kwaw Brew",
    title: "Registrar",
    image: "/leadership/augustus-brew.png",
  },
  {
    name: "Prof. Isaac Abunyuwah",
    title: "Principal, Mampong Campus",
    image: "/leadership/isaac-abunyuwah.png",
  },
  {
    name: "Dr. Chris M. Owusu-Ansah",
    title: "University Librarian",
    image: "/leadership/chris-owusu-ansah.png",
  },
  {
    name: "Dr. Isaac Marfo Oduro",
    title: "Ag. Director of Internal Audit",
    image: "/leadership/isaac-marfo-oduro.png",
  },
] as const;

export function LeadershipSection() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, count: 1 });
  const [canScrollPrevious, setCanScrollPrevious] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const updateCarouselState = useCallback(() => {
    const carousel = carouselRef.current;
    const firstCard = carousel?.firstElementChild as HTMLElement | null;

    if (!carousel || !firstCard) return;

    const styles = window.getComputedStyle(carousel);
    const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
    const cardStep = firstCard.offsetWidth + gap;
    const visibleCount = Math.max(
      1,
      Math.round((carousel.clientWidth + gap) / cardStep),
    );
    const maxStart = Math.max(0, leaders.length - visibleCount);
    const start = Math.min(maxStart, Math.round(carousel.scrollLeft / cardStep));
    const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;

    setVisibleRange({ start, count: visibleCount });
    setCanScrollPrevious(carousel.scrollLeft > 2);
    setCanScrollNext(carousel.scrollLeft < maxScrollLeft - 2);
  }, []);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const resizeObserver = new ResizeObserver(updateCarouselState);
    const animationFrame = window.requestAnimationFrame(updateCarouselState);

    resizeObserver.observe(carousel);
    carousel.addEventListener("scroll", updateCarouselState, { passive: true });

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      carousel.removeEventListener("scroll", updateCarouselState);
    };
  }, [updateCarouselState]);

  function scrollCarousel(direction: "previous" | "next") {
    const carousel = carouselRef.current;
    if (!carousel) return;

    carousel.scrollBy({
      left: direction === "next" ? carousel.clientWidth : -carousel.clientWidth,
      behavior: "smooth",
    });
  }

  return (
    <section id="leadership" className="scroll-mt-24 bg-muted/30 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            University Leadership
          </p>
          <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
            Meet USTED&apos;s Management
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            The university officers providing academic, administrative, and
            institutional leadership across USTED&apos;s campuses.
          </p>
        </div>

        <div className="mt-10 flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-muted-foreground" aria-live="polite">
            Showing {visibleRange.start + 1}–
            {Math.min(
              visibleRange.start + visibleRange.count,
              leaders.length,
            )}{" "}
            of {leaders.length}
          </p>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              className="rounded-full"
              onClick={() => scrollCarousel("previous")}
              disabled={!canScrollPrevious}
              aria-label="Show previous university leaders"
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              className="rounded-full"
              onClick={() => scrollCarousel("next")}
              disabled={!canScrollNext}
              aria-label="Show next university leaders"
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div
          ref={carouselRef}
          role="region"
          aria-roledescription="carousel"
          aria-label="University leadership"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") scrollCarousel("previous");
            if (event.key === "ArrowRight") scrollCarousel("next");
          }}
          className="mt-6 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {leaders.map((leader) => (
            <article
              key={leader.name}
              aria-roledescription="slide"
              className="group min-w-0 shrink-0 basis-full snap-start overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-transform hover:-translate-y-1 hover:shadow-xl sm:basis-[calc(50%_-_0.75rem)] lg:basis-[calc(33.333333%_-_1rem)]"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <Image
                  src={leader.image}
                  alt={`${leader.name}, ${leader.title}`}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-6">
                <h3 className="font-display text-lg font-bold">{leader.name}</h3>
                <p className="mt-1 text-sm font-medium text-primary">{leader.title}</p>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Names, titles, and portraits sourced from the official{" "}
          <Link
            href="https://usted.edu.gh/management/"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-primary hover:underline"
          >
            USTED Management page
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
