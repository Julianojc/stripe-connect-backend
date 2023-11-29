import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { WebSocketLink } from "@apollo/client/link/ws";
import { createClient } from 'graphql-ws';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';

//APOLLO CLIENT CONFIG

const httpsLink = new HttpLink({
    uri: process.env.HASURA_ENDPOINT,
    headers: {
      'x-hasura-admin-secret': process.env.HASURA_DB_ADMIN_SECRET
    }
  });

  const wssLink = new GraphQLWsLink(createClient({
    url: process.env.HASURA_ENDPOINT,
    connectionParams: {
      headers: {
        'x-hasura-admin-secret': process.env.HASURA_DB_ADMIN_SECRET
      }
    }
  }));
    
  const splitlink = split(
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
      link: splitlink,
      cache: new InMemoryCache(),
      
    });
  };
  
  export const client = createApolloClient();