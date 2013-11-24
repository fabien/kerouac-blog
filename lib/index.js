/**
 * Module dependencies.
 */
var fs = require('fs')
  , path = require('path')
  , kerouac = require('kerouac')
  , middleware = require('./middleware')
  , utils = require('./utils');

var DASHED_REGEX = /^(\d+)-(\d+)-(\d+)-(.*)/
  , UNDASHED_REGEX = /^(\d{4})(\d{2})(\d{2})-(.*)/


exports = module.exports = function(dir, pattern, options) {
  if (typeof pattern == 'object') {
    options = pattern;
    pattern = undefined;
  }
  if (typeof dir == 'object') {
    options = dir;
    pattern = undefined;
    dir = undefined;
  }
  dir = dir || 'blog';
  options = options || {};
  
  var prefix = options.prefix || 'blog';
  pattern = pattern || prefix + '/:year/:month/:day/:slug.html';
  
  var keys = [];
  var regexp = utils.pathRegexp(pattern
    , keys
    , options.sensitive
    , options.strict);
  
  return function robots(site, pages) {
    var files = fs.readdirSync(dir);
    
    for (var i = 0, len = files.length; i < len; ++i) {
      var filename = files[i]
        , basename = path.basename(filename, path.extname(filename))
        , file = path.resolve(dir, filename)
        , params = {}
        , match
        , url;
        
      if (match = DASHED_REGEX.exec(basename)) {
        params.year = match[1];
        params.month = match[2];
        params.day = match[3];
        params.slug = match[4];
      } else if (match = UNDASHED_REGEX.exec(basename)) {
        params.year = match[1];
        params.month = match[2];
        params.day = match[3];
        params.slug = match[4];
      }
      
      url = utils.patternSubstitute(pattern, keys, params);
      
      // TODO: Make prettyURLs optional (possible passing it as an argument).
      site.page(url, kerouac.prettyURL()
                   , kerouac.url()
                   , kerouac.loadContent(file)
                   , middleware.mergeLocals(params, options.layout)
                   , middleware.init()
                   , kerouac.render());
                   
      
      // TODO: Use the non-substitutable portion of `pattern` to determine this.
      site.page(prefix + '/feed.rss', kerouac.url()
                                    , middleware.rss2());
    }
  }
}
