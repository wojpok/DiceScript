const constants     = require('./constants.js');
const contants      = require('./constants.js');
const envManager    = require('./enviromentaror.js');
const operators     = require('./operators.js');
const reader        = require('./inputReader.js');

function evaluate(code) {
    let res = evaluateRec(code, initEnviron());
    reader.close();
    return res;
}

function evaluateRec(code, environ) {

    switch(code.type) {
        case contants.expConst.constExp:

            if(isFunction(code.value)) {
                let res = {};
                Object.assign(res, code.value);
                res.environ = environ.clone();

                return res;
            }

            if(code.value.type !== constants.typeConst.array)
                return code.value;

            let arrayRes = code.value.value.map((_) => {
                return evaluateRec(_, environ);
            });

            return {
                type: constants.typeConst.array,
                value: arrayRes,
            }

        case contants.expConst.emptyExp:
            return { type: contants.typeConst.void, }

        case contants.expConst.varExp:
            return environ.lookup(code.token);

        case contants.expConst.blockExp:

            for(var expr of code.code) {
                evaluateRec(expr, environ)
            };
            return emptyValue;

        case contants.expConst.unopExp:
            return unaryOperators(code.op, code.exp, environ);

        case contants.expConst.binopExp:
            return binaryOperator(code.op, code.lexp, code.rexp, environ);

        case contants.expConst.ifExp:
            let ifPredValue = evaluateRec(code.pred, environ);
            if(isValuePositive(ifPredValue)) {
                return evaluateRec(code.code, environ);
            }
            if(code.else !== null) {
                return evaluateRec(code.else, environ);
            }
            return emptyValue;

        case contants.expConst.elseExp:
            return evaluateRec(code.code, environ);

        case contants.expConst.forExp:
            //console.log(code);
            evaluateRec(code.init, environ);

            while(isValuePositive( evaluateRec( code.pred, environ ) ) ) {
                try {
                    evaluateRec(code.code, environ);
                    evaluateRec(code.update, environ);
                }
                catch(e) {
                    if(e.type === constants.signalConst.breakSig) {
                        return emptyValue;
                    }
                    if(e.type !== constants.signalConst.continueSig) {
                        throw e;
                    }
                    evaluateRec(code.update, environ);
                }
            }
            return emptyValue;

        case contants.expConst.whileExp:
            while(isValuePositive( evaluateRec( code.pred, environ ) ) ) {
                try {
                    evaluateRec(code.code, environ);
                    
                }
                catch(e) {
                    if(e.type === constants.signalConst.breakSig) {
                        return emptyValue;
                    }
                    if(e.type !== constants.signalConst.continueSig) {
                        throw e;
                    }
                }
            }
            return emptyValue;
            
        case contants.expConst.breakExp:
            throw {
                type: constants.signalConst.breakSig,
            }

        case contants.expConst.returnExp:
            let retVal = evaluateRec(code.exp, environ);

            throw {
                type: constants.signalConst.returnSig,
                value: retVal,
            }

        case contants.expConst.continueExp:
            throw { type: constants.signalConst.continueSig, };

        case contants.expConst.arrayApplyExp:
            let arrayValue = evaluateRec(code.array, environ);
            let arrayIndex = evaluateRec(code.index, environ);

            if(arrayValue.type === constants.typeConst.array) {
                return arrayValue.value[arrayIndex.value];
            }

            return emptyValue;

        case contants.expConst.funcInvokeExp:

            let func = evaluateRec(code.func, environ);
            let args = code.args.map((_) => {
                return evaluateRec(_, environ);
            });

            if(func.type === constants.typeConst.builtin) {
                return func.value(...args);
            }
            else if(func.type === constants.typeConst.function) {

                let newEnv = func.environ.clone();

                newEnv.push('self', func);
                for(i = 0; i < func.args.length; i++) {
                    newEnv.push(func.args[i], args[i]);
                }

                try {
                    return evaluateRec(func.code, newEnv);
                }
                catch(e) {
                    if(e.type === constants.signalConst.returnSig) {
                        return e.value;
                    }
                    throw e;
                }
            }

            throw `Cannot apply function to ${func.type}`;

        default:
            throw `Unknown type: ${code.type}`;
    }
}

module.exports = {
    evaluate: evaluate,
}

const emptyValue = { type: constants.typeConst.void ,}

function isValuePositive(value) {
    return !isValueNegative(value);
}

function isValueNegative(value) {
    switch(value.type) {
        case constants.typeConst.array:
            return value.value === 0;
        case constants.typeConst.bool:
            return value.value === false;
        case constants.typeConst.builtin:
        case constants.typeConst.function:
            return false;
        case constants.typeConst.null:
        case constants.typeConst.void:
            return true;
        case constants.typeConst.string:
            return value.value === "";
        case constants.typeConst.number:
            return value.value === 0;
        default:
            return true;
    }
}

