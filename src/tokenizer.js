// This *really short and readable code* breaks DiceScript code into tokens which will be much easier to evaluate

const constants = require('./constants.js');

// regrets
const digitReg = /[0-9]/
const letterReg = /[a-zA-Z]/
const specialsReg = /[\[\]\(\)\{\},.;]/
const operandsReg =/[\=\+\-\*\<\>!|/#@$^]/
const whitesReg = /[\ \t\n]/

module.exports.regs = {
    digitReg: digitReg,
    letterReg: letterReg,
    specialsReg: specialsReg,
    operandsReg: operandsReg,
    whitesReg: whitesReg
}

// Tokenizer is DFA-like

// valid states
const WHITES    = constants.tokenConst.whites;
const DIGITS    = constants.tokenConst.number;
const WORDS     = constants.tokenConst.word;
const OPERAND   = constants.tokenConst.operand;
const FLOAT     = constants.tokenConst.float;
const SPECIAL   = constants.tokenConst.special;
const STRING    = constants.tokenConst.string;

module.exports.states = {
    WHITES: WHITES,
    DIGITS: DIGITS,
    WORDS: WORDS,
    OPERAND: OPERAND,
    FLOAT: FLOAT,
    SPECIAL: SPECIAL,
    STRING: STRING
}

const tokenName = ['WHITE', 'NUMBER', 'WORD', 'OPERAND', 'FLOAT', 'SPECIAL', 'STRING']

module.exports.tokenName = tokenName

function tokenize(code) {

    

    // neutral state
    state = WHITES

    // current token, for those concerned about complexity - this might be replaced with starting position 
    // of token and then extracted with substring function, too sophisticated for now
    acc = ''
    res = []


    for(i = 0; i < code.length; i++) {
        
        letter = code[i]

        if(letter == '"') {
            if(state == STRING) {
                res.push([state, acc])
                acc = ''
                state = WHITES
            }
            else {
                if(state != WHITES) {
                    res.push([state, acc])
                    acc = ''
                }
                
                state = STRING
            }

            continue
        }

        if(state == STRING) {
            acc += letter
            continue
        }

        // specials - one letter tokens
        if(letter.match(specialsReg)) {

            // dot might be indicting floating number
            if(letter == '.' && state == DIGITS) {
                state = FLOAT
                acc += '.'
                continue
            }
            
            // if acc is not empty, append it
            if(state != WHITES) {
                res.push([state, acc])
                acc = ''
            }

            // add letter
            res.push([SPECIAL, letter])
            state = WHITES

            continue
        }
        
        // white characters
        if(letter.match(whitesReg)) {

            // if entering white, save accumulator
            if(state != WHITES) {
                res.push([state, acc]);
                acc = '';
            }

            state = WHITES

            continue
        }

        // digits
        if(letter.match(digitReg)) {

            // if coming from operand, save it
            if(state == OPERAND) {
                res.push([state, acc]);
                acc = letter;
                state = DIGITS;
                continue;
            }

            // if whites - begin number
            if(state == WHITES) {
                state = DIGITS
                acc = ''
            }

            // add digit to WORD, NUMBER or FLOAT
            acc += letter
        }

        if(letter.match(letterReg)) {

            // Tokenization error, letter cannot follow number
            if(state == DIGITS || state == FLOAT) {
                throw 'Tokenize error'
            }

            // if operand, save it
            if(state == OPERAND) {
                res.push([state, acc]);
                acc = ''
            }

            state = WORDS
            acc += letter
        }

        // operand
        if(letter.match(operandsReg)) {

            // if comming from different state, save acc
            if(state != WHITES && state != OPERAND) {
                res.push([state, acc]);
                acc = '';
            }

            // build operand
            state = OPERAND;
            acc += letter
        }
    }

    // return results :)
    return res;
}

module.exports.tokenize = tokenize