var express = require('express'),
    router = express.Router()

var db = require('../db');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const ObjectId = require('mongodb').ObjectID;
const handlebars = require('handlebars');
const website_url = require('../config');
const subscriptionController = {};

/**************Mail configuration*************** */
// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: 'pragati@natitsolved.com',
//         pass: 'pragati123'
//     }
// });

const transporter = nodemailer.createTransport({
    host: 'mail.catchletter.com',
    port: 587,
    auth: {
        user: 'no-reply@catchletter.com',
        pass: '12345678'
    }
});

/******************sending html in email************* */
const readHTMLFile = function (path, callback) {
    fs.readFile(path, {
        encoding: 'utf-8'
    }, function (err, html) {
        if (err) {
            throw err;
            callback(err);
        } else {
            callback(null, html);
        }
    });
};

function sendEmail(type, to, subject, userName) {
    if (type == "billing") {
        const filePath = path.join(__dirname, '..', 'emailTemplates', 'billing.html');
        readHTMLFile(filePath, function (err, html) {
            var template = handlebars.compile(html);
            var replacements = {
                USER: userName,
                websiteLink: website_url
            };
            var htmlToSend = template(replacements);
            var mailOptions = {
                from: 'no-reply@catchletter.com',
                to: to,
                subject: "We are so excited to see you " + userName,
                html: htmlToSend
            };
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
        });
    }
}


// getting subscription value
subscriptionController.getAllSubscription = (req, res) => {
    var collection = db.get().collection('subscription');

    collection.find().toArray(function (err, success) {
        if (err) {
            res.status(500).json({
                success: false,
                data: err1
            });
        } else if (success) {
            if (success.length > 0) {
                const data = success;

                res.status(200).json({
                    success: true,
                    data: {
                        subscriptionData: data
                    }
                });
            } else {
                res.status(404).json({
                    success: false,
                    data: {
                        message: "Subscription data not found."
                    }
                })
            }
        }
    });
}


subscriptionController.getAllBillingWithPagination = (req, res) => {
    const requestBody = req.body;
    var collection = db.get().collection('Billing');
    if (requestBody.page < 0 || requestBody.page == 0) {
        res.status(403).json({
            success: false,
            data: "Please provide valid page no."
        });
    } else {
        if (requestBody.userId) {
            requestBody.page = Number(requestBody.page);
            let query = {};
            const size = 10;
            query.skip = size * (requestBody.page - 1)
            query.limit = size
            collection.find({
                userId: ObjectId(requestBody.userId)
            }).toArray(function (err, success) {
                if (err) {
                    res.status(500).json({
                        success: false,
                        data: err
                    });
                } else if (success) {
                    if (success.length > 0) {
                        collection.find({
                            userId: ObjectId(requestBody.userId)
                        }).sort({
                            _id: -1
                        }).skip(query.skip > 0 ? query.skip : 0).limit(query.limit).toArray(function (err1, success1) {
                            if (err1) {
                                res.status(500).json({
                                    success: false,
                                    data: err1
                                });
                            } else {

                                console.log("success1 :", success1);
                                success1[0].details.reverse();
                                res.status(200).json({
                                    success: true,
                                    data: {
                                        subscriptionData: success1,
                                        totalCount: success.length
                                    }
                                });
                            }
                        })

                    } else {
                        res.status(404).json({
                            success: false,
                            data: {
                                message: "Subscription data not found."
                            }
                        })
                    }
                }
            });
        } else {
            res.status(403).json({
                success: false,
                data: "User Id is required."
            });
        }

    }

}


