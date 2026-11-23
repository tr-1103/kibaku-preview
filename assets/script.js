/* ===== 2026-11-23：TimeRex の予約URL。ここに入れると全ページでボタンが出る（空の間は「準備中」の一文を出す） ===== */
var TIMEREX_URL = "https://timerex.net/s/kamenobu0524_c67a/97b27436";

  (function(){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    },{threshold:0.12, rootMargin:'0px 0px -8% 0px'});
    document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });

    var bar = document.getElementById('progress');
    var ticking = false;
    function onScroll(){
      if(ticking) return; ticking = true;
      requestAnimationFrame(function(){
        if(!bar){ ticking = false; return; }
        var h = document.documentElement;
        var max = h.scrollHeight - h.clientHeight;
        var p = max > 0 ? (h.scrollTop || window.pageYOffset) / max : 0;
        bar.style.width = (p*100).toFixed(2) + '%';
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
  })();

  /* ===== 2026-07-23 追加：パララックス（Approach A） ===== */
  (function(){
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduce) return;                        // 動き抑制設定なら何もしない
    if(window.innerWidth <= 640) return;       // モバイルはパララックス無効（軽量化）

    var items = [].slice.call(document.querySelectorAll('[data-parallax]'));
    if(!items.length) return;
    items.forEach(function(el){ el.dataset._speed = parseFloat(el.getAttribute('data-parallax')) || 0.15; });

    var ticking = false;
    function update(){
      var vh = window.innerHeight;
      items.forEach(function(el){
        var r = el.getBoundingClientRect();
        if(r.bottom < -200 || r.top > vh + 200) return;   // 画面外はスキップ
        var center = r.top + r.height/2 - vh/2;            // ビューポート中心からの距離
        var y = -(center * (el.dataset._speed));           // 速度係数で奥行き
        el.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
      });
      ticking = false;
    }
    function onScroll(){ if(ticking) return; ticking = true; requestAnimationFrame(update); }
    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', onScroll, {passive:true});
    update();
  })();

  /* 旧「3Dスクロール・イントロ」(#scene/#introCanvas + assets/frames/) は
     2026-07-24 にヒーローのロゴ演出へ統合したため削除済み。 */

  /* ===== 2026-07-24 更新：①〜③の背景コマ送り（スクロール追従） =====
     ヒーローと同じ映像素材を再利用する。使うのは 8〜44番＝金の筆で円相を描いている最中で、
     まだ文字（ムーンブラスト・希爆）が出ていない区間。文字が背景で二重に出るのを避けつつ、
     すでにヒーローで読み込み済み＝画像の追加ダウンロードはゼロ。 */
  (function(){
    var region = document.getElementById('scrubRegion');
    var canvas = document.getElementById('scrubCanvas');
    if(!region || !canvas) return;
    var FRAME_START = 8, FRAME_END = 44;
    var FRAME_COUNT = FRAME_END - FRAME_START + 1;
    function framePath(i){ return 'assets/logo_frames/' + String(FRAME_START + i).padStart(4, '0') + '.jpg'; }
    var ctx = canvas.getContext('2d');
    var images = [], loaded = 0, current = -1;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize(){
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
      draw(current < 0 ? 0 : current, true);
    }
    function drawCover(img){
      if(!img || !img.complete || !img.width) return;
      var cw = canvas.width, ch = canvas.height, ir = img.width / img.height, cr = cw / ch, dw, dh, dx, dy;
      if(ir > cr){ dh = ch; dw = ch * ir; dx = (cw - dw) / 2; dy = 0; }
      else { dw = cw; dh = cw / ir; dx = 0; dy = (ch - dh) / 2; }
      ctx.clearRect(0, 0, cw, ch); ctx.drawImage(img, dx, dy, dw, dh);
    }
    function draw(idx, force){ idx = Math.max(0, Math.min(FRAME_COUNT - 1, idx)); if(idx === current && !force) return; current = idx; drawCover(images[idx]); }
    var ticking = false;
    function onScroll(){
      if(ticking) return; ticking = true;
      requestAnimationFrame(function(){
        var r = region.getBoundingClientRect();
        var total = region.offsetHeight - window.innerHeight;
        var pr = total > 0 ? (-r.top / total) : 0;
        pr = Math.max(0, Math.min(1, pr));
        draw(Math.round(pr * (FRAME_COUNT - 1)));
        ticking = false;
      });
    }
    function ready(){
      resize();
      window.addEventListener('resize', resize);
      onScroll();
      if(!reduce) window.addEventListener('scroll', onScroll, {passive:true});
    }
    for(var i = 0; i < FRAME_COUNT; i++){
      var im = new Image();
      im.onload = im.onerror = function(){ loaded++; if(loaded === FRAME_COUNT) ready(); };
      im.src = framePath(i);
      images.push(im);
    }
  })();

  /* ===== 2026-07-24 更新：ヒーロー全面シネマティック（Gemini生成映像をスクロール・スクラブ） =====
     素材＝実写級の生成映像 96枚（1280×720）。黒和紙→金の筆で円相→月→ムーンブラスト→希爆が炸裂。
     画面いっぱいに cover 描画するため、矩形の縁が存在しない。 */
  (function(){
    var canvas = document.getElementById('heroLogoCanvas');
    var stage = document.getElementById('logoStage');
    var hint = document.getElementById('scrollHint');
    if(!canvas || !stage) return;
    var eyebrow = stage.querySelector('.eyebrow');
    var FRAME_COUNT = 96;
    function framePath(i){ return 'assets/logo_frames/' + String(i + 1).padStart(4, '0') + '.jpg'; }
    var ctx = canvas.getContext('2d');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var images = [], current = -1, started = false, cw0 = 0, ch0 = 0;
    function clamp(v, a, b){ return v < a ? a : (v > b ? b : v); }
    function ok(im){ return im && im.complete && im.naturalWidth; }

    function resize(){
      var cw = canvas.clientWidth, ch = canvas.clientHeight;
      if(!cw || !ch || (cw === cw0 && ch === ch0)) return;      // 実寸が変わった時だけ再構築
      cw0 = cw; ch0 = ch;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      if(cw * dpr > 1600) dpr = 1600 / cw;                      // 素材が1280px幅なので、これ以上大きくしても画質は上がらない
      canvas.width = Math.max(1, Math.floor(cw * dpr));
      canvas.height = Math.max(1, Math.floor(ch * dpr));
      draw(current < 0 ? 0 : current, true);
    }
    /* 素材は16:9。スマホの縦長画面にそのまま cover で敷くと左右が切れてロゴが欠けるため、
       「完成形ロゴが横幅に収まる最小限の拡大」で止め、余った上下は地の色へフェードさせる。
       横長画面（PC）では従来どおり全面 cover になる。 */
    var LOGO_W_RATIO = 0.50;   // 完成形ロゴが占める横幅の割合（実測 約0.43 ＋ 左右の余白）
    var BG = '#15110D';        // --sumi-bg
    function drawFrame(img){
      if(!ok(img)) return;
      var cw = canvas.width, ch = canvas.height, ir = img.width / img.height, cr = cw / ch;
      var dw, dh, dx, dy, fade = 0;
      if(ir > cr){                                   // 画面のほうが縦長 ＝ cover だと横が切れる
        var coverW = ch * ir;
        dw = Math.min(coverW, cw / LOGO_W_RATIO);    // これ以上広げるとロゴが画面外へ出る
        dh = dw / ir;
        if(dh >= ch){ dh = ch; dw = coverW; }        // 収まりきるなら通常の cover
        else { fade = Math.min(dh * 0.16, ch * 0.10); }
        dx = (cw - dw) / 2; dy = (ch - dh) / 2;
      } else {
        dw = cw; dh = cw / ir; dx = 0; dy = (ch - dh) / 2;
      }
      ctx.fillStyle = BG; ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(img, dx, dy, dw, dh);
      if(fade > 0){                                  // 帯の上下端を地の色へ溶かす（硬い横線を出さない）
        var top = ctx.createLinearGradient(0, dy, 0, dy + fade);
        top.addColorStop(0, BG); top.addColorStop(1, 'rgba(21,17,13,0)');
        ctx.fillStyle = top; ctx.fillRect(0, dy, cw, fade);
        var bot = ctx.createLinearGradient(0, dy + dh, 0, dy + dh - fade);
        bot.addColorStop(0, BG); bot.addColorStop(1, 'rgba(21,17,13,0)');
        ctx.fillStyle = bot; ctx.fillRect(0, dy + dh - fade, cw, fade);
      }
    }
    /* まだ読めていないコマは、読み込み済みの最も近いコマで代用（＝白飛び・空白を出さない） */
    function nearestLoaded(idx){
      if(ok(images[idx])) return images[idx];
      for(var d = 1; d < FRAME_COUNT; d++){
        if(idx - d >= 0 && ok(images[idx - d])) return images[idx - d];
        if(idx + d < FRAME_COUNT && ok(images[idx + d])) return images[idx + d];
      }
      return null;
    }
    function draw(idx, force){
      idx = clamp(idx, 0, FRAME_COUNT - 1);
      if(idx === current && !force) return;
      var img = nearestLoaded(idx);
      if(!img) return;
      current = idx; drawFrame(img);
    }
    /* 冒頭は真っ黒に近いので、数コマ進んだ「筆が入ってくる」ところから始める */
    var START_FRAME = 3;
    function frameForScroll(){
      var total = stage.offsetHeight - window.innerHeight;
      var pr = total > 0 ? clamp(-stage.getBoundingClientRect().top / total, 0, 1) : 0;  // ステージ内スクロール＝0→1
      if(hint) hint.style.opacity = pr < 0.04 ? 0.85 : 0;
      /* ラベルは冒頭だけ。映像が動き出すと金の円相と重なって読めなくなるため退場させる */
      if(eyebrow) eyebrow.style.opacity = pr < 0.07 ? 1 : 0;
      return START_FRAME + Math.round(pr * (FRAME_COUNT - 1 - START_FRAME));
    }
    var ticking = false;
    function onScroll(){ if(reduce || ticking) return; ticking = true; requestAnimationFrame(function(){ draw(frameForScroll()); ticking = false; }); }

    /* 段階ロード：全96枚を待たず、1枚でも届いた時点で描画を開始する */
    function boot(){
      if(started) return; started = true;
      resize();
      window.addEventListener('resize', resize, {passive:true});
      if(reduce){ draw(FRAME_COUNT - 1, true); return; }        // 動き抑制：完成形を静止表示
      draw(frameForScroll(), true);
      window.addEventListener('scroll', onScroll, {passive:true});
    }
    for(var i = 0; i < FRAME_COUNT; i++){
      (function(i){
        var im = new Image();
        im.onload = function(){
          boot();
          if(Math.abs(i - current) <= 2) draw(current < 0 ? 0 : current, true);   // 表示中の近傍が届いたら描き直す
        };
        im.onerror = function(){ boot(); };
        im.src = framePath(i);
        images[i] = im;
      })(i);
    }
  })();

