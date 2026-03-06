
const catchAsync = fn => {
    return (req, res, next) => {
        fn(req, res, next).catch(err => {
            next(err); // Pass the error to the next middleware
        });
    }
}
module.exports=catchAsync