import Sono from '@stinkdigital/sono'
import H from 'howler'
import Emitter from './Emitter'

export default class Sound {
  constructor(paths = []) {
    /*this._s = Sono.createSound({ src: paths })
        this._s.on('loaded', () => {
            console.log('`', 'Sound Loaded');
        })
        this._s.on('ended', () => {
            console.log('`', 'Sound Ended');
            Emitter.emit('sound:ended')
        })
        this._s.play()
*/
    this._s = new H.Howl({
      urls: paths,
      autoplay: true,
      volume:1,
      loop: false
    });
    this._s.on('load', this._onLoaded)
    this._pBOund = this._onPlay.bind(this)
    this._s.on('play', this._pBOund)
    this._s.on('end', this._onEnded)
    this._s.play()
  }

  _onLoaded() {
    Emitter.emit('sound:loaded')
  }

  _onPlay() {
    if (!this.isPlaying) {
      this.isPlaying = true
      Emitter.emit('sound:playing')
    }
  }

  _onEnded() {
    Emitter.emit('sound:ended')
  }

  stop() {
    this._s.stop()
  }

  destroy() {
    this._s.stop()
    this._s.off('load', this._onLoaded)
    this._s.off('play', this._pBOund)
    this._s.off('end', this._onEnded)
    this._s.unload()
    this._s = null
  }
}
