const constants = require('./constants.js');

/**
 * @return {{save: function, lookup: function, clone: function}}
 */
function create() {

    return {

        ptr: {
            name: '#',
            value: null,
            next: null,
        },

        /**
         * 
         * @param {string} name 
         * @param {{type: string, value: any}} value 
         */
        save: function(name, value) {
            let ptr = this.ptr;
            while(ptr !== null) {
                
                //console.log(ptr)
                if(ptr.name === name) {
                    ptr.value = value;
                    return;
                }

                ptr = ptr.next;
            }

            this.push(name, value);
        },

        push: function(name, value) {
            ptr = this.ptr;
            
            this.ptr = {
                name: name,
                value: value,
                next: ptr,
            };
        },

        /**
         * 
         * @param {string} name 
         */
        lookup: function(name) {
            let ptr = this.ptr;

            while(ptr !== null) {
                
                if(ptr.name === name) {

                    let res = {};

                    // cloning value object, since any operation would change enviroment in an unexpected manner
                    Object.assign(res, ptr.value);

                    return res;
                    return {
                        type: ptr.value.type,
                        value: ptr.value.value,
                    };
                }

                ptr = ptr.next;
            }

            throw {
                type: constants.signalConst.errorSig,
                value: `Cannot find token: ${name}`,
            }
        },

        /**
         * @return {{save: function, lookup: function, clone: function}}
         */
        clone: function() {
            return {
                ptr:    this.ptr,
                clone:  this.clone,
                lookup: this.lookup,
                save:   this.save,
                push:   this.push,
                display:this.display,
            }
        },

        display: function() {
            let ptr = this.ptr;

            while(ptr !== null) {
                
                console.log(ptr.name)
                console.log(ptr.value)

                ptr = ptr.next;
            }

            return null;
        }
    }
}

module.exports = {

    create: create,
}