import sys
import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update CSS
css_target = """    .mode-description-area {
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
    }"""
css_new = """    .mode-btn-wrapper {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .mode-description-inline {
      position: absolute;
      top: 105%;
      color: #E6C875;
      font-size: clamp(12px, 1.1vw, 15px);
      text-align: center;
      background: rgba(20, 5, 5, 0.9);
      padding: 8px 16px;
      border-radius: 6px;
      border: 1px solid rgba(212, 175, 55, 0.6);
      box-shadow: 0 4px 12px rgba(0,0,0,0.9);
      pointer-events: none;
      transition: opacity 0.3s ease, transform 0.3s ease;
      white-space: nowrap;
      z-index: 100;
      letter-spacing: 1px;
      transform: translateY(10px);
    }
    .mode-description-inline.visible {
      opacity: 1;
      transform: translateY(0);
    }"""
content = content.replace(css_target, css_new)

# 2. Update JSX
jsx_target = """<div className="mode-select-container three-columns animate-fade-in" style={{gap: '40px', alignItems: 'center', position: 'absolute', top: '65%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', justifyContent: 'center'}}>
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

jsx_new = """<div className="mode-select-container three-columns animate-fade-in" style={{gap: '40px', alignItems: 'flex-start', position: 'absolute', top: '65%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', justifyContent: 'center'}}>
                    {/* Online Play */}
                    <div className="mode-btn-wrapper" 
                         onMouseEnter={() => setHoveredMode('online')} onMouseLeave={() => setHoveredMode(null)}
                         onTouchStart={() => setHoveredMode('online')} onTouchEnd={() => setHoveredMode(null)}>
                      <img src="online.png" alt="Online Play" className="mode-image-button" onClick={() => alert('Online Playは準備中です')} />
                      <div className={`mode-description-inline ${hoveredMode === 'online' ? 'visible' : ''}`} style={{opacity: hoveredMode === 'online' ? 1 : 0}}>
                        全国のプレイヤーとレートを競うオンライン対戦
                      </div>
                    </div>

                    {/* Multi Play */}
                    <div className="mode-btn-wrapper" 
                         onMouseEnter={() => setHoveredMode('multi')} onMouseLeave={() => setHoveredMode(null)}
                         onTouchStart={() => setHoveredMode('multi')} onTouchEnd={() => setHoveredMode(null)}>
                      <img src="mulch.png" alt="Multi Play" className="mode-image-button" onClick={() => setMultiplayerMode('connecting')} />
                      <div className={`mode-description-inline ${hoveredMode === 'multi' ? 'visible' : ''}`} style={{opacity: hoveredMode === 'multi' ? 1 : 0}}>
                        合言葉を使って友達と一緒にプレイ
                      </div>
                    </div>

                    {/* CPU Play */}
                    <div className="mode-btn-wrapper" 
                         onMouseEnter={() => setHoveredMode('cpu')} onMouseLeave={() => setHoveredMode(null)}
                         onTouchStart={() => setHoveredMode('cpu')} onTouchEnd={() => setHoveredMode(null)}>
                      <img src="CPU.png" alt="CPU Play" className="mode-image-button" onClick={startDealAnimation} />
                      <div className={`mode-description-inline ${hoveredMode === 'cpu' ? 'visible' : ''}`} style={{opacity: hoveredMode === 'cpu' ? 1 : 0}}>
                        強力なCPUと対戦して腕を磨く一人用モード
                      </div>
                    </div>
                  </div>"""
content = content.replace(jsx_target, jsx_new)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully moved hover descriptions to directly below each icon")
