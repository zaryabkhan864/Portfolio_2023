import ErrorHandler from '../utils/errorHandler.js';
export default (err, req, res, next) => {
    let error={
        statusCode:err?.statusCode || 500,
        message:err?.message || 'Internal Server Error'
    };
    // Handle Invalid Mongoose ID Error
    if(err.name==='CastError'){
        const message=`Resource not found. Invalid: ${err?.path}`;
        error=new ErrorHandler(message,404);
    }
    // Handle Validation Error
    if(err.name==='ValidatorError'){
        const message=Object.values(err?.errors).map((value)=>value.message)
        error=new ErrorHandler(message,400);
    }

    // Handle Duplicate Key Error
    if(err.code===11000){
        const message=`Duplicate ${Object.keys(err?.keyValue)} entered`;
        error=new ErrorHandler(message,400);
    }
    // Handle Wrong JWT Error
    if(err.name==='JsonWebTokenError'){
        const message='JSON Web Token is invalid. Try Again!!!';
        error=new ErrorHandler(message,400);
    }

    if(process.env.NODE_ENV==='DEVELOPMENT'){
        res.status(error.statusCode).json({
            message:error.message,
            error:err,
            stack:err?.stack
        })
    }
    if(process.env.NODE_ENV==='PRODUCTION'){
        res.status(error.statusCode).json({
            message:error.message
        });
    }
}





// import ErrorHandler from '../utils/errorHandler.js';
// export default (err, req, res, next) => {
//     let error = {
//         statusCode: err.statusCode || 500,
//         message: err?.message || 'Internal Server Error',
//     };
//     // Wrong Mongoose Object ID Error
//     if (err.name === 'CastError') {
//         const message = `Resource not found. Invalid: ${err.path}`;
//         error = new ErrorHandler(message, 404);
//     }
//     // Handling mongoose validation error
//     if (err.name === 'ValidationError') {
//         const message = Object.values(err.errors).map(value => value.message);
//         error = new ErrorHandler(message, 400);
//     }
//     // Handling mongoose duplicate key errors
//     if (err.code === 11000) {
//         const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
//         error = new ErrorHandler(message, 400);
//     }
//     // Handling wrong JWT error
//     if (err.name === 'JsonWebTokenError') {
//         const message = 'JSON Web Token is invalid. Try Again!!!';
//         error = new ErrorHandler(message, 400);
//     }
//     if (process.env.NODE_ENV === 'DEVELOPMENT') {
//         res.status(err.statusCode).json({
//             message: err.message,
//             error: err,
//             stack: err?.stack,
//         });
//     }
//     if (process.env.NODE_ENV === 'PRODUCTION') {
//         res.status(err.statusCode).json({
//             message: err.message,
//         });
//     }


// 