import sys
import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Noto Serif JP to fonts
font_link = '<link\n    href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=Cinzel:wght@700&display=swap"\n    rel="stylesheet">'
new_font_link = '<link\n    href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=Cinzel:wght@700&family=Noto+Serif+JP:wght@400;700&display=swap"\n    rel="stylesheet">'
content = content.replace(font_link, new_font_link)

# 2. Update :root font-main and colors
root_str = """    :root {
      --bg-iron: #111;
      --bg-rust: #2a0800;
      --color-blood: #8a0303;
      --color-gold: #b8860b;
      --card-width: 90px;
      --card-height: 130px;
      --card-shadow: 0 10px 20px rgba(0, 0, 0, 0.8);
      --font-main: 'Cormorant Garamond', serif;
    }"""
new_root_str = """    :root {
      --bg-iron: #111;
      --bg-rust: #2a0800;
      --color-blood: #8a0303;
      --color-gold: #D4AF37; /* VIP Casino Gold */
      --card-width: 90px;
      --card-height: 130px;
      --card-shadow: 0 10px 20px rgba(0, 0, 0, 0.8);
      --font-main: 'Cormorant Garamond', 'Noto Serif JP', serif;
    }"""
content = content.replace(root_str, new_root_str)

# 3. Update body background
body_str = """    body {
      font-family: var(--font-main);
      margin: 0;
      padding: 0;
      background-color: var(--bg-iron);
      color: #ccc;
      overflow: hidden;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      /* SVノイズなどの重い描画を削除し、軽量なグラデーションでパフォーマンスを改善 */
      background-image:
        radial-gradient(circle at center, transparent 30%, rgba(0, 0, 0, 0.9) 100%),
        repeating-radial-gradient(ellipse at center, rgba(0, 0, 0, 0.1) 0px, transparent 2px),
        radial-gradient(ellipse at center, #2e1515 0%, var(--bg-iron) 100%);
    }"""
new_body_str = """    body {
      font-family: var(--font-main);
      margin: 0;
      padding: 0;
      background-color: #4A0E1B; /* VIP Casino Bordeaux */
      color: #ccc;
      overflow: hidden;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background-image:
        radial-gradient(circle at center, transparent 30%, rgba(0, 0, 0, 0.7) 100%),
        repeating-radial-gradient(ellipse at center, rgba(0, 0, 0, 0.1) 0px, transparent 2px),
        linear-gradient(135deg, #4A0E1B 0%, #2A0510 100%);
    }"""
content = content.replace(body_str, new_body_str)

# 4. Replace CSS for mode-select-container and buttons
# Remove old CSS added previously
old_css = """    /* 新規UI用スタイル */
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
    }"""
content = content.replace(old_css, "")

# 5. Insert new VIP CSS
new_css = """    /* 新規UI用スタイル (VIP Casino) */
    .btn-card-guide {
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid var(--color-gold);
      color: var(--color-gold);
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
      background: rgba(212, 175, 55, 0.1);
      box-shadow: 0 0 15px rgba(212, 175, 55, 0.5);
      transform: translateY(-2px);
    }

    .mode-select-container.three-columns {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: stretch;
      gap: 20px;
      width: 90%;
      max-width: 1000px;
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
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid var(--color-gold);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .mode-card.simple-layout:hover {
      transform: translateY(-8px);
      box-shadow: 0 10px 30px rgba(212, 175, 55, 0.4);
      background: rgba(0, 0, 0, 0.6);
    }

    .mode-card-icon.simple-icon {
      width: 50%;
      height: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .mode-card-icon.simple-icon svg {
      width: 100%;
      height: 100%;
      filter: drop-shadow(0 0 8px currentColor);
    }

    .mode-card.simple-layout .mode-card-title {
      font-size: clamp(16px, 2.2vw, 24px);
      text-align: center;
      color: var(--color-gold);
      font-family: var(--font-main);
      letter-spacing: 2px;
      margin: 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.8);
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
      font-size: 16px;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid var(--color-gold);
      color: var(--color-gold);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-family: var(--font-main);
    }
    .btn-back:hover {
      box-shadow: 0 0 15px rgba(212, 175, 55, 0.5);
      transform: translateY(-2px);
    }"""
css_idx = content.find("</style>")
content = content[:css_idx] + new_css + "\n  " + content[css_idx:]

# 6. Replace JSX
start_jsx_marker = "              {/* Stage共通: 右上のカード説明ボタン */}"
end_jsx_marker = "              {multiplayerMode === 'connecting' && ("
start_jsx_idx = content.find(start_jsx_marker)
end_jsx_idx = content.find(end_jsx_marker, start_jsx_idx)

new_jsx = """              {/* Stage共通: 右上のカード説明ボタン */}
              <button 
                className="btn-card-guide animate-fade-in" 
                onClick={() => setShowExplanation(true)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
                </svg>
                <span>CARD GUIDE</span>
              </button>

              {/* ロゴとボタンをグループ化 */}
              <div className={`title-main-group stage-${titleStage}`}>
                <div className="title-logo-container">
                  <img src="logo.webp" alt="アルティメット大富豪" className="title-logo" />
                </div>

                {/* Stage 1: 初期状態 */}
                {titleStage === 1 && (
                  <div className="touch-start-container animate-fade-in" onClick={() => setTitleStage(2)}>
                    <div className="touch-start-text" style={{color: 'var(--color-gold)', textShadow: '0 0 10px rgba(212,175,55,0.5)'}}>START GAME</div>
                  </div>
                )}
              </div>

              {/* Stage 2: モード選択状態 */}
              {titleStage === 2 && (
                <>
                  <div className="mode-select-container three-columns animate-fade-in">
                    {/* Online Play */}
                    <div className="mode-card simple-layout" onClick={() => alert('Online Playは準備中です')}>
                      <div className="mode-card-icon simple-icon" style={{color: '#4DA8DA'}}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                        </svg>
                      </div>
                      <div className="mode-card-title">Online Play</div>
                    </div>

                    {/* Multi Play */}
                    <div className="mode-card simple-layout" onClick={() => setMultiplayerMode('connecting')}>
                      <div className="mode-card-icon simple-icon" style={{color: 'var(--color-gold)'}}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                          {/* Crown */}
                          <path d="M7 3l2 3 3-4 3 4 2-3v4H7V3z" fill="currentColor"></path>
                        </svg>
                      </div>
                      <div className="mode-card-title">Multi Play</div>
                    </div>

                    {/* CPU Play */}
                    <div className="mode-card simple-layout" onClick={startDealAnimation}>
                      <div className="mode-card-icon simple-icon" style={{color: 'var(--color-gold)'}}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
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
content = content[:start_jsx_idx] + new_jsx + "\n" + content[end_jsx_idx:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated index.html for VIP Casino UI")
