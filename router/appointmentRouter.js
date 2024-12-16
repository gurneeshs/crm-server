import express from "express";
import {
  deleteAppointment,
  getAllAppointments,
  getAppointment,
  postAppointment,
  updateAppointmentStatus,
  postTempAppointment,
  updatetempAppointmentStatus,
  getAlltempAppointments,
  tokenAssignment,
  updateAppointmentStatusCurrentToken,
  retrieveUserToken
} from "../controller/appointmentController.js";
import {
  isAdminAuthenticated,
  isDoctorAuthenticated,
  isPatientAuthenticated,
} from "../middlewares/auth.js";

const router = express.Router();

router.post("/post", isPatientAuthenticated, postAppointment);
router.post("/postTemp", postTempAppointment);
router.get("/getall", getAllAppointments);
router.get("/gettempall", getAlltempAppointments);
router.get("/getappointment", getAppointment);
router.put("/update/:id", isAdminAuthenticated, updateAppointmentStatus);
router.put("/tempupdate/:id", isAdminAuthenticated, updatetempAppointmentStatus);
router.delete("/delete/:id", isAdminAuthenticated, deleteAppointment);
router.put("/assign-tokens", isDoctorAuthenticated, tokenAssignment);
router.put("/updateTokenAppointment/:id", isDoctorAuthenticated, updateAppointmentStatusCurrentToken);
router.get("/token", retrieveUserToken);

export default router;
