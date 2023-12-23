import { client } from "../../client_config/index.js"

const stripe = require("stripe")( process.env.NEXT_STRIPE_API_SECRET ) //STRIPE SECRET

// DELETA UM PRODUTO E UM PREÇO

export default async function stripeProductUpdate(req, res) {
  
    const { method } = req

    const {
        query: { productId, active, name },
      } = req
  
    if (method === "POST") {
        try{
            const product = await stripe.products.update(
                productId,
                {
                name: name,
                active: active
            });

            if(product != null){
               return res.status(200).json({ 
                success: true, 
                product: data.product 
            })
               
        }
        }
        catch(e){
            return res.status(400).send({
                error:{ 
                    message: e?.message,
                }
            });
        }
    }
}