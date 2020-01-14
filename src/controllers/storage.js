const fs = require('fs');

const db = require('@db');
const { successRes, errorRes } = require('@utils/res-builder');

const randomIndex = () => (Math.random() * 1e18).toString(16);

const getList = async(req, res) => {
  const { type } = req.query;
  const list = await db.storage.getAll({ type });
  successRes(res, { list });
};

const loadFile = async(req, res) => {
  const { type, title } = req.query;
  const { path, date } = await db.storage.get({ type, title });
  if (!path) return errorRes(res, 422, 73400);

  fs.readFile(path, 'UTF8', (error, file) => {
    if (error) { console.error(error); errorRes(res, 500, 73500); }
    const data = JSON.parse(file);
    successRes(res, { file: { data, date } });
  });
};

const createFile = async(req, res) => {
  const { type, title } = req.body;
  const data = req.body.data || {};
  const path = `src/files/${randomIndex()}.json`;

  const id = await db.storage.add({ title, path, type });
  if (!id) return errorRes(res, 422, 73401);

  fs.writeFile(path, JSON.stringify(data), error => {
    if (error) { console.error(error); errorRes(res, 500, 73500); }
    successRes(res);
  });
};

const updateFile = async(req, res) => {
  const { type, title, data } = req.body;

  const { path } = await db.storage.get({ type, title });
  if (!path) return errorRes(res, 422, 73400);

  fs.writeFile(path, JSON.stringify(data), async(error) => {
    if (error) { console.error(error); errorRes(res, 500, 73500); }
    await db.storage.update({ title });
    successRes(res);
  });
};

const deleteFile = async(req, res) => {
  const { type, title } = req.body;

  const { path } = await db.storage.get({ type, title });
  if (!path) return errorRes(res, 422, 73400);

  const newPath = path.replace(/([0-9a-f])+[.json]\w+/g, e => `~${e}`);
  fs.rename(path, newPath, async(error) => {
    if (error) { console.error(error); errorRes(res, 500, 73500); }
    await db.storage.delete({ type, title });
    successRes(res);
  });
};

module.exports = {
  getList,
  loadFile,
  createFile,
  updateFile,
  deleteFile,
};
