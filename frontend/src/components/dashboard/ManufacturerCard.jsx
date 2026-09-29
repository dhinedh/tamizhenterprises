import React from 'react';
import {
  Building2,
  Package,
  IndianRupee,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';

const ManufacturerCard = ({ manufacturer, onClick }) => {
  const isFemi9 = manufacturer.code === 'FEMI9';
  const isMansara = manufacturer.code === 'MANSARA';

  const hasLowStock = (manufacturer.lowStockCount || 0) > 0;

  return (
    <div
      onClick={onClick}
      className={`group relative bg-white rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 ${
        isFemi9
          ? 'border-pink-200 hover:border-pink-400 ring-1 ring-pink-100 shadow-xs'
          : isMansara
          ? 'border-amber-200 hover:border-amber-400 ring-1 ring-amber-100 shadow-xs'
          : 'border-slate-200 hover:border-teal-400 shadow-xs'
      }`}
    >
      {/* Top Header Strip with Color Accent */}
      <div
        className={`h-1.5 w-full ${
          isFemi9
            ? 'bg-gradient-to-r from-pink-500 via-rose-400 to-pink-600'
            : isMansara
            ? 'bg-gradient-to-r from-amber-500 via-orange-400 to-emerald-500'
            : 'bg-gradient-to-r from-teal-600 via-emerald-500 to-cyan-600'
        }`}
      />

      <div className="p-5 flex-1 flex flex-col justify-between">
        {/* Top Meta */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm tracking-wider shadow-inner transition-transform group-hover:scale-105 ${
                  isFemi9
                    ? 'bg-pink-100 text-pink-700 border border-pink-200'
                    : isMansara
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-teal-50 text-teal-800 border border-teal-200'
                }`}
              >
                {manufacturer.code ? manufacturer.code.substring(0, 3) : <Building2 className="w-5 h-5" />}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-teal-700 transition-colors">
                    {manufacturer.name}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                    {manufacturer.code}
                  </span>
                  {manufacturer.city && (
                    <span className="flex items-center gap-1 text-[11px]">
                      <MapPin className="w-3 h-3 text-slate-400" /> {manufacturer.city}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-col items-end gap-1">
              {isFemi9 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200 shadow-2xs">
                  <Sparkles className="w-2.5 h-2.5" /> Femi9 Brand
                </span>
              )}
              {isMansara && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                  <Sparkles className="w-2.5 h-2.5" /> Mansara Foods
                </span>
              )}
              {hasLowStock && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <AlertTriangle className="w-2.5 h-2.5" /> {manufacturer.lowStockCount} Low SKU
                </span>
              )}
            </div>
          </div>

          {/* Categories tags */}
          {manufacturer.categories && manufacturer.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {manufacturer.categories.slice(0, 3).map((cat, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-2.5 mt-4 pt-4 border-t border-slate-100">
            {/* Metric 1: SKUs */}
            <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Catalogue
              </div>
              <div className="text-sm font-bold text-slate-900 mt-0.5 flex items-baseline gap-1">
                {manufacturer.productsCount || 0} <span className="text-[11px] font-medium text-slate-500">SKUs</span>
              </div>
              <div className="text-[10px] text-teal-700 font-medium mt-0.5">
                {manufacturer.totalAvailableStock || 0} units available
              </div>
            </div>

            {/* Metric 2: Live Stock Value */}
            <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Stock Valuation
              </div>
              <div className="text-sm font-bold text-emerald-700 mt-0.5">
                ₹ {Number(manufacturer.stockValuation || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                In warehouse
              </div>
            </div>

            {/* Metric 3: Procurement Purchases */}
            <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Total Purchased
              </div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                ₹ {Number(manufacturer.totalPurchased || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                From manufacturer
              </div>
            </div>

            {/* Metric 4: Sales Revenue */}
            <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Sales Revenue
              </div>
              <div className="text-sm font-bold text-teal-700 mt-0.5">
                ₹ {Number(manufacturer.salesRevenue || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {manufacturer.unitsSold || 0} units distributed
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Payable: <span className="font-bold text-slate-800">₹ {Number(manufacturer.currentOutstanding || 0).toLocaleString('en-IN')}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-50 group-hover:bg-teal-600 text-teal-800 group-hover:text-white transition-all text-xs font-bold border border-teal-200 group-hover:border-teal-600 shadow-2xs">
            <span>Open {manufacturer.code} Workspace</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManufacturerCard;
