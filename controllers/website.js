var express = require('express'),
    router = express.Router()

var db = require('../db')
const curl = new (require('curl-request'))();
const ObjectId = require('mongodb').ObjectID;
const htmlToText = require('html-to-text');
const webshot = require('webshot');
let imap;
const Imap = require('imap'),
    inspect = require('util').inspect;

var fs = require('fs'),
    fileStream;
const simpleParser = require('mailparser').simpleParser;
const websiteController = {};
const httpMessageParser = require('http-message-parser');
let allMails = [];
let allMailsFilter = [];
websiteController.getAllWebsites = (req, res) => {
    var collection = db.get().collection('websites');
    collection.find().sort([
        ['_id', -1]
    ]).toArray(function (err, docs) {
        res.status(200).json({
            success: true,
            data: docs
        });
    })
}

function openInbox(cb) {
    imap.openBox('INBOX', false, cb);
}


websiteController.testCurl = (req, res) => {

    curl.setHeaders([
        'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36'
    ])
        .get('https://www.google.com')
        .then(({
            statusCode,
            body,
            headers
        }) => {
            res.status(200).json({
                success: true,
                data: {
                    statusCode: statusCode,
                    body: body,
                    headers: headers
                }
            });
        })
        .catch((e) => {
            res.status(500).json({
                success: false,
                data: e
            });
        });
}


websiteController.getMyMailsByWebsite = (req, res) => {
    const requestBody = req.body;
    if (requestBody.emailDomain && requestBody.unique_id) {
        const mailImages = db.get().collection('mailImages');
        mailImages.find({
            emailDomain: requestBody.emailDomain,
            unique_id: requestBody.unique_id
        }).sort({
            cDate: -1
        }).toArray(function (err, success) {
            if (err) {
                res.status(403).json({
                    success: false,
                    data: {
                        message: err
                    }
                });
            } else {
                if (success.length > 0) {
                    res.status(200).json({
                        success: true,
                        data: {
                            message: success
                        }
                    });
                } else {
                    res.status(403).json({
                        success: false,
                        data: {
                            message: "No mails found."
                        }
                    });
                }

            }
        })
    } else {
        res.status(403).json({
            success: false,
            data: {
                message: "Email Domain and Unique Id are required."
            }
        });
    }


}


websiteController.getMyMailsByWebsiteWithPagination = (req, res) => {

    const requestBody = req.body;
    if (requestBody.emailDomain && requestBody.unique_id) {
        if (requestBody.page < 0 || requestBody.page == 0) {
            res.status(403).json({
                success: false,
                data: {
                    message: "Please give a valid page number."
                }
            });
        } else {
            const mailImages = db.get().collection('mailImages');
            requestBody.page = Number(requestBody.page);
            let query = {};
            const size = 10;
            query.skip = size * (requestBody.page - 1)
            query.limit = size
            mailImages.find({
                emailDomain: requestBody.emailDomain,
                unique_id: requestBody.unique_id
            }).sort({
                cDate: -1
            }).toArray(function (err, success) {
                if (err) {
                    res.status(403).json({
                        success: false,
                        data: {
                            message: err
                        }
                    });
                } else {
                    if (success.length > 0) {
                        mailImages.find({
                            emailDomain: requestBody.emailDomain,
                            unique_id: requestBody.unique_id
                        }, {}, query).sort([
                            ['_id', -1]
                        ]).toArray(function (err1, success1) {
                            if (err1) {
                                res.status(403).json({
                                    success: false,
                                    data: {
                                        message: err1
                                    }
                                });
                            } else {
                                res.status(200).json({
                                    success: true,
                                    data: {
                                        message: success1,
                                        totalCount: success.length
                                    }
                                });
                            }
                        })

                    } else {
                        res.status(403).json({
                            success: false,
                            data: {
                                message: "No mails found."
                            }
                        });
                    }

                }
            })
        }

    } else {
        res.status(403).json({
            success: false,
            data: {
                message: "Email Domain and Unique Id are required."
            }
        });
    }


}
// websiteController.getMyMailsByWebsite = (req, res) => {


//     const responseData = [];
//     const responseUids = [];
//     const responseData_message = [];
//     const requestBody = req.body;
//     var i = 'K';
//     if (requestBody.emailDomain && requestBody.unique_id) {
//         imap = new Imap({
//             user: requestBody.emailDomain,
//             password: requestBody.unique_id,
//             host: 'box.catchletter.com',
//             port: 993,
//             tls: true
//         });
//         let parsedData;
//         imap.once('ready', function () {

//             var fs = require('fs'),
//                 fileStream;

//             openInbox(function (err, box) {

//                 // if (err) throw err;
//                 imap.search(['ALL', ['SINCE', 'May 20, 2000']], function (err, results) {
//                     if (results.length > 0) {

//                         // if (err) throw err;
//                         var f = imap.fetch(results, {
//                             bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', ''],
//                             struct: true
//                         });
//                         f.on('message', function (msg, seqno) {
//                             var prefix = '(#' + seqno + ') ';
//                             msg.on('body', function (stream, info) {
//                                 // stream.pipe(fs.createWriteStream('msg-' + seqno + '-body.txt'));
//                                 var buffer = '';
//                                 stream.on('data', function (chunk) {

//                                     buffer += chunk.toString('utf8');


//                                 });
//                                 stream.once('end', function () {
//                                     //  simpleParser(buffer, (err, parsed) => {
//                                     //    if(err)
//                                     //    {
//                                     //      console.log("error", err);
//                                     //   }
//                                     //  else {
//                                     //     console.log("parsed");
//                                     //      parsedData=parsed;
//                                     //   }
//                                     //  });

//                                     const variableVal = Imap.parseHeader(buffer);

//                                     if (variableVal.to) {


//                                         variableVal1 = variableVal;
//                                     } else {

//                                     }


//                                     var arr = buffer.split('</body>');
//                                     var arr1 = arr[0].toString().split('<body');
//                                     if (info.which != "Text" && arr1[1]) {
//                                         responseData.push({
//                                             header: variableVal1,
//                                             body: '<html> <body' + arr1[1] + '</body></html>'.replace('/"', 'l'),
//                                             foot: arr[1],
//                                             uid: '',
//                                             seqno: seqno,
//                                             flag: '',
//                                             emailDomain: requestBody.emailDomain,
//                                             unique_id: requestBody.unique_id,
//                                             buffer: buffer
//                                         });
//                                         if (i == 'K') {
//                                             i = 0;
//                                         } else {
//                                             i = parseInt(i) + 1;
//                                         }

//                                     }
//                                 });
//                             });
//                             msg.once('attributes', function (attrs) {
//                                 if (responseData && responseData[i]) {
//                                     // if(parsedData)
//                                     // {
//                                     //   responseData[i].buffer=parsedData;
//                                     // }
//                                     // else
//                                     // {
//                                     //   responseData[i].buffer=responseData[i].body
//                                     // }


//                                     if (responseData[i].uid == '') {
//                                         responseData[i].uid = attrs.uid;
//                                     }

//                                     if (responseData[i].flag == '') {
//                                         //responseData[i].flag = attrs.flags.length;
//                                         if (attrs.flags && attrs.flags.length && attrs.flags.length > 0) {
//                                             for (let i = 0; i < attrs.flags.length; i++) {
//                                                 attrs.flags[i] = attrs.flags[i].replace(/\\/g, "");
//                                             }
//                                             if (attrs.flags.indexOf("Flagged") != -1) {
//                                                 responseData[i].flag = 1;
//                                             } else {
//                                                 responseData[i].flag = 0;
//                                             }
//                                             responseData[i].attrs = attrs.flags;
//                                         } else {
//                                             responseData[i].flag = 0;
//                                         }
//                                     }
//                                 }

//                                 // responseData_message = [];

//                             });
//                             msg.once('end', function () {

//                             });
//                         });
//                         f.once('error', function (err) {

//                         });
//                         f.once('end', function () {

//                             imap.end();
//                             res.status(200).json({
//                                 success: true,
//                                 data: {
//                                     message: responseData,
//                                     responseUids: responseUids
//                                 }
//                             });
//                         });
//                     } else {
//                         res.status(200).json({
//                             success: false,
//                             data: 'No mail found'
//                         });
//                     }
//                 });

//             });



//         });

//         imap.once('error', function (err) {
//             res.status(403).json({
//                 success: false,
//                 data: {
//                     message: "No message found"
//                 }
//             });
//         });

//         imap.once('end', function () {

//         });

//         imap.connect();
//     } else {

//     }

// }

websiteController.markMailAsFavouriteId = (req, res) => {
    const requestBody = req.body;
    if (requestBody.emailDomain && requestBody.unique_id && requestBody.id && requestBody.user_id) {
        requestBody.seqno = Number(requestBody.seqno);
        var collection = db.get().collection('mailImages');
        collection.find({
            uid: requestBody.seqno,
            emailDomain: requestBody.emailDomain
        }).toArray(function (err7, res7) {
            if (err7) {
                res.status(500).json({
                    success: false,
                    data: {
                        message: err7
                    }
                });
            } else {
                console.log("res7", res7);
                if (res7.length > 0) {
                    collection.update({
                        _id: ObjectId(res7[0]._id)
                    }, {
                            $set: {
                                flag: 1

                            }
                        }, {
                            upsert: true
                        }, function (err8, res8) {
                            if (err8) {
                                res.status(200).json({
                                    success: false,
                                    data: {
                                        message: err8
                                    }
                                });
                            } else {
                                res.status(200).json({
                                    success: true,
                                    data: {
                                        message: "Mail marked as favourite."
                                    }
                                });
                            }
                        })
                } else {
                    res.status(200).json({
                        success: false,
                        data: {
                            message: "Mail marked as favourite but could not update database."
                        }
                    });
                }
            }
        })
        // imap = new Imap({
        //     user: requestBody.emailDomain,
        //     password: requestBody.unique_id,
        //     host: 'box.catchletter.com',
        //     port: 993,
        //     tls: true
        // });
        // imap.once('ready', function () {
        //     openInbox(function (err, box) {
        //         //if (err) throw err;
        //         imap.search([
        //             [requestBody.id]
        //         ], function (err, results) {
        //             //if (err) throw err;
        //             if (results.length > 0) {
        //                 var f = imap.fetch(results, {
        //                     bodies: ''
        //                 });
        //                 f.on('message', function (msg, seqno) {

        //                     var prefix = '(#' + seqno + ') ';
        //                     msg.on('body', function (stream, info) { });
        //                     msg.once('attributes', function (attrs) {
        //                         imap.addFlags(requestBody.seqno, 'Flagged', function (err1, success1) {

        //                             if (err1) {
        //                                 res.status(500).json({
        //                                     success: false,
        //                                     data: {
        //                                         message: err1
        //                                     }
        //                                 });
        //                             } else {
        //                                 requestBody.seqno = Number(requestBody.seqno);
        //                                 collection.find({
        //                                     uid: requestBody.seqno,
        //                                     emailDomain: requestBody.emailDomain
        //                                 }).toArray(function (err7, res7) {
        //                                     if (err7) {
        //                                         res.status(500).json({
        //                                             success: false,
        //                                             data: {
        //                                                 message: err7
        //                                             }
        //                                         });
        //                                     } else {
        //                                         console.log("res7", res7);
        //                                         if (res7.length > 0) {
        //                                             collection.update({
        //                                                 _id: ObjectId(res7[0]._id)
        //                                             }, {
        //                                                     $set: {
        //                                                         flag: 1

        //                                                     }
        //                                                 }, {
        //                                                     upsert: true
        //                                                 }, function (err8, res8) {
        //                                                     if (err8) {
        //                                                         res.status(200).json({
        //                                                             success: false,
        //                                                             data: {
        //                                                                 message: err8
        //                                                             }
        //                                                         });
        //                                                     } else {
        //                                                         res.status(200).json({
        //                                                             success: true,
        //                                                             data: {
        //                                                                 message: "Mail marked as favourite."
        //                                                             }
        //                                                         });
        //                                                     }
        //                                                 })
        //                                         } else {
        //                                             res.status(200).json({
        //                                                 success: false,
        //                                                 data: {
        //                                                     message: "Mail marked as favourite but could not update database."
        //                                                 }
        //                                             });
        //                                         }
        //                                     }
        //                                 })

        //                             }
        //                         });
        //                     });
        //                     msg.once('end', function () {

        //                     });
        //                 });
        //                 f.once('error', function (err) {

        //                 });
        //                 f.once('end', function () {

        //                     imap.end();

        //                 });
        //             } else {
        //                 res.status(403).json({
        //                     success: false,
        //                     data: {
        //                         message: "No records found."
        //                     }
        //                 });
        //             }

        //         });
        //     });
        // });

        // imap.once('error', function (err) {
        //     res.status(500).json({
        //         success: false,
        //         data: {
        //             message: err
        //         }
        //     });
        // });

        // imap.once('end', function () {

        // });

        // imap.connect();
    } else {
        res.status(403).json({
            success: false,
            data: {
                message: "Email, Password, User Id and Mail Id are required."
            }
        });
    }

}

