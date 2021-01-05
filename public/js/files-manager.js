function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

const filesManager = (() => {
  const cache = {
    Net: new Map(),
    Model: new Map(),
  };

  const processError = error => {
    const { code, message, data } = error.responseJSON;
    alert(`Error: ${code}: ${message || data}`);
  };

  const syncCache = async (type) => {
    const params = { type }
    const { data } = await axios.get('/storage/list', { params });

    for (const { title, date } of data.list) {
      const params = { title, type };
      const { data } = await axios.get('/storage/file', { params }).catch(processError);
      cache[type].set(title, { title, date, data: data.file.data })
    }
  };

  syncCache('Net');
  syncCache('Model');

  const loadList = type => Array.from(cache[type], ([_k, v]) => v);
  const loadFile = (title, type) => cache[type].get(title);

  const updateFile = (title, data, type) => {
    cache[type].set(title, { title, date: (new Date()).toISOString(), data });

    const body = { title, type, data };
    axios.post('/storage/update', body).catch(processError).then(() => {
      alert('The file is successfully update.');
    });
  };

  const createFile = (title, isUpdate, type, data = {}) => {
    cache[type].set(title, { title, date: (new Date()).toISOString(), data });

    const body = { title, type, data };
    axios.post('/storage/create', body).then(() => {
      alert('The file is successfully save.');
    }).catch(error => {
      const { code, message } = error.response.data;
      if (code === 73401 && isUpdate) return updateFile(title, data, type);
      else alert(`Error: ${code}: ${message}`);
    });
  };

  const deleteFile = (title, type) => {
    cache[type].delete(title);

    const body = { title, type };
    axios.post('/storage/delete', body).then(() => {
      alert('The file is successfully delete.');
    }, processError);
  };

  return {
    loadList,
    loadFile,
    createFile,
    deleteFile,
  }
})();
