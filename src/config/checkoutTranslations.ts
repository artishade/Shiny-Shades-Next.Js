/* ===================================================
   - Checkout page translations (English / বাংলা)
   - Lightweight local i18n — no external library
   - Keys are identical in both dictionaries (type-safe)
   - Function keys receive the dynamic part (amount, count, zone…)
   =================================================== */

export type CheckoutLang = 'en' | 'bn';

const en = {
  /* Header */
  headerTitle: 'Checkout',
  headerSubtitle: 'Fill in your details to confirm your order',

  /* Order summary */
  yourOrder: (count: number) => `Your Order (${count} ${count === 1 ? 'item' : 'items'})`,
  size: 'Size',
  color: 'Color',
  qty: 'Qty',

  /* Delivery details */
  deliveryDetailsHeading: 'Delivery Address & Details',
  labelFullName: 'Full Name',
  labelPhone: 'Mobile Number',
  phoneHint: 'Enter a valid mobile number',
  labelDistrict: 'District',
  labelThanaArea: 'Thana / Area',
  labelThanaUpazila: 'Thana / Upazila',
  labelStreetAddress: 'House & Street Address',
  streetHint: 'Write your full address',
  labelSpecialNote: 'Special Note',
  optionalHint: 'optional',
  namePlaceholder: 'Enter your full name',
  phonePlaceholder: '01893905484',
  customThanaPlaceholder: 'e.g. Kotwali, Bayezid, Sadar...',
  streetPlaceholder: 'e.g. House 12, Road 4, Sector 7 or village/mohalla name...',
  notesPlaceholder: 'e.g. Please deliver after 3 PM...',
  thanaSelectDefault: '-- Select Thana / Area --',
  dhakaCityGroup: '📍 Dhaka City (Inside — ৳80 charge)',
  subDhakaGroup: '📍 Sub-Dhaka (Outside — ৳150 charge)',
  zoneInside: 'Inside Dhaka',
  zoneOutside: 'Outside Dhaka',
  deliveryAreaLabel: 'Delivery Area:',
  chargeLabel: 'Charge:',

  /* Payment */
  paymentHeading: 'Select Payment Method',
  codName: 'Cash on Delivery',
  codDesc: 'Pay when you receive the product.',
  bkashNagadName: 'bKash / Nagad Payment',
  bkashNagadDesc: 'Pay directly via bKash',
  fastDeliveryBadge: 'Fast Delivery',
  bkashName: 'bKash',
  nagadName: 'Nagad',
  bkashPayment: 'bKash Payment',
  nagadPayment: 'Nagad Payment',
  paymentStep1: (app: string) => `1. Open your ${app} app and go to Send Money / Payment.`,
  copied: 'Copied!',
  copy: 'Copy',
  paymentStep2: (amount: string) => `2. Complete the payment of ${amount}.`,
  labelMbNumber: (app: string) => `Your ${app} Number`,
  labelTrxId: 'Transaction ID (TrxID)',
  trxPlaceholder: 'e.g. 9J7A...',

  /* Coupon */
  couponHeading: 'Coupon Code',
  couponPlaceholder: 'Enter coupon code if you have one',
  applied: 'Applied',
  apply: 'Apply',
  couponSuccess: (amount: string) => `You are getting ${amount} discount!`,

  /* Price breakdown */
  subtotalLabel: 'Subtotal:',
  discountLabel: 'Discount:',
  deliveryChargeLabel: (zone: string) => `Delivery Charge (${zone}):`,
  totalLabel: 'Total Bill:',
  submitButton: (amount: string) => `Click to Confirm Order (${amount}) →`,
  safetyNote: '100% Secure Payment',

  /* Review modal */
  reviewTitle: 'Confirm Order',
  paymentLabel: 'Payment:',
  itemListLabel: 'Items:',
  deliveryChargeRow: 'Delivery Charge:',
  totalRow: 'Total Bill:',
  editButton: 'Edit',
  placing: 'Placing Order...',
  confirmButton: 'Confirm Order',

  /* Success view */
  successTitle: 'Thank You! Your Order Has Been Placed',
  successSubtitle: 'Our representative will call you shortly to confirm your order.',
  orderNumberLabel: 'Order Number:',
  paymentMethodLabel: 'Payment Method:',
  totalPayableLabel: 'Total Payable:',
  codTrustNote: 'Check the product and pay after you receive it.',
  mbVerifyNote: 'We are verifying your payment to process your order quickly.',
  continueShopping: 'Continue Shopping',

  /* Validation errors */
  errName: 'Please enter your full name',
  errPhoneEmpty: 'Enter your 11-digit mobile number',
  errPhoneInvalid: 'Enter a valid 11-digit number (e.g. 017XXXXXXXX)',
  errDistrict: 'Please select your district',
  errThana: 'Please select your thana/area',
  errCustomThana: 'Enter your thana or upazila name',
  errStreet: 'Enter house no, road or detailed address',
  errMbEmpty: 'Enter your bKash/Nagad number',
  errMbInvalid: 'Enter a valid 11-digit number',
  errTrxEmpty: 'Enter the Transaction ID (TrxID)',
  errTrxInvalid: 'Enter a valid Transaction ID',

  /* Coupon errors */
  errCouponEmpty: 'Enter a coupon code',
  errCouponInvalid: 'This coupon code is not valid',
  errCouponExpired: 'This coupon has expired',
  errCouponLimit: 'This coupon has reached its usage limit',
  errCouponMinOrder: (amount: string) => `Minimum order of ${amount} required`,

  /* Misc */
  orderFailAlert: 'Something went wrong placing your order. Please try again.',
};

