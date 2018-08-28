var express = require('express'),
    router = express.Router()

var db = require('../db');

const gridController = {};

gridController.postGrid = (req, res) => {

    const requestBody = req.body;
    var collection = db.get().collection('grid');

    collection.save(requestBody, function (err, success) {
        if (err) {
            res.status(500).json({
                success: false,
                data: err
            });
        } else {
            if (success.ops.length > 0) {
                collection.remove({
                    user_id: requestBody.user_id
                }, function (err, res1) {
                    if (err) {
                        res.status(500).json({
                            success: false,
                            data: {
                                message: err1
                            }
                        });
                    } else {
                        collection.save({
                            user_id: requestBody.user_id,
                            type: requestBody.type,
                        }, function (err1, res2) {
                            if (err1) {
                                res.status(500).json({
                                    success: false,
                                    data: err1
                                });
                            } else if (res2) {
                                res.status(200).json({
                                    success: true,
                                    data: {
                                        message: "Successfully grid details updated.",
                                        details: res2.ops
                                    }
                                });
                            }
                        });
                    }
                });

            } else {
                res.status(200).json({
                    success: true,
                    data: {
                        message: "Successfully grid details added.",
                        details: success.ops
                    }
                });
            }
        }
    });
}


gridController.getGridType = (req, res) => {
    const requestBody = req.body;
    var collection = db.get().collection('grid');

    collection.find({
        user_id: requestBody.user_id
    }).toArray(function (err, success) {
        if (err) {
            res.status(500).json({
                success: false,
                data: err
            });
        } else {
            if (success.length > 0) {

                res.status(200).json({
                    success: true,
                    data: {
                        details: success
                    }
                });
            } else {
                res.status(404).json({
                    success: false,
                    data: {
                        message: "No data found."
                    }
                })
            }
        }

    });
}

module.exports = gridController;