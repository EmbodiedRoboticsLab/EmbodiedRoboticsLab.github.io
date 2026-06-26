(() => {
  'use strict';

  const RECIPIENT = 'ymjiang@hnu.edu.cn';
  const SELECTOR = 'a[data-ricg-netease-contact]';
  let toastTimer = null;

  const copyText = async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) {
      // Fall through to the legacy copy method.
    }

    const helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', '');
    helper.style.position = 'fixed';
    helper.style.opacity = '0';
    helper.style.pointerEvents = 'none';
    document.body.appendChild(helper);
    helper.select();

    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch (_) {
      copied = false;
    }

    helper.remove();
    return copied;
  };

  const showToast = (message) => {
    let toast = document.querySelector('#ricg-netease-contact-toast');

    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'ricg-netease-contact-toast';
      toast.className = 'ricg-netease-contact-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('is-visible');

    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 3600);
  };

  document.addEventListener('click', (event) => {
    const link = event.target.closest(SELECTOR);
    if (!link) return;

    const recipient = link.dataset.recipient || RECIPIENT;
    void copyText(recipient).then((copied) => {
      showToast(
        copied
          ? `导师邮箱 ${recipient} 已复制。登录 163 邮箱后粘贴到“收件人”栏。`
          : `请在 163 邮箱中向 ${recipient} 发送邮件。`
      );
    });
  });
})();
