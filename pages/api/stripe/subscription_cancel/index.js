const stripe = require("stripe")(process.env.NEXT_STRIPE_API_SECRET)
const host = process.env.NEXT_PUBLIC_HOST

export default async function stripeSubscriptionCancel (req, res){
  
    const { method } = req
  
    if (method === "POST") {
        try{
            // cancela a assinatura no final do período de faturamento atual 
            // (ou seja, para o período de tempo que o cliente já pagou), 
            // atualiza a assinatura com o valor cancel_at_period_end como true:

            const subscription = await stripe.subscriptions.update(
                req.body.subscriptionId,
                {
                    cancel_at_period_end: true,
                }
              );

            // RETORNA
            res.status(200).json(subscriptionCancelled)
        }
        catch(e){
            // RETORNA ERRO
            return res.status(400).send({
                error:{ message: e?.message }
            });
        }
    }
}
