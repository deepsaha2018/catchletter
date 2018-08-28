var express = require('express'),
    router = express.Router()

var db = require('../db')
var crypto = require('crypto');
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
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



const adminController = {};
const ObjectId = require('mongodb').ObjectID;

function getRandomString(length) {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex') /** convert to hexadecimal format */
        .slice(0, length);
}

function sha512(password, salt) {
    var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
    hash.update(password);
    var value = hash.digest('hex');
    return {
        salt: salt,
        passwordHash: value
    };
}

function saltHashPassword(userpassword) {
    var salt = getRandomString(16); /** Gives us salt of length 16 */
    var passwordData = sha512(userpassword, salt);
    const returnData = {
        salt: salt,
        passwordHash: passwordData.passwordHash
    };
    return returnData;
}

function getPasswordFromHash(saltKey, userpassword) {
    var passwordData = sha512(userpassword, saltKey);
    const returnData = {
        passwordHash: passwordData.passwordHash
    };
    return returnData;
}



adminController.signup = (req, res) => {
    const requestBody = req.body;
    if (requestBody.name && requestBody.email && requestBody.password) {
        var collection = db.get().collection('catchletter_admin');
        collection.find({
            email: requestBody.email
        }).toArray(function (err, docs) {
            if (docs.length > 0) {
                res.status(403).json({
                    success: false,
                    data: {
                        message: "Email already exists."
                    }
                })
            } else {
                //requestBody.isActive=true;
                const saltedPassword = saltHashPassword(requestBody.password);
                requestBody.saltKey = saltedPassword.salt;
                requestBody.salt = saltedPassword.passwordHash;
                delete requestBody.password;
                collection.save(requestBody, function (err, success) {
                    if (err) {
                        res.status(500).json({
                            success: false,
                            data: err
                        });
                    } else {
                        res.status(200).json({
                            success: true,
                            data: {
                                message: "Successfully reqgistered.",
                                details: success1
                            }
                        });

                    }
                })

            }

        })
    } else {
        res.status(403).json({
            success: false,
            data: {
                message: "First name, Email, Phone, Company and Password are required."
            }
        })
    }

}



adminController.login = (req, res) => {
    const requestBody = req.body;
    console.log("requestBody", requestBody);
    if (requestBody.email && requestBody.password) {
        var collection = db.get().collection('catchletter_admin');
        collection.find({
            email: requestBody.email
        }).toArray(function (err, docs) {
            console.log("docs", docs);
            if (docs.length > 0) {
                const userData = docs[0];
                const decryptedPassword = getPasswordFromHash(userData.saltKey, requestBody.password);
                if (decryptedPassword.passwordHash && decryptedPassword.passwordHash == userData.salt) {
                    // delete userData.saltKey;
                    // delete userData.salt;
                    res.status(200).json({
                        success: true,
                        data: {
                            userDetails: userData
                        }
                    });
                } else {
                    res.status(200).json({
                        success: false,
                        data: {
                            messgae: "Email and password does not match"
                        }
                    });
                }
            } else {
                res.status(404).json({
                    success: false,
                    data: {
                        message: "User not found."
                    }
                })
            }

        })
    } else {
        res.status(403).json({
            success: false,
            data: {
                message: "Email and password are required."
            }
        })
    }



}


