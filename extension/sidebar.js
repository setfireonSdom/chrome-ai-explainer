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

// 监听存储变化（合并了两个监听器，避免重复注册）
let storageChangeListener = null;
function setupStorageListener() {
    if (storageChangeListener) return; // 避免重复注册
    
    storageChangeListener = chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.textToExplain) {
            const newText = changes.textToExplain.newValue;
            console.log('📝 Text changed:', newText);
            if (newText) {
                // 新文本被选中时，立即清除旧内容
                output.innerHTML = '';
                console.log('🧹 Cleared previous content for new text');
                
                selectedText.value = newText;
                chrome.storage.local.remove(['textToExplain']);
                setTimeout(() => {
                    explainText();
                }, 300);
            }
        }
    });
}

// 设置存储监听器
setupStorageListener();

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

// 全局变量用于控制流式响应
let currentAbortController = null;
let currentStreamTimeout = null;
const MAX_CONTENT_LENGTH = 10000; // 最大内容长度限制
const STREAM_TIMEOUT = 120000; // 流式响应超时时间（2分钟）

// 流式接收并显示响应（优化版）
async function streamResponse(reader) {
    const decoder = new TextDecoder();
    let buffer = '';
    let currentContent = '';
    let lastUpdateTime = Date.now();
    let isAborted = false;
    
    // 保存当前 AbortController 的引用，用于检查是否被中断
    const thisAbortController = new AbortController();
    currentAbortController = thisAbortController;
    
    // 设置超时
    currentStreamTimeout = setTimeout(() => {
        if (currentAbortController === thisAbortController) {
            thisAbortController.abort();
            showError('请求超时，请重试');
        }
    }, STREAM_TIMEOUT);
    
    try {
        while (!thisAbortController.signal.aborted) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            // 检查是否被中断（如果 currentAbortController 已经指向新的控制器）
            if (currentAbortController !== thisAbortController) {
                console.log('检测到新请求，停止处理旧响应');
                isAborted = true;
                break;
            }
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // 保留最后一个不完整的行
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        
                        if (data.content) {
                            // 检查是否被中断
                            if (currentAbortController !== thisAbortController) {
                                console.log('检测到新请求，停止处理旧响应');
                                isAborted = true;
                                break;
                            }
                            
                            // 检查内容长度
                            if (currentContent.length >= MAX_CONTENT_LENGTH) {
                                showError('响应内容过长，已截断');
                                return;
                            }
                            
                            const newContent = data.content;
                            currentContent += newContent;
                            
                            // 使用增量更新 DOM
                            appendContent(newContent);
                        }
                        
                        if (data.error) {
                            showError(data.error);
                            return;
                        }
                        
                        if (data.done) {
                            // 完成后，统一处理换行符
                            postProcessContent();
                            updateStatus('ready');
                            explainBtn.disabled = false;
                            explainBtn.classList.remove('loading');
                            return;
                        }
                    } catch (e) {
                        console.error('解析响应失败:', e);
                    }
                }
                
                // 检查是否被中断
                if (isAborted || currentAbortController !== thisAbortController) {
                    break;
                }
            }
            
            // 检查是否被中断
            if (isAborted || currentAbortController !== thisAbortController) {
                break;
            }
            
            // 更新时间戳
            lastUpdateTime = Date.now();
        }
    } catch (error) {
        if (error.name === 'AbortError' || isAborted) {
            console.log('流式响应被中断');
        } else {
            showError('接收响应时出错: ' + error.message);
        }
    } finally {
        // 只清理当前请求的资源
        if (currentStreamTimeout && currentAbortController === thisAbortController) {
            clearTimeout(currentStreamTimeout);
            currentStreamTimeout = null;
        }
        if (currentAbortController === thisAbortController) {
            currentAbortController = null;
        }
        explainBtn.disabled = false;
        explainBtn.classList.remove('loading');
        updateStatus('ready');
    }
}

// 后处理：统一处理换行符
function postProcessContent() {
    // 将多个连续换行符替换为单个换行符
    let formatted = output.innerHTML.replace(/\n{3,}/g, '\n\n');
    
    // 将换行符转换为 <br> 标签
    formatted = formatted.replace(/\n/g, '<br>');
    
    output.innerHTML = formatted;
}

// 增量更新 DOM 内容
function appendContent(newContent) {
    // 直接追加格式化的内容到 output
    output.innerHTML += formatContent(newContent);
}

// 格式化内容，只处理基本的 HTML 转义
function formatContent(content) {
    // 转义 HTML 特殊字符，防止 XSS
    return content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// 解释文本
async function explainText() {
    const text = selectedText.value.trim();
    const model = modelSelect.value;

    if (!text) {
        showError('请输入要解释的文本');
        return;
    }

    // 如果有正在进行的请求，先取消它
    if (currentAbortController) {
        console.log('取消之前的请求');
        currentAbortController.abort();
        if (currentStreamTimeout) {
            clearTimeout(currentStreamTimeout);
            currentStreamTimeout = null;
        }
    }

    // 清空输出内容，确保新请求完全覆盖
    output.innerHTML = '';

    // 清空输出内容，等待token输出
    output.innerHTML = '';
    
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
        if (error.name === 'AbortError') {
            console.log('请求被取消');
        } else if (error.message.includes('Failed to fetch')) {
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