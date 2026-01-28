
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function inspectWork(title: string) {
    const { data: work } = await supabase.from('works').select('id, title').eq('title', title).single();
    if (!work) {
        console.log(`🔍 Work "${title}" not found.`);
        return;
    }
    const { data: av } = await supabase.from('availability').select('is_exclusive, platforms(name)').eq('work_id', work.id);
    console.log(`\n🔍 ${title} (ID: ${work.id})`);
    av?.forEach((a: any) => {
        console.log(`   - [${a.is_exclusive ? '👑 EXCLUSIVE' : 'SHARED'}] ${a.platforms.name}`);
    });
}

async function run() {
    await inspectWork('소년시대');
    await inspectWork('체르노빌');
    await inspectWork('SNL 코리아');
}

run();
