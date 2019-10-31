const ApolloClient = require('apollo-client');
const gql = require('graphql-tag');
const dotenv = require('dotenv');
const seedmutations = require('./seed-mutations');
const fetch = require('node-fetch');
const HttpLink = require('apollo-link-http').HttpLink;
const InMemoryCache = require('apollo-cache-inmemory').InMemoryCache;

dotenv.config();

const client = new ApolloClient({
  link: new HttpLink({ uri: process.env.GRAPHQL_URI, fetch }),
  cache: new InMemoryCache(),
});

client
  .mutate({
    mutation: gql(seedmutations),
  })
  // eslint-disable-next-line
  .then(data => console.log(data))
  .catch(error => console.error(error));
