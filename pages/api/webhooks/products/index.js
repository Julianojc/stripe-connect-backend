import { client } from "../../client_config/index.js"
import { gql } from '@apollo/client';
import { buffer } from 'micro';

const stripe = require('stripe')( process.env.NEXT_STRIPE_API_SECRET, { apiVersion: "2023-10-16" } );
const webhook_secret = process.env.STRIPE_WEBHOOK_PRODUCTS_SECRET

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
    
    // Handle the event
  switch (event.type) {
    
    case 'price.created':
      const priceCreated = event.data.object;
        // Then define and call a function to handle the event price.created
        insertModalityInDatabase({
            title: 'Premium', 
            userId: priceCreated.metadata.user_id, 
            price: priceCreated.unit_amount, 
            priceId: priceCreated.id,
            productId: priceCreated.product,
            currency: priceCreated.currency
        })
    break;
    
    case 'price.updated':
      const priceUpdated = event.data.object;
      // Then define and call a function to handle the event price.updated
      updateModalityInDatabase({
            priceId: priceUpdated.id, 
            currency: priceUpdated.currency, 
            name: priceUpdated.name, 
            price: priceUpdated.price, 
            title: 'Premium'
        })
    break;
    
      // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
    

  } catch (err) {
    console.log(err)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }
}


/////// **UPDATE DATABASE

async function insertModalityInDatabase({title, userId, price, priceId, productId, currency}) {
    try{  
         const _mutation = gql`
         mutation InsertModality(
             $user_id: String!, 
             $title: String!,
             $price: Int!,
             $currency: String!, 
             $type: modality_type_enum!,
             $stripe_product_id: String!, 
             $stripe_price_id: String!
           ){
           insert_modality(
             objects: {
               active: true, 
               currency: $currency, 
               type: $type, 
               user_id: $user_id, 
               price: $price, 
               title: $title, 
               stripe_product_id: $stripe_product_id, 
               stripe_price_id: $stripe_price_id
             }) {
             affected_rows
           }
         }
         `;
         var dataSave = await client.mutate({
           mutation: _mutation, // SAVE IN DATABASE
           variables:{
             user_id: userId,
             title: title,
             price: price,
             currency: currency,
             type: 'PREMIUM',
             stripe_price_id: priceId,
             stripe_product_id: productId
           }
       })
     }
    catch(e){
     print(e)
    }
}

    async function updateModalityInDatabase({priceId, currency, name, price, title}) {
        try{  
            const _mutation = gql`
            mutation MyMutation(
                $_eq: String!, 
                $price: Int = 10, 
                $currency: String!, 
                $title: String!
            ){
            update_modality(
                where: {stripe_price_id: {_eq: $_eq}}, 
                _set: {
                    price: $price, 
                    currency: $currency, 
                    title: $title
                }){
                  affected_rows
                }
              }
              
            `;
            var dataUpdated = await client.mutate({
            mutation: _mutation, // Update DATABASE
            variables:{
                $title: name,
                price: price,
                currency: currency,
            }
        })
        }
    catch(e){
        print(e)
    }
}