// websiteController.markMailAsFavouriteId = (req, res) => {
//     const requestBody = req.body;
//     if (requestBody.emailDomain && requestBody.unique_id && requestBody.id && requestBody.user_id) {
//         var collection = db.get().collection('favourites');
//         imap = new Imap({
//             user: requestBody.emailDomain,
//             password: requestBody.unique_id,
//             host: 'box.catchletter.com',
//             port: 993,
//             tls: true
//         });
//         imap.once('ready', function () {
//             openInbox(function (err, box) {
//                 //if (err) throw err;
//                 imap.search([
//                     [requestBody.id]
//                 ], function (err, results) {
//                     //if (err) throw err;
//                     if (results.length > 0) {
//                         var f = imap.fetch(results, {
//                             bodies: ''
//                         });
//                         f.on('message', function (msg, seqno) {

//                             var prefix = '(#' + seqno + ') ';
//                             msg.on('body', function (stream, info) {});
//                             msg.once('attributes', function (attrs) {
//                                 imap.addFlags(requestBody.seqno, 'Flagged', function (err1, success1) {

//                                     if (err1) {
//                                         res.status(500).json({
//                                             success: false,
//                                             data: {
//                                                 message: err1
//                                             }
//                                         });
//                                     } else {
//                                         collection.save({
//                                             user_id: ObjectId(requestBody.user_id),
//                                             msg_id: requestBody.id
//                                         }, function (err3, success3) {
//                                             if (err3) {
//                                                 res.status(500).json({
//                                                     success: false,
//                                                     data: {
//                                                         message: err3
//                                                     }
//                                                 });
//                                             } else {

//                                                 res.status(200).json({
//                                                     success: true,
//                                                     data: {
//                                                         message: "Mail marked as favourite",
//                                                         data: success3
//                                                     }
//                                                 });
//                                             }
//                                         })

//                                     }
//                                 });
//                             });
//                             msg.once('end', function () {

//                             });
//                         });
//                         f.once('error', function (err) {

//                         });
//                         f.once('end', function () {

//                             imap.end();

//                         });
//                     } else {
//                         res.status(403).json({
//                             success: false,
//                             data: {
//                                 message: "No records found."
//                             }
//                         });
//                     }

//                 });
//             });
//         });

//         imap.once('error', function (err) {
//             res.status(500).json({
//                 success: false,
//                 data: {
//                     message: err
//                 }
//             });
//         });

//         imap.once('end', function () {

//         });

//         imap.connect();
//     } else {
//         res.status(403).json({
//             success: false,
//             data: {
//                 message: "Email, Password, User Id and Mail Id are required."
//             }
//         });
//     }

// }



// websiteController.removeMailAsFavouriteId = (req, res) => {
//     const requestBody = req.body;
//     if (requestBody.emailDomain && requestBody.unique_id && requestBody.id) {
//         var collection = db.get().collection('favourites');
//         imap = new Imap({
//             user: requestBody.emailDomain,
//             password: requestBody.unique_id,
//             host: 'box.catchletter.com',
//             port: 993,
//             tls: true
//         });
//         imap.once('ready', function () {
//             openInbox(function (err, box) {
//                 if (err) {
//                     res.status(500).json({
//                         success: false,
//                         data: {
//                             message: err
//                         }
//                     });
//                 };
//                 imap.search([
//                     [requestBody.id]
//                 ], function (err, results) {
//                     if (err) {
//                         res.status(500).json({
//                             success: false,
//                             data: {
//                                 message: err
//                             }
//                         });
//                     }

//                     if (results.length > 0) {
//                         var f = imap.fetch(results, {
//                             bodies: ''
//                         });
//                         f.on('message', function (msg, seqno) {

//                             var prefix = '(#' + seqno + ') ';
//                             msg.on('body', function (stream, info) {});
//                             msg.once('attributes', function (attrs) {
//                                 imap.delFlags(requestBody.seqno, 'Flagged', function (err1, success1) {
//                                     if (err1) {
//                                         res.status(500).json({
//                                             success: false,
//                                             data: {
//                                                 message: err1
//                                             }
//                                         });
//                                     } else {
//                                         res.status(200).json({
//                                             success: true,
//                                             data: {
//                                                 message: "Mail removed from favourites"
//                                             }
//                                         });

//                                     }
//                                 });
//                             });
//                             msg.once('end', function () {

//                             });
//                         });
//                         f.once('error', function (err) {

//                         });
//                         f.once('end', function () {

//                             imap.end();

//                         });
//                     } else {
//                         res.status(403).json({
//                             success: false,
//                             data: {
//                                 message: "No records found"
//                             }
//                         });
//                     }

//                 });
//             });
//         });

//         imap.once('error', function (err) {
//             res.status(500).json({
//                 success: false,
//                 data: {
//                     message: err
//                 }
//             });
//         });

//         imap.once('end', function () {

//         });

//         imap.connect();
//     } else {
//         res.status(403).json({
//             success: false,
//             data: {
//                 message: "Email, Favourite Id and Password are required."
//             }
//         });
//     }

// }

websiteController.removeMailAsFavouriteId = (req, res) => {
    const requestBody = req.body;
    if (requestBody.emailDomain && requestBody.unique_id && requestBody.id) {
        var collection = db.get().collection('mailImages');
        requestBody.seqno = Number(requestBody.seqno);
        collection.find({
            uid: requestBody.seqno,
            emailDomain: requestBody.emailDomain
        }).toArray(function (err7, res7) {
            if (err7) {
                res.status(500).json({
                    success: false,
                    data: {
                        message: err7
                    }
                });
            } else {
                console.log("res7", res7);
                if (res7.length > 0) {
                    collection.update({
                        _id: ObjectId(res7[0]._id)
                    }, {
                            $set: {
                                flag: 0

                            }
                        }, {
                            upsert: true
                        }, function (err8, res8) {
                            if (err8) {
                                res.status(200).json({
                                    success: false,
                                    data: {
                                        message: err8
                                    }
                                });
                            } else {
                                res.status(200).json({
                                    success: true,
                                    data: {
                                        message: "Mail marked as favourite."
                                    }
                                });
                            }
                        })
                } else {
                    res.status(200).json({
                        success: false,
                        data: {
                            message: "Mail marked as favourite but could not update database."
                        }
                    });
                }
            }
        })
        // imap = new Imap({
        //     user: requestBody.emailDomain,
        //     password: requestBody.unique_id,
        //     host: 'box.catchletter.com',
        //     port: 993,
        //     tls: true
        // });
        // imap.once('ready', function () {
        //     openInbox(function (err, box) {
        //         if (err) {
        //             res.status(500).json({
        //                 success: false,
        //                 data: {
        //                     message: err
        //                 }
        //             });
        //         };
        //         imap.search([
        //             [requestBody.id]
        //         ], function (err, results) {
        //             if (err) {
        //                 res.status(500).json({
        //                     success: false,
        //                     data: {
        //                         message: err
        //                     }
        //                 });
        //             }

        //             if (results.length > 0) {
        //                 var f = imap.fetch(results, {
        //                     bodies: ''
        //                 });
        //                 f.on('message', function (msg, seqno) {

        //                     var prefix = '(#' + seqno + ') ';
        //                     msg.on('body', function (stream, info) { });
        //                     msg.once('attributes', function (attrs) {
        //                         imap.delFlags(requestBody.seqno, 'Flagged', function (err1, success1) {
        //                             if (err1) {
        //                                 res.status(500).json({
        //                                     success: false,
        //                                     data: {
        //                                         message: err1
        //                                     }
        //                                 });
        //                             } else {
        //                                 requestBody.seqno = Number(requestBody.seqno);
        //                                 collection.find({
        //                                     uid: requestBody.seqno,
        //                                     emailDomain: requestBody.emailDomain
        //                                 }).toArray(function (err7, res7) {
        //                                     if (err7) {
        //                                         res.status(500).json({
        //                                             success: false,
        //                                             data: {
        //                                                 message: err7
        //                                             }
        //                                         });
        //                                     } else {
        //                                         console.log("res7", res7);
        //                                         if (res7.length > 0) {
        //                                             collection.update({
        //                                                 _id: ObjectId(res7[0]._id)
        //                                             }, {
        //                                                     $set: {
        //                                                         flag: 0

        //                                                     }
        //                                                 }, {
        //                                                     upsert: true
        //                                                 }, function (err8, res8) {
        //                                                     if (err8) {
        //                                                         res.status(200).json({
        //                                                             success: false,
        //                                                             data: {
        //                                                                 message: err8
        //                                                             }
        //                                                         });
        //                                                     } else {
        //                                                         res.status(200).json({
        //                                                             success: true,
        //                                                             data: {
        //                                                                 message: "Mail marked as favourite."
        //                                                             }
        //                                                         });
        //                                                     }
        //                                                 })
        //                                         } else {
        //                                             res.status(200).json({
        //                                                 success: false,
        //                                                 data: {
        //                                                     message: "Mail marked as favourite but could not update database."
        //                                                 }
        //                                             });
        //                                         }
        //                                     }
        //                                 })

        //                             }
        //                         });
        //                     });
        //                     msg.once('end', function () {

        //                     });
        //                 });
        //                 f.once('error', function (err) {

        //                 });
        //                 f.once('end', function () {

        //                     imap.end();

        //                 });
        //             } else {
        //                 res.status(403).json({
        //                     success: false,
        //                     data: {
        //                         message: "No records found"
        //                     }
        //                 });
        //             }

        //         });
        //     });
        // });

        // imap.once('error', function (err) {
        //     res.status(500).json({
        //         success: false,
        //         data: {
        //             message: err
        //         }
        //     });
        // });

        // imap.once('end', function () {

        // });

        // imap.connect();
    } else {
        res.status(403).json({
            success: false,
            data: {
                message: "Email, Favourite Id and Password are required."
            }
        });
    }

}

