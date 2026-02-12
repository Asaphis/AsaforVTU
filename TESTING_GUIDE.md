# Testing Guide - Admin-to-User Connection Fixes

## Quick Test Scenarios

### Test 1: Wallet Balance Display (Fixed Doubling)
**Steps:**
1. Login as admin
2. Go to Users list
3. Credit a user 1000 naira
4. Login as that user
5. Check dashboard and wallet page

**Expected Result:**
- Both dashboard and wallet page show SAME amount (1000, not 2000)
- Amount updates within 10 seconds as polling refreshes

---

### Test 2: Create and Add Service
**Steps:**
1. Login as admin
2. Go to Services/Admin panel
3. Create new service "Premium Airtime"
4. Set price to 500
5. Save and go back to frontend
6. Login as user
7. Go to Airtime service

**Expected Result:**
- User frontend fetches service list from backend API
- "Premium Airtime" appears in user's service options
- User can select and purchase the new service

---

### Test 3: Admin Credit Sync
**Steps:**
1. Open user dashboard in one browser session
2. In another session login as admin
3. Credit user 5000 naira
4. Watch the first browser's wallet balance

**Expected Result:**
- Within 10 seconds, wallet balance updates to show the 5000 credit
- No need to refresh page - automatic polling detects it
- Both main and context balances show same amount

---

### Test 4: Support Tickets
**Steps:**
1. Login as user
2. Go to Support section
3. Create new ticket: "Test Ticket 123"
4. Add message: "This is a test"
5. Submit

**Expected Result:**
- Ticket submission goes through backend API (not direct Firestore)
- Admin receives notification/sees ticket in admin panel
- Ticket appears in user's ticket list (via Firestore real-time listener)

**Admin Response:**
1. Login as admin
2. Go to Support/Tickets
3. Find user's ticket
4. Reply with: "Thanks for contacting us"

**Expected Result:**
- User sees admin reply in real-time within app
- Message marked as read

---

### Test 5: Announcements
**Steps:**
1. Login as admin
2. Create announcement:
   - Title: "New Feature Alert"
   - Content: "Exam pins now available!"
   - Type: info
3. Go to user dashboard

**Expected Result:**
- Announcement appears within 30 seconds (polling interval)
- Animation shows on dashboard
- User can see announcement

---

### Test 6: Wallet Transfer (Referral to Main)
**Steps:**
1. User has 1000 in referral balance
2. User goes to dashboard
3. Clicks "Move to Primary" under referral
4. Confirms action

**Expected Result:**
- Referral balance becomes 0
- Main balance increases by 1000
- Balance refresh triggered immediately after transfer
- No doubling or display inconsistencies

---

## Debugging Commands

### Check API Endpoints
```bash
# Test backend services endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://backend-url.com/api/admin/services

# Test announcements endpoint  
curl https://backend-url.com/api/admin/announcements

# Test wallet balance endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://backend-url.com/api/wallet
```

### Browser Console Checks
```javascript
// Check what backend URL is being used
window.location.hostname

// Monitor polling (open DevTools Network tab)
// Should see /api/wallet calls every 10 seconds

// Check if service fetch is using backend
// Look for GET /api/admin/services in Network tab
```

---

## Common Issues & Solutions

### Issue: Wallet still shows doubled balance
**Solution:**
- Clear browser cache: Ctrl+Shift+Delete
- Hard refresh: Ctrl+Shift+R
- Check backend is responding: `curl https://backend/api/wallet`
- Verify AuthContext is not overriding balance - check `web/frontend/src/contexts/AuthContext.tsx`

### Issue: Services not updating
**Solution:**
- Check backend can reach services collection
- Verify admin has permission to create services
- Check Network tab for 404 errors on `/api/admin/services`
- Ensure service has `slug` field for lookup

### Issue: Tickets not received by admin
**Solution:**
- Check ticket is being created via backend API (POST `/api/admin/support/tickets/create`)
- Verify both userId and userEmail are captured
- Check Firestore `tickets` collection has the document
- Check admin panel is querying correct collection

### Issue: Announcements not showing
**Solution:**
- Check `/api/admin/announcements` returns data
- Verify the 30-second polling is working (check Network tab)
- Check announcement has `active: true` field
- Clear cache and hard refresh browser

### Issue: Admin credit not syncing
**Solution:**
- Verify polling is running (10 second interval in Network tab)
- Check wallet balance changed in Firestore (check `wallets` collection)
- Ensure transaction was successful (check `wallet_transactions` collection)
- Try manual refresh button if available
- Check browser console for errors

---

## Performance Monitoring

### What to Watch
1. **Network Requests:** Every 10 seconds for wallet, every 30 seconds for announcements
2. **API Response Time:** Should be < 500ms
3. **Memory Usage:** Should not grow unbounded
4. **Battery Usage:** Polling shouldn't drastically increase drain

### Optimization Opportunities
1. Switch polling to WebSocket for instant updates
2. Implement request debouncing for rapid balance checks
3. Cache services locally with 5-minute TTL
4. Use service worker for offline caching

---

## Load Testing

### Simulate 100 Users
1. Each gets balance update call every 10 seconds
2. Each gets announcements every 30 seconds
3. Monitor backend response times and DB load

### Expected Load
```
100 users × 1 request per 10 seconds = 10 requests/second for wallet
100 users × 1 request per 30 seconds = 3.3 requests/second for announcements
Total: ~13 requests/second (very reasonable for typical backends)
```

---

## Rollback Instructions

If issues arise:

1. **Revert Frontend Changes:**
   ```bash
   git checkout web/frontend/src/app/dashboard/page.tsx
   git checkout web/frontend/src/app/dashboard/wallet/page.tsx
   git checkout web/frontend/src/app/dashboard/support/page.tsx
   git checkout web/frontend/src/lib/services.ts
   rm web/frontend/src/hooks/useWalletListener.ts
   npm run build
   ```

2. **Backend is unchanged** - no rollback needed there

3. **Database is unchanged** - no data migration needed

---

## Success Criteria

- [ ] Wallet shows correct balance (no doubling)
- [ ] Admin credits appear within 10 seconds
- [ ] Services sync from admin to user
- [ ] Tickets flow properly admin ↔ user
- [ ] Announcements display within 30 seconds
- [ ] All features work on mobile and desktop
- [ ] No console errors or warnings
- [ ] Performance is acceptable (no noticeable lag)
