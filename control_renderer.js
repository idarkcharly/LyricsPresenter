// Lyrics Presenter - Panel de Control
// Este archivo maneja toda la lógica de la ventana principal de la app.
// Aquí puedes editar canciones, controlar la proyección y gestionar la biblioteca.

(() => {
    let state = {
        library: [],
        activeSongId: null,
        activeLineIndex: -1,
        hidden: true,
        currentBgURL: null,
        currentBgIsVideo: false,
        fontSizeVh: 5,
        animEnabled: false,
        animFadeDuration: 0.8,
        animScaleDuration: 3
    };

    const els = {
        btnOpenProj: document.getElementById("btnOpenProj"),
        btnToggleVis: document.getElementById("btnToggleVis"),
        btnPrev: document.getElementById("btnPrev"),
        btnNext: document.getElementById("btnNext"),
        songList: document.getElementById("songList"),
        search: document.getElementById("search"),
        editor: document.getElementById("editor"),
        songTitle: document.getElementById("songTitle"),
        btnSave: document.getElementById("btnSave"),
        btnNew: document.getElementById("btnNew"),
        lineByLine: document.getElementById("lineByLine"),
        previewText: document.getElementById("previewText"),
        previewBg: document.getElementById("previewBg"),
        btnBg: document.getElementById("btnBg"),
        bgFileInput: document.getElementById("bgFile"),
        btnClearBg: document.getElementById("btnClearBg"),
        btnExport: document.getElementById("btnExport"),
        btnImport: document.getElementById("btnImport"),
        btnClearLib: document.getElementById("btnClearLib"),
        btnFontInc: document.getElementById("btnFontInc"),
        btnFontDec: document.getElementById("btnFontDec"),
        tabs: document.querySelectorAll(".tab"),
        tabViews: document.querySelectorAll(".tabview"),
        btnImportJson: document.getElementById("btnImportJson"),
        jsonFileInput: document.getElementById("jsonFileInput"),
        displaySelect: document.getElementById("displaySelect"),
        btnAnimToggle: document.getElementById("btnAnimToggle"),
        btnAnimSpeedDown: document.getElementById("btnAnimSpeedDown"),
        btnAnimSpeedUp: document.getElementById("btnAnimSpeedUp")
    };

    function uid() { return Math.random().toString(36).slice(2, 9); }

    function escapeHtml(str) {
        return String(str).replace(/[&<>"]/g, s => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
        }[s]));
    }

    function showToast(msg) {
        const toast = document.createElement("div");
        toast.textContent = msg;
        toast.style.position = "fixed";
        toast.style.bottom = "20px";
        toast.style.right = "20px";
        toast.style.background = "var(--accent)";
        toast.style.color = "#000";
        toast.style.padding = "10px 20px";
        toast.style.borderRadius = "8px";
        toast.style.zIndex = "9999";
        toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.5)";
        toast.style.fontWeight = "bold";
        toast.style.pointerEvents = "none";
        toast.style.transition = "opacity 0.3s";
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = "0";
            setTimeout(() => toast.remove(), 300);
        }, 2700);
    }

    async function init() {
        const lib = await window.api.storeGet();
        state.library = Array.isArray(lib) ? lib : [];
        els.btnToggleVis.textContent = state.hidden ? "Oculto (Esc)" : "En vivo (Esc)";
        if (!state.hidden) {
            els.btnToggleVis.style.background = "#ef4444";
            els.btnToggleVis.style.color = "#ffffff";
        }
        renderSongList();
        setupTabs();
        bindUI();
        updatePreview("");
        await populateDisplays();
    }

    function setupTabs() {
        els.tabs.forEach(t => {
            t.addEventListener("click", () => {
                els.tabs.forEach(x => x.classList.remove("active"));
                t.classList.add("active");
                const tab = t.dataset.tab;
                els.tabViews.forEach(tv => tv.style.display = "none");
                document.getElementById("tab-" + tab).style.display = "";
            });
        });
    }

    function renderSongList(filter = "") {
        const list = els.songList;
        list.innerHTML = "";
        const items = state.library.filter(s => (s.title || "").toLowerCase().includes(filter.toLowerCase()));
        if (items.length === 0) {
            list.innerHTML = '<div style="opacity:.7">Sin canciones</div>';
            return;
        }
        items.forEach(s => {
            const div = document.createElement("div");
            div.tabIndex = 0;
            div.textContent = `${s.title} (${s.lines ? s.lines.length : 0})`;
            if (s.id === state.activeSongId) div.classList.add("active");
            div.addEventListener("click", () => selectSong(s.id, false));
            div.addEventListener("dblclick", () => selectSong(s.id, true));
            list.appendChild(div);
        });
    }

    function selectSong(id, andProcess) {
        const s = state.library.find(x => x.id === id);
        if (!s) return;
        state.activeSongId = id;
        els.songTitle.value = s.title;
        els.editor.value = (s.lines || []).join("\n");
        els.editor.removeAttribute("disabled");
        els.songTitle.removeAttribute("disabled");
        els.editor.focus();
        renderSongList(els.search.value);
        if (andProcess) renderLines(getEditorLinesRaw());
    }

    function getEditorLinesRaw() {
        const raw = els.editor.value.replace(/\r\n?/g, "\n");
        return raw.split("\n");
    }


    function renderLines(lines) {
        state.activeLineIndex = -1;
        els.lineByLine.innerHTML = "";
        if (!lines || lines.length === 0) {
            els.lineByLine.innerHTML = '<div style="opacity:.6">No hay líneas</div>';
            return;
        }
        lines.forEach((txt, i) => {
            const row = document.createElement("div");
            const displayText = (txt && txt.length) ? escapeHtml(txt) : '<span style="opacity:.4">— línea vacía —</span>';
            row.innerHTML = `<strong>${i + 1}</strong> <span style="margin-left:8px">${displayText}</span>`;
            row.addEventListener("click", () => {
                projectLine(i);
                highlightLine(i);
                els.editor.focus();
            });
            row.addEventListener("dblclick", () => {
                projectLine(i);
            });
            els.lineByLine.appendChild(row);
        });
    }

    function highlightLine(i) {
        [...els.lineByLine.children].forEach((el, idx) => {
            el.style.background = idx === i ? "rgba(34,211,238,0.06)" : "transparent";
        });
        state.activeLineIndex = i;
    }

    function projectLine(i) {
        const lines = getEditorLinesRaw();
        if (!lines.length) return;
        if (i < 0) i = 0;
        if (i >= lines.length) i = lines.length - 1;
        const text = lines[i];
        updatePreview(text);
        window.api.sendToProjection({ type: "setLine", text });
        highlightLine(i);
    }

    function updatePreview(text) {
        const safe = (text || "").replace(/§/g, "<br>");
        els.previewText.innerHTML = safe || "Sin proyección";
        els.previewText.style.fontSize = "1.5vh";
        window.api.sendToProjection({ type: "setLine", text: text || "" });
    }

    function setBackgroundFromFile(file) {
        if (!file) return;
        const url = URL.createObjectURL(file);
        state.currentBgURL = url;
        state.currentBgIsVideo = file.type && file.type.startsWith("video/");
        els.previewBg.innerHTML = "";
        const isVideo = state.currentBgIsVideo;
        if (isVideo) {
            const v = document.createElement("video");
            v.src = url; v.autoplay = true; v.loop = true; v.muted = true; v.playsInline = true;
            v.style.width = "100%"; v.style.height = "100%"; v.style.objectFit = "cover";
            els.previewBg.appendChild(v);
        } else {
            const img = document.createElement("img");
            img.src = url; img.style.width = "100%"; img.style.height = "100%"; img.style.objectFit = "cover";
            els.previewBg.appendChild(img);
        }
        window.api.sendToProjection({ type: "setBackground", url, isVideo });
    }

    function bindUI() {
        let projectionOpen = false;

        els.btnOpenProj?.addEventListener("click", async () => {
            const displayId = parseInt(els.displaySelect.value, 10);
            if (!projectionOpen) {
                window.api.openProjection(displayId);
                els.btnOpenProj.textContent = "Cerrar proyección";
                projectionOpen = true;
                setTimeout(() => {
                    if (state.currentBgURL) {
                        window.api.sendToProjection({ type: "setBackground", url: state.currentBgURL, isVideo: !!state.currentBgIsVideo });
                    }
                    window.api.sendToProjection({ type: "toggleVisibility", hidden: state.hidden });
                    window.api.sendToProjection({ type: "setFontSize", vh: state.fontSizeVh });
                    window.api.sendToProjection({ type: "setAnim", enabled: state.animEnabled, fade: state.animFadeDuration, scale: state.animScaleDuration });
                    if (state.activeLineIndex !== -1) projectLine(state.activeLineIndex);
                }, 400);
            } else {
                window.api.closeProjection();
                els.btnOpenProj.textContent = "Abrir proyección";
                projectionOpen = false;
            }
        });

        window.api.onProjectionClosed?.(() => {
            els.btnOpenProj.textContent = "Abrir proyección";
            projectionOpen = false;
        });

        els.btnPrev?.addEventListener("click", () => nextLine(-1));
        els.btnNext?.addEventListener("click", () => nextLine(1));
        els.btnToggleVis?.addEventListener("click", toggleVisibility);

        els.btnSave?.addEventListener("click", () => {
            const title = (els.songTitle.value || "Sin título").trim();
            const lines = getEditorLinesRaw();
            if (state.activeSongId) {
                const idx = state.library.findIndex(x => x.id === state.activeSongId);
                if (idx > -1) { state.library[idx].title = title; state.library[idx].lines = lines; }
            } else {
                state.activeSongId = uid();
                state.library.push({ id: state.activeSongId, title, lines });
            }
            window.api.storeSet(state.library);
            renderSongList(els.search.value);
            renderLines(lines);
            showToast("Guardado y actualizado en proyección.");
        });

        els.btnNew?.addEventListener("click", () => {
            state.activeSongId = null; state.activeLineIndex = -1;
            els.songTitle.value = ""; els.editor.value = ""; els.lineByLine.innerHTML = "";
            renderSongList();
            updatePreview("");
        });

        els.search?.addEventListener("input", (e) => renderSongList(e.target.value));

        els.bgFileInput?.addEventListener("change", (e) => {
            const f = e.target.files[0]; if (f) setBackgroundFromFile(f); e.target.value = "";
        });
        els.btnBg?.addEventListener("click", () => els.bgFileInput.click());
        els.btnClearBg?.addEventListener("click", () => {
            els.previewBg.innerHTML = ""; state.currentBgURL = null; window.api.sendToProjection({ type: "clearBackground" });
        });

        els.btnExport?.addEventListener("click", async () => {
            const exportArray = state.library.map(s => ({
                titulo: s.title || "Sin título",
                letra: Array.isArray(s.lines) ? s.lines : []
            }));
            const content = JSON.stringify(exportArray, null, 2);
            try {
                const saved = await window.api.saveFile("Biblioteca.json", content);
                if (saved) showToast("Biblioteca exportada: " + saved);
            } catch (err) {
                showToast("Error al exportar: " + (err && err.message ? err.message : err));
            }
        });

        els.btnImport?.addEventListener("click", async () => {
            const input = document.createElement("input");
            input.type = "file";
            input.multiple = true;
            input.accept = ".json,.txt";
            input.addEventListener("change", async (ev) => {
                const files = Array.from(ev.target.files || []);
                const added = await importFiles(files);
                if (added > 0) showToast(`Importadas ${added} canciones.`);
                else showToast("No se importó ninguna canción (archivos vacíos o formato no reconocido).");
                input.value = "";
            });
            input.click();
        });

        async function importFiles(fileList) {
            const files = Array.from(fileList || []);
            if (files.length === 0) return 0;
            let added = 0;
            for (const file of files) {
                try {
                    const text = await file.text();
                    const name = file.name || "sin-nombre";
                    const ext = (name.split('.').pop() || "").toLowerCase();

                    if (ext === "json") {
                        let parsed = null;
                        try { parsed = JSON.parse(text); } catch (e) { parsed = null; }
                        if (Array.isArray(parsed)) {
                            parsed.forEach(item => {
                                const title = item.titulo || item.title || "Sin título";
                                const lines = Array.isArray(item.letra) ? item.letra
                                    : Array.isArray(item.lines) ? item.lines
                                        : (typeof item.letra === "string" ? item.letra.replace(/\r\n?/g, "\n").split("\n") : []);
                                state.library.push({ id: uid(), title, lines });
                                added++;
                            });
                        } else if (parsed && typeof parsed === "object") {
                            const title = parsed.titulo || parsed.title || name.replace(/\.[^.]+$/, '');
                            const lines = Array.isArray(parsed.letra) ? parsed.letra : Array.isArray(parsed.lines) ? parsed.lines : [];
                            state.library.push({ id: uid(), title, lines });
                            added++;
                        }
                    } else {
                        const fname = name.replace(/\.[^.]+$/, '');
                        const rawLines = text.replace(/\r\n?/g, "\n").split("\n");
                        if (rawLines.length) {
                            state.library.push({ id: uid(), title: fname || "Sin título", lines: rawLines });
                            added++;
                        }
                    }
                } catch (err) {
                    console.warn("Error importando archivo", file.name || file.path, err);
                }
            }
            if (added > 0) {
                window.api.storeSet(state.library);
                renderSongList();
            }
            return added;
        }

        document.addEventListener("dragenter", (e) => {
            if (e.dataTransfer.types && e.dataTransfer.types.includes("Files")) e.preventDefault();
        }, true);
        document.addEventListener("dragover", (e) => {
            if (e.dataTransfer.types && e.dataTransfer.types.includes("Files")) {
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
            }
        }, true);
        document.addEventListener("drop", async (e) => {
            const dtFiles = e.dataTransfer.files;
            if (!dtFiles || dtFiles.length === 0) return;
            e.preventDefault();
            const added = await importFiles(Array.from(dtFiles));
            if (added > 0) {
                showToast(`Importadas ${added} canciones desde drag & drop.`);
            }
        }, true);

        els.jsonFileInput?.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const added = await importFiles([file]);
            if (added > 0) showToast(`Importadas ${added} canciónes.`);
            else showToast("No se importó ninguna canción del JSON.");
            e.target.value = "";
        });

        els.btnClearLib?.addEventListener("click", () => {
            if (!confirm("Vaciar biblioteca?")) return;
            state.library = []; state.activeSongId = null; window.api.storeSet(state.library);
            renderSongList(); els.editor.value = ""; els.songTitle.value = ""; els.lineByLine.innerHTML = ""; updatePreview("");
        });

        els.btnFontInc?.addEventListener("click", () => adjustFontSize(1));
        els.btnFontDec?.addEventListener("click", () => adjustFontSize(-1));

        els.btnAnimToggle?.addEventListener("click", () => {
            state.animEnabled = !state.animEnabled;
            els.btnAnimToggle.textContent = state.animEnabled ? "Animación: ON" : "Animación: OFF";
            window.api.sendToProjection({ type: "setAnim", enabled: state.animEnabled, fade: state.animFadeDuration, scale: state.animScaleDuration });
            if (state.activeLineIndex !== -1) projectLine(state.activeLineIndex);
        });
        els.btnAnimSpeedUp?.addEventListener("click", () => {
            state.animFadeDuration = Math.max(0.2, state.animFadeDuration - 0.1);
            state.animScaleDuration = Math.max(0.5, state.animScaleDuration - 0.2);
            window.api.sendToProjection({ type: "setAnim", enabled: state.animEnabled, fade: state.animFadeDuration, scale: state.animScaleDuration });
            if (state.activeLineIndex !== -1) projectLine(state.activeLineIndex);
        });
        els.btnAnimSpeedDown?.addEventListener("click", () => {
            state.animFadeDuration = Math.min(2, state.animFadeDuration + 0.1);
            state.animScaleDuration = Math.min(6, state.animScaleDuration + 0.2);
            window.api.sendToProjection({ type: "setAnim", enabled: state.animEnabled, fade: state.animFadeDuration, scale: state.animScaleDuration });
            if (state.activeLineIndex !== -1) projectLine(state.activeLineIndex);
        });

        document.addEventListener("keydown", (e) => {
            const tag = document.activeElement.tagName;
            const isEditor = document.activeElement === els.editor;

            if (e.key === "Escape") {
                e.preventDefault();
                toggleVisibility();
                return;
            }

            if (isEditor) return;

            if (e.ctrlKey && e.key.toLowerCase() === "o") {
                e.preventDefault();
                window.api.openProjection();
                return;
            }
            if (["ArrowDown", "ArrowRight"].includes(e.key)) {
                e.preventDefault(); nextLine(1); return;
            }
            if (["ArrowUp", "ArrowLeft"].includes(e.key)) {
                e.preventDefault(); nextLine(-1); return;
            }
            if (e.key.toLowerCase() === "f") {
                window.api.sendToProjection({ type: "request-fullscreen" });
            }
            if (e.key === "Enter" && tag !== "INPUT" && tag !== "TEXTAREA") {
                e.preventDefault();
                if (state.activeLineIndex === -1) {
                    projectLine(0);
                } else {
                    projectLine(state.activeLineIndex);
                }
            }
        });

        window.api.onFromProjectionRequestToggle?.(() => {
            toggleVisibility();
        });
    }

    async function populateDisplays() {
        const displays = await window.api.listDisplays();
        els.displaySelect.innerHTML = "";
        displays.forEach(d => {
            const opt = document.createElement("option");
            opt.value = d.id;
            opt.textContent = d.isPrimary ? `Principal (${d.bounds.width}x${d.bounds.height})` : `Monitor ${d.id} (${d.bounds.width}x${d.bounds.height})`;
            els.displaySelect.appendChild(opt);
        });
    }

    function adjustFontSize(delta) {
        state.fontSizeVh = Math.max(1, state.fontSizeVh + delta);
        window.api.sendToProjection({ type: "setFontSize", vh: state.fontSizeVh });
    }

    function toggleVisibility() {
        state.hidden = !state.hidden;
        window.api.sendToProjection({ type: "toggleVisibility", hidden: state.hidden });
        els.btnToggleVis.textContent = state.hidden ? "Oculto (Esc)" : "En vivo (Esc)";
        if (!state.hidden) {
            els.btnToggleVis.style.background = "#ef4444";
            els.btnToggleVis.style.color = "#ffffff";
        } else {
            els.btnToggleVis.style.background = "";
            els.btnToggleVis.style.color = "";
        }
    }

    function nextLine(delta) {
        const lines = getEditorLinesRaw();
        if (lines.length === 0) return;
        let i = state.activeLineIndex;
        if (i === -1) i = 0;
        else i = i + delta;
        if (i < 0) i = 0;
        if (i >= lines.length) i = lines.length - 1;
        projectLine(i);
    }

    init();
})();