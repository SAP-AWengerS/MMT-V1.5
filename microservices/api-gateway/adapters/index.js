/**
 * Response Adapters for Frontend Compatibility
 *
 * These adapters transform microservice responses into the format
 * expected by the frontend (original backend format)
 */

/**
 * Fuel Expenses Adapter
 * Transforms finance service expense response to backend format
 */
const adaptFuelExpensesResponse = (microserviceResponse, query) => {
  // If microservice returns expenses array directly
  if (Array.isArray(microserviceResponse)) {
    const totalExpense = microserviceResponse.reduce((sum, expense) => sum + (expense.cost || 0), 0);

    const expenses = microserviceResponse.map((expense, index) => ({
      _id: expense._id || expense.id,
      truckId: expense.truckId,
      addedBy: expense.userId || expense.addedBy,
      date: formatDate(expense.date),
      currentKM: expense.currentKM,
      litres: expense.litres,
      cost: expense.cost || expense.amount,
      note: expense.note || expense.description,
      registrationNo: expense.registrationNo,
      range: expense.range || 0,
      mileage: expense.mileage || 0,
      key: index
    }));

    return {
      expenses,
      totalExpense
    };
  }

  // If microservice already returns in correct format
  if (microserviceResponse.expenses && microserviceResponse.totalExpense !== undefined) {
    return microserviceResponse;
  }

  // Fallback
  return {
    expenses: [],
    totalExpense: 0
  };
};

/**
 * DEF Expenses Adapter
 * Similar to fuel expenses
 */
const adaptDefExpensesResponse = (microserviceResponse, query) => {
  return adaptFuelExpensesResponse(microserviceResponse, query);
};

/**
 * Other Expenses Adapter
 */
const adaptOtherExpensesResponse = (microserviceResponse, query) => {
  if (Array.isArray(microserviceResponse)) {
    const totalExpense = microserviceResponse.reduce((sum, expense) => sum + (expense.cost || 0), 0);

    const expenses = microserviceResponse.map((expense, index) => ({
      _id: expense._id || expense.id,
      truckId: expense.truckId,
      addedBy: expense.userId || expense.addedBy,
      date: formatDate(expense.date),
      category: expense.category,
      cost: expense.cost || expense.amount,
      note: expense.note || expense.description,
      registrationNo: expense.registrationNo,
      key: index
    }));

    return {
      expenses,
      totalExpense
    };
  }

  if (microserviceResponse.expenses && microserviceResponse.totalExpense !== undefined) {
    return microserviceResponse;
  }

  return {
    expenses: [],
    totalExpense: 0
  };
};

/**
 * Loan Calculations Adapter
 */
const adaptLoanCalculationsResponse = (microserviceResponse, query) => {
  if (Array.isArray(microserviceResponse)) {
    const totalCalculation = microserviceResponse.reduce((sum, calc) => sum + (calc.cost || 0), 0);

    const calculations = microserviceResponse.map((calc, index) => ({
      _id: calc._id || calc.id,
      truckId: calc.truckId,
      addedBy: calc.userId || calc.addedBy,
      date: formatDate(calc.date),
      cost: calc.cost || calc.amount,
      additionalCharges: calc.additionalCharges || 0,
      note: calc.note || calc.description,
      registrationNo: calc.registrationNo,
      key: index
    }));

    return {
      calculations,
      totalCalculation
    };
  }

  if (microserviceResponse.calculations && microserviceResponse.totalCalculation !== undefined) {
    return microserviceResponse;
  }

  return {
    calculations: [],
    totalCalculation: 0
  };
};

/**
 * Total Expenses Adapter
 * Aggregates all expense types
 */
const adaptTotalExpensesResponse = (microserviceResponse, query) => {
  if (Array.isArray(microserviceResponse)) {
    const totalExpense = microserviceResponse.reduce((sum, expense) => sum + (expense.cost || 0), 0);

    const expenses = microserviceResponse.map((expense, index) => ({
      _id: expense._id || expense.id,
      truckId: expense.truckId,
      date: formatDate(expense.date),
      registrationNo: expense.registrationNo || 'Unknown',
      catalog: expense.catalog || expense.type || 'Other Expense',
      currentKM: expense.currentKM,
      litres: expense.litres,
      category: expense.category,
      cost: expense.cost || expense.amount,
      additionalCharges: expense.additionalCharges,
      note: expense.note || expense.description,
      key: index
    }));

    return {
      expenses,
      totalExpense
    };
  }

  if (microserviceResponse.expenses && microserviceResponse.totalExpense !== undefined) {
    return microserviceResponse;
  }

  return {
    expenses: [],
    totalExpense: 0
  };
};

