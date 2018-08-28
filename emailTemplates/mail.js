var express = require('express'),
    router = express.Router()

var db = require('../db')
const ObjectId = require('mongodb').ObjectID;
const webshot = require('webshot');
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
let imap;
const options = {
    shotSize: {
        width: 'all',
        height: 'all'
    },
    siteType: 'html'
};
const Imap = require('imap'),
    inspect = require('util').inspect;

var fs = require('fs'),
    fileStream;
const simpleParser = require('mailparser').simpleParser;
const path = require('path');
const mailController = {};


function openInbox(cb) {
    imap.openBox('INBOX', false, cb);
}

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
/**************Mail configuration*************** */
// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: 'pragati@natitsolved.com',
//         pass: 'pragati123'
//     }
// });
const transporter = nodemailer.createTransport({
    host: 'box.catchletter.com',
    port: 587,
    auth: {
        user: 'no-reply@catchletter.com',
        pass: '12345678'
    }
});
mailController.getParticularlWebsitesImages = (req, res) => {
    const requestBody = req.body;
    var i = 'K';
    const collection = db.get().collection('websites');
    const mailImages = db.get().collection('mailImages');
    collection.find({
        emailDomain: requestBody.emailDomain
    }).toArray(function (err, success) {
        if (err) {
            res.status(500).json({
                success: false,
                data: err
            });
        } else {
            if (success.length > 0) {
                let allMails = [];
                imap = new Imap({
                    user: requestBody.emailDomain,
                    password: requestBody.unique_id,
                    host: 'box.catchletter.com',
                    port: 993,
                    tls: true
                });
                let parsedData;
                imap.once('ready', function () {

                    var fs = require('fs'),
                        fileStream;

                    openInbox(function (err, box) {


                        // if (err) throw err;
                        imap.search(['ALL', ['SINCE', 'May 20, 2000']], function (err, results) {
                            if (results.length > 0) {

                                // if (err) throw err;
                                var f = imap.fetch(results, {
                                    bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', ''],
                                    struct: true
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
                                        if (allMails && allMails[i]) {


                                            if (allMails[i].uid == '') {
                                                allMails[i].uid = attrs.uid;
                                            }

                                            if (allMails[i].flag == '') {
                                                //responseData[i].flag = attrs.flags.length;
                                                if (attrs.flags && attrs.flags.length && attrs.flags.length > 0) {
                                                    for (let i = 0; i < attrs.flags.length; i++) {
                                                        attrs.flags[i] = attrs.flags[i].replace(/\\/g, "");
                                                    }
                                                    if (attrs.flags.indexOf("Flagged") != -1) {
                                                        allMails[i].flag = 1;
                                                    } else {
                                                        allMails[i].flag = 0;
                                                    }
                                                    allMails[i].attrs = attrs.flags;
                                                } else {
                                                    allMails[i].flag = 0;
                                                }
                                            }


                                            (async function loop() {
                                                await new Promise(resolve => {
                                                    let nameOfFile = "screenshots_" + requestBody.emailDomain + "_" + attrs.uid + ".png";
                                                    fs.exists('./screenshots/' + nameOfFile, function (exists) {
                                                        if (exists) {

                                                            resolve();
                                                        } else {
                                                            allMails[i].convertedImage = nameOfFile;
                                                            const data = {
                                                                website_id: ObjectId(success[0]._id),
                                                                emailDomain: requestBody.emailDomain,
                                                                unique_id: requestBody.unique_id,
                                                                user_id: ObjectId(success[0].user_id),
                                                                uid: allMails[i].uid,
                                                                tags: success[0].tags,
                                                                emailHeader: allMails[i].header,
                                                                isRead: false,
                                                                IsDlagged: allMails[i].flag
                                                            };

                                                            mailImages.save(data, function (err3, res3) {
                                                                if (err3) {

                                                                    resolve();
                                                                } else {
                                                                    resolve();
                                                                }
                                                            })
                                                            simpleParser(allMails[i].buffer, (err, parsed) => {
                                                                if (err) {

                                                                    throw err;
                                                                } else {
                                                                    if (parsed.html) {
                                                                        webshot(parsed.html, './screenshots/' + nameOfFile, options, function (err) {
                                                                            if (err) {

                                                                                resolve();
                                                                            } else {



                                                                            }
                                                                        });
                                                                    }
                                                                }
                                                            });
                                                        }
                                                    });


                                                });
                                            })();

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
                                            message: allMails
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
                    data: 'No website found'
                });
            }
        }
    })
}

mailController.getAllMailImages = (req, res) => {
    // const requestBody = req.body;
    var i = 'K';
    const collection = db.get().collection('websites');
    const mailImages = db.get().collection('mailImages');
    const alertsDoc = db.get().collection('alerts');
    const customerDoc = db.get().collection('customer');
    collection.find({}).toArray(function (err, success) {
        if (err) {
            res.status(500).json({
                success: false,
                data: err
            });
        } else {
            if (success.length > 0) {
                let allMails = [];
                (async function loop() {
                    for (let j = 0; j < success.length; j++) {

                        i = 'K';
                        await new Promise(resolve => {

                            imap = new Imap({
                                user: success[j].emailDomain,
                                password: success[j].unique_id,
                                host: 'box.catchletter.com',
                                port: 993,
                                tls: true
                            });
                            let parsedData;
                            imap.once('ready', function () {

                                var fs = require('fs'),
                                    fileStream;

                                openInbox(function (err, box) {


                                    // if (err) throw err;
                                    imap.search(['UNSEEN', ['SINCE', 'May 20, 2000']], function (err, results) {
                                        console.log("results", results.length)
                                        if (results.length > 0) {

                                            // if (err) throw err;
                                            var f = imap.fetch(results, {
                                                bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', ''],
                                                struct: true,
                                                markSeen: true
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
                                                                emailDomain: success[j].emailDomain,
                                                                unique_id: success[j].unique_id,
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

                                                    const index = allMails.length - 1;
                                                    if (allMails && allMails[index]) {


                                                        if (allMails[index].uid == '') {
                                                            allMails[index].uid = attrs.uid;
                                                        }

                                                        if (allMails[index].flag == '') {
                                                            //responseData[i].flag = attrs.flags.length;
                                                            if (attrs.flags && attrs.flags.length && attrs.flags.length > 0) {
                                                                for (let k = 0; k < attrs.flags.length; k++) {
                                                                    attrs.flags[k] = attrs.flags[k].replace(/\\/g, "");
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


                                                        let nameOfFile = "screenshots_" + success[j].emailDomain + "_" + attrs.uid + ".png";
                                                        fs.exists('./screenshots/' + nameOfFile, function (exists) {
                                                            if (exists) {
                                                                console.log("nameOfFile", nameOfFile);
                                                                resolve();
                                                            } else {

                                                                console.log("saving")
                                                                //allMails[i].convertedImage = nameOfFile;
                                                                const data = {
                                                                    website_id: ObjectId(success[j]._id),
                                                                    emailDomain: success[j].emailDomain,
                                                                    unique_id: success[j].unique_id,
                                                                    user_id: ObjectId(success[j].user_id),
                                                                    uid: allMails[index].uid,
                                                                    tags: success[j].tags,
                                                                    header: allMails[index].header,
                                                                    isRead: false,
                                                                    flag: allMails[index].flag,
                                                                    cDate: new Date()
                                                                };


                                                                simpleParser(allMails[index].buffer, (err, parsed) => {
                                                                    if (err) {

                                                                        throw err;
                                                                    } else {
                                                                        if (parsed.html) {
                                                                            webshot(parsed.html, './screenshots/' + nameOfFile, options, function (err) {
                                                                                if (err) {

                                                                                    resolve();
                                                                                } else {
                                                                                    mailImages.save(data, function (err3, res3) {
                                                                                        if (err3) {

                                                                                            resolve();
                                                                                        } else {
                                                                                            console.log("screenshots saved", success[j]._id)
                                                                                            console.log("screenshots saved 1", success[j].user_id)
                                                                                            alertsDoc.find({
                                                                                                user_id: ObjectId(success[j].user_id),
                                                                                                website_id: ObjectId(success[j]._id)
                                                                                            }).toArray(function (alertsError, alertsSuccess) {
                                                                                                if (alertsError) {
                                                                                                    resolve();
                                                                                                } else if (alertsSuccess.length > 0) {
                                                                                                         console.log("alertsSuccess", alertsSuccess.length)
                                                                                                    customerDoc.find({
                                                                                                        _id: ObjectId(success[j].user_id)
                                                                                                    }).toArray(function (customerError, customerSuccess) {
                                                                                                        if (customerError) {
                                                                                                            resolve();
                                                                                                        } else if (customerSuccess.length > 0) {
                                                                                                             console.log("customerSuccess", customerSuccess.length)
                                                                                                            const filePath = path.join(__dirname, '..', 'emailTemplates', 'alerts.html');
                                                                                                            readHTMLFile(filePath, function (err, html) {
                                                                                                                var template = handlebars.compile(html);
                                                                                                                var replacements = {
                                                                                                                    WEBSITENAME: success[j].website_name,
                                                                                                                    USER: customerSuccess[0].first_name
                                                                                                                };
                                                                                                                var htmlToSend = template(replacements);
                                                                                                                console.log("customerSuccess[0].email", customerSuccess[0].email)
                                                                                                                var mailOptions = {
                                                                                                                    from: 'no-reply@catchletter.com',
                                                                                                                    to: customerSuccess[0].email,
                                                                                                                    subject: 'New mail recieved from ' + success[0].website_name,
                                                                                                                    html: htmlToSend
                                                                                                                };
                                                                                                                transporter.sendMail(mailOptions, function (error, info) {
                                                                                                                    if (error) {
                                                                                                                        console.log(error);
                                                                                                                        resolve();
                                                                                                                    } else {
                                                                                                                        console.log('Email sent: ' + info.response);
                                                                                                                        resolve();
                                                                                                                    }
                                                                                                                });
                                                                                                            });
                                                                                                        } else {
                                                                                                            resolve()
                                                                                                        }
                                                                                                    })


                                                                                                } else {
                                                                                                    console.log("alert not found");
                                                                                                    resolve();
                                                                                                }
                                                                                            })
                                                                                        }
                                                                                    })


                                                                                }
                                                                            });
                                                                        }
                                                                    }
                                                                });
                                                            }
                                                        });



                                                    }

                                                    // responseData_message = [];

                                                });
                                                msg.once('end', function () {

                                                });
                                            });
                                            f.once('error', function (err) {

                                            });
                                            f.once('end', function () {

                                                resolve();
                                            });
                                        } else {
                                            resolve();
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

                        });


                    }
                    res.status(200).json({
                        success: true,
                        data: 'images saved'
                    });


                })();
            } else {
                res.status(403).json({
                    success: false,
                    data: 'No website found'
                });
            }
        }
    })
}
module.exports = mailController;