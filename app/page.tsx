"use client";

import React, { useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import {
  Printer,
  Plus,
  Trash2,
  Settings,
  User,
  CreditCard,
  FileText,
  Sparkles,
  RotateCcw,
  CheckCircle,
  Clock,
  Eye,
  History,
  Minus,
  Save
} from "lucide-react";
import InvoiceTemplate, {
  InvoiceData,
  InvoiceItem,
  COLOR_THEMES,
  REMITTANCE_OPTIONS,
  getLineItemAmount,
} from "./components/InvoiceTemplate";

type PaymentMode = keyof typeof REMITTANCE_OPTIONS;
type ActiveTab = "builder" | "history";

interface InvoiceRecord extends InvoiceData {
  recordId: string;
  savedAt: string;
  totalAmount: number;
  itemCount: number;
}

const HISTORY_STORAGE_KEY = "medrozo-invoice-history";

const calculateInvoiceTotal = (data: InvoiceData) => {
  const subtotal = data.items.reduce((sum, item) => sum + getLineItemAmount(item), 0);
  const discountAmount = subtotal * (data.discountRate / 100);
  const taxAmount = (subtotal - discountAmount) * (data.taxRate / 100);

  return subtotal - discountAmount + taxAmount;
};

const cloneInvoiceData = (data: InvoiceData): InvoiceData => ({
  ...data,
  items: data.items.map((item) => ({ ...item, lineType: item.lineType ?? "charge" })),
});

const invoiceRecordToData = (record: InvoiceRecord): InvoiceData => ({
  invoiceNumber: record.invoiceNumber,
  issueDate: record.issueDate,
  dueDate: record.dueDate,
  clientName: record.clientName,
  clientEmail: record.clientEmail,
  clientPhone: record.clientPhone,
  clientAddress: record.clientAddress,
  items: record.items.map((item) => ({ ...item, lineType: item.lineType ?? "charge" })),
  taxRate: record.taxRate,
  discountRate: record.discountRate,
  currency: record.currency,
  notes: record.notes,
  paymentTerms: record.paymentTerms,
  bankName: record.bankName,
  accountName: record.accountName,
  accountNumber: record.accountNumber,
  swiftCode: record.swiftCode,
  accentColor: record.accentColor,
  preparedByName: record.preparedByName ?? "",
  preparedByPosition: record.preparedByPosition ?? "",
  preparedByContact: record.preparedByContact ?? "",
});

const formatRecordDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatMoney = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
};

const loadInvoiceHistory = (): InvoiceRecord[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const savedHistory = window.localStorage.getItem(HISTORY_STORAGE_KEY);

    if (!savedHistory) {
      return [];
    }

    const parsedHistory = JSON.parse(savedHistory) as InvoiceRecord[];
    return Array.isArray(parsedHistory) ? parsedHistory : [];
  } catch {
    return [];
  }
};

// Initial Empty/Default State
const createEmptyInvoice = (): InvoiceData => {
  const today = new Date().toISOString().split("T")[0];
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);
  const dueDateStr = nextMonth.toISOString().split("T")[0];

  return {
    invoiceNumber: "INV-" + Math.floor(100000 + Math.random() * 900000),
    issueDate: today,
    dueDate: dueDateStr,
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientAddress: "",
    items: [],
    taxRate: 0,
    discountRate: 0,
    currency: "PHP",
    notes: "",
    paymentTerms: "",
    bankName: "UNION BANK",
    accountName: "MEDROZO IT SOLUTIONS",
    accountNumber: "0012 0003 6168",
    swiftCode: "",
    accentColor: "indigo",
    preparedByName: "",
    preparedByPosition: "",
    preparedByContact: "",
  };
};

