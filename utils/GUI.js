import dat from 'dat-gui';
import Emitter from './Emitter'
import State from '../controls/State'

const GUI = (() => {
  let O = {
    nearFactor: .99,
    speakingVolume: .99,
    musicVolume: 0.3,
    effectsVolume: 0.01,
    playNextMusic: () => {
      Emitter.emit('gui:playnext', 'music')
    },
    playNextSpeaking: () => {
      Emitter.emit('gui:playnext', 'speaking')
    },
    playNextEffect: () => {
      Emitter.emit('gui:playnext', 'effect')
    },
    nextLocation: () => {
      Emitter.emit('gui:nextlocation')
    },
    updatePosOutsideBarbi: () => {
      Emitter.emit('gui:outside:barbi')
    },
    updateMap: () => {
      Emitter.emit('gui:map:update')
    },
    getState: () => {
      Emitter.emit('log:log', `State ${State.state}`);
    },
    getSpeakingInfo: () => {
      Emitter.emit('gui:info:speaking', 'speaking')
    },
    getMusicInfo: () => {
      Emitter.emit('gui:info:music', 'music')
    },
    getEffectsInfo: () => {
      Emitter.emit('gui:info:effects', 'effects')
    },

    terminateSpeaking: () => {
      Emitter.emit('gui:terminate:speaking', 'speaking')
    },
    seekSpeaking: () => {
      Emitter.emit('gui:seek:speaking', 'speaking')
    }
  }

  function _logInfo(type, info) {
    Emitter.emit('log:log', `${type} info ___________`);
    let str = info.join('\n')
    console.log(str);
    Emitter.emit('log:log', `___________`);
  }

  Emitter.on('gui:info:speaking:result', (info) => {
    _logInfo('Speaking', info)
  })

  Emitter.on('gui:info:music:result', (info) => {
    _logInfo('Music', info)
  })

  Emitter.on('gui:info:effects:result', (info) => {
    _logInfo('Effects', info)
  })

  let GUI = new dat.GUI()
  GUI.add(O, 'nearFactor', 0.01, 1).onChange(val => { State.nearFactor = val })
  //GUI.add(O, 'nearfactor', 0.01, 1).onChange(val => { Emitter.emit('gui:nearfactor', val) })

  /*GUI.add(O, 'speakingVolume', 0.01, 1).onChange(val => { Emitter.emit('gui:volume:speaking', 'speaking', val) })
  GUI.add(O, 'musicVolume', 0.01, 1).onChange(val => { Emitter.emit('gui:volume:music', 'music', val) })
  GUI.add(O, 'effectsVolume', 0.01, 1).onChange(val => { Emitter.emit('gui:volume:effects', 'effects', val) })
  GUI.add(O, 'updateMap')
  GUI.add(O, 'updatePosOutsideBarbi')
  GUI.add(O, 'nextLocation')
  GUI.add(O, 'terminateSpeaking')
  GUI.add(O, 'seekSpeaking')
  GUI.add(O, 'getState')
  GUI.add(O, 'getSpeakingInfo')
  GUI.add(O, 'getMusicInfo')
  GUI.add(O, 'getEffectsInfo')*/
    /*GUI.add(O, 'playNextSpeaking')
    GUI.add(O, 'playNextMusic')
    GUI.add(O, 'playNextEffect')*/

  GUI.close()

})()
export default GUI
