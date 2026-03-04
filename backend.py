from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from ollama import chat
import json

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
# =================================

class ExplainRequest(BaseModel):
    text: str
    model: str = DEFAULT_MODEL  # 默认模型

@app.post("/api/explain")
async def explain_text(request: ExplainRequest):
    """
    流式解释选中的文本
    """
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="文本不能为空")

    # 验证模型是否在允许的列表中
    if request.model not in AVAILABLE_MODELS:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的模型: {request.model}. 可用模型: {', '.join(AVAILABLE_MODELS)}"
        )

    def generate():
        try:
            # 根据模型大小设置不同的参数
            options = {
                "stream": True,
                "num_predict": 500,  # 限制输出长度，提高速度
            }

            # 对于大模型，进一步限制输出长度
            if "9b" in request.model.lower():
                options["num_predict"] = 300
                options["temperature"] = 0.7  # 降低温度，加快生成
            elif "2b" in request.model.lower():
                options["num_predict"] = 400
                options["temperature"] = 0.8

            stream = chat(
                model=request.model,
                messages=[
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
                options=options
            )
            
            for chunk in stream:
                if "message" in chunk and "content" in chunk["message"]:
                    content = chunk["message"]["content"]
                    # 使用 SSE 格式发送数据
                    yield f"data: {json.dumps({'content': content}, ensure_ascii=False)}\n\n"
            
            # 发送结束信号
            yield f"data: {json.dumps({'done': True}, ensure_ascii=False)}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)}, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )

@app.get("/")
async def root():
    return {"message": "Text Explainer API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)