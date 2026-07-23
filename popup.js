'use strict';

const POPUP_VERSION = '2.3.1';

const PAGE_PATTERN = /^https:\/\/(?:www\.)?tiktok\.com\/tiktokstudio\/upload(?:[\/?#]|$)/i;
const MIN_START_LEAD_MINUTES = 20;
const MAX_SCHEDULE_DAYS = 30;
const DEFAULTS = {
  caption: '',
  intervalMinutes: 10,
  startMode: 'now',
  customStart: ''
};

const el = {
  form: document.getElementById('schedulerForm'),
  caption: document.getElementById('caption'),
  interval: document.getElementById('intervalMinutes'),
  startNow: document.getElementById('startNow'),
  startCustom: document.getElementById('startCustom'),
  customStartGroup: document.getElementById('customStartGroup'),
  customStart: document.getElementById('customStart'),
  customMinHint: document.getElementById('customMinHint'),
  start: document.getElementById('startButton'),
  stop: document.getElementById('stopButton'),
  publish: document.getElementById('publishButton'),
  warning: document.getElementById('pageWarning'),
  statusDot: document.getElementById('statusDot'),
  statusTitle: document.getElementById('statusTitle'),
  statusMessage: document.getElementById('statusMessage'),
  progressText: document.getElementById('progressText'),
  progressBar: document.getElementById('progressBar'),
  scriptVersion: document.getElementById('scriptVersion'),
  summarySection: document.getElementById('summarySection'),
  summaryCount: document.getElementById('summaryCount'),
  summaryList: document.getElementById('summaryList'),
  errorSection: document.getElementById('errorSection'),
  errorMessage: document.getElementById('errorMessage')
};

let activeTab = null;
let pollTimer = null;
let minimumTimer = null;
let intervalNormalizeTimer = null;

function ceilToFive(date) {
  const result = new Date(date);
  const hadSeconds = result.getSeconds() !== 0 || result.getMilliseconds() !== 0;
  result.setSeconds(0, 0);
  const remainder = result.getMinutes() % 5;
  if (remainder !== 0) result.setMinutes(result.getMinutes() + (5 - remainder));
  else if (hadSeconds) result.setMinutes(result.getMinutes() + 5);
  return result;
}

function floorToFive(date) {
  const result = new Date(date);
  result.setSeconds(0, 0);
  result.setMinutes(result.getMinutes() - (result.getMinutes() % 5));
  return result;
}

function minimumStartDate() {
  return ceilToFive(new Date(Date.now() + MIN_START_LEAD_MINUTES * 60 * 1000));
}

function maximumStartDate() {
  return floorToFive(new Date(Date.now() + MAX_SCHEDULE_DAYS * 24 * 60 * 60 * 1000));
}

function toLocalInputValue(date) {
  const pad = value => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatLocalDate(date) {
  return date.toLocaleString('en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  });
}

function parseLocalDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeIntervalValue({ initializeEmpty = false } = {}) {
  const raw = String(el.interval.value ?? '').trim();
  if (!raw) {
    if (initializeEmpty) {
      el.interval.value = String(DEFAULTS.intervalMinutes);
      return DEFAULTS.intervalMinutes;
    }
    return null;
  }

  const numeric = Number(raw.replace(',', '.'));
  if (!Number.isFinite(numeric)) return null;

  let normalized = Math.ceil(numeric / 5) * 5;
  normalized = Math.max(5, Math.min(1440, normalized));

  const normalizedValue = String(normalized);
  if (el.interval.value !== normalizedValue) {
    el.interval.value = normalizedValue;
  }
  return normalized;
}

function selectedStartMode() {
  return el.startCustom.checked ? 'custom' : 'now';
}

function updateStartModeUi() {
  const custom = selectedStartMode() === 'custom';
  el.customStartGroup.hidden = !custom;
  el.customStart.disabled = !custom;
  if (custom) refreshCustomMinimum({ initializeEmpty: true });
}

function normalizeCustomStartValue({ initializeEmpty = false } = {}) {
  const minimum = minimumStartDate();
  const maximum = maximumStartDate();
  const minimumValue = toLocalInputValue(minimum);
  const maximumValue = toLocalInputValue(maximum);
  const current = parseLocalDateTime(el.customStart.value);

  let normalized = current ? ceilToFive(current) : null;
  if ((initializeEmpty && !normalized) || (normalized && normalized < minimum)) {
    normalized = minimum;
  } else if (normalized && normalized > maximum) {
    normalized = maximum;
  }

  if (normalized) {
    const normalizedValue = toLocalInputValue(normalized);
    if (el.customStart.value !== normalizedValue) {
      el.customStart.value = normalizedValue;
    }
  }

  return { minimum, maximum, normalized };
}

function refreshCustomMinimum({ initializeEmpty = false } = {}) {
  const minimum = minimumStartDate();
  const maximum = maximumStartDate();
  el.customStart.min = toLocalInputValue(minimum);
  el.customStart.max = toLocalInputValue(maximum);
  el.customStart.step = '300';
  el.customMinHint.textContent = `Available from ${formatLocalDate(minimum)} through ${formatLocalDate(maximum)}. Typed minutes are automatically rounded up to the next 5-minute increment.`;

  return normalizeCustomStartValue({ initializeEmpty });
}

function savedForm() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('tts-v2-form') || '{}') }; }
  catch { return { ...DEFAULTS }; }
}

