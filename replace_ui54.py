import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Change {!multiplayerMode && to {!gameStarted && for the top-right icons
old_top_right_condition = """              {/* 右上の共通アイコン */}
              {!multiplayerMode && (<div className="top-right-icon-buttons animate-fade-in" style={{zIndex: 1000}}>"""

new_top_right_condition = """              {/* 右上の共通アイコン */}
              {!gameStarted && (<div className="top-right-icon-buttons animate-fade-in" style={{zIndex: 1000}}>"""

content = content.replace(old_top_right_condition, new_top_right_condition)

# 2. Change CPU.png onClick to setMultiplayerMode('cpu_lobby')
old_cpu_img = """<img src="CPU.png" alt="CPU Play" className="mode-image-button" onClick={startDealAnimation} />"""
new_cpu_img = """<img src="CPU.png" alt="CPU Play" className="mode-image-button" onClick={() => setMultiplayerMode('cpu_lobby')} />"""

content = content.replace(old_cpu_img, new_cpu_img)

# 3. Add CPU Lobby Screen
cpu_lobby_screen = """{multiplayerMode === 'cpu_lobby' && (
  <>
  <div className="selection-overlay-ui" style={{width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'transparent', pointerEvents: 'auto', paddingTop: '12vh', gap: '30px'}}>
    <div style={{color: 'var(--color-gold)', fontFamily: "'Cinzel', 'Noto Serif JP', serif", fontSize: '2.5rem', letterSpacing: '4px', textShadow: '0 0 20px rgba(0,0,0,1)'}}>CPU PLAY</div>
    
    <div style={{ background: 'rgba(20,0,0,0.8)', padding: '30px 50px', borderRadius: '15px', border: '1px solid var(--color-gold)', textAlign: 'center', boxShadow: '0 0 30px rgba(212,175,55,0.2)' }}>
      <div style={{ fontSize: '1.5rem', color: '#ccc', marginBottom: '15px' }}>{myProfile.display_name}</div>
      <div style={{ fontSize: '1.5rem', color: '#888', fontWeight: 'bold' }}>
        VS CPU
      </div>
    </div>
    
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
      <button className="action-btn btn-confirm mystic-btn" onClick={startDealAnimation} style={{width: 'auto', padding: '15px 40px'}}>
        <span className="mystic-btn-text" style={{ fontSize: '1.4rem' }}>対戦を始める</span>
      </button>
    </div>
  </div>
  <div className="mode-aux-buttons left-aligned animate-fade-in">
    <button className="btn-back" onClick={() => setMultiplayerMode(null)}>
      <span>◀ 戻る</span>
    </button>
  </div>
  </>
)}"""

# Insert the CPU lobby screen after the Online lobby screen
old_online_end = """  </div>
  </>
)}"""

new_online_end = """  </div>
  </>
)}

""" + cpu_lobby_screen

# Find the online mode end to insert the cpu lobby right after it.
# Wait, this might match multiple places if there are other modes ending like this.
# Instead, insert before {showProfileSettings && (

old_profile_modal_start = """{showProfileSettings && ("""
new_profile_modal_start = cpu_lobby_screen + """\n\n""" + old_profile_modal_start

content = content.replace(old_profile_modal_start, new_profile_modal_start)


with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated top-right icons visibility and added CPU lobby screen")
