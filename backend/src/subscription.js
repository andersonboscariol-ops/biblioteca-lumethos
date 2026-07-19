// subscription.js — Stripe Checkout + Webhook
const express = require('express');
const db = require('./db');
const { requireAuth, extractUser } = require('./middleware');
const { sendWhatsAppMessage } = require('./whatsapp');
const { sendCredentialsEmail, sendPurchaseNotification } = require('./email');

const router = express.Router();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
let stripe = null;
if (STRIPE_SECRET_KEY) {
  stripe = require('stripe')(STRIPE_SECRET_KEY);
} else {
  console.warn('[sub] No STRIPE_SECRET_KEY in env — Stripe disabled');
}

const PRICE_ANNUAL_BRL = 4990; // R$49,90 in cents
const SUCCESS_URL = process.env.SUCCESS_URL || 'https://biblioteca.institutolumethos.online/login?checkout=success';
const CANCEL_URL = process.env.CANCEL_URL || 'https://biblioteca.institutolumethos.online/login?checkout=canceled';

// GET /api/sub/status — current subscription status
router.get('/status', extractUser, requireAuth, (req, res) => {
  const subscription = db.getSubscription(req.user.id);
  const active = db.isSubscriptionActive(req.user.id);

  if (!subscription) {
    return res.json({ active: false, status: 'none' });
  }

  res.json({
    active,
    status: subscription.status,
    periodEnd: subscription.current_period_end,
    periodStart: subscription.current_period_start
  });
});

// POST /api/sub/create-checkout — Stripe Checkout Session
router.post('/create-checkout', extractUser, requireAuth, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Pagamento temporariamente indisponível' });
    }

    const user = req.user;
    const existingSub = db.getSubscription(user.id);

    // If already active, don't create checkout
    if (existingSub && db.isSubscriptionActive(user.id)) {
      return res.status(400).json({ error: 'Assinatura já ativa', active: true });
    }

    // Get or create Stripe customer
    let customerId = existingSub?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: String(user.id) }
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card', 'boleto'],
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: {
            name: 'Biblioteca Lumethos — Assinatura Anual',
            description: 'Acesso completo à biblioteca teológica por 1 ano'
          },
          unit_amount: PRICE_ANNUAL_BRL,
          recurring: { interval: 'year' }
        },
        quantity: 1
      }],
      mode: 'subscription',
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      metadata: { userId: String(user.id) }
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (e) {
    console.error('[sub] create-checkout error:', e);
    res.status(500).json({ error: 'Erro ao criar checkout' });
  }
});

// POST /api/sub/create-checkout-legacy — one-time payment (no recurring)
router.post('/create-checkout-legacy', extractUser, requireAuth, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Pagamento temporariamente indisponível' });
    }

    const user = req.user;
    const existingSub = db.getSubscription(user.id);

    if (existingSub && db.isSubscriptionActive(user.id)) {
      return res.status(400).json({ error: 'Assinatura já ativa' });
    }

    let customerId = existingSub?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email, name: user.name,
        metadata: { userId: String(user.id) }
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card', 'boleto'],
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: {
            name: 'Biblioteca Lumethos — Acesso Anual',
            description: 'Acesso completo à biblioteca teológica por 1 ano'
          },
          unit_amount: PRICE_ANNUAL_BRL
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      metadata: { userId: String(user.id) }
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (e) {
    console.error('[sub] checkout-legacy error:', e);
    res.status(500).json({ error: 'Erro ao criar checkout' });
  }
});

// POST /api/sub/webhook — Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe disabled' });
    }

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (e) {
        console.error('[sub] webhook signature invalid:', e.message);
        return res.status(400).json({ error: 'Invalid signature' });
      }
    } else {
      // Development mode — parse raw body manually
      event = JSON.parse(req.body.toString());
    }

    console.log('[sub] webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = parseInt(session.metadata?.userId);
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        if (!userId) {
          console.error('[sub] No userId in session metadata');
          return res.json({ received: true });
        }

        if (subscriptionId) {
          // Recurring subscription
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
          db.createSubscription(userId, customerId, subscriptionId, periodEnd);
        } else {
          // One-time payment — manually set 1 year from now
          const periodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
          db.createSubscription(userId, customerId, `one_time_${session.id}`, periodEnd);
        }

        console.log(`[sub] Subscription activated for user ${userId}`);

        // Send email to subscriber
        try {
          const user = db.getUserByIdWithPassword(userId);
          if (user && user.email) {
            sendCredentialsEmail(user.email, user.name, user.email, user.plain_password || 'Defina sua senha no próximo login', {
              planName: 'Biblioteca Lumethos — Assinatura Anual',
              price: 'R$ 49,90'
            });
            sendPurchaseNotification(user.name, user.email, user.phone || '', 'R$ 49,90', 'Biblioteca Lumethos — Assinatura Anual');
          }
        } catch (e) {
          console.error('[sub] Error sending email:', e.message);
        }

        // Send WhatsApp message to subscriber
        try {
          const user = db.getUserById(userId);
          if (user && user.phone) {
            const template = db.getSetting('whatsapp_template');
            if (template) {
              const message = template
                .replace(/\{\{name\}\}/g, user.name)
                .replace(/\{\{email\}\}/g, user.email)
                .replace(/\{\{phone\}\}/g, user.phone || '')
                .replace(/\{\{link\}\}/g, 'https://biblioteca.institutolumethos.online');
              sendWhatsAppMessage(user.phone, message).catch(e =>
                console.error('[sub] WhatsApp send error:', e.message)
              );
            }
          }
        } catch (e) {
          console.error('[sub] Error sending WhatsApp:', e.message);
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const subId = invoice.subscription;
        if (subId) {
          const subscription = await stripe.subscriptions.retrieve(subId);
          const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
          db.activateSubscription(subId, periodEnd);
          console.log(`[sub] Invoice paid for subscription ${subId}`);
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        if (sub.status === 'canceled' || sub.status === 'unpaid' || sub.status === 'incomplete_expired') {
          db.expireSubscription(sub.id);
          console.log(`[sub] Subscription ${sub.id} expired (${sub.status})`);
        } else if (sub.status === 'active' || sub.status === 'trialing') {
          const periodEnd = new Date(sub.current_period_end * 1000).toISOString();
          db.activateSubscription(sub.id, periodEnd);
          console.log(`[sub] Subscription ${sub.id} reactivated`);
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (e) {
    console.error('[sub] webhook error:', e);
    res.status(500).json({ error: 'Webhook error' });
  }
});

module.exports = router;
