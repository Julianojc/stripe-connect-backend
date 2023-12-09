
const stripe = require("stripe")( process.env.NEXT_STRIPE_API_SECRET ) //STRIPE SECRET

export default async function stripeCustomerAccount(req, res){
  
    const { method } = req

    const {
        query: { userID, email, name },
    } = req
  
    if (method === "POST") {
        try{
            const customer = await stripe.customers.create({
                name: name,
                email: email,
                description: `user_${userID}`,
                metadata:{
                    "user_id": userID
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


