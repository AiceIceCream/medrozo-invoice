import React, { forwardRef } from "react";
import Image from "next/image";
import MedrozoLogo from "@/assets/logo.jpeg";

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
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

const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(({ data }, ref) => {
  const theme = COLOR_THEMES[data.accentColor] || COLOR_THEMES.indigo;

  // Invoice calculations
  const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
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
              className="h-32 w-auto max-w-[260px] object-contain print:h-28"
              priority
            />

            <div className="text-slate-500 space-y-1 mt-3 text-xs">
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

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-500">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8 print:my-4 print:gap-4 print:grid-cols-2">
          {/* Client Details */}
          <div className="p-5 rounded-lg border border-slate-100" style={{ backgroundColor: theme.bg }}>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: theme.text }}>
              Billed To
            </h3>
            <div className="space-y-1 text-slate-700">
              <p className="font-bold text-slate-900 text-base">{data.clientName || "Client Name"}</p>
              {data.clientEmail && <p className="text-xs text-slate-500">{data.clientEmail}</p>}
              {data.clientPhone && <p className="text-xs text-slate-500">{data.clientPhone}</p>}
              {data.clientAddress && (
                <p className="text-xs mt-2 text-slate-600 whitespace-pre-line leading-relaxed">
                  {data.clientAddress}
                </p>
              )}
            </div>
          </div>

          {/* Payment Status / Overview */}
          <div className="flex flex-col justify-between p-5 rounded-lg border border-slate-100 bg-slate-50">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Payment Information
              </h3>
              <div className="space-y-1 text-xs text-slate-600">
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
                <th className="py-3 px-2 text-slate-500">Service / Item Description</th>
                <th className="py-3 px-2 text-center text-slate-500 w-20">Qty</th>
                <th className="py-3 px-2 text-right text-slate-500 w-32">Rate</th>
                <th className="py-3 px-2 text-right text-slate-500 w-36">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                    No items added yet. Complete the form to populate table.
                  </td>
                </tr>
              ) : (
                data.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-2 font-medium text-slate-900 leading-snug">
                      {item.description || <span className="text-slate-300 italic">No description</span>}
                    </td>
                    <td className="py-4 px-2 text-center font-mono text-slate-600">
                      {item.quantity}
                    </td>
                    <td className="py-4 px-2 text-right font-mono text-slate-600">
                      {formatCurrency(item.rate, data.currency)}
                    </td>
                    <td className="py-4 px-2 text-right font-mono font-semibold text-slate-900">
                      {formatCurrency(item.quantity * item.rate, data.currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* SUMMARY SECTION */}
        <div className="mt-10 print:mt-6 grid grid-cols-1 md:grid-cols-2 gap-8 print:gap-4 pt-8 print:pt-4 border-t border-slate-100 print:grid-cols-2 print-no-break">
          {/* Notes & Bank Details */}
          <div className="space-y-6">
            {/* Bank details */}
            {(data.bankName || data.accountNumber) && (
              <div className="p-4 rounded-lg bg-slate-50/70 border border-slate-100 text-xs">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Direct Remittance Details
                </h4>
                <div className="grid grid-cols-3 gap-y-1 text-slate-600">
                  {data.bankName && (
                    <>
                      <span className="font-semibold text-slate-700">Mode:</span>
                      <span className="col-span-2">{data.bankName}</span>
                    </>
                  )}
                  {data.accountName && (
                    <>
                      <span className="font-semibold text-slate-700">Account Name:</span>
                      <span className="col-span-2">{data.accountName}</span>
                    </>
                  )}
                  {data.accountNumber && (
                    <>
                      <span className="font-semibold text-slate-700">Account No:</span>
                      <span className="col-span-2 font-mono">{data.accountNumber}</span>
                    </>
                  )}
                  {/* {data.swiftCode && (
                    <>
                      <span className="font-semibold text-slate-700">SWIFT / BIC:</span>
                      <span className="col-span-2 font-mono uppercase">{data.swiftCode}</span>
                    </>
                  )} */}
                </div>
              </div>
            )}

            {/* Notes & Terms */}
            {data.notes && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Notes
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {data.notes}
                </p>
              </div>
            )}

            {data.paymentTerms && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Terms & Conditions
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
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

      {/* FOOTER SECTION */}
      <div className="mt-16 print:mt-8 pt-8 print:pt-4 border-t border-slate-100 text-center text-xs text-slate-400 space-y-1.5 print-no-break">
        <p className="font-semibold text-slate-600">
          Thank you for choosing Medrozo IT Solutions as your technology partner!
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
