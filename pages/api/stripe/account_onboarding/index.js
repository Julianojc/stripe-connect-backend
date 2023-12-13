const stripe = require("stripe")(process.env.NEXT_STRIPE_API_SECRET)
const host = process.env.NEXT_PUBLIC_HOST

export default async function stripeAccount (req, res) {
  
  const { method } = req

  const {
    query: { userID, stripeUserID, name, lastname},
  } = req

  var stripeID = '';

  if(method != "POST"){
    return res.status(500);
  }

  if (method === "POST") {
    try{
    

    // CREATE CONNECTED ACCOUNT
    const { mobile } = req.query

   
      if(req.body.stripeUserID == null){
          // ACCOUNT DEFAULT INFO
          const account = await stripe.accounts.create({
            type: "express",
            capabilities: {card_payments: {requested: true}, transfers: {requested: true}},
            business_type: 'individual',
            individual:{
              //email: _email,
              political_exposure: "none"
            },
            business_profile: {
              mcc: '5815', // categoria default> outros produtos digitais
              //url: process.env.WEB_APP_URL/@`$nickname`
            },
            individual: {
                first_name: name,
                last_name: lastname,
            },
            metadata: {
                'user_id': userID
            }
          })

          stripeID = account.id //set variable
      }
    
      // PARAMS
      const params = stripe.AccountLinkCreateParams = {       
        account: stripeID,
        refresh_url: `${host}/api/stripe/account/reauth?account_id=${stripeID}`, //redirec. quando o link expira ou há erro
        return_url: `${host}/register${mobile ? "-mobile" : ""}?account_id=${stripeID}&result=success`, // return link on sucess
        type: 'account_onboarding',
      }

      // CREATE WITH PARAMS
      const accountLinks = await stripe.accountLinks.create(params)

      if (mobile) {
        // In case of request generated from the MOBILE APP, return a json response
        res.status(200).json({ 
          success: true, 
          url: accountLinks.url, 
          accountID: stripeID 
        })
        
      } 
      else {
        // In case of request generated from the WEB SITE, redirect
        res.redirect(accountLinks.url)
      }
    }
    catch(e){
      return res.status(400).send({
        error:{ message: e?.message }
      });
    }
  
  }

}
