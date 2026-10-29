/**
 * Authorization helpers intentionally accept a small appointment-shaped input.
 * The real Appointment model is owned by another module and is not present yet.
 */
export function canPatientAccessAppointment(appointment: { patientId: string }, userId: string): boolean {
  return appointment.patientId === userId;
}

export function canDoctorAccessAppointment(appointment: { doctorId: string }, userId: string): boolean {
  return appointment.doctorId === userId;
}
