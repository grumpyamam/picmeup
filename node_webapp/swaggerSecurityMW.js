

module.exports = function(options) {
  return function(req, res, next) {
    // Implement the middleware function based on the options object
    console.log("call before swagger security");
    req.myRes=res;
    return options.middlewareCall(options.middlewareOptions)(req, res, next);
  }
  
}