import { client } from "../../client_config/index.js"

const stripe = require("stripe")( process.env.NEXT_STRIPE_API_SECRET ) //STRIPE SECRET

// CRIA UM PRODUTO JA COM O PREÇO

export default async function stripeProductAndPriceCreate (req, res) {
  
    const { method } = req
  
    if (method === "POST") {
        try{
            const data = await stripe.prices.create({
                unit_amount: req.body.price, //interger ex: 2000
                currency: req.body.currency, //ex: 'brl',
                recurring: {interval: 'month'},
                product_data: {
                    name: req.body.name,
                    active: true,
                    metadata:{
                        "user_id": req.body.user_id
                    }
                },
                metadata:{
                    "user_id": req.body.user_id
                }
            });

            if(data != null){
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
                error:{ message: e?.message }
            });
        }
    }
}


