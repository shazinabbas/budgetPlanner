// Cloud Sync Service - Manages synchronization between IndexedDB and Firestore
// Implements offline-first architecture with automatic conflict resolution

import { db, auth } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  writeBatch,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { cacheStore } from './cache';

class SyncService {
  constructor() {
    this.userId = null;
    this.syncInProgress = false;
    this.unsubscribers = [];
    this.lastSyncTime = null;
    this.offlineQueue = [];
    
    // Listen for auth state changes
    auth.onAuthStateChanged((user) => {
      if (user) {
        this.userId = user.uid;
        this.initializeSync();
      } else {
        this.cleanup();
      }
    });
  }

  // Initialize sync when user logs in
  async initializeSync() {
    if (!this.userId) return;
    
    console.log('🔄 Initializing cloud sync...');
    
    try {
      // First, load all data from Firestore to IndexedDB
      await this.loadFromCloud();
      
      // Enable real-time listeners for live updates
      this.setupRealtimeListeners();
      
      // Process any offline changes
      await this.processOfflineQueue();
      
      console.log('✅ Cloud sync initialized');
    } catch (error) {
      console.error('❌ Failed to initialize sync:', error);
    }
  }

  // Load all user data from Firestore
  async loadFromCloud() {
    if (!this.userId) return;
    
    try {
      console.log('📥 Loading data from cloud...');
      
      // Load transactions
      const transactionsRef = collection(db, 'users', this.userId, 'transactions');
      const transactionsSnap = await getDocs(query(transactionsRef, orderBy('date', 'desc')));
      
      const transactions = [];
      transactionsSnap.forEach((doc) => {
        transactions.push({
          id: doc.id,
          ...doc.data(),
          syncStatus: 'synced'
        });
      });
      
      // Load settings
      const settingsRef = doc(db, 'users', this.userId, 'settings', 'preferences');
      const settingsSnap = await getDoc(settingsRef);
      const settings = settingsSnap.exists() ? settingsSnap.data() : null;
      
      // Update IndexedDB cache
      if (transactions.length > 0) {
        // Clear existing expenses and replace with cloud data
        cacheStore.cache.expenses = transactions;
        
        // Persist to IndexedDB
        if (cacheStore.db) {
          const tx = cacheStore.db.transaction('expenses', 'readwrite');
          await tx.store.clear();
          await Promise.all(transactions.map(t => tx.store.put(t)));
          await tx.done;
        }
        
        cacheStore.notify('expenses', transactions);
      }
      
      // Update settings if they exist in cloud
      if (settings) {
        if (settings.categories) {
          cacheStore.cache.categories = settings.categories;
          await cacheStore.setSetting('categories', settings.categories);
          cacheStore.notify('categories', settings.categories);
        }
        if (settings.paymentMethods) {
          cacheStore.cache.paymentMethods = settings.paymentMethods;
          await cacheStore.setSetting('paymentMethods', settings.paymentMethods);
          cacheStore.notify('paymentMethods', settings.paymentMethods);
        }
        if (settings.budgetLimits) {
          cacheStore.cache.budgetLimits = settings.budgetLimits;
          await cacheStore.setSetting('budgetLimits', settings.budgetLimits);
          cacheStore.notify('budgetLimits', settings.budgetLimits);
        }
      }
      
      this.lastSyncTime = new Date();
      console.log(`✅ Loaded ${transactions.length} transactions from cloud`);
      
    } catch (error) {
      console.error('❌ Error loading from cloud:', error);
      throw error;
    }
  }

