import React, { forwardRef } from "react";
import Image from "next/image";
import MedrozoLogo from "@/assets/logo2.jpg";

export const REMITTANCE_OPTIONS = {
  GCASH: [
    { accountName: "Bryan M.", accountNumber: "0997-255-550" },
    { accountName: "Rubelyn M.", accountNumber: "0995-499-0899" },
  ],
  "UNION BANK": [
    { accountName: "MEDROZO IT SOLUTIONS", accountNumber: "0012 0003 6168" },
  ],
} as const;

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  lineType?: "charge" | "deduction";
}

export interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  items: InvoiceItem[];
  taxRate: number;
  discountRate: number;
  currency: string;
  notes: string;
  paymentTerms: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  swiftCode: string;
  accentColor: string;
  preparedByName: string;
  preparedByPosition: string;
  preparedByContact: string;
}

interface InvoiceTemplateProps {
  data: InvoiceData;
}

// Accent Color Configurations
export const COLOR_THEMES: Record<string, { primary: string; bg: string; text: string; border: string }> = {
  indigo: {
    primary: "#4f46e5", // indigo-600
    bg: "#f5f3ff",      // indigo-50
    text: "#4338ca",    // indigo-700
    border: "#c7d2fe",  // indigo-200
  },
  emerald: {
    primary: "#059669", // emerald-600
    bg: "#ecfdf5",      // emerald-50
    text: "#047857",    // emerald-700
    border: "#a7f3d0",  // emerald-200
  },
  rose: {
    primary: "#e11d48", // rose-600
    bg: "#fff1f2",      // rose-50
    text: "#be123c",    // rose-700
    border: "#fecdd3",  // rose-200
  },
  cyan: {
    primary: "#022edeff", // cyan-600
    bg: "#b9defaff",      // cyan-50
    text: "#0e7490",    // cyan-700
    border: "#76b2f6ff",  // cyan-200
  },
  violet: {
    primary: "#7c3aed", // violet-600
    bg: "#faf5ff",      // violet-50
    text: "#6d28d9",    // violet-700
    border: "#ddd6fe",  // violet-200
  },
  slate: {
    primary: "#475569", // slate-600
    bg: "#f8fafc",      // slate-50
    text: "#334155",    // slate-700
    border: "#e2e8f0",  // slate-200
  },
};

export const formatCurrency = (value: number, currency: string) => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
};

export const getLineItemAmount = (item: InvoiceItem) => {
  const amount = item.quantity * item.rate;

  return item.lineType === "deduction" ? -amount : amount;
};

