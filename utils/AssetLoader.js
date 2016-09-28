import _ from 'lodash'
import Q from 'bluebird'
import Emitter from './DerivEmitter'
import Loader from 'assets-loader'

const P = (() => {


  function load(srcs = {}) {
    if(!srcs){
      Emitter.emit('log:error', `AssetLoader: no sources`);
    }
    //could be an object
    if(!_.isArray(srcs)){
      srcs = srcs.src || []
    }

    let _assets = srcs.map(url => {
      Emitter.emit('log:log', `AssetLoader: preloading ${url}`, 3, 11);
      return { url, type: 'bin' }
    })

    let _loader = new Loader({
      assets: _assets
    })
    _loader.start()
    return new Q((resolve, reject) => {
      _loader.on('complete', function(map) {
        resolve(_loader)
      })
    })
  }

  return { load }

})()
export default P
