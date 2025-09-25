# Budget Planner API Contracts & Integration Plan

## Overview
This document defines the API contracts and integration strategy for converting the frontend mock data to full backend integration.

## Current Frontend Mock Data Structure

### Categories Schema
```json
{
  "needs": {
    "id": "needs",
    "name": "Needs", 
    "subcategories": [
      {"id": "rent", "name": "Rent", "budgetLimit": 25000},
      {"id": "utilities", "name": "Utilities", "budgetLimit": 3000},
      {"id": "groceries", "name": "Groceries", "budgetLimit": 8000},
      {"id": "transportation", "name": "Transportation", "budgetLimit": 4000},
      {"id": "insurance", "name": "Insurance", "budgetLimit": 2000}
    ]
  },
  "wants": {
    "id": "wants",
    "name": "Wants",
    "subcategories": [
      {"id": "entertainment", "name": "Entertainment", "budgetLimit": 5000},
      {"id": "dining", "name": "Dining Out", "budgetLimit": 4000},
      {"id": "shopping", "name": "Shopping", "budgetLimit": 6000},
      {"id": "hobbies", "name": "Hobbies", "budgetLimit": 3000}
    ]
  },
  "investments": {
    "id": "investments",
    "name": "Investments",
    "subcategories": [
      {"id": "stocks", "name": "Stocks", "budgetLimit": 10000},
      {"id": "mutual_funds", "name": "Mutual Funds", "budgetLimit": 8000},
      {"id": "savings", "name": "Savings", "budgetLimit": 15000},
      {"id": "emergency_fund", "name": "Emergency Fund", "budgetLimit": 5000},
      {"id": "gold", "name": "Gold", "budgetLimit": 3000}
    ]
  }
}
```

### Payment Methods Schema
```json
[
  {"id": "cash", "name": "Cash", "type": "cash"},
  {"id": "gpay", "name": "Google Pay", "type": "upi"},
  {"id": "phonepe", "name": "PhonePe", "type": "upi"},
  {"id": "paytm", "name": "Paytm", "type": "upi"},
  {"id": "neft", "name": "NEFT", "type": "neft"},
  {"id": "hdfc_credit", "name": "HDFC Credit Card", "type": "credit", "dueDate": "15"},
  {"id": "sbi_credit", "name": "SBI Credit Card", "type": "credit", "dueDate": "25"}
]
```

### Expense Transaction Schema
```json
{
  "id": "string",
  "amount": "number", 
  "description": "string",
  "category": "string", // needs/wants/investments
  "subcategory": "string", // rent/groceries/etc
  "paymentMethod": "string", // cash/gpay/etc
  "date": "string", // YYYY-MM-DD format
  "createdAt": "string" // ISO timestamp
}
```

## Required API Endpoints

### 1. Categories Management
```
GET /api/categories
- Returns all categories with subcategories and budget limits
- Response: Categories object as above

POST /api/categories/{categoryId}/subcategories
- Creates new subcategory (for CSV import auto-creation)
- Body: {name: string, budgetLimit: number}
- Response: Updated category object

PUT /api/categories/{categoryId}/subcategories/{subcategoryId}
- Updates subcategory budget limits
- Body: {name?: string, budgetLimit?: number}
```

### 2. Payment Methods Management
```
GET /api/payment-methods
- Returns all available payment methods
- Response: Array of payment method objects

POST /api/payment-methods
- Creates custom payment method
- Body: {name: string, type: string, dueDate?: string}
```

