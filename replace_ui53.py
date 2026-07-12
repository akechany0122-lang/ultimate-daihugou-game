import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update myProfile state initialization
old_profile_init = """      const [myProfile, setMyProfile] = useState(() => {
        const savedAvatar = localStorage.getItem('local_avatar') || 'knight';
        return {
          display_name: 'YOU',
          avatar: savedAvatar
        };
      });"""

new_profile_init = """      const [myProfile, setMyProfile] = useState(() => {
        const savedAvatar = localStorage.getItem('local_avatar') || 'knight';
        const savedName = localStorage.getItem('local_display_name') || 'YOU';
        return {
          display_name: savedName,
          avatar: savedAvatar
        };
      });"""

content = content.replace(old_profile_init, new_profile_init)

# 2. Add showProfileSettings state and updateProfileName function
old_states = """      const [showLeaderboard, setShowLeaderboard] = useState(false);
      const [leaderboardData, setLeaderboardData] = useState([]);"""

new_states = """      const [showLeaderboard, setShowLeaderboard] = useState(false);
      const [leaderboardData, setLeaderboardData] = useState([]);
      const [showProfileSettings, setShowProfileSettings] = useState(false);
      const [tempProfileName, setTempProfileName] = useState('');
      
      const updateProfileName = () => {
        const newName = tempProfileName.trim() || 'YOU';
        localStorage.setItem('local_display_name', newName);
        setMyProfile(prev => prev ? { ...prev, display_name: newName } : null);
        setShowProfileSettings(false);
      };"""

content = content.replace(old_states, new_states)

# 3. Replace "設定" icon with Silhouette Icon
old_settings_icon = """                <button className="icon-btn" onClick={() => alert('設定は準備中です')} title="設定">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                </button>"""

new_settings_icon = """                <button className="icon-btn" onClick={() => { setTempProfileName(myProfile?.display_name || 'YOU'); setShowProfileSettings(true); }} title="プロフィール設定">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </button>"""

content = content.replace(old_settings_icon, new_settings_icon)

# 4. Add Profile Modal UI right before {showLeaderboard && (...)}
old_leaderboard_ui = """{showLeaderboard && ("""

new_profile_ui = """{showProfileSettings && (
  <div style={{position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
    <div style={{background: '#2A0510', border: '2px solid var(--color-gold)', borderRadius: '10px', padding: '30px', width: '80%', maxWidth: '400px', boxShadow: '0 0 30px rgba(212, 175, 55, 0.4)'}}>
      <h2 style={{color: 'var(--color-gold)', fontFamily: "'Cinzel', serif", margin: '0 0 20px', textAlign: 'center'}}>PROFILE</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ color: '#ccc', display: 'block', marginBottom: '10px' }}>Name:</label>
        <input 
          type="text" 
          maxLength="10"
          value={tempProfileName}
          onChange={(e) => setTempProfileName(e.target.value)}
          style={{ width: '100%', padding: '10px', background: '#000', color: '#fff', border: '1px solid #555', borderRadius: '5px', fontSize: '1.2rem', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ marginBottom: '30px' }}>
        <label style={{ color: '#ccc', display: 'block', marginBottom: '10px' }}>Avatar:</label>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {['knight', 'mage', 'assassin', 'elf'].map(avatarKey => (
            <div 
              key={avatarKey} 
              onClick={() => updateProfileAvatar(avatarKey)}
              style={{ 
                width: '60px', height: '60px', borderRadius: '5px', cursor: 'pointer',
                border: myProfile?.avatar === avatarKey ? '3px solid var(--color-gold)' : '1px solid #333',
                backgroundImage: `url(${getAvatarUrl(avatarKey)})`, backgroundSize: 'cover', backgroundPosition: 'center'
              }}
            ></div>
          ))}
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
        <button className="action-btn btn-pass mystic-btn" onClick={() => setShowProfileSettings(false)} style={{padding: '10px 20px', height: 'auto'}}>
          <span className="mystic-btn-text" style={{fontSize: '1rem'}}>キャンセル</span>
        </button>
        <button className="action-btn btn-confirm mystic-btn" onClick={updateProfileName} style={{padding: '10px 20px', height: 'auto'}}>
          <span className="mystic-btn-text" style={{fontSize: '1rem'}}>決定</span>
        </button>
      </div>
    </div>
  </div>
)}

{showLeaderboard && ("""

content = content.replace(old_leaderboard_ui, new_profile_ui)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully replaced settings icon and added profile modal")
