import { Brand } from '@/components/layout/brand';
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content" className="grid min-h-screen lg:grid-cols-2">
      <div className="studio-visual hidden flex-col justify-between bg-secondary p-16 text-secondary-foreground lg:flex">
        <Brand className="text-white [&_span]:text-[#8edbd1]" />
        <div>
          <p className="mb-6 text-xs tracking-widest uppercase">Elementry Media Technology</p>
          <h2 className="max-w-md text-5xl leading-tight font-bold">
            Your next production starts here.
          </h2>
          <p className="mt-6 max-w-sm leading-relaxed text-white/75">
            Explore professional broadcast equipment and solutions for your workflow.
          </p>
        </div>
        <p className="text-sm text-white/80">Technology. Expertise. Creativity.</p>
      </div>
      <div className="flex items-center justify-center bg-surface px-6 py-16">
        <div className="w-full max-w-md rounded-3xl border bg-background p-6 shadow-sm sm:p-10">
          <div className="mb-10 lg:hidden">
            <Brand />
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
