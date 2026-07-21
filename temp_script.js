5488:  <script type="text/babel">
5489-    const { useState, useEffect, useRef } = React;
5490-
5491-    // --- Supabase Initialization ---
5492-    // ※ Supabaseプロジェクトを作成し、以下のURLとKEYを書き換えてください。
5493-    const SUPABASE_URL = 'https://gxqowjjwhmbvvzuixcix.supabase.co';
5494-    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cW93amp3aG1idnZ6dWl4Y2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NjA2NjQsImV4cCI6MjA5OTIzNjY2NH0.tJLMJ-SDZpqcYIx0izkFff_lP9wBkQDMHt7cnVVANAQ';
5495-    
5496-    let supabaseClient = null;
5497-    let isSupabaseReady = false;
5498-    let myUid = localStorage.getItem('my_uid');
5499-    
5500-    try {
5501-      // Babel環境などでのロード遅延に備えて安全に初期化
5502-      if (typeof window !== 'undefined' && window.supabase && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
5503-        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
5504-        isSupabaseReady = true;
5505-      }
5506-      
5507-      // UUID v4 generator for anonymous user
5508-      if (!myUid) {
5509-        myUid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
5510-          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
5511-          return v.toString(16);
5512-        });
5513-        localStorage.setItem('my_uid', myUid);
5514-      }
5515-    } catch (e) {
5516-      console.warn("Supabase initialization failed.", e);
5517-    }
5518-
5519-    // --- Rate System ---
5520-
5521-    const calculateElo = (playerRating, opponentRating, isWin, kFactor = 32) => {
5522-      const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
5523-      const actualScore = isWin ? 1 : 0;
5524-      return Math.round(playerRating + kFactor * (actualScore - expectedScore));
5525-    };
5526-
5527-
5528-    const SUITS = ['♠', '♥', '♦', '♣'];
5529-    const RANKS = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
5530-    const rankToValue = (r) => {
5531-      if (r === 'A') return 1;
5532-      if (r === '2') return 2;
5533-      if (r === 'J') return 11;
5534-      if (r === 'Q') return 12;
5535-      if (r === 'K') return 13;
5536-      if (r === 'Joker') return 0;
5537-      return parseInt(r) || 0;
5538-    };
5539-    const valueToRank = (v) => {
5540-      if (v === 1) return 'A';
5541-      if (v === 2) return '2';
5542-      if (v === 11) return 'J';
5543-      if (v === 12) return 'Q';
5544-      if (v === 13) return 'K';
5545-      return v.toString();
5546-    };
5547-    const getEffectiveCount = (cardsToCount) => {
5548-      if (cardsToCount.length === 2 && cardsToCount.some(c => c.rank === '5')) {
5549-        const other = cardsToCount.find(c => c.rank !== '5');
5550-        if (other && ['A', '2', '3', '4', '6', '7', '8'].includes(other.rank)) {
5551-          return 1;
5552-        }
5553-      }
5554-      return cardsToCount.length;
5555-    };
5556-
5557-    // Death Game Icons
5558-    const ICONS = {
5559-      '4': '🛡️', '5': '⛓️', '6': '🔥', '7': '🩸',
5560-      '8': '🪓', '9': '🌀', '10': '💀', 'J': '⏳',
5561-      'Q': '💣', 'K': '👁️', 'A': '🎯', 'Joker': '🃏'
5562-    };
5563-
5564-    const RANK_NAMES = {
5565-      '3': '3', '4': '4シールド', '5': '5スキップ', '6': '6フェニックス', '7': '7渡し',
5566-      '8': '8切り', '9': '9リバース', '10': '10捨て', 'J': '11バック', 'Q': '12ボンバー',
5567-      'K': 'キングウォッチ', 'A': 'サービスエース', '2': '2', 'Joker': 'ジョーカー'
5568-    };
5569-
5570-    // ------------------- Sound Manager -------------------
5571-    class SoundManager {
5572-      constructor() {
5573-        this.ctx = null;
5574-        this.bgm = null;
5575-        this.bgmType = null;
5576-        this.bgmVolume = 0.28;
5577-        this._pendingBGM = null; // queued before first interaction
5578-      }
5579-
5580-      // ---- Context Init ----
5581-      _ensureCtx() {
5582-        if (!this.ctx) {
5583-          this.ctx = new (window.AudioContext || window.webkitAudioContext)();
5584-        }
5585-        if (this.ctx.state === 'suspended') this.ctx.resume();
5586-        return this.ctx;
5587-      }
5588-
5589-      // ---- BGM ----
5590-      playTitleBGM() { this._playBGM('bgm tittle.mp3', 'title'); }
5591-      playHomeBGM() { this._playBGM('bgm home.mp3', 'home'); }
5592-      playGameBGM() { this._playBGM('bgm battle.mp3', 'game'); }
5593-
5594-      _playBGM(file, type) {
5595-        if (this.bgmType === type && this.bgm) return;
5596-        this.stopBGM();
5597-        const audio = new Audio(file);
5598-        audio.loop = true;
5599-        audio.volume = this.bgmVolume;
5600-        this.bgm = audio;
5601-        this.bgmType = type;
5602-        // Try immediate play; if blocked, queue for first-interaction
5603-        const p = audio.play();
5604-        if (p && typeof p.then === 'function') {
5605-          p.catch(() => {
5606-            this._pendingBGM = { audio, type };
5607-          });
5608-        }
5609-      }
5610-
5611-      // Called on first user gesture — flush any pending BGM
5612-      flushPendingBGM() {
5613-        if (this._pendingBGM) {
5614-          const { audio, type } = this._pendingBGM;
5615-          this._pendingBGM = null;
5616-          this.bgm = audio;
5617-          this.bgmType = type;
5618-          audio.play().catch(() => { });
5619-        }
5620-        // Also resume AudioContext if it was suspended
5621-        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
5622-      }
5623-
5624-      stopBGM() {
5625-        if (this.bgm) {
5626-          this.bgm.pause();
5627-          this.bgm.currentTime = 0;
5628-          this.bgm = null;
5629-          this.bgmType = null;
5630-        }
5631-      }
5632-
5633-      // ---- Noise helper ----
5634-      _noise(freq, endFreq, vol, dur, filterType = 'highpass') {
5635-        const ctx = this._ensureCtx();
5636-        const now = ctx.currentTime;
5637-        const sr = ctx.sampleRate;
5638-        const buf = ctx.createBuffer(1, Math.ceil(sr * dur), sr);
5639-        const d = buf.getChannelData(0);
5640-        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
5641-        const src = ctx.createBufferSource();
5642-        src.buffer = buf;
5643-        const flt = ctx.createBiquadFilter();
5644-        flt.type = filterType;
5645-        flt.frequency.setValueAtTime(freq, now);
5646-        flt.frequency.exponentialRampToValueAtTime(endFreq, now + dur);
5647-        const g = ctx.createGain();
5648-        g.gain.setValueAtTime(vol, now);
5649-        g.gain.exponentialRampToValueAtTime(0.001, now + dur);
5650-        src.connect(flt); flt.connect(g); g.connect(ctx.destination);
5651-        src.start(); src.stop(now + dur);
5652-      }
5653-
5654-      // ---- Osc helper ----
5655-      _osc(type, freq, endFreq, vol, dur, endVol) {
5656-        const ctx = this._ensureCtx();
5657-        const now = ctx.currentTime;
5658-        const o = ctx.createOscillator();
5659-        const g = ctx.createGain();
5660-        o.type = type;
5661-        o.frequency.setValueAtTime(freq, now);
5662-        if (endFreq !== null) o.frequency.exponentialRampToValueAtTime(endFreq, now + dur);
5663-        g.gain.setValueAtTime(vol, now);
5664-        g.gain.exponentialRampToValueAtTime(endVol ?? 0.001, now + dur);
5665-        o.connect(g); g.connect(ctx.destination);
5666-        o.start(); o.stop(now + dur);
5667-        return { osc: o, gainNode: g };
5668-      }
5669-
5670-      // ---- Card Handling: ページを捲るような摩擦音 ----
5671-      playLightPaperSE() {
5672-        // 高域ノイズ(4kHz→1kHz)の短いスウィープ
5673-        this._noise(4000, 800, 0.06, 0.09, 'highpass');
5674-        // 極薄い低域ノイズを重ねてコシを出す
5675-        this._noise(800, 200, 0.03, 0.07, 'bandpass');
5676-      }
5677-
5678-      // ---- Heavier shuffle sound ----
5679-      playPaperSE() {
5680-        this._noise(3000, 600, 0.12, 0.15, 'highpass');
5681-        this._noise(600, 200, 0.06, 0.12, 'bandpass');
5682-      }
5683-
5684-      // ---- Crumple (10 Discard) ----
5685-      playCrumpleSE() {
5686-        for (let i = 0; i < 10; i++) {
5687-          const delay = i * 22;
5688-          setTimeout(() => {
5689-            this._noise(300 + Math.random() * 600, 80, 0.14, 0.06, 'bandpass');
5690-          }, delay);
5691-        }
5692-      }
5693-
5694-      // ---- Explosion wrapper (Q) ----
5695-      playExplosionSE() { this.playEffectSE('Q'); }
5696-
5697-      // ---- Game Start SE ----
5698-      playStartSE() {
5699-        const audio = new Audio('START.mp3');
5700-        audio.volume = 0.3; // 小さめ
5701-        audio.play().catch(e => console.warn(e));
5702-      }
5703-
5704-      playReadySE() {
5705-        const audio = new Audio('READY.mp3');
5706-        audio.volume = 0.3; // 小さめ
5707-        audio.play().catch(e => console.warn(e));
5708-      }
5709-
5710-      // ---- Shield Miss SE ----
5711-      playShieldMissSE() {
5712-        const ctx = this._ensureCtx();
5713-        if (!ctx) return;
5714-        // 弾いた瞬間の硬いアタック音（カチンッ）
5715-        this._osc('square', 6000, 2000, 0.15, 0.05, 0.001);
5716-        
5717-        // メインの「キーン」という金属の鳴り（長く伸びる高音）
5718-        // わずかに周波数をずらした2つの音を重ねることで、金属特有の「うねり」を出す
5719-        this._osc('sine', 4200, null, 0.6, 0.7, 0.001);
5720-        this._osc('sine', 4220, null, 0.3, 0.7, 0.001); 
5721-        
5722-        // 高い倍音の響き
5723-        setTimeout(() => {
5724-          this._osc('sine', 8400, null, 0.1, 0.5, 0.001);
5725-        }, 10);
5726-      }
5727-
5728-      // ================================================================
5729-      // ---- playEffectSE — 全14ランク完全書き直し ----
5730-      // ================================================================
5731-      playEffectSE(rank) {
5732-        const ctx = this._ensureCtx();
5733-        const now = ctx.currentTime;
5734-
5735-        switch (rank) {
5736-          // -------- A : テニスの打球音 --------
5737-          case 'A': {
5738-            // 短く鋭いパーカッシブ・ピンポン音
5739-            this._osc('sine', 900, 120, 0.35, 0.14, 0.001);
5740-            // 打撃のノイズ(スウィッシュ)
5741-            this._noise(3000, 800, 0.15, 0.1, 'highpass');
5742-            break;
5743-          }
5744-
5745-          // -------- 2 : 鋭い剣戟音 --------
5746-          case '2': {
5747-            // 主剣撃 (鋭い金属インパクト)
5748-            this._osc('sawtooth', 1400, 300, 0.3, 0.25, 0.001);
5749-            // 副音 (共鳴リン)
5750-            this._osc('sine', 2200, 2200, 0.18, 0.4, 0.001);
5751-            // 空気を切る音
5752-            this._noise(5000, 1000, 0.2, 0.15, 'highpass');
5753-            break;
5754-          }
5755-
5756-          // -------- 3 : 布が擦れる柔らかな音 --------
5757-          case '3': {
5758-            this._noise(1200, 400, 0.12, 0.5, 'bandpass');
5759-            this._noise(600, 200, 0.07, 0.45, 'bandpass');
5760-            break;
5761-          }
5762-
5763-          // -------- 4 : 重厚な金属の盾の防御音 --------
5764-          case '4': {
5765-            // 低域衝撃
5766-            this._osc('sine', 60, 30, 0.5, 0.6, 0.001);
5767-            // 金属リン (高域余韻)
5768-            this._osc('sine', 2800, 2800, 0.2, 0.8, 0.001);
5769-            // 中域ガンとぶつかる音
5770-            this._noise(1500, 400, 0.25, 0.3, 'bandpass');
5771-            break;
5772-          }
5773-
5774-          // -------- 5 : ジャラジャラと鳴り響く鎖の音 --------
5775-          case '5': {
5776-            // 不規則な金属鎖 (7回)
5777-            for (let i = 0; i < 7; i++) {
5778-              const t = i * 65 + Math.random() * 30;
5779-              setTimeout(() => {
5780-                this._noise(4000 + Math.random() * 2000, 800, 0.1, 0.06, 'bandpass');
5781-              }, t);
5782-            }
5783-            break;
5784-          }
5785-
5786-          // -------- 6 : 燃え盛る業火の炎 --------
5787-          case '6': {
5788-            // ランブリング・ファイアーノイズ
5789-            const sr = ctx.sampleRate;
5790-            const len = Math.ceil(sr * 2.0);
5791-            const buf = ctx.createBuffer(1, len, sr);
5792-            const dat = buf.getChannelData(0);
5793-            for (let i = 0; i < len; i++) dat[i] = Math.random() * 2 - 1;
5794-            const fireNoise = ctx.createBufferSource();
5795-            fireNoise.buffer = buf;
5796-            // ローパス + 揺れLFO
5797-            const lp = ctx.createBiquadFilter();
5798-            lp.type = 'lowpass'; lp.frequency.value = 350;
5799-            const lfo = ctx.createOscillator();
5800-            lfo.frequency.value = 9;
5801-            const lfoG = ctx.createGain(); lfoG.gain.value = 220;
5802-            lfo.connect(lfoG); lfoG.connect(lp.frequency);
5803-            const fGain = ctx.createGain();
5804-            fGain.gain.setValueAtTime(0.5, now);
5805-            fGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
5806-            fireNoise.connect(lp); lp.connect(fGain); fGain.connect(ctx.destination);
5807-            lfo.start(now); lfo.stop(now + 2.0);
5808-            fireNoise.start(now); fireNoise.stop(now + 2.0);
5809-            break;
5810-          }
5811-
5812-          // -------- 7 : カードを捌く「サッ」という音 --------
5813-          case '7': {
5814-            this.playPaperSE();
5815-            break;
5816-          }
5817-
5818-          // -------- 8 : 金属的な響きを伴う鋭い斬撃 --------
5819-          case '8': {
5820-            // 斬撃 (sawtooth pitch-drop)
5821-            this._osc('sawtooth', 1200, 40, 0.4, 0.2, 0.001);
5822-            // 空気を切るホワイトノイズ
5823-            this._noise(6000, 800, 0.35, 0.2, 'highpass');
5824-            // 金属残響 (キィン)
5825-            this._osc('sine', 3500, 3500, 0.15, 0.55, 0.001);
5826-            break;
5827-          }
5828-
5829-          // -------- 9 : 正確に刻まれる時計の秒針(チクタク) --------
5830-          case '9': {
5831-            // チク(高め)
5832-            this._osc('sine', 3000, 3000, 0.25, 0.05, 0.001);
5833-            this._noise(4000, 4000, 0.1, 0.04, 'bandpass');
5834-            // タク (低め) — 少し遅れ
5835-            setTimeout(() => {
5836-              this._osc('sine', 2400, 2400, 0.2, 0.05, 0.001);
5837-              this._noise(3000, 3000, 0.08, 0.04, 'bandpass');
5838-            }, 380);
5839-            break;
5840-          }
5841-
5842-          // -------- 10 : 紙をクシャクシャにする音 --------
5843-          case '10': {
5844-            this.playCrumpleSE();
5845-            break;
5846-          }
5847-
5848-          // -------- J : どよめく群衆の声 --------
5849-          case 'J': {
5850-            // 15本のランダム周波数デチューン・オシレータ
5851-            for (let i = 0; i < 15; i++) {
5852-              const o = ctx.createOscillator();
5853-              o.type = 'sine';
5854-              o.frequency.value = 120 + Math.random() * 320;
5855-              const g = ctx.createGain();
5856-              g.gain.setValueAtTime(0.0, now);
5857-              g.gain.linearRampToValueAtTime(0.04 + Math.random() * 0.02, now + 0.25);
5858-              g.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
5859-              o.connect(g); g.connect(ctx.destination);
5860-              o.start(now); o.stop(now + 1.4);
5861-            }
5862-            // ざわめきノイズ
5863-            this._noise(800, 300, 0.08, 1.2, 'bandpass');
5864-            break;
5865-          }
5866-
5867-          // -------- Q : 画面を揺らす激しい爆発音 --------
5868-          case 'Q': {
5869-            // 超低域impact
5870-            this._osc('square', 80, 8, 0.6, 1.2, 0.001);
5871-            // 爆風ノイズ (ローパス)
5872-            this._noise(1200, 20, 0.7, 1.2, 'lowpass');
5873-            // 高域フラッシュノイズ
5874-            this._noise(8000, 500, 0.3, 0.2, 'highpass');
5875-            break;
5876-          }
5877-
5878-          // -------- K : 監視の目が光るような「ビーン」 --------
5879-          case 'K': {
5880-            // 上昇するサイン波 (エコー感)
5881-            this._osc('sine', 400, 1200, 0.3, 0.9, 0.001);
5882-            // 高周波ビビリ (vibrato)
5883-            const kO = ctx.createOscillator();
5884-            kO.type = 'sawtooth';
5885-            kO.frequency.setValueAtTime(700, now);
5886-            const vLfo = ctx.createOscillator(); vLfo.type = 'sine'; vLfo.frequency.value = 45;
5887-            const vG = ctx.createGain(); vG.gain.value = 120;
5888-            vLfo.connect(vG); vG.connect(kO.frequency);
5889-            const kG = ctx.createGain();
5890-            kG.gain.setValueAtTime(0.22, now);
5891-            kG.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
5892-            kO.connect(kG); kG.connect(ctx.destination);
5893-            vLfo.start(now); vLfo.stop(now + 0.9);
5894-            kO.start(now); kO.stop(now + 0.9);
5895-            break;
5896-          }
5897-
5898-          // -------- Joker : カオス --------
5899-          case 'Joker': {
5900-            this._osc('sawtooth', 150, 3000, 0.35, 0.4, 0.001);
5901-            this._noise(6000, 200, 0.2, 0.4, 'highpass');
5902-            break;
5903-          }
5904-
5905-          default: {
5906-            this._osc('sine', 440, 440, 0.2, 0.2, 0.001);
5907-          }
5908-        }
5909-      }
5910-    }
5911-
5912-    const sm = new SoundManager();
5913-
5914-    // ------------------- Card Data -------------------
5915-    const TCG_DATA = {
5916-      'A': { name: 'サービスＡ', desc: 'このカードで場が流れた時、自身の手元に帰還', url: 'Aimage.webp', icon: '🎯', auraColor: '#2980b9' },
5917-      '2': { name: '２ナイト', desc: '能力なし', url: '2image.webp', icon: '', auraColor: '#27ae60' },
5918-      '3': { name: '３コモン', desc: '能力なし', url: '3image.webp', icon: '', auraColor: '#7f8c8d' },
5919-      '4': { name: '４シールド', desc: 'このターン、他プレイヤーからの攻撃を受けない', url: '4image.webp', icon: '🛡️', auraColor: '#00b4d8' },
5920-      '5': { name: 'プラス5', desc: '他のカードと合計したランクの効果を発動', url: '5image.webp', icon: '➕', auraColor: '#ff4444' },
5921-      '6': { name: '６フェニックス', desc: '墓地からランダムにカードを入手', url: '6image.webp', icon: '🔥', auraColor: '#8e44ad' },
5922-      '7': { name: '７渡し', desc: '次のプレイヤーにカードを譲渡', url: '7image.webp', icon: '🩸', auraColor: '#ffffff' },
5923-      '8': { name: '８切り', desc: 'この場を強制的に終了', url: '8image.webp', icon: '🪓', auraColor: '#d35400' },
5924-      '9': { name: '９リバース', desc: '回り順を逆転', url: '9image.webp', icon: '🌀', auraColor: '#f1c40f' },
5925-      '10': { name: '１０捨て', desc: '任意のカードを墓地に捨てる', url: '10image.webp', icon: '💀', auraColor: '#2c3e50' },
5926-      'J': { name: 'Ｊバック', desc: 'このターン、カードの強さが逆転', url: 'Jimage.webp', icon: '⏳', auraColor: '#e67e22' },
5927-      'Q': { name: 'Ｑボンバー', desc: '場にある特定のカードを消滅', url: 'Qimage.webp', icon: '💣', auraColor: '#bdc3c7' },
5928-      'K': { name: 'Ｋウォッチ', desc: '指定したプレイヤーの手札を監視', url: 'Kimage.webp', icon: '👁️', auraColor: '#f1c40f' },
5929-      'Joker': { name: 'ジョーカー', desc: '最強のカード。何にでも成り代わる', url: 'joker.webp', icon: '🃏', auraColor: '#fd79a8' }
5930-    };
5931-
5932-    const createDeck = () => {
5933-      let deck = [];
5934-      for (let suit of SUITS) {
5935-        for (let i = 0; i < RANKS.length; i++) {
5936-          deck.push({ id: `${suit}${RANKS[i]}`, suit, rank: RANKS[i], strength: i });
5937-        }
5938-      }
5939-      deck.push({ id: 'Joker1', suit: 'Joker', rank: 'Joker', strength: 13 });
5940-      deck.push({ id: 'Joker2', suit: 'Joker', rank: 'Joker', strength: 13 });
5941-      return deck;
5942-    };
5943-
5944-    const shuffle = (array) => {
5945-      let deck = [...array];
5946-      for (let i = deck.length - 1; i > 0; i--) {
5947-        const j = Math.floor(Math.random() * (i + 1));
5948-        [deck[i], deck[j]] = [deck[j], deck[i]];
5949-      }
5950-      return deck;
5951-    };
5952-
5953-
5954-
5955-    // Rank title mapping representing hierarchy
5956-    const getHierarchyTitle = (finishOrder) => {
5957-      if (finishOrder === 1) return { title: "大富豪", cls: "rank-daifugo" };
5958-      if (finishOrder === 2) return { title: "富豪", cls: "" };
5959-      if (finishOrder === 3) return { title: "貧民", cls: "" };
5960-      if (finishOrder === 4) return { title: "大貧民", cls: "rank-daihinmin" };
5961-      return { title: "生贄候補", cls: "" };
5962-    };
5963-
5964-    function App() {
5965-      const [gameStarted, setGameStarted] = useState(false);
5966-      const [titleStage, setTitleStage] = useState(1);
5967-  const [isTransitioning, setIsTransitioning] = useState(false);
5968-  const [isStartPressed, setIsStartPressed] = useState(false);
5969-  const [isReady, setIsReady] = useState(false);
5970-  const [isReadyPressed, setIsReadyPressed] = useState(false);
5971-  const [hoveredMode, setHoveredMode] = useState(null);
5972-
5973-  const handleReadyClick = () => {
5974-    sm.playReadySE();
5975-    setIsReadyPressed(true);
5976-    setTimeout(() => {
5977-      sm.playTitleBGM();
5978-      setIsReady(true);
5979-      setIsReadyPressed(false);
5980-    }, 200);
5981-  };
5982-
5983-  const preloadImages = (srcArray, callback) => {
5984-    let loaded = 0;
5985-    let hasFired = false;
5986-    const fireCallback = () => {
5987-      if (!hasFired) {
5988-        hasFired = true;
5989-        callback();
5990-      }
5991-    };
5992-    if (srcArray.length === 0) { fireCallback(); return; }
5993-    srcArray.forEach(src => {
5994-      const img = new Image();
5995-      img.onload = img.onerror = () => {
5996-        loaded++;
5997-        if (loaded === srcArray.length) fireCallback();
5998-      };
5999-      img.src = src;
6000-    });
6001-    setTimeout(fireCallback, 3000); // 3s fallback timeout
6002-  };
6003-
6004-  const handleStartGameTransition = () => {
6005-    sm.playStartSE();
6006-    setIsStartPressed(true);
6007-    setIsTransitioning(true);
6008-    
6009-    const startTime = Date.now();
6010-    preloadImages(['room home.png', 'online.png', 'CPU.png'], () => {
6011-      const elapsed = Date.now() - startTime;
6012-      const remainingTime = Math.max(0, 1500 - elapsed);
6013-      setTimeout(() => {
6014-        setTitleStage(2);
6015-        sm.playHomeBGM();
6016-        setIsStartPressed(false);
6017-        setTimeout(() => setIsTransitioning(false), 50);
6018-      }, remainingTime);
6019-    });
6020-  }; // 1: START, 2: 1人/マルチのモード選択
6021-      const [multiplayerMode, setMultiplayerMode] = useState(null); // 'connecting' | 'lobby' | 'active'
6022-      const [isHost, setIsHost] = useState(false);
6023-      const [roomChannel, setRoomChannel] = useState(null);
6024-      const [currentRoom, setCurrentRoom] = useState(null);
6025-      const [myPlayerIndex, setMyPlayerIndex] = useState(0);
6026-      const [passphrase, setPassphrase] = useState('');
6027-      const [remotePlayers, setRemotePlayers] = useState([{ id: 'local', name: 'YOU' }]); // For lobby display
6028-      const [isDealing, setIsDealing] = useState(false);
6029-      const [hands, setHands] = useState([[], [], [], []]);
6030-      const [tableCards, setTableCards] = useState([]);
6031-      const [previousTableCards, setPreviousTableCards] = useState([]);
6032-      const [turn, setTurn] = useState(0);
6033-      const [passCount, setPassCount] = useState(0);
6034-      const [lastPlayPlayer, setLastPlayPlayer] = useState(null);
6035-      const [selectedCards, setSelectedCards] = useState([]);
6036-      const [ranksDiscovered, setRanksDiscovered] = useState([]);
6037-
6038-      const [graveyard, setGraveyard] = useState([]);
6039-      const [isShielded, setIsShielded] = useState([false, false, false, false]);
6040-      const [is11Back, setIs11Back] = useState(false);
6041-      const [isRevolution, setIsRevolution] = useState(false);
6042-      const [isPlus5Active, setIsPlus5Active] = useState(false);
6043-      const [playDirection, setPlayDirection] = useState(1);
6044-      const [effectMessage, setEffectMessage] = useState(null);
6045-      const [watchTarget, setWatchTarget] = useState(null);
6046-      const [watchSelectedTargets, setWatchSelectedTargets] = useState([]);
6047-      const [myProfile, setMyProfile] = useState(() => {
6048-        const savedAvatar = localStorage.getItem('local_avatar') || 'knight';
6049-        const savedName = localStorage.getItem('local_display_name') || 'YOU';
6050-        return {
6051-          display_name: savedName,
6052-          avatar: savedAvatar
6053-        };
6054-      });
6055-
6056-      // Online Match states
6057-      const [playerRating, setPlayerRating] = useState(() => parseInt(localStorage.getItem('local_rating') || '1500', 10));
6058-      const [onlineMatchStatus, setOnlineMatchStatus] = useState('idle'); // 'idle' | 'searching' | 'found'
6059-      const [isOnlineMatch, setIsOnlineMatch] = useState(false);
6060-      const [showLeaderboard, setShowLeaderboard] = useState(false);
6061-
6062-      // --- Latest State Refs for Event Listeners (Stale Closure対策) ---
6063-      const turnRef = useRef(turn);
6064-      const isAnimatingRef = useRef(isAnimating);
6065-      const remotePlayersRef = useRef(remotePlayers);
6066-      const isGameOverRef = useRef(isGameOver);
6067-      const myPlayerIndexRef = useRef(myPlayerIndex);
6068-
6069-      const executePlayRef = useRef();
6070-      const executePassRef = useRef();
6071-      const completeSpecialEffectRef = useRef();
6072-      const handleRestartRef = useRef();
6073-      const isValidPlayRef = useRef();
6074-
6075-      useEffect(() => {
6076-        turnRef.current = turn;
6077-        isAnimatingRef.current = isAnimating;
6078-        remotePlayersRef.current = remotePlayers;
6079-        isGameOverRef.current = isGameOver;
6080-        myPlayerIndexRef.current = myPlayerIndex;
6081-      }, [turn, isAnimating, remotePlayers, isGameOver, myPlayerIndex]);
6082-
6083-      const [leaderboardData, setLeaderboardData] = useState([]);
6084-      const [showProfileSettings, setShowProfileSettings] = useState(false);
6085-      const [tempProfileName, setTempProfileName] = useState('');
6086-      
6087-      const updateProfileName = () => {
6088-        const newName = tempProfileName.trim() || 'YOU';
6089-        localStorage.setItem('local_display_name', newName);
6090-        setMyProfile(prev => prev ? { ...prev, display_name: newName } : null);
6091-        setShowProfileSettings(false);
6092-      };
6093-      const [ratingChange, setRatingChange] = useState(null); // { old: 1500, new: 1520, diff: 20 }
6094-
6095-      // Temporary Animation triggers
6096-      const [clearingField, setClearingField] = useState(false);
6097-      const [phoenixActive, setPhoenixActive] = useState(false);
6098-      const [guillotineActive, setGuillotineActive] = useState(false);
6099-      const [reverseActive, setReverseActive] = useState(false);
6100-      const [bomberActive, setBomberActive] = useState(false);
6101-      const [passThreadActive, setPassThreadActive] = useState(false);
6102-      const [skipTarget, setSkipTarget] = useState(null); // CSS Chain effect
6103-      const [missEffectTarget, setMissEffectTarget] = useState(null); // Shield sparks
6104-
6105-      const [animMessage, setAnimMessage] = useState({ data: null, state: 'exit' });
6106-      // New state for character cut‑in overlay
6107-      const [cutIn, setCutIn] = useState(null);
6108-      const [resurrectCard, setResurrectCard] = useState(null);
6109-      const [discardingToGy, setDiscardingToGy] = useState([]); // cards flying to gy now
6110-
6111-      // New selection states for special effects
6112-      const [selectionMode, setSelectionMode] = useState(null); // '7', '10', 'Q'
6113-      const [selectionInfo, setSelectionInfo] = useState(null); // { playerIndex, nextP, count }
6114-      const [isActionLoading, setIsActionLoading] = useState(false);
6115-      const cpuThinkingRef = React.useRef(false); // refで競合状態を防ぐ
6116-      const prevTurnRef = React.useRef(0);
6117-      const [passedPlayers, setPassedPlayers] = useState([]);
6118-
6119-      // Performance/Animation states
6120-      const [explodingCards, setExplodingCards] = useState([]); // { playerIndex, rank }[]
6121-      const [centralBombCards, setCentralBombCards] = useState([]);
6122-      const [flyingCards, setFlyingCards] = useState([]); // { from, to, card, type: 'phoenix'|'pass' }[]
6123-      const [receivedHighlight, setReceivedHighlight] = useState(null); // playerIndex
6124-      const [highlightedCardIds, setHighlightedCardIds] = useState([]); // Array of card IDs
6125-      const [gyShuffling, setGyShuffling] = useState(false);
6126-      const [phoenixGlowIds, setPhoenixGlowIds] = useState([]); // 6フェニックスで取得したカードID（紫色グロー）
6127-      const [phoenixFlyCards, setPhoenixFlyCards] = useState([]); // {id, sx, sy, ex, ey}
6128-
6129-      /**
6130-       * 墓地からプレイヤー手札へカード飛翔アニメーション
6131-       * getBoundingClientRect()で實座標を取得し、CSSカスタムプロパティでBezier曲線移動
6132-       */
6133-      const triggerPhoenixCardFly = (pIdx, onComplete) => {
6134-        const gravityEl = document.querySelector('[data-graveyard]');
6135-        const handEl = document.querySelector(`[data-player-hand="${pIdx}"]`);
6136-        if (!gravityEl || !handEl) { setTimeout(onComplete, 750); return; }
6137-
6138-        const fromRect = gravityEl.getBoundingClientRect();
6139-        const toRect   = handEl.getBoundingClientRect();
6140-
6141-        const flyId = Symbol();
6142-        const sx = fromRect.left + fromRect.width  / 2;
6143-        const sy = fromRect.top  + fromRect.height / 2;
6144-        const ex = toRect.left   + toRect.width    / 2;
6145-        const ey = toRect.top    + toRect.height   / 2;
6146-
6147-        setPhoenixFlyCards(prev => [...prev, { id: flyId, sx, sy, ex, ey }]);
6148-        setTimeout(() => {
6149-          setPhoenixFlyCards(prev => prev.filter(c => c.id !== flyId));
6150-          onComplete();
6151-        }, 750);
6152-      };
6153-      const [isAnimating, setIsAnimating] = useState(false); // 全演出完了フラグ
6154-      const [abilityLog, setAbilityLog] = useState("");
6155-      const triggerAbilityLog = (msg) => {
6156-        setAbilityLog(msg);
6157-        setTimeout(() => setAbilityLog(""), 3000);
6158-      };
6159-      const lastTouchedId = React.useRef(null);
6160-      const isSwipingRef = React.useRef(false); // スワイプ中判定
6161-      const touchStartPos = React.useRef({ x: 0, y: 0 });
6162-      const hasFlickedPlay = React.useRef(false);
6163-
6164-      const handlePointerDown = (e) => {
6165-        isSwipingRef.current = false;
6166-        hasFlickedPlay.current = false;
6167-        // PCとモバイル両対応のためポインタ位置を記録
6168-        touchStartPos.current = { x: e.clientX, y: e.clientY };
6169-        try { e.target.setPointerCapture(e.pointerId); } catch(err) {}
6170-      };
6171-
6172-      const handlePointerMove = (e, playerIdx) => {
6173-        if (playerIdx !== 0 || turn !== 0 || selectionMode || exchangePhase || hasFlickedPlay.current) return;
6174-        // ドラッグ（マウスボタン押しっぱなし or タッチ中）のみ処理
6175-        if (e.pointerType === 'mouse' && e.buttons === 0) return;
6176-        
6177-        // フリック（上方向へのスライド）判定
6178-        const deltaY = touchStartPos.current.y - e.clientY; // 上にスワイプすると正
6179-        const deltaX = Math.abs(e.clientX - touchStartPos.current.x);
6180-
6181-        // 少しのブレはスワイプとみなさない（タップ判定を維持するための遊び）
6182-        if (Math.abs(deltaY) < 10 && deltaX < 10) return;
6183-        
6184-        isSwipingRef.current = true;
6185-
6186-        // Y方向へ50px以上、かつX方向の1.5倍以上の移動で「上フリック」とみなす
6187-        if (deltaY > 50 && deltaY > deltaX * 1.5) {
6188-          if (!isActionLoading) {
6189-            // フリックされたカードを特定
6190-            const startElem = document.elementFromPoint(touchStartPos.current.x, touchStartPos.current.y);
6191-            const startCardElem = startElem?.closest('.card.selectable');
6192-            let flickedCard = null;
6193-            if (startCardElem) {
6194-              const cardId = startCardElem.getAttribute('data-card-id');
6195-              flickedCard = hands[0].find(c => c.id === cardId);
6196-            }
6197-
6198-            let playCandidate = [...selectedCards];
6199-            
6200-            // 選択されていないカードをフリックした場合は、候補に追加
6201-            if (flickedCard && !selectedCards.find(c => c.id === flickedCard.id)) {
6202-              playCandidate.push(flickedCard);
6203-            }
6204-
6205-            // 出せる条件を満たしているかチェック
6206-            if (playCandidate.length > 0 && isValidPlay(playCandidate)) {
6207-              handleFlickPlay(playCandidate);
6208-              hasFlickedPlay.current = true; // 1回のフリックで複数回発火しないようにする
6209-            } else if (flickedCard && isValidPlay([flickedCard])) {
6210-              // 選択中カード＋フリックカードでは出せないが、フリックカード単体なら出せる場合
6211-              handleFlickPlay([flickedCard]);
6212-              hasFlickedPlay.current = true;
6213-            }
6214-          }
6215-          return; // フリックと判定された場合はカード選択処理をスキップ
6216-        }
6217-
6218-        // Y方向の移動が大きい場合（フリックの途中）、またはX方向への移動が明確でない場合は横スワイプ選択をスキップ
6219-        if (Math.abs(deltaY) > 15 || deltaX < 15 || Math.abs(deltaY) > deltaX) {
6220-          return;
6221-        }
6222-
6223-        const elem = document.elementFromPoint(e.clientX, e.clientY);
6224-        const cardElem = elem?.closest('.card.selectable');
6225-        if (cardElem) {
6226-          const cardId = cardElem.getAttribute('data-card-id');
6227-          if (cardId && cardId !== lastTouchedId.current) {
6228-            const card = hands[0].find(c => c.id === cardId);
6229-            if (card) {
6230-              sm.playLightPaperSE();
6231-              // ユーザー要望：スワイプ中は「触れている位置のみ」を選択
6232-              setSelectedCards([card]); 
6233-              lastTouchedId.current = cardId;
6234-            }
6235-          }
6236-        }
6237-      };
6238-      
6239-      const handlePointerUp = (e) => {
6240-        try { e.target.releasePointerCapture(e.pointerId); } catch(err) {}
6241-        lastTouchedId.current = null;
6242-        // スワイプ終了後、少し待って判定をリセット
6243-        setTimeout(() => { isSwipingRef.current = false; }, 50);
6244-      };
6245-
6246-      const [watchSelecting, setWatchSelecting] = useState(false); // Kウォッチ対象選択モード
6247-      const [watchTimerTick, setWatchTimerTick] = useState(0); // タイマー描画更新用
6248-
6249-      const [isGameOver, setIsGameOver] = useState(false);
6250-      const [roundResults, setRoundResults] = useState([]); // [p0, p1, p2, p3] ranking for the last round
6251-      const [exchangePhase, setExchangePhase] = useState(null); // 'selecting' | 'animating' | null
6252-      const [exchangeDecisions, setExchangeDecisions] = useState({}); // { playerIdx: cardIds[] }
6253-      const [showExplanation, setShowExplanation] = useState(false);
6254-      const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
6255-
6256-      useEffect(() => {
6257-        const handleResize = () => setIsMobile(window.innerWidth <= 1024);
6258-        window.addEventListener('resize', handleResize);
6259-        return () => window.removeEventListener('resize', handleResize);
6260-      }, []);
6261-
6262-      const updateProfileAvatar = (avatarKey) => {
6263-        localStorage.setItem('local_avatar', avatarKey);
6264-        setMyProfile(prev => prev ? { ...prev, avatar: avatarKey } : null);
6265-      };
6266-
6267-
6268-      useEffect(() => {
6269-        if (watchTarget) {
6270-          const interval = setInterval(() => {
6271-            setWatchTimerTick(t => t + 1);
6272-          }, 1000);
6273-          return () => clearInterval(interval);
6274-        }
6275-      }, [watchTarget]);
6276-
6277-      const [isAltarActive, setIsAltarActive] = useState(false);
6278-
6279-      useEffect(() => {
6280-        // ターンが実際に移動したかチェック
6281-        if (turn !== prevTurnRef.current) {
6282-          if (turn === myPlayerIndex) setIsActionLoading(false);
6283-          cpuThinkingRef.current = false;
6284-          prevTurnRef.current = turn;
6285-          if (multiplayerMode === 'active' && isHost && turn !== -1) {
6286-            // 状態の完全な同期はターンの切り替わり時に一回だけ行う（演出阻害防止）
6287-            broadcastState(hands, turn);
6288-          }
6289-        }
6290-        
6291-        // CPUターンのトリガー
6292-        if (turn !== myPlayerIndex && !ranksDiscovered.includes(turn) && !selectionMode && !isAnimating && !watchTarget) {
6293-          // マルチプレイヤー時はホストのみがCPUを動かす
6294-          if (multiplayerMode === 'active' && !isHost) return;
6295-          const isCpuTurn = multiplayerMode === 'active' ? (remotePlayers[turn] && remotePlayers[turn].id.startsWith('cpu')) : true;
6296-          if (!isCpuTurn) return;
6297-          if (cpuThinkingRef.current) return;
6298-          const timeout = setTimeout(() => {
6299-            if (cpuThinkingRef.current) return;
6300-            cpuThinkingRef.current = true;
6301-            playCpuTurn(turn);
6302-          }, 600);
6303-          return () => clearTimeout(timeout);
6304-        }
6305-      }, [turn, selectionMode, isAnimating, watchTarget, multiplayerMode, isHost, myPlayerIndex]);
6306-
6307-      useEffect(() => {
6308-        if (effectMessage) {
6309-          setAnimMessage({ data: effectMessage, state: 'enter' });
6310-          const tmEnter = setTimeout(() => setAnimMessage(prev => ({ ...prev, state: 'enter-active' })), 50);
6311-
6312-          const tmExit = setTimeout(() => {
6313-            setAnimMessage(prev => ({ ...prev, state: 'exit-active' }));
6314-            setTimeout(() => setEffectMessage(null), 300);
6315-          }, 3000);
6316-          return () => { clearTimeout(tmEnter); clearTimeout(tmExit); };
6317-        } else {
6318-          setAnimMessage({ data: null, state: 'exit' });
6319-        }
6320-      }, [effectMessage]);
6321-
6322-      // Slam animation logic
6323-      useEffect(() => {
6324-        const hasAnimatingCards = tableCards.some(tc => tc.isAnimating);
6325-        if (hasAnimatingCards) {
6326-          const timer = setTimeout(() => {
6327-            sm.playPaperSE(); // Use paper sound for field clear
6328-            setTableCards(prev => prev.map(tc => {
6329-              if (tc.isAnimating) {
6330-                return { ...tc, isAnimating: false, isSlammed: true };
6331-              }
6332-              return tc;
6333-            }));
6334-          }, 50);
6335-          return () => clearTimeout(timer);
6336-        }
6337-      }, [tableCards]);
6338-
6339-      // Remove slam effect class after animation finishes so it doesn't replay
6340-      useEffect(() => {
6341-        const hasSlammed = tableCards.some(tc => tc.isSlammed);
6342-        if (hasSlammed) {
6343-          const timer = setTimeout(() => {
6344-            setTableCards(prev => prev.map(tc => ({ ...tc, isSlammed: false })));
6345-          }, 500);
6346-          return () => clearTimeout(timer);
6347-        }
6348-      }, [tableCards]);
6349-
6350-      const showMessage = (title, desc) => {
6351-        setEffectMessage({ title, desc });
6352-      };
6353-
6354-      // --- Multiplayer Logic ---
6355-      const createRoom = () => {
6356-        const roomNum = Math.floor(1000 + Math.random() * 9000).toString();
6357-        setPassphrase(roomNum);
6358-        const hostId = "ultimate-daihugou-" + btoa(roomNum).replace(/=/g, "");
6359-        startAsHost(hostId);
6360-      };
6361-
6362-      const initMultiplayer = (pass) => {
6363-        if (!pass) return alert("ルーム番号を入力してください");
6364-        setPassphrase(pass);
6365-        const hostId = "ultimate-daihugou-" + btoa(pass).replace(/=/g, "");
6366-        joinAsGuest(hostId);
6367-      };
6368-
6369-      const joinRoomAndSyncPresence = async (roomCode, userProfile, isHostMode = false) => {
6370-        if (!isSupabaseReady) {
6371-          if (typeof window !== 'undefined' && window.supabase && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
6372-            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
6373-            isSupabaseReady = true;
6374-          } else {
6375-            alert("データベースの初期化に失敗しました。時間をおいて再試行してください。");
6376-            return;
6377-          }
6378-        }
6379-        
6380-        let targetRoom = null;
6381-        if (isHostMode) {
6382-          const { data, error } = await supabaseClient.from('rooms').insert([{ room_code: roomCode, status: 'waiting' }]).select().single();
6383-          if (error) { alert("エラーが発生しました: " + error.message + "\n※Supabaseにroomsテーブルが作成されているか確認してください"); return; }
6384-          targetRoom = data;
6385-        } else {
6386-          const { data, error } = await supabaseClient.from('rooms').select('*').eq('room_code', roomCode).single();
6387-          if (error || !data) { alert("ルームが見つかりません。(" + (error?.message || '') + ")"); return; }
6388-          targetRoom = data;
6389-        }
6390-        
6391-        setCurrentRoom(targetRoom);
6392-        setIsHost(isHostMode);
6393-        setMultiplayerMode(multiplayerMode === 'online' ? 'active' : 'lobby');
6394-        
6395-        const myPlayerData = { id: myUid || `guest-${Date.now()}`, name: userProfile.name, avatar: userProfile.avatar || 'knight' };
6396-        if (isHostMode) setRemotePlayers([myPlayerData]);
6397-        
6398-        const channel = supabaseClient.channel(`room:${targetRoom.id}`, { config: { presence: { key: myPlayerData.id } } });
6399-        setRoomChannel(channel);
6400-
6401-        channel
6402-          .on('presence', { event: 'sync' }, () => {
6403-             const state = channel.presenceState();
6404-             const players = [];
6405-             for (const id in state) { players.push(state[id][0]); }
6406-             players.sort((a, b) => {
6407-               const timeA = a.joined_at || '';
6408-               const timeB = b.joined_at || '';
6409-               return timeA.localeCompare(timeB);
6410-             });
6411-             setRemotePlayers(players);
6412-             
6413-             if (isHostMode && multiplayerMode === 'online' && players.length >= 2 && !gameStarted) {
6414-                setTimeout(() => startGame(), 1000);
6415-             }
6416-          })
6417-          .on('broadcast', { event: 'STATE_UPDATE' }, (payload) => {
6418-             if (isHostMode) return;
6419-             const data = payload.payload;
6420-             setHands(data.state.hands);
6421-             setTableCards(data.state.tableCards);
6422-             if (data.state.previousTableCards) setPreviousTableCards(data.state.previousTableCards);
6423-             setTurn(data.state.turn);
6424-             setGameStarted(data.state.gameStarted);
6425-             const pIndex = data.state.remotePlayers.findIndex(rp => rp.id === myPlayerData.id);
6426-             setMyPlayerIndex(pIndex > 0 ? pIndex : 1);
6427-             setMultiplayerMode('active');
6428-             setRanksDiscovered(data.state.ranksDiscovered);
6429-             setIsGameOver(data.state.isGameOver);
6430-             setRoundResults(data.state.roundResults);
6431-             setExchangePhase(data.state.exchangePhase);
6432-             setPassCount(data.state.passCount);
6433-             setLastPlayPlayer(data.state.lastPlayPlayer);
6434-             setIs11Back(data.state.is11Back);
6435-             setIsRevolution(data.state.isRevolution);
6436-             setPlayDirection(data.state.playDirection);
6437-             setGraveyard(data.state.graveyard);
6438-             if (data.state.remotePlayers) setRemotePlayers(data.state.remotePlayers);
6439-          })
6440-          .on('broadcast', { event: 'EVENT' }, (payload) => {
6441-             if (isHostMode) return;
6442-             const data = payload.payload;
6443-             if (data.event === 'PLAY') {
6444-               if (data.playerIndex === myPlayerIndexRef.current) return;
6445-               executePlayRef.current(data.playerIndex, data.cards);
6446-             } else if (data.event === 'PASS') {
6447-               if (data.playerIndex === myPlayerIndexRef.current) return;
6448-               executePassRef.current(data.playerIndex);
6449-             } else if (data.event === 'COMPLETE_EFFECT') {
6450-               if (data.playerIndex === myPlayerIndexRef.current) return;
6451-               completeSpecialEffectRef.current(data.choice, data.playerIndex);
6452-             }
6453-          })
6454-          .on('broadcast', { event: 'ACTION' }, (payload) => {
6455-             if (!isHostMode) return;
6456-             const data = payload.payload;
6457-             console.log('Action from guest', data);
6458-             const pIdx = data.playerIndex;
6459-             if (pIdx === undefined || pIdx <= 0 || turnRef.current !== pIdx || isAnimatingRef.current) return;
6460-
6461-             if (data.action === 'PLAY') {
6462-               if (isValidPlayRef.current(data.cards)) {
6463-                 executePlayRef.current(pIdx, data.cards);
6464-                 broadcastEvent({ event: 'PLAY', playerIndex: pIdx, cards: data.cards });
6465-               } else {
6466-                 roomChannel.send({ type: 'broadcast', event: 'ACTION_REJECTED', payload: { playerIndex: pIdx, reason: 'INVALID_PLAY' } });
6467-               }
6468-             } else if (data.action === 'PASS') {
6469-               executePassRef.current(pIdx);
6470-               broadcastEvent({ event: 'PASS', playerIndex: pIdx });
6471-             } else if (data.action === 'COMPLETE_EFFECT') {
6472-               completeSpecialEffectRef.current(data.choice, pIdx);
6473-               broadcastEvent({ event: 'COMPLETE_EFFECT', playerIndex: pIdx, choice: data.choice });
6474-             } else if (data.action === 'CONFIRM_EXCHANGE') {
6475-               setExchangeDecisions(prev => ({ ...prev, [pIdx]: data.cards }));
6476-             } else if (data.action === 'RESTART' && isGameOverRef.current) {
6477-               handleRestartRef.current();
6478-             }
6479-          })
6480-          .on('broadcast', { event: 'ACTION_REJECTED' }, (payload) => {
6481-             if (isHostMode) return;
6482-             if (payload.payload.playerIndex === myPlayerIndex) {
6483-               setIsActionLoading(false);
6484-               showMessage('INVALID SACRIFICE', 'ホスト側でそのカードは場に出せないと判定されました');
6485-             }
6486-          });
6487-
6488-        channel.subscribe(async (status) => {
6489-          if (status === 'SUBSCRIBED') {
6490-            await channel.track({ ...myPlayerData, joined_at: new Date().toISOString() });
6491-          }
6492-        });
6493-      };
6494-
6495-      const startAsHost = (hostId) => joinRoomAndSyncPresence(hostId, { name: myProfile.display_name, avatar: myProfile.avatar }, true);
6496-      const joinAsGuest = (hostId) => joinRoomAndSyncPresence(hostId, { name: myProfile.display_name, avatar: myProfile.avatar }, false);
6497-
6498-      const broadcastEvent = async (eventData) => {
6499-        if (!roomChannel) return;
6500-        await roomChannel.send({ type: 'broadcast', event: 'EVENT', payload: eventData });
6501-      };
6502-
6503-      const sendActionToHost = async (actionData) => {
6504-        if (!roomChannel || isHost) return;
6505-        await roomChannel.send({ type: 'broadcast', event: 'ACTION', payload: { ...actionData, playerIndex: myPlayerIndex } });
6506-      };
6507-
6508-      const getDisplayIndex = (i) => {
6509-        if (!gameStarted || multiplayerMode !== 'active') return i;
6510-        return (i - myPlayerIndex + 4) % 4;
6511-      };
6512-
6513-      // Edge animation start points
6514-      const getPlayerEdgePosition = (playerIndex) => {
6515-        const dispIdx = getDisplayIndex(playerIndex);
6516-        
6517-        const isMobile = window.innerWidth <= 768;
6518-        const yOffset = isMobile ? '38vh' : '42vh';
6519-        const xOffset = isMobile ? '38vw' : '42vw';
6520-
6521-        switch (dispIdx) {
6522-          case 0: return { top: `calc(50% + ${yOffset})`, left: '50%', rot: '0deg' };
6523-          case 1: return { top: '50%', left: `calc(50% - ${xOffset})`, rot: '90deg' };
6524-          case 2: return { top: `calc(50% - ${yOffset})`, left: '50%', rot: '180deg' };
6525-          case 3: return { top: '50%', left: `calc(50% + ${xOffset})`, rot: '-90deg' };
6526-          default: return { top: '50%', left: '50%', rot: '0deg' };
6527-        }
6528-      };
6529-
6530-      const broadcastState = async (currentHands, nextTurnValue = null, customRemotePlayers = null) => {
6531-        if (!isHost || !roomChannel) return;
6532-        const baseState = {
6533-          hands: currentHands,
6534-          tableCards,
6535-          previousTableCards,
6536-          turn: nextTurnValue !== null ? nextTurnValue : turn,
6537-          gameStarted: true,
6538-          ranksDiscovered,
6539-          isGameOver,
6540-          roundResults,
6541-          exchangePhase,
6542-          passCount,
6543-          lastPlayPlayer,
6544-          is11Back,
6545-          isRevolution,
6546-          playDirection,
6547-          graveyard,
6548-          remotePlayers: customRemotePlayers || remotePlayers
6549-        };
6550-
6551-        await roomChannel.send({
6552-          type: 'broadcast',
6553-          event: 'STATE_UPDATE',
6554-          payload: { state: baseState }
6555-        });
6556-        
6557-        // Update local state (Host is player 0)
6558-        setHands(currentHands);
6559-        if (nextTurnValue !== null) setTurn(nextTurnValue);
6560-      };
6561-
6562-      const startMultiplayerGame = () => {
6563-        const deck = shuffle(createDeck());
6564-        const newHands = [[], [], [], []];
6565-        let i = 0;
6566-        while (deck.length > 0) {
6567-          newHands[i % 4].push(deck.pop());
6568-          i++;
6569-        }
6570-        const sortedHands = newHands.map(h => sortHand(h));
6571-        
6572-        let finalRemotePlayers = [...remotePlayers];
6573-        for (let j = finalRemotePlayers.length; j < 4; j++) {
6574-          finalRemotePlayers.push({ id: `cpu${j}`, name: `CPU ${j}` });
6575-        }
6576-        setRemotePlayers(finalRemotePlayers);
6577-        
6578-        broadcastState(sortedHands, 0, finalRemotePlayers);
6579-        setGameStarted(true);
6580-        setMultiplayerMode('active');
6581-        setMyPlayerIndex(0);
6582-      };
6583-
6584-      const triggerTempEffect = (setter, time = 1000) => {
6585-        setter(true);
6586-        setTimeout(() => setter(false), time);
6587-      };
6588-
6589-      const triggerMiss = (playerIndex) => {
6590-        setMissEffectTarget(playerIndex);
6591-        sm.playShieldMissSE();
6592-        setTimeout(() => setMissEffectTarget(null), 600); // 弾き演出が0.6sになったので少し長めに
6593-      };
6594-
6595-      const compareStrength = (targetSt, tableSt) => {
6596-        // JOKER単体(13)は最強だが、JOKERがなり変わった後の強さは各数字に従う
6597-        if (targetSt === 13 && tableSt !== 13) return true;
6598-        if (tableSt === 13 && targetSt !== 13) return false;
6599-        if (targetSt === 13 && tableSt === 13) return false; // JOKERはJOKERに勝てない
6600-        
6601-        const isInverse = isRevolution !== is11Back;
6602-        return isInverse ? targetSt < tableSt : targetSt > tableSt;
6603-      };
6604-
6605-      const sortHand = (hand, revOverride = null, b11Override = null) => {
6606-        const rev = revOverride !== null ? revOverride : isRevolution;
6607-        const b11 = b11Override !== null ? b11Override : is11Back;
6608-        return [...hand].sort((a, b) => {
6609-          if (a.strength === 13) return 1;
6610-          if (b.strength === 13) return -1;
6611-          const isInverse = rev !== b11;
6612-          return isInverse ? b.strength - a.strength : a.strength - b.strength;
6613-        });
6614-      };
6615-
6616-      const getNextPlayer = (current, steps = 1, forceDirection = null, currentRanks = null) => {
6617-        let count = 0;
6618-        let next = current;
6619-        const dir = forceDirection !== null ? forceDirection : playDirection;
6620-        const ranks = currentRanks || ranksDiscovered;
6621-        while (count < steps) {
6622-          next = (next + dir + 4) % 4;
6623-          if (!ranks.includes(next)) count++;
6624-        }
6625-        return next;
6626-      };
6627-
6628-      const executeNextTurn = (startIndex, steps = 1, forceDirection = null, excludeRanks = null) => {
6629-        setIsActionLoading(false); // 次のターンへ行くときに必ず解除
6630-        const nextTarget = getNextPlayer(startIndex, steps, forceDirection, excludeRanks);
6631-        if (nextTarget === turn) {
6632-          // 同一プレイヤーにターンが回る場合（8切り等）、思考フラグをリセット
6633-          cpuThinkingRef.current = false;
6634-          // useEffectを発火させるために一瞬-1にする（必要に応じて）
6635-          setTurn(-1);
6636-          setTimeout(() => setTurn(nextTarget), 10);
6637-        } else {
6638-          setTurn(nextTarget);
6639-        }
6640-      };
6641-
6642-      const triggerClearFieldAnim = (callback) => {
6643-        setIsAnimating(true);
6644-        setIsAltarActive(true); // 祭壇を活性化
6645-        setTimeout(() => {
6646-          callback();
6647-          setIsAnimating(false);
6648-          setTimeout(() => setIsAltarActive(false), 800); // 吸い込まれたら閉じる
6649-        }, 300); // 1200msから300msに短縮し、祭壇オープン後すぐに吸い込み開始
6650-      };
6651-
6652-      const clearFieldLogic = (newGraveyard = null) => {
6653-        let currentGy = newGraveyard || [...graveyard];
6654-        let cardsOnly = tableCards.map(tc => tc.card);
6655-
6656-        if (cardsOnly.length > 0) {
6657-          const isServiceAce = cardsOnly.every(c => c.rank === 'A');
6658-          if (isServiceAce && lastPlayPlayer !== null && !ranksDiscovered.includes(lastPlayPlayer)) {
6659-            const h = [...hands];
6660-            h[lastPlayPlayer] = [...h[lastPlayPlayer], ...cardsOnly];
6661-            setHands(h);
6662-            showMessage('SERVICE ACE', `呪われたAが プレイヤー${lastPlayPlayer} の手元へ帰還`);
6663-          } else {
6664-            // ここでアニメーション用に discardingToGy をセットする (fromPlayer: 'center' を指定)
6665-            setDiscardingToGy(cardsOnly.map(c => ({ card: c, fromPlayer: 'center' })));
6666-            setTimeout(() => {
6667-              setDiscardingToGy([]);
6668-              setGraveyard(prev => [...prev, ...cardsOnly]);
6669-            }, 1300);
6670-          }
6671-        }
6672-        // Plus 5 combo check for clear field logic
6673-        const isPlus5Combo = tableCards.length === 2 && tableCards.some(tc => tc.card.rank === '5');
6674-        if (isPlus5Combo) {
6675-          setIsPlus5Active(true);
6676-          setTimeout(() => setIsPlus5Active(false), 3000);
6677-        }
6678-        setTableCards([]);
6679-        setPreviousTableCards([]);
6680-        setPassedPlayers([]);
6681-        setIsShielded([false, false, false, false]);
6682-        setIs11Back(false);
6683-        setGraveyard(currentGy);
6684-      };
6685-
6686-      const executePass = (playerIndex) => {
6687-        const activePlayersCount = 4 - ranksDiscovered.length;
6688-        const newPassCount = passCount + 1;
6689-
6690-        // 場に出ているカードがあり、自分以外の全員がパスした場合
6691-        if (newPassCount >= activePlayersCount - 1 && tableCards.length > 0) {
6692-          triggerClearFieldAnim(() => {
6693-            clearFieldLogic();
6694-            let nextStarter = lastPlayPlayer;
6695-            // 既に上がっている場合は次のプレイヤーから開始
6696-            const currentRanks = ranksDiscovered; // 呼び出し時点の最新
6697-            if (currentRanks.includes(nextStarter)) {
6698-              nextStarter = getNextPlayer(nextStarter, 1, null, currentRanks);
6699-            }
6700-            // 自動的に次の手番を開始
6701-            setTurn(-1);
6702-            setIsActionLoading(false); // UIロック解除
6703-            setTimeout(() => setTurn(nextStarter), 10);
6704-          });
6705-        } else {
6706-          setPassCount(newPassCount);
6707-          setPassedPlayers(prev => [...new Set([...prev, playerIndex])]);
6708-
6709-          // 残り1人かチェック
6710-          const remaining = [0, 1, 2, 3].filter(p => !ranksDiscovered.includes(p));
6711-          if (ranksDiscovered.length === 3 && remaining.length === 1) {
6712-            const lastP = remaining[0];
6713-            const finalRanks = [...ranksDiscovered, lastP];
6714-            setRanksDiscovered(finalRanks);
6715-            setRoundResults(finalRanks);
6716-            setIsGameOver(true);
6717-            setTurn(-1);
6718-            if (sm.playJBackSE) sm.playJBackSE();
6719-            return;
6720-          }
6721-
6722-          if (isHost) broadcastEvent({ event: 'PASS', playerIndex: playerIndex });
6723-          executeNextTurn(playerIndex, 1, null, ranksDiscovered);
6724-        }
6725-      };
6726-
6727-      const isValidPlay = (cardsToPlay) => {
6728-        if (cardsToPlay.length === 0) return false;
6729-
6730-        // Check for Plus 5 combination (5 + one card from {A, 2, 3, 4, 6, 7, 8})
6731-        if (cardsToPlay.length === 2 && (tableCards.length === 0 || tableCards.length === 1)) {
6732-          const has5 = cardsToPlay.some(c => c.rank === '5');
6733-          if (has5) {
6734-            const other = cardsToPlay.find(c => c.rank !== '5') || cardsToPlay[0];
6735-            const allowed = ['A', '2', '3', '4', '5', '6', '7', '8'];
6736-            if (allowed.includes(other.rank)) {
6737-              // Valid Plus 5! Calculate effective strength
6738-              let effectiveStrength = 13;
6739-              if (other.rank === '5' && cardsToPlay[0].rank === '5') {
6740-                 // 5 + 5 result in rank 10
6741-                 effectiveStrength = RANKS.indexOf('10');
6742-              } else {
6743-                 const total = rankToValue(other.rank) + 5;
6744-                 const resRank = valueToRank(total);
6745-                 effectiveStrength = RANKS.indexOf(resRank);
6746-              }
6747-              if (tableCards.length === 0) return true;
6748-              const tableStrength = tableCards[0].card.strength;
6749-              return compareStrength(effectiveStrength, tableStrength);
6750-            }
6751-          }
6752-        }
6753-
6754-        // JOKERのワイルドカード判定
6755-        const nonJokers = cardsToPlay.filter(c => c.rank !== 'Joker');
6756-        let effectiveStrength = 13;
6757-
6758-        if (nonJokers.length > 0) {
6759-          const firstRank = nonJokers[0].rank;
6760-          if (!nonJokers.every(c => c.rank === firstRank)) return false;
6761-          effectiveStrength = nonJokers[0].strength;
6762-        }
6763-
6764-        const tableEffectiveCount = getEffectiveCount(tableCards.map(tc => tc.card));
6765-        const playEffectiveCount = getEffectiveCount(cardsToPlay);
6766-
6767-        if (tableCards.length === 0) return true;
6768-        if (playEffectiveCount !== tableEffectiveCount) return false;
6769-
6770-        const tableStrength = tableCards[0].card.strength;
6771-        return compareStrength(effectiveStrength, tableStrength);
6772-      };
6773-
6774-      const evaluateSpecialEffects = (playerIndex, playedCards, currentHands, currentGraveyard) => {
6775-        let title = ''; let desc = ''; let steps = 1; let pDir = playDirection;
6776-        let gy = [...currentGraveyard]; let h = [...currentHands];
6777-        let shieldStates = [...isShielded]; let is11B = is11Back; let isFieldCleared = false;
6778-        let isRev = isRevolution; 
6779-        let isAsync = false; // Add this flag
6780-        let phoenixDrawn = null; // 6フェニックスで引いたカード情報
6781-
6782-        let nonJokers = playedCards.filter(c => c.rank !== 'Joker');
6783-        let effectiveRank = nonJokers.length > 0 ? nonJokers[0].rank : 'Joker';
6784-        
6785-        // Plus 5 override rank
6786-        if (playedCards.length === 2 && playedCards.some(c => c.rank === '5')) {
6787-          const other = playedCards.find(c => c.rank !== '5');
6788-          if (other && ['A', '2', '3', '4', '6', '7', '8'].includes(other.rank)) {
6789-             const total = rankToValue(other.rank) + 5;
6790-             effectiveRank = valueToRank(total);
6791-          } else if (!other) {
6792-             // 5+5
6793-             effectiveRank = '10_NO_EFFECT'; // Mark as no effect per user request
6794-          }
6795-        }
6796-
6797-        const rank = effectiveRank;
6798-        const isPlus5Combo = playedCards.length === 2 && playedCards.some(c => c.rank === '5') && playedCards.some(c => c.rank !== '5');
6799-        const effectDelay = isPlus5Combo ? 6500 : 3400;
6800-        const count = isPlus5Combo ? 1 : playedCards.length; // プラス5の合成は1枚出し判定とする
6801-        const tcg = TCG_DATA[rank];
6802-
6803-        if (tcg) {
6804-          title = tcg.name;
6805-          desc = tcg.desc || '';
6806-          if (playedCards.some(c => c.rank === 'Joker') && nonJokers.length > 0) {
6807-            title = `🃏真・${tcg.name}`;
6808-            desc = `JOKERが ${rank} になり代わり、${count}連鎖の呪いが発動`;
6809-          }
6810-        } else if (rank === '10_NO_EFFECT') {
6811-          title = 'プラス5'; // 「連鎖」を削除
6812-          desc = '効果なし（ただの5の2枚出し）';
6813-        }
6814-
6815-        // 革命判定 (同時出しが4枚以上)
6816-        if (playedCards.length >= 4) {
6817-          isRev = !isRev;
6818-          setIsRevolution(isRev);
6819-          title = "革命 (REVOLUTION)";
6820-          desc = isRev ? "世界の理が逆転" : "世界の理が元に復帰";
6821-        }
6822-
6823-        if (rank === '4') {
6824-          shieldStates[playerIndex] = true;
6825-        }
6826-
6827-        if (rank === '6') {
6828-          if (gy.length > 0) {
6829-            setIsAltarActive(true);
6830-            triggerTempEffect(setPhoenixActive, 1500);
6831-            const drawCount = Math.min(count, gy.length);
6832-            let drawn = [];
6833-            for (let i = 0; i < drawCount; i++) {
6834-              const rIndex = Math.floor(Math.random() * gy.length);
6835-              const card = gy.splice(rIndex, 1)[0];
6836-              drawn.push(card);
6837-            }
6838-            // drawnをexecut ePlay側の演出へ渡すためresultに保存
6839-            phoenixDrawn = { drawn, playerIndex };
6840-            isAsync = true;
6841-            title = `${tcg.name} x${count}`;
6842-            desc = `死者${drawCount}名が冥界より帰還`;
6843-            steps = 1;
6844-          } else { title = tcg?.name; desc = '墓地が空のため蘇生失敗'; }
6845-        }
6846-        if (rank === '7') {
6847-          if (h[playerIndex].length > 0) {
6848-            const nextP = getNextPlayer(playerIndex, 1, pDir);
6849-            if (shieldStates[nextP]) {
6850-              // シールド所持者へ渡そうとした場合：カードが使用者に戻ってくる
6851-              triggerMiss(nextP);
6852-              title = 'SHIELD REPEL'; desc = `呪文の壁が血の契約を拒絶した`;
6853-              
6854-              const passCount = Math.min(count, h[playerIndex].length);
6855-              for (let i = 0; i < passCount; i++) {
6856-                const cIndex = Math.floor(Math.random() * h[playerIndex].length);
6857-                const card = h[playerIndex][cIndex] || { id: 'dummy', suit: '♠', rank: '?' };
6858-                const newFly = { from: playerIndex, to: nextP, card: { ...card, rank: '?' }, type: 'shield-repel', id: Math.random(), delay: i * 0.3 };
6859-                setFlyingCards(prev => [...prev, newFly]);
6860-              }
6861-              setIsAnimating(true);
6862-              setTimeout(() => {
6863-                setFlyingCards(prev => prev.filter(f => f.type !== 'shield-repel'));
6864-                setIsAnimating(false);
6865-              }, 1500 + passCount * 300);
6866-              
6867-              isAsync = true;
6868-              steps = 1;
6869-            } else {
6870-              triggerTempEffect(setPassThreadActive, 1000);
6871-              const rp = remotePlayers[playerIndex];
6872-              const isHumanGuest = multiplayerMode === 'active' && isHost && rp && rp.id !== 'local' && !rp.id.startsWith('cpu');
6873-              if (playerIndex === myPlayerIndexRef.current) {
6874-                // カットイン演出(800ms開始+2500ms)終了後にUIを表示
6875-                setTimeout(() => {
6876-                  setSelectionMode('7');
6877-                  setSelectionInfo({ playerIndex, nextP, count: Math.min(count, h[playerIndex].length), isSpecialEffect: true });
6878-                }, 3300);
6879-                steps = 0;
6880-              } else if (isHumanGuest) {
6881-                // ゲストの入力を待つ
6882-                steps = 0;
6883-              } else {
6884-                const passCount = Math.min(count, h[playerIndex].length);
6885-                let passed = [];
6886-                for (let i = 0; i < passCount; i++) {
6887-                  const cIndex = Math.floor(Math.random() * h[playerIndex].length);
6888-                  const card = h[playerIndex].splice(cIndex, 1)[0];
6889-                  passed.push(card);
6890-
6891-                  // 7渡し：裏向きで移動させる
6892-                  const newFly = { from: playerIndex, to: nextP, card: { ...card, rank: '?' }, type: 'pass', id: Math.random(), delay: i * 0.5 };
6893-                  setFlyingCards(prev => [...prev, newFly]);
6894-                  setIsAnimating(true);
6895-                  setTimeout(() => {
6896-                    setFlyingCards(prev => prev.filter(f => f.id !== newFly.id));
6897-                    h[nextP].push(card);
6898-                    if (nextP === 0) {
6899-                      setHighlightedCardIds(prev => [...prev, card.id]);
6900-                      setTimeout(() => setHighlightedCardIds(prev => prev.filter(id => id !== card.id)), 4000);
6901-                    }
6902-                    setHands([...h]);
6903-                    sm.playPaperSE();
6904-                    setReceivedHighlight(nextP);
6905-                    setTimeout(() => {
6906-                      setReceivedHighlight(null);
6907-                      setIsAnimating(false);
6908-                      // 7渡しによる次手番への影響を最小限に（async終了後executeNextTurnが走る）
6909-                    }, 1500);
6910-                  }, 2000 + i * 500);
6911-                }
6912-                isAsync = true; // Mark as async
6913-                title = `${tcg.name} x${count}`;
6914-                desc = `契約により${passCount}枚の生贄を譲渡`;
6915-                steps = 1; // 7の後、次は順当に次の人
6916-              }
6917-            }
6918-          }
6919-        }
6920-        if (rank === '8') {
6921-          isFieldCleared = true; steps = 0;
6922-          if (!isPlus5Combo) {
6923-            triggerTempEffect(setGuillotineActive, 1200);
6924-          }
6925-        }
6926-        if (rank === '9') {
6927-          pDir = pDir * -1;
6928-          setPlayDirection(pDir); // 正しい状態更新関数名
6929-          triggerTempEffect(setReverseActive, 1800);
6930-        }
6931-        if (rank === '10') {
6932-          if (h[playerIndex].length > 0) {
6933-            setIsAnimating(true);
6934-            if (playerIndex === myPlayerIndexRef.current) {
6935-              // カットイン演出(800ms開始+2500ms)終了後にUIを表示
6936-              setTimeout(() => {
6937-                setSelectionMode('10');
6938-                setSelectionInfo({ playerIndex, count: Math.min(count, h[playerIndex].length), isSpecialEffect: true });
6939-              }, effectDelay);
6940-              steps = 0;
6941-            } else {
6942-              const rp = remotePlayers[playerIndex];
6943-              const isHumanGuest = multiplayerMode === 'active' && isHost && rp && rp.id !== 'local' && !rp.id.startsWith('cpu');
6944-              if (isHumanGuest) {
6945-                steps = 0;
6946-              } else {
6947-                const dropCount = Math.min(count, h[playerIndex].length);
6948-                let dropped = [];
6949-              for (let i = 0; i < dropCount; i++) {
6950-                const cIndex = Math.floor(Math.random() * h[playerIndex].length);
6951-                const card = h[playerIndex].splice(cIndex, 1)[0];
6952-                dropped.push(card);
6953-              }
6954-              // 捨て逃げ
6955-              setIsAltarActive(true);
6956-              setDiscardingToGy(dropped.map(c => ({ card: c, fromPlayer: playerIndex })));
6957-              setIsAnimating(true);
6958-              isAsync = true; // Mark as async
6959-              setTimeout(() => {
6960-                setDiscardingToGy([]);
6961-                setGraveyard(prev => [...prev, ...dropped]);
6962-                 setGyShuffling(true);
6963-                setTimeout(() => {
6964-                  setGyShuffling(false);
6965-                  setIsAnimating(false);
6966-                  setTimeout(() => setIsAltarActive(false), 800);
6967-                }, 1200);
6968-              }, effectDelay - 2000 + dropCount * 120);
6969-              steps = 1;
6970-            }
6971-          }
6972-        }
6973-        if (rank === 'J') {
6974-          is11B = true;
6975-        }
6976-        if (rank === 'Q') {
6977-          const targetRank = RANKS[Math.floor(Math.random() * RANKS.length)];
6978-          if (playerIndex === myPlayerIndexRef.current) {
6979-            // カットイン演出(800ms開始+2500ms)終了後にUIを表示
6980-            setTimeout(() => {
6981-              setSelectionMode('Q');
6982-              // Qボンバーは出した枚数分選択可能
6983-              setSelectionInfo({ playerIndex, count: Math.min(count, RANKS.length) });
6984-            }, effectDelay);
6985-            steps = 0;
6986-          } else {
6987-            const rp = remotePlayers[playerIndex];
6988-            const isHumanGuest = multiplayerMode === 'active' && isHost && rp && rp.id !== 'local' && !rp.id.startsWith('cpu');
6989-            if (isHumanGuest) {
6990-              steps = 0;
6991-            } else {
6992-              isAsync = true;
6993-              setTimeout(() => {
6994-                triggerTempEffect(setBomberActive, 2000);
6995-              }, effectDelay);
6996-
6997-            let targetRanks = [];
6998-            let rShuffled = [...RANKS].sort(() => Math.random() - 0.5);
6999-            targetRanks = rShuffled.slice(0, count);
7000-
7001-            let bombCount = 0;
7002-            let tempH = [...h];
7003-            let affectedPlayers = [];
7004-            let shieldedPlayers = [];
7005-
7006-            let bombedCards = [];
7007-
7008-            targetRanks.forEach(tr => {
7009-              for (let i = 0; i < 4; i++) {
7010-                const drop = h[i].filter(c => c.rank === tr);
7011-                if (drop.length > 0) {
7012-                  if (shieldStates[i]) {
7013-                    // シールド所持者は自身であっても爆破されず弾き演出
7014-                    triggerMiss(i);
7015-                    if (!shieldedPlayers.includes(i)) shieldedPlayers.push(i);
7016-                    continue;
7017-                  }
7018-                  bombCount += drop.length;
7019-                  bombedCards.push(...drop);
7020-                  // gy.push(...drop); // delayed until animation
7021-                  tempH[i] = tempH[i].filter(c => c.rank !== tr);
7022-                  if (!affectedPlayers.includes(i)) affectedPlayers.push(i);
7023-                }
7024-              }
7025-            });
7026-
7027-            setTimeout(() => {
7028-              setExplodingCards(affectedPlayers.map(pIdx => ({ playerIndex: pIdx, rank: targetRanks[0] })));
7029-              setCentralBombCards(bombedCards);
7030-            }, effectDelay);
7031-
7032-            setTimeout(() => {
7033-              setExplodingCards([]);
7034-              setCentralBombCards([]);
7035-              setGraveyard(prev => [...prev, ...bombedCards]);
7036-              // Removed internal executeNextTurn call
7037-            }, effectDelay + 2500); // Wait for cut-in before graveyard move
7038-
7039-            h = tempH;
7040-            const shieldNote = shieldedPlayers.length > 0 ? ` (シールドにより${shieldedPlayers.length}人は無効)` : '';
7041-            title = `${tcg?.name} [${targetRanks.join(',')}] x${count}`;
7042-            desc = `全領域から${bombCount}枚が灰燼に帰した${shieldNote}`;
7043-            triggerAbilityLog(`Qボンバー: ${targetRanks.join(',')}`);
7044-          }
7045-          }
7046-        }
7047-        if (rank === 'K') {
7048-          setIsAnimating(true);
7049-          if (playerIndex === 0 || playerIndex === myPlayerIndexRef.current) {
7050-            // カットイン演出(800ms開始+2500ms)終了後にUIを表示
7051-            setTimeout(() => {
7052-              setWatchSelecting(true);
7053-              setSelectionInfo({ playerIndex, count });
7054-            }, effectDelay);
7055-            steps = 0;
7056-          } else {
7057-            const rp = remotePlayers[playerIndex];
7058-            const isHumanGuest = multiplayerMode === 'active' && isHost && rp && rp.id !== 'local' && !rp.id.startsWith('cpu');
7059-            if (isHumanGuest) {
7060-              steps = 0;
7061-            } else {
7062-            const watchDuration = 5000;
7063-            // シールド所持者はKウォッチの対象から除外
7064-            const others = [0, 1, 2, 3].filter(v => v !== playerIndex && !ranksDiscovered.includes(v) && !shieldStates[v]);
7065-            // シールドで全員除外された場合は弾き演出
7066-            if (others.length === 0) {
7067-              const shieldedOthers = [0, 1, 2, 3].filter(v => v !== playerIndex && !ranksDiscovered.includes(v) && shieldStates[v]);
7068-              if (shieldedOthers.length > 0) triggerMiss(shieldedOthers[0]);
7069-              title = 'SHIELD BLOCK'; desc = `呪文の壁が邪眼を完全に遮断した`; setIsAnimating(false);
7070-              return { h, gy, shieldStates, is11B, isRev, isFieldCleared, steps: 1, pDir, isAsync };
7071-            }
7072-            
7073-            const targetCount = Math.min(count, others.length);
7074-            let targets = [];
7075-            let tempOthers = [...others];
7076-            for (let i = 0; i < targetCount; i++) {
7077-              const tIndex = Math.floor(Math.random() * tempOthers.length);
7078-              targets.push(tempOthers[tIndex]);
7079-              tempOthers.splice(tIndex, 1);
7080-            }
7081-
7082-            if (false) { /* シールド除外済みなのでここは到達しない */ }
7083-            else {
7084-              setWatchTarget({
7085-                targetIndexes: targets,
7086-                activatorIndex: playerIndex,
7087-                endTime: Date.now() + watchDuration
7088-              });
7089-              title = `${tcg.name} x${count}`; desc = `${watchDuration / 1000}秒間、魂の中身を暴き続ける`;
7090-              setTimeout(() => {
7091-                setWatchTarget(null);
7092-                setIsAnimating(false);
7093-                // Removed internal executeNextTurn call
7094-              }, watchDuration);
7095-            }
7096-            isAsync = true; // Mark as async
7097-          }
7098-          }
7099-        }
7100-
7101-        // if (title) showMessage(title, desc); // Removed to avoid overlapping with cut-in
7102-
7103-        // Kウォッチ選択モードでない場合のみターンの処理を返す
7104-        const rp = remotePlayers[playerIndex];
7105-        const isHumanGuest = multiplayerMode === 'active' && isHost && rp && rp.id !== 'local' && !rp.id.startsWith('cpu');
7106-        const kWait = rank === 'K' && (playerIndex === 0 || playerIndex === myPlayerIndexRef.current || isHumanGuest);
7107-        return { h, gy, shieldStates, is11B, isRev, isFieldCleared, steps: kWait ? 0 : steps, pDir, isAsync, phoenixDrawn };
7108-      };
7109-
7110-      const executePlay = (playerIndex, cards) => {
7111-        if (playerIndex === 0) setIsActionLoading(true);
7112-        sm.playPaperSE();
7113-        // Helper to trigger character cut‑in based on rank
7114-        const triggerCutIn = (rank, comboData = null) => {
7115-          let tcg = TCG_DATA[rank];
7116-          if (!tcg && rank !== '5_SOLO') return;
7117-
7118-          let aura = tcg ? (tcg.auraColor || '#b8860b') : '#b8860b';
7119-          let name = tcg ? tcg.name : '';
7120-          let desc = tcg ? tcg.desc : '';
7121-          let url = tcg ? tcg.url : '';
7122-
7123-          if (rank === '5_SOLO') {
7124-            const t5 = TCG_DATA['5'];
7125-            tcg = t5;
7126-            name = 'プラス5';
7127-            desc = '単独での効果なし';
7128-            url = t5.url;
7129-            aura = '#f1c40f';
7130-          }
7131-
7132-          if (comboData) {
7133-            // ===== プラス5コンボ: 4フェーズ演出 =====
7134-            // Phase 1: +5カード単独カットイン（0s〜1.2s）
7135-            sm.playEffectSE('5');
7136-            setCutIn({ name, effect: desc, url, rank: '5', auraColor: '#f1c40f', comboData, comboPhase: 1 });
7137-
7138-            // Phase 2: +5が左へスライドアウト → 追加カードが中央に登場（1.2s〜2.7s）
7139-            setTimeout(() => {
7140-              const otherRank = comboData.otherRank;
7141-              sm.playEffectSE(otherRank); // 追加カードのSEを再生
7142-              setCutIn(prev => prev ? { ...prev, comboPhase: 2 } : null);
7143-            }, 1200);
7144-
7145-            // Phase 3: +5が左から戻り、中央で合体 + 赤い爆発（2.7s〜4.0s）
7146-            setTimeout(() => {
7147-              setCutIn(prev => prev ? { ...prev, comboPhase: 3 } : null);
7148-            }, 2800);
7149-
7150-            // Phase 4: 赤い演出と同時に合計カードのカットイン
7151-            setTimeout(() => {
7152-              const resRank = comboData.resultRank;
7153-              const resTcg = TCG_DATA[resRank];
7154-              sm.playEffectSE(resRank);
7155-              setCutIn(prev => prev ? { ...prev, comboPhase: 4, rank: resRank, auraColor: resTcg?.auraColor || '#b8860b' } : null);
7156-            }, 3400); // Phase3(2800ms) + カード合体(0.7s) - フラッシュが出始める直後
7157-
7158-            setTimeout(() => setCutIn(null), 6500);
7159-          } else {
7160-            // 通常カットイン
7161-            sm.playEffectSE(rank === '5_SOLO' ? '5' : (rank === '10_NO_EFFECT' ? '5' : rank));
7162-            setCutIn({ name, effect: desc, url, rank: (rank === '5_SOLO' ? '5' : (rank === '10_NO_EFFECT' ? '5' : rank)), auraColor: aura, comboData: null });
7163-            setTimeout(() => setCutIn(null), 2500);
7164-          }
7165-        };
7166-
7167-        let newHands = [...hands];
7168-        newHands[playerIndex] = newHands[playerIndex].filter(c => !cards.find(sc => sc.id === c.id));
7169-
7170-        const startEdge = getPlayerEdgePosition(playerIndex);
7171-        const isPlus5Combo = cards.length === 2 && cards.some(c => c.rank === '5') && cards.some(c => c.rank !== '5');
7172-
7173-        let styledTableCards = cards.map((c, idx) => {
7174-          let tgtLeft, tgtTop;
7175-          if (isPlus5Combo) {
7176-             // Side-by-side in center
7177-             tgtLeft = idx === 0 ? 'calc(50% - 65px)' : 'calc(50% + 65px)';
7178-             tgtTop = '50%';
7179-          } else {
7180-             tgtLeft = `calc(50% + ${Math.random() * 60 - 30}px)`;
7181-             tgtTop = `calc(50% + ${Math.random() * 60 - 30}px)`;
7182-          }
7183-          const tgtTransform = isPlus5Combo ? `translate(-50%, -50%) scale(0.8) rotate(0deg)` : `translate(-50%, -50%) rotate(${Math.random() * 45 - 22}deg)`;
7184-
7185-          return {
7186-            card: c, isAnimating: true, isSlammed: false,
7187-            initialStyle: { top: startEdge.top, left: startEdge.left, transform: `translate(-50%, -50%) scale(0.8) rotate(${startEdge.rot || '0deg'})`, marginLeft: 0 },
7188-            targetStyle: { top: tgtTop, left: tgtLeft, transform: tgtTransform, marginLeft: 0 }
7189-          };
7190-        });
7191-        
7192-        // Calculate effective rank for visual cut-in
7193-        const nonJokers = cards.filter(c => c.rank !== 'Joker');
7194-        let effectiveVisualRank = nonJokers.length > 0 ? nonJokers[0].rank : 'Joker';
7195-        if (cards.length === 2 && cards.some(c => c.rank === '5')) {
7196-          const other = cards.find(c => c.rank !== '5');
7197-          if (other && ['A', '2', '3', '4', '6', '7', '8'].includes(other.rank)) {
7198-             const total = rankToValue(other.rank) + 5;
7199-             effectiveVisualRank = valueToRank(total);
7200-          } else {
7201-             effectiveVisualRank = '5_SOLO';
7202-          }
7203-        } else if (cards.length === 1 && cards[0].rank === '5') {
7204-          effectiveVisualRank = '5_SOLO';
7205-        }
7206-        
7207-        // --- STAGE 1: Land side-by-side or normally ---
7208-        setTimeout(() => {
7209-          if (isPlus5Combo) {
7210-             const other = cards.find(c => c.rank !== '5');
7211-             triggerCutIn('5', { otherRank: other.rank, resultRank: effectiveVisualRank }); // Start Cinematic Merger
7212-          } else {
7213-             triggerCutIn(effectiveVisualRank); // Standard cards cut-in immediately
7214-          }
7215-        }, 800);
7216-        
7217-        setPreviousTableCards(prev => [...prev, ...tableCards.map(tc => ({ ...tc, isOld: true }))]);
7218-        setTableCards(styledTableCards);
7219-
7220-        // --- STAGE 2 & 3: Plus 5 場に合体カードを出すのは全カットイン終了後 ---
7221-        if (isPlus5Combo) {
7222-          // カットイン全期間終了後に場に合体カードを表示（800ms後からカットイン開始し〗6500ms経過後）
7223-          setTimeout(() => {
7224-            const resRank = effectiveVisualRank;
7225-            const mergedCard = { id: `merged_${Date.now()}`, suit: 'Magic', rank: resRank, strength: RANKS.indexOf(resRank) };
7226-            const finalPos = { top: '50%', left: '50%', transform: 'translate(-50%, -50%) scale(1.1) rotate(0deg)' };
7227-            setTableCards([{
7228-              card: mergedCard, isAnimating: false, isSlammed: true,
7229-              initialStyle: finalPos, targetStyle: finalPos
7230-            }]);
7231-            if (sm.playSlamSE) sm.playSlamSE();
7232-          }, 800 + 3400); // Phase4カットイン開始と同時
7233-        }
7234-        // ---------------------------------------------
7235-
7236-        let currentGraveyard = [...graveyard];
7237-        let steps = 1; let isFieldCleared = false;
7238-
7239-        const effectRes = evaluateSpecialEffects(playerIndex, cards, newHands, currentGraveyard);
7240-
7241-        newHands = effectRes.h; currentGraveyard = effectRes.gy;
7242-        setIsShielded(effectRes.shieldStates); setIs11Back(effectRes.is11B);
7243-        setIsRevolution(effectRes.isRev);
7244-        setPlayDirection(effectRes.pDir); steps = effectRes.steps; isFieldCleared = effectRes.isFieldCleared;
7245-
7246-        newHands = newHands.map(h => sortHand(h, effectRes.isRev, effectRes.is11B));
7247-        setHands(newHands); setGraveyard(currentGraveyard);
7248-
7249-        // 手札が空になったプレイヤーをランクに登録
7250-        let updatedRanks = [...ranksDiscovered];
7251-        newHands.forEach((h, idx) => {
7252-          if (h.length === 0 && !updatedRanks.includes(idx)) {
7253-            updatedRanks.push(idx);
7254-          }
7255-        });
7256-        setRanksDiscovered(updatedRanks);
7257-
7258-        if (isFieldCleared) {
7259-          const clearDelay = isPlus5Combo ? 5000 : 3400;
7260-          
7261-          if (isPlus5Combo) {
7262-            setTimeout(() => triggerTempEffect(setGuillotineActive, 1200), clearDelay - 800);
7263-          }
7264-
7265-          setTimeout(() => {
7266-            triggerClearFieldAnim(() => {
7267-              clearFieldLogic([...currentGraveyard, ...cards]);
7268-              setLastPlayPlayer(playerIndex);
7269-
7270-              let nextStarter = playerIndex;
7271-              if (updatedRanks.includes(nextStarter)) {
7272-                nextStarter = getNextPlayer(nextStarter, 1, null, updatedRanks);
7273-              }
7274-
7275-              // 同一ターン主の場合はセットするだけではuseEffectが発火しないため、一瞬-1にしてから再代入する
7276-              setTurn(-1);
7277-              setIsActionLoading(false); // UIロック解除
7278-              setTimeout(() => {
7279-                setTurn(nextStarter);
7280-              }, 50);
7281-
7282-            });
7283-          }, clearDelay); // カットイン終了後（800+2500ms）に場を流す
7284-          return;
7285-        } else {
7286-          setPassCount(0);
7287-          setPassedPlayers([]);  // カード出し時にパス状態を全員リセット
7288-          setLastPlayPlayer(playerIndex);
7289-        }
7290-
7291-        // 6フェニックス: 墓地シャッフル演出 → 1枚ずつ裏面のまま墓地から手札へ飛ぶ
7292-        if (effectRes.phoenixDrawn) {
7293-          const { drawn, playerIndex: pIdx } = effectRes.phoenixDrawn;
7294-
7295-          // カットイン終了(800ms+2500ms=3300ms)後にシャッフル開始
7296-          setTimeout(() => {
7297-            // ① 墓地シャッフル演出
7298-            setGyShuffling(true);
7299-            setTimeout(() => {
7300-              setGyShuffling(false);
7301-
7302-              // ② 1枚ずつ順番にカードを飛ばす
7303-              const flyNext = (i) => {
7304-                if (i >= drawn.length) {
7305-                  setIsAnimating(false);
7306-                  setTimeout(() => setIsAltarActive(false), 500);
7307-                  return;
7308-                }
7309-                const card = drawn[i];
7310-                sm.playPaperSE();
7311-
7312-                // ③ getBoundingClientRect()で実座標を計算しアニメ開始
7313-                triggerPhoenixCardFly(pIdx, () => {
7314-                  // ④ 飛翔完了後: sortHandで正しい位置に挿入、紫グロー開始
7315-                  setHands(prev => {
7316-                    const next = prev.map((h, idx) => idx === pIdx ? [...h, card] : h);
7317-                    next[pIdx] = sortHand(next[pIdx], effectRes.isRev, effectRes.is11B);
7318-                    return next;
7319-                  });
7320-                  setPhoenixGlowIds(prev => [...prev, card.id]);
7321-                  setTimeout(() => setPhoenixGlowIds(prev => prev.filter(id => id !== card.id)), 5000);
7322-
7323-                  // ⑤ 次のカードを200ms間隔ですぐ飛ばす
7324-                  setTimeout(() => flyNext(i + 1), 200);
7325-                });
7326-              };
7327-
7328-              flyNext(0);
7329-            }, 1200); // シャッフル演出1.2s
7330-          }, 3400); // カットイン終了後に開始
7331-        }
7332-
7333-        const playRank = cards[0].rank;
7334-        const isEffectSelecting = (playRank === '7' || playRank === '10' || playRank === 'Q' || playRank === 'K');
7335-
7336-        // 演出時間: カットイン(3300ms) + シャッフル(1200ms) + 枚数×飛翔+間隔
7337-        const PHOENIX_FLIGHT_MS = 750;  // 飛翔アニメ時間
7338-        const PHOENIX_GAP_MS   = 200;  // カード間隔（短めでサラッと）
7339-        const phoenixTotalTime = effectRes.phoenixDrawn
7340-          ? 3400 + 1200 + effectRes.phoenixDrawn.drawn.length * (PHOENIX_FLIGHT_MS + PHOENIX_GAP_MS) + 500
7341-          : 0;
7342-        const totalAnimTime = isPlus5Combo ? 9000 : (phoenixTotalTime > 0 ? phoenixTotalTime : (effectRes.isAsync ? (playRank === 'Q' ? 3500 : (playRank === 'K' ? 5000 : 3000)) : (isEffectSelecting && playerIndex === 0 ? 4000 : 2800)));
7343-
7344-        if (playerIndex === 0) setIsActionLoading(true);
7345-
7346-        setTimeout(() => {
7347-          const stepsToUse = effectRes.isAsync ? 1 : steps;
7348-
7349-          // 残り1人になったかチェック (updatedRanksを使用)
7350-          const remaining = [0, 1, 2, 3].filter(p => !updatedRanks.includes(p));
7351-          if (updatedRanks.length >= 3) {
7352-            let finalRanks = [...updatedRanks];
7353-            if (remaining.length === 1) {
7354-              finalRanks.push(remaining[0]);
7355-            }
7356-            setRanksDiscovered(finalRanks);
7357-            setRoundResults(finalRanks);
7358-            setIsGameOver(true);
7359-            setTurn(-1);
7360-            if (sm.playJBackSE) sm.playJBackSE();
7361-            return;
7362-          }
7363-
7364-          const nextTarget = getNextPlayer(playerIndex, stepsToUse, effectRes.pDir, updatedRanks);
7365-          if (multiplayerMode === 'active' && isHost) {
7366-            broadcastState(newHands, nextTarget);
7367-          }
7368-          // Ability Log for TCG (Simplified Japanese)
7369-          const tcg = TCG_DATA[effectiveVisualRank];
7370-          if (tcg && tcg.name) {
7371-            triggerAbilityLog(`${tcg.name}`);
7372-          }
7373-          executeNextTurn(playerIndex, stepsToUse, effectRes.pDir, updatedRanks);
7374-        }, totalAnimTime);
7375-      };
7376-
7377-      const playCpuTurn = () => {
7378-        let hand = sortHand([...hands[turn]]);
7379-        if (tableCards.length === 0) { executePlay(turn, [hand[0]]); cpuThinkingRef.current = false; return; }
7380-        const tableEffectiveCount = getEffectiveCount(tableCards.map(tc => tc.card));
7381-        const tableStrength = tableCards[0].card.strength;
7382-
7383-        const groups = {};
7384-        hand.forEach(c => {
7385-          if (!groups[c.strength]) groups[c.strength] = [];
7386-          groups[c.strength].push(c);
7387-        });
7388-
7389-        const strengthsKeys = Object.keys(groups).map(Number).sort((a, b) => {
7390-          if (a === 13) return 1; if (b === 13) return -1;
7391-          return is11Back ? b - a : a - b;
7392-        });
7393-
7394-        let foundPlay = null;
7395-        for (let s of strengthsKeys) {
7396-          if (compareStrength(s, tableStrength) && groups[s].length >= tableEffectiveCount) {
7397-            foundPlay = groups[s].slice(0, tableEffectiveCount); break;
7398-          }
7399-        }
7400-
7401-        if (foundPlay) {
7402-          executePlay(turn, foundPlay);
7403-          if (multiplayerMode === 'active' && isHost) broadcastEvent({ event: 'PLAY', playerIndex: turn, cards: foundPlay });
7404-        } else {
7405-          // Plus 5 Fallback for CPU
7406-          const tableEffectiveCount = getEffectiveCount(tableCards.map(tc => tc.card));
7407-          if (tableEffectiveCount === 1) {
7408-            const five = hand.find(c => c.rank === '5');
7409-            if (five) {
7410-              const allowed = ['A', '2', '3', '4', '6', '7', '8'];
7411-              const others = hand.filter(c => c.id !== five.id && allowed.includes(c.rank));
7412-              for (let o of others) {
7413-                const total = rankToValue(o.rank) + 5;
7414-                const resRank = valueToRank(total);
7415-                const s = RANKS.indexOf(resRank);
7416-                if (compareStrength(s, tableStrength)) {
7417-                  foundPlay = [five, o];
7418-                  break;
7419-                }
7420-              }
7421-            }
7422-          }
7423-          
7424-          if (foundPlay) {
7425-            executePlay(turn, foundPlay);
7426-            if (multiplayerMode === 'active' && isHost) broadcastEvent({ event: 'PLAY', playerIndex: turn, cards: foundPlay });
7427-          } else {
7428-            const passWait = tableCards.length === 0 ? 500 : 100;
7429-            setTimeout(() => {
7430-              executePass(turn);
7431-              if (multiplayerMode === 'active' && isHost) broadcastEvent({ event: 'PASS', playerIndex: turn });
7432-            }, passWait);
7433-          }
7434-        }
7435-        // 思考完了後はreset（次のsetTurn変化に委ねる）
7436-        // cpuThinkingRef.current = false; // This will be reset by the useEffect when turn changes
7437-      };
7438-
7439-      const completeSpecialEffect = (choice, remotePlayerIdx = null) => {
7440-        const { playerIndex, nextP, count } = selectionInfo;
7441-        const actingIdx = remotePlayerIdx !== null ? remotePlayerIdx : playerIndex;
7442-        if (multiplayerMode === 'active' && !isHost && remotePlayerIdx === null) {
7443-          sendActionToHost({ action: 'COMPLETE_EFFECT', choice });
7444-          // returnせずにそのままローカルで演出を実行する（楽観的UI更新）
7445-        }
7446-        if (actingIdx === myPlayerIndex) setIsActionLoading(true);
7447-
7448-        // Host uses a consistent seed or broadcasts the randomness if needed, but for now we'll just broadcast the final state.
7449-        let h = [...hands]; let gy = [...graveyard];
7450-
7451-        if (selectionMode === '7' || selectionMode === '10') {
7452-          const chosenCards = choice;
7453-          if (chosenCards.length !== count) return;
7454-
7455-          // 7渡し：次のプレイヤーがシールド中なら弾き返す
7456-          if (selectionMode === '7' && isShielded[nextP]) {
7457-            triggerMiss(nextP);
7458-            setSelectionMode(null); setSelectionInfo(null); setSelectedCards([]);
7459-            if (!watchSelecting) setTimeout(() => executeNextTurn(actingIdx, 1, null, ranksDiscovered), 1000);
7460-            return;
7461-          }
7462-
7463-          chosenCards.forEach((c, idx) => {
7464-            const hIdx = h[playerIndex].findIndex(hc => hc.id === c.id);
7465-            if (hIdx !== -1) {
7466-              const card = h[playerIndex].splice(hIdx, 1)[0];
7467-              if (selectionMode === '7') {
7468-                const newFly = { from: playerIndex, to: nextP, card: { ...card, rank: '?' }, type: 'pass', id: Math.random(), delay: idx * 0.5 };
7469-                setFlyingCards(prev => [...prev, newFly]);
7470-                setIsAnimating(true);
7471-                setTimeout(() => {
7472-                  setFlyingCards(prev => prev.filter(f => f.id !== newFly.id));
7473-                  h[nextP].push(card);
7474-                  if (nextP === 0) {
7475-                    setHighlightedCardIds(prev => [...prev, card.id]);
7476-                    setTimeout(() => setHighlightedCardIds(prev => prev.filter(id => id !== card.id)), 4000);
7477-                  }
7478-                  setHands([...h]);
7479-                  sm.playPaperSE();
7480-                  setReceivedHighlight(nextP);
7481-                  setTimeout(() => {
7482-                    setReceivedHighlight(null);
7483-                    setIsAnimating(false);
7484-                  }, 1500); // 延長
7485-                }, 1800 + idx * 500); // 延長
7486-              } else {
7487-                setDiscardingToGy(prev => [...prev, { card: card, fromPlayer: playerIndex }]);
7488-                setIsAnimating(true);
7489-                setIsAltarActive(true); // 祭壇を活性化
7490-                setTimeout(() => {
7491-                  setDiscardingToGy(prev => prev.filter(item => item.card.id !== card.id));
7492-                  setGraveyard(prev => [...prev, card]);
7493-                  if (idx === chosenCards.length - 1) {
7494-                    setGyShuffling(true);
7495-                    setTimeout(() => {
7496-                      setGyShuffling(false);
7497-                      setIsAnimating(false);
7498-                      setTimeout(() => setIsAltarActive(false), 800);
7499-                    }, 1200);
7500-                  }
7501-                }, 1300 + idx * 120);
7502-              }
7503-            }
7504-          });
7505-        }
7506-        if (selectionMode === 'Q') {
7507-          // Qは複数ランクの配列を受け取れるように
7508-          const targetRanks = Array.isArray(choice) ? choice : [choice];
7509-          triggerTempEffect(setBomberActive, 1800);
7510-          setIsAnimating(true);
7511-          let totalBombCount = 0; let tempH = [...h];
7512-          let affectedPlayers = [];
7513-          let shieldedQPlayers = [];
7514-          let bombedCards = [];
7515-
7516-          targetRanks.forEach(targetRank => {
7517-            for (let i = 0; i < 4; i++) {
7518-              const drop = h[i].filter(c => targetRank === 'Joker' ? (c.suit === 'Joker' || c.rank === 'Joker') : c.rank === targetRank);
7519-              if (drop.length > 0) {
7520-                if (isShielded[i]) {
7521-                  // シールド所持者は自身であっても爆破されず弾き演出
7522-                  triggerMiss(i);
7523-                  if (!shieldedQPlayers.includes(i)) shieldedQPlayers.push(i);
7524-                  continue;
7525-                }
7526-                totalBombCount += drop.length;
7527-                bombedCards.push(...drop);
7528-                // gy.push(...drop); // delayed
7529-                tempH[i] = tempH[i].filter(c => targetRank === 'Joker' ? !(c.suit === 'Joker' || c.rank === 'Joker') : c.rank !== targetRank);
7530-                if (!affectedPlayers.includes(i)) affectedPlayers.push(i);
7531-              }
7532-            }
7533-          });
7534-
7535-          setExplodingCards(affectedPlayers.map(pIdx => ({ playerIndex: pIdx, rank: targetRanks[0] })));
7536-          setCentralBombCards(bombedCards);
7537-          setIsAltarActive(true); // 爆発を収納
7538-          setTimeout(() => {
7539-            setExplodingCards([]);
7540-            setCentralBombCards([]);
7541-            setGraveyard(prev => [...prev, ...bombedCards]);
7542-            setGyShuffling(true);
7543-            setTimeout(() => {
7544-              setGyShuffling(false);
7545-              setIsAnimating(false);
7546-              setTimeout(() => setIsAltarActive(false), 800);
7547-            }, 1200);
7548-          }, 3500);
7549-          h = tempH;
7550-          const shieldNote = shieldedQPlayers.length > 0 ? ` (シールドにより${shieldedQPlayers.length}人は無効)` : '';
7551-          // showMessage(`Ｑボンバー [${targetRanks.join(',')}]`, `全領域から${totalBombCount}枚が消滅${shieldNote}`);
7552-        }
7553-        setHands(h); setGraveyard(gy); setSelectionMode(null); setSelectionInfo(null); setSelectedCards([]);
7554-        if (isHost) broadcastState(h);
7555-        
7556-        if (!watchSelecting) {
7557-          // アニメーション完了（約2s）待機してから次へ進む
7558-          if (actingIdx === myPlayerIndex) setIsActionLoading(true);
7559-          setTimeout(() => executeNextTurn(actingIdx, 1, null, ranksDiscovered), 2000);
7560-        }
7561-      };
7562-
7563-      const handleFlickPlay = (cardsToPlay) => {
7564-        if (turn !== myPlayerIndex || selectionMode || isAnimating || watchTarget || watchSelecting || isActionLoading) return;
7565-        const canPlay = cardsToPlay.length > 0;
7566-        if (!canPlay) return;
7567-        
7568-        if (multiplayerMode === 'active' && !isHost) {
7569-          sendActionToHost({ action: 'PLAY', cards: cardsToPlay });
7570-          executePlay(myPlayerIndex, cardsToPlay);
7571-          setSelectedCards([]);
7572-          return;
7573-        }
7574-
7575-        setIsActionLoading(true);
7576-        if (isValidPlay(cardsToPlay)) {
7577-          executePlay(myPlayerIndex, cardsToPlay); setSelectedCards([]);
7578-          if (isHost) broadcastState(hands);
7579-        } else {
7580-          setIsActionLoading(false);
7581-          showMessage('INVALID SACRIFICE', 'そのカードは場に出せない');
7582-        }
7583-      };
7584-
7585-      const handlePlay = () => {
7586-        if (turn !== myPlayerIndex || selectionMode || isAnimating || watchTarget || watchSelecting || isActionLoading) {
7587-          return;
7588-        }
7589-        const canPlay = selectedCards.length > 0;
7590-        if (!canPlay) {
7591-          return;
7592-        }
7593-        
7594-        setIsActionLoading(true);
7595-        if (isValidPlay(selectedCards)) {
7596-          if (multiplayerMode === 'active' && !isHost) {
7597-            sendActionToHost({ action: 'PLAY', cards: selectedCards });
7598-            executePlay(myPlayerIndex, selectedCards);
7599-            setSelectedCards([]);
7600-          } else {
7601-            executePlay(myPlayerIndex, selectedCards); 
7602-            if (isHost) broadcastEvent({ event: 'PLAY', playerIndex: myPlayerIndex, cards: selectedCards });
7603-            setSelectedCards([]);
7604-          }
7605-        } else {
7606-          setIsActionLoading(false);
7607-          showMessage('INVALID SACRIFICE', 'そのカードは場に出せない');
7608-        }
7609-      };
7610-
7611-      const handlePass = () => {
7612-        if (turn !== myPlayerIndex || isAnimating || watchTarget || watchSelecting || isActionLoading) return;
7613-        
7614-        if (multiplayerMode === 'active' && !isHost) {
7615-          sendActionToHost({ action: 'PASS' });
7616-          executePass(myPlayerIndex);
7617-          setSelectedCards([]);
7618-          return;
7619-        }
7620-
7621-        setIsActionLoading(true);
7622-        executePass(myPlayerIndex); setSelectedCards([]);
7623-        if (isHost) broadcastState(hands);
7624-      };
7625-
7626-      const toggleRankSelect = (rank) => {
7627-        const max = selectionInfo?.count || 1;
7628-        if (selectedCards.includes(rank)) {
7629-          setSelectedCards(prev => prev.filter(r => r !== rank));
7630-        } else {
7631-          if (selectedCards.length < max) {
7632-            setSelectedCards(prev => [...prev, rank]);
7633-          } else if (max === 1) {
7634-            setSelectedCards([rank]);
7635-          }
7636-        }
7637-      };
7638-
7639-      const toggleSelect = (card) => {
7640-        if (selectedCards.find(c => c.id === card.id)) setSelectedCards(selectedCards.filter(c => c.id !== card.id));
7641-        else setSelectedCards([...selectedCards, card]);
7642-      };
7643-
7644-      // 動的なオーラと色付け
7645-      // --- ゲーム終了・再開・交換 ロジック ---
7646-      const startGame = (customHands = null, firstTurn = 0) => {
7647-        setIsTransitioning(true);
7648-        const startTime = Date.now();
7649-
7650-        preloadImages(['game_bg.png', 'ruined_casino_bg.jpg'], () => {
7651-          const elapsed = Date.now() - startTime;
7652-          const remainingTime = Math.max(0, 800 - elapsed); // 800ms minimum fade
7653-
7654-          setTimeout(() => {
7655-            setTableCards([]);
7656-            setPreviousTableCards([]);
7657-            setPassCount(0);
7658-            setLastPlayPlayer(null);
7659-            setRanksDiscovered([]);
7660-            setGraveyard([]);
7661-            setIsShielded([false, false, false, false]);
7662-            setIs11Back(false);
7663-            setIsRevolution(false);
7664-            setPlayDirection(1);
7665-            setPassedPlayers([]);
7666-            setIsGameOver(false);
7667-            setExchangePhase(null);
7668-            setExchangeDecisions({});
7669-
7670-            if (customHands) {
7671-              setHands(customHands);
7672-              setTurn(firstTurn);
7673-              if (multiplayerMode === 'active' && isHost) broadcastState(customHands, firstTurn);
7674-            } else {
7675-              const deck = shuffle(createDeck());
7676-              const newHands = [[], [], [], []];
7677-              let i = 0;
7678-              while (deck.length > 0) {
7679-                newHands[i % 4].push(deck.pop());
7680-                i++;
7681-              }
7682-              const sortedHands = newHands.map(h => sortHand(h));
7683-              setHands(sortedHands);
7684-              setTurn(0);
7685-              if (multiplayerMode === 'active' && isHost) broadcastState(sortedHands, 0);
7686-            }
7687-            setIsDealing(true);
7688-            setTimeout(() => setIsDealing(false), 2000);
7689-            setGameStarted(true);
7690-            sm.playGameBGM();
7691-            setTimeout(() => setIsTransitioning(false), 50);
7692-          }, remainingTime);
7693-        });
7694-      };
7695-
7696-      const handleRestart = () => {
7697-        if (multiplayerMode === 'active' && !isHost) {
7698-          sendActionToHost({ action: 'RESTART' });
7699-          return;
7700-        }
7701-
7702-        // 新しいカードを配る
7703-        const deck = shuffle(createDeck());
7704-        const newHands = [[], [], [], []];
7705-        let i = 0;
7706-        while (deck.length > 0) {
7707-          newHands[i % 4].push(deck.pop());
7708-          i++;
7709-        }
7710-        const sortedHands = newHands.map(h => sortHand(h));
7711-
7712-        // 交換フェーズへ
7713-        setHands(sortedHands);
7714-        setTableCards([]);
7715-        setPreviousTableCards([]);
7716-        setPassCount(0);
7717-        setLastPlayPlayer(null);
7718-        setRanksDiscovered([]);
7719-        setGraveyard([]);
7720-        setIsShielded([false, false, false, false]);
7721-        setIs11Back(false);
7722-        setIsRevolution(false);
7723-        setPlayDirection(1);
7724-        setPassedPlayers([]);
7725-        setIsGameOver(false);
7726-        setExchangePhase('selecting');
7727-        setSelectedCards([]);
7728-
7729-        // NPCの交換カードを即座に決定
7730-        const decisions = {};
7731-        [0, 1, 2, 3].forEach(pIdx => {
7732-          const rankPos = roundResults.indexOf(pIdx) + 1; // 1:大富豪, 2:富豪, 3:貧民, 4:大貧民
7733-          // マルチプレイ時は、接続プレイヤー以外のスロットをCPUとして扱う
7734-          const isCpu = pIdx !== myPlayerIndex && (multiplayerMode === 'active' ? (pIdx >= remotePlayers.length) : true);
7735-          if (isCpu) {
7736-            if (rankPos === 1) decisions[pIdx] = sortedHands[pIdx].slice(0, 2);
7737-            if (rankPos === 2) decisions[pIdx] = sortedHands[pIdx].slice(0, 1);
7738-            if (rankPos === 3) decisions[pIdx] = sortedHands[pIdx].slice(-1);
7739-            if (rankPos === 4) decisions[pIdx] = sortedHands[pIdx].slice(-2);
7740-          }
7741-        });
7742-        setExchangeDecisions(decisions);
7743-        if (isHost) broadcastState(sortedHands);
7744-      };
7745-
7746-      const confirmExchange = () => {
7747-        if (exchangePhase !== 'selecting') return;
7748-
7749-        if (multiplayerMode === 'active' && !isHost) {
7750-          const p0Rank = roundResults.indexOf(myPlayerIndex) + 1;
7751-          let exchangeCards = [];
7752-          if (p0Rank <= 2) exchangeCards = selectedCards;
7753-          else if (p0Rank === 3) exchangeCards = hands[myPlayerIndex].slice(-1);
7754-          else if (p0Rank === 4) exchangeCards = hands[myPlayerIndex].slice(-2);
7755-          
7756-          sendActionToHost({ action: 'CONFIRM_EXCHANGE', cards: exchangeCards });
7757-          setExchangePhase('animating'); // Wait for host to execute
7758-          return;
7759-        }
7760-
7761-        setExchangePhase('animating');
7762-
7763-        const h = [...hands];
7764-        const newFlying = [];
7765-        const finalDecisions = { ...exchangeDecisions };
7766-
7767-        // プレイヤー0の決定
7768-        const p0Rank = roundResults.indexOf(myPlayerIndex) + 1;
7769-        if (p0Rank === 1 || p0Rank === 2) {
7770-          finalDecisions[0] = selectedCards;
7771-        } else if (p0Rank === 3) {
7772-          finalDecisions[0] = h[0].slice(-1);
7773-        } else if (p0Rank === 4) {
7774-          finalDecisions[0] = h[0].slice(-2);
7775-        }
7776-
7777-        // 交換実行
7778-        const daifugo = roundResults[0];
7779-        const fugo = roundResults[1];
7780-        const hinmin = roundResults[2];
7781-        const daihinmin = roundResults[3];
7782-
7783-        const pairs = [
7784-          { from: daifugo, to: daihinmin, cards: finalDecisions[daifugo] },
7785-          { from: daihinmin, to: daifugo, cards: finalDecisions[daihinmin] },
7786-          { from: fugo, to: hinmin, cards: finalDecisions[fugo] },
7787-          { from: hinmin, to: fugo, cards: finalDecisions[hinmin] }
7788-        ];
7789-
7790-        pairs.forEach(pair => {
7791-          pair.cards.forEach(c => {
7792-            const idx = h[pair.from].findIndex(hc => hc.id === c.id);
7793-            if (idx !== -1) {
7794-              h[pair.from].splice(idx, 1);
7795-              newFlying.push({ from: pair.from, to: pair.to, card: c, type: 'pass', id: Math.random() });
7796-            }
7797-          });
7798-        });
7799-
7800-        setFlyingCards(newFlying);
7801-        sm.playPaperSE();
7802-
7803-        setTimeout(() => {
7804-          pairs.forEach(pair => {
7805-            pair.cards.forEach(c => {
7806-              h[pair.to].push(c);
7807-            });
7808-            h[pair.to] = sortHand(h[pair.to]);
7809-          });
7810-          setHands([...h]);
7811-          setFlyingCards([]);
7812-          setExchangePhase(null);
7813-          setSelectedCards([]);
7814-          // 大貧民から開始
7815-          setTurn(daihinmin);
7816-          setIsDealing(true);
7817-          setTimeout(() => setIsDealing(false), 1000);
7818-        }, 2000);
7819-      };
7820-
7821-      const getCardClass = (c) => {
7822-        if (c.hidden) return "card back";
7823-        let cls = `card ${c.suit === '♥' || c.suit === '♦' ? 'red' : (c.suit === 'Joker' ? 'joker' : '')}`;
7824-        // Aura effect mapping loosely based on ability
7825-        if (c.rank === '4') cls += ' aura-shield';
7826-        if (c.rank === '6' || c.rank === '10' || c.rank === 'Q') cls += ' aura-fire';
7827-        if (c.rank === '8') cls += ' aura-dark';
7828-        if (c.rank === 'A' || c.rank === 'K') cls += ' aura-gold';
7829-        return cls;
7830-      };
7831-
7832-      const getAvatarUrl = (avatarKey) => {
7833-        switch (avatarKey) {
7834-          case 'mage': return 'avatar_mage.png';
7835-          case 'assassin': return 'avatar_assassin.png';
7836-          case 'elf': return 'avatar_elf.png';
7837-          case 'knight':
7838-          default: return 'avatar_knight.png';
7839-        }
7840-      };
7841-
7842-      const getPlayerAvatar = (pIdx) => {
7843-        if (pIdx === 0) return myProfile?.avatar || 'knight';
7844-        if (pIdx === 1) return 'mage';
7845-        if (pIdx === 2) return 'elf';
7846-        if (pIdx === 3) return 'knight';
7847-        return 'knight';
7848-      };
7849-
7850-      const renderFanHand = (handContent, playerIdx, isFaceUp = false) => {
7851-        const total = handContent.length;
7852-        const isBeingWatchedByMe = watchTarget?.targetIndexes?.includes(playerIdx) && watchTarget?.activatorIndex === myPlayerIndex;
7853-        // Kウォッチ時は横に広がりすぎないようさらに角度を制限
7854-        let maxAngle = isBeingWatchedByMe ? Math.min(25, total * 2.5) : Math.min(60, total * 4);
7855-        if (isMobile && isBeingWatchedByMe) {
7856-          maxAngle = Math.min(40, total * 4); // スマホ監視時はタイトにしない（視認性優先）
7857-        }
7858-        const angleStep = total > 1 ? maxAngle / (total - 1) : 0;
7859-        const startAngle = -maxAngle / 2;
7860-
7861-        const rankIdx = ranksDiscovered.indexOf(playerIdx);
7862-        const hierarchy = rankIdx !== -1 ? getHierarchyTitle(rankIdx + 1) : null;
7863-        const isDead = rankIdx !== -1;
7864-
7865-        return (
7866-          <div key={playerIdx}
7867-            data-player-hand={playerIdx}
7868-            className={`player-area player-${playerIdx} ${turn === playerIdx ? 'active-turn' : ''} ${watchSelecting && playerIdx !== myPlayerIndex && !isDead && !isShielded[playerIdx] ? 'watch-clickable' : ''} ${watchSelecting && playerIdx !== myPlayerIndex && !isDead && isShielded[playerIdx] ? 'watch-shielded' : ''}`}
7869-            onPointerDown={handlePointerDown}
7870-            onPointerMove={(e) => handlePointerMove(e, playerIdx)}
7871-            onPointerUp={handlePointerUp}
7872-            onPointerCancel={handlePointerUp}
7873-            style={{ touchAction: 'none' }}
7874-            onClick={() => {
7875-              if (isSwipingRef.current) return; // スワイプ後の誤爆防止
7876-              if (watchSelecting && playerIdx !== myPlayerIndex && !isDead) {
7877-                // 4シールド所持者はKウォッチ選択不可
7878-                if (isShielded[playerIdx]) {
7879-                  triggerMiss(playerIdx);
7880-                  return;
7881-                }
7882-                if (watchSelectedTargets.includes(playerIdx)) return;
7883-                
7884-                const newSelected = [...watchSelectedTargets, playerIdx];
7885-                const availableTargetsCount = [0, 1, 2, 3].filter(p => p !== myPlayerIndex && !ranksDiscovered.includes(p) && !isShielded[p]).length;
7886-                const maxTargets = selectionInfo?.count || 1;
7887-
7888-                if (newSelected.length >= maxTargets || newSelected.length >= availableTargetsCount) {
7889-                  const watchDuration = 5000;
7890-                  setWatchTarget({
7891-                    targetIndexes: newSelected,
7892-                    activatorIndex: myPlayerIndex,
7893-                    endTime: Date.now() + watchDuration
7894-                  });
7895-                  setWatchSelecting(false);
7896-                  setWatchSelectedTargets([]);
7897-                  triggerAbilityLog(`Kウォッチ: Player${newSelected.join(',')}`);
7898-                  setSelectionMode(null);
7899-                  setSelectionInfo(null);
7900-                  setIsAnimating(true);
7901-                  sm.playEffectSE('kwatch_start.mp3');
7902-                  setTimeout(() => {
7903-                    setWatchTarget(null);
7904-                    setIsAnimating(false);
7905-                    executeNextTurn(myPlayerIndex, 1);
7906-                  }, watchDuration);
7907-                } else {
7908-                  setWatchSelectedTargets(newSelected);
7909-                  sm.playEffectSE('select.mp3');
7910-                }
7911-              }
7912-            }}
7913-          >
7914-            {skipTarget === playerIdx && <div className="skip-chains"></div>}
7915-            {explodingCards.find(ec => ec.playerIndex === playerIdx) && (
7916-              <div className="exploding-card" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '200px', height: '200px', background: 'radial-gradient(circle, #f00, transparent)', borderRadius: '50%', zIndex: 600 }}></div>
7917-            )}
7918-            {handContent.map((c, i) => {
7919-              const rot = startAngle + i * angleStep;
7920-              const trY = Math.abs(rot) * 0.8;
7921-              const isSelected = selectedCards.find(sc => sc.id === c.id);
7922-              const tcg = !c.hidden ? TCG_DATA[c.rank] : null;
7923-              const aura = tcg?.auraColor || '#b8860b';
7924-              const dealDelay = isDealing ? `${(i + playerIdx * 10) * 0.04}s` : '0s';
7925-              let varStyle = {};
7926-              
7927-              if (passedPlayers.includes(playerIdx)) {
7928-                varStyle.filter = 'brightness(0.3)';
7929-              }
7930-
7931-              if (isFaceUp && !c.hidden) {
7932-                const isHighlighted = highlightedCardIds.includes(c.id);
7933-                const isPhoenixGlow = phoenixGlowIds.includes(c.id);
7934-                let transformStyle = `translateX(calc(-50% + var(--spread-x, 0px))) rotate(${rot}deg) translateY(${trY}px)`;
7935-                let marginLeftStyle = `${(i - total / 2) * 40}px`;
7936-                
7937-                if (isMobile && (playerIdx === 0 || isBeingWatchedByMe)) {
7938-                  // 監視中または自分の手札：画面幅を広く使って視認性を確保
7939-                  const maxLocalWidth = (playerIdx === 0 || isBeingWatchedByMe) ? window.innerWidth * 0.95 : (isMobile ? 180 : 300); 
7940-                  const cardWidth = (isMobile && playerIdx === 0) ? 85 : 65; 
7941-                  // 監視中は大幅に広げる (cap: 50)
7942-                  const cap = isBeingWatchedByMe ? 50 : 30;
7943-                  const spacing = Math.min(cap, (maxLocalWidth - cardWidth) / Math.max(1, total - 1));
7944-                  const offset = (i - (total - 1) / 2) * spacing;
7945-                  
7946-                  let ty = isSelected ? trY - 15 : trY;
7947-                  transformStyle = `translateX(calc(-50% + ${offset}px)) rotate(${rot}deg) translateY(${ty}px)`;
7948-                  marginLeftStyle = `0px`;
7949-                  // Enforce this style on mobile selection to avoid CSS !important overrides
7950-                  varStyle = { ...varStyle, '--mobile-transform': transformStyle };
7951-                } else {
7952-                  // Fallback for non-mobile or unselected
7953-                  varStyle = { ...varStyle, '--mobile-transform': transformStyle };
7954-                }
7955-
7956-                let zIndexStyle = i + 1;
7957-                // zIndexStyle += 500; // 前後関係を維持するため選択時のブーストを廃止
7958-
7959-                return (
7960-                  <div key={c.id}
7961-                    data-card-id={c.id}
7962-                    className={`${getCardClass(c)} selectable ${isSelected ? (isMobile ? 'mobile-selected' : 'selected') : ''} ${isHighlighted ? 'received-highlight' : ''} ${isPhoenixGlow ? 'phoenix-glow' : ''} ${isDealing ? 'dealing' : ''} ${isShielded[playerIdx] ? 'shielded-card' : ''} ${isShielded[playerIdx] && missEffectTarget === playerIdx ? 'shield-miss' : ''}`}
7963-                    style={{
7964-                      '--rot': `${rot}deg`, '--trY': `${trY}px`,
7965-                      '--card-aura': aura,
7966-                      '--deal-delay': dealDelay,
7967-                      ...varStyle,
7968-                      transform: transformStyle,
7969-                      left: `50%`, marginLeft: marginLeftStyle, zIndex: zIndexStyle,
7970-                      borderColor: aura,
7971-                      boxShadow: `0 0 10px ${aura}, 0 5px 12px rgba(0,0,0,0.9)`
7972-                    }}
7973-                    onClick={() => {
7974-                      if (isDead) return;
7975-                      const p0Rank = roundResults ? roundResults.indexOf(myPlayerIndex) + 1 : 0;
7976-                      const canExchangeSelect = exchangePhase === 'selecting' && playerIdx === myPlayerIndex && (p0Rank === 1 || p0Rank === 2);
7977-                      if ((turn === playerIdx && !selectionMode && !exchangePhase) || (selectionMode && playerIdx === myPlayerIndex) || canExchangeSelect) {
7978-                        sm.playLightPaperSE();
7979-                        toggleSelect(c);
7980-                      }
7981-                    }}
7982-                    onMouseEnter={() => {
7983-                      if (playerIdx === myPlayerIndex && !isDead) sm.playLightPaperSE();
7984-                    }}
7985-                  >
7986-                    <div className="card-rank">{c.rank === 'Joker' ? 'J' : c.rank}</div>
7987-                    <div className="tcg-art" style={{ backgroundImage: tcg?.url ? `url(${tcg.url})` : '', backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', width: '100%', height: '100%', borderRadius: '4px' }}></div>
7988-                    {tcg?.desc && <div className="tcg-tooltip">{tcg.desc}</div>}
7989-                    {isHighlighted && <div className="highlight-frame"></div>}
7990-                  </div>
7991-                );
7992-              } else {
7993-                return (
7994-                  <div key={`back-${i}`}
7995-                    className={`card back ${isDealing ? 'dealing' : ''} ${isShielded[playerIdx] ? 'shielded-card' : ''} ${isShielded[playerIdx] && missEffectTarget === playerIdx ? 'shield-miss' : ''}`}
7996-                    style={{
7997-                      '--deal-delay': dealDelay,
7998-                      transform: `translateX(-50%) rotate(${rot}deg) translateY(${trY}px)`,
7999-                      left: `50%`, marginLeft: `${(i - total / 2) * 15}px`, zIndex: i + 1,
8000-                      filter: passedPlayers.includes(playerIdx) ? 'brightness(0.3)' : 'none'
8001-                    }}
8002-                  ></div>
8003-                );
8004-              }
8005-            })}
8006-
8007-            {passedPlayers.includes(playerIdx) && (
8008-              <div className="player-pass-wrapper">
8009-                <div className="player-pass-label">PASS</div>
8010-              </div>
8011-            )}
8012-
8013-            {playerIdx !== 0 ? (
8014-              <div className="player-center-info" style={{ filter: passedPlayers.includes(playerIdx) ? 'brightness(0.3)' : 'none' }}>
8015-                {watchTarget && watchTarget.activatorIndex === playerIdx && playerIdx !== myPlayerIndex && (
8016-                  <div className="watch-activator-label">監視中</div>
8017-                )}
8018-                {/* 手札枚数はアイコンの上部に配置 */}
8019-                <div className="hand-count-badge">{hands[playerIdx].length}</div>
8020-                {/* アバターアイコン */}
8021-                <div className="player-avatar-icon" style={{ backgroundImage: `url(${getAvatarUrl(getPlayerAvatar(playerIdx))})` }}></div>
8022-                {/* 名前はアイコンの下部に配置 */}
8023-                <div className="player-status">
8024-                  {playerIdx === myPlayerIndex ? 'YOU' : (remotePlayers[playerIdx]?.name || `CPU ${playerIdx}`)}
8025-                  {hierarchy && <span className={`rank-badge ${hierarchy.cls}`}>{hierarchy.title}</span>}
8026-                </div>
8027-              </div>
8028-            ) : (
8029-              null
8030-            )}
8031-          </div>
8032-        );
8033-      };
8034-
8035-      useEffect(() => {
8036-        if (isGameOver && isOnlineMatch && ratingChange === null) {
8037-          const myRank = roundResults.indexOf(myPlayerIndex) + 1;
8038-          let k = 32;
8039-          let expectedScore = 0.5;
8040-          let actualScore = myRank === 1 ? 1 : myRank === 2 ? 0.75 : myRank === 3 ? 0.25 : 0;
8041-          let diff = Math.round(k * (actualScore - expectedScore));
8042-          
8043-          let newRating = playerRating + diff;
8044-          setRatingChange({ old: playerRating, new: newRating, diff: diff });
8045-          setPlayerRating(newRating);
8046-          localStorage.setItem('local_rating', newRating.toString());
8047-          
8048-          if (isSupabaseReady && supabaseClient && myUid) {
8049-            supabaseClient.from('users').upsert({
8050-              id: myUid,
8051-              display_name: myProfile.display_name,
8052-              rating: newRating
8053-            }).then(({error}) => {
8054-              if (error) console.error("Supabase rating update failed", error);
8055-            });
8056-          }
8057-        }
8058-      }, [isGameOver, isOnlineMatch, roundResults, playerRating, ratingChange, myPlayerIndex, myProfile.display_name]);
8059-
8060-      const startOnlineMatch = async () => {
8061-        setIsOnlineMatch(true);
8062-        setOnlineMatchStatus('searching');
8063-        setMultiplayerMode('online'); // Switch mode for UI
8064-        
8065-        if (!isSupabaseReady || !myUid) {
8066-          // モックの遅延でマッチング成功とする
8067-          setTimeout(() => {
8068-            setOnlineMatchStatus('found');
8069-            setRemotePlayers([
8070-              { id: 'local', name: myProfile.display_name, rating: playerRating },
8071-              { id: 'cpu1', name: 'Player2', rating: playerRating + Math.floor(Math.random() * 50 - 25) },
8072-              { id: 'cpu2', name: 'Player3', rating: playerRating + Math.floor(Math.random() * 50 - 25) },
8073-              { id: 'cpu3', name: 'Player4', rating: playerRating + Math.floor(Math.random() * 50 - 25) }
8074-            ]);
8075-            setTimeout(() => {
8076-              startGame();
8077-            }, 2000);
8078-          }, 3000);
8079-          return;
8080-        }
8081-
8082-        // Supabase Matching Logic
8083-        try {
8084-          const { error } = await supabaseClient.from('matchmaking_queue').upsert({
8085-            uid: myUid,
8086-            name: myProfile.display_name,
8087-            rating: playerRating
8088-          });
8089-          if (error) throw error;
8090-
8091-          // Subscribe to matchmaking queue changes
8092-          const channel = supabaseClient.channel('matchmaking');
8093-          let isMatched = false;
8094-
8095-          channel.on('postgres_changes', { event: '*', schema: 'public', table: 'matchmaking_queue' }, async (payload) => {
8096-            if (isMatched) return;
8097-
8098-            // Check if queue has enough players (2 players for testing)
8099-            const { data } = await supabaseClient.from('matchmaking_queue').select('*').order('joined_at', { ascending: true });
8100-            
8101-            if (data && data.length >= 2) {
8102-              const myIndex = data.findIndex(p => p.uid === myUid);
8103-              if (myIndex === -1) return; // I'm no longer in queue
8104-              
8105-              const matchedPlayers = data.slice(0, 2);
8106-              if (matchedPlayers.some(p => p.uid === myUid)) {
8107-                isMatched = true;
8108-                supabaseClient.removeChannel(channel);
8109-                await supabaseClient.from('matchmaking_queue').delete().eq('uid', myUid);
8110-                
8111-                const hostUid = matchedPlayers[0].uid;
8112-                const isMyHost = hostUid === myUid;
8113-                const hostPeerId = "ultimate-daihugou-match-" + hostUid;
8114-                
8115-                setOnlineMatchStatus('found');
8116-                
8117-                if (isMyHost) {
8118-                  startAsHost(hostPeerId);
8119-                  // remote players will be added when they JOIN
8120-                  setRemotePlayers([{ id: 'local', name: myProfile.display_name }]);
8121-                } else {
8122-                  // Guest logic
8123-                  setTimeout(() => {
8124-                    joinAsGuest(hostPeerId);
8125-                  }, 2000); // Wait for host to create peer
8126-                }
8127-              }
8128-            }
8129-          }).subscribe();
8130-
8131-        } catch (e) {
8132-          console.error("Matchmaking error", e);
8133-          setOnlineMatchStatus('idle');
8134-          setMultiplayerMode(null);
8135-          alert("マッチメイキングに失敗しました。");
8136-        }
8137-      };
8138-
8139-      const cancelOnlineMatch = () => {
8140-        setIsOnlineMatch(false);
8141-        setOnlineMatchStatus('idle');
8142-        setMultiplayerMode(null);
8143-      };
8144-
8145-      const fetchLeaderboard = async () => {
8146-        if (!isSupabaseReady) {
8147-          setLeaderboardData([
8148-            { name: "King", rating: 2500 },
8149-            { name: "Queen", rating: 2100 },
8150-            { name: "Knight", rating: 1850 },
8151-            { name: "Rogue", rating: 1550 },
8152-            { name: "Peasant", rating: 1100 },
8153-          ]);
8154-          setShowLeaderboard(true);
8155-          return;
8156-        }
8157-        try {
8158-          const { data, error } = await supabase
8159-            .from('users')
8160-            .select('display_name, rating')
8161-            .order('rating', { ascending: false })
8162-            .limit(10);
8163-            
8164-          if (error) throw error;
8165-          
8166-          const formattedData = data.map(d => ({
8167-            name: d.display_name || 'Unknown',
8168-            rating: d.rating || 1500
8169-          }));
8170-          
8171-          setLeaderboardData(formattedData);
8172-          setShowLeaderboard(true);
8173-        } catch(e) {
8174-          console.error("Failed to fetch leaderboard", e);
8175-        }
8176-      };
8177-
8178-      const startDealAnimation = () => {
8179-        // 1人プレイ用の開始処理
8180-        startGame();
8181-      };
8182-
8183-      // --- Latest Function Refs for Event Listeners ---
8184-      useEffect(() => {
8185-        executePlayRef.current = executePlay;
8186-        executePassRef.current = executePass;
8187-        completeSpecialEffectRef.current = completeSpecialEffect;
8188-        handleRestartRef.current = handleRestart;
8189-        isValidPlayRef.current = isValidPlay;
8190-      }, [executePlay, executePass, completeSpecialEffect, handleRestart, isValidPlay]);
8191-
8192-      return (
8193-        <div id="game-root" className={`game-container ${(!gameStarted && multiplayerMode !== 'lobby') ? 'title-bg' : ''} ${watchSelecting ? 'k-watch-active k-watch-selecting' : ''} ${watchTarget && watchTarget.targetIndexes && watchTarget.activatorIndex === myPlayerIndex ? 'k-watch-active k-watch-viewing' : ''}`} onContextMenu={(e) => e.preventDefault()}>
8194-          {(watchSelecting || (watchTarget && watchTarget.activatorIndex === myPlayerIndex)) && <div className={`k-watch-overlay ${watchTarget ? 'viewing' : ''}`}></div>}
8195-          {watchSelecting && <div className="k-watch-select-prompt">プレイヤーを選択してください。</div>}
8196-          
8197-          {(!gameStarted && multiplayerMode !== 'lobby') ? (
8198-            <div className="title-screen">
8199-
8200-              {titleStage === 1 && (
8201-              <div className="title-card-fan">
8202-                {/* 
8203-                  ユーザー要望: 
8204-                  左側: 2を起点として時計回りに20度ずつ角度が変わる螺旋隊列 (Joker除外)
8205-                  右側: エフェクト削除、揺れのみ、Qを右にずらす、3D角度の強調
8206-                */}
8207-                {(() => {
8208-                  // 重複ゼロ：全14種類のカード（Joker, 2〜A）を1枚ずつのみ使用
8209-                  // 軽量化：スマホ版は枚数を削減
8210-                  const allRanks = isMobile ? ['2', 'Q', 'A', 'Joker', '8', 'K', 'J'] : ['K', '2', 'J', 'Q', 'A', '10', 'Joker', '3', '4', '5', '6', '7', '8', '9'];
8211-
8212-                  // 座標マップ（画面中央からのpxオフセット）
8213-                  // 画面端に寄り過ぎず、かつ左上・右下などの余白を埋めるバランス配置 (Max offset ~570px)
8214-                  const posMap = [
8215-                    { tx: -380, ty: 180, layer: 0 }, { tx: 420, ty: -120, layer: 0 }, // Layer 0 (K と 2)
8216-                    { tx: -450, ty: -300, layer: 1 }, { tx: 480, ty: 320, layer: 1 }, // Layer 1 (J: 左上)
8217-                    { tx: -180, ty: 450, layer: 1 }, { tx: 200, ty: -380, layer: 1 },  // Layer 1
8218-                    { tx: -580, ty: 80, layer: 2 }, { tx: 540, ty: 100, layer: 2 },   // Layer 2
8219-                    { tx: -320, ty: -460, layer: 2 }, { tx: 300, ty: 460, layer: 2 },  // Layer 2
8220-                    { tx: -540, ty: -240, layer: 3 }, { tx: 520, ty: 250, layer: 3 },  // Layer 3
8221-                    { tx: 80, ty: -520, layer: 3 }, { tx: -120, ty: 520, layer: 3 }     // Layer 3
8222-                  ];
8223-
8224-                  return allRanks.map((rank, idx) => {
8225-                    const tcg = TCG_DATA[rank];
8226-                    const scaleX = isMobile ? 0.33 : 1.0;
8227-                    const scaleY = isMobile ? 0.6 : 1.0;
8228-                    const sizeScale = isMobile ? 0.6 : 1.0;
8229-                    const cfg = { ...posMap[idx], tx: posMap[idx].tx * scaleX, ty: posMap[idx].ty * scaleY };
8230-
8231-                    // レイヤーごとの物理特性 (全ての回転を0degに固定して正対させる)
8232-                    let baseScale, zIndex, blur, bright, dur, swayX, swayY, circleOp;
8233-                    if (cfg.layer === 0) { // 最前面
8234-                      baseScale = 1.35 * sizeScale;
8235-                      zIndex = 500;
8236-                      blur = "0px";
8237-                      bright = 1.0;
8238-                      dur = "7s";
8239-                      swayX = "15px"; swayY = "-20px";
8240-                      circleOp = 1;
8241-                    } else if (cfg.layer === 1) { // 前方
8242-                      baseScale = 0.65 * sizeScale;
8243-                      zIndex = 400;
8244-                      blur = "0.7px";
8245-                      bright = 0.8;
8246-                      dur = "10s";
8247-                      swayX = "8px"; swayY = "-12px";
8248-                      circleOp = 0.8;
8249-                    } else if (cfg.layer === 2) { // 後方
8250-                      baseScale = 0.42 * sizeScale;
8251-                      zIndex = 300;
8252-                      blur = "1.6px";
8253-                      bright = 0.65;
8254-                      dur = "14s";
8255-                      swayX = "5px"; swayY = "-8px";
8256-                      circleOp = 0;
8257-                    } else { // 最背面 (最奥)
8258-                      baseScale = 0.22 * sizeScale;
8259-                      zIndex = 100;
8260-                      blur = "3.2px";
8261-                      bright = 0.5;
8262-                      dur = "18s";
8263-                      swayX = "3px"; swayY = "-5px";
8264-                      circleOp = 0;
8265-                    }
8266-
8267-                    return (
8268-                      <div key={rank} className="fan-item deep-field"
8269-                        style={{
8270-                          backgroundImage: `url(${tcg.url})`,
8271-                          '--tx': `${cfg.tx}px`,
8272-                          '--ty': `${cfg.ty}px`,
8273-                          '--rx': '0deg',
8274-                          '--ry': '0deg',
8275-                          '--rz': '0deg',
8276-                          '--base-scale': baseScale,
8277-                          '--bright': bright,
8278-                          '--blur': blur,
8279-                          '--dur': dur,
8280-                          '--delay': `-${(idx * 1.5).toFixed(1)}s`,
8281-                          '--sway-x': swayX,
8282-                          '--sway-y': swayY,
8283-                          '--circle-op': circleOp,
8284-                          zIndex: zIndex
8285-                        }}>
8286-                      </div>
8287-                    );
8288-                  });
8289-                })()}
8290-              </div>
8291-              )}
8292-              <div className="title-overlay"></div>
8293-
8294-                                          {/* 暗転トランジション用オーバーレイ */}
8295-              <div className={`transition-overlay ${isTransitioning ? 'active' : ''}`}></div>
8296-
8297-
8298-              {/* ロゴとボタンをグループ化 */}
8299-              <div className={`title-main-group stage-${titleStage}`}>
8300-                {titleStage === 1 && (
8301-                  <div className="title-logo-container">
8302-                    <img src="logo.webp" alt="アルティメット大富豪" className="title-logo" />
8303-                  </div>
8304-                )}
8305-
8306-                {/* Stage 1: 初期状態 */}
8307-                {titleStage === 1 && (
8308-                  <>
8309-                    {!isReady ? (
8310-                      <div className={`touch-start-container animate-fade-in ${isReadyPressed ? 'start-pressed' : ''}`} onClick={handleReadyClick}>
8311-                        <div className="touch-start-text" style={{color: '#E6C875', textShadow: '0 2px 15px rgba(212,175,55,0.6)'}}>READY</div>
8312-                      </div>
8313-                    ) : (
8314-                      <div className={`touch-start-container animate-fade-in ${isStartPressed ? 'start-pressed' : ''}`} onClick={handleStartGameTransition}>
8315-                        <div className="touch-start-text" style={{color: '#E6C875', textShadow: '0 2px 15px rgba(212,175,55,0.6)'}}>START GAME</div>
8316-                      </div>
8317-                    )}
8318-                  </>
8319-                )}
8320-              </div>
8321-
8322-              {/* Stage 2: モード選択状態 */}
8323-              {titleStage === 2 && (
8324-                <>
8325-                  <div className="stage2-background animate-fade-in"></div>
8326-                  
8327-                  {!multiplayerMode && (
8328-                  <>
8329-                  {/* テーブル上の散らばったカード */}
8330-                  <div className="scattered-cards-container animate-fade-in">
8331-                    <img src="3image.webp" className="scattered-card" style={{top: '14vh', right: '20%', transform: 'rotate(-10deg)', zIndex: 12}} alt="" />
8332-                    <img src="5image.webp" className="scattered-card" style={{top: '12vh', right: '22%', transform: 'rotate(15deg)', zIndex: 11}} alt="" />
8333-                    <img src="7image.webp" className="scattered-card" style={{top: '25%', left: '5%', transform: 'rotate(-45deg)'}} alt="" />
8334-                    <img src="9image.webp" className="scattered-card" style={{top: '50%', left: '3%', transform: 'rotate(15deg)'}} alt="" />
8335-                    <img src="Jimage.webp" className="scattered-card" style={{top: '20%', right: '10%', transform: 'rotate(25deg)'}} alt="" />
8336-                    <img src="Kimage.webp" className="scattered-card" style={{top: '55%', right: '5%', transform: 'rotate(-30deg)', zIndex: 11}} alt="" />
8337-                    <img src="Aimage.webp" className="scattered-card" style={{bottom: '15%', left: '6%', transform: 'rotate(40deg)'}} alt="" />
8338-                    <img src="2image.webp" className="scattered-card" style={{top: '58%', right: '7%', transform: 'rotate(-15deg)', zIndex: 12}} alt="" />
8339-                    <img src="joker.webp" className="scattered-card" style={{top: '15%', left: '22%', transform: 'rotate(10deg)'}} alt="" />
8340-                  </div>
8341-                  
8342-                  <div className="stage2-top-logo animate-fade-in">
8343-                    <img src="logo.webp" alt="アルティメット大富豪" />
8344-                  </div>
8345-
8346-                  
8347-                  <div className="mode-select-container three-columns animate-fade-in" style={{gap: '40px', alignItems: 'flex-start', position: 'absolute', top: '65%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', justifyContent: 'center', zIndex: 50}}>
8348-                    {/* Online Play */}
8349-                    <div className="mode-btn-wrapper" 
8350-                         onMouseEnter={() => setHoveredMode('online')} onMouseLeave={() => setHoveredMode(null)}
8351-                         onTouchStart={() => setHoveredMode('online')} onTouchEnd={() => setHoveredMode(null)}>
8352-                      <img src="online.png" alt="Online Play" className="mode-image-button" onClick={() => { setMultiplayerMode('online'); setOnlineMatchStatus('idle'); }} />
8353-                      <div className={`mode-description-inline ${hoveredMode === 'online' ? 'visible' : ''}`} style={{opacity: hoveredMode === 'online' ? 1 : 0}}>
8354-                        全国のプレイヤーとレートを競うオンライン対戦
8355-                      </div>
8356-                    </div>
8357-
8358-                    {/* Multi Play */}
8359-                    <div className="mode-btn-wrapper" 
8360-                         onMouseEnter={() => setHoveredMode('multi')} onMouseLeave={() => setHoveredMode(null)}
8361-                         onTouchStart={() => setHoveredMode('multi')} onTouchEnd={() => setHoveredMode(null)}>
8362-                      <img src="mulch.png" alt="Multi Play" className="mode-image-button" onClick={() => setMultiplayerMode('select')} />
8363-                      <div className={`mode-description-inline ${hoveredMode === 'multi' ? 'visible' : ''}`} style={{opacity: hoveredMode === 'multi' ? 1 : 0}}>
8364-                        合言葉を使って友達と一緒にプレイ
8365-                      </div>
8366-                    </div>
8367-
8368-                    {/* CPU Play */}
8369-                    <div className="mode-btn-wrapper" 
8370-                         onMouseEnter={() => setHoveredMode('cpu')} onMouseLeave={() => setHoveredMode(null)}
8371-                         onTouchStart={() => setHoveredMode('cpu')} onTouchEnd={() => setHoveredMode(null)}>
8372-                      <img src="CPU.png" alt="CPU Play" className="mode-image-button" onClick={() => setMultiplayerMode('cpu_lobby')} />
8373-                      <div className={`mode-description-inline ${hoveredMode === 'cpu' ? 'visible' : ''}`} style={{opacity: hoveredMode === 'cpu' ? 1 : 0}}>
8374-                        強力なCPUと対戦して腕を磨く一人用モード
8375-                      </div>
8376-                    </div>
8377-                  </div>
8378-
8379-                  <div className="mode-aux-buttons left-aligned animate-fade-in">
8380-                    <button className="btn-back" onClick={() => { setTitleStage(1); sm.playTitleBGM(); }}>
8381-                      <span>◀ 戻る</span>
8382-                    </button>
8383-                  </div>
8384-                  </>
8385-                  )}
8386-                </>
8387-              )}
8388-
8389-{multiplayerMode === 'online' && (
8390-  <>
8391-  <div className="selection-overlay-ui" style={{width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'transparent', pointerEvents: 'auto', paddingTop: '12vh', gap: '30px'}}>
8392-    <div style={{color: 'var(--color-gold)', fontFamily: "'Cinzel', 'Noto Serif JP', serif", fontSize: '2.5rem', letterSpacing: '4px', textShadow: '0 0 20px rgba(0,0,0,1)'}}>ONLINE PLAY</div>
8393-    
8394-    <div style={{ background: 'rgba(20,0,0,0.8)', padding: '30px 50px', borderRadius: '15px', border: '1px solid var(--color-gold)', textAlign: 'center', boxShadow: '0 0 30px rgba(212,175,55,0.2)' }}>
8395-      <div style={{ fontSize: '1.5rem', color: '#ccc', marginBottom: '15px' }}>{myProfile.display_name}</div>
8396-      <div style={{ fontSize: '2.5rem', color: 'var(--color-gold)', fontWeight: 'bold', textShadow: '0 0 10px rgba(212,175,55,0.5)' }}>
8397-        Rating: {playerRating}
8398-      </div>
8399-    </div>
8400-    
8401-    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
8402-      {onlineMatchStatus === 'idle' && (
8403-        <button className="action-btn btn-confirm mystic-btn" onClick={startOnlineMatch} style={{width: 'auto', padding: '15px 40px'}}>
8404-          <span className="mystic-btn-text" style={{ fontSize: '1.4rem' }}>対戦相手を探す</span>
8405-        </button>
8406-      )}
8407-      
8408-      {onlineMatchStatus === 'searching' && (
8409-        <>
8410-          <div style={{ fontSize: '1.4rem', color: 'var(--color-gold)' }} className="blink-animation">
8411-            対戦相手を探しています...
8412-          </div>
8413-          <button className="action-btn btn-pass mystic-btn" onClick={() => setOnlineMatchStatus('idle')} style={{width: 'auto', padding: '10px 30px'}}>
8414-            <span className="mystic-btn-text" style={{ fontSize: '1.2rem' }}>キャンセル</span>
8415-          </button>
8416-        </>
8417-      )}
8418-      
8419-      {onlineMatchStatus === 'found' && (
8420-        <div style={{ fontSize: '1.5rem', color: 'var(--color-gold)' }} className="blink-animation">
8421-          マッチング成功！
8422-        </div>
8423-      )}
8424-    </div>
8425-
8426-  </div>
8427-  <div className="mode-aux-buttons left-aligned animate-fade-in">
8428-    <button className="btn-back" onClick={cancelOnlineMatch}>
8429-      <span>◀ 戻る</span>
8430-    </button>
8431-  </div>
8432-  </>
8433-)}
8434-
8435-{multiplayerMode === 'cpu_lobby' && (
8436-  <>
8437-  <div className="selection-overlay-ui" style={{width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'transparent', pointerEvents: 'auto', paddingTop: '12vh', gap: '30px'}}>
8438-    <div style={{color: 'var(--color-gold)', fontFamily: "'Cinzel', 'Noto Serif JP', serif", fontSize: '2.5rem', letterSpacing: '4px', textShadow: '0 0 20px rgba(0,0,0,1)'}}>CPU PLAY</div>
8439-    
8440-    <div style={{ background: 'rgba(20,0,0,0.8)', padding: '30px 50px', borderRadius: '15px', border: '1px solid var(--color-gold)', textAlign: 'center', boxShadow: '0 0 30px rgba(212,175,55,0.2)' }}>
8441-      <div style={{ fontSize: '1.5rem', color: '#ccc', marginBottom: '15px' }}>{myProfile.display_name}</div>
8442-      <div style={{ fontSize: '1.5rem', color: '#888', fontWeight: 'bold' }}>
8443-        VS CPU
8444-      </div>
8445-    </div>
8446-    
8447-    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
8448-      <button className="action-btn btn-confirm mystic-btn" onClick={startDealAnimation} style={{width: 'auto', padding: '15px 40px'}}>
8449-        <span className="mystic-btn-text" style={{ fontSize: '1.4rem' }}>対戦を始める</span>
8450-      </button>
8451-    </div>
8452-  </div>
8453-  <div className="mode-aux-buttons left-aligned animate-fade-in">
8454-    <button className="btn-back" onClick={() => { setMultiplayerMode(null); sm.playHomeBGM(); }}>
8455-      <span>◀ 戻る</span>
8456-    </button>
8457-  </div>
8458-  </>
8459-)}
8460-
8461-
8462-
8463-
8464-{multiplayerMode === 'select' && (
8465-                <>
8466-                <div className="selection-overlay-ui" style={{width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'transparent', pointerEvents: 'auto', paddingTop: '12vh'}}>
8467-                  <div style={{color: 'var(--color-gold)', fontFamily: "'Cinzel', 'Noto Serif JP', serif", fontSize: '2rem', letterSpacing: '4px', marginBottom: '30px', textShadow: '0 0 20px rgba(0,0,0,1)'}}>PRIVATE MATCH</div>
8468-                  <div style={{ display: 'flex', gap: '30px' }}>
8469-                    <div className="mode-btn-wrapper"
8470-                         onMouseEnter={() => setHoveredMode('create_room')} onMouseLeave={() => setHoveredMode(null)}
8471-                         onTouchStart={() => setHoveredMode('create_room')} onTouchEnd={() => setHoveredMode(null)}>
8472-                      <div className="private-match-card-btn" style={{backgroundImage: "url('room home.png')"}} onClick={createRoom}></div>
8473-                      <div className={`mode-description-inline ${hoveredMode === 'create_room' ? 'visible' : ''}`} style={{opacity: hoveredMode === 'create_room' ? 1 : 0, marginTop: '20px'}}>
8474-                        ルームを作成してホストになる
8475-                      </div>
8476-                    </div>
8477-
8478-                    <div className="mode-btn-wrapper"
8479-                         onMouseEnter={() => setHoveredMode('find_room')} onMouseLeave={() => setHoveredMode(null)}
8480-                         onTouchStart={() => setHoveredMode('find_room')} onTouchEnd={() => setHoveredMode(null)}>
8481-                      <div className="private-match-card-btn" style={{backgroundImage: "url('room2.png')"}} onClick={() => setMultiplayerMode('search')}></div>
8482-                      <div className={`mode-description-inline ${hoveredMode === 'find_room' ? 'visible' : ''}`} style={{opacity: hoveredMode === 'find_room' ? 1 : 0, marginTop: '20px'}}>
8483-                        ルーム番号を入力して入室する
8484-                      </div>
8485-                    </div>
8486-                  </div>
8487-                </div>
8488-                <div className="mode-aux-buttons left-aligned animate-fade-in">
8489-                  <button className="btn-back" onClick={() => { setMultiplayerMode(null); sm.playHomeBGM(); }}>
8490-                    <span>◀ 戻る</span>
8491-                  </button>
8492-                </div>
8493-                </>
8494-              )}
8495-
8496-              {multiplayerMode === 'search' && (
8497-                <div className="selection-overlay-ui" style={{width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'transparent'}}>
8498-                  <div className="selection-guide" style={{color: 'var(--color-gold)', textShadow: '0 0 15px rgba(212, 175, 55, 0.5)', fontSize: '1.8rem', marginBottom: '30px', letterSpacing: '2px'}}>ルーム番号を入力</div>
8499-                  <input type="text" className="passphrase-input" placeholder="4桁の数字..." 
8500-                    value={passphrase} onChange={(e) => setPassphrase(e.target.value)} style={{fontSize: '1.5rem', padding: '15px 20px', width: '280px', borderRadius: '10px', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8), 0 0 15px rgba(212, 175, 55, 0.3)', marginBottom: '40px'}} />
8501-                  <div style={{ display: 'flex', gap: '30px' }}>
8502-                    <button className="action-btn btn-confirm mystic-btn" onClick={() => initMultiplayer(passphrase)}>
8503-                      <span className="mystic-btn-text">入室</span>
8504-                    </button>
8505-                    <button className="action-btn btn-pass mystic-btn" onClick={() => setMultiplayerMode('select')}>
8506-                      <span className="mystic-btn-text">戻る</span>
8507-                    </button>
8508-                  </div>
8509-                </div>
8510-              )}
8511-
8512-
8513-            </div>
8514-          ) : (
8515-            <div className="table-container">
8516-              {/* 自分自身（YOU）のアバター・名前 左下固定表示 */}
8517-              <div className="player-you-info-fixed">
8518-                <div className="hand-count-badge">{hands[0].length}</div>
8519-                <div className="player-avatar-icon" style={{ backgroundImage: `url(${getAvatarUrl(getPlayerAvatar(0))})` }}></div>
8520-                <div className="player-status">
8521-                  YOU
8522-                  {ranksDiscovered.includes(myPlayerIndex) && (
8523-                    <span className={`rank-badge ${getHierarchyTitle(ranksDiscovered.indexOf(myPlayerIndex) + 1).cls}`}>
8524-                      {getHierarchyTitle(ranksDiscovered.indexOf(myPlayerIndex) + 1).title}
8525-                    </span>
8526-                  )}
8527-                </div>
8528-              </div>
8529-              <button className="btn-exit-to-title mystic-btn" onClick={() => {
8530-                sm.playPaperSE();
8531-                if (roomChannel) {
8532-                  roomChannel.unsubscribe();
8533-                  setRoomChannel(null);
8534-                }
8535-                setCurrentRoom(null);
8536-                // setConns([]);
8537-                // setGuestConn(null);
8538-                setIsHost(false);
8539-                setGameStarted(false);
8540-                setMultiplayerMode(null);
8541-                setTitleStage(2);
8542-              }}><span className="mystic-btn-text">退場</span></button>
8543-              {multiplayerMode === 'lobby' && (
8544-                <div className="selection-overlay-ui" style={{ zIndex: 6000, background: 'transparent', padding: '40px', marginTop: '22vh', boxShadow: 'none', border: 'none' }}>
8545-                  <div className="selection-guide" style={{color: 'var(--color-gold)', textShadow: '0 0 15px rgba(212, 175, 55, 0.5)', fontSize: '1.8rem', marginBottom: '10px', letterSpacing: '2px'}}>待機中</div>
8546-                  <div style={{fontFamily: "'Courier New', monospace", fontSize: '1.4rem', color: '#fff', marginBottom: '20px', padding: '10px 20px', background: '#000', borderRadius: '8px', border: '1px solid #333'}}>ルーム番号: <span style={{color: 'var(--color-gold)', fontWeight: 'bold'}}>{passphrase}</span></div>
8547-                  <div className="player-lobby-list" style={{ margin: '10px 0 30px', display: 'flex', flexDirection: 'column', gap: '10px', width: '300px' }}>
8548-                    {remotePlayers.map((p, idx) => (
8549-                      <div key={idx} style={{ padding: '12px 15px', background: 'rgba(255,255,255,0.05)', borderLeft: '4px solid var(--color-gold)', textAlign: 'left', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
8550-                        <span style={{fontSize: '1.2rem'}}>{idx === 0 ? "👑" : "💀"}</span> <span style={{fontWeight: 'bold', fontSize: '1.1rem'}}>{p.name}</span> <span style={{color: '#888', fontSize: '0.9rem'}}>{p.id === 'local' ? "(あなた)" : ""}</span>
8551-                      </div>
8552-                    ))}
8553-                    {Array.from({ length: 4 - remotePlayers.length }).map((_, i) => (
8554-                      <div key={`empty-${i}`} style={{ padding: '12px 15px', background: 'rgba(0,0,0,0.4)', color: '#666', borderLeft: '4px solid #333', textAlign: 'left', borderRadius: '4px' }}>
8555-                        待機中... (CPU枠)
8556-                      </div>
8557-                    ))}
8558-                  </div>
8559-                  <div style={{ display: 'flex', gap: '30px', justifyContent: 'center' }}>
8560-                    {isHost ? (
8561-                      <button className="action-btn btn-confirm mystic-btn" onClick={startMultiplayerGame}>
8562-                        <span className="mystic-btn-text">ゲームを開始</span>
8563-                      </button>
8564-                    ) : (
8565-                      <div style={{ color: 'var(--color-gold)', animation: 'pulse-gold 1s infinite alternate', display: 'flex', alignItems: 'center' }}>ホストの開始を待機しています...</div>
8566-                    )}
8567-                    <button className="action-btn btn-pass mystic-btn" onClick={() => { if(roomChannel) { roomChannel.unsubscribe(); setRoomChannel(null); setCurrentRoom(null); } setMultiplayerMode(null); sm.playHomeBGM(); }}>
8568-                      <span className="mystic-btn-text">解散</span>
8569-                    </button>
8570-                  </div>
8571-                </div>
8572-              )}
8573-
8574-              <div className={`screen-filter ${is11Back ? 'filter-11back' : ''}`}></div>
8575-
8576-
8577-              {/* 強さの逆転と順序逆転の永続的インジケーター表示 */}
8578-              {multiplayerMode !== 'lobby' && (
8579-                <>
8580-                  <div className={`bg-reverse-indicator ${playDirection === 1 ? 'spin-clockwise' : 'spin-counter-clockwise'}`}></div>
8581-                  <div className={`bg-jback-indicator ${is11Back ? 'active' : ''}`}></div>
8582-                  <div className={`bg-revolution-indicator ${isRevolution ? 'active' : ''}`}></div>
8583-                </>
8584-              )}
8585-
8586-              {/* Flying Cards Animation Layer */}
8587-          {abilityLog && <div className="ability-log-overlay">{abilityLog}</div>}
8588-              {flyingCards.map(fc => {
8589-                const start = fc.from === 'graveyard' ? { top: '50%', left: '85%' } : fc.from === 'deck' ? { top: '50%', left: '50%' } : getPlayerEdgePosition(fc.from);
8590-                const end = getPlayerEdgePosition(fc.to);
8591-                const isDeal = fc.type === 'deal';
8592-                const isShieldRepel = fc.type === 'shield-repel';
8593-                const animName = isShieldRepel ? 'shield-repel-fly' : 'card-fly-back';
8594-                const animDuration = isShieldRepel ? '1.5s' : '0.8s';
8595-                return (
8596-                  <div key={fc.id} className={`card back ${isDeal ? "deal-card-back" : "flying-card-back"}`} style={{
8597-                    position: 'fixed',
8598-                    zIndex: 9999,
8599-                    '--start-top': start.top,
8600-                    '--start-left': start.left,
8601-                    '--end-top': end.top,
8602-                    '--end-left': end.left,
8603-                    '--start-scale': isDeal ? 1 : 0.5,
8604-                    '--end-scale': isDeal ? 1 : 0.8,
8605-                    animation: `${animName} ${animDuration} ${fc.delay || 0}s both cubic-bezier(0.4, 0, 0.2, 1)`
8606-                  }}>
8607-                  </div>
8608-                );
8609-              })}
8610-
8611-              {phoenixActive && <div className="phoenix-fire"></div>}
8612-
8613-              {/* 6フェニックス: 墓地→手札へ飛ぶカード（position:fixed, getBoundingClientRect座標） */}
8614-              {phoenixFlyCards.map(fc => (
8615-                <div
8616-                  key={String(fc.id)}
8617-                  className="phoenix-fly-card"
8618-                  style={{
8619-                    left: `${fc.sx}px`,
8620-                    top:  `${fc.sy}px`,
8621-                    '--dx': `${fc.ex - fc.sx}px`,
8622-                    '--dy': `${fc.ey - fc.sy}px`,
8623-                  animation: 'phoenix-fly-anim 0.75s linear forwards',
8624-                  }}
8625-                />
8626-              ))}
8627-              {guillotineActive && <div className="guillotine"></div>}
8628-              {reverseActive && <div className="reverse-arrows"></div>}
8629-              {bomberActive && <div className="bomber-explode"></div>}
8630-              {passThreadActive && <div className="pass-thread"></div>}
8631-              {/* Character cut-in overlay (Dynamic Overhaul) */}
8632-              {cutIn && (() => {
8633-                const aura = cutIn.auraColor || '#b8860b';
8634-                // Convert hex to RGB for rgba usage
8635-                const hexToRgb = (hex) => {
8636-                  const r = parseInt(hex.slice(1, 3), 16);
8637-                  const g = parseInt(hex.slice(3, 5), 16);
8638-                  const b = parseInt(hex.slice(5, 7), 16);
8639-                  return `${r},${g},${b}`;
8640-                };
8641-                const rgb = hexToRgb(aura);
8642-                const r = cutIn.rank;
8643-                return (
8644-                  <div className="cutin-container" style={{ '--aura': aura, '--aura-dim': `rgba(${rgb},0.35)` }}>
8645-                    {cutIn.comboData ? (() => {
8646-                      const phase = cutIn.comboPhase || 1;
8647-                      const resRank = cutIn.comboData.resultRank;
8648-                      const otherRank = cutIn.comboData.otherRank;
8649-                      const otherTcg = TCG_DATA[otherRank];
8650-                      const resTcg = TCG_DATA[resRank];
8651-                      return (
8652-                        <div className={`plus5-combo-cutin p5c-phase${phase}`}>
8653-                          {/* +5カード */}
8654-                          <div
8655-                            className="p5c-card p5c-card-5"
8656-                            style={{
8657-                              backgroundImage: `url(${TCG_DATA['5'].url})`,
8658-                              '--card-aura': '#f1c40f'
8659-                            }}
8660-                          >
8661-                            <div className="p5c-card-rank" style={{ borderColor: '#f1c40f', textShadow: '0 0 8px #f1c40f' }}>5</div>
8662-                            <div className="p5c-card-text">
8663-                              <div className="p5c-card-name" style={{ color: '#f1c40f' }}>プラス5</div>
8664-                              <div className="p5c-card-desc">{TCG_DATA['5'].desc}</div>
8665-                            </div>
8666-                          </div>
8667-                          {/* 足したカード */}
8668-                          <div
8669-                            className="p5c-card p5c-card-other"
8670-                            style={{
8671-                              backgroundImage: `url(${otherTcg?.url})`,
8672-                              '--card-aura': otherTcg?.auraColor || '#b8860b'
8673-                            }}
8674-                          >
8675-                            <div className="p5c-card-rank" style={{ borderColor: otherTcg?.auraColor, textShadow: `0 0 8px ${otherTcg?.auraColor}` }}>{otherRank}</div>
8676-                            <div className="p5c-card-text">
8677-                              <div className="p5c-card-name" style={{ color: otherTcg?.auraColor || '#b8860b' }}>{otherTcg?.name || otherRank}</div>
8678-                              <div className="p5c-card-desc">{otherTcg?.desc || ''}</div>
8679-                            </div>
8680-                          </div>
8681-                          {/* 合体後の結果カード */}
8682-                          <div
8683-                            className="p5c-card p5c-card-result"
8684-                            style={{
8685-                              backgroundImage: `url(${resTcg?.url})`,
8686-                              '--card-aura': resTcg?.auraColor || '#b8860b'
8687-                            }}
8688-                          >
8689-                            <div className="p5c-card-rank" style={{ borderColor: resTcg?.auraColor, textShadow: `0 0 8px ${resTcg?.auraColor}` }}>{resRank}</div>
8690-                            <div className="p5c-card-text">
8691-                              <div className="p5c-card-name" style={{ color: resTcg?.auraColor || '#b8860b' }}>{resTcg?.name || resRank}</div>
8692-                              <div className="p5c-card-desc">{resTcg?.desc || ''}</div>
8693-                            </div>
8694-                          </div>
8695-                          {/* 赤い爆発フラッシュ（Phase3） */}
8696-                          <div className="p5c-merge-flash"></div>
8697-                        </div>
8698-                      );
8699-                    })() : (
8700-                      <>
8701-                        {/* 個別エフェクト描画 */}
8702-                        {r === 'A' && <div className="effect-a-slash"></div>}
8703-                        {r === '2' && <div className="effect-2-quake"></div>}
8704-                        {r === '3' && <div className="effect-3-dust"></div>}
8705-                        {r === '4' && <div className="effect-4-shield"></div>}
8706-                        {r === '5' && cutIn.name !== 'プラス5' && cutIn.name !== '🃏真・プラス5' && <div className="effect-5-chain"></div>}
8707-                        {r === '6' && <div className="effect-6-fire"></div>}
8708-                        {r === '7' && <div className="effect-7-gold"></div>}
8709-                        {r === '8' && <div className="effect-8-cut"></div>}
8710-                        {r === '9' && <div className="effect-9-gear"></div>}
8711-                        {r === '10' && <div className="effect-10-rain"></div>}
8712-                        {r === 'J' && <div className="effect-j-reverse"></div>}
8713-                        {r === 'Q' && <div className="effect-q-bomb"></div>}
8714-                        {r === 'K' && <div className="effect-k-magic"></div>}
8715-                        {r === 'Joker' && <div className="effect-joker-mist"></div>}
8716-                      </>
8717-                    )}
8718-
8719-                    {/* Phase4以外のコンボ時はカードポップアップ非表示。通常カットインのみ表示 */}
8720-                    {!cutIn.comboData && (
8721-                      <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
8722-                        {/* 共通：パルスリング x2 */}
8723-                        <div className="cutin-pulse-ring"></div>
8724-                        <div className="cutin-pulse-ring"></div>
8725-
8726-                        {/* 共通：上下スラッシュ */}
8727-                        <div className="cutin-slash-top"></div>
8728-                        <div className="cutin-slash-bottom"></div>
8729-
8730-                        {/* カードポップアップ本体 */}
8731-                        <div className="cutin-card-popup" style={r === '2' ? { animation: 'card-popup-in 0.5s forwards, screen-shake 0.5s ease-in-out' } : {}}>
8732-                          <div className="cutin-card-art" style={{ backgroundImage: `url(${TCG_DATA[r]?.url})` }}></div>
8733-
8734-                          <div className="cutin-card-rank">
8735-                            {r === 'Joker' ? '🃏' : r}
8736-                          </div>
8737-
8738-                          <div className="cutin-card-text">
8739-                            <div className="cutin-card-name" style={isMobile ? { letterSpacing: '0px', whiteSpace: 'nowrap', width: '100%', textAlign: 'center', lineHeight: 1 } : (r === 'A' || r === 'Joker' ? { textAlign: 'center' } : {})}>
8740-                               {cutIn.name}
8741-                            </div>
8742-                            {cutIn.effect && <div className="cutin-card-desc">{cutIn.effect}</div>}
8743-                          </div>
8744-                        </div>
8745-                      </div>
8746-                    )}
8747-                  </div>
8748-                );
8749-              })()}
8750-
8751-              {/* 重複した墓地表示を削除 */}
8752-              {/* メッセージオーバーレイ */}
8753-              {animMessage.data && (
8754-                <div className={`message-overlay ${animMessage.state}`}>
8755-                  {animMessage.data.title}
8756-                      {animMessage.data.desc && <p>{animMessage.data.desc}</p>}
8757-                </div>
8758-              )}
8759-
8760-              {/* ターンと方向表示 */}
8761-              <div style={{ position: 'absolute', top: isMobile ? '2px' : '30px', left: isMobile ? '2px' : '40px', zIndex: 200, color: '#ccc', fontFamily: "'Cinzel', serif", transform: isMobile ? 'scale(0.45)' : 'none', transformOrigin: 'top left', whiteSpace: 'nowrap' }}>
8762-                TURN: <span style={{ color: turn === myPlayerIndex ? 'var(--color-blood)' : '#fff' }}>{turn === myPlayerIndex ? 'YOU' : turn === -1 ? 'ENDED' : (remotePlayers[turn]?.name || `CPU ${turn}`)}</span>
8763-                {(is11Back || isRevolution) && (
8764-                  <span className="revolution-label" style={{ marginLeft: '15px', color: '#ff4444', fontWeight: 'bold', textShadow: '0 0 10px rgba(255,0,0,0.8)', fontSize: '0.9em' }}>
8765-                    {isRevolution ? "REVOLUTION!!" : "J-BACK"}
8766-                  </span>
8767-                )}
8768-                <div>Direction: {playDirection === 1 ? '➡' : '⬅'}</div>
8769-              </div>
8770-
8771-              {/* 石造りの祭壇システム */}
8772-              <div data-graveyard="true" className={`altar-container ${isAltarActive ? 'active' : ''}`}
8773-                onClick={() => { alert('GRAVEYARD:\n' + graveyard.map(c => c.suit + c.rank).join(', ')) }}>
8774-                <div className="altar-base">
8775-                  <div className="altar-glow"></div>
8776-                  {/* 墓地のカード：最新数枚を表面向きで重ねて表示（場と同様） */}
8777-                  {graveyard.length > 0 && (
8778-                    <div className="altar-card-pile" style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 }}>
8779-                      {graveyard.slice(-5).map((card, idx, arr) => {
8780-                        const total = arr.length;
8781-                        const age = total - 1 - idx; // 0=最新, 4=最古
8782-                        const rot = (age * 7) * (idx % 2 === 0 ? 1 : -1);
8783-                        const dx = age * 2 * (idx % 2 === 0 ? 1 : -1);
8784-                        const dy = age * 1.5;
8785-                        return (
8786-                          <div
8787-                            key={card.id || idx}
8788-                            className="card back altar-pile-card"
8789-                            style={{
8790-                              transform: `translate(-50%, -50%) rotate(${rot}deg) translate(${dx}px, ${dy}px)`,
8791-                              zIndex: idx + 1,
8792-                              filter: `brightness(${Math.max(0.5, 1.0 - age * 0.12)})`,
8793-                            }}
8794-                          />
8795-                        );
8796-                      })}
8797-                    </div>
8798-                  )}
8799-                </div>
8800-                <div className="altar-count">† {graveyard.length} †</div>
8801-              </div>
8802-
8803-              {resurrectCard && (
8804-                <div className={`card ${resurrectCard.suit === '♥' || resurrectCard.suit === '♦' ? 'red' : ''} resurrection-card`}
8805-                  style={{ '--target-pos': resurrectCard.targetPos }}>
8806-                  <div className="tcg-art" style={{ backgroundImage: TCG_DATA[resurrectCard.rank]?.url ? `url(${TCG_DATA[resurrectCard.rank].url})` : '' }}></div>
8807-                  <div className="tcg-rank-circle"><span>{resurrectCard.rank}</span></div>
8808-                </div>
8809-              )}
8810-
8811-              {discardingToGy.map((item, idx) => {
8812-                const c = item.card;
8813-                const from = item.fromPlayer;
8814-                
8815-                // スタート地点と墓地への吸い込み相対座標の決定
8816-                let startX = '50vw';
8817-                let startY = '50vh';
8818-                let altarX = 'calc(50vw - 355px)';
8819-                let altarY = 'calc(130px - 50vh)';
8820-                
8821-                if (from === 0) {
8822-                  // 自分（画面下部）から
8823-                  startX = '50vw'; startY = '90vh';
8824-                  altarX = 'calc(50vw - 355px)'; altarY = 'calc(130px - 90vh)';
8825-                } else if (from === 1) {
8826-                  // CPU1（画面左）から
8827-                  startX = '270px'; startY = '50vh';
8828-                  altarX = 'calc(100vw - 625px)'; altarY = 'calc(130px - 50vh)';
8829-                } else if (from === 2) {
8830-                  // CPU2（画面上）から
8831-                  startX = '50vw'; startY = '150px';
8832-                  altarX = 'calc(50vw - 355px)'; altarY = '-20px';
8833-                } else if (from === 3) {
8834-                  // CPU3（画面右）から
8835-                  startX = 'calc(100vw - 270px)'; startY = '50vh';
8836-                  altarX = '-85px'; altarY = 'calc(130px - 50vh)';
8837-                }
8838-                
8839-                const delay = idx * 0.12;
8840-                const isFaceDown = from !== 'center';
8841-                return (
8842-                  <div key={`flying-${idx}`} className={`card ${isFaceDown ? 'back' : (c.suit === '♥' || c.suit === '♦' ? 'red' : '')} to-graveyard`}
8843-                    style={{
8844-                      position: 'absolute',
8845-                      left: startX,
8846-                      top: startY,
8847-                      zIndex: 2000 + idx,
8848-                      animationDelay: `${delay}s`,
8849-                      '--altar-x': altarX,
8850-                      '--altar-y': altarY,
8851-                      transform: 'translate(-50%, -50%) scale(1)'
8852-                    }}>
8853-                    {!isFaceDown && (
8854-                      <>
8855-                        <div className="card-rank">{c.rank === 'Joker' ? 'J' : c.rank}</div>
8856-                        <div className="tcg-art" style={{ backgroundImage: TCG_DATA[c.rank]?.url ? `url(${TCG_DATA[c.rank].url})` : '', backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', width: '100%', height: '100%', borderRadius: '4px' }}></div>
8857-                      </>
8858-                    )}
8859-                  </div>
8860-                );
8861-              })}
8862-
8863-              {centralBombCards && centralBombCards.length > 0 && (() => {
8864-                const count = centralBombCards.length;
8865-                let scaleFactor = 1;
8866-                if (count <= 4) scaleFactor = 1.8;
8867-                else if (count <= 8) scaleFactor = 1.2;
8868-                else if (count <= 16) scaleFactor = 0.9;
8869-                else scaleFactor = 0.6;
8870-                
8871-                const uniqueRanks = Array.from(new Set(centralBombCards.map(c => c.rank)));
8872-                const containerWidth = count <= 8 ? '500px' : '950px';
8873-
8874-                return (
8875-                  <div style={{ position: 'fixed', top: '50%', left: '50%', transform: `translate(-50%, -50%) scale(${scaleFactor})`, zIndex: 3000, display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', width: containerWidth, pointerEvents: 'none' }}>
8876-                    <div style={{ width: '100%', textAlign: 'center', marginBottom: '15px', color: '#fff', fontSize: '2.5rem', fontWeight: 'bold', fontFamily: '"Cinzel", serif', textShadow: '0 0 10px #f00, 0 0 20px #ff0', animation: 'bomb-cutin-text 3.2s forwards' }}>
8877-                       消滅: {uniqueRanks.join(', ')}
8878-                    </div>
8879-                    {centralBombCards.map((c, idx) => (
8880-                      <div key={`bomb-${c.id}-${idx}`} className={`card ${c.suit === '♥' || c.suit === '♦' ? 'red' : ''} central-bombed-card`} style={{ animationDelay: `${(idx % 5) * 0.08}s` }}>
8881-                        <div className="tcg-art" style={{ backgroundImage: TCG_DATA[c.rank]?.url ? `url(${TCG_DATA[c.rank].url})` : '', backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', width: '100%', height: '100%', borderRadius: '4px' }}></div>
8882-                      </div>
8883-                    ))}
8884-                  </div>
8885-                );
8886-              })()}
8887-
8888-              {[0, 1, 2, 3].map(pIdx => {
8889-                const dispIdx = getDisplayIndex(pIdx);
8890-                const posClass = dispIdx === 0 ? 'pos-bottom' : dispIdx === 1 ? 'pos-left' : dispIdx === 2 ? 'pos-top' : 'pos-right';
8891-                const isActive = turn === pIdx;
8892-                const isMe = pIdx === myPlayerIndex;
8893-                const targetIdxList = watchTarget?.targetIndexes || [];
8894-                const isTarget = targetIdxList.includes(pIdx);
8895-                const isClickable = watchSelecting && pIdx !== 0 && !ranksDiscovered.includes(pIdx) && !isShielded[pIdx];
8896-                const isAlreadySelected = watchSelectedTargets.includes(pIdx);
8897-                const watchClasses = `${isClickable && !isAlreadySelected ? 'k-watch-focus' : ''} ${isTarget ? 'k-watch-target' : ''} ${isAlreadySelected ? 'k-watch-selected' : ''}`;
8898-
8899-                let targetStyle = {};
8900-                if (isTarget) {
8901-                  const tIndex = targetIdxList.indexOf(pIdx);
8902-                  const totalT = targetIdxList.length;
8903-                  let topPercent = 50;
8904-                  if (totalT === 2) topPercent = tIndex === 0 ? 30 : 70;
8905-                  if (totalT === 3) topPercent = tIndex === 0 ? 20 : tIndex === 1 ? 50 : 80;
8906-                  const scale = totalT === 1 ? 1.3 : totalT === 2 ? 1.0 : 0.8;
8907-                  targetStyle = { '--target-top': `${topPercent}%`, '--target-scale': scale };
8908-                }
8909-
8910-                return (
8911-                  <div key={pIdx} className={`player-pos ${posClass} ${isActive ? 'active-turn' : ''} ${watchClasses}`} style={targetStyle}>
8912-                    {(ranksDiscovered.includes(pIdx) || isGameOver) && (
8913-                      <div className={`player-rank-label ${getHierarchyTitle(ranksDiscovered.indexOf(pIdx) + 1).cls}`}>
8914-                        {getHierarchyTitle(ranksDiscovered.indexOf(pIdx) + 1).title}
8915-                      </div>
8916-                    )}
8917-                    {renderFanHand(hands[pIdx], pIdx, isMe || isGameOver || (watchTarget?.targetIndexes?.includes(pIdx) && watchTarget?.activatorIndex === myPlayerIndex))}
8918-                    {watchTarget && watchTarget.targetIndexes?.includes(pIdx) && (
8919-                      <div className="watch-gauge-container">
8920-                        <div className="watch-gauge-bar" style={{ animationDuration: `5000ms` }}></div>
8921-                      </div>
8922-                    )}
8923-                  </div>
8924-                );
8925-              })}
8926-
8927-              {/* 中央のプレイエリア */}
8928-              <div className="play-area">
8929-                {clearingField && <div className="blackhole"></div>}
8930-
8931-                {/* フィールド中央のステータス表示 */}
8932-                {(isRevolution || is11Back) && (
8933-                  <div className="field-status-label">{isRevolution ? "革命" : "Jバック"}</div>
8934-                )}
8935-
8936-                <div className="table-cards-container">
8937-                  {[...previousTableCards, ...tableCards].map((item, idx) => {
8938-                    const tcg = TCG_DATA[item.card.rank];
8939-                    const aura = tcg?.auraColor || '#b8860b';
8940-                    return (
8941-                      <div key={`${item.card.id}-${idx}`}
8942-                        className={`${getCardClass(item.card)} on-table ${item.isSlammed ? 'slammed' : ''} ${item.isOld ? 'old-card' : ''}`}
8943-                        style={{
8944-                          ...(item.isAnimating ? item.initialStyle : item.targetStyle),
8945-                          zIndex: idx,
8946-                          '--card-aura': aura,
8947-                          borderColor: aura,
8948-                          boxShadow: item.isOld ? 'none' : `0 0 10px ${aura}, 0 5px 12px rgba(0,0,0,0.9)`,
8949-                          filter: item.isOld ? 'brightness(0.5)' : 'none'
8950-                        }}
8951-                      >
8952-                        <div className="tcg-art" style={{ backgroundImage: tcg?.url ? `url(${tcg.url})` : '' }}></div>
8953-                        <div className="tcg-rank-circle" style={{ borderColor: aura, boxShadow: `0 0 8px ${aura}` }}>
8954-                          <span>{item.card.rank}</span>
8955-                        </div>
8956-                        <div className="tcg-name">{tcg?.name || item.card.suit + item.card.rank}</div>
8957-                      </div>
8958-                    );
8959-                  })}
8960-                </div>
8961-              </div>
8962-
8963-              {/* アクションパネル */}
8964-              <div className="action-panel">
8965-                {gameStarted && !selectionMode && !isGameOver && !exchangePhase && (
8966-                  <>
8967-                    <button className="action-btn btn-play mystic-btn"
8968-                      disabled={turn !== myPlayerIndex || selectedCards.length === 0 || isActionLoading || !isValidPlay(selectedCards)}
8969-                      onClick={handlePlay}
8970-                      onTouchEnd={(e) => {
8971-                        if (turn !== myPlayerIndex || selectedCards.length === 0 || isActionLoading || !isValidPlay(selectedCards)) return;
8972-                        e.preventDefault();
8973-                        handlePlay();
8974-                      }}>
8975-                      <span className="mystic-btn-text">出す</span>
8976-                    </button>
8977-                    <button className="action-btn btn-pass mystic-btn"
8978-                      disabled={turn !== myPlayerIndex || isActionLoading}
8979-                      onClick={handlePass}
8980-                      onTouchEnd={(e) => {
8981-                        if (turn !== myPlayerIndex || isActionLoading) return;
8982-                        e.preventDefault();
8983-                        handlePass();
8984-                      }}>
8985-                      <span className="mystic-btn-text">パス</span>
8986-                    </button>
8987-                  </>
8988-                )}
8989-              </div>
8990-
8991-              {/* ゲーム終了UI */}
8992-              {isGameOver && (
8993-                <div className="game-over-overlay">
8994-                  <h1 className="cinzel-title">序章 終演</h1>
8995-                  <div className="final-ranks">
8996-                    {roundResults.map((pIdx, i) => (
8997-                      <div key={i} className={`result-row ${pIdx === 0 ? 'highlight-p0' : ''}`}>
8998-                        <span className="rank-num">{i + 1}位</span>
8999-                        <span className="rank-title">{getHierarchyTitle(i + 1).title}</span>
9000-                        <span className="rank-player">{pIdx === myPlayerIndex ? 'YOU' : (remotePlayers[pIdx]?.name || `CPU ${pIdx}`)}</span>
9001-                        {pIdx === 0 && ratingChange && (
9002-                          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px', animation: 'fadeInUp 1s ease-out forwards' }}>
9003-                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: ratingChange.diff >= 0 ? '#4CAF50' : '#F44336' }}>
9004-                              {ratingChange.diff > 0 ? `+${ratingChange.diff}` : ratingChange.diff}
9005-                            </span>
9006-                            <span style={{ fontSize: '1.2rem', color: 'var(--color-gold)' }}>
9007-                              Rating: {ratingChange.new}
9008-                            </span>
9009-                          </div>
9010-                        )}
9011-                      </div>
9012-                    ))}
9013-                  </div>
9014-                  <div className="result-actions">
9015-                    <button className="gold-btn mystic-btn" onClick={handleRestart}><span className="mystic-btn-text">再戦</span></button>
9016-                    <button className="gold-btn mystic-btn" onClick={() => location.reload()}><span className="mystic-btn-text">タイトルへ</span></button>
9017-                  </div>
9018-                </div>
9019-              )}
9020-
9021-              {/* カード交換UI */}
9022-              {exchangePhase === 'selecting' && (
9023-                <div className="exchange-overlay-ui">
9024-                  <div className="selection-guide">
9025-                    {(() => {
9026-                      const p0Rank = roundResults.indexOf(0) + 1;
9027-                      if (p0Rank === 1) return "大富豪：大貧民へ渡すカードを2枚選択";
9028-                      if (p0Rank === 2) return "富豪：貧民へ渡すカードを1枚選択";
9029-                      if (p0Rank === 3) return "貧民：富豪へ最強のカードを献上";
9030-                      if (p0Rank === 4) return "大貧民：大富豪へ最強のカードを2枚献上";
9031-                      return "";
9032-                    })()}
9033-                  </div>
9034-                  {(roundResults.indexOf(myPlayerIndex) + 1 <= 2) ? (
9035-                    <button className="action-btn btn-confirm"
9036-                      disabled={selectedCards.length !== (roundResults.indexOf(myPlayerIndex) + 1 === 1 ? 2 : 1) || (isHost && Object.keys(exchangeDecisions).length < (multiplayerMode === 'active' ? (remotePlayers.length - 1) : 3))}
9037-                      onClick={confirmExchange}>
9038-                      {isHost && Object.keys(exchangeDecisions).length < (multiplayerMode === 'active' ? (remotePlayers.length - 1) : 3) ? "待機中..." : "交換"}
9039-                    </button>
9040-                  ) : (
9041-                    <button className="action-btn btn-confirm" onClick={confirmExchange} disabled={isHost && Object.keys(exchangeDecisions).length < (multiplayerMode === 'active' ? (remotePlayers.length - 1) : 3)}>
9042-                      {isHost && Object.keys(exchangeDecisions).length < (multiplayerMode === 'active' ? (remotePlayers.length - 1) : 3) ? "待機中..." : "確認"}
9043-                    </button>
9044-                  )}
9045-                </div>
9046-              )}
9047-
9048-              {/* QBomberなど選択用UI（action-panelから独立させ、中央固定を有効化） */}
9049-              {selectionMode && (
9050-                <div className="selection-overlay-ui">
9051-                  <div className="selection-guide">
9052-                    {selectionMode === '7' ? `渡すカード（${selectionInfo?.count}枚）を選択` :
9053-                      selectionMode === '10' ? `捨てるカード（${selectionInfo?.count}枚）を選択` :
9054-                        selectionMode === 'Q' ? `爆破する階級（${selectionInfo?.count}種類）を選択` :
9055-                          "対象のプレイヤーを選択"}
9056-                  </div>
9057-                  {selectionMode === 'Q' ? (
9058-                    <>
9059-                      <div className="rank-selector">
9060-                        {[...RANKS, 'Joker'].map(r => (
9061-                          <button key={r}
9062-                            className={`rank-select-btn ${selectedCards.includes(r) ? 'selected' : ''}`}
9063-                            style={selectedCards.includes(r) ? { backgroundColor: 'var(--color-blood)', color: '#fff' } : {}}
9064-                            onClick={() => {
9065-                              sm.playLightPaperSE();
9066-                              toggleRankSelect(r);
9067-                            }}>{r}</button>
9068-                        ))}
9069-                      </div>
9070-                      <button className="action-btn btn-confirm mystic-btn"
9071-                        disabled={selectedCards.length !== selectionInfo?.count}
9072-                        onClick={() => completeSpecialEffect(selectedCards)}>
9073-                        <span className="mystic-btn-text">ボンバー</span>
9074-                      </button>
9075-                    </>
9076-                  ) : selectionMode === 'K' || watchSelecting ? (
9077-                    <div className="selection-tip">他プレイヤーのエリアを直接タッチして選択してください</div>
9078-                  ) : (
9079-                    <button className="action-btn btn-confirm mystic-btn"
9080-                      disabled={selectedCards.length !== selectionInfo?.count}
9081-                      onClick={() => {
9082-                        if (selectionMode === '10') sm.playCrumpleSE();
9083-                        if (selectionMode === 'Q') sm.playExplosionSE();
9084-                        if (selectionMode === '7') sm.playPaperSE();
9085-                        completeSpecialEffect(selectedCards);
9086-                      }}>
9087-                      <span className="mystic-btn-text">{selectionMode === '7' ? '渡す' : selectionMode === '10' ? '捨てる' : '決定'}</span>
9088-                    </button>
9089-                  )}
9090-              {/* 右上の共通アイコン */}
9091-              {!gameStarted && (<div className="top-right-icon-buttons animate-fade-in" style={{zIndex: 10000}}>
9092-                <button className="icon-btn" onClick={fetchLeaderboard} title="ランキング">
9093-                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
9094-                    <path d="M2 20h20"></path>
9095-                    <path d="M19 17L22 7l-5 3-5-6-5 6-5-3 3 10"></path>
9096-                  </svg>
9097-                </button>
9098-                <button className="icon-btn" onClick={() => { setTempProfileName(myProfile?.display_name || 'YOU'); setShowProfileSettings(true); }} title="プロフィール設定">
9099-                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
9100-                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
9101-                    <circle cx="12" cy="7" r="4"></circle>
9102-                  </svg>
9103-                </button>
9104-                <button className="icon-btn" onClick={() => setShowExplanation(true)} title="ルール説明">
9105-                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
9106-                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
9107-                  </svg>
9108-                </button>
9109-              </div>)}
9110-
9111-{showProfileSettings && (
9112-  <div style={{position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
9113-    <div style={{background: '#2A0510', border: '2px solid var(--color-gold)', borderRadius: '10px', padding: '30px', width: '80%', maxWidth: '400px', boxShadow: '0 0 30px rgba(212, 175, 55, 0.4)'}}>
9114-      <h2 style={{color: 'var(--color-gold)', fontFamily: "'Cinzel', serif", margin: '0 0 20px', textAlign: 'center'}}>PROFILE</h2>
9115-      
9116-      <div style={{ marginBottom: '20px' }}>
9117-        <label style={{ color: '#ccc', display: 'block', marginBottom: '10px' }}>Name:</label>
9118-        <input 
9119-          type="text" 
9120-          maxLength="10"
9121-          value={tempProfileName}
9122-          onChange={(e) => setTempProfileName(e.target.value)}
9123-          style={{ width: '100%', padding: '10px', background: '#000', color: '#fff', border: '1px solid #555', borderRadius: '5px', fontSize: '1.2rem', boxSizing: 'border-box' }}
9124-        />
9125-      </div>
9126-
9127-      <div style={{ marginBottom: '30px' }}>
9128-        <label style={{ color: '#ccc', display: 'block', marginBottom: '10px' }}>Avatar:</label>
9129-        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
9130-          {['knight', 'mage', 'assassin', 'elf'].map(avatarKey => (
9131-            <div 
9132-              key={avatarKey} 
9133-              onClick={() => updateProfileAvatar(avatarKey)}
9134-              style={{ 
9135-                width: '60px', height: '60px', borderRadius: '5px', cursor: 'pointer',
9136-                border: myProfile?.avatar === avatarKey ? '3px solid var(--color-gold)' : '1px solid #333',
9137-                backgroundImage: `url(${getAvatarUrl(avatarKey)})`, backgroundSize: 'cover', backgroundPosition: 'center'
9138-              }}
9139-            ></div>
9140-          ))}
9141-        </div>
9142-      </div>
9143-      
9144-      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
9145-        <button className="action-btn btn-pass mystic-btn" onClick={() => setShowProfileSettings(false)} style={{padding: '10px 20px', height: 'auto'}}>
9146-          <span className="mystic-btn-text" style={{fontSize: '1rem'}}>キャンセル</span>
9147-        </button>
9148-        <button className="action-btn btn-confirm mystic-btn" onClick={updateProfileName} style={{padding: '10px 20px', height: 'auto'}}>
9149-          <span className="mystic-btn-text" style={{fontSize: '1rem'}}>決定</span>
9150-        </button>
9151-      </div>
9152-    </div>
9153-  </div>
9154-)}
9155-
9156-{showLeaderboard && (
9157-  <div style={{position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
9158-    <div style={{background: '#2A0510', border: '2px solid var(--color-gold)', borderRadius: '10px', padding: '30px', width: '80%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 0 30px rgba(212, 175, 55, 0.4)'}}>
9159-      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
9160-        <h2 style={{color: 'var(--color-gold)', fontFamily: "'Cinzel', serif", margin: 0}}>LEADERBOARD</h2>
9161-        <button onClick={() => setShowLeaderboard(false)} style={{background: 'transparent', border: 'none', color: '#ccc', fontSize: '1.5rem', cursor: 'pointer'}}>×</button>
9162-      </div>
9163-      <table style={{width: '100%', color: '#fff', borderCollapse: 'collapse', textAlign: 'left'}}>
9164-        <thead>
9165-          <tr style={{borderBottom: '1px solid var(--color-gold)'}}>
9166-            <th style={{padding: '10px'}}>Rank</th>
9167-            <th style={{padding: '10px'}}>Player</th>
9168-            <th style={{padding: '10px'}}>Rating</th>
9169-          </tr>
9170-        </thead>
9171-        <tbody>
9172-          {leaderboardData.map((data, idx) => (
9173-            <tr key={idx} style={{borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
9174-              <td style={{padding: '10px'}}>{idx + 1}</td>
9175-              <td style={{padding: '10px'}}>{data.name}</td>
9176-              <td style={{padding: '10px'}}>{data.rating}</td>
9177-            </tr>
9178-          ))}
9179-        </tbody>
9180-      </table>
9181-    </div>
9182-  </div>
9183-)}
9184-
9185-              {showExplanation && (
9186-                <div className="explanation-overlay" style={{zIndex: 10000}}>
9187-                  <div className="explanation-header">
9188-                    <h2>カード能力一覧</h2>
9189-                  </div>
9190-                  <div className="explanation-list">
9191-                    {['3','4','5','6','7','8','9','10','J','Q','K','A','2','Joker'].map(rank => {
9192-                      const data = TCG_DATA[rank];
9193-                      if (!data) return null;
9194-                      return (
9195-                        <div key={rank} className="explanation-item">
9196-                          <div className="explanation-card-view" style={{ backgroundImage: `url(${data.url})` }}></div>
9197-                          <div className="explanation-text">
9198-                            <div className="explanation-card-name">{data.name}</div>
9199-                            <div className="explanation-card-desc">{data.desc}</div>
9200-                          </div>
9201-                        </div>
9202-                      );
9203-                    })}
9204-                  </div>
9205-                  <button className="action-btn btn-pass btn-close-explanation mystic-btn" onClick={() => setShowExplanation(false)}>
9206-                    <span className="mystic-btn-text">閉じる</span>
9207-                  </button>
9208-                </div>
9209-              )}
9210-
9211-                  <div className="selection-cancel-hint">※特殊効果は拒否できない</div>
9212-                </div>
9213-              )}
9214-
9215-            </div>
9216-          )}
9217-              {/* 右上の共通アイコン */}
9218-              {!gameStarted && (<div className="top-right-icon-buttons animate-fade-in" style={{zIndex: 10000}}>
9219-                <button className="icon-btn" onClick={fetchLeaderboard} title="ランキング">
9220-                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
9221-                    <path d="M2 20h20"></path>
9222-                    <path d="M19 17L22 7l-5 3-5-6-5 6-5-3 3 10"></path>
9223-                  </svg>
9224-                </button>
9225-                <button className="icon-btn" onClick={() => { setTempProfileName(myProfile?.display_name || 'YOU'); setShowProfileSettings(true); }} title="プロフィール設定">
9226-                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
9227-                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
9228-                    <circle cx="12" cy="7" r="4"></circle>
9229-                  </svg>
9230-                </button>
9231-                <button className="icon-btn" onClick={() => setShowExplanation(true)} title="ルール説明">
9232-                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
9233-                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
9234-                  </svg>
9235-                </button>
9236-              </div>)}
9237-
9238-{showProfileSettings && (
9239-  <div style={{position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
9240-    <div style={{background: '#2A0510', border: '2px solid var(--color-gold)', borderRadius: '10px', padding: '30px', width: '80%', maxWidth: '400px', boxShadow: '0 0 30px rgba(212, 175, 55, 0.4)'}}>
9241-      <h2 style={{color: 'var(--color-gold)', fontFamily: "'Cinzel', serif", margin: '0 0 20px', textAlign: 'center'}}>PROFILE</h2>
9242-      
9243-      <div style={{ marginBottom: '20px' }}>
9244-        <label style={{ color: '#ccc', display: 'block', marginBottom: '10px' }}>Name:</label>
9245-        <input 
9246-          type="text" 
9247-          maxLength="10"
9248-          value={tempProfileName}
9249-          onChange={(e) => setTempProfileName(e.target.value)}
9250-          style={{ width: '100%', padding: '10px', background: '#000', color: '#fff', border: '1px solid #555', borderRadius: '5px', fontSize: '1.2rem', boxSizing: 'border-box' }}
9251-        />
9252-      </div>
9253-
9254-      <div style={{ marginBottom: '30px' }}>
9255-        <label style={{ color: '#ccc', display: 'block', marginBottom: '10px' }}>Avatar:</label>
9256-        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
9257-          {['knight', 'mage', 'assassin', 'elf'].map(avatarKey => (
9258-            <div 
9259-              key={avatarKey} 
9260-              onClick={() => updateProfileAvatar(avatarKey)}
9261-              style={{ 
9262-                width: '60px', height: '60px', borderRadius: '5px', cursor: 'pointer',
9263-                border: myProfile?.avatar === avatarKey ? '3px solid var(--color-gold)' : '1px solid #333',
9264-                backgroundImage: `url(${getAvatarUrl(avatarKey)})`, backgroundSize: 'cover', backgroundPosition: 'center'
9265-              }}
9266-            ></div>
9267-          ))}
9268-        </div>
9269-      </div>
9270-      
9271-      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
9272-        <button className="action-btn btn-pass mystic-btn" onClick={() => setShowProfileSettings(false)} style={{padding: '10px 20px', height: 'auto'}}>
9273-          <span className="mystic-btn-text" style={{fontSize: '1rem'}}>キャンセル</span>
9274-        </button>
9275-        <button className="action-btn btn-confirm mystic-btn" onClick={updateProfileName} style={{padding: '10px 20px', height: 'auto'}}>
9276-          <span className="mystic-btn-text" style={{fontSize: '1rem'}}>決定</span>
9277-        </button>
9278-      </div>
9279-    </div>
9280-  </div>
9281-)}
9282-
9283-{showLeaderboard && (
9284-  <div style={{position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
9285-    <div style={{background: '#2A0510', border: '2px solid var(--color-gold)', borderRadius: '10px', padding: '30px', width: '80%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 0 30px rgba(212, 175, 55, 0.4)'}}>
9286-      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
9287-        <h2 style={{color: 'var(--color-gold)', fontFamily: "'Cinzel', serif", margin: 0}}>LEADERBOARD</h2>
9288-        <button onClick={() => setShowLeaderboard(false)} style={{background: 'transparent', border: 'none', color: '#ccc', fontSize: '1.5rem', cursor: 'pointer'}}>×</button>
9289-      </div>
9290-      <table style={{width: '100%', color: '#fff', borderCollapse: 'collapse', textAlign: 'left'}}>
9291-        <thead>
9292-          <tr style={{borderBottom: '1px solid var(--color-gold)'}}>
9293-            <th style={{padding: '10px'}}>Rank</th>
9294-            <th style={{padding: '10px'}}>Player</th>
9295-            <th style={{padding: '10px'}}>Rating</th>
9296-          </tr>
9297-        </thead>
9298-        <tbody>
9299-          {leaderboardData.map((data, idx) => (
9300-            <tr key={idx} style={{borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
9301-              <td style={{padding: '10px'}}>{idx + 1}</td>
9302-              <td style={{padding: '10px'}}>{data.name}</td>
9303-              <td style={{padding: '10px'}}>{data.rating}</td>
9304-            </tr>
9305-          ))}
9306-        </tbody>
9307-      </table>
9308-    </div>
9309-  </div>
9310-)}
9311-
9312-              {showExplanation && (
9313-                <div className="explanation-overlay" style={{zIndex: 10000}}>
9314-                  <div className="explanation-header">
9315-                    <h2>カード能力一覧</h2>
9316-                  </div>
9317-                  <div className="explanation-list">
9318-                    {['3','4','5','6','7','8','9','10','J','Q','K','A','2','Joker'].map(rank => {
9319-                      const data = TCG_DATA[rank];
9320-                      if (!data) return null;
9321-                      return (
9322-                        <div key={rank} className="explanation-item">
9323-                          <div className="explanation-card-view" style={{ backgroundImage: `url(${data.url})` }}></div>
9324-                          <div className="explanation-text">
9325-                            <div className="explanation-card-name">{data.name}</div>
9326-                            <div className="explanation-card-desc">{data.desc}</div>
9327-                          </div>
9328-                        </div>
9329-                      );
9330-                    })}
9331-                  </div>
9332-                  <button className="action-btn btn-pass btn-close-explanation mystic-btn" onClick={() => setShowExplanation(false)}>
9333-                    <span className="mystic-btn-text">閉じる</span>
9334-                  </button>
9335-                </div>
9336-              )}
9337-
9338-        </div>
9339-      );
9340-    }
9341-
9342-    const root = ReactDOM.createRoot(document.getElementById('root'));
9343-    root.render(<App />);
9344-
9345-    // 最初のユーザー操作でAudioContextを開け、保留中BGMを再生
9346-    const handleInit = () => {
9347-      sm.flushPendingBGM();
9348-    };
9349-    window.addEventListener('mousedown', handleInit, { once: true });
9350-    window.addEventListener('touchstart', handleInit, { once: true });
9351-    window.addEventListener('keydown', handleInit, { once: true });
9352-
9353-    // 即時BGM開始試行（ブラウザが許可すればそのまま再生、ブロックされれば最初のクリックで開始）
9354-    sm.playTitleBGM();
9355-
9356-
9357-  </script>