### 3. Expense Management
```
GET /api/expenses
- Query params: ?category=string&startDate=string&endDate=string&limit=number&offset=number
- Returns paginated expenses with filters
- Response: {expenses: Array, totalCount: number, hasMore: boolean}

POST /api/expenses
- Creates single expense
- Body: Expense object (without id, createdAt)
- Response: Created expense with id and timestamps

POST /api/expenses/bulk
- Creates multiple expenses (CSV import)
- Body: {expenses: Array<ExpenseInput>}
- Response: {created: Array<Expense>, errors: Array<string>}

PUT /api/expenses/{id}
- Updates single expense
- Body: Partial expense object
- Response: Updated expense

PUT /api/expenses/bulk
- Updates multiple expenses (bulk edit)
- Body: {expenseIds: Array<string>, updates: Object}
- Response: {updated: Array<Expense>, errors: Array<string>}

DELETE /api/expenses/{id}
- Deletes single expense
- Response: {success: boolean}

DELETE /api/expenses/bulk
- Body: {expenseIds: Array<string>}
- Response: {deleted: number, errors: Array<string>}
```

### 4. Income Management
```
GET /api/income
- Returns current income settings
- Response: {amount: number, source: string, currency: string}

PUT /api/income
- Updates income information
- Body: {amount?: number, source?: string}
```

### 5. Reports & Analytics
```
GET /api/reports/monthly-summary
- Query: ?year=number&month=number
- Response: Monthly expense/income breakdown

GET /api/reports/category-breakdown
- Query: ?startDate=string&endDate=string
- Response: Spending by category analysis

GET /api/reports/export
- Query: ?format=csv|pdf&startDate=string&endDate=string&category=string
- Returns file download or download URL
```

## Database Schema Requirements

### Collections/Tables Needed:
1. **users** - User account information
2. **categories** - Category definitions with subcategories  
3. **payment_methods** - Payment method definitions
4. **expenses** - Individual expense records
5. **income** - Income sources and amounts
6. **budget_limits** - Monthly/category budget settings

### Key Indexes:
- expenses.date (for date range queries)
- expenses.category (for category filtering)
- expenses.userId + expenses.date (for user-specific date queries)

## Frontend Integration Changes Required

### 1. Replace Mock Data Sources
**Files to Update:**
- `src/components/Dashboard.jsx` - Remove mockExpenses, call API
- `src/components/Reports.jsx` - Replace with API calls
- `src/components/TransactionList.jsx` - Use API for CRUD operations
- `src/utils/mockData.js` - Keep as fallback/default data only

### 2. Add API Service Layer
**New File: `src/services/api.js`**
```javascript
// Centralized API calls using REACT_APP_BACKEND_URL
const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const expenseAPI = {
  getAll: (filters) => fetch(`${API_BASE}/expenses`),
  create: (expense) => fetch(`${API_BASE}/expenses`, {method: 'POST'}),
  bulkCreate: (expenses) => fetch(`${API_BASE}/expenses/bulk`),
  update: (id, updates) => fetch(`${API_BASE}/expenses/${id}`, {method: 'PUT'}),
  bulkUpdate: (ids, updates) => fetch(`${API_BASE}/expenses/bulk`, {method: 'PUT'}),
  delete: (id) => fetch(`${API_BASE}/expenses/${id}`, {method: 'DELETE'})
};
```

### 3. State Management Updates
- Replace localStorage with API calls
- Add loading states for all operations
- Implement optimistic updates for better UX
- Add proper error handling and retry logic

## CSV Import Integration
- Backend validates CSV format and data
- Auto-creates new subcategories as specified by user
- Returns detailed import results with error reporting
- Frontend shows import progress and results

## Security Considerations
- All API endpoints require authentication
- Validate user ownership of expenses/categories
- Sanitize CSV upload content
- Rate limiting on bulk operations

## Performance Optimizations
- Implement pagination for transaction lists
- Cache category and payment method data
- Use debounced search for better UX
- Optimize database queries with proper indexes

## Testing Strategy
- Unit tests for all API endpoints
- Integration tests for CSV import workflow
- Frontend component tests with mocked API
- End-to-end tests for complete user flows

## Migration Plan
1. **Phase 1**: Setup backend models and basic CRUD APIs
2. **Phase 2**: Replace dashboard and expense form with API calls  
3. **Phase 3**: Implement reports and analytics APIs
4. **Phase 4**: Add bulk operations and CSV import
5. **Phase 5**: Performance optimization and testing