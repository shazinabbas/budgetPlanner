import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Search, Filter, Trash2, ArrowUpDown, ArrowLeft, CalendarIcon, Save, X, AlertCircle, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { cacheStore } from '../services/cache';
import BulkActions from './BulkActions';
import BulkCreate from './BulkCreate';
import CSVImport from './CSVImport';
import { useToast } from '../hooks/use-toast';

const TransactionList = ({ expenses, onUpdate, onDelete, onBulkUpdate, onBulkImport, onBulkCreate, onCategoriesUpdate, categories, onBack }) => {
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterAmountMin, setFilterAmountMin] = useState('');
  const [filterAmountMax, setFilterAmountMax] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
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

  const handleTransactionDoubleClick = (expense) => {
    setEditingTransaction(expense);
    setEditFormData({
      amount: expense.amount,
      description: expense.description,
      category: expense.category,
      subcategory: expense.subcategory,
      paymentMethod: expense.paymentMethod,
      date: new Date(expense.date)
    });
    setIsEditDialogOpen(true);
  };

  const handleEditInputChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'category' && { subcategory: '' })
    }));
  };

  const handleSaveEdit = () => {
    if (!editFormData.amount || !editFormData.description || !editFormData.category || !editFormData.subcategory || !editFormData.paymentMethod) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const updateData = {
      amount: parseFloat(editFormData.amount),
      description: editFormData.description,
      category: editFormData.category,
      subcategory: editFormData.subcategory,
      paymentMethod: editFormData.paymentMethod,
      date: format(editFormData.date, 'yyyy-MM-dd')
    };

    onUpdate(editingTransaction.id, updateData);
    setIsEditDialogOpen(false);
    setEditingTransaction(null);
    setEditFormData(null);

    toast({
      title: "Transaction Updated",
      description: "Transaction has been updated successfully.",
    });
  };

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    setEditingTransaction(null);
    setEditFormData(null);
  };

  const isFieldEmpty = (value) => {
    return !value || value === '' || value === 0;
  };

  const handleBulkUpdate = (updateData) => {
    selectedTransactions.forEach(id => {
      onUpdate(id, updateData);
    });
    setSelectedTransactions([]);
  };

  const handleBulkCreate = (transactions) => {
    onBulkCreate(transactions);
  };

  const handleExportCSV = () => {
    const dataToExport = filteredAndSortedExpenses.length > 0 ? filteredAndSortedExpenses : expenses;
    
    // CSV headers
    const headers = ['Date', 'Description', 'Category', 'Subcategory', 'Amount', 'Payment Method'];
    
    // CSV rows
    const rows = dataToExport.map(expense => {
      const category = (categories || cacheStore.getCategories())[expense.category];
      const subcategory = category?.subcategories.find(s => s.id === expense.subcategory);
      const paymentMethod = cacheStore.getPaymentMethods().find(p => p.id === expense.paymentMethod);
      
      return [
        expense.date,
        `"${expense.description.replace(/"/g, '""')}"`, // Escape quotes
        category?.name || expense.category,
        subcategory?.name || expense.subcategory,
        expense.category === 'income' ? expense.amount : -expense.amount, // Income positive, expenses negative
        paymentMethod?.name || expense.paymentMethod
      ].join(',');
    });
    
    const csv = [headers.join(','), ...rows].join('\n');
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Successful!",
      description: `Exported ${dataToExport.length} transaction(s) to CSV.`,
    });
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
      
      // Date range filter
      const expenseDate = new Date(expense.date);
      const matchesDateFrom = !filterDateFrom || expenseDate >= new Date(filterDateFrom);
      const matchesDateTo = !filterDateTo || expenseDate <= new Date(filterDateTo);
      
      // Amount range filter
      const matchesAmountMin = !filterAmountMin || expense.amount >= parseFloat(filterAmountMin);
      const matchesAmountMax = !filterAmountMax || expense.amount <= parseFloat(filterAmountMax);
      
      return matchesSearch && matchesCategory && matchesDateFrom && matchesDateTo && matchesAmountMin && matchesAmountMax;
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
            
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={handleExportCSV}
                className="flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
              <BulkCreate 
                onBulkCreate={handleBulkCreate}
                categories={categories}
              />
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                      {Object.values(categories || cacheStore.getCategories()).map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Date From</label>
                  <Input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    placeholder="Start date"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Date To</label>
                  <Input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    placeholder="End date"
                  />
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Min Amount (₹)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filterAmountMin}
                    onChange={(e) => setFilterAmountMin(e.target.value)}
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Amount (₹)</label>
                  <Input
                    type="number"
                    placeholder="No limit"
                    value={filterAmountMax}
                    onChange={(e) => setFilterAmountMax(e.target.value)}
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              {(searchTerm || filterCategory !== 'all' || filterDateFrom || filterDateTo || filterAmountMin || filterAmountMax) && (
                <div className="mt-4 flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Showing {filteredAndSortedExpenses.length} of {expenses.length} transactions
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterCategory('all');
                      setFilterDateFrom('');
                      setFilterDateTo('');
                      setFilterAmountMin('');
                      setFilterAmountMax('');
                    }}
                    className="text-blue-700 hover:text-blue-900"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear Filters
                  </Button>
                </div>
              )}
              
              {selectedTransactions.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
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
                  <div 
                    key={expense.id} 
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                    onDoubleClick={() => handleTransactionDoubleClick(expense)}
                  >
                    {/* Mobile Layout */}
                    <div className="md:hidden col-span-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <Checkbox
                          checked={selectedTransactions.includes(expense.id)}
                          onCheckedChange={(checked) => handleSelectTransaction(expense.id, checked)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="text-sm text-gray-500">
                          {new Date(expense.date).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <div className="font-medium text-slate-800">{expense.description}</div>
                      <div className="flex items-center justify-between">
                        <div className={`font-semibold ${expense.category === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {expense.category === 'income' ? '+' : '-'}{formatCurrency(expense.amount)}
                        </div>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-xs">
                            {(categories || cacheStore.getCategories())[expense.category]?.name}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                            {cacheStore.getPaymentMethods().find(pm => pm.id === expense.paymentMethod)?.name}
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:flex md:col-span-1 items-center">
                      <Checkbox
                        checked={selectedTransactions.includes(expense.id)}
                        onCheckedChange={(checked) => handleSelectTransaction(expense.id, checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="hidden md:flex md:col-span-2 items-center text-sm text-gray-600">
                      {new Date(expense.date).toLocaleDateString('en-IN')}
                    </div>
                    <div className="hidden md:flex md:col-span-3 items-center">
                      <span className="font-medium text-slate-800">{expense.description}</span>
                    </div>
                    <div className="hidden md:flex md:col-span-2 items-center">
                      <span className={`font-semibold ${expense.category === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {expense.category === 'income' ? '+' : '-'}{formatCurrency(expense.amount)}
                      </span>
                    </div>
                    <div className="hidden md:flex md:col-span-2 items-center">
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-xs">
                          {(categories || cacheStore.getCategories())[expense.category]?.name}
                        </Badge>
                        <div className="text-xs text-gray-500 capitalize">
                          {expense.subcategory.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                    <div className="hidden md:flex md:col-span-2 items-center">
                      <span className="text-sm text-gray-600">
                        {cacheStore.getPaymentMethods().find(pm => pm.id === expense.paymentMethod)?.name}
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

        {/* Edit Transaction Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                Edit Transaction
              </DialogTitle>
              <DialogDescription>
                Double-click any transaction to edit. Fields highlighted in red require your attention.
              </DialogDescription>
            </DialogHeader>

            {editFormData && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-amount" className="flex items-center gap-2">
                      Amount *
                      {isFieldEmpty(editFormData.amount) && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </Label>
                    <Input
                      id="edit-amount"
                      type="number"
                      placeholder="Enter amount in ₹"
                      value={editFormData.amount}
                      onChange={(e) => handleEditInputChange('amount', e.target.value)}
                      className={cn(
                        isFieldEmpty(editFormData.amount) && "border-red-500 focus-visible:ring-red-500"
                      )}
                    />
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Date *
                      {!editFormData.date && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </Label>
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !editFormData.date && "text-muted-foreground border-red-500"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editFormData.date ? format(editFormData.date, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={editFormData.date}
                          onSelect={(date) => {
                            handleEditInputChange('date', date);
                            setIsCalendarOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="edit-description" className="flex items-center gap-2">
                    Description *
                    {isFieldEmpty(editFormData.description) && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Enter transaction description"
                    value={editFormData.description}
                    onChange={(e) => handleEditInputChange('description', e.target.value)}
                    rows={2}
                    className={cn(
                      isFieldEmpty(editFormData.description) && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Category *
                      {isFieldEmpty(editFormData.category) && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </Label>
                    <Select 
                      value={editFormData.category || undefined} 
                      onValueChange={(value) => handleEditInputChange('category', value)}
                    >
                      <SelectTrigger className={cn(
                        isFieldEmpty(editFormData.category) && "border-red-500"
                      )}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(categories || cacheStore.getCategories())
                          .filter(category => category.id && category.id !== '')
                          .map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Subcategory */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      Subcategory *
                      {isFieldEmpty(editFormData.subcategory) && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </Label>
                    <Select 
                      value={editFormData.subcategory || undefined} 
                      onValueChange={(value) => handleEditInputChange('subcategory', value)}
                      disabled={!editFormData.category}
                    >
                      <SelectTrigger className={cn(
                        isFieldEmpty(editFormData.subcategory) && "border-red-500"
                      )}>
                        <SelectValue placeholder="Select subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {editFormData.category && 
                          (categories || cacheStore.getCategories())[editFormData.category]?.subcategories
                            .filter(sub => sub.id && sub.id !== '')
                            .map(sub => (
                              <SelectItem key={sub.id} value={sub.id}>
                                {sub.name}
                              </SelectItem>
                            ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Payment Method *
                    {isFieldEmpty(editFormData.paymentMethod) && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </Label>
                  <Select 
                    value={editFormData.paymentMethod || undefined} 
                    onValueChange={(value) => handleEditInputChange('paymentMethod', value)}
                  >
                    <SelectTrigger className={cn(
                      isFieldEmpty(editFormData.paymentMethod) && "border-red-500"
                    )}>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {cacheStore.getPaymentMethods()
                        .filter(method => method.id && method.id !== '')
                        .map(method => (
                          <SelectItem key={method.id} value={method.id}>
                            {method.name}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveEdit}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default TransactionList;