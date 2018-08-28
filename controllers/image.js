var express = require('express'),
    router = express.Router()

var db = require('../db');
const ObjectId = require('mongodb').ObjectID;

var multer = require('multer');
var uploadUserImage = multer({ dest: 'uploadUserImage/' });
var fs = require('fs');
var path = require('path');

const imageController = {};

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploadUserImage')
    },
    filename: function (req, file, cb) {
        console.log(file);
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
});

imageController.uploadImage = (req, res) => {

    var customer = db.get().collection('customer');

    var image;
    var userId;

    var upload = multer({
        storage: storage,
        fileFilter: function (req, file, cb) {
            var ext = path.extname(file.originalname);
            if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
                return cb('not support', null)
            }
            cb(null, true)
        }
    }).single('file');

    upload(req, res, function (error) {
        userId = req.body.userId;

        if (error) {
            res.status(500).json({
                success: false,
                data: {
                    message: error
                }
            });
        }
        else if (req.file) {

            image = req.file;

            if (image) {
                customer.update({
                    _id: ObjectId(userId)
                }, {
                        $set: { imageFileName: image.filename }
                    }, {
                        upsert: true
                    },
                    function (err2, res2) {
                        if (err2) {
                            res.status(500).json({
                                success: false,
                                data: {
                                    message: err2
                                }
                            })
                        } else {
                            res.status(200).json({
                                success: true,
                                data: {
                                    filename: image.filename,
                                    message: "Image upload successfully."
                                }
                            });
                        }
                    });
            }
        }
    });
}

module.exports = imageController;