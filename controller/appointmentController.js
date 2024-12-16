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
    issue,
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
    !address ||
    !issue
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

      if (appointmentsOnDate.length < 5) {
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
    issue,
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
  if(!appointment){
    res.status(200).json({
      message:"Appointment Not Found"
    })
  }
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

export const tokenAssignment = catchAsyncErrors(async(req,res,next)=>{
  try {
    const doctorId = req.user._id; // Ensure user is authenticated and get doctor ID

    // Fetch pending appointments for the doctor
    const pendingAppointments = await Appointment.find({
      doctorId: doctorId,
      status: "Pending",
    }).sort({ appointment_date: 1 }); // Sort by appointment date for consistency

    // Assign sequential tokens starting from 1
    let token = 1;
    for (const appointment of pendingAppointments) {
      appointment.token = token++;
      await appointment.save();
    }

    // Return updated appointments
    const updatedAppointments = await Appointment.find({ doctor: doctorId });

    res.status(200).json({
      success: true,
      message: "Tokens assigned successfully",
      updatedAppointments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export const updateAppointmentStatusCurrentToken = catchAsyncErrors(async(req,res,next)=>{
  try {
    const { status } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    // Update status and clear token if rejected
    appointment.status = status;
    if (status === "Rejected" || status === "Completed") {
      appointment.token = null; // Remove token if appointment is rejected
    }

    await appointment.save();

    res.status(200).json({ success: true, message: "Appointment updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }

})

export const retrieveUserToken = catchAsyncErrors(async(req,res,next)=>{
  try {
    const {userEmail, Name}  = req.query; // Ensure user is authenticated
    // console.log(Name);

    // Find the user's appointment with the assigned token
    const appointment = await Appointment.findOne({
      email: userEmail,
      firstName: Name,
      // token: { $ne: null },
      status: { $in: ["Pending", "Accepted", "Rejected", "Completed"] },
    });

    if (appointment.status === "Completed") {
      return res.status(200).json({
        success: true,
        message: "Your Appointment is Completed!",
      });
    }
    if (appointment.token == null) {
      return res.status(200).json({
        success: true,
        message: "Token Has Not Assigned Yet. Doctor has Not Arrived!",
      });
    }

    if(!appointment){
      return res.status(404).json({
        success:false,
        message:"Appointment Not Found",
      })
    }

    res.status(200).json({
      success: true,
      token: appointment.token,
      message: `Your current token is ${appointment.token}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
})