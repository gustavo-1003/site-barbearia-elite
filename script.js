'use strict';

const SERVICES = [
  { name: 'Low Fade', price: 55, image: 'photo-1621605815971-fbc98d665033' },
  { name: 'Mid Fade', price: 55, image: 'photo-1503951914875-452162b0f3f1' },
  { name: 'High Fade', price: 60, image: 'photo-1622286342621-4bd786c2447c' },
  { name: 'Degradê', price: 50, image: 'photo-1599351431202-1e0f0137899a' },
  { name: 'Corte Social', price: 50, image: 'photo-1504238591377-99ac6f9c9f4c' },
  { name: 'Mullet', price: 60, image: 'photo-1620331311520-246422fd82f9' },
  { name: 'Buzz Cut', price: 40, image: 'photo-1585747860715-2ba37e788b70' },
  { name: 'Corte Americano', price: 60, image: 'photo-1593702288056-f3ec6b4e38e5' },
];
const BARBERS = ['Rafael Mendes', 'Caio Oliveira', 'Lucas Ferreira'];
const HOURS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
const KEYS = { users: 'elite_users', bookings: 'elite_bookings', currentUser: 'elite_current_user', lastBooking: 'elite_last_booking' };

function readList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function formatPrice(price) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(price);
}

function getService(name) {
  return SERVICES.find(service => service.name === name);
}

function initMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav-links');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    nav.classList.toggle('is-open', open);
  });
}

function renderServices() {
  const grid = document.querySelector('#service-grid');
  if (!grid) return;
  grid.innerHTML = SERVICES.map(service => `
    <article class="service-card">
      <img src="https://images.unsplash.com/${service.image}?auto=format&fit=crop&w=750&q=80" alt="Inspiração de corte ${escapeHTML(service.name)}" loading="lazy">
      <div class="service-card-copy"><h3>${escapeHTML(service.name)}</h3><span class="price">${formatPrice(service.price)}</span></div>
    </article>`).join('');
}

function initRegister() {
  const form = document.querySelector('#register-form');
  if (!form) return;
  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim().toLowerCase();
    const phone = String(data.get('phone') || '').trim();
    const password = String(data.get('password') || '');
    const confirm = String(data.get('confirm') || '');
    const error = document.querySelector('#register-error');
    const users = readList(KEYS.users);
    if (name.length < 3) error.textContent = 'Informe seu nome completo.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) error.textContent = 'Informe um e-mail válido.';
    else if (phone.replace(/\D/g, '').length < 10) error.textContent = 'Informe um telefone válido com DDD.';
    else if (password.length < 8) error.textContent = 'A senha deve ter pelo menos 8 caracteres.';
    else if (password !== confirm) error.textContent = 'As senhas não coincidem.';
    else if (users.some(user => user.email === email)) error.textContent = 'Já existe uma conta com este e-mail. Entre na sua conta.';
    else {
      users.push({ id: crypto.randomUUID(), name, email, phone, password, createdAt: new Date().toISOString() });
      localStorage.setItem(KEYS.users, JSON.stringify(users));
      localStorage.setItem(KEYS.currentUser, email);
      location.href = new URLSearchParams(location.search).get('next') === 'agendamento.html' ? 'agendamento.html' : 'index.html';
    }
  });
}

function initLogin() {
  const form = document.querySelector('#login-form');
  if (!form) return;
  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const email = String(data.get('email') || '').trim().toLowerCase();
    const password = String(data.get('password') || '');
    const error = document.querySelector('#login-error');
    if (!email || !password) {
      error.textContent = 'Preencha seu e-mail e sua senha.';
      return;
    }
    const user = readList(KEYS.users).find(item => item.email === email && item.password === password);
    if (!user) {
      error.textContent = 'E-mail ou senha incorretos. Confira os dados ou crie uma conta.';
      return;
    }
    localStorage.setItem(KEYS.currentUser, user.email);
    location.href = new URLSearchParams(location.search).get('next') === 'agendamento.html' ? 'agendamento.html' : 'index.html';
  });
}

