import mongoose from 'mongoose';
import dotenv from "dotenv";
dotenv.config();


const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.DATABASE_URL;
    
    if (!mongoUri) {
      throw new Error('DATABASE_URL environment variable is not defined');
    }

    const conn = await mongoose.connect(mongoUri);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

export default connectDB;
