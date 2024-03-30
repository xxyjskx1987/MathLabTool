var i18nLanguage = "en";

var webLanguage = ['zh_CN', 'en'];
var tab_idx = 0;

function changeEasyuiLanguage(languageName) {
	var src = "jquery-easyui-1.10.8/locale/easyui-lang-" + 
			languageName + ".js";
	// console.log(src);
	$.getScript(src);
}

function changeI18nLanguage(languageName) {
	var src = "static/i18n/i18n-lang-" + 
			languageName + ".js";
	$.getScript(src, function() {
		load_i18n_data();
	});
}

function getWebLanguage() {
	if (localStorage.userLanguage) {
		i18nLanguage = localStorage.userLanguage;
		// console.log("language cookie is " + i18nLanguage);
	} else {
		return false;
	}
}

function event_load() {
	$('#mm_file').menu({
		onClick: function(item){
			if(item.id == 'html_new') {
				tab_idx++;
				$('#tt').tabs('add', {
					title: 'tab' + tab_idx,
					content: '<pre class="editor" id="editor' + tab_idx + '">' +
						'mlt_page_console_log("Hi Code!\\n");'+
						'</pre>',
					closable: true
				});
				code_editors['editor' + tab_idx] = ace.edit("editor" + tab_idx);
				code_editors['editor' + tab_idx].session.setMode("ace/mode/javascript");

				document.getElementById("editor" + tab_idx).style.height = (window.innerHeight - (50 + html_console_height + 35 + 24 +2)) + 'px';

			}
		}
	});
	
	$('#mm_language').menu({
		onClick: function(item){
			if(item.id == 'html_language_zh_CN') {
				i18nLanguage = 'zh_CN';
			} else if(item.id == 'html_language_en') {
				i18nLanguage = 'en';
			}
			// console.log(i18nLanguage);
			localStorage.userLanguage = i18nLanguage;
			set_language();
			
		}
	});
}

function setHeight() {
	var c = $('#root_container');
	var p = c.layout('panel','center');
	var oldHeight = p.panel('panel').outerHeight();
	p.panel('resize', {height:'auto'});
	var newHeight = p.panel('panel').outerHeight();
	c.layout('resize',{
		height: (c.height() + newHeight - oldHeight)
	});
}

function set_language() {
	changeEasyuiLanguage(i18nLanguage);
	changeI18nLanguage(i18nLanguage);
}

var isload = false;

const html_console_height = 150;

var code_editors = {};
code_editors['editor0'] = ace.edit("editor0");
// editor.setOptions ({
	// enableBasicAutocompletion: true,
	// enableSnippets: true,
	// enableLiveAutocompletion: true
// });
code_editors['editor0'].session.setMode("ace/mode/javascript");

// console.log(window.screen.height, window.innerHeight, window.outerHeight);
document.getElementById("editor0").style.height = (window.innerHeight - (50 + html_console_height + 35 + 24 +2)) + 'px';

window.addEventListener('resize', () => {
	for(var idx in code_editors){
		document.getElementById(idx).style.height = (window.innerHeight - (50 + html_console_height + 35 + 24 +2)) + 'px';
	}
	if(isload){
		setHeight();
	}
});

$(function() {
	$('#root_container').layout();
	setHeight();
	
	// load_i18n_data();
	getWebLanguage();
	set_language();
	
	event_load();
	
	isload = true;
});

var graph_index = 0;
var handle_graph_index = -1;

function reset_graph(param_graph_index, set_width, set_height) {
	param_graph_index = param_graph_index != null ? param_graph_index : handle_graph_index;
	var canvas = document.getElementById('canvas_' + param_graph_index);
	// var gl = canvas.getContext('webgl');
	// if(!gl) {
		// console.log('no support')
	// }
	canvas.width = set_width - 18;
	canvas.height = set_height - 44;
	var ctx = canvas.getContext('2d');
	if (ctx) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}
	
	// gl.viewport(0,0,canvas.clientWidth,canvas.clientHeight);
	// gl.clearColor(0.0,0.0,0.0,1.0);
	// gl.clear(gl.COLOR_BUFFER_BIT);
}

