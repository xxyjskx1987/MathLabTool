const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const { exec } = require('child_process')
const path = require('path')
const fs = require('fs')
const { SerialPort } = require('serialport')

var mlt_addon = null;
var page_handle = null;
var sp = null;

// console.log('process.versions.electron', process.versions.electron)
// console.log('process.versions.node', process.versions.node)
// console.log(process.title);

global.mlt_serial_list = function(serial_list_callback) {
	SerialPort.list().then(ports => {
		ports.forEach(function(port) {
			serial_list_callback(port);
			// console.log(port.path);
			// console.log(port.vendorId);
		});
	});
};

global.mlt_serial_open = function(p_path, p_baudRate, serial_read_callback) {
	if(sp != null && sp.isOpen) {
		sp.close((err) => {
			if(err) {
				console.log('serial close err', err);
				return;
			}
		});
	}
	
	setTimeout(function() {
		sp = new SerialPort({ path: p_path, baudRate: p_baudRate, autoOpen: false }, (err) => {
			if (err) {
				console.log('serial open err', err);
				return;
			}
		});
		
		sp.open();
		
		sp.on('data', (data) => {
			serial_read_callback(data.toString('ASCII'));
		});
		
		// sp.on('readable', () => {
			// console.log(sp.read());
		// });

		sp.on('error', err => {
			console.log('serial err', err);
		});
		
		sp.drain(err => {
			if (err) {
				console.log('serial write err', err);
				return;
			}
		});
	}, 100);
};

global.mlt_serial_write = function(p_data) {
	sp.write(p_data);
};

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
				var filePath = disks[idx];
				// var filename = filePath.replace('\\', '');
				fileDisplay(filePath, handle, tree_parent, filePath);
			}
		}
		// console.log(disks);
	});
}

