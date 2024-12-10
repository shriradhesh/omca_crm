const permissionModel = require('../model/permissionModel')


const add_endPoints = async (req, res) => {
    try {
        const { endpoints } = req.body; 

        // Define the roles and their permissions
        const roles = ['Admin', 'Receptionist' , 'Manager'];

        for (const role of roles) {
            const permissions = {};

            // Add or update permission for each endpoint (1)
            endpoints.forEach(endpoint => {
                permissions[endpoint] = permissions[endpoint] || 1;
            });

            // Insert or update the permission
            const existingPermission = await permissionModel.findOne({ role });

            if (!existingPermission) {
                // If no existing permission found, create new
                await permissionModel.create({ role, permissions });
            } else {
                // If permission exists, update it
                await permissionModel.updateOne(
                    { role },
                    { $set: { permissions } }
                );
            }
        }

        res.status(200).json({
            success: true,
            message: 'endPoints added successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to add/update permissions',
            error: error.message,
        });
    }
};

// Api for update permission

const updatePermission = async (req, res) => {
    try {
        const { role, endpoint, allow } = req.body;

        // Check if permission record exists for the role
        const permissionRecord = await permissionModel.findOne({ role });

        if (!permissionRecord) {
            return res.status(400).json({
                success: false,
                message: `Role ${role} does not exist in permissions.`,
            });
        }

        // Check if the endpoint exists for this role
        if (!permissionRecord.permissions.has(endpoint)) {
            return res.status(400).json({
                success: false,
                message: `Endpoint ${endpoint} not found for ${role} role.`,
            });
        }

        // Update the permission for the endpoint
        permissionRecord.permissions.set(endpoint, allow);

        // Save the updated permission record
        await permissionRecord.save();

        res.status(200).json({
            success: true,
            message: `Permission updated for ${role} on ${endpoint}`,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update permission',
            error: error.message,
        });
    }
};




module.exports = { add_endPoints , updatePermission }