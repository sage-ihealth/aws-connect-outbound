const Mongoose = require('mongoose');
const AWS = require('aws-sdk');
const getPatient = require('./mongo/mongo.js').getPatient;
const getPatientEnrolledProgram = require('./mongo/mongo.js').getPatientEnrolledProgram;

AWS.config.update({ region: 'us-west-2' });

const encrypted = process.env['MONGODB_CLUSTER_URI_TEST'];
// TEST when using decrypted uri
// decrypt uri once
let encrypted_uri = 'mongodb://localhost:27017/ShareCare';

//inboundPhoneNumber is patient's phone number
var inboundPhoneNumber = null;

module.exports.hello = async (event, context, callback) => {
  // exports.handler = (event, context, callback) => {
  if (encrypted_uri) {
    processEvent(event, context, callback);
  } else {
    // Decrypt code should run once and variables stored outside of the
    // function handler so that these are decrypted once per container
    const kms = new AWS.KMS();
    console.log('=> encrypted', encrypted);
    kms.decrypt({ CiphertextBlob: Buffer.from(encrypted, 'base64') }, (err, data) => {
      if (err) {
        return callback(err);
      }
      encrypted_uri = data.Plaintext.toString('ascii');
      console.log('=> encrypted_uri', encrypted_uri);
      // processEvent(event, context, callback);
    });
  }
};

function processEvent(event, context, callback) {
  console.log('=> connecting to database', JSON.stringify(event));
  inboundPhoneNumber = event['Details']['Parameters']['CustomerNumber'];
  if (inboundPhoneNumber != undefined) {
    if (inboundPhoneNumber.length >= 10) {
      inboundPhoneNumber = inboundPhoneNumber.slice(inboundPhoneNumber.length - 10, inboundPhoneNumber.length)
    }
  }
  queryPatient(inboundPhoneNumber, callback)
}

async function queryPatient(inboundPhoneNumber, callback) {
  const person = await getPatient(encrypted_uri, inboundPhoneNumber);
  console.log('=> queryPatient', person);
  if (person.length > 0) {
    var aPerson = person[0]
    if (aPerson.profile.firstName != null && aPerson.profile.lastName != null) {
      let language = aPerson.profile.language
      const organizationId = aPerson.role[0].organizationId;
      const roleId = aPerson.role[0].roleId;

      const pId = aPerson._id;
      var ep = await getPatientEnrolledProgram(encrypted_uri, pId);
      console.log('=> query enrolled program', ep);

      if (ep != undefined && ep.length > 0) {
        callback(null, {
          language,
          name: aPerson.profile.firstName + " " + aPerson.profile.lastName,
          patientId: aPerson._id,
          roleId,
          enrolledProgramId: ep[0]._id,
          organizationId
        })
      } else {
        callback(null, {
          language,
          name: aPerson.profile.firstName + " " + aPerson.profile.lastName,
          patientId: aPerson._id,
          roleId,
          enrolledProgramId: null,
          organizationId
        })
      }
      return
    } else {
      errorOutput(callback, { query: 'an error occurred when queryPatient, there is no patient name' })
    }
  } else {
    errorOutput(callback, { query: 'an error occurred when queryPatient, no patient' })
  }
}

function errorOutput(callback, err) {
  callback(null, { err, "name": inboundPhoneNumber });
}
