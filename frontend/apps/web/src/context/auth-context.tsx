"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import { api } from "@/lib/api/client";

export interface Employee {
  id: string;
  name: string;
  email: string;
  wallet_address: string;
  role: "admin" | "manager" | "employee";
  is_active: boolean;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  email: string;
  vault_address?: string;
  admin_address?: string;
  created_at: string;
}

export interface CompanyMembership {
  id: string;
  employee_id: string;
  company_id: string;
  company_name: string;
  company_slug: string;
  vault_address?: string;
  role: "admin" | "manager" | "employee";
  status: "active" | "inactive" | "pending";
  is_primary: boolean;
  department?: string;
  wallet_address?: string;
}

export interface User {
  employee: Employee | null;
  company: Company | null;
  memberships: CompanyMembership[];
  activeCompanyId: string | null;
}

interface AuthContextType {
  user: User | null;
  isConnected: boolean;
  isLoading: boolean;
  isDemo: boolean;
  isAdmin: boolean;
  walletAddress: string | null;
  activeCompany: Company | null;
  companies: CompanyMembership[];
  login: (walletAddress: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  enableDemoMode: () => void;
  disableDemoMode: () => void;
  switchCompany: (companyId: string) => Promise<void>;
  addCompany: (companySlug: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Admin wallet address for testing real application
export const ADMIN_WALLET_ADDRESS = "0x74efBD5F7B3cc0787B28a0814fECe6bb7Bb3928f";

// Check if a wallet is the admin wallet
export const isAdminWallet = (address: string | null | undefined): boolean => {
  if (!address) return false;
  return address.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase();
};

// Demo user data for testing
const DEMO_COMPANIES: CompanyMembership[] = [
  {
    id: "demo-membership-001",
    employee_id: "demo-employee-001",
    company_id: "demo-company-001",
    company_name: "Demo Corporation",
    company_slug: "demo-corp",
    vault_address: "0x9D86Af1Fe77969caD642c926CA81447399c1606C",
    role: "admin",
    status: "active",
    is_primary: true,
    department: "Engineering",
  },
  {
    id: "demo-membership-002",
    employee_id: "demo-employee-001",
    company_id: "demo-company-002",
    company_name: "Acme Inc",
    company_slug: "acme-inc",
    vault_address: "0x96047A744Ab8818F5Ee99339b1Aa38A3F3F47527",
    role: "employee",
    status: "active",
    is_primary: false,
    department: "Sales",
  },
];

const DEMO_USER: User = {
  employee: {
    id: "demo-employee-001",
    name: "Demo User",
    email: "demo@reimburseai.app",
    wallet_address: "0x742d35Cc6634C0532925a3b844Bc9e7595f36E4B",
    role: "admin",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  company: {
    id: "demo-company-001",
    name: "Demo Corporation",
    slug: "demo-corp",
    email: "admin@democorp.com",
    vault_address: "0x9D86Af1Fe77969caD642c926CA81447399c1606C",
    admin_address: "0x742d35Cc6634C0532925a3b844Bc9e7595f36E4B",
    created_at: new Date().toISOString(),
  },
  memberships: DEMO_COMPANIES,
  activeCompanyId: "demo-company-001",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const account = useActiveAccount();
  const wallet = useActiveWallet();

  // Check if current wallet is admin
  const isAdmin = isAdminWallet(account?.address);
  
  // Connected if wallet is connected (admin gets special access)
  const isConnected = !!account?.address || isDemo;
  const walletAddress = account?.address || (isDemo ? DEMO_USER.employee?.wallet_address : null) || null;
  
  // Computed properties
  const activeCompany = user?.company || null;
  const companies = user?.memberships || [];

  const fetchUserData = useCallback(async (address: string) => {
    setIsLoading(true);
    try {
      // Try to find employee by wallet address
      const employeeResponse = await api.get<Employee>(
        `/employees/wallet/${address}`
      );

      if (employeeResponse.success && employeeResponse.data) {
        const employee = employeeResponse.data;
        
        // Fetch all company memberships
        const membershipsResponse = await api.get<{
          memberships: CompanyMembership[];
          primary_company_id: string | null;
          total_companies: number;
        }>(`/memberships/employee/${employee.id}/companies`);

        let memberships: CompanyMembership[] = [];
        let activeCompanyId: string | null = null;
        let company: Company | null = null;

        if (membershipsResponse.success && membershipsResponse.data) {
          memberships = membershipsResponse.data.memberships;
          activeCompanyId = membershipsResponse.data.primary_company_id || memberships[0]?.company_id;
          
          // Get full company data for active company
          if (activeCompanyId) {
            const companyResponse = await api.get<Company>(`/companies/${activeCompanyId}`);
            company = companyResponse.success && companyResponse.data ? companyResponse.data : null;
          }
        } else {
          // Fallback to old method if memberships API not available
          const companyResponse = await api.get<Company>(
            `/companies/${(employee as any).company_id}`
          );
          company = companyResponse.success && companyResponse.data ? companyResponse.data : null;
          activeCompanyId = company?.id || null;
        }

        // Set API context
        if (company && employee) {
          api.setContext(company.id, employee.id);
        }

        setUser({
          employee,
          company: company || null,
          memberships,
          activeCompanyId,
        });
      } else {
        // User not found - they need to register
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (address: string) => {
    await fetchUserData(address);
  }, [fetchUserData]);

  const logout = useCallback(() => {
    setUser(null);
    setIsDemo(false);
    api.setContext("", "");
  }, []);

  const refresh = useCallback(async () => {
    if (isDemo) {
      setUser(DEMO_USER);
      return;
    }
    if (account?.address) {
      await fetchUserData(account.address);
    }
  }, [account?.address, fetchUserData, isDemo]);

  const switchCompany = useCallback(async (companyId: string) => {
    if (!user?.employee) return;

    if (isDemo) {
      // Demo mode company switch
      const membership = DEMO_COMPANIES.find(m => m.company_id === companyId);
      if (membership) {
        setUser(prev => ({
          ...prev!,
          company: {
            id: membership.company_id,
            name: membership.company_name,
            slug: membership.company_slug,
            email: `admin@${membership.company_slug}.com`,
            vault_address: membership.vault_address,
            created_at: new Date().toISOString(),
          },
          activeCompanyId: companyId,
        }));
      }
      return;
    }

    try {
      const response = await api.post<{
        success: boolean;
        membership: CompanyMembership;
        message: string;
      }>("/memberships/switch", {
        company_id: companyId,
        set_as_primary: false,
      });

      if (response.success && response.data) {
        const membership = response.data.membership;
        
        // Fetch full company data
        const companyResponse = await api.get<Company>(`/companies/${companyId}`);
        const company = companyResponse.success && companyResponse.data ? companyResponse.data : null;

        // Update API context
        if (company) {
          api.setContext(company.id, user.employee.id);
        }

        setUser(prev => prev ? {
          ...prev,
          company: company,
          activeCompanyId: companyId,
        } : null);
      }
    } catch (error) {
      console.error("Failed to switch company:", error);
    }
  }, [user?.employee, isDemo]);

  const addCompany = useCallback(async (companySlug: string): Promise<boolean> => {
    if (!user?.employee || isDemo) return false;

    try {
      const response = await api.post<CompanyMembership>("/memberships/join", {
        company_slug: companySlug,
      });

      if (response.success && response.data) {
        // Refresh to get updated memberships
        await refresh();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to add company:", error);
      return false;
    }
  }, [user?.employee, isDemo, refresh]);

  const enableDemoMode = useCallback(() => {
    setIsDemo(true);
    setUser(DEMO_USER);
    api.setContext(DEMO_USER.company!.id, DEMO_USER.employee!.id);
    setIsLoading(false);
  }, []);

  const disableDemoMode = useCallback(() => {
    setIsDemo(false);
    setUser(null);
    api.setContext("", "");
  }, []);

  // Auto-login when wallet connects
  useEffect(() => {
    if (account?.address && !isDemo) {
      fetchUserData(account.address);
    } else if (!account && !isDemo) {
      setUser(null);
      setIsLoading(false);
    }
  }, [account?.address, fetchUserData, isDemo]);

  // Handle wallet disconnect
  useEffect(() => {
    if (!wallet && !isDemo) {
      setUser(null);
      setIsLoading(false);
    }
  }, [wallet, isDemo]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isConnected,
        isLoading,
        isDemo,
        isAdmin,
        walletAddress,
        activeCompany,
        companies,
        login,
        logout,
        refresh,
        enableDemoMode,
        disableDemoMode,
        switchCompany,
        addCompany,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
