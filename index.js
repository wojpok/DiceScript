
tokenizer = require('./src/tokenizer.js')

code2 = " a = 21.37; "

var code = 
    "func eq(a, b, c) { return a == b and b == c; }; print gt(\"any woooord 7236762@!#!@#sdnashd@!#28731ncb       dhauhd2312\", 5.923184, 364);"


tokenizer.tokenize(code2).forEach(element => {
    [state, token] = element

    console.log(`Token: ${token} Type: ${tokenizer.tokenName[state]}`);
}); 

class con {

    value
    constructor(value) {
        this.value = value;
    }

    eval() {

        return this.value;
    }

    tostr() {
        return "" + this.value
    }
}


class op {

    left
    right

    constructor(left, right) {
        this.left = left;
        this.right = right;
    }

    eval() {

        return this.left.eval() + this.right.eval();
    }

    tostr() {
        return "(" + this.left.tostr()+"+"+this.right.tostr()+")"
    }
}

oper = new op(new op(new con(10), new con(5)), new con(5));

console.log(oper.eval())

console.log(oper.tostr())


person = {
    firstName: "John",
    lastName: "Doe",
    id: 5566,
    fullName: function() {
      return this.firstName + " " + this.lastName;
    }
  };


  console.log(person.fullName());


e = {
    l: {
        value: 5,
        ev: function() { return this.value; }
    },
    r: {
        value: 5,
        ev: function() { return this.value; }
    },
    ev: function() {
        return this.l.ev() + this.r.ev()
    }
}

console.log(e.ev())