const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(({ data }, ref) => {
  const theme = COLOR_THEMES[data.accentColor] || COLOR_THEMES.indigo;

  // Invoice calculations
  const subtotal = data.items.reduce((sum, item) => sum + getLineItemAmount(item), 0);
  const discountAmount = subtotal * (data.discountRate / 100);
  const taxAmount = (subtotal - discountAmount) * (data.taxRate / 100);
  const totalAmount = subtotal - discountAmount + taxAmount;

  return (
    <div
      ref={ref}
      className="invoice-paper relative bg-white border border-slate-100 p-8 md:p-12 mx-auto rounded-lg text-slate-800 flex flex-col justify-between"
      style={{
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
        width: "100%",
        maxWidth: "21cm", // Standard A4 width
        minHeight: "29.7cm", // Standard A4 height
        fontSize: "14px",
      }}
    >
      <div>
        {/* TOP BRAND BANNER DECORATION (Only for digital preview/design contrast) */}
        <div
          className="absolute top-0 left-0 w-full h-2 rounded-t-lg print:hidden"
          style={{ backgroundColor: theme.primary }}
        />

        {/* HEADER SECTION - Side-by-side container for both screen and print */}
        <div className="flex flex-row justify-between items-start gap-8 border-b pb-8 print:pb-4 border-slate-100 w-full">

          {/* LEFT SIDE: Company Branding */}
          <div className="flex min-w-0 flex-col">
            <Image
              src={MedrozoLogo}
              alt="Medrozo Logo"
              className="h-32 w-auto max-w-[180px] object-contain print:h-30 "
              priority
            />

            <div className="text-slate-500 space-y-1 mt-3 text-[10px]">
              <p className="font-semibold text-slate-700">Medrozo IT Solutions</p>
              <p>Barra  New Road Macabalan, Cagayan de Oro City</p>
              <p>Email: support@medrozonetworks.com</p>
              <p>Phone: +63 977-2555-500</p>
              <p>Page: medrozoitsolutions.com</p>
            </div>
          </div>

          {/* Invoice identifiers */}
          <div className="flex flex-col items-end text-right">
            <h1
              className="text-4xl font-extrabold tracking-tight uppercase mb-4"
              style={{ color: theme.primary }}
            >
              INVOICE
            </h1>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-slate-500">
              <span className="font-semibold text-slate-700">Invoice Number:</span>
              <span className="font-mono text-slate-900 font-bold">{data.invoiceNumber || "N/A"}</span>

              <span className="font-semibold text-slate-700">Issue Date:</span>
              <span className="text-slate-900">{data.issueDate || "N/A"}</span>

              <span className="font-semibold text-slate-700">Due Date:</span>
              <span className="text-slate-900 font-semibold" style={{ color: theme.text }}>
                {data.dueDate || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* BILLING AND CLIENT DETAILS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-1 print:my-2 print:gap-4 print:grid-cols-2">
          {/* Client Details */}
          <div className="p-5 rounded-lg border border-slate-100" style={{ backgroundColor: theme.bg }}>
            <h3 className="text-[12px] font-bold uppercase tracking-wider mb-1" style={{ color: theme.text }}>
              Billed To
            </h3>
            <div className="space-y-1 text-slate-700">
              <p className="font-bold text-slate-900 text-[14px]">{data.clientName || "Client Name"}</p>
              {data.clientEmail && <p className="text-xs text-slate-500">{data.clientEmail}</p>}
              {data.clientPhone && <p className="text-xs text-slate-500">{data.clientPhone}</p>}
              {data.clientAddress && (
                <p className="text-[10px] mt-2 text-slate-600 whitespace-pre-line leading-relaxed">
                  {data.clientAddress}
                </p>
              )}
            </div>
          </div>

          {/* Payment Status / Overview */}
          <div className="flex flex-col justify-between p-5 rounded-lg border border-slate-100 bg-slate-50">
            <div>
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Payment Information
              </h3>
              <div className="space-y-1 text-[14px] text-slate-600">
                <p><span className="font-semibold text-slate-800">Method:</span> {data.bankName || "N/A"}</p>
                <p><span className="font-semibold text-slate-800">Currency:</span> {data.currency}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Amount Due</span>
              <span className="text-xl font-bold" style={{ color: theme.primary }}>
                {formatCurrency(totalAmount, data.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* LINE ITEMS TABLE */}
        <div className="mt-8 print:mt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className="border-b text-xs uppercase font-semibold tracking-wider text-slate-600"
                style={{ borderBottomColor: theme.border }}
              >
                <th className="py-1 px-1 text-slate-500">Service / Item Description</th>
                <th className="py-1 px-1 text-center text-slate-500 w-20">Qty</th>
                <th className="py-1 px-1 text-right text-slate-500 w-32">Rate</th>
                <th className="py-1 px-1 text-right text-slate-500 w-36">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[12px]">
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-1 text-center text-slate-400 italic">
                    No items added yet. Complete the form to populate table.
                  </td>
                </tr>
              ) : (
                data.items.map((item) => {
                  const lineAmount = getLineItemAmount(item);
                  const isDeduction = item.lineType === "deduction";

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-1 px-1 font-medium text-slate-900 leading-snug">
                        <div className="flex items-center gap-2">
                          {isDeduction && (
                            <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-rose-600">
                              Deduct
                            </span>
                          )}
                          <span>
                            {item.description || <span className="text-slate-300 italic">No description</span>}
                          </span>
                        </div>
                      </td>
                      <td className="py-1 px-1 text-center font-mono text-slate-600">
                        {item.quantity}
                      </td>
                      <td className="py-1 px-1 text-right font-mono text-slate-600">
                        {formatCurrency(item.rate, data.currency)}
                      </td>
                      <td className={`py-1 px-1 text-right font-mono font-semibold ${isDeduction ? "text-rose-600" : "text-slate-900"}`}>
                        {formatCurrency(lineAmount, data.currency)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* SUMMARY SECTION */}
        <div className="mt-10 print:mt-6 grid grid-cols-1 md:grid-cols-2 gap-2 print:gap-2 pt-8 print:pt-4 border-t border-slate-100 print:grid-cols-2 print-no-break">
          {/* Notes & Bank Details */}
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-slate-50/70 border border-slate-100 text-xs">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2">
                Direct Remittance Details
              </h4>
              <div className="space-y-2 text-slate-600">
                {Object.entries(REMITTANCE_OPTIONS).map(([mode, accounts]) => (
                  <div
                    key={mode}
                    className="border-t border-slate-200/70 pt-2 first:border-t-0 first:pt-0"
                  >
                    <div className="mb-1 font-bold uppercase tracking-wide text-slate-700">
                      {mode}
                    </div>
                    <div className="space-y-1">
                      {accounts.map((account) => (
                        <div
                          key={account.accountNumber}
                          className="grid grid-cols-3 gap-y-0.5 rounded-md bg-white/70 p-2"
                        >
                          <span className="font-semibold text-slate-700">Account Name:</span>
                          <span className="col-span-2">{account.accountName}</span>
                          <span className="font-semibold text-slate-700">Account No:</span>
                          <span className="col-span-2 font-mono">{account.accountNumber}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Notes & Terms */}
            {data.notes && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Notes
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line text-justify">
                  {data.notes}
                </p>
              </div>
            )}

            {data.paymentTerms && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Terms & Conditions
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line text-justify">
                  {data.paymentTerms}
                </p>
              </div>
            )}
          </div>
          {/* Subtotal & Calculations */}
          <div className="flex flex-col justify-start md:items-end text-left md:text-right print:items-end print:text-right">
            <div className="w-full max-w-xs space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="font-mono text-slate-900 font-medium">
                  {formatCurrency(subtotal, data.currency)}
                </span>
              </div>
              {data.discountRate > 0 && (
                <div className="flex justify-between text-emerald-600 bg-emerald-50/50 py-1 px-1.5 rounded">
                  <span>Discount ({data.discountRate}%):</span>
                  <span className="font-mono font-medium">
                    -{formatCurrency(discountAmount, data.currency)}
                  </span>
                </div>
              )}

              {data.taxRate > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Sales Tax ({data.taxRate}%):</span>
                  <span className="font-mono text-slate-900 font-medium">
                    {formatCurrency(taxAmount, data.currency)}
                  </span>
                </div>
              )}

              <div
                className="flex justify-between text-base font-bold pt-3.5 border-t border-slate-200"
                style={{ color: theme.primary }}
              >
                <span>Total Amount:</span>
                <span className="font-mono text-lg">
                  {formatCurrency(totalAmount, data.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {(data.preparedByName || data.preparedByPosition || data.preparedByContact) && (
        <div className="mt-16 print:mt-10 flex justify-end print-no-break">
          <div className="w-full max-w-xs text-center">
            <div className="border-t border-slate-300 pt-2">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-800">
                {data.preparedByName || "Name"}
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                {data.preparedByPosition || "Position"}
              </p>
              <p className="text-[10px] font-mono text-slate-500">
                {data.preparedByContact || "Contact number"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER SECTION */}
      <div className="mt-16 print:mt-8 pt-8 print:pt-4 border-t border-slate-100 text-center text-xs text-slate-400 space-y-1.5 print-no-break">
        <p className="font-semibold text-slate-600">
          Thank you for choosing Medrozo IT Solutions!
        </p>
        {/* <p>If you have any questions regarding this invoice, please contact finance@medrozo.com</p> */}
        {/* <p className="text-[10px] text-slate-300 mt-2 font-mono">
          Generated automatically by Medrozo Live Invoice Builder on {new Date().toLocaleDateString("en-US")}
        </p> */}
      </div>
    </div>
  );
});

InvoiceTemplate.displayName = "InvoiceTemplate";

export default InvoiceTemplate;
