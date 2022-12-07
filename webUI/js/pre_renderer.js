const { ipcRenderer } = require('electron')

function save_as_click() {
	$('#html_save_as_error_tip').html('');
	var node = $('#tree_dir').tree('find', 'MyComputer');
	if(node) {
		var children = $('#tree_dir').tree('getChildren', node.target);
		// console.log('save_as_click', children);
		for(var val of children){
			if(val){
				$('#tree_dir').tree('remove', val.target);
			}
		}
	} else {
		$('#tree_dir').tree('append', {
			parent: null,
			data: {
				id: 'MyComputer',
				text: 'MyComputer',
				state: 'open'
			}
		});
	}
	ipcRenderer.send("ping", 'get_dir|MyComputer');
	$('#dlg_save_file').dialog('open');
}

function save_click() {
	var tab = $('#tt').tabs('getSelected');
	var index = $('#tt').tabs('getTabIndex', tab);
	if(code_editors['editor' + index].mlt_full_path) {
		ipcRenderer.send("ping", 'set_exist_file|' + 
			code_editors['editor' + index].mlt_full_path + '|' + 
			code_editors['editor' + index].getValue());
	} else {
		save_as_click();
	}
}

function save_as_submit() {
	var tree_dir_selected = $('#tree_dir').tree('getSelected');
	var tree_dir_file_name = $('#html_save_as_file_name').val();
	var error_tip = '';
	if(!tree_dir_selected) {
		error_tip += $.i18n['dlg_save_as_error_tip_tree_require'];
	}
	if(!tree_dir_file_name) {
		error_tip += $.i18n['dlg_save_as_error_tip_file_name_require'];
	}
	if(!error_tip) {
		$('#html_save_as_error_tip').html('');
		var tab = $('#tt').tabs('getSelected');
		var index = $('#tt').tabs('getTabIndex', tab);
		// console.log('save_as_submit', tree_dir_selected.id);
		ipcRenderer.send("ping", 'set_file|' + 
			tree_dir_selected.id + '\\' + 
			tree_dir_file_name + '.js' + '|' + 
			code_editors['editor' + index].getValue());
	} else {
		$('#html_save_as_error_tip').html(error_tip);
	}
}

window.addEventListener('DOMContentLoaded', () => {
	ipcRenderer.send("ping", 'page_handle');
	
	$('#tree_dir').tree({
		onExpand: function(node) {
			// console.log(node.text);
			// var parent_node = $('#tree_dir').tree('getParent', node.target);
			
			var children = $('#tree_dir').tree('getChildren', node.target);
			for(var val of children){
				if(val){
					// console.log(val.text);
					$('#tree_dir').tree('remove', val.target);
				}
			}
			
			if(node.text != 'MyComputer') {
				ipcRenderer.send("ping", 'get_dir|' + node.id);
			} else {
				ipcRenderer.send("ping", 'get_dir|MyComputer');
			}
			// return true;
		}
	});

	ipcRenderer.on("pong", (event, message) => {
		var msg_array = message.split('|');
		if(msg_array[0] == 'set_dir'){
			var node = $('#tree_dir').tree('find', msg_array[1]);
			$('#tree_dir').tree('append', {
				parent: node.target,
				data: JSON.parse(msg_array[2])
			});
			// console.log('pong', message);
		} else if(msg_array[0] == 'save_file_tip') {
			if(msg_array[1] == 'success') {
				$('#html_save_as_error_tip').html($.i18n['save_success']);
				
				var tree_dir_selected = $('#tree_dir').tree('getSelected');
				var tree_dir_file_name = $('#html_save_as_file_name').val();
				
				var tab = $('#tt').tabs('getSelected');
				var index = $('#tt').tabs('getTabIndex', tab);
				// $('#tt').tabs('close', index);
				$('#tt').tabs('update', {
					tab: tab,
					options: {
						title: tree_dir_file_name + '.js'
					}
				});
				// console.log(index);
				var code_str = code_editors['editor' + index].getValue();
				// code_editors['editor' + index].destroy();
				// code_editors['editor' + index].container.remove();
				code_editors['editor' + index] = ace.edit("editor" + index);
				code_editors['editor' + index].session.setMode("ace/mode/javascript");
				code_editors['editor' + index].setValue(code_str);
				code_editors['editor' + index].mlt_full_path = tree_dir_selected.id + '\\' + 
															   tree_dir_file_name + '.js';
				document.getElementById("editor" + index).style.height = (window.innerHeight - (50 + html_console_height + 35 + 24 +2)) + 'px';

			} else if(msg_array[1] == 'code_error') {
				$('#page_console_log').append(msg_array[2].replace('\n', '<br />'));
			} else {
				$('#html_save_as_error_tip').html($.i18n['save_error']);
			}
		} else if(msg_array[0] == 'page_console_log') {
			// console.log('page_console_log', msg_array[1].replace('\n', '<br>'));
			// $('#page_console_log').html($('#page_console_log').html() + msg_array[1].replace('\n', '<br />'));
			$('#page_console_log').append(msg_array[1].replace('\n', '<br />'));
		} else if(msg_array[0] == 'draw_graph') {
			show_graph_window('draw_graph');
		}
	});
});

function file_open_click() {
	var inputObj = document.getElementById('input_file_open');
	if(!inputObj) {
		inputObj = document.createElement('input');
		inputObj.setAttribute('id', 'input_file_open');
		inputObj.setAttribute('type', 'file');
		inputObj.setAttribute("style", 'display:none');
		inputObj.onchange = function(e) { 
			// console.log(this.files[0], this.files[0].name, this.files[0].path);
			var file_name = this.files[0].name;
			var full_path = this.files[0].path;
			var reader = new FileReader();
			reader.readAsText(this.files[0]);
			reader.onload = function(e) {
				// console.log(this.result);
				tab_idx++;
				$('#tt').tabs('add', {
					title: file_name,
					content: '<pre class="editor" id="editor' + tab_idx + '"></pre>',
					closable: true
				});
				code_editors['editor' + tab_idx] = ace.edit("editor" + tab_idx);
				code_editors['editor' + tab_idx].session.setMode("ace/mode/javascript");
				code_editors['editor' + tab_idx].setValue(this.result);
				code_editors['editor' + tab_idx].mlt_full_path = full_path;
				document.getElementById("editor" + tab_idx).style.height = (window.innerHeight - (50 + html_console_height + 35 + 24 +2)) + 'px';
			}
		};
		document.body.appendChild(inputObj);
	}
	inputObj.click();
}

function run_click() {
	var tab = $('#tt').tabs('getSelected');
	var index = $('#tt').tabs('getTabIndex', tab);
	if(code_editors['editor' + index].mlt_full_path) {
		graph_index = 0;
		ipcRenderer.send("ping", 'run_file|' + 
			code_editors['editor' + index].mlt_full_path + '|' + 
			code_editors['editor' + index].getValue());
	} else {
		// console.log('please save');
		save_as_click();
	}
}