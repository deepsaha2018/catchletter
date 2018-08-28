var express = require('express'),
    router = express.Router()

var db = require('../db')
const ObjectId = require('mongodb').ObjectID;
const reportsController = {};
// var decode = require('unescape');
const decode = require('decode-html');
var nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const website_url = require('../config');
const _imageURL = "http://178.128.176.48:7000/resources/screenshots_";
/**************Mail configuration*************** */
// var transporter = nodemailer.createTransport({
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


// function sendEmail(customerData, toDaysDate) {
//     const filePath = path.join(__dirname, '..', 'emailTemplates', 'reportEmail.html');
//     readHTMLFile(filePath, function (err, html) {
//         var template = handlebars.compile(html);
//         let websitesListToAppend = [];
//         let appendHtml = '<hr> <div> &nbsp; </div> <a href ="javascript:void(0)"> Myntra </a><p> Looks like Myntra didnot send any newsletters in Mon, 23 Jul 15:32 to Mon, 30 Jul 15:30.</p> <p >Please make sure you have signed up to their email newsletters using the email <u><a href="mailto:myntracom3621@email.owletter.com" target="_blank">myntracom3621@email.owletter.<wbr>com</a></u>'
//         //    let appendHtml;
//         //     for (let i = 0; i < customerData.websiteList.length;i++)
//         //     {
//         //       if(customerData.websiteList[i].mailList.length>0)
//         //       {
//         //         appendHtml=appendHtml+""
//         //       }
//         //       else
//         //       {
//         //           appendHtml = appendHtml + '<hr> <div > & nbsp; < /div> <h1 style = "margin-top:0.5em" > < a href = "https://click.pstmrk.it/2s/www.owletter.com%2Fdashboard%2F%3FSelectedWebsiteId%3D7154%26StartDate%3D2018-07-23%26EndDate%3D2018-07-30/A5615QE/bfo_/f80kCUCydo"target = "_blank"data - saferedirecturl = "https://www.google.com/url?hl=en&amp;q=https://click.pstmrk.it/2s/www.owletter.com%252Fdashboard%252F%253FSelectedWebsiteId%253D7154%2526StartDate%253D2018-07-23%2526EndDate%253D2018-07-30/A5615QE/bfo_/f80kCUCydo&amp;source=gmail&amp;ust=1533132362347000&amp;usg=AFQjCNFHpq2K_EeYQkzzrwJANFHDsuaSrA" > Myntra < /a></h1 ><p > Looks like Myntra didnot send any newsletters in Mon, 23 Jul 15:32 to Mon, 30 Jul 15:30.</p> <p >Please make sure you have signed up to their email newsletters using the email <u><a href="mailto:myntracom3621@email.owletter.com" target="_blank">myntracom3621@email.owletter.<wbr>com</a></u>.'
//         //       }
//         //     }
//         var replacements = {
//             TODAYSDATE: toDaysDate,
//             WEBSITESLIST: appendHtml
//         };
//         var htmlToSend = template(replacements);
//         const htmlToSend1 = decode(htmlToSend);
//         var mailOptions = {
//             from: 'pragati@natitsolved.com',
//             to: "pragati@natitsolved.com",
//             subject: "Email activity report",
//             html: htmlToSend1
//         };



//         transporter.sendMail(mailOptions, function (error, info) {
//             if (error) {
//             } else {
//                 console.log('Email sent: ' + info.response);
//                 return info.response;
//             }
//         });
//     });


// }



function getDayName(day) {
    let dayName;
    switch (day) {
        case 0:
            dayName = "Sun";
            break;
        case 1:
            dayName = "Mon";
            break;
        case 2:
            dayName = "Tue";
            break;
        case 3:
            dayName = "Wed";
            break;
        case 4:
            dayName = "Thu";
            break;
        case 5:
            dayName = "Fri";
            break;
        case 6:
            dayName = "Sat";
            break;

        default:
            break;
    }
    return dayName;
}


function getMonthName(month) {
    let monthname;
    switch (month) {
        case 1:
            monthname = "Jan";
            break;
        case 2:
            monthname = "Feb";
            break;
        case 3:
            monthname = "Mar";
            break;
        case 4:
            monthname = "Apr";
            break;
        case 5:
            monthname = "May";
            break;
        case 6:
            monthname = "Jun";
            break;
        case 7:
            monthname = "Jul";
            break;
        case 8:
            monthname = "Aug";
            break;
        case 9:
            monthname = "Sept";
            break;
        case 10:
            monthname = "Oct";
            break;
        case 11:
            monthname = "Nov";
            break;
        case 12:
            monthname = "Dec";
            break;
        default:
            break;
    }
    return monthname;
}


