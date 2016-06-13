import _ from 'underscore'
import THREE from 'three'
import gp from 'get-pixels'
import exp from './export.js'
const log = require('single-line-log').stdout

const image = process.argv[2]

const map = { // front : 8,9 & back : 10,11
  right : 0, // faces 0,1
  left : 2, // faces 2,3
  top : 4, // faces 4,5
  bottom : 6 // faces 6,7
}

const pixelGeo = new THREE.CubeGeometry(1, 1, 1)
const printable = new THREE.Geometry()

gp(image, (e, p) => { // get pixels
  const w = p.shape[0]
  const h = p.shape[1]
  const baseGeo = new THREE.CubeGeometry(w,h,4)
  baseGeo.center()
  for(let y = 0; y < h; y++) { // y row
    log(y+'/'+(h-1))
    for(let x = 0; x < w; x++) { // x across y
      const val = p.data[((w*y)+x)*4]
      const sides = { // find connected pixels
        right : (p.data[((w*y)+(x+1))*4] === 0) ? true : false,
        left : (p.data[((w*y)+(x-1))*4] === 0) ? true : false,
        top : (p.data[((w*(y-1))+x)*4] === 0) ? true : false,
        bottom : (p.data[((w*(y+1))+x)*4] === 0) ? true : false
      }
      if (val===0) savePixel(x,y,sides)
    }
  }
  // scale along z
  printable.scale(1,1,2.5) // ratio???
  printable.center() 
  const base = new THREE.Mesh(baseGeo)
  base.position.z = -2.5 // plus thicknes??
  base.updateMatrix()
  printable.merge(base.geometry, base.matrix)
  const model = new THREE.Mesh(printable)
  model.name = image.replace('.png','.stl')
  exp(model)
})

function savePixel (x,y,sides) {
  const pixel = new THREE.Mesh(pixelGeo.clone())
  let m = _.clone(map)
  pixel.position.x = x
  pixel.position.y = -y
  _.each(sides, (v,k) => { // remove colliding side
    if (v) { // array shifts!!! fuck!
      pixel.geometry.faces.splice(m[k],2)
      _.each(m, (f,c) => { if (c!==k) m[c] = f-2})
    }
  })
  pixel.updateMatrix()
  printable.merge(pixel.geometry,pixel.matrix)
}
