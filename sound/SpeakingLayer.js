import AssetLoader from '../utils/AssetLoader'
import Utils from '../utils/UTILS'
import State from '../controls/State'
import Emitter from '../utils/DerivEmitter'
import Sound from './BaseSound'
import _ from 'lodash'
import { PERSONAL_RADIUS } from '../setup/config' //meters
import { CONFIG, RAMP_DOWN_DUR } from '../setup/config'
import BaseLayer from './BaseLayer'

export default class SpeakingLayer extends BaseLayer {
  constructor(data) {
    super(data)

    //Emitter.on('layer:effects:dominant:ending', this._onEffectsDominantEnding.bind(this))
    Emitter.on('layer:speaking:play', this._onPlayCommand.bind(this))
    Emitter.on('layer:effects:dominant:ended', this._onEffectsDominantEnded.bind(this))
  }

  onMetronome() {
    if (!this._sound.playing &&
      !this._playingInterlude &&
      (this._beatCounter % this._beat) === 0) {
      this.play()
    }
    /*    if (!this._sound.playing && this._playlist.length) {
          let _roll = Math.random()
          if (this._closestLocation) {
            let _f = this._closestLocation.nearFactor || 0
            _f += (this._effectInterlude || 0)
            if (_roll > _f) {
              Emitter.emit('log:log', `Layer ${this._id} Playing:  Had to get ${_f}, got ${_roll}`, 2);
              this.play()
            } else {
              Emitter.emit('log:log', `${this._id} Failed on roll. Had to get ${_f}, got ${_roll}`, 2);
            }
          }
        } else if (!this._playlist.length) {
          Emitter.emit('log:error', `No playlist on ${this._id}`);
        }
    */
    super.onMetronome()
  }

  mapEntering(location) {
    //console.log("Speaking mapEntering");
    if (this._sound.playing) {
      this.ramp(CONFIG.baseSoundFadeOut, { volume: 0, end: true }, true)
      setTimeout(() => {
        this._loadNext({ autoplay: true })
      }, (CONFIG.baseSoundFadeOut + 0.1) * 1000)
    } else {
      this._loadNext({ autoplay: true })
    }
  }

  mapLeaving(shuffle = true) {
    this.ramp(CONFIG.baseSoundFadeOut, { volume: 0, end: true }, true)
    this._loadNext()
  }

  onPlaying() {
    let _r = Math.random()
    if (_r > (1 - CONFIG.chanceForSoloSpeaking)) {
      Emitter.emit('volumescheduler:speaking:up')
      Emitter.emit('ext:sound:speaking:playing')
      Emitter.emit('volume:music:ramp', { volume: 0 })
    }
  }

  onEnding() {
    /*Emitter.on('layer:speaking:ended', this._onSpeakingEnded.bind(this))
    Emitter.on('layer:speaking:ending', this._onSpeakingEnding.bind(this))*/
    //Emitter.emit('layer:speaking:ending', Math.random())
    /*let _r =  Math.random()
    if(_r < 0.5){
      Emitter.emit('layer:effects:playdominent')
    }else{
      Emitter.emit('layer:music:rampup')
    }*/
    //this._playingInterlude = true
  }

  onEnded(endObj) {
    super.onEnded(endObj)
    this._loadNext()
      //Emitter.emit('layer:speaking:ended', Math.random())

    let _r = Math.random() + State.nearFactor / 2
    if (_r > (1 - CONFIG.chanceToPlayDominant)) {
      this._playingInterlude = true
      Emitter.emit('layer:effects:playdominent')
    } else {
      Emitter.emit('layer:music:rampup')
      this._playingInterlude = false
    }

    Emitter.emit('ext:sound:speaking:ended')
    Emitter.emit('volumescheduler:speaking:down')
    Emitter.emit('volume:music:ramp:up')
    setTimeout(() => {
      //Emitter.emit('layer:effects:dominant:ended')
    }, 3000)
  }

  _buildOutPlaylist(){
    this._playlist.length = 0
  }

  play() {
    super.play()
    Emitter.emit(`volumescheduler:music:down`)
  }

  _onPlayCommand() {
    this._playingInterlude = false
    this.play()
  }

  _onEffectsDominantEnding() {
    this._playingInterlude = false
    Emitter.emit(`volumescheduler:effects:down`)
      //this.play(Math.random() * CONFIG.maxSoundFadeInTime)
  }

  _onEffectsDominantEnded() {
    this._playingInterlude = false
    Emitter.emit(`volumescheduler:effects:down`)
    if (!this.sound.playing) {
      //this.play(Math.random() * CONFIG.maxSoundFadeInTime)
    }
  }
}
