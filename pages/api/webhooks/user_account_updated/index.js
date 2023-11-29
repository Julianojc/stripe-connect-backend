const stripe = require('stripe')( process.env.STRIPE_API_SECRET );

export const config = {
  api: {
    bodyParser: false,
  },
}

async function buffer( readable ) {
    const chunks = [];
    for await (const chunk of readable){
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
    }
    return Buffer.concat(chunks)
}

// const webhookPayloadParser = (req) =>
//   new Promise((resolve) => {
//     let data = ""
//     req.on("data", (chunk) => {
//       data += chunk
//     })
//     req.on("end", () => {
//       resolve(Buffer.from(data).toString())
//     })
//   })

export default async function handler(req, res){
  
  const webhook_secret = process.env.STRIPE_WEBHOOK_ACCOUNTS_SECRET
  
  if (req.method !== "POST") {
    return
  }
  
  const body = await buffer(req) //ou webhookPayloadParser(req)
  const sig = req.headers["stripe-signature"]

  let event

  // Verify webhook signature and extract the event.
  // See https://stripe.com/docs/webhooks/signatures for more information.
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhook_secret)
  } catch (err) {
    console.log(err)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  if (event.type === "account.updated") { 
      const accountUpdated = event.data.object;
      console.log("Checkout Session completed successfully")
      console.log(`user atualizado > ${accountUpdated}` ) //data
      if(accountUpdated['charges_enabled'] && accountUpdated['details_submitted']){  
        // SEND GRAPHQL MUTATION  
        //console.log(`user atualizado > ${accountUpdated['metadata']['user_id'] }` ) //get user ID
      }
      // Return a 200 response to acknowledge receipt of the event
      return response.status(200).send({
        accountUpdated: accountUpdated['id'],
        metadata: accountUpdated['metadata'],
        userId: accountUpdated['metadata']['user_id']
      });
  }
  else {
    return res.status(400).send(`Webhook Error`)
  }


}

