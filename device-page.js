(function () {
    'use strict';

    function selectedVisit(form) {
        var el = form.querySelector('input[name="visitType"]:checked');
        return el ? el.value : '';
    }

    var original = window.handleEnquiry;
    window.handleEnquiry = function (event) {
        var form = event.target;
        var modelEl = form.querySelector('#model');
        var visit = selectedVisit(form);
        var familyEl = form.querySelector('#deviceFamily');
        var issueEl = form.querySelector('#issue');
        var phoneEl = form.querySelector('#phone');

        if (modelEl && visit && issueEl && phoneEl) {
            event.preventDefault();
            var feedback = form.querySelector('#formFeedback') || document.getElementById('formFeedback');
            var submitBtn = form.querySelector('button[type="submit"]');
            var originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
            }
            var family = familyEl ? familyEl.value : '';
            var formData = new FormData();
            formData.append('access_key', '5bc83c79-247a-42c2-901d-72ec0b4e0573');
            formData.append('phone', phoneEl.value);
            formData.append('subject', family + ' repair: ' + modelEl.value + ' (' + visit + ')');
            formData.append('details',
                'Device: ' + family +
                '\nModel: ' + modelEl.value +
                '\nVisit: ' + visit +
                '\nIssue: ' + issueEl.value +
                '\nPhone: ' + phoneEl.value
            );
            fetch('https://api.web3forms.com/submit', { method: 'POST', body: formData })
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    if (!feedback) return;
                    if (data.success) {
                        feedback.style.color = '#f87171';
                        feedback.textContent = 'Enquiry sent. We will contact you on that number.';
                        form.reset();
                        var chips = document.querySelectorAll('.device-model-chip');
                        chips.forEach(function (c, i) { c.classList.toggle('is-active', i === 0); });
                    } else {
                        feedback.style.color = '#ef4444';
                        feedback.textContent = 'Submission failed, please try again.';
                    }
                })
                .catch(function () {
                    if (feedback) {
                        feedback.style.color = '#ef4444';
                        feedback.textContent = 'Submission failed, check your network connection.';
                    }
                })
                .finally(function () {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalBtnHtml;
                    }
                });
            return;
        }
        if (typeof original === 'function') original(event);
    };

    var chips = document.querySelectorAll('.device-model-chip');
    var modelSelect = document.getElementById('model');
    if (!chips.length || !modelSelect) return;

    chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
            var value = chip.getAttribute('data-model');
            modelSelect.value = value;
            chips.forEach(function (c) { c.classList.toggle('is-active', c === chip); });
        });
    });

    modelSelect.addEventListener('change', function () {
        chips.forEach(function (c) {
            c.classList.toggle('is-active', c.getAttribute('data-model') === modelSelect.value);
        });
    });
})();
