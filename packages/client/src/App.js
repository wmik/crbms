import 'semantic-ui-css/semantic.min.css';
import React from 'react';
import { ApolloProvider, Query } from 'react-apollo';
import gql from 'graphql-tag';
import ApolloClient from 'apollo-boost';
import { Grid, Form, Header, Button, Message } from 'semantic-ui-react';
import { useField, useForm } from 'react-jeff';
import { createContainer } from 'unstated-next';
import useSessionStorage from 'react-use/lib/useSessionStorage';

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

function LoginForm() {
  const { setToken } = AuthContainer.useContainer();
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
  return (
    <Grid.Column width={4}>
      <Header content="Login" size="large" />
      <Query
        query={QUERY_LOGIN}
        skip={!form.submitting}
        variables={{ email: email.value, password: password.value }}
        onCompleted={data => {
          if (data.errors) {
            setError(true);
            return;
          }
          setToken(data.login.token);
        }}
        onError={() => setError(true)}
      >
        {({ loading }) => {
          return (
            <Form
              onSubmit={() => {
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
          );
        }}
      </Query>
    </Grid.Column>
  );
}

function LoginPage() {
  return (
    <Grid.Row centered>
      <LoginForm />;
    </Grid.Row>
  );
}

function useAuth() {
  const [token, setToken] = useSessionStorage('token', null);
  return { token, setToken };
}

const AuthContainer = createContainer(useAuth);

function App() {
  return (
    <ApolloProvider client={client}>
      <Grid stackable>
        <AuthContainer.Provider>
          <LoginPage />
        </AuthContainer.Provider>
      </Grid>
    </ApolloProvider>
  );
}

export default App;
