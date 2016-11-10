import electron from 'electron'
import _ from 'underscore'
import yaml from 'yamljs'
const ipc = electron.ipcRenderer


const printer = yaml.load(__dirname+'/default.yml')
const w =  printer.width/ printer.line
const h =  printer.height/printer.line
let img = null

const view = document.createElement('div')
view.id = 'viewport'
view.style.width = parseInt(w)+'px'
view.style.height = parseInt(h)+'px'
view.style.marginLeft = -parseInt(w/2)+'px'
view.style.marginTop = -(parseInt(h/2)+10)+'px'
document.body.appendChild(view)
document.addEventListener('dragover', (e) => {e.preventDefault()}, false)
document.addEventListener('drop', (e) => { 
  e.preventDefault()
	if (e.dataTransfer.files.length === 1) {
    const file = e.dataTransfer.files[0]
    ipc.send('data', {file:file.path, preview:true})
	}
	else return false
},false)


ipc.on('data', (event, d) => {
  if (!d.preview) { console.log(false); return }
  if (!img) img = document.createElement('img')
  img.src = d.preview
  img.onload = (e) => {
    img.style.marginLeft = -parseInt(img.width/2)+'px'
    img.style.marginTop = -(parseInt(img.height/2))+'px'
    document.body.appendChild(img)
  }
})
