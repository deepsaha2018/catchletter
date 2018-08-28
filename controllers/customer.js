var express = require('express'),
    router = express.Router()

var db = require('../db')
var crypto = require('crypto');
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const website_url=require('../config');
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

function sendpasswordEmail(type, to, subject, text, password) {
    if (type == "sendpassword") {
        const filePath = path.join(__dirname, '..', 'emailTemplates', 'sendpassword.html');
        readHTMLFile(filePath, function (err, html) {
            var template = handlebars.compile(html);
            var replacements = {
                PWD: password
            };
            var htmlToSend = template(replacements);
            var mailOptions = {
                from: 'no-reply@catchletter.com',
                to: to,
                subject: subject,
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

function sendEmailsignup(type, to, subject, text, userName, userId) {
    if (type == "register") {
        const filePath = path.join(__dirname, '..', 'emailTemplates', 'register.html');
        readHTMLFile(filePath, function (err, html) {
            var template = handlebars.compile(html);
            var data = userId.toString();
            var buff = new Buffer(data);
            var base64data = buff.toString('base64');
            var replacements = {
                USER: userName,
                //  link: "http://178.128.176.48:3000/activateLink?userId=" + base64data
                link: "https://app.catchletter.com/activateLink?userId=" + base64data,
                //link: "http://178.128.176.48:3000/home"
                //link: "http://localhost:3000/activateLink?userId=" + base64data,
                websiteLink:website_url
            };
            var htmlToSend = template(replacements);
            console.log("to", to);
            var mailOptions = {
                from: 'no-reply@catchletter.com',
                to: to,
                subject: 'Please verify your CatchLetter account email address '+to,
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
    } else if (type == "sendOtp") {
        var mailOptions = {
            from: 'no-reply@catchletter.com',
            to: to,
            subject: subject,
            text: text
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    }
}

function sendEmail(type, to, subject, text, userName, otp, firstName) {
    if (type == "register") {
        const filePath = path.join(__dirname, '..', 'emailTemplates', 'register.html');
        readHTMLFile(filePath, function (err, html) {
            var template = handlebars.compile(html);
            var replacements = {
                USER: userName
            };
            var htmlToSend = template(replacements);
            var mailOptions = {
                from: 'no-reply@catchletter.com',
                to: to,
                subject: subject,
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
    } else if (type == "sendOtp") {
       const filePath = path.join(__dirname, '..', 'emailTemplates', 'forgotPassword.html');
       console.log("otp", otp);
       readHTMLFile(filePath, function (err, html) {
           var template = handlebars.compile(html);
           var replacements = {
               USER: firstName,
               OTP:otp,
               websiteLink:website_url
           };
           var htmlToSend = template(replacements);
           var mailOptions = {
               from: 'no-reply@catchletter.com',
               to: to,
               subject: "Otp sent for password reset.",
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


const customerController = {};
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

customerController.getAllCustomers = (req, res) => {
    var collection = db.get().collection('customer');
    collection.find().toArray(function (err, docs) {
        res.status(200).json({
            success: true,
            data: docs
        });
    })
}

customerController.customerSignup = (req, res) => {
    const requestBody = req.body;
    if (requestBody.first_name && requestBody.email && requestBody.phone && requestBody.password && requestBody.company) {
        var collection = db.get().collection('customer');
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
                const saltedPassword = saltHashPassword(requestBody.password);
                requestBody.saltKey = saltedPassword.salt;
                requestBody.salt = saltedPassword.passwordHash;
                delete requestBody.password;
                requestBody.report_type = "weekly";
                requestBody.report_day = "Mon";
                requestBody.reg_date = new Date(Date.now()).toISOString();
                requestBody.fivedaymailsendDate = '';
                requestBody.twodaymailsendDate = '';
                requestBody.twodaymailsend = 0;
                requestBody.fivedaymailsend = 0;
                requestBody.ismailclickActive = 0;
                requestBody.IsUserActive = 0;
                collection.save(requestBody, function (err, success) {
                    if (err) {
                        res.status(500).json({
                            success: false,
                            data: err
                        });
                    } else {
                        console.log("5requestBody", requestBody);
                        sendEmailsignup('register', requestBody.email, 'Welcome to catchletter', 'That was easy!', requestBody.first_name, requestBody._id);
                        collection.find({
                            email: requestBody.email
                        }).toArray(function (err1, success1) {
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
                                        message: "Successfully registered.",
                                        details: success1
                                    }
                                });
                            }
                        })

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

customerController.sendpassworduser = (req, res) => {
    const requestBody = req.body;
    //console.log("bodyyyyyyyy",requestBody);
    if (requestBody.email && requestBody.password) {
        var collection = db.get().collection('customer');
        collection.find({
            email: requestBody.email
        }).toArray(function (err, docs) {
            if (err) {
                res.status(500).json({
                    success: false,
                    data: {
                        message: err
                    }
                })
            } else {
                if (docs.length > 0) {
                    const saltedPassword = saltHashPassword(requestBody.password);
                    requestBody.saltKey = saltedPassword.salt;
                    requestBody.salt = saltedPassword.passwordHash;
                    //console.log("DOCCCCCCC",docs);
                    sendpasswordEmail('sendpassword', requestBody.email, 'Welcome to catchletter', 'That was easy!', requestBody.password);
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
                }

            }

        })
    } else {
        res.status(403).json({
            success: false,
            data: {
                message: "Email,and Password are required."
            }
        })
    }


}

customerController.customerLogin = (req, res) => {
  console.log("hello");
    const requestBody = req.body;
    if (requestBody.email && requestBody.password) {
        var collection = db.get().collection('customer');
        collection.find({
            email: requestBody.email
        }).toArray(function (err, docs) {
            if (docs.length > 0) {
                const userData = docs[0];
                const decryptedPassword = getPasswordFromHash(userData.saltKey, requestBody.password);
                if (decryptedPassword.passwordHash && decryptedPassword.passwordHash == userData.salt) {
                    // delete userData.saltKey;
                    // delete userData.salt;
                    if (userData.IsUserActive == 1) {
                        res.status(200).json({
                            success: true,
                            data: {
                                userDetails: userData
                            }
                        });
                    } else {
                        res.status(403).json({
                            success: false,
                            data: {
                                message: "Please activate your account to continue."
                            }
                        });
                    }

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


customerController.sendOtp = (req, res) => {
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
                                    sendEmail('sendOtp', requestBody.email, 'Otp sent for password reset.', 'Your otp for password reset is:-' + otp, requestBody.email, otp, docs[0].first_name);
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
                            sendEmail('sendOtp', requestBody.email, 'Otp sent for password reset.', 'Your otp for password reset is:-' + otp, requestBody.email, otp, docs[0].first_name);
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



customerController.passwordReset = (req, res) => {
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
                                    salt: requestBody.salt,
                                    IsUserActive:1

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
                                    useTemp.remove({
                                        "_id": ObjectId(res1[0]._id)
                                    }, function(err5, res5){
                                        if(err5)
                                        {
                                            res.status(500).json({
                                                status:false,
                                                data:err5
                                            })
                                        }
                                        else
                                        {
                                           res.status(200).json({
                                               success: true,
                                               data: {
                                                   message: "Password changed successfully. Please login."
                                               }
                                           })
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


customerController.setPasswordForNewUser = (req, res) => {
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
                    console.log("res1[0].otp", res1[0].otp)
                    console.log("requestBody", requestBody.otp)
                    if (res1[0].otp == Number(requestBody.otp)) {
                        const saltedPassword = saltHashPassword(requestBody.password);
                        requestBody.saltKey = saltedPassword.salt;
                        requestBody.salt = saltedPassword.passwordHash;
                        collection.update({
                                email: requestBody.email
                            }, {
                                $set: {
                                    saltKey: requestBody.saltKey,
                                    salt: requestBody.salt,
                                    IsUserActive: 1

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
                                      useTemp.remove({
                                          "_id": ObjectId(res1[0]._id)
                                      }, function (err5, res5) {
                                          if (err5) {
                                              res.status(500).json({
                                                  status: false,
                                                  data: err5
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

customerController.getCustomerById = (req, res) => {

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



customerController.updateCustomer = (req, res) => {
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
                        email: requestBody.email
                    }).toArray(function (err, docs) {
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

customerController.changePassword = (req, res) => {
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
                                message: "Please enter your old password correctly."
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

customerController.send2dayemail1 = (req, res) => {
    var collection = db.get().collection('customer');
    const currentdate = new Date().toISOString().slice(0, 10);
    console.log("currentDate", currentdate);
    collection.find().toArray(function (err, success) {
        if (err) {
            res.status(500).json({
                success: false,
                data: err
            });
        } else {
            if (success.length > 0) {
                const toSendData = success[0];
                (async function loop() {
                    //  console.log("success.length", success.length)
                    for (let i = 0; i < success.length; i++) {
                        await new Promise(resolve => {
                            //console.log("success[i].reg_date", success[i].reg_date)
                            if (success[i].reg_date) {
                                let dateafter2day = new Date(new Date(success[i].reg_date).setDate(new Date(success[i].reg_date).getDate() + parseInt(3))).toISOString().slice(0, 10);
                                // console.log("i", i);

                                //dateafter2day==currentdate
                                if (dateafter2day == currentdate && success[i].twodaymailsend == 0) {
                                    console.log("success.email", success[i].email)
                                    const filePath = path.join(__dirname, '..', 'emailTemplates', 'send2dayemail.html');
                                    readHTMLFile(filePath, function (err, html) {
                                        var template = handlebars.compile(html);
                                        var replacements = {
                                            USER: success[i].first_name,
                                            websiteLink:website_url
                                        };
                                        var htmlToSend = template(replacements);
                                        var mailOptions = {
                                            from: 'no-reply@catchletter.com',
                                            to: success[i].email,
                                            subject: "Thanks Again  " + success[i].first_name+"!",
                                            html: htmlToSend
                                        };
                                        const user_id = success[i]._id;

                                        collection.update({
                                                _id: ObjectId(user_id)
                                            }, {
                                                $set: {
                                                    twodaymailsendDate: dateafter2day,
                                                    twodaymailsend: 1
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
                                                    console.log("updated")
                                                    transporter.sendMail(mailOptions, function (error, info) {
                                                        if (error) {
                                                            console.log(error);
                                                        } else {
                                                            console.log('Email sent: ' + info.response);
                                                            resolve();
                                                        }
                                                    });
                                                }
                                            })

                                    });
                                } else {
                                    resolve();
                                }
                            } else {
                                resolve();
                            }



                        });

                    }

                })();

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


}

customerController.send5dayemail = (req, res) => {
    var collection = db.get().collection('customer');
    const currentdate = new Date().toISOString().slice(0, 10);
    console.log("currentDate", currentdate);
    collection.find().toArray(function (err, success) {
        if (err) {
            res.status(500).json({
                success: false,
                data: err
            });
        } else {
            if (success.length > 0) {
                const toSendData = success[0];
                (async function loop() {
                    //  console.log("success.length", success.length)
                    for (let i = 0; i < success.length; i++) {
                        await new Promise(resolve => {
                            //console.log("success[i].reg_date", success[i].reg_date)
                            if (success[i].reg_date) {
                                let dateafter5day = new Date(new Date(success[i].reg_date).setDate(new Date(success[i].reg_date).getDate() + parseInt(6))).toISOString().slice(0, 10);
                                // console.log("i", i);

                                //dateafter2day==currentdate
                                if (dateafter5day == currentdate && success[i].fivedaymailsend == 0) {
                                    console.log("success.email", success[i].email)
                                    const filePath = path.join(__dirname, '..', 'emailTemplates', 'send5dayemail.html');
                                    readHTMLFile(filePath, function (err, html) {
                                        var template = handlebars.compile(html);
                                        var replacements = {
                                            USER: success[i].first_name,
                                            websiteLink:website_url
                                        };
                                        var htmlToSend = template(replacements);
                                        var mailOptions = {
                                            from: 'no-reply@catchletter.com',
                                            to: success[i].email,
                                            subject: success[i].first_name + ", Did you join our Facebook Group yet? ",
                                            html: htmlToSend
                                        };
                                        const user_id = success[i]._id;

                                        collection.update({
                                                _id: ObjectId(user_id)
                                            }, {
                                                $set: {
                                                    fivedaymailsendDate: dateafter5day,
                                                    fivedaymailsend: 1
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
                                                    console.log("updated")
                                                    transporter.sendMail(mailOptions, function (error, info) {
                                                        if (error) {
                                                            console.log(error);
                                                        } else {
                                                            console.log('Email sent: ' + info.response);
                                                            resolve();
                                                        }
                                                    });
                                                }
                                            })

                                    });
                                } else {
                                    resolve();
                                }
                            } else {
                                resolve();
                            }



                        });

                    }

                })();

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


}





customerController.sendTestMail = (req, res) => {
   const requestBody = req.body;
     const filePath = path.join(__dirname, '..', 'emailTemplates', 'register.html');
     readHTMLFile(filePath, function (err, html) {
         var template = handlebars.compile(html);
         var replacements = {
             USER: 'Pragati',
             websiteLink: website_url
         };
         var htmlToSend = template(replacements);
         var mailOptions = {
             from: 'no-reply@catchletter.com',
             to: requestBody.to,
             subject: "Hello",
             html: htmlToSend
         };

         transporter.sendMail(mailOptions, function (error, info) {
             if (error) {
                 console.log(error);
             } else {
                 console.log('Email sent: ' + info.response);
                res.status(200).json({
                    success: true,
                    data: info
                });
             }
         });

     });


}


module.exports = customerController;
