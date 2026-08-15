const wait = (ms = 180) => new Promise(resolve => setTimeout(resolve, ms));
const clone = value => JSON.parse(JSON.stringify(value));

const state = {
  users: [
    { id: 'USR-10482', name: 'Toller Adeyemi', username: 'toller', email: 'hussenitolani5@gmail.com', phone: '0703 242 0031', balance: 5000, status: 'active', verified: true, joined: '15 Aug 2026', transactions: 8, referralCode: '2D10DFB1', lastLogin: 'Today, 17:52' },
    { id: 'USR-10481', name: 'Hauwa Ibrahim', username: 'hauwa.i', email: 'hauwa@example.com', phone: '0806 410 2848', balance: 12450, status: 'active', verified: true, joined: '14 Aug 2026', transactions: 15, referralCode: 'H9K28P3Q', lastLogin: 'Today, 16:18' },
    { id: 'USR-10480', name: 'David O. Bello', username: 'dbello', email: 'david@example.com', phone: '0812 300 0918', balance: 0, status: 'suspended', verified: false, joined: '13 Aug 2026', transactions: 0, referralCode: 'E11B2C66', lastLogin: 'Yesterday' },
    { id: 'USR-10479', name: 'Ruth Akinola', username: 'ruth.a', email: 'ruth@example.com', phone: '0708 911 2010', balance: 2800, status: 'active', verified: true, joined: '12 Aug 2026', transactions: 5, referralCode: 'T43DM1P8', lastLogin: 'Yesterday' }
  ],
  transactions: [
    { id: 'TXN-8A4F1', user: 'Hauwa Ibrahim', type: 'Data purchase', amount: 1500, status: 'success', channel: 'MTN', time: '2 min ago', reference: 'WEB_20260815_001' },
    { id: 'TXN-7B2E9', user: 'Toller Adeyemi', type: 'Wallet credit', amount: 5000, status: 'success', channel: 'Admin credit', time: '14 min ago', reference: 'ADMIN_CREDIT_001' },
    { id: 'TXN-6C1Q8', user: 'Ruth Akinola', type: 'Electricity', amount: 2500, status: 'pending', channel: 'IKEDC', time: '22 min ago', reference: 'WEB_20260815_002' },
    { id: 'TXN-4R9N1', user: 'David O. Bello', type: 'Airtime', amount: 500, status: 'failed', channel: 'Airtel', time: '48 min ago', reference: 'WEB_20260815_003' }
  ],
  deposits: [
    { id: 'DEP-001', user: 'Toller Adeyemi', amount: 5000, method: 'Manual credit', status: 'approved', time: 'Today, 17:10' },
    { id: 'DEP-002', user: 'Hauwa Ibrahim', amount: 10000, method: 'Flutterwave', status: 'pending', time: 'Today, 16:50' },
    { id: 'DEP-003', user: 'Ruth Akinola', amount: 2500, method: 'Bank transfer', status: 'review', time: 'Today, 15:35' }
  ],
  tickets: [
    { id: 'SUP-4827', subject: 'Data purchase is pending', user: 'Ruth Akinola', status: 'open', priority: 'high', updated: '4 min ago', messages: [{ from: 'Ruth Akinola', role: 'customer', text: 'My data request has stayed pending for more than ten minutes.', time: '16:42' }] },
    { id: 'SUP-4826', subject: 'Wallet funding confirmation', user: 'Toller Adeyemi', status: 'in_progress', priority: 'normal', updated: '18 min ago', messages: [{ from: 'Toller Adeyemi', role: 'customer', text: 'Please confirm the manual wallet credit.', time: '16:28' }, { from: 'Operations', role: 'admin', text: 'The wallet credit has been confirmed and reflected.', time: '16:34' }] },
    { id: 'SUP-4825', subject: 'Referral reward question', user: 'Hauwa Ibrahim', status: 'resolved', priority: 'normal', updated: 'Yesterday', messages: [{ from: 'Hauwa Ibrahim', role: 'customer', text: 'When is the referral balance credited?', time: 'Yesterday' }] }
  ],
  services: [
    { id: 'SVC-01', name: 'Airtime', category: 'Top-up', state: 'active', plans: 4, margin: '3.5%', icon: '⌁' },
    { id: 'SVC-02', name: 'Data bundles', category: 'Data', state: 'active', plans: 18, margin: '5.0%', icon: '◫' },
    { id: 'SVC-03', name: 'Cable TV', category: 'Bills', state: 'active', plans: 9, margin: '4.2%', icon: '▣' },
    { id: 'SVC-04', name: 'Electricity', category: 'Bills', state: 'maintenance', plans: 11, margin: '3.0%', icon: 'ϟ' },
    { id: 'SVC-05', name: 'Exam PINs', category: 'Education', state: 'active', plans: 4, margin: '6.0%', icon: '▤' }
  ],
  plans: [
    { id: 'PLAN-01', service: 'Data bundles', network: 'MTN', name: '1GB / 30 Days', customerPrice: 500, providerPrice: 455, state: 'active' },
    { id: 'PLAN-02', service: 'Data bundles', network: 'Airtel', name: '2GB / 30 Days', customerPrice: 1000, providerPrice: 914, state: 'active' },
    { id: 'PLAN-03', service: 'Cable TV', network: 'DSTV', name: 'Compact', customerPrice: 15700, providerPrice: 15400, state: 'active' }
  ],
  announcements: [
    { id: 'ANN-01', title: 'Scheduled service update', content: 'Electricity vending will be briefly unavailable this evening.', audience: 'All users', state: 'published', created: 'Today' },
    { id: 'ANN-02', title: 'Data bundle improvements', content: 'New MTN data bundles are now available.', audience: 'All users', state: 'published', created: 'Yesterday' }
  ],
  notifications: [
    { id: 'NTF-01', title: 'Manual credit approved', body: 'Toller Adeyemi received ₦5,000.00.', type: 'wallet', time: '14 min ago', unread: true },
    { id: 'NTF-02', title: 'New priority ticket', body: 'SUP-4827 requires an operations response.', type: 'support', time: '4 min ago', unread: true },
    { id: 'NTF-03', title: 'Provider status changed', body: 'Electricity service entered maintenance mode.', type: 'system', time: '35 min ago', unread: false }
  ],
  admins: [{ name: 'Ferixas Operations', email: 'ops@ferixas.com', role: 'Super administrator', lastActive: 'Now' }, { name: 'Ayo Support', email: 'support@ferixas.com', role: 'Support administrator', lastActive: '1 hour ago' }],
  logs: [{ time: '17:48:05', level: 'INFO', event: 'Wallet credit approved', actor: 'ops@ferixas.com', entity: 'DEP-001' }, { time: '17:44:10', level: 'WARN', event: 'Provider reconciliation required', actor: 'System', entity: 'TXN-6C1Q8' }, { time: '17:38:22', level: 'INFO', event: 'Support ticket replied', actor: 'support@ferixas.com', entity: 'SUP-4826' }]
};

