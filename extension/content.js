// 内容脚本：监听选中文本并注入解释按钮

console.log('🚀 Content script loaded on:', window.location.href);

let explainButton = null;
let isExplaining = false;
let cachedSelectedText = null; // 缓存选中的文本

// 创建解释按钮
function createExplainButton(text) {
    const button = document.createElement('div');
    button.id = 'ai-explain-button';
    button.innerHTML = '🤖 AI 解释';
    button.style.cssText = `
        position: fixed;
        z-index: 10000;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        cursor: pointer;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        transition: all 0.3s ease;
        pointer-events: auto;
    `;

    // 保存选中的文本到按钮上
    button.dataset.selectedText = text;
    cachedSelectedText = text;

    button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.05)';
        button.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
    });

    button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
        button.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
    });

    button.addEventListener('click', (e) => {
        e.stopPropagation(); // 防止事件冒泡
        console.log('🖱️ Button clicked!');
        const selectedText = button.dataset.selectedText || cachedSelectedText;
        console.log('📝 Selected text:', selectedText);
        if (selectedText) {
            sendToBackground(selectedText);
            hideButton();
            cachedSelectedText = null;
            // 重置状态，允许重复使用
            setTimeout(() => {
                isExplaining = false;
                console.log('✅ Status reset, button can be used again');
            }, 500);
        } else {
            console.warn('⚠️ No text selected');
        }
    });

    return button;
}

// 显示按钮
function showButton(x, y, text) {
    // 如果按钮不存在，创建它
    if (!explainButton) {
        explainButton = createExplainButton(text);
        document.body.appendChild(explainButton);
    } else {
        // 更新缓存的文本
        cachedSelectedText = text;
        explainButton.dataset.selectedText = text;
    }

    // 确保按钮不会超出屏幕
    const buttonWidth = 100;
    const buttonHeight = 40;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let finalX = x + 10;
    let finalY = y - 50;

    if (finalX + buttonWidth > windowWidth) {
        finalX = windowWidth - buttonWidth - 10;
    }
    if (finalY < 10) {
        finalY = y + 20;
    }
    if (finalY + buttonHeight > windowHeight) {
        finalY = windowHeight - buttonHeight - 10;
    }

    explainButton.style.left = finalX + 'px';
    explainButton.style.top = finalY + 'px';
    explainButton.style.display = 'block';
}

// 隐藏按钮
function hideButton() {
    if (explainButton) {
        explainButton.style.display = 'none';
    }
}

// 发送文本到后台脚本
function sendToBackground(text) {
    console.log('📤 Sending text to background:', text);
    chrome.runtime.sendMessage({ action: 'explain', text: text }, (response) => {
        console.log('📥 Response from background:', response);
        if (response && response.success) {
            isExplaining = true;
            console.log('✅ Text sent successfully');
        } else {
            console.error('❌ Failed to send text');
        }
    });
}

// 监听文本选择
document.addEventListener('mouseup', (e) => {
    setTimeout(() => {
        const selectedText = window.getSelection().toString().trim();

        if (selectedText && selectedText.length > 0) {
            console.log('📝 Text selected:', selectedText);
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                showButton(rect.left + rect.width / 2, rect.top, selectedText);
            }
        } else {
            hideButton();
            cachedSelectedText = null;
        }
    }, 10);
});

// 监听键盘事件（ESC 隐藏按钮）
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        hideButton();
    }
});

// 监听点击其他地方隐藏按钮
document.addEventListener('mousedown', (e) => {
    if (explainButton && !explainButton.contains(e.target)) {
        hideButton();
        cachedSelectedText = null;
    }
});

// 监听来自后台的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'explaining') {
        isExplaining = true;
        hideButton();
    } else if (request.action === 'done') {
        isExplaining = false;
    }
});