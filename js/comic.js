// ===== 对话斗图条漫：脚本引擎 + 四格气泡漫画渲染 =====
// 输入一句吐槽 → 自动生成 A/B 两角色四格互怼漫画

(function() {
    'use strict';

    // 拆台补刀（第2格，B 说）
    const COMEBACKS = [
        '就这？我还以为多大事',
        '你先别急，让我先说',
        '听你这么一说，我更想笑了',
        '哦，然后呢？',
        '这话你上周也说过了',
        '我有一句实话不知当讲不当讲',
        '淡定，基本操作而已',
        '你接着说，我在听（并没有）'
    ];

    // 神转折收尾（第4格，B 说）
    const PUNCHLINES = [
        '没事，明天还得照常上班',
        '别难过，难过也没用',
        '问题不大，反正也解决不了',
        '你看开点，反正我看开了',
        '习惯就好，我都习惯了',
        '没事，群里的人都看见了',
        '别急，更惨的还在后头',
        '要不……先吃口饭再说？'
    ];

    const FROG_BY_EMOTION = {
        laugh: 'frog-laugh', cry: 'frog-cry', shock: 'frog-shock',
        lieflat: 'frog-lieflat', smug: 'frog-smug'
    };
    const BUDDY_POOL = ['capybara-deadpan', 'cow-trip', 'bear-angry', 'banana-cat', 'dog-happy'];

    function hashOf(s) {
        let h = 0;
        for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
        return Math.abs(h);
    }

    function tpl(id) {
        return MEME_TEMPLATES.find(t => t.id === id);
    }

    // 生成四格脚本：P1 A吐槽 → P2 B补刀 → P3 A爆发 → P4 B神收尾
    function generateScript(text, variant = 0) {
        const clean = text.trim().replace(/[。！!？?，,、;；\s]+$/, '');
        const emotions = MemeEngine.analyzeEmotion(text);
        const primary = emotions[0]?.[0] || 'deadpan';
        const seed = hashOf(clean + '|' + variant);

        // A：最贴输入情绪的角色；优先奶蛙系列
        const aId = FROG_BY_EMOTION[primary] || MemeEngine.matchTemplates(text, 1)[0].template.id;
        // B：互怼搭档，按哈希选，避免和 A 重复
        const buddy = BUDDY_POOL.filter(id => id !== aId);
        const bId = buddy[seed % buddy.length];

        // P3 A 的情绪爆发台词；deadpan/sad/angry/happy 也有语料
        const bottoms = CAPTION_BOTTOMS[primary] || CAPTION_BOTTOMS.deadpan;
        const reaction = bottoms[(seed >> 3) % bottoms.length];

        const p1 = clean.length > 22 ? clean.slice(0, 21) + '…' : clean;

        return {
            characters: { a: tpl(aId), b: tpl(bId) },
            panels: [
                { tpl: tpl(aId), line: p1, side: 'left' },
                { tpl: tpl(bId), line: COMEBACKS[(seed >> 5) % COMEBACKS.length], side: 'right' },
                { tpl: tpl(aId), line: reaction, side: 'left' },
                { tpl: tpl(bId), line: PUNCHLINES[(seed >> 7) % PUNCHLINES.length], side: 'right' }
            ]
        };
    }

    // ===== 渲染 =====
    const imageCache = {};
    function loadImage(src) {
        if (imageCache[src]) return Promise.resolve(imageCache[src]);
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => { imageCache[src] = img; resolve(img); };
            img.onerror = reject;
            img.src = src;
        });
    }

    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    function wrapText(ctx, text, maxWidth) {
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

    async function renderComic(canvas, script) {
        const ctx = canvas.getContext('2d');
        const W = canvas.width;             // 960
        const M = 16, GAP = 12;             // 外边距 / 格间距
        const S = (W - M * 2 - GAP) / 2;    // 单格边长 458
        const INK = '#33302B';

        ctx.fillStyle = '#FFF6E9';
        ctx.fillRect(0, 0, W, W);

        for (let i = 0; i < 4; i++) {
            const panel = script.panels[i];
            const px = M + (i % 2) * (S + GAP);
            const py = M + Math.floor(i / 2) * (S + GAP);
            const img = await loadImage(panel.tpl.src);

            // 面板底
            ctx.save();
            roundRect(ctx, px, py, S, S, 14);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.clip();

            // 气泡（先算行数确定高度）
            const fontSize = 27;
            ctx.font = `700 ${fontSize}px "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`;
            const bw = S - 40;
            const lines = wrapText(ctx, panel.line, bw - 32).slice(0, 3);
            const lineH = fontSize * 1.35;
            const bh = lines.length * lineH + 22;
            const bx = px + 20, by = py + 18;

            // 图片区：气泡下方到底
            const imgTop = by + bh + 18;
            const ih = py + S - imgTop;
            const scale = Math.max(S / img.width, ih / img.height);
            const dw = img.width * scale, dh = img.height * scale;
            ctx.drawImage(img, px + (S - dw) / 2, imgTop + (ih - dh) / 2, dw, dh);
            ctx.restore();

            // 面板描边
            roundRect(ctx, px, py, S, S, 14);
            ctx.lineWidth = 3;
            ctx.strokeStyle = INK;
            ctx.stroke();

            // 气泡体
            ctx.save();
            ctx.shadowColor = INK;
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 3;
            roundRect(ctx, bx, by, bw, bh, 12);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.restore();
            roundRect(ctx, bx, by, bw, bh, 12);
            ctx.lineWidth = 3;
            ctx.strokeStyle = INK;
            ctx.stroke();

            // 气泡尾巴
            const tailX = panel.side === 'left' ? bx + 46 : bx + bw - 46;
            ctx.beginPath();
            ctx.moveTo(tailX - 11, by + bh - 1.5);
            ctx.lineTo(tailX + (panel.side === 'left' ? -4 : 4), by + bh + 20);
            ctx.lineTo(tailX + 11, by + bh - 1.5);
            ctx.closePath();
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = INK;
            ctx.stroke();
            // 盖住尾巴与气泡交界线
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(tailX - 9, by + bh - 3, 18, 4);

            // 气泡文字
            ctx.font = `700 ${fontSize}px "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`;
            ctx.fillStyle = INK;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const startY = by + bh / 2 - ((lines.length - 1) / 2) * lineH;
            lines.forEach((line, li) => {
                ctx.fillText(line, bx + bw / 2, startY + li * lineH);
            });

            // 角色名小牌
            const name = panel.tpl.name.split('·')[0];
            ctx.font = '700 18px "Noto Sans SC", sans-serif';
            const nw = ctx.measureText(name).width + 20;
            const nx = panel.side === 'left' ? px + 14 : px + S - 14 - nw;
            const ny = py + S - 36;
            roundRect(ctx, nx, ny, nw, 26, 6);
            ctx.fillStyle = '#FFD700';
            ctx.fill();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = INK;
            ctx.stroke();
            ctx.fillStyle = INK;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(name, nx + nw / 2, ny + 14);
        }
    }

    window.ComicEngine = { generateScript, renderComic };
})();