/* ===== 2026-11-23 追加：TimeRexボタン（全ページ共通） ===== */
(function(){
  var btns = document.querySelectorAll('a[data-timerex]');
  var pend = document.querySelectorAll('[data-timerex-pending]');
  var has = !!(TIMEREX_URL && String(TIMEREX_URL).replace(/\s/g,''));
  [].forEach.call(btns, function(a){
    if(has){ a.setAttribute('href', TIMEREX_URL); a.classList.add('on'); }
    else { a.removeAttribute('href'); a.classList.remove('on'); }
  });
  [].forEach.call(pend, function(p){ p.hidden = has; });
})();

/* ===== 2026-11-23 追加：会社HPのタブ・開閉・ハッシュ（index.html のみ。要素が無ければ何もしない） ===== */
(function(){
  var tablist = document.querySelector('.co-tablist');
  if(!tablist) return;
  var TABS = ['company','president','concept','juku','coaching','consulting','lecture'];
  var ALIAS = {outline:'juku', pricing:'juku', philosophy:'juku', promo:'juku', founder:'president', book:'president'};
  var DEFAULT = 'lecture';
  var tabs = {}, panels = {};
  TABS.forEach(function(id){ tabs[id] = document.getElementById('tab-'+id); panels[id] = document.getElementById('panel-'+id); });
  var header = document.querySelector('header');
  var bar = document.getElementById('coTabs');
  var current = DEFAULT;

  function measure(){
    var root = document.documentElement;
    if(header) root.style.setProperty('--co-hh', header.offsetHeight + 'px');
    if(bar) root.style.setProperty('--co-th', bar.offsetHeight + 'px');
  }
  var tabsWrap = bar;
  function fades(){
    if(!tabsWrap) return;
    var max = tablist.scrollWidth - tablist.clientWidth;
    tabsWrap.classList.toggle('fade-l', tablist.scrollLeft > 4);
    tabsWrap.classList.toggle('fade-r', max > 4 && tablist.scrollLeft < max - 4);
  }
  tablist.addEventListener('scroll', fades, {passive:true});
  window.addEventListener('resize', fades, {passive:true});
  function centerTab(id){
    var t = tabs[id]; if(!t) return;
    var target = t.offsetLeft - (tablist.clientWidth - t.offsetWidth) / 2;
    tablist.scrollLeft = Math.max(0, target);
    fades();
  }
  function show(id){
    if(!panels[id]) id = DEFAULT;
    current = id;
    TABS.forEach(function(k){
      var on = (k === id);
      panels[k].classList.toggle('on', on);
      tabs[k].setAttribute('aria-selected', on ? 'true' : 'false');
      tabs[k].setAttribute('tabindex', on ? '0' : '-1');
    });
    centerTab(id);
  }
  function scrollToPanel(id){
    var p = panels[id]; if(!p) return;
    var off = (header ? header.offsetHeight : 0) + (bar ? bar.offsetHeight : 0);
    var y = p.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop) - off;
    window.scrollTo(0, Math.max(0, y));
  }
  function scrollToContact(){
    var c = document.getElementById('contact'); if(!c) return;
    var off = (header ? header.offsetHeight : 0) + (bar ? bar.offsetHeight : 0);
    var y = c.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop) - off;
    window.scrollTo(0, Math.max(0, y));
  }
  function hashId(){
    var h = location.hash.replace(/^#/, '');
    try { h = decodeURIComponent(h); } catch(e){}
    return h;
  }
  function resolve(h){
    if(TABS.indexOf(h) >= 0) return h;
    if(Object.prototype.hasOwnProperty.call(ALIAS, h)) return ALIAS[h];
    return null;
  }
  function apply(doScroll){
    var h = hashId();
    if(h === 'contact' || h === 'consult'){ show(current); if(doScroll) scrollToContact(); return; }
    var id = resolve(h);
    if(id){ show(id); if(doScroll) scrollToPanel(id); }
    else { show(DEFAULT); }
  }

  /* タブのクリック・キーボード */
  TABS.forEach(function(id, i){
    tabs[id].addEventListener('click', function(){
      if(hashId() === id){ show(id); scrollToPanel(id); }
      else { location.hash = id; }
    });
    tabs[id].addEventListener('keydown', function(e){
      var n = null;
      if(e.key === 'ArrowRight') n = (i + 1) % TABS.length;
      else if(e.key === 'ArrowLeft') n = (i - 1 + TABS.length) % TABS.length;
      else if(e.key === 'Home') n = 0;
      else if(e.key === 'End') n = TABS.length - 1;
      if(n === null) return;
      e.preventDefault();
      var nid = TABS[n];
      try { history.replaceState(null, '', '#' + nid); } catch(err){}
      show(nid);
      tabs[nid].focus();
    });
  });
  /* 本文中・フッターのハッシュリンク（同じハッシュでも動かす） */
  document.addEventListener('click', function(e){
    var jump = e.target.closest ? e.target.closest('[data-jump]') : null;
    if(jump){
      var t = document.getElementById(jump.getAttribute('data-jump'));
      if(t){ e.preventDefault(); var off0 = (header ? header.offsetHeight : 0) + (bar ? bar.offsetHeight : 0); window.scrollTo(0, Math.max(0, t.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop) - off0 - 12)); }
      return;
    }
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if(!a || a.getAttribute('role') === 'tab') return;
    var h = a.getAttribute('href').slice(1);
    if(h === hashId() && (resolve(h) || h === 'consult' || h === 'contact')){ e.preventDefault(); apply(true); }
  });
  window.addEventListener('hashchange', function(){ apply(true); });

  /* すべて開く／すべて閉じる */
  document.addEventListener('click', function(e){
    var b = e.target.closest ? e.target.closest('[data-acc]') : null;
    if(!b) return;
    var panel = b.closest('.co-panel'); if(!panel) return;
    var open = b.getAttribute('data-acc') === 'open';
    [].forEach.call(panel.querySelectorAll('details.co-acc'), function(d){ d.open = open; });
  });

  window.addEventListener('resize', measure, {passive:true});
  window.addEventListener('load', measure);
  measure();
  apply(!!hashId());
  fades();
  /* フォント読み込みで高さが変わるので、少し後にもう一度測る */
  setTimeout(measure, 400);
  if(hashId() === 'contact' || hashId() === 'consult'){ window.addEventListener('load', function(){ measure(); scrollToContact(); }); }
})();
