import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'edge';

const getSupabase = () => {
    const url = process.env.SUPABASE_URL || '';
    const key = process.env.SUPABASE_KEY || '';
    return createClient(url, key);
};

const ensurePage = async (supabase: any, pageName: string) => {
    const { error } = await supabase
        .from('pages')
        .upsert(
            { name: pageName, created_at: new Date().toISOString() },
            { onConflict: 'name', ignoreDuplicates: true }
        );
    if (error) {
        console.error(`Error ensuring page '${pageName}':`, error);
    }
};

export async function POST(request: Request) {
    const supabase = getSupabase();
    try {
        const body = await request.json();
        const { pageName: rawPage, content } = body;

        if (!content) {
            return NextResponse.json({ error: 'Missing content' }, { status: 400 });
        }

        const pageName = (rawPage || 'home').toLowerCase();

        await ensurePage(supabase, pageName);

        const { error } = await supabase.from('entries').insert({
            id: uuidv4(),
            page_name: pageName,
            content,
            created_at: new Date().toISOString(),
        });

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
    }
}
