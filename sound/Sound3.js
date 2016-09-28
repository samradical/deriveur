import BaseSound from './BaseSound'
import Signals from 'signals'
import _ from 'lodash'
import { CONFIG } from '../setup/config'
import Emitter from '../utils/DerivEmitter'
import TweenLite from 'gsap';

const NUM_SOUNDS = 2
export default class Sound extends BaseSound{
  constructor(options = {}, id = '') {
    this._options = options
    this._id = id
    this.endingSignal = new Signals()
    this.endedSignal = new Signals()
    this.terminatedSignal = new Signals()
    this.playingSignal = new Signals()
    this.loadedSignal = new Signals()
    this._onTerminatedBound = this._onTerminated.bind(this)
    this._onLoadedBound = this._onLoaded.bind(this)
    this._onEndedBound = this._onEnded.bind(this)
    this._onPauseBound = this._onPause.bind(this)
    this._onPlayBound = this._onPlay.bind(this)

    this._sounds = []
      //on a newSound we will increase
    this._activeSoundIndex = -1
  }

  loadSound(playlistObject, name = '', soundOptions = {}) {
    //this.destroy()
    Emitter.emit('log:log', `New ${this._id} sound ${name} loadSound()`, 0, 15);

    if (this.activeSound) {
      /* console.log(this.activeSound);
       console.log(soundOptions);
       if (soundOptions.autoplay) {
         this._fadeAndDestroy(this.activeSound)
         setTimeout(() => {
           this.loadSound(playlistObject, name, soundOptions)
         }, 2100)
       }
       return*/
    }

    let _nextSoundIndex = this._getNextSoundIndex()
      //make
    if (this._sounds[_nextSoundIndex]) {
      Emitter.emit('log:Error', `Sound ${this._id} trying to make a new sound when one already exists`, 2);
      return
    }

    let _o = _.merge({
        name: name,
        autoplay: false,
        loop: false
      },
      playlistObject,
      this._options.howler,
      soundOptions
    )
    this._sounds[_nextSoundIndex] = new HowlerSound(_o, _nextSoundIndex, this._id)
    this._sounds[_nextSoundIndex].terminatedSignal.addOnce(this._onTerminatedBound)
    this._sounds[_nextSoundIndex].endedSignal.addOnce(this._onEndedBound)
    this._sounds[_nextSoundIndex].playingSignal.addOnce(this._onPlayBound)
    this._sounds[_nextSoundIndex].loadedSignal.addOnce(this._onLoadedBound)
      //init
    if (this._activeSoundIndex < 0) {
      this._activeSoundIndex = 0
    }
    if (this._id === 'speaking') {
      console.log(this._sounds);
    }
  }

  onMetronome() {

    if (!this.activeSound) {
      return
    }

    if (this.activeSound.markedToDestroy) {
      return
    }

    if (CONFIG.partialPlay) {
      let _previousSeekTime = this.activeSound.previousTimeCounter || 0
      let _s = this.activeSound.seek
      this.activeSound.timeCounter += (_s - _previousSeekTime)
      this.activeSound.timeCounter = isNaN(this.activeSound) ? _s : this.activeSound.timeCounter
      if (this._id === 'speaking') {
        //console.log(_s, _previousSeekTime, this.activeSound.playtime);
      }
      /*
      we will update it like this because if this sound starts again,
      we cant rely on seek() alone
      */
      //destroy if
      if (this.activeSound.playtime) {
        if (this._id === 'speaking') {
          //console.log(`${this.activeSound.soundname}`);
          //console.log(_s, this.activeSound.playtime, this.activeSound.duration());
          //console.log(_s, this.activeSound.timeCounter, this.activeSound.playtime, this.activeSound.duration());
          if (!this.activeSound.isEnding) {
            if (this.activeSound.timeCounter > (this.activeSound.playtime - this.activeSound.overlapTime)) {
              this.activeSound.isEnding = true
              this.endingSignal.dispatch()
            }
          }
          if (this.activeSound.timeCounter > this.activeSound.playtime) {
            Emitter.emit('log:log', `Sound ${this._id} ${this.activeSound.soundname} past playtime, destroy!`, 3, 20);
            this._fadeAndDestroy(this.activeSound,
              0,
              this._options.fadeDownBeforeEnding)
            return
          }
        }
      }

      if (_s > this.activeSound.duration() - this._options.fadeDownBeforeEnding) {
        //this._fadeAndDestroy(this.activeSound, 0, this._options.fadeDownBeforeEnding * 1000)
        //this._fade(this.activeSound, 0, this._options.fadeDownBeforeEnding * 1000)
      }
      this.activeSound.previousTimeCounter = _s
    }
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
        Emitter.emit('log:log', `Sound ${this._id} ${this.activeSound.soundname} playing: duration:${this._duration} volume: ${_vol}`);
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

    Emitter.emit('log:log', `Sound ${this._id} ${this.activeSound.soundname} at ${this._activeSoundIndex} terminate()`);
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
    console.log(this.activeSound);
    console.log(this._sounds);
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
