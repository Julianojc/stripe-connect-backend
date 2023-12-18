
const stripe = require("stripe")( process.env.NEXT_STRIPE_API_SECRET ) //STRIPE SECRET

const balanceRetrieve = async (req, res) => {
  
    const { method } = req

    const { query: { accConnectId} } = req
  
    if (method === "GET") {
        try{
            const _balance = await stripe.balance.retrieve({stripeAccount: accConnectId });
            res.status(200).json({ 
                balance: _balance
            });
        }
        catch (error) {
            console.error('An error occurred when calling the Stripe API to retreive Balance Data', error);
            res.status(500);
            res.send({error: error.message});
        }
    }
    else{
        return res.status(500);;
    }
}

export default balanceRetrieve