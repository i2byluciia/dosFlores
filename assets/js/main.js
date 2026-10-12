/* =========================================================
   DOS FLORES · JavaScript (vanilla, sin dependencias)
   Contenido:
   0. Modo claro / oscuro
   1. Menú móvil accesible
   2. Carrusel de destacados
   3. Año automático del footer
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
     3. AÑO AUTOMÁTICO DEL FOOTER
     --------------------------------------------------------- */
  var year = document.getElementById('anio');
  if (year) year.textContent = new Date().getFullYear();

})();