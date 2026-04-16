export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  supabaseServiceRole: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  stripePublishable: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  stripeSecret: process.env.STRIPE_SECRET_KEY!,
} as const;