var canvas_mouse_obj = {};
function canvas_monitor(graph_index, set_width, set_height) {
	if(!canvas_mouse_obj[graph_index.toString()]) {
		canvas_mouse_obj[graph_index.toString()] = {};
		canvas_mouse_obj[graph_index.toString()]['mouse_status'] = false;
		canvas_mouse_obj[graph_index.toString()]['last_x'] = null;
		canvas_mouse_obj[graph_index.toString()]['last_y'] = null;
		canvas_mouse_obj[graph_index.toString()]['last_ts'] = null;
	}
	var canvas_obj = document.getElementById('canvas_' + graph_index);
	canvas_obj.addEventListener('mousewheel', (e) => {
		if(e.wheelDelta > 0 || e.detail < 0){
			// console.log('up');
			reset_graph(graph_index, set_width, set_height);
			ipcRenderer.send("ping", 'draw_dim3|zoom|' + 
							graph_index + '|plus');
		}else{
			// console.log('down');
			reset_graph(graph_index, set_width, set_height);
			ipcRenderer.send("ping", 'draw_dim3|zoom|' + 
							graph_index + '|minus');
		}
	});
	canvas_obj.addEventListener('keydown', (e) => {
		// console.log(`keyCode: ${e.keyCode}`);
		// +
		if(e.keyCode == 187) {
			reset_graph(graph_index, set_width, set_height);
			ipcRenderer.send("ping", 'draw_dim3|zoom|' + 
							graph_index + '|plus');
		} else if(e.keyCode == 189) {
			reset_graph(graph_index, set_width, set_height);
			ipcRenderer.send("ping", 'draw_dim3|zoom|' + 
							graph_index + '|minus');
		}
	});
	
	canvas_obj.addEventListener('mousedown', (e) => {
		handle_graph_index = graph_index;
		canvas_mouse_obj[graph_index.toString()]['mouse_status'] = true;
		canvas_mouse_obj[graph_index.toString()]['last_ts'] = new Date().getTime();
		// console.log('canvas mousedown');
		
		canvas_obj.focus();
	});
	canvas_obj.addEventListener('mouseup', (e) => {
		canvas_mouse_obj[graph_index.toString()]['mouse_status'] = false;
		canvas_mouse_obj[graph_index.toString()]['last_x'] = null;
		canvas_mouse_obj[graph_index.toString()]['last_y'] = null;
		canvas_mouse_obj[graph_index.toString()]['last_ts'] = null;
		// console.log('canvas mouseup');
	});
	canvas_obj.addEventListener('mousemove', (e) => {
		var ts = new Date().getTime();
		if(canvas_mouse_obj[graph_index.toString()]['mouse_status'] && 
		canvas_mouse_obj[graph_index.toString()]['last_ts'] != null && 
		ts - canvas_mouse_obj[graph_index.toString()]['last_ts'] >= 100 && 
		(e.clientY != canvas_mouse_obj[graph_index.toString()]['last_y'] || e.clientX != canvas_mouse_obj[graph_index.toString()]['last_x'])) {
			// console.log('canvas mousemove', e.clientX, e.clientY);
			if(canvas_mouse_obj[graph_index.toString()]['last_x'] != null && 
			canvas_mouse_obj[graph_index.toString()]['last_y'] != null) {
				reset_graph(graph_index, set_width, set_height);
				ipcRenderer.send("ping", 'draw_dim3|rotate|' + 
								graph_index + '|' + 
								(e.clientX - canvas_mouse_obj[graph_index.toString()]['last_x']) + '|' + 
								(e.clientY - canvas_mouse_obj[graph_index.toString()]['last_y']));
			}
			
			canvas_mouse_obj[graph_index.toString()]['last_x'] = e.clientX;
			canvas_mouse_obj[graph_index.toString()]['last_y'] = e.clientY;
			canvas_mouse_obj[graph_index.toString()]['last_ts'] = ts;
		}
	});
}

