"use client";

import { useEffect, useState } from "react";

export default function AutoCopyHandler({ text }: { text: string }) {
    const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

    useEffect(() => {
        if (!text) return;

        // Use a small timeout to ensure document is focused/ready
        const timer = setTimeout(async () => {
            try {
                await navigator.clipboard.writeText(text);
                setStatus("copied");
            } catch (err) {
                setStatus("failed");
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [text]);

    if (status === "idle") return null;

    return (
        <div
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full text-xs font-medium text-white transition-opacity duration-500 ${status === "copied" ? "bg-black" : "bg-red-500"
                }`}
        >
            {status === "copied" ? "Copied to clipboard" : "Click to copy"}
            {status === "failed" && (
                <button
                    onClick={() => navigator.clipboard.writeText(text)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
            )}
        </div>
    );
}
