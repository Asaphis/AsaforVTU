// Gift Cards Component - Buy and Sell flows with mock data
import { useState, useEffect } from "react";
import { Gift, CreditCard, ChevronRight, ChevronDown, X, CheckCircle2 } from "lucide-react";
import { mockGiftCardsApi } from "../lib/mockGiftCardsApi";

const money = (value: number) => `₦${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Inline components (not exported from CustomerApp)
function Button({ children, onClick, type = "button", variant = "primary", disabled = false }: { children: any; onClick?: () => void; type?: "button" | "submit"; variant?: "primary" | "line" | "text" | "danger"; disabled?: boolean }) {
  return <button className={`asf-btn asf-btn--${variant}`} type={type} disabled={disabled} onClick={onClick}>{children}</button>;
}

function Field({ label, children, note }: { label: string; children: any; note?: string }) {
  return <label className="form-field"><b>{label}</b>{children}{note && <small>{note}</small>}</label>;
}

function Tag({ children, kind = "ok" }: { children: any; kind?: "ok" | "soft" | "warning" }) {
  return <span className={`asf-tag asf-tag--${kind}`}><i/>{children}</span>;
}

interface GiftCardsProps {
  nav: (path: string) => void;
  wallet: { main: number; cashback: number; referral: number };
}

export function GiftCards({ nav, wallet }: GiftCardsProps) {
  const [action, setAction] = useState<"buy" | "sell" | null>(null);
  const [step, setStep] = useState(1);
  const [brands, setBrands] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [cardTypes, setCardTypes] = useState<any[]>([]);
  const [denominations, setDenominations] = useState<any[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedDenomination, setSelectedDenomination] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [walletType, setWalletType] = useState("main");
  const [cardCode, setCardCode] = useState("");
  const [cardPin, setCardPin] = useState("");
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [transaction, setTransaction] = useState<any>(null);
  const [rateInfo, setRateInfo] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const actionParam = params.get("action");
    if (actionParam === "buy" || actionParam === "sell") setAction(actionParam as "buy" | "sell");
  }, []);

  useEffect(() => {
    if (action) {
      mockGiftCardsApi.getBrands().then(setBrands).catch(console.error);
      mockGiftCardsApi.getCardTypes().then(setCardTypes).catch(console.error);
    }
  }, [action]);

  useEffect(() => {
    if (selectedBrand) {
      mockGiftCardsApi.getCountries(selectedBrand).then(setCountries).catch(console.error);
    }
  }, [selectedBrand]);

  useEffect(() => {
    if (selectedBrand && selectedCountry) {
      mockGiftCardsApi.getDenominations(selectedBrand, selectedCountry).then(setDenominations).catch(console.error);
      mockGiftCardsApi.getRate(selectedBrand, selectedCountry, action || "buy").then(setRateInfo).catch(console.error);
    }
  }, [selectedBrand, selectedCountry, action]);

  const reset = () => {
    setStep(1);
    setSelectedBrand("");
    setSelectedCountry("");
    setSelectedType("");
    setSelectedDenomination("");
    setCustomAmount("");
    setWalletType("main");
    setCardCode("");
    setCardPin("");
    setFrontImage(null);
    setBackImage(null);
    setReceiptImage(null);
    setError("");
    setTransaction(null);
    setRateInfo(null);
    setSuccessMessage("");
  };

  const filteredBrands = brands.filter((b) => b.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.popular);

  // Step 1: Choose action
  if (!action) {
    return (
      <div className="page">
        <div className="page-heading">
          <span className="eyebrow">GIFT CARDS</span>
          <h2>Choose an action</h2>
          <p>Buy gift cards with your wallet or sell gift cards for wallet balance.</p>
        </div>
        <section className="service-catalogue">
          <button className="service-catalogue-card" onClick={() => setAction("buy")}>
            <span className="service-symbol gift-cards"><Gift /></span>
            <div>
              <b>Buy Gift Cards</b>
              <p>Purchase gift cards with your wallet balance</p>
              <small>Available now</small>
            </div>
            <ChevronRight />
          </button>
          <button className="service-catalogue-card" onClick={() => setAction("sell")}>
            <span className="service-symbol gift-cards"><CreditCard /></span>
            <div>
              <b>Sell Gift Cards</b>
              <p>Exchange gift cards for wallet balance</p>
              <small>Available now</small>
            </div>
            <ChevronRight />
          </button>
        </section>
      </div>
    );
  }

  // Step 2: Select brand
  if (step === 1) {
    return (
      <div className="page">
        <button className="back-link" onClick={() => { reset(); setAction(null); }}>← Back</button>
        <div className="page-heading">
          <span className="eyebrow">GIFT CARDS / {action.toUpperCase()}</span>
          <h2>Select Gift Card</h2>
          <p>Choose the gift card brand you want to {action}.</p>
        </div>
        <input 
          className="search-input" 
          value={searchQuery} 
          onChange={e => setSearchQuery(e.target.value)} 
          placeholder="Search brands..." 
        />
        <section className="service-catalogue">
          {filteredBrands.map((brand) => (
            <button 
              key={brand.id} 
              className={`service-catalogue-card ${selectedBrand === brand.id ? "selected" : ""}`}
              onClick={() => { setSelectedBrand(brand.id); setStep(2); }}
            >
              <span className="service-symbol gift-cards">{brand.logo}</span>
              <div>
                <b>{brand.name}</b>
                <small>{brand.active ? "Available" : "Unavailable"}</small>
              </div>
              <ChevronRight />
            </button>
          ))}
        </section>
      </div>
    );
  }

  // Step 3: Select country
  if (step === 2) {
    return (
      <div className="page">
        <button className="back-link" onClick={() => setStep(1)}>← Back</button>
        <div className="page-heading">
          <span className="eyebrow">GIFT CARDS / {action.toUpperCase()}</span>
          <h2>Select Country</h2>
          <p>Choose the country/region for your gift card.</p>
        </div>
        <section className="service-catalogue">
          {countries.map((country) => (
            <button 
              key={country.code} 
              className={`service-catalogue-card ${selectedCountry === country.code ? "selected" : ""}`}
              onClick={() => { setSelectedCountry(country.code); setStep(3); }}
            >
              <span className="service-symbol gift-cards">{country.flag}</span>
              <div>
                <b>{country.name}</b>
                <small>{country.currency}</small>
              </div>
              <ChevronRight />
            </button>
          ))}
        </section>
      </div>
    );
  }

  // Step 4: Select card type
  if (step === 3) {
    return (
      <div className="page">
        <button className="back-link" onClick={() => setStep(2)}>← Back</button>
        <div className="page-heading">
          <span className="eyebrow">GIFT CARDS / {action.toUpperCase()}</span>
          <h2>Select Card Type</h2>
          <p>Choose the type of gift card.</p>
        </div>
        <section className="service-catalogue">
          {cardTypes.map((type) => (
            <button 
              key={type.id} 
              className={`service-catalogue-card ${selectedType === type.id ? "selected" : ""}`}
              onClick={() => { setSelectedType(type.id); setStep(4); }}
            >
              <div>
                <b>{type.name}</b>
                <small>{type.requiresImages ? "Requires images" : "E-code only"}</small>
              </div>
              <ChevronRight />
            </button>
          ))}
        </section>
      </div>
    );
  }

  // Step 5: Enter amount
  if (step === 4) {
    return (
      <div className="page">
        <button className="back-link" onClick={() => setStep(3)}>← Back</button>
        <div className="page-heading">
          <span className="eyebrow">GIFT CARDS / {action.toUpperCase()}</span>
          <h2>{action === "buy" ? "Select Amount" : "Enter Card Value"}</h2>
          <p>{action === "buy" ? "Choose a denomination or enter custom amount." : "Enter the value of your gift card."}</p>
        </div>
        {action === "buy" ? (
          <>
            <section className="service-catalogue">
              {denominations.map((denom) => (
                <button 
                  key={denom.value} 
                  className={`service-catalogue-card ${selectedDenomination === String(denom.value) ? "selected" : ""}`}
                  onClick={() => { setSelectedDenomination(String(denom.value)); setCustomAmount(""); }}
                >
                  <div>
                    <b>{denom.currency}{denom.value}</b>
                    <small>{money(denom.priceNGN)}</small>
                  </div>
                </button>
              ))}
            </section>
            <Field label="Custom amount">
              <input 
                type="number" 
                value={customAmount} 
                onChange={e => { setCustomAmount(e.target.value); setSelectedDenomination(""); }} 
                placeholder="Enter custom amount" 
              />
            </Field>
          </>
        ) : (
          <Field label="Card value">
            <input 
              type="number" 
              value={customAmount} 
              onChange={e => setCustomAmount(e.target.value)} 
              placeholder="Enter card value" 
            />
          </Field>
        )}
        <Button onClick={() => setStep(5)}>Continue</Button>
      </div>
    );
  }

  // Step 6: Review
  if (step === 5) {
    const brand = brands.find(b => b.id === selectedBrand);
    const country = countries.find(c => c.code === selectedCountry);
    const type = cardTypes.find(t => t.id === selectedType);
    const amount = customAmount || selectedDenomination;

    return (
      <div className="page">
        <button className="back-link" onClick={() => setStep(4)}>← Back</button>
        <div className="page-heading">
          <span className="eyebrow">GIFT CARDS / {action.toUpperCase()}</span>
          <h2>Review</h2>
          <p>Review your {action} details before confirming.</p>
        </div>
        <section className="form-section">
          <div><b>Brand:</b><span>{brand?.name}</span></div>
          <div><b>Country:</b><span>{country?.name}</span></div>
          <div><b>Type:</b><span>{type?.name}</span></div>
          <div><b>Amount:</b><span>{amount}</span></div>
          {rateInfo && (
            <>
              <div><b>Rate:</b><span>{action === "buy" ? rateInfo.rate : rateInfo.rate} NGN/USD</span></div>
              <div><b>Fee:</b><span>{money(rateInfo.fee)}</span></div>
              <div><b>Total:</b><span>{money(action === "buy" ? Number(amount) * rateInfo.rate + rateInfo.fee : Number(amount) * rateInfo.rate - rateInfo.fee)}</span></div>
            </>
          )}
        </section>
        <Button onClick={() => setStep(6)}>Confirm</Button>
      </div>
    );
  }

  // Step 7: Enter card details (for sell) or confirm (for buy)
  if (step === 6) {
    const type = cardTypes.find(t => t.id === selectedType);

    return (
      <div className="page">
        <button className="back-link" onClick={() => setStep(5)}>← Back</button>
        <div className="page-heading">
          <span className="eyebrow">GIFT CARDS / {action.toUpperCase()}</span>
          <h2>{action === "buy" ? "Confirm Purchase" : "Enter Card Details"}</h2>
          <p>{action === "buy" ? "Confirm your gift card purchase." : "Provide your gift card information."}</p>
        </div>
        
        {action === "sell" && (
          <>
            <Field label="Card code">
              <input 
                value={cardCode} 
                onChange={e => setCardCode(e.target.value)} 
                placeholder="Enter gift card code" 
              />
            </Field>
            {type?.requiresPin && (
              <Field label="Card PIN">
                <input 
                  type="password" 
                  value={cardPin} 
                  onChange={e => setCardPin(e.target.value)} 
                  placeholder="Enter PIN" 
                />
              </Field>
            )}
            {type?.requiresImages && (
              <>
                <Field label="Front image">
                  <input 
                    type="file" 
                    onChange={e => setFrontImage(e.target.files?.[0] || null)} 
                    accept="image/*" 
                  />
                </Field>
                <Field label="Back image">
                  <input 
                    type="file" 
                    onChange={e => setBackImage(e.target.files?.[0] || null)} 
                    accept="image/*" 
                  />
                </Field>
                {type?.requiresReceipt && (
                  <Field label="Receipt image">
                    <input 
                      type="file" 
                      onChange={e => setReceiptImage(e.target.files?.[0] || null)} 
                      accept="image/*" 
                    />
                  </Field>
                )}
              </>
            )}
          </>
        )}

        {error && <p className="form-error">{error}</p>}
        <Button 
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              const result = action === "buy"
                ? await mockGiftCardsApi.purchaseGiftCard({
                    brandId: selectedBrand,
                    countryCode: selectedCountry,
                    typeId: selectedType,
                    denominationValue: Number(customAmount || selectedDenomination),
                    walletType: walletType as "main" | "cashback"
                  })
                : await mockGiftCardsApi.sellGiftCard({
                    brandId: selectedBrand,
                    countryCode: selectedCountry,
                    typeId: selectedType,
                    cardValue: Number(customAmount),
                    cardCode,
                    cardPin: type?.requiresPin ? cardPin : undefined,
                    frontImage: type?.requiresImages ? (frontImage || undefined) : undefined,
                    backImage: type?.requiresImages ? (backImage || undefined) : undefined,
                    receiptImage: type?.requiresReceipt ? (receiptImage || undefined) : undefined
                  });
              setTransaction(result);
              setSuccessMessage(action === "buy" ? "Gift card purchased successfully!" : "Gift card submitted for verification.");
              setStep(7);
            } catch (e: any) {
              setError(e.message || "Transaction failed");
            } finally {
              setBusy(false);
            }
          }}
          disabled={busy}
        >
          {busy ? "Processing..." : action === "buy" ? "Confirm Purchase" : "Submit"}
        </Button>
      </div>
    );
  }

  // Step 8: Success
  if (step === 7) {
    return (
      <div className="page">
        <div className="page-heading">
          <span className="eyebrow">GIFT CARDS / {action.toUpperCase()}</span>
          <h2>{action === "buy" ? "Purchase Complete" : "Submission Complete"}</h2>
        </div>
        <section className="form-section">
          <span className="state-icon"><CheckCircle2 /></span>
          <Tag kind="ok">Success</Tag>
          <p>{successMessage}</p>
          
          {action === "buy" && transaction?.giftCardCode && (
            <Field label="Gift card code">
              <input readOnly value={transaction.giftCardCode} />
              <Button 
                onClick={() => {
                  navigator.clipboard.writeText(transaction.giftCardCode);
                  setSuccessMessage("Code copied to clipboard!");
                }}
              >
                Copy Code
              </Button>
            </Field>
          )}
          
          {action === "sell" && (
            <>
              <p>Verification status: {transaction?.status || "Pending"}</p>
              <p>Estimated payout: {money(transaction?.totalNGN || 0)}</p>
            </>
          )}
        </section>
        <Button onClick={() => { reset(); setAction(null); }}>Done</Button>
      </div>
    );
  }

  return null;
}
