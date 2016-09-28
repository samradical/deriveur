import Emitter from '../utils/DerivEmitter'

const OUT = 'out'
const IN = 'in'

/*
THE GAPS BETWEEN STARTING A NEW CLIP
*/
const BEATS = {
 in : [{
    speaking: 8,
    effects: 34,
    music: 36,
  }, {
    speaking: 8,
    effects: 16,
    music: 78,
  }, {
    speaking: 12,
    effects: 32,
    music: 42,
  }, {
    speaking: 4,
    effects: 32,
    music: 8,
  }, {
    speaking: 12,
    effects: 64,
    music: 125,
  }, {
    speaking: 12,
    effects: 42,
    music: 89,
  }],
  out: [{
    speaking: 64,
    effects: 512,
    music: 8,
  }]
}

const BEATS_TILL_CHANGE = 32

const P = (() => {

  let _beatChanger = BEATS_TILL_CHANGE
  let _beatCount = 0
  let _beats

  function _chooseRandom(beats) {
    let _i = Math.floor(Math.random() * beats.length)
    return beats[_i]
  }

  function _emitChange(beat) {
    Emitter.emit('beat:changed', beat)
  }

  function _stateChanged(state) {
    _beats = BEATS[state]
    _emitChange(_chooseRandom(_beats))
  }

  Emitter.on('state:changed', _stateChanged)

  Emitter.on('metronome:quarter', () => {
    if (_beatCount % _beatChanger === 0) {
      _emitChange(_chooseRandom(_beats))
    }
    _beatCount++
  })
})()

export default P
