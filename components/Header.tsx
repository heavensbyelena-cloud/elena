'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef, Suspense, type CSSProperties } from 'react';
import { useCart } from '@/context/CartContext';
import { NAV_LEFT, NAV_RIGHT, CATEGORIES, getDecorationSubcatLabel } from '@/lib/categories';

interface HeaderProps {
  /** Utilisateur avec session + ligne profiles (getCurrentUser) */
  isLoggedIn?: boolean;
  isAdmin?: boolean;
  decorationSubcats?: string[];
}

function NavLink({
  slug,
  navLabel,
  onClick,
  mobile = false,
}: {
  slug: string;
  navLabel: string;
  onClick?: () => void;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const href = `/shop?category=${slug}`;
  const isActive =
    pathname === '/shop' &&
    (typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('category') === slug
      : false);

  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        textDecoration: 'none',
        color: isActive ? 'var(--accent)' : 'var(--texte-muted)',
        fontSize: mobile ? '0.85rem' : '0.75rem',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        paddingBottom: mobile ? '0' : '2px',
        borderBottom: isActive
          ? mobile ? 'none' : '1px solid var(--accent)'
          : '1px solid transparent',
        transition: 'all 0.3s ease',
        display: 'block',
        padding: mobile ? '14px 0' : undefined,
        borderTop: mobile ? '1px solid var(--bordure)' : undefined,
      }}
    >
      {navLabel}
    </Link>
  );
}

/** Menu boutique desktop : toutes les catégories + sous-rayons décoration (scroll si besoin). */
function DesktopCategoriesMenuInner({ decorationSubcats }: { decorationSubcats: string[] }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const category = pathname === '/shop' ? searchParams.get('category') : null;

  const decoSubs = decorationSubcats.map(slug => ({ slug, label: getDecorationSubcatLabel(slug) }));

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname, searchParams.toString()]);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [open]);

  const menuBtnStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: category ? 'var(--accent)' : 'var(--texte-muted)',
    fontSize: '0.75rem',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    padding: '4px 0',
    paddingBottom: '6px',
    borderBottom: category ? '1px solid var(--accent)' : '1px solid transparent',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
    fontWeight: 300,
  };

  const rowLink = (href: string, label: string, active: boolean, indent = false) => (
    <Link
      key={href}
      href={href}
      onClick={() => setOpen(false)}
      role="menuitem"
      style={{
        display: 'block',
        padding: indent ? '6px 24px 6px 36px' : '9px 24px',
        fontSize: indent ? '0.68rem' : '0.74rem',
        letterSpacing: '0.06em',
        textTransform: 'none',
        color: active ? 'var(--accent)' : 'var(--texte-muted)',
        textDecoration: 'none',
        transition: 'color 0.2s ease',
        borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
      }}
      onMouseEnter={e => {
        if (!active) e.currentTarget.style.color = 'var(--accent)';
      }}
      onMouseLeave={e => {
        if (!active) e.currentTarget.style.color = 'var(--texte-muted)';
      }}
    >
      {label}
    </Link>
  );

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="desktop-shop-categories-panel"
        style={menuBtnStyle}
      >
        Catégories
        <span style={{ fontSize: '0.55rem', opacity: 0.65 }} aria-hidden>▾</span>
      </button>

      {open && (
        <div
          id="desktop-shop-categories-panel"
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            left: 0,
            background: 'var(--fond)',
            border: '1px solid var(--bordure)',
            minWidth: 'min(320px, calc(100vw - 48px))',
            maxWidth: '360px',
            maxHeight: 'min(70vh, 520px)',
            overflowY: 'auto',
            zIndex: 120,
            boxShadow: '0 16px 40px rgba(0,0,0,0.24)',
          }}
        >
          {CATEGORIES.map(cat => {
            if (cat.slug === 'decoration') {
              return (
                <div key={cat.slug} role="presentation">
                  {rowLink('/shop?category=decoration', 'Décoration — tout voir', category === 'decoration')}
                  {decoSubs.map(sub =>
                    rowLink(`/shop?category=${sub.slug}`, sub.label, category === sub.slug, true)
                  )}
                </div>
              );
            }
            return rowLink(`/shop?category=${cat.slug}`, cat.label, category === cat.slug);
          })}
        </div>
      )}
    </div>
  );
}

