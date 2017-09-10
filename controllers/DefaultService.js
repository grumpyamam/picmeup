'use strict';

var util = require("util");
var jimp = require('jimp');
var cassandra = require('cassandra-driver');
var cassandraConf = require("../config/cassandra-local-config");
var cacheConf = require("../config/cache-config");
const Long = require('cassandra-driver').types.Long;
var FlakeId = require('flake-idgen');
var flakeIdGen = new FlakeId();
var NodeCache = require( "node-cache" );
const myCache = new NodeCache(cacheConf);



const authProvider = new cassandra.auth.PlainTextAuthProvider(cassandraConf.user, cassandraConf.password);

var client = new cassandra.Client({ contactPoints: cassandraConf.contactPoints, keyspace: cassandraConf.keyspace, authProvider: authProvider });


exports.deleteImage = function(args, res, next) {
  /**
   * parameters expected in the args:
  * id (Long)
  **/
  // no response value expected for this operation
  console.log("deleting image ..." + util.inspect(args.id.value, false, null));
  
    //cassandra start

  const query = 'delete from image_store where image_id = ?';
  client.execute(query, [ args.id.value ], {prepare:true}, function (err,result){ 
    if(err){
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 500;
      res.end('{"error": "cassandra cql error '+ err +'"}');
    }else{
      res.end();
    }
  });
  //cassandra end
  
  
}

exports.getImage = function(args, res, next) {
  /**
   * parameters expected in the args:
  * id (Long)
  **/
  console.log("getting image ..." + util.inspect(args.id.value , false, null));
  
    //cassandra start
  const query = 'select image_name as name, image_width as width, image_id as id, image_height as height from image_store where image_id = ?';
  client.execute(query, [ Long.fromString(args.id.originalValue) ], {prepare:true}, function (err,result){ 
    if(err){
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 500;
      res.end('{"error": "cassandra cql error '+ err +'"}');
    }else{
      if(typeof result.rows[0] !== 'undefined' && result.rows[0] !== null){
        console.log("pic found, name: " + result.rows[0].name);
        //console.log(result.rows[0].image);
        //console.log("this is my res : " + res[0] + res[1]);
        var currentImageName = result.rows[0].name;

        res.setHeader("Content-Type", "application/json");
        //res.write();
        var myResponse = {
          "name" : result.rows[0].name,
          "width" : result.rows[0].width,
          "id" : result.rows[0].id,
          "url" : res.originalHostUrl + "/img_store/" + result.rows[0].id,
          "height" : result.rows[0].height
        };
        res.end(JSON.stringify(myResponse || {}, null, 2));
        
        //next();
      }else{
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 404;
        res.end('{"error": "Image not found"}');
      }

    }
  });
  //cassandra end
  
  
  /*  var examples = {};
  examples['application/json'] = {
  "name" : "image",
  "width" : 640,
  "id" : 1,
  "url" : "http://example.com/image-640x480.png",
  "height" : 480
};



  if(Object.keys(examples).length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
  }
  else {
    res.end();
  }*/
  
}

