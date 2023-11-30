
import { client } from "../../client_config/index.js"
import { gql } from '@apollo/client';
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
  
  const body = await buffer(req) //webhookPayloadParser(req) ou buffer(req)
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
      console.log("User updated completed successfully")
      console.log(`user atualizado > ${accountUpdated}` ) //data
      
      if(accountUpdated.charges_enabled && accountUpdated.details_submitted){  
            // SEND GRAPHQL MUTATION  
            var obj = await client.mutate({
              mutation: gql`
              mutation UpdateUser($id: String!, $role: user_roles_enum, $stripe_connect_id: String!) {
                update_user_by_pk(
                  pk_columns: {id: $id}, 
                  _set: {role: $role, stripe_connect_id: $stripe_connect_id}) 
                  {
                    id
                  }
              }`,
              variables:{
                id: accountUpdated.metadata.user_id,
                role: "CREATOR",
                stripe_connect_id: accountUpdated.id
              }
          })
          if(obj != null ){
            // Return a 200 response to acknowledge receipt of the event
            return res.status(200).json({
              accountUpdated: accountUpdated.id,
              metadata: accountUpdated.metadata,
              userId: accountUpdated.metadata.user_id
            })
         }
         else{
          return res.status(400).send(`Webhook Error`)
         }
      }
  }
  else {
    return res.status(400).send(`Webhook Error`)
  }


}

