console.log("Hello from Fargate")
console.log(process.env)

const got = require('got');

got(`http://169.254.170.2${process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI}`).then(function(response){
  console.log(response.body)
})

setTimeout(function() {console.log("Done")}, 10000)