exports.listImages = function(args, res, next) {
  /**
   * parameters expected in the args:
  **/
  
  console.log("listing images ..." + "paging size : " + args.page_size.value + ", page num : " + args.page_num.value);
  
  //cassandra start
  var pageCount = 0;
  var isPagination = (args.page_size.value !== null && args.page_size.value>0 ? true: false);
  var listResult = [];
  res.setHeader("Content-Type", "application/json");
  const query = 'select image_name as name, image_width as width, image_id as id, image_height as height from image_store';
  client.eachRow(query, [], isPagination ? { prepare: true, fetchSize : args.page_size.value } : {prepare:true, autoPage : true}, function(n, row) {
   // Invoked per each row in all the pages
     //console.log("current row . N: " + util.inspect(n , false, null));
     //console.log("current row . row: " + util.inspect(row , false, null));
     //console.log("is it in the requested page ..." + (pageCount === args.page_num.value));
     //console.log("is it in the requested page ..." + pageCount + "," + args.page_num.value) ;
     if(pageCount === args.page_num.value){
       listResult.push({
        "name" : row.name,
        "width" : row.width,
        "id" : row.id,
        "url" : res.originalHostUrl + "/img_store/" + row.id,
        "height" : row.height
      });
     }
  }, function (err, result) {
    if(err){
      res.statusCode = 500;
      res.end('{"error": "cassandra cql error '+ err +'"}');
    }else{
       // Called once the page has been retrieved.
       console.log("current page count " + pageCount);
       if(pageCount === args.page_num.value){
           res.end(JSON.stringify(listResult || {}, null, 2));
       }else{
         if (result.nextPage) {
           // Retrieve the following pages:
           // the same row handler from above will be used
           pageCount++;
           result.nextPage();
         }else{
           
           res.end(JSON.stringify(listResult || {}, null, 2));
         }
       }
    }
  });
  /*client.execute(query, (isPagination ? [Long.fromString(args.page_size.originalValue)], []), function (err,result){ 
    if(err){
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 500;
      res.end('{"error": "cassandra cql error '+ err +'"}');
    }else{
      if(typeof result.rows[0] !== 'undefined' && result.rows[0] !== null){
        console.log("pic found, name: " + result.rows[0].name);
        //console.log(result.rows[0].image);
        //console.log("this is my res : " + res[0] + res[1]);
        var currentImageName = result.rows[0].name;

        res.setHeader("Content-Type", "application/json");
        //res.write();
        var myResponse = {
          "name" : result.rows[0].name,
          "width" : result.rows[0].width,
          "id" : result.rows[0].id,
          "url" : "http://localhost:8080/img_store/" + result.rows[0].id,
          "height" : result.rows[0].height
        };
        res.end(JSON.stringify(myResponse || {}, null, 2));
        
        //next();
      }else{
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 404;
        res.end('{"error": "Image not found"}');
      }

    }
  });*/

/*    var examples = {};
  examples['application/json'] = [ {
  "name" : "image",
  "width" : 640,
  "id" : 1,
  "url" : "http://example.com/image-640x480.png",
  "height" : 480
} ];
  if(Object.keys(examples).length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
    }
  else {
    res.end();
  }
*/
}

exports.resizeImage = function(args, res, next) {
  /**
   * parameters expected in the args:
  * id (Long)
  * width (Long)
  * height (Long)
  **/
  console.log("resizing image ..." + args.id.value + ", new size :[" + args.width.value + "," + args.height.value + "]");
  var currentCachedVal = myCache.get(res.originalFullUrl); 
  if(!(currentCachedVal === null || typeof currentCachedVal === 'undefined')){
    console.log("found in cache...");
    res.setHeader("Content-Type", currentCachedVal.format);
    res.end(currentCachedVal.buffer);
  }else{
    console.log("not found in cache...");
    const query = 'SELECT blobAsText(image_content) as image, image_name FROM image_store where image_id = ?';
      

      
    client.execute(query, [ Long.fromString(args.id.originalValue) ], {prepare:true},function (err,result){ 
      if(err){
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 500;
        res.end('{"error": "cassandra cql error '+ err +'"}');
      }else{
        if(typeof result.rows[0] !== 'undefined' && result.rows[0] !== null){
          console.log("pic found, name: " + result.rows[0].image_name);
          //console.log(result.rows[0].image);
          //console.log("this is my res : " + res[0] + res[1]);
          
          /*var currentImageName = result.rows[0].image_name;

          if(currentImageName !== null){
            var currentImageNameExtPos = currentImageName.lastIndexOf(".");
            var currentImageNameExt = (currentImageNameExtPos < 0 ? "jpg" : currentImageName.substring(currentImageNameExtPos +1));
            currentImageNameExt == "" ? currentImageNameExt == "jpg" : currentImageNameExt;
          }else{
            currentImageNameExt = "jpg";
          }*/
          
          
          jimp.read(new Buffer(result.rows[0].image, 'base64')).then(function (myImage) {
            if(myImage === null || typeof myImage === 'undefined'){
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 500;
                res.end('{"error": "issue reading image in cassandra (corrupted ?)'+ err +'"}');
              
            }else{
              myImage
                  .resize(args.width.value, args.height.value)// resize 
                  .getBuffer(jimp.AUTO, (err, myBuffer) => {
                    myCache.set(res.originalFullUrl, {format : jimp.AUTO, buffer : myBuffer});
                    res.setHeader("Content-Type", jimp.AUTO);
                    res.end(myBuffer);});
             }
            })
            .catch(function (err) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end('{"error": "image processing error '+ err +'"}');
            });

        }else{
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 404;
          res.end('{"error": "Image not found"}');
        }
      }
    });
        
  }
}


