import { describe, expect, it } from "vitest";

import { canDoctorAccessAppointment, canPatientAccessAppointment } from "./access";

describe("pre-consultation appointment access", () => {
  it("allows only the patient who owns the appointment", () => {
    const appointment = { patientId: "patient-1" };

    expect(canPatientAccessAppointment(appointment, "patient-1")).toBe(true);
    expect(canPatientAccessAppointment(appointment, "patient-2")).toBe(false);
  });

  it("allows only the assigned doctor", () => {
    const appointment = { doctorId: "doctor-1" };

    expect(canDoctorAccessAppointment(appointment, "doctor-1")).toBe(true);
    expect(canDoctorAccessAppointment(appointment, "doctor-2")).toBe(false);
  });
});
