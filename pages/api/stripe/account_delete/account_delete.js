
const stripe = require("stripe")( process.env.NEXT_STRIPE_API_SECRET ) //STRIPE SECRET

const accountDelete = async (req, res) => {
  
    const { method } = req
    const {
        query: { id },
      } = req

    if (method === "DELETE") {
        try{
            console.log(id)
            const deleted = await stripe.accounts.del(id)
            res.status(200).json({ message: "account deleted successfully", deleted })     
        }
        catch (error) {
            console.error('An error occurred when calling the Stripe API to DELETE Account Data', error);
            res.status(500);
            res.send({error: error.message});
        }
    }
    else{
        return res.status(500);;
    }
}

export default accountDelete