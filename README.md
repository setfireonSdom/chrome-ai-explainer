# 🤖 AI 文本解释器 - Chrome 浏览器扩展

一个强大的 Chrome 浏览器扩展，让你选中网页上的任何文本后，可以用本地 AI 模型（Ollama）进行实时解释。支持流式输出，完全本地运行，保护隐私。

## ✨ 功能特点

- 🎯 **一键解释** - 选中网页文本后自动显示解释按钮，一键获取 AI 解释
- 🤖 **本地 AI** - 使用 Ollama 本地模型，无需联网，保护隐私
- ⚡ **流式输出** - 实时显示 AI 的解释内容，无需等待
- 🎨 **美观界面** - 渐变色彩和现代化设计，优秀的用户体验
- 🔄 **多模型支持** - 支持多种 AI 模型，可根据需求切换
- 🚀 **自动侧边栏** - 点击解释按钮后自动打开侧边栏，显示结果

## 📸 界面预览

- 选中文字后自动出现"🤖 AI 解释"按钮
- 侧边栏实时显示 AI 的流式输出
- 支持切换不同的 AI 模型


## 📋 前提条件

在安装和使用之前，请确保你的系统满足以下要求：

### 必需软件

1. **Python 3.11+**
   ```bash
   python3 --version
   ```