function binaryOperator(operator, lexp, rexp, environ) {
    let rval, lval;

    function ev() {
        lval = evaluateRec(lexp, environ);
        rval = evaluateRec(rexp, environ);
    }

    switch(operator) {
        case '+':  
            ev();

            if(lval.type === constants.typeConst.number && rval.type === constants.typeConst.number) {
                return createNumber(lval.value + rval.value);
            }

            if(isString(lval) && isString(rval)) {
                return createString(lval.value + rval.value);
            }

            return emptyValue;

        case '-':
            ev();

            if(isNumber(lval) && isNumber(rval)) {
                return createNumber(lval.value - rval.value);
            }

            return emptyValue;

        case '*':    true;
            ev();

            if(isNumber(lval) && isNumber(rval)) {
                return createNumber(lval.value * rval.value);
            }

            return emptyValue;

        case '/':  
            ev();

            if(isNumber(lval) && isNumber(rval)) {
                return createNumber(lval.value / rval.value);
            }

            return emptyValue;

        case '%':    
            ev();

            if(isNumber(lval) && isNumber(rval)) {
                return createNumber(lval.value % rval.value);
            }

            return emptyValue;

        case '**':  
            ev();

            if(isNumber(lval) && isNumber(rval)) {
                return createNumber( Math.pow( lval.value, rval.value ));
            }

            return emptyValue;

        case '=': 
            if(lexp.type === constants.expConst.varExp) {
                
                let val = evaluateRec(rexp, environ);
                environ.save(lexp.token, val);

                //environ.display();

                return val;
            }
            else if(lexp.type === constants.expConst.arrayApplyExp) {
                let val = evaluateRec(rexp, environ);
                let arr = evaluateRec(lexp.array, environ);
                let index = evaluateRec(lexp.index, environ);
                
                if(!isNumber(index)) {
                    throw "up";
                }

                arr.value[index.value] = val;

                return val;
            }
            else {
                throw `Cannot assign value to a-non variable!`;
            }

        case '==': ev();
            if(lval.type !== rval.type) {
                return createBool(false);
            }

            switch(lval.type) {
                case constants.typeConst.array:
                    return createBool(lval.value === rval.value);
                case constants.typeConst.bool:
                    return createBool(lval.value === rval.value);
                case constants.typeConst.builtin:
                case constants.typeConst.function:
                    return createBool(false);
                case constants.typeConst.null:
                case constants.typeConst.void:
                    return createBool(true);
                case constants.typeConst.string:
                case constants.typeConst.number:
                    return createBool(rval.value === lval.value);
                default:
                    return createBool(false);
            }
        case '<': ev();
            if((lval.type === constants.typeConst.number && rval.type === constants.typeConst.number)
                || (isString(lval && isString(rval)))) {
                return {
                    type: constants.typeConst.bool,
                    value: lval.value < rval.value,
                }
            }
            return {
                type: constants.typeConst.bool,
                value: false,
            }
        case '>': ev();
            if((lval.type === constants.typeConst.number && rval.type === constants.typeConst.number)
                || (isString(lval && isString(rval)))) {
                return {
                    type: constants.typeConst.bool,
                    value: lval.value > rval.value,
                }
            }
            return {
                type: constants.typeConst.bool,
                value: false,
            }
        case '<=': ev();
            if((lval.type === constants.typeConst.number && rval.type === constants.typeConst.number)
                || (isString(lval && isString(rval)))) {
                return {
                    type: constants.typeConst.bool,
                    value: lval.value <= rval.value,
                }
            }
            return {
                type: constants.typeConst.bool,
                value: false,
            }
        case '>=': ev();
            if((lval.type === constants.typeConst.number && rval.type === constants.typeConst.number)
                || (isString(lval && isString(rval)))) {
                return {
                    type: constants.typeConst.bool,
                    value: lval.value >= rval.value,
                }
            }
            return {
                type: constants.typeConst.bool,
                value: false,
            }
        case '<=>':  ev();
            if((lval.type === constants.typeConst.number && rval.type === constants.typeConst.number)
            || (isString(lval && isString(rval)))) {
                return {
                    type: constants.typeConst.number,
                    value: lval.value === rval.value ? 0 : lval.value > rval.value ? -1 : 1,
                }
            }
            return {
                type: constants.typeConst.bool,
                value: false,
            }

        case '&&':   ev();
            return createBool(isValuePositive(lval) && isValuePositive(rval));
        case '||':   ev();
            return createBool(isValuePositive(lval) || isValuePositive(rval));
        
        default:
            throw `Unknown operator: ${operator}`;
    }
}