reportsController.sendReportsToAllUsers = (req, res) => {
    const customerCollection = db.get().collection('customer');
    const websiteCollection = db.get().collection('websites');
    const mailImagesCollection = db.get().collection('mailImages');
    const toDaysName = getDayName(new Date().getDay());
    const toDaysMonthName = getMonthName(new Date().getMonth() + 1);
    const todaysDate = new Date().getDate() < 10 ? ("0" + new Date().getDate()) : new Date().getDate();
    const toDaysDate1 = toDaysName + ", " + todaysDate + " " + toDaysMonthName + " " + new Date().getFullYear();
    let toFindWebsites = [];
    customerCollection.aggregate([{
        $lookup: {
            from: "websites",
            localField: "_id",
            foreignField: "user_id",
            as: "websitesList"
        }
    }, {
        $match: {
            "report_type": "daily"
        }
    }]).toArray(function (err2, dailyCustomers) {
        if (err2) {
            res.status(500).json({
                success: false,
                data: err2
            })
        } else {
            let data1;
            let data;
            if (dailyCustomers.length > 0) {
                let finalList = [];
                (async function loop() {
                    for (let i = 0; i < dailyCustomers.length; i++) {
                        data = {
                            first_name: dailyCustomers[i].first_name,
                            email: dailyCustomers[i].email,
                            websiteList: []
                        }
                        await new Promise(resolve => {
                            (async function loop1() {
                                for (let j = 0; j < dailyCustomers[i].websitesList.length; j++) {
                                    data1 = {};
                                    data1 = {
                                        websiteInfo: dailyCustomers[i].websitesList[j],
                                        mailList: []
                                    };
                                    await new Promise(resolve1 => {
                                        mailImagesCollection.find({
                                            website_id: ObjectId(dailyCustomers[i].websitesList[j]._id)
                                        }).toArray(function (err3, res3) {

                                            for (let k = 0; k < res3.length; k++) {
                                                let toCompareDate = res3[k].header.date[0].split(" ")[0] + " " + res3[k].header.date[0].split(" ")[1] + " " + res3[k].header.date[0].split(" ")[2] + " " + res3[k].header.date[0].split(" ")[3];

                                                if (toCompareDate == toDaysDate1) {
                                                    data1.mailList.push(res3[i]);
                                                }
                                            }
                                            // data1.mailList.push(res3);

                                            data.websiteList.push(data1);
                                            resolve1()
                                        })

                                    });
                                }
                                resolve()
                            })();
                        });
                        finalList.push(data)

                    }
                    let appendHtml;
                    let appendHtmlOne;
                    let image;
                    let img;
                    let subject;
                    let subject1;
                    let date;
                    let date1;
                    let p_Max = [];
                    let p_Value;
                    let TOTALMAILCOUNT;
                    (async function sendEmailForEachCustomer() {
                        for (let i = 0; i < finalList.length; i++) {
                            appendHtml = "";
                            appendHtmlOne = "";
                            if (finalList[i].websiteList.length > 0) {
                                await new Promise(resolve => {
                                    const filePath = path.join(__dirname, '..', 'emailTemplates', 'reportEmail.html');
                                    readHTMLFile(filePath, function (err, html) {
                                        var template = handlebars.compile(html);
                                        let websitesListToAppend = [];
                                        // let appendHtml = '<hr> <div> &nbsp; </div> <a href ="javascript:void(0)"> Myntra </a><p> Looks like Myntra didnot send any newsletters in Mon, 23 Jul 15:32 to Mon, 30 Jul 15:30.</p> <p >Please make sure you have signed up to their email newsletters using the email <u><a href="mailto:myntracom3621@email.owletter.com" target="_blank">myntracom3621@email.owletter.<wbr>com</a></u>'

                                        for (let j = 0; j < finalList[i].websiteList.length; j++) {
                                            if (finalList[i].websiteList[j].mailList.length > 0) {

                                                TOTALMAILCOUNT = finalList[i].websiteList[j].mailList.length;

                                                for (let p = 0; p < finalList[i].websiteList[j].mailList.length; p++) {
                                                    p_Max.push(p);
                                                    p_Value = p;

                                                    if (p == 0) {
                                                        image = _imageURL + finalList[i].websiteList[j].mailList[0].emailDomain + "_" + finalList[i].websiteList[j].mailList[0].uid + ".png";

                                                        subject = finalList[i].websiteList[j].mailList[0].header.subject[0];

                                                        date = finalList[i].websiteList[j].mailList[0].header.date[0].split(" ")[0] + " " + finalList[i].websiteList[j].mailList[0].header.date[0].split(" ")[1] + " " + finalList[i].websiteList[j].mailList[0].header.date[0].split(" ")[2] + " " + finalList[i].websiteList[j].mailList[0].header.date[0].split(" ")[3];

                                                        appendHtmlOne = '<hr><div style="float:right;"><h1><a style="border-radius:2px;background:#2196f3;color:#fff;display:inline-block;font-family:sans-serif;font-size:13px;font-weight:bold;line-height:40px;text-align:center;text-decoration:none;width:200px;" href="http://178.128.176.48:3000/inbox" target="_blank"rel="noopener"> VIEW ALL ' + finalList[i].websiteList[j].mailList.length + ' EMAIL(S)</a></h1></div><h1 style="margin-top:0.5em;"><a style=color:#2196f3; href="http://178.128.176.48:3000/inbox" target="_blank"rel="noopener">' + finalList[i].websiteList[j].websiteInfo.website_name + '</a></h1><p>' + finalList[i].websiteList[j].websiteInfo.website_name + 'sent  <strong>' + finalList[i].websiteList[j].mailList.length + '</strong> email(s),<strong>up</strong> today.<table border ="0" cellspacing="0" cellpadding="5"><tbody><tr><td align="left" valign="bottom" width="50%"><div><strong> ' + subject + '</strong></div><div style="color:#666666;">' + date + '</div><div><a href="javascript:void(0)" target="_blank" rel="noopener"><img style="width:250px;height:300px;object-fit:cover" src="' + image + '"/></a></div></td></tr></tbody></table>'

                                                        break;
                                                    }


                                                    // if (Math.max.apply(null, p_Max) == p_Value && p == 0) {
                                                    //     image = _imageURL + finalList[i].websiteList[j].mailList[0].emailDomain + "_" + finalList[i].websiteList[j].mailList[0].uid + ".png";

                                                    //     subject = finalList[i].websiteList[j].mailList[0].header.subject[0];

                                                    //     date = finalList[i].websiteList[j].mailList[0].header.date[0].split(" ")[0] + " " + finalList[i].websiteList[j].mailList[0].header.date[0].split(" ")[1] + " " + finalList[i].websiteList[j].mailList[0].header.date[0].split(" ")[2] + " " + finalList[i].websiteList[j].mailList[0].header.date[0].split(" ")[3];

                                                    //     appendHtmlOne = '<hr><div style="float:right;"><h1><a style="border-radius:2px;background:#2196f3;color:#fff;display:inline-block;font-family:sans-serif;font-size:13px;font-weight:bold;line-height:40px;text-align:center;text-decoration:none;width:200px;" href="http://178.128.176.48:3000/inbox" target="_blank"rel="noopener"> VIEW ALL ' + finalList[i].websiteList[j].mailList.length + ' EMAIL(S)</a></h1></div><h1 style="margin-top:0.5em;"><a style=color:#2196f3; href="http://178.128.176.48:3000/inbox" target="_blank"rel="noopener">' + finalList[i].websiteList[j].websiteInfo.website_name + '</a></h1><p>' + finalList[i].websiteList[j].websiteInfo.website_name + 'sent <strong>' + finalList[i].websiteList[j].mailList.length + '</strong> email(s),<strong>up</strong> today.<table border ="0" cellspacing="0" cellpadding="5"><tbody><tr><td align="left" valign="bottom" width="50%"><div><strong> ' + subject + '</strong></div><div style="color:#666666;">' + date + '</div><div><a href="javascript:void(0)" target="_blank" rel="noopener"><img style="width:250px;height:300px;object-fit:cover" src="' + image + '"/></a></div></td></tr></tbody></table>'

                                                    //     break;
                                                    // }

                                                    // if (Math.max.apply(null, p_Max) == p_Value && p == 1) {
                                                    //     image = _imageURL + finalList[i].websiteList[j].mailList[0].emailDomain + "_" + finalList[i].websiteList[j].mailList[0].uid + ".png";
                                                    //     img = _imageURL + finalList[i].websiteList[j].mailList[1].emailDomain + "_" + finalList[i].websiteList[j].mailList[1].uid + ".png";

                                                    //     subject = finalList[i].websiteList[j].mailList[0].header.subject[0];
                                                    //     subject1 = finalList[i].websiteList[j].mailList[1].header.subject[0];

                                                    //     date = finalList[i].websiteList[j].mailList[0].header.date[0].split(" ")[0] + " " + finalList[i].websiteList[j].mailList[0].header.date[0].split(" ")[1] + " " + finalList[i].websiteList[j].mailList[0].header.date[0].split(" ")[2] + " " + finalList[i].websiteList[j].mailList[0].header.date[0].split(" ")[3];
                                                    //     date1 = finalList[i].websiteList[j].mailList[1].header.date[0].split(" ")[0] + " " + finalList[i].websiteList[j].mailList[1].header.date[0].split(" ")[1] + " " + finalList[i].websiteList[j].mailList[1].header.date[0].split(" ")[2] + " " + finalList[i].websiteList[j].mailList[1].header.date[0].split(" ")[3];

                                                    //     appendHtmlOne = '<hr><div style="float:right;"><h1><a style="border-radius:2px;background:#2196f3;color:#fff;display:inline-block;font-family:sans-serif;font-size:13px;font-weight:bold;line-height:40px;text-align:center;text-decoration:none;width:200px;" href="http://178.128.176.48:3000/inbox" target="_blank"rel="noopener"> VIEW ALL ' + finalList[i].websiteList[j].mailList.length + ' EMAIL(S)</a></h1></div><h1 style="margin-top:0.5em;"><a style=color:#2196f3; href="http://178.128.176.48:3000/inbox" target="_blank"rel="noopener">' + finalList[i].websiteList[j].websiteInfo.website_name + '</a></h1><p>' + finalList[i].websiteList[j].websiteInfo.website_name + 'sent <strong>' + finalList[i].websiteList[j].mailList.length + '</strong> email(s),<strong>up</strong> today.<table border ="0" cellspacing="0" cellpadding="5"><tbody><tr><td align="left" valign="bottom" width="50%"><div><strong> ' + subject + '</strong></div><div style="color:#666666;">' + date + '</div><div><a href="javascript:void(0)" target="_blank" rel="noopener"><img style="width:250px;height:300px;object-fit:cover" src="' + image + '"/></a></div></td><td align="left" valign="bottom" width="50%"><div><strong> ' + subject1 + '</strong></div><div style="color:#666666;">' + date1 + '</div><div><a href="javascript:void(0)" target="_blank" rel="noopener"><img style="width:250px;height:300px;object-fit:cover" src="' + img + '"/></a></div></td></tr></tbody></table>'

                                                    //     break;
                                                    // }

                                                    // image = _imageURL + finalList[i].websiteList[j].mailList[p].emailDomain + "_" + finalList[i].websiteList[j].mailList[p].uid + ".png";
                                                    // subject = finalList[i].websiteList[j].mailList[p].header.subject[0];
                                                    // date = finalList[i].websiteList[j].mailList[p].header.date[0].split(" ")[0] + " " + finalList[i].websiteList[j].mailList[p].header.date[0].split(" ")[1] + " " + finalList[i].websiteList[j].mailList[p].header.date[0].split(" ")[2] + " " + finalList[i].websiteList[j].mailList[p].header.date[0].split(" ")[3];
                                                    // console.log("image :", image);
                                                }

                                                // finalList[i].websiteList[j].mailList.forEach((value) => {
                                                //     image = _imageURL + value.emailDomain + "_" + value.uid + ".png";
                                                //     subject = value.header.subject[0];
                                                //     date = value.header.date[0].split(" ")[0] + " " + value.header.date[0].split(" ")[1] + " " + value.header.date[0].split(" ")[2] + " " + value.header.date[0].split(" ")[3];
                                                // });
                                                // appendHtml = appendHtml + '<hr><div style="float:right;"><h1><a style="background-color:#2196f3;border-radius:2px;color:#ffffff;display:inline-block;font-family:sans-serif;font-size:13px;font-weight:bold;line-height:40px;text-align:center;text-decoration:none;width:200px;"href="http://178.128.176.48:3000/inbox?selectedWebsiteId=' + finalList[i].websiteList[j].websiteInfo._id + '&startDate=' + toDaysDate1 + '"target="_blank"rel="noopener">VIEW ALL' + finalList[i].websiteList[j].mailList.length + 'EMAILS</a></div><h1 style="margin-top:0.5em;"><a href="https://www.google.com/"target="_blank"rel="noopener">' + finalList[i].websiteList[j].websiteInfo.website_name + '</a></h1><p>' + finalList[i].websiteList[j].websiteInfo.website_name + 'sent<strong>' + finalList[i].websiteList[j].mailList.length + '</strong>emails,<strong>up</strong>today.<div>&nbsp;</div><table border ="0" cellspacing="0" cellpadding="5"><tbody><tr><td align="left" valign="bottom" width="50%"><div>&nbsp;</div><div><strong>The RFP Response Formula That Gets an 80 % Close Rate</strong></div><div style="color:#666666;">Friday 27 July 2018 at 19:16</div><div>&nbsp;</div><div><a href="javascript:void(0)" target="_blank" rel="noopener"><img src="' + image + '"/></a></div></td><td align="left" valign="bottom" width="50%"><div>&nbsp;</div><div><strong>Presentation endings that pop</strong></div><div style="color:#666666;">Friday 27 July 2018 at 18:40</div><div>&nbsp;</div><div><a href="https://click.pstmrk.it/2s/www.owletter.com%2Fdashboard%2Fnewsletters%2F303685/-5215QE/bfo_/-xM1X9yFdW" target ="_blank" rel="noopener"><img class="CToWUd" style="max-width:250px;" src="' + image + '"/></a></div></td></tr></tbody></table>'


                                                // appendHtml = appendHtml + '<hr><div style="float:right;"><h1><a style="border-radius:2px;background:#2196f3;color:#fff;display:inline-block;font-family:sans-serif;font-size:13px;font-weight:bold;line-height:40px;text-align:center;text-decoration:none;width:200px;" href="http://178.128.176.48:3000/inbox" target="_blank"rel="noopener"> VIEW ALL ' + finalList[i].websiteList[j].mailList.length + ' EMAIL(S)</a></h1></div><h1 style="margin-top:0.5em;"><a style=color:#2196f3; href="http://178.128.176.48:3000/inbox" target="_blank"rel="noopener">' + finalList[i].websiteList[j].websiteInfo.website_name + '</a></h1><p>' + finalList[i].websiteList[j].websiteInfo.website_name + 'sent <strong>' + finalList[i].websiteList[j].mailList.length + '</strong> email(s),<strong>up</strong> today.<table border ="0" cellspacing="0" cellpadding="5"><tbody><tr><td align="left" valign="bottom" width="50%"><div><strong> ' + subject + '</strong></div><div style="color:#666666;">' + date + '</div><div><a href="javascript:void(0)" target="_blank" rel="noopener"><img style="width:250px;height:300px;object-fit:cover" src="' + image + '"/></a></div></td><td align="left" valign="bottom" width="50%"><div><strong> ' + subject1 + '</strong></div><div style="color:#666666;">' + date1 + '</div><div><a href="javascript:void(0)" target="_blank" rel="noopener"><img style="width:250px;height:300px;object-fit:cover" src="' + img + '"/></a></div></td></tr></tbody></table>'


                                                appendHtml = appendHtml + appendHtmlOne;
                                            } else {
                                                // appendHtml = appendHtml + '<hr><strong><a href="javascript:void(0)" style=color:#2196f3> ' + finalList[i].websiteList[j].websiteInfo.website_name + '</strong></a><p>Looks like <strong>' + finalList[i].websiteList[j].websiteInfo.website_name + '</strong>didnot send any newsletters in ' + toDaysDate1 + '. </p><p>Please make sure you have signed up to their email newsletters using the email <u><a href="mailto:' + finalList[i].websiteList[j].websiteInfo.emailDomain + '"target="_blank"> ' + finalList[i].websiteList[j].websiteInfo.emailDomain + '<wbr>com</a></u> '

                                                appendHtml = appendHtml + '<hr><h1><a href="http://178.128.176.48:3000/inbox" style=color:#2196f3;cursor:pointer;> ' + finalList[i].websiteList[j].websiteInfo.website_name + '</h1></a><p>Looks like <strong>' + finalList[i].websiteList[j].websiteInfo.website_name + '</strong> did not send any newsletters in ' + toDaysDate1 + '. </p><p>Please make sure you have signed up to their email newsletters using the email <u><a href="mailto:' + finalList[i].websiteList[j].websiteInfo.emailDomain + '"target="_blank"> ' + finalList[i].websiteList[j].websiteInfo.emailDomain + '<wbr>com</a></u> '
                                            }
                                        }
                                        var replacements = {
                                            TODAYSDATE: toDaysDate1,
                                            WEBSITESLIST: appendHtml,
                                            TOTALMAILCOUNT: TOTALMAILCOUNT,
                                            websiteLink: website_url
                                        };
                                        var htmlToSend = template(replacements);
                                        var html1 = htmlToSend.replace(new RegExp("&lt;", 'g'), "<").replace(new RegExp("&gt;", 'g'), ">").replace(new RegExp("&amp;", 'g'), "").replace(new RegExp("&#x3D;", 'g'), "=").replace(new RegExp("&quot;", 'g'), "'");
                                        // console.log("html1 :", html1);

                                        // const htmlToSend1 = decode(htmlToSend);
                                        // console.log("htmlToSend1 :", htmlToSend1);
                                        var mailOptions = {
                                            from: 'no-reply@catchletter.com',
                                            // to: "pragati@natitsolved.com",
                                            to: "subhajit.nag@natitsolved.com",
                                            subject: "Email activity report for " + toDaysDate1,
                                            html: html1
                                        };
                                        transporter.sendMail(mailOptions, function (error, info) {
                                            if (error) {} else {
                                                console.log('Email sent: ' + info.response);
                                                resolve()
                                            }
                                        });
                                    });
                                });
                            }


                        }
                        res.status(200).json({
                            status: true,
                            message: finalList
                        })
                    })();

                })();

            } else {
                res.status(500).json({
                    success: false,
                    data: 'No report data found.'
                });
            }
        }
    })
    // customerCollection.find({
    //     report_type: "daily"
    // }).toArray(function (err, dailyCustomers) {
    //     if (err) {
    //         res.status(500).json({
    //             success: false,
    //             data: err
    //         });
    //     } else {
    //         if (dailyCustomers.length > 0) {
    //             let toFindUserIds = [];
    //             dailyCustomers.map((item) => {
    //                 toFindUserIds.push(item._id)
    //             });

    //             //    websiteCollection.find({
    //             //        user_id:{
    //             //            $in:toFindUserIds
    //             //        }
    //             //    }).toArray(function(err3, res1){
    //             //        if(err3)
    //             //        {
    //             //            res.status(500).json({
    //             //                success: false,
    //             //                data: err3
    //             //            });
    //             //        }
    //             //        else
    //             //        {
    //             //            mailImagesCollection.aggregate(
    //             //                [{
    //             //                    $group: {
    //             //                        _id: "$website_id",
    //             //                        reportsMail: {
    //             //                            $push: {
    //             //                                _id: "$_id",
    //             //                                emailDomain:"$emailDomain",
    //             //                                unique_id: "$unique_id",
    //             //                                user_id:"$user_id",
    //             //                                uid:"$uid",
    //             //                                tags:"$tags",
    //             //                                header:"$header",
    //             //                                isRead:"$isRead",
    //             //                                flag:"$flag"
    //             //                            }
    //             //                        }
    //             //                    }
    //             //                }]
    //             //            ).toArray(function(err3, res3){
    //             //                if(err3)
    //             //                {
    //             //                     res.status(500).json({
    //             //                         success: false,
    //             //                         data: err3
    //             //                     });
    //             //                }
    //             //                else
    //             //                {
    //             //                    let finalMails=[];
    //             //                    for(let i=0;i<res3.length;i++)
    //             //                    {
    //             //                       for (let j = 0; j < res3[i].reportsMail.length;j++)
    //             //                       {
    //             //                             let toCompareDate = res3[i].reportsMail[j].header.date[0].split(" ")[0] + res3[i].reportsMail[j].header.date[0].split(" ")[1] + res3[i].reportsMail[j].header.date[0].split(" ")[2] + res3[i].reportsMail[j].header.date[0].split(" ")[3];
    //             //                             if(toCompareDate==toDaysDate)
    //             //                             {
    //             //                                 finalMails.push(res3[i].reportsMail)
    //             //                             }


    //             //                       }
    //             //                    }
    //             //                     res.status(200).json({
    //             //                         success: false,
    //             //                         data: {
    //             //                             message: res3,
    //             //                             toDaysDate: toDaysDate
    //             //                         }
    //             //                     });
    //             //                }
    //             //            })

    //             //        }
    //             //    })
    //         } else {
    //             const toDaysName1 = toDaysName.toLowerCase();
    //             customerCollection.find({
    //                 report_type: "weekly",
    //                 report_day: toDaysName1
    //             }).toArray(function (err2, weeklyCustomersLength) {
    //                 if (err2) {
    //                     res.status(500).json({
    //                         success: false,
    //                         data: err2
    //                     });
    //                 } else {
    //                     if (weeklyCustomersLength.length > 0) {

    //                     } else {
    //                         res.status(403).json({
    //                             success: false,
    //                             data: {
    //                                 message: "No records found."
    //                             }
    //                         })
    //                     }
    //                 }
    //             })
    //         }
    //     }
    // })



}

