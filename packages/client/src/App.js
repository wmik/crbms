import 'semantic-ui-css/semantic.min.css';
import React from 'react';
import { ApolloProvider, ApolloConsumer } from 'react-apollo';
import gql from 'graphql-tag';
import ApolloClient from 'apollo-boost';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  Grid,
  Form,
  Header,
  Button,
  Message,
  Menu,
  Dropdown,
  Card,
  Container,
  Icon,
  Table,
  Step,
  Tab
} from 'semantic-ui-react';
import { useField, useForm } from 'react-jeff';
import { createContainer } from 'unstated-next';
import useSessionStorage from 'react-use/lib/useSessionStorage';
import { Router, Link, navigate, Redirect } from '@reach/router';
import emailValidator from 'email-validator';

dayjs.extend(relativeTime);

const client = new ApolloClient({
  uri: '/graphql'
});

const QUERY_LOGIN = gql`
  query Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
    }
  }
`;

const QUERY_REGISTER = gql`
  query Register($email: String!, $password: String!) {
    register(email: $email, password: $password) {
      id
    }
  }
`;

function FormInput({ label, icon, onChange, value, type, ...props }) {
  return (
    <React.Fragment>
      {props.error && (
        <small style={{ color: '#9f3a38' }}>{props.message}</small>
      )}
      <Form.Input
        label={label}
        type={type}
        icon={icon}
        iconPosition={icon ? 'left' : null}
        onChange={e => onChange(e.currentTarget.value)}
        value={value}
        {...props}
      />
    </React.Fragment>
  );
}

function FormCheckbox({ label, onChange, value, ...props }) {
  return (
    <Form.Checkbox
      label={label}
      onChange={() => onChange(!value)}
      checked={value}
      {...props}
    />
  );
}

