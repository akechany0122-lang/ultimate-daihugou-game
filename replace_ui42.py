import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove the gradient overlay from .private-match-card-btn
gradient_css = """    .private-match-card-btn::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%);
      z-index: 1;
    }"""
content = content.replace(gradient_css, "")


# 2. Update the 'select' UI JSX
old_select_ui = """{multiplayerMode === 'select' && (
                <div className="selection-overlay-ui" style={{width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'transparent', pointerEvents: 'auto'}}>
                  <div style={{color: 'var(--color-gold)', fontFamily: "'Cinzel', 'Noto Serif JP', serif", fontSize: '2rem', letterSpacing: '4px', marginBottom: '40px', textShadow: '0 0 20px rgba(0,0,0,1)'}}>PRIVATE MATCH</div>
                  <div style={{ display: 'flex', gap: '30px' }}>
                    <div className="private-match-card-btn" style={{backgroundImage: "url('room home.png')"}} onClick={createRoom}>
                      <div className="private-match-card-btn-text">ルームを作る</div>
                    </div>
                    <div className="private-match-card-btn" style={{backgroundImage: "url('room2.png')"}} onClick={() => setMultiplayerMode('search')}>
                      <div className="private-match-card-btn-text">ルームを探す</div>
                    </div>
                  </div>
                  <button className="btn-start-game" style={{ background: 'rgba(0,0,0,0.8)', borderColor: '#555', color: '#aaa', width: '200px', marginTop: '50px' }} onClick={() => setMultiplayerMode(null)}>戻る</button>
                </div>
              )}"""

new_select_ui = """{multiplayerMode === 'select' && (
                <div className="selection-overlay-ui" style={{width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'transparent', pointerEvents: 'auto', paddingTop: '20px'}}>
                  <div style={{color: 'var(--color-gold)', fontFamily: "'Cinzel', 'Noto Serif JP', serif", fontSize: '2rem', letterSpacing: '4px', marginBottom: '30px', textShadow: '0 0 20px rgba(0,0,0,1)'}}>PRIVATE MATCH</div>
                  <div style={{ display: 'flex', gap: '30px' }}>
                    <div className="private-match-card-btn" style={{backgroundImage: "url('room home.png')"}} onClick={createRoom}>
                    </div>
                    <div className="private-match-card-btn" style={{backgroundImage: "url('room2.png')"}} onClick={() => setMultiplayerMode('search')}>
                    </div>
                  </div>
                  <div className="mode-aux-buttons left-aligned animate-fade-in" style={{zIndex: 1000}}>
                    <button className="btn-back" onClick={() => setMultiplayerMode(null)}>
                      <span>◀ 戻る</span>
                    </button>
                  </div>
                </div>
              )}"""
content = content.replace(old_select_ui, new_select_ui)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully removed text overlay and moved back button")
