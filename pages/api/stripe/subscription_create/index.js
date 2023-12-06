

const stripe = require("stripe")( process.env.NEXT_STRIPE_API_SECRET )

export default async function stripeSubscriptionCreate (req, res) {
  
    const { method } = req

    const {
        query: { customerId, accConnectId, priceId, userId },
    } = req
      
    if (method === "POST") {
        try{

            const params = {
                
                customer: customerId,
                application_fee_percent: process.env.STRIPE_APP_FEE, //.env variable
                items: [{
                    price: priceId,
                }],
                //payment_behavior: 'default_incomplete',
                payment_settings: { 
                    save_default_payment_method: 'on_subscription' 
                },
                payment_behavior: 'default_incomplete',
                expand: ['latest_invoice.payment_intent'],
                transfer_data: {
                  destination: accConnectId, // conta connect do criador
                },
                metadata:{
                    "creator_id": userId
                }
            }
                        
            const subscription = await stripe.subscriptions.create( params );

            // RETORNA
            res.status(200).json({ 
                type: "subscription",
                subscriptionId: subscription.id,
                clientSecret: subscription.latest_invoice.payment_intent.client_secret, 
            })
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
