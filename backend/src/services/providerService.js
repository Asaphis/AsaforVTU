const axios = require('axios');
const { db } = require('../config/firebase');

class ProviderService {
  constructor() {
    this.baseUrl = process.env.VTU_PROVIDER_URL || 'https://iacafe.com.ng/devapi/v1';
    this.apiKey = process.env.VTU_PROVIDER_API_KEY ? process.env.VTU_PROVIDER_API_KEY.trim() : '';
  }

  _getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Asafor-VTU/1.0'
    };
  }

  /**
   * Helper to map network to Provider ID dynamically
   * Fetches from DB settings/global -> networkMappings
   */
  async _resolveNetworkId(network) {
    let netInput = network;
    if (typeof network === 'object' && network !== null) {
      netInput = network.value || network.id || network.name || network.label || JSON.stringify(network);
    }
    const netKey = String(netInput).toLowerCase();

    // 1. Try fetching from DB
    try {
      const doc = await db.doc('settings/global').get();
      if (doc.exists) {
        const data = doc.data();
        const mappings = data.networkMappings || {};
        
        // Check exact match or contained match
        // Mappings format: { "mtn": "1", "glo": "2", "airtel": "4", "9mobile": "3" }
        for (const [key, value] of Object.entries(mappings)) {
          if (netKey.includes(key.toLowerCase()) || netKey === String(value)) {
            return value;
          }
        }
      }
    } catch (e) {
      console.error('[Provider] Error fetching network mappings:', e);
    }

    // 2. Fallback to passed value if it looks like an ID (digits)
    if (/^\d+$/.test(netKey)) {
      return netKey;
    }

    // 3. Last Resort Defaults (Legacy Hardcoded - kept for safety until Admin configures DB)
    // MTN=1, Glo=2, 9mobile=3, Airtel=4
    if (netKey.includes('mtn')) return 1;
    if (netKey.includes('glo')) return 2;
    if (netKey.includes('airtel')) return 4;
    if (netKey.includes('9mobile') || netKey.includes('etisalat')) return 3;

    return netInput; 
  }

  // Deprecated synchronous helper - kept for reference but should not be used
  _mapNetworkToServiceId(network) {
    return this._mapNetworkToId(network);
  }

  // Deprecated synchronous helper
  _mapNetworkToId(network) {
    let netInput = network;
    if (typeof network === 'object' && network !== null) {
      netInput = network.value || network.id || network.name || network.label || JSON.stringify(network);
    }
    const net = String(netInput).toLowerCase();
    
    if (net.includes('mtn') || net === '1' || net === '01') return 1;
    if (net.includes('glo') || net === '2' || net === '02') return 2;
    if (net.includes('airtel') || net === '3' || net === '03') return 4;
    if (net.includes('9mobile') || net.includes('etisalat') || net === '4' || net === '04') return 3;
    
    return 1; // Default
  }

  /**
   * Purchase Airtime
   * Endpoint: POST /airtime
   */
  async purchaseAirtime(requestId, phone, amount, network) {
    if (!this.apiKey) {
      return { success: false, message: 'Provider API Key missing', apiResponse: null };
    }

    // Resolve Network ID dynamically
    const serviceId = await this._resolveNetworkId(network);
    // For Airtime, IACafe uses "mtn", "glo", etc. OR IDs? 
    // Docs say: "mtn", "airtel", "glo", "9mobile" for Airtime endpoint usually, 
    // BUT budget-data uses IDs. 
    // Let's assume resolveNetworkId returns IDs (1, 2..) or Strings ("mtn"..) depending on config.
    // If the provider specifically needs "mtn" string for Airtime but "1" for Data, we might need separate mappings.
    // However, looking at original code:
    // _mapNetworkToServiceId returns 'mtn', 'glo'...
    // _mapNetworkToId returns 1, 2...
    
    // We need to handle this distinction.
    // Let's check the endpoint docs or previous code.
    // previous _mapNetworkToServiceId returned 'mtn' etc.
    // previous _mapNetworkToId returned 1, 2 etc.
    
    // We should probably convert the ID back to name for Airtime if needed, or maintain two mappings.
    // Or simpler: The DB mapping should support both or we handle the conversion.
    
    // Let's refine _resolveNetworkId to return the ID (1, 2, 3, 4).
    // And for Airtime, we map ID back to Name if required?
    // IACafe Airtime usually accepts network_id or service_id.
    // Original code used `service_id: serviceId` where serviceId was 'mtn', 'glo'.
    
    let finalServiceId = serviceId;
    if (String(serviceId) === '1') finalServiceId = 'mtn';
    if (String(serviceId) === '2') finalServiceId = 'glo';
    if (String(serviceId) === '4') finalServiceId = 'airtel';
    if (String(serviceId) === '3') finalServiceId = '9mobile';

    try {
      const payload = {
        request_id: requestId,
        phone: phone,
        service_id: finalServiceId,
        amount: Number(amount)
      };

      console.log(`[Provider] Buying Airtime: ${finalServiceId} ${amount} for ${phone} (ReqID: ${requestId})`);

      const response = await axios.post(`${this.baseUrl}/airtime`, payload, {
        headers: this._getHeaders(),
        timeout: 30000 // 30s timeout
      });

      // IA Café Success Response:
      // { "code": "success", "message": "...", "data": { "status": "completed-api"|"processing-api", ... } }
      const data = response.data;
      
      if (data.code === 'success' || data.success === true) {
        const txData = data.data || {};
        const isSuccessful = txData.status === 'completed-api' || txData.status === 'processing-api';
        
        return {
          success: isSuccessful,
          transactionId: txData.order_id || requestId,
          message: data.message || 'Transaction Successful',
          apiResponse: data,
          status: txData.status // Return specific status for further handling if needed
        };
      } else {
        console.error('[Provider] Airtime API Returned Failure:', data);
        return {
          success: false,
          message: data.message || data.error?.message || 'Transaction Failed',
          apiResponse: data
        };
      }

    } catch (error) {
      const errData = error.response?.data || {};
      console.error('[Provider] Airtime Error:', errData);
      
      return {
        success: false,
        message: errData.error?.message || errData.message || error.message || 'Provider request failed',
        apiResponse: errData
      };
    }
  }

  /**
   * Purchase Data
   * Endpoint: POST /budget-data
   * Note: Requires `data_plan` (Plan ID) and `network_id`
   */
  async purchaseData(requestId, phone, planId, network) {
    if (!this.apiKey) {
      return { success: false, message: 'Provider API Key missing', apiResponse: null };
    }

    // Use integer ID for budget-data (Resolved dynamically)
    const networkId = await this._resolveNetworkId(network);

    try {
      const payload = {
        request_id: requestId,
        phone: phone,
        network_id: networkId,
        data_plan: Number(planId) // variation_id maps to data_plan
      };

      console.log(`[Provider] Buying Data (Budget): Net:${networkId} Plan:${planId} for ${phone} (ReqID: ${requestId})`);

      const response = await axios.post(`${this.baseUrl}/budget-data`, payload, {
        headers: this._getHeaders(),
        timeout: 30000
      });

      const data = response.data;

      if (data.code === 'success' || data.success === true) {
        const txData = data.data || {};
        const isSuccessful = txData.status === 'completed-api' || txData.status === 'processing-api';

        return {
          success: isSuccessful,
          transactionId: txData.order_id || requestId,
          message: data.message || 'Transaction Successful',
          apiResponse: data,
          status: txData.status
        };
      } else {
        console.error('[Provider] Data API Returned Failure:', data);
        return {
          success: false,
          message: data.message || data.error?.message || 'Transaction Failed',
          apiResponse: data
        };
      }

    } catch (error) {
      const errData = error.response?.data || {};
      console.error('[Provider] Data Error:', errData);
      return {
        success: false,
        message: errData.error?.message || errData.message || error.message || 'Provider request failed',
        apiResponse: errData
      };
    }
  }

  /**
   * Verify Customer (Electricity/TV)
   * Endpoint: POST /verify-customer
   */
  async verifyCustomer(customerId, serviceId, variationId = null) {
    try {
      const payloadObj = {
        customer_id: customerId,
        service_id: serviceId
      };
      // Electricity requires variation_id (prepaid/postpaid)
      if (variationId) {
        payloadObj.variation_id = variationId;
      }
      
      const payload = new URLSearchParams(payloadObj);

      const response = await axios.post(`${this.baseUrl}/verify-customer`, payload, {
        headers: this._getHeaders()
      });

      const data = response.data;
      if (data.code === 'success' || data.success === true) {
        return {
          success: true,
          data: data.data // { customer_name, customer_address, ... }
        };
      } else {
        return { success: false, message: data.message || data.error?.message };
      }
    } catch (error) {
      const errData = error.response?.data || {};
      return { success: false, message: errData.error?.message || error.message };
    }
  }

  /**
   * Purchase Electricity
   * Endpoint: POST /electricity
   */
  async purchaseElectricity(requestId, customerId, serviceId, variationId, amount) {
     try {
      const payload = new URLSearchParams({
        request_id: requestId,
        customer_id: customerId,
        service_id: serviceId, // e.g. "ikeja-electric"
        variation_id: variationId, // "prepaid" or "postpaid"
        amount: String(amount)
      });

      const response = await axios.post(`${this.baseUrl}/electricity`, payload, {
        headers: this._getHeaders()
      });

      const data = response.data;
      if (data.code === 'success' || data.success === true) {
         const txData = data.data || {};
         return {
            success: true,
            transactionId: txData.order_id,
            token: txData.token, // For prepaid
            message: data.message,
            apiResponse: data
         };
      } else {
        return { success: false, message: data.message || data.error?.message, apiResponse: data };
      }
    } catch (error) {
       const errData = error.response?.data || {};
       return { 
         success: false, 
         message: errData.error?.message || error.message, 
         apiResponse: errData 
       };
    }
  }

  /**
   * Purchase Cable TV
   * Endpoint: POST /cable
   */
  async purchaseCableTV(requestId, customerId, serviceId, variationId, amount = null) {
    try {
      const payloadObj = {
        request_id: requestId,
        customer_id: customerId,
        service_id: serviceId, // e.g. "dstv"
        variation_id: variationId // Plan ID e.g. "2701"
      };
      if (amount) payloadObj.amount = Number(amount); // Optional, auto-fetched if null

      const payload = payloadObj;

      const response = await axios.post(`${this.baseUrl}/cable`, payload, {
        headers: this._getHeaders()
      });

      const data = response.data;
      if (data.code === 'success' || data.success === true) {
         const txData = data.data || {};
         return {
            success: true,
            transactionId: txData.order_id,
            message: data.message,
            apiResponse: data
         };
      } else {
        return { success: false, message: data.message || data.error?.message, apiResponse: data };
      }
    } catch (error) {
       const errData = error.response?.data || {};
       return { 
         success: false, 
         message: errData.error?.message || error.message, 
         apiResponse: errData 
       };
    }
  }

}

module.exports = new ProviderService();