exports.uploadImage = function(args, res, next) {
  /**
   * parameters expected in the args:
  * fileName (String)
  * fileData (file)
  **/
  console.log("uploading image ... " + args.fileName.value);
  //var b = new Buffer('hello');
  //var s = b.toString('base64');
  //console.log(args.fileData.value.buffer.toString('base64'));

  // img start
  /*  jimp.read(args.fileData.value.buffer).then(function (lenna) {
      lenna.resize(256, 256)            // resize 
           .quality(60)                 // set JPEG quality 
           .greyscale()                 // set greyscale 
           .write("lena-small-bw.jpg"); // save 
  }).catch(function (err) {
      console.error(err);
  });*/
  //img end
  
  

  jimp.read(args.fileData.value.buffer).then(function (myImage) {
  if(myImage === null || typeof myImage === 'undefined'){
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 500;
      res.end('{"error": "issue reading image uploaded (corrupted ?)'+ err +'"}');
  }else{
    var generatedId = Long.fromString(flakeIdGen.next().toString('hex'), true, 16).toString(10);
    var imageWidth = myImage.bitmap.width; // the width of the image
    var imageHeight = myImage.bitmap.height; // the height of the image

    console.log("generated image id : " + generatedId);
    console.log("image height : " + imageHeight);
    console.log("image width : " + imageWidth);
    
    const insertQuery = "insert into image_store(image_id, image_name, image_height, image_width, image_content) values("+ generatedId +", ?, ?, ?, textAsBlob(?))";
  client.execute(insertQuery, [args.fileName.value, imageHeight, imageWidth, args.fileData.value.buffer.toString('base64') ], {prepare: true})
      .then(result => {
         console.log('Image ' + args.fileName.value + 'successfully inserted');
         res.setHeader("Content-Type", "application/json");
         //res.write();
         var myResponse = {
          "name" : args.fileName.value,
          "width" : imageWidth,
          "id" : generatedId,
          "url" : res.originalHostUrl + "/img_store/" + generatedId,
          "height" : imageHeight
        };
        res.end(JSON.stringify(myResponse || {}, null, 2));

      })
      .catch(function(err){
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 500;
        res.end('{"error": "cassandra insert error '+ err +'"}');
      });
    
   }
  })
  .catch(function (err) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 500;
    res.end('{"error": "image processing error '+ err +'"}');
  });


  //cassandra start

 /* const query = 'SELECT image FROM image_store where image_name = ?';
  client.execute(query, [ 'lenna' ])
    .then(result => console.log('Current image is %s', result.rows[0].image));

  */
  
  
}


exports.scaleImage = function(args, res, next) {
  /**
   * parameters expected in the args:
  * id (Long)
  * scale(Float)
  **/
  console.log("scaling image ..." + args.id.value + ", new scale :[" + args.scale.value + "]");
  var currentCachedVal = myCache.get(res.originalFullUrl); 
  if(!(currentCachedVal === null || typeof currentCachedVal === 'undefined')){
    console.log("found in cache...");
    res.setHeader("Content-Type", currentCachedVal.format);
    res.end(currentCachedVal.buffer);
  }else{
    console.log("not found in cache...");
        const query = 'SELECT blobAsText(image_content) as image, image_name FROM image_store where image_id = ?';
      client.execute(query, [ Long.fromString(args.id.originalValue) ], {prepare:true},function (err,result){ 
        if(err){
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 500;
          res.end('{"error": "cassandra cql error '+ err +'"}');
        }else{
          if(typeof result.rows[0] !== 'undefined' && result.rows[0] !== null){
            console.log("pic found, name: " + result.rows[0].image_name);

            jimp.read(new Buffer(result.rows[0].image, 'base64')).then(function (myImage) {
              if(myImage === null || typeof myImage === 'undefined'){
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = 500;
                  res.end('{"error": "issue reading image in cassandra (corrupted ?)'+ err +'"}');
                
              }else{
                myImage
                    .scale(args.scale.value)// scale 
                    .getBuffer(jimp.AUTO, (err, myBuffer) => {
                      myCache.set(res.originalFullUrl, {format : jimp.AUTO, buffer : myBuffer});
                      res.setHeader("Content-Type", jimp.AUTO);
                      //res.write();
                      res.end(myBuffer);});
               }
              })
              .catch(function (err) {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 500;
                res.end('{"error": "image processing error '+ err +'"}');
              });

          }else{
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 404;
            res.end('{"error": "Image not found"}');
          }
        }
      });
  }

}



