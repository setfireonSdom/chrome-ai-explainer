// 侧边栏脚本：处理用户交互和 API 调用

console.log('🚀 Sidebar script loaded');

// ========== 全局配置 ==========
// 可用的 AI 模型列表
const AVAILABLE_MODELS = [
    { value: 'qwen2.5:1.5b', label: 'Qwen 2.5 (1.5B) - 最快' },
    { value: 'qwen3.5:2b', label: 'Qwen 3.5 (2B) - 推荐' },
    { value: 'qwen3.5:9b', label: 'Qwen 3.5 (9B) - 最强' }
];

// 默认模型（修改这里可以改变默认选择）
const DEFAULT_MODEL = 'qwen2.5:1.5b';

// 后端 API 地址
const API_URL = 'http://127.0.0.1:8000/api/explain';
// =================================

const selectedText = document.getElementById('selectedText');
const explainBtn = document.getElementById('explainBtn');
const output = document.getElementById('output');
const modelSelect = document.getElementById('modelSelect');
const statusDot = document.querySelector('.status-dot');
const statusText = document.querySelector('.status-text');

console.log('✅ Elements found:', {
    selectedText: !!selectedText,
    explainBtn: !!explainBtn,
    output: !!output,
    modelSelect: !!modelSelect
});

// 初始化：从存储中获取选中的文本
chrome.storage.local.get(['textToExplain'], (result) => {
    console.log('📦 Storage result:', result);
    if (result.textToExplain) {
        selectedText.value = result.textToExplain;
        console.log('📝 Text loaded:', result.textToExplain);
        // 清除存储
        chrome.storage.local.remove(['textToExplain']);
        // 自动触发解释
        setTimeout(() => {
            explainText();
        }, 300);
    }
});

// 监听存储变化（实时响应）
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.textToExplain) {
        const newText = changes.textToExplain.newValue;
        console.log('📝 Text changed:', newText);
        if (newText) {
            selectedText.value = newText;
            chrome.storage.local.remove(['textToExplain']);
            setTimeout(() => {
                explainText();
            }, 300);
        }
    }
});

// 动态填充模型下拉菜单
function initializeModelSelect() {
    if (modelSelect) {
        modelSelect.innerHTML = '';
        AVAILABLE_MODELS.forEach(model => {
            const option = document.createElement('option');
            option.value = model.value;
            option.textContent = model.label;
            if (model.value === DEFAULT_MODEL) {
                option.selected = true;
            }
            modelSelect.appendChild(option);
        });
        console.log('✅ Model select initialized with', AVAILABLE_MODELS.length, 'models');
    }
}

// 初始化模型选择器
initializeModelSelect();

// 更新状态
function updateStatus(status) {
    statusDot.classList.remove('busy', 'error');
    
    switch (status) {
        case 'ready':
            statusText.textContent = '就绪';
            break;
        case 'loading':
            statusDot.classList.add('busy');
            statusText.textContent = '处理中...';
            break;
        case 'error':
            statusDot.classList.add('error');
            statusText.textContent = '错误';
            break;
    }
}

// 显示错误
function showError(message) {
    updateStatus('error');
    output.innerHTML = `<div style="color: #ef4444; padding: 12px; background: #fef2f2; border-radius: 8px; border-left: 4px solid #ef4444;">
        <strong>错误：</strong>${message}
    </div>`;
}

// 流式接收并显示响应
async function streamResponse(reader) {
    const decoder = new TextDecoder();
    let buffer = '';
    let currentContent = '';
    
    output.innerHTML = ''; // 清空输出
    
    try {
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // 保留最后一个不完整的行
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        
                        if (data.content) {
                            currentContent += data.content;
                            // 使用 innerHTML 并进行简单的文本格式化
                            output.innerHTML = formatContent(currentContent);
                            output.scrollTop = output.scrollHeight;
                        }
                        
                        if (data.error) {
                            showError(data.error);
                            return;
                        }
                        
                        if (data.done) {
                            updateStatus('ready');
                            explainBtn.disabled = false;
                            explainBtn.classList.remove('loading');
                            return;
                        }
                    } catch (e) {
                        console.error('解析响应失败:', e);
                    }
                }
            }
        }
    } catch (error) {
        showError('接收响应时出错: ' + error.message);
    } finally {
        explainBtn.disabled = false;
        explainBtn.classList.remove('loading');
        updateStatus('ready');
    }
}

// 格式化内容，将换行符转换为 <br> 或段落
function formatContent(content) {
    // 将多个连续换行符替换为单个换行符
    let formatted = content.replace(/\n{3,}/g, '\n\n');
    
    // 将换行符转换为 <br> 标签
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
}

// 解释文本
async function explainText() {
    const text = selectedText.value.trim();
    const model = modelSelect.value;

    if (!text) {
        showError('请输入要解释的文本');
        return;
    }

    explainBtn.disabled = true;
    explainBtn.classList.add('loading');
    updateStatus('loading');

    // 根据模型大小显示不同的提示信息
    const modelSize = model.includes('9b') ? '9B' : model.includes('2b') ? '2B' : '1.5B';
    const thinkingTime = modelSize === '9B' ? '（需要更多时间）' : modelSize === '2B' ? '（正在快速处理）' : '（快速响应）';

    output.innerHTML = `
        <div style="color: #667eea; text-align: center; padding: 20px;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 10px;">
                <span class="btn-loader" style="display: inline-block;"></span>
                <span style="font-weight: 500;">AI 正在思考 ${thinkingTime}</span>
            </div>
            <div style="font-size: 12px; color: #94a3b8;">
                当前模型: ${model} (${modelSize} 参数)
            </div>
        </div>
    `;
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text, model })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const reader = response.body.getReader();
        await streamResponse(reader);
        
    } catch (error) {
        if (error.message.includes('Failed to fetch')) {
            showError('无法连接到后端服务。请确保 backend.py 正在运行（python backend.py）');
        } else {
            showError(error.message);
        }
    }
}

// 事件监听
if (explainBtn) {
    explainBtn.addEventListener('click', () => {
        console.log('🖱️ Explain button clicked');
        explainText();
    });
    console.log('✅ Button event listener attached');
} else {
    console.error('❌ Explain button not found!');
}

// 支持快捷键（Ctrl/Cmd + Enter）
if (selectedText) {
    selectedText.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            console.log('⌨️ Shortcut triggered');
            explainText();
        }
    });
}