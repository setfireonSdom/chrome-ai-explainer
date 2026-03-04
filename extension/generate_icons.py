#!/usr/bin/env python3
import base64
from pathlib import Path

# 简单的 SVG 图标数据
icon_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="24" fill="url(#grad1)"/>
  <text x="64" y="85" font-family="Arial, sans-serif" font-size="72" font-weight="bold" text-anchor="middle" fill="white">🤖</text>
</svg>"""

# 创建图标目录
icons_dir = Path(__file__).parent / "icons"
icons_dir.mkdir(exist_ok=True)

# 保存 SVG
(icons_dir / "icon.svg").write_text(icon_svg)

# 对于 Chrome 扩展，我们使用 data URI 作为图标
# 创建一个简单的 HTML 文件来生成 PNG
html_template = """<!DOCTYPE html>
<html>
<head>
    <title>Generate Icons</title>
</head>
<body>
    <canvas id="canvas16" width="16" height="16"></canvas>
    <canvas id="canvas48" width="48" height="48"></canvas>
    <canvas id="canvas128" width="128" height="128"></canvas>
    <script>
        const svg = `{svg_data}`;

        function createIcon(canvasId, size) {
            const canvas = document.getElementById(canvasId);
            const ctx = canvas.getContext('2d');
            
            const img = new Image();
            const svgBlob = new Blob([svg], {{type: 'image/svg+xml'}});
            const url = URL.createObjectURL(svgBlob);
            
            img.onload = function() {{
                ctx.drawImage(img, 0, 0, size, size);
                const pngUrl = canvas.toDataURL('image/png');
                downloadFile(pngUrl, `icon${{size}}.png`);
                URL.revokeObjectURL(url);
            }};
            
            img.src = url;
        }}

        function downloadFile(dataUrl, filename) {{
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }}

        // Create all icon sizes
        createIcon('canvas16', 16);
        createIcon('canvas48', 48);
        createIcon('canvas128', 128);
    </script>
</body>
</html>"""

# 转义 SVG 字符串用于 JavaScript
svg_escaped = icon_svg.replace('\n', '\\n').replace('"', '\\"')

html_content = html_template.format(svg_data=svg_escaped)

# 保存 HTML 文件
html_path = Path(__file__).parent / "generate_icons.html"
html_path.write_text(html_content)

print(f"请打开以下文件来生成图标:")
print(f"file://{html_path.absolute()}")
print("\n打开后，浏览器会自动下载 icon16.png, icon48.png, icon128.png")
print("请将这些文件移动到 icons/ 目录中")