// add default billing result with userId
subscriptionController.addDefaultBilling = (req, res) => {

    const requestBody = req.body;
    var collection = db.get().collection('Billing');
    var subscription = db.get().collection('subscription');

    let planDetails = [];
    let billingDetails = [];

    let detailsObject = {};
    let details = [];

    subscription.find().toArray(function (err, success) {
        if (err) {
            res.status(500).json({
                success: false,
                data: err1
            });
        } else if (success) {
            if (success.length > 0) {
                success.map((result1) => {
                    if (result1.subs_type == "Free") {
                        planDetails.push(result1);
                    }
                });
                billingDetails.push(requestBody);
                const data = {
                    planDetails: planDetails,
                    billingDetails: billingDetails
                };

                details.push(data);

                collection.save({
                    details: details,
                    userId: ObjectId(requestBody.userId)
                }, function (err, success1) {
                    if (err) {
                        res.status(500).json({
                            success: false,
                            data: err
                        });
                    } else {
                        res.status(200).json({
                            success: true,
                            data: {
                                message: "Successfully billing details added.",
                                details: success1.ops
                            }
                        });
                    }
                });

            } else {
                res.status(404).json({
                    success: false,
                    data: {
                        message: "Subscription data not found."
                    }
                })
            }
        }
    });
}

// get billing data
subscriptionController.getBillingData = (req, res) => {
    const requestBody = req.body;
    // console.log("requestBody :", requestBody);
    var collection = db.get().collection('Billing');

    collection.find({
        userId: ObjectId(requestBody.userId)
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

// update default billing
subscriptionController.updateDefaultBilling = (req, res) => {

    const requestBody = req.body;
    let resultOne = [];
    let resultNew;
    var collection = db.get().collection('Billing');

    collection.find({
        userId: ObjectId(requestBody.userId)
    }).toArray(function (err, res1) {
        if (err) {
            res.status(403).json({
                success: false,
                data: {
                    message: err
                }
            });
        } else {
            if (res1.length > 0) {
                // send email to user
                sendEmail('billing', requestBody.billingDetails[0].email, 'We are so excited to see you ' + requestBody.billingDetails[0].firstName, requestBody.billingDetails[0].firstName);
                resultOne = res1[0].details;
                const _id = requestBody._id;
                const userId = requestBody.userId;
                delete requestBody._id;
                delete requestBody.userId;
                resultOne.push(requestBody)
                collection.update({
                        _id: ObjectId(_id)
                    }, {
                        $set: {
                            details: resultOne
                        }
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
                                    message: "Successfully billing details added.",
                                    details: res2.ops
                                }
                            })
                        }
                    });
            }
        }
    });
}



subscriptionController.updateDefaultBillingForWeb = (req, res) => {

    const requestBody = req.body;
    let resultOne = [];
    let resultNew;
    var collection = db.get().collection('Billing');
    var userCollection = db.get().collection('customer');

    var orderTemp = db.get().collection('orderTemp');
    orderTemp.find({
        orderId: requestBody.order_id
    }).toArray(function (err1, orderTempDetails) {
        if (err1) {
            res.status(500).json({
                status: false,
                data: {
                    message: err1
                }
            })
        } else {
            collection.find({
                userId: ObjectId(requestBody.userId)
            }).toArray(function (err, res1) {
                if (err) {
                    res.status(403).json({
                        success: false,
                        data: {
                            message: err
                        }
                    });
                } else {
                    if (res1.length > 0) {
                        // send email to user
                        userCollection.find({
                            _id: ObjectId(requestBody.userId)
                        }).toArray(function (err9, res9) {
                            if (err9) {
                                res.status(403).json({
                                    success: false,
                                    data: {
                                        message: err9
                                    }
                                });
                            } else {
                                if (res9.length > 0) {
                                    console.log("res9", res9[0].email)
                                    sendEmail('billing', res9[0].email, 'We are so excited to see you ' + requestBody.billingDetails[0].firstName, requestBody.billingDetails[0].firstName);
                                }

                                resultOne = res1[0].details;
                                const _id = requestBody._id;
                                const userId = requestBody.userId;
                                const orderTempId = orderTempDetails[0]._id;
                                delete orderTempDetails[0]._id;
                                delete orderTempDetails[0].orderId;
                                orderTempDetails[0].billingDetails[0].userId = userId;
                                resultOne.push(orderTempDetails[0]);
                                console.log("orderTempDetails", orderTempDetails)
                                console.log("resultOne", resultOne);
                                collection.update({
                                        _id: ObjectId(_id)
                                    }, {
                                        $set: {
                                            details: resultOne
                                        }
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
                                            orderTemp.remove({
                                                "_id": ObjectId(orderTempId)
                                            }, function (err3, res3) {
                                                if (err3) {
                                                    res.status(500).json({
                                                        success: false,
                                                        data: {
                                                            message: err3
                                                        }
                                                    })
                                                } else {
                                                    res.status(200).json({
                                                        success: true,
                                                        data: {
                                                            message: "Successfully billing details added.",
                                                            details: res2.ops
                                                        }
                                                    })
                                                }
                                            })

                                        }
                                    });
                            }
                        })

                    }
                }
            });
        }
    })


}

