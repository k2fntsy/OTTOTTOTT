
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verifyGoogle() {
    console.log('🔍 Verifying Google Play Data in DB...');

    // 1. Get Google Platform ID
    const { data: platform } = await supabase.from('platforms').select('id').eq('slug', 'google').single();
    if (!platform) {
        console.error('❌ Google platform not found in DB!');
        return;
    }
    console.log(`✅ Google Platform ID: ${platform.id}`);

    // 2. Count availability records for this platform
    const { count, error } = await supabase
        .from('availability')
        .select('*', { count: 'exact', head: true })
        .eq('platform_id', platform.id);

    if (error) {
        console.error('❌ Error counting records:', error.message);
    } else {
        console.log(`📊 Total Items on Google Play: ${count}`);
    }

    // 3. Show samples
    const { data: samples } = await supabase
        .from('availability')
        .select(`
            work_id,
            works (title)
        `)
        .eq('platform_id', platform.id)
        .limit(5);

    console.log('\n--- Sample Google Play Items ---');
    samples?.forEach((s: any) => {
        console.log(`- ${s.works.title}`);
    });
}

verifyGoogle();
