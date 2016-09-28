import Sono from '@stinkdigital/sono'
import H from 'howler'
import Emitter from './Emitter'

export default class Sound {
  constructor(paths) {
    if (paths) {
      this._s = Sono.createSound({ src: paths, autoplay: true, autoPlay: true })
      this._s.on('loaded', this._onLoaded)
      this._s.on('ended', this._onEnded)
      this._s.play()
    }
  }

  _onLoaded() {
    console.log('`', 'Sound Loaded');
    Emitter.emit('sound:loaded')
  }

  _onEnded() {
    Emitter.emit('sound:ended')
  }

  _create(config) {
    this._s = Sono.createSound(config)
    this._s.on('loaded', () => {
      console.log('`', 'Sound Loaded');
    })
    this._s.on('ended', () => {
      console.log('`', 'Sound Ended');
      Emitter.emit('sound:ended')
    })
  }

  load(config) {
    if (!this._s) {
      this._create(config)
    } else {
      this._s.load(config)
    }
    this._s.play()
  }

  stop() {
    if (this._s) {
      this._s.stop()
    }
  }

  destroy() {
    this._s.stop()
    this._s.off('loaded', this._onLoaded)
    this._s.off('ended', this._onEnded)
    this._s.destroy()
  }
}
