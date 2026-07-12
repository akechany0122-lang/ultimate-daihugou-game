import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update background image in CSS
css_target = "background: url('ruined_casino_bg.jpg') no-repeat center center;"
css_new = "background: url('casino_table.jpg') no-repeat center center;"
content = content.replace(css_target, css_new)

# 2. Add CSS for scattered cards
css_end_marker = "</style>"
scattered_css = """
    .scattered-card {
      position: absolute;
      width: clamp(80px, 12vw, 150px);
      height: auto;
      border-radius: 8px;
      box-shadow: 5px 10px 25px rgba(0,0,0,0.8);
      z-index: 5;
      pointer-events: none;
      filter: brightness(0.85);
    }
"""
content = content.replace(css_end_marker, scattered_css + "\n" + css_end_marker)

# 3. Add scattered cards JSX
jsx_bg_marker = '<div className="stage2-background animate-fade-in"></div>'
scattered_jsx = """<div className="stage2-background animate-fade-in"></div>
                  
                  {/* Scattered Cards on Table */}
                  <div className="scattered-cards-container animate-fade-in">
                    <img src="Aimage.webp" className="scattered-card" style={{top: '8%', left: '15%', transform: 'rotate(-15deg)'}} alt="" />
                    <img src="Kimage.webp" className="scattered-card" style={{top: '12%', right: '18%', transform: 'rotate(22deg)'}} alt="" />
                    <img src="Qimage.webp" className="scattered-card" style={{bottom: '10%', right: '12%', transform: 'rotate(-8deg)'}} alt="" />
                    <img src="Jimage.webp" className="scattered-card" style={{bottom: '15%', left: '10%', transform: 'rotate(30deg)'}} alt="" />
                    <img src="10image.webp" className="scattered-card" style={{top: '5%', left: '48%', transform: 'rotate(5deg)'}} alt="" />
                    <img src="joker.webp" className="scattered-card" style={{bottom: '5%', left: '40%', transform: 'rotate(-25deg)'}} alt="" />
                  </div>
"""
content = content.replace(jsx_bg_marker, scattered_jsx)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully added scattered cards and updated table background")
