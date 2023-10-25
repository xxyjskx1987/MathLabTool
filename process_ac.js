const mlt = require('./addon/mathlabtool');

// console.log(process.argv);

process.on("message", function(msg) {
    console.log("[child get msg]:", msg);
	
	var param_obj = JSON.parse(msg);
	if(param_obj.func == 'auto_code') {
		var text_str = param_obj.params;
		var text_str_len = text_str ? Buffer.byteLength(text_str, 'utf8') : 0;
		var ret = mlt.auto_code(text_str, text_str_len);
		// console.log('auto_code ret:', ret);
		var param = {
			func: 'auto_code',
			rets: ret
		};
		process.send(JSON.stringify(param));
	}
});

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
