//Only necessary if developper wants to use a local server to make changes.

var connect = require("connect");
var serveStatic = require("serve-static");

connect()
	.use(serveStatic(__dirname))
	.listen(8080, () => console.log("Server running on 8080..."));
