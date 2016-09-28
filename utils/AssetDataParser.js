import _ from 'lodash'
import Q from 'bluebird'
import load from 'load-json-xhr'

const LOADJSON = Q.promisify(load)
const P = (() => {

  function loadJson(url, config) {
    return LOADJSON(url).then(json => {
      console.log(json);
      let _values = _.values(config)
      return Q.map(_values, layer => {
          layer.locations = parseJsonToLocation(json, layer.id)
          return layer
      }, {
        concurrency: 1
      }).then(results => {
        return _.flatten(results)
      })

      /*layer.id = json.name
      layer.locations = parseJsonToLocation(json)
      return layer*/
    })
  }

  /*function loadJson(config) {
    let _values = _.values(config)
    return Q.map(_values, layer => {
      return LOADJSON(config.jsonUrl).then(json => {
        layer.id = json.name
        layer.locations = parseJsonToLocation(json)
        return layer
      })
    }, {
      concurrency: 1
    }).then(results => {
      return _.flatten(results)
    })
  }*/

  function _findFilesRecursive(location, layerId) {
    let _files = []
    function __re(children) {
      return children.map(child => {
        if (child.type === 'folder') {
          if (child.children) {
            return __re(child.children)
          }
          return child
        } else {
          let url = REMOTE_ASSET_URL +'tour/' + location.name +'/' + child.path.substring(child.path.indexOf(layerId), child.path.length)
          child.url = url
          _files.push(child)
          return child
        }
      })
    }

    let _correctType = location.children.filter(folder=>{
      return folder.name === layerId
    })

    __re(_correctType)

    let _fileGroups = []
    for (var i = 0; i < _files.length; i += 2) {
      _fileGroups.push([_files[i], _files[i + 1]])
    }

    return {
      id: location.name,
      files: _fileGroups
    }
  }

  function parseJsonToLocation(json, layerId) {
    //speaking, music
    let _locations = []
    _.each(json.children, location => {
      if(location.type ==='folder'){
        _locations.push(_findFilesRecursive(location, layerId))
      }
    })
    return _locations
  }



  return { parseJsonToLocation, loadJson }

})()
export default P
