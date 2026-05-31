const SUPABASE_URL = 'https://krlrqimaiuyxybjnwzls.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7wo_d-VC3Ey5wJON02_EjA_KcFm7SJo';

export let supabase = null;

try {
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.error("Supabase script is not loaded globally on window.");
    }
} catch (error) {
    console.error("Supabase client not initialized. Ensure your keys are set properly:", error);
}