  // Setup real-time listeners for live sync
  setupRealtimeListeners() {
    if (!this.userId) return;
    
    // Listen to transactions changes
    const transactionsRef = collection(db, 'users', this.userId, 'transactions');
    const unsubTransactions = onSnapshot(transactionsRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const transaction = { id: change.doc.id, ...change.doc.data(), syncStatus: 'synced' };
        
        if (change.type === 'added' || change.type === 'modified') {
          // Check if this change came from us (avoid loops)
          const existing = cacheStore.cache.expenses.find(e => e.id === transaction.id);
          if (!existing || existing.lastModified !== transaction.lastModified) {
            this.updateLocalTransaction(transaction);
          }
        } else if (change.type === 'removed') {
          this.removeLocalTransaction(transaction.id);
        }
      });
    }, (error) => {
      console.error('❌ Real-time listener error:', error);
    });
    
    this.unsubscribers.push(unsubTransactions);
  }

  // Update local transaction from cloud change
  async updateLocalTransaction(transaction) {
    const index = cacheStore.cache.expenses.findIndex(e => e.id === transaction.id);
    
    if (index >= 0) {
      // Update existing
      cacheStore.cache.expenses[index] = transaction;
    } else {
      // Add new
      cacheStore.cache.expenses.unshift(transaction);
    }
    
    cacheStore.cache.expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Persist to IndexedDB
    if (cacheStore.db) {
      await cacheStore.db.put('expenses', transaction);
    }
    
    cacheStore.notify('expenses', cacheStore.cache.expenses);
  }

  // Remove local transaction from cloud deletion
  async removeLocalTransaction(id) {
    cacheStore.cache.expenses = cacheStore.cache.expenses.filter(e => e.id !== id);
    
    // Remove from IndexedDB
    if (cacheStore.db) {
      await cacheStore.db.delete('expenses', id);
    }
    
    cacheStore.notify('expenses', cacheStore.cache.expenses);
  }

  // Sync transaction to cloud
  async syncTransaction(transaction, operation = 'CREATE') {
    if (!this.userId) {
      // User not logged in, queue for later
      this.offlineQueue.push({ transaction, operation });
      return;
    }
    
    try {
      const transactionRef = doc(db, 'users', this.userId, 'transactions', transaction.id);
      
      if (operation === 'DELETE') {
        await deleteDoc(transactionRef);
      } else {
        // CREATE or UPDATE
        const cloudData = {
          ...transaction,
          userId: this.userId,
          lastModified: new Date().toISOString(),
          cloudSyncedAt: serverTimestamp()
        };
        
        // Remove local-only fields
        delete cloudData.syncStatus;
        
        await setDoc(transactionRef, cloudData, { merge: true });
      }
      
      // Update sync status locally
      const local = cacheStore.cache.expenses.find(e => e.id === transaction.id);
      if (local && operation !== 'DELETE') {
        local.syncStatus = 'synced';
        if (cacheStore.db) {
          await cacheStore.db.put('expenses', local);
        }
      }
      
    } catch (error) {
      console.error('❌ Error syncing transaction:', error);
      
      // If offline, queue for retry
      if (error.code === 'unavailable' || !navigator.onLine) {
        this.offlineQueue.push({ transaction, operation });
      }
      
      throw error;
    }
  }

  // Sync settings to cloud
  async syncSettings() {
    if (!this.userId) return;
    
    try {
      const settingsRef = doc(db, 'users', this.userId, 'settings', 'preferences');
      
      await setDoc(settingsRef, {
        categories: cacheStore.cache.categories,
        paymentMethods: cacheStore.cache.paymentMethods,
        budgetLimits: cacheStore.cache.budgetLimits,
        lastModified: new Date().toISOString(),
        cloudSyncedAt: serverTimestamp()
      }, { merge: true });
      
      console.log('✅ Settings synced to cloud');
    } catch (error) {
      console.error('❌ Error syncing settings:', error);
    }
  }

  // Process offline queue when coming back online
  async processOfflineQueue() {
    if (this.offlineQueue.length === 0) return;
    
    console.log(`🔄 Processing ${this.offlineQueue.length} offline changes...`);
    
    const queue = [...this.offlineQueue];
    this.offlineQueue = [];
    
    for (const item of queue) {
      try {
        await this.syncTransaction(item.transaction, item.operation);
      } catch (error) {
        // Re-queue if still failing
        this.offlineQueue.push(item);
      }
    }
    
    if (this.offlineQueue.length > 0) {
      console.log(`⚠️ ${this.offlineQueue.length} items still pending sync`);
    }
  }

  // Cleanup when user logs out
  cleanup() {
    this.userId = null;
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
    this.offlineQueue = [];
    this.lastSyncTime = null;
    console.log('🔒 Cloud sync stopped');
  }

  // Manual sync trigger
  async forceSyncAll() {
    if (!this.userId) return;
    
    console.log('🔄 Force syncing all data...');
    
    try {
      // Sync all expenses
      const batch = writeBatch(db);
      const expenses = cacheStore.getExpenses();
      
      expenses.forEach((expense) => {
        const ref = doc(db, 'users', this.userId, 'transactions', expense.id);
        const cloudData = {
          ...expense,
          userId: this.userId,
          lastModified: new Date().toISOString(),
          cloudSyncedAt: serverTimestamp()
        };
        delete cloudData.syncStatus;
        batch.set(ref, cloudData, { merge: true });
      });
      
      await batch.commit();
      
      // Sync settings
      await this.syncSettings();
      
      console.log('✅ Force sync complete');
    } catch (error) {
      console.error('❌ Force sync failed:', error);
    }
  }
}

// Export singleton instance
export const syncService = new SyncService();

// Enhanced wrapper functions for components to use
export const addTransaction = async (transaction) => {
  // Add to local cache first (instant UI update)
  const newTransaction = cacheStore.addExpense(transaction);
  
  // Sync to cloud in background
  syncService.syncTransaction(newTransaction, 'CREATE').catch(err => {
    console.error('Background sync failed:', err);
  });
  
  return newTransaction;
};

export const updateTransaction = async (id, updates) => {
  // Update local cache first
  const updated = cacheStore.updateExpense(id, updates);
  
  // Sync to cloud in background
  if (updated) {
    syncService.syncTransaction(updated, 'UPDATE').catch(err => {
      console.error('Background sync failed:', err);
    });
  }
  
  return updated;
};

export const deleteTransaction = async (id) => {
  // Get transaction before deleting
  const transaction = cacheStore.cache.expenses.find(e => e.id === id);
  
  // Delete from local cache first
  cacheStore.deleteExpense(id);
  
  // Sync deletion to cloud in background
  if (transaction) {
    syncService.syncTransaction(transaction, 'DELETE').catch(err => {
      console.error('Background sync failed:', err);
    });
  }
};

export const bulkAddTransactions = async (transactions) => {
  // Add to local cache first
  const newTransactions = cacheStore.addExpenses(transactions);
  
  // Sync each to cloud in background
  for (const transaction of newTransactions) {
    syncService.syncTransaction(transaction, 'CREATE').catch(err => {
      console.error('Background sync failed:', err);
    });
  }
  
  return newTransactions;
};

export const updateSettings = async (key, value) => {
  // Update local first
  cacheStore.cache[key] = value;
  await cacheStore.setSetting(key, value);
  cacheStore.notify(key, value);
  
  // Sync to cloud in background
  syncService.syncSettings().catch(err => {
    console.error('Background sync failed:', err);
  });
};
