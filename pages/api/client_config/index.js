import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

//APOLLO CLIENT CONFIG

const httpsLink = new HttpLink({
    uri: process.env.HASURA_ENDPOINT,
    headers: {
      'x-hasura-admin-secret': process.env.HASURA_DB_ADMIN_SECRET
    }
  });
  
  const wssLink = new WebSocketLink({
    uri: process.env.HASURA_ENDPOINT,
    options: {
      reconnect: true,
      connectionParams: {
        headers: {
          'x-hasura-admin-secret': process.env.HASURA_DB_ADMIN_SECRET
        }
      }
    }
  });
  
  const link = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
      );
    },
    wssLink,
    httpsLink
  );
  
  const createApolloClient = () => {
    return new ApolloClient({
      cache: new InMemoryCache(),
      link
    });
  };
  
  export const client = createApolloClient();