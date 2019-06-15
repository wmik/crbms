import 'semantic-ui-css/semantic.min.css';
import React from 'react';
import { ApolloProvider, Query } from 'react-apollo';
import gql from 'graphql-tag';
import ApolloClient from 'apollo-boost';
import { Grid } from 'semantic-ui-react';

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
    <Grid.Row>
      <Grid.Column>
        <Query query={QUERY_STATUS}>
          {({ loading, error, data }) => {
            if (loading) return <p>Loading...</p>;
            if (error) return <p>Error :(</p>;

            return <pre>{data.status}</pre>;
          }}
        </Query>
      </Grid.Column>
    </Grid.Row>
  );
}

function App() {
  return (
    <ApolloProvider client={client}>
      <Grid stackable>
        <Status />
      </Grid>
    </ApolloProvider>
  );
}

export default App;
