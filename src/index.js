import fs from 'fs'
import path from 'path'
import through from 'through'
import _ from 'underscore'
import THREE from 'three'
import exportStl from './exportStl.js'
import floydDither from 'floyd-steinberg'
import savePixles from 'save-pixels'
import getPixels from 'get-pixels'
import sharp from 'sharp'

// add function to scale image if it exceeds print bed dim

const map = { // front : 8,9 & back : 10,11
  right : 0, // faces 0,1
  left : 2, // faces 2,3
  top : 4, // faces 4,5
  bottom : 6 // faces 6,7
}

const tinkerine = { // in mm
  line: 0.65,
  width: 215, // actually < 197mm
  height: 160
}
// const pixelGeo = new THREE.CubeGeometry(1, 1, 1) 
const pixelGeo = new THREE.CubeGeometry(tinkerine.line, tinkerine.line, tinkerine.line) 
const printable = new THREE.Geometry()



function pixelBounds (bed) {
  bed.width = bed.width - 20 // x margin
  bed.height = bed.height - 20 // y margin
  return {
    w: parseInt(bed.width/bed.line), 
    h: parseInt(bed.height/bed.line)
  }
}

export default function (opts, cb) {
  const fileName = path.basename(opts.file)
  const dirName = path.dirname(opts.file)
  const output = through()
  cb(output)

  // SCALE IMAGE IF ITS BIGGER THAN PRINT BED DIM
  const prePix = sharp(opts.file)
  prePix.metadata((e, info) => {
    const bounds = pixelBounds(tinkerine)
    if (info.height>bounds.h || info.width>bounds.w) {
      opts.file = dirName+'/sm_'+fileName
      if (info.width>info.height) prePix.resize(bounds.w, null)
      else prePix.resize(null, bounds.w)
      prePix.toFile(opts.file, (err) => {
        if (err) console.error(e)
        processImage(opts, output)
      })
    } else processImage(opts, output) 
  })
}

function processImage (opts, output) {
  const ext = path.extname(opts.file)
  const bwPath = opts.file.replace(ext, '_bw' + ext)
  const stlPath = opts.file.replace(ext, '.stl')
  getPixels(opts.file, (e, pixels) => { 
    const w = pixels.shape[0]
    const h = pixels.shape[1]
    pixels.data = floydDither(pixels).data
    if (opts.savePreview) {
      const file = fs.createWriteStream(bwPath)
      savePixels(pixels, extName.replace('.','')).pipe(file)
    }
    pixelsToGeometry({
      width: w,
      height: h,
      data: pixels.data,
      stlFileName: stlPath
    }, output)
  })
}

function pixelsToGeometry (opts, output) {
  // 1 unit / pixel is === to 1 mm
  // units have to equal printer line width
  const w = opts.width
  const h = opts.height
  const pixArray = opts.data
  const baseGeo = new THREE.CubeGeometry(w*tinkerine.line,h*tinkerine.line,4*tinkerine.line)
  baseGeo.center()

  for(let y = 0; y < h; y++) { // y row
    output.write(y+'/'+(h-1))
    for(let x = 0; x < w; x++) { // x across y
      const val = pixArray[((w*y)+x)*4]
      const sides = { // find connected pixels
        right : (pixArray[((w*y)+(x+1))*4] === 0) ? true : false,
        left : (pixArray[((w*y)+(x-1))*4] === 0) ? true : false,
        top : (pixArray[((w*(y-1))+x)*4] === 0) ? true : false,
        bottom : (pixArray[((w*(y+1))+x)*4] === 0) ? true : false
      }
      if (val===0) savePixel(x,y,sides)
    }
  }

  printable.scale(1,1,(3*tinkerine.line)) 
  printable.center() 
  const base = new THREE.Mesh(baseGeo)
  base.position.z = -(3*tinkerine.line)
  base.updateMatrix()
  printable.merge(base.geometry, base.matrix)
  const model = new THREE.Mesh(printable)
  model.name = opts.stlFileName
  // scale model by line width before output
  exportStl(model, output)
}

function savePixel (x,y,sides) {
  const pixel = new THREE.Mesh(pixelGeo.clone())
  let m = _.clone(map)
  pixel.position.x = (x*tinkerine.line)
  pixel.position.y = -(y*tinkerine.line)
  _.each(sides, (v,k) => { // remove colliding side
    if (v) { 
      pixel.geometry.faces.splice(m[k],2)
      _.each(m, (f,c) => { if (c!==k) m[c] = f-2})
    }
  })
  pixel.updateMatrix()
  printable.merge(pixel.geometry,pixel.matrix)
}
