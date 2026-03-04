#!/usr/bin/env python3
"""创建简单的 PNG 图标"""
import os

# 简单的 PNG 文件头（1x1 像素的透明 PNG）
minimal_png = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\xf8\xcf\xc0\x00\x00\x00\x03\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'

icons_dir = os.path.join(os.path.dirname(__file__), 'icons')

# 创建图标文件
for size in [16, 48, 128]:
    icon_path = os.path.join(icons_dir, f'icon{size}.png')
    with open(icon_path, 'wb') as f:
        f.write(minimal_png)
    print(f'Created: {icon_path}')

print('\n图标已创建！注意：这些是最小化的占位图标。')
print('你可以用更好的图标替换它们。')