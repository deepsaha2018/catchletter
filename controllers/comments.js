var express = require('express'),
    router = express.Router()

var db = require('../db')


const commentController = {};
commentController.get = (req, res) => {
    var collection = db.get().collection('comments');
    collection.find().toArray(function (err, docs) {
        res.status(200).json({
            success: true,
            data: docs
        });
    })
}

module.exports = commentController;