function handle_video_event(param_graph_index) {
	var canvas_obj = document.getElementById('canvas_' + param_graph_index);
	var video_obj = document.getElementById('video_' + param_graph_index);
	
	var cRect = canvas_obj.getBoundingClientRect(); 
	// video_obj.addEventListener('mousemove', (e) => {
		// console.log(e.clientX - cRect.left, e.clientY - cRect.top);
	// });
}

function handle_video_fps(param_graph_index, set_width, set_height) {
	if(is_pause) {
		return;
	}
	var canvas_obj = document.getElementById('dump_canvas_' + param_graph_index);
	if(!canvas_obj) {
		canvas_obj = document.createElement("canvas");
		canvas_obj.id = "dump_canvas_" + param_graph_index;
		canvas_obj.width = set_width - 18;
		canvas_obj.height = set_height - 44;
	}
	var video_obj = document.getElementById('video_' + param_graph_index);
	var ctx = canvas_obj.getContext('2d');
	ctx.drawImage(video_obj, 0, 0, set_width - 18, set_height - 44);
	var base64 = canvas_obj.toDataURL('image/png');
	// reset_graph(param_graph_index, set_width, set_height);
	// console.log(base64);
	ipcRenderer.send("ping", 'handle_video_fps|' + param_graph_index + '|' + base64);
}

function draw_img(param_graph_index, base64_data) {
	// console.log('draw_img', graph_index, base64_data);
	var dump_img = document.getElementById("dump_img_" + param_graph_index);
	if(!dump_img) {
		dump_img = document.createElement("img");
		dump_img.id = "dump_img_" + param_graph_index;
		dump_img.onload = function(){
			var canvas_obj = document.getElementById('canvas_' + param_graph_index);
			var ctx = canvas_obj.getContext('2d');
			// ctx.drawImage(test_img, 0, 0, 600 - 18, 400 - 44);
			// ctx.drawImage(dump_img, 0, 0, canvas_obj.width, canvas_obj.height);
			ctx.drawImage(dump_img, 0, 0, 250, 200);
		}
	}
	dump_img.src = base64_data;
	// console.log(base64_data, test_img);
}

var video_interval = null;
var is_pause = false;
function set_video(param_graph_index, set_width, set_height, file_path, interval_time) {
	var video_obj = document.getElementById('video_' + param_graph_index);
	video_obj.width = set_width - 18;
	video_obj.height = set_height - 44;
	video_obj.src = file_path;
	video_obj.addEventListener('play', function() {
        // console.log("play");
		is_pause = false;
		video_interval = setInterval(handle_video_fps, interval_time, param_graph_index, set_width, set_height);
    });
	video_obj.addEventListener('pause', function() {
        // console.log("pause");
		is_pause = true;
	});
	video_obj.addEventListener('ended', function() {
        // console.log("ended");
		clearInterval(video_interval);
	});
}

function show_video_window(title, set_width, set_height, file_path, interval_time) {
	set_width = (set_width != 'undefined' ? set_width : 400);
	set_height = (set_height != 'undefined' ? set_height : 300);
	var graph_obj = document.getElementById('html_graph_' + graph_index);
	if(!graph_obj) {
		$("body").append(
			'<div id="html_graph_' + graph_index + '">' + 
			'<canvas id="canvas_' + graph_index + '" style="position:absolute; z-index:1; pointer-events:none;"></canvas>' + 
			'<video id="video_' + graph_index + '" style="object-fit:fill;" autoplay="autoplay" controls="controls"></video>' + 
			'</div>'
		);
	}
	
	$('#html_graph_' + graph_index).window({
		width: set_width,
		height: set_height,
		title: title != 'undefined' ? title : 'graph_window',
		left: 45 + 40 * graph_index,
		top: 85 + 40 * graph_index,
		minimizable: false,
		modal: false,
		onResize: function(width, height) {
			// console.log(this.id);
			var id_array = this.id.split("_");
			// reset_graph(id_array[2]);
		}
	});
	reset_graph(graph_index, set_width, set_height);
	
	set_video(graph_index, set_width, set_height, file_path, interval_time);
	
	handle_video_event(graph_index);

	handle_graph_index = graph_index;
	graph_index++;
}

