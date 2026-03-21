'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartSidebar from '@/components/Cart/CartSidebar';
import Toast from '@/components/Common/Toast';

interface ConditionalLayoutProps {
  children: React.ReactNode;
  isAdmin: boolean;
  resineSubcats: string[];
}

/**
 * Sur / (Coming Soon) : affiche uniquement le contenu, sans Header/Footer.
 * Sur le reste du site : Header + main + Footer + CartSidebar + Toast.
 */
export default function ConditionalLayout({ children, isAdmin, resineSubcats }: ConditionalLayoutProps) {
  const pathname = usePathname();

  if (pathname === '/') {
    return <>{children}</>;
  }

  return (
    <>
      <Header isAdmin={isAdmin} resineSubcats={resineSubcats} />
      <main>{children}</main>
      <Footer />
      <CartSidebar />
      <Toast />
    </>
  );
}
