
tokenizer = require('./src/tokenizer.js')

class value {
    type
    value

    constructor(type, value) {
        this.type = type
        this.value = value
    }
}

class environNode {
    value
    name
    readOnly
    prev

    constructor(value, name, prev = null, readOnly = false) {
        this.value = value
        this.name = name
        this.prev = prev
        this.readOnly = readOnly
    }

    find(name) {
        if(this.name === name) {
            return this.value
        }

        if(this.prev === null) {
            return undefined
        }

        return this.prev.find(name);
    }

    saveAndReplace(name, value, readOnly = false) {
        if(name == this.name) {
            if(this.readOnly) {
                return false;
            }

            this.readOnly = readOnly;
            this.value = value;
            return true;
        }

        if(this.prev === null) {
            //console.log(name, value)
            return false;
        } 

        return this.prev.saveAndReplace(name, value, readOnly)
    }
}

class environManager {

    envPtr

    constructor(envPtr = null) {
        this.envPtr = envPtr
    }

    clone() {
        return new environManager(this.envPtr)
    }

    find(name) {
        return this.envPtr.find(name)
    }

    save(name, value, readOnly = false) {
        //console.log(this.envPtr)
        if(this.envPtr.saveAndReplace(name, value, readOnly)) {
            return;
        }
        
        this.envPtr = new environNode(value, name, this.envPtr);
    }

}

const emptyNode = new environNode(new value('', ''), '')

function assert(cond, fail = '') {

    if(!cond) {
        console.log('Assertion Failed with message: '+fail);
    }
}

/*
environ = new environManager(emptyNode)
console.log(environ)

environ.save('varA', 'value1')
environ.save('varB', 'value2')

assert(environ.find('varA') === 'value1', 'A1');
assert(environ.find('varB') === 'value2', 'A2');

environ.save('varE', 'value3');
environ.save('varC', 'value4');
environ.save('varE', 'value5');

branch = environ.clone();

environ.save('varF', 'value6');
environ.save('varA', 'value7');

assert(environ.find('varE') === 'value5', 'A3');
assert(environ.find('varC') === 'value4', 'A4');
assert(environ.find('varF') === 'value6', 'A5');
assert(environ.find('varA') === 'value7', 'A6');



assert(branch.find('varA') === 'value7', 'A7');
assert(branch.find('varF') === undefined, 'A8');


*/



class abstractExp {

    constructor() {}
    
    eval(environ) {
        return null;
    }

    prettyPrint() {
        return '';
    }
}

class assignExp /*extends abstractExp*/ {

    name
    exp

    constructor(name, exp) {
        this.name = name
        this.exp = exp
    }

    eval(environ) {
        let val = this.exp.eval(environ)
        environ.save(this.name, val)
        return val
    }

    prettyPrint() {
        return this.name + ' = '+ this.exp.prettyPrint();
    }
}


class constExp /*extends abstractExp*/ {

    value

    constructor(value) {
        this.value = value
    }

    eval(environ) {
        return this.value
    }

    prettyPrint() {
        return `(const: ${this.value.type} ${this.value.value})`;
    }
}

class operatorExp {

    op
    lex
    rex

    constructor(op, lex, rex) {
        this.op = op,
        this.lex = lex
        this.rex = rex
    }

    eval(environ) {
        return (this.matchOp())(this.lex.eval(environ), this.rex.eval(environ));
    }

    prettyPrint() {
        return `(${this.lex.prettyPrint()} ${this.op} ${this.rex.prettyPrint()})`;
    }

    matchOp() {
        
        switch(this.op) {
            case '+':
                return (v1, v2) => {
                    if(v1.type === 'string' && v2.type === 'string') {
                        return new value('string', v1.value + v2.value);
                    }

                    if(v1.type === 'number' && v2.type === 'number') {
                        return new value('number', v1.value + v2.value);
                    }

                    return new value('undef', undefined);
                }
            case '==':
                return (v1, v2) => {
                    return new value('bool', (v1.type === v2.type && v1.value === v2.value));
                }
            default:
                return () => { return new value('undef', undefined); }
        }

    }
}

class functionBody {


}

class ifExp {

    conds
    exps

    constructor(conds, exps) {
        this.exps = exps
        this.conds = conds
    }

    eval(environ) {

        let res = this.conds.eval(environ)

        if(res.type === 'bool' && res.value === true) {

            return this.exps[0].eval(environ);
        }

        if(this.exps.length === 2) {

            return this.exps[1].eval(environ);
        }
    }

    prettyPrint() {
        console.log(`if(${this.conds.prettyPrint()}) \n${this.exps[0].prettyPrint()}\n`);
        if(this.exps.length === 2) {
            console.log(`else \n${this.exps[1].prettyPrint()}\n`);
        }
    }
}

class blockExp {

    exps

    constructor(exps) {
        this.exps = exps
    }

    prettyPrint() {
        console.log('{')

        for(var exp of this.exps) {
            console.log(exp.prettyPrint())
        }

        console.log('}')
    }

    eval(environ) {
        let res = new value('undef', undefined)

        for(var exp of this.exps) {
            res = exp.eval(environ)
        }

        return res
    }
    
}

/*
expr = new assignExp('A', new assignExp('B', new constExp(new value('number', 5))));
expr2 = new operatorExp('==', 
    new operatorExp('+', new constExp(new value('number', 5)), new constExp(new value('number', 6))),
    new constExp(new value('number', 10)));


expr3 = new ifExp(new operatorExp('==', new constExp(new value('number', 6)), new constExp(new value('number', 5))),
[
    new blockExp([new assignExp('A', new constExp(new value('number', 2137)))]),
    new blockExp([new assignExp('B', new constExp(new value('number', 5)))]),
])

console.log(expr3.prettyPrint());
console.log(expr3.eval(new environManager(emptyNode)))*/


function parser(code) {

    tokens = tokenizer.tokenize(code)



    
}

