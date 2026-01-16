import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { CalendarIcon, ArrowLeft, Save, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { cacheStore } from '../services/cache';

const TransactionForm = ({ onBack, onSave, categories }) => {
  const [transactionType, setTransactionType] = useState('expense'); // 'expense' or 'income'
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    subcategory: '',
    paymentMethod: '',
    date: new Date()
  });

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // Reset subcategory when category changes
      ...(field === 'category' && { subcategory: '' })
    }));
  };

  const handleTypeChange = (type) => {
    setTransactionType(type);
    // Reset category and subcategory when switching types
    setFormData(prev => ({
      ...prev,
      category: type === 'income' ? 'income' : '',
      subcategory: ''
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.description || !formData.category || !formData.subcategory || !formData.paymentMethod) {
      alert('Please fill in all required fields');
      return;
    }

    const transactionData = {
      id: Date.now().toString(),
      amount: parseFloat(formData.amount),
      description: formData.description,
      category: transactionType === 'income' ? 'income' : formData.category,
      subcategory: formData.subcategory,
      paymentMethod: formData.paymentMethod,
      date: format(formData.date, 'yyyy-MM-dd'),
      createdAt: new Date().toISOString()
    };

    onSave(transactionData);
    
    // Reset form
    setFormData({
      amount: '',
      description: '',
      category: transactionType === 'income' ? 'income' : '',
      subcategory: '',
      paymentMethod: '',
      date: new Date()
    });
  };

  // Get categories based on transaction type
  const availableCategories = transactionType === 'income' 
    ? { income: (categories || cacheStore.getCategories())['income'] }
    : Object.fromEntries(
        Object.entries(categories || cacheStore.getCategories()).filter(([key]) => key !== 'income')
      );

  const selectedCategory = (categories || cacheStore.getCategories())[
    transactionType === 'income' ? 'income' : formData.category
  ];
  const selectedPaymentMethod = cacheStore.getPaymentMethods().find(pm => pm.id === formData.paymentMethod);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
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

        <Card className="border-0 shadow-xl">
          <CardHeader className={cn(
            "text-white",
            transactionType === 'income' 
              ? "bg-gradient-to-r from-emerald-500 to-emerald-600" 
              : "bg-gradient-to-r from-blue-500 to-blue-600"
          )}>
            <CardTitle className="text-2xl">
              {transactionType === 'income' ? 'Add Income' : 'Add Expense'}
            </CardTitle>
            <CardDescription className={transactionType === 'income' ? "text-emerald-100" : "text-blue-100"}>
              {transactionType === 'income' 
                ? 'Track your income sources and earnings' 
                : 'Track your spending and maintain your budget'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Transaction Type Toggle */}
            <div className="flex justify-center">
              <Tabs value={transactionType} onValueChange={handleTypeChange} className="w-full max-w-md">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="expense" className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    Expense
                  </TabsTrigger>
                  <TabsTrigger value="income" className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Income
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount in ₹"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    className="text-lg"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.date}
                        onSelect={(date) => {
                          handleInputChange('date', date);
                          setIsCalendarOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder={transactionType === 'income' ? 'What is this income for?' : 'What did you spend on?'}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {transactionType === 'expense' && (
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(availableCategories).map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className={transactionType === 'income' ? 'col-span-2' : 'space-y-2'}>
                  <Label htmlFor="subcategory">
                    {transactionType === 'income' ? 'Income Source *' : 'Subcategory *'}
                  </Label>
                  <Select 
                    value={formData.subcategory} 
                    onValueChange={(value) => handleInputChange('subcategory', value)}
                    disabled={transactionType === 'expense' && !formData.category}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={transactionType === 'income' ? 'Select income source' : 'Select subcategory'} />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCategory?.subcategories.map(subcategory => (
                        <SelectItem key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select value={formData.paymentMethod} onValueChange={(value) => handleInputChange('paymentMethod', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={transactionType === 'income' ? 'How did you receive it?' : 'How did you pay?'} />
                  </SelectTrigger>
                  <SelectContent>
                    {cacheStore.getPaymentMethods().map(method => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name} {method.type === 'credit' && `(Due: ${method.dueDate}th)`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {transactionType === 'expense' && selectedPaymentMethod?.type === 'credit' && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Credit Card Reminder:</strong> This expense will be due on the {selectedPaymentMethod.dueDate}th of next month.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onBack}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className={cn(
                    "flex-1",
                    transactionType === 'income'
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                      : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  )}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save {transactionType === 'income' ? 'Income' : 'Expense'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TransactionForm;
