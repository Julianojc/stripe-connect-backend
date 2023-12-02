
const stripe = require("stripe")( process.env.NEXT_STRIPE_API_SECRET ) //STRIPE SECRET

const accountRetrieve = async (req, res) => {
  
    const { method } = req
  
    if (method === "GET") {
        try{
            const account = await stripe.accounts.retrieve(req.query.id)
            res.status(200).json({ account })
        }
        catch (error) {
            console.error('An error occurred when calling the Stripe API to retreive Account Data', error);
            res.status(500);
            res.send({error: error.message});
        }
    }
    else{
        return res.status(500);;
    }
}

export default accountRetrieve