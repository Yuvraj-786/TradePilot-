const tradeSchema = new mongoose.Schema({
    userId : mongoose.Schema.Types.ObjectId,
    stock: String,
    type: String,
    quantity: Number,
    price: Number,
    data: {type: Date, default: Date.now}
});