#!/usr/bin/env python3
"""测试后端 API 的流式输出"""
import requests
import json

def test_stream():
    url = "http://127.0.0.1:8000/api/explain"
    # 全局配置
AVAILABLE_MODELS = ["qwen2.5:1.5b", "qwen3.5:2b", "qwen3.5:9b"]
DEFAULT_MODEL = "qwen2.5:1.5b"

data = {
        "text": "What is artificial intelligence?",
        "model": DEFAULT_MODEL
    }
    
    print("🚀 开始测试流式输出...")
    print(f"📝 测试文本: {data['text']}")
    print(f"🤖 使用模型: {data['model']}")
    print("-" * 50)
    
    try:
        response = requests.post(url, json=data, stream=True)
        
        if response.status_code == 200:
            print("✅ 连接成功！\n")
            print("📡 接收流式响应：\n")
            
            for line in response.iter_lines(decode_unicode=True):
                if line.startswith('data: '):
                    try:
                        data_json = json.loads(line[6:])
                        if 'content' in data_json:
                            print(data_json['content'], end='', flush=True)
                        elif 'done' in data_json:
                            print("\n\n✅ 完成！")
                            break
                        elif 'error' in data_json:
                            print(f"\n❌ 错误: {data_json['error']}")
                            break
                    except json.JSONDecodeError as e:
                        print(f"解析错误: {e}")
        else:
            print(f"❌ HTTP 错误: {response.status_code}")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到后端服务")
        print("请确保 backend.py 正在运行")
    except Exception as e:
        print(f"❌ 发生错误: {e}")

if __name__ == "__main__":
    test_stream()