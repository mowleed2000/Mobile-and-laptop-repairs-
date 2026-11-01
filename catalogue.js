(function () {
    'use strict';

    var currentCategory = 'All Products';
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

    function buildProductSummary(product, index) {
        var parts = [];
        if (product.price && product.price !== 'Enquire for price') {
            parts.push('<span class="price-highlight" style="color:#ff1f33;font-weight:800;font-size:1.02rem;">' + escapeHtml(product.price) + '</span>');
        } else {
            parts.push('<span class="catalogue-enquire">Call for current price</span>');
        }
        var infoLabel = '';
        if (product.flavors && product.flavors.length) {
            infoLabel = 'View flavour examples';
            parts.push('<span class="flavour-label">' + escapeHtml(product.flavorNote || 'Flavour examples available in store') + '</span>');
        } else if (product.models && product.models.length) {
            var modelSummary = product.category === 'Smartphones'
                ? product.models.length + ' in-store options'
                : 'Compatible with ' + product.models.length + ' phone models';
            infoLabel = product.category === 'Smartphones' ? 'View options' : 'View compatible models';
            parts.push('<span class="models-label">' + modelSummary + '</span>');
        } else if (product.variants && product.variants.length) {
            infoLabel = product.category === 'Smartphones' ? 'View phone details' : 'View product details';
            if (product.category === 'Smartphones') parts.push('<span class="models-label">Phone details available</span>');
        }
        if (product.detailNote && product.category === 'Smartphones') parts.push('<span class="catalogue-enquire">' + escapeHtml(product.detailNote) + '</span>');
        var info = infoLabel ? ' <button type="button" class="catalogue-info-link" onclick="openFlavorModal(' + index + ')">' + escapeHtml(infoLabel) + '</button>' : '';
        return '<span class="product-summary-lines">' + parts.join('<br>') + '</span>' + info;
    }

    function buildActionHtml(product, index) {
        var html = '<a href="tel:07448885755" class="btn-call-shop"><i class="fa-solid fa-phone"></i> CALL STORE FOR PRICE & STOCK</a>';
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
                var modelMatch = (product.models || []).some(function (m) {
                    return String(m).toLowerCase().indexOf(q) !== -1;
                });
                var match = nameMatch || brandMatch || descMatch || flavorMatch || variantMatch || modelMatch;
                if (!match) return false;
            }
            return currentCategory === 'All Products' || product.category === currentCategory || (currentCategory === 'Vapes' && /^(Prefilled Pod Kits|Starter Vape Kits & Refillable Devices)$/.test(product.category));
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
            if (position < 3) {
                imgHtml = '<img src="' + src + '" alt="' + escapeHtml(product.name) + '" width="400" height="400" decoding="async" loading="eager"' + (position === 0 ? ' fetchpriority="high"' : '') + '>';
            } else {
                imgHtml = '<img src="' + src + '" alt="' + escapeHtml(product.name) + '" width="400" height="400" decoding="async" loading="lazy">';
            }
        } else {
            imgHtml = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#94a3b8;font-size:0.85rem;text-align:center;padding:12px;"><i class="fa-solid fa-camera" style="font-size:2.2rem;margin-bottom:8px;color:#e11d2a;"></i><span>Photo arriving soon<br>In stock in store</span></div>';
        }

        var ageRestricted = ['Prefilled Pod Kits', 'Starter Vape Kits & Refillable Devices', 'E-Liquids', 'Nicotine Pouches'].indexOf(product.category) !== -1;
        var ageBadge = ageRestricted ? '<span class="age-18-badge" title="18+ only" style="position:absolute;top:10px;right:10px;background:#e11d2a;color:#fff;font-size:0.72rem;font-weight:800;padding:2px 8px;border-radius:100px;">18+</span>' : '';

        card.innerHTML =
            '<div class="catalogue-card-image" style="position:relative;">' +
                '<span class="category-tag-badge">' + escapeHtml(product.cardTypeLabel || product.category) + '</span>' +
                ageBadge +
                imgHtml +
            '</div>' +
            '<div class="catalogue-card-content">' +
                '<h3>' + escapeHtml(product.name) + '</h3>' +
            '<p class="product-summary-text">' + buildProductSummary(product, index) + '</p>' +
                '<div class="catalogue-card-actions">' + buildActionHtml(product, index) + '</div>' +
                '<span class="in-stock-badge' + (product.availability ? ' availability-check' : '') + '">' + escapeHtml(product.availability || 'In stock') + '</span>' +
            '</div>';

        return card;
    }

    function renderCatalogue() {
        var grid = document.getElementById('catalogueGrid');
        if (!grid || typeof productsData === 'undefined') return;

        var searchInput = document.getElementById('catalogueSearch');
        var query = searchInput ? searchInput.value : '';
        var list = getFilteredProducts(query);
        var total = list.length;
        var map = getIndexMap();

        grid.innerHTML = '';
        var newCards = document.createDocumentFragment();

        for (var i = 0; i < total; i++) {
            var product = list[i];
            var key = product.name + '|' + product.category + '|' + product.image;
            var index = map ? map[key] : undefined;
            if (typeof index === 'undefined') index = productsData.indexOf(product);
            newCards.appendChild(makeCard(product, index, i));
        }

        grid.appendChild(newCards);

        if (!total) {
            var empty = document.createElement('p');
            empty.className = 'catalogue-empty';
            empty.style.cssText = 'grid-column:1/-1;text-align:center;color:#94a3b8;margin:32px 0;font-size:1.05rem;';
            empty.textContent = 'No products match this filter or search.';
            grid.appendChild(empty);
        }

    }

    function selectCategory(cat, el) {
        currentCategory = cat;
        document.querySelectorAll('.sidebar-nav-item').forEach(function (item) {
            item.classList.remove('active');
        });
        if (el) {
            el.classList.add('active');
        }
        renderCatalogue();
    }

    function filterProducts() {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
            renderCatalogue();
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

        var ageRestricted = ['Prefilled Pod Kits', 'Starter Vape Kits & Refillable Devices', 'E-Liquids', 'Nicotine Pouches'].indexOf(product.category) !== -1;
        modalCat.textContent = ageRestricted ? product.category + ' • 18+' : product.category;
        modalTitle.textContent = product.name;

        var isModels = product.models && product.models.length && (!product.flavors || !product.flavors.length);
        var isPhoneDetails = product.category === 'Smartphones' && product.variants && product.variants.length;
        var modalHeading = document.getElementById('modalHeading') || modal.querySelector('h4');
        if (modalHeading) {
            modalHeading.textContent = isModels
                ? (product.category === 'Smartphones'
                    ? 'Available In-Store Options (' + product.models.length + '):'
                    : 'Compatible In-Store Phone Models (' + product.models.length + ' Models):')
                : (isPhoneDetails ? 'Phone details:' : (product.flavors && product.flavors.length ? 'Flavour examples:' : 'Product details:'));
        }

        chipsWrap.innerHTML = '';
        var items = isModels
            ? product.models
            : (isPhoneDetails ? product.variants : (product.flavors && product.flavors.length ? product.flavors : (product.variants && product.variants.length ? product.variants : [])));
        var frag = document.createDocumentFragment();
        items.forEach(function (item) {
            var chip = document.createElement('span');
            chip.className = 'flavor-chip-tag';
            if (isModels) {
                chip.style.borderColor = 'rgba(56,189,248,0.45)';
                chip.style.background = 'rgba(56,189,248,0.1)';
                chip.style.color = '#38bdf8';
            }
            chip.textContent = item;
            frag.appendChild(chip);
        });
        chipsWrap.appendChild(frag);

        if (product.flavorNote || product.detailNote || product.availability || !product.price || product.price === 'Enquire for price') {
            var note = document.createElement('p');
            note.className = 'catalogue-modal-note';
            note.textContent = [product.flavorNote, product.detailNote, product.availability, (!product.price || product.price === 'Enquire for price') ? 'Call to confirm current price and availability.' : ''].filter(Boolean).join(' ');
            chipsWrap.appendChild(note);
        }

        var stockNote = modal.querySelector('.catalogue-modal-stock-note');
        if (stockNote) stockNote.textContent = product.availability || 'Call to confirm current price and availability.';

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

    document.addEventListener('DOMContentLoaded', function () {
        if (!document.getElementById('catalogueGrid')) return;

        function boot() {
            updateCategoryCounts();
            var params = new URLSearchParams(window.location.search);
            var category = params.get('category');
            if (category) {
                var targetCategory = category;
                if (category === 'Laptops' || category === 'Tablets & Laptops') targetCategory = 'Laptops';
                if (category === 'Vapes' || category === 'Vapes & Pod Systems' || category === 'Vape Kits') targetCategory = 'Vapes';
                if (category === 'Accessories') targetCategory = 'Tech Accessories';
                if (category === 'Smartphones') targetCategory = 'Smartphones';
                if (category === 'Nicotine Pouches') targetCategory = 'Nicotine Pouches';
                if (category === 'Cases' || category === 'Protection & Cases') targetCategory = 'Protection & Cases';

                var foundItem = null;
                document.querySelectorAll('.sidebar-nav-item').forEach(function (item) {
                    var label = (item.textContent || '').replace(/\s+/g, ' ').trim();
                    if (label.indexOf(targetCategory) !== -1 || (targetCategory === 'Vapes' && label.indexOf('Prefilled Pod Kits') !== -1)) {
                        foundItem = item;
                    }
                });

                if (foundItem) {
                    selectCategory(targetCategory, foundItem);
                    return;
                }
            }

            renderCatalogue();
        }

        window.requestAnimationFrame(function () {
            window.requestAnimationFrame(boot);
        });
    });
})();
