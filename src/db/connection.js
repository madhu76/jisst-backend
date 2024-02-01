const mongoose = require('mongoose')
mongoose.Promise = Promise;

let dbOptions = {useCreateIndex: true, useNewUrlParser: true, useUnifiedTopology: true, auto_reconnect: true};

mongoose.connect(process.env.MongoDb_ConnStr, dbOptions);

mongoose.connection.on('connected', function(){

    console.log("Connected to DB");

})

mongoose.connection.on('error', function(err){

    console.log("Error while connecting to DB: " + err);

})
module.exports={mongoose};