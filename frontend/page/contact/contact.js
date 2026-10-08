document.addEventListener('DOMContentLoaded', () => {
    if (typeof setupHeader === 'function') {
        setupHeader('contact');
    }

    setupTopicPills();

    const form = document.getElementById('contactForm');
    if (form) {
        form.onsubmit = handleContactSubmit;
    }
});

function setupTopicPills() {
    const pills = document.querySelectorAll('.topic-pill');
    const hiddenSubjectInput = document.getElementById('contactSubject');

    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');

            const selectedTopic = pill.dataset.topic || pill.textContent.trim();
            if (hiddenSubjectInput) {
                hiddenSubjectInput.value = selectedTopic;
            }
        });
    });
}

async function handleContactSubmit(e) {
    e.preventDefault();

    const nameEl = document.getElementById('contactName');
    const emailEl = document.getElementById('contactEmail');
    const phoneEl = document.getElementById('contactPhone');
    const subjectEl = document.getElementById('contactSubject');
    const messageEl = document.getElementById('contactMessage');

    const name = nameEl ? nameEl.value.trim() : '';
    const email = emailEl ? emailEl.value.trim() : '';
    const phone = phoneEl ? phoneEl.value.trim() : '';
    const subject = subjectEl ? subjectEl.value.trim() : 'Tư vấn & Liên hệ';
    const message = messageEl ? messageEl.value.trim() : '';

    if (!name || !email || !phone || !message) {
        showToast('Vui lòng điền đầy đủ các thông tin bắt buộc (*)!', 'error');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('Địa chỉ email không hợp lệ!', 'error');
        return;
    }

    const submitBtn = document.getElementById('btnSubmitContact');
    const btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
    const iconSend = submitBtn ? submitBtn.querySelector('.icon-send') : null;
    const iconLoading = submitBtn ? submitBtn.querySelector('.icon-loading') : null;

    // Loading State
    if (submitBtn) submitBtn.disabled = true;
    if (btnText) btnText.textContent = 'Đang gửi qua Gmail...';
    if (iconSend) iconSend.style.display = 'none';
    if (iconLoading) iconLoading.style.display = 'inline-block';

    try {
        const response = await fetchApi('/contact', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                name,
                email,
                phone,
                subject,
                message
            })
        });

        const successMsg = (response && response.message) 
            ? response.message 
            : 'Cảm ơn bạn đã gửi liên hệ! Email đã được chuyển tới Gmail của cửa hàng.';
            
        showToast(successMsg, 'success');
        
        // Reset Form
        e.target.reset();
        
        // Reset selected topic pill back to default
        const firstPill = document.querySelector('.topic-pill');
        if (firstPill) {
            firstPill.click();
        }

    } catch (err) {
        console.error('Contact Form Submit Error:', err);
        const errorMsg = (err && err.message) 
            ? err.message 
            : 'Không thể gửi liên hệ. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau!';
        showToast(errorMsg, 'error');
    } finally {
        // Restore Button State
        if (submitBtn) submitBtn.disabled = false;
        if (btnText) btnText.textContent = 'Gửi liên hệ';
        if (iconSend) iconSend.style.display = 'inline-block';
        if (iconLoading) iconLoading.style.display = 'none';
    }
}



