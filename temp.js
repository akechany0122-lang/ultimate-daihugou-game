  <script type="text/babel">
    const { useState, useEffect, useRef } = React;

    const SUITS = ['♠', '♥', '♦', '♣'];
    const RANKS = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
    const rankToValue = (r) => {
      if (r === 'A') return 1;
      if (r === '2') return 2;
      if (r === 'J') return 11;
      if (r === 'Q') return 12;
      if (r === 'K') return 13;
      if (r === 'Joker') return 0;
      return parseInt(r) || 0;
    };
    const valueToRank = (v) => {
      if (v === 1) return 'A';
      if (v === 2) return '2';
      if (v === 11) return 'J';
      if (v === 12) return 'Q';
      if (v === 13) return 'K';
      return v.toString();
    };
    const getEffectiveCount = (cardsToCount) => {
      if (cardsToCount.length === 2 && cardsToCount.some(c => c.rank === '5')) {
        const other = cardsToCount.find(c => c.rank !== '5');
        if (other && ['A', '2', '3', '4', '6', '7', '8'].includes(other.rank)) {
          return 1;
        }
      }
      return cardsToCount.length;
    };

    // Death Game Icons
    const ICONS = {
      '4': '🛡️', '5': '⛓️', '6': '🔥', '7': '🩸',
      '8': '🪓', '9': '🌀', '10': '💀', 'J': '⏳',
      'Q': '💣', 'K': '👁️', 'A': '🎯', 'Joker': '🃏'
    };

    const RANK_NAMES = {
      '3': '3', '4': '4シールド', '5': '5スキップ', '6': '6フェニックス', '7': '7渡し',
      '8': '8切り', '9': '9リバース', '10': '10捨て', 'J': '11バック', 'Q': '12ボンバー',
      'K': 'キングウォッチ', 'A': 'サービスエース', '2': '2', 'Joker': 'ジョーカー'
    };

    // ------------------- Sound Manager -------------------
    class SoundManager {
      constructor() {
        this.ctx = null;
        this.bgm = null;
        this.bgmType = null;
        this.bgmVolume = 0.28;
        this._pendingBGM = null; // queued before first interaction
      }

      // ---- Context Init ----
      _ensureCtx() {
        if (!this.ctx) {
          this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return this.ctx;
      }

      // ---- BGM ----
      playTitleBGM() { this._playBGM('bgm2.mp3', 'title'); }
      playGameBGM() { this._playBGM('bgm.mp3', 'game'); }

      _playBGM(file, type) {
        if (this.bgmType === type && this.bgm) return;
        this.stopBGM();
        const audio = new Audio(file);
        audio.loop = true;
        audio.volume = this.bgmVolume;
        this.bgm = audio;
        this.bgmType = type;
        // Try immediate play; if blocked, queue for first-interaction
        const p = audio.play();
        if (p && typeof p.then === 'function') {
          p.catch(() => {
            this._pendingBGM = { audio, type };
          });
        }
      }

      // Called on first user gesture — flush any pending BGM
      flushPendingBGM() {
        if (this._pendingBGM) {
          const { audio, type } = this._pendingBGM;
          this._pendingBGM = null;
          this.bgm = audio;
          this.bgmType = type;
          audio.play().catch(() => { });
        }
        // Also resume AudioContext if it was suspended
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      }

      stopBGM() {
        if (this.bgm) {
          this.bgm.pause();
          this.bgm.currentTime = 0;
          this.bgm = null;
          this.bgmType = null;
        }
      }

      // ---- Noise helper ----
      _noise(freq, endFreq, vol, dur, filterType = 'highpass') {
        const ctx = this._ensureCtx();
        const now = ctx.currentTime;
        const sr = ctx.sampleRate;
        const buf = ctx.createBuffer(1, Math.ceil(sr * dur), sr);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const flt = ctx.createBiquadFilter();
        flt.type = filterType;
        flt.frequency.setValueAtTime(freq, now);
        flt.frequency.exponentialRampToValueAtTime(endFreq, now + dur);
        const g = ctx.createGain();
        g.gain.setValueAtTime(vol, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + dur);
        src.connect(flt); flt.connect(g); g.connect(ctx.destination);
        src.start(); src.stop(now + dur);
      }

      // ---- Osc helper ----
      _osc(type, freq, endFreq, vol, dur, endVol) {
        const ctx = this._ensureCtx();
        const now = ctx.currentTime;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, now);
        if (endFreq !== null) o.frequency.exponentialRampToValueAtTime(endFreq, now + dur);
        g.gain.setValueAtTime(vol, now);
        g.gain.exponentialRampToValueAtTime(endVol ?? 0.001, now + dur);
        o.connect(g); g.connect(ctx.destination);
        o.start(); o.stop(now + dur);
        return { osc: o, gainNode: g };
      }

      // ---- Card Handling: ページを捲るような摩擦音 ----
      playLightPaperSE() {
        // 高域ノイズ(4kHz→1kHz)の短いスウィープ
        this._noise(4000, 800, 0.06, 0.09, 'highpass');
        // 極薄い低域ノイズを重ねてコシを出す
        this._noise(800, 200, 0.03, 0.07, 'bandpass');
      }

      // ---- Heavier shuffle sound ----
      playPaperSE() {
        this._noise(3000, 600, 0.12, 0.15, 'highpass');
        this._noise(600, 200, 0.06, 0.12, 'bandpass');
      }

      // ---- Crumple (10 Discard) ----
      playCrumpleSE() {
        for (let i = 0; i < 10; i++) {
          const delay = i * 22;
          setTimeout(() => {
            this._noise(300 + Math.random() * 600, 80, 0.14, 0.06, 'bandpass');
          }, delay);
        }
      }

      // ---- Explosion wrapper (Q) ----
      playExplosionSE() { this.playEffectSE('Q'); }

      // ================================================================
      // ---- playEffectSE — 全14ランク完全書き直し ----
      // ================================================================
      playEffectSE(rank) {
        const ctx = this._ensureCtx();
        const now = ctx.currentTime;

        switch (rank) {
          // -------- A : テニスの打球音 --------
          case 'A': {
            // 短く鋭いパーカッシブ・ピンポン音
            this._osc('sine', 900, 120, 0.35, 0.14, 0.001);
            // 打撃のノイズ(スウィッシュ)
            this._noise(3000, 800, 0.15, 0.1, 'highpass');
            break;
          }

          // -------- 2 : 鋭い剣戟音 --------
          case '2': {
            // 主剣撃 (鋭い金属インパクト)
            this._osc('sawtooth', 1400, 300, 0.3, 0.25, 0.001);
            // 副音 (共鳴リン)
            this._osc('sine', 2200, 2200, 0.18, 0.4, 0.001);
            // 空気を切る音
            this._noise(5000, 1000, 0.2, 0.15, 'highpass');
            break;
          }

          // -------- 3 : 布が擦れる柔らかな音 --------
          case '3': {
            this._noise(1200, 400, 0.12, 0.5, 'bandpass');
            this._noise(600, 200, 0.07, 0.45, 'bandpass');
            break;
          }

          // -------- 4 : 重厚な金属の盾の防御音 --------
          case '4': {
            // 低域衝撃
            this._osc('sine', 60, 30, 0.5, 0.6, 0.001);
            // 金属リン (高域余韻)
            this._osc('sine', 2800, 2800, 0.2, 0.8, 0.001);
            // 中域ガンとぶつかる音
            this._noise(1500, 400, 0.25, 0.3, 'bandpass');
            break;
          }

          // -------- 5 : ジャラジャラと鳴り響く鎖の音 --------
          case '5': {
            // 不規則な金属鎖 (7回)
            for (let i = 0; i < 7; i++) {
              const t = i * 65 + Math.random() * 30;
              setTimeout(() => {
                this._noise(4000 + Math.random() * 2000, 800, 0.1, 0.06, 'bandpass');
              }, t);
            }
            break;
          }

          // -------- 6 : 燃え盛る業火の炎 --------
          case '6': {
            // ランブリング・ファイアーノイズ
            const sr = ctx.sampleRate;
            const len = Math.ceil(sr * 2.0);
            const buf = ctx.createBuffer(1, len, sr);
            const dat = buf.getChannelData(0);
            for (let i = 0; i < len; i++) dat[i] = Math.random() * 2 - 1;
            const fireNoise = ctx.createBufferSource();
            fireNoise.buffer = buf;
            // ローパス + 揺れLFO
            const lp = ctx.createBiquadFilter();
            lp.type = 'lowpass'; lp.frequency.value = 350;
            const lfo = ctx.createOscillator();
            lfo.frequency.value = 9;
            const lfoG = ctx.createGain(); lfoG.gain.value = 220;
            lfo.connect(lfoG); lfoG.connect(lp.frequency);
            const fGain = ctx.createGain();
            fGain.gain.setValueAtTime(0.5, now);
            fGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
            fireNoise.connect(lp); lp.connect(fGain); fGain.connect(ctx.destination);
            lfo.start(now); lfo.stop(now + 2.0);
            fireNoise.start(now); fireNoise.stop(now + 2.0);
            break;
          }

          // -------- 7 : カードを捌く「サッ」という音 --------
          case '7': {
            this.playPaperSE();
            break;
          }

          // -------- 8 : 金属的な響きを伴う鋭い斬撃 --------
          case '8': {
            // 斬撃 (sawtooth pitch-drop)
            this._osc('sawtooth', 1200, 40, 0.4, 0.2, 0.001);
            // 空気を切るホワイトノイズ
            this._noise(6000, 800, 0.35, 0.2, 'highpass');
            // 金属残響 (キィン)
            this._osc('sine', 3500, 3500, 0.15, 0.55, 0.001);
            break;
          }

          // -------- 9 : 正確に刻まれる時計の秒針(チクタク) --------
          case '9': {
            // チク(高め)
            this._osc('sine', 3000, 3000, 0.25, 0.05, 0.001);
            this._noise(4000, 4000, 0.1, 0.04, 'bandpass');
            // タク (低め) — 少し遅れ
            setTimeout(() => {
              this._osc('sine', 2400, 2400, 0.2, 0.05, 0.001);
              this._noise(3000, 3000, 0.08, 0.04, 'bandpass');
            }, 380);
            break;
          }

          // -------- 10 : 紙をクシャクシャにする音 --------
          case '10': {
            this.playCrumpleSE();
            break;
          }

          // -------- J : どよめく群衆の声 --------
          case 'J': {
            // 15本のランダム周波数デチューン・オシレータ
            for (let i = 0; i < 15; i++) {
              const o = ctx.createOscillator();
              o.type = 'sine';
              o.frequency.value = 120 + Math.random() * 320;
              const g = ctx.createGain();
              g.gain.setValueAtTime(0.0, now);
              g.gain.linearRampToValueAtTime(0.04 + Math.random() * 0.02, now + 0.25);
              g.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
              o.connect(g); g.connect(ctx.destination);
              o.start(now); o.stop(now + 1.4);
            }
            // ざわめきノイズ
            this._noise(800, 300, 0.08, 1.2, 'bandpass');
            break;
          }

          // -------- Q : 画面を揺らす激しい爆発音 --------
          case 'Q': {
            // 超低域impact
            this._osc('square', 80, 8, 0.6, 1.2, 0.001);
            // 爆風ノイズ (ローパス)
            this._noise(1200, 20, 0.7, 1.2, 'lowpass');
            // 高域フラッシュノイズ
            this._noise(8000, 500, 0.3, 0.2, 'highpass');
            break;
          }

          // -------- K : 監視の目が光るような「ビーン」 --------
          case 'K': {
            // 上昇するサイン波 (エコー感)
            this._osc('sine', 400, 1200, 0.3, 0.9, 0.001);
            // 高周波ビビリ (vibrato)
            const kO = ctx.createOscillator();
            kO.type = 'sawtooth';
            kO.frequency.setValueAtTime(700, now);
            const vLfo = ctx.createOscillator(); vLfo.type = 'sine'; vLfo.frequency.value = 45;
            const vG = ctx.createGain(); vG.gain.value = 120;
            vLfo.connect(vG); vG.connect(kO.frequency);
            const kG = ctx.createGain();
            kG.gain.setValueAtTime(0.22, now);
            kG.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
            kO.connect(kG); kG.connect(ctx.destination);
            vLfo.start(now); vLfo.stop(now + 0.9);
            kO.start(now); kO.stop(now + 0.9);
            break;
          }

          // -------- Joker : カオス --------
          case 'Joker': {
            this._osc('sawtooth', 150, 3000, 0.35, 0.4, 0.001);
            this._noise(6000, 200, 0.2, 0.4, 'highpass');
            break;
          }

          default: {
            this._osc('sine', 440, 440, 0.2, 0.2, 0.001);
          }
        }
      }
    }

    const sm = new SoundManager();

    // ------------------- Card Data -------------------
    const TCG_DATA = {
      'A': { name: 'サービスＡ', desc: 'このカードで場が流れた時、自身の手元に帰還', url: 'Aimage.webp', icon: '🎯', auraColor: '#2980b9' },
      '2': { name: '２ナイト', desc: '能力なし', url: '2image.webp', icon: '', auraColor: '#27ae60' },
      '3': { name: '３コモン', desc: '能力なし', url: '3image.webp', icon: '', auraColor: '#7f8c8d' },
      '4': { name: '４シールド', desc: 'このターン、他プレイヤーからの攻撃を受けない', url: '4image.webp', icon: '🛡️', auraColor: '#00b4d8' },
      '5': { name: 'プラス5', desc: '他のカードと合計したランクの効果を発動', url: '5image.webp', icon: '➕', auraColor: '#ff4444' },
      '6': { name: '６フェニックス', desc: '墓地からランダムにカードを入手', url: '6image.webp', icon: '🔥', auraColor: '#8e44ad' },
      '7': { name: '７渡し', desc: '次のプレイヤーにカードを譲渡', url: '7image.webp', icon: '🩸', auraColor: '#ffffff' },
      '8': { name: '８切り', desc: 'この場を強制的に終了', url: '8image.webp', icon: '🪓', auraColor: '#d35400' },
      '9': { name: '９リバース', desc: '回り順を逆転', url: '9image.webp', icon: '🌀', auraColor: '#f1c40f' },
      '10': { name: '１０捨て', desc: '任意のカードを墓地に捨てる', url: '10image.webp', icon: '💀', auraColor: '#2c3e50' },
      'J': { name: 'Ｊバック', desc: 'このターン、カードの強さが逆転', url: 'Jimage.webp', icon: '⏳', auraColor: '#e67e22' },
      'Q': { name: 'Ｑボンバー', desc: '場にある特定のカードを消滅', url: 'Qimage.webp', icon: '💣', auraColor: '#bdc3c7' },
      'K': { name: 'Ｋウォッチ', desc: '指定したプレイヤーの手札を監視', url: 'Kimage.webp', icon: '👁️', auraColor: '#f1c40f' },
      'Joker': { name: 'ジョーカー', desc: '最強のカード。何にでも成り代わる', url: 'joker.webp', icon: '🃏', auraColor: '#fd79a8' }
    };

    const createDeck = () => {
      let deck = [];
      for (let suit of SUITS) {
        for (let i = 0; i < RANKS.length; i++) {
          deck.push({ id: `${suit}${RANKS[i]}`, suit, rank: RANKS[i], strength: i });
        }
      }
      deck.push({ id: 'Joker1', suit: 'Joker', rank: 'Joker', strength: 13 });
      deck.push({ id: 'Joker2', suit: 'Joker', rank: 'Joker', strength: 13 });
      return deck;
    };

    const shuffle = (array) => {
      let deck = [...array];
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      return deck;
    };

    // Edge animation start points
    const getPlayerEdgePosition = (playerIndex) => {
      switch (playerIndex) {
        case 0: return { top: '150%', left: '50%' };
        case 1: return { top: '50%', left: '-50%' };
        case 2: return { top: '-50%', left: '50%' };
        case 3: return { top: '50%', left: '150%' };
        default: return { top: '50%', left: '50%' };
      }
    };

    // Rank title mapping representing hierarchy
    const getHierarchyTitle = (finishOrder) => {
      if (finishOrder === 1) return { title: "大富豪", cls: "rank-daifugo" };
      if (finishOrder === 2) return { title: "富豪", cls: "" };
      if (finishOrder === 3) return { title: "貧民", cls: "" };
      if (finishOrder === 4) return { title: "大貧民", cls: "rank-daihinmin" };
      return { title: "生贄候補", cls: "" };
    };

    function App() {
      const [gameStarted, setGameStarted] = useState(false);
      const [multiplayerMode, setMultiplayerMode] = useState(null); // 'connecting' | 'lobby' | 'active' | 'matchmaking'
      const [isHost, setIsHost] = useState(false);
      const [myPlayerIndex, setMyPlayerIndex] = useState(0);
      const [passphrase, setPassphrase] = useState(''); // 部屋コード用
      const [myProfile, setMyProfile] = useState(null);
      const [currentRoom, setCurrentRoom] = useState(null);
      const [lobbyPlayers, setLobbyPlayers] = useState([]);
      const [roomChannel, setRoomChannel] = useState(null);
      const [isDealing, setIsDealing] = useState(false);
      const [hands, setHands] = useState([[], [], [], []]);
      const [tableCards, setTableCards] = useState([]);
      const [tableHistoryCards, setTableHistoryCards] = useState([]);
      const [turn, setTurn] = useState(0);
      const [passCount, setPassCount] = useState(0);
      const [lastPlayPlayer, setLastPlayPlayer] = useState(null);
      const [selectedCards, setSelectedCards] = useState([]);
      const [ranksDiscovered, setRanksDiscovered] = useState([]);

      const [graveyard, setGraveyard] = useState([]);
      const [isShielded, setIsShielded] = useState([false, false, false, false]);
      const [is11Back, setIs11Back] = useState(false);
      const [isRevolution, setIsRevolution] = useState(false);
      const [playDirection, setPlayDirection] = useState(1);
      const [effectMessage, setEffectMessage] = useState(null);
      const [watchTarget, setWatchTarget] = useState(null);

      // Temporary Animation triggers
      const [clearingField, setClearingField] = useState(false);
      const [phoenixActive, setPhoenixActive] = useState(false);
      const [guillotineActive, setGuillotineActive] = useState(false);
      const [reverseActive, setReverseActive] = useState(false);
      const [bomberActive, setBomberActive] = useState(false);
      const [passThreadActive, setPassThreadActive] = useState(false);
      const [skipTarget, setSkipTarget] = useState(null); // CSS Chain effect
      const [missEffectTarget, setMissEffectTarget] = useState(null); // Shield sparks
      const [shockwave, setShockwave] = useState(null); // 豪華な衝撃波演出用
      const [isShaking, setIsShaking] = useState(false); // 画面揺れ演出用

      const [animMessage, setAnimMessage] = useState({ data: null, state: 'exit' });
      // New state for character cut‑in overlay
      const [cutIn, setCutIn] = useState(null);
      const [resurrectCard, setResurrectCard] = useState(null);
      const [discardingToGy, setDiscardingToGy] = useState([]); // cards flying to gy now

      // New selection states for special effects
      const [selectionMode, setSelectionMode] = useState(null); // '7', '10', 'Q'
      const [selectionInfo, setSelectionInfo] = useState(null); // { playerIndex, nextP, count }
      const [isActionLoading, setIsActionLoading] = useState(false);
      const cpuThinkingRef = React.useRef(false); // refで競合状態を防ぐ
      const prevTurnRef = React.useRef(0);
      const gameStateRef = React.useRef({});
      const [passedPlayers, setPassedPlayers] = useState([]);

      // Performance/Animation states
      const [explodingCards, setExplodingCards] = useState([]); // { playerIndex, rank }[]
      const [flyingCards, setFlyingCards] = useState([]); // { from, to, card, type: 'phoenix'|'pass' }[]
      const [receivedHighlight, setReceivedHighlight] = useState(null); // playerIndex
      const [highlightedCardIds, setHighlightedCardIds] = useState([]); // Array of card IDs
      const [gyShuffling, setGyShuffling] = useState(false);
      const [isAnimating, setIsAnimating] = useState(false); // 全演出完了フラグ
      const [abilityLog, setAbilityLog] = useState("");
      const triggerAbilityLog = (msg) => {
        setAbilityLog(msg);
        setTimeout(() => setAbilityLog(""), 3000);
      };
      const lastTouchedId = React.useRef(null);
      const isSwipingRef = React.useRef(false); // スワイプ中判定

      const handleTouchStart = () => {
        isSwipingRef.current = false;
      };

      const handleTouchMove = (e, playerIdx) => {
        if (!isMobile || playerIdx !== 0 || turn !== 0 || selectionMode || exchangePhase) return;
        isSwipingRef.current = true;
        const touch = e.touches[0];
        const elem = document.elementFromPoint(touch.clientX, touch.clientY);
        const cardElem = elem?.closest('.card.selectable');
        if (cardElem) {
          const cardId = cardElem.getAttribute('data-card-id');
          if (cardId && cardId !== lastTouchedId.current) {
            const card = hands[0].find(c => c.id === cardId);
            if (card) {
              sm.playLightPaperSE();
              // ユーザー要望：スワイプ中は「触れている位置のみ」を選択
              setSelectedCards([card]); 
              lastTouchedId.current = cardId;
            }
          }
        }
      };
      const handleTouchEnd = () => {
        lastTouchedId.current = null;
        // スワイプ終了後、少し待って判定をリセット
        setTimeout(() => { isSwipingRef.current = false; }, 50);
      };

      const [watchSelecting, setWatchSelecting] = useState(false); // Kウォッチ対象選択モード
      const [watchSelectedIndices, setWatchSelectedIndices] = useState([]); // Kウォッチで選択中のプレイヤーインデックス
      const [watchTimerTick, setWatchTimerTick] = useState(0); // タイマー描画更新用
      const [isProfileModalOpen, setIsProfileModalOpen] = useState(false); // プロフィール編集モーダル用

      const [isGameOver, setIsGameOver] = useState(false);
      const [roundResults, setRoundResults] = useState([]); // [p0, p1, p2, p3] ranking for the last round
      const [exchangePhase, setExchangePhase] = useState(null); // 'selecting' | 'animating' | null
      const [exchangeDecisions, setExchangeDecisions] = useState({}); // { playerIdx: cardIds[] }
      const [showExplanation, setShowExplanation] = useState(false);
      const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

      useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
      }, []);

      // 起動時に匿名ログインを実行 (5秒タイムアウト付き。失敗/タイムアウト時はゲストモードで動作)
      useEffect(() => {
        const guestFallback = () => {
          console.warn('[Auth] ゲストモードで起動します（Supabase認証なし）');
          setMyProfile({ id: 'local-guest-' + Math.random().toString(36).slice(2, 6), display_name: 'GUEST', rating: '---', wins: 0, losses: 0, _offline: true });
        };

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth timeout after 5s')), 5000)
        );

        const loginPromise = (async () => {
          console.log('[Auth] 匿名ログイン開始...');
          const { data, error: authError } = await supabase.auth.signInAnonymously();

          if (authError) {
            console.error('[Auth] signInAnonymously エラー:', authError.message, authError);
            throw authError;
          }

          const user = data?.user;
          if (!user) throw new Error('User object not returned from signInAnonymously');

          console.log('[Auth] 匿名ログイン成功:', user.id);

          // プロフィール取得 (最大2回リトライ)
          let profile = null;
          for (let attempt = 0; attempt < 2; attempt++) {
            if (attempt > 0) await new Promise(r => setTimeout(r, 800));
            const { data: p, error: pErr } = await supabase
              .from('profiles').select('*').eq('id', user.id).single();
            if (p) { profile = p; break; }
            console.warn(`[Auth] プロフィール取得 試行${attempt + 1} 失敗:`, pErr?.message);
          }

          // フォールバック: クライアント側でプロフィール作成
          if (!profile) {
            const defaultName = 'GHOST #' + user.id.substring(0, 4).toUpperCase();
            const { data: newP, error: insErr } = await supabase
              .from('profiles')
              .insert({ id: user.id, display_name: defaultName, rating: 1500 })
              .select().single();
            if (insErr) console.error('[Auth] プロフィール作成失敗:', insErr.message);
            else profile = newP;
          }

          if (profile) {
            console.log('[Auth] プロフィール設定完了:', profile.display_name, '/ レート:', profile.rating);
            setMyProfile(profile);
          } else {
            console.warn('[Auth] プロフィール取得/作成が失敗。ローカルゲストで動作');
            setMyProfile({ id: user.id, display_name: 'GUEST', rating: 1500, wins: 0, losses: 0, _local: true });
          }
        })();

        Promise.race([loginPromise, timeoutPromise])
          .catch(err => {
            console.error('[Auth] 認証失敗またはタイムアウト:', err.message);
            guestFallback();
          });
      }, []);

      const updateProfileName = async (newName) => {
        if (!myProfile || !newName.trim()) return;
        const cleanName = newName.trim().substring(0, 12);
        const { error } = await supabase
          .from('profiles')
          .update({ display_name: cleanName })
          .eq('id', myProfile.id);
        
        if (error) {
          alert("名前の更新に失敗しました");
        } else {
          setMyProfile(prev => ({ ...prev, display_name: cleanName }));
        }
      };


      useEffect(() => {
        if (watchTarget) {
          const interval = setInterval(() => {
            setWatchTimerTick(t => t + 1);
          }, 1000);
          return () => clearInterval(interval);
        }
      }, [watchTarget]);

      const [isCoffinOpen, setIsCoffinOpen] = useState(false);

      useEffect(() => {
        // ターンが実際に移動したかチェック
        if (turn !== prevTurnRef.current) {
          if (turn === 0) setIsActionLoading(false);
          cpuThinkingRef.current = false;
          prevTurnRef.current = turn;
        }

        // CPUターンのトリガー
        const isCurrentTurnCpu = isCpuSlot(turn);
        if (isCurrentTurnCpu && !ranksDiscovered.includes(turn) && !selectionMode && !isAnimating && !watchTarget) {
          // マルチプレイヤー時はホストのみがCPUを動かす
          if (multiplayerMode === 'active' && !isHost) return;
          if (cpuThinkingRef.current) return;
          const timeout = setTimeout(() => {
            if (cpuThinkingRef.current) return;
            cpuThinkingRef.current = true;
            playCpuTurn(turn);
          }, 600);
          return () => clearTimeout(timeout);
        }
      }, [turn, selectionMode, isAnimating, watchTarget, multiplayerMode, isHost, myPlayerIndex]);

      useEffect(() => {
        if (effectMessage) {
          setAnimMessage({ data: effectMessage, state: 'enter' });
          const tmEnter = setTimeout(() => setAnimMessage(prev => ({ ...prev, state: 'enter-active' })), 50);

          const tmExit = setTimeout(() => {
            setAnimMessage(prev => ({ ...prev, state: 'exit-active' }));
            setTimeout(() => setEffectMessage(null), 300);
          }, 3000);
          return () => { clearTimeout(tmEnter); clearTimeout(tmExit); };
        } else {
          setAnimMessage({ data: null, state: 'exit' });
        }
      }, [effectMessage]);

      // Slam animation logic
      useEffect(() => {
        const hasAnimatingCards = tableCards.some(tc => tc.isAnimating);
        if (hasAnimatingCards) {
          const timer = setTimeout(() => {
            sm.playPaperSE(); // Use paper sound for field clear
            setTableCards(prev => prev.map(tc => {
              if (tc.isAnimating) {
                return { ...tc, isAnimating: false, isSlammed: true };
              }
              return tc;
            }));
          }, 50);
          return () => clearTimeout(timer);
        }
      }, [tableCards]);

      // Remove slam effect class after animation finishes so it doesn't replay
      useEffect(() => {
        const hasSlammed = tableCards.some(tc => tc.isSlammed);
        if (hasSlammed) {
          const timer = setTimeout(() => {
            setTableCards(prev => prev.map(tc => ({ ...tc, isSlammed: false })));
          }, 500);
          return () => clearTimeout(timer);
        }
      }, [tableCards]);

      const showMessage = (title, desc) => {
        setEffectMessage({ title, desc });
      };

      // --- Supabase Multiplayer Logic ---
      
      const generateRoomCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 5; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };

      const createRoom = async () => {
        if (!myProfile) return alert("サインインが完了していません");
        if (myProfile._offline) {
          alert("Supabaseへの接続に失敗しています。\nページをリロード（Cmd+R / Ctrl+R）してから再試行してください。");
          return;
        }
        try {
          setIsActionLoading(true);
          const roomCode = generateRoomCode();
          console.log('[Room] 部屋作成開始:', roomCode, '/ player_id:', myProfile.id);
          
          const { data: room, error: roomError } = await supabase
            .from('rooms')
            .insert({
              room_code: roomCode,
              status: 'waiting',
              type: 'private',
              host_id: myProfile.id,
              player_count: 1,
              max_players: 4
            })
            .select()
            .single();

          if (roomError) {
            console.error('[Room] rooms INSERT失敗:', roomError.message, roomError.code, roomError);
            throw roomError;
          }

          console.log('[Room] rooms INSERT成功:', room.id);

          const { error: playerError } = await supabase
            .from('room_players')
            .insert({
              room_id: room.id,
              player_id: myProfile.id,
              seat_index: 0,
              is_ready: true
            });

          if (playerError) {
            console.error('[Room] room_players INSERT失敗:', playerError.message, playerError.code, playerError);
            throw playerError;
          }

          console.log('[Room] ロビー移行');
          setIsHost(true);
          setMyPlayerIndex(0);
          setPassphrase(roomCode);
          setCurrentRoom(room);
          setMultiplayerMode('lobby');

          subscribeLobby(room.id);
        } catch (err) {
          console.error('[Room] 部屋作成エラー全体:', err?.message, err?.code, err);
          alert('部屋の作成に失敗しました\n原因: ' + (err?.message || '不明') + '\n\nF12→Consoleで詳細を確認してください。');
        } finally {
          setIsActionLoading(false);
        }
      };

      const joinRoom = async (code) => {
        if (!myProfile) return alert("サインインが完了していません");
        if (myProfile._offline) {
          alert("Supabaseへの接続に失敗しています。\nページをリロード（Cmd+R / Ctrl+R）してから再試行してください。");
          return;
        }
        if (!code || code.length !== 5) return alert("正しい5桁の部屋コードを入力してください");
        
        try {
          setIsActionLoading(true);

          const { data: room, error: roomError } = await supabase
            .from('rooms')
            .select('*')
            .eq('room_code', code)
            .single();

          if (roomError || !room) {
            alert("部屋が見つかりません。コードを確認してください。");
            return;
          }

          if (room.status !== 'waiting') {
            alert("その部屋のゲームは既に開始されているか、終了しています");
            return;
          }

          if (room.player_count >= 4) {
            alert("部屋が満員です");
            return;
          }

          const { data: currentPlayers, error: getPlayersError } = await supabase
            .from('room_players')
            .select('seat_index')
            .eq('room_id', room.id);

          if (getPlayersError) throw getPlayersError;

          const occupiedSeats = currentPlayers.map(p => p.seat_index);
          let seatIndex = -1;
          for (let i = 1; i < 4; i++) {
            if (!occupiedSeats.includes(i)) {
              seatIndex = i;
              break;
            }
          }

          if (seatIndex === -1) {
            alert("空き座席が見つかりません");
            return;
          }

          const { error: joinError } = await supabase
            .from('room_players')
            .insert({
              room_id: room.id,
              player_id: myProfile.id,
              seat_index: seatIndex,
              is_ready: false
            });

          if (joinError) throw joinError;

          await supabase
            .from('rooms')
            .update({ player_count: room.player_count + 1 })
            .eq('id', room.id);

          setIsHost(false);
          setMyPlayerIndex(seatIndex);
          setPassphrase(code);
          setCurrentRoom(room);
          setMultiplayerMode('lobby');

          subscribeLobby(room.id);
        } catch (err) {
          console.error("Join room failed:", err);
          alert("部屋への参加に失敗しました");
        } finally {
          setIsActionLoading(false);
        }
      };

      const subscribeLobby = (roomId) => {
        if (roomChannel) {
          supabase.removeChannel(roomChannel);
        }

        const fetchLobbyPlayers = async () => {
          const { data, error } = await supabase
            .from('room_players')
            .select('player_id, seat_index, is_ready, profiles(display_name, rating)')
            .eq('room_id', roomId)
            .order('seat_index', { ascending: true });
          
          if (!error && data) {
            setLobbyPlayers(data);
          }
        };

        fetchLobbyPlayers();

        const lobbySub = supabase.channel(`lobby:${roomId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` }, () => {
            fetchLobbyPlayers();
          })
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, (payload) => {
            if (payload.new.status === 'playing') {
              setMultiplayerMode('active');
              setGameStarted(true);
              subscribeGame(roomId);
              lobbySub.unsubscribe();
            }
          })
          .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, () => {
            alert("部屋が解散されました");
            cleanupMultiplayer();
            lobbySub.unsubscribe();
          })
          .subscribe();

        setRoomChannel(lobbySub);
      };

      const leaveRoom = async () => {
        if (!currentRoom || !myProfile) return;
        try {
          if (isHost) {
            await supabase.from('rooms').delete().eq('id', currentRoom.id);
          } else {
            await supabase.from('room_players').delete().eq('room_id', currentRoom.id).eq('player_id', myProfile.id);
            const { data } = await supabase.from('rooms').select('player_count').eq('id', currentRoom.id).single();
            if (data) {
              await supabase.from('rooms').update({ player_count: Math.max(1, data.player_count - 1) }).eq('id', currentRoom.id);
            }
          }
        } catch (err) {
          console.error("Leave room error:", err);
        } finally {
          cleanupMultiplayer();
        }
      };

      const cleanupMultiplayer = () => {
        if (roomChannel) {
          supabase.removeChannel(roomChannel);
          setRoomChannel(null);
        }
        if (window.matchmakingTimer) {
          clearInterval(window.matchmakingTimer);
        }
        setMultiplayerMode(null);
        setGameStarted(false);
        setIsHost(false);
        setCurrentRoom(null);
        setLobbyPlayers([]);
        setHands([[], [], [], []]);
        setTableCards([]);
        setTableHistoryCards([]);
      };

      const startMatchmaking = async () => {
        if (!myProfile) return alert("サインインが完了していません");
        try {
          setMultiplayerMode('matchmaking');

          const { error } = await supabase
            .from('matchmaking_queue')
            .insert({
              player_id: myProfile.id,
              rating: myProfile.rating
            });

          if (error && error.code !== '23505') {
            throw error;
          }

          const intervalId = setInterval(() => {
            pollMatchmaking(intervalId);
          }, 3000);

          window.matchmakingTimer = intervalId;

        } catch (err) {
          console.error("Matchmaking error:", err);
          alert("マッチメイキングの開始に失敗しました");
          setMultiplayerMode('connecting');
        }
      };

      const pollMatchmaking = async (timerId) => {
        if (!myProfile || multiplayerMode !== 'matchmaking') {
          clearInterval(timerId);
          return;
        }

        try {
          const { data: queue, error } = await supabase
            .from('matchmaking_queue')
            .select('player_id, rating, joined_at')
            .order('joined_at', { ascending: true });

          if (error) throw error;

          const myIdx = queue.findIndex(q => q.player_id === myProfile.id);
          if (myIdx === -1) {
            const { data: myJoinedRooms } = await supabase
              .from('room_players')
              .select('room_id, rooms(*)')
              .eq('player_id', myProfile.id)
              .order('joined_at', { descending: true })
              .limit(1);

            if (myJoinedRooms && myJoinedRooms.length > 0 && myJoinedRooms[0].rooms?.type === 'rated') {
              clearInterval(timerId);
              const room = myJoinedRooms[0].rooms;
              
              const { data: mySeat } = await supabase
                .from('room_players')
                .select('seat_index')
                .eq('room_id', room.id)
                .eq('player_id', myProfile.id)
                .single();
              
              setIsHost(false);
              setMyPlayerIndex(mySeat ? mySeat.seat_index : 1);
              setCurrentRoom(room);
              setPassphrase(room.room_code);
              setMultiplayerMode('lobby');
              subscribeLobby(room.id);
            }
            return;
          }

          if (queue.length >= 4) {
            const group = queue.slice(0, 4);
            const myGroupIdx = group.findIndex(g => g.player_id === myProfile.id);

            if (myGroupIdx !== -1) {
              clearInterval(timerId);
              
              if (myGroupIdx === 0) {
                const roomCode = generateRoomCode();
                
                const { data: room, error: rErr } = await supabase
                  .from('rooms')
                  .insert({
                    room_code: roomCode,
                    status: 'waiting',
                    type: 'rated',
                    host_id: myProfile.id,
                    player_count: 4,
                    max_players: 4
                  })
                  .select()
                  .single();

                if (rErr) throw rErr;

                const insertPlayers = group.map((g, idx) => ({
                  room_id: room.id,
                  player_id: g.player_id,
                  seat_index: idx,
                  is_ready: idx === 0
                }));

                await supabase.from('room_players').insert(insertPlayers);

                const playerIds = group.map(g => g.player_id);
                await supabase.from('matchmaking_queue').delete().in('player_id', playerIds);

                setIsHost(true);
                setMyPlayerIndex(0);
                setPassphrase(roomCode);
                setCurrentRoom(room);
                setMultiplayerMode('lobby');
                subscribeLobby(room.id);
              }
            }
          }
        } catch (err) {
          console.error("Polling matchmaking error:", err);
        }
      };

      const cancelMatchmaking = async () => {
        if (window.matchmakingTimer) {
          clearInterval(window.matchmakingTimer);
        }
        if (myProfile) {
          await supabase.from('matchmaking_queue').delete().eq('player_id', myProfile.id);
        }
        setMultiplayerMode('connecting');
      };

      const subscribeGame = (roomId) => {
        if (roomChannel) {
          supabase.removeChannel(roomChannel);
        }

        const applyState = (state) => {
          console.log('[Game] 状態を適用:', state);
          setHands(state.hands);
          setTableCards(state.table_cards);
          setTurn(state.turn);
          setPassCount(state.pass_count);
          setPlayDirection(state.play_direction);
          setIsRevolution(state.is_revolution);
          setIs11Back(state.is_11back);
          setIsShielded(state.is_shielded);
          setRanksDiscovered(state.ranks_discovered);
          setLastPlayPlayer(state.last_play_player);
          setGraveyard(state.graveyard);
          
          if (state.special_effects && state.special_effects.passed_players) {
            setPassedPlayers(state.special_effects.passed_players);
          } else {
            setPassedPlayers([]);
          }

          if (state.special_effects && state.special_effects.selection_request) {
            const req = state.special_effects.selection_request;
            if (req.playerIndex === gameStateRef.current.myPlayerIndex) {
              setSelectionMode(req.mode);
              if (req.mode === 'K') setWatchSelecting(true);
              setSelectionInfo(req);
              if (req.mode === 'K' && typeof TCG_DATA !== 'undefined' && TCG_DATA['K']) {
                showMessage(TCG_DATA['K'].name, "監視対象を選択");
              }
            }
          }
          
          if (state.ranks_discovered.length >= 3) {
            setIsGameOver(true);
            setRoundResults(state.ranks_discovered);
            setTurn(-1);
          }
        };

        const fetchGameState = async () => {
          console.log('[Game] 初期ステートのフェッチ開始:', roomId);
          const { data, error } = await supabase
            .from('game_states')
            .select('*')
            .eq('room_id', roomId)
            .maybeSingle();

          if (error) {
            console.error('[Game] 初期ステートフェッチエラー:', error);
          } else if (data) {
            console.log('[Game] 初期ステートフェッチ成功:', data);
            applyState(data);
          } else {
            console.log('[Game] 初期ステートはまだ存在しません');
          }
        };

        // 購読前に一度フェッチを試みる
        fetchGameState();

        const gameChan = supabase.channel(`game:${roomId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'game_states', filter: `room_id=eq.${roomId}` }, (payload) => {
            console.log('[Game] postgres_changes 受信:', payload.eventType, payload.new);
            if (payload.new) {
              const state = payload.new;
              
              // ゲスト用のフィールドクリア演出自動同期
              if (!isHost && tableCards.length > 0 && state.table_cards.length === 0) {
                const allFieldCards = [...tableHistoryCards.map(tc => tc.card), ...tableCards.map(tc => tc.card)];
                if (allFieldCards.length > 0) {
                  const isServiceAce = allFieldCards.every(c => c.rank === 'A');
                  if (isServiceAce && state.last_play_player !== null) {
                    showMessage('SERVICE ACE', `呪われたAが プレイヤー${state.last_play_player} の手元へ帰還`);
                  } else {
                    setDiscardingToGy(allFieldCards);
                    setTimeout(() => setDiscardingToGy([]), 800);
                  }
                }
                const isPlus5Combo = tableCards.length === 2 && tableCards.some(tc => tc.card.rank === '5');
                if (isPlus5Combo) {
                  setIsPlus5Active(true);
                  setTimeout(() => setIsPlus5Active(false), 3000);
                }
                setTableHistoryCards([]);
              }
              
              applyState(state);
            }
          })
          .on('broadcast', { event: 'play_effect' }, (payload) => {
            const { playerIndex, cards, effectiveVisualRank, isPlus5Combo } = payload.payload;
            console.log('[Game] プレイ演出ブロードキャスト受信:', payload);
            if (!gameStateRef.current.isHost) {
              gameStateRef.current.runPlayAnimation(playerIndex, cards, effectiveVisualRank, isPlus5Combo, true);
            }
          });

        if (isHost) {
          gameChan.on('broadcast', { event: 'action' }, (payload) => {
            const { action, cards, playerIndex, choice } = payload.payload;
            console.log("Host received broadcast action:", payload);
            const {
              turn, isAnimating, isValidPlay, executePlay, executePass,
              completeSpecialEffect, setExchangeDecisions, isGameOver, handleRestart
            } = gameStateRef.current;
            
            if (turn !== playerIndex || isAnimating) return;

            if (action === 'PLAY') {
              if (isValidPlay(cards)) {
                executePlay(playerIndex, cards);
              }
            } else if (action === 'PASS') {
              executePass(playerIndex);
            } else if (action === 'COMPLETE_EFFECT') {
              completeSpecialEffect(choice, playerIndex, payload.payload.mode, payload.payload.info);
            } else if (action === 'CONFIRM_EXCHANGE') {
              setExchangeDecisions(prev => ({ ...prev, [playerIndex]: cards }));
            } else if (action === 'RESTART' && isGameOver) {
              handleRestart();
            }
          });
        }

        gameChan.subscribe((status) => {
          console.log('[Game] チャンネル接続状態:', status);
          if (status === 'SUBSCRIBED') {
            // 接続完了時にもう一度フェッチ（ギャップ対策）
            fetchGameState();
          }
        });
        setRoomChannel(gameChan);
      };

      const sendActionToHost = (actionData) => {
        if (!roomChannel) return;
        roomChannel.send({
          type: 'broadcast',
          event: 'action',
          payload: {
            ...actionData,
            playerIndex: myPlayerIndex
          }
        });
      };

      const getDisplayIndex = (i) => {
        if (!gameStarted || multiplayerMode !== 'active') return i;
        return (i - myPlayerIndex + 4) % 4;
      };

      const broadcastState = async (currentHands, nextTurnValue = null, overrides = {}) => {
        if (!isHost || !currentRoom) return;
        const nextTurn = nextTurnValue !== null ? nextTurnValue : turn;
        try {
          const { error } = await supabase
            .from('game_states')
            .upsert({
              room_id: currentRoom.id,
              turn: nextTurn,
              hands: currentHands,
              table_cards: overrides.table_cards !== undefined ? overrides.table_cards : tableCards,
              graveyard: overrides.graveyard !== undefined ? overrides.graveyard : graveyard,
              pass_count: overrides.pass_count !== undefined ? overrides.pass_count : passCount,
              play_direction: overrides.play_direction !== undefined ? overrides.play_direction : playDirection,
              is_revolution: overrides.is_revolution !== undefined ? overrides.is_revolution : isRevolution,
              is_11back: overrides.is_11back !== undefined ? overrides.is_11back : is11Back,
              is_shielded: overrides.is_shielded !== undefined ? overrides.is_shielded : isShielded,
              ranks_discovered: overrides.ranks_discovered !== undefined ? overrides.ranks_discovered : ranksDiscovered,
              last_play_player: overrides.last_play_player !== undefined ? overrides.last_play_player : lastPlayPlayer,
              special_effects: overrides.special_effects !== undefined ? overrides.special_effects : { passed_players: passedPlayers },
              updated_at: new Date()
            }, { onConflict: 'room_id' });

          if (error) throw error;
        } catch (err) {
          console.error("Broadcast state error:", err);
        }

        setHands(currentHands);
        if (nextTurnValue !== null) setTurn(nextTurnValue);
      };

      const startMultiplayerGame = async () => {
        if (!isHost || !currentRoom) return;
        
        try {
          setIsActionLoading(true);

          const { error: roomErr } = await supabase
            .from('rooms')
            .update({ status: 'playing' })
            .eq('id', currentRoom.id);

          if (roomErr) throw roomErr;

          const deck = shuffle(createDeck());
          const newHands = [[], [], [], []];
          let i = 0;
          while (deck.length > 0) {
            newHands[i % 4].push(deck.pop());
            i++;
          }
          const sortedHands = newHands.map(h => sortHand(h, false, false));

          const { error: gsErr } = await supabase
            .from('game_states')
            .insert({
              room_id: currentRoom.id,
              turn: 0,
              hands: sortedHands,
              table_cards: [],
              graveyard: [],
              pass_count: 0,
              play_direction: 1,
              is_revolution: false,
              is_11back: false,
              is_shielded: [false, false, false, false],
              ranks_discovered: [],
              last_play_player: null
            });

          if (gsErr) throw gsErr;

          setGameStarted(true);
          setMultiplayerMode('active');
          setMyPlayerIndex(0);
          subscribeGame(currentRoom.id);
        } catch (err) {
          console.error("Start game failed:", err);
          alert("ゲームの開始に失敗しました");
        } finally {
          setIsActionLoading(false);
        }
      };

      const updateMatchRatings = async (finalRanks) => {
        if (!currentRoom || !isHost) return;
        
        try {
          const { data: players, error: getErr } = await supabase
            .from('room_players')
            .select('player_id, seat_index')
            .eq('room_id', currentRoom.id);

          if (getErr || !players) throw getErr;

          const ratingChanges = [30, 10, -10, -30];

          for (let rankIdx = 0; rankIdx < finalRanks.length; rankIdx++) {
            const seatIdx = finalRanks[rankIdx];
            const player = players.find(p => p.seat_index === seatIdx);
            
            if (player) {
              const change = ratingChanges[rankIdx];

              await supabase
                .from('room_players')
                .update({
                  final_rank: rankIdx + 1,
                  rating_change: change
                })
                .eq('room_id', currentRoom.id)
                .eq('player_id', player.player_id);
            }
          }

          await supabase
            .from('rooms')
            .update({ status: 'finished' })
            .eq('id', currentRoom.id);

        } catch (err) {
          console.error("Update ratings error:", err);
        }
      };

      useEffect(() => {
        if (isGameOver && isHost && currentRoom && currentRoom.type === 'rated') {
          updateMatchRatings(roundResults);
        }
      }, [isGameOver]);

      useEffect(() => {
        if (isGameOver && myProfile && currentRoom) {
          const applyMyRatingChange = async () => {
            const { data, error } = await supabase
              .from('room_players')
              .select('rating_change, final_rank')
              .eq('room_id', currentRoom.id)
              .eq('player_id', myProfile.id)
              .single();

            if (!error && data && data.rating_change !== null) {
              const newRating = myProfile.rating + data.rating_change;
              const isWin = data.final_rank <= 2;
              
              await supabase
                .from('profiles')
                .update({
                  rating: newRating,
                  wins: myProfile.wins + (isWin ? 1 : 0),
                  losses: myProfile.losses + (isWin ? 0 : 1)
                })
                .eq('id', myProfile.id);

              setMyProfile(prev => ({
                ...prev,
                rating: newRating,
                wins: prev.wins + (isWin ? 1 : 0),
                losses: prev.losses + (isWin ? 0 : 1)
              }));
              
              showMessage("対戦終了", `最終順位: ${data.final_rank}位 (レート変動: ${data.rating_change > 0 ? '+' : ''}${data.rating_change})`);
            }
          };
          
          setTimeout(applyMyRatingChange, 2000);
        }
      }, [isGameOver]);

      const triggerTempEffect = (setter, time = 1000) => {
        setter(true);
        setTimeout(() => setter(false), time);
      };

      const triggerMiss = (playerIndex) => {
        setMissEffectTarget(playerIndex);
        setTimeout(() => setMissEffectTarget(null), 500);
      };

      const compareStrength = (targetSt, tableSt) => {
        // JOKER単体(13)は最強だが、JOKERがなり変わった後の強さは各数字に従う
        if (targetSt === 13 && tableSt !== 13) return true;
        if (tableSt === 13 && targetSt !== 13) return false;
        if (targetSt === 13 && tableSt === 13) return false; // JOKERはJOKERに勝てない
        
        const isInverse = isRevolution !== is11Back;
        return isInverse ? targetSt < tableSt : targetSt > tableSt;
      };

      const sortHand = (hand, revOverride = null, b11Override = null) => {
        const rev = revOverride !== null ? revOverride : isRevolution;
        const b11 = b11Override !== null ? b11Override : is11Back;
        return [...hand].sort((a, b) => {
          if (a.strength === 13) return 1;
          if (b.strength === 13) return -1;
          const isInverse = rev !== b11;
          return isInverse ? b.strength - a.strength : a.strength - b.strength;
        });
      };

      const getNextPlayer = (current, steps = 1, forceDirection = null, currentRanks = null) => {
        let count = 0;
        let next = current;
        const dir = forceDirection !== null ? forceDirection : playDirection;
        const ranks = currentRanks || ranksDiscovered;
        while (count < steps) {
          next = (next + dir + 4) % 4;
          if (!ranks.includes(next)) count++;
        }
        return next;
      };

      const executeNextTurn = (startIndex, steps = 1, forceDirection = null, excludeRanks = null) => {
        setIsActionLoading(false); // 次のターンへ行くときに必ず解除
        const nextTarget = getNextPlayer(startIndex, steps, forceDirection, excludeRanks);
        if (nextTarget === turn) {
          // 同一プレイヤーにターンが回る場合（8切り等）、思考フラグをリセット
          cpuThinkingRef.current = false;
          // useEffectを発火させるために一瞬-1にする（必要に応じて）
          setTurn(-1);
          setTimeout(() => setTurn(nextTarget), 10);
        } else {
          setTurn(nextTarget);
        }
      };

      const triggerClearFieldAnim = (callback) => {
        setIsAnimating(true);
        setIsCoffinOpen(true); // 棺桶を開く
        setTimeout(() => {
          callback();
          setIsAnimating(false);
          setTimeout(() => setIsCoffinOpen(false), 800); // 吸い込まれたら閉じる
        }, 1200);
      };

      const clearFieldLogic = (newGraveyard = null) => {
        let currentGy = newGraveyard || [...graveyard];
        let cardsOnly = tableCards.map(tc => tc.card);
        let historyCardsOnly = tableHistoryCards.map(tc => tc.card);
        let allFieldCards = [...historyCardsOnly, ...cardsOnly];

        if (allFieldCards.length > 0) {
          const isServiceAce = allFieldCards.every(c => c.rank === 'A');
          if (isServiceAce && lastPlayPlayer !== null && !ranksDiscovered.includes(lastPlayPlayer)) {
            const h = [...hands];
            h[lastPlayPlayer] = [...h[lastPlayPlayer], ...allFieldCards];
            setHands(h);
            showMessage('SERVICE ACE', `呪われたAが プレイヤー${lastPlayPlayer} の手元へ帰還`);
          } else {
            // ここでアニメーション用に discardingToGy をセットする
            setDiscardingToGy(allFieldCards);
            setTimeout(() => setDiscardingToGy([]), 800);
            currentGy = [...currentGy, ...allFieldCards];
          }
        }
        // Plus 5 combo check for clear field logic
        const isPlus5Combo = tableCards.length === 2 && tableCards.some(tc => tc.card.rank === '5');
        if (isPlus5Combo) {
          setIsPlus5Active(true);
          setTimeout(() => setIsPlus5Active(false), 3000);
        }
        setTableCards([]);
        setTableHistoryCards([]);
        setPassedPlayers([]);
        setIsShielded([false, false, false, false]);
        setIs11Back(false);
        setGraveyard(currentGy);
        return currentGy;
      };

      const executePass = (playerIndex) => {
        const activePlayersCount = 4 - ranksDiscovered.length;
        const newPassCount = passCount + 1;

        // 場に出ているカードがあり、自分以外の全員がパスした場合
        if (newPassCount >= activePlayersCount - 1 && tableCards.length > 0) {
          triggerClearFieldAnim(() => {
            const updatedGy = clearFieldLogic();
            let nextStarter = lastPlayPlayer;
            // 既に上がっている場合は次のプレイヤーから開始
            const currentRanks = ranksDiscovered; // 呼び出し時点の最新
            if (currentRanks.includes(nextStarter)) {
              nextStarter = getNextPlayer(nextStarter, 1, null, currentRanks);
            }
            // 自動的に次の手番を開始
            setTurn(-1);
            setTimeout(() => {
              setTurn(nextStarter);
              if (multiplayerMode === 'active' && isHost) {
                broadcastState(hands, nextStarter, {
                  table_cards: [],
                  graveyard: updatedGy,
                  pass_count: 0,
                  is_11back: false,
                  is_shielded: [false, false, false, false],
                  special_effects: { passed_players: [] }
                });
              }
            }, 10);
          });
        } else {
          const nextPassedPlayers = [...new Set([...passedPlayers, playerIndex])];
          setPassCount(newPassCount);
          setPassedPlayers(nextPassedPlayers);

          // 残り1人かチェック
          const remaining = [0, 1, 2, 3].filter(p => !ranksDiscovered.includes(p));
          if (ranksDiscovered.length === 3 && remaining.length === 1) {
            const lastP = remaining[0];
            const finalRanks = [...ranksDiscovered, lastP];
            setRanksDiscovered(finalRanks);
            setRoundResults(finalRanks);
            setIsGameOver(true);
            setTurn(-1);
            if (sm.playJBackSE) sm.playJBackSE();
            
            if (multiplayerMode === 'active' && isHost) {
              broadcastState(hands, -1, {
                pass_count: newPassCount,
                ranks_discovered: finalRanks,
                special_effects: { passed_players: nextPassedPlayers }
              });
            }
            return;
          }

          // Hostの場合、ここで同期を行う
          if (multiplayerMode === 'active' && isHost) {
            const nextTarget = getNextPlayer(playerIndex, 1, null, ranksDiscovered);
            broadcastState(hands, nextTarget, {
              pass_count: newPassCount,
              special_effects: { passed_players: nextPassedPlayers }
            });
          }

          executeNextTurn(playerIndex, 1, null, ranksDiscovered);
        }
      };

      const isValidPlay = (cardsToPlay) => {
        if (cardsToPlay.length === 0) return false;

        // Check for Plus 5 combination (5 + one card from {A, 2, 3, 4, 6, 7, 8})
        if (cardsToPlay.length === 2 && (tableCards.length === 0 || tableCards.length === 1)) {
          const has5 = cardsToPlay.some(c => c.rank === '5');
          if (has5) {
            const other = cardsToPlay.find(c => c.rank !== '5') || cardsToPlay[0];
            const allowed = ['A', '2', '3', '4', '5', '6', '7', '8'];
            if (allowed.includes(other.rank)) {
              // Valid Plus 5! Calculate effective strength
              let effectiveStrength = 13;
              if (other.rank === '5' && cardsToPlay[0].rank === '5') {
                 // 5 + 5 result in rank 10
                 effectiveStrength = RANKS.indexOf('10');
              } else {
                 const total = rankToValue(other.rank) + 5;
                 const resRank = valueToRank(total);
                 effectiveStrength = RANKS.indexOf(resRank);
              }
              if (tableCards.length === 0) return true;
              const tableStrength = tableCards[0].card.strength;
              return compareStrength(effectiveStrength, tableStrength);
            }
          }
        }

        // JOKERのワイルドカード判定
        const nonJokers = cardsToPlay.filter(c => c.rank !== 'Joker');
        let effectiveStrength = 13;

        if (nonJokers.length > 0) {
          const firstRank = nonJokers[0].rank;
          if (!nonJokers.every(c => c.rank === firstRank)) return false;
          effectiveStrength = nonJokers[0].strength;
        }

        const tableEffectiveCount = getEffectiveCount(tableCards.map(tc => tc.card));
        const playEffectiveCount = getEffectiveCount(cardsToPlay);

        if (tableCards.length === 0) return true;
        if (playEffectiveCount !== tableEffectiveCount) return false;

        const tableStrength = tableCards[0].card.strength;
        return compareStrength(effectiveStrength, tableStrength);
      };

      const evaluateSpecialEffects = (playerIndex, playedCards, currentHands, currentGraveyard) => {
        let title = ''; let desc = ''; let steps = 1; let pDir = playDirection;
        let gy = [...currentGraveyard]; let h = [...currentHands];
        let shieldStates = [...isShielded]; let is11B = is11Back; let isFieldCleared = false;
        let isRev = isRevolution; 
        let isAsync = false; // Add this flag
        let selectionRequired = null;
        let selectionInfoObj = null;

        let nonJokers = playedCards.filter(c => c.rank !== 'Joker');
        let effectiveRank = nonJokers.length > 0 ? nonJokers[0].rank : 'Joker';
        
        // Plus 5 override rank
        if (playedCards.length === 2 && playedCards.some(c => c.rank === '5')) {
          const other = playedCards.find(c => c.rank !== '5');
          if (other && ['A', '2', '3', '4', '6', '7', '8'].includes(other.rank)) {
             const total = rankToValue(other.rank) + 5;
             effectiveRank = valueToRank(total);
          } else if (!other) {
             // 5+5
             effectiveRank = '10_NO_EFFECT'; // Mark as no effect per user request
          }
        }

        const rank = effectiveRank;
        const count = playedCards.length; // JOKERを含む合計枚数で能力が変動
        const tcg = TCG_DATA[rank];

        if (tcg) {
          title = tcg.name;
          desc = tcg.desc || '';
          if (playedCards.some(c => c.rank === 'Joker') && nonJokers.length > 0) {
            title = `🃏真・${tcg.name}`;
            desc = `JOKERが ${rank} になり代わり、${count}連鎖の呪いが発動`;
          }
        } else if (rank === '10_NO_EFFECT') {
          title = 'プラス5'; // 「連鎖」を削除
          desc = '効果なし（ただの5の2枚出し）';
        }

        // 革命判定 (同時出しが4枚以上)
        if (playedCards.length >= 4) {
          isRev = !isRev;
          setIsRevolution(isRev);
          title = "革命 (REVOLUTION)";
          desc = isRev ? "世界の理が逆転" : "世界の理が元に復帰";
        }

        if (rank === '4') {
          shieldStates[playerIndex] = true;
        }

        if (rank === '6') {
          if (gy.length > 0) {
            setIsCoffinOpen(true); // 棺桶から蘇生
            triggerTempEffect(setPhoenixActive, 1500);
            const drawCount = Math.min(count, gy.length);
            let drawn = [];
            for (let i = 0; i < drawCount; i++) {
              const rIndex = Math.floor(Math.random() * gy.length);
              const card = gy.splice(rIndex, 1)[0];
              drawn.push(card);

              const newFly = { from: 'graveyard', to: playerIndex, card: { ...card, rank: '?' }, type: 'phoenix', id: Math.random() };
              sm.playPaperSE();
              setFlyingCards(prev => [...prev, newFly]);
              setIsAnimating(true);
              setTimeout(() => {
                setFlyingCards(prev => prev.filter(f => f.id !== newFly.id));
                h[playerIndex].push(card);
                setHands([...h]);
                setGyShuffling(true);
                setTimeout(() => {
                  setGyShuffling(false);
                  setIsAnimating(false);
                  if (i === drawCount - 1) setTimeout(() => setIsCoffinOpen(false), 500);
                  // Removed internal executeNextTurn call
                }, 1200); // 延長 (800 -> 1200)
              }, 1800 + i * 400); // 延長 (1200 -> 1800, 300 -> 400)
            }
            isAsync = true; // Mark as async
            title = `${tcg.name} x${count}`;
            desc = `死者${drawCount}名が冥界より帰還`;
            steps = 1;
          } else { title = tcg?.name; desc = '墓地が空のため蘇生失敗'; }
        }
        if (rank === '7') {
          if (h[playerIndex].length > 0) {
            const nextP = getNextPlayer(playerIndex, 1, pDir);
            if (shieldStates[nextP]) { triggerMiss(nextP); title = 'MISS'; desc = `呪文の壁が血の契約を拒絶した`; }
            else {
              triggerTempEffect(setPassThreadActive, 1000);
              if (!isCpuSlot(playerIndex)) {
                selectionRequired = '7';
                selectionInfoObj = { playerIndex, nextP, count: Math.min(count, h[playerIndex].length), isSpecialEffect: true };
                steps = 0;
              } else {
                const passCount = Math.min(count, h[playerIndex].length);
                let passed = [];
                for (let i = 0; i < passCount; i++) {
                  const cIndex = Math.floor(Math.random() * h[playerIndex].length);
                  const card = h[playerIndex].splice(cIndex, 1)[0];
                  passed.push(card);

                  // 7渡し：裏向きで移動させる
                  const newFly = { from: playerIndex, to: nextP, card: { ...card, rank: '?' }, type: 'pass', id: Math.random() };
                  setFlyingCards(prev => [...prev, newFly]);
                  setIsAnimating(true);
                  setTimeout(() => {
                    setFlyingCards(prev => prev.filter(f => f.id !== newFly.id));
                    h[nextP].push(card);
                    if (nextP === 0) {
                      setHighlightedCardIds(prev => [...prev, card.id]);
                      setTimeout(() => setHighlightedCardIds(prev => prev.filter(id => id !== card.id)), 4000);
                    }
                    setHands([...h]);
                    sm.playPaperSE();
                    setReceivedHighlight(nextP);
                    setTimeout(() => {
                      setReceivedHighlight(null);
                      setIsAnimating(false);
                      // 7渡しによる次手番への影響を最小限に（async終了後executeNextTurnが走る）
                    }, 1500);
                  }, 2000 + i * 500);
                }
                isAsync = true; // Mark as async
                title = `${tcg.name} x${count}`;
                desc = `契約により${passCount}枚の生贄を譲渡`;
                steps = 1; // 7の後、次は順当に次の人
              }
            }
          }
        }
        if (rank === '8') {
          isFieldCleared = true; steps = 0;
          triggerTempEffect(setGuillotineActive, 1200);
        }
        if (rank === '9') {
          pDir = pDir * -1;
          setPlayDirection(pDir); // 正しい状態更新関数名
          triggerTempEffect(setReverseActive, 1800);
        }
        if (rank === '10') {
          if (h[playerIndex].length > 0) {
            setIsAnimating(true);
            if (!isCpuSlot(playerIndex)) {
              selectionRequired = '10';
              selectionInfoObj = { playerIndex, count: Math.min(count, h[playerIndex].length), isSpecialEffect: true };
              steps = 0;
            } else {
              const dropCount = Math.min(count, h[playerIndex].length);
              let dropped = [];
              for (let i = 0; i < dropCount; i++) {
                const cIndex = Math.floor(Math.random() * h[playerIndex].length);
                const card = h[playerIndex].splice(cIndex, 1)[0];
                dropped.push(card);
              }
              gy.push(...dropped);
              setIsCoffinOpen(true); // 捨て逃げ
              setDiscardingToGy(dropped);
              setIsAnimating(true);
              isAsync = true; // Mark as async
              setTimeout(() => {
                setDiscardingToGy([]);
                 setGyShuffling(true);
                setTimeout(() => {
                  setGyShuffling(false);
                  setIsAnimating(false);
                  setTimeout(() => setIsCoffinOpen(false), 800);
                }, 1200);
              }, 1800);
              steps = 1;
            }
          }
        }
        if (rank === 'J') {
          is11B = true;
        }
        if (rank === 'Q') {
          const targetRank = RANKS[Math.floor(Math.random() * RANKS.length)];
          if (!isCpuSlot(playerIndex)) {
            selectionRequired = 'Q';
            // Qボンバーは枚数に応じて複数種類を選択できるように変更
            selectionInfoObj = { playerIndex, count };
            steps = 0;
          } else {
            triggerTempEffect(setBomberActive, 2000);
            let targetRanks = [];
            let rShuffled = [...RANKS].sort(() => Math.random() - 0.5);
            targetRanks = rShuffled.slice(0, count);

            let bombCount = 0;
            let tempH = [...h];
            let affectedPlayers = [];

            targetRanks.forEach(tr => {
              for (let i = 0; i < 4; i++) {
                if (shieldStates[i] && i !== playerIndex) { triggerMiss(i); continue; }
                const drop = h[i].filter(c => c.rank === tr);
                if (drop.length > 0) {
                  bombCount += drop.length;
                  gy.push(...drop);
                  tempH[i] = tempH[i].filter(c => c.rank !== tr);
                  if (!affectedPlayers.includes(i)) affectedPlayers.push(i);
                }
              }
            });

            setExplodingCards(affectedPlayers.map(pIdx => ({ playerIndex: pIdx, rank: targetRanks[0] })));
            setTimeout(() => {
              setExplodingCards([]);
              // Removed internal executeNextTurn call
            }, 2000);

            isAsync = true; // Mark as async
            h = tempH;
            title = `${tcg?.name} [${targetRanks.join(',')}] x${count}`;
            desc = `全領域から${bombCount}枚が灰燼に帰した`;
            triggerAbilityLog(`Qボンバー: ${targetRanks.join(',')}`);
          }
        }
        if (rank === 'K') {
          setIsAnimating(true);
          if (!isCpuSlot(playerIndex)) {
            selectionRequired = 'K';
            selectionInfoObj = { playerIndex, count };
            steps = 0;
          } else {
            const watchDuration = count * 5000;
            const others = [0, 1, 2, 3].filter(v => v !== playerIndex && !ranksDiscovered.includes(v));
            let rShuffled = [...others].sort(() => Math.random() - 0.5);
            let targets = rShuffled.slice(0, count);
            let validTargets = [];
            targets.forEach(t => {
                if (shieldStates[t]) { triggerMiss(t); }
                else { validTargets.push(t); }
            });
            if(validTargets.length === 0) {
               title = 'MISS'; desc = `呪文の壁が邪眼を弾いた`; setIsAnimating(false);
            } else {
              setWatchTarget({
                targetIndices: validTargets,
                activatorIndex: playerIndex,
                endTime: Date.now() + watchDuration
              });
              title = `${tcg.name} x${count}`; desc = `${watchDuration / 1000}秒間、魂の中身を暴き続ける`;
              setTimeout(() => {
                setWatchTarget(null);
                setIsAnimating(false);
                // Removed internal executeNextTurn call
              }, watchDuration);
            }
            isAsync = true; // Mark as async
          }
        }

        if (title) showMessage(title, desc);

        // Kウォッチ選択モードでない場合のみターンの処理を返す
        return { h, gy, shieldStates, is11B, isRev, isFieldCleared, steps: (rank === 'K' && !isCpuSlot(playerIndex)) ? 0 : steps, pDir, isAsync, selectionRequired, selectionInfo: selectionInfoObj };
      };

      const executePlay = (playerIndex, cards) => {
        if (playerIndex === 0) setIsActionLoading(true);

        const isPlus5Combo = cards.length === 2 && cards.some(c => c.rank === '5') && cards.some(c => c.rank !== '5');
        const nonJokers = cards.filter(c => c.rank !== 'Joker');
        let effectiveVisualRank = nonJokers.length > 0 ? nonJokers[0].rank : 'Joker';
        if (cards.length === 2 && cards.some(c => c.rank === '5')) {
          const other = cards.find(c => c.rank !== '5');
          if (other && ['A', '2', '3', '4', '6', '7', '8'].includes(other.rank)) {
             const total = rankToValue(other.rank) + 5;
             effectiveVisualRank = valueToRank(total);
          } else {
             effectiveVisualRank = '5_SOLO';
          }
        } else if (cards.length === 1 && cards[0].rank === '5') {
          effectiveVisualRank = '5_SOLO';
        }

        // マルチプレイ時の演出同期イベント送信
        if (multiplayerMode === 'active' && isHost && roomChannel) {
          roomChannel.send({
            type: 'broadcast',
            event: 'play_effect',
            payload: {
              playerIndex,
              cards,
              effectiveVisualRank,
              isPlus5Combo
            }
          });
        }

        runPlayAnimation(playerIndex, cards, effectiveVisualRank, isPlus5Combo, false);
      };

      const runPlayAnimation = (playerIndex, cards, effectiveVisualRank, isPlus5Combo, isGuest = false) => {
        sm.playPaperSE();

        const triggerCutIn = (rank, comboData = null) => {
          let tcg = TCG_DATA[rank];
          if (!tcg && rank !== '5_SOLO') return;

          let aura = tcg ? (tcg.auraColor || '#b8860b') : '#b8860b';
          let name = tcg ? tcg.name : '';
          let desc = tcg ? tcg.desc : '';
          let url = tcg ? tcg.url : '';

          if (rank === '5_SOLO') {
            const t5 = TCG_DATA['5'];
            tcg = t5;
            name = 'プラス5';
            desc = '単独での効果なし';
            url = t5.url;
            aura = '#f1c40f';
          }

          sm.playEffectSE(rank === '5_SOLO' ? '5' : (rank === '10_NO_EFFECT' ? '5' : rank));
          
          setCutIn({
            name: name,
            effect: desc,
            url: url,
            rank: (rank === '5_SOLO' ? '5' : (rank === '10_NO_EFFECT' ? '5' : rank)),
            auraColor: aura,
            comboData: comboData
          });
          
          const duration = 3000;
          setTimeout(() => setCutIn(null), duration);
        };

        if (isPlus5Combo) {
          const other = cards.find(c => c.rank !== '5');
          triggerCutIn('5', { otherRank: other?.rank, resultRank: effectiveVisualRank });
        } else {
          triggerCutIn(effectiveVisualRank);
        }

        if (!isGuest) {
          let newHands = [...hands];
          newHands[playerIndex] = newHands[playerIndex].filter(c => !cards.find(sc => sc.id === c.id));
          setHands(newHands);
          
          if (multiplayerMode === 'active' && isHost) {
            broadcastState(newHands);
          }
        }

        setTimeout(() => {
          if (sm.playSlamSE) sm.playSlamSE();

          const aura = TCG_DATA[effectiveVisualRank]?.auraColor || '#b8860b';
          setShockwave({ id: Date.now(), color: aura });
          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 500);

          if (isGuest) return;

          let styledTableCards = [];
          if (isPlus5Combo) {
             const resRank = effectiveVisualRank;
             const mergedCard = { id: `merged_${Date.now()}`, suit: 'Magic', rank: resRank, strength: RANKS.indexOf(resRank) };
             const finalPos = { top: '50%', left: '50%', transform: 'translate(-50%, -50%) scale(1.1) rotate(0deg)' };
             styledTableCards = [{
               card: mergedCard, isAnimating: true, isSlammed: true,
               initialStyle: { ...finalPos, transform: 'translate(-50%, -50%) scale(3.5) rotate(0deg)', opacity: 0 },
               targetStyle: { ...finalPos, opacity: 1 }
             }];
          } else {
             styledTableCards = cards.map((c, idx) => {
               const tgtLeft = `calc(50% + ${Math.random() * 60 - 30}px)`;
               const tgtTop = `calc(50% + ${Math.random() * 60 - 30}px)`;
               const tgtTransform = `translate(-50%, -50%) rotate(${Math.random() * 45 - 22}deg)`;
               return {
                 card: c, isAnimating: true, isSlammed: true,
                 initialStyle: { top: tgtTop, left: tgtLeft, transform: `${tgtTransform} scale(3.5)`, opacity: 0, marginLeft: 0 },
                 targetStyle: { top: tgtTop, left: tgtLeft, transform: tgtTransform, opacity: 1, marginLeft: 0 }
               };
             });
          }

          setTableHistoryCards(prev => [
            ...prev,
            ...tableCards.map(tc => ({ ...tc, isShadowed: true }))
          ]);
          setTableCards(styledTableCards);

          let newHands = [...hands];
          newHands[playerIndex] = newHands[playerIndex].filter(c => !cards.find(sc => sc.id === c.id));

          let currentGraveyard = [...graveyard];
          let steps = 1; let isFieldCleared = false;

          const effectRes = evaluateSpecialEffects(playerIndex, cards, newHands, currentGraveyard);

          newHands = effectRes.h; currentGraveyard = effectRes.gy;
          setIsShielded(effectRes.shieldStates); setIs11Back(effectRes.is11B);
          setIsRevolution(effectRes.isRev);
          setPlayDirection(effectRes.pDir); steps = effectRes.steps; isFieldCleared = effectRes.isFieldCleared;

          newHands = newHands.map(h => sortHand(h, effectRes.isRev, effectRes.is11B));
          setHands(newHands); setGraveyard(currentGraveyard);

          if (multiplayerMode === 'active' && isHost) {
            broadcastState(newHands, null, {
              table_cards: styledTableCards,
              graveyard: currentGraveyard,
              is_revolution: effectRes.isRev,
              is_11back: effectRes.is11B,
              is_shielded: effectRes.shieldStates,
              play_direction: effectRes.pDir,
              ranks_discovered: ranksDiscovered,
              last_play_player: playerIndex,
              pass_count: 0
            });
          }

          let updatedRanks = [...ranksDiscovered];
          newHands.forEach((h, idx) => {
            if (h.length === 0 && !updatedRanks.includes(idx)) {
              updatedRanks.push(idx);
            }
          });
          setRanksDiscovered(updatedRanks);

          if (isFieldCleared) {
            setTimeout(() => {
              triggerClearFieldAnim(() => {
                const updatedGy = clearFieldLogic([...currentGraveyard, ...cards]);
                setLastPlayPlayer(playerIndex);

                let nextStarter = playerIndex;
                if (updatedRanks.includes(nextStarter)) {
                  nextStarter = getNextPlayer(nextStarter, 1, null, updatedRanks);
                }

                setTurn(-1);
                setTimeout(() => {
                  setTurn(nextStarter);
                  if (multiplayerMode === 'active' && isHost) {
                    broadcastState(newHands, nextStarter, {
                      table_cards: [],
                      graveyard: updatedGy,
                      last_play_player: playerIndex,
                      ranks_discovered: updatedRanks,
                      pass_count: 0
                    });
                  }
                }, 50);

              });
            }, 1800);
            return;
          } else {
            setPassCount(0);
            setLastPlayPlayer(playerIndex);
          }

          const totalAnimTime = 2000;

          setTimeout(() => {
            const stepsToUse = effectRes.isAsync ? 1 : steps;

            const remaining = [0, 1, 2, 3].filter(p => !updatedRanks.includes(p));
            if (updatedRanks.length >= 3) {
              let finalRanks = [...updatedRanks];
              if (remaining.length === 1) {
                finalRanks.push(remaining[0]);
              }
              setRanksDiscovered(finalRanks);
              setRoundResults(finalRanks);
              setIsGameOver(true);
              setTurn(-1);
              if (sm.playJBackSE) sm.playJBackSE();
              
              if (multiplayerMode === 'active' && isHost) {
                broadcastState(newHands, -1, {
                  table_cards: styledTableCards,
                  graveyard: currentGraveyard,
                  ranks_discovered: finalRanks,
                  last_play_player: playerIndex
                });
              }
              return;
            }

            const nextTarget = getNextPlayer(playerIndex, stepsToUse, effectRes.pDir, updatedRanks);
            
            if (effectRes.selectionRequired) {
              if (playerIndex === myPlayerIndex) {
                setSelectionMode(effectRes.selectionRequired);
                if (effectRes.selectionRequired === 'K') setWatchSelecting(true);
                setSelectionInfo(effectRes.selectionInfo);
                if (effectRes.selectionRequired === 'K') showMessage(TCG_DATA['K'].name, "監視対象を選択");
              }
              if (multiplayerMode === 'active' && isHost) {
                broadcastState(newHands, turn, {
                  table_cards: styledTableCards,
                  graveyard: currentGraveyard,
                  is_revolution: effectRes.isRev,
                  is_11back: effectRes.is11B,
                  is_shielded: effectRes.shieldStates,
                  play_direction: effectRes.pDir,
                  ranks_discovered: updatedRanks,
                  last_play_player: playerIndex,
                  pass_count: 0,
                  special_effects: { passed_players: passedPlayers, selection_request: { mode: effectRes.selectionRequired, ...effectRes.selectionInfo } }
                });
              }
              const tcg = TCG_DATA[effectiveVisualRank];
              if (tcg && tcg.name) triggerAbilityLog(`${tcg.name}`);
              return; // 選択完了時に executeNextTurn を呼ぶため、ここでは中断
            }

            if (multiplayerMode === 'active' && isHost) {
              broadcastState(newHands, nextTarget, {
                table_cards: styledTableCards,
                graveyard: currentGraveyard,
                is_revolution: effectRes.isRev,
                is_11back: effectRes.is11B,
                is_shielded: effectRes.shieldStates,
                play_direction: effectRes.pDir,
                ranks_discovered: updatedRanks,
                last_play_player: playerIndex,
                pass_count: 0
              });
            }
            
            const tcg = TCG_DATA[effectiveVisualRank];
            if (tcg && tcg.name) {
              triggerAbilityLog(`${tcg.name}`);
            }
            
            executeNextTurn(playerIndex, stepsToUse, effectRes.pDir, updatedRanks);
          }, totalAnimTime);
        }, 3000);
      };

      const playCpuTurn = () => {
        let hand = sortHand([...hands[turn]]);
        if (tableCards.length === 0) { executePlay(turn, [hand[0]]); cpuThinkingRef.current = false; return; }
        const tableEffectiveCount = getEffectiveCount(tableCards.map(tc => tc.card));
        const tableStrength = tableCards[0].card.strength;

        const groups = {};
        hand.forEach(c => {
          if (!groups[c.strength]) groups[c.strength] = [];
          groups[c.strength].push(c);
        });

        const strengthsKeys = Object.keys(groups).map(Number).sort((a, b) => {
          if (a === 13) return 1; if (b === 13) return -1;
          return is11Back ? b - a : a - b;
        });

        let foundPlay = null;
        for (let s of strengthsKeys) {
          if (compareStrength(s, tableStrength) && groups[s].length >= tableEffectiveCount) {
            foundPlay = groups[s].slice(0, tableEffectiveCount); break;
          }
        }

        if (foundPlay) {
          executePlay(turn, foundPlay);
        } else {
          // Plus 5 Fallback for CPU
          const tableEffectiveCount = getEffectiveCount(tableCards.map(tc => tc.card));
          if (tableEffectiveCount === 1) {
            const five = hand.find(c => c.rank === '5');
            if (five) {
              const allowed = ['A', '2', '3', '4', '6', '7', '8'];
              const others = hand.filter(c => c.id !== five.id && allowed.includes(c.rank));
              for (let o of others) {
                const total = rankToValue(o.rank) + 5;
                const resRank = valueToRank(total);
                const s = RANKS.indexOf(resRank);
                if (compareStrength(s, tableStrength)) {
                  foundPlay = [five, o];
                  break;
                }
              }
            }
          }
          
          if (foundPlay) {
            executePlay(turn, foundPlay);
          } else {
            const passWait = tableCards.length === 0 ? 500 : 100;
            setTimeout(() => executePass(turn), passWait);
          }
        }
        // 思考完了後はreset（次のsetTurn変化に委ねる）
        // cpuThinkingRef.current = false; // This will be reset by the useEffect when turn changes
      };

      const completeSpecialEffect = (choice, remotePlayerIdx = null, remoteMode = null, remoteInfo = null) => {
        const currentInfo = remoteInfo || selectionInfo;
        const currentMode = remoteMode || selectionMode;
        if (!currentInfo) return;

        const { playerIndex, nextP, count } = currentInfo;
        const actingIdx = remotePlayerIdx !== null ? remotePlayerIdx : playerIndex;
        if (multiplayerMode === 'active' && !isHost && remotePlayerIdx === null) {
          sendActionToHost({ action: 'COMPLETE_EFFECT', choice, mode: currentMode, info: currentInfo });
          setSelectionMode(null); setSelectionInfo(null); setSelectedCards([]);
          return;
        }
        if (actingIdx === myPlayerIndex) setIsActionLoading(true);

        // Host uses a consistent seed or broadcasts the randomness if needed, but for now we'll just broadcast the final state.
        let h = [...hands]; let gy = [...graveyard];

        if (currentMode === '7' || currentMode === '10') {
          const chosenCards = choice;
          if (chosenCards.length !== count) return;

          chosenCards.forEach((c, idx) => {
            const hIdx = h[playerIndex].findIndex(hc => hc.id === c.id);
            if (hIdx !== -1) {
              const card = h[playerIndex].splice(hIdx, 1)[0];
              if (currentMode === '7') {
                const newFly = { from: playerIndex, to: nextP, card: { ...card, rank: '?' }, type: 'pass', id: Math.random() };
                setFlyingCards(prev => [...prev, newFly]);
                setIsAnimating(true);
                setTimeout(() => {
                  setFlyingCards(prev => prev.filter(f => f.id !== newFly.id));
                  h[nextP].push(card);
                  if (nextP === 0) {
                    setHighlightedCardIds(prev => [...prev, card.id]);
                    setTimeout(() => setHighlightedCardIds(prev => prev.filter(id => id !== card.id)), 4000);
                  }
                  setHands([...h]);
                  sm.playPaperSE();
                  setReceivedHighlight(nextP);
                  setTimeout(() => {
                    setReceivedHighlight(null);
                    setIsAnimating(false);
                  }, 1500); // 延長
                }, 1800 + idx * 500); // 延長
              } else {
                gy.push(card);
                setDiscardingToGy(prev => [...prev, card]);
                setIsAnimating(true);
                setIsCoffinOpen(true); // 棺桶を開く
                setTimeout(() => {
                  setDiscardingToGy([]);
                  setGyShuffling(true);
                  setTimeout(() => {
                    setGyShuffling(false);
                    setIsAnimating(false);
                    setTimeout(() => setIsCoffinOpen(false), 800);
                  }, 1200); // 延長 (800 -> 1200)
                }, 1800 + idx * 200); // 延長 (1200 -> 1800)
              }
            }
          });
        }
        if (currentMode === 'Q') {
          // Qは複数ランクの配列を受け取れるように
          const targetRanks = Array.isArray(choice) ? choice : [choice];
          triggerTempEffect(setBomberActive, 1800);
          setIsAnimating(true);
          let totalBombCount = 0; let tempH = [...h];
          let affectedPlayers = [];

          targetRanks.forEach(targetRank => {
            for (let i = 0; i < 4; i++) {
              if (isShielded[i] && i !== playerIndex) { triggerMiss(i); continue; }
              const drop = h[i].filter(c => targetRank === 'Joker' ? (c.suit === 'Joker' || c.rank === 'Joker') : c.rank === targetRank);
              if (drop.length > 0) {
                totalBombCount += drop.length;
                gy.push(...drop);
                tempH[i] = tempH[i].filter(c => targetRank === 'Joker' ? !(c.suit === 'Joker' || c.rank === 'Joker') : c.rank !== targetRank);
                if (!affectedPlayers.includes(i)) affectedPlayers.push(i);
              }
            }
          });

          setExplodingCards(affectedPlayers.map(pIdx => ({ playerIndex: pIdx, rank: targetRanks[0] })));
          setIsCoffinOpen(true); // 爆発を収納
          setTimeout(() => {
            setExplodingCards([]);
            setGyShuffling(true);
            setTimeout(() => {
              setGyShuffling(false);
              setIsAnimating(false);
              setTimeout(() => setIsCoffinOpen(false), 800);
            }, 1200);
          }, 2500);
          h = tempH;
          showMessage(`Ｑボンバー [${targetRanks.join(',')}]`, `全領域から${totalBombCount}枚が消滅`);
        }

        if (currentMode === 'K') {
          const targetIndices = Array.isArray(choice) ? choice : [choice];
          const watchDuration = (currentInfo.count || 1) * 5000;
          setWatchTarget({
            targetIndices: targetIndices,
            activatorIndex: actingIdx,
            endTime: Date.now() + watchDuration
          });
          setHands(h); setGraveyard(gy); setSelectionMode(null); setSelectionInfo(null); setSelectedCards([]); setWatchSelectedIndices([]);
          if (isHost) broadcastState(h);

          setTimeout(() => {
            setWatchTarget(null);
            setIsAnimating(false);
            if (isHost) {
              const nextTarget = getNextPlayer(actingIdx, 1, playDirection, ranksDiscovered);
              broadcastState(h, nextTarget);
            }
            executeNextTurn(actingIdx, 1, playDirection);
          }, watchDuration);
          return;
        }

        setHands(h); setGraveyard(gy); setSelectionMode(null); setSelectionInfo(null); setSelectedCards([]);
        if (isHost) broadcastState(h);
        
        if (!watchSelecting) {
          // アニメーション完了（約2s）待機してから次へ進む
          if (actingIdx === myPlayerIndex) setIsActionLoading(true);
          // 0ではなく1を渡し、正しく次プレイヤーにターンが回るように修正
          setTimeout(() => {
            if (isHost) {
              const nextTarget = getNextPlayer(actingIdx, 1, playDirection, ranksDiscovered);
              broadcastState(h, nextTarget);
            }
            executeNextTurn(actingIdx, 1, playDirection);
          }, 2000);
        }
      };

      const handlePlay = () => {
        if (turn !== myPlayerIndex || selectionMode || isAnimating || watchTarget || watchSelecting || isActionLoading) return;
        const canPlay = selectedCards.length > 0;
        if (!canPlay) return;
        
        if (multiplayerMode === 'active' && !isHost) {
          sendActionToHost({ action: 'PLAY', cards: selectedCards });
          setSelectedCards([]);
          return;
        }

        setIsActionLoading(true);
        if (isValidPlay(selectedCards)) {
          executePlay(myPlayerIndex, selectedCards); setSelectedCards([]);
          if (isHost) broadcastState(hands);
        } else {
          showMessage('INVALID SACRIFICE', 'そのカードは場に出せない');
        }
      };

      const handlePass = () => {
        if (turn !== myPlayerIndex || isAnimating || watchTarget || watchSelecting || isActionLoading) return;
        
        if (multiplayerMode === 'active' && !isHost) {
          sendActionToHost({ action: 'PASS' });
          setSelectedCards([]);
          return;
        }

        setIsActionLoading(true);
        executePass(myPlayerIndex); setSelectedCards([]);
        if (isHost) broadcastState(hands);
      };

      const toggleRankSelect = (rank) => {
        const max = selectionInfo?.count || 1;
        if (selectedCards.includes(rank)) {
          setSelectedCards(prev => prev.filter(r => r !== rank));
        } else {
          if (selectedCards.length < max) {
            setSelectedCards(prev => [...prev, rank]);
          } else if (max === 1) {
            setSelectedCards([rank]);
          }
        }
      };

      const toggleSelect = (card) => {
        if (selectedCards.find(c => c.id === card.id)) setSelectedCards(selectedCards.filter(c => c.id !== card.id));
        else setSelectedCards([...selectedCards, card]);
      };

      // 動的なオーラと色付け
      // --- ゲーム終了・再開・交換 ロジック ---
      const startGame = (customHands = null, firstTurn = 0) => {
        setTableCards([]);
        setPassCount(0);
        setLastPlayPlayer(null);
        setRanksDiscovered([]);
        setGraveyard([]);
        setIsShielded([false, false, false, false]);
        setIs11Back(false);
        setIsRevolution(false);
        setPlayDirection(1);
        setPassedPlayers([]);
        setIsGameOver(false);
        setExchangePhase(null);
        setExchangeDecisions({});

        if (customHands) {
          setHands(customHands);
          setTurn(firstTurn);
        } else {
          const deck = shuffle(createDeck());
          const newHands = [[], [], [], []];
          let i = 0;
          while (deck.length > 0) {
            newHands[i % 4].push(deck.pop());
            i++;
          }
          setHands(newHands.map(h => sortHand(h)));
          setTurn(0);
        }
        setIsDealing(true);
        setTimeout(() => setIsDealing(false), 2000);
        setGameStarted(true);
        sm.playGameBGM();
      };

      const handleRestart = () => {
        if (multiplayerMode === 'active' && !isHost) {
          sendActionToHost({ action: 'RESTART' });
          return;
        }

        // 新しいカードを配る
        const deck = shuffle(createDeck());
        const newHands = [[], [], [], []];
        let i = 0;
        while (deck.length > 0) {
          newHands[i % 4].push(deck.pop());
          i++;
        }
        const sortedHands = newHands.map(h => sortHand(h));

        // 交換フェーズへ
        setHands(sortedHands);
        setTableCards([]);
        setPassCount(0);
        setLastPlayPlayer(null);
        setRanksDiscovered([]);
        setGraveyard([]);
        setIsShielded([false, false, false, false]);
        setIs11Back(false);
        setIsRevolution(false);
        setPlayDirection(1);
        setPassedPlayers([]);
        setIsGameOver(false);
        setExchangePhase('selecting');
        setSelectedCards([]);

        // NPCの交換カードを即座に決定
        const decisions = {};
        [0, 1, 2, 3].forEach(pIdx => {
          const rankPos = roundResults.indexOf(pIdx) + 1; // 1:大富豪, 2:富豪, 3:貧民, 4:大貧民
          // マルチプレイ時は、接続プレイヤー以外のスロットをCPUとして扱う
          const isCpu = isCpuSlot(pIdx);
          if (isCpu) {
            if (rankPos === 1) decisions[pIdx] = sortedHands[pIdx].slice(0, 2);
            if (rankPos === 2) decisions[pIdx] = sortedHands[pIdx].slice(0, 1);
            if (rankPos === 3) decisions[pIdx] = sortedHands[pIdx].slice(-1);
            if (rankPos === 4) decisions[pIdx] = sortedHands[pIdx].slice(-2);
          }
        });
        setExchangeDecisions(decisions);
        if (isHost) broadcastState(sortedHands);
      };

      const confirmExchange = () => {
        if (exchangePhase !== 'selecting') return;

        if (multiplayerMode === 'active' && !isHost) {
          const p0Rank = roundResults.indexOf(myPlayerIndex) + 1;
          let exchangeCards = [];
          if (p0Rank <= 2) exchangeCards = selectedCards;
          else if (p0Rank === 3) exchangeCards = hands[myPlayerIndex].slice(-1);
          else if (p0Rank === 4) exchangeCards = hands[myPlayerIndex].slice(-2);
          
          sendActionToHost({ action: 'CONFIRM_EXCHANGE', cards: exchangeCards });
          setExchangePhase('animating'); // Wait for host to execute
          return;
        }

        setExchangePhase('animating');

        const h = [...hands];
        const newFlying = [];
        const finalDecisions = { ...exchangeDecisions };

        // プレイヤー0の決定
        const p0Rank = roundResults.indexOf(0) + 1;
        if (p0Rank === 1 || p0Rank === 2) {
          finalDecisions[0] = selectedCards;
        } else if (p0Rank === 3) {
          finalDecisions[0] = h[0].slice(-1);
        } else if (p0Rank === 4) {
          finalDecisions[0] = h[0].slice(-2);
        }

        // 交換実行
        const daifugo = roundResults[0];
        const fugo = roundResults[1];
        const hinmin = roundResults[2];
        const daihinmin = roundResults[3];

        const pairs = [
          { from: daifugo, to: daihinmin, cards: finalDecisions[daifugo] },
          { from: daihinmin, to: daifugo, cards: finalDecisions[daihinmin] },
          { from: fugo, to: hinmin, cards: finalDecisions[fugo] },
          { from: hinmin, to: fugo, cards: finalDecisions[hinmin] }
        ];

        pairs.forEach(pair => {
          pair.cards.forEach(c => {
            const idx = h[pair.from].findIndex(hc => hc.id === c.id);
            if (idx !== -1) {
              h[pair.from].splice(idx, 1);
              newFlying.push({ from: pair.from, to: pair.to, card: c, type: 'pass', id: Math.random() });
            }
          });
        });

        setFlyingCards(newFlying);
        sm.playPaperSE();

        setTimeout(() => {
          pairs.forEach(pair => {
            pair.cards.forEach(c => {
              h[pair.to].push(c);
            });
            h[pair.to] = sortHand(h[pair.to]);
          });
          setHands([...h]);
          setFlyingCards([]);
          setExchangePhase(null);
          setSelectedCards([]);
          // 大貧民から開始
          setTurn(daihinmin);
          setIsDealing(true);
          setTimeout(() => setIsDealing(false), 1000);
        }, 2000);
      };

      const isCpuSlot = (playerIdx) => {
        if (multiplayerMode === 'active') {
          const hasRealPlayer = lobbyPlayers.some(lp => lp.seat_index === playerIdx);
          return !hasRealPlayer;
        }
        return playerIdx !== 0;
      };

      const getPlayerName = (playerIdx) => {
        if (multiplayerMode === 'active' || multiplayerMode === 'lobby') {
          const p = lobbyPlayers.find(lp => lp.seat_index === playerIdx);
          if (p) {
            return p.player_id === myProfile?.id ? 'YOU' : (p.profiles?.display_name || 'GHOST');
          }
        }
        const isMe = multiplayerMode === 'active' ? playerIdx === myPlayerIndex : playerIdx === 0;
        return isMe ? 'YOU' : `CPU ${playerIdx}`;
      };

      const getCardClass = (c) => {
        if (c.hidden) return "card back";
        let cls = `card ${c.suit === '♥' || c.suit === '♦' ? 'red' : (c.suit === 'Joker' ? 'joker' : '')}`;
        // Aura effect mapping loosely based on ability
        if (c.rank === '4') cls += ' aura-shield';
        if (c.rank === '6' || c.rank === '10' || c.rank === 'Q') cls += ' aura-fire';
        if (c.rank === '8') cls += ' aura-dark';
        if (c.rank === 'A' || c.rank === 'K') cls += ' aura-gold';
        return cls;
      };

      const renderFanHand = (handContent, playerIdx, isFaceUp = false) => {
        const total = handContent.length;
        const isBeingWatchedByMe = watchTarget?.targetIndices?.includes(playerIdx) && watchTarget?.activatorIndex === myPlayerIndex;
        // Kウォッチ時は横に広がりすぎないようさらに角度を制限
        let maxAngle = isBeingWatchedByMe ? Math.min(25, total * 2.5) : Math.min(60, total * 4);
        if (isMobile && isBeingWatchedByMe) {
          maxAngle = Math.min(40, total * 4); // スマホ監視時はタイトにしない（視認性優先）
        }
        const angleStep = total > 1 ? maxAngle / (total - 1) : 0;
        const startAngle = -maxAngle / 2;

        const rankIdx = ranksDiscovered.indexOf(playerIdx);
        const hierarchy = rankIdx !== -1 ? getHierarchyTitle(rankIdx + 1) : null;
        const isDead = rankIdx !== -1;

        return (
          <div key={playerIdx}
            className={`player-area player-${playerIdx} ${turn === playerIdx ? 'active-turn' : ''} ${watchSelecting && playerIdx !== myPlayerIndex && !isDead ? 'watch-clickable' : ''}`}
            onTouchStart={handleTouchStart}
            onTouchMove={(e) => handleTouchMove(e, playerIdx)}
            onTouchEnd={handleTouchEnd}
            onClick={() => {
              if (isSwipingRef.current) return; // スワイプ後の誤爆防止
              if (watchSelecting && playerIdx !== myPlayerIndex && !isDead) {
                const maxSelect = selectionInfo?.count || 1;
                let newSelected = [...watchSelectedIndices];
                if (newSelected.includes(playerIdx)) {
                    newSelected = newSelected.filter(id => id !== playerIdx);
                } else if (newSelected.length < maxSelect) {
                    newSelected.push(playerIdx);
                }
                setWatchSelectedIndices(newSelected);
              }
            }}
          >
            {isShielded[playerIdx] && <div className={`shield-aura ${missEffectTarget === playerIdx ? 'shield-miss' : ''}`}></div>}
            {skipTarget === playerIdx && <div className="skip-chains"></div>}
            {explodingCards.find(ec => ec.playerIndex === playerIdx) && (
              <div className="exploding-card" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '200px', height: '200px', background: 'radial-gradient(circle, #f00, transparent)', borderRadius: '50%', zIndex: 600 }}></div>
            )}

            {watchSelectedIndices.includes(playerIdx) && <div className="selected-aura" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '3px solid red', borderRadius: '10px', zIndex: 100 }}></div>}
            {/* Kウォッチ確認中表示 */}
            {watchTarget && watchTarget.activatorIndex !== playerIdx && !watchTarget.targetIndices?.includes(playerIdx) && (
              <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.85)', color: '#f8d56a', padding: '4px 12px', borderRadius: '4px', fontFamily: '"Cinzel", serif', fontSize: '0.85rem', letterSpacing: '0.1em', border: '1px solid rgba(184,134,11,0.4)', whiteSpace: 'nowrap', zIndex: 300 }}>
                確認中...
              </div>
            )}
            {watchTarget && watchTarget.targetIndices?.includes(playerIdx) && (
              <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(60,0,0,0.9)', color: '#ff6060', padding: '4px 12px', borderRadius: '4px', fontFamily: '"Cinzel", serif', fontSize: '0.85rem', letterSpacing: '0.1em', border: '1px solid rgba(180,0,0,0.5)', whiteSpace: 'nowrap', zIndex: 300 }}>
                監視中
              </div>
            )}
            {handContent.map((c, i) => {
              const rot = startAngle + i * angleStep;
              const trY = Math.abs(rot) * 0.8;
              const isSelected = selectedCards.find(sc => sc.id === c.id);
              const tcg = !c.hidden ? TCG_DATA[c.rank] : null;
              const aura = tcg?.auraColor || '#b8860b';
              const dealDelay = isDealing ? `${(i + playerIdx * 10) * 0.04}s` : '0s';
              let varStyle = {};

              if (isFaceUp && !c.hidden) {
                const isHighlighted = highlightedCardIds.includes(c.id);
                let transformStyle = `translateX(calc(-50% + var(--spread-x, 0px))) rotate(${rot}deg) translateY(${trY}px)`;
                let marginLeftStyle = `${(i - total / 2) * 40}px`;
                
                if (isMobile && (playerIdx === 0 || isBeingWatchedByMe)) {
                  // 監視中または自分の手札：画面幅を広く使って視認性を確保
                  const maxLocalWidth = (playerIdx === 0 || isBeingWatchedByMe) ? window.innerWidth * 0.95 : (isMobile ? 180 : 300); 
                  const cardWidth = (isMobile && playerIdx === 0) ? 85 : 65; 
                  // 監視中は大幅に広げる (cap: 50)
                  const cap = isBeingWatchedByMe ? 50 : 30;
                  const spacing = Math.min(cap, (maxLocalWidth - cardWidth) / Math.max(1, total - 1));
                  const offset = (i - (total - 1) / 2) * spacing;
                  
                  let ty = isSelected ? trY - 15 : trY;
                  transformStyle = `translateX(calc(-50% + ${offset}px)) rotate(${rot}deg) translateY(${ty}px)`;
                  marginLeftStyle = `0px`;
                  // Enforce this style on mobile selection to avoid CSS !important overrides
                  varStyle = { ...varStyle, '--mobile-transform': transformStyle };
                } else {
                  // Fallback for non-mobile or unselected
                  varStyle = { ...varStyle, '--mobile-transform': transformStyle };
                }

                let zIndexStyle = i + 1;
                // zIndexStyle += 500; // 前後関係を維持するため選択時のブーストを廃止

                return (
                  <div key={c.id}
                    data-card-id={c.id}
                    className={`${getCardClass(c)} selectable ${isSelected ? (isMobile ? 'mobile-selected' : 'selected') : ''} ${isHighlighted ? 'received-highlight' : ''} ${isDealing ? 'dealing' : ''}`}
                    style={{
                      '--rot': `${rot}deg`, '--trY': `${trY}px`,
                      '--card-aura': aura,
                      '--deal-delay': dealDelay,
                      ...varStyle,
                      transform: transformStyle,
                      left: `50%`, marginLeft: marginLeftStyle, zIndex: zIndexStyle,
                      borderColor: aura,
                      boxShadow: `0 0 10px ${aura}, 0 5px 12px rgba(0,0,0,0.9)`
                    }}
                    onClick={() => {
                      if (isDead) return;
                      const p0Rank = roundResults ? roundResults.indexOf(0) + 1 : 0;
                      const canExchangeSelect = exchangePhase === 'selecting' && playerIdx === 0 && (p0Rank === 1 || p0Rank === 2);
                      if ((turn === playerIdx && !selectionMode && !exchangePhase) || (selectionMode && playerIdx === 0) || canExchangeSelect) {
                        sm.playLightPaperSE();
                        toggleSelect(c);
                      }
                    }}
                    onMouseEnter={() => {
                      if (playerIdx === 0 && !isDead) sm.playLightPaperSE();
                    }}
                  >
                    <div className="card-rank">{c.rank === 'Joker' ? 'J' : c.rank}</div>
                    <div className="tcg-art" style={{ backgroundImage: tcg?.url ? `url(${tcg.url})` : '', backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', width: '100%', height: '100%', borderRadius: '4px' }}></div>
                    {tcg?.desc && <div className="tcg-tooltip">{tcg.desc}</div>}
                    {isHighlighted && <div className="highlight-frame"></div>}
                  </div>
                );
              } else {
                return (
                  <div key={`back-${i}`}
                    className={`card back ${isDealing ? 'dealing' : ''}`}
                    style={{
                      '--deal-delay': dealDelay,
                      transform: `translateX(-50%) rotate(${rot}deg) translateY(${trY}px)`,
                      left: `50%`, marginLeft: `${(i - total / 2) * 15}px`, zIndex: i + 1
                    }}
                  ></div>
                );
              }
            })}

            {passedPlayers.includes(playerIdx) && (
              <div className="player-pass-label">PASS</div>
            )}

            <div className="hand-count-badge">{hands[playerIdx].length}</div>
            
            <div className="player-status" style={isMobile && playerIdx !== 0 ? { position: 'absolute', top: '-15px', bottom: 'auto', height: 'auto', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', minWidth: 'max-content', zIndex: 100, fontSize: '10px', padding: '2px 6px' } : {}}>
              {getPlayerName(playerIdx)}
              {hierarchy && <span className={`rank-badge ${hierarchy.cls}`}>{hierarchy.title}</span>}
            </div>
          </div>
        );
      };

      const startDealAnimation = () => {
        // 1人プレイ用の開始処理
        startGame();
      };

      React.useEffect(() => {
        gameStateRef.current = {
          turn,
          isAnimating,
          isValidPlay,
          executePlay,
          executePass,
          completeSpecialEffect,
          setExchangeDecisions,
          isGameOver,
          handleRestart,
          runPlayAnimation,
          myPlayerIndex,
          isHost
        };
      });

      return (
        <div id="game-root" className={`game-container ${(!gameStarted && multiplayerMode !== 'lobby') ? 'title-bg' : ''}`} onContextMenu={(e) => e.preventDefault()}>
          {(!gameStarted && multiplayerMode !== 'lobby') ? (
            <div className="title-screen">
              <div className="title-card-fan">
                {/* 
                  ユーザー要望: 
                  左側: 2を起点として時計回りに20度ずつ角度が変わる螺旋隊列 (Joker除外)
                  右側: エフェクト削除、揺れのみ、Qを右にずらす、3D角度の強調
                */}
                {(() => {
                  // 重複ゼロ：全14種類のカード（Joker, 2〜A）を1枚ずつのみ使用
                  // 軽量化：スマホ版は枚数を削減
                  const allRanks = isMobile ? ['2', 'Q', 'A', 'Joker', '8', 'K', 'J'] : ['K', '2', 'J', 'Q', 'A', '10', 'Joker', '3', '4', '5', '6', '7', '8', '9'];

                  // 座標マップ（画面中央からのpxオフセット）
                  // 画面端に寄り過ぎず、かつ左上・右下などの余白を埋めるバランス配置 (Max offset ~570px)
                  const posMap = [
                    { tx: -380, ty: 180, layer: 0 }, { tx: 420, ty: -120, layer: 0 }, // Layer 0 (K と 2)
                    { tx: -450, ty: -300, layer: 1 }, { tx: 480, ty: 320, layer: 1 }, // Layer 1 (J: 左上)
                    { tx: -180, ty: 450, layer: 1 }, { tx: 200, ty: -380, layer: 1 },  // Layer 1
                    { tx: -580, ty: 80, layer: 2 }, { tx: 540, ty: 100, layer: 2 },   // Layer 2
                    { tx: -320, ty: -460, layer: 2 }, { tx: 300, ty: 460, layer: 2 },  // Layer 2
                    { tx: -540, ty: -240, layer: 3 }, { tx: 520, ty: 250, layer: 3 },  // Layer 3
                    { tx: 80, ty: -520, layer: 3 }, { tx: -120, ty: 520, layer: 3 }     // Layer 3
                  ];

                  return allRanks.map((rank, idx) => {
                    const tcg = TCG_DATA[rank];
                    const scaleX = isMobile ? 0.33 : 1.0;
                    const scaleY = isMobile ? 0.6 : 1.0;
                    const sizeScale = isMobile ? 0.6 : 1.0;
                    const cfg = { ...posMap[idx], tx: posMap[idx].tx * scaleX, ty: posMap[idx].ty * scaleY };

                    // レイヤーごとの物理特性 (全ての回転を0degに固定して正対させる)
                    let baseScale, zIndex, blur, bright, dur, swayX, swayY, circleOp;
                    if (cfg.layer === 0) { // 最前面
                      baseScale = 1.35 * sizeScale;
                      zIndex = 500;
                      blur = "0px";
                      bright = 1.0;
                      dur = "7s";
                      swayX = "15px"; swayY = "-20px";
                      circleOp = 1;
                    } else if (cfg.layer === 1) { // 前方
                      baseScale = 0.65 * sizeScale;
                      zIndex = 400;
                      blur = "0.7px";
                      bright = 0.8;
                      dur = "10s";
                      swayX = "8px"; swayY = "-12px";
                      circleOp = 0.8;
                    } else if (cfg.layer === 2) { // 後方
                      baseScale = 0.42 * sizeScale;
                      zIndex = 300;
                      blur = "1.6px";
                      bright = 0.65;
                      dur = "14s";
                      swayX = "5px"; swayY = "-8px";
                      circleOp = 0;
                    } else { // 最背面 (最奥)
                      baseScale = 0.22 * sizeScale;
                      zIndex = 100;
                      blur = "3.2px";
                      bright = 0.5;
                      dur = "18s";
                      swayX = "3px"; swayY = "-5px";
                      circleOp = 0;
                    }

                    return (
                      <div key={rank} className="fan-item deep-field"
                        style={{
                          backgroundImage: `url(${tcg.url})`,
                          '--tx': `${cfg.tx}px`,
                          '--ty': `${cfg.ty}px`,
                          '--rx': '0deg',
                          '--ry': '0deg',
                          '--rz': '0deg',
                          '--base-scale': baseScale,
                          '--bright': bright,
                          '--blur': blur,
                          '--dur': dur,
                          '--delay': `-${(idx * 1.5).toFixed(1)}s`,
                          '--sway-x': swayX,
                          '--sway-y': swayY,
                          '--circle-op': circleOp,
                          zIndex: zIndex
                        }}>
                        {circleOp > 0 && (
                          <div className="tcg-rank-circle" style={{ borderColor: tcg.auraColor }}>
                            <span>{rank === 'Joker' ? '🃏' : rank}</span>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
              <div className="title-overlay"></div>

              {/* プロフィール表示/編集UI */}
              <div className="profile-container" style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1002, background: 'radial-gradient(ellipse at center, #3a0000 0%, #110000 100%)', padding: '10px 20px', border: '2px solid var(--color-gold)', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '15px', fontFamily: 'var(--font-casino)', boxShadow: 'inset 0 0 5px #ffd700, 0 4px 10px rgba(0,0,0,0.8)' }}>
                {myProfile ? (
                  <>
                    <span style={{ color: '#ffd700', textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 5px rgba(255,215,0,0.5)', fontSize: '1.1rem', letterSpacing: '1px' }}>
                      👤 {myProfile.display_name}
                      <span style={{cursor: 'pointer', marginLeft: '12px', fontSize: '1.2rem', filter: 'drop-shadow(0 0 4px #ffd700)'}} onClick={() => setIsProfileModalOpen(true)}>⚜️</span>
                    </span>
                    <span style={{ color: 'var(--color-gold)', fontSize: '1.1rem', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>🏆 {myProfile.rating}</span>
                  </>
                ) : (
                  <span style={{ color: '#888' }}>接続中... <span style={{ fontSize: '10px' }}>(F12→コンソールでエラー確認)</span></span>
                )}
              </div>

              <div className="title-logo-container">
                <img src="logo.webp" alt="アルティメット大富豪" className="title-logo" />
              </div>

              <div className="title-button-container" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', position: 'absolute', bottom: '40px', width: '100%', zIndex: 1001, gap: '24px' }}>
                <button className="btn-start-game" onClick={startDealAnimation}>1人プレイ</button>
                <button className="btn-start-game" onClick={() => setMultiplayerMode('connecting')}>マルチプレイ</button>
                <button className="btn-start-game" onClick={() => setShowExplanation(true)}>カード説明</button>
              </div>

              {multiplayerMode === 'connecting' && (
                <div style={{ position: 'fixed', bottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '30px', width: '100%', boxSizing: 'border-box', zIndex: 10000 }}>
                  <div className="selection-guide" style={{ fontFamily: 'var(--font-casino)', color: '#ffd700', textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(255,215,0,0.6)', letterSpacing: '2px', fontSize: '1.1rem' }}>マルチプレイメニュー</div>
                  <div style={{ display: 'flex', flexDirection: 'row', gap: '24px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '1000px' }}>
                    <button className="btn-start-game" onClick={startMatchmaking}>レート戦 (RATING MATCH)</button>
                    <button className="btn-start-game" onClick={createRoom}>部屋を作る (CREATE ROOM)</button>
                    <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', minWidth: '320px' }}>
                      <input type="text" className="passphrase-input" placeholder="部屋コード..." 
                        value={passphrase} onChange={(e) => setPassphrase(e.target.value.toUpperCase().trim())} maxLength={5} 
                        style={{ flex: 1, boxSizing: 'border-box', background: '#0a0a0a', border: '2px solid var(--color-gold)', color: '#ffd700', padding: '14px', fontFamily: 'var(--font-casino)', textAlign: 'center', fontSize: '1.3rem', borderRadius: '4px', outline: 'none', boxShadow: 'inset 0 0 10px #000', textShadow: '0 0 5px rgba(255,215,0,0.3)' }} />
                      <button className="btn-start-game" style={{ width: 'auto', minWidth: '120px', padding: '14px' }} onClick={() => joinRoom(passphrase)}>入室</button>
                    </div>
                  </div>
                  <button className="btn-back" onClick={() => setMultiplayerMode(null)}>戻る</button>
                </div>
              )}

              {multiplayerMode === 'matchmaking' && (
                <div className="selection-overlay-ui">
                  <div className="selection-guide">対戦相手を探索中...</div>
                  <div style={{ color: 'var(--color-gold)', margin: '20px 0', fontSize: '18px', animation: 'pulse-gold 1s infinite alternate' }}>
                    ⏱️ 対戦相手を探しています。しばらくお待ちください...
                  </div>
                  <button className="action-btn btn-pass" onClick={cancelMatchmaking}>キャンセル</button>
                </div>
              )}

              {showExplanation && (
                <div className="explanation-overlay">
                  <div className="explanation-header">
                    <h2>カード能力一覧</h2>
                  </div>
                  <div className="explanation-list">
                    {['3','4','5','6','7','8','9','10','J','Q','K','A','2','Joker'].map(rank => {
                      const data = TCG_DATA[rank];
                      if (!data) return null;
                      return (
                        <div key={rank} className="explanation-item">
                          <div className="explanation-card-view" style={{ backgroundImage: `url(${data.url})` }}></div>
                          <div className="explanation-text">
                            <div className="explanation-card-name">{data.name}</div>
                            <div className="explanation-card-desc">{data.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button className="action-btn btn-pass btn-close-explanation" onClick={() => setShowExplanation(false)}>
                    閉じる
                  </button>
                </div>
              )}

              {isProfileModalOpen && (
                <div className="profile-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 20000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <div className="profile-modal-content" style={{ background: 'radial-gradient(ellipse at center, #6a0000 0%, #1a0000 80%, #000000 100%)', border: '3px solid var(--color-gold)', borderRadius: '4px', padding: '40px', width: '400px', maxWidth: '90vw', boxShadow: 'inset 0 0 20px #ffd700, 0 0 40px rgba(0,0,0,1)' }}>
                    <h2 style={{ fontFamily: 'var(--font-casino)', color: '#ffd700', textAlign: 'center', margin: '0 0 30px 0', textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(255,215,0,0.6)', letterSpacing: '2px' }}>プレイヤー名変更</h2>
                    <input type="text" value={myProfile?.display_name || ''} onChange={(e) => updateProfileName(e.target.value)} maxLength={12} placeholder="名前を入力..." style={{ width: '100%', boxSizing: 'border-box', background: '#0a0a0a', border: '2px solid var(--color-gold)', color: '#ffd700', padding: '15px', fontFamily: 'var(--font-casino)', textAlign: 'center', fontSize: '1.3rem', marginBottom: '30px', outline: 'none', boxShadow: 'inset 0 0 10px #000', textShadow: '0 0 5px rgba(255,215,0,0.3)' }} />
                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                      <button className="btn-start-game" style={{ padding: '12px 30px', minWidth: '120px', fontSize: '1rem' }} onClick={() => setIsProfileModalOpen(false)}>決定</button>
                      <button className="btn-back" style={{ padding: '12px 30px', minWidth: '120px', fontSize: '1rem' }} onClick={() => setIsProfileModalOpen(false)}>キャンセル</button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className={`table-container ${isShaking ? 'active-shake' : ''}`}>
              <button className="btn-exit-to-title" onClick={() => location.reload()}>退場</button>
              {multiplayerMode === 'lobby' && (
                <div className="selection-overlay-ui" style={{ zIndex: 6000 }}>
                  <div className="selection-guide">待機ロビー (部屋コード: {currentRoom?.room_code})</div>
                  <div className="player-lobby-list" style={{ margin: '20px 0', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto', width: '300px' }}>
                    {lobbyPlayers.map((p, idx) => (
                      <div key={idx} style={{ padding: '8px', background: 'rgba(255,255,255,0.1)', borderLeft: '3px solid var(--color-gold)', textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}>
                        <span>
                          {p.seat_index === 0 ? "👑 " : "💀 "} 
                          {p.profiles?.display_name || "GHOST"} {p.player_id === myProfile?.id ? "(あなた)" : ""}
                        </span>
                        <span style={{ color: 'var(--color-gold)' }}>🏆 {p.profiles?.rating}</span>
                      </div>
                    ))}
                    {Array.from({ length: 4 - lobbyPlayers.length }).map((_, i) => (
                      <div key={`empty-${i}`} style={{ padding: '8px', background: 'rgba(0,0,0,0.3)', color: '#555', borderLeft: '3px solid #333', textAlign: 'left' }}>
                        待機中 (CPU)
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    {isHost ? (
                      <button className="action-btn" onClick={startMultiplayerGame}>ゲームを開始</button>
                    ) : (
                      <div style={{ color: 'var(--color-gold)', animation: 'pulse-gold 1s infinite alternate' }}>ホストの開始を待機しています</div>
                    )}
                    <button className="action-btn btn-pass" onClick={leaveRoom}>退出</button>
                  </div>
                </div>
              )}

              <div className={`screen-filter ${is11Back ? 'filter-11back' : ''}`}></div>


              {/* 強さの逆転と順序逆転の永続的インジケーター表示 */}
              <div className={`bg-reverse-indicator ${playDirection === 1 ? 'spin-clockwise' : 'spin-counter-clockwise'}`}></div>
              <div className={`bg-jback-indicator ${is11Back ? 'active' : ''}`}></div>
              <div className={`bg-revolution-indicator ${isRevolution ? 'active' : ''}`}></div>

              {/* Flying Cards Animation Layer */}
          {abilityLog && <div className="ability-log-overlay">{abilityLog}</div>}
              {flyingCards.map(fc => {
                const start = fc.from === 'graveyard' ? { top: '50%', left: '85%' } : fc.from === 'deck' ? { top: '50%', left: '50%' } : getPlayerEdgePosition(fc.from);
                const end = getPlayerEdgePosition(fc.to);
                const isDeal = fc.type === 'deal';
                return (
                  <div key={fc.id} className={isDeal ? "deal-card-back" : "flying-card-back"} style={{
                    '--start-top': start.top,
                    '--start-left': start.left,
                    '--end-top': end.top,
                    '--end-left': end.left,
                    '--start-scale': isDeal ? 1 : 0.5,
                    '--end-scale': isDeal ? 1 : 0.8,
                    animation: `card-fly-back 0.8s ${fc.delay || 0}s both cubic-bezier(0.4, 0, 0.2, 1)`
                  }}>
                  </div>
                );
              })}

              {phoenixActive && <div className="phoenix-fire"></div>}
              {guillotineActive && <div className="guillotine"></div>}
              {reverseActive && <div className="reverse-arrows"></div>}
              {bomberActive && <div className="bomber-explode"></div>}
              {passThreadActive && <div className="pass-thread"></div>}
              {/* Character cut-in overlay (Dynamic Overhaul) */}
              {cutIn && (() => {
                const aura = cutIn.auraColor || '#b8860b';
                // Convert hex to RGB for rgba usage
                const hexToRgb = (hex) => {
                  const r = parseInt(hex.slice(1, 3), 16);
                  const g = parseInt(hex.slice(3, 5), 16);
                  const b = parseInt(hex.slice(5, 7), 16);
                  return `${r},${g},${b}`;
                };
                const rgb = hexToRgb(aura);
                const r = cutIn.rank;
                return (
                  <div className="cutin-container" style={{ '--aura': aura, '--aura-dim': `rgba(${rgb},0.35)` }}>
                    {cutIn.comboData ? (
                      <div className="cutin-merge-container">
                        <div className="merge-card-item m-card-5" style={{ backgroundImage: `url(${TCG_DATA['5'].url})` }}></div>
                        <div className="merge-card-item m-card-other" style={{ backgroundImage: `url(${TCG_DATA[cutIn.comboData.otherRank].url})` }}></div>
                        <div className="merge-card-item m-card-result" style={{ backgroundImage: `url(${TCG_DATA[cutIn.comboData.resultRank].url})`, borderColor: TCG_DATA[cutIn.comboData.resultRank].auraColor }}></div>
                      </div>
                    ) : (
                      <>
                        {/* 個別エフェクト描画 */}
                        {r === 'A' && <div className="effect-a-slash"></div>}
                        {r === '2' && <div className="effect-2-quake"></div>}
                        {r === '3' && <div className="effect-3-dust"></div>}
                        {r === '4' && <div className="effect-4-shield"></div>}
                        {r === '5' && cutIn.name !== 'プラス5' && cutIn.name !== '🃏真・プラス5' && <div className="effect-5-chain"></div>}
                        {r === '6' && <div className="effect-6-fire"></div>}
                        {r === '7' && <div className="effect-7-gold"></div>}
                        {r === '8' && <div className="effect-8-cut"></div>}
                        {r === '9' && <div className="effect-9-gear"></div>}
                        {r === '10' && <div className="effect-10-rain"></div>}
                        {r === 'J' && <div className="effect-j-reverse"></div>}
                        {r === 'Q' && <div className="effect-q-bomb"></div>}
                        {r === 'K' && <div className="effect-k-magic"></div>}
                        {r === 'Joker' && <div className="effect-joker-mist"></div>}
                      </>
                    )}

                    {cutIn.comboData && <div className="merge-flash-glow"></div>}

                    {/* Stage 4: Trigger standard character effects delayed by CSS if combo */}
                    <div style={{ 
                      animation: cutIn.comboData ? 'fadeIn 0.5s 3.0s forwards' : 'none', 
                      opacity: cutIn.comboData ? 0 : 1, 
                      width: '100%', height: '100%',
                      display: 'flex', justifyContent: 'center', alignItems: 'center' // Fix for non-combo centering
                    }}>
                      {/* 共通：パルスリング x2 */}
                      <div className="cutin-pulse-ring"></div>
                      <div className="cutin-pulse-ring"></div>

                      {/* 共通：上下スラッシュ */}
                      <div className="cutin-slash-top"></div>
                      <div className="cutin-slash-bottom"></div>

                      {/* カードポップアップ本体 */}
                      <div className="cutin-card-popup" style={r === '2' ? { animation: 'card-popup-in 0.5s forwards, screen-shake 0.5s ease-in-out' } : (cutIn.comboData ? { animation: 'card-popup-in 0.5s 3.0s forwards' } : {})}>
                        <div className="cutin-card-art" style={{ backgroundImage: `url(${TCG_DATA[cutIn.comboData ? cutIn.comboData.resultRank : r].url})` }}></div>

                        <div className="cutin-card-rank">
                          {r === 'Joker' ? '🃏' : (cutIn.comboData ? cutIn.comboData.resultRank : r)}
                        </div>

                        <div className="cutin-card-text">
                          <div className="cutin-card-name" style={isMobile ? { letterSpacing: '0px', whiteSpace: 'nowrap', width: '100%', textAlign: 'center', lineHeight: 1 } : (r === 'A' || r === 'Joker' ? { textAlign: 'center' } : {})}>
                             {cutIn.comboData ? TCG_DATA[cutIn.comboData.resultRank].name : cutIn.name}
                          </div>
                          {cutIn.effect && <div className="cutin-card-desc">{cutIn.comboData ? TCG_DATA[cutIn.comboData.resultRank].desc : cutIn.effect}</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 重複した墓地表示を削除 */}
              {/* メッセージオーバーレイ */}
              {animMessage.data && (
                <div className={`message-overlay ${animMessage.state}`}>
                  {animMessage.data.title}
                  {animMessage.data.desc && <p>{animMessage.data.desc}</p>}
                </div>
              )}

              {/* ターンと方向表示 */}
              <div style={{ position: 'absolute', top: isMobile ? '2px' : '30px', left: isMobile ? '2px' : '40px', zIndex: 200, color: '#ccc', fontFamily: "'Cinzel', serif", transform: isMobile ? 'scale(0.45)' : 'none', transformOrigin: 'top left', whiteSpace: 'nowrap' }}>
                TURN: <span style={{ color: turn === (multiplayerMode === 'active' ? myPlayerIndex : 0) ? 'var(--color-blood)' : '#fff' }}>{turn === -1 ? 'ENDED' : getPlayerName(turn)}</span>
                {(is11Back || isRevolution) && (
                  <span className="revolution-label" style={{ marginLeft: '15px', color: '#ff4444', fontWeight: 'bold', textShadow: '0 0 10px rgba(255,0,0,0.8)', fontSize: '0.9em' }}>
                    {isRevolution ? "REVOLUTION!!" : "J-BACK"}
                  </span>
                )}
                <div>Direction: {playDirection === 1 ? '➡' : '⬅'}</div>
              </div>

              {/* 新・棺桶型墓地システム */}
              <div className={`coffin-container ${isCoffinOpen ? 'open' : ''}`}
                onClick={() => { alert('GRAVEYARD:\n' + graveyard.map(c => c.suit + c.rank).join(', ')) }}>
                <div className="coffin-body">
                  <div className="coffin-inner-cards"></div>
                </div>
                <div className="coffin-lid"></div>
                <div className="coffin-count">† {graveyard.length} †</div>
              </div>

              {resurrectCard && (
                <div className={`card ${resurrectCard.suit === '♥' || resurrectCard.suit === '♦' ? 'red' : ''} resurrection-card`}
                  style={{ '--target-pos': resurrectCard.targetPos }}>
                  <div className="tcg-art" style={{ backgroundImage: TCG_DATA[resurrectCard.rank]?.url ? `url(${TCG_DATA[resurrectCard.rank].url})` : '' }}></div>
                  <div className="tcg-rank-circle"><span>{resurrectCard.rank}</span></div>
                </div>
              )}

              {discardingToGy.map((c, idx) => {
                /* ズラーっと順番に並んで吸い込まれる演出のため、開始少しだけずらすが、
                   軌道自体は大きく散らさず、遅延（delay）で「流れる列」を表現する */
                const delay = idx * 0.12;
                return (
                  <div key={`flying-${idx}`} className={`card ${c.suit === '♥' || c.suit === '♦' ? 'red' : ''} to-graveyard`}
                    style={{
                      position: 'fixed',
                      left: '50%',
                      top: '50%',
                      zIndex: 2000 + idx,
                      /* 初期位置のオフセットはテーブル上の元の配置を保つ程度にする */
                      '--start-x': `calc(-50% + ${(idx % 3) * 10 - 10}px)`,
                      '--start-y': `calc(-50% + ${Math.floor(idx / 3) * 10}px)`,
                      animationDelay: `${delay}s`
                    }}>
                    <div className="tcg-art" style={{ backgroundImage: TCG_DATA[c.rank]?.url ? `url(${TCG_DATA[c.rank].url})` : '' }}></div>
                    <div className="tcg-rank-circle"><span>{c.rank}</span></div>
                    <div className="tcg-name">{c.suit + c.rank}</div>
                  </div>
                );
              })}

              {[0, 1, 2, 3].map(pIdx => {
                const dispIdx = getDisplayIndex(pIdx);
                const posClass = dispIdx === 0 ? 'pos-bottom' : dispIdx === 1 ? 'pos-left' : dispIdx === 2 ? 'pos-top' : 'pos-right';
                const isActive = turn === pIdx;
                const isMe = pIdx === myPlayerIndex;

                return (
                  <div key={pIdx} className={`player-pos ${posClass} ${isActive ? 'active-turn' : ''}`}>
                    {(ranksDiscovered.includes(pIdx) || isGameOver) && (
                      <div className={`player-rank-label ${getHierarchyTitle(ranksDiscovered.indexOf(pIdx) + 1).cls}`}>
                        {getHierarchyTitle(ranksDiscovered.indexOf(pIdx) + 1).title}
                      </div>
                    )}
                    {renderFanHand(hands[pIdx], pIdx, isMe || isGameOver || (watchTarget?.targetIndices?.includes(pIdx) && watchTarget?.activatorIndex === myPlayerIndex))}
                  </div>
                );
              })}

              {/* K-Watch Hand View Overlay (Visible only to Player 0) */}
              {watchTarget && watchTarget.activatorIndex === 0 && (
                <div className="watch-overlay">
                  <button className="action-btn" onClick={() => {
                    setWatchTarget(null);
                    setIsAnimating(false);
                    if (isHost) {
                      const nextTarget = getNextPlayer(0, 1, playDirection, ranksDiscovered);
                      broadcastState(hands, nextTarget);
                    }
                    executeNextTurn(0, 1, playDirection);
                  }}>やめる</button>
                </div>
              )}

              {/* 中央のプレイエリア */}
              <div className="play-area">
                {clearingField && <div className="blackhole"></div>}

                {/* 豪華な衝撃波演出の描画 */}
                {shockwave && (
                  <div className="shockwave-container" key={shockwave.id} style={{ '--shock-color': shockwave.color }}>
                    <div className="shock-ring ring-1"></div>
                    <div className="shock-ring ring-2"></div>
                    <div className="shock-wave-flash"></div>
                    <div className="shock-particles">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="shock-particle" style={{ 
                          '--angle': `${i * 45}deg`,
                          '--delay': `${Math.random() * 0.15}s`,
                          '--speed': `${0.5 + Math.random() * 0.4}s`,
                          '--distance': `${70 + Math.random() * 50}px`
                        }}></div>
                      ))}
                    </div>
                  </div>
                )}

                {/* フィールド中央のステータス表示 */}
                {(isRevolution || is11Back) && (
                  <div className="field-status-label">{isRevolution ? "革命" : "Jバック"}</div>
                )}

                <div className="table-cards-container">
                  {[...tableHistoryCards, ...tableCards].map((item, idx) => {
                    const tcg = TCG_DATA[item.card.rank];
                    const aura = tcg?.auraColor || '#b8860b';
                    return (
                      <div key={`${item.card.id}-${idx}`}
                        className={`${getCardClass(item.card)} on-table ${item.isSlammed ? 'slammed' : ''} ${item.isSlammed ? 'effect-' + item.card.rank : ''} ${item.isShadowed ? 'shadowed-card' : ''}`}
                        style={{
                          ...(item.isAnimating ? item.initialStyle : item.targetStyle),
                          zIndex: idx,
                          '--card-aura': aura,
                          borderColor: aura,
                          boxShadow: item.isShadowed ? 'none' : `0 0 10px ${aura}, 0 5px 12px rgba(0,0,0,0.9)`
                        }}
                      >
                        <div className="tcg-art" style={{ backgroundImage: tcg?.url ? `url(${tcg.url})` : '' }}></div>
                        <div className="tcg-rank-circle" style={{ borderColor: aura, boxShadow: `0 0 8px ${aura}` }}>
                          <span>{item.card.rank}</span>
                        </div>
                        <div className="tcg-name">{tcg?.name || item.card.suit + item.card.rank}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* アクションパネル */}
              <div className="action-panel">
                {gameStarted && !selectionMode && !isGameOver && !exchangePhase && (
                  <>
                    <button className="action-btn btn-play" 
                      disabled={turn !== myPlayerIndex || selectedCards.length === 0 || isActionLoading || !isValidPlay(selectedCards)} 
                      onClick={handlePlay}>
                      出す
                    </button>
                    <button className="action-btn btn-pass" 
                      disabled={turn !== myPlayerIndex || isActionLoading} 
                      onClick={handlePass}>
                      パス
                    </button>
                  </>
                )}
              </div>

              {/* ゲーム終了UI */}
              {isGameOver && (
                <div className="game-over-overlay">
                  <h1 className="cinzel-title">序章 終演</h1>
                  <div className="final-ranks">
                    {roundResults.map((pIdx, i) => (
                      <div key={i} className={`result-row ${(multiplayerMode === 'active' ? pIdx === myPlayerIndex : pIdx === 0) ? 'highlight-p0' : ''}`}>
                        <span className="rank-num">{i + 1}位</span>
                        <span className="rank-title">{getHierarchyTitle(i + 1).title}</span>
                        <span className="rank-player">{getPlayerName(pIdx)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="result-actions">
                    <button className="gold-btn" onClick={handleRestart}>再戦</button>
                    <button className="gold-btn" onClick={() => location.reload()}>タイトルへ</button>
                  </div>
                </div>
              )}

              {/* カード交換UI */}
              {exchangePhase === 'selecting' && (
                <div className="exchange-overlay-ui">
                  <div className="selection-guide">
                    {(() => {
                      const p0Rank = roundResults.indexOf(multiplayerMode === 'active' ? myPlayerIndex : 0) + 1;
                      if (p0Rank === 1) return "大富豪：大貧民へ渡すカードを2枚選択";
                      if (p0Rank === 2) return "富豪：貧民へ渡すカードを1枚選択";
                      if (p0Rank === 3) return "貧民：富豪へ最強のカードを献上";
                      if (p0Rank === 4) return "大貧民：大富豪へ最強のカードを2枚献上";
                      return "";
                    })()}
                  </div>
                  {(roundResults.indexOf(myPlayerIndex) + 1 <= 2) ? (
                    <button className="action-btn btn-confirm"
                      disabled={selectedCards.length !== (roundResults.indexOf(myPlayerIndex) + 1 === 1 ? 2 : 1) || (isHost && Object.keys(exchangeDecisions).length < (multiplayerMode === 'active' ? lobbyPlayers.length : 3))}
                      onClick={confirmExchange}>
                      {isHost && Object.keys(exchangeDecisions).length < (multiplayerMode === 'active' ? lobbyPlayers.length : 3) ? "待機中..." : "交換"}
                    </button>
                  ) : (
                    <button className="action-btn btn-confirm" onClick={confirmExchange} disabled={isHost && Object.keys(exchangeDecisions).length < (multiplayerMode === 'active' ? lobbyPlayers.length : 3)}>
                      {isHost && Object.keys(exchangeDecisions).length < (multiplayerMode === 'active' ? lobbyPlayers.length : 3) ? "待機中..." : "確認"}
                    </button>
                  )}
                </div>
              )}

              {/* QBomberなど選択用UI（action-panelから独立させ、中央固定を有効化） */}
              {selectionMode && (
                <div className="selection-overlay-ui">
                  <div className="selection-guide">
                    {selectionMode === '7' ? `渡すカード（${selectionInfo?.count}枚）を選択` :
                      selectionMode === '10' ? `捨てるカード（${selectionInfo?.count}枚）を選択` :
                        selectionMode === 'Q' ? `爆破する階級（${selectionInfo?.count}種類）を選択` :
                          "対象のプレイヤーを選択"}
                  </div>
                  {selectionMode === 'Q' ? (
                    <>
                      <div className="rank-selector">
                        {[...RANKS, 'Joker'].map(r => (
                          <button key={r}
                            className={`rank-select-btn ${selectedCards.includes(r) ? 'selected' : ''}`}
                            style={selectedCards.includes(r) ? { backgroundColor: 'var(--color-blood)', color: '#fff' } : {}}
                            onClick={() => {
                              sm.playLightPaperSE();
                              toggleRankSelect(r);
                            }}>{r}</button>
                        ))}
                      </div>
                      <button className="action-btn btn-confirm"
                        disabled={selectedCards.length !== selectionInfo?.count}
                        onClick={() => completeSpecialEffect(selectedCards)}>
                        ボンバー
                      </button>
                    </>
                  ) : selectionMode === 'K' || watchSelecting ? (
                    <div style={{ textAlign: 'center' }}>
                      <div className="selection-tip">他プレイヤーのエリアをタッチして {selectionInfo?.count || 1} 人選択 ({watchSelectedIndices.length}/{selectionInfo?.count || 1})</div>
                      <button className="action-btn btn-confirm" style={{marginTop: '10px'}} disabled={watchSelectedIndices.length === 0}
                        onClick={() => {
                            const watchDuration = (selectionInfo?.count || 1) * 5000;
                            setWatchTarget({
                              targetIndices: watchSelectedIndices,
                              activatorIndex: myPlayerIndex,
                              endTime: Date.now() + watchDuration
                            });
                            setWatchSelecting(false);
                            triggerAbilityLog(`Kウォッチ対象: プレイヤー${watchSelectedIndices.join(',')}`);
                            setIsAnimating(true);
                            sm.playEffectSE('kwatch_start.mp3');
                            showMessage('Kウォッチ', `監視を開始 (${watchDuration / 1000}秒)`);
                            
                            if (multiplayerMode === 'active' && !isHost) {
                               sendActionToHost({ action: 'COMPLETE_EFFECT', choice: watchSelectedIndices, mode: 'K', info: selectionInfo });
                               setSelectionInfo(null);
                               
                               setTimeout(() => {
                                 setWatchTarget(null);
                                 setIsAnimating(false);
                               }, watchDuration);
                               return;
                            }
                            
                            const currentInfo = selectionInfo;
                            setSelectionInfo(null);
                            completeSpecialEffect(watchSelectedIndices, null, 'K', currentInfo);
                        }}
                      >決定</button>
                    </div>
                  ) : (
                    <button className="action-btn btn-confirm"
                      disabled={selectedCards.length !== selectionInfo?.count}
                      onClick={() => {
                        if (selectionMode === '10') sm.playCrumpleSE();
                        if (selectionMode === 'Q') sm.playExplosionSE();
                        if (selectionMode === '7') sm.playPaperSE();
                        completeSpecialEffect(selectedCards);
                      }}>
                      {selectionMode === '7' ? '渡す' : selectionMode === '10' ? '捨てる' : '決定'}
                    </button>
                  )}
                  <div className="selection-cancel-hint">※特殊効果は拒否できない</div>
                </div>
              )}

            </div>
          )}
        </div>
      );
    }

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);

    // 最初のユーザー操作でAudioContextを開け、保留中BGMを再生
    const handleInit = () => {
      sm.flushPendingBGM();
    };
    window.addEventListener('mousedown', handleInit, { once: true });
    window.addEventListener('touchstart', handleInit, { once: true });
    window.addEventListener('keydown', handleInit, { once: true });

    // 即時BGM開始試行（ブラウザが許可すればそのまま再生、ブロックされれば最初のクリックで開始）
    sm.playTitleBGM();
  </script>
