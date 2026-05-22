const walletSchema = new mongoose.Schema({
    userId : mongoose.Schema.Types.ObjectId,
    balance : {type: Number, default: 100000}
});