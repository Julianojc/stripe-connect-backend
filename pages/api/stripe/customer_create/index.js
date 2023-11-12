const stripe = require("stripe")(process.env.STRIPE_API_SECRET)
const host = process.env.NEXT_PUBLIC_HOST

const stripeCustomerAccount = async (req, res) => {
  
    const { method } = req
  
    if (method === "POST") {
        try{
            const customer = await stripe.customers.create({
                description: 'Usuário Padrão',
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