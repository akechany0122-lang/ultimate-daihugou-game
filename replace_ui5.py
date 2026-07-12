import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

jsx_start = content.find('{/* Stage 2: モード選択状態 */}')
jsx_end = content.find("{multiplayerMode === 'connecting' && (", jsx_start)

if jsx_start == -1 or jsx_end == -1:
    print("Markers not found!")
    sys.exit(1)

new_jsx = """              {/* Stage 2: モード選択状態 */}
              {titleStage === 2 && (
                <>
                  <div className="mode-select-container three-columns animate-fade-in">
                    {/* Common SVG Filters for Luxurious Metallic Textures */}
                    <svg width="0" height="0" style={{position: 'absolute'}}>
                      <defs>
                        <!-- Rich Gold Gradient -->
                        <linearGradient id="luxGold" x1="0%" y1="100%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#8A5A19" />
                          <stop offset="30%" stopColor="#D4AF37" />
                          <stop offset="50%" stopColor="#FFF1B9" />
                          <stop offset="70%" stopColor="#D4AF37" />
                          <stop offset="100%" stopColor="#8A5A19" />
                        </linearGradient>
                        
                        <!-- Rich Blue Gradient -->
                        <linearGradient id="luxBlue" x1="0%" y1="100%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#0B3E7A" />
                          <stop offset="40%" stopColor="#1E73BE" />
                          <stop offset="60%" stopColor="#5CA9FF" />
                          <stop offset="100%" stopColor="#0B3E7A" />
                        </linearGradient>

                        <!-- Metallic 3D Emboss Filter -->
                        <filter id="goldMetal" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
                          <feSpecularLighting in="blur" surfaceScale="4" specularConstant="1" specularExponent="30" lightingColor="#FFF" result="spec">
                            <fePointLight x="-100" y="-100" z="200" />
                          </feSpecularLighting>
                          <feComposite in="spec" in2="SourceAlpha" operator="in" result="specOut" />
                          <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="lit" />
                          <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#000" floodOpacity="0.8" />
                        </filter>
                      </defs>
                    </svg>

                    {/* Online Play */}
                    <div className="mode-card simple-layout" onClick={() => alert('Online Playは準備中です')}>
                      <div className="mode-card-icon simple-icon">
                        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                          {/* Orbit */}
                          <ellipse cx="50" cy="50" rx="42" ry="16" fill="none" stroke="url(#luxBlue)" strokeWidth="3" transform="rotate(-25 50 50)" filter="url(#goldMetal)"/>
                          <circle cx="21" cy="27" r="4.5" fill="url(#luxBlue)" filter="url(#goldMetal)" />
                          <circle cx="79" cy="73" r="4.5" fill="url(#luxBlue)" filter="url(#goldMetal)" />
                          {/* Globe background (Blue Ocean) */}
                          <circle cx="50" cy="50" r="30" fill="url(#luxBlue)" filter="url(#goldMetal)"/>
                          {/* Continents (Gold) */}
                          <path d="M 32 35 C 40 25, 48 30, 58 40 C 48 45, 40 50, 32 35 Z" fill="url(#luxGold)" filter="url(#goldMetal)"/>
                          <path d="M 58 60 C 68 50, 72 60, 62 75 Z" fill="url(#luxGold)" filter="url(#goldMetal)"/>
                          <path d="M 35 65 C 45 60, 45 70, 32 78 Z" fill="url(#luxGold)" filter="url(#goldMetal)"/>
                        </svg>
                      </div>
                      <div className="mode-card-title">Online Play</div>
                    </div>

                    {/* Multi Play */}
                    <div className="mode-card simple-layout" onClick={() => setMultiplayerMode('connecting')}>
                      <div className="mode-card-icon simple-icon">
                        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                          <g filter="url(#goldMetal)">
                            {/* Back row */}
                            <path d="M 22 65 A 10 10 0 0 1 42 65 L 47 85 L 17 85 Z" fill="url(#luxGold)"/>
                            <circle cx="32" cy="50" r="7" fill="url(#luxGold)"/>
                            <path d="M 58 65 A 10 10 0 0 1 78 65 L 83 85 L 53 85 Z" fill="url(#luxGold)"/>
                            <circle cx="68" cy="50" r="7" fill="url(#luxGold)"/>
                            {/* Mid row */}
                            <path d="M 12 75 A 12 12 0 0 1 32 75 L 38 95 L 6 95 Z" fill="url(#luxGold)"/>
                            <circle cx="22" cy="58" r="9" fill="url(#luxGold)"/>
                            <path d="M 68 75 A 12 12 0 0 1 88 75 L 94 95 L 62 95 Z" fill="url(#luxGold)"/>
                            <circle cx="78" cy="58" r="9" fill="url(#luxGold)"/>
                            {/* Front person */}
                            <path d="M 35 80 A 15 15 0 0 1 65 80 L 73 100 L 27 100 Z" fill="url(#luxGold)"/>
                            <circle cx="50" cy="62" r="11" fill="url(#luxGold)"/>
                            {/* Crown */}
                            <path d="M 30 35 L 35 18 L 50 30 L 65 18 L 70 35 L 65 42 L 35 42 Z" fill="url(#luxGold)"/>
                            <rect x="35" y="44" width="30" height="4" rx="2" fill="url(#luxGold)"/>
                            <circle cx="35" cy="16" r="4" fill="url(#luxGold)"/>
                            <circle cx="50" cy="27" r="4" fill="url(#luxGold)"/>
                            <circle cx="65" cy="16" r="4" fill="url(#luxGold)"/>
                          </g>
                        </svg>
                      </div>
                      <div className="mode-card-title">Multi Play</div>
                    </div>

                    {/* CPU Play */}
                    <div className="mode-card simple-layout" onClick={startDealAnimation}>
                      <div className="mode-card-icon simple-icon">
                        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                          <g filter="url(#goldMetal)">
                            <path d="M 25 80 C 25 45, 40 45, 50 45 C 60 45, 75 45, 75 80 L 85 100 L 15 100 Z" fill="url(#luxGold)"/>
                            <circle cx="50" cy="30" r="15" fill="url(#luxGold)"/>
                          </g>
                        </svg>
                      </div>
                      <div className="mode-card-title">CPU Play</div>
                    </div>
                  </div>

                  <div className="mode-aux-buttons left-aligned animate-fade-in">
                    <button className="btn-back" onClick={() => setTitleStage(1)}>
                      <span>◀ 戻る</span>
                    </button>
                  </div>
                </>
              )}
"""

content = content[:jsx_start] + new_jsx + "\n" + content[jsx_end:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated index.html for luxurious metallic icons")