function loadForm() {
  const saved = savedForm();
  el.caption.value = typeof saved.caption === 'string' ? saved.caption : '';
  el.interval.value = Number.isFinite(Number(saved.intervalMinutes)) ? String(saved.intervalMinutes) : String(DEFAULTS.intervalMinutes);
  normalizeIntervalValue({ initializeEmpty: true });
  el.startCustom.checked = saved.startMode === 'custom';
  el.startNow.checked = saved.startMode !== 'custom';
  el.customStart.value = typeof saved.customStart === 'string' ? saved.customStart : '';
  refreshCustomMinimum({ initializeEmpty: selectedStartMode() === 'custom' });
  updateStartModeUi();
}

function persistForm() {
  const intervalMinutes = Number.parseInt(el.interval.value, 10);
  localStorage.setItem('tts-v2-form', JSON.stringify({
    caption: el.caption.value,
    intervalMinutes: Number.isFinite(intervalMinutes) ? intervalMinutes : 10,
    startMode: selectedStartMode(),
    customStart: el.customStart.value
  }));
}

function readConfig() {
  const caption = el.caption.value.trim();
  const intervalMinutes = normalizeIntervalValue({ initializeEmpty: true });
  const startMode = selectedStartMode();

  if (!Number.isInteger(intervalMinutes) || intervalMinutes < 5 || intervalMinutes > 1440 || intervalMinutes % 5 !== 0) {
    throw new Error('The interval must be a multiple of 5 between 5 and 1440 minutes.');
  }

  if (startMode === 'custom') {
    const { minimum, maximum, normalized } = refreshCustomMinimum();
    const selected = normalized || parseLocalDateTime(el.customStart.value);
    if (!selected) throw new Error('Select a valid date and time for the first clip.');
    if (selected < minimum) {
      throw new Error(`The first clip must be scheduled no earlier than ${formatLocalDate(minimum)}.`);
    }
    if (selected > maximum) {
      throw new Error(`TikTok allows scheduling up to 30 days ahead. Choose a time no later than ${formatLocalDate(maximum)}.`);
    }
    return { caption, intervalMinutes, startMode, startAtMs: selected.getTime() };
  }

  return { caption, intervalMinutes, startMode: 'now', startAtMs: null };
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab || null;
}

async function send(message) {
  if (!activeTab?.id) throw new Error('The active tab is not available.');
  try {
    return await chrome.tabs.sendMessage(activeTab.id, message);
  } catch {
    throw new Error('The content script is not available. Fully reload the TikTok Studio page after installing this version.');
  }
}

function statusLabel(status) {
  return ({
    idle: 'Ready', scanning: 'Scanning page', running: 'Automation running',
    ready: 'Ready to publish', publishing: 'Publishing started',
    published: 'Command sent', stopped: 'Stopped', error: 'Error'
  })[status] || 'Status';
}

function renderState(state = {}) {
  const status = state.status || 'idle';
  const processed = Number(state.processed || 0);
  const total = Number(state.total || 0);
  const results = Array.isArray(state.results) ? state.results : [];

  el.statusDot.className = `dot ${status}`;
  el.statusTitle.textContent = statusLabel(status);
  el.statusMessage.textContent = state.message || 'Complete the fields and start the automation.';
  el.progressText.textContent = `${processed}/${total}`;
  el.progressBar.max = Math.max(total, 1);
  el.progressBar.value = Math.min(processed, Math.max(total, 1));
  el.scriptVersion.textContent = state.version ? `Content script ${state.version}` : '';

  const running = ['scanning', 'running', 'publishing'].includes(status);
  el.start.disabled = running || !activeTab;
  el.stop.disabled = !['scanning', 'running'].includes(status);
  el.publish.disabled = status !== 'ready' || results.length === 0 || results.some(item => !item.success);

  el.errorSection.hidden = status !== 'error';
  el.errorMessage.textContent = state.error || state.message || '';
  el.summarySection.hidden = results.length === 0;
  el.summaryCount.textContent = results.length ? `${results.filter(item => item.success).length}/${results.length}` : '';
  el.summaryList.replaceChildren();

  for (const item of results) {
    const row = document.createElement('div');
    row.className = 'summary-item';
    const index = document.createElement('div');
    index.className = 'summary-index';
    index.textContent = `#${item.index}`;
    const body = document.createElement('div');
    const time = document.createElement('div');
    time.className = item.success ? 'summary-time' : 'summary-time error-text';
    time.textContent = item.success ? item.displayTime : `Error: ${item.error || 'unknown'}`;
    const caption = document.createElement('div');
    caption.className = 'summary-caption';
    caption.textContent = item.caption || 'Caption unchanged';
    body.append(time, caption);
    row.append(index, body);
    el.summaryList.append(row);
  }
}

