import url from 'url'
import path from 'path'
import electron from 'electron'
import imageToPlate from './imageToPlate.js'
const app = electron.app
const ipc = electron.ipcMain
const BrowserWindow = electron.BrowserWindow

let mainWindow

ipc.on('data', function (event, data) {
  if (data.file) imageToPlate(data, (s) => {
    s.on('data', (d) => { event.sender.send('data', d) })
  })
})

function createWindow () {
  mainWindow = new BrowserWindow({width: 420, height: 320, resizeable: false})

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname.replace('dist',''), 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})
