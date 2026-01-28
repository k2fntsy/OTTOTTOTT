
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

async function debugOtherIssues() {
    console.log('--- Debugging Other Issues ---');

    // 1. Check for "The Divide"
    const { data: works } = await supabase
        .from('works')
        .select('id, title, popularity, type')
        .ilike('title', '%Divide%'); // Search case-insensitive

    if (works && works.length > 0) {
        console.log(`\nFound matching titles for 'Divide':`);
        for (const work of works) {
            console.log(`- [${work.id}] ${work.title} (${work.type}) Pop: ${work.popularity}`);

            // Check availability for this work
            const { data: avail } = await supabase
                .from('availability')
                .select(`
                link,
                platform:platforms (slug, name)
            `)
                .eq('work_id', work.id);

            console.log(`  Availability:`, avail?.map(a => `${a.platform.slug}: ${a.link}`).join(', '));
        }
    } else {
        console.log(`\n❌ "The Divide" not found in works table.`);
    }

    // 2. Check strict "Other" counts and metadata
    const { data: platforms } = await supabase.from('platforms').select('id, slug');
    const otherId = platforms?.find(p => p.slug === 'other')?.id;
    const amazonId = platforms?.find(p => p.slug === 'amazon')?.id;

    if (otherId) {
        const { data: otherAvails } = await supabase
            .from('availability')
            .select('link, work:works(title)')
            .eq('platform_id', otherId)
            .order('last_updated', { ascending: false })
            .limit(10);

        console.log(`\nRecent 'Other' entries:`);
        otherAvails?.forEach(a => {
            console.log(`- Work: ${(a.work as any)?.title} | Link: ${a.link}`);
        });
    }
}

debugOtherIssues();
