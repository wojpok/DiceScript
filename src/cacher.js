const fs = require('fs');
const { type } = require('os');
const { formatWithOptions } = require('util');
const parser = require('./parser.js');

String.prototype.hashCode = function() {
    var hash = 0, i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
      chr   = this.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  };

function load(filename) {

    try {
        mtime1 = fs.statSync(filename).mtime;
    }
    catch(e) {
        console.log(e);
        return null;
    }
    
    let hash = filename.hashCode();
    let cachedFile = './cache/'+hash+'.cache';
    let cacheExists = true;

    try{
        mtime2 = fs.statSync(cachedFile).mtime
    }
    catch(e) {
        // cached file does not exists
        cacheExists = false;
    }

    if(!cacheExists || mtime1 > mtime2) {

        try {
            var parsed =  parser.parse(fs.readFileSync(filename, { encoding: 'utf8' }));
        }
        catch(e) {
            console.log(e);
            return null;
        }


        fs.writeFileSync(
            cachedFile, 
            JSON.stringify(parsed, null, 2), 
            { 
                encoding: 'utf8', 
                flag: 'w+'
            }
        );

        //console.log('caching');
        return parsed;
    }


    //console.log('using cached file :)');
    return JSON.parse(fs.readFileSync(cachedFile, { encoding: 'utf8' }));
}

module.exports = {
    load: load,
}