function get_dir(handle, tree_parent) {
	console.log(tree_parent);
	fs.readdir(tree_parent + '/', function(err, files) {
        if(err) {
            console.log(err)
        } else {
            files.forEach(function(filename) {
				console.log(filename);
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

global.mlt_page_console_log = function(...log_str) {
	// console.log(typeof log_str, log_str, JSON.stringify(log_str));
	var ret = "";
	for(var idx in log_str) {
		if(typeof log_str[idx] == 'object') {
			ret += JSON.stringify(log_str[idx]);
		} else {
			ret += log_str[idx];
		}
	}
	if(page_handle){
		page_handle.sender.send('pong', 'page_console_log|' + ret);
	}
};

var graph_datas = {};
var handle_graph_data = [];
var draw_zoom_graph_dim3 = function(graph_index, negitive) {
	if(negitive == 'plus') {
		handle_graph_data[3]['camera'][0] = 0;
		handle_graph_data[3]['camera'][1] = 0;
		handle_graph_data[3]['camera'][2] = 0;
		handle_graph_data[3]['camera'][3] = 1.1;
	} else {
		handle_graph_data[3]['camera'][0] = 0;
		handle_graph_data[3]['camera'][1] = 0;
		handle_graph_data[3]['camera'][2] = 0;
		handle_graph_data[3]['camera'][3] = 0.9;
	}
	var ret = mlt_addon.draw_graph_dim3(handle_graph_data[0], handle_graph_data[1], handle_graph_data[2], handle_graph_data[3]);
	// console.log(ret[0]);
	// console.log(ret[1]);
	handle_graph_data[3]['csys_end'] = ret[0];
	for(var idx in handle_graph_data[3]['data']){
		handle_graph_data[3]['data'][idx]['data'] = ret[1][idx];
	}
};

var draw_transform_graph_dim3 = function(graph_index, x_diff, y_diff) {
	// console.log("draw_transform_graph_dim3", graph_index, x_diff, y_diff);
	var per_angle = 1;
	if(y_diff == 0) {
		handle_graph_data[3]['camera'][0] = 0;
		handle_graph_data[3]['camera'][1] = per_angle * x_diff;
		handle_graph_data[3]['camera'][2] = 0;
		handle_graph_data[3]['camera'][3] = 1;
	} else if(x_diff == 0) {
		handle_graph_data[3]['camera'][0] = per_angle * y_diff;
		handle_graph_data[3]['camera'][1] = 0;
		handle_graph_data[3]['camera'][2] = 0;
		handle_graph_data[3]['camera'][3] = 1;
	} else {
		y_diff = -y_diff;
		var k = y_diff / x_diff;
		var dist = Math.sqrt(x_diff * x_diff + y_diff * y_diff);
		if (k < Math.sqrt(2) - 1 && k > -Math.sqrt(2) + 1) {
			handle_graph_data[3]['camera'][0] = 0;
			handle_graph_data[3]['camera'][1] = (x_diff > 0) ? (per_angle * dist) : (-per_angle * dist);
			handle_graph_data[3]['camera'][2] = 0;
			handle_graph_data[3]['camera'][3] = 1;
		} else if (k < -Math.sqrt(2) - 1 && k > Math.sqrt(2) + 1) {
			handle_graph_data[3]['camera'][0] = (y_diff > 0) ? (-per_angle * dist) : (per_angle * dist);
			handle_graph_data[3]['camera'][1] = 0;
			handle_graph_data[3]['camera'][2] = 0;
			handle_graph_data[3]['camera'][3] = 1;
		} else {
			handle_graph_data[3]['camera'][0] = 0;
			handle_graph_data[3]['camera'][1] = 0;
			handle_graph_data[3]['camera'][2] = (x_diff > 0) ? (-per_angle * dist) : (per_angle * dist);
			handle_graph_data[3]['camera'][3] = 1;
		}
		// if(k >= Math.sqrt(2) - 1 && k <= Math.sqrt(2) + 1) {
			// handle_graph_data[3]['camera'][0] = 0;
			// handle_graph_data[3]['camera'][1] = 0;
			// handle_graph_data[3]['camera'][2] = (x_diff > 0) ? (-per_angle * dist) : (per_angle * dist);
		// }
		// if(k >= -Math.sqrt(2) - 1 && k <= -Math.sqrt(2) + 1) {
			// handle_graph_data[3]['camera'][0] = 0;
			// handle_graph_data[3]['camera'][1] = 0;
			// handle_graph_data[3]['camera'][2] = (x_diff > 0) ? (-per_angle * dist) : (per_angle * dist);
		// }
	}
	
	var ret = mlt_addon.draw_graph_dim3(handle_graph_data[0], handle_graph_data[1], handle_graph_data[2], handle_graph_data[3]);
	// console.log(ret[0]);
	// console.log(ret[1]);
	handle_graph_data[3]['csys_end'] = ret[0];
	for(var idx in handle_graph_data[3]['data']){
		handle_graph_data[3]['data'][idx]['data'] = ret[1][idx];
	}
};

global.mlt_draw_graph_dim3 = function(graph_type, title, width, height, graph_data) {
	handle_graph_data = [];
	page_handle.sender.send('pong', 'draw_graph_3d|' + title + '|' + width + '|' + height);
	var addon_graph_type = 0;
	if(graph_type == 'graph'){
		addon_graph_type = 1;
		graph_data['camera'] = [30, -30, -30, 1];
		graph_data['csys_end'] = [
			[(graph_data['scale_max_x'] - graph_data['scale_min_x']), 0, 0],
			[0, (graph_data['scale_max_y'] - graph_data['scale_min_y']), 0],
			[0, 0, (graph_data['scale_max_z'] - graph_data['scale_min_z'])]
		];
		handle_graph_data[0] = addon_graph_type;
		handle_graph_data[1] = width - 18;
		handle_graph_data[2] = height - 44;
		handle_graph_data[3] = graph_data;
		var ret = mlt_addon.draw_graph_dim3(addon_graph_type, width - 18, height - 44, graph_data);
		// console.log(ret[0]);
		// console.log(ret[1]);
		handle_graph_data[3]['csys_end'] = ret[0];
		for(var idx in handle_graph_data[3]['data']){
			handle_graph_data[3]['data'][idx]['data'] = ret[1][idx];
		}
	}
};

global.mlt_draw_graph = function(graph_type, title, width, height, graph_data) {
	page_handle.sender.send('pong', 'draw_graph|' + title + '|' + width + '|' + height);
	var addon_graph_type = -1;
	if(graph_type == 'custom'){
		addon_graph_type = 0;
		mlt_addon.draw_graph(addon_graph_type, width - 18, height - 44, graph_data);
	}else if(graph_type == 'graph'){
		addon_graph_type = 1;
		mlt_addon.draw_graph(addon_graph_type, width - 18, height - 44, graph_data);
	}else if(graph_type == 'graph_radar'){
		addon_graph_type = 2;
		mlt_addon.draw_graph(addon_graph_type, width - 18, height - 44, graph_data);
	}else if(graph_type == 'graph_histogram'){
		addon_graph_type = 3;
		mlt_addon.draw_graph(addon_graph_type, width - 18, height - 44, graph_data);
	}else if(graph_type == 'graph_formula'){
		addon_graph_type = 4;
		for(var idx in graph_data['data']){
			if(graph_data['data'][idx]['formula']){
				graph_data['data'][idx]['formula'] = graph_data['data'][idx]['formula'].split(' ').join('');
				graph_data['data'][idx]['formula_len'] = graph_data['data'][idx]['formula'].length;
			}
			graph_data['data'][idx]['data_len'] = 80;
			// console.log(graph_data['data'][idx]);
		}
		var ret_data = mlt_addon.draw_graph_formula(addon_graph_type, width - 18, height - 44, graph_data);
		// console.log("draw_graph_formula", ret_data);
		
		for(var idx in ret_data){
			var s_coord_x, s_coord_y, e_coord_x, e_coord_y;
			var reset_draw = true;
			for(var i in ret_data[idx]){
				var ret = null;
				if(graph_data['data'][idx]['formula']) {
					ret = mlt_addon.analytic_formula(
							graph_data['data'][idx]['formula'], 
							graph_data['data'][idx]['formula_len'], 
							['x'], 
							[ret_data[idx][i]]
						);
				} else {
					var i_val_number = Number(ret_data[idx][i]);
					ret = graph_data['data'][idx]['formula_code'](i_val_number).toString();
				}
				// console.log(ret_data[idx][i], ret);
				var graph_coord = undefined;
				if(ret != "inf" && ret != "Infinity"){
					graph_coord = mlt_addon.get_graph_coord(
						addon_graph_type, width - 18, height - 44, 
						graph_data, ret_data[idx][i], ret
					);
				}
				if(!graph_coord) {
					// console.log("graph_coord", graph_coord);
					reset_draw = true;
				} else {
					if(reset_draw) {
						reset_draw = false;
						s_coord_x = graph_coord[0];
						s_coord_y = graph_coord[1];
					} else {
						e_coord_x = graph_coord[0];
						e_coord_y = graph_coord[1];
						draw_line(
							s_coord_x, s_coord_y, e_coord_x, e_coord_y, 
							graph_data['data'][idx]['color']
						);
						s_coord_x = e_coord_x;
						s_coord_y = e_coord_y;
					}
				}
			}
		}
	}
};

global.draw_line = function(s_x, s_y, e_x, e_y, color) {
	page_handle.sender.send('pong', 'draw_line|' + s_x + '|' + s_y + '|' + e_x + '|' + e_y + '|' + color);
};

global.draw_text = function(text_str, x, y) {
	page_handle.sender.send('pong', 'draw_text|' + text_str + '|' + x + '|' + y);
};

global.draw_circle = function(s_x, s_y, radius, color, is_fill) {
	page_handle.sender.send('pong', 'draw_circle|' + s_x + '|' + s_y + '|' + radius + '|' + color + '|' + is_fill);
};

global.array_raw2col = function(data) {
	var ret = [];
	for(var idx_raw in data){
		for(var idx_val in data[idx_raw]){
			if(!ret[idx_val]){
				ret[idx_val] = [];
			}
			ret[idx_val][idx_raw] = data[idx_raw][idx_val];
		}
	}
	
	return ret;
};

global.csv2array = function(path, data_option) {
	var ret_data = [];
	try {
		let data = fs.readFileSync(path, "utf8");
		var data_array = data.split("\n");
		// console.log("file length:", data_array.length);
		
		var all_num = 0;
		for(var i = 0; i < data_array.length; i++) {
			if(data_array[i] && i >= data_option.data_begin_row) {
				// console.log(i, data_array[i]);
				var raw_data = data_array[i].split(",");
				// console.log(raw_data.length, raw_data);
				for(var j = 0; j < raw_data.length; j++) {
					var col_data_index = data_option.data_index_col.indexOf(j);
					if(col_data_index != -1) {
						var ret_data_raw = 0;
						var ret_data_col = 0;
						if(data_option.data_struct == 'raw') {
							ret_data_raw = all_num;
							ret_data_col = col_data_index;
						}else if(data_option.data_struct == 'col') {
							ret_data_raw = col_data_index;
							ret_data_col = all_num;
						}
						if(!ret_data[ret_data_raw]) {
							ret_data[ret_data_raw] = [];
						}
						ret_data[ret_data_raw][ret_data_col] = Number(raw_data[j].replace(/\r/g, ""));
					}
				}
				all_num++;
			}
		}
		
		// console.log("all_num:", all_num);
		// console.log("ret_data:", ret_data);
	} catch(err) {
		console.log(err);
	}
	
	return ret_data;
};

global.mlt_get_average_sum_max_min = function(data) {
	return mlt_addon.get_average_sum_max_min(data);
};

global.mlt_get_var_sr = function(data, avg) {
	return mlt_addon.get_var_sr(data, avg);
};

global.mlt_get_norm_dist_box_muller = function(num, avg, sr) {
	var data_num = num / 2;
	var i = 0;
	var datas = [];
	while (i < data_num) {
		var ret = mlt_addon.get_r_norm_dist_box_muller(avg, sr);
		if(ret[0] || ret[1]){
			datas.push(ret[0]);
			datas.push(ret[1]);
			i++;
		}
	}
	
	return datas;
};

global.mlt_m_set_one = function(m) {
	return mlt_addon.m_set_one(m);
};

global.mlt_m_set_zero = function(m) {
	return mlt_addon.m_set_zero(m);
};

global.mlt_m_trans = function(m) {
	return mlt_addon.m_trans(m);
};

global.mlt_m_dot = function(m, n) {
	return mlt_addon.m_dot(m, n);
};

global.mlt_m_inv_gauss = function(m) {
	return mlt_addon.m_inv_gauss(m);
};

global.mlt_kalman_filter = function(datas, q, r, init_p, init_predict) {
	var kf_data = [];
	var curr = init_predict;
	var curr_p = init_p;
	for(var idx in datas){
		var ret = mlt_addon.kalman_filter(q, r, curr_p, curr, datas[idx]);
		if(!ret)
		{
			ret = [];
			ret[0] = undefined;
			ret[1] = undefined;
		}
		curr = ret[0];
		curr_p = ret[1];
		kf_data.push(curr);
	}

	return kf_data;
};

global.mlt_calc_formula = function(formula, i_var, i_var_val) {
	formula = formula.split(' ').join('');
	// console.log(formula);
	return mlt_addon.analytic_formula(formula, formula.length, i_var, i_var_val);
};

let mainWindow;

ipcMain.on("ping", (event, arg) => {
	var msg_array = arg.split('|');
	if(msg_array[0] == 'page_handle') {
		page_handle = event;
		try {
			mlt_addon = require('./addon/mathlabtool');
			// mlt_addon = require('D:/mathlabtool/addon/build/Release/mathlabtool');
		} catch (e) {
			page_handle.sender.send('pong', 'page_console_log|' + e.toString() + '\n');
		}
	} else if(msg_array[0] == 'get_dir') {
		if(msg_array[1] == 'MyComputer') {
			get_dir_root(event, msg_array[1]);
		} else {
			get_dir(event, msg_array[1]);
		}
	} else if(msg_array[0] == 'set_file') {
		set_file_write(event, msg_array[1], msg_array[2], 'set_file');
	} else if(msg_array[0] == 'run_file') {
		set_file_write(event, msg_array[1], msg_array[2], 'run_file');
	} else if(msg_array[0] == 'set_exist_file') {
		set_file_write(event, msg_array[1], msg_array[2], 'set_exist_file');
	} else if(msg_array[0] == 'draw_dim3') {
		// console.log("draw_dim3", msg_array);
		if(msg_array[1] == 'rotate') {
			draw_transform_graph_dim3(msg_array[2], msg_array[3], msg_array[4]);
		} else if(msg_array[1] == 'zoom') {
			draw_zoom_graph_dim3(msg_array[2], msg_array[3]);
		}
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
				delete require.cache[path_name];
				try {
					require(path_name);
				} catch (e) {
					console.log("run code:", e);
					// handle.reply('pong', 'save_file_tip|code_error|' + e.toString());
					handle.reply('pong', 'page_console_log|' + e.toString() + '\n');
				}
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