function LoginForm({ client }) {
  const { token, setToken } = AuthContainer.useContainer();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);
  const email = useField({
    defaultValue: '',
    required: true
  });
  const password = useField({
    defaultValue: '',
    required: true
  });
  const remember = useField({
    defaultValue: false
  });
  const form = useForm({
    fields: [email, password, remember],
    onSubmit: () => {}
  });
  React.useEffect(() => {
    async function login() {
      setLoading(true);
      try {
        const { errors, data } = await client.query({
          query: QUERY_LOGIN,
          variables: { email: email.value, password: password.value }
        });
        if (errors) {
          setError(true);
        }
        if (data) {
          setToken(data.login.token);
          navigate('/');
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    if (form.submitting && form.fieldErrors.length === 0) {
      login();
    }
  }, [
    client,
    email.value,
    form.fieldErrors.length,
    form.submitting,
    password.value,
    setToken
  ]);
  if (token !== null) {
    return <Redirect to="/" noThrow />;
  }
  return (
    <Grid.Column width={4}>
      <Header content="Login" size="large" />
      <Form
        onSubmit={() => {
          setError(false);
          form.props.onSubmit();
        }}
        loading={loading || form.submitting}
        error={error}
      >
        <Message
          error
          header="Invalid credentials"
          content="Please confirm your email and password"
        />
        <FormInput
          label="Email address"
          type="email"
          icon="user"
          {...email.props}
        />
        <FormInput
          label="Password"
          type="password"
          icon="lock"
          {...password.props}
        />
        <FormCheckbox label="Remember me" {...remember.props} />
        <Button type="submit" content="Login" fluid />
      </Form>
      <Header as="h4">
        Don't have an account? <Link to="/registration">Register</Link>
      </Header>
    </Grid.Column>
  );
}

function LoginPage() {
  return (
    <Grid stackable padded>
      <Grid.Row centered>
        <ApolloConsumer>
          {client => <LoginForm client={client} />}
        </ApolloConsumer>
      </Grid.Row>
    </Grid>
  );
}

function validatePassword(value) {
  let errors = [];

  if (value.length < 6) {
    errors.push('Must be at least 6 characters long');
  }

  if (!/[a-z]/.test(value)) {
    errors.push('Must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(value)) {
    errors.push('Must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(value)) {
    errors.push('Must contain at least one number');
  }

  return errors;
}

function validateConfirmPassword(value, password) {
  let errors = [];

  if (value !== password) {
    errors.push('Must match password');
  }

  return errors;
}

function useConfirmPasswordField(password) {
  return useField({
    defaultValue: '',
    required: true,
    validations: [value => validateConfirmPassword(value, password)]
  });
}

async function validateEmail(value) {
  let errors = [];

  if (!emailValidator.validate(value)) {
    errors.push('Invalid email address');
  }
  return errors;
}

function RegistrationForm({ client }) {
  const { token } = AuthContainer.useContainer();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const email = useField({
    defaultValue: '',
    required: true,
    validations: [validateEmail]
  });
  const password = useField({
    defaultValue: '',
    required: true,
    validations: [validatePassword]
  });
  const confirmPassword = useConfirmPasswordField(password.value);
  const termsConditions = useField({
    defaultValue: false,
    required: true
  });
  const form = useForm({
    fields: [email, password, confirmPassword, termsConditions],
    onSubmit: () => {}
  });
  React.useEffect(() => {
    async function registerAccount() {
      setSuccess(false);
      setLoading(true);
      try {
        const { errors, data } = await client.query({
          query: QUERY_REGISTER,
          variables: { email: email.value, password: password.value }
        });
        if (errors) {
          setError(true);
        }
        if (data && data.register.id) {
          setSuccess(true);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    if (form.submitting && form.fieldErrors.length === 0) {
      registerAccount();
    }
  }, [
    client,
    email.value,
    form.fieldErrors.length,
    form.submitting,
    password.value
  ]);

  React.useEffect(() => {
    let timeoutId = null;
    if (success) {
      timeoutId = setTimeout(navigate, 3000, '/login');
    }
    return () => {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    };
  }, [success]);
  if (token !== null) {
    return <Redirect to="/" noThrow />;
  }
  return (
    <Grid.Column width={4}>
      <Header content="Registration" size="large" />
      <Form
        onSubmit={() => {
          if (form.fieldErrors.length === 0) {
            setError(false);
            form.props.onSubmit();
          }
        }}
        loading={loading || form.submitting}
        error={error}
        success={success}
      >
        <Message success>
          <Message.Header content="Success" />
          <Message.Content>
            Please wait while we redirect you to the login page{' '}
            <Icon name="spinner" loading />
          </Message.Content>
        </Message>
        <Message
          error
          header="Invalid credentials"
          content="Please confirm your email address is NOT registered to an account already."
        />
        <FormInput
          label="Email address"
          type="email"
          icon="user"
          error={email.errors.length > 0}
          message={email.errors.slice(0, 1)[0]}
          {...email.props}
        />
        <FormInput
          label="Password"
          type="password"
          icon="lock"
          error={password.errors.length > 0}
          message={password.errors.slice(0, 1)[0]}
          {...password.props}
        />
        <FormInput
          label="Confirm Password"
          type="password"
          icon="lock"
          error={confirmPassword.errors.length > 0}
          message={confirmPassword.errors.slice(0, 1)[0]}
          {...confirmPassword.props}
        />
        <FormCheckbox
          label="I agree to the Terms and Conditions"
          {...termsConditions.props}
        />
        <Button type="submit" content="Register" fluid />
      </Form>
      <Header as="h4">
        Already have an account? <Link to="/login">Login</Link>
      </Header>
    </Grid.Column>
  );
}

function RegistrationPage() {
  return (
    <Grid stackable padded>
      <Grid.Row centered>
        <ApolloConsumer>
          {client => <RegistrationForm client={client} />}
        </ApolloConsumer>
      </Grid.Row>
    </Grid>
  );
}

function useAuth() {
  const [token, setToken] = useSessionStorage('token', null);
  return { token, setToken };
}

const AuthContainer = createContainer(useAuth);

function LandingPage() {
  return (
    <Grid stackable>
      <Grid.Row>
        <Menu fluid attached="top">
          <Menu.Item position="right">
            <Link to="/login">
              <Button content="Login" size="small" />
            </Link>
          </Menu.Item>
          <Menu.Item>
            <Link to="/registration">
              <Button content="Register" size="small" />
            </Link>
          </Menu.Item>
        </Menu>
      </Grid.Row>
    </Grid>
  );
}

function TopNavigation() {
  const { setToken } = AuthContainer.useContainer();
  return (
    <Menu fluid>
      <Menu.Item content="Application" header />
      <Menu.Item position="right">
        <Dropdown icon="cog" direction="left">
          <Dropdown.Menu
            direction="left"
            style={{ padding: '0.5rem 0', width: '12rem' }}
          >
            <Dropdown.Item content="Account" icon="user" />
            <Dropdown.Divider />
            <Dropdown.Item
              content="Logout"
              icon="sign out"
              onClick={() => setToken(null)}
            />
          </Dropdown.Menu>
        </Dropdown>
      </Menu.Item>
    </Menu>
  );
}
function SideMenu() {
  return (
    <Grid.Column width={4}>
      <Menu vertical>
        <Menu.Item>
          <Menu.Header content="Dashboard" />
          <Menu.Menu>
            <Menu.Item>
              <Link to="/jobs">Jobs</Link>
            </Menu.Item>
            <Menu.Item>
              <Link to="/clients">Clients</Link>
            </Menu.Item>
            <Menu.Item>
              <Link to="/vehicles">Vehicles</Link>
            </Menu.Item>
          </Menu.Menu>
        </Menu.Item>
        <Menu.Item>
          <Menu.Header content="Settings" />
          <Menu.Menu>
            <Menu.Item>
              <Link to="/settings/app">Application</Link>
            </Menu.Item>
          </Menu.Menu>
        </Menu.Item>
      </Menu>
    </Grid.Column>
  );
}

const activeJobs = [
  {
    id: '1',
    clientName: 'Human client',
    expiry: dayjs()
      .add(2, 'hour')
      .toISOString()
  },
  {
    id: '2',
    clientName: 'Another client',
    expiry: dayjs()
      .add(1, 'week')
      .toISOString()
  },
  {
    id: '3',
    clientName: 'Organization',
    expiry: dayjs()
      .add(3, 'day')
      .toISOString()
  }
];

function colorActiveJobCard(expiry) {
  const [match, n, unit] = expiry.match(/(\d+) ([a-z]+)/);
  if (unit.includes('hour') || n < 1 || !match) {
    return 'red';
  }
  if (n < 5) {
    return 'yellow';
  }
  return 'green';
}

function ActiveJobCard({ id, clientName, expiry }) {
  const expiresIn = dayjs(expiry).fromNow();
  return (
    <Card color={colorActiveJobCard(expiresIn)}>
      <Card.Content>
        <Card.Header content={clientName} />
        <Card.Meta content={`Expires ${expiresIn}`} />
      </Card.Content>
      <Card.Content extra>
        <Link to={`/jobs/${id}`}>
          <Button icon labelPosition="right">
            <Icon name="right arrow" />
            View
          </Button>
        </Link>
      </Card.Content>
    </Card>
  );
}

function Map({ array, children, transform = _ => _ }) {
  const child = React.Children.only(children);
  const mapped = array.map((props, idx) =>
    React.cloneElement(
      child,
      Object.assign(
        {
          key: props.id || idx
        },
        transform(props)
      )
    )
  );
  return React.createElement(React.Fragment, null, mapped);
}

function Summary() {
  return (
    <Container>
      <Header content="Active jobs" />
      <Card.Group>
        <Map array={activeJobs}>
          <ActiveJobCard />
        </Map>
      </Card.Group>
      <Header content="Vehicle status" />
    </Container>
  );
}

function JobsDashboard() {
  return (
    <React.Fragment>
      <Link to="/jobs/create">
        <Button content="Create new job" />
      </Link>
      <Table sortable celled fixed selectable>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Client name</Table.HeaderCell>
            <Table.HeaderCell>Total duration</Table.HeaderCell>
            <Table.HeaderCell>Vehicle license plate</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Human client</Table.Cell>
            <Table.Cell>3 days</Table.Cell>
            <Table.Cell>XXX 000X</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    </React.Fragment>
  );
}

function ClientRegistrationForm() {
  const firstName = useField({ defaultValue: '' });
  const lastName = useField({ defaultValue: '' });
  const id = useField({ defaultValue: '' });
  const email = useField({ defaultValue: '' });
  const phone = useField({ defaultValue: '' });
  const nationality = useField({ defaultValue: '' });
  const clientType = useField({ defaultValue: '' });
  const organizationName = useField({ defaultValue: '' });
  return (
    <Grid.Column style={{ padding: '1rem' }}>
      <Form>
        <Header content="Personal details" />
        <Form.Group widths="equal">
          <FormInput label="First name" type="text" {...firstName.props} />
          <FormInput label="Last name" type="text" {...lastName.props} />
          <FormInput label="ID/Passport number" type="text" {...id.props} />
        </Form.Group>
        <Form.Select
          label="Nationality"
          placeholder="Select nationality"
          options={require('./nationalities.json').map(nationality => ({
            key: nationality.toLowerCase(),
            value: nationality.toLowerCase(),
            text: nationality
          }))}
          width={5}
          onChange={e => nationality.props.onChange(e.currentTarget.innerText)}
          required={nationality.props.required}
        />
        <Header content="Contact details" />
        <Form.Group widths="equal">
          <FormInput label="Email address" type="email" {...email.props} />
          <FormInput label="Phone" type="text" {...phone.props} />
        </Form.Group>
        <Header content="Job details" />
        <Form.Group widths="equal">
          <Form.Select
            label="Client type"
            options={[
              { key: 'individual', value: 'individual', text: 'Individual' },
              {
                key: 'organization',
                value: 'organization',
                text: 'Organization'
              }
            ]}
            placeholder="Select client type"
            onChange={e => clientType.props.onChange(e.currentTarget.innerText)}
            required={clientType.props.required}
          />
          <FormInput
            label="Organization name"
            {...organizationName.props}
            disabled={clientType.value.toLowerCase() === 'individual'}
          />
        </Form.Group>
        <Button content="Next" type="button" />
      </Form>
    </Grid.Column>
  );
}

function VehicleRegistration() {
  return (
    <Grid.Column style={{ padding: '1rem' }}>
      <Form />
    </Grid.Column>
  );
}

function BillingForm() {
  return (
    <Grid.Column style={{ padding: '1rem' }}>
      <Form />
    </Grid.Column>
  );
}

function JobRegistrationForm() {
  return (
    <Step.Group>
      <Tab
        menu={{ tabular: false, attached: false }}
        panes={[
          {
            render: () => <ClientRegistrationForm />,
            menuItem: (
              <Step key="client">
                <Icon name="user" />
                <Step.Content>
                  <Step.Title>Client</Step.Title>
                  <Step.Description>Enter client details</Step.Description>
                </Step.Content>
              </Step>
            )
          },
          {
            render: () => <VehicleRegistration />,
            menuItem: (
              <Step key="vehicle">
                <Icon name="car" />
                <Step.Content>
                  <Step.Title>Vehicle</Step.Title>
                  <Step.Description>Enter vehicle details</Step.Description>
                </Step.Content>
              </Step>
            )
          },
          {
            render: () => <BillingForm />,
            menuItem: (
              <Step key="billing">
                <Icon name="credit card" />
                <Step.Content>
                  <Step.Title>Billing</Step.Title>
                  <Step.Description>Enter billing information</Step.Description>
                </Step.Content>
              </Step>
            )
          },
          {
            render: () => (
              <Grid.Column style={{ padding: '1rem' }}>confirm</Grid.Column>
            ),
            menuItem: (
              <Step key="confirm">
                <Icon name="info" />
                <Step.Content>
                  <Step.Title>Confirm details</Step.Title>
                </Step.Content>
              </Step>
            )
          }
        ]}
      />
    </Step.Group>
  );
}

function JobsPage() {
  return (
    <Router>
      <JobsDashboard default />
      <JobRegistrationForm path="create" />
    </Router>
  );
}

function Content() {
  return (
    <Grid.Column width={12}>
      <Router>
        <Summary default />
        <JobsPage path="jobs/*" />
      </Router>
    </Grid.Column>
  );
}

function Dashboard() {
  return (
    <Grid stackable padded>
      <Grid.Row verticalAlign="middle">
        <TopNavigation />
      </Grid.Row>
      <Grid.Row>
        <SideMenu />
        <Content />
      </Grid.Row>
    </Grid>
  );
}

function HomePage() {
  const { token } = AuthContainer.useContainer();
  if (token === null) {
    return <LandingPage />;
  }
  return <Dashboard />;
}

function App() {
  return (
    <ApolloProvider client={client}>
      <AuthContainer.Provider>
        <Router>
          <HomePage default />
          <LoginPage path="login" />
          <RegistrationPage path="registration" />
        </Router>
      </AuthContainer.Provider>
    </ApolloProvider>
  );
}

export default App;
