(function () {
    'use strict';

    function esc(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function cardGrid(items, className) {
        return '<div class="' + className + '">' + items.map(function (item) {
            return '<article class="sl-card"><h3>' + esc(item.title) + '</h3><p>' + esc(item.text) + '</p></article>';
        }).join('') + '</div>';
    }

    var mount = document.getElementById('service-landing');
    if (!mount || !window.SERVICE_PAGES) return;

    var key = mount.getAttribute('data-service');
    var data = window.SERVICE_PAGES[key];
    if (!data) return;

    var skipForm = mount.getAttribute('data-skip-form') === 'true';
    var skipProcess = mount.getAttribute('data-skip-process') === 'true';
    var html = '';

    if (data.included && data.included.length) {
        html += '<section class="sl-section"><div class="container">';
        html += '<div class="section-header text-center"><span class="section-tag">What you get</span>';
        html += '<h2>What this repair includes</h2>';
        if (data.intro) html += '<p>' + esc(data.intro) + '</p>';
        html += '</div>';
        html += cardGrid(data.included, 'sl-grid-3');
        if (data.pricing) html += '<p class="sl-note text-center">' + esc(data.pricing) + '</p>';
        html += '</div></section>';
    }

    if (data.trust) {
        var trustItems = [
            { icon: 'fa-star', title: '4.7 on Google', text: '66 reviews for this North End Road shop — not a made-up score.' },
            { icon: 'fa-location-dot', title: 'West Kensington', text: '175b North End Rd, London W14 9NL. Walk in seven days.' },
            { icon: 'fa-clock', title: 'Open late', text: 'Mon–Sat 9am–10pm. Sunday 10am–9pm.' },
            { icon: 'fa-phone', title: 'Talk to the shop', text: 'Call or WhatsApp 07448 885755 before you travel if you want to check parts.' }
        ];
        if (data.warranty) {
            trustItems[3] = { icon: 'fa-shield-halved', title: '12-month repair warranty', text: 'Parts and workmanship on this laptop repair, as we already state on this page.' };
        }
        html += '<section class="sl-section alt"><div class="container">';
        html += '<div class="section-header text-center"><span class="section-tag">Why this shop</span><h2>Before you book</h2></div>';
        html += '<div class="sl-grid-4">';
        trustItems.forEach(function (item) {
            html += '<article class="sl-trust"><i class="fa-solid ' + item.icon + '" aria-hidden="true"></i><h3>' + esc(item.title) + '</h3><p>' + esc(item.text) + '</p></article>';
        });
        html += '</div></div></section>';
    }

    if (!skipProcess && data.process && data.process.length) {
        html += '<section class="sl-section"><div class="container">';
        html += '<div class="section-header text-center"><span class="section-tag">How it works</span><h2>Diagnose, quote, repair, test</h2></div>';
        html += '<div class="sl-grid-4">';
        data.process.forEach(function (step, i) {
            html += '<article class="sl-step"><span class="sl-step-num">Step ' + (i + 1) + '</span><h3>' + esc(step.title) + '</h3><p>' + esc(step.text) + '</p></article>';
        });
        html += '</div></div></section>';
    }

    if (data.review) {
        html += '<section class="sl-section alt"><div class="container">';
        html += '<div class="section-header text-center"><span class="section-tag">From Google</span><h2>A review for this kind of job</h2></div>';
        html += '<blockquote class="sl-review"><p>“' + esc(data.review.quote) + '”</p><cite>' + esc(data.review.name) + ' · ' + esc(data.review.source) + '</cite></blockquote>';
        html += '</div></section>';
    }

    if (data.faqs && data.faqs.length && !document.querySelector('.faq-accordion-container')) {
        html += '<section class="sl-section"><div class="container">';
        html += '<div class="section-header text-center"><span class="section-tag">Got questions?</span><h2>Frequently asked questions</h2></div>';
        html += '<div class="faq-accordion-container">';
        data.faqs.forEach(function (faq, i) {
            html += '<details class="faq-accordion-item"' + (i === 0 ? ' open' : '') + '><summary>' + esc(faq.q) + '</summary>';
            html += '<div class="faq-accordion-content">' + esc(faq.a) + '</div></details>';
        });
        html += '</div></div></section>';
    }

    if (!skipForm) {
        html += '<section class="sl-section alt" id="service-enquiry"><div class="container">';
        html += '<div class="sl-form-wrap">';
        html += '<div><span class="section-tag">Book this job</span>';
        html += '<h2>Ask about ' + esc(data.formTitle) + '</h2>';
        html += '<p class="sl-note">Send the model and the fault. We will reply from the shop at 175b North End Rd, or you can walk in.</p>';
        html += '<div class="contact-mini-list" style="margin-top:18px;">';
        html += '<div><i class="fa-solid fa-location-dot" style="color:var(--primary);"></i> 175b North End Rd, London W14 9NL</div>';
        html += '<div><i class="fa-brands fa-whatsapp" style="color:#25d366;"></i> <a href="https://wa.me/447448885755" target="_blank" rel="noopener">07448 885755</a></div>';
        html += '<div><i class="fa-solid fa-envelope" style="color:var(--primary);"></i> <a href="mailto:Singhr175b@gmail.com">Singhr175b@gmail.com</a></div>';
        html += '</div>';
        html += '<div class="sl-cta-row">';
        html += '<a class="btn btn-primary" href="tel:07448885755"><i class="fa-solid fa-phone"></i> Call the shop</a>';
        html += '<a class="btn btn-whatsapp" href="https://wa.me/447448885755" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a>';
        html += '</div></div>';
        html += '<form class="enquiry-form" onsubmit="handleEnquiry(event)">';
        html += '<input type="hidden" id="serviceType" value="' + esc(data.formTitle) + '">';
        html += '<div class="form-group"><label for="name">Your name</label><input type="text" id="name" required placeholder="Your name"></div>';
        html += '<div class="form-group"><label for="phone">Phone / WhatsApp</label><input type="tel" id="phone" required placeholder="07…"></div>';
        html += '<div class="form-group"><label for="device">Device model</label><input type="text" id="device" required placeholder="e.g. iPhone 14 Pro / ThinkPad"></div>';
        html += '<div class="form-group"><label for="issue">What is wrong?</label><textarea id="issue" rows="3" required placeholder="Short description of the fault"></textarea></div>';
        html += '<button type="submit" class="btn btn-primary btn-block"><i class="fa-solid fa-paper-plane"></i> Send enquiry</button>';
        html += '<p id="formFeedback" class="form-feedback"></p>';
        html += '</form></div></div></section>';
    }

    mount.innerHTML = html;

    var existingFaq = document.querySelector('.faq-accordion-container');
    if (existingFaq && data.faqs && data.faqs.length) {
        existingFaq.innerHTML = data.faqs.map(function (faq, i) {
            return '<details class="faq-accordion-item"' + (i === 0 ? ' open' : '') + '><summary>' + esc(faq.q) + '</summary>' +
                '<div class="faq-accordion-content">' + esc(faq.a) + '</div></details>';
        }).join('');
    }
})();
