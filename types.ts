
export interface ClientData {
  name: string;
  logo?: string;
  phone?: string;
  whatsapp?: string;
  maps?: string;
  facebook?: string;
  tiktok?: string;
  snapchat?: string;
  instagram?: string;
  city?: string;
}

export interface PrayerTimeRow {
  ramadanDay: number;
  date: Date;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}
