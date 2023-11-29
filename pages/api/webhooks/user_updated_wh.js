const stripe = require('stripe')( process.env.STRIPE_API_SECRET );
const express = require('express');
const app = express();

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = "whsec_G77lf7B4H0p3ZsGzf1A84K6NlmzN8ziJ"; //  "whsec_XPyf4AIJk8fmZgL0Ge9X9iki8u5Ct0Dq"; < PROD

app.post('/webhook', express.raw({type: 'application/json'}), (request, response) => {
  const sig = request.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'account.updated':{
      const accountUpdated = event.data.object;
        // Then define and call a function to handle the event account.updated
        if(accountUpdated['charges_enabled'] && accountUpdated['details_submitted']){
            
            console.log(`user atualizado > ${accountUpdated['metadata']['user_id'] }` ) //get user ID
        
        }
      }
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send({
    accountUpdated: accountUpdated['id'],
    userId: accountUpdated['metadata']['user_id']
  });
});

app.listen(4242, () => console.log('Running on port 4242'));