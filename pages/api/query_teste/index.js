
import { client } from "../../client_config/index.js"
import { gql, useQuery } from '@apollo/client';

const QUERY_USERS = gql`
query MyQuery {
    user {
      id
    }
  }
  
`;

export default async function handler(req, res){
    
  if (req.method !== "GET") {
    return
  }

 const res = await client
    .query({
        query: QUERY_USERS
 })

 if(res != null ){
    return response.status(200).json({
        data: res
    });
 }
 else {
    return res.status(400).send(`QUERY Error`)
  }

  
//   const { loading, error, data } = useQuery(QUERY_USERS, {
//     variables: {
//       id: accountUpdated.metadata.user_id,
//       role: 'CREATOR',
//       stripe_connect_id: accountUpdated.id
//     },
//   });
//   if(error){
//     return res.status(400).send(`QUERY Error`)
//   }
//   if(data != null) {
//     return response.status(200).json({
//         data: data
//     });
//   }
//   else {
//     return res.status(400).send(`QUERY Error`)
//   }
    
}

