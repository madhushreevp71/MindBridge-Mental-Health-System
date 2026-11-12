// Welcome screen: sign in, create account, reset password — all in one place.
import { h } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { api } from '../core/api.js';
import { store } from '../core/store.js';
import { router } from '../core/router.js';
import { NAV, logoMark } from '../components/shell.js';

export function renderAuth() {
  let mode = 'login';      // login | signup | forgot
  let role = 'student';    // student | doctor | admin
  const panel = h('div', { class: 'auth-panel' });

  const art = h('section', { class: 'auth-art', 'aria-hidden': 'true' },
    h('div', { class: 'auth-blob b1' }), h('div', { class: 'auth-blob b2' }), h('div', { class: 'auth-blob b3' }),
    h('div', { class: 'auth-art-copy' },
      h('div', { class: 'auth-brand' }, logoMark(34), h('span', null, 'MindBridge')),
      h('p', { class: 'auth-line' }, 'A small bridge between how you feel and the help you need.')));

  function field({ id, label, type = 'text', placeholder = '', autocomplete, value = '' }) {
    const input = h('input', { id, type, placeholder, autocomplete, value, required: true });
    if (type === 'password') {
      const toggle = h('button', { class: 'field-toggle', type: 'button', 'aria-label': 'Show password', onclick: () => {
        const show = input.type === 'password'; input.type = show ? 'text' : 'password';
        toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      } }, icon('eye', 18));
      return h('div', { class: 'field' }, h('label', { for: id }, label), h('div', { class: 'field-wrap' }, input, toggle));
    }
    return h('div', { class: 'field' }, h('label', { for: id }, label), input);
  }

  function segmented(options, current, onPick, label) {
    return h('div', { class: 'segmented', role: 'group', 'aria-label': label },
      options.map(([val, text]) => h('button', { type: 'button', class: val === current ? 'on' : '', 'aria-pressed': val === current, onclick: () => onPick(val) }, text)));
  }

  function render() {
    const message = h('div', { class: 'form-msg', role: 'status', 'aria-live': 'polite' });
    const submit = h('button', { class: 'btn btn-primary btn-lg block', type: 'submit' });
    const form = h('form', { class: 'auth-form', novalidate: true });
    const say = (text, kind = 'error') => message.replaceChildren(h('div', { class: `notice notice-${kind}` }, text));

    if (mode === 'login') {
      submit.textContent = 'Sign in';
      form.append(
        segmented([['student', 'Student'], ['doctor', 'Doctor'], ['admin', 'Admin']], role, v => { role = v; render(); }, 'Sign in as'),
        field({ id: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', autocomplete: 'username' }),
        field({ id: 'password', label: 'Password', type: 'password', autocomplete: 'current-password' }),
        h('div', { class: 'row between' }, h('span'), h('button', { class: 'link-btn', type: 'button', onclick: () => { mode = 'forgot'; render(); } }, 'Forgot password?')),
        message, submit);
    } else if (mode === 'signup') {
      submit.textContent = role === 'doctor' ? 'Create doctor account' : 'Create account';
      form.append(
        segmented([['student', 'I am a student'], ['doctor', 'I am a doctor']], role, v => { role = v; render(); }, 'Account type'),
        field({ id: 'name', label: 'Full name', autocomplete: 'name' }),
        field({ id: 'email', label: 'Email', type: 'email', autocomplete: 'email' }),
        field({ id: 'password', label: 'Password (8+ characters)', type: 'password', autocomplete: 'new-password' }),
        role === 'doctor' && h('fieldset', { class: 'doctor-fields' },
          h('legend', null, 'Verification details'),
          h('p', { class: 'muted small' }, 'An admin reviews these before you can sign in.'),
          field({ id: 'licenseNumber', label: 'Medical licence number' }),
          field({ id: 'licenseAuthority', label: 'Issuing council or board' }),
          field({ id: 'specialization', label: 'Specialization' }),
          h('div', { class: 'field' }, h('label', { for: 'npiNumber' }, 'NPI number (US only, optional)'), h('input', { id: 'npiNumber', inputMode: 'numeric', maxLength: 10 }))),
        message, submit);
    } else {
      submit.textContent = 'Send reset link';
      form.append(field({ id: 'email', label: 'Email', type: 'email', autocomplete: 'email' }), message, submit);
    }

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const data = Object.fromEntries([...form.querySelectorAll('input')].map(i => [i.id, i.value.trim()]));
      submit.disabled = true; submit.classList.add('busy');
      try {
        if (mode === 'login') {
          const res = await api.post('/auth/login', { ...data, password: form.querySelector('#password').value, role });
          store.set({ token: res.token, user: res.user, notifications: [] });
          router.go(NAV[res.user.role][0].path);
        } else if (mode === 'signup') {
          const res = await api.post('/auth/signup', { ...data, password: form.querySelector('#password').value, role });
          say(res.message, 'ok');
          setTimeout(() => { mode = 'login'; render(); }, 1800);
        } else {
          say((await api.post('/auth/forgot', { email: data.email })).message, 'ok');
        }
      } catch (err) { say(err.message); }
      finally { submit.disabled = false; submit.classList.remove('busy'); }
    });

    const heading = { login: ['Welcome back', 'Sign in to pick up where you left off.'], signup: ['Create your account', 'It takes a minute. Your check-ins stay private.'], forgot: ['Reset your password', 'We will email you a link.'] }[mode];

    const switcher = mode === 'login'
      ? h('p', { class: 'switch' }, 'New here? ', h('button', { class: 'link-btn', type: 'button', onclick: () => { mode = 'signup'; role = 'student'; render(); } }, 'Create an account'))
      : h('p', { class: 'switch' }, h('button', { class: 'link-btn', type: 'button', onclick: () => { mode = 'login'; render(); } }, 'Back to sign in'));

    panel.replaceChildren(h('h1', null, heading[0]), h('p', { class: 'lede' }, heading[1]), form, switcher);
  }

  render();
  return h('div', { class: 'auth' }, art, h('section', { class: 'auth-side' }, panel));
}
