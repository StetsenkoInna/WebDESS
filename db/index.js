const { PG_HOST, PG_USER, PG_PORT, PG_PASS, PG_DB } = process.env;

const PgClient = require('pg').Client;

const { getId, getRow, getAll, fillTemplate } = require('./tools');

const storage = require('./requests/storage');

const client = new PgClient({
  host: PG_HOST,
  user: PG_USER,
  port: PG_PORT,
  password: PG_PASS,
  database: PG_DB,
});
client.connect().catch(console.error);

const request = template => params => {
  const { sql, values } = fillTemplate(template, params);

  return client.query(sql, values).catch(error => {
    console.warn(sql, values);
    console.error(error);
  });
};

module.exports = {
  storage: {
    add: getId(request(storage['add'])),
    update: request(storage['update']),
    delete: request(storage['delete']),
    get: getRow(request(storage['get'])),
    getAll: getAll(request(storage['get-all'])),
  },
};
