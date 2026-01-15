// Mock data for budget planner app - will be replaced with API calls later
// NOTE: Hard-coded values have been cleared. Using in-memory cache service instead.

export const mockIncomeData = {
  id: '1',
  source: '',
  amount: 0,
  currency: 'INR',
  date: new Date().toISOString().split('T')[0]
};

export const mockCategories = {
  needs: {
    id: 'needs',
    name: 'Needs',
    subcategories: [
      { id: 'rent', name: 'Rent', budgetLimit: 0 },
      { id: 'utilities', name: 'Utilities', budgetLimit: 0 },
      { id: 'groceries', name: 'Groceries', budgetLimit: 0 },
      { id: 'transportation', name: 'Transportation', budgetLimit: 0 },
      { id: 'insurance', name: 'Insurance', budgetLimit: 0 }
    ]
  },
  wants: {
    id: 'wants', 
    name: 'Wants',
    subcategories: [
      { id: 'entertainment', name: 'Entertainment', budgetLimit: 0 },
      { id: 'dining', name: 'Dining Out', budgetLimit: 0 },
      { id: 'shopping', name: 'Shopping', budgetLimit: 0 },
      { id: 'hobbies', name: 'Hobbies', budgetLimit: 0 }
    ]
  },
  investments: {
    id: 'investments',
    name: 'Investments', 
    subcategories: [
      { id: 'stocks', name: 'Stocks', budgetLimit: 0 },
      { id: 'mutual_funds', name: 'Mutual Funds', budgetLimit: 0 },
      { id: 'savings', name: 'Savings', budgetLimit: 0 },
      { id: 'emergency_fund', name: 'Emergency Fund', budgetLimit: 0 },
      { id: 'gold', name: 'Gold', budgetLimit: 0 }
    ]
  }
};

export const mockPaymentMethods = [
  { id: 'cash', name: 'Cash', type: 'cash' },
  { id: 'gpay', name: 'Google Pay', type: 'upi' },
  { id: 'phonepe', name: 'PhonePe', type: 'upi' },
  { id: 'paytm', name: 'Paytm', type: 'upi' },
  { id: 'neft', name: 'NEFT', type: 'neft' },
  { id: 'hdfc_credit', name: 'HDFC Credit Card', type: 'credit', dueDate: '15' },
  { id: 'sbi_credit', name: 'SBI Credit Card', type: 'credit', dueDate: '25' }
];

export const mockExpenses = [];

export const mockBudgetLimits = {
  monthly: 0,
  savings_goal: 0
};

export const mockMonthlyData = [];