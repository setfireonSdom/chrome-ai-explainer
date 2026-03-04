#!/bin/bash

# 确保使用虚拟环境中的 Python
if [ -f ".venv/bin/python" ]; then
    PYTHON=".venv/bin/python"
elif [ -f ".venv/Scripts/python.exe" ]; then
    PYTHON=".venv/Scripts/python.exe"
else
    PYTHON="python3"
fi

echo "🚀 启动 AI 文本解释器后端服务..."
echo ""
echo "Python: $PYTHON"
echo "服务地址: http://127.0.0.1:8000"
echo "按 Ctrl+C 停止服务"
echo ""

$PYTHON backend.py