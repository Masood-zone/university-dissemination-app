import { create } from "zustand";
import { persist } from "zustand/middleware";

export type EnrollmentGender = "MALE" | "FEMALE" | "OTHER";

export interface EnrollmentPersonalInfo {
  firstName: string;
  lastName: string;
  otherNames: string;
  email: string;
  phone: string;
  dateOfBirth: string; // ISO yyyy-mm-dd
  gender: EnrollmentGender | "";
  nationality: string;
  address: string;
}

export interface EnrollmentAcademicInfo {
  departmentId: string;
  programmeId: string;
  level: string;
  sessionId: string;
}

export interface EnrollmentDraft {
  draftId: string;
  createdAt: string; // ISO
  personal: EnrollmentPersonalInfo;
  academic: EnrollmentAcademicInfo;
  acceptedDeclaration: boolean;
}

interface EnrollmentStore {
  draft: EnrollmentDraft;
  setPersonal: (patch: Partial<EnrollmentPersonalInfo>) => void;
  setAcademic: (patch: Partial<EnrollmentAcademicInfo>) => void;
  setAcceptedDeclaration: (value: boolean) => void;
  resetDraft: () => void;
}

function createDraftId(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `ADM-${year}-${rand}`;
}

function createEmptyDraft(): EnrollmentDraft {
  return {
    draftId: createDraftId(),
    createdAt: new Date().toISOString(),
    personal: {
      firstName: "",
      lastName: "",
      otherNames: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      gender: "",
      nationality: "",
      address: "",
    },
    academic: {
      departmentId: "",
      programmeId: "",
      level: "",
      sessionId: "",
    },
    acceptedDeclaration: false,
  };
}

export const useEnrollmentStore = create<EnrollmentStore>()(
  persist(
    (set) => ({
      draft: createEmptyDraft(),

      setPersonal: (patch) =>
        set((state) => ({
          draft: {
            ...state.draft,
            personal: { ...state.draft.personal, ...patch },
          },
        })),

      setAcademic: (patch) =>
        set((state) => ({
          draft: {
            ...state.draft,
            academic: { ...state.draft.academic, ...patch },
          },
        })),

      setAcceptedDeclaration: (value) =>
        set((state) => ({
          draft: { ...state.draft, acceptedDeclaration: value },
        })),

      resetDraft: () => set({ draft: createEmptyDraft() }),
    }),
    {
      name: "enrollment-draft",
      partialize: (state) => ({ draft: state.draft }),
    },
  ),
);
