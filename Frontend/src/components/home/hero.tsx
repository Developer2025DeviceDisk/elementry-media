'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Radio, MonitorPlay, Video, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

const slides = [
  {
    eyebrow: 'Elementry Media Technology',
    title: 'Leading Broadcast System Integrator in India',
    description:
      'Specialized in smart solutions, broadcasting technology, and system integration with cutting-edge expertise.',
    action: 'Explore Products',
    href: '/products',
    secondary: 'Talk to an Expert',
    secondHref: '/#contact',
    label: 'Broadcast control room',
    icon: Radio,
  },
  {
    eyebrow: 'Education & Enterprise',
    title: 'Smart Classes, Lecture Capture & Video Conferencing',
    description:
      'Modern educational technology for interactive learning — smart classroom systems, video conferencing and digital content management.',
    action: 'Digital Classroom Solutions',
    href: '/#services',
    secondary: 'About Us',
    secondHref: '/#about',
    label: 'Smart classroom solutions',
    icon: MonitorPlay,
  },
  {
    eyebrow: 'Studios & Workflows',
    title: 'Audio-Video Studios, Built End to End',
    description:
      'From concept to completion — studio design, professional equipment, system integration and support for your production workflow.',
    action: 'Explore Products',
    href: '/products',
    secondary: 'View Services',
    secondHref: '/#services',
    label: 'Professional studio workflows',
    icon: Video,
  },
];
export function Hero() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (
      paused ||
      hovered ||
      focused ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % slides.length),
      5500,
    );
    return () => window.clearInterval(timer);
  }, [paused, hovered, focused]);
  const slide = slides[index];
  const Icon = slide.icon;
  return (
    <section
      aria-label="Broadcast solutions"
      aria-roledescription="carousel"
      className="relative overflow-hidden border-b bg-surface"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <div
        aria-live={paused || focused ? 'polite' : 'off'}
        className="container grid min-h-[580px] items-center gap-10 py-12 pb-24 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-16 lg:pb-24"
      >
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-accent px-3 py-1.5 text-[11px] font-semibold tracking-[.12em] text-accent-foreground uppercase">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
            {slide.eyebrow}
          </p>
          <h1 className="mt-5 max-w-xl text-4xl leading-[1.1] font-semibold tracking-tight text-secondary sm:text-5xl lg:text-[56px]">
            {slide.title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {slide.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href={slide.href}>
                {slide.action} <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={slide.secondHref}>{slide.secondary}</Link>
            </Button>
          </div>
        </div>
        <div className="studio-visual relative overflow-hidden rounded-3xl border border-secondary/10 p-6 text-secondary-foreground shadow-xl shadow-secondary/10 sm:p-8">
          <div className="mb-7 flex items-center justify-between gap-4">
            <span className="text-[10px] font-medium tracking-[.2em] text-white/70 uppercase">
              Designed for your workflow
            </span>
            <Icon aria-hidden="true" className="size-5 text-[#8edbd1]" />
          </div>
          <div
            aria-hidden="true"
            className="rounded-xl border border-white/15 bg-[#091a2b] p-3 shadow-2xl"
          >
            <div className="grid aspect-[16/9] grid-cols-[1.5fr_1fr] gap-2">
              <div className="relative flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[#1f6570] via-[#174052] to-[#182b46]">
                <div className="absolute size-32 rounded-full border border-white/10 sm:size-44" />
                <div className="absolute size-24 rounded-full border border-white/20 sm:size-32" />
                <Icon className="size-12 stroke-[1] text-[#b2e9e2] sm:size-16" />
                <div className="absolute inset-x-3 bottom-3 flex gap-1">
                  {[3, 6, 4, 8, 5, 9, 3, 7, 4, 6, 9, 5, 3, 8, 4, 6, 3, 7].map(
                    (height, position) => (
                      <span
                        key={position}
                        className="flex-1 self-end rounded-t-sm bg-[#8edbd1]/50"
                        style={{ height: `${height * 2}px` }}
                      />
                    ),
                  )}
                </div>
              </div>
              <div className="grid grid-rows-2 gap-2">
                <div className="flex items-center justify-center rounded-lg bg-[#172f46]">
                  <Video className="size-8 stroke-[1] text-white/50" />
                </div>
                <div className="flex items-center justify-center rounded-lg bg-[#183d49]">
                  <svg viewBox="0 0 120 48" className="w-4/5 text-[#8edbd1]" fill="none">
                    <path
                      d="M0 24h14l5-8 6 20 7-31 8 38 7-25 5 6h12l5-12 6 24 7-30 8 37 6-25 5 6h19"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-1.5">
                <span className="size-1.5 rounded-full bg-[#8edbd1]" />
                <span className="size-1.5 rounded-full bg-white/20" />
                <span className="size-1.5 rounded-full bg-white/20" />
              </div>
              <span className="h-1 w-12 rounded-full bg-white/15" />
            </div>
          </div>
          <div aria-hidden="true" className="mx-auto mb-6 h-4 w-20 rounded-b-lg bg-white/10" />
          <div className="flex items-center gap-3 border-t border-white/15 pt-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <Icon className="size-5 text-[#8edbd1]" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-medium">{slide.label}</p>
              <p className="mt-0.5 text-xs text-white/60">Technology. Expertise. Creativity.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-7 flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous slide"
          onClick={() => setIndex((index + slides.length - 1) % slides.length)}
        >
          <ArrowLeft className="size-4" />
        </Button>
        {slides.map((item, position) => (
          <button
            key={item.title}
            aria-label={`Slide ${position + 1}`}
            aria-current={position === index ? 'true' : undefined}
            onClick={() => setIndex(position)}
            className="flex h-11 w-9 items-center justify-center"
          >
            <span
              className={`h-1 w-full rounded ${position === index ? 'bg-primary' : 'bg-border'}`}
            />
          </button>
        ))}
        <Button
          variant="outline"
          size="icon"
          aria-label="Next slide"
          onClick={() => setIndex((index + 1) % slides.length)}
        >
          <ArrowRight className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}
          onClick={() => setPaused(!paused)}
        >
          {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
        </Button>
      </div>
    </section>
  );
}
