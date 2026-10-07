/**
 * Converts a number to Indian currency words format
 * e.g., 3966 => "INR Three Thousand Nine Hundred And Sixty Six Only"
 * e.g., 0 => "Nil"
 */

const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertGroup(n) {
  let str = '';
  if (n >= 100) {
    str += ones[Math.floor(n / 100)] + ' Hundred ';
    n %= 100;
    if (n > 0) str += 'And ';
  }
  if (n >= 20) {
    str += tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
  } else if (n > 0) {
    str += ones[n];
  }
  return str.trim();
}

function numberToWordsINR(amount, prefix = 'INR ') {
  if (amount === undefined || amount === null || isNaN(amount) || amount === 0) {
    return 'Nil';
  }

  const num = Math.round(Number(amount));
  if (num === 0) return 'Nil';

  let crore = Math.floor(num / 10000000);
  let remainder = num % 10000000;

  let lakh = Math.floor(remainder / 100000);
  remainder %= 100000;

  let thousand = Math.floor(remainder / 1000);
  remainder %= 1000;

  let hundred = remainder;

  const parts = [];

  if (crore > 0) {
    parts.push(convertGroup(crore) + ' Crore');
  }
  if (lakh > 0) {
    parts.push(convertGroup(lakh) + ' Lakh');
  }
  if (thousand > 0) {
    parts.push(convertGroup(thousand) + ' Thousand');
  }
  if (hundred > 0) {
    parts.push(convertGroup(hundred));
  }

  const words = parts.join(' ').replace(/\s+/g, ' ').trim();
  return `${prefix}${words} Only`;
}

module.exports = { numberToWordsINR };
