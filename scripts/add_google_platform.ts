
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function addGooglePlatform() {
    console.log('🚀 Adding Google Play Movies to platforms...');
    const { data, error } = await supabase
        .from('platforms')
        .upsert({ name: 'Google Play Movies', slug: 'google' }, { onConflict: 'slug' })
        .select();

    if (error) {
        console.error('❌ Error adding platform:', error.message);
    } else {
        console.log('✅ Success:', JSON.stringify(data, null, 2));
    }
}

addGooglePlatform();