websiteController.getWebsitesByHashtags = (req, res) => {
    const requestBody = req.body;
    if (requestBody.tag) {
        var collection = db.get().collection('websites');
        const requestBody = req.body;
        collection.find({
            tags: {
                $elemMatch: {
                    text: requestBody.tag
                }
            }
        }).toArray(function (err1, res1) {
            if (err1) {
                res.status(500).json({
                    success: false,
                    data: {
                        message: err
                    }
                });
            } else {
                res.status(200).json({
                    success: true,
                    data: {
                        message: res1
                    }
                });
            }
        })
    } else {
        res.status(403).json({
            success: false,
            data: {
                message: "Please select the tag."
            }
        });
    }

}
websiteController.getListOfFavourites = (req, res) => {
    const requestBody = req.body;
    if (requestBody.emailDomain && requestBody.unique_id) {
        var collection = db.get().collection('mailImages');
        collection.find({
            emailDomain: requestBody.emailDomain,
            flag: 1
        }).toArray(function (err2, res2) {
            if (err2) {
                res.status(403).json({
                    success: false,
                    data: {
                        message: err2
                    }
                });
            } else {
                if (res2.length > 0) {
                    res.status(200).json({
                        success: true,
                        data: {
                            message: res2
                        }
                    });
                } else {
                    res.status(403).json({
                        success: false,
                        data: {
                            message: "No favourites found."
                        }
                    });
                }
            }
        })
    } else {
        res.status(403).json({
            success: false,
            data: {
                message: "Email, Password and message id are required."
            }
        });
    }

}
// websiteController.getListOfFavourites = (req, res) => {
//     const requestBody = req.body;
//     if (requestBody.emailDomain && requestBody.unique_id) {
//         imap = new Imap({
//             user: requestBody.emailDomain,
//             password: requestBody.unique_id,
//             host: 'box.catchletter.com',
//             port: 993,
//             tls: true
//         });
//         const responseData = [];
//         const responseUids = [];
//         var i = "K";
//         imap.once('ready', function () {
//             openInbox(function (err, box) {
//                 if (err) {
//                     res.status(500).json({
//                         success: false,
//                         data: {
//                             message: err
//                         }
//                     });
//                 }
//                 imap.search([
//                     ['Flagged']
//                 ], function (err, results) {
//                     if (err) {
//                         res.status(500).json({
//                             success: false,
//                             data: {
//                                 message: err
//                             }
//                         });
//                     }
//                     if (results.length > 0) {
//                         var f = imap.fetch(results, {
//                             bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', '']
//                         });
//                         f.on('message', function (msg, seqno) {

//                             var prefix = '(#' + seqno + ') ';
//                             msg.on('body', function (stream, info) {

//                                 //    stream.pipe(fs.createWriteStream('msg-' + seqno + '-body.txt'));
//                                 var buffer = '';
//                                 stream.on('data', function (chunk) {

//                                     buffer += chunk.toString('utf8');


//                                 });
//                                 stream.once('end', function () {


//                                     const variableVal = Imap.parseHeader(buffer);

//                                     if (variableVal.to) {


//                                         variableVal1 = variableVal;
//                                     } else {

//                                     }


//                                     // var arr = buffer.split('</html>');
//                                     // var arr1 = arr[0].toString().split('<html>');
//                                     var arr = buffer.split('</body>');
//                                     var arr1 = arr[0].toString().split('<body');
//                                     if (info.which != "Text" && arr1[1]) {

//                                         responseData.push({
//                                             header: variableVal1,
//                                             body: '<html> <body' + arr1[1] + '</body></html>'.replace('/"', 'l'),
//                                             foot: arr[1],
//                                             uid: '',
//                                             seqno: seqno,
//                                             flag: '',
//                                             emailDomain: requestBody.emailDomain,
//                                             unique_id: requestBody.unique_id,
//                                             buffer: buffer
//                                         });
//                                         if (i == 'K') {
//                                             i = 0;
//                                         } else {
//                                             i = parseInt(i) + 1;
//                                         }

//                                     }

//                                 });
//                             });
//                             msg.once('attributes', function (attrs) {

//                                 if (responseData[i].uid == '') {
//                                     responseData[i].uid = attrs.uid;
//                                 }

//                                 // if (responseData[i].flag == '') {
//                                 //     responseData[i].flag = attrs.flags.length;
//                                 // }
//                                 if (responseData[i].flag == '') {
//                                     //responseData[i].flag = attrs.flags.length;
//                                     if (attrs.flags && attrs.flags.length && attrs.flags.length > 0) {
//                                         for (let i = 0; i < attrs.flags.length; i++) {
//                                             attrs.flags[i] = attrs.flags[i].replace(/\\/g, "");
//                                         }
//                                         if (attrs.flags.indexOf("Flagged") != -1) {
//                                             responseData[i].flag = 1;
//                                         } else {
//                                             responseData[i].flag = 0;
//                                         }
//                                         responseData[i].attrs = attrs.flags;
//                                     } else {
//                                         responseData[i].flag = 0;
//                                     }
//                                 }
//                                 // responseData_message = [];

//                             });
//                             msg.once('end', function () {

//                             });
//                         });
//                         f.once('error', function (err) {

//                         });
//                         f.once('end', function () {

//                             imap.end();
//                             res.status(200).json({
//                                 success: true,
//                                 data: {
//                                     message: responseData
//                                 }
//                             });
//                         });
//                     } else {
//                         res.status(200).json({
//                             success: false,
//                             data: {
//                                 message: "Nothing to fetch"
//                             }
//                         });
//                     }

//                 });
//             });
//         });

//         imap.once('error', function (err) {

//         });

//         imap.once('end', function () {

//         });

//         imap.connect();
//     } else {
//         res.status(403).json({
//             success: false,
//             data: {
//                 message: "Email, Password and message id are required."
//             }
//         });
//     }

// }




websiteController.updateCDate = (req, res) => {

    let collection = db.get().collection('mailImages');
    collection.find({}).toArray(function (err, res1) {
        (async function loop() {
            for (let i = 0; i < res1.length; i++) {
                console.log("i", i)
                await new Promise(resolve => {
                    console.log("new Date(res1[i]._id)", res1[i]._id)
                    collection.update({
                        _id: ObjectId(res1[i]._id)
                    }, {
                            $set: {
                                "cDate": new Date(res1[i].header.date[0])
                            }
                        }, {
                            upsert: true
                        },
                        function (err2, res2) {
                            if (err2) {
                                console.log("err2", err2);
                            } else {
                                console.log("updated")
                                resolve();
                            }
                        })
                });
                console.log(i);

            }
            res.status(200).json({
                status: true
            })



        })();


        //     console.log("res1[0]._id", res1[1]._id)
        //     console.log("res1[0].header.date[0]", new Date(res1[1].header.date[0]));
        //    collection.update({
        //            _id: ObjectId(res1[1]._id)
        //        }, {
        //            $set: {
        //                "cDate": new Date(res1[1].header.date[0])
        //            }
        //        }, {
        //            upsert: true
        //        },
        //        function (err2, res2) {
        //            if (err2) {
        //                console.log("err2", err2);
        //            } else {
        //                console.log("updated")
        //                 res.status(200).json({
        //                                     status: true
        //                                 })

        //            }
        //        })


    })
}

websiteController.getMailByIdWithScreenshot = (req, res) => {

    const requestBody = req.body;
    if (requestBody.emailDomain && requestBody.unique_id && requestBody.id) {
        imap = new Imap({
            user: requestBody.emailDomain,
            password: requestBody.unique_id,
            host: 'mail.catchletter.com',
            port: 993,
            tls: true
        });
        const responseData = [];
        const responseUids = [];
        var variableVal1 = '';
        imap.once('ready', function () {
            openInbox(function (err, box) {
                if (err) {
                    res.status(500).json({
                        success: false,
                        data: {
                            message: err
                        }
                    });
                }
                imap.search([
                    [requestBody.id]
                ], function (err, results) {
                    if (err) {
                        res.status(500).json({
                            success: false,
                            data: {
                                message: err
                            }
                        });
                    }
                    var f = imap.fetch(results, {
                        bodies: ''
                    });
                    f.on('message', function (msg, seqno) {

                        var prefix = '(#' + seqno + ') ';
                        msg.on('body', function (stream, info) {

                            var buffer = '';
                            stream.on('data', function (chunk) {
                                buffer += chunk.toString('utf8');

                            });
                            stream.once('end', function () {

                                const variableVal = Imap.parseHeader(buffer);

                                if (variableVal.to) {


                                    variableVal1 = variableVal;
                                } else {

                                }


                                var arr = buffer.split('</body>');

                                var arr1 = arr[0].toString().split('<body');

                                if (info.which != "Text" && arr1[1]) {

                                    responseData.push({
                                        header: variableVal1,
                                        body: '<html> <body' + arr1[1] + '</body></html>'.replace('/"', 'l'),
                                        foot: arr[1],
                                        uid: '',
                                        seqno: seqno,
                                        flag: '',
                                        buffer: buffer,
                                        htmlImage: ''
                                    });


                                }


                            });
                        });
                        msg.once('attributes', function (attrs) {
                            if (responseData[0].uid == '') {
                                responseData[0].uid = attrs.uid;
                            }

                            // if (responseData[0].flag == '') {
                            //     responseData[0].flag = attrs.flags.length;
                            // }

                            if (responseData[0].flag == '') {
                                //responseData[i].flag = attrs.flags.length;
                                if (attrs.flags && attrs.flags.length && attrs.flags.length > 0) {
                                    for (let i = 0; i < attrs.flags.length; i++) {
                                        attrs.flags[i] = attrs.flags[i].replace(/\\/g, "");
                                    }
                                    if (attrs.flags.indexOf("Flagged") != -1) {
                                        responseData[0].flag = 1;
                                    } else {
                                        responseData[0].flag = 0;
                                    }
                                    responseData[0].attrs = attrs.flags;
                                } else {
                                    responseData[0].flag = 0;
                                }
                            }
                        });
                        msg.once('end', function () {

                        });
                    });
                    f.once('error', function (err) {

                    });
                    f.once('end', function () {
                        const nameOfFile = "screenshots_" + requestBody.emailDomain + "_" + requestBody.id + ".png";
                        console.log("nameOfFile", nameOfFile);
                        (async function loop() {
                            await new Promise(resolve => {
                                fs.exists('./screenshots/' + nameOfFile, function (exists) {
                                    if (exists) {
                                        resolve();
                                    } else {
                                        simpleParser(responseData[0].buffer, (err, parsed) => {
                                            if (err) {
                                                console.log("error in parsing", err);
                                                throw err;
                                            } else {
                                                if (parsed.html) {
                                                    webshot(parsed.html, './screenshots/' + nameOfFile, {
                                                        siteType: 'html'
                                                    }, function (err) {
                                                        if (err) {
                                                            console.log("Error in converting");
                                                        } else {
                                                            resolve()
                                                        }
                                                    });
                                                }
                                            }
                                        });
                                    }
                                });


                            });
                            console.log("finally sending");
                            imap.end();
                            res.status(200).json({
                                success: true,
                                data: {
                                    message: responseData
                                }
                            });
                        })();

                    });
                });
            });
        });

        imap.once('error', function (err) {

        });

        imap.once('end', function () {

        });

        imap.connect();
    } else {
        res.status(403).json({
            success: false,
            data: {
                message: "Email, Password and message id are required."
            }
        });
    }

}


