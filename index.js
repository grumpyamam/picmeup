'use strict';

//var app = require('connect')();
var app = require('express')();
var swaggerSecMW = require('./swaggerSecurityMW');
var http = require('http');
var swaggerTools = require('swagger-tools');
var jsyaml = require('js-yaml');
var fs = require('fs');
var cassandraConf = require("./config/cassandra-local-config");
//var cassandraConf = require("./config/cassandra-config");
var nodeConf = require("./config/node-config");
var basicAuthConf = require("./config/basic-auth-config");

//var basicAuth = require('express-basic-auth');
var auth = require('basic-auth');


var util = require('util');

var serverPort = nodeConf.port;

//tarik start
var jimp = require('jimp');
var cassandra = require('cassandra-driver');
const Long = require('cassandra-driver').types.Long;

const authProvider = new cassandra.auth.PlainTextAuthProvider(cassandraConf.user, cassandraConf.password);

//console.log(authProvider);

var client = new cassandra.Client({ contactPoints: cassandraConf.contactPoints, keyspace: cassandraConf.keyspace, authProvider: authProvider });

//tarik end

// swaggerRouter configuration
var options = {
  swaggerUi: '/swagger.json',
  controllers: './controllers',
  useStubs: process.env.NODE_ENV === 'development' ? true : false // Conditionally turn on stubs (mock mode)
  
};



// The Swagger document (require it, build it programmatically, fetch it from a URL, ...)
var spec = fs.readFileSync('./api/swagger.yaml', 'utf8');
var swaggerDoc = jsyaml.safeLoad(spec);

// Initialize the Swagger middleware
swaggerTools.initializeMiddleware(swaggerDoc, function (middleware) {

  //tarik add path to get picture
  app.use('/img_store', function (req, res, next) {
    // req.url starts with "/foo"
    console.log("get image from store ..." + req.url);
    
    if (typeof req.url !== 'undefined' && req.url !== null && req.url.length > 1){
      //console.log("**********" + util.inspect(req.url, false, null));
      //console.log("**********" + util.inspect(swaggerDoc, false, null));
   

      
      const query = 'SELECT blobAsText(image_content) as image, image_name FROM image_store where image_id = ?';
      client.execute(query, [ Long.fromString(req.url.substring(1)) ], {prepare:true},function (err,result){ 
        if(err){
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 500;
          res.end('{"error": "cassandra cql error '+ err +'"}');
        }else{
          if(typeof result.rows[0] !== 'undefined' && result.rows[0] !== null){
            console.log("pic found, name: " + result.rows[0].image_name);
            //console.log(result.rows[0].image);
            //console.log("this is my res : " + res[0] + res[1]);
            var currentImageName = result.rows[0].image_name;

            if(currentImageName !== null){
              var currentImageNameExtPos = currentImageName.lastIndexOf(".");
              var currentImageNameExt = (currentImageNameExtPos < 0 ? "jpg" : currentImageName.substring(currentImageNameExtPos +1));
              currentImageNameExt == "" ? currentImageNameExt == "jpg" : currentImageNameExt;
            }else{
              currentImageNameExt = "jpg";
            }
            res.setHeader("Content-Type", "image/"+ currentImageNameExt);
            //res.write();
            var b = new Buffer(result.rows[0].image, 'base64')
            res.end(b);
            //next();
          }else{
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 404;
            res.end('{"error": "Image not found"}');
          }
        }
      });
        
         /*fs.readFile("../test.bmp", function(err, data) {
              if (err) {
                  res.writeHead(404);
                  return res.end("File not found.");
              }

              res.setHeader("Content-Type","image/bmp"); //Solution!
              res.writeHead(200);
              res.end(data);
          });*/
    }else{
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 404;
      res.end('{"error":"Image not found"}');
      
      
    }

    
    
    
  });
  //tarik end



  // Serve the Swagger documents and Swagger UI
  app.use(middleware.swaggerUi());

  /*
  app.use(basicAuth({
    users: { 'admin': 'supersecret' }
  }));
  */
      
  // Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
  app.use(middleware.swaggerMetadata());



  //use basic auth just to get req.auth.user and req.auth.password for swaggerSecurity middleware
  /*app.use(basicAuth({
      users: { 'not': 'used' },
      authorizer: function(username, password){return true;}
  }));
  */

  
  app.use(swaggerSecMW({middlewareCall:middleware.swaggerSecurity, middlewareOptions:{basicAuth: function (req, authOrSecDef, scopesOrApiKey, callback) {
          
          var user = auth(req);
          
          //console.log("**********" + util.inspect(req.swagger.operation, false, null));
          //console.log("**********" + util.inspect(user, false, null));
          

          
          if(user !== null && typeof user !== 'undefined' && basicAuthConf.users[user.name] === user.pass){
            console.log("Authentication successful");
            callback();
          }else{
          
            var e = new Error("Authentication Failure");
            e.message = req.swagger.operation.responses['401'].description;
            e.statusCode = 401;
            //e.headers = {"WWW-Authenticate" : "Basic"};
            req.myRes.statusCode = 401;
            req.myRes.setHeader("WWW-Authenticate" , "Basic");
            req.myRes.end(req.swagger.operation.responses['401'].description);
            callback(e);
          }
          }}}));
  
    /*  app.use( 
        middleware.swaggerSecurity({basicAuth: function (req, authOrSecDef, scopesOrApiKey, callback) {
          //console.log("I m here : " + req + " " + authOrSecDef, + " " + scopesOrApiKey);
          //console.log("**********" + util.inspect(req, false, null));
          //console.log("**********" + util.inspect(authOrSecDef, false, null));
          //console.log("**********" + util.inspect(scopesOrApiKey, false, null));
          //console.log("**********" + util.inspect(req.res, false, null));
          var e = new Error("not possibliiii");
          e.message = "sorry mate";
          e.statusCode = 401;
          e.headers = {"WWW-Authenticate" : "Basic"};
          
          callback(e);
          }})
      );*/


  // Validate Swagger requests
  app.use(middleware.swaggerValidator());
  
  
  // Route validated requests to appropriate controller
  app.use(middleware.swaggerRouter(options));

  

  
  // Start the server
  http.createServer(app).listen(serverPort, function () {
    console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
    console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
  });
});