adminController.sendOtp = (req, res) => {
    const requestBody = req.body;
    if (requestBody.email) {
        var collection = db.get().collection('customer');
        const userTemp = db.get().collection('userTemp');
        collection.find({
            email: requestBody.email
        }).toArray(function (err, docs) {
            if (docs.length > 0) {
                const otp = Math.floor(100000 + Math.random() * 900000);
                userTemp.find({
                    email: requestBody.email
                }).toArray(function (err1, response1) {
                    if (err1) {
                        res.status(500).json({
                            success: false,
                            data: {
                                message: err1
                            }
                        })
                    } else {
                        if (response1.length > 0) {
                            userTemp.remove({
                                email: requestBody.email
                            }, function (err2, res2) {
                                if (err2) {
                                    res.status(500).json({
                                        success: false,
                                        data: {
                                            message: err1
                                        }
                                    })
                                } else {
                                    sendEmail('sendOtp', requestBody.email, 'Otp sent for password reset.', 'Your otp for password reset is:-' + otp, requestBody.email);
                                    userTemp.save({
                                        email: requestBody.email,
                                        otp: otp
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
                                                    message: "Plesae check your mail for the otp."
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        } else {
                            sendEmail('sendOtp', requestBody.email, 'Otp sent for password reset.', 'Your otp for password reset is:-' + otp, requestBody.email);
                            userTemp.save({
                                email: requestBody.email,
                                otp: otp
                            }, function (err4, res4) {
                                if (err4) {
                                    res.status(500).json({
                                        success: false,
                                        data: {
                                            message: err4
                                        }
                                    })
                                } else {
                                    res.status(200).json({
                                        success: true,
                                        data: {
                                            message: "Plesae check your mail for the otp."
                                        }
                                    })
                                }
                            })
                        }
                    }
                })
            } else {
                res.status(404).json({
                    success: false,
                    data: {
                        message: "User not found."
                    }
                })
            }

        })
    } else {
        res.status(403).json({
            success: false,
            data: {
                message: "Email is required."
            }
        })
    }

}



adminController.passwordReset = (req, res) => {
    const requestBody = req.body;
    if (requestBody.email && requestBody.password && requestBody.otp) {
        var collection = db.get().collection('customer');
        var useTemp = db.get().collection('userTemp');
        useTemp.find({
            email: requestBody.email
        }).toArray(function (err, res1) {
            if (err) {
                res.status(500).json({
                    success: false,
                    data: {
                        message: err
                    }
                })
            } else {
                if (res1.length > 0) {
                    if (res1[0].otp == requestBody.otp) {
                        const saltedPassword = saltHashPassword(requestBody.password);
                        requestBody.saltKey = saltedPassword.salt;
                        requestBody.salt = saltedPassword.passwordHash;
                        collection.update({
                            email: requestBody.email
                        }, {
                                $set: {
                                    saltKey: requestBody.saltKey,
                                    salt: requestBody.salt

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
                                            message: "Password changed successfully. Please login."
                                        }
                                    })
                                }
                            })
                    } else {
                        res.status(403).json({
                            success: false,
                            data: {
                                message: "Otp does not match."
                            }
                        })
                    }

                } else {
                    res.status(403).json({
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
                message: "Email, Otp  and Password are required."
            }
        })
    }
}

adminController.addsubscription = (req, res) => {
    const requestBody = req.body;
    if (requestBody.subs_name && requestBody.subs_desc && requestBody.subs_price && requestBody.subs_type && requestBody.subs_url && requestBody.subs_duration && requestBody.planId) {
        console.log("requestBody", requestBody);
        var collection = db.get().collection('subscription');
        collection.save(requestBody, function (err, success) {
            if (err) {
                res.status(500).json({
                    success: false,
                    data: err
                });
            } else {
                res.status(200).json({
                    success: true,
                    data: {
                        message: "Successfully Added.",
                        details: success
                    }
                });
            }
        })


    } else {
        res.status(403).json({
            success: false,
            data: {
                message: "Input values are required."
            }
        })
    }

}

adminController.getAllSubscription = (req, res) => {
    var collection = db.get().collection('subscription');
    collection.find().toArray(function (err, docs) {
        res.status(200).json({
            success: true,
            data: docs
        });
    })
}

adminController.updateSubscription = (req, res) => {
    const requestBody = req.body;
    if (requestBody._id) {
        var collection = db.get().collection('subscription');
        collection.find({
            _id: ObjectId(requestBody._id)
        }).toArray(function (err, success) {
            if (err) {
                res.status(500).json({
                    success: false,
                    data: err
                });
            } else {
                if (success.length > 0) {
                    const user_id = requestBody._id;
                    delete requestBody._id;
                    collection.update({
                        _id: ObjectId(user_id)
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
                                        message: "updated successfully."
                                    }
                                })
                            }
                        })

                } else {
                    res.status(404).json({
                        success: false,
                        data: {
                            message: "data not found."
                        }
                    })
                }
            }
        })
    } else {
        res.status(403).json({
            success: false,
            data: "Id is required."
        });
    }

}


adminController.getBillingById = (req, res) => {

    const requestBody = req.param('id');
    // console.log("REQBODYYYYYY",requestBody);
    if (requestBody) {
        var collection = db.get().collection('Billing');
        collection.find({
            userId: ObjectId(requestBody)
            //_id: ObjectId(requestBody._id)
        }).toArray(function (err, success) {
            if (err) {
                res.status(500).json({
                    success: false,
                    data: err
                });
            } else {
                if (success) {
                    // const toSendData = success[0];
                    // delete toSendData.salt;
                    // delete toSendData.saltKey;

                    res.status(200).json({
                        success: true,
                        data: success
                    })
                } else {
                    res.status(404).json({
                        success: false,
                        data: {
                            message: "Data not found."
                        }
                    })
                }
            }
        })
    } else {
        res.status(403).json({
            success: false,
            data: {
                message: "Id is required."
            }
        })
    }

}

adminController.getsubscriptionById = (req, res) => {

    const requestBody = req.param('id');
    if (requestBody) {
        var collection = db.get().collection('subscription');
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
                    const toSendData = success[0];
                    // delete toSendData.salt;
                    // delete toSendData.saltKey;

                    res.status(200).json({
                        success: true,
                        data: {
                            userDetails: toSendData
                        }
                    })
                } else {
                    res.status(404).json({
                        success: false,
                        data: {
                            message: "Data not found."
                        }
                    })
                }
            }
        })
    } else {
        res.status(403).json({
            success: false,
            data: {
                message: "Id is required."
            }
        })
    }

}


