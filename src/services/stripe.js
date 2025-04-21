const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();

const createOrRetrieveCustomer = async (user) => {
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    phone: user.phoneNumber,
    address: {
      line1: user.address || undefined,
      postal_code: user.zipCode || undefined,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
};

const createSetupIntent = async (customerId) => {
    return await stripe.setupIntents.create({
      customer: customerId,
    });
  };

module.exports = { 
    createOrRetrieveCustomer, 
    stripe,
    createSetupIntent 
};