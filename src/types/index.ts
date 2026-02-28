export interface Lead {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  brain_dump: string;
  audio_url: string | null;
  audio_transcription: string | null;
  photo_urls: string[] | null;
  photo_analysis: string | null;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
}

export type LeadStatus = "new" | "quoted" | "follow_up" | "booked" | "closed";

export interface Quote {
  id: string;
  lead_id: string;
  scope_of_work: string;
  line_items: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  terms: string;
  valid_until: string;
  notes: string | null;
  created_at: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Settings {
  id: string;
  business_name: string;
  business_phone: string;
  business_email: string;
  business_address: string;
  logo_url: string | null;
  pricing: PricingItem[];
  tax_rate: number;
  default_terms: string;
  validity_days: number;
}

export interface PricingItem {
  name: string;
  price: number;
  unit: string;
}

export const DEFAULT_PRICING: PricingItem[] = [
  { name: "Indoor Camera (2MP)", price: 85, unit: "each" },
  { name: "Indoor Camera (4MP)", price: 120, unit: "each" },
  { name: "Outdoor Bullet Camera (2MP)", price: 120, unit: "each" },
  { name: "Outdoor Bullet Camera (4MP)", price: 165, unit: "each" },
  { name: "Outdoor Turret Camera (4MP)", price: 150, unit: "each" },
  { name: "Outdoor PTZ Camera", price: 350, unit: "each" },
  { name: "NVR 4-Channel", price: 180, unit: "each" },
  { name: "NVR 8-Channel (2TB)", price: 280, unit: "each" },
  { name: "NVR 16-Channel (4TB)", price: 420, unit: "each" },
  { name: "Cat6 Cable", price: 0.75, unit: "per foot" },
  { name: "Cable Conduit", price: 1.25, unit: "per foot" },
  { name: "Wall/Ceiling Mount", price: 15, unit: "each" },
  { name: "Junction Box", price: 12, unit: "each" },
  { name: "RJ45 Connectors (pair)", price: 3, unit: "each" },
  { name: "PoE Switch (8-port)", price: 95, unit: "each" },
  { name: "PoE Injector", price: 25, unit: "each" },
  { name: "Labor", price: 75, unit: "per hour" },
  { name: "Mounting Hardware Kit", price: 20, unit: "each" },
];

export const DEFAULT_TERMS = `Payment Terms: 50% deposit required to schedule installation. Remaining balance due upon completion.

Warranty: All equipment includes manufacturer's warranty. Labor is warranted for 90 days from installation date.

Includes: Professional installation, system configuration, mobile app setup and walkthrough, and 30-day phone support.

Does not include: Electrical work, drywall repair, painting, or permits (if required).`;

export const STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; color: string; bgColor: string }
> = {
  new: { label: "New", color: "text-blue-400", bgColor: "bg-blue-500/20" },
  quoted: {
    label: "Quoted",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
  },
  follow_up: {
    label: "Follow Up",
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
  },
  booked: {
    label: "Booked",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
  },
  closed: {
    label: "Closed/Lost",
    color: "text-gray-400",
    bgColor: "bg-gray-500/20",
  },
};
