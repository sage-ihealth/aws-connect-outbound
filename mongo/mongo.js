const Mongoose = require('mongoose');
const AccountSchema = require('./schema').AccountSchema;
const EnrolledProgramSchema = require('./schema').EnrolledProgramSchema;

exports.getPatient = async (encrypted_uri, inboundPhoneNumber) => {
  const db = (await Mongoose.connect(encrypted_uri, { useNewUrlParser: true, useUnifiedTopology: true, connectTimeoutMS: 1000 })).connection
  const Account = Mongoose.model('accounts', AccountSchema);
  var person = await Account.find({ 'phone.number': new RegExp(inboundPhoneNumber) },
    { 'phone.number': 1, "teamId": 1, "profile": 1, "role": 1 });
    db.close();
    return person;
}

exports.getPatientEnrolledProgram = async (encrypted_uri, patientId) => {
  const db = (await Mongoose.connect(encrypted_uri, { useNewUrlParser: true, useUnifiedTopology: true, connectTimeoutMS: 1000 })).connection
  const EnrolledProgram = Mongoose.model('enrolled_programs', EnrolledProgramSchema);
  var ep = await EnrolledProgram.find({ 'memberId': patientId, 'operationStatus': 'ENROLLED' })
  db.close();
  return ep;
}
