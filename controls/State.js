import {
  CONFIG,
} from '../setup/config'
import Emitter from '../utils/DerivEmitter'
import LOG from '../utils/Logger';
import BeatScheduler from './BeatScheduler'
import VolumeScheduler from './VolumeScheduler'
import Metronome from './Metronome';
import Tour from './Tour'
import geolib from 'geolib'

const OUT = 'out'
const IN = 'in'

function _latLngObj(pos) {
  return { latitude: pos.latitude, longitude: pos.longitude }
}

const P = (() => {

  class State {
    constructor() {
      this._nearFactor = 0
      Emitter.on('map:entering', (activePlace) => {
        if (this.Tour) {
          this.Tour.in(activePlace.id)
        }
        this.state = IN
        Emitter.emit('state:changed', this.state)
        Emitter.emit('log:log', `State: ${this.state}`);
      })

      Emitter.on('map:update:user', (coords) => {
        if (this.Tour) {
          let _bearing = geolib.getBearing(
            _latLngObj(coords), {
              latitude: this.Tour.nextLocation.latitude,
              longitude: this.Tour.nextLocation.longitude
            }
          )
          Emitter.emit('ext:map:bearing', _bearing)
        }
      })

      Emitter.on('map:locationsnotin', (locations) => {
        if (this.Tour) {
          this.Tour.locationsNear = locations
        }
      })

      Emitter.on('map:leaving', () => {
        if (this.Tour) {
          this.Tour.out()
        }
        this.state = OUT
        Emitter.emit('state:changed', this.state)
        Emitter.emit('log:log', `State: ${this.state}`);
      })

      Emitter.on('map:locations', (locations) => {})

      Emitter.on('controls:pause', () => {
        this._metronome.pause()
      })

      Emitter.on('controls:resume', () => {
        this._metronome.resume()
      })

      Emitter.on('controls:destroy', () => {
        this._metronome.stop()
      })

      this.state = OUT
      Emitter.emit('state:changed', OUT)
    }

    init(locations) {
      this._metronome = new Metronome([`${CONFIG.assetUrl}assets/audio/dummy.mp3`], {
        "tempo": 120,
        "beatsPerBar": 4,
        "loopLength": 4
      })

      this.Tour = new Tour(locations)

      Emitter.emit('state:init')
    }

    set nearFactor(f) {
      this._nearFactor = f
    }

    get nearFactor() {
      return this._nearFactor
    }
  }

  const S = new State()

  return S
    /*let _metronome,
      _store = {},
      _state

    // You cannot try to mix both:
    Object.defineProperty(_store, 'state', {
      get: () => {
        return _state
      },
      set: (newValue) => {
        _state = newValue
        console.log("****************");
        console.log(_state);
        console.log("****************");
      },
      enumerable: true,
      configurable: true
    });

    const getState = () => {
      return this._store.state
    }

    Emitter.on('map:entering', (activePlace) => {
      _store.state = IN
      Emitter.emit('state:changed', _store.state)
      if (!_metronome) {
        _metronome = new Metronome({
          "tempo": 120,
          "beatsPerBar": 4,
          "loopLength": 4
        })
        setTimeout(() => {
          Emitter.emit('state:init')
        }, 100)
      }
      Emitter.emit('log:log', `State: ${_store.state}`);
    })

    Emitter.on('map:leaving', () => {
      _store.state = OUT
      Emitter.emit('state:changed', _store.state)
      Emitter.emit('log:log', `State: ${_store.state}`);
    })
    console.log(getState);
    return { x: "x", getState: getState, OUT, IN, metro: _metronome, }*/

})()

export default P
