/* =========================================================
   DOS FLORES · JavaScript (vanilla, sin dependencias)
   Contenido:
   0. Modo claro / oscuro
   1. Menú móvil accesible
   2. Carrusel de destacados
   3. Rastro de humo del ratón
   4. Año automático del footer
   ========================================================= */

(function () {
  'use strict';


  /* ---------------------------------------------------------
     0. MODO CLARO / OSCURO
     - Sin elección guardada: se sigue el tema del dispositivo.
     - Al pulsar el botón se pone data-theme="light" o "dark" en <html>
       (el CSS cambia colores y fotos de velas) y se guarda la elección.
     - Un pequeño script en el <head> del HTML la aplica antes de pintar.
     --------------------------------------------------------- */
  var THEME_KEY = 'dosflores-tema';
  var root = document.documentElement;
  var themeBtn = document.querySelector('.theme-toggle');
  var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  // Tema activo ahora mismo: el elegido con el botón o, si no hay, el del sistema
  function currentTheme() {
    var set = root.getAttribute('data-theme');
    if (set === 'dark' || set === 'light') return set;
    return darkQuery.matches ? 'dark' : 'light';
  }

  // Actualiza el texto accesible del botón según el tema
  function updateThemeButton() {
    if (!themeBtn) return;
    var label = currentTheme() === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro';
    themeBtn.setAttribute('aria-label', label);
    themeBtn.setAttribute('title', label);
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* sin almacenamiento: vale igual */ }
      updateThemeButton();
    });
    // Si el sistema cambia de tema y la persona no eligió nada, se actualiza el botón
    darkQuery.addEventListener('change', updateThemeButton);
    updateThemeButton();
  }


  /* ---------------------------------------------------------
     1. MENÚ MÓVIL
     - Botón hamburguesa abre/cierra el menú (clase .is-open).
     - Mantiene aria-expanded y el texto del botón actualizados.
     - Se cierra con Escape, al pulsar un enlace, al hacer clic
       fuera o al pasar a pantalla de escritorio.
     --------------------------------------------------------- */
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('menu-principal');

  if (toggle && menu) {
    var toggleLabel = toggle.querySelector('.visually-hidden');
    var desktopQuery = window.matchMedia('(min-width: 64rem)'); // mismo punto de corte que el CSS

    function setMenu(open, returnFocus) {
      menu.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      if (toggleLabel) toggleLabel.textContent = open ? 'Cerrar menú' : 'Abrir menú';
      if (!open && returnFocus) toggle.focus();
    }

    toggle.addEventListener('click', function () {
      setMenu(!menu.classList.contains('is-open'));
    });

    // Cierra al pulsar un enlace del menú
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });

    // Cierra con Escape y devuelve el foco al botón
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false, true);
    });

    // Cierra al hacer clic fuera del header
    document.addEventListener('click', function (e) {
      if (menu.classList.contains('is-open') && !e.target.closest('.site-header')) setMenu(false);
    });

    // Si se agranda la ventana a escritorio, deja el menú en su estado base
    desktopQuery.addEventListener('change', function (e) {
      if (e.matches) setMenu(false);
    });
  }


  /* ---------------------------------------------------------
     2. CARRUSEL DE NOVEDADES
     Para añadir una vela, duplica un <article class="slide"> en el HTML.
     Los puntos se generan solos según cuántas tarjetas se vean a la vez
     (1 en móvil, 2 en tablet, 3 en escritorio).
     - Se desliza con el dedo / ratón (scroll-snap en el CSS).
     - Flechas, puntos y teclado (← →) mueven la pista tarjeta a tarjeta.
     - Sin reproducción automática (más accesible y más tranquilo).
     - Si todas las tarjetas caben, los controles se ocultan.
     --------------------------------------------------------- */
  var carousel = document.querySelector('.carousel');

  if (carousel) {
    var viewport = carousel.querySelector('.carousel__viewport');
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('.slide'));
    var btnPrev = carousel.querySelector('.carousel__btn--prev');
    var btnNext = carousel.querySelector('.carousel__btn--next');
    var dotsBox = carousel.querySelector('.carousel__dots');
    var controls = carousel.querySelector('.carousel__controls');
    var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    var dots = [];
    var ticking = false;

    // Ancho de un paso (tarjeta + hueco)
    function stepSize() {
      return slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : viewport.clientWidth;
    }

    // Cuántas tarjetas se ven a la vez ahora mismo
    function perView() {
      var step = stepSize();
      var gap = step - slides[0].offsetWidth;
      return Math.max(1, Math.round((viewport.clientWidth + gap) / step));
    }

    // Última posición a la que se puede llegar (0 = primera tarjeta)
    function maxIndex() {
      return Math.max(0, slides.length - perView());
    }

    // Posición actual según el scroll
    function currentIndex() {
      return Math.min(maxIndex(), Math.max(0, Math.round(viewport.scrollLeft / stepSize())));
    }

    function goTo(index) {
      var i = Math.min(maxIndex(), Math.max(0, index));
      viewport.scrollTo({ left: i * stepSize(), behavior: motionQuery.matches ? 'auto' : 'smooth' });
    }

    // Reconstruye los puntos si cambia el número de posiciones (al redimensionar)
    function buildDots() {
      var total = maxIndex() + 1;
      if (dots.length === total) return;
      dotsBox.innerHTML = '';
      dots = [];
      for (var i = 0; i < total; i++) {
        (function (n) {
          var dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'carousel__dot';
          dot.setAttribute('aria-label', 'Ir a la posición ' + (n + 1));
          dot.addEventListener('click', function () { goTo(n); });
          dotsBox.appendChild(dot);
          dots.push(dot);
        })(i);
      }
    }

    // Actualiza puntos, flechas y visibilidad de los controles
    function update() {
      buildDots();
      var idx = currentIndex();
      var max = maxIndex();
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === idx);
        if (i === idx) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
      if (btnPrev) btnPrev.disabled = idx <= 0;
      if (btnNext) btnNext.disabled = idx >= max;
      if (controls) controls.hidden = max < 1;
    }

    if (btnPrev) btnPrev.addEventListener('click', function () { goTo(currentIndex() - 1); });
    if (btnNext) btnNext.addEventListener('click', function () { goTo(currentIndex() + 1); });

    // Teclado: flechas izquierda y derecha cuando el foco está dentro del carrusel
    carousel.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { goTo(currentIndex() - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { goTo(currentIndex() + 1); e.preventDefault(); }
    });

    // Al deslizar, actualiza los controles (una vez por fotograma)
    viewport.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { update(); ticking = false; });
    }, { passive: true });

    window.addEventListener('resize', update);
    if (slides.length) update();
  }


  /* ---------------------------------------------------------
     3. RASTRO DE HUMO DEL RATÓN
     Una columna de humo suave sube desde el cursor, como el de una vela
     recién apagada. Detalles:
     - Solo con ratón (en móvil/tablet táctil no se activa).
     - No se activa si la persona pidió menos movimiento en su sistema.
     - Se adapta al modo claro/oscuro (humo morado en claro, lavanda en oscuro).
     - El bucle de animación se detiene solo cuando no queda humo.
     Ajustes rápidos: SMOKE (cantidad, tamaño, duración y opacidad).
     --------------------------------------------------------- */
  var SMOKE = {
    max: 110,          // máximo de partículas a la vez
    spacing: 9,        // píxeles de recorrido entre partículas (menos = más denso)
    radius: [10, 18],  // tamaño inicial (mín, máx) en px
    growth: 34,        // cuánto crece cada partícula mientras sube
    life: [1100, 1900],// duración (mín, máx) en milisegundos
    rise: [0.25, 0.6], // velocidad de subida (px por fotograma a 60 fps)
    alpha: 0.2         // opacidad máxima (0 a 1)
  };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mouseOnly = window.matchMedia('(hover: hover) and (pointer: fine)');

  if (!reduceMotion.matches && mouseOnly.matches) {
    var canvas = document.createElement('canvas');
    canvas.className = 'smoke-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var puffs = [];
    var lastX = null, lastY = null, lastTime = 0, running = false;

    function sizeCanvas() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    sizeCanvas();
    window.addEventListener('resize', sizeCanvas);

    function rand(range) { return range[0] + Math.random() * (range[1] - range[0]); }

    function addPuff(x, y) {
      if (puffs.length >= SMOKE.max) puffs.shift();
      puffs.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y,
        r: rand(SMOKE.radius),
        vy: rand(SMOKE.rise),
        wobble: Math.random() * Math.PI * 2,      // fase del vaivén lateral
        sway: 0.2 + Math.random() * 0.4,          // intensidad del vaivén
        age: 0,
        life: rand(SMOKE.life)
      });
    }

    document.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      if (lastX !== null) {
        var dx = e.clientX - lastX, dy = e.clientY - lastY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var steps = Math.min(8, Math.floor(dist / SMOKE.spacing));
        for (var i = 1; i <= steps; i++) {
          addPuff(lastX + (dx * i) / steps, lastY + (dy * i) / steps);
        }
        if (steps > 0) { lastX = e.clientX; lastY = e.clientY; }
      } else {
        lastX = e.clientX; lastY = e.clientY;
      }
      if (!running && puffs.length) { running = true; lastTime = performance.now(); requestAnimationFrame(frame); }
    }, { passive: true });

    // Al salir el ratón de la ventana, el rastro se corta (no salta al volver a entrar)
    document.documentElement.addEventListener('pointerleave', function () { lastX = lastY = null; });

    function frame(now) {
      var dt = Math.min(now - lastTime, 50);
      lastTime = now;
      var step = dt / 16.67;                       // 1 = un fotograma a 60 fps
      var rgb = currentTheme() === 'dark' ? '218, 212, 223' : '136, 112, 142';

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (var i = puffs.length - 1; i >= 0; i--) {
        var p = puffs[i];
        p.age += dt;
        if (p.age >= p.life) { puffs.splice(i, 1); continue; }
        var t = p.age / p.life;                    // 0 → 1 a lo largo de su vida
        p.y -= p.vy * step;
        p.x += Math.sin(p.wobble + t * 5) * p.sway * step;
        var r = p.r + SMOKE.growth * t;
        var a = SMOKE.alpha * Math.pow(1 - t, 1.6) * Math.min(1, t * 10);

        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')');
        g.addColorStop(1, 'rgba(' + rgb + ',0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (puffs.length) requestAnimationFrame(frame);
      else { running = false; ctx.clearRect(0, 0, window.innerWidth, window.innerHeight); }
    }
  }


  /* ---------------------------------------------------------
     4. AÑO AUTOMÁTICO DEL FOOTER
     --------------------------------------------------------- */
  var year = document.getElementById('anio');
  if (year) year.textContent = new Date().getFullYear();

})();