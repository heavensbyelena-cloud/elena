import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { authenticated: false, role: null, email: null },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        role: user.role ?? (user.is_admin ? 'admin' : 'user'),
        email: user.email ?? null,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { authenticated: false, role: null, email: null },
      { status: 200 }
    );
  }
}

