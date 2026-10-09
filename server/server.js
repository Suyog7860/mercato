// const express = require('express');
// const mongoose = require('mongoose'); 
// const dns = require('node:dns')
// const cookieParser = require('cookie-parser')
// const fileUpload = require('express-fileupload')
// const helmet = require('helmet')
// require('dotenv').config()

// dns.setServers(['8.8.8.8', '1.1.1.1'])

// const app = express();
// app.disable('x-powered-by')
// app.use(helmet())

// app.post(
//     '/api/payments/razorpay/webhook',
//     express.raw({ type: 'application/json', limit: '1mb' }),
//     require('./controllers/orderCtrl').handleRazorpayWebhook
// )
// app.use(express.json({ limit: '1mb' }));
// app.use(cookieParser());
// app.use(fileUpload({
//     useTempFiles: true,
//     limits: { fileSize: 5 * 1024 * 1024 },
//     abortOnLimit: true,
// }));

// app.use((req, res, next) => {
//     const clientOrigin = process.env.CLIENT_ORIGIN
//     const requestOrigin = req.headers.origin
//     if (clientOrigin && requestOrigin === clientOrigin) {
//         res.setHeader('Access-Control-Allow-Origin', clientOrigin)
//         res.setHeader('Access-Control-Allow-Credentials', 'true')
//         res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
//         res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
//         res.setHeader('Vary', 'Origin')
//         if (req.method === 'OPTIONS') return res.sendStatus(204)
//     }
//     return next()
// })

// const PORT = process.env.PORT || 5000;

// app.get('/', (req, res) => {
//     res.json({ status: 'ok' })
// })

// app.use('/user', require('./routes/useRouter'))
// app.use('/api', require('./routes/categoryRouter'))
// app.use('/api', require('./routes/upload'))
// app.use('/api', require('./routes/productRouter'))
// app.use('/api', require('./routes/orderRouter'))

// app.use('/api', (req, res) => res.status(404).json({ msg: 'API route not found' }))
// app.use((err, _req, res, _next) => {
//     console.error('Unhandled request error:', err.name || 'Error')
//     if (err.type === 'entity.too.large') return res.status(413).json({ msg: 'Request payload is too large' })
//     if (err.name === 'ValidationError') return res.status(422).json({ msg: 'Request validation failed' })
//     if (err.name === 'CastError') return res.status(400).json({ msg: 'Invalid resource identifier' })
//     if (err.code === 11000) return res.status(409).json({ msg: 'A record with those details already exists' })
//     return res.status(500).json({ msg: 'An unexpected server error occurred' })
// })

// async function start() {
//     try {
//         const requiredConfig = ['MONGODB_URL', 'ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET']
//         if (process.env.NODE_ENV === 'production') requiredConfig.push('CLIENT_ORIGIN')
//         const missing = requiredConfig.filter((key) => !process.env[key])
//         if (missing.length) throw new Error(`Missing required configuration: ${missing.join(', ')}`)
//         if (Boolean(process.env.RAZORPAY_KEY_ID) !== Boolean(process.env.RAZORPAY_KEY_SECRET)) {
//             throw new Error('Both Razorpay key ID and key secret must be configured')
//         }
//         if (
//             process.env.NODE_ENV === 'production' &&
//             process.env.RAZORPAY_KEY_ID &&
//             !process.env.RAZORPAY_WEBHOOK_SECRET
//         ) {
//             throw new Error('RAZORPAY_WEBHOOK_SECRET is required when Razorpay is enabled in production')
//         }
//         await mongoose.connect(process.env.MONGODB_URL)
//         const orderCtrl = require('./controllers/orderCtrl')
//         const paymentExpirySweep = setInterval(() => {
//             orderCtrl.expirePendingPayments().catch((err) => {
//                 console.error('Pending payment expiry sweep failed:', err.name)
//             })
//         }, 60 * 1000)
//         paymentExpirySweep.unref()
//         app.listen(PORT, () => {
//             console.log(`Server listening on port ${PORT}`)
//         })
//     } catch (err) {
//         console.error(`Server startup failed: ${err.message.startsWith('Missing required') ? err.message : err.name}`)
//         process.exit(1)
//     }
// }

// start()



const express = require('express');
const mongoose = require('mongoose');
const dns = require('node:dns');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const helmet = require('helmet');
require('dotenv').config();

dns.setServers(['8.8.8.8', '1.1.1.1']);

const app = express();

app.disable('x-powered-by');

app.use(helmet());


// ==========================================
// Razorpay Webhook
// ==========================================

app.post(
    '/api/payments/razorpay/webhook',
    express.raw({
        type: 'application/json',
        limit: '1mb'
    }),
    require('./controllers/orderCtrl').handleRazorpayWebhook
);


