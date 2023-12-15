import { client } from "../../client_config/index.js"
import { gql } from '@apollo/client';
import { buffer } from 'micro';

const stripe = require('stripe')( process.env.NEXT_STRIPE_API_SECRET, { apiVersion: "2023-10-16" } );
const webhook_secret = process.env.STRIPE_WEBHOOK_CUSTOMERS_SECRET

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

    const _mutationUpdate = gql`
    mutation UpdateInfo(
            $user_id: String!, 
            $customer_id: String!, 
            $name: String!,
            $email: String!
        ){               
        update_stripe_info(
            where: {user_id: {_eq: $user_id}}, 
            _set: {customer_id: $customer_id, email: $email, name: $name}) {
            affected_rows
        }
    }`;


    switch (event.type) {
        
      case 'customer.created':
            const customerCreated = event.data.object;

            createDefaultModality({ //CRIA UM PRODUTO E UMA MODALIDADE PADRÃO
               name: 'Premium',
               userId: customerCreated.metadata.user_id,
               price: 1599,
               currency: 'brl'
            })
            
            var data = await client.mutate({
                mutation: _mutationUpdate,
                variables:{
                    user_id: customerCreated.metadata.user_id,
                    name: customerCreated.name,
                    customer_id: customerCreated.id,
                    email: customerCreated.email
                }
            })

            if(data != null ){
                console.log(data)
                return res.status(200).json({
                    accountCreated: customerCreated.id,
                    metadata: customerCreated.metadata,
                    userId: customerCreated.metadata.user_id
                })
            }
        break;


        case 'customer.updated':
            const customerUpdated = event.data.object;
    
            var data = await client.mutate({
                mutation: _mutationUpdate,
                variables:{
                    user_id: customerUpdated.metadata.user_id,
                    name: customerUpdated.name,
                    customer_id: customerUpdated.id,
                    email: customerUpdated.email
                }
            })
            
            if(data != null ){
                console.log(data)
                return res.status(200).json({
                    accountUpdated: customerUpdated.id,
                    metadata: customerUpdated.metadata,
                    userId: customerUpdated.metadata.user_id
                })
            }
        
        break;

        default: 
            console.log(`Unhandled event type ${event.type}`);
    }


  } catch (err) {
    console.log(err)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }
}

// CRIA UM PRODUTO/MODALIDADE PARA O 
// NOVO CRIADOR DE CONTEUDO

async function createDefaultModality({name, userId, price, currency}) {
  try{
     const data = await stripe.prices.create({
       unit_amount: price, //interger ex: 2000
       currency: currency, //ex: 'brl',
       recurring: {interval: 'month'},
       product_data: {
           name: name,
           active: true,
           metadata:{
               "user_id": userId
           }
       },
       metadata:{
           "user_id": userId
       }
     });
  }
  catch(e){
   print(e)
  }
 }
  