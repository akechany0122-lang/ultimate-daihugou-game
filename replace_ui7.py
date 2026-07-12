import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. State updates
state_marker = "const [titleStage, setTitleStage] = useState(1);"
new_state = """const [titleStage, setTitleStage] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const handleStartGameTransition = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setTitleStage(2);
      setTimeout(() => setIsTransitioning(false), 50); // slight delay to allow render before fading back in
    }, 1500);
  };"""
content = content.replace(state_marker, new_state)

# 2. Add CSS
css_marker = "</style>"
new_css = """
    .transition-overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: #000;
      z-index: 9999;
      opacity: 0;
      pointer-events: none;
      transition: opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .transition-overlay.active {
      opacity: 1;
      pointer-events: all;
    }

    .stage2-background {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: url('ruined_casino_bg.jpg') no-repeat center center;
      background-size: cover;
      z-index: -1;
      filter: brightness(0.65) contrast(1.1);
    }

    .top-right-icon-buttons {
      position: absolute;
      top: 25px;
      right: 25px;
      display: flex;
      gap: 15px;
      z-index: 50;
    }
    
    .icon-btn {
      background: rgba(0,0,0,0.6);
      border: 1px solid #C5A059;
      color: #C5A059;
      width: 45px;
      height: 45px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      transition: all 0.3s ease;
      backdrop-filter: blur(4px);
    }
    .icon-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 0 15px rgba(197,160,89,0.5);
      background: rgba(20,10,5,0.8);
      color: #E6C875;
    }
"""
content = content.replace(css_marker, new_css + "\n" + css_marker)

# We also need to change the gap in .three-columns
content = content.replace("gap: 25px;", "gap: 40px;")

# 3. Replace JSX
jsx_start_marker = "{/* Stage共通: 右側のカード説明ボタン */}"
jsx_end_marker = "{multiplayerMode === 'connecting' && ("

jsx_start = content.find(jsx_start_marker)
jsx_end = content.find(jsx_end_marker, jsx_start)

if jsx_start == -1 or jsx_end == -1:
    print("JSX markers not found")
    sys.exit(1)

new_jsx = """              {/* 暗転トランジション用オーバーレイ */}
              <div className={`transition-overlay ${isTransitioning ? 'active' : ''}`}></div>

              {/* Stage共通: 右側のカード説明ボタン (Stage 1のみ表示) */}
              {titleStage === 1 && (
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
              )}

              {/* ロゴとボタンをグループ化 */}
              <div className={`title-main-group stage-${titleStage}`}>
                {titleStage === 1 && (
                  <div className="title-logo-container">
                    <img src="logo.webp" alt="アルティメット大富豪" className="title-logo" />
                  </div>
                )}

                {/* Stage 1: 初期状態 */}
                {titleStage === 1 && (
                  <div className="touch-start-container animate-fade-in" onClick={handleStartGameTransition}>
                    <div className="touch-start-text" style={{color: '#E6C875', textShadow: '0 2px 15px rgba(212,175,55,0.6)'}}>START GAME</div>
                  </div>
                )}
              </div>

              {/* Stage 2: モード選択状態 */}
              {titleStage === 2 && (
                <>
                  <div className="stage2-background animate-fade-in"></div>
                  
                  <div className="top-right-icon-buttons animate-fade-in">
                    <button className="icon-btn" onClick={() => alert('設定は準備中です')} title="設定">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                      </svg>
                    </button>
                    <button className="icon-btn" onClick={() => setShowExplanation(true)} title="ルール説明">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
                      </svg>
                    </button>
                  </div>

                  <div className="mode-select-container three-columns animate-fade-in" style={{gap: '40px', alignItems: 'center'}}>
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

print("Successfully applied transition, custom bg, and layout changes")
