import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. State addition
state_target = "const [isTransitioning, setIsTransitioning] = useState(false);"
state_new = "const [isTransitioning, setIsTransitioning] = useState(false);\n  const [hoveredMode, setHoveredMode] = useState(null);"
content = content.replace(state_target, state_new)

# 2. CSS addition
css_end = "</style>"
desc_css = """
    .mode-description-area {
      position: absolute;
      top: 80%;
      left: 50%;
      transform: translateX(-50%);
      color: #E6C875;
      font-size: clamp(12px, 1.5vw, 16px);
      text-align: center;
      background: rgba(10, 5, 5, 0.85);
      padding: 10px 25px;
      border-radius: 8px;
      border: 1px solid rgba(212, 175, 55, 0.5);
      box-shadow: 0 4px 15px rgba(0,0,0,0.8);
      pointer-events: none;
      transition: opacity 0.3s ease;
      white-space: nowrap;
      z-index: 100;
      letter-spacing: 1px;
    }
"""
content = content.replace(css_end, desc_css + "\n" + css_end)

# 3. JSX replacement
jsx_target = """<div className="mode-select-container three-columns animate-fade-in" style={{gap: '40px', alignItems: 'center', position: 'absolute', top: '65%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', justifyContent: 'center'}}>
                    {/* Online Play Image Button */}
                    <img 
                      src="online.png" 
                      alt="Online Play"
                      className="mode-image-button"
                      onClick={() => alert('Online Playは準備中です')}
                    />

                    {/* Multi Play Image Button */}
                    <img 
                      src="mulch.png" 
                      alt="Multi Play"
                      className="mode-image-button"
                      onClick={() => setMultiplayerMode('connecting')}
                    />

                    {/* CPU Play Image Button */}
                    <img 
                      src="CPU.png" 
                      alt="CPU Play"
                      className="mode-image-button"
                      onClick={startDealAnimation}
                    />
                  </div>"""

jsx_new = """<div className="mode-select-container three-columns animate-fade-in" style={{gap: '40px', alignItems: 'center', position: 'absolute', top: '65%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', justifyContent: 'center'}}>
                    {/* Online Play Image Button */}
                    <img 
                      src="online.png" 
                      alt="Online Play"
                      className="mode-image-button"
                      onClick={() => alert('Online Playは準備中です')}
                      onMouseEnter={() => setHoveredMode('online')}
                      onMouseLeave={() => setHoveredMode(null)}
                      onTouchStart={() => setHoveredMode('online')}
                      onTouchEnd={() => setHoveredMode(null)}
                    />

                    {/* Multi Play Image Button */}
                    <img 
                      src="mulch.png" 
                      alt="Multi Play"
                      className="mode-image-button"
                      onClick={() => setMultiplayerMode('connecting')}
                      onMouseEnter={() => setHoveredMode('multi')}
                      onMouseLeave={() => setHoveredMode(null)}
                      onTouchStart={() => setHoveredMode('multi')}
                      onTouchEnd={() => setHoveredMode(null)}
                    />

                    {/* CPU Play Image Button */}
                    <img 
                      src="CPU.png" 
                      alt="CPU Play"
                      className="mode-image-button"
                      onClick={startDealAnimation}
                      onMouseEnter={() => setHoveredMode('cpu')}
                      onMouseLeave={() => setHoveredMode(null)}
                      onTouchStart={() => setHoveredMode('cpu')}
                      onTouchEnd={() => setHoveredMode(null)}
                    />
                  </div>
                  
                  {/* 説明文表示エリア */}
                  <div className="mode-description-area" style={{opacity: hoveredMode ? 1 : 0}}>
                    {hoveredMode === 'online' && '全国のプレイヤーとレートを競うオンライン対戦'}
                    {hoveredMode === 'multi' && '合言葉を使って友達と一緒にプレイ'}
                    {hoveredMode === 'cpu' && '強力なCPUと対戦して腕を磨く一人用モード'}
                  </div>"""

content = content.replace(jsx_target, jsx_new)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully added hover descriptions to mode buttons")