function initBooking() {
  const form = document.querySelector('#booking-form');
  if (!form) return;
  const currentEmail = localStorage.getItem(KEYS.currentUser);
  const user = readList(KEYS.users).find(item => item.email === currentEmail);
  if (!user) {
    location.replace('login.html?next=agendamento.html');
    return;
  }

  const serviceSelect = document.querySelector('#service');
  const barberSelect = document.querySelector('#barber');
  const dateInput = document.querySelector('#date');
  const slots = document.querySelector('#slots');
  const timeInput = document.querySelector('#time');
  const error = document.querySelector('#booking-error');
  const today = new Date();
  dateInput.min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  SERVICES.forEach(service => serviceSelect.add(new Option(`${service.name} — ${formatPrice(service.price)}`, service.name)));

  const updatePrice = () => {
    const service = getService(serviceSelect.value);
    document.querySelector('#booking-price').textContent = service ? `Valor do serviço: ${formatPrice(service.price)}` : 'Selecione um serviço para ver o valor';
  };

  const renderSlots = () => {
    timeInput.value = '';
    const date = dateInput.value;
    const barber = barberSelect.value;
    if (!date || !barber) {
      slots.innerHTML = '<p class="slot-hint">Selecione um barbeiro e uma data.</p>';
      return;
    }
    if (new Date(`${date}T12:00:00`).getDay() === 0) {
      slots.innerHTML = '<p class="slot-hint">Não abrimos aos domingos. Escolha outra data.</p>';
      return;
    }
    const bookings = readList(KEYS.bookings);
    slots.innerHTML = HOURS.map(hour => {
      const reserved = bookings.some(booking => booking.date === date && booking.barber === barber && booking.time === hour);
      return `<button class="slot-button" type="button" data-time="${hour}" aria-pressed="false" ${reserved ? 'disabled aria-label="' + hour + ', já reservado"' : ''}>${hour}</button>`;
    }).join('');
  };

  serviceSelect.addEventListener('change', updatePrice);
  barberSelect.addEventListener('change', renderSlots);
  dateInput.addEventListener('change', renderSlots);
  slots.addEventListener('click', event => {
    const button = event.target.closest('.slot-button');
    if (!button || button.disabled) return;
    slots.querySelectorAll('.slot-button').forEach(item => item.setAttribute('aria-pressed', 'false'));
    button.setAttribute('aria-pressed', 'true');
    timeInput.value = button.dataset.time;
    error.textContent = '';
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const service = getService(serviceSelect.value);
    const date = dateInput.value;
    const time = timeInput.value;
    const barber = barberSelect.value;
    if (!service || !date || !barber || !time) {
      error.textContent = 'Escolha o serviço, o barbeiro, a data e um horário disponível.';
      return;
    }
    const currentBookings = readList(KEYS.bookings);
    if (currentBookings.some(booking => booking.date === date && booking.barber === barber && booking.time === time)) {
      error.textContent = 'Este horário acabou de ser reservado. Escolha outro horário.';
      renderSlots();
      return;
    }
    const booking = {
      id: crypto.randomUUID(), name: user.name, email: user.email,
      service: service.name, price: service.price, barber, date, time,
      createdAt: new Date().toISOString(),
    };
    currentBookings.push(booking);
    localStorage.setItem(KEYS.bookings, JSON.stringify(currentBookings));
    localStorage.setItem(KEYS.lastBooking, booking.id);
    location.href = 'sucesso.html';
  });
}

function initSuccess() {
  const container = document.querySelector('#confirmation-details');
  if (!container) return;
  const id = localStorage.getItem(KEYS.lastBooking);
  const booking = readList(KEYS.bookings).find(item => item.id === id);
  if (!booking) {
    container.innerHTML = '<p>Não encontramos um agendamento recente neste navegador. <a class="text-link" href="agendamento.html">Fazer agendamento ↗</a></p>';
    return;
  }
  const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${booking.date}T12:00:00Z`));
  const details = [
    ['CLIENTE', booking.name], ['SERVIÇO', booking.service],
    ['BARBEIRO', booking.barber], ['DATA', date],
    ['HORÁRIO', booking.time], ['VALOR', formatPrice(booking.price)],
  ];
  container.innerHTML = details.map(([label, value]) => `<div><span>${label}</span>${escapeHTML(value)}</div>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  initMenu();
  renderServices();
  initRegister();
  initLogin();
  initBooking();
  initSuccess();
});
