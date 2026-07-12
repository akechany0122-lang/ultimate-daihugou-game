import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update JSX
start_jsx_marker = "              {/* ロゴとSTARTボタンをグループ化し、Stage遷移に応じてスケール＆位置を変化 */}"
end_jsx_marker = "              {multiplayerMode === 'connecting' && ("

start_jsx_idx = content.find(start_jsx_marker)
end_jsx_idx = content.find(end_jsx_marker, start_jsx_idx)

if start_jsx_idx == -1 or end_jsx_idx == -1:
    print("JSX markers not found!")
    sys.exit(1)

new_jsx = """              {/* Stage共通: 右上のカード説明ボタン */}
              <button 
                className="btn-card-guide animate-fade-in" 
                onClick={() => setShowExplanation(true)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
                </svg>
                <span>カード説明 (CARD GUIDE)</span>
              </button>

              {/* ロゴとボタンをグループ化 */}
              <div className={`title-main-group stage-${titleStage}`}>
                <div className="title-logo-container">
                  <img src="logo.webp" alt="アルティメット大富豪" className="title-logo" />
                </div>

                {/* Stage 1: 初期状態 */}
                {titleStage === 1 && (
                  <div className="touch-start-container animate-fade-in" onClick={() => setTitleStage(2)}>
                    <div className="touch-start-text">ゲームを始める</div>
                  </div>
                )}
              </div>

              {/* Stage 2: モード選択状態 */}
              {titleStage === 2 && (
                <>
                  <div className="mode-select-container three-columns animate-fade-in">
                    {/* 全国でプレイ */}
                    <div className="mode-card simple-layout" onClick={() => alert('全国でプレイは準備中です')}>
                      <div className="mode-card-icon simple-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="2" y1="12" x2="22" y2="12"></line>
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                        </svg>
                      </div>
                      <div className="mode-card-title">全国でプレイ</div>
                    </div>

                    {/* みんなでプレイ */}
                    <div className="mode-card simple-layout" onClick={() => setMultiplayerMode('connecting')}>
                      <div className="mode-card-icon simple-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                          <line x1="10" y1="14" x2="20" y2="24" strokeWidth="1.5"></line>
                          <line x1="20" y1="14" x2="10" y2="24" strokeWidth="1.5"></line>
                        </svg>
                      </div>
                      <div className="mode-card-title">みんなでプレイ</div>
                    </div>

                    {/* CPUとプレイ */}
                    <div className="mode-card simple-layout" onClick={startDealAnimation}>
                      <div className="mode-card-icon simple-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                          <rect x="16" y="8" width="5" height="7" rx="1" transform="rotate(15 16 8)" fill="currentColor"></rect>
                        </svg>
                      </div>
                      <div className="mode-card-title">CPUとプレイ</div>
                    </div>
                  </div>

                  <div className="mode-aux-buttons left-aligned animate-fade-in">
                    <button className="btn-start-game btn-aux mystic-btn btn-back" onClick={() => setTitleStage(1)}>
                      <span className="mystic-btn-text">タイトルへ戻る</span>
                    </button>
                  </div>
                </>
              )}

"""

content = content[:start_jsx_idx] + new_jsx + content[end_jsx_idx:]

# 2. Inject CSS
css_marker = "</style>"
css_idx = content.find(css_marker)

if css_idx == -1:
    print("CSS marker not found!")
    sys.exit(1)

new_css = """
    /* 新規UI用スタイル */
    .btn-card-guide {
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #ccc;
      padding: 10px 15px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-main);
      font-size: 14px;
      cursor: pointer;
      z-index: 50;
      transition: all 0.3s ease;
      backdrop-filter: blur(4px);
    }
    .btn-card-guide:hover {
      background: rgba(255, 215, 0, 0.1);
      border-color: rgba(255, 215, 0, 0.5);
      color: #fff;
    }

    .mode-select-container.three-columns {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      gap: 20px;
      width: 90%;
      max-width: 900px;
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
      gap: 15px;
      background: rgba(10, 10, 15, 0.7);
      border: 1px solid rgba(255, 215, 0, 0.3);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
    }

    .mode-card.simple-layout:hover {
      transform: translateY(-5px);
      border-color: rgba(255, 215, 0, 0.8);
      box-shadow: 0 8px 25px rgba(255, 215, 0, 0.2);
      background: rgba(20, 20, 25, 0.9);
    }

    .mode-card-icon.simple-icon {
      width: 60%;
      height: 60%;
      color: rgba(255, 215, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .mode-card-icon.simple-icon svg {
      width: 100%;
      height: 100%;
      filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.5));
    }

    .mode-card.simple-layout .mode-card-title {
      font-size: clamp(14px, 2vw, 22px);
      text-align: center;
      color: #fff;
      font-family: var(--font-main);
      letter-spacing: 2px;
      margin: 0;
    }

    .mode-aux-buttons.left-aligned {
      position: absolute;
      bottom: 30px;
      left: 30px;
      display: flex;
      z-index: 40;
    }
    
    .btn-back {
      padding: 10px 20px;
      font-size: 14px;
    }
"""

content = content[:css_idx] + new_css + content[css_idx:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated index.html for new UI")
