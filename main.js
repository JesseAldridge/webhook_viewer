var fs = require('fs')

var express = require("express")
var exphbs  = require('express-handlebars')
var bodyParser = require("body-parser")

var app = express()

var port = (process.argv.length == 3) ? parseInt(process.argv[2]) : 80

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use(bodyParser.json())

// Validate to make sure params are safe to write to filesystem.

function validate_user(req, res, next) {
  var user = req.params.user
  if(validate([
    {rule: req.body.length > 10000, msg: 'rejected; body too long'},
    {rule: user.length > 30, msg: 'rejected; user too long'},
    {rule: !/^[a-zA-Z0-9_\-]*$/.exec(user), msg: 'rejected user for illegal chars: ' + user}
  ], res)) {
    req.dir_path = mkdirs(['endpoints', user])
    next()
  }
}

function validate_endpoint(req, res, next) {
  var user = req.params.user,
      endpoint = req.params.endpoint
  if(validate([
    {rule: endpoint.length > 60, msg: 'rejected; endpoint too long'},
    {
      rule: !/^[a-zA-Z0-9_\-]*$/.exec(endpoint),
      msg: 'rejected endpoint for illegal chars: ' + endpoint
    }
  ], res)) {
    req.dir_path = mkdirs(['endpoints', user, endpoint])
    next()
  }
}

function validate(validations, res) {
  for(var i = 0; i < validations.length; i++) {
    var validation = validations[i]
    if(validation.rule) {
      res.status(403)
      res.send(validation.msg)
      return false
    }
  }
  return true
}

app.use("/:user", validate_user)
app.use("/:user/:endpoint", validate_user)
app.use("/:user/:endpoint", validate_endpoint)

app.get('/', function (req, res) {
  res.render('index')
})

app.get("/:user", function(req, res) {
  // Return all records for all endpoints for the passed user.

  var endpoint_to_records = {}
  fs.readdirSync(req.dir_path).forEach(function(endpoint) {
    var endpoint_dir_path = req.dir_path + '/' + endpoint
    if(fs.lstatSync(endpoint_dir_path).isDirectory())
      endpoint_to_records[endpoint] = get_records(endpoint_dir_path)
  })

  res.render('user', {endpoint_to_records: endpoint_to_records})
})

app.post("/:user/:endpoint", function (req, res) {
  // Write the json body of the post to endpoints/:user/:endpoint/:now.iso

  console.log('post, body:', req.body)
  var now = new Date(),
      file_path = req.dir_path + '/' + now.toISOString(),
      json_body = JSON.stringify(req.body, null, 2)

  fs.writeFileSync(file_path, json_body)

  console.log("post recorded:", file_path)
  res.send(json_body)
})

app.listen(port, function () {
  console.log("Listening on port {}!".replace("{}", port))
})

function get_records(dir_path) {
  // Return the timestamped contents of all the files in the passed endpoint dir.

  var records = []
  var filenames = fs.readdirSync(dir_path)
  var filtered = []
  filenames.forEach(function(filename) {
    if(!/^[0-9]+/.exec(filename))
      return
    filtered.push(filename)
  })
  filenames = filtered
  filenames.sort().reverse()
  for(var i = 0; i < Math.min(10, filenames.length); i++) {
    var content = fs.readFileSync(dir_path + '/' + filenames[i], 'utf8')
    records.push({dt_iso: filenames[i], content: content})
  }
  return records
}

function mkdirs(path_parts) {
  // ['foo', 'bar', 'baz'] -> 'foo/bar/baz'; (mkdir -p)

  var dir_path = ''
  path_parts.forEach(function(part) {
    dir_path += part + '/'
    if(!fs.existsSync(dir_path))
      fs.mkdirSync(dir_path)
  })
  return dir_path.substr(0, dir_path.length - 1)
}
