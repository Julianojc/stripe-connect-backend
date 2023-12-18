import { client } from "../../client_config/index.js"
import { gql } from '@apollo/client';
import { buffer } from 'micro';

const stripe = require('stripe')( process.env.NEXT_STRIPE_API_SECRET, { apiVersion: "2023-10-16" } );
const webhook_secret = process.env.STRIPE_WEBHOOK_PAYMENTS_SECRET

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
      requestBuffer.toString(), //ou requestBuffer.toString(), 
      signature, 
      webhook_secret
    )

    console.log("webhook verified");


    switch (event.type) {
        
        case 'invoice.payment_succeeded':
          const invoicePaymentSucceeded = event.data.object;
          
          if(invoicePaymentSucceeded.billing_reason == 'subscription_create') {
            
            // A assinatura é ativada automaticamente após o pagamento bem-sucedido
            // Define a forma de pagamento utilizada para pagar a primeira fatura como método de pagamento padrão para essa assinatura
            const subscriptionId = invoicePaymentSucceeded.subscription
            const paymentId = invoicePaymentSucceeded.payment_intent

            // Recupera a intenção de pagamento usada para pagar a assinatura
            const payment_intent = await stripe.paymentIntents.retrieve( paymentId );
            if(payment_intent != null){
                try {
                  const subsUpdated = await stripe.subscriptions.update( subscriptionId, {
                      default_payment_method: payment_intent.payment_method,
                    },
                  );
                  console.log("Default payment method set for subscription:" + payment_intent.payment_method);
                }
                catch (err) {
                  console.log(err);
                  console.log(`⚠️  Falied to update the default payment method for subscription: ${subscriptionId}`);
                }
             }

              await updateDATABASE({
                stripe_invoice_id: invoicePaymentSucceeded.id,
                stripe_subscription_id: subscriptionId, 
                status: "ACTIVE", 
                active: true,
                user_id: invoicePaymentSucceeded.subscription_details.metadata.client_id,
                hosted_invoice_url: invoicePaymentSucceeded.hosted_invoice_url,
                invoice_pdf: invoicePaymentSucceeded.invoice_pdf,
                amount_paid: invoicePaymentSucceeded.amount_paid
              })   //UPDATE DATABASE

            };
  
        break;

        case 'invoice.payment_failed':
           // Se o pagamento falhar ou o cliente não tiver um método de pagamento válido,
           // um evento fatura.payment_failed é enviado, a assinatura se torna past_due.
           // Use este webhook para notificar seu usuário de que o pagamento dele foi
           // falhou e para recuperar os detalhes do novo cartão.
           const invoicePaymentFailed = event.data.object;
           await updateDATABASE({
                stripe_invoice_id: invoicePaymentFailed.id,
                stripe_subscription_id: invoicePaymentFailed.subscription, 
                status: 'PAYMENT_FAILED', 
                active: false,
                user_id: invoicePaymentFailed.subscription_details.metadata.client_id,
                hosted_invoice_url: invoicePaymentFailed.hosted_invoice_url,
                invoice_pdf: invoicePaymentFailed.invoice_pdf,
                amount_paid: invoicePaymentFailed.amount_paid
            }) // UPDATE HASURA DATABASE
          break;
        
        // case 'invoice.finalized':
        //     // Se você deseja enviar faturas manualmente para seus clientes
        //     // ou armazene-os localmente para referência para evitar atingir os limites de taxa do Stripe.
        //    const invoiceFinalized = event.data.object;
        //    await saveInvoice({
        //      invoice_id: invoiceFinalized.id,
        //      subscription_id: invoiceFinalized.subscription,
        //      client_id: invoiceFinalized.subscription_details.metadata.client_id,
        //      hosted_invoice_url: invoiceFinalized.hosted_invoice_url,
        //      pdf: invoiceFinalized.invoice_pdf,
        //    })
        //   break;
        
        
        case 'customer.subscription.updated':
          // Quando a assintura é programada para ser cancelada automaticamente
          // no final do periodo ja pago pelo cliente
          // DOCS: https://stripe.com/docs/billing/subscriptions/cancel

         
        break

        case 'customer.subscription.deleted':
          if (event.request != null) {
            // trata de uma assinatura quando é cancelada.
            const customerSubscriptionDeleted = event.data.object;

            await updateDATABASE({
              stripe_subscription_id: customerSubscriptionDeleted.subscription, 
              status: 'CANCELLED', 
              active: false
            }) // UPDATE HASURA DATABASE
          } else {
            // trata a assinatura cancelada automaticamente com base
            // nas configurações da sua assinatura.
            const customerSubscriptionDeleted = event.data.object;
            await updateDATABASE({
              stripe_subscription_id: customerSubscriptionDeleted.subscription, 
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

async function updateDATABASE({
  stripe_invoice_id, 
  stripe_subscription_id, 
  status, 
  active, 
  user_id, 
  hosted_invoice_url, 
  invoice_pdf,
  amount_paid
}){
  try{

    const _mutation = gql`
    mutation updateDB(
      $stripe_subscription_id: String!,
      $stripe_invoice_id: String!
      $payment_status: subscription_payment_status_enum!,
      $active: Boolean!,
      $user_id: String!,
      $hosted_invoice_url: String!,
      $invoice_pdf: String!,
      $amount_paid: Int!
      ){
      
      update_subscription(
        where: {stripe_subscription_id: {_eq: $stripe_subscription_id}}, 
        _set: {
          active: $active, 
          payment_status: $payment_status,
        }){
        affected_rows
      }
      
      insert_invoice_one(
        object: {
          stripe_invoice_id: $stripe_invoice_id, 
          stripe_subscription_id: $stripe_subscription_id, 
          user_id: $user_id,
          hosted_invoice_url: $hosted_invoice_url,
          invoice_pdf: $invoice_pdf,
          amount_paid: $amount_paid
      }){
        id
      }
     } 
    `;

      var data = await client.mutate({
        mutation: _mutation,
        variables:{
          stripe_invoice_id: stripe_invoice_id,
          stripe_subscription_id: stripe_subscription_id,
          payment_status: status,
          active: active,
          user_id: user_id,
          hosted_invoice_url: hosted_invoice_url,
          invoice_pdf: invoice_pdf,
          amount_paid: amount_paid
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


