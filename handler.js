const Mongoose = require('mongoose');
const AWS = require('aws-sdk');
const getPatient = require('./mongo/mongo.js').getPatient;
const getPatientEnrolledProgram = require('./mongo/mongo.js').getPatientEnrolledProgram;

AWS.config.update({ region: 'us-west-2' });

let encrypted;
const env = process.env['ENV'];
if (env === 'production') {
  encrypted = process.env['MONGODB_CLUSTER_URI'];
} else if (env === 'test') {
  encrypted = process.env['MONGODB_CLUSTER_URI_TEST'];
} else if (env === 'dev') {
  encrypted = process.env['MONGODB_CLUSTER_URI_DEV'];
} else if (env === 'local') {
  encrypted = 'mongodb://localhost:27017/ShareCare';
}

module.exports.hello = async (event, context, callback) => {
  // exports.handler = (event, context, callback) => {
  if (env === 'local') {
    processEvent(event, context, callback, encrypted);
  } else {
    // Decrypt code should run once and variables stored outside of the
    // function handler so that these are decrypted once per container
    const kms = new AWS.KMS();
    console.log('=> encrypted', encrypted);
    kms.decrypt({ CiphertextBlob: Buffer.from(encrypted, 'base64') }, (err, data) => {
      if (err) {
        return callback(err);
      }
      const decryptUri = data.Plaintext.toString('ascii');
      console.log('=> decryptUri', decryptUri);
      processEvent(event, context, callback, decryptUri);
    });
  }
};

function processEvent(event, context, callback, uri) {
  console.log('=> connecting to database', JSON.stringify(event));
  const phoneNumber = event['Details']['ContactData']['CustomerEndpoint']['Address'];
  if (phoneNumber != undefined && phoneNumber.length >= 10) {
    const newNumber = phoneNumber.slice(phoneNumber.length - 10, phoneNumber.length)
    queryPatient(newNumber, callback, uri)
  } else {
    errorOutput(callback, { query: 'phone number not recognized' })
  }
}

async function queryPatient(phoneNumber, callback, uri) {
  const person = await getPatient(uri, phoneNumber);
  if (person.length > 0) {
    var aPerson = person[0]
    if (aPerson.profile.firstName != null && aPerson.profile.lastName != null) {
      let language = aPerson.profile.language
      const organizationId = aPerson.role[0].organizationId;
      const roleId = aPerson.role[0].roleId;
      const ep = await getPatientEnrolledProgram(uri, aPerson._id);
      var enrolledProgramId = null
      if (ep != undefined && ep.length > 0) {
        enrolledProgramId = ep[0]._id;
      }
      const callbackData = {
        language,
        name: aPerson.profile.firstName + " " + aPerson.profile.lastName,
        patientId: aPerson._id,
        roleId,
        enrolledProgramId,
        organizationId
      }
      console.log('=> callbackData', callbackData);
      callback(null, callbackData);
      return
    } else {
      errorOutput(callback, { query: 'an error occurred when queryPatient, there is no patient name' })
    }
  } else {
    errorOutput(callback, { query: 'an error occurred when queryPatient, no patient' })
  }
}

function errorOutput(callback, err) {
  callback(null, { err });
}
