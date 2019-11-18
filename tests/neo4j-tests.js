const { DBManager } = require('../build/neo4j');
let db = new DBManager();
(async () => {
    let friends = await db.getPathsOfLengthN(1);
    console.log(friends);
})
().catch(error => {
      console.log(error); // todo log
    });