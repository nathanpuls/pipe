const gap = '\n\n';
let currentStream = '';
let selectionStartIdx = null;
let parts = [];

// --- LOAD ---
async function loadStream() {
    try {
        const page = window.location.pathname.substring(1) || 'home';
        const r = await fetch(`/entries?page=${page}&t=${Date.now()}`);
        if (!r.ok) return;
        const data = await r.json();
        currentStream = data.map(e => e.content).join(gap);
        renderStream();
    } catch (e) { console.error('Load failed', e); }
}

// --- RENDER ---
function renderStream() {
    const container = document.getElementById('streamView');
    if (!currentStream) {
        container.innerHTML = '<div class="opacity-30">tap to write</div>';
        return;
    }

    parts = currentStream.split(/(\s+)/);

    let html = '';
    parts.forEach((part, idx) => {
        if (!part) return;

        if (/^\s+$/.test(part)) {
            html += `<span class="whitespace-span" data-idx="${idx}">${part}</span>`;
        } else {
            const safeContent = escapeHtml(part);

            // LINK DETECTION
            const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
            const isUrl = part.match(urlRegex) || (part.includes('.') && part.length > 4 && !part.endsWith('.') && !part.startsWith('.'));

            if (isUrl) {
                let href = part;
                if (!href.match(/^https?:\/\//)) href = 'https://' + href;
                html += `<span class="word-span" data-idx="${idx}" onclick="event.stopPropagation(); handleWordClick(${idx})"><a href="${href}" target="_blank" class="text-black underline cursor-pointer" onclick="event.stopPropagation()">${safeContent}</a></span>`;
            } else {
                html += `<span class="word-span" data-idx="${idx}" onclick="event.stopPropagation(); handleWordClick(${idx})">${safeContent}</span>`;
            }
        }
    });

    container.innerHTML = html;
}

// --- INTERACTION ---
async function handleWordClick(idx) {
    if (selectionStartIdx === null) {
        // --- FIRST CLICK ---
        selectionStartIdx = idx;

        // Copy until Double Enter (Paragraph Break)
        let endIdx = idx;
        for (let i = idx + 1; i < parts.length; i++) {
            if (parts[i].includes('\n\n')) {
                endIdx = i - 1;
                break;
            }
            endIdx = i;
        }

        highlightRange(idx, endIdx);
        const text = parts.slice(idx, endIdx + 1).join('');
        try { await navigator.clipboard.writeText(text); } catch (err) { }

    } else {
        // --- SECOND CLICK ---
        const start = Math.min(selectionStartIdx, idx);
        const end = Math.max(selectionStartIdx, idx);
        highlightRange(start, end);

        const textSegment = parts.slice(start, end + 1).join('');
        try { await navigator.clipboard.writeText(textSegment); } catch (err) { }

        setTimeout(() => {
            clearHighlights();
            selectionStartIdx = null;
        }, 600);
    }
}

function highlightRange(start, end) {
    clearHighlights();
    for (let i = start; i <= end; i++) {
        const els = document.querySelectorAll(`span[data-idx="${i}"]`);
        els.forEach(el => el.classList.add('selection-highlight'));
    }
}

function clearHighlights() {
    document.querySelectorAll('.selection-highlight').forEach(el => {
        el.classList.remove('selection-highlight');
    });
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// --- EDITOR & CONTAINER CLICK ---
function enterEditMode() {
    const streamView = document.getElementById('streamView');
    const editor = document.getElementById('giantEditor');
    streamView.style.display = 'none';
    editor.classList.remove('hidden');
    editor.value = currentStream;
    autoExpand(editor);
    setTimeout(() => { editor.focus(); }, 10);
}

async function saveAndExit() {
    const streamView = document.getElementById('streamView');
    const editor = document.getElementById('giantEditor');
    const newVal = editor.value;

    editor.classList.add('hidden');
    streamView.style.display = 'block';

    if (newVal === currentStream) return;

    currentStream = newVal;
    renderStream();

    const page = window.location.pathname.substring(1) || 'home';
    await fetch('/entries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageName: page, contents: [newVal] })
    });
}

function autoExpand(field) {
    field.style.height = 'inherit';
    const height = field.scrollHeight;
    field.style.height = height + 'px';
}

// --- EVENTS ---
window.onload = () => {
    loadStream();
    setupRealtime();

    // BACK TO BASICS: Click Empty Space -> Edits.
    // This allows Mobile users to tap below/empty to write.
    // It keeps Copy logic restricted to Text Clicks.
    document.getElementById('streamView').onclick = (e) => {
        if (e.target.tagName !== 'A' && e.target.tagName !== 'SPAN') {
            enterEditMode();
        }
    };

    const editor = document.getElementById('giantEditor');
    editor.addEventListener('input', function () { autoExpand(this); });
};

window.onkeydown = (e) => {
    const editor = document.getElementById('giantEditor');
    const isEditing = !editor.classList.contains('hidden');

    if (isEditing) {
        if (e.key === 'Escape') saveAndExit();
    } else {
        if (e.key === ' ' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            enterEditMode();
        }
    }
};

// --- REALTIME ---
async function setupRealtime() {
    try {
        const c = await fetch('/config');
        const config = await c.json();
        if (!window.supabase) return;
        const supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseKey);

        supabase.channel('updates').on('postgres_changes', { event: '*', schema: 'public', table: 'entries' }, () => {
            const editor = document.getElementById('giantEditor');
            if (editor.classList.contains('hidden')) loadStream();
        }).subscribe();
    } catch (e) { }
}
