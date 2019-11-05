<h1 align="center">
   
<a href="https://docs.gissy.now.sh/">
<img src=".github/Banner.svg" alt="3dLogo" style="width: 50vw;">

</h1>

- [Docs](https://docs.gissy.now.sh/)
- [**Playground**](https://core.gissy.now.sh/graphql)

## Quick Start

### Install Dependencies

   ```sh
   yarn install
   ```

### Development

   ```sh
   yarn develop
   # Run for seeding the Neo4j DB
   yarn seed
   ```

### Deployment

   [![Deploy to now](https://deploy.now.sh/static/button.svg)](https://deploy.now.sh/?repo=https://github.com/social-gissy-network/core&env=NEO4J_USER&env=NEO4J_URI&env=NEO4J_PASSWORD)

   ```sh
   now secrets add neo4j_uri <YOUR_NEO4J_URI>
   now secrets add neo4j_user <YOUR_NEO4J_USER>
   now secrets add neo4j_password <YOUR_NEO4J_PASSWORD>
   now
   ```