// reportsController.sendReportsToAllUsers = (req, res) => {
//     const customerCollection = db.get().collection('customer');
//     const websiteCollection = db.get().collection('websites');
//     const mailImagesCollection = db.get().collection('mailImages');
//     const toDaysName = getDayName(new Date().getDay());
//     const toDaysMonthName = getMonthName(new Date().getMonth() + 1);
//     const toDaysDate = toDaysName + ", " + new Date().getDate() + " " + toDaysMonthName + " " + new Date().getFullYear();
//     let toFindWebsites = [];

//     websiteCollection.aggregate([{
//         $lookup: {
//             from: "customer",
//             localField: "user_id",
//             foreignField: "_id",
//             as: "customer"
//         }
//     }, {
//         $match: {
//             "customer.report_type": "daily"
//         }
//     }]).toArray(function (err2, dailyCustomers) {
//         if (err2) {
//             res.status(500).json({
//                 success: false,
//                 data: err2
//             })
//         } else {
//             if (dailyCustomers.length > 0) {

//                 dailyCustomers.map((item) => {
//                     toFindWebsites.push(ObjectId(item._id));
//                 });
//                 mailImagesCollection.aggregate(
//                     [{
//                         $match: {
//                             website_id: {
//                                 $in: toFindWebsites
//                             }
//                         }
//                     }, {
//                         $group: {
//                             _id: "$website_id",
//                             reportsMail: {
//                                 $push: {
//                                     _id: "$_id",
//                                     emailDomain: "$emailDomain",
//                                     unique_id: "$unique_id",
//                                     user_id: "$user_id",
//                                     uid: "$uid",
//                                     tags: "$tags",
//                                     header: "$header",
//                                     isRead: "$isRead",
//                                     flag: "$flag",
//                                     website_id: "$website_id"
//                                 }
//                             }
//                         }
//                     }]
//                 ).toArray(function (err3, res3) {
//                     if (err3) {
//                         res.status(500).json({
//                             status: false,
//                             data: {
//                                 message: err3
//                             }
//                         })
//                     } else {
//                         let websitesListWithDate = [];
//                         for (let i = 0; i < res3.length; i++) {
//                             for (let j = 0; j < res3[i].reportsMail.length; j++) {
//                                 let toCompareDate = res3[i].reportsMail[j].header.date[0].split(" ")[0] + " " + res3[i].reportsMail[j].header.date[0].split(" ")[1] + " " + res3[i].reportsMail[j].header.date[0].split(" ")[2] + " " + res3[i].reportsMail[j].header.date[0].split(" ")[3];
//                                 // console.log("toCompareDate :", toCompareDate);
//                                 // console.log("toDaysDate :", toDaysDate);
//                                 if (toCompareDate === toDaysDate) {
//                                     websitesListWithDate.push(res3[i].reportsMail[j])
//                                 }
//                             }
//                         }

