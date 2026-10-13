import { StoreHeader } from '@/components/layout/store-header';
import { StoreFooter } from '@/components/layout/store-footer';
export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StoreHeader />
      <main id="main-content" className="min-h-[60vh]">
        {children}
      </main>
      <StoreFooter />
    </>
  );
}
