'use client';

import { useEffect, useState } from 'react';

const CONSENT_KEY = 'asaforvtu-cookie-consent';

type Consent = 'accepted' | 'declined';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!window.localStorage.getItem(CONSENT_KEY));
  }, []);

  const save = (value: Consent) => {
    window.localStorage.setItem(CONSENT_KEY, value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside className="cookie-consent" role="region" aria-label="Cookie information">
      <div>
        <strong>Cookie choices</strong>
        <p>
          AsaforVTU currently uses essential browser storage for sign-in, security,
          preferences, and basic site operation. We do not enable advertising or
          analytics cookies without explaining them and asking for permission.
          <a href="/privacy#cookies"> Read the cookie section</a>.
        </p>
      </div>
      <div className="cookie-consent__actions">
        <button type="button" className="cookie-consent__decline" onClick={() => save('declined')}>
          Continue with essential only
        </button>
        <button type="button" className="cookie-consent__accept" onClick={() => save('accepted')}>
          Allow optional cookies
        </button>
      </div>
    </aside>
  );
}
