import { client } from "../../client_config/index.js"
import { gql } from '@apollo/client';
import { buffer } from 'micro';

const stripe = require('stripe')( process.env.NEXT_STRIPE_API_SECRET, { apiVersion: "2023-10-16" } );
const webhook_secret = process.env.STRIPE_WEBHOOK_SUBSCRIPTIONS_SECRET

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

    // Extract the object from the event.
    const dataObject = event.data.object;
    //const metadata = dataObject['metadata']

    // Handle the event
    // Review important events for Billing webhooks
    // https://stripe.com/docs/billing/webhooks
    // Remove comment to see the various objects sent for this sample
    switch (event.type) {
        
        case 'invoice.payment_succeeded':
          if(dataObject['billing_reason'] == 'subscription_create') {
            
            const invoicePaymentSucceeded = event.data.object;
            // A assinatura é ativada automaticamente após o pagamento bem-sucedido
            // Define a forma de pagamento utilizada para pagar a primeira fatura
            // como método de pagamento padrão para essa assinatura
            const subscriptionId = invoicePaymentSucceeded.subscription
            const paymentId = invoicePaymentSucceeded.payment_intent
  
            // Recupera a intenção de pagamento usada para pagar a assinatura
            const payment_intent = await stripe.paymentIntents.retrieve(paymentId);
  
            try {
              const subsUpdated = await stripe.subscriptions.update( subscriptionId, {
                  default_payment_method: payment_intent.payment_method,
                },
              );
              
              await updateDATABASE({
                subscription_id: subscriptionId, 
                status: "ACTIVE", 
                active: true
              }) 

              console.log("Default payment method set for subscription:" + payment_intent.payment_method);
            } catch (err) {
              console.log(err);
              console.log(`⚠️  Falied to update the default payment method for subscription: ${subscriptionId}`);
            }
          };
  
          break;

        case 'invoice.finalized':
            // Se você deseja enviar faturas manualmente para seus clientes
            // ou armazene-os localmente para referência para evitar atingir os limites de taxa do Stripe.
           const invoiceFinalized = event.data.object;
           await saveInvoice({
             invoice_id: invoiceFinalized.id,
             subscription_id: invoiceFinalized.subscription,
             client_id: invoiceFinalized.subscription_details.metadata.client_id,
             invoice_pdf: invoiceFinalized.invoice_pdf,
             hosted_invoice_url: invoiceFinalized.hosted_invoice_url
           })
          break;
         
          
        case 'invoice.payment_failed':
           // Se o pagamento falhar ou o cliente não tiver um método de pagamento válido,
           // um evento fatura.payment_failed é enviado, a assinatura se torna past_due.
           // Use este webhook para notificar seu usuário de que o pagamento dele foi
           // falhou e para recuperar os detalhes do novo cartão.
           const invoicePaymentFailed = event.data.object;
           if(dataObject == 'invoice'){
            await updateDATABASE({
                subscription_id: invoicePaymentFailed.subscription, 
                status: 'PAYMENT_FAILED', 
                active: false
              }) // UPDATE HASURA DATABASE
          }
          break;
        
        
        case 'customer.subscription.deleted':
          if (event.request != null) {
            // trata de uma assinatura cancelada por sua solicitação de cima.
            const customerSubscriptionDeleted = event.data.object;

            await updateDATABASE({
              subscription_id: customerSubscriptionDeleted.subscription, 
              status: 'CANCELLED', 
              active: false
            }) // UPDATE HASURA DATABASE
          } else {
            // trata a assinatura cancelada automaticamente com base
            // nas configurações da sua assinatura.
            const customerSubscriptionDeleted = event.data.object;
            await updateDATABASE({
              subscription_id: customerSubscriptionDeleted.subscription, 
              status: 'CANCELLED', 
              active: false
            }) // UPDATE HASURA DATABASE
          }
          break;
        
        case 'customer.subscription.trial_will_end':
         //Envia uma notificação ao seu usuário de que o periodo de teste "TRIAL" será concluído
          break;
        default:
        // Unexpected event type
      }
      res.sendStatus(200);
    }
    catch(e){
        return res.status(400).send(`Webhook Error: ${err.message}`)
    }
}




//////////SAVE IN HASURA

async function updateDATABASE({subscription_id, status, active}){
  try{

      const _mutation = gql`
      mutation updateSubs(
        $subscription_id: String!,
        $payment_status: subscription_status_enum!,
        $active: Boolean!
        ){
        update_subscription(
          where: {stripe_subscription_id: {_eq: $subscription_id}}, 
          _set: {
            active: $active, 
            payment_status: $payment_status
          }){
          affected_rows
        }
      }       
      `;

      var data = await client.mutate({
        mutation: _mutation,
        variables:{
          subscription_id: subscription_id,
          payment_status: status,
          active: active,
        }
      })
      if(data != null ){
        // Return a 200 response to acknowledge receipt of the event
        console.log(data)
      }
  }
  catch(e){
    console.log(e)
  }
}

//// SAVE INVOICE IN HASURA DB

async function saveInvoice({invoice_id, subscription_id, client_id, hosted_invoice, pdf}){
  try{  

      console.log(`${invoice_id}, ${subscription_id}, ${client_id}`)

      const _mutation = gql`
      mutation insertINVOICE(
        $stripe_invoice_id: String!, 
        $stripe_subscription_id: String!, 
        $user_id: String!,
        $invoice_pdf: String!,
        $hosted_invoice_url: String!
        ){
        insert_invoice_one(
          object: {
            stripe_invoice_id: $stripe_invoice_id, 
            stripe_subscription_id: $stripe_subscription_id, 
            user_id: $user_id,
            hosted_invoice_url: $hosted_invoice_url,
            invoice_pdf: $invoice_pdf
        }){
          id
        }
      }       
      `;      
      var data = await client.mutate({
        mutation: _mutation,
        variables:{
          stripe_invoice_id: invoice_id,
          stripe_subscription_id: subscription_id,
          user_id: client_id,
          invoice_pdf: pdf,
          hosted_invoice_url: hosted_invoice,
        }
      })
      if(data != null ){
        // Return a 200 response to acknowledge receipt of the event
        console.log(data)
      }
  }
  catch(e){
    console.log(e)
  }
}


  