function unaryOperators(operator, exp, environ) {
    switch(operator) {
        case '-':    

            let val = evaluateRec(exp, environ);

            if(val.type === constants.typeConst.number) {
                let nval = {
                    type: constants.typeConst.number,
                    value: -val.value,
                }
                
                return nval;
            }

            return val;

        case '!':    
            return createBool(isValueNegative(evaluateRec(exp, environ)));
        case '!!':   
            return createBool(isValuePositive(evaluateRec(exp, environ)));
        case '@': 
            let randVal = evaluateRec(exp, environ);

            function random(max) {
                return Math.floor(Math.random()*max)
            }

            if(isArray(randVal) || isString(randVal)) {
                randVal = randVal.value[random(randVal.value.length)];
                res = {};
                Object.assign(res, randVal);
                return res;
            }

            if(isNumber(randVal)) {
                return createNumber(random(randVal.value) + 1);
            }

            return emptyValue;

        case '#': 
            let vall = evaluateRec(exp, environ);

            switch(vall.type) {
                case constants.typeConst.array:
                    return createNumber(vall.value.length);
                case constants.typeConst.bool:
                    return createNumber(vall.value ? 1 : 0);
                case constants.typeConst.builtin:
                case constants.typeConst.function:
                case constants.typeConst.null:
                case constants.typeConst.void:
                    return createNumber(0);
                case constants.typeConst.string:
                case constants.typeConst.number:
                    return createNumber(+vall.value);
                default:
                    return createNumber(0);
            };
        case '$': 
            let valll = evaluateRec(exp, environ);

            switch(valll.type) {
                case constants.typeConst.array:
                    return createString('array');
                case constants.typeConst.bool:
                    return createString(valll.value ? 'true' : 'false');
                case constants.typeConst.builtin:
                case constants.typeConst.function:
                    return createString('function');
                case constants.typeConst.null:
                    return createString('null');
                case constants.typeConst.void:
                    return createString('void');
                case constants.typeConst.string:
                case constants.typeConst.number:
                    return createString(''+valll.value);
                default:
                    return createString(0);
            };
        default:
            throw `Unknown unary operator ${operator}`;
    }
}

function initEnviron() {

    let env = envManager.create();

    env.push('debug', {
            type: constants.typeConst.builtin,
            value: function(arg) {
                console.log(`Print: (type: ${arg.type}) (value: ${arg.value})`);
            }
    });

    env.push('print', {
        type: constants.typeConst.builtin,
        value: function(arg) {
            console.log(`${arg.value}`);
        }
    });

    env.push('arrayPush', {
        type: constants.typeConst.builtin,
        value: function(arr, value) {
            if(isArray(arr)) {
                arr.value.push(value);
            }
            return emptyValue;
        }
    });

    env.push('readline', {
        type: constants.typeConst.builtin,
        value: function() {
            return createString(reader.read());
        }
    });

    env.push('len', {
        type: constants.typeConst.builtin,
        value: function(arg) {
            if(arg.type === constants.typeConst.array || arg.type === constants.typeConst.string) {
                return {
                    type: constants.typeConst.number,
                    value: arg.value.length,
                }
            }

            return emptyValue;
        }
    });

    env.push('langInfo', {
        type: constants.typeConst.string,
        value: `SimpleScript version: ${constants.metaData.version}`,
    });


    return env;
}

function isNumber(value) {
    return value.type === constants.typeConst.number;
}

function isString(value) {
    return value.type === constants.typeConst.string;
}

function isArray(value) {
    return value.type === constants.typeConst.array;
}

function isBool(value) {
    return value.type === constants.typeConst.bool;
}

function isNull(value) {
    return value.type === constants.typeConst.null;
}

function isVoid(value) {
    return value.type === constants.typeConst.void;
}

function isFunction(value) {
    return value.type === constants.typeConst.function || value.type === constants.typeConst.builtin;
}

function createNumber(value) {
    return {
        type: constants.typeConst.number,
        value: value,
    };
}

function createString(value) {
    return {
        type: constants.typeConst.string,
        value: value,
    };
}

function createBool(value) {
    return {
        type: constants.typeConst.bool,
        value: value,
    };
}

function createArray(value) {
    return {
        type: constants.typeConst.array,
        value: value,
    };
}

function createNull() {
    return {
        type: constants.typeConst.null,
    };
}

function createVoid(value) {
    return emptyValue;
}

function createFunction(args, code) {
    return {
        type: constants.typeConst.function,
        args: args,
        code: code,
    };
}




