var express = require('express');

// Controller imports
var commentController = require('./controllers/comments');
var customerController = require('./controllers/customer');

var websiteController = require('./controllers/website');
var tagsController = require('./controllers/tags');
var adminController = require('./controllers/admin');
var mailController = require('./controllers/mail');
var subscriptionController = require('./controllers/subscription');
var reportsController = require('./controllers/reports');
var gridController = require('./controllers/grid');
var alertsController = require('./controllers/alerts');
var imageController = require('./controllers/image');
var testController = require('./controllers/test');
const routes = express();

// Basic routes
routes.get('/', function (req, res) {
    res.json({
        message: 'hooray! welcome to our api!'
    });
});

// routes for comment
routes.get('/comments', commentController.get);

// routes for all mails of a website
routes.post('/getParticularlWebsitesImages', mailController.getParticularlWebsitesImages);

// routes for all mails
routes.get('/getAllMailImages', mailController.getAllMailImages);

//routes for customers

//get all customers

routes.get('/getAllCustomers', customerController.getAllCustomers);

//register

routes.post('/customerSignup', customerController.customerSignup);



//send test mail

routes.post('/sendTestMail', customerController.sendTestMail);

//login

routes.post('/customerLogin', customerController.customerLogin);

//getCustomerById

routes.get('/getCustomerById/:id', customerController.getCustomerById);


//get all websites
routes.get('/getAllWebsites', websiteController.getAllWebsites);

//get perticular website
routes.get('/getPerticularWebsites', websiteController.getPerticularWebsites);

//update perticular website
routes.post('/updateParticularWesbite', websiteController.updateParticularWesbite);

//insertWebSite

routes.post('/insertWebSite', websiteController.insertWebsite);

//getAllWebsitesByUserId

routes.get('/getAllWebsitesByUserId/:id', websiteController.getAllWebsitesByUserId);
routes.post('/getAllWebsitesByUserIdWithPagination', websiteController.getAllWebsitesByUserIdWithPagination);

//delete WebsiteBy Id

routes.delete('/deleteWebsiteById/:id', websiteController.deleteWebsiteById);

//test curl

routes.get('/test', websiteController.testCurl);

//getMyMails

routes.post('/getMyMailsByWebsite', websiteController.getMyMailsByWebsite);

//get mails by website with pagination
routes.post('/getMyMailsByWebsiteWithPagination', websiteController.getMyMailsByWebsiteWithPagination);

//getMailByUid
routes.post('/getMailById', websiteController.getMailById);

//getMailByUid
routes.post('/getMailByIdWithScreenshot', websiteController.getMailByIdWithScreenshot);


//add mail as favourite
routes.post('/markMailAsFavouriteId', websiteController.markMailAsFavouriteId);

//remove mail from favourite
routes.post('/removeMailAsFavouriteId', websiteController.removeMailAsFavouriteId);


//get list of favourites
routes.post('/getListOfFavourites', websiteController.getListOfFavourites);


//send otp for forgot password
routes.post('/sendOtp', customerController.sendOtp);

//reset password
routes.post('/passwordReset', customerController.passwordReset);

//reset password for new user

routes.post('/setPasswordForNewUser', customerController.setPasswordForNewUser);
//update customer
routes.post('/updateCustomer', customerController.updateCustomer);

//change password
routes.post('/changePassword', customerController.changePassword);


//websites by hastags
routes.post('/getWebsitesByHashtags', websiteController.getWebsitesByHashtags);

//getAllTags
routes.get('/getAllTags/:id', tagsController.getAllTags);

//getListOfFavourites BY User Id
routes.get('/getListOfFavouritesByUserId/:id/:page', websiteController.getListOfFavouritesByUserId);


//get List Of Mails  BY User Id
routes.get('/getListOfMailsByUserId/:id', websiteController.getListOfMailsByUserId);


//get list of mails by pagination
routes.post('/getListOfMailsByUserIdWithPagination', websiteController.getListOfMailsByUserIdWithPagination);

//get list of favourite mails by pagination
routes.post('/getListOfFavouriteMailsWithPagination', websiteController.getListOfFavouriteMailsWithPagination);

//get favourite mails by date
routes.post('/getFavouriteMailsByDate', websiteController.getFavouriteMailsByDate);

//get favourite mails by date for all websites
routes.post('/getFavouriteMailsByDateForAllWebsites', websiteController.getFavouriteMailsByDateForAllWebsites);

routes.post('/sendpassworduser', customerController.sendpassworduser);

routes.post('/login', adminController.login);

routes.post('/adminsignup', adminController.signup);

routes.post('/subscriptionadd', adminController.addsubscription);

routes.get('/getAllSubscription', adminController.getAllSubscription);

routes.delete('/deleteSubscription/:id', adminController.deleteSubscription);

routes.post('/updateSubscription', adminController.updateSubscription);

routes.get('/getsubscriptionById/:id', adminController.getsubscriptionById);

//routes.post('/send2dayemail', customerController.send2dayemail);

routes.get('/send2dayemail1', customerController.send2dayemail1);

routes.get('/send5dayemail', customerController.send5dayemail);

routes.post('/updateCustomerBilling', adminController.updateCustomerBilling);

routes.get('/getBillingById/:id', adminController.getBillingById);

routes.get('/getsubscriptionById/:id', adminController.getsubscriptionById);

//subscription
routes.get('/getSubscriptionPlan', subscriptionController.getAllSubscription);

// add default billing with userId
routes.post('/billingResult', subscriptionController.addDefaultBilling);

// update billing with userId
routes.post('/updateBillingResult', subscriptionController.updateDefaultBilling);

//for websites

routes.post('/updateDefaultBillingForWeb', subscriptionController.updateDefaultBillingForWeb);

// get billing data with userId
routes.post('/getBillingData', subscriptionController.getBillingData);

//getwebsitebydatecheck
routes.post('/getwebsitebydatecheck', subscriptionController.getwebsitebydatecheck);

//send reports
routes.get('/sendReportsToAllUsers', reportsController.sendReportsToAllUsers);

//send weekly report
routes.get('/sendReportsToAllUsersWeekly', reportsController.sendReportsToAllUsersWeekly);

//post grid type
routes.post('/postGrid', gridController.postGrid);

//get grid type
routes.post('/getGridType', gridController.getGridType);


//get subscription list with pagination
routes.post('/getAllBillingWithPagination', subscriptionController.getAllBillingWithPagination);

//insert alert
routes.post('/saveAlerts', alertsController.saveAlerts);

//update alert
routes.post('/updateAlertsById', alertsController.updateAlertsById);
//get list of alerts by user id
routes.post('/getListOfAlertsByUserId', alertsController.getListOfAlertsByUserId);
//delete alert by id
routes.post('/deleteAlertsById', alertsController.deleteAlertsById);

// user image upload
routes.post('/uploadImage', imageController.uploadImage);

// getting user image
// routes.post('/imageShow', imageController.imageShow);

routes.post('/test', testController.test);

routes.post('/insertUserForSubscription', subscriptionController.insertUserForSubscription);
// routes.get('/updateCDate', websiteController.updateCDate);

// save current plan with userId
routes.post('/currentplan', testController.currentplan);

routes.delete('/deleteCustomer/:id', adminController.deleteById);

module.exports = routes

console.log('Executing Server: routes.js ...');
