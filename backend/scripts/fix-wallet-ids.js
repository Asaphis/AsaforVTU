/**
 * Migration Script: Fix Ghost Wallets
 * 
 * This script finds wallets with email addresses as document IDs and migrates them
 * to proper UID-based document IDs.
 * 
 * Run with: node scripts/fix-wallet-ids.js
 */

const { db, auth } = require('../src/config/firebase');

async function fixWalletIds() {
  console.log('🔍 Starting wallet ID migration...');
  
  try {
    // Get all wallets
    const walletsSnapshot = await db.collection('wallets').get();
    console.log(`📊 Found ${walletsSnapshot.size} wallets total`);
    
    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const walletDoc of walletsSnapshot.docs) {
      const docId = walletDoc.id;
      const data = walletDoc.data();
      
      // Check if document ID looks like an email (contains @)
      if (docId.includes('@')) {
        console.log(`\n📧 Found wallet with email ID: ${docId}`);
        
        try {
          // Try to resolve email to UID
          let targetUid = null;
          
          // 1. Try Firebase Auth
          try {
            const user = await auth.getUserByEmail(docId);
            targetUid = user.uid;
            console.log(`   ✅ Resolved via Auth: ${targetUid}`);
          } catch (e) {
            console.log(`   ❌ Not in Auth: ${e.message}`);
          }
          
          // 2. If not in Auth, try users collection
          if (!targetUid) {
            const usersSnapshot = await db.collection('users')
              .where('email', '==', docId.toLowerCase())
              .limit(1)
              .get();
            
            if (!usersSnapshot.empty) {
              targetUid = usersSnapshot.docs[0].id;
              console.log(`   ✅ Resolved via users collection: ${targetUid}`);
            }
          }
          
          if (targetUid) {
            // Check if target wallet already exists
            const targetDoc = await db.collection('wallets').doc(targetUid).get();
            
            if (targetDoc.exists) {
              // Merge balances (add to existing)
              const targetData = targetDoc.data();
              const newMainBalance = (targetData.mainBalance || 0) + (data.mainBalance || 0);
              const newCashbackBalance = (targetData.cashbackBalance || 0) + (data.cashbackBalance || 0);
              const newReferralBalance = (targetData.referralBalance || 0) + (data.referralBalance || 0);
              
              await db.collection('wallets').doc(targetUid).update({
                mainBalance: newMainBalance,
                cashbackBalance: newCashbackBalance,
                referralBalance: newReferralBalance,
                migratedFrom: docId,
                migratedAt: new Date()
              });
              
              console.log(`   🔄 Merged: old(${data.mainBalance || 0}) + new(${targetData.mainBalance || 0}) = ${newMainBalance}`);
            } else {
              // Create new wallet with correct UID
              await db.collection('wallets').doc(targetUid).set({
                ...data,
                migratedFrom: docId,
                migratedAt: new Date()
              });
              
              console.log(`   ✅ Created new wallet for UID: ${targetUid}`);
            }
            
            // Delete old wallet
            await db.collection('wallets').doc(docId).delete();
            console.log(`   🗑️ Deleted old wallet: ${docId}`);
            
            migrated++;
          } else {
            console.log(`   ⚠️ Could not resolve UID for ${docId} - skipping`);
            skipped++;
          }
        } catch (err) {
          console.error(`   ❌ Error processing ${docId}:`, err.message);
          errors++;
        }
      } else {
        // Document ID doesn't look like email - skip
        skipped++;
      }
    }
    
    console.log(`\n✅ Migration complete!`);
    console.log(`   Migrated: ${migrated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Errors: ${errors}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
  
  process.exit(0);
}

fixWalletIds();
