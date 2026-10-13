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
    action: 'Our Services',
    href: '/#services',
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
      className="relative overflow-hidden border-b"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <div
        aria-live={paused || focused ? 'polite' : 'off'}
        className="container grid min-h-[580px] items-center gap-10 py-16 pb-24 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-20 lg:pb-24"
      >
        <div>
          <p className="text-xs font-bold tracking-[.14em] text-primary uppercase">
            {slide.eyebrow}
          </p>
          <h1 className="mt-4 max-w-xl text-4xl leading-[1.08] font-bold tracking-tight sm:text-5xl lg:text-[58px]">
            {slide.title}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-gray-600">{slide.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href={slide.href}>{slide.action}</Link>
            </Button>
            <Button asChild variant="outline" className="border-foreground">
              <Link href={slide.secondHref}>{slide.secondary}</Link>
            </Button>
          </div>
        </div>
        <div className="Elementry-visual relative flex h-60 items-center justify-center overflow-hidden rounded-[20px] border shadow-sm lg:h-[400px]">
          <div className="absolute -top-16 -right-16 size-56 rounded-full bg-muted" />
          <Icon aria-hidden="true" className="relative size-28 stroke-[1] text-primary/70" />
          <span className="absolute bottom-5 left-5 text-sm text-muted-foreground">
            {slide.label}
          </span>
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
