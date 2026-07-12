import sys
import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix background zoom
bg_target = "background-size: 115% 115%;"
bg_new = "background-size: cover;\n      background-position: center;\n      transform: scale(1.15);"
content = content.replace(bg_target, bg_new)

# 2. Fix mode-select-container centering and position
container_target = """<div className="mode-select-container three-columns animate-fade-in" style={{gap: '40px', alignItems: 'center', transform: 'translateY(-5vh)'}}>"""
container_new = """<div className="mode-select-container three-columns animate-fade-in" style={{gap: '40px', alignItems: 'center', position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', justifyContent: 'center'}}>"""
content = content.replace(container_target, container_new)

# Also fix the other possible old container if it wasn't replaced
container_target_2 = """<div className="mode-select-container three-columns animate-fade-in" style={{gap: '40px', alignItems: 'center'}}>"""
content = content.replace(container_target_2, container_new)

# 3. Fix logo size and position
# First, change the CSS class name and properties
css_target = """    .stage2-top-logo {
      position: absolute;
      top: 5vh;
      left: 50%;
      transform: translateX(-50%);
      z-index: 50;
      width: clamp(150px, 20vw, 250px);
    }
    .stage2-top-logo img {"""

css_new = """    .stage2-bottom-logo {
      position: absolute;
      bottom: 8vh;
      left: 50%;
      transform: translateX(-50%);
      z-index: 50;
      width: clamp(250px, 35vw, 400px);
    }
    .stage2-bottom-logo img {"""
content = content.replace(css_target, css_new)

# Now change the JSX
jsx_target = """<div className="stage2-top-logo animate-fade-in">
                    <img src="logo.webp" alt="アルティメット大富豪" />
                  </div>"""
jsx_new = """<div className="stage2-bottom-logo animate-fade-in">
                    <img src="logo.webp" alt="アルティメット大富豪" />
                  </div>"""
content = content.replace(jsx_target, jsx_new)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully applied centering, zoom, and logo position fixes")
