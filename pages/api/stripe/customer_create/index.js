
const stripe = require("stripe")( process.env.NEXT_STRIPE_API_SECRET ) //STRIPE SECRET

const stripeCustomerAccount = async (req, res) => {
  
    const { method } = req
  
    if (method === "POST") {
        try{
            const customer = await stripe.customers.create({
                email: req.body.email,
                description: `user_${req.body.userID}`,
                metadata:{
                    "user_id": req.body.userID
                }
            });

            res.status(200).json({ 
                success: true, 
                customer: customer
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