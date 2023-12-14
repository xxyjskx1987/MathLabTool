const mlt = require('./mathlabtool');

// console.log('p_ac argv', process.argv[2]);

process.on("message", function(msg) {
    console.log("[child get msg]:", msg);
	
	var param_obj = JSON.parse(msg);
	if(param_obj.func == 'auto_code') {
		var text_str = param_obj.params;
		var text_str_len = text_str ? Buffer.byteLength(text_str, 'utf8') : 0;
		var ret = mlt.auto_code(text_str, text_str_len);
		// console.log('auto_code ret:', ret);
		// var param = {
			// func: 'auto_code',
			// rets: ret
		// };
		// process.send(JSON.stringify(param));
	} else if(param_obj.func == 'clean_auto_code') {
		mlt.clean_auto_code();
	} else if(param_obj.func == 'get_word_train') {
		var text_str = param_obj.params;
		var text_str_len = text_str ? Buffer.byteLength(text_str, 'utf8') : 0;
		var ret = mlt.get_word_train(text_str, text_str_len, param_obj.num);
		
		var param = {
			func: 'get_word_train',
			rets: ret
		};
		process.send(JSON.stringify(param));
	} else if(param_obj.func == 'text_all_word_cnt') {
		var t1_len = param_obj.text1 ? Buffer.byteLength(param_obj.text1, 'utf8') : 0;
		var t2_len = param_obj.text2 ? Buffer.byteLength(param_obj.text2, 'utf8') : 0;
		
		mlt.get_all_cnt4text(param_obj.isfile, param_obj.text1, t1_len, param_obj.text2, t2_len);
	} else {
		mlt[param_obj.func]();
	}
});

global.mlt_process_ac_send = function(data) {
	var param = {
		func: 'auto_code',
		rets: data
	};
	process.send(JSON.stringify(param));
};

process.on("uncaughtException", function(code) {
	console.log(`ac process uncaughtException code ${code}`);
});

process.on("exit", function(code) {
	console.log(`ac process exit code ${code}`);
});

process.on("disconnect", function(code) {
	console.log(`ac process disconnect code ${code}`);
});

process.on("beforeExit", function(code) {
	console.log(`ac process beforeExit code ${code}`);
});
