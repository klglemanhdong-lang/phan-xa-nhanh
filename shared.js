/* ============================================================
   SIÊU TRÍ NHỚ — SHARED ENGINE v1.0
   Audio, Progress, Effects, Utilities
   ============================================================ */

(function(G) {
  'use strict';

  // ── LEVEL THEME COLORS (mỗi 10 level một gam màu) ──────────
  const THEMES = {
    // Level 1-10: Xanh cyan (khởi đầu)
    1:  '#00d2ff', 2:  '#00d2ff', 3:  '#00d2ff', 4:  '#00d2ff', 5:  '#00d2ff',
    6:  '#00d2ff', 7:  '#00d2ff', 8:  '#00d2ff', 9:  '#00d2ff', 10: '#00d2ff',
    // Level 11-20: Xanh lá (trung cấp)
    11: '#2ecc71', 12: '#2ecc71', 13: '#2ecc71', 14: '#2ecc71', 15: '#2ecc71',
    16: '#2ecc71', 17: '#2ecc71', 18: '#2ecc71', 19: '#2ecc71', 20: '#2ecc71',
    // Level 21-30: Cam vàng (cao cấp)
    21: '#f39c12', 22: '#f39c12', 23: '#f39c12', 24: '#f39c12', 25: '#f39c12',
    26: '#f39c12', 27: '#f39c12', 28: '#f39c12', 29: '#f39c12', 30: '#f39c12',
    // Level 31-40: Tím hồng (master)
    31: '#e91e8c', 32: '#e91e8c', 33: '#e91e8c', 34: '#e91e8c', 35: '#e91e8c',
    36: '#e91e8c', 37: '#e91e8c', 38: '#e91e8c', 39: '#e91e8c', 40: '#e91e8c',
  };

  const TOTAL_LEVELS = 40;

  // ── AUDIO ENGINE ────────────────────────────────────────────
  const AC = new (window.AudioContext || window.webkitAudioContext)();

  function resumeAC() {
    if (AC.state === 'suspended') AC.resume();
  }
  document.addEventListener('touchstart', resumeAC, { once: true });
  document.addEventListener('click', resumeAC, { once: true });

  function tone(freq, type, dur, vol = 0.15, delay = 0) {
    const o = AC.createOscillator(), g = AC.createGain();
    o.connect(g); g.connect(AC.destination);
    o.type = type; o.frequency.value = freq;
    const t = AC.currentTime + delay;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.start(t); o.stop(t + dur + 0.01);
  }

  function noise(dur, vol = 0.08, bandFreq = 600) {
    const buf = AC.createBuffer(1, AC.sampleRate * dur, AC.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = AC.createBufferSource();
    const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = bandFreq;
    const g = AC.createGain();
    src.buffer = buf; src.connect(f); f.connect(g); g.connect(AC.destination);
    g.gain.setValueAtTime(vol, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + dur);
    src.start(); src.stop(AC.currentTime + dur + 0.01);
  }

  const SFX = {
    click() {
      tone(660, 'square', 0.06, 0.18);
      tone(880, 'square', 0.08, 0.12, 0.05);
    },
    select() {
      tone(523, 'triangle', 0.1, 0.2);
      tone(659, 'triangle', 0.1, 0.15, 0.07);
    },
    match() {
      // Khớp thẻ đúng — tiếng "tách" sảng khoái
      tone(880,  'triangle', 0.12, 0.3);
      tone(1108, 'triangle', 0.12, 0.25, 0.08);
      tone(1319, 'triangle', 0.18, 0.2, 0.16);
      noise(0.06, 0.06, 1200);
    },
    combo() {
      // Combo: fanfare ngắn
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 'triangle', 0.18, 0.3, i * 0.09));
      noise(0.05, 0.05, 1000);
    },
    shoot() {
      // Bắn súng: tiếng "vút"
      const o = AC.createOscillator(), g = AC.createGain();
      o.connect(g); g.connect(AC.destination);
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(800, AC.currentTime);
      o.frequency.exponentialRampToValueAtTime(120, AC.currentTime + 0.18);
      g.gain.setValueAtTime(0.3, AC.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + 0.18);
      o.start(); o.stop(AC.currentTime + 0.2);
      noise(0.06, 0.07, 900);
    },
    boom() {
      // Nổ thiên thạch
      noise(0.35, 0.25, 200);
      tone(80, 'sawtooth', 0.3, 0.2);
      tone(120, 'square', 0.25, 0.15, 0.05);
    },
    wrong() {
      // Sai — tiếng bíp đỏ
      tone(200, 'square', 0.15, 0.28);
      tone(150, 'sawtooth', 0.3, 0.2, 0.1);
      noise(0.1, 0.08, 300);
    },
    tick() {
      // Timer tick khi sắp hết giờ
      tone(1200, 'square', 0.04, 0.12);
    },
    win() {
      // Chiến thắng level
      const notes = [523, 659, 784, 1047, 784, 1047, 1319, 1047, 1319, 1568];
      notes.forEach((f, i) => tone(f, 'triangle', 0.22, 0.38, i * 0.11));
      setTimeout(() => noise(0.08, 0.08, 1000), 200);
    },
    lose() {
      [400, 300, 200].forEach((f, i) => tone(f, 'sawtooth', 0.3, 0.25, i * 0.18));
    },
    levelUp() {
      // Ding lên cấp
      [784, 1047, 1319, 1568].forEach((f, i) => {
        tone(f, 'sine', 0.3, 0.35, i * 0.13);
      });
    }
  };

  // Nhạc nền mặc định — hợp âm nhẹ
  let bgActive = false;
  let bgStep = 0;
  let customAudio = null;

  const BG_CHORDS = [
    [261, 329, 392], [293, 369, 440],
    [349, 440, 523], [329, 415, 493],
  ];
  function bgTick() {
    if (!bgActive) return;
    const chord = BG_CHORDS[bgStep % BG_CHORDS.length];
    chord.forEach(f => {
      const o = AC.createOscillator(), g = AC.createGain();
      o.connect(g); g.connect(AC.destination);
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.03, AC.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + 0.75);
      o.start(); o.stop(AC.currentTime + 0.8);
    });
    bgStep++;
    setTimeout(bgTick, 750);
  }

  G.Audio = {
    sfx: SFX,
    startBg(customSrc) {
      resumeAC();
      // Nếu có truyền file nhạc ngoài hoặc tự động nhận diện file nhạc thi đấu
      if (customSrc) {
        if (!customAudio) {
          customAudio = new Audio(customSrc);
          customAudio.loop = true;
          customAudio.volume = 0.25; // Giảm 50% âm lượng
        }
        customAudio.play().catch(e => console.log("Lỗi autoplay:", e));
      } else {
        // Các level bình thường chạy nhạc synth mặc định
        if (!bgActive) { bgActive = true; bgTick(); }
      }
    },
    stopBg() {
      bgActive = false;
      if (customAudio) {
        customAudio.pause();
        customAudio.currentTime = 0;
      }
    },
  };

  // ── PROGRESS SYSTEM ─────────────────────────────────────────
  G.Progress = {
    get(lv) {
      return parseInt(localStorage.getItem('stn_lv_' + lv) || '0');
    },
    set(lv, val) {
      localStorage.setItem('stn_lv_' + lv, val);
    },
    markDone(lv) {
      this.set(lv, 1);
    },
    isDone(lv) {
      return this.get(lv) === 1;
    },
    isUnlocked(lv) {
      if (lv <= 1)  return true;
      if (lv === 11) return true;
      if (lv === 22) return true;
      if (lv === 23) return true;
      return this.isDone(lv - 1);
    },
    countDone() {
      let c = 0;
      for (let i = 1; i <= TOTAL_LEVELS; i++) if (this.isDone(i)) c++;
      return c;
    },
    gate(lv) {
      if (!this.isUnlocked(lv)) {
        document.body.innerHTML = `
          <div style="
            position:fixed;inset:0;background:#0a0a18;
            display:flex;flex-direction:column;align-items:center;justify-content:center;
            font-family:'Nunito',sans-serif;color:white;text-align:center;padding:30px;
          ">
            <div style="font-size:4rem;margin-bottom:16px">🔒</div>
            <div style="font-family:'Bebas Neue',sans-serif;font-size:2rem;color:#FFD700;letter-spacing:3px;margin-bottom:8px">
              LEVEL ${lv} BỊ KHÓA
            </div>
            <div style="color:rgba(255,255,255,.6);font-size:.95rem;margin-bottom:24px;line-height:1.5">
              Hoàn thành Level ${lv - 1} trước<br>để mở khóa màn này!
            </div>
            <a href="index.html" style="
              display:inline-block;padding:14px 32px;
              background:linear-gradient(135deg,#FFD700,#f39c12);
              color:#000;border-radius:50px;font-weight:900;
              font-family:'Bebas Neue',sans-serif;font-size:1.1rem;letter-spacing:2px;
              text-decoration:none;box-shadow:0 5px 0 #a07800;
            ">🏠 VỀ MENU</a>
          </div>`;
        return false;
      }
      return true;
    },
    renderBar(currentLevel) {
      const bar = document.getElementById('global-progress-fill');
      if (!bar) return;
      const done = this.countDone();
      bar.style.width = (done / TOTAL_LEVELS * 100) + '%';
    }
  };

  // ── THEME ───────────────────────────────────────────────────
  G.Theme = {
    apply(level) {
      const color = THEMES[level] || '#00d2ff';
      const r = document.documentElement;
      r.style.setProperty('--theme', color);
      const hex = color.replace('#','');
      const ri = parseInt(hex.substr(0,2),16);
      const gi = parseInt(hex.substr(2,2),16);
      const bi = parseInt(hex.substr(4,2),16);
      r.style.setProperty('--theme-dim', `rgba(${ri},${gi},${bi},0.18)`);
      r.style.setProperty('--theme-glow', `0 0 16px rgba(${ri},${gi},${bi},0.7)`);
    }
  };

  // ── EFFECTS ─────────────────────────────────────────────────
  G.FX = {
    confetti(count = 55) {
      const cols = ['#FFD700','#e74c3c','#2ecc71','#3498db','#9b59b6','#f39c12','#1abc9c','#fff'];
      for (let i = 0; i < count; i++) {
        const el = document.createElement('div');
        el.className = 'confetti-bit';
        const size = 6 + Math.random() * 8;
        el.style.cssText = `
          left:${Math.random()*100}vw;
          background:${cols[Math.floor(Math.random()*cols.length)]};
          width:${size}px; height:${size * (Math.random()>0.5?1:1.6)}px;
          border-radius:${Math.random()>0.5?'50%':'2px'};
          animation-duration:${1.4+Math.random()*2}s;
          animation-delay:${Math.random()*0.6}s;
          transform:rotate(${Math.random()*360}deg);
        `;
        document.body.appendChild(el);
        el.addEventListener('animationend', () => el.remove());
      }
    },

    damageFlash(container) {
      const el = document.createElement('div');
      el.className = 'damage-flash';
      container.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    },

    popup(parent, x, y, text, color = '#2ecc71') {
      const p = document.createElement('div');
      p.className = 'points-popup';
      p.style.left = x + 'px';
      p.style.top  = y + 'px';
      p.style.color = color;
      p.innerText = text;
      parent.appendChild(p);
      setTimeout(() => p.remove(), 900);
    },

    drawLaser(container, x1, y1, x2, y2) {
      const len = Math.hypot(x2-x1, y2-y1);
      const ang = Math.atan2(y2-y1, x2-x1) * 180 / Math.PI;
      const el = document.createElement('div');
      el.className = 'laser-beam';
      el.style.cssText = `width:${len}px;left:${x1}px;top:${y1}px;transform:rotate(${ang}deg);`;
      container.appendChild(el);
      setTimeout(() => el.remove(), 280);
    },

    drawPlasma(container, x1, y1, x2, y2) {
      const len = Math.hypot(x2-x1, y2-y1);
      const ang = Math.atan2(y2-y1, x2-x1) * 180 / Math.PI;
      const el = document.createElement('div');
      el.className = 'plasma-beam';
      el.style.cssText = `width:${len}px;left:${x1}px;top:${y1}px;
        transform:rotate(${ang}deg);--angle:${ang}deg;`;
      container.appendChild(el);
      setTimeout(() => el.remove(), 260);
    },

    fireShurikens(container, x1, y1, x2, y2, count = 3) {
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          const s = document.createElement('div');
          s.className = 'shuriken';
          s.style.left = x1 + 'px'; s.style.top = y1 + 'px';
          s.style.animation = 'spin 0.18s linear infinite';
          container.appendChild(s);
          s.animate([
            { left: x1+'px', top: y1+'px' },
            { left: x2+'px', top: y2+'px' }
          ], { duration: 280, easing: 'linear', fill: 'forwards' });
          setTimeout(() => s.remove(), 300);
        }, i * 90);
      }
    },

    drawSonicWave(container, x1, y1, x2, y2) {
      const steps = 5;
      for (let i = 0; i <= steps; i++) {
        setTimeout(() => {
          const cx = x1 + (x2-x1)*(i/steps);
          const cy = y1 + (y2-y1)*(i/steps);
          const w = document.createElement('div');
          w.className = 'sonic-wave';
          const angle = Math.atan2(y2-y1, x2-x1) * 180/Math.PI;
          w.style.cssText = `left:${cx}px;top:${cy}px;
            transform:translate(-50%,-50%) rotate(${angle+90}deg);`;
          container.appendChild(w);
          setTimeout(() => w.remove(), 420);
        }, i * 38);
      }
    }
  };

  // ── UTILITIES ───────────────────────────────────────────────
  G.Utils = {
    shuffle(arr) {
      const a = [...arr];
      for (let i = a.length-1; i > 0; i--) {
        const j = Math.floor(Math.random()*(i+1));
        [a[i],a[j]] = [a[j],a[i]];
      }
      return a;
    },
    relPos(childRect, parentRect) {
      return {
        x: childRect.left + childRect.width/2  - parentRect.left,
        y: childRect.top  + childRect.height/2 - parentRect.top
      };
    },
    getWrapper() {
      return document.getElementById('app');
    }
  };

  // ── INIT ───────────────────────────────────────────────────
  G.init = function(levelNum) {
    if (!G.Progress.gate(levelNum)) return;
    G.Theme.apply(levelNum);
    G.Progress.renderBar(levelNum);
    
    let gp = document.getElementById('global-progress');
    if (!gp) {
      gp = document.createElement('div');
      gp.id = 'global-progress';
      gp.innerHTML = '<div id="global-progress-fill"></div>';
      const app = document.getElementById('app');
      if (app) app.prepend(gp);
    }
    G.Progress.renderBar(levelNum);
    
    document.querySelectorAll('.home-btn').forEach(btn => {
      btn.onclick = () => { G.Audio.sfx.click(); window.location.href = 'index.html'; };
    });

    // TỰ ĐỘNG PHÁT NHẠC NỀN RIÊNG DÀNH CHO 2 MAN THI ĐẤU
    const currentPath = decodeURIComponent(window.location.pathname.toLowerCase());
    const isSpecialLevel = currentPath.includes('3_sao') || 
                           currentPath.includes('3s') || 
                           currentPath.includes('5_sao') || 
                           currentPath.includes('5s');

    const playBgAudio = () => {
      if (isSpecialLevel) {
        G.Audio.startBg('nhacnen2.mp3');
      } else {
        G.Audio.startBg();
      }
    };

    document.addEventListener('touchstart', playBgAudio, { once: true });
    document.addEventListener('click', playBgAudio, { once: true });
  };

  window.STN = G;

})(window.STN || {});
