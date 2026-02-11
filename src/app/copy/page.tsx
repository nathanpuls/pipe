"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function AutoCopyPage() {
    const [status, setStatus] = useState("Loading...");
    const [content, setContent] = useState("");
    const searchParams = useSearchParams();
    const page = searchParams.get("page") || "home";

    useEffect(() => {
        // Fetch latest entry
        fetch(`/api/entries?mode=latest_text&page=${page}`)
            .then(async (res) => {
                if (!res.ok) throw new Error("Failed");
                const text = await res.text();
                setContent(text);

                // Attempt Auto Copy
                try {
                    await navigator.clipboard.writeText(text);
                    setStatus("Copied to clipboard!");
                    // Optional: Close window if opened by script
                    // window.close();
                } catch (err) {
                    setStatus("Click anywhere to copy");
                }
            })
            .catch(() => setStatus("Error fetching entry"));
    }, [page]);

    const handleCopy = async () => {
        if (!content) return;
        try {
            await navigator.clipboard.writeText(content);
            setStatus("Copied!");
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
