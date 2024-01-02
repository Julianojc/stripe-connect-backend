
const stripe = require("stripe")( process.env.NEXT_STRIPE_API_SECRET ) //STRIPE SECRET

// CRIAR REPASSE MANUALMENTE
export default async function stripePayoutCreate(req, res){
  
    const { method } = req

    const {
        query: { connectId, amount, currency },
    } = req
  
    if (method === "POST") {
        try{
            const payout = await stripe.payouts.create(
                {
                amount: amount, //int
                currency: currency, //'brl',
                source_type: 'bank_account',
                },
                {
                    stripeAccount: connectId,
                }
            );

            res.status(200).json({ 
                success: true, 
                payout: payout
            })
        }
        catch(e){
            return res.status(400).send({
                error:{ message: e?.message }
            });
        }
    }
}