2. **Ollama**
   - 访问 [Ollama 官网](https://ollama.ai) 下载并安装
   - 或使用 Homebrew 安装：
     ```bash
     brew install ollama
     ```
   - 启动 Ollama 服务：
     ```bash
     ollama serve
     ```

3. **Chrome 浏览器**（或其他基于 Chromium 的浏览器）

### AI 模型

需要下载至少一个 AI 模型：

```bash
# 推荐模型（默认，最快）
ollama pull qwen2.5:1.5b

# 可选模型（更准确）
ollama pull qwen3.5:2b

# 可选模型（最强，但较慢）
ollama pull qwen3.5:9b
```

## 📦 快速开始

### 1. 克隆项目

```bash
git clone git@github.com:setfireonSdom/chrome-ai-explainer.git
cd chrome-ai-explainer
```

### 2. 一键安装

运行安装脚本，它会自动：
- 检查 Python 版本（需要 3.11+）
- 安装 uv（如果未安装）
- 创建虚拟环境
- 安装所有 Python 依赖
- 检查 Ollama 和 AI 模型

```bash
chmod +x setup.sh
./setup.sh
```

### 3. 安装 AI 模型（可选但推荐）

如果 setup.sh 提示未安装模型，请安装至少一个：

```bash
# 推荐模型（默认，最快）
ollama pull qwen2.5:1.5b

# 可选模型（更准确）
ollama pull qwen3.5:2b

# 可选模型（最强，但较慢）
ollama pull qwen3.5:9b
```

### 4. 启动后端服务

```bash
./start.sh
```

后端服务将在 `http://127.0.0.1:8000` 运行。

**重要**：保持这个终端窗口打开，不要关闭！

### 5. 安装 Chrome 扩展

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 打开右上角的 **"开发者模式"** 开关
4. 点击左上角的 **"加载已解压的扩展程序"** 按钮
5. 在文件选择器中，选择项目的 `extension` 文件夹
6. 扩展安装完成！

### 6. 使用扩展

1. 在任意网页上选中一段文字（英文或中文都可以）
2. 选中后，文字旁边会自动出现一个 **"🤖 AI 解释"** 按钮
3. 点击按钮
4. 侧边栏会在浏览器右侧自动打开
5. AI 会流式输出解释内容

### 手动使用侧边栏

如果你想手动输入文本：

1. 点击浏览器工具栏上的扩展图标
2. 点击"打开侧边栏"
3. 在输入框中输入或粘贴文本
4. 选择模型
5. 点击"解释"按钮

## ⚙️ 配置

### 更换 AI 模型

在侧边栏的下拉菜单中选择不同的模型：

- **Qwen 2.5 (1.5B)** - 最快，适合日常使用
- **Qwen 3.5 (2B)** - 平衡速度和质量
- **Qwen 3.5 (9B)** - 最强，但需要更多时间

### 修改默认模型

编辑以下文件来修改默认模型：

**前端（extension/sidebar.js）**：
```javascript
const DEFAULT_MODEL = 'qwen2.5:1.5b'; // 修改这里
```

**后端（backend.py）**：
```python
DEFAULT_MODEL = "qwen2.5:1.5b"  # 修改这里
```

### 添加新模型

编辑以下文件来添加新模型：

**前端（extension/sidebar.js）**：
```javascript
const AVAILABLE_MODELS = [
    { value: 'qwen2.5:1.5b', label: 'Qwen 2.5 (1.5B) - 最快' },
    { value: 'qwen3.5:2b', label: 'Qwen 3.5 (2B) - 推荐' },
    { value: 'qwen3.5:9b', label: 'Qwen 3.5 (9B) - 最强' },
    // 添加新模型
    { value: 'your-model-name', label: 'Your Model Display Name' }
];
```

**后端（backend.py）**：
```python
AVAILABLE_MODELS = [
    "qwen2.5:1.5b",
    "qwen3.5:2b",
    "qwen3.5:9b",
    # 添加新模型
    "your-model-name"
]
```

## 📁 项目结构

```
chrome-ai-extension/
├── backend.py              # FastAPI 后端服务
├── requirements.txt        # Python 依赖列表
├── extension/              # Chrome 浏览器扩展
│   ├── manifest.json       # 扩展配置文件
│   ├── content.js          # 内容脚本（检测选中文本）
│   ├── background.js       # 后台脚本
│   ├── sidebar.html        # 侧边栏界面
│   ├── sidebar.css         # 侧边栏样式
│   ├── sidebar.js          # 侧边栏逻辑
│   ├── popup.html          # 弹窗界面
│   └── icons/              # 扩展图标
├── setup.sh                # 一键安装脚本
├── start.sh                # 启动后端脚本
├── test_api.py             # API 测试脚本
└── README.md               # 本文件
```

## 🔧 故障排查

### 问题 1：点击"解释"按钮没有反应

**原因**：后端服务未运行

**解决方法**：
```bash
# 检查后端是否运行
curl http://127.0.0.1:8000

# 如果没有运行，启动它
python3 backend.py
```

### 问题 2：AI 响应很慢

**原因**：使用的模型太大

**解决方法**：
- 切换到更小的模型（如 `qwen2.5:1.5b`）
- 或接受大模型需要更多时间的事实

### 问题 3：侧边栏没有自动打开

**解决方法**：
1. 检查扩展是否正确加载
2. 点击浏览器工具栏的扩展图标
3. 手动打开侧边栏

### 问题 4：出现 "model not found" 错误

**原因**：Ollama 中没有安装该模型

**解决方法**：
```bash
ollama pull qwen2.5:1.5b
```

### 问题 5：选中文字后按钮不出现

**解决方法**：
1. 刷新网页
2. 重新加载扩展（在 `chrome://extensions/` 中）
3. 检查浏览器控制台是否有错误

## 💡 使用技巧

1. **快捷键** - 在侧边栏输入框中，按 `Cmd+Enter`（Mac）或 `Ctrl+Enter`（Windows/Linux）快速解释

2. **连续使用** - 选中并解释多次文本，无需刷新页面

3. **选择模型** - 根据需求选择合适的模型：
   - 日常阅读 → 1.5B 模型
   - 学习研究 → 2B 模型
   - 精确分析 → 9B 模型

4. **保护隐私** - 所有处理都在本地完成，不会上传任何数据

## 🛠️ 技术栈

- **后端**：Python + FastAPI + Ollama
- **前端**：HTML + CSS + JavaScript
- **浏览器扩展**：Chrome Extension Manifest V3
- **流式传输**：Server-Sent Events (SSE)

## 📄 许可证

本项目仅供学习和个人使用。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📮 联系方式

如有问题或建议，欢迎通过 GitHub Issues 联系。

---

**享受使用 AI 文本解释器！** 🎉