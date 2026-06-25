(() => {
  'use strict';

  const initMobileNavigation = () => {
    const menuButton = document.querySelector('[data-menu-toggle]');
    const navigation = document.querySelector('#site-nav');

    if (!menuButton || !navigation) return;

    menuButton.addEventListener('click', () => {
      const isOpen = navigation.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', String(isOpen));
    });

    navigation.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navigation.classList.remove('is-open');
        menuButton.setAttribute('aria-expanded', 'false');
      });
    });
  };

  const initFeaturedProjectsCarousel = () => {
    const track = document.querySelector('[data-project-track]');
    const dotsHost = document.querySelector('[data-project-dots]');

    if (!track || !dotsHost) return;

    const slides = Array.from(track.children).filter((node) => (
      node.classList
      && node.classList.contains('project-slide')
      && !node.classList.contains('project-slide--clone')
    ));

    if (!slides.length) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const AUTO_DELAY_MS = 4600;
    const MANUAL_PAUSE_MS = 8000;
    const NORMALIZE_DELAY_MS = 620;

    let activeIndex = 0;
    let autoplayTimer = null;
    let resumeTimer = null;
    let scrollRaf = null;
    let hovering = false;
    let focusing = false;
    let manualPauseUntil = 0;
    let normalizing = false;
    let loopStart = 0;

    const clones = slides.map((slide) => {
      const clone = slide.cloneNode(true);
      clone.classList.add('project-slide--clone');
      clone.setAttribute('aria-hidden', 'true');

      clone
        .querySelectorAll('a, button, input, select, textarea, [tabindex]')
        .forEach((node) => node.setAttribute('tabindex', '-1'));

      return clone;
    });

    clones.forEach((clone) => track.appendChild(clone));

    const getPosition = (index) => slides[index]?.offsetLeft ?? 0;

    const updateLoopStart = () => {
      loopStart = clones[0]?.offsetLeft ?? 0;
    };

    const dots = slides.map((slide, index) => {
      const title = slide.querySelector('h3')?.textContent?.trim()
        || `Project ${index + 1}`;
      const dot = document.createElement('button');

      dot.type = 'button';
      dot.className = 'carousel-dot';
      dot.dataset.projectIndex = String(index);
      dot.setAttribute('aria-label', `Show project ${index + 1}: ${title}`);
      dot.setAttribute('aria-current', index === 0 ? 'true' : 'false');
      dot.addEventListener('click', () => {
        pauseAfterManualInteraction();
        goTo(index);
      });

      dotsHost.appendChild(dot);
      return dot;
    });

    const updateDots = () => {
      dots.forEach((dot, index) => {
        const isCurrent = index === activeIndex;
        dot.setAttribute('aria-current', String(isCurrent));
        dot.classList.toggle('is-active', isCurrent);
      });
    };

    const nearestOriginalIndex = () => {
      if (loopStart && track.scrollLeft >= loopStart - 2) return 0;

      let closest = 0;
      let smallestDistance = Number.POSITIVE_INFINITY;

      slides.forEach((slide, index) => {
        const distance = Math.abs(track.scrollLeft - slide.offsetLeft);
        if (distance < smallestDistance) {
          smallestDistance = distance;
          closest = index;
        }
      });

      return closest;
    };

    const goTo = (index) => {
      activeIndex = ((index % slides.length) + slides.length) % slides.length;
      updateDots();
      track.scrollTo({ left: getPosition(activeIndex), behavior: 'smooth' });
    };

    const wrapToFirst = () => {
      activeIndex = 0;
      updateDots();
      track.scrollTo({ left: loopStart, behavior: 'smooth' });

      window.setTimeout(() => {
        if (track.scrollLeft < loopStart - 40) return;

        normalizing = true;
        track.scrollLeft = 0;
        window.requestAnimationFrame(() => {
          normalizing = false;
        });
      }, NORMALIZE_DELAY_MS);
    };

    const canAutoplay = () => (
      !document.hidden
      && !reducedMotion.matches
      && !hovering
      && !focusing
      && Date.now() >= manualPauseUntil
    );

    const stopAutoplay = () => {
      if (!autoplayTimer) return;
      window.clearInterval(autoplayTimer);
      autoplayTimer = null;
    };

    const advance = () => {
      if (!canAutoplay()) return;

      if (activeIndex === slides.length - 1) {
        wrapToFirst();
      } else {
        goTo(activeIndex + 1);
      }
    };

    const refreshAutoplay = () => {
      stopAutoplay();
      if (canAutoplay()) {
        autoplayTimer = window.setInterval(advance, AUTO_DELAY_MS);
      }
    };

    function pauseAfterManualInteraction() {
      manualPauseUntil = Date.now() + MANUAL_PAUSE_MS;

      if (resumeTimer) window.clearTimeout(resumeTimer);

      resumeTimer = window.setTimeout(() => {
        manualPauseUntil = 0;
        refreshAutoplay();
      }, MANUAL_PAUSE_MS + 20);

      refreshAutoplay();
    }

    track.addEventListener('scroll', () => {
      if (normalizing) return;

      if (scrollRaf) window.cancelAnimationFrame(scrollRaf);
      scrollRaf = window.requestAnimationFrame(() => {
        activeIndex = nearestOriginalIndex();
        updateDots();
      });
    }, { passive: true });

    track.addEventListener('pointerenter', () => {
      hovering = true;
      refreshAutoplay();
    });

    track.addEventListener('pointerleave', () => {
      hovering = false;
      refreshAutoplay();
    });

    track.addEventListener('focusin', () => {
      focusing = true;
      refreshAutoplay();
    });

    track.addEventListener('focusout', () => {
      window.setTimeout(() => {
        focusing = track.contains(document.activeElement)
          || dotsHost.contains(document.activeElement);
        refreshAutoplay();
      }, 0);
    });

    track.addEventListener('pointerdown', pauseAfterManualInteraction, { passive: true });
    track.addEventListener('touchstart', pauseAfterManualInteraction, { passive: true });
    track.addEventListener('wheel', pauseAfterManualInteraction, { passive: true });

    track.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        pauseAfterManualInteraction();
        goTo(activeIndex + 1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        pauseAfterManualInteraction();
        goTo(activeIndex - 1);
      }
    });

    document.addEventListener('visibilitychange', refreshAutoplay);
    reducedMotion.addEventListener?.('change', refreshAutoplay);
    window.addEventListener('resize', updateLoopStart, { passive: true });
    window.addEventListener('beforeunload', stopAutoplay, { once: true });

    if ('ResizeObserver' in window) {
      new ResizeObserver(updateLoopStart).observe(track);
    }

    window.requestAnimationFrame(() => {
      updateLoopStart();
      updateDots();
      refreshAutoplay();
    });
  };

  initMobileNavigation();
  initFeaturedProjectsCarousel();
})();
