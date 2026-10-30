// ===== AI 表情包工厂 v2 - 主应用 =====
// 流程：输入 → 即时出4张成品表情包 → 点选进编辑器 → 拖拽文字微调 → 下载

(function() {
    'use strict';

    const CANVAS_SIZE = 640;
    const imageCache = {};

    // DOM
    const $ = id => document.getElementById(id);
    const memeInput = $('memeInput');
    const generateBtn = $('generateBtn');
    const randomBtn = $('randomBtn');
    const resultsGrid = $('resultsGrid');
    const resultsSection = $('resultsSection');
    const editorSection = $('editorSection');
    const memeCanvas = $('memeCanvas');
    const topTextInput = $('topText');
    const bottomTextInput = $('bottomText');
    const downloadBtn = $('downloadBtn');
    const shareBtn = $('shareBtn');
    const remixBtn = $('remixBtn');
    const toastContainer = $('toastContainer');

    // 状态
    let currentTemplate = null;
    let currentCaptions = { top: '', bottom: '' };
    let textPositions = { top: 0.12, bottom: 0.9 }; // 相对高度
    let dragging = null;
    let lastInput = '';

    // ===== 工具 =====
    function showToast(msg, type = 'success') {
        const t = document.createElement('div');
        t.className = `toast ${type}`;
        t.textContent = msg;
        toastContainer.appendChild(t);
        setTimeout(() => t.remove(), 2600);
    }

    function loadImage(src) {
        if (imageCache[src]) return Promise.resolve(imageCache[src]);
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => { imageCache[src] = img; resolve(img); };
            img.onerror = reject;
            img.src = src;
        });
    }

    // ===== 渲染一张成品表情包到 canvas =====
    async function renderMeme(canvas, template, captions, positions, opts = {}) {
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        const img = await loadImage(template.src);

        ctx.clearRect(0, 0, W, H);

        // 背景
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, W, H);

        // 绘制模板图：cover 适配 + 轻微放大裁掉边缘水印
        const scale = Math.max(W / img.width, H / img.height) * 1.06;
        const dw = img.width * scale, dh = img.height * scale;
        ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);

        // 文字
        const fontSize = opts.fontSize || Math.round(W * 0.085);
        if (captions.top) drawMemeText(ctx, captions.top, W / 2, H * (positions?.top ?? 0.12), fontSize, W, opts);
        if (captions.bottom) drawMemeText(ctx, captions.bottom, W / 2, H * (positions?.bottom ?? 0.9), fontSize, W, opts);
    }

    // 标准 meme 排版：粗体 + 黑描边 + 白字，自动换行
    function drawMemeText(ctx, text, cx, cy, fontSize, canvasW, opts = {}) {
        const color = opts.color || '#FFFFFF';
        const stroke = opts.stroke !== false;
        const font = `900 ${fontSize}px "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`;
        ctx.font = font;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;

        // 自动换行
        const maxWidth = canvasW * 0.88;
        const lines = wrapText(ctx, text, maxWidth);
        const lineHeight = fontSize * 1.15;
        const startY = cy - ((lines.length - 1) / 2) * lineHeight;

        lines.forEach((line, i) => {
            const y = startY + i * lineHeight;
            if (stroke) {
                ctx.strokeStyle = 'rgba(0,0,0,0.92)';
                ctx.lineWidth = fontSize * 0.18;
                ctx.strokeText(line, cx, y);
            }
            ctx.fillStyle = color;
            ctx.fillText(line, cx, y);
        });
    }

    function wrapText(ctx, text, maxWidth) {
        if (ctx.measureText(text).width <= maxWidth) return [text];
        const lines = [];
        let cur = '';
        for (const ch of text) {
            if (ctx.measureText(cur + ch).width > maxWidth && cur) {
                lines.push(cur);
                cur = ch;
            } else {
                cur += ch;
            }
        }
        if (cur) lines.push(cur);
        return lines;
    }

    // ===== 生成结果 =====
    async function generate() {
        const text = memeInput.value.trim();
        if (!text) {
            showToast('先输入一句场景或吐槽', 'error');
            memeInput.focus();
            return;
        }
        lastInput = text;

        generateBtn.disabled = true;
        generateBtn.querySelector('span').textContent = 'AI 生成中…';

        const matches = MemeEngine.matchTemplates(text, 4);
        const emotions = MemeEngine.analyzeEmotion(text);
        const primaryEmotion = emotions[0]?.[0] || 'deadpan';

        // 用户输入若可拆成两句，直接用；否则引擎生成
        const split = MemeEngine.splitInput(text);

        resultsGrid.innerHTML = '';
        resultsSection.classList.add('visible');

        for (let i = 0; i < matches.length; i++) {
            const { template, match } = matches[i];
            const captions = split
                ? { top: split.top, bottom: split.bottom }
                : MemeEngine.generateCaptions(text, i === 0 ? primaryEmotion : template.emotion);

            const card = document.createElement('div');
            card.className = 'result-card';
            card.style.animationDelay = `${i * 0.08}s`;
            card.innerHTML = `
                <div class="result-canvas-wrap"><canvas width="480" height="480"></canvas></div>
                <div class="result-meta">
                    <span class="result-name">${template.name}</span>
                    <span class="result-match">${match}% 匹配</span>
                </div>
            `;
            resultsGrid.appendChild(card);

            const canvas = card.querySelector('canvas');
            await renderMeme(canvas, template, captions, null, { fontSize: 40 });

            card.addEventListener('click', () => openEditor(template, captions));
        }

        generateBtn.disabled = false;
        generateBtn.querySelector('span').textContent = '生成表情包';
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ===== 编辑器 =====
    async function openEditor(template, captions) {
        currentTemplate = template;
        currentCaptions = { ...captions };
        textPositions = { top: 0.12, bottom: 0.9 };
        topTextInput.value = captions.top;
        bottomTextInput.value = captions.bottom;

        editorSection.classList.add('visible');
        await redrawEditor();
        editorSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        showToast(`已载入「${template.name}」，拖动文字可调整位置`);
    }

    async function redrawEditor() {
        if (!currentTemplate) return;
        await renderMeme(memeCanvas, currentTemplate, {
            top: topTextInput.value,
            bottom: bottomTextInput.value
        }, textPositions, {
            color: window.__memeColor || '#FFFFFF',
            stroke: $('textStroke').checked,
            fontSize: parseInt($('fontSize').value)
        });
    }

    // 拖拽文字
    function canvasPos(e) {
        const rect = memeCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - rect.left) / rect.width,
            y: (clientY - rect.top) / rect.height
        };
    }

    function hitText(pos) {
        const topY = textPositions.top, botY = textPositions.bottom;
        const dTop = Math.abs(pos.y - topY), dBot = Math.abs(pos.y - botY);
        if (dTop < 0.08 && dTop <= dBot && topTextInput.value) return 'top';
        if (dBot < 0.08 && bottomTextInput.value) return 'bottom';
        return null;
    }

    memeCanvas.addEventListener('pointerdown', e => {
        const pos = canvasPos(e);
        dragging = hitText(pos);
        if (dragging) memeCanvas.setPointerCapture(e.pointerId);
    });
    memeCanvas.addEventListener('pointermove', e => {
        if (!dragging) {
            memeCanvas.style.cursor = hitText(canvasPos(e)) ? 'grab' : 'default';
            return;
        }
        memeCanvas.style.cursor = 'grabbing';
        const pos = canvasPos(e);
        textPositions[dragging] = Math.min(Math.max(pos.y, 0.06), 0.95);
        redrawEditor();
    });
    memeCanvas.addEventListener('pointerup', () => { dragging = null; });

    // 控件
    topTextInput.addEventListener('input', redrawEditor);
    bottomTextInput.addEventListener('input', redrawEditor);
    $('fontSize').addEventListener('input', () => {
        $('fontSizeValue').textContent = $('fontSize').value + 'px';
        redrawEditor();
    });
    $('textStroke').addEventListener('change', redrawEditor);
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            window.__memeColor = btn.dataset.color;
            redrawEditor();
        });
    });

    // 换一张（循环模板）
    remixBtn.addEventListener('click', async () => {
        if (!currentTemplate) return;
        const idx = MEME_TEMPLATES.findIndex(t => t.id === currentTemplate.id);
        currentTemplate = MEME_TEMPLATES[(idx + 1) % MEME_TEMPLATES.length];
        await redrawEditor();
        showToast(`已切换为「${currentTemplate.name}」`);
    });

    // 下载
    downloadBtn.addEventListener('click', () => {
        if (!currentTemplate) return;
        const link = document.createElement('a');
        link.download = `meme_${currentTemplate.id}_${Date.now()}.png`;
        link.href = memeCanvas.toDataURL('image/png');
        link.click();
        showToast('已保存！去群里炸场吧 🎉');
    });

    // 分享
    shareBtn.addEventListener('click', () => {
        if (!currentTemplate) return;
        memeCanvas.toBlob(blob => {
            if (navigator.share && navigator.canShare?.({ files: [new File([blob], 'm.png', { type: 'image/png' })] })) {
                navigator.share({
                    title: 'AI 表情包工厂',
                    text: '我用 AI 表情包工厂做的图',
                    files: [new File([blob], 'meme.png', { type: 'image/png' })]
                }).catch(() => {});
            } else if (navigator.clipboard?.write) {
                navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
                    .then(() => showToast('已复制到剪贴板'))
                    .catch(() => showToast('浏览器不支持，请直接下载', 'error'));
            } else {
                showToast('浏览器不支持，请直接下载', 'error');
            }
        });
    });

    // 随机灵感 & 示例标签
    randomBtn.addEventListener('click', () => {
        memeInput.value = RANDOM_INSPIRATIONS[Math.floor(Math.random() * RANDOM_INSPIRATIONS.length)];
        memeInput.focus();
    });
    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', () => {
            memeInput.value = tag.dataset.text;
            generate();
        });
    });

    generateBtn.addEventListener('click', generate);
    memeInput.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generate(); }
    });

    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            e.preventDefault();
            document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // 首屏演示：自动渲染一张示例
    (async function demo() {
        const demoCanvas = $('demoCanvas');
        if (!demoCanvas) return;
        await renderMeme(demoCanvas, MEME_TEMPLATES[0], { top: '当代码一次跑通', bottom: '就这？简简单单' }, null, { fontSize: 42 });
    })();
})();
