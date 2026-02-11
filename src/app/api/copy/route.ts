import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// EDGE RUNTIME: Ensure fast execution at the edge
export const runtime = 'edge';

// CORS HEADERS: Define them explicitly here for THIS specific route
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// 1. OPTIONS HANDLER: Must respond immediately to preflight
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// 2. GET HANDLER: Fetch latest entry and return plain text
export async function GET(request: Request) {
    // If this is a preflight check (some browsers do GET as preflight sometimes?), handling OPTIONS is safer
    // But for GET, we just need to return the data WITH headers.

    // Supabase Setup
    const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_KEY!
    );

    // Fetch Logic (Simplified: Just get latest for 'home' page)
    // You can extend query params later if needed
    const { searchParams } = new URL(request.url);
    const pageName = (searchParams.get('page') || 'home').toLowerCase();

    const { data, error } = await supabase
        .from('entries')
        .select('content')
        .eq('page_name', pageName)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500, headers: corsHeaders }
        );
    }

    // Return Plain Text specific for clipboard, WITH CORS
    return new Response(data?.content || '', {
        status: 200,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            ...corsHeaders,
        },
    });
}
