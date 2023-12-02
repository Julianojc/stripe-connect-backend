const stripe = require("stripe")(process.env.NEXT_STRIPE_API_SECRET)
const host = process.env.NEXT_PUBLIC_HOST

/**
 * Generates a checkout session based on the Connected Account Id and other
 * data provided. Handles cases for both the flutter app and the web.
 */
const checkoutSession = async (req, res) => {
  
  const { accountConnectId, customerId, priceId, currency = "BRL", mobile } = req.query

  if (req.method === 'POST') {
        
    try {
      // Create Checkout Sessions from body params.
      const params = {
        customer: customerId,
        mode: 'subscription',
        subscription_data: {
          application_fee_percent: process.env.STRIPE_APP_FEE, //porcentagem de repasse para plataforma
          transfer_data: {
            destination: `${accountConnectId}`, //ID DO CRIADOR
            //amount_percent: 95
          }, 
        },
        line_items: [
          {
            price: `${priceId}`,
            quantity: 1,
          },
        ],
        //success_url: `${req.headers.origin}/result?session_id={CHECKOUT_SESSION_ID}`,
        //cancel_url: `${req.headers.origin}/donate-with-checkout`,

        success_url: `${CALLBACK_APP_URL }/feed`,
        cancel_url: `${CALLBACK_APP_URL }/settings`,
      }
      const checkoutSession = await stripe.checkout.sessions.create(params)
      res.status(200).json({checkoutSession}) //return

    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Internal server error'
      res.status(500).json({ statusCode: 500, message: errorMessage })
    }
  } else {
    //ERROR
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method Not Allowed')
  }
}

export default checkoutSession