//                         var services = {};
//                         for (var i = 0; i < websitesListWithDate.length; i++) {
//                             var serviceId = websitesListWithDate[i].user_id;
//                             if (!services[serviceId]) {
//                                 services[serviceId] = [];
//                             }
//                             services[serviceId].push(websitesListWithDate[i]);
//                         }
//                         websitesListWithDate = [];
//                         let emailId;
//                         let toFindUserIds=[];


//                         (async function loop() {
//                             for (var groupName in services) {
//                                 await new Promise(resolve => {
//                                     // for (let i = 0; i < dailyCustomers.length; i++) {

//                                     //     if (dailyCustomers[i].customer) {
//                                     //         let custId = dailyCustomers[i].customer[0]._id.toString();
//                                     //         if (custId == groupName) {
//                                     //             emailId = dailyCustomers[i].customer[0].email;
//                                     //             break;
//                                     //         }

//                                     //     }
//                                     // }
//                                     // websitesListWithDate.push({
//                                     //     user_id: groupName,
//                                     //     mailList: services[groupName],
//                                     //     emailId: emailId
//                                     // });
//                                     websiteCollection.find({
//                                         user_id:ObjectId(groupName)
//                                     }).toArray(function(err, res1){


//                                     })

//                                 });


//                             }

//                         })();




//                         // res.status(200).json({
//                         //     status: true,
//                         //     data: {
//                         //         message: websitesListWithDate,
//                         //         dailyCustomers: dailyCustomers
//                         //     }
//                         // })
//                     }
//                 })

//             } else {

//             }
//         }
//     })
//     // customerCollection.find({
//     //     report_type: "daily"
//     // }).toArray(function (err, dailyCustomers) {
//     //     if (err) {
//     //         res.status(500).json({
//     //             success: false,
//     //             data: err
//     //         });
//     //     } else {
//     //         if (dailyCustomers.length > 0) {
//     //             let toFindUserIds = [];
//     //             dailyCustomers.map((item) => {
//     //                 toFindUserIds.push(item._id)
//     //             });

//     //             //    websiteCollection.find({
//     //             //        user_id:{
//     //             //            $in:toFindUserIds
//     //             //        }
//     //             //    }).toArray(function(err3, res1){
//     //             //        if(err3)
//     //             //        {
//     //             //            res.status(500).json({
//     //             //                success: false,
//     //             //                data: err3
//     //             //            });
//     //             //        }
//     //             //        else
//     //             //        {
//     //             //            mailImagesCollection.aggregate(
//     //             //                [{
//     //             //                    $group: {
//     //             //                        _id: "$website_id",
//     //             //                        reportsMail: {
//     //             //                            $push: {
//     //             //                                _id: "$_id",
//     //             //                                emailDomain:"$emailDomain",
//     //             //                                unique_id: "$unique_id",
//     //             //                                user_id:"$user_id",
//     //             //                                uid:"$uid",
//     //             //                                tags:"$tags",
//     //             //                                header:"$header",
//     //             //                                isRead:"$isRead",
//     //             //                                flag:"$flag"
//     //             //                            }
//     //             //                        }
//     //             //                    }
//     //             //                }]
//     //             //            ).toArray(function(err3, res3){
//     //             //                if(err3)
//     //             //                {
//     //             //                     res.status(500).json({
//     //             //                         success: false,
//     //             //                         data: err3
//     //             //                     });
//     //             //                }
//     //             //                else
//     //             //                {
//     //             //                    let finalMails=[];
//     //             //                    for(let i=0;i<res3.length;i++)
//     //             //                    {
//     //             //                       for (let j = 0; j < res3[i].reportsMail.length;j++)
//     //             //                       {
//     //             //                             let toCompareDate = res3[i].reportsMail[j].header.date[0].split(" ")[0] + res3[i].reportsMail[j].header.date[0].split(" ")[1] + res3[i].reportsMail[j].header.date[0].split(" ")[2] + res3[i].reportsMail[j].header.date[0].split(" ")[3];
//     //             //                             if(toCompareDate==toDaysDate)
//     //             //                             {
//     //             //                                 finalMails.push(res3[i].reportsMail)
//     //             //                             }


//     //             //                       }
//     //             //                    }
//     //             //                     res.status(200).json({
//     //             //                         success: false,
//     //             //                         data: {
//     //             //                             message: res3,
//     //             //                             toDaysDate: toDaysDate
//     //             //                         }
//     //             //                     });
//     //             //                }
//     //             //            })

//     //             //        }
//     //             //    })
//     //         } else {
//     //             const toDaysName1 = toDaysName.toLowerCase();
//     //             customerCollection.find({
//     //                 report_type: "weekly",
//     //                 report_day: toDaysName1
//     //             }).toArray(function (err2, weeklyCustomersLength) {
//     //                 if (err2) {
//     //                     res.status(500).json({
//     //                         success: false,
//     //                         data: err2
//     //                     });
//     //                 } else {
//     //                     if (weeklyCustomersLength.length > 0) {

//     //                     } else {
//     //                         res.status(403).json({
//     //                             success: false,
//     //                             data: {
//     //                                 message: "No records found."
//     //                             }
//     //                         })
//     //                     }
//     //                 }
//     //             })
//     //         }
//     //     }
//     // })



// }



// weekly report
// reportsController.sendReportsToAllUsersWeekly = (req, res) => {
//     console.log("hello");
//     const customerCollection = db.get().collection('customer');
//     const websiteCollection = db.get().collection('websites');
//     const mailImagesCollection = db.get().collection('mailImages');

//     /** calculate todays date */
//     const toDaysName = getDayName(new Date().getDay());
//     const toDaysMonthName = getMonthName(new Date().getMonth() + 1);
//     const todaysDate = new Date().getDate() < 10 ? ("0" + new Date().getDate()) : new Date().getDate();
//     // const toDaysDate1 = toDaysName + ", " + todaysDate + " " + toDaysMonthName + " " + new Date().getFullYear();
//     const toDaysDate1 = todaysDate + " " + toDaysMonthName + " " + new Date().getFullYear();

//     /** calculate previous 7 days date */
//     // const previousSevenDaysDate = getDayName1(new Date(new Date().setDate(new Date().getDate() - 6)).getDay()) + ", " + new Date(new Date().setDate(new Date().getDate() - 6)).getDate() < 10 ? ("0" + new Date(new Date().setDate(new Date().getDate() - 6)).getDate()) : new Date(new Date().setDate(new Date().getDate() - 6)).getDate() + " " + getMonthName(new Date(new Date().setDate(new Date().getDate() - 6)).getMonth() + 1) + " " + new Date(new Date().setDate(new Date().getDate() - 6)).getFullYear();
//     const previousSevenDaysDate = new Date(new Date().setDate(new Date().getDate() - 6)).getDate() < 10 ? ("0" + new Date(new Date().setDate(new Date().getDate() - 6)).getDate()) : new Date(new Date().setDate(new Date().getDate() - 6)).getDate() + " " + getMonthName(new Date(new Date().setDate(new Date().getDate() - 6)).getMonth() + 1) + " " + new Date(new Date().setDate(new Date().getDate() - 6)).getFullYear();

//     let toFindWebsites = [];
//     customerCollection.aggregate([{
//         $lookup: {
//             from: "websites",
//             localField: "_id",
//             foreignField: "user_id",
//             as: "websitesList"
//         }
//     }, {
//         $match: {
//             "report_type": "weekly",
//             "report_day": toDaysName
//         }
//     }]).toArray(function (err2, dailyCustomers) {
//         if (err2) {
//             res.status(500).json({
//                 success: false,
//                 data: err2
//             });
//         } else {
//             let data1;
//             let data;
//             if (dailyCustomers.length > 0) {
//                 let finalList = [];
//                 (async function loop() {
//                     for (let i = 0; i < dailyCustomers.length; i++) {
//                         data = {
//                             first_name: dailyCustomers[i].first_name,
//                             email: dailyCustomers[i].email,
//                             websiteList: []
//                         }
//                         await new Promise(resolve => {
//                             (async function loop1() {
//                                 for (let j = 0; j < dailyCustomers[i].websitesList.length; j++) {
//                                     data1 = {};
//                                     data1 = {
//                                         websiteInfo: dailyCustomers[i].websitesList[j],
//                                         mailList: []
//                                     };
//                                     await new Promise(resolve1 => {
//                                         mailImagesCollection.find({
//                                             website_id: ObjectId(dailyCustomers[i].websitesList[j]._id)
//                                         }).toArray(function (err3, res3) {

//                                             for (let k = 0; k < res3.length; k++) {
//                                                 let toCompareDate = res3[k].header.date[0].split(" ")[1] + " " + res3[k].header.date[0].split(" ")[2] + " " + res3[k].header.date[0].split(" ")[3];

//                                                 // console.log("toCompareDate :", toCompareDate);
//                                                 // console.log("previousSevenDaysDate :", previousSevenDaysDate);
//                                                 // console.log("toDaysDate1 :", toDaysDate1);


