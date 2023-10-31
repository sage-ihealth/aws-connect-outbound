const Mongoose = require('mongoose');

const Schema = Mongoose.Schema;

exports.AccountSchema = new Mongoose.Schema({
  _id: Schema.Types.ObjectId,
  role: [{
    roleId: Schema.Types.ObjectId,
    organizationId: Schema.Types.ObjectId
  }],
  teamId: [
    Schema.Types.ObjectId
  ],
  phone: [{
    number: String
  }],
  profile: {
    firstName: String,
    lastName: String,
    language: String
  }
});


exports.EnrolledProgramSchema = new Mongoose.Schema({
  _id: Schema.Types.ObjectId,
  memberId: Schema.Types.ObjectId,
  operationStatus: String //ENROLLED
})
