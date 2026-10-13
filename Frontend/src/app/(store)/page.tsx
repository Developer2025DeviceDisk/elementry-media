import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, Radio, Users, Target, Headphones, ShieldCheck, Check } from 'lucide-react';
import { connection } from 'next/server';
import { getCatalog } from '@/lib/api/catalog.server';
import { ProductGrid } from '@/components/product/product-grid';
import { ErrorState } from '@/components/common/states';
import { Button } from '@/components/ui/button';
import { Hero } from '@/components/home/hero';
import { services } from '@/components/home/services';

export const metadata: Metadata = { alternates: { canonical: '/' } };
const values = [
  {
    icon: Users,
    title: 'Expert Team',
    text: 'Dedicated broadcast professionals and trained engineers with extensive industry experience.',
  },
  {
    icon: Target,
    title: 'Personal Guidance',
    text: 'Product selection, system design, and implementation tailored to your needs.',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    text: 'Support via phone, online, and on-site throughout the year.',
  },
  {
    icon: ShieldCheck,
    title: 'One Stop Solution',
    text: 'Complete solutions according to your requirements and budget.',
  },
];
const faqs = [
  [
    'What does Elementry Media Technology do?',
    'We specialize in Smart Classes, Lecture Capture, Video Conferencing, Audio-Video Studios and System Integration, along with broadcast equipment and services.',
  ],
  ['When was Elementry Media founded?', 'Elementry Media Technology was founded in 2016.'],
  [
    'Do you provide support after installation?',
    'We offer support via phone, online and on-site, plus annual maintenance contracts.',
  ],
  [
    'Can you help me choose the right equipment?',
    'Our team provides personal guidance on product selection, system design and implementation to suit your needs and budget.',
  ],
  [
    'Do you offer equipment rental?',
    'Yes — playout automation, encoders, decoders, and live event equipment rental.',
  ],
];
export default async function HomePage() {
  await connection();
  const catalog = await getCatalog(1, 8)
    .then((data) => ({ data, error: undefined }))
    .catch((error: unknown) => ({ data: undefined, error }));
  return (
    <>
      <Hero />
      <div className="border-b">
        <div className="container grid grid-cols-2 text-center md:grid-cols-4">
          {[
            ['8', '+', 'Years Experience'],
            ['200', '+', 'Projects Completed'],
            ['50', '+', 'Happy Clients'],
            ['24', '/7', 'Support Available'],
          ].map(([number, suffix, label]) => (
            <div key={label} className="border-r px-3 py-8 last:border-0">
              <p className="text-4xl font-bold">
                {number}
                <span className="text-primary">{suffix}</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
      <section
        id="about"
        className="container grid items-center gap-14 py-20 lg:grid-cols-[1.1fr_1fr]"
      >
        <div>
          <p className="text-xs font-bold tracking-widest text-primary uppercase">Our Story</p>
          <h2 className="mt-3 text-3xl leading-tight font-bold sm:text-4xl">
            Your Trusted Partner in Broadcast Solutions
          </h2>
          <p className="mt-5 text-lg text-gray-600">
            Founded in 2016, Elementry Media Technology specializes in Smart Classes, Lecture
            Capture, Video Conferencing, Audio-Video Studio, and System Integration.
          </p>
          <p className="mt-4 text-muted-foreground">
            Our experts blend technology, technical expertise, and creativity to deliver reliable
            and tailored broadcasting solutions in India and abroad.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-3 text-sm font-semibold">
            <Check className="size-5 text-primary" />
            ATHENSA Certified Business Partner
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
            We collaborate with industry leaders including:
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['APACE Systems', 'ISID MAM', 'Tulix Systems', 'SuperMicro'].map((brand) => (
              <span key={brand} className="rounded-full border px-4 py-2 text-sm font-semibold">
                {brand}
              </span>
            ))}
          </div>
        </div>
        <div className="Elementry-visual flex min-h-72 flex-col items-center justify-center gap-5 rounded-[20px] border p-8 lg:min-h-96">
          <Radio className="size-24 stroke-[1] text-primary" aria-hidden="true" />
          <p className="text-center text-xl font-bold">Technology. Expertise. Creativity.</p>
          <p className="text-center text-sm text-muted-foreground">
            Broadcast solutions, designed around your workflow.
          </p>
        </div>
      </section>
      <section className="border-y bg-gray-50 py-20" id="why">
        <div className="container">
          <p className="text-xs font-bold tracking-widest text-primary uppercase">Our Values</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">What we stand for</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-[14px] border bg-background p-6">
                <div className="flex size-11 items-center justify-center rounded-lg bg-muted text-primary">
                  <Icon className="size-6" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section id="services" className="container py-20">
        <p className="text-xs font-bold tracking-widest text-primary uppercase">What We Do</p>
        <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Comprehensive Broadcast Services</h2>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          End-to-end solutions for all your broadcasting needs. From consultancy to implementation
          and support.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map(([title, text]) => (
            <article
              key={title}
              className="rounded-[14px] border p-6 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
            >
              <div
                aria-hidden="true"
                className="flex size-11 items-center justify-center rounded-lg bg-muted font-bold text-primary"
              >
                {title[0]}
              </div>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="border-y bg-gray-50 py-20">
        <div className="container">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-widest text-primary uppercase">
                Professional Equipment
              </p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Explore our products</h2>
              <p className="mt-4 text-muted-foreground">
                Browse the latest products in our catalog.
              </p>
            </div>
            <Link
              href="/products"
              className="flex items-center gap-2 text-sm font-semibold text-primary"
            >
              View all products <ArrowRight className="size-4" />
            </Link>
          </div>
          {catalog.data ? (
            <ProductGrid products={catalog.data.data} />
          ) : (
            <ErrorState error={catalog.error} />
          )}
        </div>
      </section>
      <section id="faq" className="container py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold tracking-widest text-primary uppercase">FAQ</p>
          <h2 className="mt-3 mb-10 text-3xl font-bold sm:text-4xl">Frequently asked questions</h2>
          {faqs.map(([question, answer], index) => (
            <details
              key={question}
              open={index === 0}
              className="group mb-3 rounded-xl border px-6 py-5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {question}
                <span aria-hidden="true" className="text-xl text-primary group-open:hidden">
                  +
                </span>
                <span aria-hidden="true" className="hidden text-xl text-primary group-open:inline">
                  −
                </span>
              </summary>
              <p className="mt-3 text-muted-foreground">{answer}</p>
            </details>
          ))}
        </div>
      </section>
      <section id="contact" className="border-t bg-gray-50 py-20">
        <div className="container">
          <div className="rounded-[20px] border border-t-4 border-t-primary bg-background px-6 py-14 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Planning a studio or broadcast project?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Visit our team to discuss the right solution for your needs and budget.
            </p>
            <address className="mt-5 text-sm text-muted-foreground not-italic">
              Office No. 909 & 910, Gaur City Mall,
              <br />
              Greater Noida, Uttar Pradesh, India
            </address>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Gaur+City+Mall+Greater+Noida"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get Directions
                </a>
              </Button>
              <Button asChild variant="outline">
                <Link href="/#services">View Services</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