websiteController.getMailById = (req, res) => {

    const requestBody = req.body;
    const collection = db.get().collection('mailImages');
    if (requestBody.emailDomain && requestBody.unique_id && requestBody.id) {
        console.log(requestBody, "requestBody");
        imap = new Imap({
            user: requestBody.emailDomain,
            password: requestBody.unique_id,
            host: 'mail.catchletter.com',
            port: 993,
            tls: true,
            connTimeout: 20000,
            authTimeout: 20000,
            socketTimeout: 20000
        });
        const responseData = [];
        const responseUids = [];
        var variableVal1 = '';
        imap.once('ready', function () {
            console.log("ready");
            openInbox(function (err, box) {
                console.log("open Inbox");
                if (err) {
                    res.status(500).json({
                        success: false,
                        data: {
                            message: err
                        }
                    });
                }
                imap.search([
                    [requestBody.id]
                ], function (err, results) {
                    if (err) {
                        res.status(500).json({
                            success: false,
                            data: {
                                message: err
                            }
                        });
                    }
                    var f = imap.fetch(results, {
                        bodies: ''
                    });
                    f.on('message', function (msg, seqno) {

                        var prefix = '(#' + seqno + ') ';
                        msg.on('body', function (stream, info) {

                            var buffer = '';
                            stream.on('data', function (chunk) {
                                buffer += chunk.toString('utf8');

                            });
                            stream.once('end', function () {

                                const variableVal = Imap.parseHeader(buffer);

                                if (variableVal.to) {


                                    variableVal1 = variableVal;
                                } else {

                                }


                                var arr = buffer.split('</body>');

                                var arr1 = arr[0].toString().split('<body');

                                if (info.which != "Text" && arr1[1]) {

                                    responseData.push({
                                        header: variableVal1,
                                        body: '<html> <body' + arr1[1] + '</body></html>'.replace('/"', 'l'),
                                        foot: arr[1],
                                        uid: '',
                                        seqno: seqno,
                                        flag: '',
                                        buffer: buffer
                                    });


                                }


                            });
                        });
                        msg.once('attributes', function (attrs) {
                            if (responseData[0].uid == '') {
                                responseData[0].uid = attrs.uid;
                            }

                            // if (responseData[0].flag == '') {
                            //     responseData[0].flag = attrs.flags.length;
                            // }
                            if (responseData[0].flag == '') {
                                //responseData[i].flag = attrs.flags.length;
                                if (attrs.flags && attrs.flags.length && attrs.flags.length > 0) {
                                    for (let i = 0; i < attrs.flags.length; i++) {
                                        attrs.flags[i] = attrs.flags[i].replace(/\\/g, "");
                                    }
                                    if (attrs.flags.indexOf("Flagged") != -1) {
                                        responseData[0].flag = 1;
                                    } else {
                                        responseData[0].flag = 0;
                                    }
                                    responseData[0].attrs = attrs.flags;
                                } else {
                                    responseData[0].flag = 0;
                                }
                            }
                        });
                        msg.once('end', function () {

                        });
                    });
                    f.once('error', function (err) {

                    });
                    f.once('end', function () {

                        imap.end();
                        collection.find({
                            emailDomain: requestBody.emailDomain,
                            uid: Number(requestBody.id)
                        }).toArray(function (err4, res4) {
                            if (err4) {
                                res.status(500).json({
                                    success: false,
                                    data: {
                                        message: err4
                                    }
                                });
                            }
                            else {
                                if (res4.length > 0) {
                                    responseData[0].flag = res4[0].flag;
                                    res.status(200).json({
                                        success: true,
                                        data: {
                                            message: responseData
                                        }
                                    });
                                }
                            }
                        })

                    });
                });
            });
        });

        imap.once('error', function (err) {
            console.log("error", err);
            imap.end();
            res.status(403).json({
                success: false,
                data: {
                    message: "Please try again later."
                }
            });
        });

        imap.once('end', function () {
            console.log("end");
        });

        imap.connect();
    } else {
        res.status(403).json({
            success: false,
            data: {
                message: "Email, Password and message id are required."
            }
        });
    }

}


websiteController.insertWebsite = (req, res) => {
    var collection = db.get().collection('websites');
    var billingDoc = db.get().collection('Billing');
    var subscriptionDoc = db.get().collection('subscription');

    const requestBody = req.body;
    let totalWebsitesCount;
    var tags = db.get().collection('tags');
    if (requestBody.website_name && requestBody.homepage_url && requestBody.user_id) {
        collection.find({
            user_id: ObjectId(requestBody.user_id)
        }).toArray(function (err2, totalWebsites) {
            if (err2) {
                console.log("error in finding websites", err2);
                res.status(500).json({
                    success: false,
                    data: {
                        message: err2
                    }
                });
            } else {
                totalWebsitesCount = totalWebsites.length;
                console.log("totalWebsitesCount :", totalWebsitesCount);
                billingDoc.find({
                    userId: ObjectId(requestBody.user_id)
                }).toArray(function (err3, billingSuccess) {
                    if (err3) {
                        res.status(500).json({
                            success: false,
                            data: {
                                message: err3
                            }
                        });
                    } else {
                        if (billingSuccess.length > 0) {
                            const indexOfPlan = billingSuccess[0].details.length - 1;

                            const userPlanDetails = billingSuccess[0].details[indexOfPlan];
                            if (userPlanDetails) {

                                const subscriptionId = userPlanDetails.planDetails[0]._id;

                                if (subscriptionId) {
                                    subscriptionDoc.find({
                                        _id: ObjectId(subscriptionId)
                                    }).toArray(function (err4, subscriptionDetails) {
                                        if (err4) {
                                            res.status(500).json({
                                                success: false,
                                                data: {
                                                    message: err4
                                                }
                                            });
                                        } else {
                                            if (subscriptionDetails.length > 0) {
                                                const subscriptionCount = subscriptionDetails[0].noOfWebsites;
                                                console.log("subscriptionCount :", subscriptionCount);
                                                if (subscriptionCount > totalWebsitesCount) {
                                                    let removeSpecialCharacterRegex = /[^a-zA-Z ]/g;
                                                    let emailDomainName = requestBody.website_name.replace((removeSpecialCharacterRegex), "").replace(/ /g, '').toLowerCase();

                                                    requestBody.user_id = ObjectId(requestBody.user_id);
                                                    const unique_id = Math.floor(100000 + Math.random() * 90000000);
                                                    const emailDomain = emailDomainName + unique_id + "@catchletter.com";


                                                    requestBody.unique_id = unique_id;
                                                    requestBody.unique_id = requestBody.unique_id.toString();
                                                    requestBody.emailDomain = emailDomain;
                                                    curl
                                                    curl.setHeaders([
                                                        'Authorization: Basic YWRtaW5AY2F0Y2hsZXR0ZXIuY29tOmFkbWluMTIzNA=='
                                                    ])
                                                        .setBody({
                                                            'email': emailDomain,
                                                            'password': unique_id
                                                        })
                                                        .post('https://mail.catchletter.com/admin/mail/users/add')
                                                        .then(({
                                                            statusCode,
                                                            body,
                                                            headers
                                                        }) => {
                                                            console.log("statusCode", statusCode);
                                                            if (statusCode == 200) {
                                                                collection.save(requestBody, function (err1, success1) {


                                                                    if (err1) {
                                                                        res.status(500).json({
                                                                            success: false,
                                                                            data: {
                                                                                message: "Website not inserted"
                                                                            }
                                                                        });
                                                                    } else {
                                                                        var lastid = '';
                                                                        success1.ops.map((item) => {
                                                                            lastid = item._id;
                                                                        });

                                                                        if (requestBody.tags.length > 0) {




                                                                            let toFindTags = [];
                                                                            requestBody.tags.map((item) => {
                                                                                toFindTags.push(item.text);
                                                                            });
                                                                            tags.find({
                                                                                text: {
                                                                                    $in: toFindTags
                                                                                }
                                                                            }).toArray(function (err, res1) {
                                                                                if (err) {
                                                                                    res.status(500).json({
                                                                                        success: false,
                                                                                        data: {
                                                                                            message: err
                                                                                        }
                                                                                    });
                                                                                } else {
                                                                                    if (toFindTags.length == res1.length) {
                                                                                        res.status(200).json({
                                                                                            success: true,
                                                                                            data: {
                                                                                                message: "Website inserted successfully",
                                                                                                emailDomain: emailDomain,
                                                                                                statusCode: statusCode,
                                                                                                body: body,
                                                                                                headers: headers,
                                                                                                totalWebsitesCount: totalWebsitesCount + 1
                                                                                            }
                                                                                        });
                                                                                    } else {
                                                                                        let presentTags = [];
                                                                                        let toInsertTags = [];
                                                                                        res1.map((item) => {
                                                                                            presentTags.push(item.text);
                                                                                        })
                                                                                        for (let i = 0; i < toFindTags.length; i++) {
                                                                                            if (!presentTags.includes(toFindTags[i])) {
                                                                                                toInsertTags.push({
                                                                                                    text: toFindTags[i],
                                                                                                    website_id: lastid
                                                                                                });
                                                                                            }
                                                                                        }
                                                                                        tags.insert(toInsertTags, function (err2, res2) {
                                                                                            if (err2) {
                                                                                                res.status(500).json({
                                                                                                    success: false,
                                                                                                    data: {
                                                                                                        message: err2
                                                                                                    }
                                                                                                });
                                                                                            } else {
                                                                                                res.status(200).json({
                                                                                                    success: true,
                                                                                                    data: {
                                                                                                        message: "Website inserted successfully",
                                                                                                        emailDomain: emailDomain,
                                                                                                        statusCode: statusCode,
                                                                                                        body: body,
                                                                                                        headers: headers,
                                                                                                        totalWebsitesCount: totalWebsitesCount + 1
                                                                                                    }
                                                                                                });
                                                                                            }
                                                                                        })
                                                                                    }

                                                                                }
                                                                            })
                                                                        } else {
                                                                            res.status(200).json({
                                                                                success: true,
                                                                                data: {
                                                                                    message: "Website inserted successfully",
                                                                                    emailDomain: emailDomain,
                                                                                    statusCode: statusCode,
                                                                                    body: body,
                                                                                    headers: headers,
                                                                                    totalWebsitesCount: totalWebsitesCount + 1
                                                                                }
                                                                            });
                                                                        }

                                                                    }
                                                                })
                                                            } else {
                                                                res.status(403).json({
                                                                    success: false,
                                                                    data: {
                                                                        message: body
                                                                    }
                                                                });
                                                            }


                                                        })
                                                        .catch((e) => {
                                                            res.status(500).json({
                                                                success: false,
                                                                data: {
                                                                    e: e
                                                                }
                                                            });
                                                        });
                                                } else {
                                                    res.status(402).json({
                                                        success: false,
                                                        data: {
                                                            message: "You have exceeded the maximum no of websites that can be added for your subscription."
                                                        }
                                                    });
                                                }
                                            }
                                        }
                                    })
                                }
                            }
                        }
                    }
                })

            }
        })


    } else {
        res.status(403).json({
            success: false,
            data: {
                message: 'Webiste name, User Id and HomePage Url are required.'
            }
        });
    }

}



