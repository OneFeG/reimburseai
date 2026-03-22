"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/hooks/authContext";
import {
  companyApi,
  employeeApi,
  policyApi,
  type Company,
  type Employee,
  type Policy,
  type ApiError,
} from "@/lib/api";

export type AccountType = "employee" | "company" | null;

interface ProfileContextType {
  accountType: AccountType;
  isEmployee: boolean;
  isCompany: boolean;
  employee: Employee | null;
  company: Company | null;
  policy: Policy | null;
  loading: boolean;
  errors: ProfileContextErrors;
  refreshProfile: () => Promise<void>;
}
interface ProfileContextErrors {
  employee?: ApiError;
  company?: ApiError;
  policy?: ApiError;
}

const ProfileContext = createContext<ProfileContextType>(
  {} as ProfileContextType,
);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();

  const accountType: AccountType = useMemo(() => {
    const value = user?.displayName;
    if (value === "employee" || value === "company") return value;
    return null;
  }, [user?.displayName]);

  const isEmployee = accountType === "employee";
  const isCompany = accountType === "company";

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errors, setErrors] = useState<ProfileContextErrors>({});

  const isMissingPolicyError = (error?: ApiError) => {
    const message = (error?.message || "").toLowerCase();
    const code = (error?.code || "").toLowerCase();
    return (
      message.includes("cannot coerce the result to a single json object") ||
      message.includes("json object requested") ||
      code.includes("pgrst116")
    );
  };

  /*useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (authLoading) return;
    console.log("[profile] auth", {
      hasUser: !!user,
      uid: user?.uid,
      email: user?.email,
      displayName: user?.displayName,
      accountType,
    });
  }, [accountType, authLoading, user]);*/

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    //console.log("[profile] loading employee profile", { uid: user.uid });
    setLoading(true);
    setErrors({});
    try {
      if (accountType === "employee") {
        const employeeResponse = await employeeApi.getMe();

        /*console.log("[profile] employeeApi.getMe()", {
            success: employeeResponse.success,
            id: employeeResponse.data?.id,
            company_id: employeeResponse.data?.company_id,
            invitedBy: employeeResponse.data?.invitedby,
        });*/

        if (!employeeResponse.success || !employeeResponse.data) {
          setEmployee(null);
          setCompany(null);
          setPolicy(null);
          setErrors({ employee: employeeResponse?.error });
          return;
        }

        const nextEmployee = employeeResponse.data;
        setEmployee(nextEmployee);

        if (!nextEmployee.company_id) {
          setCompany(null);
          setPolicy(null);
          return;
        }

        const [companyResponse, policiesResponse] = await Promise.all([
          companyApi.get(nextEmployee.company_id, true),
          policyApi.list({
            accountType: "employee",
            employeeRole: nextEmployee.employee_role || "employee",
          }),
        ]);

        /*console.log("[profile] companyApi.get(employee)", {
            success: companyResponse.success,
            id: companyResponse.data?.id,
            name: companyResponse.data?.name,
        });*/

        if (!companyResponse.success || !companyResponse.data) {
          setCompany(null);
          setPolicy(null);
          setErrors((prev) => ({ ...prev, company: companyResponse.error }));
        }
        if (!policiesResponse.success || !policiesResponse.data) {
          setPolicy(null);
          if (!isMissingPolicyError(policiesResponse.error)) {
            setErrors((prev) => ({ ...prev, policy: policiesResponse.error }));
          }
        }

        setCompany(
          companyResponse.success ? (companyResponse.data ?? null) : null,
        );
        setPolicy(
          policiesResponse.success ? (policiesResponse.data ?? null) : null,
        );
        return;
      }

      if (accountType === "company") {
        setEmployee(null);

        const [companyResponse, policiesResponse] = await Promise.all([
          companyApi.get(user.uid, false),
          policyApi.list({ accountType: "company" }),
        ]);

        /*console.log("[profile] companyApi.get(company)", {
            success: companyResponse.success,
            id: companyResponse.data?.id,
            name: companyResponse.data?.name,
        });*/

        if (!policiesResponse.success || !policiesResponse.data) {
          setPolicy(null);
          if (!isMissingPolicyError(policiesResponse.error)) {
            setErrors((prev) => ({ ...prev, policy: policiesResponse.error }));
          }
        }
        setPolicy(
          policiesResponse.success ? (policiesResponse.data ?? null) : null,
        );

        if (!companyResponse.success || !companyResponse.data) {
          setCompany(null);
          setPolicy(null);
          setErrors((prev) => ({ ...prev, company: companyResponse.error }));
        }
        setCompany(
          companyResponse.success ? (companyResponse.data ?? null) : null,
        );

        return;
      }

      /*console.log("[profile] unknown accountType", {
          uid: user.uid,
          displayName: user.displayName,
      });*/

      setEmployee(null);
      setCompany(null);
      setPolicy(null);
    } catch (error) {
      console.error("[profile] error loading profile", error);
      setEmployee(null);
      setCompany(null);
      setPolicy(null);
    } finally {
      setLoading(false);
    }
  }, [accountType, user]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setEmployee(null);
      setCompany(null);
      setPolicy(null);
      setLoading(false);
      setErrors({});
      return;
    }

    refreshProfile();
  }, [authLoading, refreshProfile, user]);

  return createElement(
    ProfileContext.Provider,
    {
      value: {
        accountType,
        isEmployee,
        isCompany,
        employee,
        company,
        policy,
        loading,
        errors,
        refreshProfile,
      },
    },
    children,
  );
}

export const useProfile = () => useContext(ProfileContext);