// Demo/Populated State for Premium Preview
const DEMO_INVOICE: InvoiceData = {
  invoiceNumber: "INV-2026-8942",
  issueDate: new Date().toISOString().split("T")[0],
  dueDate: (() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  })(),
  clientName: "Acme Cybernetics Corp",
  clientEmail: "billing@acmecyber.com",
  clientPhone: "+1 (415) 802-9912",
  clientAddress: "Building 12, Innovation Center\n4000 Tech Highway\nSilicon Valley, CA 94025",
  items: [
    {
      id: "item-1",
      description: "Enterprise Cloud Architecture Consulting (Phase 1 Strategy)",
      quantity: 1,
      rate: 4500,
      lineType: "charge",
    },
  ],
  taxRate: 12,
  discountRate: 10,
  currency: "PHP",
  notes: "Thank you for partnering with Medrozo IT Solutions. Please remit payment within the net 30 day grace period.",
  paymentTerms: "Standard Net 30. Direct bank transfer instructions are attached below. Late payments are subject to a 1.5% monthly service charge.",
  bankName: "UNION BANK",
  accountName: "MEDROZO IT SOLUTIONS",
  accountNumber: "0012 0003 6168",
  swiftCode: "",
  accentColor: "indigo",
  preparedByName: "Blanche R.",
  preparedByPosition: "Authorized Representative",
  preparedByContact: "+63 977-2555-500",
};

