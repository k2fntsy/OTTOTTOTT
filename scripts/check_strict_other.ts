
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStrictOther() {
    // Get Platform IDs
    const { data: platforms } = await supabase.from('platforms').select('id, slug');
    if (!platforms) return;

    const otherId = platforms.find(p => p.slug === 'other')?.id;
    const majorIds = platforms.filter(p => p.slug !== 'other' && p.slug !== 'laftel' && p.slug !== 'all').map(p => p.id);

    if (!otherId) {
        console.log('Other platform not found');
        return;
    }

    // Get works with Other
    const { data: worksWithOther } = await supabase
        .from('availability')
        .select('work_id')
        .eq('platform_id', otherId);

    if (!worksWithOther || worksWithOther.length === 0) {
        console.log('No works found with Other platform');
        return;
    }

    const workIds = worksWithOther.map(w => w.work_id);

    // Check overlap
    let strictCount = 0;
    for (const wid of workIds) {
        const { count } = await supabase
            .from('availability')
            .select('*', { count: 'exact', head: true })
            .eq('work_id', wid)
            .in('platform_id', majorIds);

        if (count === 0) {
            strictCount++;
            // Get title
            const { data: work } = await supabase.from('works').select('title, type, popularity').eq('id', wid).single();
            console.log(`[Strict Other] ${work?.title} (${work?.type}) - Pop: ${work?.popularity}`);
        }
    }

    console.log(`\nTotal Works on 'Other': ${workIds.length}`);
    console.log(`Total Strict Only 'Other': ${strictCount}`);
}

checkStrictOther();
