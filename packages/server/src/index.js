import express from 'express';
import { ApolloServer, gql } from 'apollo-server-express';
import { AuthenticationError } from 'apollo-server';
import path from 'path';
import { verify, sign } from './jwt';
import dataSources from './dataSources';
import { map, transformKeysToCamelCase } from './util';

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

function withPagination(resolver) {
  return async function paginationWrapper(parent, args, context, info) {
    const results = await Promise.resolve(
      resolver(parent, args, context, info)
    );
    if (Array.isArray(results)) {
      const offset = args.offset;
      const limit = args.limit;
      return {
        pageInfo: {
          offset,
          limit,
          totalCount: results.length
        },
        results
      };
    }
  };
}

function withTransformToKeysCamelCase(resolver) {
  return async function transformKeysToCamelCaseWrapper(
    parent,
    args,
    context,
    info
  ) {
    const result = await Promise.resolve(resolver(parent, args, context, info));
    if (Array.isArray(result)) {
      return result.map(value =>
        typeof value === 'object' ? map(value, transformKeysToCamelCase) : value
      );
    }
    if (typeof result === 'object' && result !== null) {
      return map(result, transformKeysToCamelCase);
    }
    return result;
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
  interface Node {
    id: ID!
  }
  """
  Pagination object
  """
  type PageInfo {
    """
    Offset
    """
    offset: Int!
    """
    Limit
    """
    limit: Int!
    """
    Total count
    """
    totalCount: Int!
  }
  """
  Response on successful login
  """
  type LoginPayload {
    """
    JWT authentication token
    """
    token: String!
  }

  """
  Response on successful account registration
  """
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

  """
  Organization details
  """
  type ClientOrganization {
    name: String
  }
  """
  Client details
  """
  type Client implements Node {
    """
    Unique identifier
    """
    id: ID!
    """
    First name
    """
    firstName: String
    """
    Last name
    """
    lastName: String
    """
    Client email address
    """
    email: String
    """
    Client phone number
    """
    phone: String
    """
    Client ID or passport number
    """
    identificationNumber: String
    """
    Client nationality
    """
    nationality: String
    """
    Client type
    """
    type: String
    """
    Organization details
    """
    organization: ClientOrganization
  }

  type ClientsPage {
    pageInfo: PageInfo!
    results: [Client]
  }

  """
  Organization details input shema
  """
  input ClientOrganizationInput {
    name: String
  }

  """
  Client details input schema
  """
  input ClientInput {
    """
    First name
    """
    firstName: String
    """
    Last name
    """
    lastName: String
    """
    Client email address
    """
    email: String
    """
    Client phone number
    """
    phone: String
    """
    Client ID or passport number
    """
    identificationNumber: String
    """
    Client nationality
    """
    nationality: String
    """
    Client type
    """
    type: String
    """
    Organization details input schema
    """
    organization: ClientOrganizationInput
  }

  """
  Vehicle Hire price details
  """
  type VehicleHirePricing {
    currencyCode: String
    value: Int
  }

  """
  Vehicle Hire price details input schema
  """
  input VehicleHirePricingInput {
    currencyCode: String!
    value: Int!
  }

  """
  Vehicle details
  """
  type Vehicle implements Node {
    """
    Unique identifier
    """
    id: ID!
    """
    Vehicle make
    """
    make: String
    """
    Vehicle model
    """
    model: String
    """
    License plate identification number
    """
    license: String
    """
    Maximum Fuel capacity in litres
    """
    fuelCapacityMax: Int
    """
    Total number of passengers
    """
    passengers: Int
    """
    Rental price per day in Kenyan shillings
    """
    hirePricing: VehicleHirePricing
  }

  """
  Vehicles
  """
  type VehiclesPage {
    pageInfo: PageInfo!
    results: [Vehicle]
  }

  """
  Vehicle details input schema
  """
  input VehicleInput {
    """
    Vehicle make
    """
    make: String
    """
    Vehicle model
    """
    model: String
    """
    License plate identification number
    """
    license: String
    """
    Maximum Fuel capacity in litres
    """
    fuelCapacityMax: Int
    """
    Total number of passengers
    """
    passengers: Int
    """
    Rental price per day in Kenyan shillings
    """
    hirePricing: VehicleHirePricingInput
  }

  """
  Job details
  """
  type Job implements Node {
    """
    Unique identifier
    """
    id: ID!
    """
    Unique client identifier
    """
    client: Client
    """
    Unique vehicle identifiers
    """
    vehicles: VehiclesPage
    """
    Start date
    """
    startDate: String
    """
    End date
    """
    endDate: String
  }

  """
  Jobs
  """
  type JobsPage {
    pageInfo: PageInfo!
    results: [Job]
  }

  """
  Job details input schema
  """
  input JobInput {
    """
    Unique client identifier
    """
    clientId: ID!
    """
    Unique vehicle identifiers
    """
    vehicleIds: [ID!]!
    """
    Start date
    """
    startDate: String
    """
    End date
    """
    endDate: String
  }

  """
  Root query
  """
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
    """
    Clients
    """
    clients(offset: Int, limit: Int): ClientsPage
    """
    Vehicles
    """
    vehicles(offset: Int, limit: Int): VehiclesPage
    """
    Jobs
    """
    jobs(offset: Int, limit: Int): JobsPage
    """
    Node
    """
    node(id: ID!, typename: String!): Node
  }

  """
  Root mutation
  """
  type Mutation {
    addClient(data: ClientInput!): Client
    addVehicle(data: VehicleInput!): Vehicle
    addJob(data: JobInput!): Job
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
    register: async (_, { email, password }, { dataSources }) => {
      const validation = await dataSources.mailer.validateEmail(email);
      if (validation && validation.result === 'deliverable') {
        const sent = await dataSources.mailer.sendEmail({
          from: 'Carzi <noreply@carzi.io>',
          to: email,
          subject: 'Welcome to Carzi',
          text: 'Welcome to Carzi!'
        });
        if (sent && sent.message.includes('Queued')) {
          const account = await dataSources.accounts.register(email, password);
          return account;
        }
      }
    },
    clients: withAuthentication(
      withPagination(
        withTransformToKeysCamelCase(
          (_, { offset = 0, limit = 5 }, { dataSources, req }) =>
            dataSources.clients.findAll(
              { account_id: req.session.user.account_id },
              { offset, limit }
            )
        )
      )
    ),
    vehicles: withAuthentication(
      withPagination(
        withTransformToKeysCamelCase(
          (_, { offset = 0, limit = 5 }, { dataSources, req }) =>
            dataSources.vehicles.findAll(
              { account_id: req.session.user.account_id },
              { offset, limit }
            )
        )
      )
    ),
    jobs: withAuthentication(
      withPagination(
        withTransformToKeysCamelCase(
          (_, { offset = 0, limit = 5 }, { dataSources, req }) =>
            dataSources.jobs.findAll(
              { account_id: req.session.user.account_id },
              { offset, limit }
            )
        )
      )
    ),
    node: withAuthentication(
      withTransformToKeysCamelCase(
        async (_, { id, typename }, { dataSources, req }) => {
          const createQueryObject = type => ({
            [`${type}_id`]: id,
            account_id: req.session.user.account_id
          });
          let result;
          const limit = 1;
          const offset = 0;
          if (typename === 'Client') {
            [result = null] = await dataSources.clients.findAll(
              createQueryObject('client'),
              {
                limit,
                offset
              }
            );
          }
          if (typename === 'Job') {
            [result = null] = await dataSources.jobs.findAll(
              createQueryObject('job'),
              {
                limit,
                offset
              }
            );
          }
          if (typename === 'Vehicle') {
            [result = null] = await dataSources.vehicles.findAll(
              createQueryObject('vehicle'),
              {
                limit,
                offset
              }
            );
          }
          return result;
        }
      )
    )
  },
  Mutation: {
    addClient: withAuthentication(
      withTransformToKeysCamelCase((_, { data }, { dataSources, req }) =>
        dataSources.clients.insertOne(
          Object.assign({}, data, { account_id: req.session.user.account_id })
        )
      )
    ),
    addVehicle: withAuthentication(
      withTransformToKeysCamelCase((_, { data }, { dataSources, req }) =>
        dataSources.vehicles.insertOne(
          Object.assign({}, data, { account_id: req.session.user.account_id })
        )
      )
    ),
    addJob: withAuthentication(
      withTransformToKeysCamelCase((_, { data }, { dataSources, req }) =>
        dataSources.jobs.insertOne(
          Object.assign({}, data, { account_id: req.session.user.account_id })
        )
      )
    )
  },
  RegistrationPayload: {
    id: data => data.account_id
  },
  Client: {
    id: data => data.clientId
  },
  Vehicle: {
    id: data => data.vehicleId
  },
  Job: {
    id: data => data.jobId,
    client: withTransformToKeysCamelCase(
      async (data, _, { dataSources, req }) => {
        const [client = null] = await dataSources.clients.findAll(
          {
            client_id: data.clientId,
            account_id: req.session.user.account_id
          },
          { limit: 1 }
        );
        return client;
      }
    ),
    vehicles: withPagination(
      withTransformToKeysCamelCase(
        (data, { offset = 0, limit = 5 }, { dataSources, req }) =>
          dataSources.vehicles.findMany(
            { account_id: req.session.user.account_id },
            { offset, limit },
            data.vehicleIds,
            'vehicle_id'
          )
      )
    )
  },
  Node: {
    __resolveType: data => {
      if (data.jobId) {
        return 'Job';
      }
      if (data.clientId) {
        return 'Client';
      }
      if (data.vehicleId) {
        return 'Vehicle';
      }
    }
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
