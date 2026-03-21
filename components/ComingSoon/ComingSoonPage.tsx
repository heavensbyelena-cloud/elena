'use client';

import { useState } from 'react';
import Image from 'next/image';
import AdminLoginModal from './AdminLoginModal';

export default function ComingSoonPage() {
  const [showAdminModal, setShowAdminModal] = useState(false);

  return (
    <>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '60px 40px',
          background: 'var(--fond)',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            maxWidth: '700px',
            animation: 'fadeInUp 1s ease-out',
          }}
        >
          {/* Logo */}
          <div style={{ marginBottom: '40px' }}>
            <Image
              src="/logo.png"
              alt="Heaven's By Elena"
              width={660}
              height={300}
              style={{ objectFit: 'contain', maxHeight: '300px' }}
              priority
            />
          </div>

          {/* Titre */}
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '2.2rem',
              fontWeight: 400,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: '12px',
              color: 'var(--texte)',
            }}
          >
            Bientôt Ouvert
          </h1>

          {/* Ligne décorative */}
            <div
              style={{
                width: 60,
                height: 2,
                background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
                boxShadow: '0 0 20px var(--accent-glow)',
                margin: '24px auto 32px',
              }}
            />

          {/* Description */}
          <div
            style={{
              fontSize: '1rem',
              color: 'var(--texte-muted)',
              marginBottom: '40px',
              lineHeight: 1.8,
              maxWidth: 500,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            <p style={{ marginBottom: '16px' }}>
              Nous préparons quelque chose de magnifique pour vous.
            </p>
            <p>
              Notre boutique de bijoux faits main ouvrira très bientôt. Soyez parmi les premiers à
              découvrir nos créations exclusives.
            </p>
          </div>

          {/* Barre de progression */}
          <div
            style={{
              margin: '50px 0',
              maxWidth: 400,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--texte-muted)',
                marginBottom: '12px',
                display: 'block',
              }}
            >
              Bientôt
            </span>
            <div
              style={{
                width: '100%',
                height: 2,
                background: 'var(--accent-clair)',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  background: 'var(--accent)',
                  width: '65%',
                  borderRadius: 2,
                  animation: 'loadingAnimation 2s ease-in-out infinite',
                }}
              />
            </div>
          </div>

          {/* Réseaux sociaux */}
          <div
            style={{
              marginTop: '60px',
              display: 'flex',
              justifyContent: 'center',
              gap: '30px',
              flexWrap: 'wrap',
            }}
          >
            <a
              href="https://www.tiktok.com/@elenaheavensofficiel"
              className="social-link"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: 'none',
                color: 'var(--texte)',
                fontSize: '0.75rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                paddingBottom: 4,
                borderBottom: '1px solid transparent',
                transition: 'border-color 0.3s ease, color 0.3s ease',
              }}
            >
              TikTok
            </a>
            <a
              href="https://youtube.com/@elenaheavensofficiel"
              className="social-link"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: 'none',
                color: 'var(--texte)',
                fontSize: '0.75rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                paddingBottom: 4,
                borderBottom: '1px solid transparent',
                transition: 'border-color 0.3s ease, color 0.3s ease',
              }}
            >
              YouTube
            </a>
            <a
              href="https://instagram.com"
              className="social-link"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: 'none',
                color: 'var(--texte)',
                fontSize: '0.75rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                paddingBottom: 4,
                borderBottom: '1px solid transparent',
                transition: 'border-color 0.3s ease, color 0.3s ease',
              }}
            >
              Instagram
            </a>
          </div>

          {/* Lien Admin — visible en bas de page */}
          <div style={{ marginTop: '80px' }}>
            <button
              type="button"
              onClick={() => setShowAdminModal(true)}
              style={{
                background: 'var(--fond-carte)',
                border: '1px solid var(--bordure)',
                color: 'var(--texte)',
                fontSize: '0.75rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                padding: '10px 16px',
                borderRadius: 4,
                transition: 'background 0.2s ease, opacity 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--accent)';
                e.currentTarget.style.borderColor = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--fond-carte)';
                e.currentTarget.style.borderColor = 'var(--bordure)';
              }}
            >
              Admin
            </button>
          </div>
        </div>
      </div>

      <AdminLoginModal isOpen={showAdminModal} onClose={() => setShowAdminModal(false)} />

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(30px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes loadingAnimation {
              0% { width: 65%; }
              50% { width: 80%; }
              100% { width: 65%; }
            }
            .social-link:hover {
              border-bottom-color: var(--accent) !important;
              color: var(--accent) !important;
            }
          `,
        }}
      />
    </>
  );
}
