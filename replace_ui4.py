import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

css_start = content.find('/* 新規UI用スタイル (VIP Casino) */')
css_end = content.find('</style>', css_start)
jsx_start = content.find('{/* Stage共通: 右上のカード説明ボタン */}')
jsx_end = content.find("{multiplayerMode === 'connecting' && (", jsx_start)

if css_start == -1 or css_end == -1 or jsx_start == -1 or jsx_end == -1:
    print("Markers not found!")
    sys.exit(1)

new_css = """    /* 新規UI用スタイル (VIP Casino - Opaque Leather) */
    .btn-card-guide {
      position: absolute;
      top: 50%;
      right: 0;
      transform: translateY(-50%);
      background: linear-gradient(135deg, #3d2116 0%, #1a0b07 100%);
      border: 2px solid #C5A059;
      border-right: none;
      border-radius: 8px 0 0 8px;
      color: #C5A059;
      padding: 15px 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      font-family: var(--font-main);
      font-size: 14px;
      font-weight: bold;
      text-align: center;
      line-height: 1.2;
      cursor: pointer;
      z-index: 50;
      transition: all 0.3s ease;
      box-shadow: -4px 4px 10px rgba(0,0,0,0.5);
    }
    .btn-card-guide:hover {
      background: linear-gradient(135deg, #4d2b1d 0%, #2a110a 100%);
      box-shadow: -4px 4px 15px rgba(212, 175, 55, 0.4);
      padding-right: 15px;
      color: #E6C875;
    }

    .mode-select-container.three-columns {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: stretch;
      gap: 25px;
      width: 90%;
      max-width: 950px;
      margin: 0 auto;
    }

    .mode-card.simple-layout {
      flex: 1;
      aspect-ratio: 1 / 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 20px;
      gap: 10px;
      background: 
        linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.2) 100%),
        radial-gradient(circle at center, #381a10 0%, #1c0b06 100%);
      border: 2px solid #C5A059;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      position: relative;
      overflow: hidden;
      box-shadow: 
        inset 0 0 0 4px #1c0b06, 
        inset 0 0 0 6px #C5A059, 
        0 10px 25px rgba(0,0,0,0.7);
    }

    .mode-card.simple-layout::before {
      content: "";
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background-image: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)" opacity="0.06"/></svg>');
      pointer-events: none;
      z-index: 1;
    }

    .mode-card.simple-layout:hover {
      transform: translateY(-8px);
      box-shadow: 
        inset 0 0 0 4px #1c0b06, 
        inset 0 0 0 6px #E6C875, 
        0 15px 35px rgba(212, 175, 55, 0.4);
      border-color: #E6C875;
    }

    .mode-card-icon.simple-icon {
      width: 55%;
      height: 55%;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2;
    }
    
    .mode-card-icon.simple-icon svg {
      width: 100%;
      height: 100%;
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.8));
    }

    .mode-card.simple-layout .mode-card-title {
      font-size: clamp(16px, 2.2vw, 24px);
      text-align: center;
      color: #E6C875;
      font-family: var(--font-main);
      letter-spacing: 1px;
      margin: 0;
      z-index: 2;
      text-shadow: 0 2px 4px rgba(0,0,0,1);
    }

    .mode-aux-buttons.left-aligned {
      position: absolute;
      bottom: 25px;
      left: 25px;
      display: flex;
      z-index: 40;
    }
    
    .btn-back {
      padding: 8px 16px;
      font-size: 16px;
      background: linear-gradient(135deg, #3d2116 0%, #1a0b07 100%);
      border: 1px solid #C5A059;
      color: #C5A059;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-family: var(--font-main);
      box-shadow: inset 0 0 0 2px #1c0b06, inset 0 0 0 3px #C5A059, 0 4px 10px rgba(0,0,0,0.5);
    }
    .btn-back:hover {
      box-shadow: inset 0 0 0 2px #1c0b06, inset 0 0 0 3px #E6C875, 0 6px 15px rgba(212, 175, 55, 0.4);
      transform: translateY(-2px);
      color: #E6C875;
      border-color: #E6C875;
    }
"""

