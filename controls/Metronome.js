import Sono from '@stinkdigital/sono'
import Emitter from '../utils/DerivEmitter'
import Dilla from 'dilla';

export default class Metronome {
  constructor(src, options) {
    this.dilla = new Dilla(Sono.context, options);
    var dilla = this.dilla
    var high = {
      'position': '*.1.01',
      'freq': 440,
      'duration': 15
    };
    var low = { 'freq': 330, 'duration': 15 };

    dilla.set('metronome', [
      high, ['*.>1.01', low]
    ]);

    var _c = 0,
      _t = 0
    dilla.on('step', (step)=> {
      if (step.event !== 'start') {
        return
      }
      let _position = step.position.split('.')
      if (_c % options.beatsPerBar === 0) {
        if (!this._paused) {
          Emitter.emit('metronome:bar')
        }
        _c = 0
      }
      if (!this._paused) {
        Emitter.emit('metronome:quarter', _c, _t)
      }
      _c++
      _t++
    })
    dilla.start()
  }

  pause() {
    this._paused = true
  }

  resume() {
    this._paused = false
  }

  stop(){
    this.dilla.stop()
  }
}
