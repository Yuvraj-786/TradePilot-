export const validateTrade = (req, res, next) => {
    const { user_id, symbol, quantity } = req.body;

    if (!user_id || !symbol || !quantity) {

        return res.status(400).json({
            success: false,
            message: "Incomplete or null trade fields."
        });
    }

    if (typeof quantity !== 'number' || quantity <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid Quantity."
        });
    }

    if (symbol !== symbol.toUpperCase()) {
        return res.status(400).json({
            success: false,
            message: "Symbol must be uppercase."
        });
    }

    if (/\s/.test(symbol)) {
        return res.status(400).json({
            success: false,
            message: "Symbol must not contain spaces."
        });
    }

    if (symbol.length < 2) {
        return res.status(400).json({
            success: false,
            message: "Symbol must be at least 2 characters long."
        });
    }
    next();
}