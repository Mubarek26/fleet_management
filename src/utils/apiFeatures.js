
// const Tour = require('../models/toursmodel'); // Import the Tour model
class APIFeatures {
    constructor(query, queryString) {
        this.query = query; // The Mongoose query object
        this.queryString = queryString; // The query string from the request
    }
    filter() {
        const queryObj = { ...this.queryString }; // Create a shallow copy of req.query
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(el => delete queryObj[el]); // Remove excluded fields

        let queryString = JSON.stringify(queryObj);
        queryString = queryString.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`); // Replace operators with MongoDB syntax
        this.query = this.query.find(JSON.parse(queryString)); // Apply the filter to the query
        return this; // Return the instance for method chaining
    }
    sort() {
        if (this.queryString.sort) {
            
            //  query = this.queryString.sort(this.query.sort); // Convert sort query
            const sortBy = this.queryString.sort.split(',').join(' '); // Convert sort query to space-separated string
            this.query = this.query.sort(sortBy); // Apply sorting
             // Return the instance for method chaining
        }
        else {
            this.query = this.query.sort('-createdAt'); // Default sorting by createdAt in descending order
        }
        return this;
    }
     limitFields() {
        
            if (this.queryString.fields) {
                const fields = this.queryString.fields.split(',').join(' '); // Convert fields query to space-separated string
                this.query = this.query.select(fields); // Select specific fields
            }
            else {
                this.query = this.query.select('-__v'); // Exclude the __v field by default
            }  
            return this;
        

    }
     paginate() {
        
            const page = this.queryString.page * 1 || 1; // Convert page to a number, default to 1
            const limit = this.queryString.limit * 1 || 27; // Convert limit to a number, default to 10
            const skip = (page - 1) * limit; // Calculate the number of documents
            this.query = this.query.skip(skip).limit(limit); // Skip the first 10 documents and limit to 10 documents per page
            
            return this; // Return the instance for method chaining
    }
   
}
module.exports = APIFeatures; // Export the APIFeatures class for use in other modules