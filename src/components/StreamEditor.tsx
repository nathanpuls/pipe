'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import Linkify from './Linkify';
import { cleanUrl } from '@/lib/utils';

type Entry = {
    id: string;
    content: string;
    created_at: string;
};

export default function StreamEditor() {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const pathname = usePathname();

    const getPageName = () => {
        const p = pathname?.substring(1);
        return p || 'home';
    };

    const loadStream = async () => {
        try {
            const page = getPageName();
            const r = await fetch(`/api/entries?page=${page}&t=${Date.now()}`);
            if (!r.ok) return;
            const data = await r.json();
            setEntries(data || []);
        } catch (e) {
            console.error('Load failed', e);
        }
    };

    useEffect(() => {
        loadStream();
        const cleanup = setupRealtime();
        return () => {
            cleanup.then(unsub => unsub && unsub());
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    const setupRealtime = async () => {
        try {
            const c = await fetch('/api/config');
            const config = await c.json();
            if (!config.supabaseUrl || !config.supabaseKey) return;

            const supabase = createClient(config.supabaseUrl, config.supabaseKey);
            const channel = supabase.channel('updates')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'entries' }, () => {
                    loadStream();
                })
                .subscribe();

            return () => { supabase.removeChannel(channel); };
        } catch (e) {
            console.error(e);
            return () => { };
        }
    };

    const copyToClipboard = (text: string, id: string, e: React.MouseEvent) => {
        e.preventDefault(); // Prevent Link navigation
        e.stopPropagation();
        navigator.clipboard.writeText(text).catch(() => { });
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const getFirstLine = (text: string) => {
        const lines = text.split('\n');
        let first = lines[0] || '';

        // Check if the first line is solely a URL
        const urlRegex = /^(?:https?:\/\/)?(?:www\.)?(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?$/;
        if (first.match(urlRegex)) {
            first = cleanUrl(first);
        }

        // Use a reasonable char limit for the list view
        if (first.length > 100) {
            first = first.substring(0, 100) + '...';
        } else if (lines.length > 1) {
            first += '...';
        }
        return first;
    };

    return (
        <div className="shared-text-style">
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {entries.map((entry) => (
                    <li
                        key={entry.id}
                        className="group flex items-baseline justify-between cursor-pointer"
                    >
                        <Link
                            href={`/entry/${entry.id}`}
                            className="flex-1 text-black font-inter text-base truncate pr-8 hover:text-gray-600 transition-colors focus:outline-none focus:text-gray-600 no-underline"
                        >
                            {getFirstLine(entry.content)}
                        </Link>
                        <button
                            onClick={(e) => copyToClipboard(entry.content, entry.id, e)}
                            className="bg-transparent border-none p-2 text-black transition-colors cursor-pointer pointer-events-auto flex items-center justify-center"
                            title="Copy"
                        >
                            {copiedId === entry.id ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                            )}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
