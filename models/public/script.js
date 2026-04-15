// =============================================
// CallDesk — Final JS (Animation + LocalStorage)
// =============================================

// Load data
let queue = JSON.parse(localStorage.getItem("queue")) || [];
let served = JSON.parse(localStorage.getItem("served")) || [];

// Save data
function saveData() {
  localStorage.setItem("queue", JSON.stringify(queue));
  localStorage.setItem("served", JSON.stringify(served));
}

// =============================================
// Toast Notification
// =============================================
function toast(msg, type = "ok") {
  document.querySelectorAll('.toast').forEach(t => t.remove());

  const t = document.createElement('div');
  t.className = `toast t-${type}`;
  t.textContent = msg;

  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// =============================================
// Add Customer
// =============================================
function enqueue() {
  const name     = document.getElementById('f-name').value.trim();
  const phone    = document.getElementById('f-phone').value.trim();
  const issue    = document.getElementById('f-issue').value.trim();
  const priority = document.getElementById('f-priority').value;

  if (!name || !issue) {
    toast("⚠️ Name aur Issue zaruri hai!", "err");
    return;
  }

  const customer = {
    name,
    phone,
    issue,
    priority,
    createdAt: new Date()
  };

  queue.push(customer);
  saveData();

  // Animation delay for smooth feel
  setTimeout(render, 100);

  toast(`✅ ${name} added to queue`, "ok");

  // Clear form
  document.getElementById('f-name').value  = '';
  document.getElementById('f-phone').value = '';
  document.getElementById('f-issue').value = '';
}

// =============================================
// Serve Customer
// =============================================
function dequeue() {
  if (queue.length === 0) {
    toast("⚠️ Queue empty hai!", "err");
    return;
  }

  const customer = queue.shift();
  customer.servedAt = new Date();

  served.unshift(customer);
  saveData();

  setTimeout(render, 100);

  toast(`🎧 Serving: ${customer.name}`, "ok");
}

// =============================================
// Render All
// =============================================
function render() {
  document.getElementById('hq').textContent = queue.length;
  document.getElementById('hs').textContent = served.length;
  document.getElementById('serve-btn').disabled = queue.length === 0;

  renderQueue();
  renderNext();
  renderServed();
}

// =============================================
// Queue List
// =============================================
function renderQueue() {
  const el = document.getElementById('queue-list');

  if (queue.length === 0) {
    el.innerHTML = `
      <div class="empty">
        <div class="empty-icon">📭</div>
        Queue is empty
      </div>`;
    return;
  }

  el.innerHTML = queue.map((c, i) => `
    <div class="qcard fade-in ${i === 0 ? 'pos1' : ''} ${c.priority === 'high' ? 'high' : ''}">
      <div class="qnum">${i + 1}</div>
      <div class="qinfo">
        <div class="qname">${c.name}</div>
        <div class="qissue">${c.issue} · ${c.phone}</div>
      </div>
      <div class="qmeta">
        <span class="badge b-${c.priority}">${c.priority}</span>
        <span class="qwait">${timeAgo(c.createdAt)}</span>
      </div>
    </div>
  `).join('');
}

// =============================================
// Next Customer
// =============================================
function renderNext() {
  const sec = document.getElementById('next-section');

  if (queue.length === 0) {
    sec.innerHTML = `
      <div style="text-align:center;padding:22px;color:#666;">
        // queue is empty
      </div>`;
    return;
  }

  const c = queue[0];

  sec.innerHTML = `
    <div class="next-card fade-in">
      <div class="next-avatar">${c.name[0]}</div>
      <div class="next-name">${c.name}</div>
      <div class="next-issue">${c.issue}</div>
      <div class="next-row">📱 ${c.phone}</div>
      <div class="next-row">⏱ Waiting: ${timeAgo(c.createdAt)}</div>
      <div class="next-row">
        🚨 Priority:
        <span class="badge b-${c.priority}" style="margin-left:6px">
          ${c.priority}
        </span>
      </div>
    </div>`;
}

// =============================================
// Served List
// =============================================
function renderServed() {
  const el = document.getElementById('served-list');

  if (served.length === 0) {
    el.innerHTML = `
      <div style="text-align:center;padding:14px;color:#666;">
        // no customers served yet
      </div>`;
    return;
  }

  el.innerHTML = served.slice(0, 8).map(c => `
    <div class="sv-item fade-in">
      <span class="sv-check">✓</span>
      <div style="flex:1">
        <div class="sv-name">${c.name}</div>
        <div style="font-size:11px;color:#999;">${c.issue}</div>
      </div>
      <span class="sv-time">${timeAgo(c.servedAt)}</span>
    </div>
  `).join('');
}

// =============================================
// Time Format
// =============================================
function timeAgo(time) {
  const diff = Math.floor((Date.now() - new Date(time)) / 60000);

  if (diff < 1) return "Just now";
  if (diff < 60) return diff + "m ago";
  return Math.floor(diff / 60) + "h ago";
}

// =============================================
// Init
// =============================================
render();