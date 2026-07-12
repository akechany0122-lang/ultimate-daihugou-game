import sys
import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add CSS for new buttons
css_end = "</style>"
new_css = """
    .private-match-card-btn {
      position: relative;
      width: clamp(200px, 25vw, 280px);
      height: clamp(280px, 35vw, 400px);
      background-size: cover;
      background-position: center;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.9);
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: center;
      overflow: hidden;
      border: 2px solid rgba(255,255,255,0.1);
    }
    .private-match-card-btn::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%);
      z-index: 1;
    }
    .private-match-card-btn:hover {
      transform: translateY(-10px) scale(1.02);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 1), 0 0 25px rgba(212, 175, 55, 0.6);
      border-color: var(--color-gold);
    }
    .private-match-card-btn-text {
      position: relative;
      z-index: 2;
      color: var(--color-gold);
      font-family: 'Cinzel', 'Noto Serif JP', serif;
      font-size: 1.6rem;
      font-weight: bold;
      text-shadow: 0 2px 10px rgba(0,0,0,1);
      margin-bottom: 30px;
      letter-spacing: 2px;
    }
"""
if ".private-match-card-btn {" not in content:
    content = content.replace(css_end, new_css + "\n" + css_end)


# 2. Hide top-right icons
old_top_right = """<div className="top-right-icon-buttons animate-fade-in" style={{zIndex: 1000}}>"""
new_top_right = """{!multiplayerMode && (<div className="top-right-icon-buttons animate-fade-in" style={{zIndex: 1000}}>"""
if old_top_right in content:
    content = content.replace(old_top_right, new_top_right)
    # close the bracket after the second button
    content = content.replace("""</button>
              </div>

              {titleStage === 1 && (""", """</button>
              </div>)}

              {titleStage === 1 && (""")


# 3. Hide Stage 2 UI (except background)
old_stage2_start = """{titleStage === 2 && (
                <>
                  <div className="stage2-background animate-fade-in"></div>
                  
                  {/* テーブル上の散らばったカード */}"""

new_stage2_start = """{titleStage === 2 && (
                <>
                  <div className="stage2-background animate-fade-in"></div>
                  
                  {!multiplayerMode && (
                  <>
                  {/* テーブル上の散らばったカード */}"""
content = content.replace(old_stage2_start, new_stage2_start)

old_stage2_end = """<button className="btn-back" onClick={() => setTitleStage(1)}>
                      <span>◀ 戻る</span>
                    </button>
                  </div>
                </>
              )}"""

new_stage2_end = """<button className="btn-back" onClick={() => setTitleStage(1)}>
                      <span>◀ 戻る</span>
                    </button>
                  </div>
                  </>
                  )}
                </>
              )}"""
content = content.replace(old_stage2_end, new_stage2_end)


# 4. Redesign 'select' UI
old_select_ui = """{multiplayerMode === 'select' && (
                <div className="selection-overlay-ui">
                  <div className="selection-guide">プライベートマッチ</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                    <button className="btn-start-game" style={{margin: '0 auto'}} onClick={createRoom}>ルームを作る</button>
                    <button className="btn-start-game" style={{margin: '0 auto'}} onClick={() => setMultiplayerMode('search')}>ルームを探す</button>
                    <button className="btn-start-game" style={{ background: 'rgba(0,0,0,0.5)', borderColor: '#555', margin: '0 auto', color: '#aaa', width: '200px' }} onClick={() => setMultiplayerMode(null)}>戻る</button>
                  </div>
                </div>
              )}"""

new_select_ui = """{multiplayerMode === 'select' && (
                <div className="selection-overlay-ui" style={{width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'transparent', pointerEvents: 'auto'}}>
                  <div style={{color: 'var(--color-gold)', fontFamily: "'Cinzel', 'Noto Serif JP', serif", fontSize: '2rem', letterSpacing: '4px', marginBottom: '40px', textShadow: '0 0 20px rgba(0,0,0,1)'}}>PRIVATE MATCH</div>
                  <div style={{ display: 'flex', gap: '5vw' }}>
                    <div className="private-match-card-btn" style={{backgroundImage: "url('online.png')"}} onClick={createRoom}>
                      <div className="private-match-card-btn-text">ルームを作る</div>
                    </div>
                    <div className="private-match-card-btn" style={{backgroundImage: "url('mulch.png')"}} onClick={() => setMultiplayerMode('search')}>
                      <div className="private-match-card-btn-text">ルームを探す</div>
                    </div>
                  </div>
                  <button className="btn-start-game" style={{ background: 'rgba(0,0,0,0.8)', borderColor: '#555', color: '#aaa', width: '200px', marginTop: '50px' }} onClick={() => setMultiplayerMode(null)}>戻る</button>
                </div>
              )}"""
content = content.replace(old_select_ui, new_select_ui)

# 5. Make search UI centered better
old_search_ui = """{multiplayerMode === 'search' && (
                <div className="selection-overlay-ui">"""
new_search_ui = """{multiplayerMode === 'search' && (
                <div className="selection-overlay-ui" style={{width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'transparent'}}>"""
content = content.replace(old_search_ui, new_search_ui)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated private match UI design")
