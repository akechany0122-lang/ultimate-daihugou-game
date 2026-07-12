import sys
import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Zoom in background
content = content.replace('background-size: 100% 100%;', 'background-size: 115% 115%;')

# 2. Add top logo CSS
css_marker = "</style>"
top_logo_css = """
    .stage2-top-logo {
      position: absolute;
      top: 5vh;
      left: 50%;
      transform: translateX(-50%);
      z-index: 50;
      width: clamp(150px, 20vw, 250px);
    }
    .stage2-top-logo img {
      width: 100%;
      height: auto;
      filter: drop-shadow(0 5px 15px rgba(0,0,0,0.6));
    }
"""
content = content.replace(css_marker, top_logo_css + "\n" + css_marker)

# 3. Add top logo JSX and shift mode-select-container up
jsx_bg_marker = '<div className="stage2-background animate-fade-in"></div>'
new_jsx = """<div className="stage2-background animate-fade-in"></div>
                  
                  <div className="stage2-top-logo animate-fade-in">
                    <img src="logo.webp" alt="アルティメット大富豪" />
                  </div>
"""
content = content.replace(jsx_bg_marker, new_jsx)

# Find the mode-select-container and shift it up
old_container = """<div className="mode-select-container three-columns animate-fade-in" style={{gap: '40px', alignItems: 'center'}}>"""
new_container = """<div className="mode-select-container three-columns animate-fade-in" style={{gap: '40px', alignItems: 'center', transform: 'translateY(-5vh)'}}>"""
content = content.replace(old_container, new_container)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully zoomed background, moved UI up, and added top logo")
