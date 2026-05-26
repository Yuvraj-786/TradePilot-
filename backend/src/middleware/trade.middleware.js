export const validateTrade = (req, res, next) => {
    const user_id = req.user?.id || req.body.user_id;
    const symbol = req.body.symbol?.toUpperCase();
    const quantity = Number(req.body.quantity);

    if (!user_id || !symbol || !Number.isFinite(quantity)) {
        return res.status(400).json({
            success: false,
            message: "Incomplete or null trade fields."
        });
    }

    if (quantity <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid Quantity."
        });
    }

    if (req.body.symbol !== symbol) {
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

    req.body.user_id = user_id;
    req.body.symbol = symbol;
    req.body.quantity = quantity;
    next();
}