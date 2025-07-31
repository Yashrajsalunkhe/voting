import mongoose from 'mongoose';
// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aisa_voting';
class Database {
    static instance;
    isConnected = false;
    constructor() { }
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
    async connect() {
        if (this.isConnected) {
            return;
        }
        try {
            await mongoose.connect(MONGODB_URI);
            this.isConnected = true;
            console.log('Connected to MongoDB');
        }
        catch (error) {
            console.error('MongoDB connection error:', error);
            throw error;
        }
    }
    async disconnect() {
        if (!this.isConnected) {
            return;
        }
        try {
            await mongoose.disconnect();
            this.isConnected = false;
            console.log('Disconnected from MongoDB');
        }
        catch (error) {
            console.error('MongoDB disconnection error:', error);
            throw error;
        }
    }
    isConnectionReady() {
        return this.isConnected && mongoose.connection.readyState === 1;
    }
}
export const database = Database.getInstance();
// Export the connection for direct use if needed
export { mongoose };
export default database;
//# sourceMappingURL=db.js.map