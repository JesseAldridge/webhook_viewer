var express = require("express")
var bodyParser = require("body-parser")

var app = express()

var port = (process.argv.length == 3) ? parseInt(process.argv[2]) : 80

app.use(bodyParser.json());

app.get("/", function (req, res) {
  res.send("Hello express World!")
})

var endpoints = ["completed", "error", "confirmed"]
endpoints.forEach(function(name) {
  app.post("/" + name, function (req, res) {
    console.log("endpoint:", name)
    console.log("req body:", req.body)
    res.status(200).send(JSON.stringify(req.body, null, 2))
  })
})

app.listen(port, function () {
  console.log("Example app listening on port {}!".replace("{}", port))
})
