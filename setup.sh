#!/bin/bash

set -e  # 遇到错误立即退出

echo "🚀 开始安装 AI 文本解释器的环境..."
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 uv 是否安装
echo ""
echo "📋 检查 uv..."
if ! command -v uv &> /dev/null; then
    echo -e "${YELLOW}⚠️  uv 未安装，正在安装...${NC}"
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.cargo/bin:$PATH"
    echo -e "${GREEN}✓${NC} uv 安装完成"
else
    echo -e "${GREEN}✓${NC} uv 已安装"
    UV_VERSION=$(uv --version)
    echo "  版本: $UV_VERSION"
fi

# 创建虚拟环境（如果不存在）
echo ""
echo "📋 检查虚拟环境..."
if [ ! -d ".venv" ]; then
    echo "创建虚拟环境（使用 Python 3.11，uv 会自动下载如果需要）..."
    uv venv --python 3.11
    echo -e "${GREEN}✓${NC} 虚拟环境创建完成"
else
    echo -e "${GREEN}✓${NC} 虚拟环境已存在"
fi



# 安装 Python 依赖
echo ""
echo "📦 安装 Python 依赖..."
if [ -f "requirements.txt" ]; then
    uv pip install -r requirements.txt
    echo -e "${GREEN}✓${NC} Python 依赖安装完成"
else
    echo -e "${RED}❌ requirements.txt 文件不存在${NC}"
    exit 1
fi

# 检查 Ollama
echo ""
echo "🤖 检查 Ollama..."
if command -v ollama &> /dev/null; then
    echo -e "${GREEN}✓${NC} Ollama 已安装"
    OLLAMA_VERSION=$(ollama --version)
    echo "  版本: $OLLAMA_VERSION"

    # 检查 Ollama 服务是否运行
    if ! ollama list &> /dev/null; then
        echo -e "${YELLOW}⚠️  Ollama 服务未运行${NC}"
        echo "请先启动 Ollama 服务："
        echo "  macOS/Linux: ollama serve"
        echo "  Windows: 启动 Ollama 应用程序"
    else
        echo -e "${GREEN}✓${NC} Ollama 服务正在运行"

        # 检查模型是否已安装
        echo ""
        echo "📥 检查 AI 模型..."
        MODELS_INSTALLED=$(ollama list | grep -E "qwen2.5|qwen3.5" || true)
        if [ -z "$MODELS_INSTALLED" ]; then
            echo -e "${YELLOW}⚠️  未找到推荐的 AI 模型${NC}"
            echo "建议安装以下模型："
            echo "  ollama pull qwen2.5:1.5b  # 最快"
            echo "  ollama pull qwen3.5:2b    # 推荐"
            echo "  ollama pull qwen3.5:9b    # 最强"
        else
            echo -e "${GREEN}✓${NC} 已安装的模型："
            echo "$MODELS_INSTALLED"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Ollama 未安装${NC}"
    echo "请访问 https://ollama.ai 下载安装"
    echo "或使用以下命令安装："
    echo "  macOS: brew install ollama"
    echo "  Linux: curl -fsSL https://ollama.ai/install.sh | sh"
fi

# 完成
echo ""
echo -e "${GREEN}🎉 安装完成！${NC}"
echo ""
echo "📝 使用步骤："
echo "1. 激活虚拟环境（可选，start.sh 会自动处理）："
echo "   source .venv/bin/activate  # macOS/Linux"
echo ""
echo "2. 启动后端服务："
echo "   ./start.sh"
echo ""
echo "3. 在 Chrome 中加载扩展："
echo "   - 打开 chrome://extensions/"
echo "   - 开启开发者模式"
echo "   - 点击「加载已解压的扩展程序」"
echo "   - 选择本项目的 extension 文件夹"
echo ""
echo "4. 使用扩展："
echo "   - 在网页上选中文本"
echo "   - 点击「🤖 AI 解释」按钮"
echo ""