import { app, BrowserWindow, ipcMain } from 'electron'
import runBuildAndRelease from '../../src/util/create-archive'

const path = require('path')
const http = require('http')
const express = require('express')
const expressApp = express()
const cors = require('cors')
const router = express.Router()
    /**
     * Set `__statics` path to static files in production;
     * The reason we are setting it here is that the path needs to be evaluated at runtime
     */
if (process.env.PROD) {
    global.__statics = require('path').join(__dirname, 'statics').replace(/\\/g, '\\\\')
}

// let mainWindow
let fileFolder

function createWindow() {
    /**
     * Initial window options
     */
    global.mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        useContentSize: true,
        webPreferences: {
            webSecurity: true
        }
    })

    // global.mainWindow.setMenu(null)
    global.mainWindow.loadURL(process.env.APP_URL)

    global.mainWindow.on('closed', () => {
        global.mainWindow = null
    })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (global.mainWindow === null) {
        createWindow()
    }
})

ipcMain.on('root', (event, folder) => {
    fileFolder = folder
})

expressApp.use(cors())

router.get('/pkg/:handle', async function(req, res) {
    let folder = fileFolder + path.sep + 'packages' + path.sep
    try {
        const msg = await runBuildAndRelease(folder, req.params.handle)
        res.json({ response: msg })
    } catch (error) {
        throw error //<-- THIS IS ESSENTIAL FOR BREAKING THE CHAIN
    }
})

router.get('/file/:handle', function(req, res) {
    let filename = fileFolder + path.sep + 'packages' + path.sep + req.params.handle + path.sep + 'icon.png'
    res.sendFile(filename)
})

expressApp.use('/', router)

http.createServer(expressApp).listen(8000)