

const stripe = require("stripe")( process.env.STRIPE_API_SECRET )

const stripeSubscriptionCreate = async (req, res) => {
  
    const { method } = req
    const _customerID = req.body.customerID;
    const _connectedAccountID = req.body.accConnectID;
    const _priceID= req.body.priceID;
  
    if (method === "POST") {
        try{

            // const params = {
                
            //     customer: `${_customerID}`,
            //     application_fee_percent: process.env.STRIPE_APP_FEE, //.env variable
            //     items: [{
            //         price: `${_priceID}`,
            //     }],
            //     //payment_behavior: 'default_incomplete',
            //     payment_settings: { save_default_payment_method: 'on_subscription' },
            //     expand: ['latest_invoice.payment_intent'],
            //     transfer_data: {
            //       destination: `${_connectedAccountID}`, // conta connect do criador
            //     },
            //     metadata:{
            //         "creator_id": req.body.userID
            //     }
            // }

            const params = {
                
                customer: "cus_P0pOeBs5H6CQ4D",
                application_fee_percent: process.env.STRIPE_APP_FEE, //.env variable
                items: [{
                    price: "price_1OCnak3ZaTYZG0nnQmld8Br7",
                }],
                //payment_behavior: 'default_incomplete',
                payment_settings: { save_default_payment_method: 'on_subscription' },
                expand: ['latest_invoice.payment_intent'],
                transfer_data: {
                  destination: "acct_1OB6LP3ZaTYZG0nn", // conta connect do criador
                },
                metadata:{
                    "creator_id": req.body.userID
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
}

export default stripeSubscriptionCreate