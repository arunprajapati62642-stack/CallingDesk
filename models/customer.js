// =============================================

const API = 'http://localhost:3001/api';

// =============================================
//  Data Load on Start
// =============================================
async function loadData() {
  try {
    const [qRes, sRes] = await Promise.all([
      fetch(`${API}/queue`),
      fetch(`${API}/served`)
    ]);
    const q = await qRes.json();
    const s = await sRes.json();

    if (q.success) renderQueue(q);
    if (s.success) renderServed(s);

  } catch (err) {
    // Backend nahi mila — demo mode
    console.warn('Backend nahi mila, demo mode chal raha hai');
    renderDemo();
  }
}

// =============================================
//  Render Functions
// =============================================
function renderQueue(data) {
  document.getElementById('hq').textContent = data.queueSize;
  document.getElementById('serve-btn').disabled = data.queueSize === 0;
  renderNext(data.nextCustomer);
  renderStacks(data.stacks);
  renderList(data.customers);
}

function renderNext(customer) {
  const sec = document.getElementById('next-section');
  if (!customer) {
    sec.innerHTML = `<div style="text-align:center;padding:22px;color:var(--muted2);font-size:13px;font-family:'JetBrains Mono',monospace;">// queue is empty</div>`;
    return;
  }
  sec.innerHTML = `
    <div class="next-card">
      <div class="next-avatar">${customer.name[0]}</div>
      <div class="next-name">${customer.name}</div>
      <div class="next-issue">${customer.issue}</div>
      <div class="next-row">📱 ${customer.phone}</div>
      <div class="next-row">⏱ Waiting: ${waitTime(customer.createdAt)}</div>
      <div class="next-row">🚨 Priority: <span class="badge b-${customer.priority}" style="margin-left:6px">${customer.priority}</span></div>
    </div>`;
}

function renderStacks(stacks) {
  if (!stacks) return;
  const inEl  = document.getElementById('in-stack');
  const outEl = document.getElementById('out-stack');

  inEl.innerHTML = !stacks.inStack || stacks.inStack.length === 0
    ? `<div class="st-empty">empty</div>`
    : [...stacks.inStack].reverse()
        .map(c => `<div class="st-item in">${c.name.split(' ')[0]}</div>`)
        .join('');

  outEl.innerHTML = !stacks.outStack || stacks.outStack.length === 0
    ? `<div class="st-empty">empty</div>`
    : [...stacks.outStack].reverse()
        .map(c => `<div class="st-item out">${c.name.split(' ')[0]}</div>`)
        .join('');
}

function renderList(customers) {
  const el = document.getElementById('queue-list');
  if (!customers || customers.length === 0) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">📭</div>Queue is empty</div>`;
    return;
  }
  el.innerHTML = customers.map((c, i) => `
    <div class="qcard ${i === 0 ? 'pos1' : ''} ${c.priority === 'high' ? 'high' : ''}">
      <div class="qnum">${i + 1}</div>
      <div class="qinfo">
        <div class="qname">${c.name}</div>
        <div class="qissue">${c.issue} · ${c.phone}</div>
      </div>
      <div class="qmeta">
        <span class="badge b-${c.priority}">${c.priority}</span>
        <span class="qwait">${waitTime(c.createdAt)}</span>
      </div>
    </div>`).join('');
}

function renderServed(data) {
  const el = document.getElementById('served-list');
  document.getElementById('hs').textContent = data.count || 0;

  if (!data.customers || data.customers.length === 0) {
    el.innerHTML = `<div style="text-align:center;padding:14px;color:var(--muted2);font-size:12px;font-family:'JetBrains Mono',monospace;">// no customers served yet</div>`;
    return;
  }

  el.innerHTML = data.customers.slice(0, 8).map(c => `
    <div class="sv-item">
      <span class="sv-check">✓</span>
      <div style="flex:1;min-width:0">
        <div class="sv-name">${c.name}</div>
        <div style="font-size:11px;color:var(--muted);font-family:'JetBrains Mono',monospace;">${c.issue}</div>
      </div>
      <span class="sv-time">${timeAgo(c.servedAt)}</span>
    </div>`).join('');
}

// =============================================
//  User Actions
// =============================================
async function enqueue() {
  const name     = document.getElementById('f-name').value.trim();
  const phone    = document.getElementById('f-phone').value.trim();
  const issue    = document.getElementById('f-issue').value.trim();
  const priority = document.getElementById('f-priority').value;

  if (!name || !issue) {
    toast('⚠️ Name aur Issue dono bharo!', 'err');
    return;
  }

  try {
    const res = await fetch(`${API}/queue/enqueue`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ name, phone, issue, priority })
    });

    const data = await res.json();

    if (data.success) {
      // Form clear karo
      document.getElementById('f-name').value  = '';
      document.getElementById('f-phone').value = '';
      document.getElementById('f-issue').value = '';

      toast(`✅ ${name} added — Position #${data.queueSize}`, 'ok');
      loadData();
    } else {
      toast(`❌ ${data.message}`, 'err');
    }

  } catch {
    toast('⚠️ Backend connect nahi ho raha!', 'err');
  }
}

async function dequeue() {
  try {
    const res  = await fetch(`${API}/queue/dequeue`, { method: 'POST' });
    const data = await res.json();

    if (data.success) {
      toast(`🎧 Serving: ${data.servedCustomer.name}`, 'ok');
      loadData();
    } else {
      toast(`❌ ${data.message}`, 'err');
    }
  } catch {
    toast('⚠️ Backend connect nahi ho raha!', 'err');
  }
}

// =============================================
//  Demo Mode (jab backend nahi ho)
// =============================================
function renderDemo() {
  const demoQ = {
    queueSize    : 3,
    nextCustomer : { name: 'Anjali Verma', issue: 'Billing Problem', phone: '+91 98200 11111', createdAt: new Date(Date.now() - 300000).toISOString(), priority: 'high' },
    customers    : [
      { name: 'Anjali Verma',  issue: 'Billing Problem',   priority: 'high',   phone: '+91 98200 11111', createdAt: new Date(Date.now()-300000).toISOString() },
      { name: 'Rohan Mehta',   issue: 'Tech Support',      priority: 'normal', phone: '+91 98200 22222', createdAt: new Date(Date.now()-180000).toISOString() },
      { name: 'Sneha Kapoor',  issue: 'Account Locked',    priority: 'low',    phone: '+91 98200 33333', createdAt: new Date(Date.now()-60000).toISOString()  },
    ],
    stacks: {
      inStack : [{ name: 'Sneha Kapoor' }],
      outStack: [{ name: 'Rohan Mehta' }, { name: 'Anjali Verma' }]
    }
  };

  renderQueue(demoQ);
  document.getElementById('hs').textContent = 5;
  toast('👀 Demo mode — backend start karo live data ke liye', 'info');
}

// =============================================
//  Helper Functions
// =============================================
function waitTime(iso) {
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function timeAgo(iso) {
  if (!iso) return '';
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return 'just now';
  return `${m}m ago`;
}

function toast(msg, type = 'ok') {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const t = document.createElement('div');
  t.className = `toast t-${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

// =============================================
//  Auto Refresh every 10 seconds
// =============================================
loadData();
setInterval(loadData, 10000);