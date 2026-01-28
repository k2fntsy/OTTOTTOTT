
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
);

async function debugData() {
    console.log('--- Debugging Data Fetch (Top 20 Popular) ---');

    const { data, error } = await supabase.from('works').select(`
    title,
    popularity,
    availability!inner (
      link,
      platform_id,
      platform:platforms!inner (slug, name)
    )
  `)
        .order('popularity', { ascending: false })
        .limit(20);

    if (error) {
        console.error('❌ Supabase Error:', error);
        return;
    }

    data?.forEach(w => {
        console.log(`- ${w.title} (${w.popularity}): ${w.availability?.length || 0} availability records`);
        if (w.availability && w.availability.length > 0) {
            w.availability.forEach((av: any) => {
                console.log(`  - Platform ID ${av.platform_id}, Joined Platform: ${JSON.stringify(av.platform)}`);
            });
        }
    });
}

debugData();
