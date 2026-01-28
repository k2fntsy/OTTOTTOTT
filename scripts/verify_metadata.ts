
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

async function checkProviderName() {
    // Get Other ID
    const { data: platform } = await supabase.from('platforms').select('id').eq('slug', 'other').single();

    if (!platform) {
        console.log("Other platform not found");
        return;
    }

    const { data: availabilities } = await supabase
        .from('availability')
        .select('link, work_id')
        .eq('platform_id', platform.id)
        .limit(10);

    if (!availabilities || availabilities.length === 0) {
        console.log("No Other availabilities found yet.");
        return;
    }

    console.log(`Checking ${availabilities.length} Other links...`);
    availabilities.forEach(a => {
        console.log(`Link: ${a.link}`);
        if (a.link && a.link.includes('|')) {
            console.log(`  ✅ Verified Metadata: ${a.link.split('|')[1]}`);
        } else {
            console.log(`  ⚠️ No Metadata found.`);
        }
    });
}

checkProviderName();
