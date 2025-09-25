import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Upload, Download, FileText, Check, X, AlertCircle, Plus } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { mockCategories, mockPaymentMethods } from '../utils/mockData';

const CSVImport = ({ onImport, onCategoriesUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const csvTemplate = `Date,Description,Amount,Category,Subcategory,Payment Method
2024-07-15,Monthly Rent,22000,needs,rent,neft
2024-07-12,Grocery Shopping,3500,needs,groceries,gpay
2024-07-10,Movie Tickets,1200,wants,entertainment,hdfc_credit
2024-07-15,SIP Investment,5000,investments,mutual_funds,neft`;

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'budget_planner_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Template Downloaded",
      description: "CSV template downloaded successfully. Fill it out and upload back!",
    });
  };

  const validateCSVRow = (row, index) => {
    const errors = [];
    const requiredFields = ['Date', 'Description', 'Amount', 'Category', 'Subcategory', 'Payment Method'];
    
    // Check required fields
    requiredFields.forEach(field => {
      if (!row[field] || row[field].trim() === '') {
        errors.push(`Row ${index + 1}: Missing ${field}`);
      }
    });

    // Validate date format
    if (row.Date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(row.Date)) {
        errors.push(`Row ${index + 1}: Date must be in YYYY-MM-DD format`);
      }
    }

    // Validate amount
    if (row.Amount) {
      const amount = parseFloat(row.Amount);
      if (isNaN(amount) || amount <= 0) {
        errors.push(`Row ${index + 1}: Amount must be a positive number`);
      }
    }

    // Validate category
    if (row.Category) {
      const category = row.Category.toLowerCase();
      if (!['needs', 'wants', 'investments'].includes(category)) {
        errors.push(`Row ${index + 1}: Category must be 'needs', 'wants', or 'investments'`);
      }
    }

    return errors;
  };

  const parseCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const expectedHeaders = ['Date', 'Description', 'Amount', 'Category', 'Subcategory', 'Payment Method'];
    
    // Check headers
    const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    const data = [];
    const errors = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      const rowErrors = validateCSVRow(row, i - 1);
      errors.push(...rowErrors);
      
      data.push(row);
    }
    
    return { data, errors };
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV file.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csvText = e.target.result;
        const { data, errors } = parseCSV(csvText);
        
        setCsvData(data);
        setValidationErrors(errors);
        setPreviewData(data.slice(0, 5)); // Show first 5 rows for preview
        setIsProcessing(false);
        
        if (errors.length === 0) {
          toast({
            title: "CSV Parsed Successfully",
            description: `Found ${data.length} transactions ready to import.`,
          });
        }
      } catch (error) {
        setValidationErrors([error.message]);
        setIsProcessing(false);
        toast({
          title: "CSV Parse Error",
          description: error.message,
          variant: "destructive"
        });
      }
    };
    
    reader.readAsText(file);
  };

  const processImport = () => {
    if (validationErrors.length > 0) {
      toast({
        title: "Cannot Import",
        description: "Please fix validation errors before importing.",
        variant: "destructive"
      });
      return;
    }

    const processedTransactions = [];
    const newCategories = { ...mockCategories };
    
    csvData.forEach((row, index) => {
      const category = row.Category.toLowerCase();
      const subcategory = row.Subcategory.toLowerCase().replace(/\s+/g, '_');
      
      // Check if subcategory exists, if not create it
      if (newCategories[category] && !newCategories[category].subcategories.find(sub => sub.id === subcategory)) {
        newCategories[category].subcategories.push({
          id: subcategory,
          name: row.Subcategory,
          budgetLimit: 5000 // Default budget limit for new subcategories
        });
      }
      
      // Find payment method by name or create a default one
      let paymentMethodId = mockPaymentMethods.find(pm => 
        pm.name.toLowerCase() === row['Payment Method'].toLowerCase() ||
        pm.id === row['Payment Method'].toLowerCase()
      )?.id || 'cash';
      
      const transaction = {
        id: `import_${Date.now()}_${index}`,
        amount: parseFloat(row.Amount),
        description: row.Description,
        category: category,
        subcategory: subcategory,
        paymentMethod: paymentMethodId,
        date: row.Date,
        createdAt: new Date().toISOString()
      };
      
      processedTransactions.push(transaction);
    });

    // Update categories if new subcategories were added
    onCategoriesUpdate(newCategories);
    
    // Import transactions
    onImport(processedTransactions);
    
    // Reset state
    setCsvData([]);
    setPreviewData([]);
    setValidationErrors([]);
    setIsOpen(false);
    
    toast({
      title: "Import Successful!",
      description: `Imported ${processedTransactions.length} transactions successfully.`,
    });
  };

  const resetImport = () => {
    setCsvData([]);
    setPreviewData([]);
    setValidationErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Import Transactions from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import transactions. Use our template for the correct format.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          {/* Template Download */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                CSV Template
              </CardTitle>
              <CardDescription>
                Download our template to ensure your CSV file is in the correct format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border">
                <div>
                  <p className="font-medium text-blue-900">budget_planner_template.csv</p>
                  <p className="text-sm text-blue-700">Required columns: Date, Description, Amount, Category, Subcategory, Payment Method</p>
                </div>
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Upload CSV File</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-4 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">CSV files only</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".csv"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
                
                {isProcessing && (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <p className="text-sm text-gray-600 mt-2">Processing CSV file...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Validation Errors Found:</p>
                  <ul className="list-disc list-inside text-sm space-y-1 max-h-32 overflow-y-auto">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview Data */}
          {previewData.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {validationErrors.length === 0 ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <X className="w-5 h-5 text-red-500" />
                  )}
                  Preview ({csvData.length} transactions)
                </CardTitle>
                <CardDescription>
                  Showing first 5 rows of your CSV file
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Date</th>
                        <th className="text-left p-2 font-medium">Description</th>
                        <th className="text-left p-2 font-medium">Amount</th>
                        <th className="text-left p-2 font-medium">Category</th>
                        <th className="text-left p-2 font-medium">Subcategory</th>
                        <th className="text-left p-2 font-medium">Payment Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-2">{row.Date}</td>
                          <td className="p-2">{row.Description}</td>
                          <td className="p-2">₹{parseFloat(row.Amount).toLocaleString('en-IN')}</td>
                          <td className="p-2">
                            <Badge variant="outline">{row.Category}</Badge>
                          </td>
                          <td className="p-2">{row.Subcategory}</td>
                          <td className="p-2">{row['Payment Method']}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {csvData.length > 5 && (
                  <p className="text-sm text-gray-500 mt-2">
                    ... and {csvData.length - 5} more transactions
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {csvData.length > 0 && (
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={resetImport}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Clear & Start Over
              </Button>
              <Button 
                onClick={processImport}
                disabled={validationErrors.length > 0}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Import {csvData.length} Transactions
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CSVImport;