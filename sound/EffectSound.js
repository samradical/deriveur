import BaseSound from './BaseSound'
import Signals from 'signals'
import _ from 'lodash'
import { CONFIG } from '../setup/config'
import Emitter from '../utils/DerivEmitter'
import TweenLite from 'gsap';

const NUM_SOUNDS = 2
export default class EffectSound {
  constructor() {
    this._sounds = [
      this._newAmbientSound(),
      this._newDominantSound()
    ]

    Emitter.on('volume:change', volumes => { this.scheduledVolume = volumes.effects })
  }

  set dominantSources(s) {
    this._dominantSources = s
  }

  set ambientSources(s) {
    this._ambientSources = s
  }

  onMetronome() {
    _.each(this._sounds, sound => {
      sound.onMetronome()
    })
  }

  onBeat() {
    //this.playAmbient()
  }


  mapEntering() {

  }

  mapLeaving() {}

  mapUpdate() {

  }

  playAmbient() {
    return
    if (this._ambientSources) {
      if (this._ambientSources.length) {
        let _source = this._ambientSources.shift()
        this._ambientSound.newSound(
          _source,
          'ambient', {
            autoplay: true,
            loop: true
          },
          true
        )
      }
    }
  }

  rampUpAmbient() {
    Emitter.emit(`volumescheduler:effects:up`)
    Emitter.emit('ext:sound:ambient:playing')
    setTimeout(() => {
      this.onDominantEnded()
      Emitter.emit('ext:sound:ambient:ended')
    }, (CONFIG.minAmbientTime + Math.random() * CONFIG.maxAmbientTime) * 1000)
  }

  playDominant() {
    if (this._dominantSources.length) {
      Emitter.emit(`volumescheduler:effects:up`)
      let _source = this._dominantSources.shift()
      this._dominantSound.newSound(_source, 'dominant', {
        autoplay: true,
        autoPlay: true,
        volume: this.scheduledVolume
      }, true)
      this._dominantSound.play()
    } else {
      this.onDominantEnded()
    }
  }

  get ambientSound() {
    return this._ambientSound
  }

  get dominantSound() {
    return this._dominantSound
  }

  _newAmbientSound() {
    this._ambientSound = new BaseSound({}, 'effects')
    this._ambientSound.playingSignal.add(this.onAmbientPlaying.bind(this))
    this._ambientSound.endingSignal.add(this.onAmbientEnding.bind(this))
    this._ambientSound.endedSignal.add(this.onAmbientEnded.bind(this))
    return this._ambientSound
  }

  _newDominantSound() {
    this._dominantSound = new BaseSound({}, 'effects')
    this._dominantSound.playingSignal.add(this.onDominantPlaying.bind(this))
    this._dominantSound.endingSignal.add(this.onDominantEnding.bind(this))
    this._dominantSound.endedSignal.add(this.onDominantEnded.bind(this))
    return this._dominantSound
  }

  onAmbientEnding() {
    this._ambientSound.ramp(2, { volume: 0 })
  }

  onAmbientEnded() {}

  onDominantEnding() {
    //Emitter.emit('layer:effects:dominant:ending')
    //Emitter.emit(`volumescheduler:effects:down`)
  }

  onDominantEnded() {
    Emitter.emit('layer:effects:dominant:ended')
    Emitter.emit(`volumescheduler:effects:down`)
    Emitter.emit('ext:sound:dominant:ended')
  }

  onDominantPlaying() {
    Emitter.emit('ext:sound:dominant:playing')
  }

  onAmbientPlaying() {}

  //**************
  //GET SET
  //**************