async function refreshState() {
  if (!activeTab?.id || !PAGE_PATTERN.test(activeTab.url || '')) return;
  try {
    const response = await send({ type: 'TTS_GET_STATE' });
    if (response?.state) renderState(response.state);
  } catch {
    // Shown only when the user tries to start the automation.
  }
}

async function startAutomation() {
  try {
    const config = readConfig();
    persistForm();
    renderState({ status: 'scanning', message: 'Looking for clips…', total: 0, processed: 0, results: [] });
    const response = await send({ type: 'TTS_START', config });
    if (!response?.ok) throw new Error(response?.error || 'Unable to start the automation.');
  } catch (error) {
    renderState({ status: 'error', message: error.message, error: error.message, total: 0, processed: 0, results: [] });
  }
}

el.start.addEventListener('click', event => { event.preventDefault(); startAutomation(); });
el.form.addEventListener('submit', event => { event.preventDefault(); startAutomation(); });

el.caption.addEventListener('input', persistForm);
el.caption.addEventListener('change', persistForm);

function normalizeAndPersistInterval({ initializeEmpty = false } = {}) {
  if (intervalNormalizeTimer) {
    clearTimeout(intervalNormalizeTimer);
    intervalNormalizeTimer = null;
  }
  normalizeIntervalValue({ initializeEmpty });
  persistForm();
}

el.interval.addEventListener('input', () => {
  persistForm();
  if (intervalNormalizeTimer) clearTimeout(intervalNormalizeTimer);
  intervalNormalizeTimer = setTimeout(() => {
    intervalNormalizeTimer = null;
    normalizeAndPersistInterval();
  }, 500);
});
el.interval.addEventListener('change', () => normalizeAndPersistInterval({ initializeEmpty: true }));
el.interval.addEventListener('blur', () => normalizeAndPersistInterval({ initializeEmpty: true }));

function normalizeAndPersistCustomStart() {
  refreshCustomMinimum({ initializeEmpty: selectedStartMode() === 'custom' });
  persistForm();
}

el.customStart.addEventListener('input', normalizeAndPersistCustomStart);
el.customStart.addEventListener('change', normalizeAndPersistCustomStart);
el.customStart.addEventListener('blur', normalizeAndPersistCustomStart);
for (const radio of [el.startNow, el.startCustom]) {
  radio.addEventListener('change', () => {
    updateStartModeUi();
    persistForm();
  });
}
el.customStart.addEventListener('focus', () => refreshCustomMinimum({ initializeEmpty: true }));

el.stop.addEventListener('click', async () => {
  try { await send({ type: 'TTS_STOP' }); await refreshState(); }
  catch (error) { renderState({ status: 'error', message: error.message, error: error.message }); }
});

el.publish.addEventListener('click', async () => {
  if (!window.confirm('Confirm clicking TikTok’s “Publish (N)” button?')) return;
  try {
    el.publish.disabled = true;
    const response = await send({ type: 'TTS_PUBLISH' });
    if (!response?.ok) throw new Error(response?.error || 'Publishing was not started.');
    if (response.state) renderState(response.state);
  } catch (error) {
    renderState({ status: 'error', message: error.message, error: error.message });
  }
});

chrome.runtime.onMessage.addListener(message => {
  if (message?.type === 'TTS_STATE_UPDATE' && message.state) renderState(message.state);
});

async function initialize() {
  loadForm();
  minimumTimer = setInterval(() => {
    refreshCustomMinimum({ initializeEmpty: selectedStartMode() === 'custom' });
  }, 30000);

  activeTab = await getActiveTab();
  const correctPage = Boolean(activeTab?.id && PAGE_PATTERN.test(activeTab.url || ''));
  el.warning.hidden = correctPage;
  el.start.disabled = !correctPage;
  if (!correctPage) {
    renderState({ status: 'idle', message: 'This extension only works on the TikTok Studio Upload page.' });
    return;
  }
  await refreshState();
  pollTimer = setInterval(refreshState, 1000);
}

window.addEventListener('unload', () => {
  if (pollTimer) clearInterval(pollTimer);
  if (minimumTimer) clearInterval(minimumTimer);
  if (intervalNormalizeTimer) clearTimeout(intervalNormalizeTimer);
});

initialize().catch(error => renderState({ status: 'error', message: error.message, error: error.message }));
