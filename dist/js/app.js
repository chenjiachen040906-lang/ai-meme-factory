// ===== AI 表情包工厂 - 主应用逻辑 =====

(function() {
    'use strict';

    // DOM 元素
    const memeInput = document.getElementById('memeInput');
    const generateBtn = document.getElementById('generateBtn');
    const randomBtn = document.getElementById('randomBtn');
    const templateGrid = document.getElementById('templateGrid');
    const galleryGrid = document.getElementById('galleryGrid');
    const memeCanvas = document.getElementById('memeCanvas');
    const topTextInput = document.getElementById('topText');
    const bottomTextInput = document.getElementById('bottomText');
    const fontSizeSlider = document.getElementById('fontSize');
    const fontSizeValue = document.getElementById('fontSizeValue');
    const textStrokeToggle = document.getElementById('textStroke');
    const downloadBtn = document.getElementById('downloadBtn');
    const shareBtn = document.getElementById('shareBtn');
    const toastContainer = document.getElementById('toastContainer');

    // 状态
    let currentTemplate = null;
    let currentTextColor = '#FFFFFF';
    let currentFilter = 'ai';
    let aiMatchedTemplates = [];

    // ===== 工具函数 =====
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    function showLoading(text = 'AI 正在匹配模板...') {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay active';
        overlay.id = 'loadingOverlay';
        overlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">${text}</div>
        `;
        document.body.appendChild(overlay);
    }

    function hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.remove();
    }

    // ===== AI 智能匹配算法 =====
    function analyzeInput(text) {
        if (!text.trim()) return [];

        const lowerText = text.toLowerCase();
        const scores = MEME_TEMPLATES.map(template => {
            let score = 0;

            // 关键词匹配
            template.keywords.forEach(keyword => {
                if (lowerText.includes(keyword.toLowerCase())) {
                    score += 10;
                }
            });

            // 类别匹配
            const categoryKeywords = SCENE_EMOTION_MAP[template.category] || [];
            categoryKeywords.forEach(kw => {
                if (lowerText.includes(kw)) {
                    score += 5;
                }
            });

            return { template, score };
        });

        // 按分数排序，取前8个
        return scores
            .filter(s => s.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 8)
            .map(s => s.template);
    }

    // ===== 渲染模板 =====
    function renderTemplates(templates, isAI = false) {
        templateGrid.innerHTML = '';

        if (templates.length === 0) {
            templateGrid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:40px;">没有找到匹配的模板，试试其他描述吧～</p>';
            return;
        }

        templates.forEach((template, index) => {
            const item = document.createElement('div');
            item.className = 'template-item';
            item.dataset.id = template.id;

            let matchBadge = '';
            if (isAI && index < 3) {
                const matchPercent = Math.max(95 - index * 8, 75);
                matchBadge = `<span class="template-match">${matchPercent}% 匹配</span>`;
            }

            item.innerHTML = `
                ${matchBadge}
                <span class="template-emoji">${template.emoji}</span>
                <span class="template-name">${template.name}</span>
            `;

            item.addEventListener('click', () => selectTemplate(template, item));
            templateGrid.appendChild(item);
        });
    }

    function renderGallery() {
        galleryGrid.innerHTML = '';
        MEME_TEMPLATES.forEach(template => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.innerHTML = `
                <span class="gallery-emoji">${template.emoji}</span>
                <span class="gallery-name">${template.name}</span>
                <span class="gallery-category">${getCategoryName(template.category)}</span>
            `;
            item.addEventListener('click', () => {
                document.getElementById('create').scrollIntoView({ behavior: 'smooth' });
                setTimeout(() => selectTemplate(template), 500);
            });
            galleryGrid.appendChild(item);
        });
    }

    function getCategoryName(cat) {
        const names = { happy: '开心', sad: '难过', angry: '生气', funny: '搞笑' };
        return names[cat] || cat;
    }

    // ===== 选择模板 =====
    function selectTemplate(template, element) {
        currentTemplate = template;

        // 更新选中状态
        document.querySelectorAll('.template-item').forEach(el => el.classList.remove('selected'));
        if (element) element.classList.add('selected');

        // 自动填充文字
        const inputText = memeInput.value.trim();
        if (inputText && !topTextInput.value) {
            // 智能提取简短文字
            const shortText = extractShortText(inputText);
            topTextInput.value = shortText;
        }

        // 渲染 Canvas
        renderCanvas();

        // 滚动到编辑器
        document.getElementById('step3').scrollIntoView({ behavior: 'smooth', block: 'center' });

        showToast(`已选择「${template.name}」模板`);
    }

    function extractShortText(text) {
        // 提取简短的描述文字（最多10个字符）
        if (text.length <= 10) return text;
        // 尝试找到逗号或句号前的部分
        const match = text.match(/^(.{1,10})[，。,!！]/);
        if (match) return match[1];
        return text.substring(0, 10) + '...';
    }

    // ===== Canvas 渲染 =====
    function renderCanvas() {
        if (!currentTemplate) return;

        const ctx = memeCanvas.getContext('2d');
        const width = memeCanvas.width;
        const height = memeCanvas.height;
        const fontSize = parseInt(fontSizeSlider.value);
        const useStroke = textStrokeToggle.checked;

        // 清空画布
        ctx.clearRect(0, 0, width, height);

        // 绘制背景渐变（根据类别）
        const gradients = {
            happy: ['#6C5CE7', '#00CEC9'],
            sad: ['#636E72', '#2D3436'],
            angry: ['#D63031', '#E17055'],
            funny: ['#FDCB6E', '#E17055']
        };
        const colors = gradients[currentTemplate.category] || gradients.happy;
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(1, colors[1]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // 绘制大 emoji
        ctx.font = `${fontSize * 4}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(currentTemplate.emoji, width / 2, height / 2);

        // 绘制模板名称
        ctx.font = `bold ${fontSize * 0.7}px 'Noto Sans SC', sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillText(currentTemplate.name, width / 2, height / 2 + fontSize * 3);

        // 绘制上方文字
        const topText = topTextInput.value || '';
        if (topText) {
            drawTextWithStyle(ctx, topText, width / 2, 60, fontSize, useStroke);
        }

        // 绘制下方文字
        const bottomText = bottomTextInput.value || '';
        if (bottomText) {
            drawTextWithStyle(ctx, bottomText, width / 2, height - 40, fontSize, useStroke);
        }
    }

    function drawTextWithStyle(ctx, text, x, y, fontSize, useStroke) {
        ctx.font = `900 ${fontSize}px 'Noto Sans SC', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (useStroke) {
            ctx.strokeStyle = 'rgba(0,0,0,0.8)';
            ctx.lineWidth = fontSize / 6;
            ctx.lineJoin = 'round';
            ctx.strokeText(text, x, y);
        }

        ctx.fillStyle = currentTextColor;
        ctx.fillText(text, x, y);
    }

    // ===== 事件绑定 =====

    // 生成按钮
    generateBtn.addEventListener('click', () => {
        const text = memeInput.value.trim();
        if (!text) {
            showToast('请先输入描述文字', 'error');
            memeInput.focus();
            return;
        }

        showLoading();

        // 模拟 AI 处理延迟
        setTimeout(() => {
            aiMatchedTemplates = analyzeInput(text);
            renderTemplates(aiMatchedTemplates, true);
            hideLoading();

            // 切换到 AI 推荐标签
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('[data-filter="ai"]').classList.add('active');
            currentFilter = 'ai';

            showToast(`AI 为你匹配了 ${aiMatchedTemplates.length} 个模板`);
        }, 800);
    });

    // 随机灵感
    randomBtn.addEventListener('click', () => {
        const random = RANDOM_INSPIRATIONS[Math.floor(Math.random() * RANDOM_INSPIRATIONS.length)];
        memeInput.value = random;
        showToast('已生成随机灵感 ✨');
    });

    // 快速标签
    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', () => {
            memeInput.value = tag.dataset.text;
            memeInput.focus();
        });
    });

    // 筛选按钮
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;

            if (currentFilter === 'ai') {
                renderTemplates(aiMatchedTemplates, true);
            } else if (currentFilter === 'all') {
                renderTemplates(MEME_TEMPLATES);
            } else {
                const filtered = MEME_TEMPLATES.filter(t => t.category === currentFilter);
                renderTemplates(filtered);
            }
        });
    });

    // 编辑器控件
    topTextInput.addEventListener('input', renderCanvas);
    bottomTextInput.addEventListener('input', renderCanvas);

    fontSizeSlider.addEventListener('input', () => {
        fontSizeValue.textContent = fontSizeSlider.value + 'px';
        renderCanvas();
    });

    textStrokeToggle.addEventListener('change', renderCanvas);

    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTextColor = btn.dataset.color;
            renderCanvas();
        });
    });

    // 下载按钮
    downloadBtn.addEventListener('click', () => {
        if (!currentTemplate) {
            showToast('请先选择一个模板', 'error');
            return;
        }

        const link = document.createElement('a');
        link.download = `meme_${currentTemplate.name}_${Date.now()}.png`;
        link.href = memeCanvas.toDataURL('image/png');
        link.click();

        showToast('表情包已下载！🎉');
    });

    // 分享按钮
    shareBtn.addEventListener('click', () => {
        if (!currentTemplate) {
            showToast('请先选择一个模板', 'error');
            return;
        }

        // 尝试使用 Web Share API
        if (navigator.share) {
            memeCanvas.toBlob(blob => {
                const file = new File([blob], 'meme.png', { type: 'image/png' });
                navigator.share({
                    title: 'AI 表情包工厂',
                    text: `我生成的「${currentTemplate.name}」表情包`,
                    files: [file]
                }).catch(() => {});
            });
        } else {
            // 复制到剪贴板
            memeCanvas.toBlob(blob => {
                navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]).then(() => {
                    showToast('已复制到剪贴板！');
                }).catch(() => {
                    showToast('请截图分享', 'error');
                });
            });
        }
    });

    // ===== 初始化 =====
    function init() {
        renderGallery();

        // 初始渲染一些推荐模板
        const initialTemplates = MEME_TEMPLATES.slice(0, 8);
        renderTemplates(initialTemplates);

        // Canvas 初始状态
        const ctx = memeCanvas.getContext('2d');
        ctx.fillStyle = '#1A1A2E';
        ctx.fillRect(0, 0, memeCanvas.width, memeCanvas.height);
        ctx.font = '24px "Noto Sans SC"';
        ctx.fillStyle = '#8888AA';
        ctx.textAlign = 'center';
        ctx.fillText('选择模板后预览将显示在这里', memeCanvas.width / 2, memeCanvas.height / 2);

        // 平滑滚动
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) target.scrollIntoView({ behavior: 'smooth' });
            });
        });
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
