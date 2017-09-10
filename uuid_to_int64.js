const uuidv1 = require('uuid/v1');
var Int64 = require('node-int64');
var FlakeId = require('flake-idgen');
var flakeIdGen = new FlakeId();

//var Long = require('long');

const Long = require('cassandra-driver').types.Long;




console.log(Long.fromString(flakeIdGen.next().toString('hex'), true, 16).toString(10));
console.log(Long.fromString(flakeIdGen.next().toString('hex'), true, 16).toString(10));
console.log(Long.fromString(flakeIdGen.next().toString('hex'), true, 16).toString(10));
console.log(Long.fromString(flakeIdGen.next().toString('hex'), true, 16).toString(10));
console.log(Long.fromString(flakeIdGen.next().toString('hex'), true, 16).toString(10));
console.log(flakeIdGen.next());
console.log(flakeIdGen.next());
console.log(flakeIdGen.next());
console.log(flakeIdGen.next());
var myUUID = uuidv1();
var myUUID1 = uuidv1();
var myUUID2 = uuidv1();
var myUUID3 = uuidv1();
console.log(myUUID);
console.log(myUUID1);
console.log(myUUID2);
console.log(myUUID3);
hexString = myUUID.substring(19, 23) + myUUID.substring(24);
console.log(hexString);
console.log(parseInt(hexString, 16));

function myHexa(hexSource){
  hexMapping = {
    '0':0,
    '1':1,
    '2':2,
    '3':3,
    '4':4,
    '5':5,
    '6':6,
    '7':7,
    '8':8,
    '9':9,
    'a':10,
    'b':11,
    'c':12,
    'd':13,
    'e':14,
    'f':15
  }
  
  var result = Number(0);
  for(var i = 0; i < hexSource.length; i++){
    result += hexMapping[hexSource[i]] * Math.pow(16,(15-i));
  }
  
  return result;
  
}

console.log(myHexa(hexString));
