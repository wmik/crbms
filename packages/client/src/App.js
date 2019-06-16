import 'semantic-ui-css/semantic.min.css';
import React from 'react';
import { ApolloProvider, ApolloConsumer } from 'react-apollo';
import gql from 'graphql-tag';
import ApolloClient from 'apollo-boost';
import {
  Grid,
  Form,
  Header,
  Button,
  Message,
  Menu,
  Dropdown
} from 'semantic-ui-react';
import { useField, useForm } from 'react-jeff';
import { createContainer } from 'unstated-next';
import useSessionStorage from 'react-use/lib/useSessionStorage';
import { Router, Link, navigate, Redirect } from '@reach/router';

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

function FormInput({ label, icon, onChange, value, type, ...props }) {
  return (
    <Form.Input
      label={label}
      type={type}
      icon={icon}
      iconPosition="left"
      onChange={e => onChange(e.currentTarget.value)}
      value={value}
      {...props}
    />
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
    onSubmit: async () => {
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
  });
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
            <Link to="/register">
              <Button content="Register" size="small" />
            </Link>
          </Menu.Item>
        </Menu>
      </Grid.Row>
    </Grid>
  );
}

function Dashboard() {
  const { setToken } = AuthContainer.useContainer();
  return (
    <Grid stackable padded>
      <Grid.Row verticalAlign="middle">
        <Menu fluid>
          <Menu.Item content="Dashboard" header />
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
        </Router>
      </AuthContainer.Provider>
    </ApolloProvider>
  );
}

export default App;
