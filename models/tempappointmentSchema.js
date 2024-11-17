import mongoose from "mongoose";
import { Mongoose } from "mongoose";
import validator from "validator";

const tempappointmentSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "First Name Is Required!"],
    minLength: [3, "First Name Must Contain At Least 3 Characters!"],
  },
  lastName: {
    type: String,
    required: [true, "Last Name Is Required!"],
    minLength: [3, "Last Name Must Contain At Least 3 Characters!"],
  },
  age: {
    type: Number,
    required: [true, "Age is Required!"],
  },
  phone: {
    type: String,
    required: [true, "Phone Is Required!"],
    minLength: [11, "Phone Number Must Contain Exact 11 Digits!"],
    maxLength: [11, "Phone Number Must Contain Exact 11 Digits!"],
  },
  gender: {
    type: String,
    required: [true, "Gender Is Required!"],
  },
  address: {
    type: String,
    required: [true, "Address Is Required!"],
  },
  issue: {
    type: String,
    required: [true, "Enter Issue!"],
  },
  status: {
    type: String,
    enum: ["Pending", "Accepted", "Rejected"],
    default: "Pending",
  },

});

export const tempAppointment = mongoose.model("tempAppointment", tempappointmentSchema);
