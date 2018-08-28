var express = require('express'),
    router = express.Router()

var db = require('../db')
const ObjectId = require('mongodb').ObjectID;
const tagsController = {};

tagsController.getAllTags = (req, res) => {
    const requestBody = req.param('id');
    //console.log(req)
    var collection = db.get().collection('websites');
    var tagDocuments = db.get().collection('tags');
    collection.find({
        user_id: ObjectId(requestBody)
    }).toArray(function (err, res1) {
        if (err) {
            res.status(500).json({
                success: false,
                data: err
            });
        } else {
            if (res1.length > 0) {
                let tofindTags = [];
                res1.map((item) => {
                    if (item.tags && item.tags.length > 0) {
                        item.tags.map((item1) => {
                            tofindTags.push(item1.text);
                        })
                    }
                })
                if (tofindTags.length > 0) {
                    tagDocuments.find({
                        text: {
                            $in: tofindTags
                        }
                    }).toArray(function(err1, res2){
                        if(err1)
                        {
                            res.status(500).json({
                                success: false,
                                data: err1
                            });
                        }
                        else
                        {
                            res.status(200).json({
                                success: true,
                                data: res2
                            });
                        }
                    })
                } else {
                    res.status(403).json({
                        success: false,
                        data: "No tag found for the websites."
                    });
                }
            } else {
                res.status(403).json({
                    success: false,
                    data: 'No tag found'
                });
            }
        }
    })
}

// tagsController.getAllTags = (req, res) => {
//     var collection = db.get().collection('tags');
//      collection.aggregate([{
//          $lookup: {
//              from: 'tags',
//              localField: '_id',
//              foreignField: 'website_id',
//              as: 'tags'
//          }
//      }]).toArray(function (err, res) {
//          if (err) throw err;
//          console.log(JSON.stringify(res));
//          db.close();
//      });
// }


module.exports = tagsController;



//  const requestBody = req.param('id');
//  if (requestBody) {
//      var collection = db.get().collection('websites');
//      collection.find({
//              user_id: ObjectId(requestBody)
//          }).toArray(function (err, success) {
