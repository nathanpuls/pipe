import { createClient } from '@supabase/supabase-js';
import Linkify from '@/components/Linkify';
import CopyButton from '@/components/CopyButton';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import EntryShortcuts from '@/components/EntryShortcuts';

// Force dynamic rendering since we are fetching data
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

async function getEntry(id: string) {
    // If running in dev, we might not have process.env set correctly for SSR if .env is missing or not loaded?
    // Usually Next.js loads .env automatically.
    // Assuming process.env works.
    const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_KEY!
    );
    const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) return null;
    return data;
}

import AutoCopyHandler from '@/components/AutoCopyHandler';

export default async function EntryPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { id } = await params;
    const { autocopy } = await searchParams;
    const entry = await getEntry(id);

    if (!entry) {
        notFound();
    }

    // Determine back link
    // Default to home if page_name is home, else /page_name
    const backHref = !entry.page_name || entry.page_name === 'home' ? '/' : `/${entry.page_name}`;

    return (
        <div className="min-h-screen bg-white">
            {autocopy === 'true' && <AutoCopyHandler text={entry.content} />}
            <EntryShortcuts backHref={backHref} />
            {/* Fixed Icons Layer */}
            <div className="fixed top-0 left-0 right-0 flex justify-center pointer-events-none z-[60]">
                <div className="w-full max-w-[42rem] relative h-0"> {/* h-0 ensures it doesn't push content? No, absolute in fixed is fine. */}
                    {/* Back Button */}
                    <Link
                        href={backHref}
                        className="absolute top-[32px] left-6 bg-transparent border-none text-black transition-colors cursor-pointer flex items-center justify-center p-2 rounded-full pointer-events-auto"
                        title="Back (Esc)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </Link>

                    {/* Copy Button */}
                    <div className="absolute top-[32px] right-8">
                        <CopyButton content={entry.content} id={entry.id} />
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div
                className="relative w-full max-w-[42rem] mx-auto min-h-screen box-border"
                style={{
                    paddingTop: '24px', // Reduced top margin
                    paddingBottom: '48px',
                    paddingLeft: '48px',
                    paddingRight: '48px',
                }}
            >
                <div className="shared-text-style pt-8 pb-4">
                    {/* pt-8 creates additional top space to ensure text aligns with icons visually starting at ~72px+offset?
                        Wait, in StreamEditor we had paddingTop: 64px on the container.
                        And icons at top-[72px].
                        Let's keep StreamEditor's container padding. 
                        
                        StreamEditor had:
                        paddingTop: '64px'
                        paddingLeft: '48px'
                        paddingRight: '48px'
                        
                        Icons at top-[72px].
                        
                        Text starts after 64px padding.
                        Icons are at 72px from top of SCREEN.
                        
                        So text starts at y=64.
                        Icons start at y=72.
                        Icons are slightly BELOW the start of the padding box?
                        
                        Wait, 72 > 64. So icons are 8px lower than the very top edge of the text container.
                        If text is right at the top of container, icons are 8px down from text start.
                        
                        User said "align with first line".
                        The StreamEditor layout worked. I will match it exactly.
                      */}
                    <Linkify text={entry.content} />
                </div>
            </div>
        </div>
    );
}
