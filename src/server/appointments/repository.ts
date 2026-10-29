import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";

type AppointmentRow = {
  id: string;
  patientId: string;
  doctorId: string;
  scheduledAt: Date;
  mode: "CLINIC" | "VIDEO";
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  doctorFirstName: string;
  doctorLastName: string;
  patientFirstName: string;
  patientLastName: string;
  patientEmail: string;
  preConsultationId: string | null;
  preConsultationStatus: "DRAFT" | "SUBMITTED" | "CLOSED" | null;
  answers: Prisma.JsonValue | null;
  summary: Prisma.JsonValue | null;
  submittedAt: Date | null;
  summaryGeneratedAt: Date | null;
};

type AppointmentRecord = {
  id: string;
  patientId: string;
  doctorId: string;
  scheduledAt: Date;
  consultationType: "IN_CLINIC" | "VIDEO";
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  doctor: { id: string; prenom: string; nom: string };
  patient: { id: string; prenom: string; nom: string; email?: string };
  preConsultation: {
    id: string;
    status: "DRAFT" | "SUBMITTED";
    answers: Prisma.JsonValue;
    summary: Prisma.JsonValue | null;
    summaryStatus: "NOT_STARTED" | "READY" | "FAILED";
    completionPercentage: number;
    summaryError: string | null;
    updatedAt: Date;
  } | null;
};

export function findAppointmentsForPatient(patientId: string) {
  return readAppointments(Prisma.sql`appointment."patientId" = ${patientId}`);
}

export function findAppointmentForPatient(appointmentId: string, patientId: string) {
  return readAppointments(Prisma.sql`appointment."id" = ${appointmentId} AND appointment."patientId" = ${patientId}`).then((rows) => rows[0] ?? null);
}

export function findAppointmentForDoctor(appointmentId: string, doctorId: string) {
  return readAppointments(Prisma.sql`appointment."id" = ${appointmentId} AND appointment."doctorId" = ${doctorId}`).then((rows) => rows[0] ?? null);
}

export function findAppointmentsForDoctor(doctorId: string) {
  return readAppointments(Prisma.sql`appointment."doctorId" = ${doctorId}`);
}

function readAppointments(where: Prisma.Sql): Promise<AppointmentRecord[]> {
  return prisma.$queryRaw<AppointmentRow[]>(Prisma.sql`
    SELECT
      appointment."id",
      appointment."patientId",
      appointment."doctorId",
      appointment."scheduledAt",
      appointment."mode",
      appointment."status",
      doctor."prenom" AS "doctorFirstName",
      doctor."nom" AS "doctorLastName",
      patient."prenom" AS "patientFirstName",
      patient."nom" AS "patientLastName",
      patient."email" AS "patientEmail",
      pre."id" AS "preConsultationId",
      pre."status" AS "preConsultationStatus",
      COALESCE((SELECT jsonb_object_agg(answer."questionKey", answer."answer") FROM "PreConsultationAnswer" AS answer WHERE answer."preConsultationId" = pre."id"), '{}'::jsonb) AS "answers",
      pre."summary",
      pre."submittedAt",
      pre."summaryGeneratedAt"
    FROM "Appointment" AS appointment
    INNER JOIN "User" AS doctor ON doctor."id" = appointment."doctorId"
    INNER JOIN "User" AS patient ON patient."id" = appointment."patientId"
    LEFT JOIN "PreConsultation" AS pre ON pre."appointmentId" = appointment."id"
    WHERE ${where}
    ORDER BY appointment."scheduledAt" ASC
  `).then((rows) => rows.map(toAppointmentRecord));
}

function toAppointmentRecord(row: AppointmentRow): AppointmentRecord {
  const submitted = row.preConsultationStatus === "SUBMITTED" || row.preConsultationStatus === "CLOSED";
  return {
    id: row.id,
    patientId: row.patientId,
    doctorId: row.doctorId,
    scheduledAt: row.scheduledAt,
    consultationType: row.mode === "VIDEO" ? "VIDEO" : "IN_CLINIC",
    status: row.status,
    doctor: { id: row.doctorId, prenom: row.doctorFirstName, nom: row.doctorLastName },
    patient: { id: row.patientId, prenom: row.patientFirstName, nom: row.patientLastName, email: row.patientEmail },
    preConsultation: row.preConsultationId
      ? {
          id: row.preConsultationId,
          status: submitted ? "SUBMITTED" : "DRAFT",
          answers: row.answers ?? {},
          summary: row.summary,
          summaryStatus: row.summary ? "READY" : submitted ? "FAILED" : "NOT_STARTED",
          completionPercentage: submitted ? 100 : 0,
          summaryError: null,
          updatedAt: row.summaryGeneratedAt ?? row.submittedAt ?? row.scheduledAt,
        }
      : null,
  };
}