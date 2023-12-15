import { client } from "../../client_config/index.js"
import { gql } from '@apollo/client';
import { buffer } from 'micro';

const stripe = require('stripe')( process.env.NEXT_STRIPE_API_SECRET, { apiVersion: "2023-10-16" } );
const webhook_secret = process.env.STRIPE_WEBHOOK_ACCOUNTS_SECRET

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res){

    
  if (req.method !== "POST") {
    return
  }

  const signature = req.headers['stripe-signature'];
  
  const requestBuffer = await buffer(req)
  

  let event

  // Verify webhook signature and extract the event.
  // See https://stripe.com/docs/webhooks/signatures for more information.
  try {
    event = stripe.webhooks.constructEvent(
      requestBuffer.toString(), 
      signature, 
      webhook_secret
    )

    console.log("webhook verified");

    if (event.type === "account.updated") { 

        const accountUpdated = event.data.object;
   
        const _mutation = gql`
        mutation UpdateUserData($user_id: String!, $role: user_role_enum!, $stripe_connect_id: String!, $email: String!) {
          
          update_user_by_pk(
            pk_columns: {id: $user_id}, 
            _set: {role: $role, stripe_connect_id: $stripe_connect_id}) {
              id
            }
          
            update_stripe_info(
              where: {user_id: {_eq: $user_id}}, 
              _set: {connect_id: $stripe_connect_id, email: $email}) {
              affected_rows
            }

        }`;

        var data = await client.mutate({
          mutation: _mutation,
          variables:{
            user_id: accountUpdated.metadata.user_id,
            role: "CREATOR",
            stripe_connect_id: accountUpdated.id,
            email: accountUpdated.email
          }
      })
      if(data != null ){
        // Return a 200 response to acknowledge receipt of the event
        console.log(data)
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
  


