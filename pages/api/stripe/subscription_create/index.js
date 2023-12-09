
import { client } from "../../client_config/index.js"
import { gql } from '@apollo/client';
const stripe = require("stripe")( process.env.NEXT_STRIPE_API_SECRET )

export default async function stripeSubscriptionCreate (req, res) {
  
    const { method } = req

    const {
        query: { customerId, accConnectId, priceId, userCreatorId, userClientId, modalityId },
    } = req
      
    if (method === "POST") {
        try{

            const params = {
                
                customer: customerId,
                application_fee_percent: process.env.STRIPE_APP_FEE, //.env variable
                items: [{
                    price: priceId,
                }],
                payment_behavior: 'default_incomplete',
                payment_settings: { 
                    save_default_payment_method: 'on_subscription' 
                },
                expand: ['latest_invoice.payment_intent'],
                transfer_data: {
                  destination: accConnectId, // conta connect do criador
                  //amount_percent: 92
                },
                metadata:{
                    "creator_id": userCreatorId,
                    "client_id": userClientId,
                    "modality_id": modalityId,
                }
            }
                        
            const data = await stripe.subscriptions.create( params );

            if(data != null){

              await saveSubscInDB({
                  creator_id: userCreatorId,
                  client_id: userClientId,
                  subscription_id: data.id,
                  intent_id: data.latest_invoice.payment_intent.id,                  
                  modality_id: modalityId,
                  status: "INCOMPLETE",
                  active: false,
                  premium: true                 
              })

              // RETORNA
              res.status(200).json({ 
                  type: "subscription",
                  subscriptionId: data.id,
                  clientSecret: data.latest_invoice.payment_intent.client_secret, 
              })
          }
          else{
            return res.status(400).send({
              error:{ message: 'data = null'}
          });
          }
        }
        catch(e){
            // RETORNA ERRO
            return res.status(400).send({
                error:{ message: e?.message }
            });
        }
    }
    else{
        return;
    }
}



//////////SAVE IN HASURA

async function saveSubscInDB({creator_id, client_id, subscription_id, intent_id, modality_id, status, active, premium}){
    try{

        const _mutation = gql`
        mutation MyMutation(
          $active: Boolean!, 
          $premium: Boolean!, 
          $stripe_subscription_id: String!,
          $stripe_payment_intent_id: String!, 
          $user_client_id: String!, 
          $user_creator_id: String!, 
          $payment_status: subscription_status_enum!, 
          $modality_id: uuid!
          ){
          insert_subscription_one(
            object: {
              active: $active, 
              premium: $premium, 
              stripe_subscription_id: $stripe_subscription_id,
              stripe_payment_intent_id: $stripe_payment_intent_id, 
              user_client_id: $user_client_id, 
              user_creator_id: $user_creator_id, 
              payment_status: $payment_status, 
              modality_id: $modality_id
            }){
            id
          }
        }                    
        `
        
        var data = await client.mutate({
          mutation: _mutation,
          variables:{
            stripe_subscription_id: subscription_id,
            stripe_payment_intent_id: intent_id,
            payment_status: status,
            premium: premium,
            active: active,
            user_creator_id: creator_id,
            user_client_id: client_id,
            modality_id: modality_id
          }
        })
        if(data != null ){
          // Return a 200 response to acknowledge receipt of the event
          return data          
        }
    }
    catch(e){
      console.log(e)
    }
  }
