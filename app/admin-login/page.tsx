'use client';

import { useRouter } from 'next/navigation';
import AdminLoginModal from '@/components/ComingSoon/AdminLoginModal';

export default function AdminLoginPage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--fond)',
      }}
    >
      <AdminLoginModal
        isOpen={true}
        onClose={() => router.push('/')}
      />
    </div>
  );
}
