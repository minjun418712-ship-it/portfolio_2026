
    const portfolioHeader = document.getElementById('portfolioSiteHeader');
    const portfolioNav = document.querySelector('.portfolio-nav');
    const portfolioNavToggle = document.querySelector('.portfolio-nav-toggle');
    const portfolioNavLinks = document.getElementById('portfolioPrimaryNavigation');
    const mobileNavigation = window.matchMedia('(max-width: 760px)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const modal = document.getElementById('portfolioModal');
    const modalDialog = modal.querySelector('.modal-dialog');
    const modalHeroMedia = document.getElementById('modalHeroMedia');
    const modalThumbs = document.getElementById('modalThumbs');
    const modalDynamicBody = document.getElementById('modalDynamicBody');
    const modalClose = modal.querySelector('.modal-close');
    const modalPrev = document.getElementById('modalPrev');
    const modalNext = document.getElementById('modalNext');
    const modalPageIndicator = document.getElementById('modalPageIndicator');

    const modalTemplates = {
      poster: document.getElementById('modalTemplatePoster'),
      banner: document.getElementById('modalTemplateBanner'),
      cardnews: document.getElementById('modalTemplateCardnews'),
      default: document.getElementById('modalTemplateDefault')
    };

    let lastFocusedElement = null;
    let currentModalImages = [];
    let currentModalTitle = 'Project Title';
    let currentModalIndex = 0;
    let modalTouchStartX = 0;
    let modalTouchDeltaX = 0;

    function getCardPrimaryMedia(source) {
      const imageEl = source.querySelector('img');
      if (imageEl?.getAttribute('src')) {
        return imageEl.getAttribute('src');
      }

      const sourceEl = source.querySelector('video source');
      if (sourceEl?.getAttribute('src')) {
        return sourceEl.getAttribute('src');
      }

      const videoEl = source.querySelector('video');
      if (videoEl?.getAttribute('src')) {
        return videoEl.getAttribute('src');
      }

      return '';
    }

    function isVideoFile(src) {
      return /\.(mp4|webm|ogg)(\?.*)?$/i.test(src || '');
    }

    function createMediaMarkup(src, alt) {
      if (!src) return alt || 'Preview';

      if (isVideoFile(src)) {
        return `
          <video autoplay muted loop playsinline preload="metadata" aria-label="${alt}">
            <source src="${src}">
          </video>
        `;
      }

      return `<img src="${src}" alt="${alt}">`;
    }

    // poster / banner는 data-modal-media 속성으로 썸네일과 다른 모달 전용 이미지를 지정할 수 있습니다.
    function getCardData(source) {
      return {
        type: source.dataset.modalType || 'default',
        title: source.dataset.modalTitle || 'Project Title',
        description: source.dataset.modalDescription || 'Project description',
        role: source.dataset.modalRole || 'Role information',
        tools: source.dataset.modalTools || 'Tool information',
        summary: source.dataset.modalSummary || source.dataset.modalDescription || 'Summary text',
        meta1Label: source.dataset.modalMeta1Label || 'Info 01',
        meta1Value: source.dataset.modalMeta1Value || '-',
        meta2Label: source.dataset.modalMeta2Label || 'Info 02',
        meta2Value: source.dataset.modalMeta2Value || '-',
        meta3Label: source.dataset.modalMeta3Label || 'Info 03',
        meta3Value: source.dataset.modalMeta3Value || '-',
        meta4Label: source.dataset.modalMeta4Label || 'Info 04',
        meta4Value: source.dataset.modalMeta4Value || '-',
        noteTitle: source.dataset.modalNoteTitle || 'Editable Note',
        note: source.dataset.modalNote || 'Write any note here.',
        tags: (source.dataset.modalTags || '').split(',').map(tag => tag.trim()).filter(Boolean),
        link: source.dataset.modalLink || '#',
        subLink: source.dataset.modalSublink || '#',
        images: (source.dataset.modalImages || '').split('|').map(item => item.trim()).filter(Boolean),
        modalMedia: source.dataset.modalMedia || '',
        primaryMedia: getCardPrimaryMedia(source)
      };
    }

    function fillTemplateFields(container, data) {
      container.querySelectorAll('[data-field]').forEach((node) => {
        const key = node.dataset.field;
        node.textContent = data[key] || '';
      });

      container.querySelectorAll('[data-list="tags"]').forEach((list) => {
        list.innerHTML = '';
        if (!data.tags.length) {
          const emptyTag = document.createElement('span');
          emptyTag.className = 'modal-tag';
          emptyTag.textContent = 'No tags';
          list.appendChild(emptyTag);
          return;
        }

        data.tags.forEach((tag) => {
          const chip = document.createElement('span');
          chip.className = 'modal-tag';
          chip.textContent = tag;
          list.appendChild(chip);
        });
      });

      const mainLink = container.querySelector('#modalLink');
      if (mainLink) {
        mainLink.href = data.link;
        mainLink.classList.toggle('is-hidden', data.link === '#');
      }

      const subLink = container.querySelector('#modalSubLink');
      if (subLink) {
        subLink.href = data.subLink;
        subLink.classList.toggle('is-hidden', data.subLink === '#');
      }
    }

    function setModalGalleryMode(type, totalImages) {
      const isMultiPageCardNews = type === 'cardnews' && totalImages > 1;

      modalThumbs.classList.toggle('is-hidden', !isMultiPageCardNews);
      modalPrev.classList.toggle('is-hidden', !isMultiPageCardNews);
      modalNext.classList.toggle('is-hidden', !isMultiPageCardNews);
      modalPageIndicator.classList.toggle('is-hidden', !isMultiPageCardNews);
    }




    function setModalTypeClass(type) {
      modalDialog.classList.remove('modal-type-poster', 'modal-type-banner', 'modal-type-cardnews', 'modal-type-default');
      const normalized = ['poster', 'banner', 'cardnews'].includes(type) ? type : 'default';
      modalDialog.classList.add(`modal-type-${normalized}`);
    }

    function renderModalBody(data) {
      const template = modalTemplates[data.type] || modalTemplates.default;
      const fragment = template.content.cloneNode(true);
      const wrapper = document.createElement('div');
      wrapper.className = 'modal-dynamic-body';
      wrapper.appendChild(fragment);
      fillTemplateFields(wrapper, data);
      modalDynamicBody.replaceChildren(wrapper);
    }

    function updateModalThumbActiveState() {
      modalThumbs.querySelectorAll('.modal-thumb').forEach((thumb, index) => {
        thumb.classList.toggle('is-active', index === currentModalIndex);
      });
    }

    function updateModalControls() {
      const total = currentModalImages.length;

      if (!total) {
        modalPrev.disabled = true;
        modalNext.disabled = true;
        modalPageIndicator.textContent = '0 / 0';
        return;
      }

      modalPrev.disabled = currentModalIndex <= 0;
      modalNext.disabled = currentModalIndex >= total - 1;
      modalPageIndicator.textContent = `${currentModalIndex + 1} / ${total}`;
    }

    function renderModalHeroByIndex(index) {
      if (!currentModalImages.length) {
        modalHeroMedia.classList.remove('is-swipe-ready');
        modalHeroMedia.textContent = currentModalTitle;
        updateModalControls();
        return;
      }

      currentModalIndex = Math.max(0, Math.min(index, currentModalImages.length - 1));
      modalHeroMedia.classList.add('is-swipe-ready');
      modalHeroMedia.innerHTML = createMediaMarkup(
        currentModalImages[currentModalIndex],
        `${currentModalTitle} ${currentModalIndex + 1}`
      );
      updateModalThumbActiveState();
      updateModalControls();
    }

    function goToModalSlide(index) {
      renderModalHeroByIndex(index);
    }

    function stepModalSlide(direction) {
      const nextIndex = currentModalIndex + direction;
      if (nextIndex < 0 || nextIndex >= currentModalImages.length) return;
      goToModalSlide(nextIndex);
    }

    function renderModalThumbs(images, title) {
      modalThumbs.innerHTML = '';

      if (!images.length) {
        modalThumbs.innerHTML = '';
        updateModalControls();
        return;
      }

      images.forEach((imageSrc, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'modal-thumb';
        button.innerHTML = createMediaMarkup(imageSrc, `${title} ${index + 1}`);
        button.addEventListener('click', () => {
          goToModalSlide(index);
        });
        modalThumbs.appendChild(button);
      });

      updateModalThumbActiveState();
      updateModalControls();
    }

    function openModal(source) {
      const parentTrack = source.closest('.slider-track');
      if (parentTrack && parentTrack._dragState?.suppressClick) return;

      const data = getCardData(source);

      currentModalTitle = data.title;
      currentModalImages = [...data.images];

      if (data.type === 'poster' || data.type === 'banner') {
        if (data.modalMedia) {
          currentModalImages = [data.modalMedia];
        } else if (!currentModalImages.length && data.primaryMedia) {
          currentModalImages = [data.primaryMedia];
        }
      }

      currentModalIndex = 0;
      lastFocusedElement = source;

      setModalTypeClass(data.type);
      renderModalBody(data);
      renderModalThumbs(currentModalImages, data.title);
      setModalGalleryMode(data.type, currentModalImages.length);
      renderModalHeroByIndex(0);

      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      modalClose.focus();
    }

    function closeModal() {
      modalHeroMedia.querySelectorAll('video').forEach((video) => video.pause());
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      modalDialog.classList.remove('modal-type-poster', 'modal-type-banner', 'modal-type-cardnews', 'modal-type-default');
      if (lastFocusedElement) lastFocusedElement.focus();
    }

    function closePortfolioMenu(restoreFocus = false) {
      portfolioNavLinks.classList.remove('is-open');
      portfolioNavToggle.setAttribute('aria-expanded', 'false');
      portfolioNavToggle.setAttribute('aria-label', '메뉴 열기');

      if (restoreFocus) portfolioNavToggle.focus();
    }

    function setPortfolioHeaderState() {
      portfolioHeader.classList.toggle('is-scrolled', window.scrollY > 20);
    }

    portfolioNavToggle.hidden = false;
    portfolioNav.classList.add('portfolio-nav-enhanced');

    portfolioNavToggle.addEventListener('click', () => {
      const expanded = portfolioNavToggle.getAttribute('aria-expanded') !== 'true';

      portfolioNavToggle.setAttribute('aria-expanded', String(expanded));
      portfolioNavToggle.setAttribute('aria-label', expanded ? '메뉴 닫기' : '메뉴 열기');
      portfolioNavLinks.classList.toggle('is-open', expanded);
    });

    portfolioNavLinks.addEventListener('click', (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link) return;

      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;

      event.preventDefault();
      closePortfolioMenu();
      target.scrollIntoView({
        behavior: reducedMotion.matches ? 'auto' : 'smooth',
        block: 'start'
      });
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && portfolioNavToggle.getAttribute('aria-expanded') === 'true') {
        closePortfolioMenu(true);
      }
    });

    document.addEventListener('click', (event) => {
      if (!portfolioNav.contains(event.target)) closePortfolioMenu();
    });

    portfolioNav.addEventListener('focusout', (event) => {
      if (!portfolioNav.contains(event.relatedTarget)) closePortfolioMenu();
    });

    mobileNavigation.addEventListener('change', () => {
      const focused = document.activeElement;
      closePortfolioMenu(mobileNavigation.matches && portfolioNavLinks.contains(focused));
    });

    setPortfolioHeaderState();
    window.addEventListener('scroll', setPortfolioHeaderState, { passive: true });

    const revealSequenceGroups = document.querySelectorAll(
      '.brand-track, .team-promotion-grid, .team-reels-grid, .thumb-track'
    );

    revealSequenceGroups.forEach((group) => {
      group.querySelectorAll(':scope > .thumb-card').forEach((item, index) => {
        item.classList.add('reveal', 'reveal-scale', 'reveal-sequence-item');
        item.style.setProperty('--reveal-delay', `${Math.min(index * 90, 450)}ms`);
      });
    });

    const revealItems = document.querySelectorAll('.reveal');

    document.querySelectorAll('.section').forEach((section) => {
      section.querySelectorAll('.reveal').forEach((item, index) => {
        if (!item.classList.contains('reveal-sequence-item')) {
          item.style.setProperty('--reveal-delay', `${Math.min(index * 120, 360)}ms`);
        }
      });
    });

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -8% 0px'
    });

    revealItems.forEach((item) => revealObserver.observe(item));

    function getStepSize(track) {
      const firstItem = track.firstElementChild;
      if (!firstItem) return Math.max(track.clientWidth * 0.85, 320);

      const trackStyle = window.getComputedStyle(track);
      const itemWidth = firstItem.getBoundingClientRect().width;
      const gap = parseFloat(trackStyle.columnGap || trackStyle.gap || '0') || 0;

      return itemWidth + gap;
    }

    function scrollSlider(track, direction = 1) {
      const step = getStepSize(track);
      const maxScrollLeft = track.scrollWidth - track.clientWidth;
      const isLoop = track.hasAttribute('data-loop-slider');

      if (track.hasAttribute('data-seamless-loop')) {
        const loopWidth = Number(track.dataset.loopWidth) || 0;

        if (direction < 0 && loopWidth && track.scrollLeft <= 8) {
          track.scrollTo({ left: loopWidth, behavior: 'auto' });
        }

        track.scrollBy({ left: step * direction, behavior: 'smooth' });
        window.setTimeout(() => {
          if (loopWidth && track.scrollLeft >= loopWidth - 8) {
            track.scrollTo({ left: track.scrollLeft - loopWidth, behavior: 'auto' });
          }
        }, 650);
        return;
      }

      if (isLoop && direction > 0 && track.scrollLeft >= maxScrollLeft - 8) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }

      if (isLoop && direction < 0 && track.scrollLeft <= 8) {
        track.scrollTo({ left: maxScrollLeft, behavior: 'smooth' });
        return;
      }

      track.scrollBy({
        left: step * direction,
        behavior: 'smooth'
      });
    }

    document.querySelectorAll('[data-slider-prev], [data-slider-next]').forEach((button) => {
      button.addEventListener('click', () => {
        const trackId = button.dataset.sliderPrev || button.dataset.sliderNext;
        const track = document.getElementById(trackId);
        if (!track) return;

        const direction = button.hasAttribute('data-slider-next') ? 1 : -1;
        scrollSlider(track, direction);
      });
    });

    function enableDragScroll(track) {
      let isDown = false;
      let startX = 0;
      let startScrollLeft = 0;
      let hasDragged = false;
      let suppressClick = false;

      const threshold = 8;

      track.querySelectorAll('.thumb-card').forEach((card) => {
        card.setAttribute('draggable', 'false');
      });

      const onMouseDown = (e) => {
        if (e.button !== 0) return;
        isDown = true;
        hasDragged = false;
        suppressClick = false;
        startX = e.clientX;
        startScrollLeft = track.scrollLeft;
        track.classList.add('dragging');
      };

      const onMouseMove = (e) => {
        if (!isDown) return;

        const dx = e.clientX - startX;

        if (Math.abs(dx) > threshold) {
          hasDragged = true;
          suppressClick = true;
        }

        if (hasDragged) {
          track.scrollLeft = startScrollLeft - dx;
        }
      };

      const onMouseUp = () => {
        if (!isDown) return;
        isDown = false;
        track.classList.remove('dragging');

        if (hasDragged) {
          setTimeout(() => {
            suppressClick = false;
          }, 0);
        }
      };

      const onMouseLeave = () => {
        if (!isDown) return;
        isDown = false;
        track.classList.remove('dragging');
        if (hasDragged) {
          setTimeout(() => {
            suppressClick = false;
          }, 0);
        }
      };

      track.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      track.addEventListener('mouseleave', onMouseLeave);

      track.addEventListener('dragstart', (e) => {
        e.preventDefault();
      });

      track.addEventListener('click', (e) => {
        if (!suppressClick) return;
        e.preventDefault();
        e.stopPropagation();
      }, true);

      track._dragState = {
        get suppressClick() {
          return suppressClick;
        }
      };
    }

    document.querySelectorAll('.slider-track').forEach(enableDragScroll);

    document.querySelectorAll('[data-autoplay-slider]').forEach((track) => {
      const interval = Number(track.dataset.autoplaySlider) || 4200;
      let autoplayTimer = null;

      if (track.hasAttribute('data-seamless-loop') && !track.dataset.loopReady) {
        const originalCards = [...track.children];
        originalCards.forEach((card) => {
          const clone = card.cloneNode(true);
          clone.dataset.loopClone = '';
          track.appendChild(clone);
        });
        track.dataset.loopReady = 'true';

        const updateLoopWidth = () => {
          const trackStyle = window.getComputedStyle(track);
          const gap = parseFloat(trackStyle.columnGap || trackStyle.gap || '0') || 0;
          const width = originalCards.reduce((total, card) => total + card.getBoundingClientRect().width, 0);
          track.dataset.loopWidth = String(width + gap * originalCards.length);
        };

        updateLoopWidth();
        window.addEventListener('resize', updateLoopWidth);
      }

      const startAutoplay = () => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        window.clearInterval(autoplayTimer);
        autoplayTimer = window.setInterval(() => {
          scrollSlider(track, 1);
        }, interval);
      };

      const stopAutoplay = () => window.clearInterval(autoplayTimer);

      track.addEventListener('mouseenter', stopAutoplay);
      track.addEventListener('mouseleave', startAutoplay);
      track.addEventListener('focusin', stopAutoplay);
      track.addEventListener('focusout', startAutoplay);
      track.addEventListener('touchstart', stopAutoplay, { passive: true });
      track.addEventListener('touchend', startAutoplay, { passive: true });
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopAutoplay();
        else startAutoplay();
      });

      startAutoplay();
    });

    document.querySelectorAll('.modal-card').forEach((card) => {
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
    });

    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;

      const placeholderLink = event.target.closest('[data-placeholder-link]');
      if (placeholderLink?.getAttribute('href') === '#') {
        event.preventDefault();
        return;
      }

      const card = event.target.closest('.modal-card');
      if (!card) return;
      openModal(card);
    }, true);

    document.addEventListener('keydown', (event) => {
      const card = event.target.closest('.modal-card');
      if (!card || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault();
      openModal(card);
    });

    modalPrev.addEventListener('click', () => stepModalSlide(-1));
    modalNext.addEventListener('click', () => stepModalSlide(1));

    modalHeroMedia.addEventListener('touchstart', (event) => {
      if (currentModalImages.length <= 1) return;
      modalTouchStartX = event.touches[0].clientX;
      modalTouchDeltaX = 0;
    }, { passive: true });

    modalHeroMedia.addEventListener('touchmove', (event) => {
      if (currentModalImages.length <= 1) return;
      modalTouchDeltaX = event.touches[0].clientX - modalTouchStartX;
    }, { passive: true });

    modalHeroMedia.addEventListener('touchend', () => {
      if (currentModalImages.length <= 1) return;
      const swipeThreshold = 50;

      if (modalTouchDeltaX <= -swipeThreshold) {
        stepModalSlide(1);
      } else if (modalTouchDeltaX >= swipeThreshold) {
        stepModalSlide(-1);
      }

      modalTouchStartX = 0;
      modalTouchDeltaX = 0;
    }, { passive: true });

    modalClose.addEventListener('click', closeModal);

    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeModal();
    });

    window.addEventListener('keydown', (event) => {
      if (!modal.classList.contains('is-open')) return;

      if (event.key === 'Escape') {
        closeModal();
      } else if (event.key === 'ArrowLeft') {
        stepModalSlide(-1);
      } else if (event.key === 'ArrowRight') {
        stepModalSlide(1);
      }
    });

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        if (link.closest('.portfolio-nav-links')) return;

        const id = link.getAttribute('href');
        if (!id || id === '#') return;

        const target = document.querySelector(id);
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({
          behavior: reducedMotion.matches ? 'auto' : 'smooth',
          block: 'start'
        });
      });
    });

    const reelCards = document.querySelectorAll('#videoTrack .reels-thumb');

    reelCards.forEach((card) => {
      const video = card.querySelector('.thumb-video');
      if (!video) return;

      card.addEventListener('mouseenter', async () => {
        try {
          card.classList.add('is-playing');
          video.currentTime = 0;
          await video.play();
        } catch (error) {
          console.log('video play error:', error);
        }
      });

      card.addEventListener('mouseleave', () => {
        video.pause();
        video.currentTime = 0;
        card.classList.remove('is-playing');
      });
    });

    const allCards = document.querySelectorAll('.thumb-card');

    allCards.forEach((card) => {
      const video = card.querySelector('.thumb-video');
      if (!video) return;

      card.addEventListener('mouseenter', async () => {
        try {
          video.currentTime = 0;
          await video.play();
        } catch (e) { }
      });

      card.addEventListener('mouseleave', () => {
        video.pause();
        video.currentTime = 0;
      });
    });

    document.querySelectorAll('[data-brandbook-modal]').forEach((brandBookTrigger) => {
      const modalId = brandBookTrigger.getAttribute('aria-controls');
      const brandBookModal = modalId ? document.getElementById(modalId) : null;
      if (!brandBookModal) return;

      const brandBookDialog = brandBookModal.querySelector('.brandbook-dialog');
      const brandBookClose = brandBookModal.querySelector('[data-brandbook-close]');
      const brandBookViewport = brandBookModal.querySelector('.brandbook-viewport');
      const brandBookTrack = brandBookModal.querySelector('.brandbook-track');
      const brandBookPrev = brandBookModal.querySelector('.brandbook-nav--prev');
      const brandBookNext = brandBookModal.querySelector('.brandbook-nav--next');
      const brandBookCounter = brandBookModal.querySelector('.brandbook-counter');
      if (!brandBookDialog || !brandBookClose || !brandBookViewport || !brandBookTrack
        || !brandBookPrev || !brandBookNext || !brandBookCounter) return;

      const pageTotal = Number.parseInt(brandBookTrigger.dataset.portfolioTotal || '1', 10);
      const imageBase = brandBookTrigger.dataset.portfolioBase || 'assets/img/portfolio-';
      const imageDigits = Number.parseInt(brandBookTrigger.dataset.portfolioDigits || '2', 10);
      const imageExtension = brandBookTrigger.dataset.portfolioExtension || 'jpg';
      const portfolioName = brandBookTrigger.dataset.portfolioName || '브랜드북';
      const mediaReady = brandBookTrigger.dataset.portfolioReady !== 'false';
      const mediaType = brandBookTrigger.dataset.portfolioMedia === 'video' ? 'video' : 'image';
      const mediaAspects = (brandBookTrigger.dataset.portfolioAspects || '').split('|');
      const mediaSources = (brandBookTrigger.dataset.portfolioSources || '').split('|').map((source) => source.trim());
      const slides = [];
      let currentPage = 0;
      let brandBookLastFocus = null;
      let pointerId = null;
      let pointerStartX = 0;
      let pointerDeltaX = 0;

      const pageNumber = (index) => imageDigits > 0
        ? String(index + 1).padStart(imageDigits, '0')
        : String(index + 1);
      const imagePath = (index) => mediaSources[index] || `${imageBase}${pageNumber(index)}.${imageExtension}`;

      for (let index = 0; index < pageTotal; index += 1) {
        const slide = document.createElement('div');
        slide.className = 'brandbook-slide';
        if (mediaType === 'video') slide.classList.add('motionbook-slide');
        slide.dataset.index = String(index);
        if (mediaAspects[index]) slide.dataset.aspect = mediaAspects[index];
        slide.setAttribute('role', 'group');
        slide.setAttribute('aria-label', `${index + 1} / ${pageTotal} 페이지`);
        slide.setAttribute('aria-hidden', 'true');

        const placeholder = document.createElement('div');
        const placeholderTitle = document.createElement('strong');
        const placeholderCopy = document.createElement('span');
        placeholder.className = 'brandbook-placeholder';
        if (mediaType === 'video') placeholder.classList.add('motionbook-placeholder');
        placeholderTitle.textContent = `${portfolioName} ${pageNumber(index)}`;
        placeholderCopy.textContent = mediaType === 'video'
          ? `${mediaAspects[index] || 'Video'} 영상 ${mediaReady ? '불러오는 중' : '준비 중'}`
          : mediaReady
            ? imagePath(index)
            : `${index + 1} / ${pageTotal} 이미지 준비 중`;
        placeholder.append(placeholderTitle, placeholderCopy);
        slide.appendChild(placeholder);
        brandBookTrack.appendChild(slide);
        slides.push(slide);
      }

      function loadSlide(index) {
        const slide = slides[index];
        if (!slide || slide.dataset.hydrated === 'true') return;
        slide.dataset.hydrated = 'true';
        if (!mediaReady) return;

        const media = document.createElement(mediaType === 'video' ? 'video' : 'img');
        if (mediaType === 'video') {
          media.controls = true;
          media.playsInline = true;
          media.preload = index === currentPage ? 'metadata' : 'none';
          media.setAttribute('aria-label', `${portfolioName} ${index + 1}페이지 ${mediaAspects[index] || ''} 영상`);
          media.addEventListener('ended', () => {
            media.pause();
            media.currentTime = 0;
          });
        } else {
          media.alt = `${portfolioName} ${index + 1}페이지`;
          media.decoding = 'async';
          media.draggable = false;
          media.loading = index === currentPage ? 'eager' : 'lazy';
        }
        media.addEventListener(mediaType === 'video' ? 'loadeddata' : 'load', () => {
          slide.classList.add('is-loaded');
        }, { once: true });
        media.addEventListener('error', () => {
          slide.classList.remove('is-loaded');
          media.remove();
        }, { once: true });
        slide.appendChild(media);
        media.src = imagePath(index);
      }

      function unloadSlide(index) {
        const slide = slides[index];
        if (!slide || slide.dataset.hydrated !== 'true') return;
        const media = slide.querySelector('img, video');
        if (media instanceof HTMLVideoElement) media.pause();
        media?.remove();
        slide.classList.remove('is-loaded');
        delete slide.dataset.hydrated;
      }

      function hydrateVisiblePages() {
        slides.forEach((slide, index) => {
          if (Math.abs(index - currentPage) <= 1) loadSlide(index);
          else unloadSlide(index);
        });
      }

      function showPage(index) {
        currentPage = Math.max(0, Math.min(pageTotal - 1, index));
        const currentAspect = mediaAspects[currentPage] || '';
        brandBookDialog.classList.toggle('is-portrait-media', mediaType === 'video' && currentAspect === '9:16');
        if (mediaType === 'video') brandBookViewport.dataset.currentAspect = currentAspect;
        hydrateVisiblePages();
        slides.forEach((slide, slideIndex) => {
          slide.setAttribute('aria-hidden', String(slideIndex !== currentPage));
          const video = slide.querySelector('video');
          if (video) {
            if (slideIndex === currentPage && video.readyState === 0) {
              video.preload = 'metadata';
              video.load();
            } else if (slideIndex !== currentPage) {
              video.pause();
              video.currentTime = 0;
            }
          }
        });
        brandBookTrack.style.transform = `translate3d(-${currentPage * 100}%, 0, 0)`;
        brandBookCounter.textContent = `${currentPage + 1} / ${pageTotal}`;
        brandBookPrev.disabled = currentPage === 0;
        brandBookNext.disabled = currentPage === pageTotal - 1;
      }

      function openBrandBook() {
        brandBookLastFocus = document.activeElement;
        showPage(0);
        brandBookModal.classList.add('is-open');
        brandBookModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('brandbook-modal-open');
        window.requestAnimationFrame(() => brandBookClose.focus());
      }

      function closeBrandBook() {
        brandBookModal.querySelectorAll('video').forEach((video) => {
          video.pause();
          video.currentTime = 0;
        });
        brandBookModal.classList.remove('is-open');
        brandBookModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('brandbook-modal-open');
        if (brandBookLastFocus instanceof HTMLElement) brandBookLastFocus.focus();
      }

      function finishSwipe() {
        if (pointerId === null) return;
        const threshold = Math.min(90, brandBookViewport.clientWidth * .14);
        brandBookViewport.classList.remove('is-dragging');

        if (pointerDeltaX <= -threshold) showPage(currentPage + 1);
        else if (pointerDeltaX >= threshold) showPage(currentPage - 1);
        else showPage(currentPage);

        pointerId = null;
        pointerStartX = 0;
        pointerDeltaX = 0;
      }

      brandBookTrigger.addEventListener('click', openBrandBook);
      brandBookClose.addEventListener('click', closeBrandBook);
      brandBookPrev.addEventListener('click', () => showPage(currentPage - 1));
      brandBookNext.addEventListener('click', () => showPage(currentPage + 1));

      brandBookModal.addEventListener('click', (event) => {
        if (event.target === brandBookModal) closeBrandBook();
      });

      brandBookViewport.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        pointerId = event.pointerId;
        pointerStartX = event.clientX;
        pointerDeltaX = 0;
        brandBookViewport.classList.add('is-dragging');
        brandBookViewport.setPointerCapture(pointerId);
      });

      brandBookViewport.addEventListener('pointermove', (event) => {
        if (event.pointerId !== pointerId) return;
        pointerDeltaX = event.clientX - pointerStartX;
        brandBookTrack.style.transform = `translate3d(calc(-${currentPage * 100}% + ${pointerDeltaX}px), 0, 0)`;
      });

      brandBookViewport.addEventListener('pointerup', finishSwipe);
      brandBookViewport.addEventListener('pointercancel', finishSwipe);

      window.addEventListener('keydown', (event) => {
        if (!brandBookModal.classList.contains('is-open')) return;

        if (event.key === 'Escape') closeBrandBook();
        else if (event.key === 'ArrowLeft') showPage(currentPage - 1);
        else if (event.key === 'ArrowRight') showPage(currentPage + 1);
        else if (event.key === 'Tab') {
          const focusable = [brandBookClose, brandBookPrev, brandBookNext].filter((element) => !element.disabled);
          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      });

      brandBookDialog.addEventListener('click', (event) => event.stopPropagation());
    });
