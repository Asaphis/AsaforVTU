// MOCK API FOR GIFT CARDS - TEMPORARY FOR ADMIN TESTING
// This file will be deleted once real backend integration is ready

let giftCardBrands = [
  { id: 'amazon', name: 'Amazon', buyRate: 0.95, sellRate: 0.85, active: true, denominations: [1000, 2000, 5000, 10000, 20000, 50000] },
  { id: 'itunes', name: 'iTunes', buyRate: 0.92, sellRate: 0.82, active: true, denominations: [1000, 2000, 5000, 10000, 20000] },
  { id: 'googleplay', name: 'Google Play', buyRate: 0.90, sellRate: 0.80, active: false, denominations: [1000, 2000, 5000, 10000] },
  { id: 'steam', name: 'Steam', buyRate: 0.88, sellRate: 0.78, active: false, denominations: [1000, 2000, 5000, 10000, 20000] }
];

let giftCardTransactions = [
  { id: 'GC-B001', reference: 'GC-B001', type: 'buy', brand: 'Amazon', country: 'US', cardType: 'E-Code', cardCurrency: 'USD', cardValue: 100, rate: 945, fee: 0, totalNGN: 94500, status: 'completed', provider: 'Sogo', providerTxId: 'SG-789123', userId: 'user-001', userName: 'User A', createdAt: '2026-09-04T08:30:00Z', giftCardCode: 'AMZN-US-100-123456' },
  { id: 'GC-B002', reference: 'GC-B002', type: 'buy', brand: 'Apple', country: 'US', cardType: 'E-Code', cardCurrency: 'USD', cardValue: 50, rate: 960, fee: 0, totalNGN: 48000, status: 'processing', provider: 'Prestmit', providerTxId: 'PM-456789', userId: 'user-002', userName: 'User B', createdAt: '2026-09-04T09:15:00Z', giftCardCode: null },
  { id: 'GC-S001', reference: 'GC-S001', type: 'sell', brand: 'Amazon', country: 'US', cardType: 'Physical Card', cardCurrency: 'USD', cardValue: 100, rate: 1450, fee: 500, totalNGN: 145000, status: 'verifying', provider: 'Sogo', providerTxId: 'SG-999888', userId: 'user-003', userName: 'User C', createdAt: '2026-09-04T07:45:00Z', giftCardCode: null },
  { id: 'GC-S002', reference: 'GC-S002', type: 'sell', brand: 'Apple', country: 'US', cardType: 'E-Code', cardCurrency: 'USD', cardValue: 50, rate: 1420, fee: 500, totalNGN: 71000, status: 'completed', provider: 'Prestmit', providerTxId: 'PM-777666', userId: 'user-004', userName: 'User D', createdAt: '2026-09-04T06:20:00Z', giftCardCode: null },
  { id: 'GC-S003', reference: 'GC-S003', type: 'sell', brand: 'Steam', country: 'US', cardType: 'E-Code', cardCurrency: 'USD', cardValue: 100, rate: 1300, fee: 500, totalNGN: 130000, status: 'rejected', provider: 'NPay', providerTxId: 'NP-555444', userId: 'user-005', userName: 'User E', createdAt: '2026-09-04T05:10:00Z', giftCardCode: null }
];

let giftCardProviders = [
  { id: 'sogo', name: 'Sogo', status: 'active', environment: 'production', lastResponse: '2s ago', lastRateSync: '1m ago', supportedProducts: 248, apiKey: 'sk_live_xxx' },
  { id: 'prestmit', name: 'Prestmit', status: 'active', environment: 'production', lastResponse: '3s ago', lastRateSync: '2m ago', supportedProducts: 186, apiKey: 'pk_live_xxx' },
  { id: 'npay', name: 'NPay', status: 'active', environment: 'production', lastResponse: '5s ago', lastRateSync: '5m ago', supportedProducts: 142, apiKey: 'ak_live_xxx' }
];

let giftCardSettlements = [
  { id: 'SET-001', provider: 'Sogo', period: 'Sep 1-4, 2026', txCount: 248, totalCardValue: 42500, providerSettlement: 61800000, platformPayout: 60200000, grossDifference: 1600000, status: 'settled' },
  { id: 'SET-002', provider: 'Prestmit', period: 'Sep 1-4, 2026', txCount: 156, totalCardValue: 28000, providerSettlement: 40320000, platformPayout: 39480000, grossDifference: 840000, status: 'pending' }
];

let giftCardRates = [
  { id: 'rate-001', brand: 'Amazon', country: 'US', cardType: 'E-Code', providerRate: 1500, customerRate: 1450, margin: 50, marginType: 'fixed' },
  { id: 'rate-002', brand: 'Apple', country: 'US', cardType: 'E-Code', providerRate: 1480, customerRate: 1430, margin: 50, marginType: 'fixed' },
  { id: 'rate-003', brand: 'Steam', country: 'US', cardType: 'E-Code', providerRate: 1350, customerRate: 1300, margin: 50, marginType: 'fixed' },
  { id: 'rate-004', brand: 'Google Play', country: 'US', cardType: 'E-Code', providerRate: 1400, customerRate: 1350, margin: 50, marginType: 'fixed' }
];

export const mockGiftCardsApi = {
  getBrands: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return giftCardBrands;
  },

  getBrand: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return giftCardBrands.find(b => b.id === id) || null;
  },

  addBrand: async (brand) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const newBrand = {
      ...brand,
      id: brand.name.toLowerCase().replace(/\s+/g, '')
    };
    giftCardBrands.push(newBrand);
    return newBrand;
  },

  updateBrand: async (id, updates) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const index = giftCardBrands.findIndex(b => b.id === id);
    if (index === -1) return null;
    giftCardBrands[index] = { ...giftCardBrands[index], ...updates };
    return giftCardBrands[index];
  },

  deleteBrand: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const index = giftCardBrands.findIndex(b => b.id === id);
    if (index === -1) return false;
    giftCardBrands.splice(index, 1);
    return true;
  },

  toggleBrand: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const brand = giftCardBrands.find(b => b.id === id);
    if (!brand) return null;
    brand.active = !brand.active;
    return brand;
  },

  getTransactions: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return giftCardTransactions;
  },

  getTransaction: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return giftCardTransactions.find(t => t.id === id) || null;
  },

  getProviders: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return giftCardProviders;
  },

  getProvider: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return giftCardProviders.find(p => p.id === id) || null;
  },

  getSettlements: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return giftCardSettlements;
  },

  getRates: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return giftCardRates;
  },

  getRate: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return giftCardRates.find(r => r.id === id) || null;
  }
};
