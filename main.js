var express = require("express")
var bodyParser = require("body-parser")
var app = express()

app.use(bodyParser.json());

app.get("/", function (req, res) {
  console.log("req:", req)
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

app.listen(3000, function () {
  console.log("Example app listening on port 3000!")
})
