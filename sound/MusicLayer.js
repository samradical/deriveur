import BaseLayer from './BaseLayer'
import _ from 'lodash'
import Utils from '../utils/UTILS'
import State from '../controls/State'
import Emitter from '../utils/DerivEmitter'
import { PERSONAL_RADIUS } from '../setup/config' //meters
import { CONFIG } from '../setup/config'

export default class MusicLayer extends BaseLayer {
  constructor(data) {
    super(data)
    Emitter.on('layer:music:rampup', this._rampUpMusic.bind(this))
    Emitter.on('volume:music:ramp', (obj) => { this.ramp(0.2, obj) })
    Emitter.on('volume:music:ramp:up', () => { this.ramp(0.2, { volume: this.scheduledVolume }) })
  }

  onMetronome() {
    console.log(this._sound.playing, this._sound.soundLoading);
    if (!this._sound.playing &&
      !this._sound.soundLoading &&
      (this._beatCounter % this._beat) === 0) {
      this._fadeOutAndLoadPlayNext()
    }
    super.onMetronome()
  }

  mapEntering(location) {
    this._buildPlaylist([location])
    this._fadeOutAndLoadPlayNext()
    this._state = State.state
  }

  _rampUpMusic() {
    let _mod = CONFIG.maxMusicTime * (State.nearFactor)
    let _min = CONFIG.minMusicTime + _mod
    let _max = CONFIG.maxMusicTime + _mod

    Emitter.emit(`volumescheduler:music:up`)
    let _time = (_min + Math.random() * _max) * 1000
    setTimeout(() => {
      Emitter.emit(`volumescheduler:music:down`)
      let _r = Math.random() + State.nearFactor / 2
      if (_r > 0.5) {
        Emitter.emit('layer:effects:playdominent')
      } else {
        Emitter.emit(`layer:speaking:play`)
      }
    }, _time)
  }

  mapLeaving(shuffle = true) {
    /*this._stateOut = true
    let _transitionSources = this._getTransitionSourceUrls()
    if (shuffle) {
      Utils.shuffle(_transitionSources)
    }

    this.ramp(CONFIG.transitionRampDur, { volume: 0, end: true }, true)*/
    //this.ramp(CONFIG.transitionRampDur, { volume: 0, end: true }, true)
    this._buildOutPlaylist()
    /*if(this._sound.playing){
      this.ramp(1, {volume:0, end:true}, true)
    }else{
    }*/
    this._fadeOutAndLoadPlayNext(null)
    this._state = State.state
  }

  _fadeOutAndLoadPlayNext(sources, options = {}) {
    this._loadNext(_.merge({ noPartialPlay: true, autoplay: true, volume:this.scheduledVolume }, options), sources, true)
  }

  onEnded(endObj) {
    //this._loadNext({ autoplay: true, noPartialPlay: true }, null, true)
  }

  onPlaying() {
  }

  set volume(vol) {
    this._sound.volume = vol
  }

}
