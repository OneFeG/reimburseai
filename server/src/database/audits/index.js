import { supabaseAdmin } from "../index.js";

export const AuditsService = {
  async getById(id) {
    const { data, error } = await supabaseAdmin
      .from("audits")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(auditData) {
    const { data, error } = await supabaseAdmin
      .from("audits")
      .insert(auditData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateStatus(id, status, updates = {}) {
    const { data, error } = await supabaseAdmin
      .from("audits")
      .update({ status, ...updates, updated_at: new Date() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getByEmployee(employeeId) {
    const { data, error } = await supabaseAdmin
      .from("audits")
      .select("*")
      .eq("employee_id", employeeId);
    if (error) throw error;
    return data;
  },

  async getByCompany(companyId) {
    const { data, error } = await supabaseAdmin
      .from("audits")
      .select("*")
      .eq("company_id", companyId);
    if (error) throw error;
    return data;
  },
};