function show_graph_window(title, set_width, set_height, dim) {
	// console.log("show_graph_window", typeof set_width, set_height);
	set_width = (set_width != 'undefined' ? set_width : 400);
	set_height = (set_height != 'undefined' ? set_height : 300);
	// console.log("show_graph_window", set_width, set_height);
	var graph_obj = document.getElementById('html_graph_' + graph_index);
	if(!graph_obj) {
		$("body").append('<div id="html_graph_' + graph_index + '"><canvas id="canvas_' + graph_index + '" tabindex="0"></canvas></div>');
		if(dim == 3) {
			canvas_monitor(graph_index, set_width, set_height);
		}
	}
	
	$('#html_graph_' + graph_index).window({
		width: set_width,
		height: set_height,
		title: title != 'undefined' ? title : 'graph_window',
		left: 45 + 40 * graph_index,
		top: 85 + 40 * graph_index,
		minimizable: false,
		modal: false,
		onResize: function(width, height) {
			// console.log(this.id);
			var id_array = this.id.split("_");
			// reset_graph(id_array[2]);
		}
	});
	reset_graph(graph_index, set_width, set_height);

	handle_graph_index = graph_index;
	graph_index++;
}

function draw_line(start_x, start_y, end_x, end_y, color) {
	var canvas = document.getElementById('canvas_' + handle_graph_index);
	var ctx = canvas.getContext('2d');
	if (ctx) {
		ctx.lineWidth = 0.5;
		ctx.strokeStyle = color;
		ctx.beginPath();
		ctx.moveTo(start_x, start_y);
		ctx.lineTo(end_x, end_y);
		ctx.closePath();
		ctx.stroke();
	}
}

function draw_text(text_str, x, y) {
	var canvas = document.getElementById('canvas_' + handle_graph_index);
	var ctx = canvas.getContext('2d');
	if (ctx) {
		ctx.font = "normal normal 400 10px sans-serif";
		ctx.fillText(text_str, x, y);
	}
}

function draw_circle(start_x, start_y, radius, color, is_fill) {
	var canvas = document.getElementById('canvas_' + handle_graph_index);
	var ctx = canvas.getContext('2d');
	if (ctx) {
		if(Number(is_fill)) {
			ctx.fillStyle = color;
			ctx.beginPath();
			ctx.arc(start_x, start_y, radius, 0, 2 * Math.PI, false);
			ctx.closePath();
			ctx.fill();
		} else {
			ctx.lineWidth = 0.5;
			ctx.strokeStyle = color;
			ctx.beginPath();
			ctx.arc(start_x, start_y, radius, 0, 2 * Math.PI, false);
			ctx.closePath();
			ctx.stroke();
		}
	}
}

