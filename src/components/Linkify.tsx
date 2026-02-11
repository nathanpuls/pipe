'use client';

import { cleanUrl } from '@/lib/utils';

export default function Linkify({ text }: { text: string }) {
    // Regex to match URLs with or without protocol
    // Matches: http://..., https://..., www...., or domain.com/...
    const urlRegex = /((?:https?:\/\/)?(?:www\.)?(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?)/g;

    const parts = text.split(urlRegex);

    return (
        <>
            {parts.map((part, i) => {
                // Check if the part matches a URL
                if (part.match(/^(?:https?:\/\/)?(?:www\.)?(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?$/)) {
                    let href = part;
                    if (!href.startsWith('http')) {
                        href = 'https://' + href;
                    }
                    const displayUrl = cleanUrl(part);
                    return (
                        <a
                            key={i}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'black', textDecoration: 'underline' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {displayUrl}
                        </a>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </>
    );
};
