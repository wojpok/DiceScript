const readline = require( 'node:readline' );
const process = require('node:process');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.close();

module.exports = {
    read: function() {
        return  rl.question('');
    },
    close: function() {
        rl.close();
    }
}