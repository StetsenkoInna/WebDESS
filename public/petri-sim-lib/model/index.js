import {
  addMoreSimilarObjects,
  buildPetri,
  clearProgrammingPopup,
  convertToFunction,
  generateFromFunction,
  getNetById,
  getCurrentModel,
  newArc,
  newObject,
  reset,
  runModelSimulation,
  saveCurrentModel,
  removeTemporaryArrow
} from './model.designer';
import {runSimulationForModel} from './model.simulation';

window.addMoreSimilarObjects = addMoreSimilarObjects;
window.buildPetri = buildPetri;
window.clearProgrammingPopup = clearProgrammingPopup;
window.convertToFunction = convertToFunction;
window.generateFromFunction = generateFromFunction;
window.getNetById = getNetById;
window.getCurrentModel = getCurrentModel;
window.newArc = newArc;
window.newObject = newObject;
window.reset = reset;
window.runModelSimulation = runModelSimulation;
window.saveCurrentModel = saveCurrentModel;
window.runSimulationForModel = runSimulationForModel;
window.removeTemporaryArrow = removeTemporaryArrow;

import '../net/objects';
