
const stripe = require("stripe")( process.env.NEXT_STRIPE_API_SECRET )

const balanceRetrieve = async (req, res) => {
  
    const { method } = req

    const { query: { accConnectId} } = req
  
    if (method === "GET") {
        try{
            
            // lista histórico de transações de saldo
            const _balanceTransations = await stripe.balanceTransactions.list({
                stripeAccount: accConnectId,
                limit: 10,
                //starting_after: //<Paginação
            }); 
            
            res.status(200).json({ 
                transations: _balanceTransations
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