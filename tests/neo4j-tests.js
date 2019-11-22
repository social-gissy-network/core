const { DBManager } = require('../build/neo4j');
let db = new DBManager();
(async () => {
    let friends = await db.getPathsOfLengthN(2, "119");
    console.log(friends);
})
().catch(error => {
      console.log(error); // todo log
    });