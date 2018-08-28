var express = require('express'),
    router = express.Router()

var db = require('../db');
const ObjectId = require('mongodb').ObjectID;
const alertsController = {};

alertsController.saveAlerts = (req, res) => {

    const requestBody = req.body;
    var collection = db.get().collection('alerts');

    if (requestBody.user_id && requestBody.websites) {
        let toInsertData = [];
        for (let i = 0; i < requestBody.websites.length; i++) {
            let toPushData = {
                user_id: ObjectId(requestBody.user_id),
                website_id: ObjectId(requestBody.websites[i]._id)
            };
            toInsertData.push(toPushData);


        }
        (async function loop() {
            for (let i = 0; i < toInsertData.length; i++) {
                await new Promise(resolve => {
                    collection.find({
                        user_id: ObjectId(toInsertData[i].user_id),
                        website_id: ObjectId(toInsertData[i].website_id)
                    }).toArray(function (err1, res1) {
                        if (err1) {
                            resolve();
                        } else {
                            if (res1.length > 0) {
                                resolve();
                            } else {
                                collection.save(toInsertData[i], function (err2, res2) {
                                    resolve();
                                })
                            }
                        }
                    })

                });


            }
            res.status(200).json({
                success: true,
                data: {
                    message: "Saved successfully."
                }
            })
        })();

        // if (toInsertData.length > 0) {

        //     collection.insert(toInsertData, function (err, res1) {
        //         if (err) {
        //             res.status(500).json({
        //                 success: false,
        //                 data: {
        //                     message: err
        //                 }
        //             })
        //         } else {
        //             res.status(200).json({
        //                 success: true,
        //                 data: {
        //                     message: "Saved successfully."
        //                 }
        //             })
        //         }
        //     })

        // }
    } else {
        res.status(403).json({
                success: false,
                data: {
                    message: "User Id and Websites are required."
                }
            }

        )
    }

}


alertsController.getListOfAlertsByUserId = (req, res) => {
    const requestBody = req.body;
    if (requestBody.user_id) {
        var collection = db.get().collection('alerts');
        var websitesDoc = db.get().collection('websites');
        websitesDoc.find({
            user_id: ObjectId(requestBody.user_id)
        }).toArray(function (err1, success1) {
            if (err1) {
                res.status(500).json({
                    status: false,
                    data: {
                        message: err1
                    }
                });
            } else {
                collection.aggregate([{
                    $lookup: {
                        from: "websites",
                        localField: "website_id",
                        foreignField: "_id",
                        as: "websiteDetails"
                    }
                }, {
                    $match: {
                        "user_id": ObjectId(requestBody.user_id)
                    }
                }]).toArray(function (err, success) {
                    if (err) {
                        res.status(500).json({
                            status: false,
                            data: {
                                message: err
                            }
                        });
                    } else {
                        let type = "single";
                        if (success.length == success1.length) {
                            type = "all"
                        }
                        res.status(200).json({
                            status: true,
                            data: {
                                message: success,
                                type: type
                            }
                        });
                    }
                })
            }
        })

    } else {
        res.status(403).json({
            status: false,
            data: {
                success: false,
                data: {
                    message: "User Id is required."
                }
            }
        })
    }

}


alertsController.updateAlertsById = (req, res) => {
    const requestBody = req.body;
    if (requestBody._id) {
        var collection = db.get().collection('alerts');
        const _id = ObjectId(requestBody._id);
        collection.find({
            _id: ObjectId(requestBody._id)
        }).toArray(function (err1, success1) {
            if (err1) {
                res.status(500).json({
                    success: false,
                    data: {
                        message: err1
                    }
                })
            } else if (success1.length > 0) {
                collection.update({
                        _id: _id
                    }, {
                        $set: requestBody
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
                                    message: "Alerts edited successfully."
                                }
                            })
                        }
                    })
            } else {
                res.status(404).json({
                    status: false,
                    data: {
                        message: "No alerts found."
                    }
                })
            }
        })

    } else {
        res.status(403).json({
            success: false,
            data: {
                message: "Alert Id is required."
            }
        })
    }
}


alertsController.deleteAlertsById = (req, res) => {
    const requestBody = req.body;
    if (requestBody._id) {
        var collection = db.get().collection('alerts');
        const _id = ObjectId(requestBody._id);
        collection.find({
            _id: ObjectId(requestBody._id)
        }).toArray(function (err1, success1) {
            if (err1) {
                res.status(500).json({
                    success: false,
                    data: {
                        message: err1
                    }
                })
            } else if (success1.length > 0) {
                collection.remove({
                    _id: ObjectId(requestBody._id)
                }, function (err3, success3) {
                    if (err3) {
                        res.status(500).json({
                            status: false,
                            data: {
                                message: err3
                            }
                        });
                    } else {
                        res.status(200).json({
                            status: true,
                            data: {
                                message: "Deleted successfully."
                            }
                        })
                    }
                })
            } else {
                res.status(404).json({
                    status: false,
                    data: {
                        message: "No alerts found."
                    }
                })
            }
        })

    } else {
        res.status(403).json({
            success: false,
            data: {
                message: "Alert Id is required."
            }
        })
    }
}



module.exports = alertsController;