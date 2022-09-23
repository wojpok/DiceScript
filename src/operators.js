const constants = require('./constants.js');

module.exports = {
    validBinops: {
        '+':    true,
        '-':    true,
        '*':    true,
        '/':    true,
        '%':    true,
        '**':   true,

        '=':    true,

        '==':   true,
        '<':    true,
        '>':    true,
        '<=':   true,
        '>=':   true,
        '<=>':  true,

        '&&':   true,
        '||':   true,
    },

    binopPriority: {
        maxLevel: 5,
        p0: {
            '=':    true,
        },
        p1: {
            '==':   true,
            '<':    true,
            '>':    true,
            '<=':   true,
            '>=':   true,
            '<=>':  true,
        },
        p2: {
            '&&':   true,
            '||':   true,
        },
        p3: {
            '+':    true,
            '-':    true,
        },
        p4: {
            '*':    true,
            '/':    true,
            '%':    true,
        },
        p5: {
            '**':   true,
        },
    },

    validUnops: {
        '-':    true,
        '!':    true,
        '!!':   true,
        '@':    true,
        '#':    true,
        '$':    true,
    }
}