adminController.deleteSubscription = (req, res) => {
    const requestBody = req.param('id');

    if (requestBody) {
        var collection = db.get().collection('subscription');
        collection.find({
            _id: ObjectId(requestBody)
        }).toArray(function (err, success) {
            if (err) {
                res.status(500).json({
                    success: false,
                    data: err
                });
            } else {
                console.log("ggggg :", success)
                if (success.length > 0) {
                    collection.remove({
                        "_id": ObjectId(requestBody)
                    }, function (err2, res2) {
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
                                    message: "Records deleted successfully."
                                }
                            })
                        }
                    })


                }
            }
        })
    } else {
        res.status(403).json({
            success: false,
            data: "data Not Found"
        });
    }
}



adminController.getCustomerById = (req, res) => {

    const requestBody = req.param('id');
    if (requestBody) {
        var collection = db.get().collection('customer');
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
                    const toSendData = success[0];
                    // delete toSendData.salt;
                    // delete toSendData.saltKey;

                    res.status(200).json({
                        success: true,
                        data: {
                            userDetails: toSendData
                        }
                    })
                } else {
                    res.status(404).json({
                        success: false,
                        data: {
                            message: "User not found."
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



adminController.updateCustomer = (req, res) => {
    const requestBody = req.body;
    if (requestBody._id) {
        var collection = db.get().collection('customer');
        collection.find({
            _id: ObjectId(requestBody._id)
        }).toArray(function (err, success) {
            if (err) {
                res.status(500).json({
                    success: false,
                    data: err
                });
            } else {
                if (success.length > 0) {

                    collection.find({
                        email: requestBody.email,
                    }).toArray(function (err, docs) {
                        //console.log('hello',docs[0]._id)
                        //console.log(requestBody._id)
                        if (docs.length > 0 && docs[0]._id != requestBody._id) {

                            res.status(403).json({
                                success: false,
                                data: {
                                    message: "Email already exists."
                                }
                            })
                        } else {

                            const user_id = requestBody._id;
                            delete requestBody._id;
                            collection.update({
                                _id: ObjectId(user_id)
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
                                                message: "Customer updated successfully."
                                            }
                                        })
                                    }
                                })

                        }
                    })
                } else {
                    res.status(404).json({
                        success: false,
                        data: {
                            message: "User not found."
                        }
                    })
                }
            }
        })
    } else {
        res.status(403).json({
            success: false,
            data: "Id is required."
        });
    }



}



adminController.updateCustomerBilling = (req, res) => {
    const requestBody = req.body;
    if (requestBody.userId && requestBody.subscriptionId) {
        var collection = db.get().collection('Billing');
        var subscriptionDoc = db.get().collection("subscription");
        console.log("userId", ObjectId(requestBody.userId));
        collection.find({ userId: ObjectId(requestBody.userId) }).toArray(function (err1, res1) {
            if (err1) {
                res.status(500).json({
                    status: false,
                    data: {
                        message: err1
                    }
                })
            }
            else if (res1.length > 0) {
                if (res1[0].details) {
                    console.log("res1[0].details", res1[0].details);
                    let toUpdateData = res1[0].details;
                    const toUpdateIndex = toUpdateData.length - 1;
                    subscriptionDoc.find({
                        _id: ObjectId(requestBody.subscriptionId)
                    }).toArray(function (err2, res2) {
                        if (err2) {
                            res.status(500).json({
                                status: false,
                                data: {
                                    message: err2
                                }
                            })
                        }
                        else {
                            if (res2.length > 0) {
                                let toChangeData = toUpdateData[toUpdateIndex];
                                delete toChangeData.planDetails;
                                toChangeData.planDetails = [{ _id: res2[0]._id, subs_name: res2[0].subs_name, subs_desc: res2[0].subs_desc, subs_price: res2[0].subs_desc, subs_type: res2[0].subs_type, subs_url: res2[0].subs_url, noOfWebsites: res2[0].noOfWebsites, subs_duration: res2[0].subs_duration }];
                                toChangeData.billingDetails[0].expiryDate = new Date(requestBody.expiryDate);
                                toUpdateData[toUpdateIndex] = toChangeData;

                                collection.update({
                                    userId: ObjectId(requestBody.userId)
                                }, {
                                        $set: {
                                            details: toUpdateData

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
                                                    message: "Plan updated successfully."
                                                }
                                            })
                                        }
                                    })
                            }
                            else {
                                res.status(404).json({
                                    status: false,
                                    data: {
                                        message: "No subscription found."
                                    }
                                })
                            }

                        }
                    })
                }

            }
            else {
                res.status(404).json({
                    status: false,
                    data: {
                        message: "No billing found."
                    }
                })
            }
        })
    } else {
        res.status(403).json({
            success: false,
            data: "User Id and Subscription Id are required."
        });
    }



}