websiteController.getAllWebsitesByUserId = (req, res) => {

    const requestBody = req.param('id');
    if (requestBody) {
        var collection = db.get().collection('websites');
        collection.find({
            user_id: ObjectId(requestBody)
        }).sort([
            ['_id', -1]
        ]).toArray(function (err, success) {
            if (err) {
                res.status(500).json({
                    success: false,
                    data: err
                });
            } else {
                if (success.length > 0) {
                    const toSendData = success;


                    res.status(200).json({
                        success: true,
                        data: {
                            websiteList: toSendData
                        }
                    })
                } else {
                    res.status(404).json({
                        success: false,
                        data: {
                            message: "No records found."
                        }
                    })
                }
            }
        })
    } else {
        res.status(403).json({
            success: false,
            data: {
                message: "User Id is required."
            }
        })
    }

}


websiteController.getAllWebsitesByUserIdWithPagination = (req, res) => {

    var collection = db.get().collection('websites');
    const requestBody = req.body;

    if (requestBody.page < 0 || requestBody.page == 0) {
        res.status(403).json({
            success: false,
            data: "Please provide valid page no."
        });
    } else {
        let toFindTags = [];
        if (requestBody.tags) {
            toFindTags.push(requestBody.tags);
        }
        requestBody.page = Number(requestBody.page);
        let query = {};
        const size = 10;
        query.skip = size * (requestBody.page - 1)
        query.limit = size
        let toFindQuery = {};
        if (requestBody.id) {
            toFindQuery.user_id = ObjectId(requestBody.id);
        }
        if (requestBody.tags) {
            toFindQuery["tags.text"] = {
                $in: toFindTags
            };
        };
        if (requestBody.subject) {
            var x = [requestBody.subject],
                regex = x.map(function (e) {
                    return new RegExp(e, "i");
                });
            toFindQuery["website_name"] = {
                $in: regex
            }
        }
        console.log("toFindQuery :", toFindQuery);
        collection.find(toFindQuery).toArray(function (err2, res2) {
            if (err2) {
                res.status(500).json({
                    success: false,
                    data: {
                        message: err2
                    }
                });
            } else {
                collection.find(toFindQuery, {}, query).sort([
                    ['_id', -1]
                ]).toArray(function (err1, res1) {
                    if (err1) {
                        res.status(500).json({
                            success: false,
                            data: {
                                message: err1
                            }
                        });
                    } else {
                        res.status(200).json({
                            success: true,
                            data: {
                                message: res1,
                                totalCount: res2.length,
                                // message1: res2
                            }
                        });
                    }
                })
            }
        });
    }

}

websiteController.deleteWebsiteById = (req, res) => {

    const requestBody = req.param('id');
    if (requestBody) {
        console.log("requestBody", requestBody);
        var collection = db.get().collection('websites');
        collection.find({
            _id: ObjectId(requestBody)
        }).toArray(function (err, success) {
            if (err) {
                res.status(500).json({
                    success: false,
                    data: err
                });
            } else {
                if (success.length > 0) {
                    const emailTodelete = success[0].emailDomain;
                    curl
                    curl.setHeaders([
                        'Authorization: Basic YWRtaW5AY2F0Y2hsZXR0ZXIuY29tOmFkbWluMTIzNA=='
                    ])
                        .setBody({
                            'email': emailTodelete,
                        })
                        .post('https://mail.catchletter.com/admin/mail/users/remove')
                        .then(({
                            statusCode,
                            body,
                            headers
                        }) => {
                            if (statusCode == 200) {
                                collection.remove({
                                    "_id": ObjectId(requestBody)
                                }, function (err1, success1) {
                                    if (err1) {
                                        res.status(500).json({
                                            success: false,
                                            data: err1
                                        });
                                    } else {




                                        var collection_tag = db.get().collection('tags');
                                        collection_tag.find({
                                            website_id: ObjectId(requestBody)
                                        }).toArray(function (err, success1) {

                                            if (err) {
                                                //  res.status(500).json({
                                                //      success: false,
                                                //      data: err
                                                //  });
                                            } else {
                                                if (success1.length > 0) {

                                                    success1.map((item) => {
                                                        collection_tag.remove({
                                                            "_id": ObjectId(item._id)
                                                        }, function (err1, success2) { })
                                                    });


                                                } else {

                                                }
                                            }
                                        });
                                        res.status(200).json({
                                            success: true,
                                            data: {
                                                message: "Records deleted successfully."
                                            }
                                        });
                                    }
                                })
                            } else {
                                res.status(403).json({
                                    success: false,
                                    data: {
                                        message: body
                                    }
                                });
                            }


                        })
                        .catch((e) => {
                            res.status(500).json({
                                success: false,
                                data: {
                                    e: e
                                }
                            });
                        });

                } else {
                    res.status(404).json({
                        success: false,
                        data: {
                            message: "No records found."
                        }
                    })
                }
            }
        })
    } else {
        res.status(403).json({
            success: false,
            data: {
                message: "User Id is required."
            }
        })
    }

}


websiteController.getPerticularWebsites = (req, res) => {
    let collection = db.get().collection('websites');
    let websiteId = req.query.id;

    collection.find({
        _id: ObjectId(websiteId)
    }).toArray(function (err, success) {
        if (err) {
            res.status(500).json({
                success: false,
                data: err1
            });
        } else if (success) {
            res.status(200).json({
                success: true,
                data: {
                    data: success
                }
            });
        }

    });
}

websiteController.updateParticularWesbite = (req, res) => {
    let collection = db.get().collection('websites');
    let tags = db.get().collection('tags');
    let websiteId = req.body._id;
    const requestBody = req.body;

    collection.find({
        _id: ObjectId(websiteId)
    }).toArray(function (err, success) {
        if (err) {
            res.status(500).json({
                success: false,
                data: err1
            });
        } else if (success) {
            delete requestBody._id;
            if (success.length > 0) {
                collection.update({
                    _id: ObjectId(websiteId)
                }, {
                        $set: requestBody
                    }, {
                        upsert: true
                    }, function (err2, success1) {
                        if (err2) {
                            res.status(500).json({
                                success: false,
                                data: err2
                            });
                        } else {
                            if (requestBody.tags.length > 0) {
                                let toFindTags = [];
                                requestBody.tags.map((item) => {
                                    toFindTags.push(item.text);
                                });
                                tags.find({
                                    text: {
                                        $in: toFindTags
                                    }
                                }).toArray(function (err3, success3) {
                                    if (err3) {
                                        res.status(500).json({
                                            success: false,
                                            data: err3
                                        });
                                    } else {
                                        if (toFindTags.length == success3.length) {
                                            res.status(200).json({
                                                success: true,
                                                data: "website updated successfully."
                                            });
                                        } else {
                                            let presentTags = [];
                                            let toInsertTags = [];
                                            success3.map((item) => {
                                                presentTags.push(item.text);
                                            })
                                            for (let i = 0; i < toFindTags.length; i++) {
                                                if (!presentTags.includes(toFindTags[i])) {
                                                    toInsertTags.push({
                                                        text: toFindTags[i],
                                                        website_id: websiteId
                                                    });
                                                }
                                            }
                                            tags.insert(toInsertTags, function (err4, success4) {
                                                if (err4) {
                                                    res.status(500).json({
                                                        success: false,
                                                        data: err4
                                                    });
                                                } else {
                                                    res.status(200).json({
                                                        success: true,
                                                        data: "website updated successfully."
                                                    });
                                                }
                                            })
                                        }
                                    }
                                })

                            } else {
                                res.status(200).json({
                                    success: true,
                                    data: "website updated successfully."
                                });
                            }
                        }
                    })

            } else {
                res.status(403).json({
                    success: false,
                    data: "website not found."
                });
            }
        }
    });
}



