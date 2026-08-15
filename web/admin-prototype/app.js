import { mockApi as api } from './mockApi.js';

const app = document.querySelector('#app');
const state = {
  view: 'dashboard', sidebarOpen: false, search: '', selectedUser: null, selectedTransaction: null,
  selectedTicket: null, walletTab: 'requests', serviceTab: 'categories', supportTab: 'tickets', financeTab: 'summary'
};

const money = value => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number(value || 0));
const escape = value => String(value ?? '').replace(/[&<>'"]/g, item => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[item]));
const initials = value => String(value || 'Admin').split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase();
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const pages = [
  ['dashboard', 'Dashboard', '⌂'],
  ['users', 'User Management', '◉'],
  ['wallet', 'Wallet Funding', '₦'],
  ['transactions', 'Transactions', '▤'],
  ['services', 'VTU Services', '◇'],
  ['finance', 'Financial Intel', '↗'],
  ['settings', 'API Settings', '⚙'],
  ['support', 'Support Center', '☏'],
  ['logs', 'System Logs', '≡'],
  ['profile', 'My Profile', '◒']
];

function status(value) {
  const key = String(value || '').toLowerCase();
  const tone = ['success', 'active', 'approved', 'resolved', 'published', 'verified'].includes(key) ? 'good' : ['pending', 'open', 'review', 'in_progress', 'maintenance'].includes(key) ? 'warn' : ['failed', 'inactive', 'suspended', 'rejected'].includes(key) ? 'bad' : 'neutral';
  return `<span class="badge ${tone}"><i></i>${escape(String(value || '').replace('_', ' '))}</span>`;
}
function toast(title, text, tone = 'good') {
  const region = document.querySelector('#toast-region');
  const node = document.createElement('article'); node.className = `toast ${tone}`;
  node.innerHTML = `<b>${escape(title)}</b><span>${escape(text)}</span>`;
  region.append(node); setTimeout(() => node.remove(), 3500);
}
function modal(title, body, footer = '') {
  document.querySelector('#overlay')?.remove();
  const node = document.createElement('div'); node.id = 'overlay'; node.className = 'overlay';
  node.innerHTML = `<section class="drawer" role="dialog" aria-modal="true"><header><div><span class="eyebrow">ASAFORVTU ADMIN</span><h2>${title}</h2></div><button class="icon-button close-overlay" aria-label="Close">×</button></header><div class="drawer-body">${body}</div>${footer ? `<footer class="drawer-actions">${footer}</footer>` : ''}</section>`;
  document.body.append(node);
  node.addEventListener('click', event => { if (event.target === node || event.target.closest('.close-overlay')) node.remove(); });
}
function setView(view) { state.view = view; state.sidebarOpen = false; state.search = ''; render(); }
function icon(symbol, cls = '') { return `<span class="icon-circle ${cls}">${symbol}</span>`; }
function empty(copy) { return `<div class="empty"><div>${icon('—')}</div><h3>Nothing to show</h3><p>${copy}</p></div>`; }

function shell(title, subtitle, body, actions = '') {
  const active = state.view === 'user-detail' ? 'users' : state.view === 'transaction-detail' ? 'transactions' : state.view;
  return `<div class="app-shell">
    ${state.sidebarOpen ? '<button class="sidebar-backdrop" data-action="close-sidebar" aria-label="Close navigation"></button>' : ''}
    <aside class="sidebar ${state.sidebarOpen ? 'open' : ''}">
      <div class="sidebar-brand-row"><button class="brand" data-nav="dashboard"><img src="./assets/ferixas-globe.png" alt="Ferixas"/><span><b>Ferixas</b><small>AsaforVTU Admin</small></span></button><button class="sidebar-close" data-action="close-sidebar" aria-label="Close navigation">×</button></div>
      <nav class="side-nav">${pages.map(([id, label, mark]) => `<button class="nav-item ${active === id ? 'active' : ''}" data-nav="${id}"><i>${mark}</i><span>${label}</span></button>`).join('')}</nav>
      <div class="sidebar-footer"><div class="admin-mini"><span>FO</span><div><b>Ferixas Operations</b><small>Administrator</small></div></div><button class="signout" data-action="signout">⇥ Sign out prototype</button></div>
    </aside>
    <main class="main"><header class="topbar"><button class="mobile-menu" data-action="mobile-menu">☰</button><label class="search"><span>⌕</span><input id="global-search" placeholder="Search current page…" value="${escape(state.search)}"/></label><div class="top-actions"><button class="env-chip"><i></i> Prototype</button><button class="avatar-button" data-nav="profile">FO</button></div></header>
      <section class="content"><div class="page-title"><div><span class="eyebrow">ADMINISTRATION</span><h1>${title}</h1><p>${subtitle}</p></div><div class="page-actions">${actions}</div></div>${body}</section>
    </main>
  </div>`;
}
function metric(label, value, note, mark, cls = 'blue') { return `<article class="metric ${cls}"><span>${mark}</span><div><small>${label}</small><b>${value}</b><p>${note}</p></div></article>`; }
function tabs(items, active, key) { return `<div class="segmented page-tabs">${items.map(([id, label]) => `<button class="${active === id ? 'active' : ''}" data-tab="${key}" data-value="${id}">${label}</button>`).join('')}</div>`; }
function table(headers, rows) { return `<article class="table-panel"><table><thead><tr>${headers.map(head => `<th>${head}</th>`).join('')}</tr></thead><tbody>${rows || `<tr><td colspan="${headers.length}">${empty('No records are available.')}</td></tr>`}</tbody></table></article>`; }

async function dashboard() {
  const data = await api.getOverview();
  const body = `<section class="metric-grid">${metric('Platform users', data.totalUsers.toLocaleString(), 'Registered accounts', '◉')}${metric('Wallet balance', money(data.mainBalance), 'Customer wallet total', '₦', 'mint')}${metric('Transactions', data.recent.length.toLocaleString(), 'Recent activity sample', '▤', 'navy')}${metric("Today's sales", money(data.todayVolume), 'Processed today', '↗', 'lime')}</section>
  <section class="split-grid dashboard-grid"><article class="panel"><header class="panel-head"><div><span class="eyebrow">REVENUE ANALYSIS</span><h2>Seven-day performance</h2></div></header><div class="bar-chart compact-chart">${[36,58,44,74,65,87,71].map((h,i)=>`<div><i style="height:${h}px"></i><small>${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}</small></div>`).join('')}</div></article><article class="panel"><header class="panel-head"><div><span class="eyebrow">SYSTEM STATUS</span><h2>Platform online</h2></div>${status('active')}</header><p class="short-copy">All monitored administration services are reachable.</p><div class="mini-stats"><div><b>${data.successRate}%</b><small>success rate</small></div><div><b>6</b><small>recent records</small></div></div></article></section>
  <section class="panel"><header class="panel-head"><div><span class="eyebrow">RECENT TRANSACTIONS</span><h2>Latest platform activity</h2></div><button class="text-button" data-nav="transactions">View all →</button></header>${data.recent.slice(0,5).map(row => `<button class="activity-row" data-action="transaction" data-id="${row.id}">${icon(row.status === 'success' ? '✓' : '…', row.status === 'success' ? 'lime' : 'orange')}<div><b>${escape(row.user)}</b><small>${escape(row.type)} · ${escape(row.time)}</small></div><div class="row-amount"><b>${money(row.amount)}</b>${status(row.status)}</div><i>›</i></button>`).join('')}</section>`;
  return shell('Dashboard Overview', 'Monitoring platform health and performance.', body);
}

async function users() {
  const users = await api.listUsers();
  const filtered = users.filter(user => `${user.name} ${user.email} ${user.phone}`.toLowerCase().includes(state.search.toLowerCase()));
  const rows = filtered.map(user => `<tr><td><b>${escape(user.name)}</b><small class="under">${escape(user.id)}</small></td><td>${escape(user.email)}</td><td><b>${money(user.balance)}</b></td><td>${status(user.status)}</td><td><div class="inline-actions"><button class="mini" data-action="open-user" data-id="${user.id}">Profile</button><button class="mini" data-nav="wallet" data-prefill="${user.id}">Wallet</button><button class="kebab" data-action="toggle-user" data-id="${user.id}">•••</button></div></td></tr>`).join('');
  return shell('User Directory', 'Manage platform accounts and access levels.', table(['Identity', 'Communication', 'Liquidity', 'Status', 'Actions'], rows), `<button class="button primary" data-action="create-user">＋ Enroll user</button>`);
}

async function userDetail() {
  const user = (await api.listUsers()).find(item => item.id === state.selectedUser);
  if (!user) return shell('User Profile', 'Account overview and activity.', empty('Select a user from User Management.'), `<button class="button secondary" data-nav="users">Back</button>`);
  const transactions = (await api.listTransactions()).filter(item => item.user === user.name).slice(0, 5);
  const body = `<div class="detail-actions"><button class="button secondary" data-nav="wallet" data-prefill="${user.id}">Fund wallet</button><button class="button secondary" data-action="user-transactions" data-id="${user.id}">View transactions</button></div><section class="split-grid user-detail-grid"><article class="panel"><div class="profile-line"><span class="user-avatar large">${initials(user.name)}</span><div><h2>${escape(user.name)}</h2><p>${escape(user.email)}</p></div>${status(user.status)}</div><dl class="detail-list"><div><dt>User ID</dt><dd>${user.id}</dd></div><div><dt>Phone</dt><dd>${user.phone}</dd></div><div><dt>Joined</dt><dd>${user.joined}</dd></div></dl></article><article class="panel"><span class="eyebrow">FINANCIAL SUMMARY</span><div class="metric-grid mini-metrics">${metric('Wallet', money(user.balance), '', '₦', 'blue')}${metric('Cashback', money(0), '', '↗', 'mint')}${metric('Referrals', money(0), '', '◎', 'lime')}</div></article></section><section class="split-grid user-detail-grid"><article class="panel"><span class="eyebrow">LIFETIME STATS</span><div class="mini-stats"><div><b>${money(12500)}</b><small>total deposited</small></div><div><b>${money(7350)}</b><small>total spent</small></div></div></article><article class="panel"><header class="panel-head"><div><span class="eyebrow">RECENT TRANSACTIONS</span><h2>Last five records</h2></div></header>${transactions.length ? transactions.map(row => `<div class="audit-row slim"><span>${escape(row.type)}</span><b>${money(row.amount)}</b>${status(row.status)}<small>${escape(row.time)}</small></div>`).join('') : empty('This user has no transactions yet.')}</article></section>`;
  return shell('User Profile', 'Overview of account status and activity.', body, `<button class="button secondary" data-nav="users">← User directory</button>`);
}

async function wallet() {
  const [deposits, logs, users] = await Promise.all([api.listDeposits(), api.listLogs(), api.listUsers()]);
  const pending = deposits.filter(item => item.status === 'pending');
  const requests = table(['Request', 'User', 'Amount', 'Method', 'Status', 'Actions'], deposits.map(item => `<tr><td class="ref">${item.id}</td><td>${escape(item.user)}</td><td><b>${money(item.amount)}</b></td><td>${escape(item.method)}</td><td>${status(item.status)}</td><td>${item.status === 'pending' ? `<button class="mini good" data-action="deposit" data-id="${item.id}" data-status="approved">Approve</button> <button class="mini danger" data-action="deposit" data-id="${item.id}" data-status="rejected">Reject</button>` : '—'}</td></tr>`).join(''));
  const adjust = `<section class="adjust-grid"><form class="panel compact-form" id="credit-form"><span class="eyebrow">CREDIT USER WALLET</span><label>User<select name="userId">${users.map(user => `<option value="${user.id}" ${state.prefill === user.id ? 'selected' : ''}>${escape(user.name)} · ${user.id}</option>`).join('')}</select></label><label>Amount<input name="amount" type="number" min="1" placeholder="0.00"/></label><label>Reason<input name="note" placeholder="Bonus / refund / correction"/></label><button class="button primary" type="submit">Credit wallet</button></form><form class="panel compact-form" id="debit-form"><span class="eyebrow">DEBIT USER WALLET</span><label>User<select name="userId">${users.map(user => `<option value="${user.id}" ${state.prefill === user.id ? 'selected' : ''}>${escape(user.name)} · ${user.id}</option>`).join('')}</select></label><label>Amount<input name="amount" type="number" min="1" placeholder="0.00"/></label><label>Reason<input name="note" placeholder="Correction / penalty"/></label><button class="button danger-button" type="submit">Debit wallet</button></form><article class="panel repair-panel"><span class="eyebrow">TROUBLESHOOTING</span><h2>Ghost wallet repair</h2><p class="short-copy">Scan and migrate wallets mapped to email IDs.</p><button class="button secondary" data-action="fix-wallets">Run repair</button></article></section>`;
  const logRows = table(['ID', 'User', 'Type', 'Amount', 'Date'], logs.map(log => `<tr><td class="ref">${escape(log.entity)}</td><td>${escape(log.actor)}</td><td>${escape(log.event)}</td><td>—</td><td>${escape(log.time)}</td></tr>`).join(''));
  const body = `<section class="metric-grid three">${metric('Pending requests', pending.length, `${money(pending.reduce((sum,item)=>sum+item.amount,0))} awaiting review`, '◌', 'orange')}${metric('Processed today', deposits.filter(item=>item.status==='approved').length, 'Approved funding requests', '✓', 'mint')}${metric('Monthly flow', money(deposits.filter(item=>item.status==='approved').reduce((sum,item)=>sum+item.amount,0)), 'Approved request value', '↗', 'blue')}</section>${tabs([['requests','Requests'],['adjust','Adjust'],['logs','Logs']], state.walletTab, 'wallet')}${state.walletTab==='requests'?requests:state.walletTab==='adjust'?adjust:logRows}`;
  return shell('Wallet Funding', 'Manage funding requests and manual liquidity adjustments.', body);
}

async function transactions() {
  const rows = (await api.listTransactions()).filter(item => `${item.id} ${item.user} ${item.type} ${item.status}`.toLowerCase().includes(state.search.toLowerCase()));
  const body = `<section class="toolbar"><div class="filter-group"><button class="filter">All services ⌄</button><button class="filter">All status ⌄</button></div><button class="button secondary" data-action="export">⇩ Export CSV</button></section>${table(['Transaction ID','User','Service','Amount','Date & time','Status','Actions'], rows.map(item => `<tr><td class="ref">${escape(item.id)}</td><td>${escape(item.user)}</td><td>${escape(item.type)}</td><td><b>${money(item.amount)}</b></td><td>${escape(item.time)}</td><td>${status(item.status)}</td><td><button class="mini" data-action="receipt" data-id="${item.id}">Receipt</button> <button class="mini" data-action="transaction" data-id="${item.id}">Details</button></td></tr>`).join(''))}`;
  return shell('Transactions', 'View and manage all system transactions.', body);
}

async function transactionDetail() {
  const item = (await api.listTransactions()).find(row => row.id === state.selectedTransaction);
  if (!item) return shell('Transaction Details', 'Full information for a transaction.', empty('Select a transaction from the Transactions page.'), `<button class="button secondary" data-nav="transactions">← Transactions</button>`);
  const body = `<section class="panel"><span class="eyebrow">SUMMARY</span><dl class="detail-list two"><div><dt>ID</dt><dd>${item.id}</dd></div><div><dt>User</dt><dd>${item.user}</dd></div><div><dt>Type</dt><dd>${item.type}</dd></div><div><dt>Amount</dt><dd>${money(item.amount)}</dd></div><div><dt>Status</dt><dd>${status(item.status)}</dd></div><div><dt>Created</dt><dd>${item.time}</dd></div></dl></section><section class="panel"><span class="eyebrow">PROVIDER STATUS</span><dl class="detail-list two"><div><dt>Channel</dt><dd>${item.channel}</dd></div><div><dt>Provider status</dt><dd>${item.status}</dd></div><div><dt>Error code</dt><dd>—</dd></div><div><dt>Error message</dt><dd>—</dd></div></dl></section><section class="panel"><span class="eyebrow">PROVIDER RAW</span><pre>{ "reference": "${item.reference}", "status": "${item.status}" }</pre></section>`;
  return shell('Transaction Details', `Full information for ${item.id}.`, body, `<button class="button secondary" data-nav="transactions">← Transactions</button>`);
}

async function services() {
  const [services, plans] = await Promise.all([api.listServices(), api.listPlans()]);
  let content = '';
  if (state.serviceTab === 'categories') content = table(['Name','Category group','ID','Actions'], services.map(item => `<tr><td><b>${escape(item.name)}</b></td><td>${escape(item.category)}</td><td class="ref">${item.id}</td><td><button class="mini" data-action="service" data-id="${item.id}">Edit</button> <button class="mini danger">Delete</button></td></tr>`).join(''));
  if (state.serviceTab === 'airtime') content = table(['Network','Discount','Status','Actions'], ['MTN','Airtel','Glo','9mobile'].map(network => `<tr><td><b>${network}</b></td><td>2%</td><td>${status('active')}</td><td><button class="mini" data-action="edit-airtime" data-id="${network}">Edit</button></td></tr>`).join(''));
  if (state.serviceTab === 'data') content = planTable(plans.filter(item=>item.service==='Data bundles'), 'Data Plans');
  if (state.serviceTab === 'cable') content = planTable(plans.filter(item=>item.service==='Cable TV'), 'Cable TV Packages');
  if (state.serviceTab === 'electricity') content = planTable([{id:'POWER-01',service:'Electricity',network:'IKEDC',name:'Prepaid token',customerPrice:100,providerPrice:0,state:'active'}], 'Electricity Providers', true);
  const labels = { categories: 'Add category', airtime: '', data: 'Add data plan', cable: 'Add cable plan', electricity: 'Add power company' };
  const actions = labels[state.serviceTab] ? `<button class="button primary" data-action="create-plan">＋ ${labels[state.serviceTab]}</button>` : '';
  const body = `${tabs([['categories','Categories'],['airtime','Airtime'],['data','Data'],['cable','Cable'],['electricity','Power']], state.serviceTab, 'services')}<section class="tab-action">${actions}</section>${content}`;
  return shell('Service Management', 'Manage VTU services, plans, and pricing.', body);
}
function planTable(plans, title, power = false) { return `<article class="table-panel"><header class="compact-header"><div><span class="eyebrow">${title.toUpperCase()}</span></div></header><table><thead><tr><th>${power?'Disco':'Network'}</th><th>${power?'Name':'Plan name'}</th><th>User price</th><th>API price</th><th>Status</th><th>Actions</th></tr></thead><tbody>${plans.map(item=>`<tr><td>${item.network}</td><td><b>${item.name}</b></td><td>${money(item.customerPrice)}</td><td>${money(item.providerPrice)}</td><td>${status(item.state)}</td><td><button class="mini" data-action="plan" data-id="${item.id}">Edit</button> <button class="mini danger">Delete</button></td></tr>`).join('')||`<tr><td colspan="6">${empty('No configured plans.')}</td></tr>`}</tbody></table></article>`; }

async function finance() {
  const transactions = await api.listTransactions();
  const successful = transactions.filter(item => item.status === 'success');
  const volume = successful.reduce((sum,item)=>sum+item.amount,0);
  const breakdown = table(['ID / hash','Initiator','Service','User price','Provider cost','Net','Status'], successful.map(item=>`<tr><td class="ref">${item.id}</td><td>${item.user}</td><td>${item.type}</td><td>${money(item.amount)}</td><td>${money(item.amount*.92)}</td><td class="positive">${money(item.amount*.08)}</td><td>${status(item.status)}</td></tr>`).join(''));
  const history = table(['Period','Deposits','Provider cost','SMS cost','Net profit'], [['Daily',.2],['Weekly',.6],['Monthly',1]].map(([period,factor])=>`<tr><td><b>${period}</b></td><td>${money(volume*factor)}</td><td>${money(volume*factor*.92)}</td><td>${money(0)}</td><td class="positive">${money(volume*factor*.08)}</td></tr>`).join(''));
  const capacity = table(['Service','Price','Capacity'], (await api.listPlans()).map(item=>`<tr><td>${item.network} ${item.name}</td><td>${money(item.providerPrice)}</td><td>${item.providerPrice ? Math.floor(5000/item.providerPrice) : 0}</td></tr>`).join(''));
  const activeContent = state.financeTab === 'summary' ? breakdown : state.financeTab === 'history' ? history : capacity;
  const body = `<section class="finance-filters"><label>Scope<select><option>System</option><option>Toller Adeyemi</option></select></label><label>From<input type="date"/></label><label>To<input type="date"/></label></section><section class="metric-grid three">${metric('Obligation capacity', money(volume*.92), 'Provider liquidity required', '◌','orange')}${metric('Ecosystem balance', money(20250), 'Aggregate wallet balance', '₦','blue')}${metric('Net yield', money(volume*.08), 'After provider cost', '↗','lime')}</section>${tabs([['summary','Breakdown'],['history','Historical'],['capacity','Capacity']], state.financeTab, 'finance')}${activeContent}`;
  return shell('Financial Intel', 'Real-time revenue, cost, and profit analysis.', body);
}

function settings() {
  const body = `<section class="settings-stack"><article class="panel settings-card"><span class="eyebrow">PROVIDER LINK</span><h2>VTU provider connection</h2><div class="compact-form"><label>Node endpoint URL<input value="https://provider.example.com"/></label><label>Secure API key<input type="password" value="••••••••••••"/></label><label>Secret encryption token<input type="password" value="••••••••••••"/></label><button class="button primary" data-action="save-settings">Commit changes</button></div></article><article class="panel settings-card"><span class="eyebrow">SIGNAL RECEIVER</span><h2>Flutterwave webhook</h2><label>Webhook URL<div class="copy-field"><input readonly value="https://vtuapi.ferixas.com/api/webhooks/flutterwave"/><button class="mini" data-action="copy-webhook">Copy</button></div></label></article><article class="panel settings-card"><span class="eyebrow">PAYMENT RECONCILIATION</span><h2>Reconcile a payment</h2><div class="reconcile-row"><input id="reconcile-ref" placeholder="Reference or transaction ID"/><button class="button primary" data-action="reconcile">Reconcile</button></div></article></section>`;
  return shell('Core Configuration', 'Calibrate VTU provider protocols and instant signal webhooks.', body);
}

async function support() {
  const [tickets, announcements] = await Promise.all([api.listTickets(), api.listAnnouncements()]);
  let content = '';
  if (state.supportTab === 'tickets') {
    content = `<section class="ticket-stack">${tickets.map(ticket=>`<article class="ticket-summary ${ticket.id===state.selectedTicket?'selected':''}"><div><h2>${escape(ticket.subject)}</h2><p>${escape(ticket.user)} · ${ticket.id} · ${ticket.updated}</p></div>${status(ticket.status)}<div class="ticket-actions"><button class="mini" data-action="open-ticket" data-id="${ticket.id}">View messages</button>${ticket.status!=='resolved'?`<button class="mini good" data-action="resolve-ticket" data-id="${ticket.id}">Mark solved</button>`:''}<button class="mini danger">Delete</button></div></article>`).join('')}</section>${state.selectedTicket ? ticketMessages(tickets.find(item=>item.id===state.selectedTicket)) : ''}`;
  } else content = `<section class="ticket-stack">${announcements.map(item=>`<article class="ticket-summary"><div><h2>${escape(item.title)}</h2><p>${escape(item.content)}</p><small>${item.created}</small></div>${status(item.state)}<button class="mini danger">Delete</button></article>`).join('')}</section>`;
  const action = state.supportTab === 'announcements' ? `<button class="button primary" data-action="create-announcement">＋ New announcement</button>` : '';
  return shell('Support Center', 'Manage customer tickets and service announcements.', `${tabs([['tickets','Tickets'],['announcements','Announcements']], state.supportTab, 'support')}${content}`, action);
}
function ticketMessages(ticket) {
  if (!ticket) return '';
  return `<section class="panel message-panel"><header class="panel-head"><div><span class="eyebrow">MESSAGES</span><h2>${escape(ticket.subject)}</h2></div><button class="icon-button" data-action="close-ticket">×</button></header><div class="messages compact-messages">${ticket.messages.map(message=>`<article class="message ${message.role}"><span>${message.role==='admin'?'FO':initials(ticket.user)}</span><div><b>${message.role==='admin'?'Admin':'User'}</b><p>${escape(message.text)}</p><small>${message.time}</small></div></article>`).join('')}</div><form id="ticket-reply" class="reply-box"><textarea name="reply" placeholder="Type your reply…"></textarea><button class="button primary" type="submit">Send</button></form></section>`;
}

async function logs() {
  const logs = await api.listLogs();
  const body = table(['Timestamp','Action node','Initiator','Status','Magnitude'], logs.map(item=>`<tr><td class="ref">${item.time}</td><td><b>${escape(item.event)}</b></td><td>${escape(item.actor)}</td><td>${status(item.level==='WARN'?'pending':'success')}</td><td>—</td></tr>`).join(''));
  return shell('System Chronology', 'Immutable audit trail of ecosystem activity and nodal events.', body);
}

function profile() {
  const body = `<section class="profile-layout"><article class="profile-card"><span class="profile-badge">FO</span><h2>Ferixas Operations</h2><p>ops@ferixas.com</p><dl><div><dt>Authority</dt><dd>Super Admin</dd></div><div><dt>Node status</dt><dd>${status('active')}</dd></div><div><dt>Last sync</dt><dd>Just now</dd></div></dl></article><article class="panel profile-form"><span class="eyebrow">PROFILE DETAILS</span><div class="form-grid"><label>Public identifier<input value="Ferixas Operations"/></label><label>Communication channel<input value="08012345678"/></label><label class="full">Authenticated email<input disabled value="ops@ferixas.com"/></label></div><button class="button primary" data-action="save-profile">Save changes</button></article></section><section class="panel security-form"><span class="eyebrow">SECURITY</span><div class="form-grid three-fields"><label>Current password<input type="password"/></label><label>New password<input type="password"/></label><label>Confirm password<input type="password"/></label></div><button class="button secondary" data-action="change-password">Update password</button></section>`;
  return Promise.resolve(shell('My Profile', 'Calibrate administrator identity and security credentials.', body));
}

const views = { dashboard, users, 'user-detail': userDetail, wallet, transactions, 'transaction-detail': transactionDetail, services, finance, settings, support, logs, profile };
async function render() { app.innerHTML = '<div class="loading-screen"><span class="loader"></span></div>'; app.innerHTML = await (views[state.view] || dashboard)(); bind(); }
function bind() {
  app.querySelectorAll('[data-nav]').forEach(button => button.addEventListener('click', () => { if (button.dataset.prefill) state.prefill = button.dataset.prefill; setView(button.dataset.nav); }));
  app.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => { state[`${button.dataset.tab}Tab`] = button.dataset.value; render(); }));
  app.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => act(button.dataset.action, button.dataset)));
  const search = app.querySelector('#global-search'); if (search) search.addEventListener('input', event => { state.search = event.target.value; if (['users','transactions'].includes(state.view)) render(); });
  app.querySelector('#credit-form')?.addEventListener('submit', submitWallet('credit'));
  app.querySelector('#debit-form')?.addEventListener('submit', submitWallet('debit'));
  app.querySelector('#ticket-reply')?.addEventListener('submit', async event => { event.preventDefault(); const message = new FormData(event.currentTarget).get('reply')?.trim(); if (!message) return toast('Reply required', 'Write a message before sending.', 'warn'); await api.replyTicket(state.selectedTicket, message); toast('Reply sent', 'The message has been added to this ticket.', 'good'); render(); });
}
function submitWallet(kind) { return async event => { event.preventDefault(); const form = new FormData(event.currentTarget); try { const user = kind==='credit' ? await api.creditWallet(form.get('userId'), form.get('amount'), form.get('note')) : await api.debitWallet(form.get('userId'), form.get('amount'), form.get('note')); toast(`Wallet ${kind}ed`, `${user.name} now has ${money(user.balance)}.`, kind==='credit'?'good':'warn'); render(); } catch (error) { toast('Wallet action failed', error.message || 'Try again.', 'warn'); } }; }
async function act(action, data) {
  if (action === 'mobile-menu') { state.sidebarOpen = true; render(); return; }
  if (action === 'close-sidebar') { state.sidebarOpen = false; render(); return; }
  if (action === 'open-user') { state.selectedUser = data.id; setView('user-detail'); return; }
  if (action === 'toggle-user') { const user=(await api.listUsers()).find(item=>item.id===data.id); await api.updateUser(data.id,{status:user.status==='active'?'inactive':'active'}); toast('Account updated', `${user.name} is now ${user.status==='active'?'suspended':'active'}.`, 'good'); render(); return; }
  if (action === 'transaction') { state.selectedTransaction = data.id; setView('transaction-detail'); return; }
  if (action === 'receipt') { const item=(await api.listTransactions()).find(row=>row.id===data.id); modal(`Receipt · ${item.reference}`, `<div class="receipt"><h3>${money(item.amount)}</h3><p>${escape(item.type)} for ${escape(item.user)}</p><dl class="detail-list"><div><dt>Reference</dt><dd>${item.reference}</dd></div><div><dt>Status</dt><dd>${status(item.status)}</dd></div><div><dt>Channel</dt><dd>${item.channel}</dd></div></dl></div>`, '<button class="button primary close-overlay">Download receipt</button>'); return; }
  if (action === 'deposit') { await api.updateDeposit(data.id,data.status); toast(`Deposit ${data.status}`, 'Funding request has been updated.', data.status==='approved'?'good':'warn'); render(); return; }
  if (action === 'fix-wallets') { toast('Repair complete', 'The simulation completed a wallet repair check.', 'good'); return; }
  if (action === 'service' || action === 'plan' || action === 'edit-airtime') { modal('Edit configuration', '<p class="modal-copy">This control remains inside the Services page. The live adapter will submit the existing service, plan, or airtime-network update.</p>', '<button class="button primary close-overlay">Save changes</button>'); return; }
  if (action === 'open-ticket') { state.selectedTicket=data.id; render(); return; }
  if (action === 'close-ticket') { state.selectedTicket=null; render(); return; }
  if (action === 'resolve-ticket') { await api.updateTicket(data.id,'resolved'); toast('Ticket resolved', 'The customer status update is simulated.', 'good'); render(); return; }
  if (action === 'create-announcement') { modal('Create announcement','<form id="announcement-form" class="compact-form"><label>Title<input name="title"/></label><label>Content<textarea name="content"></textarea></label></form>','<button class="button primary" id="publish-announcement">Create</button>'); document.querySelector('#publish-announcement').addEventListener('click',async()=>{const form=new FormData(document.querySelector('#announcement-form')); if(!form.get('title')||!form.get('content'))return toast('Missing fields','Title and content are required.','warn'); await api.createAnnouncement(Object.fromEntries(form)); document.querySelector('#overlay').remove(); toast('Announcement created','It is now visible in Support Center.','good'); render();}); return; }
  if (action === 'reconcile') { const reference=document.querySelector('#reconcile-ref')?.value?.trim(); if(!reference)return toast('Reference required','Enter a reference or transaction ID.','warn'); const result=await api.reconcile(reference); toast('Reconciliation complete',`${reference}: ${result.status}.`,result.status==='success'?'good':'warn'); return; }
  if (action === 'copy-webhook') { navigator.clipboard?.writeText('https://vtuapi.ferixas.com/api/webhooks/flutterwave'); toast('Copied','Webhook URL copied to clipboard.','good'); return; }
  if (action === 'save-settings' || action === 'save-profile' || action === 'change-password') { toast('Saved in prototype','The live adapter will use the corresponding existing endpoint.','good'); return; }
  if (action === 'create-user' || action === 'create-plan') { modal(action==='create-user'?'Enroll user':'Add configuration','<p class="modal-copy">This simulated form represents the current page action. It will call the matching create endpoint during integration.</p><div class="compact-form"><label>Name<input/></label><label>Email or identifier<input/></label></div>','<button class="button primary close-overlay">Save</button>'); return; }
  if (action === 'user-transactions') { state.search=''; setView('transactions'); return; }
  if (action === 'export') { toast('Export prepared','The live implementation will generate the matching CSV.','good'); return; }
  if (action === 'signout') { toast('Prototype session','This standalone preview does not use a live session.','warn'); }
}
render();