  get playing() {
    if (this._id === 'speaking') {
      ////console.log(this.activeSound.sound.soundname);
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
    //it is -1 in  the bigginng
    let _i = (this._activeSoundIndex < 0) ? 0 : this._activeSoundIndex
    let _s = this._sounds[_i]
      //** so it fucked up
    if (!_s && this._sounds.length > 0) {
      let _next = this._getNextSoundIndex()
      let _newSound = this._sounds[_next]
      if (_newSound) {
        this._changeActiveSoundIndex()
        _s = _newSound
      }
    }
    return _s
  }

  get sounds() {
    return this._sounds
  }

  get noneActiveSound() {
    let _next = this._getNextSoundIndex()
    return this._sounds[_next]
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

  fadeAndDestroy(sound, vol = 0, dur = 2) {
    sound = sound || this.activeSound
    this._fadeAndDestroy(sound, vol, dur)
  }


  play(savedData, dur = 500) {
    if (this.activeSound) {
      if (!this.activeSound.playing) {
        let _vol = this._scheduledVolume
          //Emitter.emit('log:log', `Sound ${this._id} ${this.activeSound.soundname} playing: duration:${this._duration} volume: ${_vol}`);
        this.activeSound.fade(0, _vol, dur)
        this.activeSound.play()
        if (savedData) {
          this.activeSound.seek = savedData.progress
          if (CONFIG.partialPlay) {
            this.activeSound.playtime += savedData.progress
          }
          Emitter.emit('log:log:light', `seeking to ${savedData.progress}`, 2, 12);
        }
      }
    } else {
      Emitter.emit('log:error', `No activeSound on play ${this._id}`);
    }
  }

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
      this._saveTime = this.activeSound.seek
      this.activeSound.pause()
    }
  }

  resume() {
    if (this.activeSound) {
      this._saveTime = this._saveTime || 0
      this.activeSound.play(this._saveTime)
    }
  }

  destroy() {
    this._ambientSound.endedSignal.removeAll()
    this._ambientSound.playingSignal.removeAll()
    this._ambientSound.loadedSignal.removeAll()
    this._destroySound(this._ambientSound)

    this._dominantSound.endedSignal.removeAll()
    this._dominantSound.playingSignal.removeAll()
    this._dominantSound.loadedSignal.removeAll()
    this._destroySound(this._dominantSound)
  }

  ramp(duration, options, final) {
    if (this.activeSound) {
      this.activeSound.ramp(duration, options, final)
    }
  }

  ///********************
  //HANDLERS
  ///********************


  _onLoaded(index) {

  }

  _onPlay(index) {
    Emitter.emit('log:log', `Sound ${this._id} at ${index} ${this._sounds[index].soundname} Playing`);
    this.playingSignal.dispatch()
  }

  _onPause(index) {}

  _onEnded(index, soundName) {
    //pass this in the terminatedSignal
    this._sounds[index].hasFinished = true
    this.terminate()
  }

  _onTerminated(index, soundName) {
    this.terminate()
  }

  //*************************
  // PRIVATE
  //*************************

  /*
  !!!!!!!!!!!!
  cut speed?
  */
  _fadeAndDestroy(sound, toVolume = 0, dur = 2) {
    if (sound.markedToDestroy) {
      return
    }
    sound.markedToDestroy = true
      //make sure it ramps
    sound.ramp(dur, { volume: 0, end: true }, true)
  }

  /*CHANGEs THE ACTIVE SOUND*/
  _changeActiveSoundIndex() {
    this._activeSoundIndex++
      if (this._activeSoundIndex >= NUM_SOUNDS) {
        this._activeSoundIndex = 0
      }
  }

  terminate() {
    //kill
    /*
    No active sound?
    this.activeSound
    */
    if (!this.activeSound) {
      Emitter.emit('log:error', `terminate() no active Sound`);
      return
    }
    let _endObj = {
      soundName: this.activeSound.soundname,
      soundIndex: this.activeSound.soundIndex,
      hasFinished: !!this.activeSound.hasFinished,
      progress: (typeof this.seek === 'Howl') ? 0 : this.seek,
      duration: (typeof this.duration === 'Howl') ? 0 : this.duration
    }

    this.activeSound['markedToDestroy'] = true
    this.activeSound.terminatedSignal.remove(this._onTerminatedBound)
    this.activeSound.endedSignal.remove(this._onEndedBound)
    this.activeSound.playingSignal.remove(this._onPlayBound)
    this.activeSound.loadedSignal.remove(this._onLoadedBound)
    this._destroySound(this.activeSound)
    this._sounds[this._activeSoundIndex] = null
      //alert

    this.endedSignal.dispatch(_endObj)

    this._changeActiveSoundIndex()
    Emitter.emit('log:log:light', `----NEW ${this._id} ACTIVE SOUND at index ${this._activeSoundIndex}----`);
    //console.log(this.activeSound);
    //console.log(this._sounds);
    Emitter.emit('log:log:light', `------------------------`);
  }

  _destroySound(sound) {
    if (!sound) {
      return
    }
    sound.destroy()
    sound = null
  }
}
