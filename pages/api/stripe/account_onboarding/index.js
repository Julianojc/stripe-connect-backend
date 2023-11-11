const stripe = require("stripe")(process.env.STRIPE_API_SECRET)
const host = process.env.NEXT_PUBLIC_HOST

const stripeAccount = async (req, res) => {
  
  const { method } = req

  if (method === "POST") {
    try{
    var _stripeUserID = req.body.stripeUserID;
    const _userID = req.body.userID;
    const _name = req.body.name;
    const _lastname = req.body.lastname;
    const _email = req.body.email;
    const _profileURL = req.body.profileURL

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
              //first_name: _name,
              //last_name: _lastname,
              political_exposure: "none"
            },
            business_profile: {
              mcc: '5815', // categoria default> outros produtos digitais
              //url: _profileURL
            },
            individual: {
                first_name: _name,
                last_name: _lastname,
            },
            metadata: {
                'creator_id': _userID
            }
          })
          _stripeUserID = account.id
      }
    
      // PARAMS
      const params = stripe.AccountLinkCreateParams = {       
        account: _stripeUserID,
        refresh_url: `${host}/api/stripe/account/reauth?account_id=${_stripeUserID}`, //redirec. quando o link expira ou há erro
        return_url: `${host}/register${mobile ? "-mobile" : ""}?account_id=${_stripeUserID }&result=success`, // return link on sucess
        type: 'account_onboarding',
      }

      // CREATE WITH PARAMS
      const accountLinks = await stripe.accountLinks.create(params)

      if (mobile) {
        // In case of request generated from the MOBILE APP, return a json response
        res.status(200).json({ 
          success: true, 
          url: accountLinks.url, 
          accountID: _stripeUserID 
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
  
  else if (method === "DELETE") {
    // Delete the Connected Account having provided ID
    const {
      query: { id },
    } = req
    console.log(id)
    const deleted = await stripe.accounts.del(id)
    res.status(200).json({ message: "account deleted successfully", deleted })
  } 

  // else if (method === "GET") {
  //   // Retrieve the Connected Account for the provided ID
  //   // I know it shouldn't be a POST call. Don't judge :D I had a lot on my plate
  //   const account = await stripe.accounts.retrieve(req.query.id)
  //   res.status(200).json({ account })
  // }
}

export default stripeAccount
