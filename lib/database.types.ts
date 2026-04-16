// ============================================================
// Types auto-générés depuis Supabase
// Commande : npx supabase gen types typescript --project-id VOTRE_ID > lib/database.types.ts
//
// En attendant : types manuels correspondant aux tables Supabase
// ============================================================

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          category: string;
          badge: string | null;
          image_url: string;
          images: string[] | null;
          stock: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          customer_email: string;
          customer_name: string | null;
          items: Record<string, unknown>[];
          shipping_address: Record<string, unknown>;
          shipping_method: 'home_delivery' | 'point_relay' | null;
          pickup_point: Record<string, unknown> | null;
          shipping_address_home: Record<string, unknown> | null;
          subtotal: number;
          shipping_cost: number;
          total_price: number;
          promo_code_id: string | null;
          discount_amount: number;
          status: string;
          payment_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at' | 'shipping_method' | 'pickup_point' | 'shipping_address_home'> & {
          shipping_method?: 'home_delivery' | 'point_relay' | null;
          pickup_point?: Record<string, unknown> | null;
          shipping_address_home?: Record<string, unknown> | null;
        };
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };
      reviews: {
        Row: {
          id: string;
          product_id: string | null;
          rating: number;
          comment: string;
          author_name: string | null;
          status: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>;
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['cart_items']['Row'],
          'id' | 'created_at' | 'updated_at'
        >;
        Update: Partial<Database['public']['Tables']['cart_items']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          default_address: Record<string, unknown> | null;
          is_admin: boolean;
          /** 'user' | 'admin' — défaut 'user'. À ajouter en migration si absent. */
          role?: 'user' | 'admin';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      promo_codes: {
        Row: {
          id: string;
          code: string;
          type: string;
          value: number;
          min_order: number | null;
          max_uses: number | null;
          max_uses_per_user: number | null;
          uses_count: number;
          is_personal: boolean;
          expires_at: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          code: string;
          type: string;
          value: number;
          min_order?: number | null;
          max_uses?: number | null;
          max_uses_per_user?: number | null;
          is_personal?: boolean;
          expires_at?: string | null;
          active?: boolean;
          uses_count?: number;
        };
        Update: Partial<{
          code: string;
          type: string;
          value: number;
          min_order: number | null;
          max_uses: number | null;
          max_uses_per_user: number | null;
          is_personal: boolean;
          expires_at: string | null;
          active: boolean;
          uses_count: number;
        }>;
      };
      promo_code_users: {
        Row: {
          id: string;
          promo_code_id: string;
          user_id: string;
          max_uses: number;
          uses_count: number;
        };
        Insert: {
          promo_code_id: string;
          user_id: string;
          max_uses: number;
          uses_count?: number;
        };
        Update: Partial<{
          promo_code_id: string;
          user_id: string;
          max_uses: number;
          uses_count: number;
        }>;
      };
      promo_code_usages: {
        Row: {
          id: string;
          promo_code_id: string;
          user_id: string;
          order_id: string | null;
          used_at: string;
        };
        Insert: {
          promo_code_id: string;
          user_id: string;
          order_id?: string | null;
          used_at?: string;
        };
        Update: Partial<{
          promo_code_id: string;
          user_id: string;
          order_id: string | null;
          used_at: string;
        }>;
      };
    };
    Functions: {
      sync_profile_after_signup: {
        Args: {
          p_user_id: string;
          p_email: string;
          p_first_name: string;
        };
        Returns: undefined;
      };
    };
  };
};