/**
 * Trucks Adapter
 * Transforms fleet service truck response to backend format
 */
const adaptTrucksResponse = (microserviceResponse) => {
  if (Array.isArray(microserviceResponse)) {
    return microserviceResponse.map(truck => ({
      _id: truck._id || truck.id,
      addedBy: truck.userId || truck.addedBy,
      registrationNo: truck.registrationNo || truck.truckNumber,
      make: truck.make,
      model: truck.model,
      year: truck.year,
      isFinanced: truck.isFinanced,
      financeAmount: truck.financeAmount,
      imgURL: truck.imgURL || truck.images || [],
      chassisNo: truck.chassisNo,
      engineNo: truck.engineNo,
      desc: truck.desc || truck.description,
      createdAt: truck.createdAt
    }));
  }

  if (microserviceResponse.data) {
    return { data: adaptTrucksResponse(microserviceResponse.data) };
  }

  return microserviceResponse;
};

/**
 * Single Truck Adapter
 */
const adaptSingleTruckResponse = (microserviceResponse) => {
  if (!microserviceResponse) return null;

  return {
    _id: microserviceResponse._id || microserviceResponse.id,
    addedBy: microserviceResponse.userId || microserviceResponse.addedBy,
    registrationNo: microserviceResponse.registrationNo || microserviceResponse.truckNumber,
    make: microserviceResponse.make,
    model: microserviceResponse.model,
    year: microserviceResponse.year,
    isFinanced: microserviceResponse.isFinanced,
    financeAmount: microserviceResponse.financeAmount,
    imgURL: microserviceResponse.imgURL || microserviceResponse.images || [],
    chassisNo: microserviceResponse.chassisNo,
    engineNo: microserviceResponse.engineNo,
    desc: microserviceResponse.desc || microserviceResponse.description,
    createdAt: microserviceResponse.createdAt
  };
};

/**
 * Auth whoami Adapter
 * Transforms auth service validate-token response to backend whoami format
 */
const adaptWhoamiResponse = (microserviceResponse) => {
  // If already in correct format
  if (microserviceResponse.message && microserviceResponse.user) {
    return microserviceResponse;
  }

  // Transform from microservice format
  if (microserviceResponse.valid && microserviceResponse.user) {
    return {
      message: "User verified",
      user: {
        userId: microserviceResponse.user.id || microserviceResponse.user.userId,
        email: microserviceResponse.user.email,
        name: microserviceResponse.user.name,
        isSubscribed: microserviceResponse.user.isSubscribed || false,
        isAdmin: microserviceResponse.user.role === 'admin' || microserviceResponse.user.isAdmin || false
      }
    };
  }

  return microserviceResponse;
};

/**
 * Driver Profiles Adapter
 * Fleet-service already returns in exact backend format {success, message, data}
 * So just pass through the response as-is
 */
const adaptDriverProfilesResponse = (microserviceResponse) => {
  // Fleet-service returns: {success: true, message: "...", data: [...]}
  // This is EXACTLY the backend format, so no transformation needed
  return microserviceResponse;
};

/**
 * Alerts Adapter
 * Transform notification-service response to exact backend format
 */
const adaptAlertsResponse = (microserviceResponse) => {
  // If notification-service returns {success, count, alerts}
  if (microserviceResponse.success && microserviceResponse.alerts) {
    return {
      success: true,
      message: `Found ${microserviceResponse.alerts.length} alerts`,
      data: microserviceResponse.alerts,
      ...(microserviceResponse.pagination && { pagination: microserviceResponse.pagination }),
      ...(microserviceResponse.statistics && { statistics: microserviceResponse.statistics })
    };
  }

  // If notification-service returns {success, alert} (single)
  if (microserviceResponse.success && microserviceResponse.alert) {
    return {
      success: true,
      message: microserviceResponse.message || 'Alert found',
      data: microserviceResponse.alert
    };
  }

  // If already in correct format {success, message, data}
  if (microserviceResponse.success && microserviceResponse.data) {
    return microserviceResponse;
  }

  // Fallback
  return microserviceResponse;
};

/**
 * Helper: Format date to DD-MM-YYYY
 */
const formatDate = (date) => {
  if (!date) return '';

  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
};

module.exports = {
  adaptFuelExpensesResponse,
  adaptDefExpensesResponse,
  adaptOtherExpensesResponse,
  adaptLoanCalculationsResponse,
  adaptTotalExpensesResponse,
  adaptTrucksResponse,
  adaptSingleTruckResponse,
  adaptWhoamiResponse,
  adaptDriverProfilesResponse,
  adaptAlertsResponse
};
