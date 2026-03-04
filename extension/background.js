// 后台脚本：处理消息并打开侧边栏

console.log('🚀 Background script loaded');

let pendingText = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Message received:', request);

    if (request.action === 'explain') {
        console.log('📝 Text received from content script:', request.text);
        pendingText = request.text;

        // 打开侧边栏
        if (sender.tab && sender.tab.windowId) {
            console.log('📂 Opening side panel for window:', sender.tab.windowId);

            chrome.sidePanel.open({ windowId: sender.tab.windowId }, () => {
                if (chrome.runtime.lastError) {
                    console.error('❌ Error opening side panel:', chrome.runtime.lastError);
                    sendResponse({ success: false, error: chrome.runtime.lastError.message });
                } else {
                    console.log('✅ Side panel opened');

                    // 保存文本到 storage，侧边栏会读取
                    console.log('💾 Saving text to storage:', pendingText);
                    chrome.storage.local.set({ textToExplain: pendingText }, () => {
                        if (chrome.runtime.lastError) {
                            console.error('❌ Error saving to storage:', chrome.runtime.lastError);
                        } else {
                            console.log('✅ Text saved to storage successfully');
                            // 验证存储
                            chrome.storage.local.get(['textToExplain'], (result) => {
                                console.log('🔍 Verification - Storage contains:', result);
                            });
                        }
                        pendingText = null;
                        sendResponse({ success: true });
                    });
                }
            });
        } else {
            console.error('❌ No tab info available');
            console.log('Sender info:', sender);
            sendResponse({ success: false, error: 'No tab info' });
        }
        return true;
    }
});

// 创建侧边栏
chrome.runtime.onInstalled.addListener(() => {
    console.log('📦 Extension installed');
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});