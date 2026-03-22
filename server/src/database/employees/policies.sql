-- RLS Policies for Employees

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_stats ENABLE ROW LEVEL SECURITY;

/*
-- 1. Employees can view their own profile
CREATE POLICY "Users can view own profile"
ON public.employees
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2. Company Admins can view all employees in their company
CREATE POLICY "Company admins can view employees"
ON public.employees
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.employees WHERE id = auth.uid() AND employee_role = 'admin'
  )
);

-- 3. Stats policies: Users can view own stats
CREATE POLICY "Users can view own stats"
ON public.employee_stats
FOR SELECT
TO authenticated
USING (employee_id = auth.uid());

-- 4. Stats policies: Admins can view other employees' stats in their company
CREATE POLICY "Admins can view company employee stats"
ON public.employee_stats
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.employees AS admin_emp
    JOIN public.employees AS target_emp ON target_emp.company_id = admin_emp.company_id
    WHERE admin_emp.id = auth.uid() 
      AND admin_emp.employee_role = 'admin'
      AND target_emp.id = employee_stats.employee_id
  )
);
*/