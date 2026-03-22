-- RLS Policies for Policies Table

ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

/*
-- 1. Employees can view policies of their company
CREATE POLICY "Employees can view company policies"
ON public.policies
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.employees WHERE id = auth.uid()
  )
);

-- 2. Company Admins can manage policies
CREATE POLICY "Admins can manage policies"
ON public.policies
FOR ALL
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.employees WHERE id = auth.uid() AND employee_role = 'admin'
  )
);
*/