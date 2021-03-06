import 'semantic-ui-css/semantic.min.css';
import React from 'react';
import { ApolloProvider, ApolloConsumer, Query, Mutation } from 'react-apollo';
import { setContext } from 'apollo-link-context';
import { ApolloClient, HttpLink, InMemoryCache, gql } from 'apollo-boost';
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
  Tab,
  Dimmer,
  Loader,
  Placeholder,
  Divider,
  Segment
} from 'semantic-ui-react';
import { useField, useForm } from 'react-jeff';
import { createContainer } from 'unstated-next';
import useSessionStorage from 'react-use/lib/useSessionStorage';
import { Router, Link, navigate, Redirect } from '@reach/router';
import emailValidator from 'email-validator';
import useWindowSize from 'react-use/lib/useWindowSize';
import { Helmet } from 'react-helmet'

if (process.env.NODE_ENV !== 'production') {
  console.log('[info]:', 'mounting `why-did-you-render`');
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  whyDidYouRender(React);
  ClientRegistrationForm.whyDidYouRender = true;
  Form.Input.whyDidYouRender = true;
  FormInput.whyDidYouRender = true;
}

dayjs.extend(relativeTime);

const httpLink = new HttpLink({
  uri: '/graphql'
});

const cache = new InMemoryCache();

