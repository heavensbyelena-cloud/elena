'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartSidebar from '@/components/Cart/CartSidebar';
import Toast from '@/components/Common/Toast';

interface ConditionalLayoutProps {
  children: React.ReactNode;
  isLoggedIn: boolean;
  isAdmin: boolean;
  resineSubcats: string[];
}

/**
 * Header + main + Footer + CartSidebar + Toast sur toutes les pages.
 */
export default function ConditionalLayout({ children, isLoggedIn, isAdmin, resineSubcats }: ConditionalLayoutProps) {
  return (
    <>
      <Header isLoggedIn={isLoggedIn} isAdmin={isAdmin} resineSubcats={resineSubcats} />
      <main>{children}</main>
      <Footer isAdmin={isAdmin} />
      <CartSidebar />
      <Toast />
    </>
  );
}
