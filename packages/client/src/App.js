import React from 'react';
import { ApolloProvider, Query } from 'react-apollo';
import gql from 'graphql-tag';
import ApolloClient from 'apollo-boost';

const client = new ApolloClient({
  uri: '/graphql'
});

const QUERY_STATUS = gql`
  {
    status
  }
`;

function Status() {
  return (
    <Query query={QUERY_STATUS}>
      {({ loading, error, data }) => {
        if (loading) return <p>Loading...</p>;
        if (error) return <p>Error :(</p>;

        return <pre>{data.status}</pre>;
      }}
    </Query>
  );
}

function App() {
  return (
    <ApolloProvider client={client}>
      <Status />
    </ApolloProvider>
  );
}

export default App;
