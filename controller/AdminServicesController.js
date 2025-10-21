const User = require('../model/UserSchemas');

// Get all services (orders) with pagination and filtering
const getAllServices = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      buyerType, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object - ensure we only get users with orders
    let filter = {
      orders: { $exists: true, $ne: [] } // Only users who have orders
    };
    
    // Filter by status
    if (status && status !== 'all') {
      filter['orders.status'] = status;
    }

    // Filter by buyer type (jobseeker or employer)
    if (buyerType && buyerType !== 'all') {
      filter.userType = buyerType;
    }

    // Search filter
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    if (sortBy === 'createdAt') {
      sort['orders.createdAt'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'amount') {
      sort['orders.amount'] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = sortOrder === 'desc' ? -1 : 1;
    }

    // Get users with orders
    const users = await User.find(filter)
      .select('fullName companyName email userType orders createdAt')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Flatten orders and add user info
    let allServices = [];
    users.forEach(user => {
      if (user.orders && user.orders.length > 0) {
        user.orders.forEach(order => {
          // Map order data properly for RM Service and other services
          const serviceName = order.serviceName || order.service || 'RM Service';
          const serviceType = order.serviceType || 'Relationship Management';
          const orderDate = order.createdAt || order.orderDate || new Date();
          const status = order.status || 'active';
          const amount = order.amount || order.price || 0;
          const description = order.description || `${serviceName} - Premium service order`;

          allServices.push({
            _id: order._id,
            id: order._id.toString(),
            buyerName: user.fullName || user.companyName || 'Unknown',
            buyerType: user.userType || 'jobseeker',
            serviceName: serviceName,
            serviceType: serviceType,
            orderDate: orderDate,
            status: status,
            amount: amount,
            description: description,
            orderUrl: `/admin/services/${order._id}`,
            userEmail: user.email,
            userId: user._id
          });
        });
      }
    });

    // Apply additional filters to flattened data
    if (status && status !== 'all') {
      allServices = allServices.filter(service => service.status === status);
    }

    if (buyerType && buyerType !== 'all') {
      allServices = allServices.filter(service => service.buyerType === buyerType);
    }

    if (search) {
      allServices = allServices.filter(service => 
        service.buyerName.toLowerCase().includes(search.toLowerCase()) ||
        service.serviceName.toLowerCase().includes(search.toLowerCase()) ||
        service.userEmail.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sort the filtered results
    allServices.sort((a, b) => {
      const dateA = new Date(a.orderDate);
      const dateB = new Date(b.orderDate);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    // Get total count
    const totalServices = allServices.length;
    const totalPages = Math.ceil(totalServices / limitNum);

    // Paginate the results
    const paginatedServices = allServices.slice(0, limitNum);

    res.json({
      success: true,
      data: paginatedServices,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalServices,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching services',
      error: error.message
    });
  }
};

// Update service status
const updateServiceStatus = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    // Find user with the specific order
    const user = await User.findOne({ 'orders._id': serviceId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Update the specific order status
    const orderIndex = user.orders.findIndex(order => order._id.toString() === serviceId);
    
    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update the order status
    user.orders[orderIndex].status = status;
    user.orders[orderIndex].updatedAt = new Date();

    await user.save();

    res.json({
      success: true,
      message: 'Service status updated successfully',
      data: {
        serviceId,
        status,
        updatedAt: user.orders[orderIndex].updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating service status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating service status',
      error: error.message
    });
  }
};

module.exports = {
  getAllServices,
  updateServiceStatus
};
