const stripe = require("stripe")(process.env.STRIPE_API_SECRET)
const host = process.env.NEXT_PUBLIC_HOST



const stripeOnboardingCheck = async (req, res) => {
    if (method === "GET") {
       // verify boolean > details_submitted < is true
    }
}
