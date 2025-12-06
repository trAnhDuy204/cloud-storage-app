const crypto = require('crypto');
const moment = require('moment');

class VNPay {
  constructor(config) {
    this.vnp_TmnCode = config.vnp_TmnCode;
    this.vnp_HashSecret = config.vnp_HashSecret;
    this.vnp_Url = config.vnp_Url;
    this.vnp_ReturnUrl = config.vnp_ReturnUrl;
  }

  //Hàm Sắp xếp object theo key alphabet
  sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    keys.forEach(key => {
      sorted[key] = obj[key];
    });
    return sorted;
  }

  //Hàm Tạo chữ ký bằng HMAC SHA512
  createSignature(data) {
    const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(data, 'utf-8')).digest('hex');
    return signed;
  }

  //Tạo query string
  buildQueryString(params) {
    const parts = [];
    Object.keys(params).forEach(key => {
      const value = params[key];
      //Encode
      parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
    });
    return parts.join('&');
  }

  //Hàm Tạo URL thanh toán
  createPaymentUrl(orderId, amount, orderInfo, ipAddr, locale = 'vn') {
    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss');
    const expireDate = moment(date).add(15, 'minutes').format('YYYYMMDDHHmmss');
    
    let vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.vnp_TmnCode,
      vnp_Amount: amount * 100,
      vnp_CreateDate: createDate,
      vnp_CurrCode: 'VND',
      vnp_IpAddr: ipAddr,
      vnp_Locale: locale,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: 'other',
      vnp_ReturnUrl: this.vnp_ReturnUrl,
      vnp_TxnRef: orderId,
      vnp_ExpireDate: expireDate,
    };

    console.log('=== Original Params ===');
    console.log(vnp_Params);

    //Sắp xếp params theo alphabet
    vnp_Params = this.sortObject(vnp_Params);

    console.log('=== Sorted Params ===');
    console.log(vnp_Params);

    //Tạo sign data
    const signData = this.buildQueryString(vnp_Params);
    
    console.log('=== Sign Data for Hash ===');
    console.log(signData);
    
    //Tạo chữ ký
    const secureHash = this.createSignature(signData);
    console.log('=== Secure Hash ===');
    console.log(secureHash);
    
    //Thêm vnp_SecureHash vào params
    vnp_Params['vnp_SecureHash'] = secureHash;

    //Tạo final URL với tất cả params
    const paymentUrl = this.vnp_Url + '?' + this.buildQueryString(vnp_Params);
    
    console.log('=== Final Payment URL ===');
    console.log(paymentUrl);

    return paymentUrl;
  }

  verifyReturnUrl(vnp_Params) {
    const secureHash = vnp_Params['vnp_SecureHash'];
    
    console.log('=== Verify Return URL ===');
    console.log('Received Hash:', secureHash);
    
    //Xóa các params không tính vào chữ ký
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    //Sắp xếp params
    const sortedParams = this.sortObject(vnp_Params);
    
    //Tạo sign data
    const signData = this.buildQueryString(sortedParams);
    
    console.log('=== Sign Data for Verify ===');
    console.log(signData);
    
    //Tạo checksum
    const checkSum = this.createSignature(signData);
    console.log('=== Calculated Hash ===');
    console.log(checkSum);
    console.log('=== Hash Match ===');
    console.log(secureHash === checkSum);

    return secureHash === checkSum;
  }
}

module.exports = VNPay;