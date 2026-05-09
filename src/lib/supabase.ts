import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Types for our database
export type Category = {
  id: string;
  name: string;
  color: string;
};

export type Status = {
  id: string;
  name: string;
  labelType: string;
};

export type Ticket = {
  id: string;
  ticket_number: string;
  title: string;
  category_id: string;
  priority: string;
  status_id: string;
  description: string;
  equipment_id: string | null;
  assigned_to: string | null;
  created_at: string;
  closed_at: string | null;
  category?: Category;
  status?: Status;
  assigned_user?: User;
};

export type User = {
  id: string;
  username: string;
  password?: string; // Optional on frontend so we don't accidentally display it
  name: string;
  role: 'Administrador' | 'Técnico' | 'Cliente';
  email: string | null;
  phone: string | null;
  avatar_initials: string;
  avatar_url: string | null;
  created_at: string;
};

export type SystemConfig = {
  id: number;
  title: string;
  subtitle: string;
  logo_url: string | null;
  updated_at: string;
  help_text?: string;
  help_email?: string;
  help_site?: string;
  help_phone?: string;
};
