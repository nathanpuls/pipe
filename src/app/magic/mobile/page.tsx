"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function MagicMobileContent() {
    const [content, setContent] = useState<string | null>(null);
    const [status, setStatus] = useState("Tap to Send");
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("s");

    const sendClipboard = async () => {
        try {
            setStatus("Reading...");
            const text = await navigator.clipboard.readText();
            setContent(text);

            setStatus("Sending...");

            // Send via Supabase Realtime Broadcast (Zero-Latency, Ephemeral)
            await supabase.channel(`magic-${sessionId}`).send({
                type: "broadcast",
                event: "clipboard-sync",
                payload: { text: text },
            });

            setStatus("Sent!");

            // Auto-close after short delay (optional)
            setTimeout(() => {
                // window.close() unlikely to work on mobile invoked by QR scan unless opened new tab
                setStatus("Done!");
            }, 1000);

        } catch (err) {
            console.error(err);
            setStatus("Error: Tap to grant access");
        }
    };

    if (!sessionId) {
        return <div className="min-h-screen bg-black text-white p-8 font-bold">Error: Invalid Session</div>
    }

    return (
        <div
            className="min-h-screen bg-black text-white flex flex-col items-center justify-center cursor-pointer select-none active:bg-gray-900 transition-colors"
            onClick={sendClipboard}
        >
            <div className="text-center space-y-4 animate-pulse">
                <div className="w-24 h-24 bg-white/10 rounded-full mx-auto flex items-center justify-center">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                </div>

                <h1 className="text-4xl font-bold tracking-tighter uppercase">{status}</h1>

                {content && (
                    <p className="text-gray-500 text-xs px-8 truncate max-w-xs mx-auto">
                        {content}
                    </p>
                )}
            </div>
        </div>
    );
}

export default function MobilePage() {
    return (
        <Suspense fallback={<div className="bg-black min-h-screen">Loading...</div>}>
            <MagicMobileContent />
        </Suspense>
    )
}
