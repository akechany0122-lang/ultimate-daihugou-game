import sys
import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add CSS for scattered cards
css_end = "</style>"
scattered_css = """
    .scattered-card {
      position: absolute;
      width: clamp(60px, 10vw, 120px);
      height: auto;
      border-radius: 6px;
      box-shadow: 2px 5px 15px rgba(0,0,0,0.8);
      z-index: 10;
      pointer-events: none;
      filter: brightness(0.75) contrast(1.1); /* 少し暗くして背景に馴染ませる */
    }
"""
if ".scattered-card {" not in content:
    content = content.replace(css_end, scattered_css + "\n" + css_end)

# 2. Update .mode-select-container z-index to ensure it's above cards
content = content.replace("style={{gap: '40px', alignItems: 'flex-start', position: 'absolute', top: '65%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', justifyContent: 'center'}}", "style={{gap: '40px', alignItems: 'flex-start', position: 'absolute', top: '65%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', justifyContent: 'center', zIndex: 50}}")

# 3. Add Scattered Cards JSX right after stage2-background
jsx_bg = '<div className="stage2-background animate-fade-in"></div>'
scattered_jsx = """<div className="stage2-background animate-fade-in"></div>
                  
                  {/* テーブル上の散らばったカード */}
                  <div className="scattered-cards-container animate-fade-in">
                    <img src="3image.webp" className="scattered-card" style={{top: '15%', left: '10%', transform: 'rotate(-20deg)'}} alt="" />
                    <img src="5image.webp" className="scattered-card" style={{top: '5%', left: '30%', transform: 'rotate(15deg)'}} alt="" />
                    <img src="7image.webp" className="scattered-card" style={{bottom: '15%', left: '15%', transform: 'rotate(45deg)'}} alt="" />
                    <img src="9image.webp" className="scattered-card" style={{bottom: '25%', left: '35%', transform: 'rotate(-10deg)'}} alt="" />
                    <img src="Jimage.webp" className="scattered-card" style={{top: '10%', right: '20%', transform: 'rotate(-35deg)'}} alt="" />
                    <img src="Kimage.webp" className="scattered-card" style={{top: '30%', right: '10%', transform: 'rotate(25deg)'}} alt="" />
                    <img src="Aimage.webp" className="scattered-card" style={{bottom: '10%', right: '30%', transform: 'rotate(10deg)'}} alt="" />
                    <img src="2image.webp" className="scattered-card" style={{bottom: '20%', right: '10%', transform: 'rotate(-55deg)'}} alt="" />
                    <img src="joker.webp" className="scattered-card" style={{top: '40%', left: '5%', transform: 'rotate(80deg)'}} alt="" />
                  </div>"""

if "scattered-cards-container" not in content:
    content = content.replace(jsx_bg, scattered_jsx)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully added scattered cards to background")
