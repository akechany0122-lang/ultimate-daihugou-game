import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Enlarge central UI
content = content.replace('max-width: 210px;', 'max-width: 260px;')

# 2. Move logo slightly down
css_target = """    .stage2-top-logo {
      position: absolute;
      top: 8vh;
      left: 50%;
      transform: translateX(-50%);
      z-index: 50;
      width: clamp(250px, 35vw, 400px);
    }"""
css_new = """    .stage2-top-logo {
      position: absolute;
      top: 12vh;
      left: 50%;
      transform: translateX(-50%);
      z-index: 50;
      width: clamp(250px, 35vw, 400px);
    }"""
content = content.replace(css_target, css_new)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully enlarged UI and moved logo down slightly")