function load_i18n_data() {
	$('#html_file').menubutton({
		text: $.i18n['file']
	});
	$('#html_run').menubutton({
		text: $.i18n['run']
	});
	$('#html_about').menubutton({
		text: $.i18n['about']
	});
	// var file_item = $('#mm_file').menu('findItem', 'html_new');
	var file_new_itemEl = $('#html_new')[0];
	var file_new_item = $('#mm_file').menu('getItem', file_new_itemEl);
	$('#mm_file').menu('setText', {
		target: file_new_item.target,
		text: $.i18n['file_new']
	});
	var file_open_itemEl = $('#html_open')[0];
	var file_open_item = $('#mm_file').menu('getItem', file_open_itemEl);
	$('#mm_file').menu('setText', {
		target: file_open_item.target,
		text: $.i18n['file_open']
	});
	var file_save_itemEl = $('#html_save')[0];
	var file_save_item = $('#mm_file').menu('getItem', file_save_itemEl);
	$('#mm_file').menu('setText', {
		target: file_save_item.target,
		text: $.i18n['file_save']
	});
	var file_save_as_itemEl = $('#html_save_file')[0];
	var file_save_as_item = $('#mm_file').menu('getItem', file_save_as_itemEl);
	$('#mm_file').menu('setText', {
		target: file_save_as_item.target,
		text: $.i18n['file_save_as']
	});
	var run_run_itemEl = $('#html_sub_run')[0];
	var run_run_item = $('#mm_run').menu('getItem', run_run_itemEl);
	$('#mm_run').menu('setText', {
		target: run_run_item.target,
		text: $.i18n['run']
	});
	$('#page_console_log').panel('setTitle', $.i18n['console']);
	var east_panel = $('#root_container').layout('panel', 'east');
	east_panel.panel('setTitle', $.i18n['tools']);
	$('#ea_basic').panel('setTitle', $.i18n['ea_basic']);
	$('#ea_animation').panel('setTitle', $.i18n['ea_animation']);
	var save_dlg = $('#dlg_save_file').dialog();
	save_dlg.panel('setTitle', $.i18n['file_save_as']);
	$('#dialog_save_as_function_tip').html($.i18n['dialog_save_as_function_tip']);
	$('#dlg_save_as_td_file_name').html($.i18n['dlg_save_as_td_file_name']);
	$('#dlg_save_as_submit').linkbutton({text: $.i18n['file_save']});
	$('#console_clear_btn').linkbutton({text: $.i18n['console_clear_btn']});
	$('#chat_btn').linkbutton({text: $.i18n['chat_btn']});
	$('#animation_play').linkbutton({text: $.i18n['animation_play']});
	$('#animation_pause').linkbutton({text: $.i18n['animation_pause']});
	$('#animation_stop').linkbutton({text: $.i18n['animation_stop']});
	$('#play_frame').html($.i18n['play_frame']);
	$('#data_frame').html($.i18n['data_frame']);
}

const chatBody = document.querySelector(".chat-body");
const txtInput = document.querySelector("#txtInput");
const send = document.querySelector(".send");
send.addEventListener("click", () => renderUserMessage());
txtInput.addEventListener("keyup", (event) => {
	if (event.keyCode === 13) {
		renderUserMessage();
	}
});
const renderUserMessage = () => {
	const userInput = txtInput.value;

	renderMessageEle(userInput, "user");
	txtInput.value = "";
	setScrollPosition();
	
	chat_send(userInput);

};
const renderChatbotResponse = (userInput) => {
	const res = getChatbotResponse(userInput);
	renderMessageEle(res);
};
const renderMessageEle = (txt, type) => {
	let className = "user-message";
	if (type !== "user") {
		className = "chatbot-message";
	}
	const messageEle = document.createElement("div");
	const txtNode = document.createTextNode(txt);
	messageEle.classList.add(className);
	messageEle.append(txtNode);
	chatBody.append(messageEle);
};
const getChatbotResponse = (userInput) => {
	return userInput;
};
const setScrollPosition = () => {
	if (chatBody.scrollHeight > 0) {
		chatBody.scrollTop = chatBody.scrollHeight;
	}
};

function a_play() {
	// console.log('a_play');
	ipcRenderer.send("ping", 'a_play|' + 
					$('#play_frame_val').val() + '|' + 
					$('#data_frame_val').val());
}

function a_pause() {
	console.log('a_pause');
}

function a_stop() {
	console.log('a_stop');
}
