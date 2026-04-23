import { useAuth } from "@/context/AuthContext";

export const useSchoolId = () => {
  return useAuth().schoolId;
};
