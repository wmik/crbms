import express from 'express';
import { ApolloServer, gql } from 'apollo-server-express';
import { AuthenticationError } from 'apollo-server';
import path from 'path';
import { verify, sign } from './jwt';
import dataSources from './dataSources';

const app = express();
let port;
if (!process.env.PORT) {
  port = 4000;
} else {
  port = process.env.PORT;
}

function withAuthentication(resolver) {
  return function wrapper(parent, args, context, info) {
    if (!context.req.session.user) {
      throw new AuthenticationError('Invalid authentication');
    }
    return resolver(parent, args, context, info);
  };
}

const context = ({ req }) => {
  const token = req ? req.headers.authorization : '';
  let user = false;
  try {
    user = verify(token);
  } catch (error) {
    user = false;
  }
  req.session = { user };
  return { req };
};

const typeDefs = gql`
  """
  Response on successful login
  """
  type LoginPayload {
    """
    JWT authentication token
    """
    token: String!
  }
  type RegistrationPayload {
    """
    Unique identifier
    """
    id: ID!
    """
    Account email address
    """
    email: String
    """
    Account type
    """
    type: String
  }
  type Query {
    """
    Get the status of the api
    """
    status: String!
    """
    Validates user login credentials
    """
    login(email: String!, password: String!): LoginPayload
    """
    Registers a new account
    """
    register(email: String!, password: String!): RegistrationPayload
  }
`;

const resolvers = {
  Query: {
    status: () => 'ok!',
    login: async (_, { email, password }, { dataSources }) => {
      const user = await dataSources.accounts.authenticate(email, password);
      if (user) {
        const token = sign(user);
        return { token };
      }
      throw new AuthenticationError('Invalid authentication');
    },
    register: (_, { email, password }, { dataSources }) =>
      dataSources.accounts.register(email, password)
  },
  RegistrationPayload: {
    id: data => data.account_id
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context,
  dataSources
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
