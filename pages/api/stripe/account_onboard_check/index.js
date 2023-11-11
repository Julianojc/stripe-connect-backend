const stripe = require("stripe")(process.env.STRIPE_API_SECRET)
const host = process.env.NEXT_PUBLIC_HOST



const stripeOnboardingCheck = async (req, res) => {
    if (method === "GET") {
        try{

            console.log(req.query.accountID)
            // verify boolean > details_submitted < is true
            const account = await stripe.accounts.retrieve( req.query.accountID );

            return res.status(200).json({ account })
            
            // return res.status(200).json({
            //     isActive: response.details_submitted
            // })
        }
        catch(e){
            return res.status(400).send({
                error:{ message: e?.message }
            });
        }
       
    }else{
        return res.status(400).send({
            error:{ message: e?.message }
        });
    }
}

export default stripeOnboardingCheck
