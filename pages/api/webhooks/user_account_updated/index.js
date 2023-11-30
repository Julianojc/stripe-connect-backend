import { client } from "../../client_config/index.js"
import { gql } from '@apollo/client';
import { buffer } from 'micro';

const stripe = require('stripe')( process.env.STRIPE_API_SECRET, { apiVersion: null } );
const webhook_secret = process.env.STRIPE_WEBHOOK_ACCOUNTS_SECRET



// import { client } from "../../client_config/index.js"
// import { gql } from '@apollo/client';
// const stripe = require('stripe')( process.env.STRIPE_API_SECRET );


export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res){
    
  if (req.method !== "POST") {
    return
  }
  
  const requestBuffer = await buffer(req)
  const signature = req.headers['stripe-signature'];

  let event

  // Verify webhook signature and extract the event.
  // See https://stripe.com/docs/webhooks/signatures for more information.
  try {
    event = stripe.webhooks.constructEvent(
      requestBuffer.toString(), 
      signature, 
      webhook_secret
    )

    if (event.type === "account.updated") { 

        const accountUpdated = event.data.object;
        //console.log("User updated completed successfully")
        //console.log(`user atualizado > ${accountUpdated.id}` ) //data
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
      }}

  } catch (err) {
    console.log(err)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }
}
  