// var MongoClient = require('mongodb').MongoClient

// var URL = 'mongodb://localhost:27017/mydatabase'

// MongoClient.connect(URL, function (err, db) {
//     if (err) return

//     var collection = db.collection('foods')
//     collection.insert({
//         name: 'taco',
//         tasty: true
//     }, function (err, result) {
//         collection.find({
//             name: 'taco'
//         }).toArray(function (err, docs) {
//             console.log(docs[0])
//             db.close()
//         })
//     })
// })


var MongoClient = require('mongodb').MongoClient

var state = {
    db: null,
}

exports.connect = function (url, done) {
    if (state.db) return done()

    MongoClient.connect(url, function (err, db) {
        if (err) return done(err)
        state.db = db
        // done()
    })
}

exports.get = function () {
    return state.db
}

exports.close = function (done) {
    if (state.db) {
        state.db.close(function (err, result) {
            state.db = null
            state.mode = null
            done(err)
        })
    }
}
