import _ from 'lodash'
import Emitter from './Emitter'
import Q from 'bluebird'
import load from 'load-json-xhr'

const SRC = 'assets/json/waveforms.json'
const LOADJSON = Q.promisify(load)

/*
Reads waveform json from the guardian to make modulations
*/
const P = (() => {

  let data
  let active
  let index = 0

  function _ready() {
    Emitter.on('map:entering', (activePlace) => {
      active = data[activePlace.id]
      index = 0
    })

    Emitter.on('metronome:quarter', () => {
      if(active){
        index = (index + 1) % active.length
        Emitter.emit('phaser:update', active[index])
      }
    })
  }

  function load() {
    return LOADJSON(SRC).then(json => {
      data = json
      _ready()
      return data
    })
  }


  return { data, active, index, load }

})()
export default P
