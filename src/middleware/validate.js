const Joi = require('@hapi/joi');

const { errorRes } = require('@utils/res-builder');

const templates = {
  type: Joi.string().max(20),
  title: Joi.string().max(50),
  json: Joi.object(),
};

const schemas = {
  type: Joi.object().keys({
    type: templates.type.required(),
  }),
  title: Joi.object().keys({
    type: templates.type.required(),
    title: templates.title.required(),
  }),
  createFile: Joi.object().keys({
    type: templates.type.required(),
    title: templates.title.required(),
    data: templates.json,
  }),
  updateFile: Joi.object().keys({
    type: templates.type.required(),
    title: templates.title.required(),
    data: templates.json,
  }),
};

const validate = (type, isBody = true) => (req, res, next) => {
  const schema = schemas[type];
  const data = isBody ? req.body : req.query;

  const { error } = schema.validate(data);

  if (error) {
    const data = JSON.stringify(error.details).replace(/"/gi, '\'');
    return errorRes(res, 422, 73444, data);
  }

  next();
};

module.exports = validate;
