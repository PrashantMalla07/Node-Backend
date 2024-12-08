import db from '../config/db.mjs';


export const getDriverDetails = () => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                CONCAT(first_name, " ", last_name) AS name, 
                phone_number, 
                driver_photo 
            FROM drivers
        `;
        db.query(query, (err, results) => {
            if (err) reject(err);
            resolve(results);
        });
    });
};
