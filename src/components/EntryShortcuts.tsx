'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EntryShortcuts({ backHref }: { backHref: string }) {
    const router = useRouter();

    useEffect(() => {
        // Prefetch the back route immediately when this component mounts
        router.prefetch(backHref);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                router.push(backHref);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router, backHref]);

    return null;
}
