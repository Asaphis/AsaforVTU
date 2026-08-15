const deepCopy = value => JSON.parse(JSON.stringify(value));
const delay = (ms = 180) => new Promise(resolve => setTimeout(resolve, ms));
const today = new Date('2026-08-15T12:00:00.000Z');
const date = (daysAgo, hours = 10) => new Date(today.getTime() - daysAgo * 86400000 + hours * 3600000).toISOString();

const state = {
  admin: { id: 'adm_01', name: 'Nadine Okafor', email: 'admin@ferixas.test', phone: '0803 555 0190', role: 'Super administrator', password: 'Admin@2026' },
  settings: { providerUrl: 'https://provider.ferixas.test/v1', apiKey: 'pk_live_••••••••••56F', secretKey: 'sk_live_••••••••••4A9', cashbackEnabled: true, referralBudget: 25000, webhook: 'https://vtuapi.ferixas.com/api/webhooks/flutterwave' },
  users: [
    { id: 'usr_10482', name: 'Tomi Adebayo', email: 'tomi.adebayo@example.com', phone: '0802 111 8492', joined: '12 Aug 2026', status: 'active', main: 24500, cashback: 180, referral: 620, verified: true },
    { id: 'usr_10481', name: 'Seyi Martins', email: 'seyi.martins@example.com', phone: '0803 303 4217', joined: '10 Aug 2026', status: 'active', main: 12850, cashback: 75, referral: 0, verified: true },
    { id: 'usr_10480', name: 'Amina Yusuf', email: 'amina.yusuf@example.com', phone: '0805 904 7621', joined: '08 Aug 2026', status: 'suspended', main: 0, cashback: 0, referral: 0, verified: false },
    { id: 'usr_10479', name: 'Favour Chukwu', email: 'favour.chukwu@example.com', phone: '0704 187 0201', joined: '03 Aug 2026', status: 'active', main: 6750, cashback: 210, referral: 175, verified: true },
    { id: 'usr_10478', name: 'Kelechi Nwosu', email: 'kelechi.nwosu@example.com', phone: '0814 500 0035', joined: '29 Jul 2026', status: 'active', main: 19600, cashback: 0, referral: 420, verified: true }
  ],
  transactions: [
    { id: 'TX-100284', reference: 'ASAF-DATA-100284', userId: 'usr_10482', type: 'Data purchase', service: 'MTN SME 10GB', amount: 3500, providerCost: 3180, smsCost: 8, status: 'success', channel: 'wallet', createdAt: date(0, 8), recipient: '08021118492' },
    { id: 'TX-100283', reference: 'DEP-100283', userId: 'usr_10481', type: 'Wallet funding', service: 'Flutterwave deposit', amount: 10000, providerCost: 0, smsCost: 0, status: 'success', channel: 'flutterwave', createdAt: date(0, 7), recipient: '' },
    { id: 'TX-100282', reference: 'ASAF-AIR-100282', userId: 'usr_10479', type: 'Airtime', service: 'Airtel airtime', amount: 1000, providerCost: 970, smsCost: 0, status: 'success', channel: 'wallet', createdAt: date(0, 6), recipient: '07041870201' },
    { id: 'TX-100281', reference: 'ASAF-ELE-100281', userId: 'usr_10480', type: 'Electricity', service: 'IKEDC prepaid', amount: 2500, providerCost: 2350, smsCost: 8, status: 'failed', channel: 'wallet', createdAt: date(0, 5), recipient: '45400199334', failureSource: 'provider', failureReason: 'Meter validation timeout' },
    { id: 'TX-100280', reference: 'ASAF-CAB-100280', userId: 'usr_10478', type: 'Cable TV', service: 'GOtv Jolli', amount: 3950, providerCost: 3690, smsCost: 8, status: 'success', channel: 'wallet', createdAt: date(1, 11), recipient: '4627085183' },
    { id: 'TX-100279', reference: 'DEP-100279', userId: 'usr_10482', type: 'Wallet funding', service: 'Manual credit', amount: 5000, providerCost: 0, smsCost: 0, status: 'success', channel: 'manual', createdAt: date(1, 9), recipient: '' },
    { id: 'TX-100278', reference: 'ASAF-DATA-100278', userId: 'usr_10481', type: 'Data purchase', service: 'Glo 5GB', amount: 1650, providerCost: 1480, smsCost: 8, status: 'success', channel: 'wallet', createdAt: date(2, 10), recipient: '08033034217' },
    { id: 'TX-100277', reference: 'ASAF-EXAM-100277', userId: 'usr_10479', type: 'Exam PIN', service: 'WAEC token', amount: 3750, providerCost: 3550, smsCost: 8, status: 'success', channel: 'wallet', createdAt: date(3, 12), recipient: '' },
    { id: 'TX-100276', reference: 'ASAF-AIR-100276', userId: 'usr_10482', type: 'Airtime', service: 'MTN airtime', amount: 500, providerCost: 482, smsCost: 0, status: 'success', channel: 'wallet', createdAt: date(5, 8), recipient: '08021118492' },
    { id: 'TX-100275', reference: 'ASAF-DATA-100275', userId: 'usr_10478', type: 'Data purchase', service: 'Airtel 15GB', amount: 5250, providerCost: 4880, smsCost: 8, status: 'pending', channel: 'wallet', createdAt: date(6, 9), recipient: '08145000035' },
    { id: 'TX-100274', reference: 'ASAF-CAB-100274', userId: 'usr_10481', type: 'Cable TV', service: 'DStv Compact', amount: 15700, providerCost: 15080, smsCost: 8, status: 'success', channel: 'wallet', createdAt: date(7, 10), recipient: '8572039661' },
    { id: 'TX-100273', reference: 'ASAF-AIR-100273', userId: 'usr_10479', type: 'Airtime', service: '9mobile airtime', amount: 2000, providerCost: 1940, smsCost: 0, status: 'success', channel: 'wallet', createdAt: date(10, 9), recipient: '07041870201' }
  ],
  funding: [
    { id: 'DEP-100286', userId: 'usr_10479', amount: 8500, method: 'Flutterwave', status: 'pending', createdAt: date(0, 9), reference: 'FLW-PLT-100286' },
    { id: 'DEP-100285', userId: 'usr_10481', amount: 3000, method: 'Bank transfer', status: 'review', createdAt: date(0, 8), reference: 'BANK-100285' },
    { id: 'DEP-100279', userId: 'usr_10482', amount: 5000, method: 'Manual credit', status: 'approved', createdAt: date(1, 9), reference: 'ADMIN-100279' }
  ],
  services: [
    { id: 'svc_air', name: 'Airtime', category: 'Airtime & Data', active: true },
    { id: 'svc_data', name: 'Data bundles', category: 'Airtime & Data', active: true },
    { id: 'svc_cable', name: 'Cable TV', category: 'Bills', active: true },
    { id: 'svc_power', name: 'Electricity', category: 'Bills', active: true },
    { id: 'svc_exam', name: 'Exam PINs', category: 'Education', active: true }
  ],
  networks: [
    { name: 'MTN', discount: 2, active: true }, { name: 'Airtel', discount: 2, active: true }, { name: 'Glo', discount: 1.5, active: true }, { name: '9mobile', discount: 1, active: false }
  ],
  plans: [
    { id: 'plan_001', group: 'data', network: 'MTN', name: 'SME 10GB', userPrice: 3500, apiPrice: 3180, active: true, variation: 'mtn-sme-10gb' },
    { id: 'plan_002', group: 'data', network: 'Glo', name: '5GB', userPrice: 1650, apiPrice: 1480, active: true, variation: 'glo-5gb' },
    { id: 'plan_003', group: 'data', network: 'Airtel', name: '15GB', userPrice: 5250, apiPrice: 4880, active: true, variation: 'airtel-15gb' },
    { id: 'plan_004', group: 'cable', network: 'GOtv', name: 'Jolli', userPrice: 3950, apiPrice: 3690, active: true, variation: 'gotv-jolli' },
    { id: 'plan_005', group: 'cable', network: 'DStv', name: 'Compact', userPrice: 15700, apiPrice: 15080, active: true, variation: 'dstv-compact' },
    { id: 'plan_006', group: 'power', network: 'IKEDC', name: 'Prepaid token', userPrice: 100, apiPrice: 0, active: true, variation: 'ikedc-prepaid' }
  ],
  tickets: [
    { id: 'SUP-10028', userId: 'usr_10482', subject: 'Data purchase pending', status: 'open', updatedAt: date(0, 8), messages: [{ id: 'msg1', author: 'customer', text: 'My MTN data request has been pending for over ten minutes.', createdAt: date(0, 8) }] },
    { id: 'SUP-10027', userId: 'usr_10481', subject: 'Wallet funding confirmation', status: 'in_progress', updatedAt: date(0, 7), messages: [{ id: 'msg2', author: 'customer', text: 'Please confirm my bank transfer.', createdAt: date(0, 7) }, { id: 'msg3', author: 'admin', text: 'We are reviewing the transaction reference.', createdAt: date(0, 7) }] },
    { id: 'SUP-10026', userId: 'usr_10479', subject: 'Referral reward question', status: 'resolved', updatedAt: date(2, 9), messages: [{ id: 'msg4', author: 'customer', text: 'When will the referral reward be added?', createdAt: date(2, 9) }] }
  ],
  announcements: [
    { id: 'ANN-02', title: 'MTN maintenance window', content: 'Data delivery may take longer between 23:00 and 00:15.', type: 'warning', createdAt: date(0, 6) },
    { id: 'ANN-01', title: 'Cashback campaign', content: 'Cashback is active on eligible data bundles.', type: 'info', createdAt: date(3, 8) }
  ],
  admins: [{ id: 'adm_01', name: 'Nadine Okafor', email: 'admin@ferixas.test', role: 'Super administrator', status: 'active' }, { id: 'adm_02', name: 'Ola Mensah', email: 'ops@ferixas.test', role: 'Operations', status: 'active' }],
  audit: [
    { id: 'AUD-01', action: 'Payment reconciliation', actor: 'Nadine Okafor', detail: 'DEP-100279 verified and credited', createdAt: date(0, 7), level: 'success' },
    { id: 'AUD-02', action: 'Wallet request', actor: 'Ola Mensah', detail: 'DEP-100285 marked for review', createdAt: date(0, 8), level: 'warning' },
    { id: 'AUD-03', action: 'Service setting', actor: 'Nadine Okafor', detail: '9mobile availability disabled', createdAt: date(1, 8), level: 'success' }
  ]
};

