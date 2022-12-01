const path = require('path');

module.exports = {
  "packagerConfig": {
	"name": "MathLabTool",
	"icon": path.join(__dirname, "/public/icon/mathlabtool"),
	"asar": true,
	"overwrite": true
  },
  "makers": [
	{
	  "name": "@electron-forge/maker-squirrel",
	  "config": {
		"name": "MathLabTool",
		// "setupExe": "MathLabTool_setup.exe",
		// "setupMsi": "MathLabTool_setup.msi",
		// "noMsi": false
		// "setupIcon": path.join(__dirname, "/public/icon/mathlabtool.ico")
	  }
	},
	{
	  "name": "@electron-forge/maker-zip",
	  "platforms": [
		"darwin"
	  ]
	},
	{
	  "name": "@electron-forge/maker-deb",
	  "config": {}
	},
	{
	  "name": "@electron-forge/maker-rpm",
	  "config": {}
	}
  ]
}
