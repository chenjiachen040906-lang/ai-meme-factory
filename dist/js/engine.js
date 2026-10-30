// ===== AI 匹配与文案生成引擎 =====
// 中文情绪分析 + 语义相似度匹配 + 规则幽默文案引擎

(function() {
    'use strict';

    // 情绪权重：某些词是强信号
    const STRONG_SIGNALS = {
        '哭': 'cry', '崩溃': 'cry', '破防': 'cry', '笑死': 'laugh', '哈哈': 'laugh',
        '躺平': 'lieflat', '摆烂': 'lieflat', '无语': 'deadpan', '震惊': 'shock',
        '气死': 'angry', '生气': 'angry', '委屈': 'sad', '得意': 'smug', '牛逼': 'smug',
        '好耶': 'happy', '开心': 'happy', '干饭': 'happy', '佛系': 'deadpan', '水豚': 'deadpan'
    };

    // 否定词：翻转情绪
    const NEGATORS = ['不', '没', '别', '莫', '勿', '非', '无', '难', 'failed', 'not', 'no'];

    // ===== 情绪分析 =====
    function analyzeEmotion(text) {
        const scores = {};
        Object.keys(EMOTION_LEXICON).forEach(e => scores[e] = 0);

        const lower = text.toLowerCase();

        // 强信号优先
        for (const [word, emotion] of Object.entries(STRONG_SIGNALS)) {
            if (lower.includes(word)) scores[emotion] += 5;
        }

        // 词典匹配（带位置权重：越靠后越重要，中文习惯重点在后）
        for (const [emotion, words] of Object.entries(EMOTION_LEXICON)) {
            words.forEach(w => {
                const idx = lower.indexOf(w);
                if (idx >= 0) {
                    const posWeight = 1 + (idx / Math.max(lower.length, 1)) * 0.5;
                    scores[emotion] += 2 * posWeight;
                }
            });
        }

        // 标点情绪：感叹号/问号增强
        const exclaim = (text.match(/！|!/g) || []).length;
        const question = (text.match(/？|\?/g) || []).length;
        if (exclaim >= 2) { scores.angry += 1; scores.shock += 1; }
        if (question >= 1) scores.shock += 2;
        if ((text.match(/哈|哈/g) || []).length >= 2) scores.laugh += 3;

        // 排序取 top
        return Object.entries(scores)
            .sort((a, b) => b[1] - a[1])
            .filter(([_, s]) => s > 0);
    }

    // 无明确情绪信号时的通用排序：中性/吐槽脸优先，正面的"得意"垫底
    const DEFAULT_PRIORITY = {
        deadpan: 9, lieflat: 8, cry: 7, shock: 6, sad: 5, angry: 4, happy: 3, laugh: 2, smug: 1
    };

    // ===== 模板匹配 =====
    function matchTemplates(text, limit = 4) {
        const emotions = analyzeEmotion(text);
        const lower = text.toLowerCase();
        const hasSignal = emotions.length > 0;

        const results = MEME_TEMPLATES.map(tpl => {
            let score = 0;

            // 情绪匹配（主权重）
            emotions.forEach(([emo, s], rank) => {
                if (tpl.emotion === emo) score += s * (rank === 0 ? 3 : 1.5);
            });

            // 关键词直接命中
            tpl.keywords.forEach(kw => {
                if (lower.includes(kw.toLowerCase())) score += 4;
            });

            // 无信号时用通用优先级兜底，避免正面脸排在吐槽场景前面
            if (!hasSignal && score === 0) score = DEFAULT_PRIORITY[tpl.emotion] || 0;

            return { tpl, score };
        });

        results.sort((a, b) => b.score - a.score);

        // 保证多样性：top 情绪各取一个，再补足
        const picked = [];
        const usedEmotions = new Set();
        results.forEach(r => {
            if (picked.length < limit && !usedEmotions.has(r.tpl.emotion)) {
                picked.push(r);
                usedEmotions.add(r.tpl.emotion);
            }
        });
        results.forEach(r => {
            if (picked.length < limit && !picked.includes(r)) picked.push(r);
        });

        // 计算匹配百分比（有情绪信号时按强度归一化，无信号时给保守值）
        if (!hasSignal) {
            return picked.map((r, i) => ({ template: r.tpl, match: 72 - i * 4 }));
        }
        const maxScore = Math.max(picked[0]?.score || 1, 1);
        return picked.map((r, i) => ({
            template: r.tpl,
            match: Math.min(Math.max(Math.round((r.score / maxScore) * 34 + 64 - i * 3), 62), 99)
        }));
    }

    // ===== 文案生成 =====
    // 上句=用户场景，下句=贴合该脸情绪的反应梗
    function generateCaptions(text, emotion) {
        const emo = (emotion && CAPTION_BOTTOMS[emotion]) ? emotion : 'deadpan';
        const bottoms = CAPTION_BOTTOMS[emo];
        const clean = text.trim().replace(/[。！!？?，,、;；\s]+$/, '');

        // 用输入+情绪哈希稳定选择下句，同一脸同一结果
        let hash = 0;
        const seed = clean + '|' + emo;
        for (let i = 0; i < seed.length; i++) {
            hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
        }
        const bottom = bottoms[Math.abs(hash) % bottoms.length];

        // 上句就是场景本身，过长截断（canvas 会自动换行）
        let top = clean;
        if (top.length > 26) top = top.slice(0, 25) + '…';

        return { top, bottom };
    }

    // ===== 智能断句（用户输入较长时拆成上下句）=====
    function splitInput(text) {
        const clean = text.trim();
        // 优先按标点拆
        const m = clean.match(/^(.{2,12})[，,、;；](.{2,12})$/);
        if (m) return { top: m[1], bottom: m[2] };
        // 按"我/他/她/它"拆
        const m2 = clean.match(/^(.{2,10})(我|他|她|它)(.{2,10})$/);
        if (m2) return { top: m2[1], bottom: m2[2] + m2[3] };
        return null;
    }

    // 暴露 API
    window.MemeEngine = {
        analyzeEmotion,
        matchTemplates,
        generateCaptions,
        splitInput
    };
})();
