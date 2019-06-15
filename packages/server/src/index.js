import express from 'express';
import { ApolloServer, gql } from 'apollo-server-express';
import path from 'path';

const app = express();
let port;
if (!process.env.PORT) {
  port = 4000;
} else {
  port = process.env.PORT;
}

const typeDefs = gql`
  type Query {
    """
    Get the status of the api
    """
    status: String!
  }
`;

const resolvers = {
  Query: {
    status: () => 'ok!'
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers
});

server.applyMiddleware({ app });

app.get('/status', (req, res) => res.send('ok!'));

// Serving react client
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/build')));

  app.get('*', function(req, res) {
    res.sendFile(path.join(__dirname, '../../client/build', 'index.html'));
  });
}

app.listen(port, () => console.log(`Listening on ::${port}`));
