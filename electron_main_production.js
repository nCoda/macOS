    // -*- coding: utf-8 -*-
//-------------------------------------------------------------------------------------------------
// Program Name:           Julius
// Program Description:    User interface for the nCoda music notation editor.
//
// Filename:               js/electron_main.js
// Purpose:                Code to start nCoda Julius in Electron.
//
// Copyright (C) 2016 Christopher Antila
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
//-------------------------------------------------------------------------------------------------

'use strict';

const electron = require('electron');
const path = require('path');
var fs = require('fs');
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
const app = electron.app;
var log = require('electron-log');
// Same as for console transport 
log.transports.file.level = 'info';
log.transports.file.format = '{h}:{i}:{s}:{ms} {text}';
var processes = [];

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;

// Set app name and app version manually.  Built-in functions fetch name and version of Julius only.
const name = 'nCoda'; //electron.app.getName()
const version = '0.0'; //electron.app.getVersion()
  

app.on('before-quit', function() {
  processes.forEach(function(proc) {
    log.info('got here');
    proc.kill( 'SIGINT');
  });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        log.info('in the window closing block');
        app.quit();
    }
});

//helper function that starts virtual env and returns active process
function start_fujian_lychee_venv(){
    //start backend by calling compiled standalone
    var this_dir = __dirname;
    var dir_above = path.dirname(this_dir);
    var spawn = require('child_process').spawn;
    var fujian = spawn('/usr/bin/open', [dir_above + '/nCoda.app'], {
        shell: true,
    });
    fujian.stdout.on('data', function (data) {
        log.info('get received');
        log.info(data);
    });

    fujian.on('close', function(data) {
        log.info('closing');
    });

    fujian.stderr.on('data', function(data) {
        log.info('sterrored: ' + data);
    });

    fujian.on('error', function(err) {
        log.info('errored: ' + err);
    });
    log.info(processes.length+'/n');
    processes.push(fujian);
    log.info(processes.length+'/n');
}

app.on('ready', function () {
    start_fujian_lychee_venv();
    mainWindow = new BrowserWindow;
    mainWindow.maximize();
    mainWindow.loadURL('file://' + __dirname + '/../index.html');
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
});

// Menus
let template = [{
    label: 'Edit',
    role: 'edit',
    submenu: [{
        label: 'Undo',
        accelerator: 'CmdOrCtrl+Z',
        role: 'undo'
    }, {
        label: 'Redo',
        accelerator: 'Shift+CmdOrCtrl+Z',
        role: 'redo'
    }, {
        type: 'separator'
    }, {
        label: 'Cut',
        accelerator: 'CmdOrCtrl+X',
        role: 'cut'
    }, {
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        role: 'copy'
    }, {
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        role: 'paste'
    }, {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        role: 'selectall'
    }]
}, {
    label: 'View',
    submenu: [{
        label: 'Reload (Cmd/Ctrl R)',
        accelerator: 'CmdOrCtrl+R',
        click: function (item, focusedWindow) {
            if (focusedWindow) {
                // on reload, start fresh and close any old
                // open secondary windows
                if (focusedWindow.id === 1) {
                    BrowserWindow.getAllWindows().forEach(function (win) {
                        if (win.id > 1) {
                            win.close()
                        }
                    })
                }
                focusedWindow.reload()
            }
        }
    }, {
        label: 'Reload (F5)',
        accelerator: 'F5',
        click: function (item, focusedWindow) {
            if (focusedWindow) {
                // on reload, start fresh and close any old
                // open secondary windows
                if (focusedWindow.id === 1) {
                    BrowserWindow.getAllWindows().forEach(function (win) {
                        if (win.id > 1) {
                            win.close()
                        }
                    })
                }
                focusedWindow.reload()
            }
        }
    }, {
        label: 'Toggle Full Screen',
        accelerator: (function () {
            if (process.platform === 'darwin') {
                return 'Ctrl+Command+F'
            } else {
                return 'F11'
            }
        })(),
        click: function (item, focusedWindow) {
            if (focusedWindow) {
                focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
            }
        }
    }, {
        label: 'Toggle Developer Tools',
        accelerator: (function () {
            if (process.platform === 'darwin') {
                return 'Alt+Command+I'
            } else {
                return 'Ctrl+Shift+I'
            }
        })(),
        click: function (item, focusedWindow) {
            if (focusedWindow) {
                focusedWindow.toggleDevTools()
            }
        }
    }]
}, {
    label: 'Window',
    role: 'window',
    submenu: [{
        label: 'Minimize',
        accelerator: 'CmdOrCtrl+M',
        role: 'minimize'
    }, {
        label: 'Close',
        accelerator: 'CmdOrCtrl+W',
        role: 'close'
    }]
}, {
    label: 'Help',
    role: 'help',
    submenu: [{
        label: 'Learn More',
        click: function () {
            electron.shell.openExternal('https://ncodamusic.org/')
        }
    }]
}]

function addUpdateMenuItems(items, position) {
    let updateItems = [{
        label: `Version ${version}`,
        enabled: false
    }]

    items.splice.apply(items, [position, 0].concat(updateItems))
}

if (process.platform === 'darwin') {
    template.unshift({
        label: name,
        submenu: [{
            label: `About ${name}`,
            //role: 'about',
            click: function () {
                electron.shell.openExternal('https://ncodamusic.org/')
            }
        }, {
            type: 'separator'
        }, {
            label: 'Services',
            role: 'services',
            submenu: []
        }, {
            type: 'separator'
        }, {
            label: `Hide ${name}`,
            accelerator: 'Command+H',
            role: 'hide'
        }, {
            label: 'Hide Others',
            accelerator: 'Command+Alt+H',
            role: 'hideothers'
        }, {
            label: 'Show All',
            role: 'unhide'
        }, {
            type: 'separator'
        }, {
            label: 'Quit',
            accelerator: 'Command+Q',
            click: function () {
                app.quit()
            }
        }]
    })
    // Window menu.
    template[3].submenu.push({
        type: 'separator'
    }, {
        label: 'Bring All to Front',
        role: 'front'
    })

    addUpdateMenuItems(template[0].submenu, 1)
}
else {
    template.unshift({
        label: name,
        submenu: [
            {
                label: `About ${name}`,
                click: function() {
                    electron.shell.openExternal('http://ncodamusic.org/');
                },
            },
            {
                type: 'separator',
            },
            {
                label: 'Quit',
                accelerator: 'Ctrl+Q',
                click: function() {
                    app.quit();
                },
            },
        ],
    });
}

if (process.platform === 'win32') {
    const helpMenu = template[template.length - 1].submenu
    addUpdateMenuItems(helpMenu, 0)
}

app.on('ready', function () {
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
})