exports.rotateImage = function(args, res, next) {
  /**
   * parameters expected in the args:
  * id (Long)
  * deg(Float)
  **/
  console.log("rotating image ..." + args.id.value + ", rotation deg :[" + args.deg.value + "]");
  var currentCachedVal = myCache.get(res.originalFullUrl); 
  if(!(currentCachedVal === null || typeof currentCachedVal === 'undefined')){
    console.log("found in cache...");
    res.setHeader("Content-Type", currentCachedVal.format);
    res.end(currentCachedVal.buffer);
  }else{
    console.log("not found in cache...");
        const query = 'SELECT blobAsText(image_content) as image, image_name FROM image_store where image_id = ?';
      client.execute(query, [ Long.fromString(args.id.originalValue) ], {prepare:true},function (err,result){ 
        if(err){
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 500;
          res.end('{"error": "cassandra cql error '+ err +'"}');
        }else{
          if(typeof result.rows[0] !== 'undefined' && result.rows[0] !== null){
            console.log("pic found, name: " + result.rows[0].image_name);

            jimp.read(new Buffer(result.rows[0].image, 'base64')).then(function (myImage) {
              if(myImage === null || typeof myImage === 'undefined'){
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = 500;
                  res.end('{"error": "issue reading image in cassandra (corrupted ?)'+ err +'"}');
                
              }else{
                myImage
                    .rotate(args.deg.value)// rotate 
                    .getBuffer(jimp.AUTO, (err, myBuffer) => {
                      myCache.set(res.originalFullUrl, {format : jimp.AUTO, buffer : myBuffer});
                      res.setHeader("Content-Type", jimp.AUTO);
                      //res.write();
                      res.end(myBuffer);});
               }
              })
              .catch(function (err) {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 500;
                res.end('{"error": "image processing error '+ err +'"}');
              });

          }else{
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 404;
            res.end('{"error": "Image not found"}');
          }
        }
      });
  }

}



exports.greyscaleImage = function(args, res, next) {
  /**
   * parameters expected in the args:
  * id (Long)
  **/
  console.log("greyscaling image ..." + args.id.value);
  var currentCachedVal = myCache.get(res.originalFullUrl); 
  if(!(currentCachedVal === null || typeof currentCachedVal === 'undefined')){
    console.log("found in cache...");
    res.setHeader("Content-Type", currentCachedVal.format);
    res.end(currentCachedVal.buffer);
  }else{
    console.log("not found in cache...");
        const query = 'SELECT blobAsText(image_content) as image, image_name FROM image_store where image_id = ?';
      client.execute(query, [ Long.fromString(args.id.originalValue) ], {prepare:true},function (err,result){ 
        if(err){
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 500;
          res.end('{"error": "cassandra cql error '+ err +'"}');
        }else{
          if(typeof result.rows[0] !== 'undefined' && result.rows[0] !== null){
            console.log("pic found, name: " + result.rows[0].image_name);

            jimp.read(new Buffer(result.rows[0].image, 'base64')).then(function (myImage) {
              if(myImage === null || typeof myImage === 'undefined'){
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = 500;
                  res.end('{"error": "issue reading image in cassandra (corrupted ?)'+ err +'"}');
                
              }else{
                myImage
                    .greyscale()
                    .getBuffer(jimp.AUTO, (err, myBuffer) => {
                      myCache.set(res.originalFullUrl, {format : jimp.AUTO, buffer : myBuffer});
                      res.setHeader("Content-Type", jimp.AUTO);
                      //res.write();
                      res.end(myBuffer);});
               }
              })
              .catch(function (err) {
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 500;
                res.end('{"error": "image processing error '+ err +'"}');
              });

          }else{
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 404;
            res.end('{"error": "Image not found"}');
          }
        }
      });
  }
}


