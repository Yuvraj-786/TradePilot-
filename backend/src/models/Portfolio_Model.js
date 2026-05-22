const portfolioSchema = new mongoose.Schema({
    userId : mongoose.Schema.Types.ObjectId,
    stock: String,
    quantity: Number,
    avgPrice: Number
});