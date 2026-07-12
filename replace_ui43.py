import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

old_select_ui = """{multiplayerMode === 'select' && (
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

new_select_ui = """{multiplayerMode === 'select' && (
                <>
                <div className="selection-overlay-ui" style={{width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'transparent', pointerEvents: 'auto', paddingTop: '12vh'}}>
                  <div style={{color: 'var(--color-gold)', fontFamily: "'Cinzel', 'Noto Serif JP', serif", fontSize: '2rem', letterSpacing: '4px', marginBottom: '30px', textShadow: '0 0 20px rgba(0,0,0,1)'}}>PRIVATE MATCH</div>
                  <div style={{ display: 'flex', gap: '30px' }}>
                    <div className="private-match-card-btn" style={{backgroundImage: "url('room home.png')"}} onClick={createRoom}>
                    </div>
                    <div className="private-match-card-btn" style={{backgroundImage: "url('room2.png')"}} onClick={() => setMultiplayerMode('search')}>
                    </div>
                  </div>
                </div>
                <div className="mode-aux-buttons left-aligned animate-fade-in">
                  <button className="btn-back" onClick={() => setMultiplayerMode(null)}>
                    <span>◀ 戻る</span>
                  </button>
                </div>
                </>
              )}"""

content = content.replace(old_select_ui, new_select_ui)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully moved UI lower and fixed back button placement")
