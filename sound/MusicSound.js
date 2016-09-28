import BaseSound from './BaseSound'
import Signals from 'signals'
import _ from 'lodash'
import { CONFIG } from '../setup/config'
import Emitter from '../utils/DerivEmitter'
import TweenLite from 'gsap';

const NUM_SOUNDS = 2
export default class MusicSound {
  constructor() {
    this._sounds = [
      this._newAmbientSound(),
      this._newDominantSound()
    ]

    this._sound = new BaseSound({}, 'music')
    this._sound.endingSignal.add(this.onEnding.bind(this))
    this._sound.endedSignal.add(this.onEnded.bind(this))

    Emitter.on('volume:change', volumes => { this.scheduledVolume = volumes.music })
  }

  onMetronome() {
    _.each(this._sounds, sound => {
      sound.onMetronome()
    })
  }

  onBeat() {
    if (!this._sound.playing) {
      this.playAmbient()
    }
  }

  mapEntering() {

  }

  mapLeaving() {}

  mapUpdate() {

  }

  play(source) {
    this._dominantSound.newSound(source, 'music', {
      autoplay: true,
      volume: this._scheduledVolume
    }, true)
  }

  onEnding() {

  }

  onEnded() {
    Emitter.emit('ext:sound:music:ended')
  }

  //**************
  //GET SET
  //**************

  get playing() {
    if (this._id === 'speaking') {
      //console.log(this.activeSound.sound.soundname);
    }
    if (this.activeSound) {
      return this.activeSound.playing
    }
    return false
  }

  set volume(vol) {
    if (this.activeSound) {
      this.activeSound.volume = vol
    }
  }

  get volume() {
    if (this.activeSound) {
      return this.activeSound.volume || 0
    }
    return 0
  }

  get progress() {
    if (!this.activeSound) {
      return 0
    }
    let _s = this.activeSound.seek
    let _pos = (_s / this.activeSound.duration()) || 0
    return _pos
  }

  get duration() {
    return this.activeSound.duration() || 0
  }

  get seek() {
    return this.activeSound.seek
  }

  set seek(s) {
    this.activeSound.seek = s
  }

  get soundname() {
    if (this.activeSound) {
      return this.activeSound.soundname
    }
    return ''
  }

  get nearFactor() {
    return this.activeSound.nearFactor
  }

  get loaded() {
    return this.activeSound.loaded
  }

  get activeSound() {
    return this._sound
  }

  get sounds() {
    return this._sounds
  }

  set scheduledVolume(v) {
    this._scheduledVolume = v
  }

  get scheduledVolume() {
    return this._scheduledVolume || 0
  }

  get activeIndex() {
    return this._activeSoundIndex
  }

  _getNextSoundIndex() {
    return (this._activeSoundIndex + 1) % NUM_SOUNDS
  }

  _getSound(index) {
    return this._sounds[index]
  }


  //************
  //SOUND CONTROL
  //************

  stop() {
    this.activeSound.stop()
  }

  update() {
    if (this.activeSound) {
      this.activeSound.update()
    }
  }

  pause() {
    this._isPaused = true
    if (this.activeSound) {
      this.activeSound.pause()
    }
  }

  ramp(duration, options, final) {
    if (this.activeSound) {
      this.activeSound.ramp(duration, options, final)
    }
  }

  ///********************
  //HANDLERS
  ///********************

  _destroySound(sound) {
    if (!sound) {
      return
    }
    sound.destroy()
    sound = null
  }
}
