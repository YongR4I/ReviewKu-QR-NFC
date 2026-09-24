export interface Card {
  id: string;
  is_active: boolean;
  business_name: string | null;
  review_url: string | null;
  pin_hash: string | null;
  scan_count: number;
  pin_attempts: number;
  pin_locked_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface CardScanResult {
  card_is_active: boolean;
  card_review_url: string | null;
  card_business_name: string | null;
}