//                                                 if (new Date(toCompareDate) > new Date(previousSevenDaysDate) && new Date(toCompareDate) < new Date(toDaysDate1)) {
//                                                     data1.mailList.push(res3[k]);
//                                                 }
//                                             }

//                                             data.websiteList.push(data1);
//                                             resolve1()
//                                         });

//                                     });
//                                 }
//                                 resolve()
//                             })();
//                         });
//                         finalList.push(data)

//                     }
//                     let appendHtml;
//                     let appendHtmlOne;
//                     let image;
//                     let img;
//                     let subject;
//                     let subject1;
//                     let date;
//                     let date1;
//                     let TOTALMAILCOUNT=0;
//                     let p_Max = [];
//                     let p_Value;
//                     (async function sendEmailForEachCustomer() {
//                         for (let i = 0; i < finalList.length; i++) {
//                             TOTALMAILCOUNT=0;
//                             appendHtml = "";
//                             appendHtmlOne = "";
//                             if (finalList[i].websiteList.length > 0) {
//                                 await new Promise(resolve => {
//                                     const filePath = path.join(__dirname, '..', 'emailTemplates', 'reportEmail.html');
//                                     readHTMLFile(filePath, function (err, html) {
//                                         var template = handlebars.compile(html);
//                                         let websitesListToAppend = [];
//                                         // let appendHtml = '<hr> <div> &nbsp; </div> <a href ="javascript:void(0)"> Myntra </a><p> Looks like Myntra didnot send any newsletters in Mon, 23 Jul 15:32 to Mon, 30 Jul 15:30.</p> <p >Please make sure you have signed up to their email newsletters using the email <u><a href="mailto:myntracom3621@email.owletter.com" target="_blank">myntracom3621@email.owletter.<wbr>com</a></u>'

//                                         for (let j = 0; j < finalList[i].websiteList.length; j++) {
//                                             if (finalList[i].websiteList[j].mailList.length > 0) {
//                                                 TOTALMAILCOUNT = TOTALMAILCOUNT+1;

//                                                // TOTALMAILCOUNT = finalList[i].websiteList[j].mailList.length;

//                                                 for (let p = 0; p < finalList[i].websiteList[j].mailList.length; p++) {
//                                                     // p_Max.push(p);
//                                                     // p_Value = p;

//                                                     if (p == 1) {
//                                                         image = _imageURL + finalList[i].websiteList[j].mailList[0].emailDomain + "_" + finalList[i].websiteList[j].mailList[0].uid + ".png";
//                                                         img = _imageURL + finalList[i].websiteList[j].mailList[1].emailDomain + "_" + finalList[i].websiteList[j].mailList[1].uid + ".png";

//                                                         subject = finalList[i].websiteList[j].mailList[0].header.subject[0];
//                                                         subject1 = finalList[i].websiteList[j].mailList[1].header.subject[0];

//                                                         date = finalList[i].websiteList[j].mailList[0].header.date[0].split(" ")[0] + " " + finalList[i].websiteList[j].mailList[0].header.date[0].split(" ")[1] + " " + finalList[i].websiteList[j].mailList[0].header.date[0].split(" ")[2] + " " + finalList[i].websiteList[j].mailList[0].header.date[0].split(" ")[3];
//                                                         date1 = finalList[i].websiteList[j].mailList[1].header.date[0].split(" ")[0] + " " + finalList[i].websiteList[j].mailList[1].header.date[0].split(" ")[1] + " " + finalList[i].websiteList[j].mailList[1].header.date[0].split(" ")[2] + " " + finalList[i].websiteList[j].mailList[1].header.date[0].split(" ")[3];

//                                                         appendHtmlOne = appendHtmlOne = '<hr><div style="float:right;"><h1><a style="border-radius:2px;background:#2196f3;color:#fff;display:inline-block;font-family:sans-serif;font-size:13px;font-weight:bold;line-height:40px;text-align:center;text-decoration:none;width:200px;" href="http://178.128.176.48:3000/inbox" target="_blank"rel="noopener"> VIEW ALL ' + finalList[i].websiteList[j].mailList.length + ' EMAIL(S)</a></h1></div><h1 style="margin-top:0.5em;"><a style=color:#2196f3; href="http://178.128.176.48:3000/inbox" target="_blank"rel="noopener">' + finalList[i].websiteList[j].websiteInfo.website_name + '</a></h1><p>' + finalList[i].websiteList[j].websiteInfo.website_name + ' sent <strong>' + finalList[i].websiteList[j].mailList.length + '</strong> email(s),<strong>up</strong> today.<table border ="0" cellspacing="0" cellpadding="5"><tbody><tr><td align="left" valign="bottom" width="50%"><div><strong> ' + subject + '</strong></div><div style="color:#666666;">' + date + '</div><div><a href="javascript:void(0)" target="_blank" rel="noopener"><img style="width:250px;height:300px;object-fit:cover" src="' + image + '"/></a></div></td><td align="left" valign="bottom" width="50%"><div><strong> ' + subject1 + '</strong></div><div style="color:#666666;">' + date1 + '</div><div><a href="javascript:void(0)" target="_blank" rel="noopener"><img style="width:250px;height:300px;object-fit:cover" src="' + img + '"/></a></div></td></tr></tbody></table>'

//                                                         break;
//                                                     }


//                                                 }

//                                                 appendHtml = appendHtml + appendHtmlOne;


//                                                 // appendHtml = appendHtml + '<hr><div style="float:right;"><h1><a style="border-radius:2px;background:#2196f3;color:#fff;display:inline-block;font-family:sans-serif;font-size:13px;font-weight:bold;line-height:40px;text-align:center;text-decoration:none;width:200px;" href="http://178.128.176.48:3000/inbox" target="_blank"rel="noopener"> VIEW ALL ' + finalList[i].websiteList[j].mailList.length + ' EMAIL(S)</a></h1></div><h1 style="margin-top:0.5em;"><a style=color:#2196f3; href="http://178.128.176.48:3000/inbox" target="_blank"rel="noopener">' + finalList[i].websiteList[j].websiteInfo.website_name + '</a></h1><p>' + finalList[i].websiteList[j].websiteInfo.website_name + 'sent <strong>' + finalList[i].websiteList[j].mailList.length + '</strong> email(s),<strong>up</strong> today.<table border ="0" cellspacing="0" cellpadding="5"><tbody><tr><td align="left" valign="bottom" width="50%"><div><strong> ' + subject + '</strong></div><div style="color:#666666;">' + date + '</div><div><a href="javascript:void(0)" target="_blank" rel="noopener"><img style="width:250px;height:300px;object-fit:cover" src="' + image + '"/></a></div></td><td align="left" valign="bottom" width="50%"><div><strong> ' + subject1 + '</strong></div><div style="color:#666666;">' + date1 + '</div><div><a href="javascript:void(0)" target="_blank" rel="noopener"><img style="width:250px;height:300px;object-fit:cover" src="' + img + '"/></a></div></td></tr></tbody></table>'
//                                                 // appendHtml = appendHtml + '<div>&nbsp;</div><hr><div>&nbsp;</div><div style="float:right;"><h1><a style="background-color:#2196f3;border-radius:2px;color:#ffffff;display:inline-block;font-family:sans-serif;font-size:13px;font-weight:bold;line-height:40px;text-align:center;text-decoration:none;width:200px;"href="http://178.128.176.48:3000/inbox?selectedWebsiteId=' + finalList[i].websiteList[j].websiteInfo._id + '&startDate=' + toDaysDate1 + '"target="_blank"rel="noopener">VIEW ALL' + finalList[i].websiteList[j].mailList.length + 'EMAILS</a></div><h1 style="margin-top:0.5em;"><a href="https://www.google.com/"target="_blank"rel="noopener">' + finalList[i].websiteList[j].websiteInfo.website_name + '</a></h1><p>' + finalList[i].websiteList[j].websiteInfo.website_name + 'sent<strong>' + finalList[i].websiteList[j].mailList.length + '</strong>emails,<strong>up</strong>today.<div>&nbsp;</div><table border ="0" cellspacing="0" cellpadding="5"><tbody><tr><td align="left" valign="bottom" width="50%"><div>&nbsp;</div><div><strong>The RFP Response Formula That Gets an 80 % Close Rate</strong></div><div style="color:#666666;">Friday 27 July 2018 at 19:16</div><div>&nbsp;</div><div><a href="javascript:void(0)" target="_blank" rel="noopener"><img src="http://178.128.176.48:7000/resources/screenshots_subhajitmyntra12736067@catchletter.com_20.png"/></a></div></td><td align="left" valign="bottom" width="50%"><div>&nbsp;</div><div><strong>Presentation endings that pop</strong></div><div style="color:#666666;">Friday 27 July 2018 at 18:40</div><div>&nbsp;</div><div><a href="https://click.pstmrk.it/2s/www.owletter.com%2Fdashboard%2Fnewsletters%2F303685/-5215QE/bfo_/-xM1X9yFdW" target ="_blank" rel="noopener"><img class="CToWUd" style="max-width:250px;" src="http://178.128.176.48:7000/resources/screenshots_subhajitmyntra12736067@catchletter.com_20.png"/></a></div></td></tr></tbody></table>'
//                                             } else {
//                                                 appendHtml = appendHtml + '<hr><h1><a href="http://178.128.176.48:3000/inbox" style=color:#2196f3;cursor:pointer;> ' + finalList[i].websiteList[j].websiteInfo.website_name + '</h1></a><p>Looks like <strong>' + finalList[i].websiteList[j].websiteInfo.website_name + '</strong> didnot send any newsletters in ' + toDaysDate1 + '. </p><p>Please make sure you have signed up to their email newsletters using the email <u><a href="mailto:' + finalList[i].websiteList[j].websiteInfo.emailDomain + '"target="_blank"> ' + finalList[i].websiteList[j].websiteInfo.emailDomain + '<wbr>com</a></u> '
//                                                 // appendHtml = appendHtml + '<hr><div>&nbsp;</div><strong><a href="javascript:void(0)" style="color:red;"> ' + finalList[i].websiteList[j].websiteInfo.website_name + '</strong></a><p>Looks like <strong>' + finalList[i].websiteList[j].websiteInfo.website_name + '</strong>didnot send any newsletters in ' + toDaysDate1 + '. </p><p>Please make sure you have signed up to their email newsletters using the email <u><a href="mailto:' + finalList[i].websiteList[j].websiteInfo.emailDomain + '"target="_blank"> ' + finalList[i].websiteList[j].websiteInfo.emailDomain + '<wbr>com</a></u> '
//                                             }
//                                         }
//                                         console.log(TOTALMAILCOUNT, "TOTALMAILCOUNT");
//                                         var replacements = {
//                                             TODAYSDATE: previousSevenDaysDate + ' to ' + toDaysDate1,
//                                             WEBSITESLIST: appendHtml,
//                                             TOTALMAILCOUNT: TOTALMAILCOUNT
//                                         };
//                                         var htmlToSend = template(replacements);
//                                         // console.log("htmlToSend :", htmlToSend);
//                                         var htmlToSend = template(replacements);
//                                         var html1 = htmlToSend.replace(new RegExp("&lt;", 'g'), "<").replace(new RegExp("&gt;", 'g'), ">").replace(new RegExp("&amp;", 'g'), "").replace(new RegExp("&#x3D;", 'g'), "=").replace(new RegExp("&quot;", 'g'), "'");
//                                           console.log("finalList[i].email", finalList[i].email)
//                                         var mailOptions = {
//                                             from: 'no-reply@catchletter.com',
//                                             // to: "pragati@natitsolved.com",
//                                             to: finalList[i].email,
//                                             // subject: "Email activity report_" + i,
//                                             subject: "Email activity report for " + previousSevenDaysDate + " to " + toDaysDate1,
//                                             html: html1
//                                         };
//                                         transporter.sendMail(mailOptions, function (error, info) {
//                                             if (error) { } else {
//                                                 console.log('Email sent: ' + info.response);
//                                                 resolve()
//                                             }
//                                         });
//                                     });
//                                 });
//                             }
//                         }
//                         res.status(200).json({
//                             status: true,
//                             message: finalList
//                         })
//                     })();
//                 })();

