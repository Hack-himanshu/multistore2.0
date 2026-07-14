const razorpay = require('./razorpay');
const stripe = require('./stripe');
const paypal = require('./paypal');

const providers = { razorpay, stripe, paypal };

function getProvider(name) {
  const provider = providers[name];
  if (!provider) {
    throw Object.assign(new Error(`Unknown or unconfigured payment provider: ${name}`), { statusCode: 400 });
  }
  return provider;
}

module.exports = { getProvider };
