const getRows = result => (result.rows || []);
const getFirst = rows => (rows[0] || {});
const getField = (row, field) => (row[field] === undefined ? null : row[field]);

const getAll = requestFunc => async(params) => {
  const result = await requestFunc(params) || {};
  return getRows(result);
};
const getRow = requestFunc => async(params) => {
  const result = await requestFunc(params) || {};
  return getFirst(getRows(result));
};
const getId = requestFunc => async(params) => {
  const result = await requestFunc(params) || {};
  return getField(getFirst(getRows(result)), 'id');
};
const getValue = requestFunc => async(params) => {
  const result = await requestFunc(params) || {};
  return getField(getFirst(getRows(result)), 'value');
};

const getParams = params => {
  const values = [];
  const keyIndexes = Object.keys(params).reduce((obj, cur, i) => {
    obj[cur] = `$${i + 1}`;
    values.push(params[cur] === undefined ? null : params[cur]);
    return obj;
  }, {});

  return { keyIndexes, values };
};

const fillTemplate = (template, params = {}) => {
  const { keyIndexes, values } = getParams(params);
  const filter = /\$[\w.]+/g;

  const sql = template.replace(filter, (match) => {
    const key = match.slice(1);
    return keyIndexes[key] || null;
  });

  return { sql, values };
};

module.exports = {
  getAll,
  getRow,
  getId,
  getValue,
  fillTemplate,
};
