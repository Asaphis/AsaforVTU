// Mock API for Gift Cards functionality
export const mockGiftCardsApi = {
  // Mock data
  brands: [
    { id: "amazon", name: "Amazon", logo: "Amazon", active: true, popular: true },
    { id: "apple", name: "Apple iTunes", logo: "Apple", active: true, popular: true },
    { id: "google", name: "Google Play", logo: "Google", active: true, popular: true },
    { id: "netflix", name: "Netflix", logo: "Netflix", active: true, popular: true },
    { id: "steam", name: "Steam", logo: "Steam", active: true, popular: false },
    { id: "spotify", name: "Spotify", logo: "Spotify", active: true, popular: false },
    { id: "xbox", name: "Xbox", logo: "Xbox", active: true, popular: false },
    { id: "playstation", name: "PlayStation", logo: "PlayStation", active: true, popular: false },
  ],

  countries: [
    { code: "US", name: "United States", flag: "US", currency: "USD" },
    { code: "UK", name: "United Kingdom", flag: "UK", currency: "GBP" },
    { code: "CA", name: "Canada", flag: "CA", currency: "CAD" },
    { code: "AU", name: "Australia", flag: "AU", currency: "AUD" },
    { code: "DE", name: "Germany", flag: "DE", currency: "EUR" },
    { code: "NG", name: "Nigeria", flag: "NG", currency: "NGN" },
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
      rateTimestamp: new Date().toISOString(),
      rateValidFor: 900, // 15 minutes in seconds
    };
  },

  async purchaseGiftCard(data: any) {
    await this.delay(1500);
    const giftCardCode = this.generateGiftCardCode();
    const totalNGN = data.denominationValue * 750 + 500;
    const gcTransactionId = this.generateGiftCardTransactionId("buy");
    const statusHistory = this.generateStatusHistory("buy");
    return {
      id: `TXN-${Date.now()}`,
      reference: `REF-${Date.now()}`,
      gcTransactionId,
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
      rate: 750,
      fee: 500,
      statusHistory,
      deliveryStatus: "Delivered",
      redemptionInstructions: "Use your gift card code at the brand's official website or app to redeem.",
    };
  },

  async sellGiftCard(data: any) {
    await this.delay(2000);
    const rate = 700;
    const totalNGN = data.cardValue * rate - 500;
    const gcTransactionId = this.generateGiftCardTransactionId("sell");
    const statusHistory = this.generateStatusHistory("sell");
    return {
      id: `TXN-${Date.now()}`,
      reference: `REF-${Date.now()}`,
      gcTransactionId,
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
      rate: 700,
      fee: 500,
      statusHistory,
      verificationStatus: "Pending",
      verificationSubmittedDate: new Date().toISOString(),
      estimatedPayout: totalNGN,
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

  generateGiftCardTransactionId(action: "buy" | "sell") {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let random = "";
    for (let i = 0; i < 5; i++) {
      random += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `GC-${action.toUpperCase()}-${dateStr}-${random}`;
  },

  generateStatusHistory(action: "buy" | "sell") {
    const now = new Date().toISOString();
    if (action === "buy") {
      return [
        { status: "Order Created", timestamp: now, completed: true },
        { status: "Payment Confirmed", timestamp: now, completed: true },
        { status: "Gift Card Requested", timestamp: now, completed: true },
        { status: "Gift Card Delivered", timestamp: now, completed: true },
        { status: "Completed", timestamp: now, completed: true },
      ];
    } else {
      return [
        { status: "Order Created", timestamp: now, completed: true },
        { status: "Payment Confirmed", timestamp: now, completed: true },
        { status: "Provider Request", timestamp: now, completed: true },
        { status: "Verification Pending", timestamp: now, completed: false },
      ];
    }
  },
};
