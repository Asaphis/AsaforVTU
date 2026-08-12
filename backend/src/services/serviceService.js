const pool = require('../config/database');

// Create service
const createService = async (serviceData) => {
  try {
    const { name, slug, icon, category, description, is_active = true, sort_order = 0, metadata = {} } = serviceData;

    const result = await pool.query(
      `INSERT INTO services (name, slug, icon, category, description, is_active, sort_order, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, slug.toLowerCase(), icon, category, description, is_active, sort_order, JSON.stringify(metadata)]
    );

    return result.rows[0];
  } catch (error) {
    console.error('[Service Service] Error creating service:', error);
    throw error;
  }
};

// Get all services
const getAllServices = async (activeOnly = true) => {
  try {
    let query = 'SELECT * FROM services';
    const params = [];

    if (activeOnly) {
      query += ' WHERE is_active = true';
    }

    query += ' ORDER BY sort_order ASC, name ASC';

    const result = await pool.query(query, params);

    return result.rows;
  } catch (error) {
    console.error('[Service Service] Error getting services:', error);
    throw error;
  }
};

// Get service by ID
const getServiceById = async (serviceId) => {
  try {
    const result = await pool.query(
      'SELECT * FROM services WHERE id = $1',
      [serviceId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('[Service Service] Error getting service:', error);
    throw error;
  }
};

// Get service by slug
const getServiceBySlug = async (slug) => {
  try {
    const result = await pool.query(
      'SELECT * FROM services WHERE slug = $1',
      [slug.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('[Service Service] Error getting service by slug:', error);
    throw error;
  }
};

// Update service
const updateService = async (serviceId, updates) => {
  try {
    const allowedFields = ['name', 'slug', 'icon', 'category', 'description', 'is_active', 'sort_order', 'metadata'];
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (field === 'metadata') {
          updateFields.push(`${field} = $${paramIndex}::jsonb`);
          updateValues.push(JSON.stringify(updates[field]));
        } else if (field === 'slug') {
          updateFields.push(`${field} = $${paramIndex}`);
          updateValues.push(updates[field].toLowerCase());
        } else {
          updateFields.push(`${field} = $${paramIndex}`);
          updateValues.push(updates[field]);
        }
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(serviceId);

    const query = `
      UPDATE services 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, updateValues);

    if (result.rows.length === 0) {
      throw new Error('Service not found');
    }

    return result.rows[0];
  } catch (error) {
    console.error('[Service Service] Error updating service:', error);
    throw error;
  }
};

// Delete service
const deleteService = async (serviceId) => {
  try {
    const result = await pool.query(
      'DELETE FROM services WHERE id = $1 RETURNING *',
      [serviceId]
    );

    if (result.rows.length === 0) {
      throw new Error('Service not found');
    }

    return result.rows[0];
  } catch (error) {
    console.error('[Service Service] Error deleting service:', error);
    throw error;
  }
};

// Create service plan
const createServicePlan = async (planData) => {
  try {
    const {
      service_id,
      network,
      network_key,
      name,
      type,
      sub_type,
      price_user,
      price_api,
      is_active = true,
      metadata = {}
    } = planData;

    const result = await pool.query(
      `INSERT INTO service_plans (service_id, network, network_key, name, type, sub_type, price_user, price_api, is_active, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [service_id, network, network_key.toLowerCase(), name, type, sub_type, price_user, price_api, is_active, JSON.stringify(metadata)]
    );

    return result.rows[0];
  } catch (error) {
    console.error('[Service Service] Error creating service plan:', error);
    throw error;
  }
};

// Get service plans
const getServicePlans = async (filters = {}) => {
  try {
    let query = `
      SELECT sp.*, s.name as service_name, s.category as service_category, s.slug as service_slug
      FROM service_plans sp
      JOIN services s ON sp.service_id = s.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (filters.service_id) {
      query += ` AND sp.service_id = $${paramIndex}`;
      params.push(filters.service_id);
      paramIndex++;
    }

    if (filters.type) {
      query += ` AND sp.type = $${paramIndex}`;
      params.push(filters.type);
      paramIndex++;
    }

    if (filters.network) {
      query += ` AND (sp.network = $${paramIndex} OR sp.network_key = $${paramIndex})`;
      params.push(filters.network);
      paramIndex++;
    }

    if (filters.active_only !== false) {
      query += ` AND sp.is_active = true`;
    }

    query += ' ORDER BY sp.network ASC, sp.name ASC';

    const result = await pool.query(query, params);

    return result.rows;
  } catch (error) {
    console.error('[Service Service] Error getting service plans:', error);
    throw error;
  }
};

// Get service plan by ID
const getServicePlanById = async (planId) => {
  try {
    const result = await pool.query(
      `SELECT sp.*, s.name as service_name, s.category as service_category, s.slug as service_slug
       FROM service_plans sp
       JOIN services s ON sp.service_id = s.id
       WHERE sp.id = $1`,
      [planId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('[Service Service] Error getting service plan:', error);
    throw error;
  }
};

// Update service plan
const updateServicePlan = async (planId, updates) => {
  try {
    const allowedFields = ['network', 'network_key', 'name', 'type', 'sub_type', 'price_user', 'price_api', 'is_active', 'metadata'];
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (field === 'metadata') {
          updateFields.push(`${field} = $${paramIndex}::jsonb`);
          updateValues.push(JSON.stringify(updates[field]));
        } else if (field === 'network_key') {
          updateFields.push(`${field} = $${paramIndex}`);
          updateValues.push(updates[field].toLowerCase());
        } else {
          updateFields.push(`${field} = $${paramIndex}`);
          updateValues.push(updates[field]);
        }
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(planId);

    const query = `
      UPDATE service_plans 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, updateValues);

    if (result.rows.length === 0) {
      throw new Error('Service plan not found');
    }

    return result.rows[0];
  } catch (error) {
    console.error('[Service Service] Error updating service plan:', error);
    throw error;
  }
};

// Delete service plan
const deleteServicePlan = async (planId) => {
  try {
    const result = await pool.query(
      'DELETE FROM service_plans WHERE id = $1 RETURNING *',
      [planId]
    );

    if (result.rows.length === 0) {
      throw new Error('Service plan not found');
    }

    return result.rows[0];
  } catch (error) {
    console.error('[Service Service] Error deleting service plan:', error);
    throw error;
  }
};

module.exports = {
  createService,
  getAllServices,
  getServiceById,
  getServiceBySlug,
  updateService,
  deleteService,
  createServicePlan,
  getServicePlans,
  getServicePlanById,
  updateServicePlan,
  deleteServicePlan
};
