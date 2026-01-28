
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkExclusives() {
    console.log('📊 Checking Database Exclusivity Status...');

    const { data: works, error } = await supabase
        .from('works')
        .select(`
            title,
            availability (
                is_exclusive,
                platforms (name, slug)
            )
        `)
        .limit(100);

    if (error) {
        console.error('❌ DB Error:', error);
        return;
    }

    const coupangItems = works.filter(w => w.availability.some((a: any) => a.platforms.slug === 'coupang'));

    console.log(`\nFound ${coupangItems.length} Coupang Play items in sample.`);
    coupangItems.forEach((w: any) => {
        const isEx = w.availability.some((a: any) => a.is_exclusive);
        const platforms = w.availability.map((a: any) => a.platforms.name).join(', ');
        console.log(`- [${isEx ? '👑 EXCLUSIVE' : 'SHARED'}] ${w.title} (Platforms: ${platforms})`);
    });

    const totalExclusives = works.filter(w => w.availability.some((a: any) => a.is_exclusive)).length;
    console.log(`\nTotal Exclusives in sample of 100: ${totalExclusives}`);
}

checkExclusives();
