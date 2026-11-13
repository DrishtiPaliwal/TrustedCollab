import { createClient } from '@supabase/supabase-js';

// declare global {
//   interface ImportMetaEnv {
//     readonly VITE_SUPABASE_URL: string;
//     readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
//   }

//   interface ImportMeta {
//     readonly env: ImportMetaEnv;
//   }
// }

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);