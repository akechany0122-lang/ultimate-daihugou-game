import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = "              {/* Stage 2: 1人プレイ / みんなでプレイ のモード選択カード (横並び) */}"
end_marker = "              {multiplayerMode === 'connecting' && ("

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)

if start_idx == -1 or end_idx == -1:
    print("Markers not found!")
    sys.exit(1)

new_content = """              {/* Stage 2: プレイ / ルール説明 */}
              {titleStage === 2 && (
                <>
                  <div className="mode-select-container">
                    {/* プレイ */}
                    <div className="mode-card" onClick={() => setTitleStage(3)}>
                      <div className="mode-card-icon">
                        <svg viewBox="0 0 100 100" width="100%" height="100%">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255, 215, 0, 0.15)" strokeWidth="1.5" strokeDasharray="3 3"/>
                          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255, 215, 0, 0.08)" strokeWidth="1"/>
                          <path d="M50 30 C42 30, 38 37, 40 43 C38 46, 38 51, 41 54 C42 55, 44 55, 50 55 C56 55, 58 55, 59 54 C62 51, 62 46, 60 43 C62 37, 58 30, 50 30 Z" fill="url(#goldGradientIcon1)" opacity="0.85"/>
                          <path d="M20 80 C20 60, 35 58, 50 58 C65 58, 80 60, 80 80 Z" fill="url(#goldGradientIcon1)" opacity="0.85"/>
                          <polygon points="46,41 57,48 46,55" fill="#fff" />
                          <defs>
                            <linearGradient id="goldGradientIcon1" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#fff1b8"/>
                              <stop offset="20%" stopColor="#ffe07a"/>
                              <stop offset="45%" stopColor="#d4af37"/>
                              <stop offset="60%" stopColor="#aa7c11"/>
                              <stop offset="80%" stopColor="#ffd257"/>
                              <stop offset="100%" stopColor="#634505"/>
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                      <div className="mode-card-text-container">
                        <div className="mode-card-title">プレイ</div>
                        <div className="mode-card-desc">ゲームを始めます</div>
                      </div>
                    </div>

                    {/* ルール説明 */}
                    <div className="mode-card" onClick={() => setShowExplanation(true)}>
                      <div className="mode-card-icon">
                        <svg viewBox="0 0 100 100" width="100%" height="100%">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255, 215, 0, 0.15)" strokeWidth="1.5" strokeDasharray="3 3"/>
                          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255, 215, 0, 0.08)" strokeWidth="1"/>
                          <rect x="35" y="25" width="30" height="40" rx="3" fill="#111" stroke="url(#goldGradientIcon1)" strokeWidth="2"/>
                          <line x1="40" y1="35" x2="60" y2="35" stroke="url(#goldGradientIcon1)" strokeWidth="2"/>
                          <line x1="40" y1="45" x2="55" y2="45" stroke="url(#goldGradientIcon1)" strokeWidth="2"/>
                          <line x1="40" y1="55" x2="60" y2="55" stroke="url(#goldGradientIcon1)" strokeWidth="2"/>
                          <circle cx="70" cy="70" r="10" fill="none" stroke="url(#goldGradientIcon1)" strokeWidth="2"/>
                          <path d="M70 56 L70 60 M70 80 L70 84 M56 70 L60 70 M80 70 L84 70 M60 60 L63 63 M77 77 L80 80 M60 80 L63 77 M77 60 L80 63" stroke="url(#goldGradientIcon1)" strokeWidth="2"/>
                        </svg>
                      </div>
                      <div className="mode-card-text-container">
                        <div className="mode-card-title">ルール説明</div>
                        <div className="mode-card-desc">カードの効果やルールを確認します</div>
                      </div>
                    </div>
                  </div>
                  <div className="mode-aux-buttons">
                    <button className="btn-start-game btn-aux mystic-btn" onClick={() => setTitleStage(1)}>
                      <span className="mystic-btn-text">タイトルへ戻る</span>
                    </button>
                  </div>
                </>
              )}

              {/* Stage 3: 1人 / マルチ */}
              {titleStage === 3 && (
                <>
                  <div className="mode-select-container">
                    {/* 1人でプレイ */}
                    <div className="mode-card" onClick={startDealAnimation}>
                      <div className="mode-card-icon">
                        <svg viewBox="0 0 100 100" width="100%" height="100%">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255, 215, 0, 0.15)" strokeWidth="1.5" strokeDasharray="3 3"/>
                          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255, 215, 0, 0.08)" strokeWidth="1"/>
                          <path d="M50 25 C43 25, 41 33, 44 38 C42 41, 42 46, 45 49 C46 50, 48 50, 50 50 C52 50, 54 50, 55 49 C58 46, 58 41, 56 38 C59 33, 57 25, 50 25 Z" fill="url(#goldGradientIcon1)" opacity="0.85"/>
                          <path d="M25 78 C25 60, 35 55, 50 55 C65 55, 75 60, 75 78 Z" fill="url(#goldGradientIcon1)" opacity="0.85"/>
                          <g transform="rotate(-15 42 53)">
                            <rect x="36" y="44" width="12" height="18" rx="2" fill="#111" stroke="#ffd700" strokeWidth="1.5"/>
                            <line x1="38" y1="48" x2="42" y2="58" stroke="#ffd700" strokeWidth="1"/>
                          </g>
                          <g>
                            <rect x="44" y="42" width="12" height="18" rx="2" fill="#111" stroke="#ffd700" strokeWidth="1.5"/>
                            <line x1="47" y1="46" x2="53" y2="56" stroke="#ffd700" strokeWidth="1"/>
                          </g>
                          <g transform="rotate(15 58 53)">
                            <rect x="52" y="44" width="12" height="18" rx="2" fill="#111" stroke="#ffd700" strokeWidth="1.5"/>
                            <line x1="55" y1="48" x2="59" y2="58" stroke="#ffd700" strokeWidth="1"/>
                          </g>
                        </svg>
                      </div>
                      <div className="mode-card-text-container">
                        <div className="mode-card-title">1人でプレイ</div>
                        <div className="mode-card-desc">AIと対戦するソロモード。ルールを覚えたり練習するのに最適です。</div>
                      </div>
                    </div>

                    {/* みんなでプレイ */}
                    <div className="mode-card" onClick={() => setTitleStage(4)}>
                      <div className="mode-card-icon">
                        <svg viewBox="0 0 100 100" width="100%" height="100%">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255, 215, 0, 0.15)" strokeWidth="1.5" strokeDasharray="3 3"/>
                          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255, 215, 0, 0.08)" strokeWidth="1"/>
                          <g transform="translate(16, 16) scale(0.4)">
                            <path d="M50 25 C43 25, 41 33, 44 38 C42 41, 42 46, 45 49 C46 50, 48 50, 50 50 C52 50, 54 50, 55 49 C58 46, 58 41, 56 38 C59 33, 57 25, 50 25 Z" fill="url(#goldGradientIcon1)" opacity="0.85"/>
                            <path d="M25 78 C25 60, 35 55, 50 55 C65 55, 75 60, 75 78 Z" fill="url(#goldGradientIcon1)" opacity="0.85"/>
                            <g transform="rotate(-15 42 53)">
                              <rect x="36" y="44" width="12" height="18" rx="2" fill="#111" stroke="#ffd700" strokeWidth="1.5"/>
                              <line x1="38" y1="48" x2="42" y2="58" stroke="#ffd700" strokeWidth="1"/>
                            </g>
                            <g>
                              <rect x="44" y="42" width="12" height="18" rx="2" fill="#111" stroke="#ffd700" strokeWidth="1.5"/>
                              <line x1="47" y1="46" x2="53" y2="56" stroke="#ffd700" strokeWidth="1"/>
                            </g>
                            <g transform="rotate(15 58 53)">
                              <rect x="52" y="44" width="12" height="18" rx="2" fill="#111" stroke="#ffd700" strokeWidth="1.5"/>
                              <line x1="55" y1="48" x2="59" y2="58" stroke="#ffd700" strokeWidth="1"/>
                            </g>
                          </g>
                          <g transform="translate(44, 16) scale(0.4)">
                            <path d="M50 25 C43 25, 41 33, 44 38 C42 41, 42 46, 45 49 C46 50, 48 50, 50 50 C52 50, 54 50, 55 49 C58 46, 58 41, 56 38 C59 33, 57 25, 50 25 Z" fill="url(#goldGradientIcon1)" opacity="0.85"/>
                            <path d="M25 78 C25 60, 35 55, 50 55 C65 55, 75 60, 75 78 Z" fill="url(#goldGradientIcon1)" opacity="0.85"/>
                            <g transform="rotate(-15 42 53)">
                              <rect x="36" y="44" width="12" height="18" rx="2" fill="#111" stroke="#ffd700" strokeWidth="1.5"/>
                              <line x1="38" y1="48" x2="42" y2="58" stroke="#ffd700" strokeWidth="1"/>
                            </g>
                            <g>
                              <rect x="44" y="42" width="12" height="18" rx="2" fill="#111" stroke="#ffd700" strokeWidth="1.5"/>
                              <line x1="47" y1="46" x2="53" y2="56" stroke="#ffd700" strokeWidth="1"/>
                            </g>
                            <g transform="rotate(15 58 53)">
                              <rect x="52" y="44" width="12" height="18" rx="2" fill="#111" stroke="#ffd700" strokeWidth="1.5"/>
                              <line x1="55" y1="48" x2="59" y2="58" stroke="#ffd700" strokeWidth="1"/>
                            </g>
                          </g>
                          <g transform="translate(16, 44) scale(0.4)">
                            <path d="M50 25 C43 25, 41 33, 44 38 C42 41, 42 46, 45 49 C46 50, 48 50, 50 50 C52 50, 54 50, 55 49 C58 46, 58 41, 56 38 C59 33, 57 25, 50 25 Z" fill="url(#goldGradientIcon1)" opacity="0.85"/>
                            <path d="M25 78 C25 60, 35 55, 50 55 C65 55, 75 60, 75 78 Z" fill="url(#goldGradientIcon1)" opacity="0.85"/>
                            <g transform="rotate(-15 42 53)">
                              <rect x="36" y="44" width="12" height="18" rx="2" fill="#111" stroke="#ffd700" strokeWidth="1.5"/>
                              <line x1="38" y1="48" x2="42" y2="58" stroke="#ffd700" strokeWidth="1"/>
                            </g>
                            <g>
                              <rect x="44" y="42" width="12" height="18" rx="2" fill="#111" stroke="#ffd700" strokeWidth="1.5"/>
                              <line x1="47" y1="46" x2="53" y2="56" stroke="#ffd700" strokeWidth="1"/>
                            </g>
                            <g transform="rotate(15 58 53)">
                              <rect x="52" y="44" width="12" height="18" rx="2" fill="#111" stroke="#ffd700" strokeWidth="1.5"/>
                              <line x1="55" y1="48" x2="59" y2="58" stroke="#ffd700" strokeWidth="1"/>
                            </g>
                          </g>
                          <g transform="translate(44, 44) scale(0.4)">
                            <path d="M50 25 C43 25, 41 33, 44 38 C42 41, 42 46, 45 49 C46 50, 48 50, 50 50 C52 50, 54 50, 55 49 C58 46, 58 41, 56 38 C59 33, 57 25, 50 25 Z" fill="url(#goldGradientIcon1)" opacity="0.85"/>
                            <path d="M25 78 C25 60, 35 55, 50 55 C65 55, 75 60, 75 78 Z" fill="url(#goldGradientIcon1)" opacity="0.85"/>
                            <g transform="rotate(-15 42 53)">
                              <rect x="36" y="44" width="12" height="18" rx="2" fill="#111" stroke="#ffd700" strokeWidth="1.5"/>
                              <line x1="38" y1="48" x2="42" y2="58" stroke="#ffd700" strokeWidth="1"/>
                            </g>
                            <g>
                              <rect x="44" y="42" width="12" height="18" rx="2" fill="#111" stroke="#ffd700" strokeWidth="1.5"/>
                              <line x1="47" y1="46" x2="53" y2="56" stroke="#ffd700" strokeWidth="1"/>
                            </g>
                            <g transform="rotate(15 58 53)">
                              <rect x="52" y="44" width="12" height="18" rx="2" fill="#111" stroke="#ffd700" strokeWidth="1.5"/>
                              <line x1="55" y1="48" x2="59" y2="58" stroke="#ffd700" strokeWidth="1"/>
                            </g>
                          </g>
                        </svg>
                      </div>
                      <div className="mode-card-text-container">
                        <div className="mode-card-title">みんなでプレイ</div>
                        <div className="mode-card-desc">他プレイヤーと対戦するマルチプレイモードです。</div>
                      </div>
                    </div>
                  </div>
                  <div className="mode-aux-buttons">
                    <button className="btn-start-game btn-aux mystic-btn" onClick={() => setTitleStage(2)}>
                      <span className="mystic-btn-text">戻る</span>
                    </button>
                  </div>
                </>
              )}

              {/* Stage 4: レート戦 / プライベートマッチ */}
              {titleStage === 4 && (
                <>
                  <div className="mode-select-container">
                    {/* レート戦 */}
                    <div className="mode-card" onClick={() => alert('レート戦は現在準備中です')}>
                      <div className="mode-card-icon">
                        <svg viewBox="0 0 100 100" width="100%" height="100%">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255, 215, 0, 0.15)" strokeWidth="1.5" strokeDasharray="3 3"/>
                          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255, 215, 0, 0.08)" strokeWidth="1"/>
                          <path d="M30 30 L70 30 L65 50 C60 65, 40 65, 35 50 Z" fill="url(#goldGradientIcon1)" opacity="0.85"/>
                          <path d="M25 30 L35 30 L35 45 L25 45 Z" fill="url(#goldGradientIcon1)" opacity="0.85"/>
                          <path d="M75 30 L65 30 L65 45 L75 45 Z" fill="url(#goldGradientIcon1)" opacity="0.85"/>
                          <rect x="40" y="65" width="20" height="15" fill="url(#goldGradientIcon1)" opacity="0.85"/>
                        </svg>
                      </div>
                      <div className="mode-card-text-container">
                        <div className="mode-card-title">レート戦</div>
                        <div className="mode-card-desc">全国のプレイヤーと腕を競います（準備中）</div>
                      </div>
                    </div>

                    {/* プライベートマッチ */}
                    <div className="mode-card" onClick={() => setMultiplayerMode('connecting')}>
                      <div className="mode-card-icon">
                        <svg viewBox="0 0 100 100" width="100%" height="100%">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255, 215, 0, 0.15)" strokeWidth="1.5" strokeDasharray="3 3"/>
                          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255, 215, 0, 0.08)" strokeWidth="1"/>
                          <rect x="35" y="45" width="30" height="30" rx="3" fill="url(#goldGradientIcon1)" opacity="0.85"/>
                          <path d="M40 45 L40 35 C40 25, 60 25, 60 35 L60 45" fill="none" stroke="url(#goldGradientIcon1)" strokeWidth="5"/>
                          <circle cx="50" cy="60" r="4" fill="#111"/>
                          <path d="M49 60 L49 68 L51 68 L51 60 Z" fill="#111"/>
                        </svg>
                      </div>
                      <div className="mode-card-text-container">
                        <div className="mode-card-title">プライベート</div>
                        <div className="mode-card-desc">合言葉を使って友達と対戦します</div>
                      </div>
                    </div>
                  </div>
                  <div className="mode-aux-buttons">
                    <button className="btn-start-game btn-aux mystic-btn" onClick={() => setTitleStage(3)}>
                      <span className="mystic-btn-text">戻る</span>
                    </button>
                  </div>
                </>
              )}
"""

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content[:start_idx] + new_content + content[end_idx:])

print("Successfully updated index.html")
