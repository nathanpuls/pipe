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

export default function MagicDesktopPage() {
    const [sessionId, setSessionId] = useState("");
    const [content, setContent] = useState<string | null>(null);
    const [status, setStatus] = useState("Scan to Connect");

    useEffect(() => {
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

    if (!sessionId) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Initializing...</div>;

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
            {content ? (
                // CONTENT RECEIVED STATE
                <div className="text-center animate-in fade-in zoom-in duration-300 max-w-2xl w-full">
                    <div
                        onClick={manualCopy}
                        className="bg-gray-900 p-8 rounded-2xl border border-gray-800 cursor-pointer hover:border-white/20 transition-all"
                    >
                        <h2 className="text-gray-400 text-sm mb-4 uppercase tracking-widest">{status}</h2>
                        <pre className="text-2xl md:text-4xl font-bold whitespace-pre-wrap break-words font-sans text-white">
                            {content}
                        </pre>
                    </div>
                    <button
                        onClick={() => setContent(null)}
                        className="mt-8 text-gray-600 hover:text-white transition-colors"
                    >
                        Scan Another
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
