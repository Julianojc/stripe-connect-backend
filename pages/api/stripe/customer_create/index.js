
const stripe = require("stripe")( process.env.NEXT_STRIPE_API_SECRET ) //STRIPE SECRET

export default async function stripeCustomerAccount(req, res){
  
    const { method } = req

    const {
        query: { userID, email, name },
    } = req
  
    if (method === "POST") {
        try{
            const customer = await stripe.customers.create({
                name: name,
                email: email,
                description: `user_${userID}`,
                metadata:{
                    "user_id": userID
                }
            });

            updateStripeInfoDATABASE({
                user_id: userID,
                customer_id: customer.id,
                email: email
            })

            res.status(200).json({ 
                success: true, 
                customer: customer
            })
        }
        catch(e){
            return res.status(400).send({
                error:{ message: e?.message }
            });
        }
    }
}


async function updateStripeInfoDATABASE({user_id, customer_id, email}){
    try{  
  
        console.log(`${invoice_id}, ${subscription_id}, ${client_id}`)
  
        const _mutation = gql`
        mutation UpdateInfo(
                $user_id: String!, 
                $customer_id: String!, 
                $email: String!
            ){               
            update_stripe_info(
                where: {user_id: {_eq: $user_id}}, 
                _set: {customer_id: $customer_id, email: $email}) {
                affected_rows
            }
        }`; 

        var data = await client.mutate({
          mutation: _mutation,
          variables:{
            user_id: user_id,
            customer_id: customer_id,
            email: email
  
          }
        })
        if(data != null ){
          console.log(`SUCCESS > ${data}`)
        }
    }
    catch(e){
      console.log(e)
    }
  }