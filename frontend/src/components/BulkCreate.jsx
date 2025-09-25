import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Plus, Save, X, Trash2, Copy, AlertCircle, Check } from 'lucide-react';
import { mockCategories, mockPaymentMethods } from '../utils/mockData';
import { useToast } from '../hooks/use-toast';

const BulkCreate = ({ onBulkCreate, categories }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [transactions, setTransactions] = useState([
    {
      id: 'temp_1',
      amount: '',
      description: '',
      category: '',
      subcategory: '',
      paymentMethod: '',
      date: new Date().toISOString().split('T')[0],
      errors: {}
    }
  ]);
  const [validationErrors, setValidationErrors] = useState({});
  const { toast } = useToast();

  const addNewRow = () => {
    const newTransaction = {
      id: `temp_${Date.now()}`,
      amount: '',
      description: '',
      category: '',
      subcategory: '',
      paymentMethod: '',
      date: new Date().toISOString().split('T')[0],
      errors: {}
    };
    setTransactions(prev => [...prev, newTransaction]);
  };

  const removeRow = (id) => {
    if (transactions.length > 1) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      // Remove validation errors for deleted row
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const duplicateRow = (id) => {
    const transactionToDuplicate = transactions.find(t => t.id === id);
    if (transactionToDuplicate) {
      const newTransaction = {
        ...transactionToDuplicate,
        id: `temp_${Date.now()}`,
        errors: {}
      };
      const index = transactions.findIndex(t => t.id === id);
      const newTransactions = [...transactions];
      newTransactions.splice(index + 1, 0, newTransaction);
      setTransactions(newTransactions);
    }
  };

  const updateTransaction = (id, field, value) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        const updated = { 
          ...t, 
          [field]: value,
          // Reset subcategory when category changes
          ...(field === 'category' && { subcategory: '' })
        };
        return updated;
      }
      return t;
    }));

    // Clear validation error for this field
    if (validationErrors[id]?.[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          [field]: null
        }
      }));
    }
  };

  const validateTransaction = (transaction) => {
    const errors = {};
    
    if (!transaction.amount || parseFloat(transaction.amount) <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }
    
    if (!transaction.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!transaction.category) {
      errors.category = 'Category is required';
    }
    
    if (!transaction.subcategory) {
      errors.subcategory = 'Subcategory is required';
    }
    
    if (!transaction.paymentMethod) {
      errors.paymentMethod = 'Payment method is required';
    }
    
    if (!transaction.date) {
      errors.date = 'Date is required';
    }
    
    return errors;
  };

  const validateAllTransactions = () => {
    const allErrors = {};
    let hasErrors = false;
    
    transactions.forEach(transaction => {
      const errors = validateTransaction(transaction);
      if (Object.keys(errors).length > 0) {
        allErrors[transaction.id] = errors;
        hasErrors = true;
      }
    });
    
    setValidationErrors(allErrors);
    return !hasErrors;
  };

  const handleBulkSave = () => {
    if (!validateAllTransactions()) {
      toast({
        title: "Validation Errors",
        description: "Please fix all validation errors before saving.",
        variant: "destructive"
      });
      return;
    }

    const processedTransactions = transactions.map((transaction, index) => ({
      id: `bulk_${Date.now()}_${index}`,
      amount: parseFloat(transaction.amount),
      description: transaction.description,
      category: transaction.category,
      subcategory: transaction.subcategory,
      paymentMethod: transaction.paymentMethod,
      date: transaction.date,
      createdAt: new Date().toISOString()
    }));

    onBulkCreate(processedTransactions);
    
    // Reset form
    setTransactions([{
      id: 'temp_1',
      amount: '',
      description: '',
      category: '',
      subcategory: '',
      paymentMethod: '',
      date: new Date().toISOString().split('T')[0],
      errors: {}
    }]);
    setValidationErrors({});
    setIsOpen(false);
    
    toast({
      title: "Bulk Create Successful!",
      description: `Created ${processedTransactions.length} transactions successfully.`,
    });
  };

  const clearAll = () => {
    setTransactions([{
      id: 'temp_1',
      amount: '',
      description: '',
      category: '',
      subcategory: '',
      paymentMethod: '',
      date: new Date().toISOString().split('T')[0],
      errors: {}
    }]);
    setValidationErrors({});
  };

  const getValidTransactionCount = () => {
    return transactions.filter(t => {
      const errors = validateTransaction(t);
      return Object.keys(errors).length === 0;
    }).length;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Bulk Add
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Bulk Add Transactions</DialogTitle>
          <DialogDescription>
            Add multiple transactions at once. Use the + button to add more rows.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Summary Bar */}
          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
            <div className="flex items-center gap-4">
              <Badge variant="secondary">{transactions.length} Total Rows</Badge>
              <Badge variant="outline" className="text-green-600">
                <Check className="w-3 h-3 mr-1" />
                {getValidTransactionCount()} Valid
              </Badge>
              {Object.keys(validationErrors).length > 0 && (
                <Badge variant="destructive">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {Object.keys(validationErrors).length} With Errors
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={addNewRow}>
                <Plus className="w-4 h-4 mr-1" />
                Add Row
              </Button>
              <Button variant="outline" size="sm" onClick={clearAll}>
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="flex-1 overflow-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left p-2 font-medium min-w-[100px]">Amount *</th>
                  <th className="text-left p-2 font-medium min-w-[200px]">Description *</th>
                  <th className="text-left p-2 font-medium min-w-[120px]">Category *</th>
                  <th className="text-left p-2 font-medium min-w-[120px]">Subcategory *</th>
                  <th className="text-left p-2 font-medium min-w-[120px]">Payment Method *</th>
                  <th className="text-left p-2 font-medium min-w-[120px]">Date *</th>
                  <th className="text-left p-2 font-medium w-[100px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction, index) => {
                  const selectedCategory = (categories || mockCategories)[transaction.category];
                  const hasErrors = validationErrors[transaction.id];
                  
                  return (
                    <tr key={transaction.id} className={`border-b hover:bg-gray-50 ${hasErrors ? 'bg-red-50' : ''}`}>
                      {/* Amount */}
                      <td className="p-2">
                        <Input
                          type="number"
                          value={transaction.amount}
                          onChange={(e) => updateTransaction(transaction.id, 'amount', e.target.value)}
                          placeholder="₹ 0.00"
                          step="0.01"
                          min="0"
                          className={`h-8 ${validationErrors[transaction.id]?.amount ? 'border-red-500' : ''}`}
                        />
                        {validationErrors[transaction.id]?.amount && (
                          <div className="text-xs text-red-500 mt-1">{validationErrors[transaction.id].amount}</div>
                        )}
                      </td>

                      {/* Description */}
                      <td className="p-2">
                        <Textarea
                          value={transaction.description}
                          onChange={(e) => updateTransaction(transaction.id, 'description', e.target.value)}
                          placeholder="What did you spend on?"
                          className={`h-8 min-h-8 resize-none ${validationErrors[transaction.id]?.description ? 'border-red-500' : ''}`}
                          rows={1}
                        />
                        {validationErrors[transaction.id]?.description && (
                          <div className="text-xs text-red-500 mt-1">{validationErrors[transaction.id].description}</div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="p-2">
                        <Select 
                          value={transaction.category} 
                          onValueChange={(value) => updateTransaction(transaction.id, 'category', value)}
                        >
                          <SelectTrigger className={`h-8 ${validationErrors[transaction.id]?.category ? 'border-red-500' : ''}`}>
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(categories || mockCategories).map(category => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {validationErrors[transaction.id]?.category && (
                          <div className="text-xs text-red-500 mt-1">{validationErrors[transaction.id].category}</div>
                        )}
                      </td>

                      {/* Subcategory */}
                      <td className="p-2">
                        <Select 
                          value={transaction.subcategory} 
                          onValueChange={(value) => updateTransaction(transaction.id, 'subcategory', value)}
                          disabled={!transaction.category}
                        >
                          <SelectTrigger className={`h-8 ${validationErrors[transaction.id]?.subcategory ? 'border-red-500' : ''}`}>
                            <SelectValue placeholder="Subcategory" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedCategory?.subcategories.map(subcategory => (
                              <SelectItem key={subcategory.id} value={subcategory.id}>
                                {subcategory.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {validationErrors[transaction.id]?.subcategory && (
                          <div className="text-xs text-red-500 mt-1">{validationErrors[transaction.id].subcategory}</div>
                        )}
                      </td>

                      {/* Payment Method */}
                      <td className="p-2">
                        <Select 
                          value={transaction.paymentMethod} 
                          onValueChange={(value) => updateTransaction(transaction.id, 'paymentMethod', value)}
                        >
                          <SelectTrigger className={`h-8 ${validationErrors[transaction.id]?.paymentMethod ? 'border-red-500' : ''}`}>
                            <SelectValue placeholder="Payment" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockPaymentMethods.map(method => (
                              <SelectItem key={method.id} value={method.id}>
                                {method.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {validationErrors[transaction.id]?.paymentMethod && (
                          <div className="text-xs text-red-500 mt-1">{validationErrors[transaction.id].paymentMethod}</div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="p-2">
                        <Input
                          type="date"
                          value={transaction.date}
                          onChange={(e) => updateTransaction(transaction.id, 'date', e.target.value)}
                          className={`h-8 ${validationErrors[transaction.id]?.date ? 'border-red-500' : ''}`}
                        />
                        {validationErrors[transaction.id]?.date && (
                          <div className="text-xs text-red-500 mt-1">{validationErrors[transaction.id].date}</div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-2">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => duplicateRow(transaction.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          {transactions.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRow(transaction.id)}
                              className="h-6 w-6 p-0 text-red-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Validation Summary */}
          {Object.keys(validationErrors).length > 0 && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please fix validation errors in the highlighted rows before saving.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleBulkSave}
            disabled={getValidTransactionCount() === 0}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Save {getValidTransactionCount()} Transaction{getValidTransactionCount() !== 1 ? 's' : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkCreate;