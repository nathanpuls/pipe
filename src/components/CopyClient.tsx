"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function CopyContent() {
    const [status, setStatus] = useState("Loading...");
    const [content, setContent] = useState("");
    const searchParams = useSearchParams();
    const page = searchParams.get("page") || "home";

    useEffect(() => {
        // Fetch latest entry from simplified route
        fetch(`/api/copy?page=${page}`)
            .then(async (res) => {
                if (!res.ok) throw new Error(`API ${res.status}`);
                const text = await res.text();

                if (!text) {
                    setStatus("No content found");
                    return;
                }

                setContent(text);

                // Attempt Auto Copy
                try {
                    await navigator.clipboard.writeText(text);
                    setStatus("Copied!");
                    // Close window if opened by script
                    setTimeout(() => window.close(), 800);
                } catch (err) {
                    setStatus("Click anywhere to copy");
                }
            })
            .catch((err) => setStatus(`Error: ${err.message}`));
    }, [page]);

    const handleCopy = async () => {
        if (!content) return;
        try {
            await navigator.clipboard.writeText(content);
            setStatus("Copied!");
            setTimeout(() => window.close(), 800);
        } catch (err) {
            setStatus("Failed to copy");
        }
    };

    return (
        <div
            onClick={handleCopy}
            className="flex flex-col items-center justify-center min-h-screen bg-black text-white cursor-pointer select-none"
        >
            <h1 className="text-4xl font-bold mb-4">{status}</h1>
            <p className="text-gray-400 text-sm max-w-md text-center truncate px-4">
                {content || "..."}
            </p>
            <div className="absolute bottom-10 text-xs text-gray-600">
                Tap anywhere to retry copy
            </div>
        </div>
    );
}

export default function CopyClient() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
            <CopyContent />
        </Suspense>
    );
}
