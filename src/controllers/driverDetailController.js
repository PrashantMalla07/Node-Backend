import { getDriverDetails } from '../models/driverDetailModel.js';

export const fetchDriverDetails = async (req, res) => {
    try {
        const drivers = await getDriverDetails();
        res.status(200).json(drivers);
    } catch (error) {
        console.error('Error fetching driver details:', error);
        res.status(500).json({ 
            message: 'Error fetching driver details', 
            error: error.message 
        });
    }
};
