-- RLS Policies for Audits Table

ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

/*
-- 1. Employees can view their own audits
CREATE POLICY "Employees can view own audits"
ON public.audits
FOR SELECT
TO authenticated
USING (employee_id = auth.uid());

-- 2. Company Admins can view all audits for their company
CREATE POLICY "Admins can view company audits"
ON public.audits
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.employees WHERE id = auth.uid() AND employee_role = 'admin'
  )
);

-- 3. Employees can insert their own audits
CREATE POLICY "Employees can insert own audits"
ON public.audits
FOR INSERT
TO authenticated
WITH CHECK (employee_id = auth.uid());
*/