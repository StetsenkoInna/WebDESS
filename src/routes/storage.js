const express = require('express');
const router = new express.Router();

const controller = require('@controllers/storage');
const validate = require('@middleware/validate');

router.route('/list')
  .get(validate('type', false), controller.getList);

router.route('/file')
  .get(validate('title', false), controller.loadFile);

router.route('/create')
  .post(validate('createFile'), controller.createFile);

router.route('/update')
  .post(validate('updateFile'), controller.updateFile);

router.route('/delete')
  .post(validate('title'), controller.deleteFile);

module.exports = router;
