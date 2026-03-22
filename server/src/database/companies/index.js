import { supabaseAdmin } from "../index.js";

export const CompaniesService = {
  async getById(id) {
    const { data, error } = await supabaseAdmin
      .from("companies")
      .select("*, company_stats(*)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(companyData) {
    const { data, error } = await supabaseAdmin
      .from("companies")
      .insert(companyData)
      .select()
      .single();
    
    if (error) throw error;

    // Initialize stats
    await CompaniesStatsService.create(data.id, {});

    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabaseAdmin
      .from("companies")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabaseAdmin
      .from("companies")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return true;
  },
};

export const CompaniesStatsService = {
  async getById(company_id) {
    const { data, error } = await supabaseAdmin
      .from("company_stats")
      .select("*")
      .eq("company_id", company_id)
      .single();
    if (error) throw error;
    return data;
  },
  async update(company_id, updates) {
    const { data, error } = await supabaseAdmin
      .from("company_stats")
      .update(updates)
      .eq("company_id", company_id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async create(company_id, statsData) {
    const { data, error } = await supabaseAdmin
      .from("company_stats")
      .insert({ company_id, ...statsData })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async delete(company_id) {
    const { error } = await supabaseAdmin
      .from("company_stats")
      .delete()
      .eq("company_id", company_id);
    if (error) throw error;
    return true;
  },
}
