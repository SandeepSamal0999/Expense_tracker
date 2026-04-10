import { Transaction, Category } from '../types';

// ─── Amount extraction ────────────────────────────────────────────────────────

const AMOUNT_REGEX = /(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)/i;

function extractAmount(text: string): number | null {
  const match = text.match(AMOUNT_REGEX);
  if (!match) return null;
  const amount = parseFloat(match[1].replace(/,/g, ''));
  return isNaN(amount) ? null : amount;
}

// ─── False positive rejection ─────────────────────────────────────────────────
// These phrases mean it's NOT an actual debit even if it contains an amount

// Phrases that indicate the SMS is NOT a debit transaction.
// Do NOT add balance-related phrases here — Indian bank debit SMS routinely
// include available balance at the end (e.g. "debited Rs.500. Avl bal: Rs.5000")
// and we don't want to reject those.
const FALSE_POSITIVE_PHRASES = [
  // Payment due / billing — not a debit
  'payment due',
  'minimum due',
  'minimum amount due',
  'total due',
  'amount due',
  'due date',
  'due on',
  'bill generated',
  'statement generated',
  'credit card statement',
  // UPI collect request — someone asking YOU to pay, not a debit
  'has requested',
  'collect request',
  'requested rs',
  'requested inr',
  'requested ₹',
  'request of rs',
  'request of inr',
  'request of ₹',
  // OTP messages
  'otp',
  'one time password',
  'is the otp',
  // Misc non-transaction
  'missed call',
  // Failed / reversed transactions
  'failed',
  'declined',
  'reversed',
  'insufficient',
];

function isFalsePositive(text: string): boolean {
  const lower = text.toLowerCase();
  return FALSE_POSITIVE_PHRASES.some(phrase => lower.includes(phrase));
}

// ─── Debit detection ─────────────────────────────────────────────────────────

const DEBIT_KEYWORDS = [
  'debited', 'debit',
  'spent', 'paid', 'payment of', 'payment done', 'payment successful',
  'purchase', 'withdrawn', 'transferred to', 'sent', 'charged',
];

const CREDIT_KEYWORDS = [
  'credited', 'received', 'refund', 'cashback',
];

function isDebitTransaction(text: string): boolean {
  const lower = text.toLowerCase();
  if (isFalsePositive(lower)) return false;
  if (CREDIT_KEYWORDS.some(k => lower.includes(k))) return false;
  return DEBIT_KEYWORDS.some(k => lower.includes(k));
}

// ─── Duplicate detection ──────────────────────────────────────────────────────
// Fingerprint = sender + amount + timestamp (within same minute)

export function smsFingerprint(address: string, body: string, date: number): string {
  const amount = extractAmount(body) ?? 0;
  const minute = Math.floor(date / 60000); // round to minute
  return `${address}_${amount}_${minute}`;
}

export function notifFingerprint(title: string, text: string, date: number): string {
  const amount = extractAmount(`${title} ${text}`) ?? 0;
  const minute = Math.floor(date / 60000);
  return `notif_${amount}_${minute}`;
}

// ─── Merchant extraction ──────────────────────────────────────────────────────

const MERCHANT_PATTERNS = [
  /at\s+([A-Z][A-Za-z0-9\s\-&'.]{2,30}?)(?:\s+on|\s+via|\s+for|\s*[.,]|$)/i,
  /to\s+([A-Z][A-Za-z0-9\s\-&'.]{2,30}?)(?:\s+on|\s+via|\s+for|\s+ref|\s*[.,]|$)/i,
  /for\s+([A-Z][A-Za-z0-9\s\-&'.]{2,30}?)(?:\s+on|\s+via|\s+ref|\s*[.,]|$)/i,
];

function extractMerchant(text: string): string {
  for (const pattern of MERCHANT_PATTERNS) {
    const match = text.match(pattern);
    if (match) return match[1].trim().replace(/\s+/g, ' ');
  }
  return 'Unknown';
}

// ─── Auto categorization ──────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Food: [
    'swiggy', 'zomato', 'dominos', 'domino', 'mcdonald', 'kfc', 'pizza',
    'restaurant', 'cafe', 'coffee', 'food', 'eat', 'biryani', 'bakery',
    'burger', 'subway', 'dunkin', 'starbucks', 'hotel',
  ],
  Transport: [
    'uber', 'ola', 'rapido', 'metro', 'irctc', 'makemytrip', 'goibibo',
    'redbus', 'petrol', 'fuel', 'diesel', 'parking', 'toll', 'cab',
    'auto', 'train', 'flight', 'indigo', 'spicejet', 'airindia',
  ],
  Shopping: [
    'amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'meesho', 'mall',
    'mart', 'store', 'shop', 'market', 'reliance', 'dmart', 'bigbasket',
    'blinkit', 'zepto', 'instamart', 'grofers',
  ],
  Entertainment: [
    'netflix', 'hotstar', 'spotify', 'youtube', 'prime', 'zee5',
    'sonyliv', 'pvr', 'inox', 'bookmyshow', 'game', 'play',
  ],
  Health: [
    'pharmacy', 'medical', 'hospital', 'clinic', 'apollo', 'medplus',
    '1mg', 'pharmeasy', 'doctor', 'health', 'medicine', 'chemist',
  ],
  Bills: [
    'electricity', 'water', 'gas', 'jio', 'airtel', 'vi ', 'vodafone',
    'bsnl', 'dth', 'broadband', 'recharge', 'postpaid', 'prepaid',
    'insurance', 'emi', 'loan', 'rent',
  ],
};

function detectCategory(merchant: string, text: string): Category {
  const combined = (merchant + ' ' + text).toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(k => combined.includes(k))) return category;
  }
  return 'Other';
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export interface ParsedSms {
  address: string;
  body: string;
  date: number;
}

export interface ParsedNotification {
  package: string;
  title: string;
  text: string;
  date: number;
}

export function parseSmsToTransaction(
  sms: ParsedSms,
): Omit<Transaction, 'id'> | null {
  if (!isDebitTransaction(sms.body)) return null;

  const amount = extractAmount(sms.body);
  if (!amount || amount <= 0) return null;

  const merchant = extractMerchant(sms.body);
  const category = detectCategory(merchant, sms.body);

  return {
    merchant,
    amount,
    category,
    date: new Date(sms.date).toISOString(),
    notes: sms.address ? `Via ${sms.address}` : '',
    source: 'SMS',
    method: 'SMS',
  };
}

export function parseNotificationToTransaction(
  notif: ParsedNotification,
): Omit<Transaction, 'id'> | null {
  const fullText = `${notif.title} ${notif.text}`;

  if (!isDebitTransaction(fullText)) return null;

  const amount = extractAmount(fullText);
  if (!amount || amount <= 0) return null;

  const merchant = extractMerchant(fullText);
  const category = detectCategory(merchant, fullText);

  return {
    merchant,
    amount,
    category,
    date: new Date(notif.date).toISOString(),
    notes: notif.title || '',
    source: 'Notification',
    method: 'UPI',
  };
}
