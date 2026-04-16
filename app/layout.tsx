import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { CartProvider } from '@/context/CartContext';
import { ToastProvider } from '@/context/ToastContext';
import ConditionalLayout from '@/components/Layout/ConditionalLayout';
import { getAuthAndProfile } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase-server';

export const metadata: Metadata = {
  title: {
    default: "Heaven's By Elena — Bijoux faits main",
    template: "%s | Heaven's By Elena",
  },
  description:
    "Bijoux faits main portés avec âme. Créations artisanales en acier inoxydable par Elena.",
  keywords: ['bijoux', 'faits main', 'acier inoxydable', 'artisanal', 'Elena'],
  authors: [{ name: 'Elena' }],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: "Heaven's By Elena",
    title: "Heaven's By Elena — Bijoux faits main",
    description: "Bijoux faits main, portés avec âme. Acier inoxydable.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let isLoggedIn = false;
  let isAdmin = false;
  let resineSubcats: string[] = [];

  try {
    const { hasSession, user } = await getAuthAndProfile();
    isLoggedIn = hasSession;
    isAdmin = user?.role === 'admin' || user?.is_admin === true;
  } catch {
    // pas de session / profil
  }

  try {
    // Récupère les slugs résine uniques depuis les produits actifs
    const admin = createAdminClient();
    const { data } = await admin
      .from('products')
      .select('category')
      .like('category', 'resine-%')
      .eq('is_active', true);
    if (data) {
      resineSubcats = [...new Set(data.map((p: { category: string }) => p.category))];
    }
  } catch {
    // Pas de produits résine ou erreur → on laisse vide
  }

  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ToastProvider>
        <CartProvider>
          <ConditionalLayout isLoggedIn={isLoggedIn} isAdmin={isAdmin} resineSubcats={resineSubcats}>
            {children}
          </ConditionalLayout>
        </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
