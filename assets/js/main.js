/* =========================================================
   DOS FLORES · JavaScript (vanilla, sin dependencias)
   Contenido:
   1. Menú móvil accesible
   2. Carrusel de destacados
   3. Año automático del footer
   ========================================================= */

(function () {
  'use strict';


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
     2. CARRUSEL DE DESTACADOS
     Para añadir una vela destacada, duplica un <article class="slide">
     en el HTML. Los puntos y los números "1 de N" se generan solos.
     - Flechas, puntos, teclado (← →) y deslizar con el dedo.
     - Sin reproducción automática (más accesible y más tranquilo).
     - Con una sola diapositiva, se ocultan flechas y puntos.
     --------------------------------------------------------- */
  var carousel = document.querySelector('.carousel');

  if (carousel) {
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('.slide'));
    var btnPrev = carousel.querySelector('.carousel__btn--prev');
    var btnNext = carousel.querySelector('.carousel__btn--next');
    var dotsBox = carousel.querySelector('.carousel__dots');
    var track = carousel.querySelector('.carousel__track');
    var current = 0;
    var dots = [];

    // Crea un punto por cada diapositiva
    if (dotsBox) {
      dotsBox.innerHTML = '';
      slides.forEach(function (slide, i) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel__dot';
        dot.setAttribute('aria-label', 'Ir a la vela ' + (i + 1));
        dot.addEventListener('click', function () { goTo(i); });
        dotsBox.appendChild(dot);
        dots.push(dot);
      });
    }

    // Muestra la diapositiva indicada
    function goTo(index) {
      current = (index + slides.length) % slides.length; // da la vuelta al llegar al final
      slides.forEach(function (slide, i) {
        var active = i === current;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-label', (i + 1) + ' de ' + slides.length);
        slide.setAttribute('aria-hidden', String(!active));
      });
      dots.forEach(function (dot, i) {
        var active = i === current;
        dot.classList.toggle('is-active', active);
        if (active) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
    }

    if (btnPrev) btnPrev.addEventListener('click', function () { goTo(current - 1); });
    if (btnNext) btnNext.addEventListener('click', function () { goTo(current + 1); });

    // Teclado: flechas izquierda y derecha cuando el foco está dentro del carrusel
    carousel.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { goTo(current - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { goTo(current + 1); e.preventDefault(); }
    });

    // Deslizar con el dedo (móvil)
    var startX = null;
    if (track) {
      track.addEventListener('touchstart', function (e) {
        startX = e.changedTouches[0].clientX;
      }, { passive: true });
      track.addEventListener('touchend', function (e) {
        if (startX === null) return;
        var diff = e.changedTouches[0].clientX - startX;
        if (Math.abs(diff) > 50) goTo(diff < 0 ? current + 1 : current - 1);
        startX = null;
      }, { passive: true });
    }

    // Con una sola diapositiva no hace falta navegación
    var single = slides.length < 2;
    [btnPrev, btnNext, dotsBox].forEach(function (el) {
      if (el) el.hidden = single;
    });

    if (slides.length) goTo(0);
  }


  /* ---------------------------------------------------------
     3. AÑO AUTOMÁTICO DEL FOOTER
     --------------------------------------------------------- */
  var year = document.getElementById('anio');
  if (year) year.textContent = new Date().getFullYear();

})();
