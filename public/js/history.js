window.onload = () => {
  let history = [];
  const historyMaxLength = 50;

  let isHistoryWrite = true;

  const updateHistory = () => {
    if (!isHistoryWrite) return;
    const { json } = getCurrentModel();

    history.unshift(json);
    history.length = historyMaxLength;
  };

  const undo = () => {
    const json = history[0];
    if (!json) return;

    isHistoryWrite = false;
    buildPetri(json);

    isHistoryWrite = true;
    history = history.slice(1);
  }

  $('#sandbox').on('DOMSubtreeModified', updateHistory);
  $('#top-svg').on('DOMSubtreeModified', updateHistory);
  $('#page-svg').on('DOMSubtreeModified', updateHistory);

  $(document).keydown(event => {
    if ((event.ctrlKey || event.metaKey) && event.keyCode === 90) undo();
  });
};
