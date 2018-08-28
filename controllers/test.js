var express = require('express'),
    router = express.Router()

var db = require('../db');
const ObjectId = require('mongodb').ObjectID;
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'mail.catchletter.com',
    port: 587,
    auth: {
        user: 'no-reply@catchletter.com',
        pass: '12345678'
    }
});


const testController = {};
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


function sendEmailsignup(type, to, subject, text, userName, userEmail, otp) {
    if (type == "register") {
        const filePath = path.join(__dirname, '..', 'emailTemplates', 'resetPassword.html');
        readHTMLFile(filePath, function (err, html) {
            var template = handlebars.compile(html);
            var data = userEmail.toString();
            var buff = new Buffer(data);
            var base64data = buff.toString('base64');
            var replacements = {
                USER: userName,
                //  link: "http://178.128.176.48:3000/activateLink?userId=" + base64data
                link: "http://app.catchletter.com/activateLink?userEmail=" + base64data,
                //link: "http://localhost:3000/activateLink?userId=" + base64data,
                OTP: otp
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

function sendEmail(type, to, subject, userName) {
    if (type == "billing") {
        const filePath = path.join(__dirname, '..', 'emailTemplates', 'billing.html');
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
    }
}


// testController.test = (req, res) => {
//     const requestBody = req.body;

//     console.log("threive res :", requestBody);
//     var Billing = db.get().collection('Billing');
//     var subscription = db.get().collection('subscription');
//     var customer = db.get().collection('customer');
//     const userTemp = db.get().collection('userTemp');
//     let previousPlanWithBillings = [];
//     let planDetails = [];
//     let billingDetails = [];

//     let billingId;
//     let expiryDate;

//     let currentDate = new Date();

//     if (requestBody.userId) {

//         /** if userId is getting */
//         Billing.find({
//             userId: ObjectId("5b556eb322bfa40e8b65c4d8")
//         }).toArray(function (err1, res1) {
//             if (err1) {
//                 res.status(500).json({
//                     success: false,
//                     data: err1
//                 });
//             } else if (res1) {
//                 if (res1.length > 0) {
//                     billingId = res1[0]._id;
//                     previousPlanWithBillings = res1[0].details;

//                     subscription.find({
//                         planId: requestBody.base_product
//                     }).toArray(function (err2, res2) {
//                         if (err1) {
//                             res.status(500).json({
//                                 success: false,
//                                 data: err2address
//                             });
//                         } else if (res2) {
//                             planDetails = res2;
//                             if (planDetails[0].subs_duration == "Monthly") {
//                                 let duration = 30;
//                                 expiryDate = new Date(new Date().setDate(currentDate.getDate() + parseInt(duration)));
//                             } else if (planDetails[0].subs_duration == "Yearly") {
//                                 let duration = 365;
//                                 expiryDate = new Date(new Date().setDate(currentDate.getDate() + parseInt(duration)));
//                             } else if (planDetails[0].subs_duration == "Life-Time") {
//                                 let duration = 36500;
//                                 expiryDate = new Date(new Date().setDate(currentDate.getDate() + parseInt(duration)));
//                             }

//                             const data = {
//                                 account_name: requestBody.thrivecart_account ? requestBody.thrivecart_account : '',
//                                 // country: requestBody.customer.address.country,
//                                 // zipCode: requestBody.customer.address.zip,
//                                 email: requestBody.customer.email ? requestBody.customer.email : '',
//                                 firstName: requestBody.customer.first_name ? requestBody.customer.first_name : '',
//                                 lastName: requestBody.customer.last_name ? requestBody.customer.last_name : '',
//                                 amount: requestBody.order.total_str ? requestBody.order.total_str : '',
//                                 planType: requestBody.purchases[0] ? requestBody.purchases[0] : '',
//                                 currencyType: requestBody.currency ? requestBody.currency : '',
//                                 order_id: requestBody.order_id ? requestBody.order_id : '',
//                                 payment_processor: requestBody.order.processor ? requestBody.order.processor : '',
//                                 userId: "5b556eb322bfa40e8b65c4d8",
//                                 billingDate: currentDate,
//                                 expiryDate: expiryDate,
//                                 invoice_id: requestBody.invoice_id ? requestBody.invoice_id : '',
//                                 thrivecart_secret: requestBody.thrivecart_secret ? requestBody.thrivecart_secret : ''
//                             };
//                             billingDetails.push(data);

//                             const dataNew = {
//                                 planDetails: planDetails,
//                                 billingDetails: billingDetails
//                             };

//                             previousPlanWithBillings.push(dataNew);
//                             sendEmail('billing', requestBody.customer.email, 'We are so excited to see you ' + requestBody.customer.first_name, requestBody.customer.first_name);

//                             Billing.update({
//                                 _id: ObjectId(billingId)
//                             }, {
//                                     $set: {
//                                         details: previousPlanWithBillings
//                                     }
//                                 }, {
//                                     upsert: true
//                                 },
//                                 function (err3, res3) {
//                                     if (err2) {
//                                         res.status(500).json({
//                                             success: false,
//                                             data: {
//                                                 message: err3
//                                             }
//                                         })
//                                     } else {
//                                         res.status(200).json({
//                                             success: true,
//                                             data: {
//                                                 message: "Successfully billing details updated.",
//                                                 details: res3.ops
//                                             }
//                                         });
//                                     }
//                                 });
//                         }
//                     });
//                 }
//             }
//         });

//     } else {

//         /** if userId is not got */

//         customer.find({
//             email: requestBody.customer.email
//         }).toArray(function (err4, res4) {
//             if (err4) {
//                 res.status(500).json({
//                     success: false,
//                     data: err4
//                 });
//             } else if (res4) {
//                 if (res4.length > 0) {
//                     Billing.find({
//                         userId: ObjectId(res4[0]._id)
//                     }).toArray(function (err1, res1) {
//                         if (err1) {
//                             res.status(500).json({
//                                 success: false,
//                                 data: err1
//                             });
//                         } else if (res1) {
//                             if (res1.length > 0) {
//                                 billingId = res1[0]._id;
//                                 previousPlanWithBillings = res1[0].details;

//                                 subscription.find({
//                                     planId: requestBody.base_product
//                                 }).toArray(function (err2, res2) {
//                                     if (err1) {
//                                         res.status(500).json({
//                                             success: false,
//                                             data: err2
//                                         });
//                                     } else if (res2) {
//                                         planDetails = res2;
//                                         if (planDetails[0].subs_duration == "Monthly") {
//                                             let duration = 30;
//                                             expiryDate = new Date(new Date().setDate(currentDate.getDate() + parseInt(duration)));
//                                         } else if (planDetails[0].subs_duration == "Yearly") {
//                                             let duration = 365;
//                                             expiryDate = new Date(new Date().setDate(currentDate.getDate() + parseInt(duration)));
//                                         } else if (planDetails[0].subs_duration == "Life-Time") {
//                                             let duration = 36500;
//                                             expiryDate = new Date(new Date().setDate(currentDate.getDate() + parseInt(duration)));
//                                         }

//                                         const data = {
//                                             account_name: requestBody.thrivecart_account ? requestBody.thrivecart_account : '',
//                                             // country: requestBody.customer.address.country,
//                                             // zipCode: requestBody.customer.address.zip,
//                                             email: requestBody.customer.email ? requestBody.customer.email : '',
//                                             firstName: requestBody.customer.first_name ? requestBody.customer.first_name : '',
//                                             lastName: requestBody.customer.last_name ? requestBody.customer.last_name : '',
//                                             amount: requestBody.order.total_str ? requestBody.order.total_str : '',
//                                             planType: requestBody.purchases[0] ? requestBody.purchases[0] : '',
//                                             currencyType: requestBody.currency ? requestBody.currency : '',
//                                             order_id: requestBody.order_id ? requestBody.order_id : '',
//                                             payment_processor: requestBody.order.processor ? requestBody.order.processor : '',
//                                             userId: "5b556eb322bfa40e8b65c4d8",
//                                             billingDate: currentDate,
//                                             expiryDate: expiryDate,
//                                             invoice_id: requestBody.invoice_id ? requestBody.invoice_id : '',
//                                             thrivecart_secret: requestBody.thrivecart_secret ? requestBody.thrivecart_secret : ''
//                                         };
//                                         billingDetails.push(data);

//                                         const dataNew = {
//                                             planDetails: planDetails,
//                                             billingDetails: billingDetails
//                                         };

//                                         previousPlanWithBillings.push(dataNew);
//                                         sendEmail('billing', requestBody.customer.email, 'We are so excited to see you ' + requestBody.customer.first_name, requestBody.customer.first_name);

//                                         Billing.update({
//                                             _id: ObjectId(billingId)
//                                         }, {
//                                                 $set: {
//                                                     details: previousPlanWithBillings
//                                                 }
//                                             }, {
//                                                 upsert: true
//                                             },
//                                             function (err3, res3) {
//                                                 if (err2) {
//                                                     res.status(500).json({
//                                                         success: false,
//                                                         data: {
//                                                             message: err3
//                                                         }
//                                                     })
//                                                 } else {
//                                                     res.status(200).json({
//                                                         success: true,
//                                                         data: {
//                                                             message: "Successfully billing details updated.",
//                                                             details: res3.ops
//                                                         }
//                                                     });
//                                                 }
//                                             });
//                                     }
//                                 });
//                             }
//                         }
//                     });
//                 } else {
//                     const otp = Math.floor(100000 + Math.random() * 900000);
//                     userTemp.save({
//                         email: requestBody.customer.email,
//                         otp: otp
//                     }, function (err7, res7) {
//                         if (err7) {
//                             console.log('error in saving', err7);
//                         }
//                         else {
//                             requestBody.report_type = "weekly";
//                             requestBody.report_day = "mon";
//                             requestBody.reg_date = new Date(Date.now()).toISOString();
//                             requestBody.fivedaymailsendDate = '';
//                             requestBody.twodaymailsendDate = '';
//                             requestBody.twodaymailsend = 0;
//                             requestBody.fivedaymailsend = 0;
//                             requestBody.ismailclickActive = 0;
//                             requestBody.IsUserActive = 0;

//                             const dataone = {
//                                 first_name: requestBody.customer.first_name ? requestBody.customer.first_name : '',
//                                 last_name: requestBody.customer.last_name ? requestBody.customer.last_name : '',
//                                 phone: '',
//                                 email: requestBody.customer.email ? requestBody.customer.email : '',
//                                 company: requestBody.customer.business_name ? requestBody.customer.business_name : '',
//                                 imageFileName: '',
//                                 report_type: requestBody.report_type,
//                                 report_day: requestBody.report_day,
//                                 reg_date: requestBody.reg_date,
//                                 fivedaymailsendDate: requestBody.fivedaymailsendDate,
//                                 twodaymailsendDate: requestBody.twodaymailsendDate,
//                                 twodaymailsend: requestBody.twodaymailsend,
//                                 fivedaymailsend: requestBody.fivedaymailsend,
//                                 IsUserActive: requestBody.IsUserActive

//                             };

//                             customer.save(dataone, function (err5, res5) {
//                                 if (err5) {
//                                     res.status(500).json({
//                                         success: false,
//                                         data: err
//                                     });
//                                 } else if (res5) {
//                                     console.log("customer is saved to database", res5);
//                                     console.log("after saving", requestBody)
//                                     sendEmailsignup("register", requestBody.customer.email, 'Welcome to catchletter', 'That was easy!', requestBody.customer.first_name, requestBody.customer.email, otp);
//                                     sendEmail('billing', requestBody.customer.email, 'We are so excited to see you ' + requestBody.customer.first_name, requestBody.customer.first_name);
//                                     subscription.find({
//                                         planId: requestBody.base_product
//                                     }).toArray(function (err6, res6) {
//                                         if (err6) {
//                                             res.status(500).json({
//                                                 success: false,
//                                                 data: err6
//                                             });
//                                         } else if (res6) {
//                                             planDetails = res6;
//                                             if (planDetails[0].subs_duration == "Monthly") {
//                                                 let duration = 30;
//                                                 expiryDate = new Date(new Date().setDate(currentDate.getDate() + parseInt(duration)));
//                                             } else if (planDetails[0].subs_duration == "Yearly") {
//                                                 let duration = 365;
//                                                 expiryDate = new Date(new Date().setDate(currentDate.getDate() + parseInt(duration)));
//                                             } else if (planDetails[0].subs_duration == "Life-Time") {
//                                                 let duration = 36500;
//                                                 expiryDate = new Date(new Date().setDate(currentDate.getDate() + parseInt(duration)));
//                                             }

//                                             const data = {
//                                                 account_name: requestBody.thrivecart_account ? requestBody.thrivecart_account : '',
//                                                 // country: requestBody.customer.address.country,
//                                                 // zipCode: requestBody.customer.address.zip,
//                                                 email: requestBody.customer.email ? requestBody.customer.email : '',
//                                                 firstName: requestBody.customer.first_name ? requestBody.customer.first_name : '',
//                                                 lastName: requestBody.customer.last_name ? requestBody.customer.last_name : '',
//                                                 amount: requestBody.order.total_str ? requestBody.order.total_str : '',
//                                                 planType: requestBody.purchases[0] ? requestBody.purchases[0] : '',
//                                                 currencyType: requestBody.currency ? requestBody.currency : '',
//                                                 order_id: requestBody.order_id ? requestBody.order_id : '',
//                                                 payment_processor: requestBody.order.processor ? requestBody.order.processor : '',
//                                                 userId: "5b556eb322bfa40e8b65c4d8",
//                                                 billingDate: currentDate,
//                                                 expiryDate: expiryDate,
//                                                 invoice_id: requestBody.invoice_id ? requestBody.invoice_id : '',
//                                                 thrivecart_secret: requestBody.thrivecart_secret ? requestBody.thrivecart_secret : ''
//                                             };
//                                             billingDetails.push(data);

//                                             const dataNew = {
//                                                 planDetails: planDetails,
//                                                 billingDetails: billingDetails
//                                             };

//                                             previousPlanWithBillings.push(dataNew);

//                                             Billing.save({
//                                                 details: previousPlanWithBillings,
//                                                 userId: "5b556eb322bfa40e8b65c4d8"
//                                             }, function (err7, res7) {
//                                                 if (err7) {
//                                                     res.status(500).json({
//                                                         success: false,
//                                                         data: err7
//                                                     });
//                                                 } else if (res7) {
//                                                     res.status(200).json({
//                                                         success: true,
//                                                         data: {
//                                                             message: "Customer and default billing is added."
//                                                         }
//                                                     });
//                                                 }
//                                             });
//                                         }
//                                     });
//                                 }
//                             });
//                         }
//                     })

//                 }
//             }
//         });
//     }
// }





testController.test = (req, res) => {
    const requestBody = req.body;

    console.log("threive res :", requestBody);
    var orderTemp = db.get().collection('orderTemp');
    var subscription = db.get().collection('subscription');
    var customer = db.get().collection('customer');
    const userTemp = db.get().collection('userTemp');
    let previousPlanWithBillings = [];
    let planDetails = [];
    let billingDetails = [];

    let billingId;
    let expiryDate;

    let currentDate = new Date();

   subscription.find({
       planId: requestBody.base_product
   }).toArray(function (err2, res2) {
       if (err2) {
           res.status(500).json({
               success: false,
               data: err2
           });
       } else if (res2) {
           planDetails = res2;
           if (planDetails[0].subs_duration == "Monthly") {
               let duration = 30;
               expiryDate = new Date(new Date().setDate(currentDate.getDate() + parseInt(duration)));
           } else if (planDetails[0].subs_duration == "Yearly") {
               let duration = 365;
               expiryDate = new Date(new Date().setDate(currentDate.getDate() + parseInt(duration)));
           } else if (planDetails[0].subs_duration == "Life-Time") {
               let duration = 36500;
               expiryDate = new Date(new Date().setDate(currentDate.getDate() + parseInt(duration)));
           }

           const data = {
               account_name: requestBody.thrivecart_account ? requestBody.thrivecart_account : '',
               email: requestBody.customer.email ? requestBody.customer.email : '',
               firstName: requestBody.customer.first_name ? requestBody.customer.first_name : '',
               lastName: requestBody.customer.last_name ? requestBody.customer.last_name : '',
               amount: requestBody.order.total_str ? requestBody.order.total_str : '',
               planType: requestBody.purchases[0] ? requestBody.purchases[0] : '',
               currencyType: requestBody.currency ? requestBody.currency : '',
               order_id: requestBody.order_id ? requestBody.order_id : '',
               payment_processor: requestBody.order.processor ? requestBody.order.processor : '',
               userId: "",
               billingDate: currentDate,
               expiryDate: expiryDate,
               invoice_id: requestBody.invoice_id ? requestBody.invoice_id : '',
               thrivecart_secret: requestBody.thrivecart_secret ? requestBody.thrivecart_secret : '',
               tax:requestBody.order.tax?requestBody.order.tax:''
           };
           billingDetails.push(data);

           const dataNew = {
               planDetails: planDetails,
               billingDetails: billingDetails,
               orderId:data.order_id,
                country: requestBody.customer.address.country,
                zipCode: requestBody.customer.address.zip,
                company: requestBody.customer.business_name ? requestBody.customer.business_name : '',
           };
               orderTemp.save(dataNew, function(err1, res1){
                   if(err1)
                   {
                       res.status(500).json({
                           status:false,
                           data:{
                               message:err1
                           }
                       })
                   }
                   else
                   {
                       res.status(200).json({
                           status:true,
                           data:{
                               message:res1
                           }
                       })
                   }
               })
           
           
       }
   });
}




/** update customer after set password */
testController.setPassword = (req, res) => {
    const requestBody = req.body;
    var userTemp = db.get().collection('userTemp');
    var collection = db.get().collection('customer');

    let reqBody;

    userTemp.find({
        email: requestBody.email
    }).toArray(function (err1, res1) {
        if (err1) {
            res.status(500).json({
                success: false,
                data: err1
            });
        } else if (res1) {
            if (res1[0].otp == requestBody.otp) {

                collection.find({
                    email: requestBody.email
                }).toArray(function (err2, res2) {
                    if (err2) {
                        res.status(500).json({
                            success: false,
                            data: err2
                        });
                    } else if (res2) {
                        const userid = res2[0]._id;
                        const saltedPassword = saltHashPassword(requestBody.password);
                        reqBody.saltKey = saltedPassword.salt;
                        reqBody.salt = saltedPassword.passwordHash;

                        collection.update({
                                _id: ObjectId(userid)
                            }, {
                                $set: reqBody
                            }, {
                                upsert: true
                            },
                            function (err3, res3) {
                                if (err2) {
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
                                            message: "Customer password successfully updated."
                                        }
                                    })
                                }
                            });
                    }
                });
            } else {
                res.status(404).json({
                    success: false,
                    data: {
                        message: "Otp not matched."
                    }
                })
            }
        }
    });
}

/** save current plan */
testController.currentplan = (req, res) => {
    // const requestBody = req.body;
    // var Billing = db.get().collection('Billing');
    // var subscription = db.get().collection('subscription');

    // let previousPlanWithBillings = [];
    // let planDetails = [];
    // let billingDetails = [];

    // let billingId;
    // let expiryDate;
    // let currentDate = new Date();
    // console.log("currnetdate :", currentDate);

    // if (requestBody.validity == "Monthly") {
    //     let duration = 30;
    //     expiryDate = new Date(new Date().setDate(currentDate.getDate() + parseInt(duration)));
    //     console.log("expiry date :", expiryDate);
    // } else if (requestBody.validity == "Quaterly") {

    // }

    // const data = {
    //     name: "subhajit",
    //     value: "123456"
    // };

    // Billing.find({
    //     userId: ObjectId(requestBody.userId)
    // }).toArray(function (err1, res1) {
    //     if (err1) {
    //         res.status(500).json({
    //             success: false,
    //             data: err1
    //         });
    //     } else if (res1) {
    //         if (res1.length > 0) {
    //             billingId = res1[0]._id;
    //             previousPlanWithBillings = res1[0].details;

    //             subscription.find({
    //                 planId: requestBody.planId
    //             }).toArray(function (err2, res2) {
    //                 if (err1) {
    //                     res.status(500).json({
    //                         success: false,
    //                         data: err2
    //                     });
    //                 } else if (res2) {
    //                     planDetails = res2;
    //                     billingDetails.push(data);

    //                     const dataNew = {
    //                         planDetails: planDetails,
    //                         billingDetails: billingDetails
    //                     };

    //                     console.log("billingId :", billingId);

    //                     previousPlanWithBillings.push(dataNew);
    //                     res.status(200).json({
    //                         success: true,
    //                         data: {
    //                             details: previousPlanWithBillings
    //                         }
    //                     })
    //                 }
    //             });
    //         }
    //     }
    // });
}

module.exports = testController;
