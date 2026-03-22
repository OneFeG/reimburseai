-- RLS Policies for Companies

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_stats ENABLE ROW LEVEL SECURITY;

/*
-- 1. Employees can view their own company info
CREATE POLICY "Employees can view own company"
ON public.companies
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT company_id FROM public.employees WHERE id = auth.uid()
  )
);

-- 2. Company Admins can update their own company
CREATE POLICY "Admins can update own company"
ON public.companies
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT company_id FROM public.employees WHERE id = auth.uid() AND employee_role = 'sudo'
  )
);

-- 3. Company Stats: Only Admins can view/update
CREATE POLICY "Admins can view company stats"
ON public.company_stats
FOR ALL
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.employees WHERE id = auth.uid() AND employee_role = 'admin'
  )
);
*/