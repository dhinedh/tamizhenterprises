import React from 'react';

const Badge = ({ children, variant = 'neutral', className = '' }) => {
  const variants = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-teal-50 text-teal-700 border-teal-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant] || variants.neutral} ${className}`}
    >
      {children}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  switch (status) {
    case 'Pending':
      return <Badge variant="warning">Pending</Badge>;
    case 'Approved':
      return <Badge variant="info">Approved</Badge>;
    case 'Processing':
      return <Badge variant="purple">Processing</Badge>;
    case 'Dispatched':
      return <Badge variant="primary">Dispatched</Badge>;
    case 'In Transit':
      return <Badge variant="primary">In Transit</Badge>;
    case 'Delivered':
      return <Badge variant="success">Delivered</Badge>;
    case 'Received':
      return <Badge variant="success">Received</Badge>;
    case 'Ordered':
      return <Badge variant="info">Ordered</Badge>;
    case 'Paid':
      return <Badge variant="success">Paid</Badge>;
    case 'Partially Paid':
      return <Badge variant="warning">Partially Paid</Badge>;
    case 'Unpaid':
      return <Badge variant="danger">Unpaid</Badge>;
    case 'Active':
      return <Badge variant="success">Active</Badge>;
    case 'Inactive':
    case 'Suspended':
    case 'Cancelled':
      return <Badge variant="danger">{status}</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
};

export default Badge;