const authLink = setContext((_, { headers }) => {
  const token = sessionStorage.getItem('token') || '';
  const modifiedHeaders = Object.assign({}, headers, {
    Authorization: token.replace(/"/g, '')
  });
  return Object.assign({}, { headers: modifiedHeaders });
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache
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

const MemoizedFormInput = React.memo(Form.Input);

function FormInput({
  label,
  icon,
  onChange,
  onBlur,
  onFocus,
  value,
  type,
  error,
  message,
  required,
  disabled,
  parseToInt
}) {
  const handleChange = e => {
    const { value } = e.currentTarget;
    let parsedValue = value;
    if (parseToInt && /^\d/.test(value)) {
      parsedValue = parseInt(value);
    }
    onChange(parsedValue);
  };
  return (
    <React.Fragment>
      {error && <small style={{ color: '#9f3a38' }}>{message}</small>}
      <MemoizedFormInput
        label={label}
        type={type}
        icon={icon}
        iconPosition={icon ? 'left' : null}
        onChange={handleChange}
        value={value}
        error={error}
        required={required}
        disabled={disabled}
        onBlur={onBlur}
        onFocus={onFocus}
      />
    </React.Fragment>
  );
}

function FormCheckbox({ label, onChange, value, ...props }) {
  const handleChange = () => onChange(!value);
  return (
    <Form.Checkbox
      label={label}
      onChange={handleChange}
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
      <Menu.Item
        content="Carzi"
        header
        link
        href="/"
        style={{ letterSpacing: 6, fontSize: 16 }}
      />
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
          <Menu.Header content="Home" />
          <Menu.Menu>
            <Menu.Item>
              <Link to="/">Dashboard</Link>
            </Menu.Item>
            <Menu.Item>
              <Link to="/notifications">Notifications</Link>
            </Menu.Item>
          </Menu.Menu>
        </Menu.Item>
        <Menu.Item>
          <Menu.Header content="Records" />
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
            <Menu.Item>
              <Link to="/settings/account">Account</Link>
            </Menu.Item>
          </Menu.Menu>
        </Menu.Item>
      </Menu>
    </Grid.Column>
  );
}

function MobileMenu() {
  return (
    <Menu icon="labeled" fluid widths={4} fixed="bottom">
      <Menu.Item name="home">
        <Dropdown pointing="top left" icon={<Icon name="home" size="big" />}>
          <Dropdown.Menu>
            <Dropdown.Item>
              <Link to="/">Dashboard</Link>
            </Dropdown.Item>
            <Dropdown.Item>
              <Link to="/notifications">Notifications</Link>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
        <p>Home</p>
      </Menu.Item>

      <Menu.Item name="records">
        <Dropdown
          pointing="top left"
          icon={<Icon name="address book" size="big" />}
        >
          <Dropdown.Menu>
            <Dropdown.Item>
              <Link to="/jobs">Jobs</Link>
            </Dropdown.Item>
            <Dropdown.Item>
              <Link to="/clients">Clients</Link>
            </Dropdown.Item>
            <Dropdown.Item>
              <Link to="/vehicles">Vehicles</Link>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
        <p>Records</p>
      </Menu.Item>

      <Menu.Item name="settings">
        <Dropdown
          pointing="top right"
          icon={<Icon name="settings" size="big" />}
        >
          <Dropdown.Menu>
            <Dropdown.Item>
              <Link to="/settings/app">Application</Link>
            </Dropdown.Item>
            <Dropdown.Item>
              <Link to="/settings/account">Account</Link>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
        <p>Settings</p>
      </Menu.Item>
      <Menu.Item name="log out">
        <Link to="/">
          <Icon name="log out" size="big" />
          <p>Log out</p>
        </Link>
      </Menu.Item>
    </Menu>
  );
}

function Notifications() {
  return (
    <Segment placeholder>
      <Header icon>
        <Icon name="bell slash" />
        No new notifications.
      </Header>
    </Segment>
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

function JobDetailsRow({ client, vehicles, startDate, endDate }) {
  return (
    <Table.Row>
      <Table.Cell>
        {client.firstName} {client.lastName}
      </Table.Cell>
      <Table.Cell>
        {dayjs(parseInt(endDate))
          .from(dayjs(parseInt(startDate)))
          .replace('in', '')
          .trim()}
      </Table.Cell>
      <Table.Cell>
        {vehicles.results.map(vehicle => vehicle.license).join(',')}
      </Table.Cell>
    </Table.Row>
  );
}

const QUERY_JOBS = gql`
  query Jobs {
    jobs {
      results {
        id
        client {
          firstName
          lastName
        }
        vehicles {
          results {
            license
          }
        }
        startDate
        endDate
      }
    }
  }
`;

function JobsDashboard() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [empty, setEmpty] = React.useState(false);
  return (
    <React.Fragment>
      <Link to="/jobs/create">
        <Button content="Create new job" />
      </Link>
      <Divider />
      <PageLoader active={loading} />
      <If condition={error}>
        <Message header="Error!" content="Unable to load jobs" error />
      </If>
      <Table sortable celled fixed selectable>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Client name</Table.HeaderCell>
            <Table.HeaderCell>Total duration</Table.HeaderCell>
            <Table.HeaderCell>Vehicle license plates</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Query query={QUERY_JOBS}>
            {({ data, loading, error }) => {
              setError(false);
              if (loading) {
                setLoading(true);
              }
              if (error) {
                setLoading(false);
                setError(true);
                return null;
              }
              if (
                data &&
                data.jobs &&
                data.jobs.results &&
                data.jobs.results.length > 0
              ) {
                setLoading(false);
                return (
                  <Map array={data.jobs.results}>
                    <JobDetailsRow />
                  </Map>
                );
              }
              setLoading(false);
              setEmpty(true);
              return null;
            }}
          </Query>
        </Table.Body>
      </Table>
      <If condition={empty}>
        <NoData />
      </If>
    </React.Fragment>
  );
}

function LoadingCard() {
  return (
    <Card>
      <Placeholder>
        <Placeholder.Image square />
      </Placeholder>
      <Card.Content>
        <Placeholder>
          <Placeholder.Header>
            <Placeholder.Line length="very short" />
            <Placeholder.Line length="medium" />
          </Placeholder.Header>
          <Placeholder.Paragraph>
            <Placeholder.Line length="short" />
          </Placeholder.Paragraph>
        </Placeholder>
      </Card.Content>
      <Card.Content extra>
        <Button disabled={true} primary>
          View
        </Button>
      </Card.Content>
    </Card>
  );
}

function capitalize(string) {
  return string.substring(0, 1).toUpperCase() + string.substring(1);
}

function randomValue(max = 255) {
  return Math.floor((Math.random() * 1000) % max);
}

function generateRandomRGB() {
  return `rgb(${randomValue()}, ${randomValue()}, ${randomValue()})`;
}

function ClientDetailsCard({ id, firstName, lastName, type }) {
  return (
    <Card>
      <svg
        width="100%"
        height="200"
        style={{ background: generateRandomRGB() }} //(15, 110, 145) => pastel
      >
        <text
          textAnchor="middle"
          x="50%"
          y="50%"
          dy="2rem"
          fill="white"
          fontSize="100"
        >
          {firstName.substring(0, 1)}
        </text>
      </svg>
      <Card.Content>
        <Card.Header>
          {firstName} {lastName}
        </Card.Header>
        <Card.Meta>{capitalize(type)}</Card.Meta>
      </Card.Content>
      <Card.Content extra>
        <Link to={`/clients/${id}`}>
          <Button primary>View</Button>
        </Link>
      </Card.Content>
    </Card>
  );
}

const QUERY_CLIENTS = gql`
  query Clients {
    clients {
      results {
        id
        firstName
        lastName
        type
      }
    }
  }
`;

function NoData() {
  return (
    <Segment placeholder>
      <Header icon>
        <Icon name="eye slash" />
        Looks like there is nothing to see here.
        <Header sub style={{ textTransform: 'none' }}>
          Get started by clicking on the button above to add some data.
        </Header>
      </Header>
    </Segment>
  );
}

function ClientsDashboard() {
  const [error, setError] = React.useState(false);
  const [empty, setEmpty] = React.useState(false);
  return (
    <React.Fragment>
      <Link to="/clients/create">
        <Button content="Create new client" />
      </Link>
      <Divider />
      {error && (
        <Message header="Error!" content="Unable to load clients" error />
      )}
      {empty && <NoData />}
      {}
      <Card.Group itemsPerRow={3} stackable>
        <Query query={QUERY_CLIENTS}>
          {({ data, loading, error }) => {
            setError(false);
            if (loading) {
              return (
                <Map array={Array.from({ length: 3 }, _ => ({}))}>
                  <LoadingCard />
                </Map>
              );
            }
            if (error) {
              setError(true);
              return null;
            }
            if (
              data &&
              data.clients &&
              data.clients.results &&
              data.clients.results.length > 0
            ) {
              return (
                <Map array={data.clients.results}>
                  <ClientDetailsCard />
                </Map>
              );
            }
            setEmpty(true);
            return null;
          }}
        </Query>
      </Card.Group>
    </React.Fragment>
  );
}

function VehicleDetailsCard({ id, make, model, license }) {
  return (
    <Card>
      <svg
        width="100%"
        height="200"
        style={{ background: generateRandomRGB() }} //(15, 110, 145) => pastel
      >
        <text
          textAnchor="middle"
          x="50%"
          y="50%"
          dy="2rem"
          fill="white"
          fontSize="100"
        >
          {model.substring(0, 1)}
        </text>
      </svg>
      <Card.Content>
        <Card.Header>{license}</Card.Header>
        <Card.Meta>
          {make} {model}
        </Card.Meta>
      </Card.Content>
      <Card.Content extra>
        <Link to={`/vehicles/${id}`}>
          <Button primary>View</Button>
        </Link>
      </Card.Content>
    </Card>
  );
}

const QUERY_VEHICLES = gql`
  query Vehicles {
    vehicles {
      results {
        id
        make
        model
        license
      }
    }
  }
`;

function PageLoader({ active }) {
  return (
    <Dimmer active={active} style={{ height: '100%' }} inverted>
      <Loader>Loading</Loader>
    </Dimmer>
  );
}

function VehiclesDashboard() {
  const [error, setError] = React.useState(false);
  const [empty, setEmpty] = React.useState(false);
  return (
    <React.Fragment>
      <Link to="/vehicles/create">
        <Button content="Add a new vehicle" />
      </Link>
      <Divider />
      <If condition={error}>
        <Message header="Error!" content="Unable to load vehicles" error />
      </If>
      <If condition={empty}>
        <NoData />
      </If>
      <Query query={QUERY_VEHICLES}>
        {({ data, loading, error }) => {
          setError(false);
          if (loading) {
            return (
              <Map array={Array.from({ length: 3 }, _ => ({}))}>
                <LoadingCard />
              </Map>
            );
          }
          if (error) {
            setError(true);
            return null;
          }
          if (
            data &&
            data.vehicles &&
            data.vehicles.results &&
            data.vehicles.results.length > 0
          ) {
            return (
              <Map array={data.vehicles.results}>
                <VehicleDetailsCard />
              </Map>
            );
          }
          setEmpty(true);
          return null;
        }}
      </Query>
    </React.Fragment>
  );
}

const MUTATION_ADD_CLIENT = gql`
  mutation AddClient($data: ClientInput!) {
    addClient(data: $data) {
      id
    }
  }
`;

function useCustomField(opts) {
  const field = useField(opts);
  const onChangeFn = field.props.onChange;
  const onChange = React.useCallback(onChangeFn, []);
  const props = Object.assign({}, field.props, { onChange });
  return Object.assign({}, field, { props });
}

const FormInputMemo = React.memo(FormInput);

function ClientFirstName({ firstNameRef }) {
  const field = useCustomField({ defaultValue: '' });
  firstNameRef.current = { name: 'firstName', field };
  return <FormInputMemo label="First name" type="text" {...field.props} />;
}

function ClientLastName({ lastNameRef }) {
  const field = useCustomField({ defaultValue: '' });
  lastNameRef.current = { name: 'lastName', field };
  return <FormInputMemo label="Last name" type="text" {...field.props} />;
}

function ClientIdentification({ idRef }) {
  const field = useCustomField({ defaultValue: '' });
  idRef.current = { name: 'identificationNumber', field };
  return (
    <FormInputMemo label="ID/Passport number" type="text" {...field.props} />
  );
}

function ClientNationality({ fieldsRef }) {
  const nationality = useField({ defaultValue: '' });
  const nationalityRef = React.useRef();
  nationalityRef.current = { name: 'nationality', field: nationality };
  fieldsRef.current = fieldsRef.current.concat([nationalityRef]);
  return (
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
  );
}

function ClientPersonalDetails({ fieldsRef }) {
  const firstNameRef = React.useRef();
  const lastNameRef = React.useRef();
  const idRef = React.useRef();
  fieldsRef.current = fieldsRef.current.concat([
    firstNameRef,
    lastNameRef,
    idRef
  ]);
  return (
    <React.Fragment>
      <Header content="Personal details" />
      <Form.Group widths="equal">
        <ClientFirstName firstNameRef={firstNameRef} />
        <ClientLastName lastNameRef={lastNameRef} />
        <ClientIdentification idRef={idRef} />
      </Form.Group>
    </React.Fragment>
  );
}

function ClientEmail({ emailRef }) {
  const field = useField({ defaultValue: '' });
  emailRef.current = { name: 'email', field };
  return <FormInputMemo label="Email address" type="email" {...field.props} />;
}

function ClientPhone({ phoneRef }) {
  const field = useField({ defaultValue: '' });
  phoneRef.current = { name: 'phone', field };
  return <FormInputMemo label="Phone" type="text" {...field.props} />;
}

function ClientContactDetails({ fieldsRef }) {
  const emailRef = React.useRef();
  const phoneRef = React.useRef();
  fieldsRef.current = fieldsRef.current.concat([emailRef, phoneRef]);
  return (
    <React.Fragment>
      <Header content="Contact details" />
      <Form.Group widths="equal">
        <ClientEmail emailRef={emailRef} />
        <ClientPhone phoneRef={phoneRef} />
      </Form.Group>
    </React.Fragment>
  );
}

const FormSelectMemo = React.memo(Form.Select);

function ClientJobDetails({ fieldsRef }) {
  const clientTypeRef = React.useRef();
  const clientType = useField({ defaultValue: '' });
  clientTypeRef.current = { name: 'type', field: clientType };
  fieldsRef.current = fieldsRef.current.concat([clientTypeRef]);
  const organizationName = useField({ defaultValue: '' });
  return (
    <React.Fragment>
      <Header content="Job details" />
      <Form.Group widths="equal">
        <FormSelectMemo
          label="Client type"
          options={[
            {
              key: 'individual',
              value: 'individual',
              text: 'Individual'
            },
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
        <FormInputMemo
          label="Organization name"
          {...organizationName.props}
          disabled={clientType.value.toLowerCase() === 'individual'}
        />
      </Form.Group>
    </React.Fragment>
  );
}

function ClientRegistrationForm({ children }) {
  const fieldsRef = React.useRef([]);
  fieldsRef.current = [];
  const clientRegistrationForm = useForm({
    fields: fieldsRef.current.map(ref => ref.current.field),
    onSubmit: () => {}
  });
  return (
    <Grid.Column style={{ padding: '1rem' }}>
      <Mutation mutation={MUTATION_ADD_CLIENT}>
        {(addClient, { loading, data }) => {
          if (data && data.addClient && data.addClient.id) {
            navigate('/clients');
          }
          return (
            <Form
              onSubmit={e => {
                e.preventDefault();
                clientRegistrationForm.props.onSubmit();
                addClient({
                  variables: {
                    data: fieldsRef.current.reduce((object, ref) => {
                      if (ref.current.name === 'type') {
                        object[
                          ref.current.name
                        ] = ref.current.field.value.toLowerCase();
                      } else {
                        object[ref.current.name] = ref.current.field.value;
                      }
                      return object;
                    }, {})
                  }
                });
              }}
              loading={loading}
            >
              <ClientPersonalDetails fieldsRef={fieldsRef} />
              <ClientNationality fieldsRef={fieldsRef} />
              <ClientContactDetails fieldsRef={fieldsRef} />
              <ClientJobDetails fieldsRef={fieldsRef} />
              {children || <Button content="Submit" type="submit" />}
            </Form>
          );
        }}
      </Mutation>
    </Grid.Column>
  );
}

function VehicleMake({ fieldsRef }) {
  const field = useCustomField({ defaultValue: '' });
  const ref = React.useRef();
  ref.current = { name: 'make', field };
  fieldsRef.current = fieldsRef.current.concat(ref);
  return <FormInput label="Make" onChange={field.props.onChange} />;
}

function VehicleModel({ fieldsRef }) {
  const field = useCustomField({ defaultValue: '' });
  const ref = React.useRef();
  ref.current = { name: 'model', field };
  fieldsRef.current = fieldsRef.current.concat(ref);
  return <FormInput label="Model" onChange={field.props.onChange} />;
}

function VehicleLicense({ fieldsRef }) {
  const field = useCustomField({ defaultValue: '' });
  const ref = React.useRef();
  ref.current = { name: 'license', field };
  fieldsRef.current = fieldsRef.current.concat(ref);
  return (
    <FormInput label="License plate number" onChange={field.props.onChange} />
  );
}

function VehicleFuel({ fieldsRef }) {
  const field = useCustomField({ defaultValue: 0 });
  const ref = React.useRef();
  ref.current = { name: 'fuelCapacityMax', field };
  fieldsRef.current = fieldsRef.current.concat(ref);
  return (
    <FormInput
      label="Maximum fuel capacity"
      type="number"
      onChange={field.props.onChange}
      parseToInt={true}
    />
  );
}

function VehiclePassengers({ fieldsRef }) {
  const field = useCustomField({ defaultValue: 0 });
  const ref = React.useRef();
  ref.current = { name: 'passengers', field };
  fieldsRef.current = fieldsRef.current.concat(ref);
  return (
    <FormInput
      label="Total passengers"
      type="number"
      onChange={field.props.onChange}
      parseToInt={true}
    />
  );
}

function VehiclePriceCurrencyCode({ fieldsRef }) {
  const field = useField({ defaultValue: '' });
  const ref = React.useRef();
  ref.current = { name: 'hirePricing.currencyCode', field };
  fieldsRef.current = fieldsRef.current.concat(ref);
  return (
    <Form.Select
      label="Currency code"
      placeholder="Select currency code"
      options={Object.keys(require('./Common-currency.json')).map(key => ({
        key,
        value: key,
        text: key
      }))}
      width={5}
      onChange={e => field.props.onChange(e.currentTarget.innerText)}
      required={field.props.required}
    />
  );
}

function VehiclePriceValue({ fieldsRef }) {
  const field = useCustomField({ defaultValue: 0 });
  const ref = React.useRef();
  ref.current = { name: 'hirePricing.value', field };
  fieldsRef.current = fieldsRef.current.concat(ref);
  return (
    <FormInput
      label="Hiring price"
      type="number"
      onChange={field.props.onChange}
      parseToInt={true}
    />
  );
}

const MUTATION_ADD_VEHICLE = gql`
  mutation AddVehicle($data: VehicleInput!) {
    addVehicle(data: $data) {
      id
    }
  }
`;

function VehicleRegistrationForm() {
  const fieldsRef = React.useRef([]);
  fieldsRef.current = [];
  const vehicleRegistrationForm = useForm({
    fields: fieldsRef.current.map(ref => ref.current.field),
    onSubmit: () => {}
  });
  return (
    <Mutation mutation={MUTATION_ADD_VEHICLE}>
      {(addVehicle, { loading, data, error }) => {
        if (data && data.addVehicle && data.addVehicle.id) {
          navigate('/vehicles');
        }
        return (
          <Grid.Column style={{ padding: '1rem' }}>
            <Form
              loading={loading}
              error={error}
              onSubmit={e => {
                e.preventDefault();
                vehicleRegistrationForm.props.onSubmit();
                addVehicle({
                  variables: {
                    data: fieldsRef.current.reduce((object, ref) => {
                      if (ref.current.name.includes('.')) {
                        const [parent, child] = ref.current.name.split('.');
                        object[parent] = Object.assign({}, object[parent], {
                          [child]: ref.current.field.value
                        });
                      } else {
                        object[ref.current.name] = ref.current.field.value;
                      }
                      return object;
                    }, {})
                  }
                });
              }}
            >
              <VehicleMake fieldsRef={fieldsRef} />
              <VehicleModel fieldsRef={fieldsRef} />
              <VehicleLicense fieldsRef={fieldsRef} />
              <VehicleFuel fieldsRef={fieldsRef} />
              <VehiclePassengers fieldsRef={fieldsRef} />
              <VehiclePriceCurrencyCode fieldsRef={fieldsRef} />
              <VehiclePriceValue fieldsRef={fieldsRef} />
              <Button type="submit" content="Submit" fluid />
            </Form>
          </Grid.Column>
        );
      }}
    </Mutation>
  );
}

function JobStartDate({ formRef }) {
  const field = useField({ defaultValue: '' });
  const ref = React.useRef();
  ref.current = { name: 'startDate', field };
  formRef.current = formRef.current.concat(ref);
  return (
    <FormInput
      icon="calendar alternate outline"
      iconPosition="left"
      label="Start Date"
      type="date"
      onChange={field.props.onChange}
      onBlur={field.props.onBlur}
      onFocus={field.props.onFocus}
      value={field.props.value}
    />
  );
}

function JobEndDate({ formRef }) {
  const field = useField({ defaultValue: '' });
  const ref = React.useRef();
  ref.current = { name: 'endDate', field };
  formRef.current = formRef.current.concat(ref);
  return (
    <FormInput
      iconPosition="left"
      icon="calendar alternate outline"
      label="End Date"
      type="date"
      onChange={field.props.onChange}
      onBlur={field.props.onBlur}
      onFocus={field.props.onFocus}
      value={field.props.value}
    />
  );
}

function BillingForm() {
  const formRef = React.useRef();
  formRef.current = [];
  return (
    <Grid.Column style={{ padding: '1rem' }}>
      <Form>
        <style>{`
        input[type="date"]::-webkit-clear-button { display: none; }
        input[type="date"]::-webkit-inner-spin-button { display: none; }
        `}</style>
        <Form.Group widths="equal">
          <JobStartDate formRef={formRef} />
          <JobEndDate formRef={formRef} />
        </Form.Group>
      </Form>
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
            render: () => (
              <ClientRegistrationForm>
                <Button content="Next" type="button" />
              </ClientRegistrationForm>
            ),
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
            render: () => <VehicleRegistrationForm />,
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

const QUERY_SINGLE_CLIENT = gql`
  query SingleClient($id: ID!) {
    node(id: $id, typename: "Client") {
      ... on Client {
        id
        firstName
        lastName
        type
      }
    }
  }
`;

function SingleClientPage({ id }) {
  return (
    <Query query={QUERY_SINGLE_CLIENT} variables={{ id }}>
      {({ data, loading, error }) => {
        if (loading) {
          return <PageLoader active={loading} />;
        }
        if (error) {
          return (
            <Message
              header="Error!"
              content="Unable to load client profile"
              error
            />
          );
        }
        if (data && data.node) {
          const { firstName, lastName } = data.node;
          return (
            <React.Fragment>
              <Header content={`${firstName} ${lastName}`} size="huge" />
              <Divider />
            </React.Fragment>
          );
        }
      }}
    </Query>
  );
}

function ClientsPage() {
  return (
    <Router>
      <ClientsDashboard default />
      <ClientRegistrationForm path="create" />
      <SingleClientPage path=":id" />
    </Router>
  );
}

const QUERY_SINGLE_VEHICLE = gql`
  query SingleVehicle($id: ID!) {
    node(id: $id, typename: "Vehicle") {
      ... on Vehicle {
        id
        make
        model
        license
      }
    }
  }
`;

function SingleVehiclePage({ id }) {
  return (
    <Query query={QUERY_SINGLE_VEHICLE} variables={{ id }}>
      {({ data, loading, error }) => {
        if (loading) {
          return <PageLoader active={loading} />;
        }
        if (error) {
          return (
            <Message
              header="Error!"
              content="Unable to load client profile"
              error
            />
          );
        }
        if (data && data.node) {
          const { license } = data.node;
          return (
            <React.Fragment>
              <Header content={`${license}`} size="huge" />
              <Divider />
            </React.Fragment>
          );
        }
      }}
    </Query>
  );
}

function VehiclesPage() {
  return (
    <Router>
      <VehiclesDashboard default />
      <VehicleRegistrationForm path="create" />
      <SingleVehiclePage path=":id" />
    </Router>
  );
}

function Content() {
  return (
    <Grid.Column width={12}>
      <Router>
        <Summary default />
        <JobsPage path="jobs/*" />
        <ClientsPage path="clients/*" />
        <VehiclesPage path="vehicles/*" />
        <Notifications path="notifications" />
      </Router>
    </Grid.Column>
  );
}

function If({ condition, children }) {
  return condition ? children : null;
}

function Else({ condition, children }) {
  return !condition ? children : null;
}

function useMobile() {
  const { width } = useWindowSize();
  const [isMobile, setMobile] = React.useState(false);
  React.useEffect(() => {
    if (width < 720) {
      setMobile(true);
    } else {
      setMobile(false);
    }
  }, [width, setMobile]);
  return { isMobile };
}

function Dashboard() {
  const { isMobile } = useMobile();
  return (
    <Grid stackable padded>
      <Grid.Row verticalAlign="middle">
        <TopNavigation />
      </Grid.Row>
      <Grid.Row>
        <If condition={isMobile}>
          <MobileMenu />
        </If>
        <Else condition={isMobile}>
          <SideMenu />
        </Else>
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
    <React.Fragment>
    <Helmet><title>Carzi - Manage your car business from anywhere</title></Helmet>
    <ApolloProvider client={client}>
      <AuthContainer.Provider>
        <Router>
          <HomePage default />
          <LoginPage path="login" />
          <RegistrationPage path="registration" />
        </Router>
      </AuthContainer.Provider>
    </ApolloProvider>
    </React.Fragment>
  );
}

export default App;
