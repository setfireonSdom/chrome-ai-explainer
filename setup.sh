#!/bin/bash

echo "🚀 开始安装 AI 文本解释器的依赖..."

# 检查 Python 版本
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo "✓ Python 版本: $PYTHON_VERSION"

# 安装依赖
echo "📦 安装 Python 依赖..."
uv pip install fastapi uvicorn pydantic ollama

echo "✓ 依赖安装完成！"

# 检查 Ollama
echo "🤖 检查 Ollama..."
if command -v ollama &> /dev/null; then
    echo "✓ Ollama 已安装"
    OLLAMA_VERSION=$(ollama --version)
    echo "  版本: $OLLAMA_VERSION"
else
    echo "⚠️  Ollama 未安装"
    echo "  请访问 https://ollama.ai 下载安装"
fi

# 拉取模型
echo "📥 拉荐拉取 AI 模型（可选）..."
echo "  你可以运行以下命令来下载模型："
echo "  ollama pull qwen3.5:2b"

echo ""
echo "🎉 安装完成！"
echo ""
echo "📝 使用步骤："
echo "1. 启动后端服务: python3 backend.py"
echo "2. 在 Chrome 中加载扩展（extension 文件夹）"
echo "3. 选中网页上的文本并点击解释按钮"
echo ""