function getMailList(emailDomain, unique_id, i, res, callback) {

    let variableVal;
    imap = new Imap({
        user: emailDomain,
        password: unique_id,
        host: 'mail.catchletter.com',
        port: 993,
        tls: true
    });

    imap.once('ready', function () {

        openInbox(function (err, box) {
            if (err) {
                res.status(500).json({
                    success: false,
                    data: {
                        message: err
                    }
                });
            }
            imap.search([
                ['Flagged']
            ], function (err, results) {
                if (err) {
                    res.status(500).json({
                        success: false,
                        data: {
                            message: err
                        }
                    });
                }
                if (results.length > 0) {
                    var f = imap.fetch(results, {
                        bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', '']
                    });
                    f.on('message', function (msg, seqno) {

                        var prefix = '(#' + seqno + ') ';
                        msg.on('body', function (stream, info) {

                            // stream.pipe(fs.createWriteStream('msg-' + seqno + '-body.txt'));
                            var buffer = '';
                            stream.on('data', function (chunk) {

                                buffer += chunk.toString('utf8');


                            });
                            stream.once('end', function () {


                                const variableVal = Imap.parseHeader(buffer);

                                if (variableVal.to) {


                                    variableVal1 = variableVal;
                                } else {

                                }


                                // var arr = buffer.split('</html>');
                                // var arr1 = arr[0].toString().split('<html>');
                                var arr = buffer.split('</body>');
                                var arr1 = arr[0].toString().split('<body');

                                if (info.which != "Text" && arr1[1]) {

                                    allMails.push({
                                        header: variableVal1,
                                        body: '<html> <body' + arr1[1] + '</body></html>'.replace('/"', 'l'),
                                        foot: arr[1],
                                        uid: '',
                                        seqno: seqno,
                                        flag: '',
                                        emailDomain: emailDomain,
                                        unique_id: unique_id,
                                        buffer: buffer
                                    });


                                }

                            });
                        });
                        msg.once('attributes', function (attrs) {
                            let index = allMails.length - 1;
                            if (allMails[index].uid == '') {
                                allMails[index].uid = attrs.uid;
                            }

                            // if (allMails[index].flag == '') {
                            //     allMails[index].flag = attrs.flags.length;
                            // }
                            if (allMails[index].flag == '') {
                                //responseData[i].flag = attrs.flags.length;
                                if (attrs.flags && attrs.flags.length && attrs.flags.length > 0) {
                                    for (let i = 0; i < attrs.flags.length; i++) {
                                        attrs.flags[i] = attrs.flags[i].replace(/\\/g, "");
                                    }
                                    if (attrs.flags.indexOf("Flagged") != -1) {
                                        allMails[index].flag = 1;
                                    } else {
                                        allMails[index].flag = 0;
                                    }
                                    allMails[index].attrs = attrs.flags;
                                } else {
                                    allMails[index].flag = 0;
                                }
                            }
                            // responseData_message = [];

                        });
                        msg.once('end', function () {

                        });
                    });
                    f.once('error', function (err) {

                    });
                    f.once('end', function () {

                        imap.end();
                    });
                } else {
                    callback();
                }

            });
        });

    });

    imap.once('error', function (err) {

        res.status(403).json({
            success: false,
            data: {
                message: "No message found"
            }
        });
    });

    imap.once('end', function () {

        callback();
    });
    imap.connect();
}



function getMailListForAllFavourites(emailDomain, unique_id, i, res, fromDate, toDate, typeofmail, callback) {
    let variableVal;

    imap = new Imap({
        user: emailDomain,
        password: unique_id,
        host: 'mail.catchletter.com',
        port: 993,
        tls: true
    });

    imap.once('ready', function () {

        openInbox(function (err, box) {
            if (err) {
                res.status(500).json({
                    success: false,
                    data: {
                        message: err
                    }
                });
            }
            imap.search([
                typeofmail, ['Since', fromDate],
                ['Before', toDate]
            ], function (err, results) {
                if (err) {
                    res.status(500).json({
                        success: false,
                        data: {
                            message: err
                        }
                    });
                }
                if (results.length > 0) {
                    var f = imap.fetch(results, {
                        bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', '']
                    });
                    f.on('message', function (msg, seqno) {

                        var prefix = '(#' + seqno + ') ';
                        msg.on('body', function (stream, info) {

                            // stream.pipe(fs.createWriteStream('msg-' + seqno + '-body.txt'));
                            var buffer = '';
                            stream.on('data', function (chunk) {

                                buffer += chunk.toString('utf8');


                            });
                            stream.once('end', function () {


                                const variableVal = Imap.parseHeader(buffer);

                                if (variableVal.to) {


                                    variableVal1 = variableVal;
                                } else {

                                }


                                // var arr = buffer.split('</html>');
                                // var arr1 = arr[0].toString().split('<html>');
                                var arr = buffer.split('</body>');
                                var arr1 = arr[0].toString().split('<body');

                                if (info.which != "Text" && arr1[1]) {

                                    allMailsFilter.push({
                                        header: variableVal1,
                                        body: '<html> <body' + arr1[1] + '</body></html>'.replace('/"', 'l'),
                                        foot: arr[1],
                                        uid: '',
                                        seqno: seqno,
                                        flag: '',
                                        emailDomain: emailDomain,
                                        unique_id: unique_id,
                                        buffer: buffer
                                    });


                                }

                            });
                        });
                        msg.once('attributes', function (attrs) {

                            let index = allMailsFilter.length - 1;
                            if (allMailsFilter[index].uid == '') {
                                allMailsFilter[index].uid = attrs.uid;
                            }

                            // if (allMailsFilter[index].flag == '') {
                            //     allMailsFilter[index].flag = attrs.flags.length;
                            // }

                            if (allMailsFilter[index].flag == '') {
                                //responseData[i].flag = attrs.flags.length;
                                if (attrs.flags && attrs.flags.length && attrs.flags.length > 0) {
                                    for (let i = 0; i < attrs.flags.length; i++) {
                                        attrs.flags[i] = attrs.flags[i].replace(/\\/g, "");
                                    }
                                    if (attrs.flags.indexOf("Flagged") != -1) {
                                        allMailsFilter[index].flag = 1;
                                    } else {
                                        allMailsFilter[index].flag = 0;
                                    }
                                    allMailsFilter[index].attrs = attrs.flags;
                                } else {
                                    allMailsFilter[index].flag = 0;
                                }
                            }
                            // responseData_message = [];

                        });
                        msg.once('end', function () {

                        });
                    });
                    f.once('error', function (err) {

                    });
                    f.once('end', function () {

                        imap.end();
                    });
                } else {
                    callback();
                }

            });
        });

    });

    imap.once('error', function (err) {

        callback();
    });

    imap.once('end', function () {

        callback();
    });
    imap.connect();
}

function getMailListWithoutFavourite(emailDomain, unique_id, i, res, callback) {
    let variableVal;
    imap = new Imap({
        user: emailDomain,
        password: unique_id,
        host: 'mail.catchletter.com',
        port: 993,
        tls: true
    });

    imap.once('ready', function () {

        openInbox(function (err, box) {

            // if (err) throw err;
            imap.search(['ALL', ['SINCE', 'May 20, 2000']], function (err, results) {
                if (results.length > 0) {

                    // if (err) throw err;
                    var f = imap.fetch(results, {
                        bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', '']
                    });
                    f.on('message', function (msg, seqno) {

                        var prefix = '(#' + seqno + ') ';
                        msg.on('body', function (stream, info) {

                            //   stream.pipe(fs.createWriteStream('msg-' + seqno + '-body.txt'));
                            var buffer = '';
                            stream.on('data', function (chunk) {
                                buffer += chunk.toString('utf8');


                            });
                            stream.once('end', function () {

                                const variableVal = Imap.parseHeader(buffer);

                                if (variableVal.to) {


                                    variableVal1 = variableVal;
                                } else {

                                }

                                var arr = buffer.split('</body>');
                                var arr1 = arr[0].toString().split('<body');
                                // var arr = buffer.split('</html>');
                                // var arr1 = arr[0].toString().split('<html>');
                                if (info.which != "Text" && arr1[1]) {

                                    allMails.push({
                                        header: variableVal1,
                                        body: '<html> <body' + arr1[1] + '</body></html>'.replace('/"', 'l'),
                                        foot: arr[1],
                                        uid: '',
                                        seqno: seqno,
                                        flag: '',
                                        emailDomain: emailDomain,
                                        unique_id: unique_id,
                                        buffer: buffer
                                    });

                                }

                            });
                        });
                        msg.once('attributes', function (attrs) {
                            let index = allMails.length - 1;
                            if (allMails[index].uid == '') {
                                allMails[index].uid = attrs.uid;
                            }

                            // if (allMails[index].flag == '') {
                            //     allMails[index].flag = attrs.flags.length;
                            // }
                            if (allMails[index].flag == '') {
                                //responseData[i].flag = attrs.flags.length;
                                if (attrs.flags && attrs.flags.length && attrs.flags.length > 0) {
                                    for (let i = 0; i < attrs.flags.length; i++) {
                                        attrs.flags[i] = attrs.flags[i].replace(/\\/g, "");
                                    }
                                    if (attrs.flags.indexOf("Flagged") != -1) {
                                        allMails[index].flag = 1;
                                    } else {
                                        allMails[index].flag = 0;
                                    }
                                    allMails[index].attrs = attrs.flags;
                                } else {
                                    allMails[index].flag = 0;
                                }
                            }
                            // responseData_message = [];

                        });
                        msg.once('end', function () {

                        });
                    });
                    f.once('error', function (err) {

                    });
                    f.once('end', function () {

                        imap.end();


                    });
                } else {
                    // res.status(200).json({
                    //     success: false,
                    //     data: 'No mail found'
                    // });
                    //callback();
                }
            });

        });

    });

    imap.once('error', function (err) {

        res.status(403).json({
            success: false,
            data: {
                message: "No message found"
            }
        });
    });

    imap.once('end', function () {

        callback();
    });
    imap.connect();
}

websiteController.getListOfFavouritesByUserId = (req, res) => {
    let collection = db.get().collection('mailImages');
    allMails = [];
    const websiteId = req.param('id');
    const page = req.param('page');
    const requestBody = req.body;

    collection.find({
        user_id: ObjectId(websiteId),
        flag: 1
    }).toArray(function (err, success) {
        if (err) {
            res.status(500).json({
                success: false,
                data: err1
            });
        } else if (success) {

            if (success.length > 0) {
                let query = {};
                const size = 10;
                query.skip = size * (page - 1)
                query.limit = size
                collection.find({}, {}, query).toArray(function (error, data1) {
                    if (error) {
                        res.status(500).json({
                            success: false,
                            data: error
                        });
                    } else {

                        res.status(200).json({
                            success: true,
                            data: {
                                message: data1,
                                totalCount: success.length
                            }
                        });

                    }
                })



            } else {
                res.status(403).json({
                    success: false,
                    data: "No mails found."
                });
            }
        }
    });
}

// websiteController.getListOfFavouritesByUserId = (req, res) => {
//     let collection = db.get().collection('websites');
//     allMails = [];
//     const websiteId = req.param('id');
//     const requestBody = req.body;

//     collection.find({
//         user_id: ObjectId(websiteId)
//     }).toArray(function (err, success) {
//         if (err) {
//             res.status(500).json({
//                 success: false,
//                 data: err1
//             });
//         } else if (success) {

//             if (success.length > 0) {


//                 var x = 0;
//                 var loopArray = function (success) {
//                     getMailList(success[x].emailDomain, success[x].unique_id, x, res, function () {
//                         // set x to next item
//                         x++;
//                         // any more items in array? continue loop
//                         if (x < success.length) {
//                             loopArray(success);
//                         } else {
//                             res.status(200).json({
//                                 success: true,
//                                 data: {
//                                     message: allMails
//                                 }
//                             });
//                         }
//                     });
//                 }
//                 loopArray(success);


