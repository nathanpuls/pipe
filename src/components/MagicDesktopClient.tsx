"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import QRCode from "react-qr-code";
import { v4 as uuidv4 } from "uuid";

// Initialize Supabase Client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MagicDesktopClient() {
    const [sessionId, setSessionId] = useState("");
    const [content, setContent] = useState<string | null>(null);
    const [status, setStatus] = useState("Scan to Connect");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // 1. Generate Session ID
        const newSession = uuidv4();
        setSessionId(newSession);

        // 2. Subscribe to Realtime Channel
        const channel = supabase.channel(`magic-${newSession}`);

        channel
            .on("broadcast", { event: "clipboard-sync" }, (payload) => {
                console.log("Received payload:", payload);
                if (payload.payload?.text) {
                    handleNewContent(payload.payload.text);
                }
            })
            .subscribe((status) => {
                if (status === "SUBSCRIBED") {
                    console.log("Ready to receive on channel " + newSession);
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleNewContent = async (text: string) => {
        setContent(text);
        setStatus("Received!");

        // Auto-copy if focused and supported
        try {
            await navigator.clipboard.writeText(text);
            setStatus("Copied to Clipboard!");
        } catch (e) {
            setStatus("Click to Copy");
        }
    };

    const manualCopy = async () => {
        if (content) {
            await navigator.clipboard.writeText(content);
            setStatus("Copied!");
        }
    };

    const mobileUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/magic/mobile?s=${sessionId}`
        : '';

    if (!mounted || !sessionId) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Initializing...</div>;

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
            {content ? (
                // CONTENT RECEIVED STATE
                <div className="text-center animate-in fade-in zoom-in duration-300 max-w-2xl w-full">
                    <div
                        className="relative bg-gray-900 rounded-2xl border border-gray-800 hover:border-white/20 transition-all text-left overflow-hidden group"
                    >
                        {/* Header / Status */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/50">
                            <span className="text-gray-400 text-xs font-mono uppercase tracking-widest">{status}</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    manualCopy();
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-xs font-medium transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                Copy
                            </button>
                        </div>

                        {/* Content Area */}
                        <div
                            onClick={manualCopy}
                            className="p-8 cursor-pointer hover:bg-white/5 transition-colors"
                        >
                            <pre className="text-xl md:text-3xl font-bold whitespace-pre-wrap break-words font-sans text-white">
                                {content}
                            </pre>
                        </div>
                    </div>

                    <button
                        onClick={() => setContent(null)}
                        className="mt-8 text-gray-500 hover:text-white transition-colors text-sm"
                    >
                        ← Scan Another Code
                    </button>
                </div>
            ) : (
                // QR CODE STATE
                <div className="text-center space-y-8">
                    <div className="bg-white p-4 rounded-xl inline-block">
                        <QRCode value={mobileUrl} size={256} />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold">Magic Drop</h1>
                        <p className="text-gray-500">Scan with your phone to send clipboard</p>
                    </div>

                    {/* Debug info */}
                    <div className="text-xs text-gray-800">
                        Session: {sessionId.slice(0, 8)}...
                    </div>
                </div>
            )}
        </div>
    );
}
