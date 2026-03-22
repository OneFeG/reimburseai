import { supabaseAdmin } from "../index.js";

export const EmployeesService = {
  async getById(id) {
    const { data, error } = await supabaseAdmin
      .from("employees")
      .select("*, employee_stats(*)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(employeeData) {
    // Note: In a real app, you might create the auth user first, then this record.
    const { data, error } = await supabaseAdmin
      .from("employees")
      .insert(employeeData)
      .select()
      .single();
    
    if (error) throw error;

    // Initialize stats
    await EmployeesStatsService.create(data.id, {});

    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabaseAdmin
      .from("employees")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabaseAdmin
      .from("employees")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return true;
  },

  async getByCompany(companyId) {
    const { data, error } = await supabaseAdmin
      .from("employees")
      .select("*")
      .eq("company_id", companyId);
    if (error) throw error;
    return data;
  },

  async getByEmail(email){
    const { data, error } = await supabaseAdmin
      .from("employees")
      .select("*")
      .eq("email", email)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getEmployeesInCompany(companyId) {
    const { data, error } = await supabaseAdmin
      .from("employees")
      .select("*")
      .eq("company_id", companyId);
    if (error) throw error;
    return data;
  }
};

export const EmployeesStatsService = {
  async getById(employee_id) {
    const { data, error } = await supabaseAdmin
      .from("employee_stats")
      .select("*")
      .eq("employee_id", employee_id)
      .single();
    if (error) throw error;
    return data;
  },
  async update(employee_id, updates) {
    const { data, error } = await supabaseAdmin
      .from("employee_stats")
      .update(updates)
      .eq("employee_id", employee_id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async create(employee_id, statsData) {
    const { data, error } = await supabaseAdmin
      .from("employee_stats")
      .insert({ employee_id, ...statsData })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async delete(employee_id) {
    const { error } = await supabaseAdmin
      .from("employee_stats")
      .delete()
      .eq("employee_id", employee_id);
    if (error) throw error;
    return true;
  },
}
