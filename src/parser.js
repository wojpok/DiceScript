
const constants = require('./constants.js');
const tokenizer = require('./tokenizer.js');
const opconf    = require('./operators.js');


// endind predicates
function isClosingBracket(type, curr) {
    return type === constants.tokenConst.special && curr === ')';
}

function isSemicolon(type, curr) {
    return type === constants.tokenConst.special && curr === ';';
}

function isClosingSquareBracket(type, curr) {
    return type === constants.tokenConst.special && curr === ']';
}

function isComma(type, curr) {
    return type === constants.tokenConst.special && curr === ',';
}

function isClosingCurlyBracket(type, curr) {
    return type === constants.tokenConst.special && curr === '}';
}


function parse(sourceCode) {

    // object encapsulating token management
    let tokenIterator = {
        tokens: tokenizer.tokenize(sourceCode),
        iterId: -1,
        currToken: null, 
        tokenType: null,

        // step forward
        loadNext: function() {
            this.iterId++;
            if(this.iterId >= this.tokens.length) {
                throw "Unexpected end of code";
            }
            this.currToken = this.tokens[this.iterId][1];
            this.tokenType = this.tokens[this.iterId][0];
        },

        // step back
        loadPrev: function() {
            this.iterId--;
            if(this.iterId < 0) {
                this.iterId = 0;
            }
            this.currToken = this.tokens[this.iterId][1];
            this.tokenType = this.tokens[this.iterId][0];
        },

        // end pred
        finished: function() {
            return this.tokens.length <= (this.iterId + 1);
        }

    }

    // initialization
    tokenIterator.loadNext();

    //console.log(tokenIterator.tokens)

    /*
     *  Convention used here:
     *      (i) every parsing function assumes it starts where the iterator is left of
     *      (ii) every function moves pointer forward iff it is sure it is going to need next token
     *          and/or is going to call recursive parsing (ii) 
     * 
     *  We distinguish 3 recursive parsing functions:
     *      (i) valueParser - parses single value with unary operators - note that it might contain e.q. anchored funcion value
     *              then it might call recursively expParser and/or blockParser and return single expression
     *      (ii) expParser - parses single expression - grabs all operators and values (with unops) and composes an expression
     *      (iii) blockParser - parses an entire block of code (multiple expressions)
     */
    
    


    function recursiveExpParser(endPred = isSemicolon) {
        var expr = [];

        var tokenType = tokenIterator.tokenType;
        var currToken = tokenIterator.currToken;

        // special forms
        if(tokenType === constants.tokenConst.word) {
            switch(currToken) {
                case 'if':
                    tokenIterator.loadNext();
                    if(tokenIterator.currToken !== '(') {
                        throw 'Expected "(" after "if"';
                    }

                    tokenIterator.loadNext();
                    let ifPred = recursiveExpParser(isClosingBracket);

                    tokenIterator.loadNext();
                    if(tokenIterator.currToken !== '{') {
                        throw 'Expected "{" in "if" expression';
                    };

                    tokenIterator.loadNext();
                    let ifBlock = recursiveBlockParser(
                        isClosingCurlyBracket,
                        isSemicolon,
                        false,
                    );

                    let partialIf = {
                        type: constants.expConst.ifExp,
                        pred: ifPred,
                        code: encapsBlockExp( ifBlock ),
                        else: null,
                    }

                    if(tokenIterator.finished()) {
                        return partialIf;
                    }

                    tokenIterator.loadNext();
                    if(tokenIterator.currToken !== 'else') {
                        tokenIterator.loadPrev(); // convention

                        return partialIf;
                    }

                    tokenIterator.loadNext();
                    if(tokenIterator.currToken !== '{') {
                        throw 'Expected "{" in "else" expression';
                    };

                    tokenIterator.loadNext();
                    let elseBlock = recursiveBlockParser(
                        isClosingCurlyBracket,
                        isSemicolon,
                        false,
                    );

                    partialIf.else = {
                        type: constants.expConst.elseExp,
                        code: encapsBlockExp( elseBlock ),
                    }

                    return partialIf;

                case 'for':
                    tokenIterator.loadNext();
                    if(tokenIterator.currToken !== '(') {
                        throw 'Expected "(" after "for"';
                    }

                    tokenIterator.loadNext();
                    let initExp = recursiveExpParser(isSemicolon);

                    tokenIterator.loadNext();
                    let forPred = recursiveExpParser(isSemicolon);

                    tokenIterator.loadNext();
                    let forUpdate = recursiveExpParser(isClosingBracket);

                    tokenIterator.loadNext();
                    if(tokenIterator.currToken !== '{') {
                        throw 'Expected "{" in "for" expression';
                    };

                    tokenIterator.loadNext();
                    let codeBlockFor = recursiveBlockParser(
                        isClosingCurlyBracket,
                        isSemicolon,
                        false,
                    );
                    return {
                        type: constants.expConst.forExp,
                        init: initExp,
                        pred: forPred,
                        update: forUpdate,
                        code: encapsBlockExp( codeBlockFor ),
                    };

                case 'while':
                    tokenIterator.loadNext();
                    if(tokenIterator.currToken !== '(') {
                        throw 'Expected "(" after "while"';
                    }

                    tokenIterator.loadNext();
                    pred = recursiveExpParser(isClosingBracket);

                    tokenIterator.loadNext();
                    if(tokenIterator.currToken !== '{') {
                        throw 'Expected "{" in "while" expression';
                    };

                    tokenIterator.loadNext();
                    let codeBlockWhile = recursiveBlockParser(
                        isClosingCurlyBracket,
                        isSemicolon,
                        false,
                    );
                    return {
                        type: constants.expConst.whileExp,
                        pred: pred,
                        code: encapsBlockExp( codeBlockWhile ),
                    };
            
                case 'break':
                    tokenIterator.loadNext();
                    if(tokenIterator.currToken !== ';') {
                        throw 'break yourself bozo';
                    }
                    return {
                        type: constants.expConst.breakExp
                    };

                case 'continue':
                    tokenIterator.loadNext();
                    if(tokenIterator.currToken !== ';') {
                        throw 'invalida continue';
                    }
                    return {
                        type: constants.expConst.continueExp
                    };

                case 'return':
                    tokenIterator.loadNext();
                    let retExp = recursiveExpParser(isSemicolon);
                    return {
                        type: constants.expConst.returnExp,
                        exp: retExp,
                    };
            }
        }

        while(true) {
            var tokenType = tokenIterator.tokenType;
            var currToken = tokenIterator.currToken;

            // if reaching unexpected end - return empty expression
            if(endPred(tokenType, currToken)) {
                return { type: constants.expConst.emptyExp };
            }
        
            // get value
            expr.push(recursiveValueParser());

            tokenIterator.loadNext();

            tokenType = tokenIterator.tokenType;
            currToken = tokenIterator.currToken;
            
            // opening square or normal bracket -> array or function aplication -> the only right sided unary operands
            while(currToken === '[' || currToken === '(') {
                tokenIterator.loadNext();
                
                if(currToken == '[') {
                    let arrayExp = recursiveExpParser(isClosingSquareBracket);
                    expr[expr.length - 1] = {
                        type: constants.expConst.arrayApplyExp,
                        array: expr[expr.length - 1],
                        index: arrayExp,
                    };    
                }
                else {
                    let funcApplyExp = recursiveBlockParser(
                        isClosingBracket,
                        (a, b) => (isClosingBracket(a, b) || isComma(a, b))
                    );
                    expr[expr.length - 1] = {
                        type: constants.expConst.funcInvokeExp,
                        func: expr[expr.length - 1],
                        args: funcApplyExp,
                    };  
                }

                tokenIterator.loadNext();
                tokenType = tokenIterator.tokenType;
                currToken = tokenIterator.currToken;
            }

            // ending symbol
            if(endPred(tokenType, currToken)) {
                return rollOps( expr ); 
                // rollOps defined below - grabs collection of operators and 
                // values and composes single expression
            }
            // if operator, store it and continue
            else if(tokenType === constants.tokenConst.operand) {
                if(!(opconf.validBinops[currToken] ?? false)) {
                    throw `Unknown binary operator ${currToken}`;
                }
                expr.push(currToken);
            }

            tokenIterator.loadNext();
        }
    }

    // value parser
    function recursiveValueParser() {

        // useless code, afraid to delete it tho
        if(tokenIterator.iterId >= tokenIterator.tokens.length) {
            return { type: constants.expConst.emptyExp };
        }

        switch(tokenIterator.tokenType) {

            // if numeric type
            case constants.tokenConst.number:
            case constants.tokenConst.float:
                return {
                    type: constants.expConst.constExp,
                    value: {
                        type: constants.typeConst.number,
                        value: +(tokenIterator.currToken),
                    }
                };

            // if string type
            case constants.tokenConst.string:
                return {
                    type: constants.expConst.constExp,
                    value: {
                        type: constants.typeConst.string,
                        value: tokenIterator.currToken,
                    }
                };
            
            // if unop
            case constants.tokenConst.operand: 
                if(!(opconf.validUnops[tokenIterator.currToken] ?? false)) {
                    throw `Unknown unary operator ${tokenIterator.currToken}`;
                }
                let unaryOp = tokenIterator.currToken;
                tokenIterator.loadNext();
                
                return {
                    type: constants.expConst.unopExp,
                    op: unaryOp,
                    exp: recursiveValueParser(),
                }
            //if special
            case constants.tokenConst.special:

                // if opeining bracket, read expr until closing bracket
                if(tokenIterator.currToken == '(') {
                    tokenIterator.loadNext();
                    return recursiveExpParser(isClosingBracket);
                }
                if(tokenIterator.currToken == '[') {
                    tokenIterator.loadNext();

                    let res = (recursiveBlockParser(
                        isClosingSquareBracket,
                        (a, b) => (isClosingSquareBracket(a, b) || isComma(a, b)))
                    );

                    return {
                        type: constants.expConst.constExp,
                        value: {
                            type: constants.typeConst.array,
                            value: res,
                        }
                    }
                }
                throw `Invalid special token ${tokenIterator.currToken}`; 
            // word - multiple cases here ingluding true, false, ifs fors, varaibles and so on
            case constants.tokenConst.word:
                switch(tokenIterator.currToken) {
                    
                    case 'true':
                        case 'false': 
                        return {
                            type: constants.expConst.constExp,
                            value: {
                                type: constants.typeConst.bool,
                                value: tokenIterator.currToken === 'true',
                            }
                        }
                    case 'null':
                        return {
                            type: constants.expConst.constExp,
                            value: {
                                type: constants.typeConst.null,
                                value: null,
                            }
                        }
                    case 'func':
                        tokenIterator.loadNext();
                        if(tokenIterator.currToken !== '(') {
                            throw 'function';
                        }

                        let argsExp = [];

                        tokenIterator.loadNext();

                        while(tokenIterator.currToken !== ')') {
                            if(tokenIterator.tokenType !== constants.tokenConst.word) {
                                throw 'invalid func agrs';
                            }

                            argsExp.push(tokenIterator.currToken);

                            tokenIterator.loadNext();
                            if(tokenIterator.currToken === ',') {
                                tokenIterator.loadNext();
                                continue;
                            }

                            if(tokenIterator.currToken !== ')') {
                                throw 'invalid func args closing'
                            }
                            break;
                        }

                        tokenIterator.loadNext();
                        if(tokenIterator.currToken !== '{') {
                            throw 'Invalid function body';
                        }

                        tokenIterator.loadNext();
                        let funcBody = recursiveBlockParser(
                            isClosingCurlyBracket,
                            isSemicolon,
                            false,
                        );

                        return {
                            type: constants.expConst.constExp,
                            value: {
                                type: constants.typeConst.function,
                                args: argsExp,
                                code: encapsBlockExp( funcBody ),
                            }
                        };

                    case 'for':
                    case 'break':
                    case 'continue':
                    case 'if':
                    case 'else':
                    case 'while':
                    case 'return':
                        throw `invalid var name ${tokenIterator.currToken}`;
                    default:
                        return {
                            type: constants.expConst.varExp,
                            token: tokenIterator.currToken,
                        }
                }
        }
    }

    function encapsBlockExp(exps) {
        return {
            type: constants.expConst.blockExp,
            code: exps,
        }
    }

    function recursiveBlockParser(
        endPred = function() { return tokenIterator.finished(); }, 
        exprPred = isSemicolon,
        breakEarly = true,
    ) {
        var exps = [];

        while(!endPred(tokenIterator.tokenType, tokenIterator.currToken)) {
    
            exps.push(recursiveExpParser(exprPred));

            //console.log(`${tokenIterator.currToken} ${tokenIterator.iterId} ${breakEarly}`);

            if(breakEarly && endPred(tokenIterator.tokenType, tokenIterator.currToken)) {
                //console.log(`${tokenIterator.currToken} ${tokenIterator.iterId}`);
                //console.log('early')
                break;
            }
    
            tokenIterator.loadNext();

            //console.log('next');
        }

        //console.log(`${tokenIterator.currToken} ${tokenIterator.iterId}`);
        //console.log('lete')

        return exps;
    }

    
    return encapsBlockExp(recursiveBlockParser());
}

function rollOps(exps) {
    for(let level = opconf.binopPriority.maxLevel; level >= 0; level--) {
        if(exps.length === 1) {
            return exps[0];
        }

        let i = 1;
        let currLevel = opconf.binopPriority['p'+level];

        rebuilded = [];

        while(i < exps.length) {
            let op = exps[i];

            if(currLevel[op] ?? false) {
                nexp = {
                        type: constants.expConst.binopExp,
                        op: op,
                        lexp: exps[i - 1],
                        rexp: exps[i + 1],
                    };

                exps.splice(i - 1, 2)

                exps[i - 1] = nexp;
            }
            else {
                i += 2;
            }
        }
    }

    return exps[0];
}


module.exports = {
    parse: parse,
}