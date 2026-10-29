import { findAppointmentForDoctor, findAppointmentForPatient, findAppointmentsForDoctor, findAppointmentsForPatient } from "./repository";

export function getPatientAppointments(patientId: string) {
  return findAppointmentsForPatient(patientId);
}

export function getPatientAppointment(appointmentId: string, patientId: string) {
  return findAppointmentForPatient(appointmentId, patientId);
}

export function getDoctorAppointment(appointmentId: string, doctorId: string) {
  return findAppointmentForDoctor(appointmentId, doctorId);
}

export function getDoctorAppointments(doctorId: string) {
  return findAppointmentsForDoctor(doctorId);
}