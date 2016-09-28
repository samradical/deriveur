import {
  CONFIG,
} from '../setup/config'
import Emitter from '../utils/DerivEmitter'
import _ from 'lodash'

const OUT = 'out'
const IN = 'in'

/*
The base volumes before modulation
NEED TO MAKE SURE THE LEVELS ARE EVEN FOR FINAL VALUES
*/

const EFFECTS = {
  up: {
    effects: 1,
    music: 0.,
  },
  down: {
    effects: 0.1,
  },
  mute:{
    effects:0,
    music:0,
    speaking:0,
  }
}

const MUSIC = {
  up: {
    music: 0.8,
  },
  down: {
    music: 0.1,
  }
}

const SPEAKING = {
  up: {
    music: 0.,
    effects: 0.,
  },
  down: {
  }
}

const VOLUMES = { in : [{
    speaking: 1.,
    effects: 0.18,
    music: 0.1,
  }, {
    speaking: 1.,
    effects: 0.12,
    music: 0.1,
  }, {
    speaking: .9,
    effects: 0.2,
    music: 0.2,
  }, {
    speaking: .9,
    effects: 0.1,
    music: 0.2,
  }, {
    speaking: .9,
    effects: 0.2,
    music: 0.1,
  }, {
    speaking: 1,
    effects: 0.1,
    music: 0.2,
  }],
  out: [{
    speaking: 0.3,
    effects: 0.4,
    music: 0.7,
  }]
}

const BEATS_TILL_CHANGE = 32

const P = (() => {

  let _volumes
  let _enhancer
  let _beatChanger = BEATS_TILL_CHANGE
  let _beatCount = 0

  function _chooseRandom(vls) {
    let _i = Math.floor(Math.random() * vls.length)
    return vls[_i]
  }

  function _stateChanged(state) {
    _volumes = VOLUMES[state]
    _emitChange(_chooseRandom(_volumes))
  }

  function _emitChange(volume) {
    Emitter.emit('volume:change', _.assign({}, volume, _enhancer))
  }

  function setBeatChanger(beat) {
    _beatChanger = beat
  }

  function _init() {
    Emitter.on('metronome:quarter', () => {
      if (_beatCount % _beatChanger === 0) {
        _emitChange(_chooseRandom(_volumes))
      }
      _beatCount++
    })

    Emitter.on('volumescheduler:effects:up', () => {
      let _vol = _chooseRandom(_volumes)
      _enhancer = EFFECTS.up
      Emitter.emit('volume:change', _.assign({}, _vol, _enhancer))
    })
    Emitter.on('volumescheduler:effects:down', () => {
      let _vol = _chooseRandom(_volumes)
      _enhancer = {}
      Emitter.emit('volume:change', _.assign({}, _vol))
    })
    Emitter.on('volumescheduler:speaking:up', () => {
      let _vol = _chooseRandom(_volumes)
      _enhancer = SPEAKING.up
      Emitter.emit('volume:change', _.assign({}, _vol, _enhancer))
    })
    Emitter.on('volumescheduler:speaking:down', () => {
      let _vol = _chooseRandom(_volumes)
      _enhancer = {}
      Emitter.emit('volume:change', _.assign({}, _vol))
    })
    Emitter.on('volumescheduler:music:up', () => {
      let _vol = _chooseRandom(_volumes)
      _enhancer = MUSIC.up
      let _f = _.assign({}, _vol, _enhancer)
      console.log(_f);
      Emitter.emit('volume:change', _f)
    })
    Emitter.on('volumescheduler:music:down', () => {
      let _vol = _chooseRandom(_volumes)
      _enhancer = {}
      Emitter.emit('volume:change', _.assign({}, _vol))
    })
    Emitter.on('state:changed', _stateChanged)
    Emitter.on('volumescheduler:mute', ()=>{
      let _vol = _chooseRandom(_volumes)
      _enhancer = EFFECTS.mute
      Emitter.emit('volume:change', _.assign({}, _vol, _enhancer))
    })
    Emitter.on('volumescheduler:unmute', ()=>{
      let _vol = _chooseRandom(_volumes)
      _enhancer = {}
      Emitter.emit('volume:change', _.assign({}, _vol, _enhancer))
    })
  }

  if (CONFIG.useVolumeControl) {
    _init()
  }

  return { volumes: _volumes, setBeatChanger }

})()
export default P
