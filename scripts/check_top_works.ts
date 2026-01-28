
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars', { supabaseUrl, hasKey: !!supabaseKey });
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTopWorks() {
    const { data, error } = await supabase
        .from('works')
        .select('title, popularity, type')
        .order('popularity', { ascending: false })
        .limit(10);

    if (error) {
        console.error(error);
    } else {
        console.log('Top 10 Works by Popularity:');
        console.table(data);
    }
}

checkTopWorks();