const sessionKey = 'ferixas-admin-simulator-session';
const userFor = id => state.users.find(item => item.id === id);
const log = (action, detail, level = 'success') => state.audit.unshift({ id: `AUD-${Date.now().toString(36).toUpperCase()}`, action, actor: state.admin.name, detail, createdAt: new Date().toISOString(), level });
const newId = prefix => `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
const isSuccess = tx => tx.status === 'success';
const moneyMetrics = transactions => {
  const valid = transactions.filter(isSuccess);
  const deposits = valid.reduce((sum, tx) => sum + tx.amount, 0);
  const providerCost = valid.reduce((sum, tx) => sum + tx.providerCost, 0);
  const smsCost = valid.reduce((sum, tx) => sum + tx.smsCost, 0);
  return { deposits, providerCost, smsCost, netProfit: deposits - providerCost - smsCost, transactionCount: valid.length };
};
const byRange = (transactions, range) => {
  if (range === 'day') return transactions.filter(tx => new Date(tx.createdAt).toDateString() === today.toDateString());
  if (range === 'week') return transactions.filter(tx => new Date(tx.createdAt) >= new Date(today.getTime() - 6 * 86400000));
  if (range === 'month') return transactions.filter(tx => new Date(tx.createdAt).getMonth() === today.getMonth());
  return transactions;
};

export const mockApi = {
  async login(email, password) { await delay(350); if (email.toLowerCase() !== state.admin.email || password !== state.admin.password) throw new Error('Use the simulator administrator credentials shown below the form.'); const session = { id: state.admin.id, name: state.admin.name, email: state.admin.email, role: state.admin.role, signedInAt: new Date().toISOString() }; localStorage.setItem(sessionKey, JSON.stringify(session)); log('Administrator sign-in', `${state.admin.email} started a simulator session`); return deepCopy(session); },
  getSession() { try { return JSON.parse(localStorage.getItem(sessionKey) || 'null'); } catch { return null; } },
  async logout() { await delay(120); localStorage.removeItem(sessionKey); },
  async getDashboard() { await delay(); const all = state.transactions; const successful = all.filter(isSuccess); const wallet = state.users.reduce((sum, user) => sum + user.main, 0); const todayMetrics = moneyMetrics(byRange(all, 'day')); const days = Array.from({ length: 7 }, (_, index) => { const d = new Date(today.getTime() - (6 - index) * 86400000); return { label: d.toLocaleDateString('en-US', { weekday: 'short' }), value: moneyMetrics(all.filter(tx => new Date(tx.createdAt).toDateString() === d.toDateString())).deposits }; }); return deepCopy({ totalUsers: state.users.length, wallet, totalTransactions: all.length, todaySales: todayMetrics.deposits, successRate: Math.round(successful.length / all.length * 1000) / 10, days, recent: [...all].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,6), pendingFunding: state.funding.filter(item=>['pending','review'].includes(item.status)).length, openTickets: state.tickets.filter(item=>item.status!=='resolved').length }); },
  async listUsers() { await delay(); return deepCopy(state.users); },
  async getUser(id) { await delay(); const user = userFor(id); if (!user) throw new Error('Customer not found'); const transactions = state.transactions.filter(tx=>tx.userId===id); const finance = moneyMetrics(transactions); const risk = { providerBalanceRequired: finance.providerCost, smsCost: finance.smsCost, expectedProfit: finance.netProfit }; return deepCopy({ ...user, transactions, finance, risk }); },
  async createUser(input) { await delay(); const user = { id: `usr_${Math.floor(Math.random()*90000+10000)}`, name: input.name, email: input.email, phone: input.phone || 'Not set', joined: 'Today', status: 'active', main: 0, cashback: 0, referral: 0, verified: false }; state.users.unshift(user); log('Customer created', `${user.email} was enrolled`); return deepCopy(user); },
  async setUserStatus(id, active) { await delay(); const user = userFor(id); user.status = active ? 'active' : 'suspended'; log(active ? 'Customer restored' : 'Customer suspended', user.email, active ? 'success' : 'warning'); return deepCopy(user); },
  async issueVerification(id) { await delay(); const user = userFor(id); user.verified = true; log('Verification link issued', user.email); return { success: true, link: `https://simulator.ferixas.test/verify/${id}` }; },
  async resetUserPassword(id) { await delay(); const user = userFor(id); log('Customer password reset', user.email, 'warning'); return { success: true }; },
  async listFunding() { await delay(); return deepCopy(state.funding.map(item=>({ ...item, user: userFor(item.userId) }))); },
  async decideFunding(id, decision) { await delay(); const request = state.funding.find(item=>item.id===id); if (!request) throw new Error('Funding request not found'); if (!['pending','review'].includes(request.status)) throw new Error('This request has already been reviewed'); request.status = decision; if (decision === 'approved') { const user = userFor(request.userId); user.main += request.amount; state.transactions.unshift({ id: newId('TX'), reference: request.reference, userId: user.id, type: 'Wallet funding', service: request.method, amount: request.amount, providerCost: 0, smsCost: 0, status: 'success', channel: request.method.toLowerCase(), createdAt: new Date().toISOString(), recipient: '' }); } log('Wallet funding request', `${id} ${decision}`, decision === 'approved' ? 'success' : 'warning'); return deepCopy(request); },
  async adjustWallet(input) { await delay(); const user = userFor(input.userId); if (!user) throw new Error('Customer not found'); const key = input.walletType || 'main'; const field = key === 'cashback' ? 'cashback' : key === 'referral' ? 'referral' : 'main'; const value = Number(input.amount); if (!value || value <= 0) throw new Error('Enter a valid amount'); if (input.action === 'debit' && user[field] < value) throw new Error('Debit amount exceeds available balance'); user[field] += input.action === 'credit' ? value : -value; const transaction = { id: newId('TX'), reference: `${input.action === 'credit' ? 'CR' : 'DR'}-${Date.now()}`, userId: user.id, type: `Wallet ${input.action}`, service: `${field} wallet adjustment`, amount: value, providerCost: 0, smsCost: 0, status: 'success', channel: 'admin', createdAt: new Date().toISOString(), recipient: '' }; state.transactions.unshift(transaction); log(`Wallet ${input.action}`, `${user.email} · ${field} wallet · ₦${value.toLocaleString()}`); return deepCopy({ user, transaction }); },
  async ghostWalletRepair(dryRun) { await delay(300); const count = 2; if (!dryRun) log('Ghost wallet repair', `${count} wallet mapping(s) repaired`); return { dryRun, candidates: count, repaired: dryRun ? 0 : count }; },
  async listTransactions(filters = {}) { await delay(); let rows = [...state.transactions]; if (filters.userId) rows = rows.filter(tx=>tx.userId===filters.userId); if (filters.status && filters.status !== 'all') rows = rows.filter(tx=>tx.status===filters.status); if (filters.type && filters.type !== 'all') rows = rows.filter(tx=>tx.type===filters.type); if (filters.search) { const q = filters.search.toLowerCase(); rows = rows.filter(tx => `${tx.id} ${tx.reference} ${tx.type} ${tx.service} ${userFor(tx.userId)?.name}`.toLowerCase().includes(q)); } return deepCopy(rows.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(tx=>({ ...tx, user: userFor(tx.userId) }))); },
  async getTransaction(id) { await delay(); const tx = state.transactions.find(item=>item.id===id); if (!tx) throw new Error('Transaction not found'); return deepCopy({ ...tx, user: userFor(tx.userId), providerRaw: { reference: tx.reference, source: 'simulated-provider', status: tx.status, timestamp: tx.createdAt } }); },
  async listServices() { await delay(); return deepCopy(state.services); },
  async updateService(id, patch) { await delay(); const service = state.services.find(item=>item.id===id); Object.assign(service, patch); log('Service configuration updated', `${service.name} updated`); return deepCopy(service); },
  async createService(input) { await delay(); const service = { id: `svc_${Math.random().toString(36).slice(2, 7)}`, name: input.name, category: input.category, active: true }; state.services.push(service); log('Service category created', `${service.name} was added to ${service.category}`); return deepCopy(service); },
  async listNetworks() { await delay(); return deepCopy(state.networks); },
  async updateNetwork(name, patch) { await delay(); const network = state.networks.find(item=>item.name===name); Object.assign(network, patch); log('Airtime network updated', `${name} configuration changed`); return deepCopy(network); },
  async listPlans(group) { await delay(); return deepCopy(group ? state.plans.filter(item=>item.group===group) : state.plans); },
  async updatePlan(id, patch) { await delay(); const plan = state.plans.find(item=>item.id===id); Object.assign(plan, patch); log('Service plan updated', `${plan.network} ${plan.name}`); return deepCopy(plan); },
  async createPlan(input) { await delay(); const plan = { id: newId('PLAN'), group: input.group, network: input.network, name: input.name, userPrice: Number(input.userPrice), apiPrice: Number(input.apiPrice), active: true, variation: input.variation || 'manual-plan' }; state.plans.unshift(plan); log('Service plan created', `${plan.network} ${plan.name}`); return deepCopy(plan); },
  async syncPlans(group) { await delay(320); log('Provider plan synchronisation', `${group || 'all'} plans synchronised`); return { success: true, synced: group === 'data' ? 12 : 4 }; },
  async getFinance(filters = {}) { await delay(); let rows = [...state.transactions]; const selectedUser = filters.userId ? userFor(filters.userId) : null; if (filters.userId) rows = rows.filter(tx=>tx.userId===filters.userId); const range = filters.range || 'month'; rows = byRange(rows, range); const totals = moneyMetrics(rows); const allRows = filters.userId ? state.transactions.filter(tx=>tx.userId===filters.userId) : state.transactions; const cumulative = moneyMetrics(allRows); const wallet = filters.userId ? selectedUser.main : state.users.reduce((sum,user)=>sum+user.main,0); const activePlans = state.plans.filter(plan=>plan.active); const capacity = activePlans.map(plan=>({ service: `${plan.network} ${plan.name}`, apiPrice: plan.apiPrice, capacity: plan.apiPrice ? Math.floor(wallet / plan.apiPrice) : 0 })); const period = ['day','week','month'].map(rangeName=>({ label: rangeName, ...moneyMetrics(byRange(allRows,rangeName)) })); const dateSeries = Array.from({length: 7},(_,idx)=>{ const d=new Date(today.getTime()-(6-idx)*86400000); const summary=moneyMetrics(allRows.filter(tx=>new Date(tx.createdAt).toDateString()===d.toDateString())); return { label:d.toLocaleDateString('en-US',{weekday:'short'}), value:summary.netProfit, gross:summary.deposits }; }); return deepCopy({ scope: selectedUser ? 'customer' : 'system', user: selectedUser, walletBalance: wallet, providerBalanceRequired: cumulative.providerCost, totalWalletBalance: state.users.reduce((sum,user)=>sum+user.main,0), totals, period, transactions: rows.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(tx=>({ ...tx, user: userFor(tx.userId), net: tx.amount-tx.providerCost-tx.smsCost })), capacity, dateSeries, customerFinance: selectedUser ? { walletBalance: selectedUser.main, totalDeposited: cumulative.deposits, totalSpent: cumulative.deposits, totalProviderCost: cumulative.providerCost, totalSmsCost: cumulative.smsCost, netProfit: cumulative.netProfit, risk: { providerBalanceRequired:cumulative.providerCost, smsCost:cumulative.smsCost, expectedProfit:cumulative.netProfit } } : null }); },
  async listTickets() { await delay(); return deepCopy(state.tickets.map(ticket=>({ ...ticket, user:userFor(ticket.userId) }))); },
  async replyTicket(id, message) { await delay(); const ticket=state.tickets.find(item=>item.id===id); ticket.messages.push({id:newId('MSG'), author:'admin', text:message, createdAt:new Date().toISOString()}); ticket.status='in_progress'; ticket.updatedAt=new Date().toISOString(); log('Support reply', `${ticket.id} replied`); return deepCopy(ticket); },
  async updateTicket(id,status) { await delay(); const ticket=state.tickets.find(item=>item.id===id); ticket.status=status; ticket.updatedAt=new Date().toISOString(); log('Support ticket updated', `${ticket.id} marked ${status}`); return deepCopy(ticket); },
  async deleteTicket(id) { await delay(); const ticket = state.tickets.find(item => item.id === id); if (!ticket) throw new Error('Ticket not found'); state.tickets = state.tickets.filter(item => item.id !== id); log('Support ticket deleted', `${id} removed by administrator`, 'warning'); return { success: true, id }; },
  async listAnnouncements() { await delay(); return deepCopy(state.announcements); },
  async createAnnouncement(input) { await delay(); const announcement={id:newId('ANN'),title:input.title,content:input.content,type:input.type||'info',createdAt:new Date().toISOString()}; state.announcements.unshift(announcement); log('Broadcast created', announcement.title); return deepCopy(announcement); },
  async deleteAnnouncement(id) { await delay(); state.announcements=state.announcements.filter(item=>item.id!==id); log('Broadcast deleted', id, 'warning'); },
  async getSettings() { await delay(); return deepCopy(state.settings); },
  async updateSettings(patch) { await delay(); Object.assign(state.settings,patch); log('Platform settings updated','Provider, referral or cashback configuration changed'); return deepCopy(state.settings); },
  async reconcile(reference,force=false) { await delay(350); const tx=state.transactions.find(item=>item.reference===reference || item.id===reference); if (!tx) return { success:false,message:'No matching payment reference was found.' }; if (tx.status==='success'&&!force) return { success:false,message:'This payment has already been reconciled.' }; tx.status='success'; log('Payment reconciled', `${reference} marked successful`); return { success:true,message:'Payment status confirmed and wallet path reconciled.',transaction:deepCopy(tx) }; },
  async listAdmins() { await delay(); return deepCopy(state.admins); },
  async createAdmin(input) { await delay(); const admin={id:newId('ADM'),name:input.name,email:input.email,role:input.role||'Operations',status:'active'}; state.admins.push(admin); log('Administrator created',admin.email); return deepCopy(admin); },
  async listAudit() { await delay(); return deepCopy([...state.audit].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))); },
  async updateProfile(patch) { await delay(); Object.assign(state.admin,patch); state.admins[0].name=state.admin.name; log('Administrator profile updated',state.admin.email); return deepCopy(state.admin); },
  async changePassword(currentPassword,newPassword) { await delay(); if(currentPassword!==state.admin.password) throw new Error('Current password is not correct.'); if(newPassword.length<8) throw new Error('New password must contain at least eight characters.'); state.admin.password=newPassword; log('Administrator password changed',state.admin.email,'warning'); return {success:true}; },
  demoCredentials: { email: 'admin@ferixas.test', password: 'Admin@2026' }
};