new_jsx = """              {/* Stage共通: 右側のカード説明ボタン */}
              <button 
                className="btn-card-guide animate-fade-in" 
                onClick={() => setShowExplanation(true)}
              >
                <span>C</span>
                <span>A</span>
                <span>R</span>
                <span>D</span>
                <br/>
                <span>G</span>
                <span>U</span>
                <span>I</span>
                <span>D</span>
                <span>E</span>
              </button>

              {/* ロゴとボタンをグループ化 */}
              <div className={`title-main-group stage-${titleStage}`}>
                <div className="title-logo-container">
                  <img src="logo.webp" alt="アルティメット大富豪" className="title-logo" />
                </div>

                {/* Stage 1: 初期状態 */}
                {titleStage === 1 && (
                  <div className="touch-start-container animate-fade-in" onClick={() => setTitleStage(2)}>
                    <div className="touch-start-text" style={{color: '#E6C875', textShadow: '0 2px 15px rgba(212,175,55,0.6)'}}>START GAME</div>
                  </div>
                )}
              </div>

              {/* Stage 2: モード選択状態 */}
              {titleStage === 2 && (
                <>
                  <div className="mode-select-container three-columns animate-fade-in">
                    {/* Online Play */}
                    <div className="mode-card simple-layout" onClick={() => alert('Online Playは準備中です')}>
                      <div className="mode-card-icon simple-icon">
                        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#5CA9FF"/>
                              <stop offset="100%" stopColor="#195BB5"/>
                            </linearGradient>
                            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#F2D588"/>
                              <stop offset="50%" stopColor="#D4AF37"/>
                              <stop offset="100%" stopColor="#997A15"/>
                            </linearGradient>
                          </defs>
                          {/* Orbit */}
                          <ellipse cx="50" cy="50" rx="45" ry="18" fill="none" stroke="#5CA9FF" strokeWidth="2.5" transform="rotate(-25 50 50)"/>
                          <circle cx="21" cy="27" r="3.5" fill="#5CA9FF" />
                          <circle cx="79" cy="73" r="3.5" fill="#5CA9FF" />
                          {/* Globe background */}
                          <circle cx="50" cy="50" r="32" fill="url(#blueGrad)"/>
                          {/* Continents (abstract gold paths) */}
                          <path d="M 30 35 C 40 25, 50 30, 60 40 C 50 45, 40 50, 30 35 Z" fill="url(#goldGrad)"/>
                          <path d="M 60 60 C 70 50, 75 60, 65 75 Z" fill="url(#goldGrad)"/>
                          <path d="M 35 65 C 45 60, 45 70, 30 80 Z" fill="url(#goldGrad)"/>
                        </svg>
                      </div>
                      <div className="mode-card-title">Online Play</div>
                    </div>

                    {/* Multi Play */}
                    <div className="mode-card simple-layout" onClick={() => setMultiplayerMode('connecting')}>
                      <div className="mode-card-icon simple-icon">
                        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <linearGradient id="goldGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#F2D588"/>
                              <stop offset="50%" stopColor="#D4AF37"/>
                              <stop offset="100%" stopColor="#997A15"/>
                            </linearGradient>
                          </defs>
                          {/* Back row */}
                          <path d="M 20 65 A 10 10 0 0 1 40 65 L 45 85 L 15 85 Z" fill="url(#goldGrad2)" opacity="0.6"/>
                          <circle cx="30" cy="50" r="7" fill="url(#goldGrad2)" opacity="0.6"/>
                          <path d="M 60 65 A 10 10 0 0 1 80 65 L 85 85 L 55 85 Z" fill="url(#goldGrad2)" opacity="0.6"/>
                          <circle cx="70" cy="50" r="7" fill="url(#goldGrad2)" opacity="0.6"/>
                          {/* Mid row */}
                          <path d="M 12 75 A 12 12 0 0 1 32 75 L 38 95 L 6 95 Z" fill="url(#goldGrad2)" opacity="0.8"/>
                          <circle cx="22" cy="58" r="9" fill="url(#goldGrad2)" opacity="0.8"/>
                          <path d="M 68 75 A 12 12 0 0 1 88 75 L 94 95 L 62 95 Z" fill="url(#goldGrad2)" opacity="0.8"/>
                          <circle cx="78" cy="58" r="9" fill="url(#goldGrad2)" opacity="0.8"/>
                          {/* Front person */}
                          <path d="M 35 80 A 15 15 0 0 1 65 80 L 73 100 L 27 100 Z" fill="url(#goldGrad2)"/>
                          <circle cx="50" cy="62" r="11" fill="url(#goldGrad2)"/>
                          {/* Crown */}
                          <path d="M 30 35 L 35 18 L 50 30 L 65 18 L 70 35 L 65 42 L 35 42 Z" fill="url(#goldGrad2)"/>
                          <rect x="35" y="44" width="30" height="4" rx="2" fill="url(#goldGrad2)"/>
                          <circle cx="35" cy="16" r="4" fill="url(#goldGrad2)"/>
                          <circle cx="50" cy="27" r="4" fill="url(#goldGrad2)"/>
                          <circle cx="65" cy="16" r="4" fill="url(#goldGrad2)"/>
                        </svg>
                      </div>
                      <div className="mode-card-title">Multi Play</div>
                    </div>

                    {/* CPU Play */}
                    <div className="mode-card simple-layout" onClick={startDealAnimation}>
                      <div className="mode-card-icon simple-icon">
                        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <linearGradient id="goldGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#F2D588"/>
                              <stop offset="50%" stopColor="#D4AF37"/>
                              <stop offset="100%" stopColor="#997A15"/>
                            </linearGradient>
                          </defs>
                          <path d="M 25 80 C 25 45, 40 45, 50 45 C 60 45, 75 45, 75 80 L 85 100 L 15 100 Z" fill="url(#goldGrad3)"/>
                          <circle cx="50" cy="30" r="15" fill="url(#goldGrad3)"/>
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

content = content[:css_start] + new_css + content[css_end:jsx_start] + new_jsx + "\n" + content[jsx_end:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated index.html for UI polish")