subscriptionController.getwebsitebydatecheck = (req, res) => {
    const requestBody = req.body;
    let message;
    let lastData;
    if (requestBody.userId) {
        const billing = db.get().collection('Billing');
        billing.find({
            userId: ObjectId(requestBody.userId)
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
                    success.forEach((value) => {
                        lastData = value.details[value.details.length - 1];
                        if (lastData.billingDetails.length != 0) {
                            lastData.billingDetails.forEach((res6) => {
                                if (res6.expiryDate < requestBody.current_date) {
                                    message = "Billing date is expired."
                                } else {
                                    message = "You are within billing date."
                                }
                            });
                        }
                    });
                    res.status(200).json({
                        success: true,
                        data: {
                            message: message
                        }
                    });
                } else {
                    res.status(404).json({
                        success: false,
                        data: {
                            message: "Billing details not found."
                        }
                    });
                }
            }
        });
    } else {
        res.status(404).json({
            success: false,
            data: {
                message: "Please specify current date and user_id."
            }
        });
    }

}

subscriptionController.insertUserForSubscription = (req, res) => {
    const requestBody = req.body;
    var collection = db.get().collection('customer');
    var userTemp = db.get().collection('userTemp');
    var orderTemp = db.get().collection('orderTemp');
    var Billing = db.get().collection('Billing');
    let resultOne = [];
    const otp = Math.floor(100000 + Math.random() * 900000);
    collection.find({
        email: requestBody.email
    }).toArray(function (customerError, customerSuccess) {
        if (customerError) {
            res.status(500).json({
                status: true,
                data: {
                    message: customerError
                }
            })
        } else {

            if (customerSuccess.length > 0) {

                console.log('customer foubd');
                Billing.find({
                    userId: ObjectId(customerSuccess[0]._id)
                }).toArray(function (err, billingSuccess) {
                    if (err) {
                        res.status(403).json({
                            success: false,
                            data: {
                                message: err
                            }
                        });
                    } else {
                        if (billingSuccess.length > 0) {
                            console.log('customerSuccess[0].email', customerSuccess[0].email);
                            sendEmail('billing', customerSuccess[0].email, 'We are so excited to see you ' + customerSuccess[0].first_name, customerSuccess[0].first_name);

                            resultOne = billingSuccess[0].details;
                            const _id = billingSuccess[0]._id;
                            const userId = customerSuccess[0]._id;
                            orderTemp.find({
                                orderId: requestBody.order_id
                            }).toArray(function (orderTempError, orderTempSuccess) {
                                if (orderTempError) {
                                    res.status(500).json({
                                        status: false,
                                        data: orderTempError
                                    })
                                } else {
                                    if (orderTempSuccess.length > 0) {
                                        const orderTempId = orderTempSuccess[0]._id;
                                        delete orderTempSuccess[0]._id;
                                        delete orderTempSuccess[0].orderId;
                                        orderTempSuccess[0].billingDetails[0].userId = userId;
                                        resultOne.push(orderTempSuccess[0]);
                                        console.log("orderTempSuccess", orderTempSuccess)
                                        console.log("resultOne", resultOne);
                                        Billing.update({
                                                _id: ObjectId(_id)
                                            }, {
                                                $set: {
                                                    details: resultOne
                                                }
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
                                                    orderTemp.remove({
                                                        "_id": ObjectId(orderTempId)
                                                    }, function (err3, res3) {
                                                        if (err3) {
                                                            res.status(500).json({
                                                                success: false,
                                                                data: {
                                                                    message: err3
                                                                }
                                                            })
                                                        } else {
                                                            res.status(200).json({
                                                                success: true,
                                                                data: {
                                                                    message: "Successfully billing details added.",
                                                                    details: res2.ops
                                                                }
                                                            })
                                                        }
                                                    })

                                                }
                                            });
                                    }
                                }
                            })


                        }
                    }
                });
            } else {
                userTemp.save({
                    email: requestBody.email,
                    otp: otp
                }, function (err1, res1) {
                    if (err1) {
                        res.status(500).json({
                            status: true,
                            data: {
                                message: err1
                            }
                        })
                    } else {
                        requestBody.report_type = "weekly";
                        requestBody.report_day = "mon";
                        requestBody.reg_date = new Date(Date.now()).toISOString();
                        requestBody.fivedaymailsendDate = '';
                        requestBody.twodaymailsendDate = '';
                        requestBody.twodaymailsend = 0;
                        requestBody.fivedaymailsend = 0;
                        requestBody.ismailclickActive = 0;
                        requestBody.IsUserActive = 0;
                        const order_id = requestBody.order_id;
                        delete requestBody.order_id;
                        orderTemp.find({
                            orderId: order_id
                        }).toArray(function (err3, res3) {
                            if (err3) {
                                res.status(500).json({
                                    status: false,
                                    data: {
                                        message: err3
                                    }
                                })
                            } else {
                                if (res3.length > 0) {
                                    const orderUnique_id = res3[0]._id
                                    requestBody.country = res3[0].country;
                                    requestBody.company = res3[0].company;
                                    requestBody.company_zip = res3[0].zipCode;
                                    delete res3[0].country;
                                    delete res3[0].company;
                                    delete res3[0].zipCode;
                                    delete res3[0]._id;
                                    delete res3[0].orderId;
                                    collection.save(requestBody, function (newCustomerError, newCustomerSuccess) {
                                        if (newCustomerError) {
                                            res.status(500).json({
                                                status: false,
                                                data: newCustomerError
                                            })
                                        } else {
                                             sendEmail('billing', requestBody.email, 'We are so excited to see you ' + requestBody.first_name, requestBody.first_name);
                                            const toSaveBilling = {
                                                details: [res3[0]],
                                                userId: ObjectId(requestBody._id)
                                            };
                                            Billing.save(toSaveBilling, function (err4, res4) {
                                                if (err4) {
                                                    res.status(500).json({
                                                        status: false,
                                                        data: {
                                                            message: err4
                                                        }
                                                    })
                                                } else {
                                                    orderTemp.remove({
                                                        "_id": ObjectId(orderUnique_id)
                                                    }, function (err5, res5) {
                                                        if (err5) {
                                                            res.status(500).json({
                                                                status: false,
                                                                data: {
                                                                    message: err5
                                                                }
                                                            })
                                                        } else {
                                                            const filePath = path.join(__dirname, '..', 'emailTemplates', 'forgotPassword.html');
                                                            console.log("otp", otp);
                                                            readHTMLFile(filePath, function (err, html) {
                                                                var template = handlebars.compile(html);
                                                                var replacements = {
                                                                    USER: requestBody.first_name,
                                                                    OTP: otp,
                                                                    websiteLink: website_url
                                                                };
                                                                var htmlToSend = template(replacements);
                                                                var mailOptions = {
                                                                    from: 'no-reply@catchletter.com',
                                                                    to: requestBody.email,
                                                                    subject: "Otp sent for password generation.",
                                                                    html: htmlToSend
                                                                };
                                                                transporter.sendMail(mailOptions, function (error, info) {
                                                                    if (error) {
                                                                        console.log(error);
                                                                    } else {
                                                                        console.log('Email sent: ' + info.response);
                                                                    }
                                                                });
                                                            });
                                                            res.status(200).json({
                                                                status: true,
                                                                data: {
                                                                    message: "Billing done"
                                                                }
                                                            })
                                                        }
                                                    })

                                                }
                                            })
                                        }
                                    })

                                }

                            }
                        })
                        //  collection.save(requestBody, function (err2, res2) {
                        //      if (err2) {
                        //          res.status(500).json({
                        //              status: false,
                        //              data: {
                        //                  message: err2
                        //              }
                        //          })
                        //      } else {
                        //          console.log("after saving user", requestBody._id);
                        //           sendEmail('billing', requestBody.email, 'We are so excited to see you ' + requestBody.first_name, requestBody.first_name);
                        //          orderTemp.find({
                        //              orderId: order_id
                        //          }).toArray(function (err3, res3) {
                        //              if (err3) {
                        //                  res.status(500).json({
                        //                      status: false,
                        //                      data: {
                        //                          message: err3
                        //                      }
                        //                  })
                        //              } else {
                        //                  if (res3.length > 0) {
                        //                      const orderUnique_id = res3[0]._id
                        //                      delete res3[0]._id;
                        //                      delete res3[0].orderId;

                        //                      const toSaveBilling = {
                        //                          details: [res3[0]],
                        //                          userId: ObjectId(requestBody._id)
                        //                      };
                        //                      Billing.save(toSaveBilling, function (err4, res4) {
                        //                          if (err4) {
                        //                              res.status(500).json({
                        //                                  status: false,
                        //                                  data: {
                        //                                      message: err4
                        //                                  }
                        //                              })
                        //                          } else {
                        //                              orderTemp.remove({
                        //                                  "_id": ObjectId(orderUnique_id)
                        //                              }, function (err5, res5) {
                        //                                  if (err5) {
                        //                                      res.status(500).json({
                        //                                          status: false,
                        //                                          data: {
                        //                                              message: err5
                        //                                          }
                        //                                      })
                        //                                  } else {
                        //                                      const filePath = path.join(__dirname, '..', 'emailTemplates', 'forgotPassword.html');
                        //                                      console.log("otp", otp);
                        //                                      readHTMLFile(filePath, function (err, html) {
                        //                                          var template = handlebars.compile(html);
                        //                                          var replacements = {
                        //                                              USER: requestBody.first_name,
                        //                                              OTP: otp,
                        //                                              websiteLink: website_url
                        //                                          };
                        //                                          var htmlToSend = template(replacements);
                        //                                          var mailOptions = {
                        //                                              from: 'no-reply@catchletter.com',
                        //                                              to: requestBody.email,
                        //                                              subject: "Otp sent for password generation.",
                        //                                              html: htmlToSend
                        //                                          };
                        //                                          transporter.sendMail(mailOptions, function (error, info) {
                        //                                              if (error) {
                        //                                                  console.log(error);
                        //                                              } else {
                        //                                                  console.log('Email sent: ' + info.response);
                        //                                              }
                        //                                          });
                        //                                      });
                        //                                      res.status(200).json({
                        //                                          status: true,
                        //                                          data: {
                        //                                              message: "Billing done"
                        //                                          }
                        //                                      })
                        //                                  }
                        //                              })

                        //                          }
                        //                      })
                        //                  }

                        //              }
                        //          })
                        //      }
                        //  })
                    }
                })
            }
        }
    })

}


module.exports = subscriptionController;
