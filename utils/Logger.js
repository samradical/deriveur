const FONT_SIZE = '14';
const TITLE = '';
import Emitter from './DerivEmitter'

const COLORS = {
  green: { background: '#e7f2e6', color: '#8761E7' },
  lightBlue: { background: '#e7f2e6', color: '#8761E7' },
  blue: { background: '#3E6FA2', color: '#E6C5F3' },
  red: { background: '#864853', color: '#A4A560' },
  orange: { background: '#DFAC4C', color: '#4CDF98' }
}

const LOG = (() => {

  function _makeTabs(indet) {
    let _c = 0
    let _t = ''
    while (_c < indet) {
      _t += '\t'
      _c++
    }
    return _t
  }


  //**********
  //ERROR
  //**********
  function _onEmitterError(msg, indet = 0, size = FONT_SIZE ,color = 'red') {
    console.log(`%c ${_makeTabs(indet)} ${msg}`,
      `background: ${COLORS[color].background}; color: ${COLORS[color].color}; font-size: ${size}px`);
  }

  //**********
  //WARN
  //**********

  function _onEmitterWarn(msg, indet = 0, size = FONT_SIZE ,color = 'orange') {
    console.log(`%c ${_makeTabs(indet)} ${msg}`,
      `background: ${COLORS[color].background}; color: ${COLORS[color].color}; font-size: ${size}px`);
  }

  //**********
  //LOG
  //**********

  function _onEmitterLog(msg, indet = 0, size = FONT_SIZE ,color = 'blue') {
    console.log(`%c ${_makeTabs(indet)} ${msg}`,
      `background: ${COLORS[color].background}; color: ${COLORS[color].color}; font-size: ${size}px`);
  }

  //**********
  //SUCCESS
  //**********

  function _onEmitterSuccess(msg, indet = 0, size = FONT_SIZE ,color = 'green') {
    console.log(`%c ${_makeTabs(indet)} ${msg}`,
      `background: ${COLORS[color].background}; color: ${COLORS[color].color}; font-size: ${size}px`);
  }

  Emitter.on('log:error', _onEmitterError);
  Emitter.on('log:success', _onEmitterSuccess);
  Emitter.on('log:log', _onEmitterLog);
  Emitter.on('log:log:light', (msg, indet, size, color)=>{ _onEmitterLog(msg, indet, size, 'lightBlue')});
  Emitter.on('log:warn', _onEmitterWarn);

  function dispose() {
    Emitter.off('audio:error', _onEmitterError);
  }
  return {
    dispose,
  };

})()

export default LOG