function addNotification(title, body, type = 'system') {
  state.notifications.unshift({ id: `NTF-${Date.now()}`, title, body, type, time: 'Just now', unread: true });
}

export const mockApi = {
  async getOverview() { await wait(); return { totalUsers: 1248, activeUsers: 1140, mainBalance: 2483900, todayVolume: 385400, successRate: 97.8, pendingDeposits: state.deposits.filter(d => d.status !== 'approved').length, recent: clone(state.transactions), alerts: clone(state.notifications) }; },
  async listUsers() { await wait(); return clone(state.users); },
  async listTransactions() { await wait(); return clone(state.transactions); },
  async listDeposits() { await wait(); return clone(state.deposits); },
  async listTickets() { await wait(); return clone(state.tickets); },
  async listServices() { await wait(); return clone(state.services); },
  async listPlans() { await wait(); return clone(state.plans); },
  async listAnnouncements() { await wait(); return clone(state.announcements); },
  async listNotifications() { await wait(70); return clone(state.notifications); },
  async listAdmins() { await wait(); return clone(state.admins); },
  async listLogs() { await wait(); return clone(state.logs); },
  async creditWallet(userId, amount, note) { await wait(); const user = state.users.find(item => item.id === userId); if (!user) throw new Error('User not found'); user.balance += Number(amount); state.transactions.unshift({ id: `TXN-${Date.now().toString(36).toUpperCase()}`, user: user.name, type: 'Wallet credit', amount: Number(amount), status: 'success', channel: 'Admin credit', time: 'Just now', reference: `ADMIN_${Date.now()}` }); addNotification('Wallet credit completed', `${user.name} received ₦${Number(amount).toLocaleString()}.`, 'wallet'); state.logs.unshift({ time: new Date().toLocaleTimeString(), level: 'INFO', event: note || 'Wallet credit approved', actor: 'Operations', entity: userId }); return clone(user); },
  async updateDeposit(id, status) { await wait(); const deposit = state.deposits.find(item => item.id === id); if (!deposit) throw new Error('Deposit not found'); deposit.status = status; addNotification(`Deposit ${status}`, `${deposit.id} for ${deposit.user} was ${status}.`, 'wallet'); return clone(deposit); },
  async replyTicket(id, text) { await wait(); const ticket = state.tickets.find(item => item.id === id); if (!ticket) throw new Error('Ticket not found'); ticket.messages.push({ from: 'Operations', role: 'admin', text, time: 'Just now' }); ticket.status = 'in_progress'; ticket.updated = 'Just now'; addNotification('Support reply sent', `${ticket.id} has a new operations response.`, 'support'); return clone(ticket); },
  async updateTicket(id, status) { await wait(); const ticket = state.tickets.find(item => item.id === id); ticket.status = status; ticket.updated = 'Just now'; addNotification('Ticket status updated', `${ticket.id} is now ${status}.`, 'support'); return clone(ticket); },
  async updateUser(id, patch) { await wait(); const user = state.users.find(item => item.id === id); Object.assign(user, patch); return clone(user); },
  async updateService(id, patch) { await wait(); const service = state.services.find(item => item.id === id); Object.assign(service, patch); addNotification('Service configuration updated', `${service.name} was updated.`, 'system'); return clone(service); },
  async createAnnouncement(payload) { await wait(); const item = { id: `ANN-${Date.now()}`, audience: 'All users', state: 'published', created: 'Just now', ...payload }; state.announcements.unshift(item); addNotification('Announcement published', item.title, 'system'); return clone(item); },
  async reconcile(reference) { await wait(500); const transaction = state.transactions.find(item => item.reference === reference || item.id === reference); if (transaction) transaction.status = 'success'; addNotification('Payment reconciled', `${reference} was checked against the provider.`, 'system'); return { reference, status: transaction?.status || 'not_found' }; },
  async markNotificationsRead() { await wait(60); state.notifications.forEach(item => item.unread = false); return clone(state.notifications); }
};

// Future live adapter keeps the same method names and return shapes:
// export const liveApi = { getOverview, listUsers, creditWallet, ... };
