const stripe = require("stripe")(process.env.STRIPE_API_SECRET)
const host = process.env.NEXT_PUBLIC_HOST

const stripeSubscriptionCancel = async (req, res) => {
  
    const { method } = req
  
    if (method === "POST") {
        try{
            
            const deletedSubscription = await stripe.subscriptions.del(
                req.body.subscriptionId
              );

            // RETORNA
            res.status(200).json(deletedSubscription)
        }
        catch(e){
            // RETORNA ERRO
            return res.status(400).send({
                error:{ message: e?.message }
            });
        }
    }
}

export default stripeSubscriptionCancel