
const stripe = require("stripe")( process.env.NEXT_STRIPE_API_SECRET ) //STRIPE SECRET

const accountSession = async (req, res) => {
  
    const { method } = req
  
    if (method === "POST") {
        try{
            const accSession = await stripe.accountSessions.create({
                account: req.body.account_connect_id,
                components: {
                  account_onboarding: {
                    enabled: true
                  }
                }
              });
          
              res.json({
                client_secret: accSession.client_secret,
              });
        }
        catch (error) {
            console.error('An error occurred when calling the Stripe API to create an account session', error);
            res.status(500);
            res.send({error: error.message});
        }
    }
    else{
        return res.status(500);;
    }
}

export default accountSession