//             } else {
//                 res.status(403).json({
//                     success: false,
//                     data: "No websites found."
//                 });
//             }
//         }
//     });
// }

websiteController.getListOfMailsByUserId = (req, res) => {
    let collection = db.get().collection('mailImages');
    const websiteId = req.param('id');
    const requestBody = req.body;

    collection.find({
        user_id: ObjectId(websiteId)
    }).toArray(function (err, success) {
        if (err) {
            res.status(500).json({
                success: false,
                data: err
            });
        } else if (success) {
            if (success.length > 0) {

                res.status(200).json({
                    success: true,
                    data: {
                        message: success
                    }
                });


            } else {
                res.status(403).json({
                    success: false,
                    data: "No mails found."
                });
            }
        }
    });
}

function getDayName(dd) {
    let dayName;
    switch (dd) {
        case 0:
            dayName = "Sun";
            break;
        case 1:
            dayName = "Mon";
            break
        case 2:
            dayName = "Tue";
            break
        case 3:
            dayName = "Wed";
            break
        case 4:
            dayName = "Thu";
            break
        case 5:
            dayName = "Fri";
            break
        case 6:
            dayName = "Sat";
            break
        default:
            break;
    }
    return dayName;
}


websiteController.getListOfMailsByUserIdWithPagination = (req, res) => {
    let collection = db.get().collection('mailImages');

    const requestBody = req.body;
    // collection.update({}, {
    //     $set: {
    //         "cDate": new Date()
    //     }
    // }, {
    //         upsert: false,
    //         multi: true
    //     })
    if (requestBody.page < 0 || requestBody.page == 0) {
        res.status(403).json({
            success: false,
            data: "Please provide valid page no."
        });
    } else {
        let toFindTags = [];
        if (requestBody.tags) {

            toFindTags.push(requestBody.tags);
        }
        let toDate, fromDate;
        let toFindQuery = {};
        if (requestBody.fromDate && requestBody.toDate) {
            const fromDate1 = requestBody.fromDate.split('/');
            const toDate1 = requestBody.toDate.split('/');
            //let fromDate2 = getDayName(new Date(requestBody.fromDate).getDay()) + " ," + fromDate1[0] + " " + getMonthName(fromDate1[1]) + " " + fromDate1[2];
            //fromDate = getMonthName(fromDate1[1]) + " " + fromDate1[0] + "," + fromDate1[2];
            // let toDate2 = getMonthName(toDate1[1]) + " " + toDate1[0] + "," + toDate1[2];
            // let fromDate2 = getMonthName(fromDate1[1]) + " " + fromDate1[0] + "," + fromDate1[2];

            let toDate2 = toDate1[2] + " " + getMonthName(toDate1[1]) + "," + toDate1[0];
            let fromDate2 = fromDate1[2] + " " + getMonthName(fromDate1[1]) + "," + fromDate1[0];;
            // fromDate = new Date(fromDate2).setHours(0, 0, 0, 0);
            // toDate = new Date(toDate2).setHours(0, 0, 0, 0);
            fromDate = new Date(fromDate2);
            toDate = new Date(toDate2);
            // console.log('fromDate', fromDate);
            // console.log('toDate', toDate);
            toFindQuery.cDate = {
                $gte: new Date(fromDate),
                $lte: new Date(toDate)
            }
        }


        requestBody.page = Number(requestBody.page);
        let query = {};
        const size = 10;
        query.skip = size * (requestBody.page - 1)
        query.limit = size

        if (requestBody.id) {
            toFindQuery.user_id = ObjectId(requestBody.id);
        }
        if (requestBody.tags) {
            toFindQuery["tags.text"] = {
                $in: toFindTags
            };

        };
        // if (requestBody.emailDomain) {
        //     toFindQuery.emailDomain = requestBody.emailDomain;
        //     toFindQuery.unique_id = requestBody.unique_id;
        // }

        if (requestBody.websiteId) {
            toFindQuery.website_id = ObjectId(requestBody.websiteId);
            // toFindQuery.unique_id = requestBody.unique_id;
        }
        if (requestBody.subject) {
            var x = [requestBody.subject],
                regex = x.map(function (e) {
                    return new RegExp(e, "i");
                });
            toFindQuery["header.subject"] = {
                $in: regex
            }
        }
        console.log("toFindQuery", toFindQuery)
        collection.find(toFindQuery).toArray(function (err2, res2) {
            if (err2) {
                res.status(500).json({
                    success: false,
                    data: {
                        message: err2
                    }
                });
            } else {
                collection.find(toFindQuery, {}, query).sort([
                    ['_id', -1]
                ]).toArray(function (err1, res1) {
                    // collection.find(toFindQuery).sort({
                    //         "_id": 1
                    //     }).limit(query.limit).skip(query.skip).toArray(function (err1, res1) {
                    if (err1) {
                        res.status(500).json({
                            success: false,
                            data: {
                                message: err1
                            }
                        });
                    } else {
                        res.status(200).json({
                            success: true,
                            data: {
                                message: res1,
                                totalCount: res2.length,
                                message1: res2
                            }
                        });
                        // if (requestBody.subject) {
                        //     let newItems = [];
                        //     let newItems1 = [];
                        //     res1.map((item) => {
                        //         if (item.header && item.header.subject && item.header.subject.length && item.header.subject.length > 0) {
                        //             if (item.header.subject[0].toLowerCase().includes(requestBody.subject.toLowerCase())) {
                        //                 newItems.push(item);
                        //             }
                        //         }
                        //     });
                        //     let totalItems1Count = 0;
                        //     res2.map((item) => {
                        //         if (item.header && item.header.subject && item.header.subject.length && item.header.subject.length > 0) {
                        //             if (item.header.subject[0].toLowerCase().includes(requestBody.subject.toLowerCase())) {
                        //                 totalItems1Count = totalItems1Count + 1;
                        //                 newItems1.push(item);
                        //             }
                        //         }
                        //     });

                        //     if (requestBody.fromDate && requestBody.toDate) {
                        //         let finalItems = [];
                        //         for (let i = 0; i < newItems.length; i++) {
                        //             // let toCompareDate = new Date(newItems[i].header.date[0].split(" ")[0] + newItems[i].header.date[0].split(" ")[1] + newItems[i].header.date[0].split(" ")[2] + newItems[i].header.date[0].split(" ")[3]).setHours(0, 0, 0, 0);
                        //             let toCompareDate = new Date(newItems[i].header.date[0].split(" ")[3] + newItems[i].header.date[0].split(" ")[2] + newItems[i].header.date[0].split(" ")[1]);
                        //             if (toCompareDate >= fromDate && toCompareDate < toDate) {
                        //                 finalItems.push(newItems[i]);
                        //             }
                        //         }
                        //         for (let i = 0; i < newItems1.length; i++) {
                        //             // let toCompareDate = new Date(newItems[i].header.date[0].split(" ")[0] + newItems[i].header.date[0].split(" ")[1] + newItems[i].header.date[0].split(" ")[2] + newItems[i].header.date[0].split(" ")[3]).setHours(0, 0, 0, 0);
                        //             let toCompareDate = new Date(newItems1[i].header.date[0].split(" ")[3] + newItems1[i].header.date[0].split(" ")[2] + newItems1[i].header.date[0].split(" ")[1]);
                        //             if (toCompareDate >= fromDate && toCompareDate < toDate) {
                        //                 totalItems1Count = totalItems1Count + 1;
                        //             }
                        //         }
                        //         res.status(200).json({
                        //             success: true,
                        //             data: {
                        //                 message: finalItems,
                        //                 totalCount: totalItems1Count
                        //             }
                        //         });
                        //     } else {
                        //         res.status(200).json({
                        //             success: true,
                        //             data: {
                        //                 message: newItems,
                        //                 totalCount: totalItems1Count
                        //             }
                        //         });
                        //     }

                        // } else if (requestBody.fromDate) {
                        //     let newItems = [];
                        //     let totalCountOfItems = 0;
                        //     for (let i = 0; i < res1.length; i++) {
                        //         // let toCompareDate = new Date(res1[i].header.date[0].split(" ")[3] + res1[i].header.date[0].split(" ")[2] + res1[i].header.date[0].split(" ")[1]).setHours(0, 0, 0, 0);
                        //         // let testDate = new Date(res1[i].header.date[0].split(" ")[3] + res1[i].header.date[0].split(" ")[2] + res1[i].header.date[0].split(" ")[1]);
                        //         // console.log(testDate, "testDae")
                        //         let toCompareDate = new Date(res1[i].header.date[0].split(" ")[3] + res1[i].header.date[0].split(" ")[2] + res1[i].header.date[0].split(" ")[1]);
                        //         console.log(toCompareDate, "testDae")
                        //         if (toCompareDate >= fromDate && toCompareDate < toDate) {
                        //             newItems.push(res1[i]);
                        //         }
                        //     }

                        //     for (let i = 0; i < res2.length; i++) {
                        //         // let toCompareDate = new Date(res1[i].header.date[0].split(" ")[3] + res1[i].header.date[0].split(" ")[2] + res1[i].header.date[0].split(" ")[1]).setHours(0, 0, 0, 0);
                        //         // let testDate = new Date(res1[i].header.date[0].split(" ")[3] + res1[i].header.date[0].split(" ")[2] + res1[i].header.date[0].split(" ")[1]);
                        //         // console.log(testDate, "testDae")
                        //         let toCompareDate = new Date(res2[i].header.date[0].split(" ")[3] + res2[i].header.date[0].split(" ")[2] + res2[i].header.date[0].split(" ")[1]);
                        //         console.log(toCompareDate, "testDae")
                        //         if (toCompareDate >= fromDate && toCompareDate < toDate) {
                        //             totalCountOfItems = totalCountOfItems + 1;
                        //         }
                        //     }
                        //     res.status(200).json({
                        //         success: true,
                        //         data: {
                        //             message: newItems,
                        //             totalCount: totalCountOfItems
                        //         }
                        //     });


                        // } else {
                        //     res.status(200).json({
                        //         success: true,
                        //         data: {
                        //             message: res1,
                        //             totalCount: res2.length,
                        //             message1: res2
                        //         }
                        //     });
                        // }
                    }
                })
            }
        })

    }
}


