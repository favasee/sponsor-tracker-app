/**
 * Converts a numeric amount into English words using the Indian / International format.
 * Examples:
 * 39600 -> "Thirty-Nine Thousand Six Hundred"
 * 125000 -> "One Lakh Twenty-Five Thousand" or "One Hundred Twenty-Five Thousand"
 */

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertLessThanThousand(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ONES[n];
  if (n < 100) {
    const unit = n % 10;
    return TENS[Math.floor(n / 10)] + (unit ? ' ' + ONES[unit] : '');
  }
  const rem = n % 100;
  return ONES[Math.floor(n / 100)] + ' Hundred' + (rem ? ' and ' + convertLessThanThousand(rem) : '');
}

/**
 * Converts integer to Indian numbering format (Crore, Lakh, Thousand, Hundred)
 */
export function numberToWordsIndian(num: number): string {
  if (num === 0) return 'Zero';
  if (num < 0) return 'Minus ' + numberToWordsIndian(Math.abs(num));

  let words = '';
  
  const crore = Math.floor(num / 10000000);
  num %= 10000000;

  const lakh = Math.floor(num / 100000);
  num %= 100000;

  const thousand = Math.floor(num / 1000);
  num %= 1000;

  const hundred = num;

  if (crore > 0) {
    words += convertLessThanThousand(crore) + ' Crore ';
  }
  if (lakh > 0) {
    words += convertLessThanThousand(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    words += convertLessThanThousand(thousand) + ' Thousand ';
  }
  if (hundred > 0) {
    words += convertLessThanThousand(hundred);
  }

  return words.trim();
}

/**
 * Format currency amount into official receipt wording
 * Example: 39600 with currency 'INR' -> "Thirty-Nine Thousand Six Hundred Rupees Only"
 */
export function formatAmountInWords(amount: number, currencyCode: string = 'INR'): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '';
  }

  const integerPart = Math.floor(Math.abs(amount));
  const decimalPart = Math.round((Math.abs(amount) - integerPart) * 100);

  const mainWords = numberToWordsIndian(integerPart);

  let currencyName = 'Rupees';
  let subunitName = 'Paise';

  switch (currencyCode.toUpperCase()) {
    case 'INR':
      currencyName = 'Rupees';
      subunitName = 'Paise';
      break;
    case 'USD':
      currencyName = 'US Dollars';
      subunitName = 'Cents';
      break;
    case 'AED':
      currencyName = 'UAE Dirhams';
      subunitName = 'Fils';
      break;
    case 'EUR':
      currencyName = 'Euros';
      subunitName = 'Cents';
      break;
    case 'GBP':
      currencyName = 'British Pounds';
      subunitName = 'Pence';
      break;
    case 'SAR':
      currencyName = 'Saudi Riyals';
      subunitName = 'Halalas';
      break;
    case 'QAR':
      currencyName = 'Qatari Riyals';
      subunitName = 'Dirhams';
      break;
    case 'KWD':
      currencyName = 'Kuwaiti Dinars';
      subunitName = 'Fils';
      break;
    default:
      currencyName = currencyCode;
      subunitName = 'Cents';
  }

  let result = `${currencyName} ${mainWords}`;

  if (decimalPart > 0) {
    const decimalWords = numberToWordsIndian(decimalPart);
    result += ` and ${decimalWords} ${subunitName}`;
  }

  result += ' Only';
  return result;
}

