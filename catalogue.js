(function () {
    'use strict';

    var currentCategory = 'All Products';
    var imageObserver = null;
    var sentinelObserver = null;
    var pageSize = 24;
    var visibleCount = pageSize;
    var renderedUntil = 0;
    var searchTimer = null;
    var indexMap = null;

    function encodeImagePath(path) {
        if (!path) return '';
        if (/^https?:\/\//i.test(path)) return path;
        return path.split('/').map(function (part, i) {
            return i === 0 ? part : encodeURIComponent(part);
        }).join('/');
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function getIndexMap() {
        if (indexMap || typeof productsData === 'undefined') return indexMap;
        indexMap = {};
        for (var i = 0; i < productsData.length; i++) {
            indexMap[productsData[i].name + '|' + productsData[i].category + '|' + productsData[i].image] = i;
        }
        return indexMap;
    }

    function buildProductSummary(product) {
        var parts = [];
        if (product.price && product.price !== 'Enquire for price') {
            parts.push('<span class="price-highlight" style="color:#ff1f33;font-weight:800;font-size:1.02rem;">' + escapeHtml(product.price) + '</span>');
        }
        if (product.flavors && product.flavors.length) {
            parts.push('<span class="flavour-label" style="color:#f87171;font-weight:700;">' + product.flavors.length + ' flavours in store</span>');
        } else if (product.variants && product.variants.length) {
            var vars = product.variants.filter(function (v) { return v !== product.price; });
            if (vars.length) {
                parts.push(escapeHtml(vars.slice(0, 3).join(' • ')));
            }
        }
        if (!parts.length) {
            return 'Call store for price & stock at 175b North End Rd, London W14 9NL';
        }
        return parts.join(' • ');
    }

    function buildActionHtml(product, index) {
        var html = '<a href="tel:07448885755" class="btn-call-shop"><i class="fa-solid fa-phone"></i> CALL STORE FOR PRICE & STOCK</a>';
        if (product.flavors && product.flavors.length) {
            html += '<button type="button" onclick="openFlavorModal(' + index + ')" class="btn-view-flavors"><i class="fa-solid fa-eye"></i> VIEW AVAILABLE FLAVORS</button>';
        }
        return html;
    }

    function getFilteredProducts(query) {
        if (typeof productsData === 'undefined') return [];
        var q = (query || '').toLowerCase().trim();
        return productsData.filter(function (product) {
            if (q) {
                var nameMatch = (product.name || '').toLowerCase().indexOf(q) !== -1;
                var brandMatch = (product.brand || '').toLowerCase().indexOf(q) !== -1;
                var descMatch = (product.description || '').toLowerCase().indexOf(q) !== -1;
                var flavorMatch = (product.flavors || []).some(function (f) {
                    return String(f).toLowerCase().indexOf(q) !== -1;
                });
                var variantMatch = (product.variants || []).some(function (v) {
                    return String(v).toLowerCase().indexOf(q) !== -1;
                });
                var match = nameMatch || brandMatch || descMatch || flavorMatch || variantMatch;
                if (!match) return false;
            }
            return currentCategory === 'All Products' || product.category === currentCategory;
        });
    }

    function observeNewImages(root) {
        var images = root.querySelectorAll('img[data-src]');
        if (!images.length) return;

        function loadImg(img) {
            var src = img.getAttribute('data-src');
            if (!src) return;
            img.setAttribute('src', src);
            img.removeAttribute('data-src');
        }

        if (!('IntersectionObserver' in window)) {
            images.forEach(loadImg);
            return;
        }

        if (!imageObserver) {
            imageObserver = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    loadImg(entry.target);
                    imageObserver.unobserve(entry.target);
                });
            }, { rootMargin: '800px 0px', threshold: 0.01 });
        }

        images.forEach(function (img) {
            imageObserver.observe(img);
        });
    }

    function updateCategoryCounts() {
        if (typeof productsData === 'undefined') return;
        var counts = { 'All Products': productsData.length };
        productsData.forEach(function (p) {
            counts[p.category] = (counts[p.category] || 0) + 1;
        });

        document.querySelectorAll('.sidebar-nav-item').forEach(function (item) {
            var label = (item.textContent || '').replace(/\s+/g, ' ').trim();
            var pill = item.querySelector('.item-count-pill');
            if (!pill) return;
            Object.keys(counts).forEach(function (cat) {
                if (label.indexOf(cat) !== -1) {
                    pill.textContent = String(counts[cat]);
                }
            });
            if (label.indexOf('Tablets') !== -1 && typeof counts['Tablets'] === 'undefined') {
                pill.textContent = '0';
            }
            if (label.indexOf('Laptops') !== -1 && typeof counts['Laptops'] === 'undefined') {
                pill.textContent = '0';
            }
        });
    }

    function makeCard(product, index, position) {
        var card = document.createElement('div');
        card.className = 'catalogue-card';
        card.setAttribute('data-category', product.category);
        card.setAttribute('data-name', (product.name || '').toLowerCase());

        var imgHtml;
        if (product.image) {
            var src = encodeImagePath(product.image);
            if (position < 6) {
                imgHtml = '<img src="' + src + '" alt="' + escapeHtml(product.name) + '" width="400" height="400" decoding="async" fetchpriority="high">';
            } else {
                imgHtml = '<img data-src="' + src + '" alt="' + escapeHtml(product.name) + '" width="400" height="400" decoding="async" loading="lazy">';
            }
        } else {
            imgHtml = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#94a3b8;font-size:0.85rem;text-align:center;padding:12px;"><i class="fa-solid fa-camera" style="font-size:2.2rem;margin-bottom:8px;color:#e11d2a;"></i><span>Photo arriving soon<br>In stock in store</span></div>';
        }

        var ageRestricted = ['Vape Kits', 'Vape Refills', 'E-Liquids', 'Nicotine Pouches'].indexOf(product.category) !== -1;
        var ageBadge = ageRestricted ? '<span class="age-18-badge" title="18+ only" style="position:absolute;top:10px;right:10px;background:#e11d2a;color:#fff;font-size:0.72rem;font-weight:800;padding:2px 8px;border-radius:100px;">18+</span>' : '';

        card.innerHTML =
            '<div class="catalogue-card-image" style="position:relative;">' +
                '<span class="category-tag-badge">' + escapeHtml(product.category) + '</span>' +
                ageBadge +
                imgHtml +
            '</div>' +
            '<div class="catalogue-card-content">' +
                '<h3>' + escapeHtml(product.name) + '</h3>' +
                '<p class="product-summary-text">' + buildProductSummary(product) + '</p>' +
                buildActionHtml(product, index) +
                '<span class="in-stock-badge">In stock</span>' +
            '</div>';

        return card;
    }

    function clearSentinel() {
        var grid = document.getElementById('catalogueGrid');
        if (!grid) return;
        var old = grid.querySelector('#catalogue-sentinel');
        if (old) old.remove();
        var note = grid.querySelector('.catalogue-more-note');
        if (note) note.remove();
        var empty = grid.querySelector('.catalogue-empty');
        if (empty) empty.remove();
    }

    function renderCatalogue(append) {
        var grid = document.getElementById('catalogueGrid');
        if (!grid || typeof productsData === 'undefined') return;

        var searchInput = document.getElementById('catalogueSearch');
        var query = searchInput ? searchInput.value : '';
        var list = getFilteredProducts(query);
        var total = list.length;
        var map = getIndexMap();

        if (!append) {
            renderedUntil = 0;
            visibleCount = pageSize;
            grid.innerHTML = '';
            if (imageObserver) {
                imageObserver.disconnect();
                imageObserver = null;
            }
        } else {
            clearSentinel();
        }

        var start = renderedUntil;
        var end = Math.min(visibleCount, list.length);
        var newCards = document.createDocumentFragment();

        for (var i = start; i < end; i++) {
            var product = list[i];
            var key = product.name + '|' + product.category + '|' + product.image;
            var index = map ? map[key] : undefined;
            if (typeof index === 'undefined') index = productsData.indexOf(product);
            newCards.appendChild(makeCard(product, index, i));
        }

        renderedUntil = end;
        grid.appendChild(newCards);

        if (end < total) {
            var sentinel = document.createElement('div');
            sentinel.id = 'catalogue-sentinel';
            sentinel.style.cssText = 'grid-column:1/-1;height:1px;';
            grid.appendChild(sentinel);

            var note = document.createElement('p');
            note.className = 'catalogue-more-note';
            note.style.cssText = 'grid-column:1/-1;text-align:center;color:#94a3b8;margin:16px 0;font-size:0.92rem;';
            note.textContent = 'Showing ' + end + ' of ' + total + ' items — keep scrolling to load more.';
            grid.appendChild(note);
        }

        if (!total) {
            var empty = document.createElement('p');
            empty.className = 'catalogue-empty';
            empty.style.cssText = 'grid-column:1/-1;text-align:center;color:#94a3b8;margin:32px 0;font-size:1.05rem;';
            empty.textContent = 'No products match this filter or search.';
            grid.appendChild(empty);
        }

        observeNewImages(grid);
        observeSentinel();
    }

    function observeSentinel() {
        if (sentinelObserver) {
            sentinelObserver.disconnect();
            sentinelObserver = null;
        }
        var sentinel = document.getElementById('catalogue-sentinel');
        if (!sentinel) return;
        sentinelObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                visibleCount += pageSize;
                renderCatalogue(true);
            });
        }, { rootMargin: '600px 0px' });
        sentinelObserver.observe(sentinel);
    }

    function selectCategory(cat, el) {
        currentCategory = cat;
        document.querySelectorAll('.sidebar-nav-item').forEach(function (item) {
            item.classList.remove('active');
        });
        if (el) {
            el.classList.add('active');
        }
        renderCatalogue(false);
    }

    function filterProducts() {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
            renderCatalogue(false);
        }, 120);
    }

    function openFlavorModal(index) {
        if (typeof productsData === 'undefined') return;
        var product = productsData[index];
        if (!product) return;

        var modalImg = document.getElementById('modalImg');
        var modalCat = document.getElementById('modalCat');
        var modalTitle = document.getElementById('modalTitle');
        var chipsWrap = document.getElementById('modalChips');
        var modal = document.getElementById('flavorModal');

        if (!modalImg || !modalCat || !modalTitle || !chipsWrap || !modal) return;

        if (product.image) {
            modalImg.src = encodeImagePath(product.image);
            modalImg.style.display = 'block';
        } else {
            modalImg.style.display = 'none';
        }

        var ageRestricted = ['Vape Kits', 'Vape Refills', 'E-Liquids', 'Nicotine Pouches'].indexOf(product.category) !== -1;
        modalCat.textContent = ageRestricted ? product.category + ' • 18+' : product.category;
        modalTitle.textContent = product.name;

        chipsWrap.innerHTML = '';
        var flavors = product.flavors && product.flavors.length ? product.flavors : ['Popular In-Store Flavor Selection'];
        var frag = document.createDocumentFragment();
        flavors.forEach(function (flavor) {
            var chip = document.createElement('span');
            chip.className = 'flavor-chip-tag';
            chip.textContent = flavor;
            frag.appendChild(chip);
        });
        chipsWrap.appendChild(frag);

        modal.style.display = 'flex';
    }

    function closeFlavorModal() {
        var modal = document.getElementById('flavorModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    window.selectCategory = selectCategory;
    window.filterProducts = filterProducts;
    window.openFlavorModal = openFlavorModal;
    window.closeFlavorModal = closeFlavorModal;

    window.addEventListener('click', function (e) {
        var modal = document.getElementById('flavorModal');
        if (modal && e.target === modal) {
            closeFlavorModal();
        }
    });

    window.addEventListener('pagehide', function () {
        if (imageObserver) {
            imageObserver.disconnect();
            imageObserver = null;
        }
        if (sentinelObserver) {
            sentinelObserver.disconnect();
            sentinelObserver = null;
        }
    });

    document.addEventListener('DOMContentLoaded', function () {
        if (!document.getElementById('catalogueGrid')) return;

        function boot() {
            updateCategoryCounts();
            var params = new URLSearchParams(window.location.search);
            var category = params.get('category');
            if (category) {
                var targetCategory = category;
                if (category === 'Laptops' || category === 'Tablets & Laptops') targetCategory = 'Laptops';
                if (category === 'Vapes' || category === 'Vapes & Pod Systems') targetCategory = 'Vape Kits';
                if (category === 'Accessories') targetCategory = 'Tech Accessories';
                if (category === 'Smartphones') targetCategory = 'Smartphones';
                if (category === 'Nicotine Pouches') targetCategory = 'Nicotine Pouches';
                if (category === 'Cases' || category === 'Protection & Cases') targetCategory = 'Protection & Cases';

                var foundItem = null;
                document.querySelectorAll('.sidebar-nav-item').forEach(function (item) {
                    var label = (item.textContent || '').replace(/\s+/g, ' ').trim();
                    if (label.indexOf(targetCategory) !== -1) {
                        foundItem = item;
                    }
                });

                if (foundItem) {
                    selectCategory(targetCategory, foundItem);
                    return;
                }
            }

            renderCatalogue(false);
        }

        window.requestAnimationFrame(function () {
            window.requestAnimationFrame(boot);
        });
    });
})();
