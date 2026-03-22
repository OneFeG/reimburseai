import { supabaseAdmin } from "../index.js";

export const PoliciesService = {
  async getById(id) {
    const { data, error } = await supabaseAdmin
      .from("policies")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  async getByCompanyId(companyId) {
    const { data, error } = await supabaseAdmin
      .from("policies")
      .select("*")
      .eq("company_id", companyId)
      .single();
    if (error) throw error;
    return data;
  },

  async create(policyData) {
    const { data, error } = await supabaseAdmin
      .from("policies")
      .insert(policyData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabaseAdmin
      .from("policies")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabaseAdmin
      .from("policies")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return true;
  },
};