function DesktopCategoriesMenu({ decorationSubcats }: { decorationSubcats: string[] }) {
  return (
    <Suspense
      fallback={
        <span style={{ fontSize: '0.75rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--texte-muted)', padding: '4px 0' }}>
          Catégories
        </span>
      }
    >
      <DesktopCategoriesMenuInner decorationSubcats={decorationSubcats} />
    </Suspense>
  );
}

function ResineAccordion({
  navLabel,
  dynamicSubcats,
  onClose,
}: {
  navLabel: string;
  dynamicSubcats: string[];
  onClose: () => void;
}) {
  const [open, setOpen] = useState(false);
  const subcatsToShow = dynamicSubcats.map(slug => ({ slug, label: getDecorationSubcatLabel(slug) }));

  return (
    <div style={{ borderTop: '1px solid var(--bordure)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 0',
          fontSize: '0.85rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--texte-muted)',
          cursor: 'pointer',
        }}
      >
        {navLabel}
        <span style={{ fontSize: '0.65rem', opacity: 0.6, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
      </button>
      {open && (
        <div style={{ paddingBottom: '8px', paddingLeft: '16px' }}>
          <Link
            href="/shop?category=decoration"
            onClick={onClose}
            style={{
              display: 'block',
              padding: '10px 0',
              fontSize: '0.75rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              textDecoration: 'none',
            }}
          >
            Tout voir
          </Link>
          {subcatsToShow.map(sub => (
            <Link
              key={sub.slug}
              href={`/shop?category=${sub.slug}`}
              onClick={onClose}
              style={{
                display: 'block',
                padding: '9px 0',
                fontSize: '0.75rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--texte-muted)',
                textDecoration: 'none',
              }}
            >
              {sub.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Header({ isLoggedIn = false, isAdmin = false, decorationSubcats = [] }: HeaderProps) {
  const { count, openCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  // Détection mobile via JS (pour le menu overlay) — CSS gère l'affichage initial
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 968);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!isMobile) setMenuOpen(false);
  }, [isMobile]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const allNavLinks = [...NAV_LEFT, ...NAV_RIGHT];

  return (
    <>
      <header
        className="site-header"
        style={{
          background: 'var(--fond)',
          borderBottom: '1px solid var(--bordure)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          overflow: 'visible',
        }}
      >
        {/* ── DESKTOP (masqué en mobile via CSS) ── */}
        <div className="header-desktop">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              alignItems: 'center',
              padding: '0 32px',
              height: '100px',
              position: 'relative',
            }}
          >
            {/* Gauche */}
            <div style={{ display: 'flex', gap: '28px', alignItems: 'center', justifyContent: 'flex-start' }}>
              <Link href="/account/dashboard" aria-label="Mon compte" style={{ color: 'var(--texte-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
                👤
              </Link>
              {isAdmin && (
                <a href="/admin" style={{ color: 'var(--texte-muted)', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none' }}>
                  Admin
                </a>
              )}
              {isLoggedIn && (
                <form action="/api/auth/logout" method="POST" style={{ display: 'inline' }}>
                  <button type="submit" style={{ background: 'none', border: 'none', color: 'var(--gris)', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                    Déconnexion
                  </button>
                </form>
              )}
              <div style={{ width: '1px', height: '20px', background: 'var(--bordure)', margin: '0 4px' }} />
              <DesktopCategoriesMenu decorationSubcats={decorationSubcats} />
            </div>

            {/* Centre : Logo (fill + boîte = pas d’avertissement width/height Next/Image) */}
            <Link
              href="/home"
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
                textDecoration: 'none',
                display: 'block',
                width: 200,
                height: 72,
                lineHeight: 0,
              }}
            >
              <span style={{ position: 'relative', display: 'block', width: '100%', height: '100%' }}>
                <Image
                  src="/logo.png"
                  alt="Heaven's By Elena"
                  fill
                  sizes="200px"
                  style={{ objectFit: 'contain', objectPosition: 'center' }}
                  priority
                />
              </span>
            </Link>
            <div />

            {/* Droite : panier */}
            <div style={{ display: 'flex', gap: '28px', alignItems: 'center', justifyContent: 'flex-end' }}>
              <div style={{ width: '1px', height: '20px', background: 'var(--bordure)', margin: '0 4px' }} />
              <button onClick={openCart} aria-label="Ouvrir le panier" style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--texte-muted)', padding: 0 }}>
                🛒
                {count > 0 && (
                  <span style={{ position: 'absolute', top: '-8px', right: '-10px', background: 'var(--accent)', color: 'var(--blanc)', fontSize: '0.55rem', fontWeight: 500, width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {count}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── MOBILE (masqué en desktop via CSS) ── */}
        <div
          className="header-mobile"
          style={{
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            height: '70px',
          }}
          >
            {/* Gauche : hamburger */}
            <button
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Menu"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                width: '28px',
              }}
            >
              <span style={{
                display: 'block', height: '1.5px', background: 'var(--texte-muted)',
                transition: 'all 0.3s',
                transform: menuOpen ? 'translateY(6.5px) rotate(45deg)' : 'none',
              }} />
              <span style={{
                display: 'block', height: '1.5px', background: 'var(--texte-muted)',
                transition: 'all 0.3s',
                opacity: menuOpen ? 0 : 1,
              }} />
              <span style={{
                display: 'block', height: '1.5px', background: 'var(--texte-muted)',
                transition: 'all 0.3s',
                transform: menuOpen ? 'translateY(-6.5px) rotate(-45deg)' : 'none',
              }} />
            </button>

            {/* Centre : Logo */}
            <Link href="/home" style={{ display: 'block', textDecoration: 'none', width: 120, height: 52, position: 'relative', lineHeight: 0 }}>
              <Image src="/logo.png" alt="Heaven's By Elena" fill sizes="120px" style={{ objectFit: 'contain', objectPosition: 'center' }} priority />
            </Link>

            {/* Droite : compte + panier */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <Link href="/account/dashboard" aria-label="Mon compte" style={{ color: 'var(--texte-muted)', fontSize: '1rem', textDecoration: 'none' }}>
                👤
              </Link>
              <button onClick={openCart} aria-label="Ouvrir le panier" style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--texte-muted)', padding: 0 }}>
                🛒
                {count > 0 && (
                  <span style={{ position: 'absolute', top: '-8px', right: '-10px', background: 'var(--accent)', color: 'var(--blanc)', fontSize: '0.55rem', fontWeight: 500, width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {count}
                  </span>
                )}
              </button>
            </div>
          </div>
      </header>

      {/* ── MENU MOBILE OVERLAY ── */}
      {isMobile && (
        <>
          {/* Fond semi-transparent */}
          <div
            onClick={closeMenu}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.35)',
              zIndex: 40,
              opacity: menuOpen ? 1 : 0,
              pointerEvents: menuOpen ? 'auto' : 'none',
              transition: 'opacity 0.3s ease',
            }}
          />

          {/* Panneau latéral */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: 'min(320px, 85vw)',
              background: 'var(--fond)',
              zIndex: 60,
              transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* En-tête du panneau */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--bordure)' }}>
              <Link href="/home" onClick={closeMenu} style={{ textDecoration: 'none', display: 'block', width: 90, height: 48, position: 'relative', lineHeight: 0 }}>
                <Image src="/logo.png" alt="Heaven's By Elena" fill sizes="90px" style={{ objectFit: 'contain', objectPosition: 'center' }} />
              </Link>
              <button
                onClick={closeMenu}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', color: 'var(--texte-muted)', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {/* Navigation */}
            <nav style={{ padding: '8px 24px 24px' }}>
              {allNavLinks.map(link =>
                link.slug === 'decoration' ? (
                  <ResineAccordion
                    key={link.slug}
                    navLabel={link.navLabel}
                    dynamicSubcats={decorationSubcats}
                    onClose={closeMenu}
                  />
                ) : (
                  <NavLink key={link.slug} slug={link.slug} navLabel={link.navLabel} mobile onClick={closeMenu} />
                )
              )}

              {/* Séparateur */}
              <div style={{ height: '1px', background: 'var(--bordure)', margin: '20px 0' }} />

              {/* Compte & admin */}
              <Link href="/account/dashboard" onClick={closeMenu} style={{ display: 'block', padding: '12px 0', fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--texte-muted)', textDecoration: 'none' }}>
                Mon compte
              </Link>

              {isAdmin && (
                <a href="/admin" onClick={closeMenu} style={{ display: 'block', padding: '12px 0', fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--texte-muted)', textDecoration: 'none' }}>
                  Admin
                </a>
              )}
              {isLoggedIn && (
                <form action="/api/auth/logout" method="POST">
                  <button type="submit" style={{ background: 'none', border: 'none', padding: '12px 0', fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gris)', cursor: 'pointer', textDecoration: 'underline', display: 'block' }}>
                    Déconnexion
                  </button>
                </form>
              )}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
