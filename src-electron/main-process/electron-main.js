import { app, BrowserWindow, ipcMain } from 'electron'
import runBuildAndRelease from '../../src/util/create-archive'
// import { openAboutWindow } from 'about-window'
import { rootPath } from 'electron-root-path'
// const rootPath = require('electron-root-path').rootPath
const path = require('path')
const http = require('http')
const express = require('express')
const expressApp = express()
const cors = require('cors')
const router = express.Router()
const openAboutWindow = require('about-window').default

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
    ipcMain.removeAllListeners(['root', 'show-about'])
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
    event.returnValue = true
})

ipcMain.on('show-about', (event) => {
    openAboutWindow({
        icon_path: path.join(__statics, '/images/about-logo.min.svg'),
        // copyright: 'Copyright (c) 2019 Nour Akalay',
        // bug_link_text: 'Report an issue',
        use_version_info: true,
        open_devtools: false,
        show_close_button: false,
        package_json_dir: rootPath,
        adjust_window_size: true,
        show_close_button: '&Cross;',
        css_path: path.join(__statics, '/css/about.css'),
        win_options: {
            alwaysOnTop: true,
            minimizable: false,
            maximizable: false,
            fullscreenable: false,
            frame: false,
            backgroundColor: '#fff'
        }
    })
    event.returnValue = true
})

expressApp.use(cors())

// route to get a package folder
router.get('/pkg/:handle', async function(req, res) {
    let folder = fileFolder + path.sep + 'packages' + path.sep
    try {
        const msg = await runBuildAndRelease(folder, req.params.handle)
        res.json({ response: msg })
    } catch (error) {
        throw error //<-- THIS IS ESSENTIAL FOR BREAKING THE CHAIN
    }
})

// route to fetch and display package icon files
router.get('/file/:handle', function(req, res) {
    let filename = fileFolder + path.sep + 'packages' + path.sep + req.params.handle + path.sep + 'icon.png'
    res.sendFile(filename)
})

// route to fetch and display package exclusions.json files
router.get('/exclusion/:handle', function(req, res) {
    let filename = fileFolder + path.sep + 'packages' + path.sep + req.params.handle + path.sep + 'exclusions.json'
    res.sendFile(filename)
})

expressApp.use('/', router)

http.createServer(expressApp).listen(8000)