adminController.changePassword = (req, res) => {
    const requestBody = req.body;
    if (requestBody.email && requestBody.oldPassword && requestBody.newPassword) {
        var collection = db.get().collection('customer');
        collection.find({
            email: requestBody.email
        }).toArray(function (err, res1) {
            if (err) {
                res.status(500).json({
                    success: false,
                    data: {
                        message: err
                    }
                })
            } else {
                if (res1.length > 0) {
                    const userData = res1[0];
                    console.log("userData :", userData);
                    const decryptedPassword = getPasswordFromHash(userData.saltKey, requestBody.oldPassword);
                    if (decryptedPassword.passwordHash && decryptedPassword.passwordHash == userData.salt) {
                        const saltedPassword = saltHashPassword(requestBody.newPassword);
                        requestBody.saltKey = saltedPassword.salt;
                        requestBody.salt = saltedPassword.passwordHash;
                        collection.update({
                            email: requestBody.email
                        }, {
                                $set: {
                                    saltKey: requestBody.saltKey,
                                    salt: requestBody.salt

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
                                            message: "Password changed successfully."
                                        }
                                    })
                                }
                            })
                    } else {
                        res.status(403).json({
                            success: false,
                            data: {
                                message: "Passwords do not match."
                            }
                        })
                    }

                } else {
                    res.status(403).json({
                        success: false,
                        data: {
                            message: "User not found."
                        }
                    })
                }

            }
        })

    } else {
        res.status(403).json({
            success: false,
            data: {
                message: "Email and Old Password are not matched."
            }
        })
    }
}

adminController.deleteById = (req, res) => {
    const requestBody = req.param('id');

    if (requestBody) {
        var collection = db.get().collection('customer');
        collection.find({
            _id: ObjectId(requestBody)
        }).toArray(function (err, success) {
            if (err) {
                res.status(500).json({
                    success: false,
                    data: err
                });
            } else {
                console.log("ggggg :", success)
                if (success.length > 0) {
                    collection.remove({
                        "_id": ObjectId(requestBody)
                    }, function (err2, res2) {
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
                                    message: "Records deleted successfully."
                                }
                            })
                        }
                    })


                }
            }
        })
    } else {
        res.status(403).json({
            success: false,
            data: "User Not Found"
        });
    }
}

module.exports = adminController;
