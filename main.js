const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const { exec } = require('child_process')
const path = require('path')
const fs = require('fs')

var mlt_addon = null;
// console.log(mlt_addon.getNApiInfo())
// const { SerialPort } = require('serialport')

// console.log('process.versions.electron', process.versions.electron)
// console.log('process.versions.node', process.versions.node)
// console.log(process.title);

function get_dir_root(handle, tree_parent) {
	exec('wmic logicaldisk get caption', (error, stdout, stderr) => {
		if (error) {
			console.log(`exec error: ${error}`);
			return;
		}
		var disks = stdout.split('\r\n');
		// console.log(disks);
		for(var idx in disks){
			disks[idx] = disks[idx].replace('\r', '').trim();
			if(disks[idx]){
				// var filePath = path.resolve(disks[idx]);
				// var filePath = disks[idx] + '\\';
				var filePath = disks[idx];
				// console.log(filePath);
				// var filename = filePath.replace('\\', '');
				fileDisplay(filePath, handle, tree_parent, filePath);
			}
		}
		// console.log(disks);
	});
}

function get_dir(handle, tree_parent) {
	fs.readdir(tree_parent, function(err, files) {  
        if(err) {  
            console.log(err)  
        } else {
            files.forEach(function(filename) {
                var filedir = path.join(tree_parent, filename);
                fileDisplay(filedir, handle, tree_parent, filename);
            });  
        }  
    });
}

function fileDisplay(filePath, handle, tree_parent, filename) {
	fs.stat(filePath, function(eror, stats) {
		if(eror) {
			console.log('get file stats fail,', filePath);
		} else {
			var isDir = stats.isDirectory();
			if(isDir) {
				var dir_data = {
					id: filePath,
					text: filename,
					state: 'closed',
					children: [{
						text: ''
					}]
				};
				handle.reply('pong', 'set_dir|' + tree_parent + '|' + JSON.stringify(dir_data));
				// console.log(tree_parent, dir_data);
			}
		}
	});
}

// ipcMain.on("ping", (event, arg) => {
	// console.log(arg) // whoooooooh
	// SerialPort.list().then(
		// ports => {
			// console.log(ports);
			// event.reply('pong', 'whaaaaaaaa');
			// if(ports[0]){
				// console.log('中文', utfstr_friendlyName);
				// event.reply('pong', '中文');
			// }
		// },
		// err => {
			// console.log(err)
		// }
	// );
// });

var page_handle = null;
global.mlt_page_console_log = function(log_str) {
	// console.log(log_str);
	if(page_handle){
		// console.log(page_handle);
		page_handle.sender.send('pong', 'page_console_log|' + log_str);
	}
};

global.mlt_draw_graph = function() {
	page_handle.sender.send('pong', 'draw_graph');
};

let mainWindow;

ipcMain.on("ping", (event, arg) => {
	// console.log(arg);
	// event.reply('pong', '中文');
	var msg_array = arg.split('|');
	if(msg_array[0] == 'page_handle') {
		page_handle = event;
		try {
			mlt_addon = require('./addon/mathlabtool');
			page_handle.sender.send('pong', 'page_console_log|' + mlt_addon.getNApiInfo() + '\n');
		}  catch (e) {
			page_handle.sender.send('pong', 'page_console_log|' + e.toString() + '\n');
		}
	} else if(msg_array[0] == 'get_dir') {
		if(msg_array[1] == 'MyComputer') {
			get_dir_root(event, msg_array[1]);
		} else {
			get_dir(event, msg_array[1]);
		}
	} else if(msg_array[0] == 'set_file') {
		// console.log(msg_array[1]);
		set_file_write(event, msg_array[1], msg_array[2], 'set_file');
	} else if(msg_array[0] == 'run_file') {
		// code_handle = event;
		set_file_write(event, msg_array[1], msg_array[2], 'run_file');
	} else if(msg_array[0] == 'set_exist_file') {
		set_file_write(event, msg_array[1], msg_array[2], 'set_exist_file');
	}
});

function set_file_write(handle, path_name, val, cmd) {
	fs.writeFile(path_name, val,  function(err) {
		if (err) {
			console.log(err);
			handle.reply('pong', 'save_file_tip|error');
		} else {
			if(cmd == 'set_file') {
				handle.reply('pong', 'save_file_tip|success');
			} else if(cmd == 'run_file') {
				// console.log('run_file', path_name, require.cache, require.cache[path_name]);
				// for(var i in require.cache){
					// console.log('run_file', path_name, i, require.cache[i]);
					// if(i == path_name){
						// console.log('run_file', i, require.cache[i]);
					// }
				// }
				delete require.cache[path_name];
				// console.log('run_file', path_name, require.cache[path_name]);
				try {
					require(path_name);
				} catch (e) {
					console.log("run code:", e);
					// handle.reply('pong', 'save_file_tip|code_error|' + e.toString());
					handle.reply('pong', 'page_console_log|' + e.toString() + '\n');
				}
				// console.log('run_file', path_name, require.cache[path_name]);
			}
		}
	});
}

const createWindow = () => {
	Menu.setApplicationMenu(null);

	mainWindow = new BrowserWindow({
		width: 1100,
		height: 700,
		icon: path.join(__dirname, 'public/icon/mathlabtool.ico'),
		webPreferences: {
			contextIsolation: false,
			nodeIntegration: true,
			// webgl: true,
			// webSecurity: false,
			// experimentalFeatures: true,
			// experimentalCanvasFeatures: true,
			preload: path.join(__dirname, 'src/preload.js')
		}
	});

	mainWindow.loadFile('webUI/index.html');

	if (!app.isPackaged) {
		mainWindow.webContents.openDevTools();
	}
}

app.disableHardwareAcceleration()

// app.commandLine.appendSwitch('ignore-gpu-blacklist');

// 这段程序将会在 Electron 结束初始化
// 和创建浏览器窗口的时候调用
// 部分 API 在 ready 事件触发后才能使用。
app.whenReady().then(() => {
	createWindow()
	
	app.on('activate', () => {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})

	// mainWindow.webContents.send('pong', "webContents.send");
})

// 除了 macOS 外，当所有窗口都被关闭的时候退出程序。 There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. 也可以拆分成几个文件，然后用 require 导入。