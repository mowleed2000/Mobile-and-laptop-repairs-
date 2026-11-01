(function () {
    'use strict';

    function loadMap(frame) {
        if (!frame || frame.getAttribute('data-loaded') === '1') return;
        var src = frame.getAttribute('data-map-src');
        if (!src) return;
        frame.setAttribute('data-loaded', '1');

        var iframe = document.createElement('iframe');
        iframe.src = src;
        iframe.title = 'Mobile and Laptop Repairs on Google Maps';
        iframe.width = '100%';
        iframe.height = '100%';
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('loading', 'lazy');
        iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
        iframe.style.border = '0';
        iframe.style.width = '100%';
        iframe.style.height = '100%';

        frame.innerHTML = '';
        frame.appendChild(iframe);
    }

    document.querySelectorAll('.store-map-frame[data-map-src]').forEach(function (frame) {
        var button = frame.querySelector('.store-map-facade');
        if (!button) return;
        button.addEventListener('click', function () {
            loadMap(frame);
        });
    });
})();