export default function Home() {
  const [invoice, setInvoice] = useState<InvoiceData>(DEMO_INVOICE);
  const [activeTab, setActiveTab] = useState<ActiveTab>("builder");
  const [invoiceHistory, setInvoiceHistory] = useState<InvoiceRecord[]>(loadInvoiceHistory);
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Setup react-to-print
  const handlePrint = useReactToPrint({
    contentRef: contentRef,
    documentTitle: `Invoice_${invoice.invoiceNumber || "Medrozo"}`,
  });

  // Display helpful notification toast
  const showToast = (message: string, type: "success" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const persistHistory = (records: InvoiceRecord[]) => {
    setInvoiceHistory(records);
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(records));
  };

  const saveInvoiceRecord = (data: InvoiceData) => {
    const savedAt = new Date().toISOString();
    const existingRecord = invoiceHistory.find(
      (record) => record.invoiceNumber === data.invoiceNumber
    );
    const record: InvoiceRecord = {
      ...cloneInvoiceData(data),
      invoiceNumber: data.invoiceNumber || `INV-${Date.now()}`,
      recordId: existingRecord?.recordId ?? `record-${Date.now()}`,
      savedAt,
      totalAmount: calculateInvoiceTotal(data),
      itemCount: data.items.length,
    };
    const records = [
      record,
      ...invoiceHistory.filter((item) => item.recordId !== record.recordId),
    ].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());

    persistHistory(records);
  };

  const handleSaveInvoice = () => {
    saveInvoiceRecord(invoice);
    showToast("Invoice recorded in history", "success");
  };

  const handlePrintInvoice = () => {
    saveInvoiceRecord(invoice);
    handlePrint();
    showToast("Invoice recorded and ready to print", "success");
  };

  const handleLoadInvoiceRecord = (record: InvoiceRecord) => {
    setInvoice(invoiceRecordToData(record));
    setActiveTab("builder");
    showToast(`Loaded ${record.invoiceNumber}`, "info");
  };

  const handleDeleteInvoiceRecord = (recordId: string) => {
    persistHistory(invoiceHistory.filter((record) => record.recordId !== recordId));
    showToast("Removed invoice history record", "info");
  };

  // Add Item to list
  const handleAddItem = (lineType: InvoiceItem["lineType"] = "charge") => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      description: "",
      quantity: 1,
      rate: 0,
      lineType,
    };
    setInvoice((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    showToast(lineType === "deduction" ? "Added deduction item" : "Added new service item", "info");
  };

  // Delete Item from list
  const handleDeleteItem = (id: string) => {
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
    showToast("Removed service item", "info");
  };

  // Edit Item row
  const handleEditItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            [field]: value,
          };
        }
        return item;
      }),
    }));
  };

  // Reset form to empty template
  const handleResetForm = () => {
    setInvoice(createEmptyInvoice());
    showToast("Cleared builder workspace", "info");
  };

  // Load demo data
  const handleLoadDemo = () => {
    setInvoice(DEMO_INVOICE);
    showToast("Loaded enterprise demo template", "success");
  };

  const handlePaymentModeChange = (mode: PaymentMode) => {
    const defaultAccount = REMITTANCE_OPTIONS[mode][0];

    setInvoice((prev) => ({
      ...prev,
      bankName: mode,
      accountName: defaultAccount.accountName,
      accountNumber: defaultAccount.accountNumber,
    }));
  };

  const handleRemittanceAccountChange = (accountNumber: string) => {
    const mode = invoice.bankName as PaymentMode;
    const account = REMITTANCE_OPTIONS[mode]?.find(
      (option) => option.accountNumber === accountNumber
    );

    if (!account) {
      return;
    }

    setInvoice((prev) => ({
      ...prev,
      accountName: account.accountName,
      accountNumber: account.accountNumber,
    }));
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] dark:bg-[#090d16] dark:text-[#f1f5f9] flex flex-col font-sans transition-colors duration-300 pb-16">

      {/* Dynamic Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 py-3 px-4 rounded-xl shadow-2xl animate-bounce bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold border border-slate-700/30">
          <CheckCircle size={16} className="text-cyan-400 dark:text-indigo-600" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* HEADER HERO BAR */}
      <header className="w-full bg-white/70 dark:bg-[#0f172a]/70 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-40 transition-colors duration-300 print:hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600/10 p-2.5 rounded-xl border border-indigo-500/20">
              {/* Decorative mini tech logo */}
              <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
                M
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-none text-slate-950 dark:text-white">
                Medrozo Invoice Maker
              </h1>
              <p className="text-[11px] font-medium tracking-wide text-slate-400 mt-1 uppercase">
                Template Maker
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex h-10 rounded-xl border border-slate-200 dark:border-slate-800 p-1">
              {[
                { key: "builder", label: "Builder", icon: FileText },
                { key: "history", label: "History", icon: History },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as ActiveTab)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors ${isActive
                      ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                      }`}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleLoadDemo}
              className="flex items-center justify-center gap-2 flex-1 sm:flex-initial h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
            >
              <Sparkles size={14} className="text-cyan-500" />
              Demo Data
            </button>
            <button
              onClick={handleResetForm}
              className="flex items-center justify-center gap-2 flex-1 sm:flex-initial h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
            >
              <RotateCcw size={14} className="text-slate-400" />
              Reset
            </button>

            <button
              onClick={handleSaveInvoice}
              className="flex items-center justify-center gap-2 flex-1 sm:flex-initial h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
            >
              <Save size={14} className="text-emerald-500" />
              Record
            </button>

            <button
              onClick={handlePrintInvoice}
              className="flex items-center justify-center gap-2 flex-1 sm:flex-auto h-10 px-6 rounded-xl text-xs font-bold text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35 transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: COLOR_THEMES[invoice.accentColor]?.primary || "#4f46e5",
              }}
            >
              <Printer size={15} />
              Print Invoice
            </button>
          </div>
        </div>
      </header>

      {activeTab === "history" ? (
        <main className="max-w-7xl mx-auto w-full px-4 md:px-8 pt-8 print:hidden">
          <section className="bg-white dark:bg-[#0f172a] rounded-2xl premium-shadow border border-slate-100 dark:border-slate-800/55 overflow-hidden">
            <div className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-800/60 p-6">
              <div className="flex items-center gap-2">
                <History size={18} className="text-indigo-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Past Invoices
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Records are saved on this browser so you can reload previous invoices anytime.
              </p>
            </div>

            {invoiceHistory.length === 0 ? (
              <div className="p-10 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-900">
                  <FileText size={20} className="text-slate-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  No invoice records yet
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Click Record or Print Invoice after creating an invoice.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/40 text-[11px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-6 py-3 font-bold">Invoice</th>
                      <th className="px-6 py-3 font-bold">Client</th>
                      <th className="px-6 py-3 font-bold">Issue Date</th>
                      <th className="px-6 py-3 text-right font-bold">Total</th>
                      <th className="px-6 py-3 font-bold">Recorded</th>
                      <th className="px-6 py-3 text-right font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {invoiceHistory.map((record) => (
                      <tr key={record.recordId} className="text-sm">
                        <td className="px-6 py-4">
                          <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                            {record.invoiceNumber}
                          </div>
                          <div className="mt-1 text-[11px] text-slate-400">
                            {record.itemCount} item{record.itemCount === 1 ? "" : "s"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-700 dark:text-slate-200">
                            {record.clientName || "Unnamed client"}
                          </div>
                          <div className="mt-1 text-[11px] text-slate-400">
                            {record.clientEmail || record.clientPhone || "No contact details"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                          {record.issueDate || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {formatMoney(record.totalAmount, record.currency)}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                          {formatRecordDate(record.savedAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleLoadInvoiceRecord(record)}
                              className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900/60"
                            >
                              Load
                            </button>
                            <button
                              onClick={() => handleDeleteInvoiceRecord(record.recordId)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:border-red-200 hover:text-red-500 dark:border-slate-800"
                              title="Delete history record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      ) : (
        /* CORE CONTENT GRID */
        <main className="max-w-7xl mx-auto w-full px-4 md:px-8 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* CONTROL SIDEBAR (LEFT) */}
        <section className="lg:col-span-5 flex flex-col gap-6 print:hidden">

          {/* Theme & Settings Card */}
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 premium-shadow border border-slate-100 dark:border-slate-800/55 transition-colors">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <Settings size={18} className="text-slate-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Studio Settings
              </h2>
            </div>

            <div className="space-y-4">
              {/* Color accent selectors */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
                  Invoice Accent Theme
                </label>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(COLOR_THEMES).map(([key, value]) => {
                    const isActive = invoice.accentColor === key;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setInvoice((prev) => ({ ...prev, accentColor: key }));
                          showToast(`Applied ${key} theme`, "info");
                        }}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isActive
                          ? "ring-2 ring-slate-900 dark:ring-white scale-110 shadow-md"
                          : "opacity-85 hover:scale-105 hover:opacity-100"
                          }`}
                        style={{ backgroundColor: value.primary }}
                        title={`${key.charAt(0).toUpperCase() + key.slice(1)} accent`}
                      >
                        {isActive && (
                          <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Currency Selector */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
                  Currency Mode
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { code: "USD", label: "$ USD" },
                    { code: "EUR", label: "€ EUR" },
                    { code: "GBP", label: "£ GBP" },
                    { code: "PHP", label: "₱ PHP" },
                  ].map((curr) => {
                    const isActive = invoice.currency === curr.code;
                    return (
                      <button
                        key={curr.code}
                        onClick={() => {
                          setInvoice((prev) => ({ ...prev, currency: curr.code }));
                          showToast(`Set currency to ${curr.code}`, "info");
                        }}
                        className={`h-9 rounded-lg text-xs font-bold transition-all border ${isActive
                          ? "bg-slate-950 border-slate-950 text-white dark:bg-white dark:border-white dark:text-slate-900"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400"
                          }`}
                      >
                        {curr.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Client Details Card */}
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 premium-shadow border border-slate-100 dark:border-slate-800/55 transition-colors">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <User size={18} className="text-slate-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Client Information
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corporation"
                  value={invoice.clientName}
                  onChange={(e) => setInvoice((prev) => ({ ...prev, clientName: e.target.value }))}
                  className="w-full h-10 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="billing@acme.com"
                    value={invoice.clientEmail}
                    onChange={(e) => setInvoice((prev) => ({ ...prev, clientEmail: e.target.value }))}
                    className="w-full h-10 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+1 (555) 012-34"
                    value={invoice.clientPhone}
                    onChange={(e) => setInvoice((prev) => ({ ...prev, clientPhone: e.target.value }))}
                    className="w-full h-10 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Billing Address
                </label>
                <textarea
                  rows={3}
                  placeholder="Street Address, City, Zip"
                  value={invoice.clientAddress}
                  onChange={(e) => setInvoice((prev) => ({ ...prev, clientAddress: e.target.value }))}
                  className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-sans resize-none leading-relaxed text-xs"
                />
              </div>
            </div>
          </div>

          {/* Invoice Meta Card */}
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 premium-shadow border border-slate-100 dark:border-slate-800/55 transition-colors">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <Clock size={18} className="text-slate-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Invoice Details
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={invoice.invoiceNumber}
                  onChange={(e) => setInvoice((prev) => ({ ...prev, invoiceNumber: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-mono font-bold text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={invoice.issueDate}
                  onChange={(e) => setInvoice((prev) => ({ ...prev, issueDate: e.target.value }))}
                  className="w-full h-10 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={invoice.dueDate}
                  onChange={(e) => setInvoice((prev) => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full h-10 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-xs"
                />
              </div>
            </div>
          </div>

          {/* Line Items Editor Card */}
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 premium-shadow border border-slate-100 dark:border-slate-800/55 transition-colors">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4 border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <div className="flex items-center gap-2">
                <h1 className="text-slate-400">₱</h1>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Service Line Items
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleAddItem("charge")}
                  className="flex items-center gap-1 text-[11px] font-bold text-white px-3 py-1.5 rounded-lg transition-transform hover:scale-105 active:scale-95 shadow-md shadow-slate-900/10"
                  style={{
                    backgroundColor: COLOR_THEMES[invoice.accentColor]?.primary || "#4f46e5",
                  }}
                >
                  <Plus size={12} />
                  Add Item
                </button>
                <button
                  onClick={() => handleAddItem("deduction")}
                  className="flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-[11px] font-bold text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-900/60 dark:hover:bg-rose-950/20"
                >
                  <Minus size={12} />
                  Add Deduction
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {invoice.items.length === 0 ? (
                <div className="text-center py-8 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                  No products or services. Click Add Item above.
                </div>
              ) : (
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {invoice.items.map((item, idx) => {
                    const isDeduction = item.lineType === "deduction";
                    const lineAmount = getLineItemAmount(item);

                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl border dark:border-slate-800/80 flex flex-col gap-3 relative group ${isDeduction
                          ? "border-rose-100 bg-rose-50/40 dark:bg-rose-950/10"
                          : "border-slate-100 bg-slate-50/50 dark:bg-slate-900/30"
                          }`}
                      >
                        {/* Delete icon */}
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="absolute top-2.5 right-2.5 text-slate-400 hover:text-red-500 transition-colors p-1"
                          title="Delete Row"
                        >
                          <Trash2 size={13} />
                        </button>

                      <div className="flex items-center justify-between pr-8">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">
                          Item #{idx + 1}
                        </div>
                        <div className="flex h-8 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-950/30">
                          {[
                            { value: "charge", label: "Add", icon: Plus },
                            { value: "deduction", label: "Minus", icon: Minus },
                          ].map((mode) => {
                            const ModeIcon = mode.icon;
                            const isActive = (item.lineType ?? "charge") === mode.value;

                            return (
                              <button
                                key={mode.value}
                                onClick={() => handleEditItem(item.id, "lineType", mode.value)}
                                className={`flex items-center gap-1 rounded-md px-2 text-[10px] font-bold transition-colors ${isActive
                                  ? mode.value === "deduction"
                                    ? "bg-rose-600 text-white"
                                    : "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                                  : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                  }`}
                              >
                                <ModeIcon size={11} />
                                {mode.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <input
                          type="text"
                          placeholder="Item description or service title"
                          value={item.description}
                          onChange={(e) => handleEditItem(item.id, "description", e.target.value)}
                          className="w-full h-8 px-2 rounded border border-slate-200 dark:border-slate-800 bg-transparent text-xs focus:outline-none focus:border-indigo-600 transition-all font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {/* Quantity */}
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                            Qty
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleEditItem(item.id, "quantity", Math.max(1, parseInt(e.target.value) || 0))}
                            className="w-full h-8 px-2 rounded border border-slate-200 dark:border-slate-800 bg-transparent text-xs text-center font-mono"
                          />
                        </div>

                        {/* Rate */}
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                            Rate
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.rate || ""}
                            placeholder="0.00"
                            onChange={(e) => handleEditItem(item.id, "rate", Math.max(0, parseFloat(e.target.value) || 0))}
                            className="w-full h-8 px-2 rounded border border-slate-200 dark:border-slate-800 bg-transparent text-xs text-right font-mono"
                          />
                        </div>

                        {/* Total display */}
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1 text-right">
                            Total
                          </label>
                          <div className="h-8 leading-8 text-right text-xs font-mono font-bold text-slate-700 dark:text-slate-300 pr-1">
                            {lineAmount.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Discount and Taxes */}
              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/60 pt-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={invoice.discountRate || ""}
                    onChange={(e) => setInvoice((prev) => ({ ...prev, discountRate: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) }))}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-mono text-center"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    Sales Tax (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={invoice.taxRate || ""}
                    onChange={(e) => setInvoice((prev) => ({ ...prev, taxRate: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) }))}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-mono text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Terms & Bank Remittance */}
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 premium-shadow border border-slate-100 dark:border-slate-800/55 transition-colors">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <CreditCard size={18} className="text-slate-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Remittance details
              </h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    Mode of Payment
                  </label>
                  <select
                    value={invoice.bankName}
                    onChange={(e) => handlePaymentModeChange(e.target.value as PaymentMode)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-semibold uppercase"
                  >
                    {Object.keys(REMITTANCE_OPTIONS).map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    Account Selection
                  </label>
                  <select
                    value={invoice.accountNumber}
                    onChange={(e) => handleRemittanceAccountChange(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                  >
                    {(REMITTANCE_OPTIONS[invoice.bankName as PaymentMode] ?? REMITTANCE_OPTIONS["UNION BANK"]).map((account) => (
                      <option key={account.accountNumber} value={account.accountNumber}>
                        {account.accountName} - {account.accountNumber}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={invoice.accountName}
                    readOnly
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={invoice.accountNumber}
                    readOnly
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 text-xs font-mono"
                  />
                </div>
                {/* <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    SWIFT / BIC Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. METRUS33XXX"
                    value={invoice.swiftCode}
                    onChange={(e) => setInvoice((prev) => ({ ...prev, swiftCode: e.target.value.toUpperCase() }))}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-mono"
                  />
                </div> */}
              </div>
            </div>
          </div>

          {/* Notes & Terms Card */}
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 premium-shadow border border-slate-100 dark:border-slate-800/55 transition-colors">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <FileText size={18} className="text-slate-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Terms & Custom Notes
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Custom Note (Top / Bottom section)
                </label>
                <textarea
                  rows={2}
                  placeholder="A friendly message to your client..."
                  value={invoice.notes}
                  onChange={(e) => setInvoice((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-xs resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  Terms & Conditions
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Payment due within 30 days of receipt."
                  value={invoice.paymentTerms}
                  onChange={(e) => setInvoice((prev) => ({ ...prev, paymentTerms: e.target.value }))}
                  className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800/60 pt-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    Invoice Maker Name
                  </label>
                  <input
                    type="text"
                    placeholder="Name"
                    value={invoice.preparedByName}
                    onChange={(e) => setInvoice((prev) => ({ ...prev, preparedByName: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    Position
                  </label>
                  <input
                    type="text"
                    placeholder="Position / title"
                    value={invoice.preparedByPosition}
                    onChange={(e) => setInvoice((prev) => ({ ...prev, preparedByPosition: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    placeholder="+63..."
                    value={invoice.preparedByContact}
                    onChange={(e) => setInvoice((prev) => ({ ...prev, preparedByContact: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* PRINTABLE PREVIEW SHEET CANVAS (RIGHT) */}
        <section className="lg:col-span-7 flex flex-col items-center gap-6 print:w-full print:p-0">

          {/* Header toolbar for screen view */}
          <div className="w-full max-w-[21cm] bg-white dark:bg-[#0f172a] rounded-2xl py-3 px-5 border border-slate-100 dark:border-slate-800/55 flex justify-between items-center premium-shadow print:hidden transition-colors">
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-indigo-500" />
              <span className="text-xs font-bold tracking-wide uppercase text-slate-600 dark:text-slate-400">
                Live Interactive Print Canvas
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="bg-slate-100 dark:bg-slate-800/70 py-1 px-2 rounded-md font-semibold text-[10px]">
                A4 SCALE 1:1
              </span>
            </div>
          </div>

          {/* Printable Invoice Container */}
          <div className="w-full flex justify-center bg-slate-200/40 dark:bg-slate-950/20 p-4 md:p-6 rounded-3xl border border-slate-200/50 dark:border-slate-900/50 print:bg-transparent print:p-0 print:border-none">
            <div className="w-full overflow-x-auto select-text shadow-xl rounded-xl scrollbar-none print:shadow-none print:rounded-none">
              <InvoiceTemplate ref={contentRef} data={invoice} />
            </div>
          </div>
        </section>

        </main>
      )}
    </div>
  );
}
