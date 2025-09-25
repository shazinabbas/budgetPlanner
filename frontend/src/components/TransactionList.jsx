import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, Filter, Trash2, ArrowUpDown, ArrowLeft } from 'lucide-react';
import { mockCategories, mockPaymentMethods } from '../utils/mockData';
import BulkActions from './BulkActions';
import CSVImport from './CSVImport';
import { useToast } from '../hooks/use-toast';

const TransactionList = ({ expenses, onUpdate, onDelete, onBulkUpdate, onBulkImport, onCategoriesUpdate, categories, onBack }) => {
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const { toast } = useToast();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedTransactions(filteredAndSortedExpenses.map(expense => expense.id));
    } else {
      setSelectedTransactions([]);
    }
  };

  const handleSelectTransaction = (transactionId, checked) => {
    if (checked) {
      setSelectedTransactions(prev => [...prev, transactionId]);
    } else {
      setSelectedTransactions(prev => prev.filter(id => id !== transactionId));
    }
  };

  const handleBulkDelete = () => {
    if (selectedTransactions.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedTransactions.length} transaction(s)?`)) {
      selectedTransactions.forEach(id => onDelete(id));
      setSelectedTransactions([]);
      
      toast({
        title: "Transactions Deleted",
        description: `Successfully deleted ${selectedTransactions.length} transaction(s).`,
      });
    }
  };

  const handleBulkUpdate = (updateData) => {
    selectedTransactions.forEach(id => {
      onUpdate(id, updateData);
    });
    setSelectedTransactions([]);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Filter and sort expenses
  const filteredAndSortedExpenses = expenses
    .filter(expense => {
      const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           formatCurrency(expense.amount).includes(searchTerm);
      const matchesCategory = filterCategory === 'all' || expense.category === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'date':
          compareValue = new Date(a.date) - new Date(b.date);
          break;
        case 'amount':
          compareValue = a.amount - b.amount;
          break;
        case 'description':
          compareValue = a.description.localeCompare(b.description);
          break;
        case 'category':
          compareValue = a.category.localeCompare(b.category);
          break;
        default:
          compareValue = 0;
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

  const isAllSelected = selectedTransactions.length === filteredAndSortedExpenses.length && filteredAndSortedExpenses.length > 0;
  const isIndeterminate = selectedTransactions.length > 0 && selectedTransactions.length < filteredAndSortedExpenses.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Button */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>

        <div className="space-y-6">
          {/* Header with Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">All Transactions</h2>
          <p className="text-slate-600">{expenses.length} total transactions</p>
        </div>
        
        <div className="flex gap-2">
          <CSVImport 
            onImport={onBulkImport} 
            onCategoriesUpdate={onCategoriesUpdate}
          />
          <BulkActions
            selectedTransactions={selectedTransactions}
            onBulkUpdate={handleBulkUpdate}
            onClose={() => setSelectedTransactions([])}
          />
          {selectedTransactions.length > 0 && (
            <Button 
              variant="destructive"
              onClick={handleBulkDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete ({selectedTransactions.length})
            </Button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.values(mockCategories).map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="description">Description</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {selectedTransactions.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                {selectedTransactions.length} transaction(s) selected
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transactions ({filteredAndSortedExpenses.length})</CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={isAllSelected}
                indeterminate={isIndeterminate}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-gray-600">Select All</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Table Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 p-3 bg-gray-50 rounded-lg font-medium text-sm text-gray-700">
              <div className="col-span-1 flex items-center">
                <span>Select</span>
              </div>
              <div className="col-span-2 flex items-center cursor-pointer" onClick={() => handleSort('date')}>
                <span>Date</span>
                <ArrowUpDown className="ml-1 w-3 h-3" />
              </div>
              <div className="col-span-3 flex items-center cursor-pointer" onClick={() => handleSort('description')}>
                <span>Description</span>
                <ArrowUpDown className="ml-1 w-3 h-3" />
              </div>
              <div className="col-span-2 flex items-center cursor-pointer" onClick={() => handleSort('amount')}>
                <span>Amount</span>
                <ArrowUpDown className="ml-1 w-3 h-3" />
              </div>
              <div className="col-span-2 flex items-center cursor-pointer" onClick={() => handleSort('category')}>
                <span>Category</span>
                <ArrowUpDown className="ml-1 w-3 h-3" />
              </div>
              <div className="col-span-2 flex items-center">
                <span>Payment</span>
              </div>
            </div>

            {/* Transaction Rows */}
            {filteredAndSortedExpenses.map(expense => (
              <div key={expense.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                {/* Mobile Layout */}
                <div className="md:hidden col-span-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <Checkbox
                      checked={selectedTransactions.includes(expense.id)}
                      onCheckedChange={(checked) => handleSelectTransaction(expense.id, checked)}
                    />
                    <span className="text-sm text-gray-500">
                      {new Date(expense.date).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <div className="font-medium text-slate-800">{expense.description}</div>
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-rose-600">
                      -{formatCurrency(expense.amount)}
                    </div>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs">
                        {mockCategories[expense.category]?.name}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {mockPaymentMethods.find(pm => pm.id === expense.paymentMethod)?.name}
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:flex md:col-span-1 items-center">
                  <Checkbox
                    checked={selectedTransactions.includes(expense.id)}
                    onCheckedChange={(checked) => handleSelectTransaction(expense.id, checked)}
                  />
                </div>
                <div className="hidden md:flex md:col-span-2 items-center text-sm text-gray-600">
                  {new Date(expense.date).toLocaleDateString('en-IN')}
                </div>
                <div className="hidden md:flex md:col-span-3 items-center">
                  <span className="font-medium text-slate-800">{expense.description}</span>
                </div>
                <div className="hidden md:flex md:col-span-2 items-center">
                  <span className="font-semibold text-rose-600">
                    -{formatCurrency(expense.amount)}
                  </span>
                </div>
                <div className="hidden md:flex md:col-span-2 items-center">
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-xs">
                      {mockCategories[expense.category]?.name}
                    </Badge>
                    <div className="text-xs text-gray-500 capitalize">
                      {expense.subcategory.replace('_', ' ')}
                    </div>
                  </div>
                </div>
                <div className="hidden md:flex md:col-span-2 items-center">
                  <span className="text-sm text-gray-600">
                    {mockPaymentMethods.find(pm => pm.id === expense.paymentMethod)?.name}
                  </span>
                </div>
              </div>
            ))}

            {filteredAndSortedExpenses.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg font-medium mb-2">No transactions found</p>
                <p className="text-sm">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default TransactionList;