//             } else {
//                 res.status(500).json({
//                     success: false,
//                     data: 'No report data found.'
//                 });
//             }
//         }
//     });
// }


function getMonthNo(monthName) {
    let monthNo;
    switch (monthName) {
        case "Jan":
            monthNo = "01";
            break;
        case "Feb":
            monthNo = "02";
            break;
        case "Mar":
            monthNo = "03";
            break;
        case "Apr":
            monthNo = "04";
            break;
        case "May":
            monthNo = "05";
            break;
        case "Jun":
            monthNo = "06";
            break;
        case "Jul":
            monthNo = "07";
            break;
        case "Aug":
            monthNo = "08";
            break;
        case "Sept":
            monthNo = "09";
            break;
        case "Oct":
            monthNo = "10";
            break;
        case "Nov":
            monthNo = "11";
            break;
        case "Dec":
            monthNo = "12";
            break;

        default:
            break;
    }
    return monthNo;
}

reportsController.sendReportsToAllUsersWeekly = (req, res) => {
    console.log("hello");
    const customerCollection = db.get().collection('customer');
    const websiteCollection = db.get().collection('websites');
    const mailImagesCollection = db.get().collection('mailImages');

    /** calculate todays date */
    const toDaysName = getDayName(new Date().getDay());
    const toDaysMonthName = getMonthName(new Date().getMonth() + 1);
    const todaysDate = new Date().getDate() < 10 ? ("0" + new Date().getDate()) : new Date().getDate();
    // const toDaysDate1 = toDaysName + ", " + todaysDate + " " + toDaysMonthName + " " + new Date().getFullYear();
    const toDaysDate1 = todaysDate + " " + toDaysMonthName + " " + new Date().getFullYear();

    /** calculate previous 7 days date */
    // const previousSevenDaysDate = getDayName1(new Date(new Date().setDate(new Date().getDate() - 6)).getDay()) + ", " + new Date(new Date().setDate(new Date().getDate() - 6)).getDate() < 10 ? ("0" + new Date(new Date().setDate(new Date().getDate() - 6)).getDate()) : new Date(new Date().setDate(new Date().getDate() - 6)).getDate() + " " + getMonthName(new Date(new Date().setDate(new Date().getDate() - 6)).getMonth() + 1) + " " + new Date(new Date().setDate(new Date().getDate() - 6)).getFullYear();
    const previousSevenDaysDate = new Date(new Date().setDate(new Date().getDate() - 6)).getDate() < 10 ? ("0" + new Date(new Date().setDate(new Date().getDate() - 6)).getDate()) : new Date(new Date().setDate(new Date().getDate() - 6)).getDate() + " " + getMonthName(new Date(new Date().setDate(new Date().getDate() - 6)).getMonth() + 1) + " " + new Date(new Date().setDate(new Date().getDate() - 6)).getFullYear();
    const previousSevenDaysDateFormatted = previousSevenDaysDate.split(" ")[0] + "/" + getMonthNo(previousSevenDaysDate.split(" ")[1]) + "/" + previousSevenDaysDate.split(" ")[2]
    const toDaysDate1Formatted = toDaysDate1.split(" ")[0] + "/" + getMonthNo(toDaysDate1.split(" ")[1]) + "/" + toDaysDate1.split(" ")[2]


    let toFindWebsites = [];
    customerCollection.aggregate([{
        $lookup: {
            from: "websites",
            localField: "_id",
            foreignField: "user_id",
            as: "websitesList"
        }
    }, {
        $match: {
            "report_type": "weekly",
            "report_day": toDaysName
        }
    }]).toArray(function (err2, dailyCustomers) {
        if (err2) {
            res.status(500).json({
                success: false,
                data: err2
            });
        } else {
            let data1;
            let data;
            if (dailyCustomers.length > 0) {
                let finalList = [];
                (async function loop() {
                    for (let i = 0; i < dailyCustomers.length; i++) {
                        data = {
                            first_name: dailyCustomers[i].first_name,
                            email: dailyCustomers[i].email,
                            userId: dailyCustomers[i]._id,
                            websiteList: []
                        }
                        await new Promise(resolve => {
                            (async function loop1() {
                                for (let j = 0; j < dailyCustomers[i].websitesList.length; j++) {
                                    data1 = {};
                                    data1 = {
                                        websiteInfo: dailyCustomers[i].websitesList[j],
                                        mailList: []
                                    };
                                    await new Promise(resolve1 => {
                                        mailImagesCollection.find({
                                            website_id: ObjectId(dailyCustomers[i].websitesList[j]._id)
                                        }).toArray(function (err3, res3) {

                                            for (let k = 0; k < res3.length; k++) {
                                                let toCompareDate = res3[k].header.date[0].split(" ")[1] + " " + res3[k].header.date[0].split(" ")[2] + " " + res3[k].header.date[0].split(" ")[3];

                                                // console.log("toCompareDate :", toCompareDate);
                                                // console.log("previousSevenDaysDate :", previousSevenDaysDate);
                                                // console.log("toDaysDate1 :", toDaysDate1);


                                                if (new Date(toCompareDate) > new Date(previousSevenDaysDate) && new Date(toCompareDate) < new Date(toDaysDate1)) {
                                                    data1.mailList.push(res3[k]);
                                                }
                                            }

                                            data.websiteList.push(data1);
                                            resolve1()
                                        });

                                    });
                                }
                                resolve()
                            })();
                        });
                        finalList.push(data)

                    }
                    let appendHtml;
                    let appendHtmlOne;
                    let image;
                    let img;
                    let subject;
                    let subject1;
                    let date;
                    let date1;
                    let TOTALMAILCOUNT = 0;
                    let p_Max = [];
                    let p_Value;
                    (async function sendEmailForEachCustomer() {
                        for (let i = 0; i < finalList.length; i++) {
                            appendHtml = "";
                            appendHtmlOne = "";
                            if (finalList[i].websiteList.length > 0) {
                                TOTALMAILCOUNT = 0;
                                await new Promise(resolve => {
                                    const filePath = path.join(__dirname, '..', 'emailTemplates', 'reportEmail.html');
                                    readHTMLFile(filePath, function (err, html) {
                                        var template = handlebars.compile(html);
                                        let websitesListToAppend = [];
                                        // let appendHtml = '<hr> <div> &nbsp; </div> <a href ="javascript:void(0)"> Myntra </a><p> Looks like Myntra didnot send any newsletters in Mon, 23 Jul 15:32 to Mon, 30 Jul 15:30.</p> <p >Please make sure you have signed up to their email newsletters using the email <u><a href="mailto:myntracom3621@email.owletter.com" target="_blank">myntracom3621@email.owletter.<wbr>com</a></u>'

                                        for (let j = 0; j < finalList[i].websiteList.length; j++) {
                                            console.log(TOTALMAILCOUNT, "TotalMailCount")
                                            if (finalList[i].websiteList[j].mailList.length > 0) {

                                                //TOTALMAILCOUNT = finalList[i].websiteList[j].mailList.length;
                                                TOTALMAILCOUNT = TOTALMAILCOUNT + 1;

                                                for (let p = 0; p < finalList[i].websiteList[j].mailList.length; p++) {
                                                    // p_Max.push(p);
                                                    // p_Value = p;

                                                    if (p == 1) {
                                                        image = _imageURL + finalList[i].websiteList[j].mailList[0].emailDomain + "_" + finalList[i].websiteList[j].mailList[0].uid + ".png";
                                                        img = _imageURL + finalList[i].websiteList[j].mailList[1].emailDomain + "_" + finalList[i].websiteList[j].mailList[1].uid + ".png";

                                                        subject = finalList[i].websiteList[j].mailList[0].header.subject[0];
                                                        subject1 = finalList[i].websiteList[j].mailList[1].header.subject[0];

                                                        date = finalList[i].websiteList[j].mailList[0].header.date[0].split(" ")[0] + " " + finalList[i].websiteList[j].mailList[0].header.date[0].split(" ")[1] + " " + finalList[i].websiteList[j].mailList[0].header.date[0].split(" ")[2] + " " + finalList[i].websiteList[j].mailList[0].header.date[0].split(" ")[3];
                                                        date1 = finalList[i].websiteList[j].mailList[1].header.date[0].split(" ")[0] + " " + finalList[i].websiteList[j].mailList[1].header.date[0].split(" ")[1] + " " + finalList[i].websiteList[j].mailList[1].header.date[0].split(" ")[2] + " " + finalList[i].websiteList[j].mailList[1].header.date[0].split(" ")[3];
                                                        let userId = finalList[i].userId.toString();
                                                        var buff = new Buffer(userId);
                                                        var base64dataForUserId = buff.toString('base64');
                                                        let websiteId = finalList[i].websiteList[j].websiteInfo._id.toString();
                                                        var buff1 = new Buffer(websiteId);
                                                        var base64dataForWebsiteId = buff1.toString('base64');
                                                        // appendHtmlOne = appendHtmlOne = '<hr><div style="float:right;"><h1><a style="border-radius:2px;background:#2196f3;color:#fff;display:inline-block;font-family:sans-serif;font-size:13px;font-weight:bold;line-height:40px;text-align:center;text-decoration:none;width:200px;" href="https://app.catchletter.com/inbox?userId=' + base64dataForUserId + '&websiteId=' + base64dataForWebsiteId + '&fromDate=' + previousSevenDaysDateFormatted + '&endDate=' + toDaysDate1Formatted + '&websiteName=' + finalList[i].websiteList[j].websiteInfo.website_name + '"target="_blank"rel="noopener"> VIEW ALL ' + finalList[i].websiteList[j].mailList.length + ' EMAIL(S)</a></h1></div><h1 style="margin-top:0.5em;"><a style=color:#2196f3; href="http://178.128.176.48:3000/inbox" target="_blank"rel="noopener">' + finalList[i].websiteList[j].websiteInfo.website_name + '</a></h1><p>' + finalList[i].websiteList[j].websiteInfo.website_name + ' sent <strong>' + finalList[i].websiteList[j].mailList.length + '</strong> email(s),<strong>up</strong> today.<table border ="0" cellspacing="0" cellpadding="5"><tbody><tr><td align="left" valign="bottom" width="50%"><div><strong> ' + subject + '</strong></div><div style="color:#666666;">' + date + '</div><div><a href="javascript:void(0)" target="_blank" rel="noopener"><img style="width:250px;height:300px;object-fit:cover" src="' + image + '"/></a></div></td><td align="left" valign="bottom" width="50%"><div><strong> ' + subject1 + '</strong></div><div style="color:#666666;">' + date1 + '</div><div><a href="javascript:void(0)" target="_blank" rel="noopener"><img style="width:250px;height:300px;object-fit:cover" src="' + img + '"/></a></div></td></tr></tbody></table>'
                                                        appendHtmlOne = '<repeater> <layout label = "OUR ENVIRONMENT STARTS"><table align = "center"bgcolor = "#ebebeb"border = "0"cellpadding = "0"cellspacing = "0"width = "100%"><tr><td align = "center"><table align = "center"border = "0"cellpadding = "0"cellspacing = "0"width = "100%"><tr><td align = "center"style = "padding:0 30px;"><table align = "center"border = "0"class = "display-width"cellpadding = "0"cellspacing = "0"width = "640"><tr><td height = "30"> </td> </tr><tr><td align = "center"><table align = "center"border = "0"cellpadding = "0"cellspacing = "0"style = "width:auto !important;"><tr><td align = "center"style = "color:#666666;"><img src = "http://guiwidgets.com/demo/perfect/img/50x4x1.png"alt = "50x4x1"width = "50"height = "4"style = "margin:0; border:0; padding:0; display:block; width:100%; height:auto;"editable = "true"label = "50x4x1"></td><td width = "1"></td><td align = "center"class = "heading"style = "color:#666666; font-family:"Segoe UI",sans-serif,Arial,Helvetica,Lato; font-size:30px; font-weight:400; line-height:38px; letter-spacing:1px;"><multiline > ' + finalList[i].websiteList[j].websiteInfo.website_name + '</span> </multiline> </td><td width = "1"></td><td align = "center"style = "color:#666666;"><img src = "http://guiwidgets.com/demo/perfect/img/50x4x1.png"alt = "50x4x1"width = "50"height = "4"style = "margin:0; border:0; padding:0; display:block; width:100%; height:auto;"editable = "true"label = "50x4x1"></td></tr> </table> </td> </tr> <tr><td height = "10"> </td> </tr> <tr><td align = "center"class = "MsoNormal"style = "color:#999999; font-family:"Segoe UI",sans-serif,Arial,Helvetica,Lato; font-size:14px; font-weight:400; line-height:24px;"><multiline> ' + finalList[i].websiteList[j].websiteInfo.website_name + ' sent ' + finalList[i].websiteList[j].mailList.length + ' email(s), up ' + toDaysDate1 + '. </multiline> </td></tr> <tr><td height = "30"> </td> </tr> <tr><td><table align = "left"border = "0"cellpadding = "0"class = "display-width"cellspacing = "0"width = "47%"style = "border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"><tr><td align = "left"><table align = "left"border = "0"cellpadding = "0"cellspacing = "0"width = "100%"><tr><td align = "left"><table align = "left"border = "0"cellpadding = "0"cellspacing = "0"><tr><td align = "left"width = "300"style = "color:#666666;"><img style="width:250px;height:300px;object-fit:cover" src = "' + image + '"alt = "300x260x1"width = "300"height = "260"style = "margin:0; border:0; padding:0; display:block; width:100%; height:auto;"editable = "true"label = "300x260x1"></td> </tr> </table> </td> </tr> <tr><td height = "20"> </td> </tr> <tr><td align = "left"class = "heading"style = "color:#666666; font-family:"Segoe UI",sans-serif,Arial,Helvetica,Lato; font-size:17px; font-weight:400; line-height:28px; letter-spacing:1px;"><multiline> ' + subject + '</multiline> </td> </tr><tr><td align = "left"class = "MsoNormal"style = "color:#666666; font-family:"Segoe UI",sans-serif,Arial,Helvetica,Lato; font-size:14px; font-weight:400; line-height:24px;"><multiline> ' + date + '</multiline> </td> </tr> <tr><td height = "15"> </td> </tr></table> </td> </tr> </table> <table align = "left"border = "0"class = "display-width"cellpadding = "0"cellspacing = "0"width = "1"style = "border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"><tbody><tr><td style = "line-height:50px;"height = "50"width = "1"> </td> </tr> </tbody></table><table align = "right"border = "0"class = "display-width"cellpadding = "0"cellspacing = "0"width = "47%"style = "border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"><tr><td align = "left"><table align = "left"border = "0"cellpadding = "0"cellspacing = "0"width = "100%"><tr><td align = "left"><table align = "left"border = "0"cellpadding = "0"cellspacing = "0"><tr><td align = "left"width = "300"style = "color:#666666;"><img style="width:250px;height:300px;object-fit:cover" src = "' + img + '"alt = "300x260x2"width = "300"height = "260"style = "margin:0; border:0; padding:0; display:block; width:100%; height:auto;"editable = "true"label = "300x260x2"></td> </tr> </table> </td> </tr> <tr><td height = "20"> </td> </tr> <tr><td align = "left"class = "heading"style = "color:#666666; font-family:"Segoe UI",sans-serif,Arial,Helvetica,Lato; font-size:17px; font-weight:400; line-height:28px; letter-spacing:1px;"><multiline> ' + subject1 + '</multiline> </td> </tr><tr><td align = "left"class = "MsoNormal"style = "color:#666666; font-family:"Segoe UI",sans-serif,Arial,Helvetica,Lato; font-size:14px; font-weight:400; line-height:24px;"><multiline> ' + date1 + '</multiline> </td> </tr> <tr><td height = "15"> </td> </tr></table> </td> </tr> </table> </td> </tr> <tr><td align = "center"class = "button-width"><table align = "center"class = "button"bgcolor = "#0371fa"style = "border-radius:5px;"><tr><td align = "center"class = "MsoNormal"style = "color:#ffffff; font-family:"Segoe UI",sans-serif,Arial,Helvetica,Lato; font-size:13px; font-weight:400; padding:5px 11px 5px 11px; border-radius:5px; letter-spacing:1px;" ><multiline> <a href = "'+website_url+'/inbox?userId=' + base64dataForUserId + '&websiteId=' + base64dataForWebsiteId + '&fromDate=' + previousSevenDaysDateFormatted + '&endDate=' + toDaysDate1Formatted + '&websiteName=' + finalList[i].websiteList[j].websiteInfo.website_name + '"target="_blank" rel="noopener"" style = "color:#ffffff; text-decoration:none;"> VIEW ALL ' + finalList[i].websiteList[j].mailList.length + ' EMAIL(S) </a> </multiline> </td> </tr> </table> </td> </tr> <tr><td height = "30"> </td> </tr> </table> </td> </tr> </table> </td> </tr> </table></layout> </repeater>'
                                                        break;
                                                    }


                                                }

                                                appendHtml = appendHtml + appendHtmlOne;


                                                // appendHtml = appendHtml + '<hr><div style="float:right;"><h1><a style="border-radius:2px;background:#2196f3;color:#fff;display:inline-block;font-family:sans-serif;font-size:13px;font-weight:bold;line-height:40px;text-align:center;text-decoration:none;width:200px;" href="http://178.128.176.48:3000/inbox" target="_blank"rel="noopener"> VIEW ALL ' + finalList[i].websiteList[j].mailList.length + ' EMAIL(S)</a></h1></div><h1 style="margin-top:0.5em;"><a style=color:#2196f3; href="http://178.128.176.48:3000/inbox" target="_blank"rel="noopener">' + finalList[i].websiteList[j].websiteInfo.website_name + '</a></h1><p>' + finalList[i].websiteList[j].websiteInfo.website_name + 'sent <strong>' + finalList[i].websiteList[j].mailList.length + '</strong> email(s),<strong>up</strong> today.<table border ="0" cellspacing="0" cellpadding="5"><tbody><tr><td align="left" valign="bottom" width="50%"><div><strong> ' + subject + '</strong></div><div style="color:#666666;">' + date + '</div><div><a href="javascript:void(0)" target="_blank" rel="noopener"><img style="width:250px;height:300px;object-fit:cover" src="' + image + '"/></a></div></td><td align="left" valign="bottom" width="50%"><div><strong> ' + subject1 + '</strong></div><div style="color:#666666;">' + date1 + '</div><div><a href="javascript:void(0)" target="_blank" rel="noopener"><img style="width:250px;height:300px;object-fit:cover" src="' + img + '"/></a></div></td></tr></tbody></table>'
                                                // appendHtml = appendHtml + '<div>&nbsp;</div><hr><div>&nbsp;</div><div style="float:right;"><h1><a style="background-color:#2196f3;border-radius:2px;color:#ffffff;display:inline-block;font-family:sans-serif;font-size:13px;font-weight:bold;line-height:40px;text-align:center;text-decoration:none;width:200px;"href="http://178.128.176.48:3000/inbox?selectedWebsiteId=' + finalList[i].websiteList[j].websiteInfo._id + '&startDate=' + toDaysDate1 + '"target="_blank"rel="noopener">VIEW ALL' + finalList[i].websiteList[j].mailList.length + 'EMAILS</a></div><h1 style="margin-top:0.5em;"><a href="https://www.google.com/"target="_blank"rel="noopener">' + finalList[i].websiteList[j].websiteInfo.website_name + '</a></h1><p>' + finalList[i].websiteList[j].websiteInfo.website_name + 'sent<strong>' + finalList[i].websiteList[j].mailList.length + '</strong>emails,<strong>up</strong>today.<div>&nbsp;</div><table border ="0" cellspacing="0" cellpadding="5"><tbody><tr><td align="left" valign="bottom" width="50%"><div>&nbsp;</div><div><strong>The RFP Response Formula That Gets an 80 % Close Rate</strong></div><div style="color:#666666;">Friday 27 July 2018 at 19:16</div><div>&nbsp;</div><div><a href="javascript:void(0)" target="_blank" rel="noopener"><img src="http://178.128.176.48:7000/resources/screenshots_subhajitmyntra12736067@catchletter.com_20.png"/></a></div></td><td align="left" valign="bottom" width="50%"><div>&nbsp;</div><div><strong>Presentation endings that pop</strong></div><div style="color:#666666;">Friday 27 July 2018 at 18:40</div><div>&nbsp;</div><div><a href="https://click.pstmrk.it/2s/www.owletter.com%2Fdashboard%2Fnewsletters%2F303685/-5215QE/bfo_/-xM1X9yFdW" target ="_blank" rel="noopener"><img class="CToWUd" style="max-width:250px;" src="http://178.128.176.48:7000/resources/screenshots_subhajitmyntra12736067@catchletter.com_20.png"/></a></div></td></tr></tbody></table>'
                                            } else {
                                                //appendHtml = appendHtml + '<hr><h1><a href="https://app.catchletter.com/inbox" style=color:#2196f3;cursor:pointer;> ' + finalList[i].websiteList[j].websiteInfo.website_name + '</h1></a><p>Looks like <strong>' + finalList[i].websiteList[j].websiteInfo.website_name + '</strong> didnot send any newsletters till ' + toDaysDate1 + '. </p><p>Please make sure you have signed up to their email newsletters using the email <u><a href="mailto:' + finalList[i].websiteList[j].websiteInfo.emailDomain + '"target="_blank"> ' + finalList[i].websiteList[j].websiteInfo.emailDomain + '<wbr>com</a></u> '
                                                appendHtml = appendHtml + '<repeater><layout label="OUR ENVIRONMENT STARTS"><table align="center" bgcolor="#fff" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center"><table align="center" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center" style="padding:0 30px;"><table align="center" border="0" class="display-width" cellpadding="0" cellspacing="0" width="640"><tr><td height="30"></td></tr><tr><td align="center"><table align="center" border="0" cellpadding="0" cellspacing="0" style="width:auto !important;"><tr><td align="center" style="color:#666666;"><img src="http://guiwidgets.com/demo/perfect/img/50x4x1.png" alt="50x4x1" width="50" height="4" style="margin:0; border:0; padding:0; display:block; width:100%; height:auto;"editable="true" label="50x4x1"></td><td width="1"></td><td align="center" class="heading" style="color:#666666; font-family:"Segoe UI",sans-serif,Arial,Helvetica,Lato; font-size:30px; font-weight:400; line-height:38px; letter-spacing:1px;"><multiline>' + finalList[i].websiteList[j].websiteInfo.website_name + '</multiline></td><td width="1"></td><td align="center" style="color:#666666;"><img src="http://guiwidgets.com/demo/perfect/img/50x4x1.png" alt="50x4x1" width="50" height="4" style="margin:0; border:0; padding:0; display:block; width:100%; height:auto;"editable="true" label="50x4x1"></td></tr></table></td></tr><tr><td height="10"></td></tr><tr><td align="center" class="MsoNormal" style="color:#999999; font-family:"Segoe UI",sans-serif,Arial,Helvetica,Lato; font-size:14px; font-weight:400; line-height:24px;"><multiline>Looks like ' + finalList[i].websiteList[j].websiteInfo.website_name + ' did not send any newsletters in ' + toDaysDate1+'. </multiline><multiline>Please make sure you have signed up to their email newsletters using the email <a href="mailto:' + finalList[i].websiteList[j].websiteInfo.emailDomain + '"target="_blank">'+finalList[i].websiteList[j].websiteInfo.emailDomain+'</a> </multiline></td> </tr><tr><td height="30"></td> </tr><tr><td align="center" class="button-width"><table align="center" class="button" bgcolor="#0371fa" style="border-radius:5px;"><tr><td align="center" class="MsoNormal" style="color:#ffffff; font-family:"Segoe UI",sans-serif,Arial,Helvetica,Lato; font-size:13px; font-weight:400; padding:5px 11px 5px 11px; border-radius:5px; letter-spacing:1px;"></td> </tr></table> </td></tr><tr><td height = "30"></td></tr></table></td></tr></table></td></tr></table></layout></repeater>'
                                                // appendHtml = appendHtml + '<hr><div>&nbsp;</div><strong><a href="javascript:void(0)" style="color:red;"> ' + finalList[i].websiteList[j].websiteInfo.website_name + '</strong></a><p>Looks like <strong>' + finalList[i].websiteList[j].websiteInfo.website_name + '</strong>didnot send any newsletters in ' + toDaysDate1 + '. </p><p>Please make sure you have signed up to their email newsletters using the email <u><a href="mailto:' + finalList[i].websiteList[j].websiteInfo.emailDomain + '"target="_blank"> ' + finalList[i].websiteList[j].websiteInfo.emailDomain + '<wbr>com</a></u> '
                                            }
                                        }
                                        //console.log(TOTALMAILCOUNT, "TOTALMAILCOUNT");
                                        var replacements = {
                                            TODAYSDATE: previousSevenDaysDate + ' to ' + toDaysDate1,
                                            WEBSITESLIST: appendHtml,
                                            TOTALMAILCOUNT: TOTALMAILCOUNT,
                                            websiteLink: website_url
                                        };
                                        var htmlToSend = template(replacements);
                                        // console.log("htmlToSend :", htmlToSend);
                                        var htmlToSend = template(replacements);
                                        var html1 = htmlToSend.replace(new RegExp("&lt;", 'g'), "<").replace(new RegExp("&gt;", 'g'), ">").replace(new RegExp("&amp;", 'g'), "").replace(new RegExp("&#x3D;", 'g'), "=").replace(new RegExp("&quot;", 'g'), "'");

                                        var mailOptions = {
                                            from: 'no-reply@catchletter.com',
                                            // to: "pragati@natitsolved.com",
                                            to: finalList[i].email,
                                            // subject: "Email activity report_" + i,
                                            subject: "Email activity report for " + previousSevenDaysDate + " to " + toDaysDate1,
                                            html: html1
                                        };
                                        transporter.sendMail(mailOptions, function (error, info) {
                                            if (error) {} else {
                                                console.log('Email sent: ' + info.response);
                                                resolve()
                                            }
                                        });
                                    });
                                });
                            }
                        }
                        res.status(200).json({
                            status: true,
                            message: finalList
                        })
                    })();
                })();

            } else {
                res.status(500).json({
                    success: false,
                    data: 'No report data found.'
                });
            }
        }
    });
}

module.exports = reportsController;
