import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Ranking Icon to top-right-icon-buttons
old_top_right = """              {/* 右上の共通アイコン */}
              {!multiplayerMode && (<div className="top-right-icon-buttons animate-fade-in" style={{zIndex: 1000}}>
                <button className="icon-btn" onClick={() => alert('設定は準備中です')} title="設定">"""

new_top_right = """              {/* 右上の共通アイコン */}
              {!multiplayerMode && (<div className="top-right-icon-buttons animate-fade-in" style={{zIndex: 1000}}>
                <button className="icon-btn" onClick={fetchLeaderboard} title="ランキング">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 20h20"></path>
                    <path d="M19 17L22 7l-5 3-5-6-5 6-5-3 3 10"></path>
                  </svg>
                </button>
                <button className="icon-btn" onClick={() => alert('設定は準備中です')} title="設定">"""

content = content.replace(old_top_right, new_top_right)

# 2. Refactor Online Play screen to vertically align Rating, Find Opponent, Cancel, and remove Ranking
old_online_screen = """{multiplayerMode === 'online' && (
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

new_online_screen = """{multiplayerMode === 'online' && (
  <>
  <div className="selection-overlay-ui" style={{width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'transparent', pointerEvents: 'auto', paddingTop: '12vh', gap: '30px'}}>
    <div style={{color: 'var(--color-gold)', fontFamily: "'Cinzel', 'Noto Serif JP', serif", fontSize: '2.5rem', letterSpacing: '4px', textShadow: '0 0 20px rgba(0,0,0,1)'}}>ONLINE PLAY</div>
    
    <div style={{ background: 'rgba(20,0,0,0.8)', padding: '30px 50px', borderRadius: '15px', border: '1px solid var(--color-gold)', textAlign: 'center', boxShadow: '0 0 30px rgba(212,175,55,0.2)' }}>
      <div style={{ fontSize: '1.5rem', color: '#ccc', marginBottom: '15px' }}>{myProfile.display_name}</div>
      <div style={{ fontSize: '2.5rem', color: 'var(--color-gold)', fontWeight: 'bold', textShadow: '0 0 10px rgba(212,175,55,0.5)' }}>
        Rating: {playerRating}
      </div>
    </div>
    
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
      {onlineMatchStatus === 'idle' && (
        <button className="action-btn btn-confirm mystic-btn" onClick={startOnlineMatch} style={{width: 'auto', padding: '15px 40px'}}>
          <span className="mystic-btn-text" style={{ fontSize: '1.4rem' }}>対戦相手を探す</span>
        </button>
      )}
      
      {onlineMatchStatus === 'searching' && (
        <>
          <div style={{ fontSize: '1.4rem', color: 'var(--color-gold)' }} className="blink-animation">
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

print("Successfully realigned online screen and added ranking icon")
