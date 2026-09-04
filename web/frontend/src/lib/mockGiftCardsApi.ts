// Mock API for Gift Cards functionality
export const mockGiftCardsApi = {
  // Mock data
  brands: [
    { id: "amazon", name: "Amazon", logo: "📦", active: true, popular: true },
    { id: "apple", name: "Apple iTunes", logo: "🍎", active: true, popular: true },
    { id: "google", name: "Google Play", logo: "▶️", active: true, popular: true },
    { id: "netflix", name: "Netflix", logo: "🎬", active: true, popular: true },
    { id: "steam", name: "Steam", logo: "🎮", active: true, popular: false },
    { id: "spotify", name: "Spotify", logo: "🎵", active: true, popular: false },
    { id: "xbox", name: "Xbox", logo: "🎯", active: true, popular: false },
    { id: "playstation", name: "PlayStation", logo: "🎮", active: true, popular: false },
  ],

  countries: [
    { code: "US", name: "United States", flag: "🇺🇸", currency: "USD" },
    { code: "UK", name: "United Kingdom", flag: "🇬🇧", currency: "GBP" },
    { code: "CA", name: "Canada", flag: "🇨🇦", currency: "CAD" },
    { code: "AU", name: "Australia", flag: "🇦🇺", currency: "AUD" },
    { code: "DE", name: "Germany", flag: "🇩🇪", currency: "EUR" },
    { code: "NG", name: "Nigeria", flag: "🇳🇬", currency: "NGN" },
  ],

  cardTypes: [
    { id: "ecode", name: "E-code", requiresImages: false, requiresPin: false, requiresReceipt: false },
    { id: "physical", name: "Physical Card", requiresImages: true, requiresPin: true, requiresReceipt: true },
    { id: "receipt", name: "Receipt Only", requiresImages: true, requiresPin: false, requiresReceipt: true },
  ],

  denominations: [
    { value: 10, currency: "$", priceNGN: 7500 },
    { value: 25, currency: "$", priceNGN: 18750 },
    { value: 50, currency: "$", priceNGN: 37500 },
    { value: 100, currency: "$", priceNGN: 75000 },
    { value: 200, currency: "$", priceNGN: 150000 },
  ],

  // API functions
  async getBrands() {
    await this.delay(300);
    return this.brands;
  },

  async getCountries(brandId: string) {
    await this.delay(200);
    return this.countries;
  },

  async getCardTypes() {
    await this.delay(200);
    return this.cardTypes;
  },

  async getDenominations(brandId: string, countryCode: string) {
    await this.delay(200);
    return this.denominations;
  },

  async getRate(brandId: string, countryCode: string, action: "buy" | "sell") {
    await this.delay(300);
    const baseRate = action === "buy" ? 750 : 700;
    return {
      rate: baseRate,
      fee: 500,
    };
  },

  async purchaseGiftCard(data: any) {
    await this.delay(1500);
    const giftCardCode = this.generateGiftCardCode();
    const totalNGN = data.denominationValue * 750 + 500;
    return {
      id: `TXN-${Date.now()}`,
      reference: `REF-${Date.now()}`,
      giftCardCode,
      brandId: data.brandId,
      countryCode: data.countryCode,
      typeId: data.typeId,
      denominationValue: data.denominationValue,
      walletType: data.walletType,
      status: "success",
      createdAt: new Date().toISOString(),
      balanceBefore: data.balanceBefore || 0,
      balanceAfter: (data.balanceBefore || 0) - totalNGN,
      amount: totalNGN,
    };
  },

  async sellGiftCard(data: any) {
    await this.delay(2000);
    const rate = 700;
    const totalNGN = data.cardValue * rate - 500;
    return {
      id: `TXN-${Date.now()}`,
      reference: `REF-${Date.now()}`,
      brandId: data.brandId,
      countryCode: data.countryCode,
      typeId: data.typeId,
      cardValue: data.cardValue,
      cardCode: data.cardCode,
      status: "pending",
      totalNGN,
      createdAt: new Date().toISOString(),
      balanceBefore: data.balanceBefore || 0,
      balanceAfter: (data.balanceBefore || 0) + totalNGN,
      amount: totalNGN,
    };
  },

  async getTransactions() {
    await this.delay(300);
    return [];
  },

  async getTransaction(id: string) {
    await this.delay(200);
    return null;
  },

  // Helper functions
  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  generateGiftCardCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) code += "-";
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },
};
