import { client } from "../../client_config/index.js"

const stripe = require("stripe")( process.env.NEXT_STRIPE_API_SECRET ) //STRIPE SECRET

// DELETA UM PRODUTO E UM PREÇO

export default async function stripeProductDelete (req, res) {
  
    const { method } = req

    const {
        query: { priceid, productId },
      } = req
  
    if (method === "POST") {
        try{
            const priceUpdate = await stripe.prices.update({
                active: false
            });

            if(priceUpdate != null){
                await stripe.product.del(productId);
               // return
               return res.status(200).json({ 
                success: true, 
                priceId: data.id,
                productId: data.product 
            })
               
        }

            
        }
        catch(e){
            return res.status(400).send({
                error:{ 
                    message: e?.message,
                    dataSendToServer: {
                        name: name,
                        price: price,
                        userId: user_id
                    } 
                }
            });
        }
    }
}


