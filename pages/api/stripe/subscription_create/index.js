const stripe = require("stripe")(process.env.STRIPE_API_SECRET)
const host = process.env.NEXT_PUBLIC_HOST

const stripeSubscriptionCreate = async (req, res) => {
  
    const { method } = req
  
    if (method === "POST") {
        try{
            const data = await stripe.subscriptions.create({
                customer: req.body.customerID,
                application_fee_percent: process.env.STRIPE_APP_FEE, //.env variable
                items: [
                  {
                    price: req.body.price,
                  },
                ],
                expand: ['latest_invoice.payment_intent'],
                transfer_data: {
                  destination: req.body.accConnectID,
                },
                metadata:{
                    "creator_id": req.body.userID
                }
            });

            res.status(200).json({ 
                data: data, 
            })
        }
        catch(e){
            return res.status(400).send({
                error:{ message: e?.message }
            });
        }
    }
}

export default stripeCustomerAccount