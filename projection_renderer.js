// projection_renderer.js
// Este archivo controla la ventana de proyección (lo que ve el público).
// Recibe mensajes desde el panel de control y actualiza el fondo, el texto y la animación.

(() => {
    let hidden = false;
    let currentFontVh = 5;
    let useAnimation = false;
    let fadeDuration = 0.8;
    let scaleDuration = 3;

    const MUSIC_CLASS = 'shadow-dance-text';
    const MUSIC_STYLE_ID = 'projection-music-style';

    function ensureMusicStyle() {
        if (document.getElementById(MUSIC_STYLE_ID)) return;
        const css = `
.${MUSIC_CLASS} {
    font-size: inherit;
    color: inherit;
    text-shadow: 5px 5px 0 #ff005e, 10px 10px 0 #00d4ff;
    animation: shadow-dance 2s infinite;
}
@keyframes shadow-dance {
    0%, 100% { text-shadow: 5px 5px 0 #ff005e, 10px 10px 0 #00d4ff; }
    50% { text-shadow: -5px -5px 0 #00d4ff, -10px -10px 0 #ff005e; }
}
`;
        const style = document.createElement('style');
        style.id = MUSIC_STYLE_ID;
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);
    }

    function animateText(text) {
        const container = document.getElementById("text");
        container.classList.remove("fade-animated");
        container.classList.add("text", "fade-animated");
        container.style.setProperty('--fade-duration', fadeDuration + 's');
        container.style.setProperty('--scale-duration', scaleDuration + 's');
        container.innerHTML = "";
        const lines = String(text).split(/\n/);
        let delayBase = 0.1;
        let charIndex = 0;
        lines.forEach((line) => {
            const lineDiv = document.createElement("div");
            lineDiv.style.display = "block";
            lineDiv.style.margin = "0";
            lineDiv.style.lineHeight = "1.18";
            Array.from(line).forEach((char) => {
                const span = document.createElement("span");
                if (char === " ") {
                    span.innerHTML = "&nbsp;";
                    span.style.display = "inline-block";
                    span.style.width = "0.5em";
                } else {
                    span.textContent = char;
                }
                let delayStep = fadeDuration / Math.max(text.length, 10);
                span.style.animationDelay = (delayBase + charIndex * delayStep) + "s";
                lineDiv.appendChild(span);
                charIndex++;
            });
            container.appendChild(lineDiv);
        });
    }

    function setLine(text) {
        let raw = text || "";
        raw = raw.replace(/\\n/g, '\n');
        raw = raw.replace(/\\r/g, '');
        raw = raw.replace(/§/g, '\n');
        const hasMusicSymbol = /♪/.test(raw);
        const container = document.getElementById("text");
        if (hasMusicSymbol) ensureMusicStyle();
        if (useAnimation) {
            if (hasMusicSymbol) {
                const html = raw.replace(/\n/g, '<br>');
                container.classList.remove("fade-animated");
                container.classList.add("text");
                container.classList.add(MUSIC_CLASS);
                container.innerHTML = html;
            } else {
                container.classList.remove(MUSIC_CLASS);
                animateText(raw);
            }
        } else {
            const html = raw.replace(/\n/g, '<br>');
            container.classList.remove("fade-animated");
            container.classList.remove(MUSIC_CLASS);
            container.classList.add("text");
            container.innerHTML = html;
        }
    }

    function toggleVisibility(h) {
        hidden = typeof h === "boolean" ? h : !hidden;
        document.body.classList.toggle("hidden", hidden);
    }

    function setBackground({ url, isVideo }) {
        const bg = document.getElementById("bg");
        bg.innerHTML = "";
        if (!url) return;
        if (isVideo) {
            const v = document.createElement("video");
            v.src = url; v.autoplay = true; v.loop = true; v.muted = true; v.playsInline = true;
            v.style.width = "100%"; v.style.height = "100%"; v.style.objectFit = "cover";
            bg.appendChild(v);
        } else {
            const img = document.createElement("img");
            img.src = url; img.style.width = "100%"; img.style.height = "100%"; img.style.objectFit = "cover";
            bg.appendChild(img);
        }
    }

    function clearBackground() {
        document.getElementById("bg").innerHTML = "";
    }

    function setFontSize(v) {
        currentFontVh = v;
        document.getElementById("text").style.fontSize = v + "vh";
    }

    window.api.onToProjection((msg) => {
        if (!msg || !msg.type) return;
        switch (msg.type) {
            case "setLine": setLine(msg.text); break;
            case "toggleVisibility": toggleVisibility(msg.hidden); break;
            case "setBackground": setBackground({ url: msg.url, isVideo: !!msg.isVideo }); break;
            case "clearBackground": clearBackground(); break;
            case "setFontSize": setFontSize(msg.vh || 5); break;
            case "request-focus": window.focus(); break;
            case "setAnim":
                useAnimation = !!msg.enabled;
                fadeDuration = msg.fade || 0.8;
                scaleDuration = msg.scale || 3;
                break;
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            e.preventDefault();
            window.api.sendToProjection?.({ type: "projection-request-toggle" });
        }
        if (e.key.toLowerCase() === "f") {
            e.preventDefault();
            const el = document.documentElement;
            if (!document.fullscreenElement) el.requestFullscreen().catch(() => { });
            else document.exitFullscreen();
        }
    });

    document.addEventListener("DOMContentLoaded", () => {
        const t = document.getElementById("text");
        if (t) t.style.fontSize = currentFontVh + "vh";
    });
})();
