import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove the vertical CARD GUIDE and RANKING buttons from Title Screen
old_card_guide_buttons = """              {/* Stage共通: 右側のカード説明ボタン (Stage 1のみ表示) */}
              {titleStage === 1 && (
                <>
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
                <button 
                  className="btn-card-guide animate-fade-in" 
                  style={{ right: '90px', color: '#E5E4E2', textShadow: '0 0 10px rgba(229, 228, 226, 0.8)' }}
                  onClick={fetchLeaderboard}
                >
                  <span>R</span>
                  <span>A</span>
                  <span>N</span>
                  <span>K</span>
                  <span>I</span>
                  <span>N</span>
                  <span>G</span>
                </button>
                </>
              )}"""
if old_card_guide_buttons in content:
    content = content.replace(old_card_guide_buttons, "")
else:
    print("Warning: Could not find old_card_guide_buttons block")

# 2. Change the onClick of online.png
old_online_img = """<img src="online.png" alt="Online Play" className="mode-image-button" onClick={startOnlineMatch} />"""
new_online_img = """<img src="online.png" alt="Online Play" className="mode-image-button" onClick={() => { setMultiplayerMode('online'); setOnlineMatchStatus('idle'); }} />"""
if old_online_img in content:
    content = content.replace(old_online_img, new_online_img)
else:
    print("Warning: Could not find old_online_img")

# 3. Refactor the multiplayerMode === 'online' screen
old_online_screen = """{multiplayerMode === 'online' && (
  <>
  <div className="selection-overlay-ui" style={{width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'transparent', pointerEvents: 'auto', paddingTop: '12vh'}}>
    <div style={{color: 'var(--color-gold)', fontFamily: "'Cinzel', 'Noto Serif JP', serif", fontSize: '2.5rem', letterSpacing: '4px', marginBottom: '20px', textShadow: '0 0 20px rgba(0,0,0,1)'}}>ONLINE PLAY</div>
    
    <div style={{ background: 'rgba(20,0,0,0.8)', padding: '30px 50px', borderRadius: '15px', border: '1px solid var(--color-gold)', textAlign: 'center', boxShadow: '0 0 30px rgba(212,175,55,0.2)' }}>
      <div style={{ fontSize: '1.5rem', color: '#ccc', marginBottom: '15px' }}>{myProfile.display_name}</div>
      <div style={{ fontSize: '2.5rem', color: 'var(--color-gold)', fontWeight: 'bold', textShadow: '0 0 10px rgba(212,175,55,0.5)' }}>
        Rating: {playerRating}
      </div>
      
      <div style={{ marginTop: '40px', fontSize: '1.2rem', color: 'var(--color-gold)' }} className={onlineMatchStatus === 'searching' ? "blink-animation" : ""}>
        {onlineMatchStatus === 'searching' ? '対戦相手を探しています...' : 'マッチング成功！'}
      </div>
    </div>
  </div>
  <div className="mode-aux-buttons left-aligned animate-fade-in">
    <button className="btn-back" onClick={cancelOnlineMatch}>
      <span>◀ キャンセル</span>
    </button>
  </div>
  </>
)}"""

new_online_screen = """{multiplayerMode === 'online' && (
  <>
  <div className="selection-overlay-ui" style={{width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'transparent', pointerEvents: 'auto', paddingTop: '12vh'}}>
    <div style={{color: 'var(--color-gold)', fontFamily: "'Cinzel', 'Noto Serif JP', serif", fontSize: '2.5rem', letterSpacing: '4px', marginBottom: '20px', textShadow: '0 0 20px rgba(0,0,0,1)'}}>ONLINE PLAY</div>
    
    <div style={{ display: 'flex', gap: '30px', marginBottom: '30px', alignItems: 'stretch' }}>
      <div style={{ background: 'rgba(20,0,0,0.8)', padding: '30px 50px', borderRadius: '15px', border: '1px solid var(--color-gold)', textAlign: 'center', boxShadow: '0 0 30px rgba(212,175,55,0.2)' }}>
        <div style={{ fontSize: '1.5rem', color: '#ccc', marginBottom: '15px' }}>{myProfile.display_name}</div>
        <div style={{ fontSize: '2.5rem', color: 'var(--color-gold)', fontWeight: 'bold', textShadow: '0 0 10px rgba(212,175,55,0.5)' }}>
          Rating: {playerRating}
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <button 
          className="action-btn mystic-btn" 
          onClick={fetchLeaderboard}
          style={{ width: 'auto', padding: '15px 30px', height: '100%' }}
        >
          <span className="mystic-btn-text" style={{ fontSize: '1.4rem' }}>ランキング</span>
        </button>
      </div>
    </div>
    
    <div style={{ height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      {onlineMatchStatus === 'idle' && (
        <button className="action-btn btn-confirm mystic-btn" onClick={startOnlineMatch} style={{width: 'auto', padding: '15px 40px'}}>
          <span className="mystic-btn-text" style={{ fontSize: '1.4rem' }}>対戦相手を探す</span>
        </button>
      )}
      
      {onlineMatchStatus === 'searching' && (
        <>
          <div style={{ fontSize: '1.4rem', color: 'var(--color-gold)', marginBottom: '20px' }} className="blink-animation">
            対戦相手を探しています...
          </div>
          <button className="action-btn btn-pass mystic-btn" onClick={() => setOnlineMatchStatus('idle')} style={{width: 'auto', padding: '10px 30px'}}>
            <span className="mystic-btn-text" style={{ fontSize: '1.2rem' }}>キャンセル</span>
          </button>
        </>
      )}
      
      {onlineMatchStatus === 'found' && (
        <div style={{ fontSize: '1.5rem', color: 'var(--color-gold)' }} className="blink-animation">
          マッチング成功！
        </div>
      )}
    </div>

  </div>
  <div className="mode-aux-buttons left-aligned animate-fade-in">
    <button className="btn-back" onClick={cancelOnlineMatch}>
      <span>◀ 戻る</span>
    </button>
  </div>
  </>
)}"""

if old_online_screen in content:
    content = content.replace(old_online_screen, new_online_screen)
else:
    print("Warning: Could not find old_online_screen block")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully applied online screen UI refactor")
