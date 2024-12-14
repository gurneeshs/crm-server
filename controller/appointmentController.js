import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { Appointment } from "../models/appointmentSchema.js";
import { tempAppointment } from "../models/tempappointmentSchema.js";
import { User } from "../models/userSchema.js";
import { Doctor } from "../models/doctorSchema.js";

export const postAppointment = catchAsyncErrors(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    dob,
    gender,
    department,
    booking_date,
    doctor_firstName,
    doctor_lastName,
    hasVisited,
    address,
  } = req.body;

  if (
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !dob ||
    !booking_date ||
    !gender ||
    !department ||
    !doctor_firstName ||
    !doctor_lastName ||
    !address
  ) {
    return next(new ErrorHandler("Please Fill Full Form!", 400));
  }

  // Check if the doctor exists
  const isConflict = await Doctor.find({
    firstName: doctor_firstName,
    lastName: doctor_lastName,
    role: "Doctor",
    doctorDepartment: department,
  });

  if (isConflict.length === 0) {
    return next(new ErrorHandler("Doctor not found", 404));
  }

  if (isConflict.length > 1) {
    return next(
      new ErrorHandler(
        "Doctors Conflict! Please Contact Through Email Or Phone!",
        400
      )
    );
  }

  const doctor = isConflict[0];
  const doctorId = doctor._id;
  const patientId = req.user._id;

  // Determine appointment date
  const findAvailableDate = async (doctorId) => {
    let appointmentDate = new Date();

    while (true) {
      // Check the total appointments for the given doctor and date
      const appointmentsOnDate = await Appointment.find({
        doctorId,
        appointment_date: appointmentDate.toISOString().split("T")[0],
      });

      if (appointmentsOnDate.length < 10) {
        return appointmentDate;
      }

      // Increment the date by 1 day if the limit is reached
      appointmentDate.setDate(appointmentDate.getDate() + 1);
    }
  };

  const appointment_date = await findAvailableDate(doctorId);

  // Create the appointment
  const appointment = await Appointment.create({
    firstName,
    lastName,
    email,
    phone,
    dob,
    gender,
    appointment_date: appointment_date.toISOString().split("T")[0],
    booking_date,
    department,
    doctor: {
      firstName: doctor_firstName,
      lastName: doctor_lastName,
    },
    hasVisited,
    address,
    doctorId,
    patientId,
  });

  // Update the doctor's record with the appointment
  doctor.appointments = doctor.appointments || [];
  doctor.appointments.push({
    appointmentId: appointment._id,
    date: appointment_date.toISOString().split("T")[0],
  });

  await doctor.save();

  res.status(200).json({
    success: true,
    appointment,
    message: "Appointment Scheduled!",
  });
});

export const getAllAppointments = catchAsyncErrors(async (req, res, next) => {
  const appointments = await Appointment.find();
  res.status(200).json({
    success: true,
    appointments,
  });
});
export const getAlltempAppointments = catchAsyncErrors(async (req, res, next) => {
  const appointments = await tempAppointment.find();
  res.status(200).json({
    success: true,
    appointments,
  });
});
export const getAppointment = catchAsyncErrors(async (req, res, next) => {
  const email = req.query.email;
  const appointment = await Appointment.findOne({email:email});
  res.status(200).json(appointment);
});
export const updateAppointmentStatus = catchAsyncErrors(
  async (req, res, next) => {
    const { id } = req.params;
    let appointment = await Appointment.findById(id);
    if (!appointment) {
      return next(new ErrorHandler("Appointment not found!", 404));
    }
    appointment = await Appointment.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });
    res.status(200).json({
      success: true,
      message: "Appointment Status Updated!",
    });
  }
);
export const updatetempAppointmentStatus = catchAsyncErrors(
  async (req, res, next) => {
    const { id } = req.params;
    let appointment = await tempAppointment.findById(id);
    if (!appointment) {
      return next(new ErrorHandler("Appointment not found!", 404));
    }
    appointment = await tempAppointment.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: false,
      useFindAndModify: false,
    });
    res.status(200).json({
      success: true,
      message: "Appointment Status Updated!",
    });
  }
);
export const deleteAppointment = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const appointment = await Appointment.findById(id);
  if (!appointment) {
    return next(new ErrorHandler("Appointment Not Found!", 404));
  }
  await appointment.deleteOne();
  res.status(200).json({
    success: true,
    message: "Appointment Deleted!",
  });
});

export const postTempAppointment = catchAsyncErrors(async (req, res, next) => {
  const {
    firstName,
    lastName,
    phone,
    age,
    gender,
    address,
    issue,
  } = req.body;
  if (
    !firstName ||
    !lastName ||
    !age ||
    !phone ||
    !gender ||
    !address ||
    !issue 

  ) {
    return next(new ErrorHandler("Please Fill Full Form!", 400));
  }
  const appointment = await tempAppointment.create({
    firstName,
    lastName,
    age,
    phone,
    gender,
    address,
    issue
  });
  res.status(200).json(appointment);
});

