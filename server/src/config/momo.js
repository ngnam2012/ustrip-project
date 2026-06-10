export const momoConfig = {
  env: process.env.MOMO_ENV || 'mock',
  partnerCode: process.env.MOMO_PARTNER_CODE || '',
  accessKey: process.env.MOMO_ACCESS_KEY || '',
  secretKey: process.env.MOMO_SECRET_KEY || '',
  endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',
  queryEndpoint: process.env.MOMO_QUERY_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/query',
  redirectUrl: process.env.MOMO_REDIRECT_URL || 'http://localhost:5000/api/payments/momo/return',
  ipnUrl: process.env.MOMO_IPN_URL || process.env.MOMO_NOTIFY_URL || 'http://localhost:5000/api/payments/momo/ipn',
  requestType: process.env.MOMO_REQUEST_TYPE || 'captureWallet',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
};

export const isMomoMock = () => momoConfig.env === 'mock';