websiteController.getListOfFavouriteMailsWithPagination = (req, res) => {
    let collection = db.get().collection('mailImages');

    const requestBody = req.body;
    // collection.update({}, {
    //     $set: {
    //         "cDate": new Date()
    //     }
    // }, {
    //     upsert: false,
    //     multi: true
    // })
    if (requestBody.page < 0 || requestBody.page == 0) {
        res.status(403).json({
            success: false,
            data: "Please provide valid page no."
        });
    } else {
        let toFindTags = [];
        if (requestBody.tags) {

            toFindTags.push(requestBody.tags);
        }
        let toDate, fromDate;
        let toFindQuery = {};
        if (requestBody.fromDate && requestBody.toDate) {
            const fromDate1 = requestBody.fromDate.split('/');
            const toDate1 = requestBody.toDate.split('/');
            //let fromDate2 = getDayName(new Date(requestBody.fromDate).getDay()) + " ," + fromDate1[0] + " " + getMonthName(fromDate1[1]) + " " + fromDate1[2];
            //fromDate = getMonthName(fromDate1[1]) + " " + fromDate1[0] + "," + fromDate1[2];
            // let toDate2 = getMonthName(toDate1[1]) + " " + toDate1[0] + "," + toDate1[2];
            // let fromDate2 = getMonthName(fromDate1[1]) + " " + fromDate1[0] + "," + fromDate1[2];

            let toDate2 = toDate1[2] + " " + getMonthName(toDate1[1]) + "," + toDate1[0];
            let fromDate2 = fromDate1[2] + " " + getMonthName(fromDate1[1]) + "," + fromDate1[0];;
            // fromDate = new Date(fromDate2).setHours(0, 0, 0, 0);
            // toDate = new Date(toDate2).setHours(0, 0, 0, 0);
            fromDate = new Date(fromDate2);
            toDate = new Date(toDate2);
            toFindQuery.cDate = {
                $gte: new Date(fromDate),
                $lte: new Date(toDate)
            }
        }


        requestBody.page = Number(requestBody.page);
        let query = {};
        const size = 10;
        query.skip = size * (requestBody.page - 1)
        query.limit = size

        if (requestBody.id) {
            toFindQuery.user_id = ObjectId(requestBody.id);
        }
        if (requestBody.tags) {
            toFindQuery["tags.text"] = {
                $in: toFindTags
            };

        };
        if (requestBody.emailDomain) {
            toFindQuery.emailDomain = requestBody.emailDomain;
            toFindQuery.unique_id = requestBody.unique_id;
        }
        if (requestBody.subject) {
            var x = [requestBody.subject],
                regex = x.map(function (e) {
                    return new RegExp(e, "i");
                });
            toFindQuery["header.subject"] = {
                $in: regex
            }
        }
        toFindQuery.flag = 1;
        collection.find(toFindQuery).toArray(function (err2, res2) {
            if (err2) {
                res.status(500).json({
                    success: false,
                    data: {
                        message: err2
                    }
                });
            } else {
                collection.find(toFindQuery, {}, query).sort([
                    ['_id', -1]
                ]).toArray(function (err1, res1) {
                    // collection.find(toFindQuery).sort({
                    //         "_id": 1
                    //     }).limit(query.limit).skip(query.skip).toArray(function (err1, res1) {
                    if (err1) {
                        res.status(500).json({
                            success: false,
                            data: {
                                message: err1
                            }
                        });
                    } else {
                        res.status(200).json({
                            success: true,
                            data: {
                                message: res1,
                                totalCount: res2.length,
                                message1: res2
                            }
                        });

                    }
                })
            }
        })

    }

}


// websiteController.getListOfMailsByUserId = (req, res) => {
//     let collection = db.get().collection('websites');
//     const websiteId = req.param('id');
//     const requestBody = req.body;

//     collection.find({
//         user_id: ObjectId(websiteId)
//     }).toArray(function (err, success) {
//         if (err) {
//             res.status(500).json({
//                 success: false,
//                 data: err
//             });
//         } else if (success) {
//             allMails = [];
//             if (success.length > 0) {


//                 var x = 0;
//                 var loopArray = function (success) {
//                     getMailListWithoutFavourite(success[x].emailDomain, success[x].unique_id, x, res, function () {
//                         // set x to next item
//                         x++;
//                         // any more items in array? continue loop
//                         if (x < success.length) {
//                             loopArray(success);
//                         } else {
//                             res.status(200).json({
//                                 success: true,
//                                 data: {
//                                     message: allMails
//                                 }
//                             });
//                         }
//                     });
//                 }
//                 loopArray(success);


//             } else {
//                 res.status(403).json({
//                     success: false,
//                     data: "No websites found."
//                 });
//             }
//         }
//     });
// }



function getMonthName(month) {
    let monthname;
    switch (month) {
        case "01":
            monthname = "January";
            break;
        case "02":
            monthname = "February";
            break;
        case "03":
            monthname = "March";
            break;
        case "04":
            monthname = "April";
            break;
        case "05":
            monthname = "May";
            break;
        case "06":
            monthname = "June";
            break;
        case "07":
            monthname = "July";
            break;
        case "08":
            monthname = "August";
            break;
        case "09":
            monthname = "September";
            break;
        case "10":
            monthname = "October";
            break;
        case "11":
            monthname = "November";
            break;
        case "12":
            monthname = "December";
            break;
        default:
            break;
    }
    return monthname;
}

websiteController.getFavouriteMailsByDate = (req, res) => {


    const responseData = [];
    const responseUids = [];
    const responseData_message = [];
    const requestBody = req.body;
    var i = 'K';
    let typeofmail;
    if (requestBody.emailDomain && requestBody.unique_id && requestBody.fromDate && requestBody.toDate) {
        let toDate, fromDate;
        const fromDate1 = requestBody.fromDate.split('/');
        const toDate1 = requestBody.toDate.split('/');
        fromDate = getMonthName(fromDate1[1]) + " " + fromDate1[0] + "," + fromDate1[2];
        toDate = getMonthName(toDate1[1]) + " " + toDate1[0] + "," + toDate1[2];
        typeofmail = requestBody.typeofmail;
        imap = new Imap({
            user: requestBody.emailDomain,
            password: requestBody.unique_id,
            host: 'mail.catchletter.com',
            port: 993,
            tls: true
        });

        imap.once('ready', function () {

            var fs = require('fs'),
                fileStream;

            openInbox(function (err, box) {

                // if (err) throw err;
                imap.search([typeofmail, ['Since', fromDate],
                    ['Before', toDate]
                ], function (err, results) {
                    if (results.length > 0) {

                        // if (err) throw err;
                        var f = imap.fetch(results, {
                            bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', '']
                        });
                        f.on('message', function (msg, seqno) {

                            var prefix = '(#' + seqno + ') ';
                            msg.on('body', function (stream, info) {

                                // stream.pipe(fs.createWriteStream('msg-' + seqno + '-body.txt'));
                                var buffer = '';
                                stream.on('data', function (chunk) {

                                    buffer += chunk.toString('utf8');


                                });
                                stream.once('end', function () {


                                    const variableVal = Imap.parseHeader(buffer);

                                    if (variableVal.to) {


                                        variableVal1 = variableVal;
                                    } else {

                                    }


                                    // var arr = buffer.split('</html>');
                                    // var arr1 = arr[0].toString().split('<html>');
                                    var arr = buffer.split('</body>');
                                    var arr1 = arr[0].toString().split('<body');

                                    if (info.which != "Text" && arr1[1]) {

                                        responseData.push({
                                            header: variableVal1,
                                            body: '<html> <body' + arr1[1] + '</body></html>'.replace('/"', 'l'),
                                            foot: arr[1],
                                            uid: '',
                                            seqno: seqno,
                                            flag: '',
                                            emailDomain: requestBody.emailDomain,
                                            unique_id: requestBody.unique_id,
                                            buffer: buffer
                                        });
                                        if (i == 'K') {
                                            i = 0;
                                        } else {
                                            i = parseInt(i) + 1;
                                        }

                                    }

                                });
                            });
                            msg.once('attributes', function (attrs) {

                                if (responseData[i].uid == '') {
                                    responseData[i].uid = attrs.uid;
                                }

                                // if (responseData[i].flag == '') {
                                //     responseData[i].flag = attrs.flags.length;
                                // }
                                if (responseData[i].flag == '') {
                                    //responseData[i].flag = attrs.flags.length;
                                    if (attrs.flags && attrs.flags.length && attrs.flags.length > 0) {
                                        for (let i = 0; i < attrs.flags.length; i++) {
                                            attrs.flags[i] = attrs.flags[i].replace(/\\/g, "");
                                        }
                                        if (attrs.flags.indexOf("Flagged") != -1) {
                                            responseData[i].flag = 1;
                                        } else {
                                            responseData[i].flag = 0;
                                        }
                                        responseData[i].attrs = attrs.flags;
                                    } else {
                                        responseData[i].flag = 0;
                                    }
                                }
                                // responseData_message = [];

                            });
                            msg.once('end', function () {

                            });
                        });
                        f.once('error', function (err) {

                        });
                        f.once('end', function () {

                            imap.end();

                            res.status(200).json({
                                success: true,
                                data: {
                                    message: responseData,
                                    responseUids: responseUids
                                }
                            });
                        });
                    } else {
                        res.status(200).json({
                            success: false,
                            data: 'No mail found'
                        });
                    }
                });

            });



        });

        imap.once('error', function (err) {
            res.status(403).json({
                success: false,
                data: {
                    message: "No message found"
                }
            });
        });

        imap.once('end', function () {

        });

        imap.connect();
    } else {
        res.status(403).json({
            success: false,
            data: "Email, password, from date and to date are required."
        });
    }

}


websiteController.getFavouriteMailsByDateForAllWebsites = (req, res) => {
    let collection = db.get().collection('websites');
    allMailsFilter = [];
    const requestBody = req.body;
    let typeofmail;
    if (requestBody.user_id && requestBody.fromDate && requestBody.toDate) {
        let toDate, fromDate;
        const fromDate1 = requestBody.fromDate.split('/');
        const toDate1 = requestBody.toDate.split('/');
        fromDate = getMonthName(fromDate1[1]) + " " + fromDate1[0] + "," + fromDate1[2];
        toDate = getMonthName(toDate1[1]) + " " + toDate1[0] + "," + toDate1[2];
        typeofmail = requestBody.typeofmail;
        collection.find({
            user_id: ObjectId(requestBody.user_id)
        }).toArray(function (err, success) {
            if (err) {
                res.status(500).json({
                    success: false,
                    data: err1
                });
            } else if (success) {

                if (success.length > 0) {


                    var x = 0;
                    var loopArray = function (success) {
                        getMailListForAllFavourites(success[x].emailDomain, success[x].unique_id, x, res, fromDate, toDate, typeofmail, function () {
                            // set x to next item
                            x++;
                            // any more items in array? continue loop
                            if (x < success.length) {
                                loopArray(success);
                            } else {
                                res.status(200).json({
                                    success: true,
                                    data: {
                                        message: allMailsFilter
                                    }
                                });
                            }
                        });
                    }
                    loopArray(success);


                } else {
                    res.status(403).json({
                        success: false,
                        data: "No websites found."
                    });
                }
            }
        });
    } else {
        res.status(403).json({
            success: false,
            data: "User Id, from date and to date are required."
        });
    }

}

module.exports = websiteController;
