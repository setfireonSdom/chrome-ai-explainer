from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, validator
import httpx
import json
import asyncio
from typing import AsyncGenerator

app = FastAPI(title="Text Explainer API")

# 允许跨域请求（Chrome 扩展需要）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["chrome-extension://*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== 全局配置 ==========
# 可用的 AI 模型列表
AVAILABLE_MODELS = [
    "qwen2.5:1.5b",
    "qwen3.5:2b",
    "qwen3.5:9b"
]

# 默认模型
DEFAULT_MODEL = "qwen2.5:1.5b"

# Ollama API 端点（本地，确保安全）
OLLAMA_API_URL = "http://127.0.0.1:11434/api/chat"

# 安全限制
MAX_TEXT_LENGTH = 5000  # 最大文本长度
MAX_RESPONSE_LENGTH = 10000  # 最大响应长度
REQUEST_TIMEOUT = 120.0  # 请求超时时间（秒）
# =================================

class ExplainRequest(BaseModel):
    text: str
    model: str = DEFAULT_MODEL  # 默认模型

    @validator('text')
    def validate_text(cls, v):
        if not v or not v.strip():
            raise ValueError("文本不能为空")
        if len(v) > MAX_TEXT_LENGTH:
            raise ValueError(f"文本长度不能超过 {MAX_TEXT_LENGTH} 个字符")
        return v.strip()

    @validator('model')
    def validate_model(cls, v):
        if v not in AVAILABLE_MODELS:
            raise ValueError(f"不支持的模型: {v}. 可用模型: {', '.join(AVAILABLE_MODELS)}")
        return v

@app.post("/api/explain")
async def explain_text(request: ExplainRequest):
    """
    流式解释选中的文本
    """
    # Pydantic 已经进行了验证，这里不需要再次验证

    async def generate() -> AsyncGenerator[str, None]:
        """
        生成流式响应
        """
        client = None
        try:
            # 准备请求负载
            payload = {
                "model": request.model,
                "messages": [
                    {
                        "role": "system",
                        "content": "你是一个专业的解释助手。请清晰、简洁地解释用户提供的文本。"
                    },
                    {
                        "role": "user",
                        "content": f"""
请解释以下内容：
{request.text}

要求：
1. 提供清晰的解释
2. 如果是英文，给出中文翻译
3. 提供相关的例子或背景
4. 保持简洁，不要过于冗长
"""
                    }
                ],
                "stream": True,
                "options": {
                    "num_predict": 500,
                }
            }

            # 根据模型大小调整参数
            if "9b" in request.model.lower():
                payload["options"]["num_predict"] = 2000
                payload["options"]["temperature"] = 0.7
            elif "2b" in request.model.lower():
                payload["options"]["num_predict"] = 1500
                payload["options"]["temperature"] = 0.8

            # 使用 httpx 发送流式请求到 Ollama
            client = httpx.AsyncClient(
                timeout=REQUEST_TIMEOUT,
                limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
            )
            
            async with client.stream("POST", OLLAMA_API_URL, json=payload) as response:
                if response.status_code != 200:
                    error_msg = await response.aread()
                    yield f"data: {json.dumps({'error': f'Ollama API error: {error_msg.decode()}'}, ensure_ascii=False)}\n\n"
                    return

                # 逐行读取流式响应
                total_length = 0
                async for line in response.aiter_lines():
                    if line.strip():
                        try:
                            # Ollama 返回 JSON 格式的数据
                            data = json.loads(line)

                            # 检查是否有消息内容
                            if "message" in data:
                                message = data["message"]
                                content = message.get("content", "")
                                thinking = message.get("thinking", "")

                                # 对于 qwen3.5 模型，内容可能在 thinking 字段中
                                actual_content = content if content else thinking

                                if actual_content:
                                    # 检查响应长度
                                    if total_length + len(actual_content) > MAX_RESPONSE_LENGTH:
                                        yield f"data: {json.dumps({'error': '响应内容过长，已截断'}, ensure_ascii=False)}\n\n"
                                        return
                                    
                                    total_length += len(actual_content)
                                    # 转发给前端
                                    yield f"data: {json.dumps({'content': actual_content}, ensure_ascii=False)}\n\n"

                            # 检查是否完成
                            if data.get("done", False):
                                yield f"data: {json.dumps({'done': True}, ensure_ascii=False)}\n\n"
                                return

                        except json.JSONDecodeError as e:
                            print(f"JSON 解析错误: {e}, 行内容: {line}")
                            continue

        except httpx.ConnectError:
            yield f"data: {json.dumps({'error': '无法连接到 Ollama 服务。请确保 Ollama 正在运行（ollama serve）'}, ensure_ascii=False)}\n\n"
        except asyncio.TimeoutError:
            yield f"data: {json.dumps({'error': '请求超时'}, ensure_ascii=False)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)}, ensure_ascii=False)}\n\n"
        finally:
            # 确保客户端被关闭
            if client:
                await client.aclose()

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # 禁用 nginx 缓冲
        }
    )

@app.get("/")
async def root():
    return {"message": "Text Explainer API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)