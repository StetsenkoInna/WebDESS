import {
  buildPetri,
  cleanBuffers,
  clearProgrammingPopup,
  convertToFunction,
  generateFromFunction,
  getCurrentModel,
  newArc,
  newPlace,
  newTransition,
  requestStop,
  reset,
  runNetModelSimulation,
  saveCurrentPetriNet
} from './net.designer';
import {runSimulationForNet} from './net.simulation';

window.buildPetri = buildPetri;
window.cleanBuffers = cleanBuffers;
window.clearProgrammingPopup = clearProgrammingPopup;
window.convertToFunction = convertToFunction;
window.generateFromFunction = generateFromFunction;
window.getCurrentModel = getCurrentModel;
window.newArc = newArc;
window.newPlace = newPlace;
window.newTransition = newTransition;
window.requestStop = requestStop;
window.reset = reset;
window.runNetModelSimulation = runNetModelSimulation;
window.saveCurrentPetriNet = saveCurrentPetriNet;

window.runSimulationForNet = runSimulationForNet;
