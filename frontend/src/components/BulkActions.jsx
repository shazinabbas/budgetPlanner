import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, Save, X, Edit3 } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { mockCategories, mockPaymentMethods } from '../utils/mockData';
import { useToast } from '../hooks/use-toast';

const BulkActions = ({ selectedTransactions, onBulkUpdate, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [bulkData, setBulkData] = useState({
    amount: '',
    description: '',
    category: '',
    subcategory: '',
    paymentMethod: '',
    date: null
  });
  const [fieldsToUpdate, setFieldsToUpdate] = useState({
    amount: false,
    description: false,
    category: false,
    subcategory: false,
    paymentMethod: false,
    date: false
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const { toast } = useToast();

  const handleFieldToggle = (field) => {
    setFieldsToUpdate(prev => ({
      ...prev,
      [field]: !prev[field],
      // Reset subcategory when category is toggled off
      ...(field === 'category' && prev[field] && { subcategory: false })
    }));
    
    if (!fieldsToUpdate[field]) {
      // Clear the field value when toggling off
      setBulkData(prev => ({ ...prev, [field]: field === 'date' ? null : '' }));
    }
  };

  const handleInputChange = (field, value) => {
    setBulkData(prev => ({
      ...prev,
      [field]: value,
      // Reset subcategory when category changes
      ...(field === 'category' && { subcategory: '' })
    }));
  };

  const handleBulkUpdate = () => {
    const updateData = {};
    Object.keys(fieldsToUpdate).forEach(field => {
      if (fieldsToUpdate[field] && bulkData[field] !== '' && bulkData[field] !== null) {
        updateData[field] = field === 'date' ? format(bulkData[field], 'yyyy-MM-dd') : bulkData[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      toast({
        title: "No Changes Selected",
        description: "Please select at least one field to update and provide a value.",
        variant: "destructive"
      });
      return;
    }

    onBulkUpdate(updateData);
    setIsOpen(false);
    onClose();
    
    toast({
      title: "Bulk Update Successful!",
      description: `Updated ${selectedTransactions.length} transaction(s) across ${Object.keys(updateData).length} field(s).`,
    });
  };

  const selectedCategory = mockCategories[bulkData.category];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
          disabled={selectedTransactions.length === 0}
        >
          <Edit3 className="w-4 h-4 mr-2" />
          Bulk Edit ({selectedTransactions.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Bulk Edit Transactions</DialogTitle>
          <DialogDescription>
            Update {selectedTransactions.length} selected transaction(s). Only checked fields will be updated.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          {/* Amount Field */}
          <div className="flex items-center space-x-4">
            <input
              type="checkbox"
              id="amount-checkbox"
              checked={fieldsToUpdate.amount}
              onChange={() => handleFieldToggle('amount')}
              className="w-4 h-4"
            />
            <div className="flex-1 space-y-2">
              <Label htmlFor="amount" className={fieldsToUpdate.amount ? '' : 'text-gray-400'}>
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount in ₹"
                value={bulkData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                disabled={!fieldsToUpdate.amount}
                step="0.01"
                min="0"
              />
            </div>
          </div>

          {/* Description Field */}
          <div className="flex items-start space-x-4">
            <input
              type="checkbox"
              id="description-checkbox"
              checked={fieldsToUpdate.description}
              onChange={() => handleFieldToggle('description')}
              className="w-4 h-4 mt-8"
            />
            <div className="flex-1 space-y-2">
              <Label htmlFor="description" className={fieldsToUpdate.description ? '' : 'text-gray-400'}>
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Transaction description"
                value={bulkData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={!fieldsToUpdate.description}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          {/* Category and Subcategory */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                id="category-checkbox"
                checked={fieldsToUpdate.category}
                onChange={() => handleFieldToggle('category')}
                className="w-4 h-4"
              />
              <div className="flex-1 space-y-2">
                <Label htmlFor="category" className={fieldsToUpdate.category ? '' : 'text-gray-400'}>
                  Category
                </Label>
                <Select 
                  value={bulkData.category} 
                  onValueChange={(value) => handleInputChange('category', value)}
                  disabled={!fieldsToUpdate.category}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(mockCategories).map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                id="subcategory-checkbox"
                checked={fieldsToUpdate.subcategory}
                onChange={() => handleFieldToggle('subcategory')}
                className="w-4 h-4"
              />
              <div className="flex-1 space-y-2">
                <Label htmlFor="subcategory" className={fieldsToUpdate.subcategory ? '' : 'text-gray-400'}>
                  Subcategory
                </Label>
                <Select 
                  value={bulkData.subcategory} 
                  onValueChange={(value) => handleInputChange('subcategory', value)}
                  disabled={!fieldsToUpdate.subcategory || !bulkData.category}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subcategory" />
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
          </div>

          {/* Payment Method */}
          <div className="flex items-center space-x-4">
            <input
              type="checkbox"
              id="payment-checkbox"
              checked={fieldsToUpdate.paymentMethod}
              onChange={() => handleFieldToggle('paymentMethod')}
              className="w-4 h-4"
            />
            <div className="flex-1 space-y-2">
              <Label htmlFor="paymentMethod" className={fieldsToUpdate.paymentMethod ? '' : 'text-gray-400'}>
                Payment Method
              </Label>
              <Select 
                value={bulkData.paymentMethod} 
                onValueChange={(value) => handleInputChange('paymentMethod', value)}
                disabled={!fieldsToUpdate.paymentMethod}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {mockPaymentMethods.map(method => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name} {method.type === 'credit' && `(Due: ${method.dueDate}th)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Field */}
          <div className="flex items-center space-x-4">
            <input
              type="checkbox"
              id="date-checkbox"
              checked={fieldsToUpdate.date}
              onChange={() => handleFieldToggle('date')}
              className="w-4 h-4"
            />
            <div className="flex-1 space-y-2">
              <Label htmlFor="date" className={fieldsToUpdate.date ? '' : 'text-gray-400'}>
                Date
              </Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={!fieldsToUpdate.date}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !bulkData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {bulkData.date ? format(bulkData.date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={bulkData.date}
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

          {/* Summary */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Update Summary</h4>
            <p className="text-sm text-blue-700">
              {Object.keys(fieldsToUpdate).filter(field => fieldsToUpdate[field]).length} field(s) will be updated across {selectedTransactions.length} transaction(s).
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleBulkUpdate}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Update All
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkActions;