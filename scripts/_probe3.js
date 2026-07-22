const fs = require('fs');
fs.appendFileSync('/tmp/probe3.log', 'A\n');
const authMod = require('firebase/auth');
fs.appendFileSync('/tmp/probe3.log', 'B - keys: ' + Object.keys(authMod).length + '\n');