// ==========================================
// Body Parsers
// ==========================================

app.use(express.json({ limit: '1mb' }));

app.use(cookieParser());

app.use(
    fileUpload({
        useTempFiles: true,
        limits: {
            fileSize: 5 * 1024 * 1024
        },
        abortOnLimit: true
    })
);


// ==========================================
// CORS
// ==========================================

app.use((req, res, next) => {
    const allowedOrigins = [
        process.env.CLIENT_ORIGIN,
        'https://mercato-weld.vercel.app'
    ].filter(Boolean);

    const requestOrigin = req.headers.origin;

    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
        res.setHeader(
            'Access-Control-Allow-Origin',
            requestOrigin
        );

        res.setHeader(
            'Access-Control-Allow-Credentials',
            'true'
        );

        res.setHeader(
            'Access-Control-Allow-Headers',
            'Content-Type, Authorization'
        );

        res.setHeader(
            'Access-Control-Allow-Methods',
            'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        );

        res.setHeader(
            'Vary',
            'Origin'
        );

        // Handle browser CORS preflight request
        if (req.method === 'OPTIONS') {
            return res.sendStatus(204);
        }
    }

    next();
});


// ==========================================
// PORT
// ==========================================

const PORT = process.env.PORT || 5000;


// ==========================================
// Test Route
// ==========================================

app.get('/', (req, res) => {
    res.json({
        status: 'ok'
    });
});


// ==========================================
// Routes
// ==========================================

app.use(
    '/user',
    require('./routes/useRouter')
);

app.use(
    '/api',
    require('./routes/categoryRouter')
);

app.use(
    '/api',
    require('./routes/upload')
);

app.use(
    '/api',
    require('./routes/productRouter')
);

app.use(
    '/api',
    require('./routes/orderRouter')
);


// ==========================================
// 404 API Handler
// ==========================================

app.use('/api', (req, res) => {
    res.status(404).json({
        msg: 'API route not found'
    });
});


// ==========================================
// Global Error Handler
// ==========================================

app.use((err, _req, res, _next) => {
    console.error(
        'Unhandled request error:',
        err.name || 'Error'
    );

    if (err.type === 'entity.too.large') {
        return res.status(413).json({
            msg: 'Request payload is too large'
        });
    }

    if (err.name === 'ValidationError') {
        return res.status(422).json({
            msg: 'Request validation failed'
        });
    }

    if (err.name === 'CastError') {
        return res.status(400).json({
            msg: 'Invalid resource identifier'
        });
    }

    if (err.code === 11000) {
        return res.status(409).json({
            msg: 'A record with those details already exists'
        });
    }

    return res.status(500).json({
        msg: 'An unexpected server error occurred'
    });
});


// ==========================================
// Start Server
// ==========================================

async function start() {
    try {
        const requiredConfig = [
            'MONGODB_URL',
            'ACCESS_TOKEN_SECRET',
            'REFRESH_TOKEN_SECRET'
        ];

        if (process.env.NODE_ENV === 'production') {
            requiredConfig.push('CLIENT_ORIGIN');
        }

        const missing = requiredConfig.filter(
            (key) => !process.env[key]
        );

        if (missing.length) {
            throw new Error(
                `Missing required configuration: ${missing.join(', ')}`
            );
        }

        // Razorpay configuration check
        if (
            Boolean(process.env.RAZORPAY_KEY_ID) !==
            Boolean(process.env.RAZORPAY_KEY_SECRET)
        ) {
            throw new Error(
                'Both Razorpay key ID and key secret must be configured'
            );
        }

        if (
            process.env.NODE_ENV === 'production' &&
            process.env.RAZORPAY_KEY_ID &&
            !process.env.RAZORPAY_WEBHOOK_SECRET
        ) {
            throw new Error(
                'RAZORPAY_WEBHOOK_SECRET is required when Razorpay is enabled in production'
            );
        }

        // MongoDB connection
        await mongoose.connect(
            process.env.MONGODB_URL
        );

        console.log('MongoDB connected successfully');

        const orderCtrl = require('./controllers/orderCtrl');

        const paymentExpirySweep = setInterval(() => {
            orderCtrl
                .expirePendingPayments()
                .catch((err) => {
                    console.error(
                        'Pending payment expiry sweep failed:',
                        err.name
                    );
                });
        }, 60 * 1000);

        paymentExpirySweep.unref();

        app.listen(PORT, () => {
            console.log(
                `Server listening on port ${PORT}`
            );
        });

    } catch (err) {
        console.error(
            `Server startup failed: ${
                err.message.startsWith('Missing required')
                    ? err.message
                    : err.name
            }`
        );

        process.exit(1);
    }
}

start();