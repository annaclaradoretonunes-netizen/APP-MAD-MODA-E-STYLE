export type Look = {
  id: string;
  user_id: string;
  caption: string;
  aesthetic: string;
  photo_path: string;
  item_name: string | null;
  brand: string | null;
  price_brl: number | null;
  item_url: string | null;
  created_at: string;
  signed_url?: string | null;
};

export type Tab = 'home' | 'explore' | 'post' | 'saved' | 'profile';
