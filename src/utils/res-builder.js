const errors = new Map();

errors.set(73400, 'File does not exists.');
errors.set(73401, 'File already exists.');
errors.set(73500, 'Internal server error.');

const successRes = (res, data) => res.json(Object.assign({
  status: 'success',
}, data));
const errorRes = (res, status, code, data) => res.status(status).json({
  status: 'error',
  code,
  message: errors.get(code),
  data,
});

module.exports = {
  successRes,
  errorRes,
};
