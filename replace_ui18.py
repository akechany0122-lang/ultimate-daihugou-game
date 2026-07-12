import sys
import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Zoom background more
content = content.replace('transform: scale(1.15);', 'transform: scale(1.3);')

# 2. Move mode buttons down
container_target = """<div className="mode-select-container three-columns animate-fade-in" style={{gap: '40px', alignItems: 'center', position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', justifyContent: 'center'}}>"""
container_new = """<div className="mode-select-container three-columns animate-fade-in" style={{gap: '40px', alignItems: 'center', position: 'absolute', top: '65%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', justifyContent: 'center'}}>"""
content = content.replace(container_target, container_new)

# 3. Move logo back to top
# Change CSS
css_target = """    .stage2-bottom-logo {
      position: absolute;
      bottom: 8vh;
      left: 50%;
      transform: translateX(-50%);
      z-index: 50;
      width: clamp(250px, 35vw, 400px);
    }
    .stage2-bottom-logo img {"""
css_new = """    .stage2-top-logo {
      position: absolute;
      top: 8vh;
      left: 50%;
      transform: translateX(-50%);
      z-index: 50;
      width: clamp(250px, 35vw, 400px);
    }
    .stage2-top-logo img {"""
content = content.replace(css_target, css_new)

# Change JSX
jsx_target = """<div className="stage2-bottom-logo animate-fade-in">
                    <img src="logo.webp" alt="アルティメット大富豪" />
                  </div>"""
jsx_new = """<div className="stage2-top-logo animate-fade-in">
                    <img src="logo.webp" alt="アルティメット大富豪" />
                  </div>"""
content = content.replace(jsx_target, jsx_new)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully zoomed background, moved buttons down, and moved logo to top")