const bn = {
  /* Header */
  headerTitle: 'অর্ডার সম্পন্ন করুন (Checkout)',
  headerSubtitle: 'তথ্যগুলো পূরণ করে অর্ডার কনফার্ম করুন',

  /* Order summary */
  yourOrder: (count: number) => `আপনার অর্ডার (${count} টি আইটেম)`,
  size: 'সাইজ',
  color: 'রং',
  qty: 'পরিমাণ',

  /* Delivery details */
  deliveryDetailsHeading: 'ডেলিভারি ঠিকানা ও তথ্য',
  labelFullName: 'আপনার পুরো নাম',
  labelPhone: '১১ ডিজিটের মোবাইল নম্বর',
  phoneHint: 'সঠিক মোবাইল নম্বর দিন',
  labelDistrict: 'জেলা',
  labelThanaArea: 'থানা বা এরিয়া',
  labelThanaUpazila: 'থানা / উপজেলা',
  labelStreetAddress: 'বাসা নং, রোড নং বা গ্রামের নাম',
  streetHint: 'বিস্তারিত ঠিকানা লিখুন',
  labelSpecialNote: 'বিশেষ নির্দেশনা',
  optionalHint: 'ঐচ্ছিক',
  namePlaceholder: 'আপনার নাম লিখুন',
  phonePlaceholder: '01XXXXXXXXX',
  customThanaPlaceholder: 'যেমন: কোতোয়ালী, বায়েজিদ, সদর...',
  streetPlaceholder: 'যেমন: বাসা নং ১২, রোড নং ৪, সেক্টর ৭ অথবা মহল্লা/গ্রামের নাম...',
  notesPlaceholder: 'যেমন: ৩টার পর ডেলিভারি দিলে ভালো হয়...',
  thanaSelectDefault: '-- থানা/এলাকা সিলেক্ট করুন --',
  dhakaCityGroup: '📍 Dhaka City (ঢাকার ভেতরে - চার্জ ৳৮০)',
  subDhakaGroup: '📍 Sub-Dhaka (ঢাকার বাইরে - চার্জ ৳১৫০)',
  zoneInside: 'ঢাকার ভেতরে',
  zoneOutside: 'ঢাকার বাইরে',
  deliveryAreaLabel: 'ডেলিভারি এরিয়া:',
  chargeLabel: 'চার্জ:',

  /* Payment */
  paymentHeading: 'পেমেন্ট মেথড বেছে নিন',
  codName: 'ক্যাশ অন ডেলিভারি',
  codDesc: 'পণ্য হাতে পেয়ে টাকা পরিশোধ করবেন।',
  bkashNagadName: 'বিকাশ/নগদ পেমেন্ট',
  bkashNagadDesc: 'বিকাশে সরাসরি পেমেন্ট করুন',
  fastDeliveryBadge: 'দ্রুত ডেলিভারি',
  bkashName: 'বিকাশ',
  nagadName: 'নগদ',
  bkashPayment: 'বিকাশ পেমেন্ট',
  nagadPayment: 'নগদ পেমেন্ট',
  paymentStep1: (app: string) => `১. আপনার ${app} অ্যাপ থেকে Send Money / Payment অপশনে যান।`,
  copied: 'Copied!',
  copy: 'Copy',
  paymentStep2: (amount: string) => `২. সর্বমোট ${amount} টাকা পেমেন্ট সম্পন্ন করুন।`,
  labelMbNumber: (app: string) => `আপনার ${app} নম্বর`,
  labelTrxId: 'Transaction ID (TrxID)',
  trxPlaceholder: 'যেমন: 9J7A...',

  /* Coupon */
  couponHeading: 'ডিসকাউন্ট কুপন (Coupon Code)',
  couponPlaceholder: 'কুপন কোড থাকলে লিখুন',
  applied: 'Applied',
  apply: 'Apply',
  couponSuccess: (amount: string) => `আপনি পাচ্ছেন ${amount} ডিসকাউন্ট!`,

  /* Price breakdown */
  subtotalLabel: 'মোট মূল্য (Subtotal):',
  discountLabel: 'ডিসকাউন্ট:',
  deliveryChargeLabel: (zone: string) => `ডেলিভারি চার্জ (${zone}):`,
  totalLabel: 'সর্বমোট বিল (Total):',
  submitButton: (amount: string) => `অর্ডার কনফার্ম করতে ক্লিক করুন (${amount}) →`,
  safetyNote: '১০০% নিরাপদ পেমেন্ট সুবিধা',

  /* Review modal */
  reviewTitle: 'অর্ডার নিশ্চিতকরণ',
  paymentLabel: 'পেমেন্ট:',
  itemListLabel: 'আইটেম লিস্ট:',
  deliveryChargeRow: 'ডেলিভারি চার্জ:',
  totalRow: 'সর্বমোট বিল:',
  editButton: 'এডিট করুন',
  placing: 'অর্ডার হচ্ছে...',
  confirmButton: 'অর্ডার কনফার্ম করুন',

  /* Success view */
  successTitle: 'ধন্যবাদ! আপনার অর্ডার সম্পন্ন হয়েছে',
  successSubtitle: 'আমাদের প্রতিনিধি খুব দ্রুত আপনার সাথে কল করে অর্ডার কনফার্ম করবে।',
  orderNumberLabel: 'অর্ডার নম্বর:',
  paymentMethodLabel: 'পেমেন্ট মেথড:',
  totalPayableLabel: 'সর্বমোট প্রদেয়:',
  codTrustNote: 'ডেলিভারি পাওয়ার পর পণ্য দেখে মূল্য পরিশোধ করুন।',
  mbVerifyNote: 'আপনার পেমেন্ট যাচাই করে আমরা দ্রুত অর্ডার প্রসেস করছি।',
  continueShopping: 'আরও শপিং করুন',

  /* Validation errors */
  errName: 'আপনার সম্পূর্ণ নাম লিখুন',
  errPhoneEmpty: 'আপনার ১১ ডিজিটের মোবাইল নম্বর দিন',
  errPhoneInvalid: 'সঠিক ১১ ডিজিটের নম্বর দিন (যেমন: 017XXXXXXXX)',
  errDistrict: 'অনুগ্রহ করে জেলা সিলেক্ট করুন',
  errThana: 'অনুগ্রহ করে আপনার থানা/এলাকা সিলেক্ট করুন',
  errCustomThana: 'আপনার থানা বা উপজেলার নাম লিখুন',
  errStreet: 'বাসা নং, রোড নং বা বিস্তারিত ঠিকানা লিখুন',
  errMbEmpty: 'আপনার বিকাশ/নগদ নম্বর লিখুন',
  errMbInvalid: 'সঠিক ১১ ডিজিটের নম্বর দিন',
  errTrxEmpty: 'Transaction ID (TrxID) লিখুন',
  errTrxInvalid: 'সঠিক Transaction ID লিখুন',

  /* Coupon errors */
  errCouponEmpty: 'কুপন কোড লিখুন',
  errCouponInvalid: 'কুপন কোডটি সঠিক নয়',
  errCouponExpired: 'এই কুপনের মেয়াদ শেষ হয়ে গেছে',
  errCouponLimit: 'কুপন ব্যবহারের লিমিট শেষ',
  errCouponMinOrder: (amount: string) => `সর্বনিম্ন অর্ডার ${amount} হতে হবে`,

  /* Misc */
  orderFailAlert: 'অর্ডার সম্পন্ন হতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
};

export type CheckoutStrings = typeof en;

export const CHECKOUT_TRANSLATIONS: Record<CheckoutLang, CheckoutStrings> = { en, bn };
