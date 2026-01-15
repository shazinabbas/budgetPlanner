import React, { useState } from 'react';
import * as XLSX from 'xlsx';

export default function ImportTransactions({ onImport, onCategoriesUpdate }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [error, setError] = useState('');
  const [imported, setImported] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setPreview([]);
    setError('');
    setImported(false);
  };

  const handleParse = () => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'csv') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target.result;
        const rows = XLSX.utils.sheet_to_json(XLSX.read(text, { type: 'string' }).Sheets.Sheet1, { header: 1 });
        parseRows(rows);
      };
      reader.readAsText(file);
    } else if (ext === 'xls' || ext === 'xlsx') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        parseRows(rows);
      };
      reader.readAsArrayBuffer(file);
    } else {
      setError('Unsupported file type. Please upload CSV or XLS/XLSX.');
    }
  };

  // Parse rows from CSV/XLS
  const parseRows = (rows) => {
    // Find header row
    const headerIdx = rows.findIndex(r => r[0] && r[0].toString().toLowerCase().includes('date'));
    if (headerIdx === -1) {
      setError('Could not find header row.');
      return;
    }
    const headers = rows[headerIdx];
    const txns = rows.slice(headerIdx + 1)
      .filter(r => r.length >= headers.length && r[0])
      .map(r => {
        // Try to map columns for both CSV and HDFC XLS
        const [date, narration, refNo, valueDate, withdrawal, deposit, balance] = r;
        return {
          amount: withdrawal || deposit || 0,
          description: narration || '',
          category: withdrawal ? 'needs' : 'income',
          paymentMethod: 'imported',
          date: typeof date === 'string' ? date : XLSX.SSF.parse_date_code(date) ? new Date(XLSX.SSF.parse_date_code(date)).toISOString().split('T')[0] : date,
          refNo,
          type: withdrawal ? 'debit' : 'credit',
          balance
        };
      });
    setPreview(txns);
  };

  const handleImport = () => {
    if (!preview.length) return;
    const expenses = preview.filter(txn => txn.type === 'debit').map(txn => ({
      amount: txn.amount,
      description: txn.description,
      category: 'needs',
      paymentMethod: 'imported',
      date: txn.date
    }));
    if (onImport) onImport(expenses);
    setImported(true);
  };

  return (
    <div className="mb-4">
      <label className="block font-medium mb-1">Import Transactions (CSV/XLS)</label>
      <input type="file" accept=".csv,.xls,.xlsx" onChange={handleFileChange} />
      <button className="ml-2 px-3 py-1 bg-blue-600 text-white rounded" onClick={handleParse} disabled={!file}>Preview</button>
      {error && <div className="text-red-600 mt-2">{error}</div>}
      {preview.length > 0 && (
        <div className="mt-2">
          <table className="w-full text-xs border">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((txn, idx) => (
                <tr key={idx} className={txn.type === 'debit' ? 'bg-red-50' : 'bg-green-50'}>
                  <td>{txn.date}</td>
                  <td>{txn.description}</td>
                  <td>{txn.amount}</td>
                  <td>{txn.type}</td>
                  <td>{txn.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="mt-2 px-3 py-1 bg-green-600 text-white rounded" onClick={handleImport}>Import Expenses</button>
          {imported && <div className="text-green-600 mt-2">Imported successfully!</div>}
        </div>
      )}
    </div>
  );
}
