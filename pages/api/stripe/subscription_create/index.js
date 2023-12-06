

const stripe = require("stripe")( process.env.NEXT_STRIPE_API_SECRET )

export default async function stripeSubscriptionCreate (req, res) {
  
    const { method } = req

    const {
        query: { customerID, accConnectID, priceID, userID, stripeConnectId },
    } = req
      
    if (method === "POST") {
        try{

            const params = {
                
                customer: customerID,
                application_fee_percent: process.env.STRIPE_APP_FEE, //.env variable
                items: [{
                    price: priceID,
                }],
                //payment_behavior: 'default_incomplete',
                payment_settings: { 
                    save_default_payment_method: 'on_subscription' 
                },
                expand: ['latest_invoice.payment_intent'],
                transfer_data: {
                  destination: accConnectID, // conta connect do criador
                },
                metadata:{
                    "creator_id": userID
                }
            }
                        
            const subscription = await stripe.subscriptions.create( params );

            // RETORNA
            res.status(200).json({ 
                subscriptionId: subscription.id,
                object: "subscription",
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
