const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY || 'yoursecretkey';

const verifyJwtToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if( !authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({ message:'No Token Provided!'});
    }
    try{
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    }
    catch(err){
        res.status(401).json({ message:'Invalid Token Provided' });
    }
};

//role check
const checkRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access Denied: Insufficient Permissions' });
        }
        next();
    };
};


module.exports ={verifyJwtToken, checkRole};