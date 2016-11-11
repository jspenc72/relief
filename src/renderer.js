import electron from 'electron'
import _ from 'underscore'
import yaml from 'yamljs'
import imageToPlate from './imageToPlate.js'
import proc from 'child_process'

// const ipc = electron.ipcRenderer
let img = null
let scale = null

  
const log = document.querySelector('.log')
document.addEventListener('dragover', (e) => {e.preventDefault()}, false)
document.addEventListener('drop', (e) => { 
  e.preventDefault()
	if (e.dataTransfer.files.length === 1) {
    const file = e.dataTransfer.files[0]
    imageToPlate({file:file.path}, inputHandler)
	}
	else return false
},false)

function inputHandler (d) {
  d = d.split(' ')
  if (d[0] === 'prog') return
  if (d[0] === 'open') { 
    proc.exec(d[1]+' '+d[2], (e,se,so) => { console.log(e,se,so) })
  }
  if (d[0] === 'preview') {
    if (!img) img = document.createElement('img')
    img.src = d[1]
    img.onload = (e) => {
      img.style.marginLeft = -parseInt(img.width/2)+'px'
      img.style.marginTop = -(parseInt(img.height/2))+'px'
      document.body.appendChild(img)
    }
  } else log.innerHTML = d[1]
}
