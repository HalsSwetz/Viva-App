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
  console.log(`Creating setup intent for customer: ${customerId}`);
  try {
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
    });
    console.log('SetupIntent created:', setupIntent);  // Log the created setupIntent
    return setupIntent;
  } catch (error) {
    console.error('Error creating setupIntent:', error);
    throw error;
  }
};

module.exports = { 
    createOrRetrieveCustomer, 
    stripe,
    createSetupIntent 
};