var id = require('./src/parser.js');
var cacher = require('./src/cacher.js')
var ev = require('./src/evaluator.js');

script = `

print((main = func(a,) {
    return ([2, 4,])[a];
})(1));


`;

data = cacher.load('./examples/code2.txt');
try {
    
}
catch(e) {
    console.log(`Unhandled signal: ${e}`);
}

ev.evaluate(data);
