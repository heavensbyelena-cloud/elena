/** Clé publique Stripe — alias historique `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` encore accepté. */
function stripePublicKey(): string {
  return (
    process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY?.trim() ||
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ||
    ''
  );
}

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  supabaseServiceRole: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  stripePublishable: stripePublicKey(),
  stripeSecret: process.env.STRIPE_SECRET_KEY!,
} as const;
